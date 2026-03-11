/**
 * BeatExpansionAgent: LLM agent that enriches deterministic beat expansions
 * with story-specific micro-goals.
 *
 * Takes a deterministic SceneBeatExpansion (types + sequence) and asks the LLM
 * to write specific micro-goals for each beat point that advance the scene goal
 * while respecting the beat type.
 *
 * Falls back to deterministic micro-goals on LLM failure.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  Scene,
  Beat,
  StoryContract,
  StoryPlan,
  SceneBeatExpansion,
  SceneBeatPoint,
  ElementRoster,
  RosterEntry,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Max tokens for beat expansion calls. */
export const BEAT_EXPANSION_MAX_TOKENS = 1024

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the LLM prompt for enriching beat expansion micro-goals.
 */
export function buildBeatExpansionPrompt(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  expansion: SceneBeatExpansion,
  plan?: StoryPlan | null,
): LLMMessage[] {
  const roster = plan?.element_roster
  const charContext = buildCharacterContext(scene, roster)
  const settingContext = buildSettingContext(scene, roster)

  // Build the beat structure for the LLM to fill in
  const beatList = expansion.beat_points.map((bp) =>
    `  ${bp.beat_point_id} (${bp.type}, ${bp.weight}): characters=[${bp.characters_active.join(', ')}]`
  ).join('\n')

  const hardConstraints = scene.constraints_checklist.hard.join(', ') || 'none'
  const mustNots = scene.constraints_checklist.must_not.join(', ') || 'none'

  return [
    {
      role: 'system',
      content: [
        `You are a story planner expanding a scene into dramatic beat points for a ${contract.genre.name} story using the ${contract.archetype.name} archetype.`,
        '',
        'For each beat point listed below, write a specific 1-2 sentence micro-goal that describes what must happen in that beat. The micro-goal should:',
        '- Advance the overall scene goal',
        '- Be appropriate for the beat type (setup, escalation, turning_point, dialogue, action, reaction, revelation, resolution)',
        '- Reference specific characters by name where relevant',
        '- Be concrete and actionable, not vague',
        '',
        'Output ONLY valid JSON: an array of objects with "beat_point_id" and "micro_goal" fields.',
        'Example: [{"beat_point_id":"S01_BP01","micro_goal":"..."},{"beat_point_id":"S01_BP02","micro_goal":"..."}]',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Scene: ${scene.scene_id}`,
        `Scene goal: ${scene.scene_goal}`,
        `Beat: ${beat.summary}`,
        '',
        settingContext ? `Setting: ${settingContext}` : '',
        charContext ? `Characters:\n${charContext}` : '',
        '',
        `Genre constraints (hard): ${hardConstraints}`,
        mustNots !== 'none' ? `Must avoid: ${mustNots}` : '',
        beat.required_exit_conditions.length > 0
          ? `Exit conditions: ${beat.required_exit_conditions.join('; ')}`
          : '',
        '',
        'Beat points to expand:',
        beatList,
      ].filter(Boolean).join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Enhancement function
// ---------------------------------------------------------------------------

/**
 * Enhance a deterministic beat expansion with LLM-generated micro-goals.
 * Falls back to the deterministic micro-goals if LLM fails or returns invalid output.
 */
export async function enhanceBeatExpansion(
  llm: LLMAdapter,
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  expansion: SceneBeatExpansion,
  plan?: StoryPlan | null,
): Promise<SceneBeatExpansion> {
  const messages = buildBeatExpansionPrompt(scene, beat, contract, expansion, plan)

  try {
    const response = await llm.complete(messages, { maxTokens: BEAT_EXPANSION_MAX_TOKENS })
    const enhanced = parseBeatExpansionResponse(response.content, expansion)
    return enhanced
  } catch {
    // LLM failure — return deterministic expansion unchanged
    return expansion
  }
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

interface BeatExpansionResponseItem {
  beat_point_id: string
  micro_goal: string
  notes?: string
}

/**
 * Parse the LLM response and merge micro-goals into the expansion.
 * Preserves deterministic values for any beat points not found in the response.
 */
export function parseBeatExpansionResponse(
  responseText: string,
  expansion: SceneBeatExpansion,
): SceneBeatExpansion {
  const items = extractJsonArray(responseText)
  if (!items || items.length === 0) return expansion

  // Build lookup from response
  const microGoalMap = new Map<string, { micro_goal: string; notes?: string }>()
  for (const item of items) {
    if (item.beat_point_id && item.micro_goal) {
      microGoalMap.set(item.beat_point_id, {
        micro_goal: item.micro_goal,
        notes: item.notes,
      })
    }
  }

  // Merge into expansion — keep deterministic values for missing items
  const enhancedBeatPoints: SceneBeatPoint[] = expansion.beat_points.map((bp) => {
    const override = microGoalMap.get(bp.beat_point_id)
    if (override) {
      return {
        ...bp,
        micro_goal: override.micro_goal,
        notes: override.notes ?? bp.notes,
      }
    }
    return bp
  })

  return {
    ...expansion,
    beat_points: enhancedBeatPoints,
  }
}

/**
 * Extract a JSON array from LLM response text.
 * Handles responses with markdown code fences, leading text, etc.
 */
function extractJsonArray(text: string): BeatExpansionResponseItem[] | null {
  // Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?\s*\n?/g, '').replace(/```\s*$/g, '').trim()

  // Find the array — look for the outermost [ ... ]
  const startIdx = cleaned.indexOf('[')
  const endIdx = cleaned.lastIndexOf(']')
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null

  cleaned = cleaned.slice(startIdx, endIdx + 1)

  try {
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return null
    return parsed as BeatExpansionResponseItem[]
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

function buildCharacterContext(scene: Scene, roster?: ElementRoster | null): string | null {
  if (!roster) return null
  const entries = scene.characters
    .map((id) => roster.characters.find((c) => c.id === id))
    .filter(Boolean) as RosterEntry[]
  if (entries.length === 0) return null
  return entries.map((e) => {
    const parts = [`  - ${e.name} (${e.role_or_type})`]
    if (e.traits?.length) parts.push(`traits: ${e.traits.join(', ')}`)
    if (e.motivations?.length) parts.push(`motivations: ${e.motivations.join(', ')}`)
    return parts.join(' — ')
  }).join('\n')
}

function buildSettingContext(scene: Scene, roster?: ElementRoster | null): string | null {
  if (!roster || !scene.setting) return null
  const place = roster.places.find((p) => p.id === scene.setting)
  if (!place) return scene.setting
  return `${place.name} (${place.role_or_type})${place.description ? ' — ' + place.description : ''}`
}
