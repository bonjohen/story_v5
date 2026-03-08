/**
 * Tests for the episode orchestrator — state transitions and canonization.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { orchestrateEpisode } from './episodeOrchestrator.ts'
import type { EpisodeOrchestratorEvent } from './episodeOrchestrator.ts'
import { createSeries } from './io.ts'
import type { SeriesConfig, EpisodeRequest } from './types.ts'
import type { GenerationConfig } from '../artifacts/types.ts'
import type { DataProvider } from '../engine/corpusLoader.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMinimalProvider(): DataProvider {
  const archetypeGraph = {
    id: '01_heros_journey',
    name: "Hero's Journey",
    type: 'archetype',
    description: 'test',
    nodes: [
      { node_id: 'HJ_N01_ORDINARY_WORLD', label: 'Ordinary World', role: 'Origin', definition: 'The hero in their normal world', entry_conditions: ['Hero exists'], exit_conditions: ['A disruption arrives'], failure_modes: ['No clear world'], signals_in_text: ['daily routine'], typical_variants: [] },
      { node_id: 'HJ_N02_CALL', label: 'Call to Adventure', role: 'Disruption', definition: 'The call to adventure', entry_conditions: ['World established'], exit_conditions: ['Call is received'], failure_modes: ['Weak call'], signals_in_text: ['summons'], typical_variants: [] },
    ],
    edges: [
      { edge_id: 'HJ_E01_ORDINARY_TO_CALL', from: 'HJ_N01_ORDINARY_WORLD', to: 'HJ_N02_CALL', label: 'Disruption', meaning: 'catalyst', preconditions: [], effects_on_stakes: '', effects_on_character: '', common_alternatives: [], anti_patterns: [] },
    ],
  }

  const genreGraph = {
    id: '06_science_fiction',
    name: 'Science Fiction',
    type: 'genre',
    description: 'test',
    nodes: [
      { node_id: 'SF_N01_GENRE_PROMISE', label: 'Sci-Fi Promise', role: 'Genre Promise', level: 1, definition: 'Science fiction promise', severity: 'hard', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], typical_variants: [] },
      { node_id: 'SF_N80_TONE', label: 'Tone', role: 'Tone Marker', level: null, definition: 'Wonder tone', severity: 'hard', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], typical_variants: [] },
      { node_id: 'SF_N90_ANTI', label: 'Anti', role: 'Anti-Pattern', level: null, definition: 'Bad pattern', severity: 'hard', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], typical_variants: [] },
    ],
    edges: [],
  }

  const emptyArchetypeGraph = { id: 'empty', name: 'Empty', type: 'archetype', description: '', nodes: [], edges: [] }
  const emptyGenreGraph = { id: 'empty', name: 'Empty', type: 'genre', description: '', nodes: [], edges: [] }

  const matrix = {
    title: 'Matrix', description: '', archetypes_reference: [],
    genres: [{
      genre: 'Science Fiction', genre_id: 6,
      naturally_compatible: [{ archetype: "Hero's Journey", rationale: 'Classic fit' }],
      occasionally_compatible: [], rarely_compatible: [],
    }],
  }

  const toneIntegration = {
    title: '', description: '',
    integrations: [{
      genre: 'Science Fiction', genre_id: '06_science_fiction',
      tone_marker: 'SF_N80_TONE', tone_description: 'Wonder',
      archetype_interactions: [{ archetype: '01_heros_journey', compatibility: 'neutral', note: '' }],
    }],
  }

  const vocabFile = { title: '', description: '' }

  const files: Record<string, unknown> = {
    'archetypes/01_heros_journey/graph.json': archetypeGraph,
    'genres/06_science_fiction/graph.json': genreGraph,
    'cross_references/genre_archetype_matrix.json': matrix,
    'cross_references/tone_archetype_integration.json': toneIntegration,
    'cross_references/archetype_emotional_arcs.json': { title: '', description: '', archetypes: [] },
    'cross_references/hybrid_archetype_patterns.json': { title: '', description: '', hybrids: [] },
    'cross_references/genre_blending_model.json': { title: '', description: '', blends: [] },
    'cross_references/manifest.json': { generated: '2026-01-01', archetypes: [], genres: [], totals: {} },
    'vocabulary/archetype_node_roles.json': vocabFile,
    'vocabulary/archetype_edge_vocabulary.json': vocabFile,
    'vocabulary/genre_node_roles.json': vocabFile,
    'vocabulary/genre_edge_vocabulary.json': vocabFile,
  }

  return {
    loadJson(p: string): Promise<unknown> {
      const data = files[p]
      if (data) return Promise.resolve(data)
      if (p.startsWith('archetypes/') && p.endsWith('/graph.json')) return Promise.resolve(emptyArchetypeGraph)
      if (p.startsWith('genres/') && p.endsWith('/graph.json')) return Promise.resolve(emptyGenreGraph)
      return Promise.reject(new Error(`Mock file not found: ${p}`))
    },
    exists(p: string): Promise<boolean> {
      if (p in files) return Promise.resolve(true)
      if (p.includes('variants.json')) return Promise.resolve(false)
      if (p.includes('elements.json')) return Promise.resolve(false)
      if (p.includes('element_constraints.json')) return Promise.resolve(false)
      return Promise.resolve(false)
    },
  }
}

function makeConfig(): GenerationConfig {
  return {
    signals_policy: { mode: 'warn', min_fraction: 0.5 },
    tone_policy: { mode: 'warn' },
    repair_policy: { max_attempts_per_scene: 1, full_rewrite_threshold: 3 },
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
    max_llm_calls: 20,
  }
}

function makeSeriesConfig(): SeriesConfig {
  return {
    title: 'Test Series',
    description: 'A test series',
    genre_id: '06_science_fiction',
    genre_name: 'Science Fiction',
    archetype_id: '01_heros_journey',
    archetype_name: "Hero's Journey",
    tone_marker: 'wonder',
    themes: ['exploration'],
    mood: 'adventurous',
    content_limits: [],
    style_notes: [],
    advancement_mode: 'hybrid',
    corpus_hash: 'test_hash',
    initial_lore: {},
    archetype_spine_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'],
  }
}

function makeEpisodeRequest(seriesId: string): EpisodeRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: new Date().toISOString(),
    source_corpus_hash: 'test_hash',
    premise: 'The adventure begins',
    medium: 'prose',
    length_target: 'short',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: '06_science_fiction',
    requested_archetype: '01_heros_journey',
    tone_preference: 'wonder',
    constraints: { must_include: [], must_exclude: [] },
    series_id: seriesId,
    slot_number: 1,
    candidate_label: 'a',
    lore_snapshot_id: 'SNAP_EP000',
    overarching_phase: 'HJ_N01_ORDINARY_WORLD',
    thread_priorities: [],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('episodeOrchestrator', () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'series_test_'))
  })

  it('completes contract-only mode', async () => {
    const series = await createSeries(tmpDir, makeSeriesConfig())
    const events: EpisodeOrchestratorEvent[] = []

    const result = await orchestrateEpisode({
      request: makeEpisodeRequest(series.series_id),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'contract-only',
      onEvent: (e) => events.push(e),
    })

    expect(result.state).toBe('COMPLETED')
    expect(result.contract).toBeDefined()
    expect(result.contract!.lore_constraints).toBeDefined()
    expect(events.some((e) => e.state === 'LOADING_LORE')).toBe(true)
    expect(events.some((e) => e.state === 'CONTRACT_READY')).toBe(true)
  })

  it('completes outline mode with lore-aware plan', async () => {
    const series = await createSeries(tmpDir, makeSeriesConfig())

    const result = await orchestrateEpisode({
      request: makeEpisodeRequest(series.series_id),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'outline',
    })

    expect(result.state).toBe('COMPLETED')
    expect(result.plan).toBeDefined()
    expect(result.plan!.scenes.length).toBeGreaterThan(0)
  })

  it('completes full draft mode without LLM (stub scenes)', async () => {
    const series = await createSeries(tmpDir, makeSeriesConfig())

    const result = await orchestrateEpisode({
      request: makeEpisodeRequest(series.series_id),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'draft',
    })

    expect(result.state).toBe('COMPLETED')
    expect(result.episode).toBeDefined()
    expect(result.episode!.canon_status).toBe('draft')
    expect(result.stateDelta).toBeDefined()
    expect(result.sceneDrafts).toBeDefined()
    expect(result.loreValidation).toBeDefined()
  })

  it('persists episode to disk', async () => {
    const series = await createSeries(tmpDir, makeSeriesConfig())

    await orchestrateEpisode({
      request: makeEpisodeRequest(series.series_id),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'draft',
    })

    // Check episode.json exists
    const episodePath = path.join(
      tmpDir, 'outputs/series', series.series_id,
      'episodes/EP_001/EP_001_a/episode.json',
    )
    const exists = await fs.access(episodePath).then(() => true).catch(() => false)
    expect(exists).toBe(true)

    // Check state_delta.json exists
    const deltaPath = path.join(
      tmpDir, 'outputs/series', series.series_id,
      'episodes/EP_001/EP_001_a/state_delta.json',
    )
    const deltaExists = await fs.access(deltaPath).then(() => true).catch(() => false)
    expect(deltaExists).toBe(true)
  })

  it('updates series episode index and slots', async () => {
    const series = await createSeries(tmpDir, makeSeriesConfig())

    await orchestrateEpisode({
      request: makeEpisodeRequest(series.series_id),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'draft',
    })

    // Reload series and check
    const { loadSeries } = await import('./io.ts')
    const updated = await loadSeries(tmpDir, series.series_id)
    expect(updated.episode_index.episodes.length).toBe(1)
    expect(updated.episode_index.episodes[0].episode_id).toBe('EP_001_a')
    expect(updated.slots.length).toBe(1)
    expect(updated.slots[0].candidates).toContain('EP_001_a')
  })

  it('transitions to FAILED on missing series', async () => {
    const result = await orchestrateEpisode({
      request: makeEpisodeRequest('SER_nonexistent'),
      provider: makeMinimalProvider(),
      config: makeConfig(),
      baseDir: tmpDir,
      mode: 'draft',
    })

    expect(result.state).toBe('FAILED')
    expect(result.error).toBeDefined()
  })
})
