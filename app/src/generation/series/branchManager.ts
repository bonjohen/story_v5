/**
 * Branch Manager — creation, loading, and management of alternative continuations.
 *
 * A branch forks from a canon timeline at a specific episode, capturing
 * the bible state at that point and allowing independent episode generation.
 */

import type {
  Branch,
  Series,
  StoryBible,
  StateSnapshot,
  CanonTimeline,
  OverarchingArc,
} from './types.ts'

// ---------------------------------------------------------------------------
// Branch creation
// ---------------------------------------------------------------------------

export interface CreateBranchInput {
  name: string
  description: string
  /** episode_id after which the branch diverges */
  fork_after_episode: string
  /** The snapshot captured after that episode */
  fork_snapshot: StateSnapshot
}

/**
 * Create a new branch forking from a specific point in the canon timeline.
 *
 * The branch receives a copy of the bible from the fork snapshot,
 * and a copy of the canon timeline up to and including the fork episode.
 */
export function createBranch(
  series: Series,
  input: CreateBranchInput,
): Branch {
  const { name, description, fork_after_episode, fork_snapshot } = input

  // Validate fork point exists in canon
  const forkEntry = series.canon_timeline.episodes.find(
    (e) => e.episode_id === fork_after_episode,
  )
  if (!forkEntry) {
    throw new Error(
      `Fork episode ${fork_after_episode} not found in canon timeline`,
    )
  }

  // Build branch canon timeline: episodes up to and including the fork point
  const branchTimeline: CanonTimeline = {
    episodes: series.canon_timeline.episodes.filter(
      (e) => e.slot <= forkEntry.slot,
    ),
  }

  const branchId = generateBranchId(series, name)

  return {
    branch_id: branchId,
    name,
    description,
    fork_point: fork_after_episode,
    fork_snapshot_id: fork_snapshot.snapshot_id,
    canon_timeline: branchTimeline,
    bible: structuredClone(fork_snapshot.bible),
  }
}

/**
 * Generate a unique branch ID from the series and branch name.
 */
export function generateBranchId(series: Series, name: string): string {
  const existing = listBranchIds(series)
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '')
  const nextNum = existing.length + 1
  const numStr = String(nextNum).padStart(3, '0')
  return `BRANCH_${numStr}_${slug}`
}

// ---------------------------------------------------------------------------
// Branch queries
// ---------------------------------------------------------------------------

/**
 * List all branch IDs known to the series.
 *
 * In the real system, branches are discovered by scanning the branches/
 * directory. For in-memory operations, we derive IDs from the series state.
 * This is a placeholder that returns empty — callers should use the
 * disk-based listBranches from io.ts for full listings.
 */
export function listBranchIds(_series: Series): string[] {
  // In the full implementation, this would scan the branches directory.
  // For now, returns empty since branches are stored on disk, not in series.json.
  return []
}

/**
 * Get the divergence point between a branch and the main canon timeline.
 */
export function getBranchDivergenceSlot(
  series: Series,
  branch: Branch,
): number {
  const forkEntry = series.canon_timeline.episodes.find(
    (e) => e.episode_id === branch.fork_point,
  )
  return forkEntry?.slot ?? 0
}

/**
 * Compute a diff summary between the main bible and a branch's bible.
 */
export interface BibleDiffSummary {
  characters_added: string[]
  characters_removed: string[]
  characters_changed: string[]
  places_added: string[]
  places_removed: string[]
  objects_added: string[]
  objects_removed: string[]
  threads_added: string[]
  threads_removed: string[]
  threads_changed: string[]
}

export function computeBibleDiff(
  mainBible: StoryBible,
  branchBible: StoryBible,
): BibleDiffSummary {
  const mainCharIds = new Set(mainBible.characters.map((c) => c.id))
  const branchCharIds = new Set(branchBible.characters.map((c) => c.id))
  const mainPlaceIds = new Set(mainBible.places.map((p) => p.id))
  const branchPlaceIds = new Set(branchBible.places.map((p) => p.id))
  const mainObjIds = new Set(mainBible.objects.map((o) => o.id))
  const branchObjIds = new Set(branchBible.objects.map((o) => o.id))
  const mainThreadIds = new Set(mainBible.plot_threads.map((t) => t.id))
  const branchThreadIds = new Set(branchBible.plot_threads.map((t) => t.id))

  // Characters
  const characters_added = [...branchCharIds].filter((id) => !mainCharIds.has(id))
  const characters_removed = [...mainCharIds].filter((id) => !branchCharIds.has(id))
  const characters_changed: string[] = []
  for (const id of mainCharIds) {
    if (!branchCharIds.has(id)) continue
    const mainChar = mainBible.characters.find((c) => c.id === id)!
    const branchChar = branchBible.characters.find((c) => c.id === id)!
    if (mainChar.status !== branchChar.status || mainChar.current_location !== branchChar.current_location) {
      characters_changed.push(id)
    }
  }

  // Places
  const places_added = [...branchPlaceIds].filter((id) => !mainPlaceIds.has(id))
  const places_removed = [...mainPlaceIds].filter((id) => !branchPlaceIds.has(id))

  // Objects
  const objects_added = [...branchObjIds].filter((id) => !mainObjIds.has(id))
  const objects_removed = [...mainObjIds].filter((id) => !branchObjIds.has(id))

  // Threads
  const threads_added = [...branchThreadIds].filter((id) => !mainThreadIds.has(id))
  const threads_removed = [...mainThreadIds].filter((id) => !branchThreadIds.has(id))
  const threads_changed: string[] = []
  for (const id of mainThreadIds) {
    if (!branchThreadIds.has(id)) continue
    const mainThread = mainBible.plot_threads.find((t) => t.id === id)!
    const branchThread = branchBible.plot_threads.find((t) => t.id === id)!
    if (mainThread.status !== branchThread.status || mainThread.urgency !== branchThread.urgency) {
      threads_changed.push(id)
    }
  }

  return {
    characters_added,
    characters_removed,
    characters_changed,
    places_added,
    places_removed,
    objects_added,
    objects_removed,
    threads_added,
    threads_removed,
    threads_changed,
  }
}

/**
 * Check if a branch is divergent from the main canon timeline
 * (i.e., the main timeline has advanced beyond the fork point).
 */
export function isBranchDivergent(series: Series, branch: Branch): boolean {
  const forkEntry = series.canon_timeline.episodes.find(
    (e) => e.episode_id === branch.fork_point,
  )
  if (!forkEntry) return true
  const maxMainSlot = Math.max(
    0,
    ...series.canon_timeline.episodes.map((e) => e.slot),
  )
  return maxMainSlot > forkEntry.slot
}
