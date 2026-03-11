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
// Category-specific prompt builders for parallel detail synthesis
// ---------------------------------------------------------------------------

type EntityCategory = 'character' | 'place' | 'object'

const CATEGORY_SCHEMAS: Record<EntityCategory, string> = {
  character: `{
  "characters": [{"id":"char_01","name":"...","role":"...","traits":[...],"motivations":[...],"flaw":"..."}],
  "slot_bindings": {"slot_name": {"slot_name":"...","bound_entity_id":"char_01","bound_value":"...","rationale":"..."}}
}`,
  place: `{
  "places": [{"id":"place_01","name":"...","type":"...","features":[...],"atmosphere":"..."}],
  "slot_bindings": {"slot_name": {"slot_name":"...","bound_entity_id":"place_01","bound_value":"...","rationale":"..."}}
}`,
  object: `{
  "objects": [{"id":"obj_01","name":"...","type":"...","significance":"..."}],
  "slot_bindings": {"slot_name": {"slot_name":"...","bound_entity_id":"obj_01","bound_value":"...","rationale":"..."}}
}`,
}

function buildCategoryPrompt(
  category: EntityCategory,
  request: StoryRequest,
  slots: Record<string, BackboneSlot>,
): LLMMessage[] {
  const slotList = Object.entries(slots)
    .map(([key, slot]) => `- ${key} (${slot.required ? 'required' : 'optional'}): ${slot.description ?? 'no description'}`)
    .join('\n')

  const label = category === 'character' ? 'characters' : category === 'place' ? 'places' : 'objects'

  return [
    {
      role: 'system',
      content: `Generate ${label} for a story. Output ONLY valid JSON matching:\n${CATEGORY_SCHEMAS[category]}\nNo markdown fences. No commentary. Just JSON.`,
    },
    {
      role: 'user',
      content: [
        `PREMISE: ${request.premise}`,
        `GENRE: ${request.requested_genre}`,
        `ARCHETYPE: ${request.requested_archetype}`,
        `TONE: ${request.tone_preference || 'not specified'}`,
        '',
        `${label.toUpperCase()} SLOTS TO FILL:`,
        slotList,
        '',
        `Create ${label} for all required slots. Fit the genre and tone. Output valid JSON only.`,
      ].join('\n'),
    },
  ]
}

function collectSlotsByCategory(backbone: StoryBackbone): Record<EntityCategory, Record<string, BackboneSlot>> {
  const result: Record<EntityCategory, Record<string, BackboneSlot>> = {
    character: {},
    place: {},
    object: {},
  }
  for (const beat of backbone.beats) {
    for (const scene of beat.scenes) {
      for (const [key, slot] of Object.entries(scene.slots)) {
        const cat = slot.category as EntityCategory
        if (cat in result && !result[cat][key]) {
          result[cat][key] = slot
        }
      }
    }
  }
  return result
}

function mergeDetailResults(results: Partial<StoryDetailBindings>[]): Partial<StoryDetailBindings> {
  const merged: Partial<StoryDetailBindings> = {
    entity_registry: { characters: [], places: [], objects: [] },
    slot_bindings: {},
  }
  for (const r of results) {
    if (r.entity_registry?.characters) merged.entity_registry!.characters!.push(...r.entity_registry.characters)
    if (r.entity_registry?.places) merged.entity_registry!.places!.push(...r.entity_registry.places)
    if (r.entity_registry?.objects) merged.entity_registry!.objects!.push(...r.entity_registry.objects)
    // Also handle flat arrays at the top level (some models return this way)
    const raw = r as Record<string, unknown>
    if (Array.isArray(raw.characters)) merged.entity_registry!.characters!.push(...(raw.characters as StoryDetailBindings['entity_registry']['characters']))
    if (Array.isArray(raw.places)) merged.entity_registry!.places!.push(...(raw.places as StoryDetailBindings['entity_registry']['places']))
    if (Array.isArray(raw.objects)) merged.entity_registry!.objects!.push(...(raw.objects as StoryDetailBindings['entity_registry']['objects']))
    if (r.slot_bindings) Object.assign(merged.slot_bindings!, r.slot_bindings)
    if (r.open_mysteries) merged.open_mysteries = [...(merged.open_mysteries ?? []), ...r.open_mysteries]
    if (r.promises) merged.promises = [...(merged.promises ?? []), ...r.promises]
    if (r.payoffs) merged.payoffs = [...(merged.payoffs ?? []), ...r.payoffs]
  }
  return merged
}

// ---------------------------------------------------------------------------
// Agent functions
// ---------------------------------------------------------------------------

/** Original single-call agent (fallback). */
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

/**
 * Parallel detail agent — fires one LLM call per entity category
 * (characters, places, objects) concurrently, then merges results.
 * Skips categories with no slots.
 */
export async function runDetailAgentParallel(
  llm: LLMAdapter,
  request: StoryRequest,
  backbone: StoryBackbone,
): Promise<Partial<StoryDetailBindings>> {
  const byCategory = collectSlotsByCategory(backbone)
  const categories = (['character', 'place', 'object'] as const).filter(
    (cat) => Object.keys(byCategory[cat]).length > 0,
  )

  // If only one category has slots, no benefit from parallelism — use single call
  if (categories.length <= 1) {
    return runDetailAgent(llm, request, backbone)
  }

  const promises = categories.map(async (cat) => {
    const messages = buildCategoryPrompt(cat, request, byCategory[cat])
    const response = llm.completeJson
      ? await llm.completeJson(messages, { maxTokens: 2048 })
      : await llm.complete(messages, { maxTokens: 2048 })
    const parsed = parseDetailResponse(response.content)
    // Strip entities from other categories — only keep what this call was asked for
    if (parsed.entity_registry) {
      if (cat !== 'character') parsed.entity_registry.characters = []
      if (cat !== 'place') parsed.entity_registry.places = []
      if (cat !== 'object') parsed.entity_registry.objects = []
    }
    // Only keep slot bindings for slots in this category
    if (parsed.slot_bindings) {
      const catSlotKeys = new Set(Object.keys(byCategory[cat]))
      for (const key of Object.keys(parsed.slot_bindings)) {
        if (!catSlotKeys.has(key)) delete parsed.slot_bindings[key]
      }
    }
    return parsed
  })

  const results = await Promise.all(promises)
  return mergeDetailResults(results)
}
