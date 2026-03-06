/**
 * EditorialAgent: prompt templates for chapter-level editorial smoothing.
 * Takes stitched scene text and produces polished chapter markdown.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type { ChapterEntry, StyleDirectives } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildEditorialPrompt(
  chapterEntry: ChapterEntry,
  rawChapterText: string,
  styleDirectives: StyleDirectives,
): LLMMessage[] {
  const voiceNote = styleDirectives.global_voice ?? 'third-person past tense'
  const pacingNote = styleDirectives.global_pacing ?? 'balanced'
  const recapPolicy = chapterEntry.editorial_constraints?.recap_policy ?? 'none'

  return [
    {
      role: 'system',
      content: `You are an editorial agent polishing a chapter draft. Your job is to smooth transitions between scenes, ensure consistent voice and tense, and apply the specified editorial constraints. You must NOT change the story's structure, plot events, or character actions. Only polish prose, fix transitions, and ensure consistency.

Rules:
- Preserve all scene content and plot events exactly
- Smooth transitions between scenes (add brief bridging sentences where needed)
- Ensure consistent ${voiceNote} throughout
- Apply ${pacingNote} pacing
- Recap policy: ${recapPolicy}
- Preserve any metadata footers (lines starting with "<!-- " or "[TRACE:")
- Output the complete polished chapter as markdown`,
    },
    {
      role: 'user',
      content: [
        `Chapter: ${chapterEntry.title}`,
        chapterEntry.tone_goals ? `Tone goal: ${chapterEntry.tone_goals}` : '',
        chapterEntry.pace_directive ? `Pace: ${chapterEntry.pace_directive}` : '',
        '',
        'Raw chapter text to polish:',
        '',
        rawChapterText,
      ].filter(Boolean).join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Agent function
// ---------------------------------------------------------------------------

export async function runEditorialAgent(
  llm: LLMAdapter,
  chapterEntry: ChapterEntry,
  rawChapterText: string,
  styleDirectives: StyleDirectives,
): Promise<string> {
  const messages = buildEditorialPrompt(chapterEntry, rawChapterText, styleDirectives)
  const response = await llm.complete(messages)
  return response.content
}
