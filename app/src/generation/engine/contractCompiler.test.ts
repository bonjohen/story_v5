import { describe, it, expect } from 'vitest'
import { compileContract } from './contractCompiler.ts'
import type { SelectionResult, StoryRequest, LoadedCorpus, GenerationConfig } from '../artifacts/types.ts'
import type { StoryGraph, GenreGraph } from '../../types/graph.ts'

function makeGenreGraph(): GenreGraph {
  return {
    id: '06_science_fiction',
    name: 'Science Fiction',
    type: 'genre',
    description: 'Speculative fiction',
    nodes: [
      { node_id: 'SF_N01_PROMISE', label: 'SF Promise', role: 'Genre Promise', level: 1, definition: 'Speculative premise explored', entry_conditions: ['Story positioned as SF'], exit_conditions: ['Core constraints established'], typical_variants: [], failure_modes: ['Premise is window dressing'], signals_in_text: ['Early speculative premise'], severity: 'hard' } as never,
      { node_id: 'SF_N10_SPECULATIVE', label: 'Speculative Premise', role: 'Core Constraint', level: 2, definition: 'What-if premise drives plot', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
      { node_id: 'SF_N20_HARD_SF', label: 'Hard SF', role: 'Subgenre Pattern', level: 3, definition: 'Tech-focused', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'soft' } as never,
      { node_id: 'SF_N40_TECH_RULES', label: 'Tech Rules', role: 'Setting Rule', level: 4, definition: 'Tech must follow rules', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
      { node_id: 'SF_N60_PREMISE_REVEAL', label: 'Premise Reveal', role: 'Scene Obligation', level: 5, definition: 'Scene revealing the speculative premise', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
      { node_id: 'SF_N80_INTELLECTUAL', label: 'Intellectual Engagement', role: 'Tone Marker', level: null, definition: 'Maintains intellectual engagement', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
      { node_id: 'SF_N90_TECH_MAGIC', label: 'Tech as Magic', role: 'Anti-Pattern', level: null, definition: 'Tech behaves as unexplained magic', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
    ],
    edges: [],
  }
}

function makeArchetypeGraph(): StoryGraph {
  return {
    id: '01_heros_journey',
    name: "The Hero's Journey",
    type: 'archetype',
    description: '',
    nodes: [
      { node_id: 'HJ_N01_ORDINARY', label: 'Ordinary World', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: ['Story opening'], exit_conditions: ['Call received'], typical_variants: [], failure_modes: ['Too long'], signals_in_text: ['Mundane life'] },
      { node_id: 'HJ_N02_CALL', label: 'Call to Adventure', role: 'Disruption', definition: 'Something disrupts the ordinary', entry_conditions: ['World established'], exit_conditions: ['Call acknowledged'], typical_variants: [], failure_modes: ['Too subtle'], signals_in_text: ['Disrupting event'] },
      { node_id: 'HJ_N03_MENTOR', label: 'Meeting the Mentor', role: 'Catalyst', definition: 'Hero meets guide', entry_conditions: ['Call accepted'], exit_conditions: ['Guidance received'], typical_variants: [], failure_modes: ['Mentor info dumps'], signals_in_text: ['Wise figure appears'] },
    ],
    edges: [
      { edge_id: 'HJ_E01_DISRUPTS', from: 'HJ_N01_ORDINARY', to: 'HJ_N02_CALL', label: 'Disrupts Order', meaning: 'disrupts order', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
      { edge_id: 'HJ_E02_FORCES', from: 'HJ_N02_CALL', to: 'HJ_N03_MENTOR', label: 'Forces Commitment', meaning: 'forces commitment', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
    ],
  }
}

function makeCorpus(): LoadedCorpus {
  return {
    archetypeGraphs: new Map([['01_heros_journey', makeArchetypeGraph()]]),
    genreGraphs: new Map([['06_science_fiction', makeGenreGraph() as StoryGraph]]),
    variantGraphs: new Map(),
    matrix: { title: '', description: '', archetypes_reference: [], genres: [] },
    toneIntegration: { title: '', description: '', integrations: [] },
    emotionalArcs: { title: '', description: '', archetypes: [] },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { generated: '', archetypes: [], genres: [], totals: { archetypes: 1, genres: 1, totalNodes: 0, totalEdges: 0 } },
    corpusHash: 'test',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
  }
}

function makeSelection(): SelectionResult {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_1830',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'test',
    primary_archetype: '01_heros_journey',
    primary_genre: '06_science_fiction',
    compatibility: { matrix_classification: 'naturally compatible', rationale: ['Good fit'] },
    tone_marker: { selected: 'somber', genre_tone_node_id: 'SF_N80_INTELLECTUAL', integration_classification: 'neutral' },
  }
}

function makeRequest(): StoryRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_1830',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'test',
    premise: 'A test story',
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: ['no violence'] },
    requested_genre: 'Science Fiction',
    requested_archetype: "The Hero's Journey",
    tone_preference: 'somber',
    constraints: { must_include: ['found family'], must_exclude: ['time travel'] },
  }
}

function makeConfig(): GenerationConfig {
  return {
    signals_policy: { mode: 'warn', min_fraction: 0.5 },
    tone_policy: { mode: 'warn' },
    repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
    max_llm_calls: 20,
  }
}

describe('contractCompiler', () => {
  it('builds archetype section with spine nodes', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    expect(contract.archetype.id_prefix).toBe('HJ')
    expect(contract.archetype.spine_nodes).toEqual(['HJ_N01_ORDINARY', 'HJ_N02_CALL', 'HJ_N03_MENTOR'])
    expect(contract.archetype.required_edges).toEqual(['HJ_E01_DISRUPTS', 'HJ_E02_FORCES'])
  })

  it('builds genre section with levels and severity', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    expect(contract.genre.id_prefix).toBe('SF')
    expect(contract.genre.levels['1']).toContain('SF_N01_PROMISE')
    expect(contract.genre.levels['2']).toContain('SF_N10_SPECULATIVE')
    expect(contract.genre.tone_marker).toContain('SF_N80_INTELLECTUAL')
    expect(contract.genre.anti_patterns).toContain('SF_N90_TECH_MAGIC')
    expect(contract.genre.hard_constraints.length).toBeGreaterThan(0)
    expect(contract.genre.soft_constraints.length).toBeGreaterThan(0)
  })

  it('builds global boundaries from genre + user constraints', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    expect(contract.global_boundaries.musts.some((m) => m.includes('User requirement: found family'))).toBe(true)
    expect(contract.global_boundaries.must_nots.some((m) => m.includes('User exclusion: time travel'))).toBe(true)
    expect(contract.global_boundaries.must_nots.some((m) => m.includes('Anti-pattern'))).toBe(true)
    expect(contract.global_boundaries.content_limits).toContain('no violence')
  })

  it('builds phase guidelines for each archetype node', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    expect(contract.phase_guidelines).toHaveLength(3) // 3 archetype nodes
    expect(contract.phase_guidelines[0].node_id).toBe('HJ_N01_ORDINARY')
    expect(contract.phase_guidelines[0].entry_conditions).toContain('Story opening')
    expect(contract.phase_guidelines[0].failure_modes).toContain('Too long')
  })

  it('links genre obligations to phase guidelines', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    // At least one phase should have a genre obligation link
    const hasLinks = contract.phase_guidelines.some((p) => p.genre_obligation_links.length > 0)
    expect(hasLinks).toBe(true)
  })

  it('builds validation policy from config', () => {
    const contract = compileContract(makeSelection(), makeRequest(), makeCorpus(), makeConfig())
    expect(contract.validation_policy.hard_constraints_required).toBe(true)
    expect(contract.validation_policy.anti_patterns_blocking).toBe(true)
    expect(contract.validation_policy.signals_required).toBe('soft') // mode: 'warn' → soft
  })

  it('throws on missing archetype', () => {
    const selection = makeSelection()
    selection.primary_archetype = 'nonexistent'
    expect(() => compileContract(selection, makeRequest(), makeCorpus(), makeConfig())).toThrow('Archetype not found')
  })

  it('throws on missing genre', () => {
    const selection = makeSelection()
    selection.primary_genre = 'nonexistent'
    expect(() => compileContract(selection, makeRequest(), makeCorpus(), makeConfig())).toThrow('Genre not found')
  })
})
