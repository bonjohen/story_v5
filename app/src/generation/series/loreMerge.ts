/**
 * Lore Merge: applies a StateDelta to a StoryLore, producing an updated lore.
 *
 * This is the core canonization logic. When an episode is canonized:
 * 1. Its StateDelta is extracted (see stateExtractor.ts)
 * 2. This module merges the delta into the lore
 * 3. A snapshot is created at the episode boundary
 *
 * The merge is deterministic and immutable — it returns a new lore object.
 */

import type {
  StoryLore,
  StateDelta,
  LoreCharacter,
  LorePlace,
  LoreObject,
  LoreFaction,
  PlotThread,
  CharacterUpdate,
  PlaceUpdate,
  ObjectUpdate,
  FactionUpdate,
  ThreadUpdate,
  LoreEvent,
  StateSnapshot,
  OverarchingArc,
  Episode,
  Series,
  CanonTimelineEntry,
} from './types.ts'
import { generateSnapshotId } from './io.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Merge a StateDelta into a StoryLore, returning a new lore.
 * Does not mutate the input lore.
 */
export function mergeDeltaIntoLore(
  lore: StoryLore,
  delta: StateDelta,
): StoryLore {
  const now = new Date().toISOString()

  // Start with a deep copy
  const updated: StoryLore = {
    schema_version: lore.schema_version,
    last_updated: now,
    last_updated_by: delta.episode_id,

    characters: mergeCharacters(lore.characters, delta),
    places: mergePlaces(lore.places, delta),
    objects: mergeObjects(lore.objects, delta),
    factions: mergeFactions(lore.factions, delta),
    plot_threads: mergeThreads(lore.plot_threads, delta),
    world_rules: [...lore.world_rules],
    event_log: [...lore.event_log],
  }

  return updated
}

/**
 * Create a state snapshot at an episode boundary.
 */
export function createSnapshot(
  episodeSlot: number,
  episodeId: string,
  lore: StoryLore,
  arc: OverarchingArc,
): StateSnapshot {
  return {
    snapshot_id: generateSnapshotId(episodeSlot),
    after_episode: episodeId,
    created_at: new Date().toISOString(),
    lore: structuredClone(lore),
    overarching_arc: structuredClone(arc),
  }
}

/**
 * Canonize an episode: merge its delta into the lore, update the series,
 * and return the updated lore and snapshot.
 *
 * This is the high-level canonization entry point.
 */
export function canonizeEpisode(
  series: Series,
  episode: Episode,
  delta: StateDelta,
): { lore: StoryLore; snapshot: StateSnapshot; series: Series } {
  // 1. Merge delta into lore
  const updatedLore = mergeDeltaIntoLore(series.lore, delta)

  // 2. Handle arc phase change if present
  let updatedArc = { ...series.overarching_arc }
  if (delta.arc_phase_change) {
    updatedArc = advanceArc(updatedArc, delta.arc_phase_change.to_phase, episode.episode_id)
  }

  // 3. Create snapshot
  const snapshot = createSnapshot(episode.slot_number, episode.episode_id, updatedLore, updatedArc)

  // 4. Update episode status
  episode.canon_status = 'canon'
  episode.canonized_at = new Date().toISOString()

  // 5. Update series
  const updatedSeries: Series = {
    ...series,
    lore: updatedLore,
    overarching_arc: updatedArc,
    updated_at: new Date().toISOString(),
    episode_count: series.episode_count + 1,
    canon_timeline: {
      episodes: [
        ...series.canon_timeline.episodes,
        {
          slot: episode.slot_number,
          episode_id: episode.episode_id,
          title: episode.title,
          canonized_at: episode.canonized_at!,
          overarching_phase: episode.overarching_phase,
          snapshot_id: snapshot.snapshot_id,
        },
      ],
    },
    // Mark the slot as canonized
    slots: series.slots.map((s) =>
      s.slot_number === episode.slot_number
        ? { ...s, canon_episode: episode.episode_id, status: 'canonized' as const }
        : s,
    ),
    // Update episode index
    episode_index: {
      episodes: series.episode_index.episodes.map((e) => {
        if (e.episode_id === episode.episode_id) {
          return { ...e, canon_status: 'canon' as const }
        }
        // Mark other candidates for this slot as alternate
        if (e.slot_number === episode.slot_number && e.canon_status === 'draft') {
          return { ...e, canon_status: 'alternate' as const }
        }
        return e
      }),
    },
  }

  return { lore: updatedLore, snapshot, series: updatedSeries }
}

