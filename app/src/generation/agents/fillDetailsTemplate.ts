/**
 * Fill Details Template — a single-call LLM prompt that generates ALL story
 * elements at once: characters, places, objects, events, emotional arcs,
 * timeline, and relationships.
 *
 * Input: premise, archetype, genre, tone, contract, backbone (all already computed)
 * Output: StoryDetailBindings-compatible JSON with rich entity data
 *
 * Uses native --system-prompt and --json-schema via ClaudeCodeAdapter.
 */

import type { LLMMessage } from './llmAdapter.ts'
import type {
  StoryRequest,
  StoryContract,
  StoryBackbone,
  StoryDetailBindings,
  BackboneSlot,
} from '../artifacts/types.ts'
import { stripJsonFences } from './jsonUtils.ts'

// ---------------------------------------------------------------------------
// System prompt — role and output schema
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a story detail synthesizer. Given a story premise, archetype structure, genre constraints, and backbone beats, you generate ALL concrete story elements in a single response.

You must produce a complete, internally consistent set of:
- Characters (with names, roles, traits, motivations, flaws, backstories, arcs, relationships, distinguishing features)
- Places (with names, types, sensory features, atmosphere)
- Objects (with names, types, narrative significance, physical properties)
- Events/Moments (timeline of key story events mapped to beats, with participants and transitions)
- Emotional Arc (tension/hope/fear/resolution scores per beat)
- Narrative Promises and Payoffs (setup and delivery of story threads)
- Open Mysteries (unanswered questions that drive reader engagement)

Output ONLY valid JSON. No markdown fences, no commentary, no prose.

