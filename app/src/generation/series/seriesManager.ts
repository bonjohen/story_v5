/**
 * Series Manager: high-level series management operations including
 * plot thread lifecycle, arc phase advancement, genre accent selection,
 * and thread prioritization.
 *
 * Phase 5 of the Chapter Stories implementation.
 */

import type {
  Series,
  StoryLore,
  PlotThread,
  OverarchingArc,
  ThreadPriority,
  EpisodeSlot,
  CanonTimeline,
  ThemeToneAnchor,
} from './types.ts'
import type { StoryGraph } from '../../types/graph.ts'
import type {
  GenreBlendingModel,
  LoadedCorpus,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Thread Lifecycle Management
// ---------------------------------------------------------------------------

/** Summary of a thread's age and activity. */
export interface ThreadAgeInfo {
  thread_id: string
  title: string
  urgency: PlotThread['urgency']
  status: PlotThread['status']
  /** Number of canon episodes since thread was introduced. */
  age_in_episodes: number
  /** Number of canon episodes since last progression. */
  episodes_since_progression: number
  /** Whether this thread is considered stalled. */
  stalled: boolean
}

/** Config for urgency escalation thresholds. */
export interface EscalationConfig {
  /** Episodes without progression before escalating from low → medium. */
  low_to_medium: number
  /** Episodes without progression before escalating from medium → high. */
  medium_to_high: number
  /** Episodes without progression before escalating from high → critical. */
  high_to_critical: number
}

const DEFAULT_ESCALATION: EscalationConfig = {
  low_to_medium: 3,
  medium_to_high: 2,
  high_to_critical: 2,
}

/**
 * Compute age and staleness info for all open/progressing threads.
 */
export function computeThreadAges(
  lore: StoryLore,
  canonTimeline: CanonTimeline,
): ThreadAgeInfo[] {
  const canonEpisodeIds = canonTimeline.episodes.map((e) => e.episode_id)
  const totalCanon = canonEpisodeIds.length

  return lore.plot_threads
    .filter((t) => t.status === 'open' || t.status === 'progressing')
    .map((thread) => {
      // Age: episodes since introduction
      const introIndex = canonEpisodeIds.indexOf(thread.introduced_in)
      const age = introIndex >= 0 ? totalCanon - introIndex : totalCanon

      // Last progression
      const progressionEpisodes = thread.progressed_in.filter((ep) =>
        canonEpisodeIds.includes(ep),
      )
      let episodesSinceProgression: number
      if (progressionEpisodes.length === 0) {
        episodesSinceProgression = age
      } else {
        const lastProgression = progressionEpisodes[progressionEpisodes.length - 1]
        const lastIndex = canonEpisodeIds.indexOf(lastProgression)
        episodesSinceProgression = lastIndex >= 0 ? totalCanon - 1 - lastIndex : age
      }

      // Stalled = 2+ episodes without progression for non-low urgency
      const stalled =
        thread.urgency !== 'low' && episodesSinceProgression >= 2

      return {
        thread_id: thread.id,
        title: thread.title,
        urgency: thread.urgency,
        status: thread.status,
        age_in_episodes: age,
        episodes_since_progression: episodesSinceProgression,
        stalled,
      }
    })
}

/**
 * Return threads whose urgency should be escalated based on episodes
 * without progression. Does not mutate — returns proposed changes.
 */
export function proposeUrgencyEscalations(
  lore: StoryLore,
  canonTimeline: CanonTimeline,
  config: EscalationConfig = DEFAULT_ESCALATION,
): Array<{ thread_id: string; current_urgency: PlotThread['urgency']; proposed_urgency: PlotThread['urgency'] }> {
  const ages = computeThreadAges(lore, canonTimeline)
  const escalations: Array<{
    thread_id: string
    current_urgency: PlotThread['urgency']
    proposed_urgency: PlotThread['urgency']
  }> = []

  for (const info of ages) {
    const gap = info.episodes_since_progression
    let proposed: PlotThread['urgency'] | null = null

    if (info.urgency === 'low' && gap >= config.low_to_medium) {
      proposed = 'medium'
    } else if (info.urgency === 'medium' && gap >= config.medium_to_high) {
      proposed = 'high'
    } else if (info.urgency === 'high' && gap >= config.high_to_critical) {
      proposed = 'critical'
    }

    if (proposed) {
      escalations.push({
        thread_id: info.thread_id,
        current_urgency: info.urgency,
        proposed_urgency: proposed,
      })
    }
  }

  return escalations
}

/**
 * Apply urgency escalations to the lore's plot threads.
 * Returns a new lore (immutable).
 */
export function applyUrgencyEscalations(
  lore: StoryLore,
  escalations: Array<{ thread_id: string; proposed_urgency: PlotThread['urgency'] }>,
): StoryLore {
  if (escalations.length === 0) return lore

  const escalationMap = new Map(escalations.map((e) => [e.thread_id, e.proposed_urgency]))

  return {
    ...lore,
    plot_threads: lore.plot_threads.map((t) => {
      const proposed = escalationMap.get(t.id)
      if (proposed) return { ...t, urgency: proposed }
      return t
    }),
  }
}

/** Thread health: ratio of recently-progressed threads to total open threads. */
export interface ThreadHealthMetrics {
  total_open: number
  recently_progressed: number
  stalled_count: number
  critical_count: number
  /** Ratio of recently-progressed to total open (1.0 = all healthy). */
  health_ratio: number
  /** Overall assessment. */
  status: 'healthy' | 'warning' | 'critical'
}

/**
 * Compute thread health metrics for the series.
 */
export function computeThreadHealth(
  lore: StoryLore,
  canonTimeline: CanonTimeline,
): ThreadHealthMetrics {
  const ages = computeThreadAges(lore, canonTimeline)
  const totalOpen = ages.length
  if (totalOpen === 0) {
    return { total_open: 0, recently_progressed: 0, stalled_count: 0, critical_count: 0, health_ratio: 1.0, status: 'healthy' }
  }

  const stalledCount = ages.filter((a) => a.stalled).length
  const criticalCount = ages.filter((a) => a.urgency === 'critical').length
  const recentlyProgressed = ages.filter((a) => a.episodes_since_progression <= 1).length
  const healthRatio = recentlyProgressed / totalOpen

  let status: ThreadHealthMetrics['status'] = 'healthy'
  if (criticalCount >= 2 || healthRatio < 0.3) {
    status = 'critical'
  } else if (stalledCount >= 2 || healthRatio < 0.6) {
    status = 'warning'
  }

  return {
    total_open: totalOpen,
    recently_progressed: recentlyProgressed,
    stalled_count: stalledCount,
    critical_count: criticalCount,
    health_ratio: healthRatio,
    status,
  }
}

// ---------------------------------------------------------------------------
// Thread Priority Suggestion
// ---------------------------------------------------------------------------

/**
 * Suggest thread priorities for the next episode based on
 * urgency, staleness, and arc phase.
 */
export function suggestThreadPriorities(
  lore: StoryLore,
  canonTimeline: CanonTimeline,
  maxThreads: number = 4,
): ThreadPriority[] {
  const ages = computeThreadAges(lore, canonTimeline)
  const priorities: ThreadPriority[] = []

  // Sort by urgency (critical first), then by staleness
  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...ages].sort((a, b) => {
    const urgDiff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
    if (urgDiff !== 0) return urgDiff
    return b.episodes_since_progression - a.episodes_since_progression
  })

  for (const info of sorted.slice(0, maxThreads)) {
    let action: ThreadPriority['action']

    if (info.urgency === 'critical' && info.episodes_since_progression >= 3) {
      action = 'resolve'
    } else if (info.stalled || info.urgency === 'critical') {
      action = 'advance'
    } else if (info.episodes_since_progression === 0) {
      action = 'maintain'
    } else {
      action = 'advance'
    }

    priorities.push({ thread_id: info.thread_id, action })
  }

  return priorities
}

