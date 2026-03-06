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
      content: `You are a story detail synthesizer. Your job is to create concrete characters, places, and objects that fill the story's structural slots. You must output ONLY valid JSON matching the StoryDetailBindings schema. Do not write prose — only structured JSON data.

Output schema:
{
  "entity_registry": {
    "characters": [{ "id": "char_01", "name": "...", "role": "...", "traits": [...], "motivations": [...], "backstory": "..." }],
    "places": [{ "id": "place_01", "name": "...", "type": "...", "features": [...], "atmosphere": "..." }],
    "objects": [{ "id": "obj_01", "name": "...", "type": "...", "significance": "...", "properties": [...] }]
  },
  "slot_bindings": {
    "slot_name": { "slot_name": "...", "bound_entity_id": "...", "bound_value": "...", "rationale": "..." }
  },
  "open_mysteries": [{ "id": "mystery_01", "description": "...", "planted_at_beat": "..." }],
  "promises": [{ "id": "promise_01", "description": "...", "made_at_beat": "..." }],
  "payoffs": [{ "id": "payoff_01", "promise_id": "...", "description": "...", "delivered_at_beat": "..." }],
  "unresolved_todos": []
}`,
    },
    {
      role: 'user',
      content: [
        `Story premise: ${request.premise}`,
        `Genre: ${request.requested_genre}`,
        `Archetype: ${request.requested_archetype}`,
        `Tone: ${request.tone_preference}`,
        `Medium: ${request.medium}`,
        `Audience: ${request.audience.age_band}`,
        `Content limits: ${request.audience.content_limits.join(', ') || 'none'}`,
        `Must include: ${request.constraints.must_include.join(', ') || 'none'}`,
        `Must exclude: ${request.constraints.must_exclude.join(', ') || 'none'}`,
        '',
        'Story beats:',
        beatSummaries,
        '',
        'Slots to fill:',
        slotList,
        '',
        'Create concrete entities for all required slots. Ensure names and details fit the genre and tone. Output valid JSON only.',
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
    throw new Error('Failed to parse detail synthesis response as JSON')
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
  const response = await llm.complete(messages)
  return parseDetailResponse(response.content)
}
