import { describe, it, expect } from 'vitest'
import { orchestrate } from './orchestrator.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type { DataProvider } from './corpusLoader.ts'
import type { StoryRequest, GenerationConfig } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Mock DataProvider that returns minimal valid corpus data
// ---------------------------------------------------------------------------

function makeMockProvider(): DataProvider {
  const archetypeGraph = {
    id: '01_heros_journey',
    name: "The Hero's Journey",
    type: 'archetype',
    description: '',
    nodes: [
      { node_id: 'HJ_N01_ORDINARY', label: 'Ordinary World', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: ['Story opening'], exit_conditions: ['Call received'], typical_variants: [], failure_modes: ['Too long'], signals_in_text: ['Mundane life'] },
      { node_id: 'HJ_N02_CALL', label: 'Call', role: 'Disruption', definition: 'Disruption', entry_conditions: [], exit_conditions: ['Call acknowledged'], typical_variants: [], failure_modes: [], signals_in_text: [] },
    ],
    edges: [
      { edge_id: 'HJ_E01_DISRUPTS', from: 'HJ_N01_ORDINARY', to: 'HJ_N02_CALL', label: 'Disrupts', meaning: 'disrupts', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
    ],
  }

  const genreGraph = {
    id: '06_science_fiction',
    name: 'Science Fiction',
    type: 'genre',
    description: '',
    nodes: [
      { node_id: 'SF_N01_PROMISE', label: 'Promise', role: 'Genre Promise', level: 1, definition: 'SF promise', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: 'SF_N60_PREMISE', label: 'Premise Reveal', role: 'Scene Obligation', level: 5, definition: 'Premise revealed', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: 'SF_N80_TONE', label: 'Tone', role: 'Tone Marker', level: null, definition: 'Intellectual tone', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: 'SF_N90_ANTI', label: 'Anti', role: 'Anti-Pattern', level: null, definition: 'Bad pattern', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
    ],
    edges: [],
  }

  const manifest = {
    generated: '2026-03-04',
    archetypes: [{ id: '01_heros_journey', name: "The Hero's Journey", nodeCount: 2, edgeCount: 1 }],
    genres: [{ id: '06_science_fiction', name: 'Science Fiction', nodeCount: 4, edgeCount: 0 }],
    totals: { archetypes: 1, genres: 1, totalNodes: 6, totalEdges: 1 },
  }

  const matrix = {
    title: 'Matrix', description: '', archetypes_reference: [],
    genres: [{
      genre: 'Science Fiction', genre_id: 6,
      naturally_compatible: [{ archetype: "The Hero's Journey", rationale: 'Classic fit' }],
      occasionally_compatible: [], rarely_compatible: [],
    }],
  }

  const toneIntegration = {
    title: '', description: '',
    integrations: [{
      genre: 'Science Fiction', genre_id: '06_science_fiction',
      tone_marker: 'SF_N80_TONE', tone_description: 'Intellectual',
      archetype_interactions: [{ archetype: '01_heros_journey', compatibility: 'neutral', note: '' }],
    }],
  }

  const emotionalArcs = { title: '', description: '', archetypes: [] }
  const hybridPatterns = { title: '', description: '', hybrids: [] }
  const blendingModel = { title: '', description: '', blends: [] }
  const vocabFile = { title: '', description: '' }

  const files: Record<string, unknown> = {
    'manifest.json': manifest,
    'archetypes/01_heros_journey/graph.json': archetypeGraph,
    'genres/06_science_fiction/graph.json': genreGraph,
    'genre_archetype_matrix.json': matrix,
    'tone_archetype_integration.json': toneIntegration,
    'archetype_emotional_arcs.json': emotionalArcs,
    'hybrid_archetype_patterns.json': hybridPatterns,
    'genre_blending_model.json': blendingModel,
    'vocabulary/archetype_node_roles.json': vocabFile,
    'vocabulary/archetype_edge_vocabulary.json': vocabFile,
    'vocabulary/genre_node_roles.json': vocabFile,
    'vocabulary/genre_edge_vocabulary.json': vocabFile,
  }

  // Default empty graph for archetypes/genres not explicitly defined
  const emptyArchetypeGraph = { id: 'empty', name: 'Empty', type: 'archetype', description: '', nodes: [], edges: [] }
  const emptyGenreGraph = { id: 'empty', name: 'Empty', type: 'genre', description: '', nodes: [], edges: [] }

  return {
    loadJson(path: string): Promise<unknown> {
      const data = files[path]
      if (data) return Promise.resolve(data)
      // Return empty graphs for unknown archetype/genre directories
      if (path.startsWith('archetypes/') && path.endsWith('/graph.json')) return Promise.resolve(emptyArchetypeGraph)
      if (path.startsWith('genres/') && path.endsWith('/graph.json')) return Promise.resolve(emptyGenreGraph)
      return Promise.reject(new Error(`Mock file not found: ${path}`))
    },
    exists(path: string): Promise<boolean> {
      if (path in files) return Promise.resolve(true)
      // Variants don't exist in our mock
      if (path.includes('variants.json')) return Promise.resolve(false)
      return Promise.resolve(false)
    },
  }
}

function makeRequest(): StoryRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_0001',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'test',
    premise: 'A test story',
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: 'Science Fiction',
    requested_archetype: "The Hero's Journey",
    tone_preference: 'somber',
    constraints: { must_include: [], must_exclude: [], allow_genre_blend: false, allow_hybrid_archetype: false },
  }
}

