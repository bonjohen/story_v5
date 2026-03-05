/**
 * Series I/O: read, write, and validate chapter story artifacts.
 *
 * All series data lives under outputs/series/{series_id}/.
 * Directory structure:
 *   series.json          — Series metadata, arc state, timeline
 *   lore.json           — Current lore state
 *   theme_tone.json      — Creative direction anchor
 *   snapshots/           — State snapshots at episode boundaries
 *   episodes/            — Episode slots and candidates
 *   branches/            — Alternative continuations
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import seriesSchema from './schema/series.schema.json'
import loreSchema from './schema/lore.schema.json'
import episodeSchema from './schema/episode.schema.json'
import stateSnapshotSchema from './schema/state_snapshot.schema.json'

import type {
  Series,
  StoryLore,
  Episode,
  StateSnapshot,
  StateDelta,
  ThemeToneAnchor,
  SeriesConfig,
  OverarchingArc,
} from './types.ts'

// ---------------------------------------------------------------------------
// Schema registry
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({ allErrors: true })
addFormats(ajv)

const schemas = {
  series: ajv.compile(seriesSchema),
  lore: ajv.compile(loreSchema),
  episode: ajv.compile(episodeSchema),
  state_snapshot: ajv.compile(stateSnapshotSchema),
} as const

export type SeriesArtifactName = keyof typeof schemas

export interface SeriesValidationResult {
  valid: boolean
  errors: string[]
}

export function validateSeriesArtifact(
  name: SeriesArtifactName,
  data: unknown,
): SeriesValidationResult {
  const validate = schemas[name]
  const valid = validate(data)
  if (valid) return { valid: true, errors: [] }
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath} ${e.message}`,
  )
  return { valid: false, errors }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERIES_ROOT = 'outputs/series'

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function seriesDir(baseDir: string, seriesId: string): string {
  return path.join(baseDir, SERIES_ROOT, seriesId)
}

function snapshotsDir(baseDir: string, seriesId: string): string {
  return path.join(seriesDir(baseDir, seriesId), 'snapshots')
}

function episodesDir(baseDir: string, seriesId: string): string {
  return path.join(seriesDir(baseDir, seriesId), 'episodes')
}

function episodeSlotDir(baseDir: string, seriesId: string, slotNumber: number): string {
  const slotStr = String(slotNumber).padStart(3, '0')
  return path.join(episodesDir(baseDir, seriesId), `EP_${slotStr}`)
}

function episodeCandidateDir(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
): string {
  const slotStr = String(slotNumber).padStart(3, '0')
  return path.join(
    episodeSlotDir(baseDir, seriesId, slotNumber),
    `EP_${slotStr}_${candidateLabel}`,
  )
}

function branchesDir(baseDir: string, seriesId: string): string {
  return path.join(seriesDir(baseDir, seriesId), 'branches')
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

export function generateSeriesId(slug: string): string {
  return `SER_${slug}`
}

export function generateEpisodeId(slotNumber: number, candidateLabel: string): string {
  const slotStr = String(slotNumber).padStart(3, '0')
  return `EP_${slotStr}_${candidateLabel}`
}

export function generateSnapshotId(slotNumber: number): string {
  const slotStr = String(slotNumber).padStart(3, '0')
  return `SNAP_EP${slotStr}`
}

export function generatePlotThreadId(index: number, slug: string): string {
  const idxStr = String(index).padStart(3, '0')
  return `PT_${idxStr}_${slug}`
}

// ---------------------------------------------------------------------------
// JSON I/O helpers
// ---------------------------------------------------------------------------

async function readJSON<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

async function writeJSON(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Series CRUD
// ---------------------------------------------------------------------------

/**
 * Create a new series on disk from a SeriesConfig.
 * Initializes empty lore, canon timeline, and episode index.
 */