// ---------------------------------------------------------------------------
// Arc Phase Advancement
// ---------------------------------------------------------------------------

export interface ArcAdvancementSuggestion {
  should_advance: boolean
  current_phase: string
  next_phase: string | null
  reasons: string[]
  /** Confidence: 'strong' if most conditions met, 'tentative' if partial. */
  confidence: 'strong' | 'tentative'
}

/**
 * Analyze whether the overarching arc should advance to the next phase.
 * Checks exit conditions of current phase and entry conditions of next.
 */
export function suggestArcAdvancement(
  series: Series,
  archetypeGraph: StoryGraph,
): ArcAdvancementSuggestion {
  const arc = series.overarching_arc
  const { lore, canon_timeline } = series

  // Find the current phase node in the archetype graph
  const currentNode = archetypeGraph.nodes.find((n) => n.node_id === arc.current_phase)

  // Find next phase
  const nextPhase = arc.remaining_phases.length > 0 ? arc.remaining_phases[0] : null
  const nextNode = nextPhase
    ? archetypeGraph.nodes.find((n) => n.node_id === nextPhase)
    : null

  if (!nextPhase) {
    return {
      should_advance: false,
      current_phase: arc.current_phase,
      next_phase: null,
      reasons: ['No remaining phases — arc is complete'],
      confidence: 'strong',
    }
  }

  const reasons: string[] = []
  let conditionsMet = 0
  let totalConditions = 0

  // Check current phase exit conditions
  if (currentNode && currentNode.exit_conditions.length > 0) {
    totalConditions += currentNode.exit_conditions.length
    // Heuristic: check if canon episodes in this phase suggest conditions met
    const episodesInPhase = canon_timeline.episodes.filter(
      (e) => e.overarching_phase === arc.current_phase,
    )
    if (episodesInPhase.length >= 2) {
      conditionsMet += Math.min(currentNode.exit_conditions.length, episodesInPhase.length - 1)
      reasons.push(`${episodesInPhase.length} episodes have explored current phase`)
    }

    // Check thread resolutions as milestone indicators
    const resolvedInPhase = lore.plot_threads.filter((t) => {
      if (t.status !== 'resolved' || !t.resolved_in) return false
      return canon_timeline.episodes.some(
        (e) => e.episode_id === t.resolved_in && e.overarching_phase === arc.current_phase,
      )
    })
    if (resolvedInPhase.length > 0) {
      conditionsMet++
      reasons.push(`${resolvedInPhase.length} plot thread(s) resolved in current phase`)
    }

    // Check character arc milestones
    const milestonesInPhase = lore.characters.flatMap((c) =>
      c.arc_milestones.filter((m) =>
        canon_timeline.episodes.some(
          (e) => e.episode_id === m.episode_id && e.overarching_phase === arc.current_phase,
        ),
      ),
    )
    if (milestonesInPhase.length >= 2) {
      conditionsMet++
      reasons.push(`${milestonesInPhase.length} character arc milestones reached`)
    }
  }

  // Check if next phase entry conditions are plausible
  if (nextNode && nextNode.entry_conditions.length > 0) {
    totalConditions += nextNode.entry_conditions.length
    // Basic heuristic: if there are alive characters and open threads, we can proceed
    const aliveChars = lore.characters.filter((c) => c.status === 'alive').length
    if (aliveChars > 0) {
      conditionsMet++
      reasons.push(`${aliveChars} alive character(s) can carry the arc forward`)
    }
  }

  // Decision
  const ratio = totalConditions > 0 ? conditionsMet / totalConditions : 0
  const shouldAdvance = ratio >= 0.5
  const confidence = ratio >= 0.75 ? 'strong' : 'tentative'

  if (!shouldAdvance) {
    reasons.push('Not enough conditions met for phase advancement')
  }

  return {
    should_advance: shouldAdvance,
    current_phase: arc.current_phase,
    next_phase: nextPhase,
    reasons,
    confidence,
  }
}

