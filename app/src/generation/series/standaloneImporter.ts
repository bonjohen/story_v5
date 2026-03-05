/**
 * Standalone Importer — import a standalone story run as Episode 1 of a new series.
 *
 * Takes the output of a single-run generation (from outputs/runs/) and
 * adapts it into the series Episode format, extracting an initial lore
 * from the story plan's element roster.
 */

import type {
  Episode,
  EpisodeArtifacts,
  EpisodeSummary,
  StoryLore,
  LoreCharacter,
  LorePlace,
  LoreObject,
  SeriesConfig,
} from './types.ts'
import type { CharacterRole } from '../../types/elements.ts'
import type { PlaceType, ObjectType } from '../../types/elements.ts'

// ---------------------------------------------------------------------------
// Run metadata (minimal shape of what we expect from a standalone run)
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a standalone run's story trace/plan that we can extract
 * episode metadata from. Callers should pass in the parsed JSON from the run.
 */
export interface StandaloneRunData {
  /** Title from the story plan or trace */
  title: string
  /** Synopsis / premise */
  synopsis: string
  /** Archetype used */
  archetype_id: string
  archetype_name: string
  /** Genre used */
  genre_id: string
  genre_name: string
  /** Characters from the element roster */
  characters: Array<{
    id: string
    name: string
    role: string
    description?: string
    traits?: string[]
    motivations?: string[]
    arc_type?: string
  }>
  /** Places from the element roster */
  places: Array<{
    id: string
    name: string
    type: string
    description?: string
  }>
  /** Objects from the element roster */
  objects: Array<{
    id: string
    name: string
    type: string
    significance?: string
  }>
  /** Scene file paths (relative) */
  scene_files: string[]
  /** Run directory path */
  run_dir: string
}

// ---------------------------------------------------------------------------
// Import functions
// ---------------------------------------------------------------------------

/**
 * Build a SeriesConfig from a standalone run, suitable for creating
 * a new series with the run as Episode 1.
 */
export function buildSeriesConfigFromRun(
  run: StandaloneRunData,
  overrides: {
    title?: string
    description?: string
    archetype_spine_nodes: string[]
    advancement_mode?: 'user_directed' | 'auto_milestone' | 'hybrid'
    tone_marker?: string
    themes?: string[]
    mood?: string
  },
): SeriesConfig {
  return {
    title: overrides.title ?? run.title,
    description: overrides.description ?? run.synopsis,
    archetype_id: run.archetype_id,
    archetype_name: run.archetype_name,
    archetype_spine_nodes: overrides.archetype_spine_nodes,
    genre_id: run.genre_id,
    genre_name: run.genre_name,
    tone_marker: overrides.tone_marker ?? '',
    themes: overrides.themes ?? [],
    mood: overrides.mood ?? '',
    content_limits: [],
    style_notes: [],
    advancement_mode: overrides.advancement_mode ?? 'hybrid',
    corpus_hash: '',
    initial_lore: buildInitialLoreFromRun(run),
  }
}

/**
 * Build an initial StoryLore from a standalone run's element roster.
 */
export function buildInitialLoreFromRun(
  run: StandaloneRunData,
): Partial<StoryLore> {
  const episodeId = 'EP_001_a'

  const characters: LoreCharacter[] = run.characters.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role as CharacterRole,
    description: c.description,
    traits: c.traits ?? [],
    motivations: c.motivations ?? [],
    arc_type: (c.arc_type ?? null) as LoreCharacter['arc_type'],
    relationships: [],
    status: 'alive' as const,
    introduced_in: episodeId,
    last_appeared_in: episodeId,
    knowledge: [],
    possessions: [],
    arc_milestones: [],
  }))

  const places: LorePlace[] = run.places.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as PlaceType,
    description: p.description ?? '',
    introduced_in: episodeId,
    last_featured_in: episodeId,
    status: 'extant' as const,
    events_here: [],
  }))

  const objects: LoreObject[] = run.objects.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type as ObjectType,
    significance: o.significance ?? '',
    introduced_in: episodeId,
    status: 'intact' as const,
    custody_history: [],
  }))

  return {
    characters,
    places,
    objects,
    factions: [],
    plot_threads: [],
    world_rules: [],
    event_log: [],
  }
}

/**
 * Build an Episode object from a standalone run, suitable for
 * inserting into a series as Episode 1.
 */
export function buildEpisodeFromRun(
  seriesId: string,
  run: StandaloneRunData,
  arcPhase: string,
): Episode {
  const now = new Date().toISOString()
  const episodeId = 'EP_001_a'

  const artifacts: EpisodeArtifacts = {
    request: 'request.json',
    selection_result: 'selection_result.json',
    story_contract: 'story_contract.json',
    story_plan: 'story_plan.json',
    scene_drafts: run.scene_files,
    validation_results: 'validation_results.json',
    story_trace: 'story_trace.json',
    compliance_report: 'compliance_report.md',
  }

  const summary: EpisodeSummary = {
    characters_featured: run.characters.map((c) => c.id),
    plot_threads_advanced: [],
    key_events: [],
  }

  return {
    episode_id: episodeId,
    series_id: seriesId,
    slot_number: 1,
    candidate_label: 'a',
    title: run.title,
    synopsis: run.synopsis,
    created_at: now,
    canon_status: 'draft',
    overarching_phase: arcPhase,
    episodic_archetype_id: run.archetype_id,
    artifacts,
    summary,
  }
}
