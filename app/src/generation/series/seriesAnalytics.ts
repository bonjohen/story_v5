/**
 * Series Analytics — statistics and metrics for series-level reporting.
 *
 * Computes aggregate statistics across the canon timeline:
 * character arc progression, plot thread resolution rates,
 * and series-level summaries.
 */

import type {
  Series,
  StoryLore,
  Episode,
  LoreCharacter,
  PlotThread,
  OverarchingArc,
  CanonTimeline,
} from './types.ts'

// ---------------------------------------------------------------------------
// Series overview statistics
// ---------------------------------------------------------------------------

export interface SeriesOverviewStats {
  total_episodes: number
  total_candidates_generated: number
  canon_episodes: number
  alternate_episodes: number
  draft_episodes: number
  total_characters: number
  alive_characters: number
  dead_characters: number
  total_places: number
  total_objects: number
  total_factions: number
  total_plot_threads: number
  open_threads: number
  resolved_threads: number
  abandoned_threads: number
  world_rules_count: number
  event_count: number
}

export function computeSeriesOverview(series: Series): SeriesOverviewStats {
  const lore = series.lore
  const episodes = series.episode_index.episodes

  return {
    total_episodes: episodes.length,
    total_candidates_generated: series.total_candidates_generated,
    canon_episodes: episodes.filter((e) => e.canon_status === 'canon').length,
    alternate_episodes: episodes.filter((e) => e.canon_status === 'alternate').length,
    draft_episodes: episodes.filter((e) => e.canon_status === 'draft').length,
    total_characters: lore.characters.length,
    alive_characters: lore.characters.filter((c) => c.status === 'alive').length,
    dead_characters: lore.characters.filter((c) => c.status === 'dead').length,
    total_places: lore.places.length,
    total_objects: lore.objects.length,
    total_factions: lore.factions.length,
    total_plot_threads: lore.plot_threads.length,
    open_threads: lore.plot_threads.filter((t) => t.status === 'open' || t.status === 'progressing').length,
    resolved_threads: lore.plot_threads.filter((t) => t.status === 'resolved').length,
    abandoned_threads: lore.plot_threads.filter((t) => t.status === 'abandoned').length,
    world_rules_count: lore.world_rules.length,
    event_count: lore.event_log.length,
  }
}

// ---------------------------------------------------------------------------
// Arc progress statistics
// ---------------------------------------------------------------------------

export interface ArcProgressStats {
  archetype_name: string
  total_phases: number
  completed_phases: number
  current_phase: string
  remaining_phases: number
  progress_percentage: number
  advancement_mode: string
  episodes_in_current_phase: number
  average_episodes_per_phase: number
}

export function computeArcProgress(series: Series): ArcProgressStats {
  const arc = series.overarching_arc
  const totalPhases = arc.phase_history.length + arc.remaining_phases.length
  const completedPhases = arc.phase_history.filter((p) => p.exited_at_episode).length
  const canonEps = series.canon_timeline.episodes

  // Episodes in current phase
  const episodesInCurrent = canonEps.filter(
    (e) => e.overarching_phase === arc.current_phase,
  ).length

  // Average episodes per completed phase
  const avgPerPhase = completedPhases > 0
    ? canonEps.length / (completedPhases + 1) // +1 for current in-progress phase
    : canonEps.length

  return {
    archetype_name: arc.archetype_name,
    total_phases: totalPhases,
    completed_phases: completedPhases,
    current_phase: arc.current_phase,
    remaining_phases: arc.remaining_phases.length,
    progress_percentage: totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0,
    advancement_mode: arc.advancement_mode,
    episodes_in_current_phase: episodesInCurrent,
    average_episodes_per_phase: Math.round(avgPerPhase * 10) / 10,
  }
}

// ---------------------------------------------------------------------------
// Character analytics
// ---------------------------------------------------------------------------

export interface CharacterStats {
  character_id: string
  name: string
  role: string
  status: string
  episodes_appeared: number
  arc_milestones: number
  relationships: number
  knowledge_items: number
  possessions: number
}

