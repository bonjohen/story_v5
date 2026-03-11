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
import { runDetailAgentParallel } from '../agents/detailAgent.ts'
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
  const partial = await runDetailAgentParallel(llm, request, backbone)

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

  // Warn about unresolved required slots — downstream will have incomplete data
  const unresolvedRequired = unresolvedTodos.filter((t) => {
    const slot = allSlots.get(t.slot_name)
    return slot?.required
  })
  if (unresolvedRequired.length > 0) {
    console.warn(
      `[detailSynthesizer] ${unresolvedRequired.length} required slot(s) unresolved: ${unresolvedRequired.map((t) => t.slot_name).join(', ')}`,
    )
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

  const genre = request.requested_genre
  const tone = request.tone_preference

  for (const [key, slot] of allSlots) {
    switch (slot.category) {
      case 'character': {
        const id = `char_${String(charIdx++).padStart(2, '0')}`
        const name = toTitleCase(key)
        const profile = CHARACTER_ROLE_PROFILES[key] ?? DEFAULT_CHARACTER_PROFILE
        characters.push({
          id,
          name,
          role: key,
          archetype_function: profile.archetype_function,
          traits: profile.traits(genre, tone),
          motivations: profile.motivations(genre),
          flaw: profile.flaw,
          backstory: `[${genre} ${key}: ${profile.backstory_prompt}]`,
          arc_direction: profile.arc_direction,
          relationships: profile.relationships(key, allSlots),
          distinguishing_feature: `[${profile.distinguishing_prompt}]`,
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `${profile.archetype_function} — ${profile.arc_direction}`,
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
          features: [`[${genre} setting detail]`, `[atmosphere matching ${tone} tone]`],
          atmosphere: `[${tone} mood appropriate for ${key}]`,
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `${genre} location serving as ${key}`,
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
          significance: slot.description ?? `[${genre} significance for ${key}]`,
          properties: [`[physical description]`, `[symbolic meaning in ${genre}]`],
        })
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: id,
          bound_value: name,
          rationale: `${genre} object serving as ${key}`,
        }
        break
      }
      default: {
        slotBindings[key] = {
          slot_name: key,
          bound_entity_id: key,
          bound_value: toTitleCase(key),
          rationale: `Thematic concept for ${key} in ${genre}`,
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
// Character role profiles — template metadata per archetype role
// ---------------------------------------------------------------------------

interface CharacterRoleProfile {
  archetype_function: string
  traits: (genre: string, tone: string) => string[]
  motivations: (genre: string) => string[]
  flaw: string
  backstory_prompt: string
  arc_direction: string
  relationships: (self: string, allSlots: Map<string, BackboneSlot>) => string[]
  distinguishing_prompt: string
}

const DEFAULT_CHARACTER_PROFILE: CharacterRoleProfile = {
  archetype_function: 'Supporting role in the narrative',
  traits: (genre) => [`[primary personality trait for ${genre}]`, `[secondary trait]`, `[contrasting trait]`],
  motivations: (genre) => [`[core motivation in ${genre} context]`],
  flaw: '[character flaw that creates tension]',
  backstory_prompt: 'background that explains current motivations and worldview',
  arc_direction: 'Changes through story events',
  relationships: (self, slots) => {
    const others = [...slots.keys()].filter((k) => k !== self && slots.get(k)?.category === 'character')
    return others.slice(0, 2).map((o) => `[relationship to ${toTitleCase(o)}]`)
  },
  distinguishing_prompt: 'unique mannerism, appearance detail, or speech pattern',
}

const CHARACTER_ROLE_PROFILES: Record<string, CharacterRoleProfile> = {
  protagonist: {
    archetype_function: 'Central character who drives the story and undergoes the primary transformation',
    traits: (genre, tone) => [
      `[core competency relevant to ${genre}]`,
      `[personality trait that creates ${tone} resonance]`,
      `[hidden strength revealed under pressure]`,
    ],
    motivations: (genre) => [
      `[surface goal in ${genre} context]`,
      `[deeper need they don't yet recognize]`,
    ],
    flaw: '[blind spot or inner wound that must be confronted at the crisis point]',
    backstory_prompt: 'formative experience that created both their greatest strength and deepest vulnerability',
    arc_direction: 'Transforms from initial state through ordeal to changed worldview',
    relationships: (_self, slots) => {
      const rels: string[] = []
      if (slots.has('mentor')) rels.push('[seeks guidance from mentor but must eventually surpass them]')
      if (slots.has('antagonist')) rels.push('[opposition that mirrors or inverts protagonist values]')
      if (slots.has('ally')) rels.push('[bond tested by story events]')
      if (slots.has('love_interest')) rels.push('[emotional connection that raises personal stakes]')
      if (slots.has('threshold_guardian')) rels.push('[must prove worthiness to pass]')
      return rels.length > 0 ? rels : ['[primary relationship that drives emotional stakes]']
    },
    distinguishing_prompt: 'signature habit, physical trait, or way of speaking that readers identify with',
  },
  mentor: {
    archetype_function: 'Guide who provides wisdom, tools, or training before the protagonist faces their ordeal',
    traits: (genre, tone) => [
      `[expertise that makes them authoritative in ${genre}]`,
      `[warmth or severity matching ${tone}]`,
      `[subtle indication of past wounds]`,
    ],
    motivations: (genre) => [
      `[reason for helping the protagonist in this ${genre}]`,
      `[personal stake or unfinished business]`,
    ],
    flaw: '[limitation from their own past that prevents them from solving the problem directly]',
    backstory_prompt: 'earlier journey of their own that gives them wisdom but also scars',
    arc_direction: 'Enables protagonist growth then steps back or is lost',
    relationships: (_self, slots) => {
      const rels: string[] = ['[teaches protagonist but holds back a crucial truth]']
      if (slots.has('antagonist')) rels.push('[prior history or connection with antagonist]')
      return rels
    },
    distinguishing_prompt: 'teaching style, memorable phrase, or symbolic possession',
  },
  antagonist: {
    archetype_function: 'Primary opposing force whose goals directly conflict with the protagonist',
    traits: (genre, tone) => [
      `[competency that makes them a credible threat in ${genre}]`,
      `[quality that makes them compelling, not merely evil]`,
      `[${tone} edge to their methods]`,
    ],
    motivations: (genre) => [
      `[goal that is logical from their perspective in ${genre}]`,
      `[grievance or worldview that justifies their actions]`,
    ],
    flaw: '[overconfidence, obsession, or moral blind spot that leads to their undoing]',
    backstory_prompt: 'origin of their opposing worldview — what made them who they are',
    arc_direction: 'Escalates opposition until final confrontation reveals their true nature',
    relationships: (_self, slots) => {
      const rels: string[] = ['[mirrors or inverts the protagonist in a specific way]']
      if (slots.has('mentor')) rels.push('[connection to mentor that raises stakes]')
      return rels
    },
    distinguishing_prompt: 'intimidating presence detail, method of control, or signature threat',
  },
  ally: {
    archetype_function: 'Loyal companion who provides support, contrast, or comic relief alongside the protagonist',
    traits: (genre, tone) => [
      `[skill that complements protagonist weakness in ${genre}]`,
      `[personality contrast to protagonist]`,
      `[loyalty expressed through ${tone}-appropriate actions]`,
    ],
    motivations: (genre) => [
      `[personal reason for joining the protagonist in ${genre}]`,
      `[what they hope to gain or protect]`,
    ],
    flaw: '[dependency, doubt, or secret that strains the alliance]',
    backstory_prompt: 'how they came to be available and willing to help',
    arc_direction: 'Loyalty is tested; proves or fails at a crucial moment',
    relationships: (_self, slots) => {
      const rels: string[] = ['[bond with protagonist forged through shared adversity]']
      if (slots.has('antagonist')) rels.push('[personal grudge or fear of antagonist]')
      return rels
    },
    distinguishing_prompt: 'humor style, nervous habit, or area of unexpected expertise',
  },
  love_interest: {
    archetype_function: 'Character whose emotional connection raises personal stakes and reveals protagonist vulnerability',
    traits: (genre, tone) => [
      `[quality that attracts the protagonist in ${genre}]`,
      `[independence that prevents them from being merely decorative]`,
      `[emotional register matching ${tone}]`,
    ],
    motivations: (genre) => [
      `[own goals independent of the protagonist in ${genre}]`,
      `[what draws them to the protagonist despite risks]`,
    ],
    flaw: '[emotional guard, conflicting loyalty, or past that complicates the relationship]',
    backstory_prompt: 'life and commitments that exist independent of the protagonist',
    arc_direction: 'Connection deepens through vulnerability; may be catalyst for protagonist choice',
    relationships: (_self, slots) => {
      const rels: string[] = ['[emotional authenticity that challenges protagonist defenses]']
      if (slots.has('antagonist')) rels.push('[may be threatened, leveraged, or connected to antagonist]')
      return rels
    },
    distinguishing_prompt: 'detail protagonist notices first, recurring gesture, or way they show trust',
  },
  threshold_guardian: {
    archetype_function: 'Gatekeeper who tests the protagonist before allowing passage to the next stage',
    traits: (genre, tone) => [
      `[authority or power within their domain in ${genre}]`,
      `[inscrutability matching ${tone}]`,
      `[hidden fairness beneath intimidating exterior]`,
    ],
    motivations: (genre) => [`[duty to protect the threshold in ${genre}]`, `[standard they enforce]`],
    flaw: '[rigidity or past failure that shapes their testing]',
    backstory_prompt: 'why they guard this particular threshold and what they have seen pass through',
    arc_direction: 'Tests protagonist then allows, blocks, or is won over',
    relationships: (_self, _slots) => ['[judges protagonist readiness]', '[may respect mentor or fear antagonist]'],
    distinguishing_prompt: 'imposing physical detail, ritual behavior, or cryptic speech pattern',
  },
  shapeshifter: {
    archetype_function: 'Character whose loyalty or true nature remains uncertain, creating suspense',
    traits: (genre, tone) => [
      `[charm or plausibility in ${genre}]`,
      `[contradictory signals matching ${tone} ambiguity]`,
      `[genuine quality that makes distrust uncomfortable]`,
    ],
    motivations: (genre) => [`[hidden agenda in ${genre} context]`, `[real allegiance revealed late]`],
    flaw: '[inability to commit, or trauma that drives deception]',
    backstory_prompt: 'what taught them that shifting allegiance is necessary for survival',
    arc_direction: 'True allegiance revealed at a pivotal moment — ally or betrayer',
    relationships: (_self, slots) => {
      const rels: string[] = ['[appears trustworthy to protagonist but sends mixed signals]']
      if (slots.has('antagonist')) rels.push('[secret connection to antagonist]')
      return rels
    },
    distinguishing_prompt: 'tells or micro-expressions that hint at hidden truth',
  },
  trickster: {
    archetype_function: 'Disruptive force who challenges conventions and provides unexpected perspective',
    traits: (genre, tone) => [
      `[irreverence appropriate to ${genre}]`,
      `[hidden wisdom beneath ${tone} humor]`,
      `[refusal to follow expected rules]`,
    ],
    motivations: (genre) => [`[desire to expose hypocrisy in ${genre} world]`, `[personal entertainment or deeper purpose]`],
    flaw: '[inability to be serious when it matters, or loneliness beneath the mask]',
    backstory_prompt: 'what made them adopt humor or chaos as their primary strategy',
    arc_direction: 'Disrupts complacency; may deliver crucial truth at unexpected moment',
    relationships: (_self, _slots) => ['[challenges protagonist assumptions]', '[annoys authority figures]'],
    distinguishing_prompt: 'signature joke style, physical comedy, or provocative accessory',
  },
  herald: {
    archetype_function: 'Character or force that announces change and catalyzes the protagonist journey',
    traits: (genre, tone) => [
      `[urgency appropriate to ${genre}]`,
      `[${tone} gravitas in delivery]`,
    ],
    motivations: (genre) => [`[compulsion to deliver the call in ${genre}]`],
    flaw: '[may not understand the full implications of the message they carry]',
    backstory_prompt: 'why they are the one to bring the inciting message',
    arc_direction: 'Delivers the call to adventure; may reappear at turning points',
    relationships: (_self, _slots) => ['[disrupts protagonist ordinary world]'],
    distinguishing_prompt: 'arrival method, voice quality, or symbolic object they carry',
  },
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
