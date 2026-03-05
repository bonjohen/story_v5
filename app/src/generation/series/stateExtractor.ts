/**
 * State Extractor: extracts a structured StateDelta from an episode's plan
 * and scene data.
 *
 * Extends the logic of `computeElementState` from validationEngine.ts to
 * produce a full StateDelta rather than an internal snapshot. The delta
 * captures all character, place, object, faction, and plot thread changes
 * introduced by an episode, ready to be merged into the Story Lore.
 */

import type { StoryPlan, Scene, RosterEntry } from '../artifacts/types.ts'
import type { ChangeType } from '../../types/timeline.ts'
import type {
  StateDelta,
  LoreCharacter,
  LorePlace,
  LoreObject,
  PlotThread,
  CharacterUpdate,
  PlaceUpdate,
  ObjectUpdate,
  StoryLore,
  CharacterArcMilestone,
} from './types.ts'
import type { CharacterRole, PlaceType, ObjectType, ArcType } from '../../types/elements.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ExtractionInput {
  /** The episode's story plan (beats, scenes, element roster). */
  plan: StoryPlan
  /** The episode ID this delta belongs to. */
  episodeId: string
  /** The current lore state (to distinguish new vs. existing entities). */
  lore: StoryLore
  /** Scene drafts (scene_id → prose), used for future LLM-based extraction. */
  sceneDrafts?: Map<string, string>
}

/**
 * Extract a StateDelta from an episode's plan by analyzing transitions
 * across all scenes.
 *
 * This is the structural extraction path — it reads the plan's element roster
 * and scene moments/transitions to produce a deterministic delta. An LLM-backed
 * extraction path could enhance this with semantic analysis of prose.
 */
export function extractStateDelta(input: ExtractionInput): StateDelta {
  const { plan, episodeId, lore } = input
  const now = new Date().toISOString()

  const roster = plan.element_roster
  if (!roster) {
    return emptyDelta(episodeId, now)
  }

  // Collect all transitions across all scenes
  const allTransitions = collectTransitions(plan.scenes)

  // Determine which entities are new vs. existing
  const existingCharIds = new Set(lore.characters.map((c) => c.id))
  const existingPlaceIds = new Set(lore.places.map((p) => p.id))
  const existingObjectIds = new Set(lore.objects.map((o) => o.id))

  // Process characters
  const { introduced: charsIntro, updates: charUpdates } = processCharacters(
    roster.characters,
    allTransitions,
    existingCharIds,
    episodeId,
    plan.scenes,
  )

  // Process places
  const { introduced: placesIntro, updates: placeUpdates } = processPlaces(
    roster.places,
    allTransitions,
    existingPlaceIds,
    episodeId,
    plan.scenes,
  )

  // Process objects
  const { introduced: objectsIntro, updates: objectUpdates } = processObjects(
    roster.objects,
    allTransitions,
    existingObjectIds,
    episodeId,
    plan.scenes,
  )

  // Extract implied plot threads from transitions
  const threadsIntroduced = extractImpliedThreads(allTransitions, episodeId)

  return {
    episode_id: episodeId,
    extracted_at: now,
    characters_introduced: charsIntro,
    character_updates: charUpdates,
    places_introduced: placesIntro,
    place_updates: placeUpdates,
    objects_introduced: objectsIntro,
    object_updates: objectUpdates,
    threads_introduced: threadsIntroduced,
    thread_updates: [],
  }
}

// ---------------------------------------------------------------------------
// Transition collection
// ---------------------------------------------------------------------------

interface CollectedTransition {
  entity_id: string
  change: ChangeType
  target?: string
  description?: string
  scene_index: number
}

function collectTransitions(scenes: Scene[]): CollectedTransition[] {
  const transitions: CollectedTransition[] = []

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    if (!scene.moment) continue

    for (const t of scene.moment.expected_transitions) {
      transitions.push({
        entity_id: t.entity_id,
        change: t.change as ChangeType,
        target: t.target,
        description: t.description,
        scene_index: i,
      })
    }
  }

  return transitions
}

// ---------------------------------------------------------------------------
// Character processing
// ---------------------------------------------------------------------------

function processCharacters(
  rosterChars: RosterEntry[],
  transitions: CollectedTransition[],
  existingIds: Set<string>,
  episodeId: string,
  scenes: Scene[],
): { introduced: LoreCharacter[]; updates: CharacterUpdate[] } {
  const introduced: LoreCharacter[] = []
  const updates: CharacterUpdate[] = []

  for (const entry of rosterChars) {
    const entityTransitions = transitions.filter((t) => t.entity_id === entry.id)

    if (!existingIds.has(entry.id)) {
      // New character — create a full LoreCharacter
      const loreChar = rosterEntryToLoreCharacter(entry, episodeId, entityTransitions, scenes)
      introduced.push(loreChar)
    } else if (entityTransitions.length > 0) {
      // Existing character with transitions — create an update
      const update = buildCharacterUpdate(entry.id, entityTransitions, episodeId, scenes)
      updates.push(update)
    }
  }

  return { introduced, updates }
}

