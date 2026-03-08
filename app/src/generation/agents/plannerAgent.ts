/**
 * PlannerAgent: prompt templates and response validation for LLM-enhanced planning.
 * Uses batched calls — one for all beat summaries, one for all scene goals —
 * instead of individual LLM calls per beat/scene.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type { Beat, Scene, StoryContract, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builders (batched)
// ---------------------------------------------------------------------------

export function buildBatchedBeatSummaryPrompt(
  phases: { beatId: string; phase: PhaseGuideline }[],
  contract: StoryContract,
): LLMMessage[] {
  const phaseList = phases
    .map((p) => `- BEAT_ID=${p.beatId}: ${p.phase.role} — ${p.phase.definition}. Genre obligations: ${p.phase.genre_obligation_links.join(', ') || 'none'}`)
    .join('\n')

  return [
    {
      role: 'system',
      content: `You are a story planner creating beat summaries for a ${contract.genre.name} story using the ${contract.archetype.name} archetype. For each beat listed, generate a one-sentence summary that captures its emotional and narrative essence. Be vivid and specific to the genre.

Respond with EXACTLY one line per beat in this format:
BEAT_ID=xxx: Your one-sentence summary here`,
    },
    {
      role: 'user',
      content: [
        `Genre: ${contract.genre.name}`,
        `Must avoid: ${contract.global_boundaries.must_nots.slice(0, 3).join('; ') || 'none'}`,
        '',
        'Beats:',
        phaseList,
      ].join('\n'),
    },
  ]
}

export function buildBatchedSceneGoalPrompt(
  sceneSpecs: { sceneId: string; beatSummary: string; hardConstraints: string; mustNot: string }[],
  contract: StoryContract,
): LLMMessage[] {
  const sceneList = sceneSpecs
    .map((s) => `- SCENE_ID=${s.sceneId}: Beat="${s.beatSummary}". Hard: ${s.hardConstraints}. Must not: ${s.mustNot}`)
    .join('\n')

  return [
    {
      role: 'system',
      content: `You are a story planner designing scenes for a ${contract.genre.name} story. For each scene listed, generate a specific, actionable one-sentence goal that advances the narrative.

Respond with EXACTLY one line per scene in this format:
SCENE_ID=xxx: Your one-sentence goal here`,
    },
    {
      role: 'user',
      content: [
        'Scenes:',
        sceneList,
      ].join('\n'),
    },
  ]
}

// Keep single-beat/scene builders for backwards compatibility in tests
export function buildBeatSummaryPrompt(
  phase: PhaseGuideline,
  contract: StoryContract,
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are a story planner creating a beat outline for a ${contract.genre.name} story using the ${contract.archetype.name} archetype. Generate a one-sentence beat summary that captures the emotional and narrative essence of this story phase. The summary should be vivid and specific to the genre, not generic.`,
    },
    {
      role: 'user',
      content: [
        `Archetype phase: ${phase.role} — ${phase.definition}`,
        `Genre: ${contract.genre.name}`,
        `Genre obligations for this phase: ${phase.genre_obligation_links.join(', ') || 'none'}`,
        `Entry conditions: ${phase.entry_conditions.join('; ') || 'none'}`,
        `Exit conditions: ${phase.exit_conditions.join('; ') || 'none'}`,
        `Must avoid: ${contract.global_boundaries.must_nots.slice(0, 3).join('; ') || 'none'}`,
        '',
        'Write a single-sentence beat summary.',
      ].join('\n'),
    },
  ]
}

export function buildSceneGoalPrompt(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
): LLMMessage[] {
  return [
    {
      role: 'system',
      content: `You are a story planner designing scenes for a ${contract.genre.name} story. Generate a specific, actionable scene goal that advances the narrative and satisfies the listed constraints. The goal should describe what must happen in this scene.`,
    },
    {
      role: 'user',
      content: [
        `Beat: ${beat.summary}`,
        `Archetype node: ${beat.archetype_node_id}`,
        `Hard constraints to satisfy: ${scene.constraints_checklist.hard.join(', ') || 'none'}`,
        `Soft constraints (desirable): ${scene.constraints_checklist.soft.join(', ') || 'none'}`,
        `Must avoid: ${scene.constraints_checklist.must_not.slice(0, 3).join(', ') || 'none'}`,
        '',
        'Write a specific scene goal in one sentence.',
      ].join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Response validation
// ---------------------------------------------------------------------------

/**
 * Validate that an LLM-generated summary doesn't violate contract boundaries.
 * Returns the validated text, or the fallback if validation fails.
 */