export async function createSeries(
  baseDir: string,
  config: SeriesConfig,
): Promise<Series> {
  const seriesId = generateSeriesId(config.title.toLowerCase().replace(/\s+/g, '_'))
  const now = new Date().toISOString()

  const themeTone: ThemeToneAnchor = {
    genre_id: config.genre_id,
    genre_name: config.genre_name,
    secondary_genre_id: config.secondary_genre_id,
    tone_marker: config.tone_marker,
    themes: config.themes,
    mood: config.mood,
    content_limits: config.content_limits,
    style_notes: config.style_notes,
  }

  const overarchingArc: OverarchingArc = {
    archetype_id: config.archetype_id,
    archetype_name: config.archetype_name,
    current_phase: config.archetype_spine_nodes[0],
    phase_history: [],
    remaining_phases: [...config.archetype_spine_nodes],
    advancement_mode: config.advancement_mode,
  }

  const emptyLore: StoryLore = {
    schema_version: '1.0.0',
    last_updated: now,
    last_updated_by: 'series_creation',
    characters: [],
    places: [],
    objects: [],
    factions: [],
    plot_threads: [],
    world_rules: [],
    event_log: [],
    ...(config.initial_lore ?? {}),
  }

  const series: Series = {
    series_id: seriesId,
    title: config.title,
    description: config.description,
    created_at: now,
    updated_at: now,
    theme_tone: themeTone,
    overarching_arc: overarchingArc,
    lore: emptyLore,
    canon_timeline: { episodes: [] },
    episode_index: { episodes: [] },
    slots: [],
    episode_count: 0,
    total_candidates_generated: 0,
    corpus_hash: config.corpus_hash,
  }

  // Write files
  const sDir = seriesDir(baseDir, seriesId)
  await fs.mkdir(sDir, { recursive: true })
  await fs.mkdir(snapshotsDir(baseDir, seriesId), { recursive: true })
  await fs.mkdir(episodesDir(baseDir, seriesId), { recursive: true })
  await fs.mkdir(branchesDir(baseDir, seriesId), { recursive: true })

  await writeJSON(path.join(sDir, 'series.json'), series)
  await writeJSON(path.join(sDir, 'lore.json'), emptyLore)
  await writeJSON(path.join(sDir, 'theme_tone.json'), themeTone)

  // Write initial snapshot (SNAP_EP000 — before any episodes)
  const initialSnapshot: StateSnapshot = {
    snapshot_id: 'SNAP_EP000',
    after_episode: 'none',
    created_at: now,
    lore: emptyLore,
    overarching_arc: overarchingArc,
  }
  await writeJSON(
    path.join(snapshotsDir(baseDir, seriesId), 'SNAP_EP000.json'),
    initialSnapshot,
  )

  return series
}

/**
 * Load a series from disk.
 */
export async function loadSeries(baseDir: string, seriesId: string): Promise<Series> {
  const sDir = seriesDir(baseDir, seriesId)
  return readJSON<Series>(path.join(sDir, 'series.json'))
}

/**
 * Save (update) a series to disk.
 */
export async function saveSeries(baseDir: string, series: Series): Promise<void> {
  const sDir = seriesDir(baseDir, series.series_id)
  series.updated_at = new Date().toISOString()
  await writeJSON(path.join(sDir, 'series.json'), series)
}

/**
 * List all series IDs on disk.
 */
export async function listSeries(baseDir: string): Promise<string[]> {
  const root = path.join(baseDir, SERIES_ROOT)
  if (!(await pathExists(root))) return []
  const entries = await fs.readdir(root, { withFileTypes: true })
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith('SER_'))
    .map((e) => e.name)
}

// ---------------------------------------------------------------------------
// Lore CRUD
// ---------------------------------------------------------------------------

/**
 * Load the current lore for a series.
 */
export async function loadLore(baseDir: string, seriesId: string): Promise<StoryLore> {
  const sDir = seriesDir(baseDir, seriesId)
  return readJSON<StoryLore>(path.join(sDir, 'lore.json'))
}

/**
 * Save the lore for a series.
 */
export async function saveLore(baseDir: string, seriesId: string, lore: StoryLore): Promise<void> {
  const sDir = seriesDir(baseDir, seriesId)
  await writeJSON(path.join(sDir, 'lore.json'), lore)
}

// ---------------------------------------------------------------------------
// Snapshot CRUD
// ---------------------------------------------------------------------------

/**
 * Save a state snapshot.
 */
export async function saveSnapshot(
  baseDir: string,
  seriesId: string,
  snapshot: StateSnapshot,
): Promise<void> {
  const snapDir = snapshotsDir(baseDir, seriesId)
  await writeJSON(path.join(snapDir, `${snapshot.snapshot_id}.json`), snapshot)
}

/**
 * Load a state snapshot by ID.
 */