function rosterEntryToLoreCharacter(
  entry: RosterEntry,
  episodeId: string,
  transitions: CollectedTransition[],
  scenes: Scene[],
): LoreCharacter {
  const isDead = transitions.some((t) => t.change === 'dies')
  const knowledge = transitions
    .filter((t) => t.change === 'learns')
    .map((t) => t.description ?? t.target ?? 'unknown')
  const possessions = computePossessions(entry.id, transitions)
  const location = computeLastLocation(entry.id, scenes, transitions)

  const arcMilestones: CharacterArcMilestone[] = transitions
    .filter((t) =>
      ['transforms', 'decides', 'learns', 'bonds', 'breaks', 'dies', 'reveals'].includes(t.change),
    )
    .map((t) => ({
      episode_id: episodeId,
      change_type: t.change,
      description: t.description ?? `${t.change}${t.target ? ` (${t.target})` : ''}`,
    }))

  return {
    id: entry.id,
    name: entry.name,
    role: (entry.role_or_type as CharacterRole) ?? 'ally',
    description: entry.description,
    traits: entry.traits ?? [],
    motivations: entry.motivations ?? [],
    arc_type: null as ArcType,
    relationships: [],
    status: isDead ? 'dead' : 'alive',
    introduced_in: episodeId,
    died_in: isDead ? episodeId : undefined,
    last_appeared_in: episodeId,
    current_location: location,
    knowledge,
    possessions,
    arc_milestones: arcMilestones,
  }
}

function buildCharacterUpdate(
  characterId: string,
  transitions: CollectedTransition[],
  episodeId: string,
  scenes: Scene[],
): CharacterUpdate {
  const changes: Partial<LoreCharacter> = {
    last_appeared_in: episodeId,
  }

  const isDead = transitions.some((t) => t.change === 'dies')
  if (isDead) {
    changes.status = 'dead'
    changes.died_in = episodeId
  }

  const isTransformed = transitions.some((t) => t.change === 'transforms' && !t.target)
  if (isTransformed && !isDead) {
    changes.status = 'transformed'
  }

  const location = computeLastLocation(characterId, scenes, transitions)
  if (location) {
    changes.current_location = location
  }

  return {
    character_id: characterId,
    changes,
    transitions: transitions.map((t) => ({
      change: t.change,
      target: t.target,
      description: t.description ?? `${t.change}${t.target ? ` → ${t.target}` : ''}`,
    })),
  }
}

// ---------------------------------------------------------------------------
// Place processing
// ---------------------------------------------------------------------------

function processPlaces(
  rosterPlaces: RosterEntry[],
  _transitions: CollectedTransition[],
  existingIds: Set<string>,
  episodeId: string,
  scenes: Scene[],
): { introduced: LorePlace[]; updates: PlaceUpdate[] } {
  const introduced: LorePlace[] = []
  const updates: PlaceUpdate[] = []

  for (const entry of rosterPlaces) {
    if (!existingIds.has(entry.id)) {
      introduced.push({
        id: entry.id,
        name: entry.name,
        type: (entry.role_or_type as PlaceType) ?? 'ordinary_world',
        description: entry.description ?? '',
        introduced_in: episodeId,
        last_featured_in: episodeId,
        status: 'extant',
        events_here: [],
      })
    } else {
      // Existing place — update last_featured_in if it appears in scenes
      const appearsInScene = scenes.some(
        (s) => s.moment?.participants.places.includes(entry.id),
      )
      if (appearsInScene) {
        updates.push({
          place_id: entry.id,
          changes: { last_featured_in: episodeId },
        })
      }
    }
  }

  return { introduced, updates }
}

// ---------------------------------------------------------------------------
// Object processing
// ---------------------------------------------------------------------------

