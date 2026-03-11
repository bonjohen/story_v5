/**
 * PlannerAgent: prompt templates and response validation for LLM-enhanced planning.
 * Processes one beat at a time with rich context (characters, places, objects,
 * genre obligations) to produce focused, data-informed summaries.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type { Beat, Scene, StoryContract, PhaseGuideline, ElementRoster, RosterEntry } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

/** Format a roster entry as a compact context line. */
function formatRosterEntry(entry: RosterEntry): string {
  const parts = [`${entry.name} (${entry.role_or_type})`]
  if (entry.traits?.length) parts.push(`traits: ${entry.traits.join(', ')}`)
  if (entry.motivations?.length) parts.push(`motivations: ${entry.motivations.join(', ')}`)
  if (entry.description) parts.push(entry.description)
  return parts.join(' — ')
}

/** Collect element IDs from a set of scenes. */
function collectElementIds(
  scenes: Scene[],
  roster: ElementRoster,
): { charIds: Set<string>; placeIds: Set<string>; objectIds: Set<string> } {
  const charIds = new Set<string>()
  const placeIds = new Set<string>()
  const objectIds = new Set<string>()
  const allEntries = [...roster.characters, ...roster.places, ...roster.objects]

  for (const scene of scenes) {
    for (const el of scene.scene_elements ?? []) {
      const entry = allEntries.find((r) => r.id === el.id)
      if (entry) {
        if (entry.category === 'character') charIds.add(entry.id)
        else if (entry.category === 'place') placeIds.add(entry.id)
        else objectIds.add(entry.id)
      }
    }
    for (const cid of scene.characters) charIds.add(cid)
    if (scene.setting) placeIds.add(scene.setting)
    for (const oid of scene.objects ?? []) objectIds.add(oid)
  }

  return { charIds, placeIds, objectIds }
}

/**
 * Gather roster entries with a first-order connection to this beat.
 * Only returns elements directly assigned to this beat's scenes —
 * no accumulated "established" elements from all prior beats.
 * This keeps prompts focused and avoids sending the full roster to the LLM.
 */
function gatherBeatContext(
  beatIndex: number,
  beats: Beat[],
  scenes: Scene[],
  roster: ElementRoster,
): { activeCharacters: string[]; activePlaces: string[]; activeObjects: string[];
     establishedCharacters: string[]; establishedPlaces: string[]; establishedObjects: string[] } {
  const byId = new Map(
    [...roster.characters, ...roster.places, ...roster.objects].map((e) => [e.id, e]),
  )
  const currentBeat = beats[beatIndex]

  // Only elements directly assigned to this beat's scenes (first-order connections)
  const currentScenes = scenes.filter((s) => s.beat_id === currentBeat.beat_id)
  const active = collectElementIds(currentScenes, roster)

  const fmt = (ids: string[]) => ids.map((id) => byId.get(id)).filter(Boolean).map((e) => formatRosterEntry(e!))

  return {
    activeCharacters: fmt([...active.charIds]),
    activePlaces: fmt([...active.placeIds]),
    activeObjects: fmt([...active.objectIds]),
    // No established elements — only first-order connections to this beat
    establishedCharacters: [],
    establishedPlaces: [],
    establishedObjects: [],
  }
}

// ---------------------------------------------------------------------------
// Per-beat prompt builder
// ---------------------------------------------------------------------------

type BeatContext = ReturnType<typeof gatherBeatContext>

