import { describe, it, expect } from 'vitest'
import { validateCorpus } from './normalizer.ts'
import type { LoadedCorpus } from '../artifacts/types.ts'
import type { StoryGraph, GenreGraph } from '../../types/graph.ts'

// Minimal valid structures
function makeArchetypeGraph(dir: string): StoryGraph {
  const prefix = dir.slice(3, 5).toUpperCase().padEnd(2, 'X')
  return {
    id: dir,
    name: `Test ${dir}`,
    type: 'archetype',
    description: 'Test',
    nodes: [
      { node_id: `${prefix}_N01_START`, label: 'Start', role: 'Origin', definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [] },
      { node_id: `${prefix}_N02_END`, label: 'End', role: 'Resolution', definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [] },
    ],
    edges: [
      { edge_id: `${prefix}_E01_LINK`, from: `${prefix}_N01_START`, to: `${prefix}_N02_END`, label: 'Link', meaning: 'disrupts order', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
    ],
  }
}

function makeGenreGraph(dir: string): GenreGraph {
  const prefix = dir.slice(3, 5).toUpperCase().padEnd(2, 'X')
  return {
    id: dir,
    name: `Test ${dir}`,
    type: 'genre',
    description: 'Test',
    nodes: [
      { node_id: `${prefix}_N01_PROMISE`, label: 'Promise', role: 'Genre Promise', level: 1, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: `${prefix}_N10_CORE`, label: 'Core', role: 'Core Constraint', level: 2, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: `${prefix}_N80_TONE`, label: 'Tone', role: 'Tone Marker', level: null, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
      { node_id: `${prefix}_N90_ANTI`, label: 'Anti', role: 'Anti-Pattern', level: null, definition: 'd', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' },
    ] as any,
    edges: [
      { edge_id: `${prefix}_E01_SPEC`, from: `${prefix}_N01_PROMISE`, to: `${prefix}_N10_CORE`, label: 'Spec', meaning: 'specifies constraint', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [], severity: 'hard' },
      { edge_id: `${prefix}_E02_TONE`, from: `${prefix}_N01_PROMISE`, to: `${prefix}_N80_TONE`, label: 'Tone', meaning: 'sets tone', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [], severity: 'hard' },
    ] as any,
  }
}

function makeMinimalCorpus(): LoadedCorpus {
  const archetypeDirs = ['01_heros_journey', '02_rags_to_riches', '03_the_quest', '04_voyage_and_return', '05_overcoming_the_monster', '06_rebirth', '07_tragedy', '08_comedy', '09_coming_of_age', '10_the_revenge', '11_the_escape', '12_the_sacrifice', '13_the_mystery_unveiled', '14_the_transformation', '15_the_rise_and_fall']
  const genreDirs = ['01_drama', '02_action', '03_comedy', '04_thriller', '05_fantasy', '06_science_fiction', '07_adventure', '08_romance', '09_romantic_comedy', '10_horror', '11_mystery', '12_crime', '13_detective', '14_superhero', '15_historical', '16_war', '17_biography', '18_family', '19_young_adult', '20_literary_fiction', '21_childrens_literature', '22_satire', '23_psychological', '24_western', '25_political', '26_musical', '27_holiday']

  const archetypeGraphs = new Map<string, StoryGraph>()
  for (const dir of archetypeDirs) archetypeGraphs.set(dir, makeArchetypeGraph(dir))

  const genreGraphs = new Map<string, StoryGraph>()
  for (const dir of genreDirs) genreGraphs.set(dir, makeGenreGraph(dir))

  return {
    archetypeGraphs,
    genreGraphs,
    variantGraphs: new Map(),
    matrix: { title: 't', description: 'd', archetypes_reference: [], genres: Array.from({ length: 27 }, (_, i) => ({ genre: `G${i}`, genre_id: i, naturally_compatible: [], occasionally_compatible: [], rarely_compatible: [] })) },
    toneIntegration: { title: 't', description: 'd', integrations: Array.from({ length: 27 }, (_, i) => ({ genre: `G${i}`, genre_id: `${i}`, tone_marker: 'TM', tone_description: 'd', archetype_interactions: [] })) },
    emotionalArcs: { title: 't', description: 'd', archetypes: Array.from({ length: 15 }, (_, i) => ({ archetype: `A${i}`, archetype_id: `${i}`, arc_profile: [], variant_profiles: [], arc_shape: 'U', dominant_emotion: 'hope', emotional_range: 0.5, summary: 's' })) },
    archetypeNodeRoles: { title: 't', description: 'd' },
    archetypeEdgeMeanings: { title: 't', description: 'd' },
    genreNodeRoles: { title: 't', description: 'd' },
    genreEdgeMeanings: { title: 't', description: 'd' },
    manifest: { generated: '', archetypes: [], genres: [], totals: { archetypes: 15, genres: 27, totalNodes: 0, totalEdges: 0 } },
    corpusHash: 'test',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
  }
}

describe('generation normalizer', () => {
  it('validates a minimal valid corpus without errors', () => {
    const corpus = makeMinimalCorpus()
    const result = validateCorpus(corpus)
    expect(result.errorCount).toBe(0)
    expect(result.valid).toBe(true)
    expect(result.graphCount).toBe(42)
  })

  it('detects missing severity on genre nodes', () => {
    const corpus = makeMinimalCorpus()
    const genreGraph = corpus.genreGraphs.get('01_drama')!
    // Remove severity from first node
    delete (genreGraph.nodes[0] as any).severity
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.message.includes('missing severity'))).toBe(true)
  })

  it('detects invalid node ID format', () => {
    const corpus = makeMinimalCorpus()
    const graph = corpus.archetypeGraphs.get('01_heros_journey')!
    graph.nodes[0].node_id = 'bad_id'
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.message.includes('does not match convention'))).toBe(true)
  })

  it('detects missing Level 1 genre node', () => {
    const corpus = makeMinimalCorpus()
    const genreGraph = corpus.genreGraphs.get('01_drama')!
    // Change level 1 to level 2
    ;(genreGraph.nodes[0] as any).level = 2
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.message.includes('Level 1'))).toBe(true)
  })

  it('detects missing Tone Marker', () => {
    const corpus = makeMinimalCorpus()
    const genreGraph = corpus.genreGraphs.get('01_drama')!
    // Remove tone marker node
    genreGraph.nodes = genreGraph.nodes.filter((n) => n.role !== 'Tone Marker')
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.message.includes('Tone Marker'))).toBe(true)
  })

  it('detects cross-reference count mismatches', () => {
    const corpus = makeMinimalCorpus()
    corpus.emotionalArcs.archetypes = [] // empty → mismatch with 15
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.graph === 'archetype_emotional_arcs')).toBe(true)
  })

  it('validates severity propagation warnings', () => {
    const corpus = makeMinimalCorpus()
    const genreGraph = corpus.genreGraphs.get('01_drama')!
    // Make edge severity differ from target node
    ;(genreGraph.edges[0] as any).severity = 'soft'
    const result = validateCorpus(corpus)
    expect(result.issues.some((i) => i.message.includes('severity') && i.message.includes('differs'))).toBe(true)
  })
})