function makeConfig(): GenerationConfig {
  return {
    signals_policy: { mode: 'warn', min_fraction: 0.5 },
    tone_policy: { mode: 'warn' },
    repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
    composition_defaults: { allow_blend: true, allow_hybrid: false },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('orchestrator — state transitions', () => {
  it('completes contract-only mode', async () => {
    const result = await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'contract-only',
    })
    expect(result.state).toBe('COMPLETED')
    expect(result.selection).toBeDefined()
    expect(result.contract).toBeDefined()
    expect(result.plan).toBeUndefined()
    expect(result.sceneDrafts).toBeUndefined()
  })

  it('completes outline mode', async () => {
    const result = await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'outline',
    })
    expect(result.state).toBe('COMPLETED')
    expect(result.plan).toBeDefined()
    expect(result.plan!.beats.length).toBeGreaterThan(0)
    expect(result.sceneDrafts).toBeUndefined()
  })

  it('completes full draft mode with mock LLM', async () => {
    // Mock LLM returns responses for all calls (beats, scenes, validation, etc.)
    const llm = new MockLLMAdapter(['Mock response for generation.'])
    const result = await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'draft',
      llm,
    })
    expect(result.state).toBe('COMPLETED')
    expect(result.sceneDrafts).toBeDefined()
    expect(result.sceneDrafts!.size).toBeGreaterThan(0)
    expect(result.validation).toBeDefined()
    expect(result.trace).toBeDefined()
    expect(result.complianceReport).toBeDefined()
  })

  it('completes full draft mode without LLM (stub scenes)', async () => {
    const result = await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'draft',
    })
    expect(result.state).toBe('COMPLETED')
    expect(result.sceneDrafts!.size).toBeGreaterThan(0)
    // Stub scenes won't pass validation, but pipeline still completes
    expect(result.validation).toBeDefined()
  })
})

describe('orchestrator — events', () => {
  it('emits progress events', async () => {
    const collectedEvents: string[] = []
    await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'contract-only',
      onEvent: (e) => collectedEvents.push(e.state),
    })
    expect(collectedEvents).toContain('LOADED_CORPUS')
    expect(collectedEvents).toContain('SELECTED')
    expect(collectedEvents).toContain('CONTRACT_READY')
    expect(collectedEvents).toContain('COMPLETED')
  })
})

describe('orchestrator — error handling', () => {
  it('transitions to FAILED on corpus load error', async () => {
    const badProvider: DataProvider = {
      loadJson: () => Promise.reject(new Error('File not found')),
      exists: () => Promise.resolve(false),
    }
    const result = await orchestrate({
      request: makeRequest(),
      provider: badProvider,
      config: makeConfig(),
    })
    expect(result.state).toBe('FAILED')
    expect(result.error).toBeDefined()
  })

  it('transitions to FAILED on unknown genre', async () => {
    const request = makeRequest()
    request.requested_genre = 'Nonexistent Genre'
    const result = await orchestrate({
      request,
      provider: makeMockProvider(),
      config: makeConfig(),
    })
    expect(result.state).toBe('FAILED')
    expect(result.error).toContain('Unknown genre')
  })

  it('preserves partial artifacts on failure', async () => {
    const request = makeRequest()
    request.requested_genre = 'Nonexistent Genre'
    const result = await orchestrate({
      request,
      provider: makeMockProvider(),
      config: makeConfig(),
    })
    expect(result.state).toBe('FAILED')
    // Should still have events showing progress before failure
    expect(result.events.length).toBeGreaterThan(0)
  })
})

describe('orchestrator — metadata', () => {
  it('carries run_id from request', async () => {
    const result = await orchestrate({
      request: makeRequest(),
      provider: makeMockProvider(),
      config: makeConfig(),
      mode: 'contract-only',
    })
    expect(result.run_id).toBe('RUN_2026_03_04_0001')
  })
})