/**
 * De-canonize an episode: revert the lore to a prior snapshot.
 *
 * Returns the list of subsequent canon episodes that may be invalidated.
 */
export function deCanonizeEpisode(
  series: Series,
  episodeId: string,
  priorSnapshot: StateSnapshot,
): { series: Series; invalidatedEpisodes: string[] } {
  const canonEntry = series.canon_timeline.episodes.find((e) => e.episode_id === episodeId)
  if (!canonEntry) {
    throw new Error(`Episode ${episodeId} is not in the canon timeline`)
  }

  const slot = canonEntry.slot

  // Find all subsequent canon episodes
  const invalidated = series.canon_timeline.episodes
    .filter((e) => e.slot > slot)
    .map((e) => e.episode_id)

  // Revert lore and arc to snapshot
  const updatedSeries: Series = {
    ...series,
    lore: structuredClone(priorSnapshot.lore),
    overarching_arc: structuredClone(priorSnapshot.overarching_arc),
    updated_at: new Date().toISOString(),
    episode_count: series.episode_count - 1,
    // Remove from canon timeline
    canon_timeline: {
      episodes: series.canon_timeline.episodes.filter((e) => e.episode_id !== episodeId),
    },
    // Revert slot status
    slots: series.slots.map((s) =>
      s.slot_number === slot
        ? { ...s, canon_episode: undefined, status: 'reviewing' as const }
        : s,
    ),
    // Mark episode as alternate
    episode_index: {
      episodes: series.episode_index.episodes.map((e) =>
        e.episode_id === episodeId
          ? { ...e, canon_status: 'alternate' as const }
          : e,
      ),
    },
  }

  return { series: updatedSeries, invalidatedEpisodes: invalidated }
}

// ---------------------------------------------------------------------------
// Character merge
// ---------------------------------------------------------------------------

function mergeCharacters(
  existing: LoreCharacter[],
  delta: StateDelta,
): LoreCharacter[] {
  const result = existing.map((char) => {
    const update = delta.character_updates.find((u) => u.character_id === char.id)
    if (!update) return char
    return applyCharacterUpdate(char, update, delta.episode_id)
  })

  // Add newly introduced characters
  for (const newChar of delta.characters_introduced) {
    if (!result.some((c) => c.id === newChar.id)) {
      result.push(newChar)
    }
  }

  return result
}

function applyCharacterUpdate(
  char: LoreCharacter,
  update: CharacterUpdate,
  episodeId: string,
): LoreCharacter {
  const updated = { ...char }

  // Apply explicit changes
  if (update.changes.status !== undefined) updated.status = update.changes.status
  if (update.changes.died_in !== undefined) updated.died_in = update.changes.died_in
  if (update.changes.last_appeared_in !== undefined) updated.last_appeared_in = update.changes.last_appeared_in
  if (update.changes.current_location !== undefined) updated.current_location = update.changes.current_location

  // Accumulate knowledge from 'learns' transitions
  const newKnowledge = update.transitions
    .filter((t) => t.change === 'learns')
    .map((t) => t.description)
  if (newKnowledge.length > 0) {
    updated.knowledge = [...char.knowledge, ...newKnowledge]
  }

  // Accumulate possessions from 'gains'/'loses' transitions
  const possessions = new Set(char.possessions)
  for (const t of update.transitions) {
    if (t.change === 'gains' && t.target) possessions.add(t.target)
    if (t.change === 'loses' && t.target) possessions.delete(t.target)
  }
  updated.possessions = [...possessions]

  // Add arc milestones for significant transitions
  const significantChanges: string[] = ['transforms', 'decides', 'learns', 'bonds', 'breaks', 'dies', 'reveals']
  const newMilestones = update.transitions
    .filter((t) => significantChanges.includes(t.change))
    .map((t) => ({
      episode_id: episodeId,
      change_type: t.change,
      description: t.description,
    }))
  if (newMilestones.length > 0) {
    updated.arc_milestones = [...char.arc_milestones, ...newMilestones]
  }

  return updated
}

// ---------------------------------------------------------------------------
// Place merge
// ---------------------------------------------------------------------------

