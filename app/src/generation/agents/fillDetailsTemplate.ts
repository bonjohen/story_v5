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

const SYSTEM_PROMPT = `You are a story detail generator. Given a premise, archetype, genre, and list of slots to fill, generate characters, places, and objects.

Output ONLY valid JSON matching this schema:
{
  "entity_registry": {
    "characters": [{"id":"char_01","name":"Full Name","role":"protagonist|mentor|antagonist|ally","traits":["trait1","trait2"],"motivations":["goal"],"flaw":"weakness"}],
    "places": [{"id":"place_01","name":"Name","type":"setting type","features":["detail"],"atmosphere":"mood"}],
    "objects": [{"id":"obj_01","name":"Name","type":"token|weapon|mcguffin","significance":"why it matters"}]
  },
  "slot_bindings": {
    "slot_name": {"slot_name":"key","bound_entity_id":"char_01","bound_value":"display name","rationale":"why"}
  }
}

No markdown fences. No commentary. Just JSON.`

// ---------------------------------------------------------------------------
// User prompt builder — injects all available context
// ---------------------------------------------------------------------------

export function buildFillDetailsPrompt(
  request: StoryRequest,
  _contract: StoryContract,
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
    .map(([key, slot]) => `- ${key} (${slot.category}, ${slot.required ? 'REQUIRED' : 'optional'})`)
    .join('\n')

  const userContent = [
    `PREMISE: ${request.premise}`,
    `ARCHETYPE: ${request.requested_archetype}`,
    `GENRE: ${request.requested_genre}`,
    `TONE: ${request.tone_preference || 'not specified'}`,
    '',
    `SLOTS TO FILL:`,
    slotList,
    '',
    `Generate characters, places, and objects for this story. Every REQUIRED slot must have a slot_binding. Output valid JSON only.`,
  ].join('\n')

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
