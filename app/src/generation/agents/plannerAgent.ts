/**
 * PlannerAgent: prompt templates and response validation for LLM-enhanced planning.
 * Used by the planner to generate beat summaries and scene goals.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type { Beat, Scene, StoryContract, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

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
    // Extract the readable part of the anti-pattern ID (e.g., "TECH_MAGIC" → "tech magic")
    const readable = antiPattern.replace(/^[A-Z]+_N\d+_/, '').replace(/_/g, ' ').toLowerCase()
    if (readable.length > 3 && lower.includes(readable)) {
      return fallback
    }
  }

  // Reject responses that violate must_nots
  for (const mustNot of contract.global_boundaries.must_nots) {
    const mustNotLower = mustNot.toLowerCase()
    // Only check user exclusions (not the anti-pattern descriptions which are longer)
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
// High-level enhance function
// ---------------------------------------------------------------------------

/**
 * Enhance beats and scenes with LLM-generated summaries and goals.
 * Falls back to deterministic summaries on validation failure.
 */
export async function enhancePlanWithLLM(
  beats: Beat[],
  scenes: Scene[],
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<void> {
  // Enhance beat summaries
  for (const beat of beats) {
    const phase = contract.phase_guidelines.find(
      (p) => p.node_id === beat.archetype_node_id,
    )
    if (!phase) continue

    const fallback = beat.summary
    const messages = buildBeatSummaryPrompt(phase, contract)
    const response = await llm.complete(messages)
    beat.summary = validateSummary(response.content, contract, fallback)
  }

  // Enhance scene goals
  for (const scene of scenes) {
    const beat = beats.find((b) => b.beat_id === scene.beat_id)
    if (!beat) continue

    const fallback = scene.scene_goal
    const messages = buildSceneGoalPrompt(scene, beat, contract)
    const response = await llm.complete(messages)
    scene.scene_goal = validateSummary(response.content, contract, fallback)
  }
}