function mergePlaces(existing: LorePlace[], delta: StateDelta): LorePlace[] {
  const result = existing.map((place) => {
    const update = delta.place_updates.find((u) => u.place_id === place.id)
    if (!update) return place
    return applyPlaceUpdate(place, update)
  })

  for (const newPlace of delta.places_introduced) {
    if (!result.some((p) => p.id === newPlace.id)) {
      result.push(newPlace)
    }
  }

  return result
}

function applyPlaceUpdate(place: LorePlace, update: PlaceUpdate): LorePlace {
  return {
    ...place,
    ...update.changes,
    // Preserve arrays by merging rather than replacing
    events_here: update.changes.events_here
      ? [...place.events_here, ...update.changes.events_here]
      : place.events_here,
  }
}

// ---------------------------------------------------------------------------
// Object merge
// ---------------------------------------------------------------------------

function mergeObjects(existing: LoreObject[], delta: StateDelta): LoreObject[] {
  const result = existing.map((obj) => {
    const update = delta.object_updates.find((u) => u.object_id === obj.id)
    if (!update) return obj
    return applyObjectUpdate(obj, update)
  })

  for (const newObj of delta.objects_introduced) {
    if (!result.some((o) => o.id === newObj.id)) {
      result.push(newObj)
    }
  }

  return result
}

function applyObjectUpdate(obj: LoreObject, update: ObjectUpdate): LoreObject {
  return {
    ...obj,
    ...update.changes,
    // Preserve custody history
    custody_history: update.changes.custody_history
      ? [...obj.custody_history, ...update.changes.custody_history]
      : obj.custody_history,
  }
}

// ---------------------------------------------------------------------------
// Faction merge
// ---------------------------------------------------------------------------