export function validateSummary(
  llmText: string,
  contract: StoryContract,
  fallback: string,
): string {
  const text = llmText.trim()

  // Reject empty responses
  if (!text) return fallback

  // Reject responses that mention anti-patterns by name
  const lower = text.toLowerCase()
  for (const antiPattern of contract.genre.anti_patterns) {
    const readable = antiPattern.replace(/^[A-Z]+_N\d+_/, '').replace(/_/g, ' ').toLowerCase()
    if (readable.length > 3 && lower.includes(readable)) {
      return fallback
    }
  }

  // Reject responses that violate must_nots
  for (const mustNot of contract.global_boundaries.must_nots) {
    const mustNotLower = mustNot.toLowerCase()
    if (mustNotLower.startsWith('user exclusion:')) {
      const excluded = mustNotLower.replace('user exclusion:', '').trim()
      if (excluded.length > 3 && lower.includes(excluded)) {
        return fallback
      }
    }
  }

  return text
}

// ---------------------------------------------------------------------------
// Batched response parser
// ---------------------------------------------------------------------------

function parseBatchedResponse(
  response: string,
  idPrefix: 'BEAT_ID' | 'SCENE_ID',
): Map<string, string> {
  const results = new Map<string, string>()
  const lines = response.trim().split('\n')
  const pattern = new RegExp(`${idPrefix}=([^:]+):\\s*(.+)`)

  for (const line of lines) {
    const match = line.match(pattern)
    if (match) {
      results.set(match[1].trim(), match[2].trim())
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// High-level enhance function (batched)
// ---------------------------------------------------------------------------

/**
 * Enhance beats and scenes with LLM-generated summaries and goals.
 * Uses 2 LLM calls total (one for all beats, one for all scenes)
 * instead of N+M individual calls.
 */
export async function enhancePlanWithLLM(
  beats: Beat[],
  scenes: Scene[],
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<void> {
  // Batch all beat summaries into one call
  const beatPhases: { beatId: string; phase: PhaseGuideline }[] = []
  for (const beat of beats) {
    const phase = contract.phase_guidelines.find(
      (p) => p.node_id === beat.archetype_node_id,
    )
    if (phase) {
      beatPhases.push({ beatId: beat.beat_id, phase })
    }
  }

  if (beatPhases.length > 0) {
    const messages = buildBatchedBeatSummaryPrompt(beatPhases, contract)
    const response = await llm.complete(messages)
    const summaries = parseBatchedResponse(response.content, 'BEAT_ID')

    for (const beat of beats) {
      const llmSummary = summaries.get(beat.beat_id)
      if (llmSummary) {
        beat.summary = validateSummary(llmSummary, contract, beat.summary)
      }
    }
  }

  // Batch all scene goals into one call
  const sceneSpecs = scenes
    .map((scene) => {
      const beat = beats.find((b) => b.beat_id === scene.beat_id)
      if (!beat) return null
      return {
        sceneId: scene.scene_id,
        beatSummary: beat.summary,
        hardConstraints: scene.constraints_checklist.hard.join(', ') || 'none',
        mustNot: scene.constraints_checklist.must_not.slice(0, 3).join(', ') || 'none',
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)

  if (sceneSpecs.length > 0) {
    const messages = buildBatchedSceneGoalPrompt(sceneSpecs, contract)
    const response = await llm.complete(messages)
    const goals = parseBatchedResponse(response.content, 'SCENE_ID')

    for (const scene of scenes) {
      const llmGoal = goals.get(scene.scene_id)
      if (llmGoal) {
        scene.scene_goal = validateSummary(llmGoal, contract, scene.scene_goal)
      }
    }
  }
}