/**
 * Get the next phase in the overarching arc, or null if complete.
 */
export function getNextArcPhase(arc: OverarchingArc): string | null {
  return arc.remaining_phases.length > 0 ? arc.remaining_phases[0] : null
}

/**
 * Check if the arc has reached its terminal phase (no remaining phases).
 */
export function isArcComplete(arc: OverarchingArc): boolean {
  return arc.remaining_phases.length === 0
}

/**
 * Count how many episodes have been spent in the current phase.
 */
export function episodesInCurrentPhase(
  arc: OverarchingArc,
  canonTimeline: CanonTimeline,
): number {
  return canonTimeline.episodes.filter(
    (e) => e.overarching_phase === arc.current_phase,
  ).length
}

// ---------------------------------------------------------------------------
// Genre Accent Variation
// ---------------------------------------------------------------------------

export interface AccentOption {
  genre_id: string
  genre_name: string
  blend_stability: 'stable' | 'conditionally_stable' | 'unstable'
  rationale: string
}

/**
 * Get compatible genre accents for a series based on its primary genre
 * and the genre blending model.
 */
export function getCompatibleAccents(
  primaryGenreId: string,
  corpus: LoadedCorpus,
): AccentOption[] {
  const blendingModel = corpus.blendingModel
  const accents: AccentOption[] = []

  for (const blend of blendingModel.blends) {
    // Check if this blend involves the primary genre
    const genres = blend.genres as string[]
    if (!genres.includes(primaryGenreId)) continue

    // The accent is the other genre in the blend
    const accentId = genres.find((g) => g !== primaryGenreId)
    if (!accentId) continue

    // Get genre name from graphs
    const accentGraph = corpus.genreGraphs.get(accentId)
    const accentName = accentGraph?.name ?? accentId

    // Only suggest stable or conditionally stable blends
    const stability = blend.stability as AccentOption['blend_stability']

    accents.push({
      genre_id: accentId,
      genre_name: accentName,
      blend_stability: stability,
      rationale: blend.tone_synthesis as string ?? '',
    })
  }

  // Sort: stable first, then conditionally_stable, then unstable
  const stabilityOrder: Record<string, number> = {
    stable: 0,
    conditionally_stable: 1,
    unstable: 2,
  }
  accents.sort(
    (a, b) => (stabilityOrder[a.blend_stability] ?? 2) - (stabilityOrder[b.blend_stability] ?? 2),
  )

  return accents
}

