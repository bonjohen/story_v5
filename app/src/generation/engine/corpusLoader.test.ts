import { describe, it, expect, vi } from 'vitest'
import { loadCorpus, type DataProvider } from './corpusLoader.ts'

// Minimal valid graph structures for testing
const ARCHETYPE_GRAPH = {
  id: 'test_arch',
  name: 'Test Archetype',
  type: 'archetype',
  description: 'Test',
  nodes: [
    { node_id: 'TA_N01_A', label: 'A', role: 'Origin', definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [] },
    { node_id: 'TA_N02_B', label: 'B', role: 'Resolution', definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [] },
  ],
  edges: [
    { edge_id: 'TA_E01_AB', from: 'TA_N01_A', to: 'TA_N02_B', label: 'A to B', meaning: 'disrupts order', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
  ],
}

const GENRE_GRAPH = {
  id: 'test_genre',
  name: 'Test Genre',
  type: 'genre',
  description: 'Test',
  nodes: [
    { node_id: 'TG_N01_PROMISE', label: 'Promise', role: 'Genre Promise', level: 1, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
    { node_id: 'TG_N80_TONE', label: 'Tone', role: 'Tone Marker', level: null, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
  ],
  edges: [
    { edge_id: 'TG_E01_TONE', from: 'TG_N01_PROMISE', to: 'TG_N80_TONE', label: 'Sets tone', meaning: 'sets tone', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [], severity: 'hard' },
  ],
}

const MATRIX = { title: 't', description: 'd', archetypes_reference: [], genres: Array.from({ length: 27 }, (_, i) => ({ genre: `G${i}`, genre_id: i + 1, naturally_compatible: [], occasionally_compatible: [], rarely_compatible: [] })) }
const TONE = { title: 't', description: 'd', integrations: Array.from({ length: 27 }, (_, i) => ({ genre: `G${i}`, genre_id: `0${i + 1}`, tone_marker: 'TM', tone_description: 'd', archetype_interactions: [] })) }
const ARCS = { title: 't', description: 'd', archetypes: Array.from({ length: 15 }, (_, i) => ({ archetype: `A${i}`, archetype_id: `0${i + 1}`, arc_profile: [], variant_profiles: [], arc_shape: 'U', dominant_emotion: 'hope', emotional_range: 0.5, summary: 's' })) }
const HYBRIDS = { title: 't', description: 'd', hybrids: [] }
const BLENDS = { title: 't', description: 'd', blends: [] }
const VOCAB = { title: 't', description: 'd', node_roles: [], edge_meanings: [] }
const MANIFEST = { generated: '2026-01-01T00:00:00Z', archetypes: [], genres: [], totals: { archetypes: 15, genres: 27, totalNodes: 100, totalEdges: 100 } }

function createMockProvider(): DataProvider {
  const files = new Map<string, unknown>()

  // Register 15 archetype graphs
  const archetypeDirs = ['01_heros_journey', '02_rags_to_riches', '03_the_quest', '04_voyage_and_return', '05_overcoming_the_monster', '06_rebirth', '07_tragedy', '08_comedy', '09_coming_of_age', '10_the_revenge', '11_the_escape', '12_the_sacrifice', '13_the_mystery_unveiled', '14_the_transformation', '15_the_rise_and_fall']
  for (const dir of archetypeDirs) {
    files.set(`archetypes/${dir}/graph.json`, ARCHETYPE_GRAPH)
  }

  // Register 27 genre graphs
  const genreDirs = ['01_drama', '02_action', '03_comedy', '04_thriller', '05_fantasy', '06_science_fiction', '07_adventure', '08_romance', '09_romantic_comedy', '10_horror', '11_mystery', '12_crime', '13_detective', '14_superhero', '15_historical', '16_war', '17_biography', '18_family', '19_young_adult', '20_literary_fiction', '21_childrens_literature', '22_satire', '23_psychological', '24_western', '25_political', '26_musical', '27_holiday']
  for (const dir of genreDirs) {
    files.set(`genres/${dir}/graph.json`, GENRE_GRAPH)
  }

  // Cross-refs
  files.set('genre_archetype_matrix.json', MATRIX)
  files.set('tone_archetype_integration.json', TONE)
  files.set('archetype_emotional_arcs.json', ARCS)
  files.set('hybrid_archetype_patterns.json', HYBRIDS)
  files.set('genre_blending_model.json', BLENDS)
  files.set('vocabulary/archetype_node_roles.json', VOCAB)
  files.set('vocabulary/archetype_edge_vocabulary.json', VOCAB)
  files.set('vocabulary/genre_node_roles.json', VOCAB)
  files.set('vocabulary/genre_edge_vocabulary.json', VOCAB)
  files.set('manifest.json', MANIFEST)

  return {
    loadJson: vi.fn((path: string) => {
      const data = files.get(path)
      if (!data) return Promise.reject(new Error(`Mock: file not found: ${path}`))
      return Promise.resolve(structuredClone(data))
    }),
    exists: vi.fn((path: string) => Promise.resolve(files.has(path))),
  }
}

describe('corpusLoader', () => {
  it('loads all 42 graphs', async () => {
    const provider = createMockProvider()
    const corpus = await loadCorpus(provider)

    expect(corpus.archetypeGraphs.size).toBe(15)
    expect(corpus.genreGraphs.size).toBe(27)
  })

  it('loads cross-reference datasets', async () => {
    const provider = createMockProvider()
    const corpus = await loadCorpus(provider)

    expect(corpus.matrix.genres).toHaveLength(27)
    expect(corpus.toneIntegration.integrations).toHaveLength(27)
    expect(corpus.emotionalArcs.archetypes).toHaveLength(15)
    expect(corpus.hybridPatterns.hybrids).toBeDefined()
    expect(corpus.blendingModel.blends).toBeDefined()
  })

  it('loads vocabularies', async () => {
    const provider = createMockProvider()
    const corpus = await loadCorpus(provider)

    expect(corpus.archetypeNodeRoles.title).toBe('t')
    expect(corpus.archetypeEdgeMeanings.title).toBe('t')
    expect(corpus.genreNodeRoles.title).toBe('t')
    expect(corpus.genreEdgeMeanings.title).toBe('t')
  })

  it('produces a stable corpus hash', async () => {
    const provider = createMockProvider()
    const corpus1 = await loadCorpus(provider)
    const corpus2 = await loadCorpus(provider)

    expect(corpus1.corpusHash).toBe(corpus2.corpusHash)
    expect(corpus1.corpusHash).toMatch(/^[0-9a-f]{8}$/)
  })

  it('detects variant files when present', async () => {
    // Build a provider that includes a variant file for hero's journey
    const variantGraph = { ...ARCHETYPE_GRAPH, id: 'variant' }
    const baseProvider = createMockProvider()

    // Extract the underlying file map by capturing calls to the base provider
    const files = new Map<string, unknown>()
    files.set('archetypes/01_heros_journey/variants.json', variantGraph)

    const provider: DataProvider = {
      loadJson: vi.fn(async (path: string) => {
        if (files.has(path)) return structuredClone(files.get(path)!)
        return baseProvider.loadJson(path)
      }),
      exists: vi.fn(async (path: string) => {
        if (files.has(path)) return true
        return baseProvider.exists(path)
      }),
    }

    const corpus = await loadCorpus(provider)
    expect(corpus.variantGraphs.size).toBe(1)
    expect(corpus.variantGraphs.has('01_heros_journey')).toBe(true)
  })
})
