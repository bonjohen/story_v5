/**
 * Detail Synthesizer: binds concrete story-specific details into backbone
 * slots, producing entity registries and continuity-friendly bindings.
 *
 * Can operate in two modes:
 * 1. LLM mode: uses the detail agent to generate creative bindings
 * 2. Deterministic mode: generates placeholder bindings from slot metadata
 *
 * Input:  StoryRequest, StoryBackbone, optional LLMAdapter
 * Output: StoryDetailBindings + updated StoryBackbone (slots bound)
 */

import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { runDetailAgent } from '../agents/detailAgent.ts'
import type {
  StoryRequest,
  StoryBackbone,
  StoryDetailBindings,
  EntityRegistry,
  SlotBinding,
  DetailCharacter,
  DetailPlace,
  DetailObject,
  BackboneSlot,
  UnresolvedTodo,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface DetailSynthesizerResult {
  bindings: StoryDetailBindings
  updatedBackbone: StoryBackbone
}

/**
 * Synthesize story details by filling backbone slots with concrete entities.
 * If an LLM is provided, uses it for creative generation.
 * Otherwise, produces deterministic placeholder bindings.
 */
export async function synthesizeDetails(
  request: StoryRequest,
  backbone: StoryBackbone,
  llm?: LLMAdapter | null,
): Promise<DetailSynthesizerResult> {
  // Collect all unique slots
  const allSlots = collectSlots(backbone)

  let bindings: StoryDetailBindings

  if (llm) {
    bindings = await synthesizeWithLLM(request, backbone, llm, allSlots)
  } else {
    bindings = synthesizeDeterministic(request, backbone, allSlots)
  }

  // Bind values back into the backbone
  const updatedBackbone = bindSlotsInBackbone(backbone, bindings)

  return { bindings, updatedBackbone }
}

// ---------------------------------------------------------------------------
// Slot collection
// ---------------------------------------------------------------------------

function collectSlots(backbone: StoryBackbone): Map<string, BackboneSlot> {
  const slots = new Map<string, BackboneSlot>()
  for (const beat of backbone.beats) {
    for (const scene of beat.scenes) {
      for (const [key, slot] of Object.entries(scene.slots)) {
        if (!slots.has(key)) slots.set(key, slot)
      }
    }
  }
  return slots
}

// ---------------------------------------------------------------------------
// LLM-driven synthesis
// ---------------------------------------------------------------------------

async function synthesizeWithLLM(
  request: StoryRequest,
  backbone: StoryBackbone,
  llm: LLMAdapter,
  allSlots: Map<string, BackboneSlot>,
): Promise<StoryDetailBindings> {
  const partial = await runDetailAgent(llm, request, backbone)

  // Merge LLM results with defaults for any missing fields
  const entityRegistry: EntityRegistry = {
    characters: partial.entity_registry?.characters ?? [],
    places: partial.entity_registry?.places ?? [],
    objects: partial.entity_registry?.objects ?? [],
  }

  const slotBindings: Record<string, SlotBinding> = partial.slot_bindings ?? {}

  // Check for unresolved required slots
  const unresolvedTodos: UnresolvedTodo[] = partial.unresolved_todos ?? []
  for (const [key, slot] of allSlots) {
    if (slot.required && !slotBindings[key]) {
      unresolvedTodos.push({
        slot_name: key,
        reason: 'LLM did not provide a binding for this required slot',
        suggested_resolution: `Create a ${slot.category} entity for the ${key} role`,
      })
    }
  }

  return {
    schema_version: '1.0.0',
    run_id: backbone.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: backbone.source_corpus_hash,
    entity_registry: entityRegistry,
    slot_bindings: slotBindings,
    open_mysteries: partial.open_mysteries ?? [],
    promises: partial.promises ?? [],
    payoffs: partial.payoffs ?? [],
    unresolved_todos: unresolvedTodos.length > 0 ? unresolvedTodos : undefined,
  }
}

// ---------------------------------------------------------------------------
// Deterministic synthesis (no LLM)
// ---------------------------------------------------------------------------

function synthesizeDeterministic(
  request: StoryRequest,
  backbone: StoryBackbone,
  allSlots: Map<string, BackboneSlot>,
): StoryDetailBindings {
  const characters: DetailCharacter[] = []
  const places: DetailPlace[] = []
  const objects: DetailObject[] = []
  const slotBindings: Record<string, SlotBinding> = {}

  let charIdx = 1
  let placeIdx = 1
  let objIdx = 1

  for (const [key, slot] of allSlots) {
    switch (slot.category) {
      case 'character': {
        const id = `char_${String(charIdx++).padStart(2, '0')}`
        const name = toTitleCase(key)
        characters.push({
          id,
          name,
          role: key,
          traits: [],
          motivations: [],
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `Deterministic placeholder for ${key} role`,
        }
        break
      }
      case 'place': {
        const id = `place_${String(placeIdx++).padStart(2, '0')}`
        const name = toTitleCase(key)
        places.push({
          id,
          name,
          type: key,
          features: [],
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `Deterministic placeholder for ${key} location`,
        }
        break
      }
      case 'object': {
        const id = `obj_${String(objIdx++).padStart(2, '0')}`
        const name = toTitleCase(key)
        objects.push({
          id,
          name,
          type: key,
          significance: slot.description ?? '',
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `Deterministic placeholder for ${key} object`,
        }
        break
      }
      default: {
        // concept or unknown — bind as string
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: key,
          bound_value: toTitleCase(key),
          rationale: `Deterministic placeholder for ${key}`,
        }
        break
      }
    }
  }

  return {
    schema_version: '1.0.0',
    run_id: backbone.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: backbone.source_corpus_hash,
    entity_registry: { characters, places, objects },
    slot_bindings: slotBindings,
  }
}

// ---------------------------------------------------------------------------
// Bind slots back into backbone
// ---------------------------------------------------------------------------

function bindSlotsInBackbone(
  backbone: StoryBackbone,
  bindings: StoryDetailBindings,
): StoryBackbone {
  const updatedBeats = backbone.beats.map((beat) => ({
    ...beat,
    scenes: beat.scenes.map((scene) => {
      const updatedSlots = { ...scene.slots }
      for (const [key, slot] of Object.entries(updatedSlots)) {
        const binding = bindings.slot_bindings[key]
        if (binding) {
          updatedSlots[key] = {
            ...slot,
            bound_value: binding.bound_value,
          }
        }
      }
      return { ...scene, slots: updatedSlots }
    }),
  }))

  return { ...backbone, beats: updatedBeats }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
