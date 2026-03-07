import { describe, it, expect } from 'vitest'
import { runSelection } from './selectionEngine.ts'
import type { StoryRequest, LoadedCorpus } from '../artifacts/types.ts'
import type { StoryGraph } from '../../types/graph.ts'

// Build a minimal but realistic corpus for testing
function makeTestCorpus(): LoadedCorpus {
  const makeGraph = (id: string, name: string, type: 'archetype' | 'genre', prefix: string): StoryGraph => ({
    id, name, type, description: '',
    nodes: [
      { node_id: `${prefix}_N01_A`, label: 'A', role: type === 'genre' ? 'Genre Promise' : 'Origin', definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], ...(type === 'genre' ? { level: 1, severity: 'hard' } : {}) },
    ],
    edges: [],
  } as StoryGraph)

  const archetypeGraphs = new Map<string, StoryGraph>()
  archetypeGraphs.set('01_heros_journey', makeGraph('01_heros_journey', "The Hero's Journey", 'archetype', 'HJ'))
  archetypeGraphs.set('03_the_quest', makeGraph('03_the_quest', 'The Quest', 'archetype', 'QU'))
  archetypeGraphs.set('07_tragedy', makeGraph('07_tragedy', 'Tragedy', 'archetype', 'TR'))

  const genreGraphs = new Map<string, StoryGraph>()
  genreGraphs.set('06_science_fiction', makeGraph('06_science_fiction', 'Science Fiction', 'genre', 'SF'))
  genreGraphs.set('04_thriller', makeGraph('04_thriller', 'Thriller', 'genre', 'TH'))

  return {
    archetypeGraphs,
    genreGraphs,
    variantGraphs: new Map(),
    matrix: {
      title: 'Matrix', description: '', archetypes_reference: [],
      genres: [
        {
          genre: 'Science Fiction', genre_id: 6,
          naturally_compatible: [
            { archetype: "The Hero's Journey", rationale: 'Classic fit' },
            { archetype: 'The Quest', rationale: 'Goal-driven narratives' },
          ],
          occasionally_compatible: [
            { archetype: 'Tragedy', rationale: 'Cautionary tales' },
          ],
          rarely_compatible: [],
        },
        {
          genre: 'Thriller', genre_id: 4,
          naturally_compatible: [
            { archetype: "The Hero's Journey", rationale: 'Action fit' },
          ],
          occasionally_compatible: [],
          rarely_compatible: [
            { archetype: 'Tragedy', rationale: 'Rarely combined' },
          ],
        },
      ],
    },
    toneIntegration: {
      title: 'Tone', description: '',
      integrations: [
        {
          genre: 'Science Fiction', genre_id: '06_science_fiction',
          tone_marker: 'SF_N80_INTELLECTUAL_ENGAGEMENT',
          tone_description: 'Intellectual engagement',
          archetype_interactions: [
            { archetype: '01_heros_journey', compatibility: 'neutral', note: 'n' },
            { archetype: '03_the_quest', compatibility: 'reinforcing', note: 'n' },
            { archetype: '07_tragedy', compatibility: 'contrasting', note: 'n' },
          ],
        },
        {
          genre: 'Thriller', genre_id: '04_thriller',
          tone_marker: 'TH_N80_SUSTAINED_TENSION',
          tone_description: 'Tension',
          archetype_interactions: [
            { archetype: '01_heros_journey', compatibility: 'reinforcing', note: 'n' },
          ],
        },
      ],
    },
    emotionalArcs: { title: '', description: '', archetypes: [] },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { generated: '', archetypes: [], genres: [], totals: { archetypes: 3, genres: 2, totalNodes: 0, totalEdges: 0 } },
    corpusHash: 'test',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
  }
}

function makeRequest(overrides: Partial<StoryRequest> = {}): StoryRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_1830',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'test',
    premise: 'A story',
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: 'Science Fiction',
    requested_archetype: "The Hero's Journey",
    tone_preference: 'somber',
    constraints: {
      must_include: [],
      must_exclude: [],
    },
    ...overrides,
  }
}

describe('selectionEngine', () => {
  it('selects the requested genre and archetype', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest()
    const { selection } = runSelection(request, corpus)

    expect(selection.primary_genre).toBe('06_science_fiction')
    expect(selection.primary_archetype).toBe('01_heros_journey')
  })

  it('looks up compatibility classification', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest()
    const { selection } = runSelection(request, corpus)

    expect(selection.compatibility.matrix_classification).toBe('naturally compatible')
    expect(selection.compatibility.rationale).toContain('Classic fit')
  })

  it('resolves genre by directory ID', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest({ requested_genre: '06_science_fiction' })
    const { selection } = runSelection(request, corpus)

    expect(selection.primary_genre).toBe('06_science_fiction')
  })

  it('looks up tone integration', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest()
    const { selection } = runSelection(request, corpus)

    expect(selection.tone_marker.genre_tone_node_id).toBe('SF_N80_INTELLECTUAL_ENGAGEMENT')
    expect(selection.tone_marker.integration_classification).toBe('neutral')
  })

  it('produces scored alternatives', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest()
    const { alternatives } = runSelection(request, corpus)

    expect(alternatives.length).toBeGreaterThan(0)
    // Should be sorted by score descending
    for (let i = 1; i < alternatives.length; i++) {
      expect(alternatives[i - 1].totalScore).toBeGreaterThanOrEqual(alternatives[i].totalScore)
    }
  })

  it('throws on unknown genre', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest({ requested_genre: 'Nonexistent' })

    expect(() => runSelection(request, corpus)).toThrow('Unknown genre')
  })

  it('throws on unknown archetype', () => {
    const corpus = makeTestCorpus()
    const request = makeRequest({ requested_archetype: 'Nonexistent' })

    expect(() => runSelection(request, corpus)).toThrow('Unknown archetype')
  })
})