/**
 * Check if a genre accent is compatible with the primary genre.
 */
export function isAccentCompatible(
  primaryGenreId: string,
  accentGenreId: string,
  corpus: LoadedCorpus,
): { compatible: boolean; stability: string | null; warnings: string[] } {
  const blendingModel = corpus.blendingModel

  for (const blend of blendingModel.blends) {
    const genres = blend.genres as string[]
    if (genres.includes(primaryGenreId) && genres.includes(accentGenreId)) {
      const stability = blend.stability as string
      const warnings: string[] = []
      if (stability === 'unstable') {
        warnings.push(`This blend is classified as unstable: ${blend.resolution_strategy ?? 'use with caution'}`)
      }
      return { compatible: true, stability, warnings }
    }
  }

  return { compatible: false, stability: null, warnings: [`No blend model found for ${primaryGenreId} × ${accentGenreId}`] }
}

// ---------------------------------------------------------------------------
// Slot Management
// ---------------------------------------------------------------------------

/**
 * Create a new episode slot for the series.
 * Returns the updated series (immutable).
 */
export function createEpisodeSlot(
  series: Series,
  targetPhase?: string,
): { series: Series; slot: EpisodeSlot } {
  const nextSlotNumber = series.slots.length > 0
    ? Math.max(...series.slots.map((s) => s.slot_number)) + 1
    : 1

  const slot: EpisodeSlot = {
    slot_number: nextSlotNumber,
    target_arc_phase: targetPhase ?? series.overarching_arc.current_phase,
    candidates: [],
    status: 'generating',
  }

  const updatedSeries: Series = {
    ...series,
    slots: [...series.slots, slot],
    updated_at: new Date().toISOString(),
  }

  return { series: updatedSeries, slot }
}

/**
 * Get the next empty slot (no candidates) or create one.
 */
export function getOrCreateNextSlot(
  series: Series,
): { series: Series; slot: EpisodeSlot } {
  const emptySlot = series.slots.find((s) => s.candidates.length === 0)
  if (emptySlot) return { series, slot: emptySlot }
  return createEpisodeSlot(series)
}

/**
 * Summary of the current series state for display.
 */
export interface SeriesStatusSummary {
  title: string
  episode_count: number
  current_arc_phase: string
  arc_progress_pct: number
  arc_complete: boolean
  open_threads: number
  stalled_threads: number
  critical_threads: number
  thread_health: ThreadHealthMetrics['status']
  next_slot_number: number
}

/**
 * Build a summary of the series current state.
 */
export function getSeriesStatus(series: Series): SeriesStatusSummary {
  const arc = series.overarching_arc
  const totalPhases = arc.phase_history.length + arc.remaining_phases.length
  const completedPhases = arc.phase_history.filter((p) => p.exited_at_episode).length
  const arcProgress = totalPhases > 0 ? completedPhases / totalPhases : 0

  const threadHealth = computeThreadHealth(series.lore, series.canon_timeline)

  const nextSlot = series.slots.length > 0
    ? Math.max(...series.slots.map((s) => s.slot_number)) + 1
    : 1

  return {
    title: series.title,
    episode_count: series.episode_count,
    current_arc_phase: arc.current_phase,
    arc_progress_pct: Math.round(arcProgress * 100),
    arc_complete: arc.remaining_phases.length === 0,
    open_threads: threadHealth.total_open,
    stalled_threads: threadHealth.stalled_count,
    critical_threads: threadHealth.critical_count,
    thread_health: threadHealth.status,
    next_slot_number: nextSlot,
  }
}
