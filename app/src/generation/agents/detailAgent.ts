/**
 * DetailAgent: prompt templates for LLM-driven detail synthesis.
 * Takes backbone slots + constraints and produces JSON bindings
 * with entity registries and slot assignments.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryRequest,
  StoryBackbone,
  StoryDetailBindings,
  BackboneSlot,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildDetailSynthesisPrompt(
  request: StoryRequest,
  backbone: StoryBackbone,
): LLMMessage[] {
  // Collect all unique slots across all scenes
  const allSlots: Record<string, BackboneSlot> = {}
  for (const beat of backbone.beats) {
    for (const scene of beat.scenes) {
      for (const [key, slot] of Object.entries(scene.slots)) {
        if (!allSlots[key]) allSlots[key] = slot
      }
    }
  }

  const slotList = Object.entries(allSlots)
    .map(([key, slot]) => `- ${key} (${slot.category}, ${slot.required ? 'required' : 'optional'}): ${slot.description ?? 'no description'}`)
    .join('\n')

  const beatSummaries = backbone.beats
    .map((b) => `- ${b.label} (${b.role}): ${b.definition ?? ''}`)
    .join('\n')

  return [
    {
      role: 'system',
      content: `You are a story detail generator. Create characters, places, and objects for the given slots. Output ONLY valid JSON:
{
  "entity_registry": {
    "characters": [{"id":"char_01","name":"...","role":"...","traits":[...],"motivations":[...]}],
    "places": [{"id":"place_01","name":"...","type":"...","features":[...],"atmosphere":"..."}],
    "objects": [{"id":"obj_01","name":"...","type":"...","significance":"..."}]
  },
  "slot_bindings": {
    "slot_name": {"slot_name":"...","bound_entity_id":"...","bound_value":"...","rationale":"..."}
  }
}
No markdown fences. No commentary. Just JSON.`,
    },
    {
      role: 'user',
      content: [
        `PREMISE: ${request.premise}`,
        `GENRE: ${request.requested_genre}`,
        `ARCHETYPE: ${request.requested_archetype}`,
        `TONE: ${request.tone_preference || 'not specified'}`,
        '',
        'BEATS:',
        beatSummaries,
        '',
        'SLOTS TO FILL:',
        slotList,
        '',
        'Create entities for all required slots. Fit the genre and tone. Output valid JSON only.',
      ].join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

export function parseDetailResponse(
  responseText: string,
): Partial<StoryDetailBindings> {
  // Strip markdown code fences if present
  let cleaned = responseText.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    const excerpt = cleaned.length > 200 ? cleaned.substring(0, 200) + '...' : cleaned
    throw new Error(`Failed to parse detail synthesis response as JSON. Response excerpt: ${excerpt}`)
  }
}

// ---------------------------------------------------------------------------
// Agent function
// ---------------------------------------------------------------------------

export async function runDetailAgent(
  llm: LLMAdapter,
  request: StoryRequest,
  backbone: StoryBackbone,
): Promise<Partial<StoryDetailBindings>> {
  const messages = buildDetailSynthesisPrompt(request, backbone)
  const response = llm.completeJson
    ? await llm.completeJson(messages)
    : await llm.complete(messages)
  return parseDetailResponse(response.content)
}