export function computeCharacterStats(lore: StoryLore): CharacterStats[] {
  return lore.characters.map((c) => ({
    character_id: c.id,
    name: c.name,
    role: c.role,
    status: c.status,
    episodes_appeared: countCharacterAppearances(c),
    arc_milestones: c.arc_milestones.length,
    relationships: c.relationships.length,
    knowledge_items: c.knowledge.length,
    possessions: c.possessions.length,
  }))
}

function countCharacterAppearances(c: LoreCharacter): number {
  // Count unique episodes from introduced + milestones
  const episodes = new Set<string>()
  episodes.add(c.introduced_in)
  episodes.add(c.last_appeared_in)
  for (const m of c.arc_milestones) {
    episodes.add(m.episode_id)
  }
  return episodes.size
}

// ---------------------------------------------------------------------------
// Plot thread analytics
// ---------------------------------------------------------------------------

export interface ThreadStats {
  total: number
  open: number
  progressing: number
  resolved: number
  abandoned: number
  resolution_rate: number
  average_thread_lifespan: number
  longest_running_thread: { id: string; title: string; episodes: number } | null
  most_progressed_thread: { id: string; title: string; progressions: number } | null
}

export function computeThreadStats(lore: StoryLore): ThreadStats {
  const threads = lore.plot_threads
  const total = threads.length
  const open = threads.filter((t) => t.status === 'open').length
  const progressing = threads.filter((t) => t.status === 'progressing').length
  const resolved = threads.filter((t) => t.status === 'resolved').length
  const abandoned = threads.filter((t) => t.status === 'abandoned').length

  const closedThreads = threads.filter((t) => t.status === 'resolved' || t.status === 'abandoned')
  const resolution_rate = total > 0 ? resolved / total : 0

  // Average lifespan (number of episodes a thread was active)
  const lifespans = threads.map((t) => t.progressed_in.length + 1)
  const average_thread_lifespan = lifespans.length > 0
    ? lifespans.reduce((a, b) => a + b, 0) / lifespans.length
    : 0

  // Longest running thread
  const activeThreads = threads.filter((t) => t.status === 'open' || t.status === 'progressing')
  let longest_running_thread: ThreadStats['longest_running_thread'] = null
  if (activeThreads.length > 0) {
    const longest = activeThreads.reduce((a, b) =>
      a.progressed_in.length >= b.progressed_in.length ? a : b,
    )
    longest_running_thread = {
      id: longest.id,
      title: longest.title,
      episodes: longest.progressed_in.length + 1,
    }
  }

  // Most progressed thread
  let most_progressed_thread: ThreadStats['most_progressed_thread'] = null
  if (threads.length > 0) {
    const mostProgressed = threads.reduce((a, b) =>
      a.progressed_in.length >= b.progressed_in.length ? a : b,
    )
    most_progressed_thread = {
      id: mostProgressed.id,
      title: mostProgressed.title,
      progressions: mostProgressed.progressed_in.length,
    }
  }

  return {
    total,
    open,
    progressing,
    resolved,
    abandoned,
    resolution_rate: Math.round(resolution_rate * 100) / 100,
    average_thread_lifespan: Math.round(average_thread_lifespan * 10) / 10,
    longest_running_thread,
    most_progressed_thread,
  }
}

// ---------------------------------------------------------------------------
// Slot statistics
// ---------------------------------------------------------------------------

export interface SlotStats {
  total_slots: number
  canonized_slots: number
  reviewing_slots: number
  generating_slots: number
  total_candidates: number
  average_candidates_per_slot: number
}

export function computeSlotStats(series: Series): SlotStats {
  const slots = series.slots
  const total_slots = slots.length
  const canonized_slots = slots.filter((s) => s.status === 'canonized').length
  const reviewing_slots = slots.filter((s) => s.status === 'reviewing').length
  const generating_slots = slots.filter((s) => s.status === 'generating').length
  const total_candidates = slots.reduce((sum, s) => sum + s.candidates.length, 0)
  const average_candidates_per_slot = total_slots > 0
    ? Math.round((total_candidates / total_slots) * 10) / 10
    : 0

  return {
    total_slots,
    canonized_slots,
    reviewing_slots,
    generating_slots,
    total_candidates,
    average_candidates_per_slot,
  }
}