JSON Schema:
{
  "entity_registry": {
    "characters": [{
      "id": "char_01",
      "name": "Full Name",
      "role": "protagonist|mentor|antagonist|ally|love_interest|threshold_guardian|shapeshifter|trickster|herald",
      "archetype_function": "narrative purpose in the story",
      "traits": ["trait1", "trait2", "trait3"],
      "motivations": ["surface goal", "deeper need"],
      "flaw": "inner wound or blind spot",
      "backstory": "2-3 sentence origin that explains who they are",
      "arc_direction": "how they change from beginning to end",
      "relationships": ["relationship to Character X: nature of bond"],
      "distinguishing_feature": "memorable physical/behavioral detail"
    }],
    "places": [{
      "id": "place_01",
      "name": "Location Name",
      "type": "setting role (ordinary_world, threshold, ordeal_arena, etc.)",
      "features": ["visual detail", "sensory detail", "functional detail"],
      "atmosphere": "emotional quality of this place"
    }],
    "objects": [{
      "id": "obj_01",
      "name": "Object Name",
      "type": "narrative role (weapon, token, mcguffin, etc.)",
      "significance": "why this object matters to the story",
      "properties": ["physical description", "symbolic meaning"]
    }]
  },
  "slot_bindings": {
    "slot_name": {
      "slot_name": "matches backbone slot key",
      "bound_entity_id": "char_01|place_01|obj_01",
      "bound_value": "display name",
      "rationale": "why this entity fills this structural role"
    }
  },
  "timeline": [{
    "beat_id": "beat_01",
    "event_summary": "what happens in this beat",
    "emotional_scores": { "tension": 0.0, "hope": 0.0, "fear": 0.0, "resolution": 0.0 },
    "participants": { "characters": ["char_01"], "places": ["place_01"], "objects": ["obj_01"] },
    "transitions": [{ "entity_id": "char_01", "change": "emotional|status|location|knowledge|relationship", "description": "what changes" }]
  }],
  "open_mysteries": [{ "id": "mystery_01", "description": "unanswered question", "planted_at_beat": "beat_01", "resolved_at_beat": "beat_05" }],
  "promises": [{ "id": "promise_01", "description": "narrative setup", "made_at_beat": "beat_01" }],
  "payoffs": [{ "id": "payoff_01", "promise_id": "promise_01", "description": "how it pays off", "delivered_at_beat": "beat_07" }]
}`

// ---------------------------------------------------------------------------
// User prompt builder — injects all available context
// ---------------------------------------------------------------------------

export function buildFillDetailsPrompt(
  request: StoryRequest,
  contract: StoryContract,
  backbone: StoryBackbone,
): LLMMessage[] {
  // Collect all unique slots
  const allSlots: Record<string, BackboneSlot> = {}
  for (const beat of backbone.beats) {
    for (const scene of beat.scenes) {
      for (const [key, slot] of Object.entries(scene.slots)) {
        if (!allSlots[key]) allSlots[key] = slot
      }
    }
  }

  const slotList = Object.entries(allSlots)
    .map(([key, slot]) => `  - ${key} (${slot.category}, ${slot.required ? 'REQUIRED' : 'optional'}): ${slot.description ?? ''}`)
    .join('\n')

  const beatDetails = backbone.beats
    .map((b) => {
      const scenes = b.scenes.map((s) => `    Scene: ${s.scene_goal}`).join('\n')
      return `  ${b.beat_id} — ${b.label} (${b.role ?? 'beat'})\n    ${b.definition ?? ''}\n${scenes}`
    })
    .join('\n\n')

  // Extract constraints from phase guidelines
  const hardConstraints = contract.phase_guidelines
    .flatMap((p) => p.failure_modes ?? [])

  const toneMarkers = contract.genre?.tone_marker ?? []
  const antiPatterns = contract.genre?.anti_patterns ?? []

  const chapterOutline = backbone.chapter_partition
    .map((ch) => `  ${ch.chapter_id}: "${ch.title ?? ''}" — beats: ${ch.beat_ids.join(', ')} — tone: ${ch.tone_goal ?? ''}`)
    .join('\n')

  const userContent = [
    `=== STORY PREMISE ===`,
    request.premise,
    '',
    `=== ARCHETYPE: ${request.requested_archetype} ===`,
    `Structure: ${contract.archetype.name}`,
    `Spine nodes: ${contract.archetype.spine_nodes.join(', ')}`,
    `Required roles: ${contract.archetype.required_roles.join(', ')}`,
    '',
    `=== GENRE: ${request.requested_genre} ===`,
    `Hard constraints: ${contract.genre.hard_constraints.join(', ')}`,
    `Soft constraints: ${contract.genre.soft_constraints.join(', ')}`,
    `Tone: ${request.tone_preference}`,
    toneMarkers.length > 0 ? `Tone markers: ${toneMarkers.join(', ')}` : '',
    antiPatterns.length > 0 ? `Anti-patterns to AVOID: ${antiPatterns.join(', ')}` : '',
    '',
    `=== HARD CONSTRAINTS ===`,
    hardConstraints.length > 0 ? hardConstraints.map((c) => `  - ${c}`).join('\n') : '  (none)',
    '',
    `=== STORY BEATS (${backbone.beats.length} beats) ===`,
    beatDetails,
    '',
    `=== CHAPTER STRUCTURE ===`,
    chapterOutline,
    '',
    `=== SLOTS TO FILL ===`,
    slotList,
    '',
    `=== STYLE ===`,
    `Voice: ${backbone.style_directives.global_voice ?? 'not specified'}`,
    `Pacing: ${backbone.style_directives.global_pacing ?? 'not specified'}`,
    '',
    `=== INSTRUCTIONS ===`,
    `Generate ALL entities needed for this story. Every REQUIRED slot must have a binding.`,
    `Characters must have distinct names, clear motivations, and specific flaws.`,
    `Places must have sensory atmosphere descriptions.`,
    `Include a timeline entry for every beat showing who is present and what changes.`,
    `All names and details must fit the ${request.requested_genre} genre and ${request.tone_preference} tone.`,
    `Ensure relationships between characters are bidirectional and specific.`,
    `Output valid JSON only.`,
  ].filter(Boolean).join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userContent },
  ]
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

export interface FillDetailsResult {
  bindings: StoryDetailBindings
  timeline?: Array<{
    beat_id: string
    event_summary: string
    emotional_scores?: { tension: number; hope: number; fear: number; resolution: number }
    participants?: { characters: string[]; places: string[]; objects: string[] }
    transitions?: Array<{ entity_id: string; change: string; description: string }>
  }>
}

export function parseFillDetailsResponse(
  responseText: string,
  runId: string,
  corpusHash: string,
): FillDetailsResult {
  let cleaned = stripJsonFences(responseText.trim())

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const excerpt = cleaned.length > 300 ? cleaned.substring(0, 300) + '...' : cleaned
    throw new Error(`Failed to parse Fill Details response as JSON. Excerpt: ${excerpt}`)
  }

  const entityRegistry = (parsed.entity_registry as Record<string, unknown>) ?? {}

  const bindings: StoryDetailBindings = {
    schema_version: '1.0.0',
    run_id: runId,
    generated_at: new Date().toISOString(),
    source_corpus_hash: corpusHash,
    entity_registry: {
      characters: (entityRegistry.characters as StoryDetailBindings['entity_registry']['characters']) ?? [],
      places: (entityRegistry.places as StoryDetailBindings['entity_registry']['places']) ?? [],
      objects: (entityRegistry.objects as StoryDetailBindings['entity_registry']['objects']) ?? [],
    },
    slot_bindings: (parsed.slot_bindings as StoryDetailBindings['slot_bindings']) ?? {},
    open_mysteries: (parsed.open_mysteries as StoryDetailBindings['open_mysteries']) ?? [],
    promises: (parsed.promises as StoryDetailBindings['promises']) ?? [],
    payoffs: (parsed.payoffs as StoryDetailBindings['payoffs']) ?? [],
  }

  const timeline = (parsed.timeline as FillDetailsResult['timeline']) ?? undefined

  return { bindings, timeline }
}