function mergeFactions(existing: LoreFaction[], delta: StateDelta): LoreFaction[] {
  const result = existing.map((faction) => {
    const update = delta.faction_updates?.find((u) => u.faction_id === faction.id)
    if (!update) return faction
    return { ...faction, ...update.changes }
  })

  if (delta.factions_introduced) {
    for (const newFaction of delta.factions_introduced) {
      if (!result.some((f) => f.id === newFaction.id)) {
        result.push(newFaction)
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Plot thread merge
// ---------------------------------------------------------------------------

function mergeThreads(existing: PlotThread[], delta: StateDelta): PlotThread[] {
  const result = existing.map((thread) => {
    const update = delta.thread_updates.find((u) => u.thread_id === thread.id)
    if (!update) return thread
    return applyThreadUpdate(thread, update, delta.episode_id)
  })

  for (const newThread of delta.threads_introduced) {
    if (!result.some((t) => t.id === newThread.id)) {
      result.push(newThread)
    }
  }

  return result
}

function applyThreadUpdate(
  thread: PlotThread,
  update: ThreadUpdate,
  episodeId: string,
): PlotThread {
  const updated = { ...thread }

  if (update.status_change) {
    updated.status = update.status_change
    if (update.status_change === 'resolved') {
      updated.resolved_in = episodeId
    }
  }

  // Always mark episode as progressed_in
  updated.progressed_in = [...thread.progressed_in, episodeId]

  return updated
}

// ---------------------------------------------------------------------------
// Arc advancement
// ---------------------------------------------------------------------------

function advanceArc(
  arc: OverarchingArc,
  targetPhase: string,
  episodeId: string,
): OverarchingArc {
  const updated = { ...arc }

  // Close the current phase
  updated.phase_history = arc.phase_history.map((entry) => {
    if (entry.node_id === arc.current_phase && !entry.exited_at_episode) {
      return { ...entry, exited_at_episode: episodeId }
    }
    return entry
  })

  // Enter the new phase
  updated.phase_history.push({
    node_id: targetPhase,
    entered_at_episode: episodeId,
  })

  updated.current_phase = targetPhase
  updated.remaining_phases = arc.remaining_phases.filter((p) => p !== targetPhase)

  return updated
}

// ---------------------------------------------------------------------------
// Lore validation (consistency checks)
// ---------------------------------------------------------------------------

export interface LoreValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate a lore for internal consistency.
 * Run after merging a delta, before creating a snapshot.
 */
export function validateLore(lore: StoryLore): LoreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. No character dies twice
  const deadChars = lore.characters.filter((c) => c.status === 'dead')
  for (const char of deadChars) {
    if (!char.died_in) {
      errors.push(`Character '${char.name}' (${char.id}) is dead but has no died_in episode`)
    }
  }

  // 2. Dead characters should not have 'alive' status
  for (const char of lore.characters) {
    if (char.died_in && char.status !== 'dead') {
      errors.push(`Character '${char.name}' (${char.id}) has died_in=${char.died_in} but status=${char.status}`)
    }
  }

  // 3. Object custody: holder must exist
  for (const obj of lore.objects) {
    if (obj.current_holder) {
      const holderIsChar = lore.characters.some((c) => c.id === obj.current_holder)
      const holderIsPlace = lore.places.some((p) => p.id === obj.current_holder)
      if (!holderIsChar && !holderIsPlace) {
        warnings.push(`Object '${obj.name}' (${obj.id}) holder '${obj.current_holder}' not found in lore`)
      }
    }
  }

  // 4. Character location: location must exist as a place
  for (const char of lore.characters) {
    if (char.current_location) {
      const placeExists = lore.places.some((p) => p.id === char.current_location)
      if (!placeExists) {
        warnings.push(`Character '${char.name}' location '${char.current_location}' not found in lore places`)
      }
    }
  }

  // 5. Relationship targets must exist
  for (const char of lore.characters) {
    for (const rel of char.relationships) {
      const targetExists = lore.characters.some((c) => c.id === rel.target_id)
      if (!targetExists) {
        warnings.push(`Character '${char.name}' has relationship to unknown target '${rel.target_id}'`)
      }
    }
  }

  // 6. Plot threads: resolved threads should have resolved_in
  for (const thread of lore.plot_threads) {
    if (thread.status === 'resolved' && !thread.resolved_in) {
      warnings.push(`Plot thread '${thread.title}' (${thread.id}) is resolved but has no resolved_in episode`)
    }
  }

  // 7. Critical urgency threads check
  const criticalOpen = lore.plot_threads.filter(
    (t) => t.urgency === 'critical' && t.status === 'open',
  )
  if (criticalOpen.length > 0) {
    warnings.push(
      `${criticalOpen.length} critical plot thread(s) remain open: ${criticalOpen.map((t) => t.id).join(', ')}`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate that an episode's delta is consistent with the current lore.
 * Run before canonization to catch contradictions.
 */
export function validateDeltaAgainstLore(
  lore: StoryLore,
  delta: StateDelta,
): LoreValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Mortality: characters marked dead in lore should not appear in updates
  //    (unless the update is adding a 'reveals' transition — e.g., faked death)
  for (const update of delta.character_updates) {
    const loreChar = lore.characters.find((c) => c.id === update.character_id)
    if (loreChar && loreChar.status === 'dead') {
      const hasReveal = update.transitions.some((t) => t.change === 'reveals')
      if (!hasReveal) {
        errors.push(
          `Character '${loreChar.name}' (${update.character_id}) is dead in the lore but appears with transitions in episode ${delta.episode_id}`,
        )
      }
    }
  }

  // 2. Introduced characters must not already exist
  for (const newChar of delta.characters_introduced) {
    if (lore.characters.some((c) => c.id === newChar.id)) {
      errors.push(
        `Character '${newChar.name}' (${newChar.id}) is listed as newly introduced but already exists in the lore`,
      )
    }
  }

  // 3. Updated entities must exist
  for (const update of delta.character_updates) {
    if (!lore.characters.some((c) => c.id === update.character_id)) {
      errors.push(`Character update references unknown character '${update.character_id}'`)
    }
  }

  for (const update of delta.place_updates) {
    if (!lore.places.some((p) => p.id === update.place_id)) {
      errors.push(`Place update references unknown place '${update.place_id}'`)
    }
  }

  for (const update of delta.object_updates) {
    if (!lore.objects.some((o) => o.id === update.object_id)) {
      errors.push(`Object update references unknown object '${update.object_id}'`)
    }
  }

  // 4. Resolved threads should not be reopened
  for (const update of delta.thread_updates) {
    const thread = lore.plot_threads.find((t) => t.id === update.thread_id)
    if (thread && thread.status === 'resolved' && update.status_change === 'open') {
      errors.push(
        `Plot thread '${thread.title}' (${update.thread_id}) was resolved but delta tries to reopen it`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