export async function loadSnapshot(
  baseDir: string,
  seriesId: string,
  snapshotId: string,
): Promise<StateSnapshot> {
  const snapDir = snapshotsDir(baseDir, seriesId)
  return readJSON<StateSnapshot>(path.join(snapDir, `${snapshotId}.json`))
}

/**
 * Load the latest snapshot (highest numbered).
 */
export async function loadLatestSnapshot(
  baseDir: string,
  seriesId: string,
): Promise<StateSnapshot> {
  const snapDir = snapshotsDir(baseDir, seriesId)
  const entries = await fs.readdir(snapDir)
  const snapFiles = entries.filter((e) => e.startsWith('SNAP_EP') && e.endsWith('.json'))
  if (snapFiles.length === 0) {
    throw new Error(`No snapshots found for series ${seriesId}`)
  }
  snapFiles.sort()
  const latest = snapFiles[snapFiles.length - 1]
  return readJSON<StateSnapshot>(path.join(snapDir, latest))
}

/**
 * List all snapshot IDs for a series.
 */
export async function listSnapshots(baseDir: string, seriesId: string): Promise<string[]> {
  const snapDir = snapshotsDir(baseDir, seriesId)
  if (!(await pathExists(snapDir))) return []
  const entries = await fs.readdir(snapDir)
  return entries
    .filter((e) => e.startsWith('SNAP_EP') && e.endsWith('.json'))
    .map((e) => e.replace('.json', ''))
    .sort()
}

// ---------------------------------------------------------------------------
// Episode CRUD
// ---------------------------------------------------------------------------

/**
 * Save an episode and its metadata to disk.
 */
export async function saveEpisode(
  baseDir: string,
  seriesId: string,
  episode: Episode,
): Promise<void> {
  const epDir = episodeCandidateDir(
    baseDir,
    seriesId,
    episode.slot_number,
    episode.candidate_label,
  )
  await fs.mkdir(epDir, { recursive: true })
  await writeJSON(path.join(epDir, 'episode.json'), episode)
}

/**
 * Load an episode's metadata from disk.
 */
export async function loadEpisode(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
): Promise<Episode> {
  const epDir = episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
  return readJSON<Episode>(path.join(epDir, 'episode.json'))
}

/**
 * Save a state delta alongside an episode.
 */
export async function saveStateDelta(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
  delta: StateDelta,
): Promise<void> {
  const epDir = episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
  await writeJSON(path.join(epDir, 'state_delta.json'), delta)
}

/**
 * Load a state delta for an episode.
 */
export async function loadStateDelta(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
): Promise<StateDelta> {
  const epDir = episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
  return readJSON<StateDelta>(path.join(epDir, 'state_delta.json'))
}

/**
 * List all candidate labels for a given episode slot.
 */
export async function listCandidates(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
): Promise<string[]> {
  const slotDir = episodeSlotDir(baseDir, seriesId, slotNumber)
  if (!(await pathExists(slotDir))) return []
  const entries = await fs.readdir(slotDir, { withFileTypes: true })
  const slotStr = String(slotNumber).padStart(3, '0')
  const prefix = `EP_${slotStr}_`
  return entries
    .filter((e) => e.isDirectory() && e.name.startsWith(prefix))
    .map((e) => e.name.replace(prefix, ''))
    .sort()
}

/**
 * Save a scene draft file alongside an episode.
 */
export async function saveSceneDraft(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
  sceneId: string,
  content: string,
): Promise<string> {
  const epDir = episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
  const scenesDir = path.join(epDir, 'scene_drafts')
  await fs.mkdir(scenesDir, { recursive: true })
  const filePath = path.join(scenesDir, `${sceneId}.md`)
  await fs.writeFile(filePath, content, 'utf-8')
  return filePath
}

/**
 * Load a scene draft for an episode.
 */
export async function loadSceneDraft(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
  sceneId: string,
): Promise<string> {
  const epDir = episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
  return fs.readFile(path.join(epDir, 'scene_drafts', `${sceneId}.md`), 'utf-8')
}

/**
 * Get the candidate directory path for an episode (for saving pipeline artifacts).
 */
export function getEpisodeDir(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
): string {
  return episodeCandidateDir(baseDir, seriesId, slotNumber, candidateLabel)
}

// ---------------------------------------------------------------------------
// Exported path helpers (for external use)
// ---------------------------------------------------------------------------

export { seriesDir, snapshotsDir, episodesDir, episodeSlotDir, episodeCandidateDir, branchesDir }
