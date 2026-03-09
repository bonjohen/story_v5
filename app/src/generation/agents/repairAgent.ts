/**
 * RepairAgent: LLM-backed scene repair.
 * Takes a failing scene draft, validation failures, and contract constraints,
 * and produces a revised scene that addresses the failures.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  SceneValidation,
} from '../artifacts/types.ts'

/**
 * Repair a scene draft using the LLM.
 * Returns revised scene text.
 */
export async function repairScene(
  originalContent: string,
  validation: SceneValidation,
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  strategy: 'targeted_edit' | 'full_rewrite',
  llm: LLMAdapter,
): Promise<string> {
  const messages = buildRepairPrompt(
    originalContent,
    validation,
    scene,
    beat,
    contract,
    strategy,
  )
  const response = await llm.complete(messages)
  return stripPreamble(response.content)
}

/**
 * Strip LLM preamble like "Here is the revised scene:" from the output.
 */
function stripPreamble(text: string): string {
  // Remove common LLM preamble lines
  return text.replace(/^(?:Here(?:'s| is) (?:the )?(?:revised|rewritten|updated|new) (?:scene|version|text)[:\.]?\s*\n*)/i, '').trim()
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildRepairPrompt(
  originalContent: string,
  validation: SceneValidation,
  scene: Scene,
  _beat: Beat,
  contract: StoryContract,
  strategy: 'targeted_edit' | 'full_rewrite',
): LLMMessage[] {
  const failingChecks = validation.checks.filter((c) => c.status === 'fail')
  const warningChecks = validation.checks.filter((c) => c.status === 'warn')

  const failureDirectives = failingChecks.map((check) => {
    const details = check.details.join('; ')
    switch (check.type) {
      case 'hard_constraints':
        return `MUST FIX — Hard constraint failures: ${details}`
      case 'anti_patterns':
        return `MUST FIX — Anti-pattern detected: ${details}. Remove or rewrite the offending sections.`
      case 'tone':
        return `MUST FIX — Tone violation: ${details}. Adjust prose to match the expected tone.`
      case 'entry_exit':
        return `MUST FIX — Entry/exit condition failure: ${details}.`
      case 'signals_in_text':
        return `SHOULD FIX — Missing signals: ${details}.`
      default:
        return `Fix: ${details}`
    }
  })

  const warningDirectives = warningChecks.map((check) => {
    return `OPTIONAL — ${check.type}: ${check.details.join('; ')}`
  })

  const strategyInstruction = strategy === 'full_rewrite'
    ? 'FULLY REWRITE the scene from scratch, keeping the same scene goal and characters.'
    : 'Make TARGETED EDITS to the existing scene. Preserve as much of the original text as possible while fixing the issues.'

  return [
    {
      role: 'system',
      content: [
        `You are a fiction editor revising a scene for a ${contract.genre.name} story.`,
        `Tone: ${contract.genre.tone_marker.join(', ')}`,
        '',
        `Strategy: ${strategyInstruction}`,
        '',
        'IMPORTANT:',
        '- Output ONLY the revised narrative prose.',
        '- Do NOT write "Here is the revised scene" or any preamble.',
        '- Do NOT echo constraint names, beat labels, or scene goals in the prose.',
        '- Start directly with the story text.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Scene goal: ${scene.scene_goal}`,
        '',
        '--- ORIGINAL SCENE ---',
        originalContent.slice(0, 4000),
        '',
        '--- PROBLEMS TO FIX ---',
        ...failureDirectives,
        '',
        ...(warningDirectives.length > 0
          ? ['--- OPTIONAL IMPROVEMENTS ---', ...warningDirectives, '']
          : []),
        'Revise the scene. Output only the prose.',
      ].join('\n'),
    },
  ]
}