export function buildSingleBeatPrompt(
  beat: Beat,
  phase: PhaseGuideline,
  contract: StoryContract,
  context: BeatContext,
): LLMMessage[] {
  const contextLines: string[] = []

  // Only first-order elements — directly assigned to this beat's scenes
  if (context.activeCharacters.length > 0) {
    contextLines.push('Characters:')
    for (const c of context.activeCharacters) contextLines.push(`  - ${c}`)
  }
  if (context.activePlaces.length > 0) {
    contextLines.push('Settings:')
    for (const p of context.activePlaces) contextLines.push(`  - ${p}`)
  }
  if (context.activeObjects.length > 0) {
    contextLines.push('Objects:')
    for (const o of context.activeObjects) contextLines.push(`  - ${o}`)
  }

  const genreObligations = phase.genre_obligation_links.join(', ') || 'none'
  const exitConditions = phase.exit_conditions.join('; ') || 'none'

  return [
    {
      role: 'system',
      content: `Story planner for a ${contract.genre.name} ${contract.archetype.name} story. Write ONE sentence as: BEAT_ID=${beat.beat_id}: [summary]`,
    },
    {
      role: 'user',
      content: [
        `Beat: ${beat.beat_id} — ${phase.role}: ${phase.definition}`,
        `Genre obligations: ${genreObligations}`,
        `Exit conditions: ${exitConditions}`,
        ...(contextLines.length > 0 ? ['', ...contextLines] : []),
        '',
        `BEAT_ID=${beat.beat_id}:`,
      ].join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Per-scene prompt builder
// ---------------------------------------------------------------------------

export function buildSingleScenePrompt(
  scene: Scene,
  beat: Beat,
  _beatIndex: number,
  _beats: Beat[],
  _allScenes: Scene[],
  contract: StoryContract,
  roster: ElementRoster,
): LLMMessage[] {
  const allEntries = [...roster.characters, ...roster.places, ...roster.objects]
  const byId = new Map(allEntries.map((e) => [e.id, e]))

  const contextLines: string[] = []

  // Scene-specific elements (active participants)
  const sceneChars = scene.characters
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((e) => formatRosterEntry(e!))
  if (sceneChars.length > 0) {
    contextLines.push('Characters active in this scene:')
    for (const c of sceneChars) contextLines.push(`  - ${c}`)
  }

  if (scene.setting) {
    const place = byId.get(scene.setting)
    if (place) contextLines.push(`Setting: ${formatRosterEntry(place)}`)
  }

  const sceneObjs = (scene.objects ?? [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((e) => formatRosterEntry(e!))
  if (sceneObjs.length > 0) {
    contextLines.push('Objects in this scene:')
    for (const o of sceneObjs) contextLines.push(`  - ${o}`)
  }

  // Only first-order elements — no accumulated context from prior beats

  return [
    {
      role: 'system',
      content: `Scene planner for a ${contract.genre.name} story. Write ONE sentence as: SCENE_ID=${scene.scene_id}: [goal]`,
    },
    {
      role: 'user',
      content: [
        `Scene: ${scene.scene_id} — Beat: ${beat.summary}`,
        `Hard constraints: ${scene.constraints_checklist.hard.join(', ') || 'none'}`,
        ...(contextLines.length > 0 ? ['', ...contextLines] : []),
        '',
        `SCENE_ID=${scene.scene_id}:`,
      ].join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Legacy single-beat/scene builders (backwards compatibility for tests)
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
// Single-line response parser
// ---------------------------------------------------------------------------

function parseSingleResponse(
  response: string,
  idPrefix: 'BEAT_ID' | 'SCENE_ID',
  expectedId: string,
): string | null {
  const lines = response.trim().split('\n')
  const pattern = new RegExp(`${idPrefix}=([^:]+):\\s*(.+)`)

  for (const line of lines) {
    const match = line.match(pattern)
    if (match && match[1].trim() === expectedId) {
      // Strip surrounding brackets if present
      return match[2].trim().replace(/^\[|\]$/g, '')
    }
  }

  // Fallback: if the response is a single line without the prefix, use it
  if (lines.length === 1 && !lines[0].includes(`${idPrefix}=`)) {
    return lines[0].trim().replace(/^\[|\]$/g, '') || null
  }

  return null
}

// ---------------------------------------------------------------------------
// Max tokens constants for planning calls (much lower than prose generation)
// ---------------------------------------------------------------------------

/** Max tokens for beat summary calls — only needs ~1 sentence. */
export const BEAT_MAX_TOKENS = 256

/** Max tokens for scene goal calls — only needs ~1 sentence. */
export const SCENE_GOAL_MAX_TOKENS = 512

// ---------------------------------------------------------------------------
// High-level enhance function (per-beat, per-scene)
// ---------------------------------------------------------------------------

/**
 * Enhance beats and scenes with LLM-generated summaries and goals.
 * Processes one beat at a time with first-order element context.
 */
export async function enhancePlanWithLLM(
  beats: Beat[],
  scenes: Scene[],
  contract: StoryContract,
  llm: LLMAdapter,
  roster?: ElementRoster,
): Promise<void> {
  const emptyRoster: ElementRoster = { characters: [], places: [], objects: [] }
  const effectiveRoster = roster ?? emptyRoster

  // Process each beat individually
  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]
    const phase = contract.phase_guidelines.find(
      (p) => p.node_id === beat.archetype_node_id,
    )
    if (!phase) continue

    const context = gatherBeatContext(i, beats, scenes, effectiveRoster)
    const messages = buildSingleBeatPrompt(beat, phase, contract, context)
    const response = await llm.complete(messages, { maxTokens: BEAT_MAX_TOKENS })
    const summary = parseSingleResponse(response.content, 'BEAT_ID', beat.beat_id)

    if (summary) {
      beat.summary = validateSummary(summary, contract, beat.summary)
    }
  }

  // Process each scene individually — scoped to its beat point
  for (const scene of scenes) {
    const beatIndex = beats.findIndex((b) => b.beat_id === scene.beat_id)
    if (beatIndex < 0) continue
    const beat = beats[beatIndex]

    const messages = buildSingleScenePrompt(scene, beat, beatIndex, beats, scenes, contract, effectiveRoster)
    const response = await llm.complete(messages, { maxTokens: SCENE_GOAL_MAX_TOKENS })
    const goal = parseSingleResponse(response.content, 'SCENE_ID', scene.scene_id)

    if (goal) {
      scene.scene_goal = validateSummary(goal, contract, scene.scene_goal)
    }
  }
}

// ---------------------------------------------------------------------------
// Legacy batched exports (kept for backwards compatibility)
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
      content: `You are a story planner creating beat summaries for a ${contract.genre.name} story using the ${contract.archetype.name} archetype. For each beat listed, review the available data elements and construct EXACTLY one sentence that weaves them together to describe a specific scene in this format:
BEAT_ID=xxx: [Your one-sentence summary here]`,
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
      content: `You are a story planner designing scenes for a ${contract.genre.name} story. For each scene listed, review the available data elements and construct EXACTLY one sentence that weaves them together to describe a specific scene in this format:
SCENE_ID=xxx: [Your one-sentence goal here]`,
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
