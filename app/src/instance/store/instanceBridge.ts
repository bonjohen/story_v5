/**
 * Instance Bridge — converts between generation pipeline artifacts and
 * StoryInstance/StoryLore entities.
 *
 * Direction 1: Pipeline → Instance (after generation, snapshot into instance)
 * Direction 2: Instance → Pipeline (export instance data as StoryRequest constraints)
 */

import type { StoryInstance, InstanceMetadata } from '../types.ts'
import { createEmptyLore } from '../types.ts'
import type {
  StoryDetailBindings,
  DetailCharacter,
  DetailPlace,
  DetailObject,
  SelectionResult,
  StoryRequest,
} from '../../generation/artifacts/types.ts'
import type {
  StoryLore,
  LoreCharacter,
  LorePlace,
  LoreObject,
  PlotThread,
} from '../../generation/series/types.ts'
import type { CharacterRole, PlaceType, ObjectType } from '../../types/elements.ts'
import type { ArcType } from '../../types/elements.ts'

// ---------------------------------------------------------------------------
// Pipeline → Instance
// ---------------------------------------------------------------------------

const VALID_ROLES: CharacterRole[] = [
  'protagonist', 'antagonist', 'mentor', 'ally', 'herald',
  'threshold_guardian', 'shadow', 'trickster', 'shapeshifter',
  'love_interest', 'foil', 'confidant', 'comic_relief',
]

const VALID_PLACE_TYPES: PlaceType[] = [
  'ordinary_world', 'threshold', 'special_world', 'sanctuary',
  'stronghold', 'wasteland', 'crossroads', 'underworld', 'summit', 'home',
]

const VALID_OBJECT_TYPES: ObjectType[] = [
  'weapon', 'talisman', 'document', 'treasure', 'mcguffin',
  'symbol', 'tool', 'key', 'vessel', 'relic',
]

function toCharacterRole(role: string): CharacterRole {
  const lower = role.toLowerCase() as CharacterRole
  return VALID_ROLES.includes(lower) ? lower : 'ally'
}

function toPlaceType(type: string): PlaceType {
  const lower = type.toLowerCase() as PlaceType
  return VALID_PLACE_TYPES.includes(lower) ? lower : 'special_world'
}

function toObjectType(type: string): ObjectType {
  const lower = type.toLowerCase() as ObjectType
  return VALID_OBJECT_TYPES.includes(lower) ? lower : 'mcguffin'
}

function toArcType(direction?: string): ArcType {
  if (!direction) return null
  const lower = direction.toLowerCase()
  if (lower.includes('transform')) return 'transformative'
  if (lower.includes('steadfast') || lower.includes('static')) return 'steadfast'
  if (lower.includes('tragic') || lower.includes('fall')) return 'tragic'
  if (lower.includes('corrupt')) return 'corrupted'
  if (lower.includes('redempt')) return 'redemptive'
  return 'transformative'
}

function detailCharacterToLore(dc: DetailCharacter, sourceId: string): LoreCharacter {
  return {
    id: dc.id,
    name: dc.name,
    role: toCharacterRole(dc.role),
    description: dc.backstory ?? dc.archetype_function,
    traits: dc.traits ?? [],
    motivations: dc.motivations ?? [],
    arc_type: toArcType(dc.arc_direction),
    relationships: [],
    status: 'alive',
    introduced_in: sourceId,
    last_appeared_in: sourceId,
    knowledge: [],
    possessions: [],
    arc_milestones: [],
  }
}

function detailPlaceToLore(dp: DetailPlace, sourceId: string): LorePlace {
  return {
    id: dp.id,
    name: dp.name,
    type: toPlaceType(dp.type),
    description: dp.features?.join('. ') ?? dp.name,
    atmosphere: dp.atmosphere,
    introduced_in: sourceId,
    last_featured_in: sourceId,
    status: 'extant',
    events_here: [],
  }
}

function detailObjectToLore(dobj: DetailObject, sourceId: string): LoreObject {
  return {
    id: dobj.id,
    name: dobj.name,
    type: toObjectType(dobj.type),
    description: dobj.properties?.join('. '),
    significance: dobj.significance ?? '',
    custody_history: [],
    introduced_in: sourceId,
    status: 'intact',
  }
}

/**
 * Create a StoryInstance from generation pipeline output.
 * Optional plotThreads array populates the lore plot_threads field.
 */
export function instanceFromDetailBindings(
  bindings: StoryDetailBindings,
  selection: SelectionResult | null,
  request: StoryRequest | null,
  plotThreads?: PlotThread[],
): StoryInstance {
  const sourceId = bindings.run_id ?? 'generation'
  const now = new Date().toISOString()

  const lore: StoryLore = {
    ...createEmptyLore(),
    last_updated_by: sourceId,
    characters: bindings.entity_registry.characters.map((c) =>
      detailCharacterToLore(c, sourceId),
    ),
    places: bindings.entity_registry.places.map((p) =>
      detailPlaceToLore(p, sourceId),
    ),
    objects: bindings.entity_registry.objects.map((o) =>
      detailObjectToLore(o, sourceId),
    ),
    plot_threads: plotThreads ?? [],
  }

  const metadata: InstanceMetadata = {
    instance_id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: request?.premise?.slice(0, 60) ?? 'Untitled Story',
    description: request?.premise,
    archetype_id: selection?.primary_archetype,
    archetype_name: selection?.primary_archetype,
    genre_id: selection?.primary_genre,
    genre_name: selection?.primary_genre,
    tone_preference: request?.tone_preference,
    source: 'standalone',
    run_id: bindings.run_id,
    generation_mode: 'detailed-outline',
    created_at: now,
    updated_at: now,
  }

  return { metadata, lore }
}

/**
 * Create a StoryInstance from an existing StoryLore (e.g., from a Series).
 */
export function instanceFromSeriesLore(
  lore: StoryLore,
  seriesId: string,
  title: string,
  archetypeName?: string,
  genreName?: string,
): StoryInstance {
  const now = new Date().toISOString()
  return {
    metadata: {
      instance_id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      source: 'series',
      series_id: seriesId,
      archetype_name: archetypeName,
      genre_name: genreName,
      created_at: now,
      updated_at: now,
    },
    lore: { ...lore },
  }
}

// ---------------------------------------------------------------------------
// Instance → Pipeline (export as StoryRequest constraints)
// ---------------------------------------------------------------------------

/**
 * Extract must_include constraints from an instance's lore, suitable for
 * feeding back into StoryRequest.constraints.
 */
export function instanceToConstraints(instance: StoryInstance): {
  must_include: string[]
  must_exclude: string[]
} {
  const must_include: string[] = []

  for (const c of instance.lore.characters) {
    must_include.push(`Character: ${c.name} (${c.role})`)
  }
  for (const p of instance.lore.places) {
    must_include.push(`Place: ${p.name} (${p.type})`)
  }
  for (const o of instance.lore.objects) {
    must_include.push(`Object: ${o.name} (${o.type})`)
  }
  for (const t of instance.lore.plot_threads.filter((t) => t.status !== 'resolved')) {
    must_include.push(`Plot thread: ${t.title}`)
  }

  return { must_include, must_exclude: [] }
}