function processObjects(
  rosterObjects: RosterEntry[],
  transitions: CollectedTransition[],
  existingIds: Set<string>,
  episodeId: string,
  _scenes: Scene[],
): { introduced: LoreObject[]; updates: ObjectUpdate[] } {
  const introduced: LoreObject[] = []
  const updates: ObjectUpdate[] = []

  for (const entry of rosterObjects) {
    const objectTransitions = transitions.filter(
      (t) => t.target === entry.id && (t.change === 'gains' || t.change === 'loses'),
    )

    if (!existingIds.has(entry.id)) {
      // Determine initial holder from 'gains' transitions
      const firstGain = objectTransitions.find((t) => t.change === 'gains')
      introduced.push({
        id: entry.id,
        name: entry.name,
        type: (entry.role_or_type as ObjectType) ?? 'mcguffin',
        description: entry.description,
        significance: entry.description ?? 'Significant object',
        introduced_in: episodeId,
        status: 'intact',
        current_holder: firstGain?.entity_id,
        custody_history: firstGain
          ? [{
            holder_id: firstGain.entity_id,
            acquired_in: episodeId,
            how: 'gained' as const,
          }]
          : [],
      })
    } else if (objectTransitions.length > 0) {
      // Existing object with custody changes
      const lastGain = [...objectTransitions].reverse().find((t) => t.change === 'gains')
      const lastLose = [...objectTransitions].reverse().find((t) => t.change === 'loses')
      const changes: Partial<LoreObject> = {}

      if (lastGain && (!lastLose || lastGain.scene_index > lastLose.scene_index)) {
        changes.current_holder = lastGain.entity_id
      } else if (lastLose) {
        changes.current_holder = undefined
      }

      updates.push({
        object_id: entry.id,
        changes,
      })
    }
  }

  return { introduced, updates }
}

// ---------------------------------------------------------------------------
// Plot thread extraction
// ---------------------------------------------------------------------------

/**
 * Extract implied plot threads from significant transitions.
 * These are structural hints — the actual thread content would be enriched
 * by LLM analysis in a future phase.
 */
function extractImpliedThreads(
  transitions: CollectedTransition[],
  episodeId: string,
): PlotThread[] {
  const threads: PlotThread[] = []
  let threadIndex = 1

  // 'reveals' transitions imply a mystery/information thread
  const reveals = transitions.filter((t) => t.change === 'reveals')
  if (reveals.length > 0) {
    const participants = [...new Set(reveals.map((t) => t.entity_id))]
    threads.push({
      id: generateThreadId(threadIndex++, 'revelation'),
      title: `Revelation: ${reveals[0].description ?? 'hidden truth revealed'}`,
      description: reveals.map((r) => r.description ?? r.target ?? 'revelation').join('; '),
      status: 'open',
      urgency: 'medium',
      introduced_in: episodeId,
      progressed_in: [episodeId],
      related_characters: participants,
    })
  }

  // 'bonds'/'breaks' transitions imply relationship threads
  const relChanges = transitions.filter((t) => t.change === 'bonds' || t.change === 'breaks')
  for (const rc of relChanges) {
    if (rc.target) {
      threads.push({
        id: generateThreadId(threadIndex++, rc.change === 'bonds' ? 'alliance' : 'conflict'),
        title: `${rc.change === 'bonds' ? 'Alliance' : 'Conflict'}: ${rc.entity_id} & ${rc.target}`,
        description: rc.description ?? `${rc.entity_id} ${rc.change} with ${rc.target}`,
        status: 'open',
        urgency: rc.change === 'breaks' ? 'high' : 'medium',
        introduced_in: episodeId,
        progressed_in: [episodeId],
        related_characters: [rc.entity_id, rc.target],
      })
    }
  }

  return threads
}

function generateThreadId(index: number, slug: string): string {
  return `PT_${String(index).padStart(3, '0')}_${slug}`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computePossessions(
  entityId: string,
  transitions: CollectedTransition[],
): string[] {
  const held = new Set<string>()
  for (const t of transitions) {
    if (t.entity_id === entityId && t.change === 'gains' && t.target) {
      held.add(t.target)
    }
    if (t.entity_id === entityId && t.change === 'loses' && t.target) {
      held.delete(t.target)
    }
  }
  return [...held]
}

function computeLastLocation(
  entityId: string,
  scenes: Scene[],
  transitions: CollectedTransition[],
): string | undefined {
  // Check 'arrives' transitions last-to-first
  for (let i = transitions.length - 1; i >= 0; i--) {
    const t = transitions[i]
    if (t.entity_id === entityId && t.change === 'arrives' && t.target) {
      return t.target
    }
  }

  // Fall back to the last scene where the character appears
  for (let i = scenes.length - 1; i >= 0; i--) {
    const scene = scenes[i]
    if (!scene.moment) continue
    if (scene.moment.participants.characters.includes(entityId)) {
      if (scene.moment.participants.places.length > 0) {
        return scene.moment.participants.places[0]
      }
    }
  }

  return undefined
}

function emptyDelta(episodeId: string, extractedAt: string): StateDelta {
  return {
    episode_id: episodeId,
    extracted_at: extractedAt,
    characters_introduced: [],
    character_updates: [],
    places_introduced: [],
    place_updates: [],
    objects_introduced: [],
    object_updates: [],
    threads_introduced: [],
    thread_updates: [],
  }
}
