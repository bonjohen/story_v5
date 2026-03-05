import { describe, it, expect } from 'vitest'
import { compileTemplatePack } from './templateCompiler.ts'
import type { SelectionResult, StoryContract, LoadedCorpus } from '../artifacts/types.ts'
import type { StoryGraph, GenreGraph } from '../../types/graph.ts'

function makeGenreGraph(): GenreGraph {
  return {
    id: '06_science_fiction',
    name: 'Science Fiction',
    type: 'genre',
    description: 'Speculative fiction',
    nodes: [
      { node_id: 'SF_N01_PROMISE', label: 'SF Promise', role: 'Genre Promise', level: 1, definition: 'Speculative premise explored', entry_conditions: ['Story positioned as SF'], exit_conditions: ['Core constraints established'], typical_variants: [], failure_modes: ['Premise is window dressing'], signals_in_text: ['Early speculative premise'], severity: 'hard' } as never,
      { node_id: 'SF_N10_SPECULATIVE', label: 'Speculative Premise', role: 'Core Constraint', level: 2, definition: 'What-if premise drives plot', entry_conditions: ['Premise introduced'], exit_conditions: ['Premise explored'], typical_variants: [], failure_modes: ['Premise abandoned'], signals_in_text: ['What-if framing'], severity: 'hard' } as never,
      { node_id: 'SF_N20_HARD_SF', label: 'Hard SF', role: 'Subgenre Pattern', level: 3, definition: 'Tech-focused subgenre', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'soft' } as never,
      { node_id: 'SF_N40_TECH_RULES', label: 'Tech Rules', role: 'Setting Rule', level: 4, definition: 'Technology must follow internal rules', entry_conditions: ['World established'], exit_conditions: ['Rules demonstrated'], typical_variants: [], failure_modes: ['Rules violated'], signals_in_text: ['Tech demonstration'], severity: 'hard' } as never,
      { node_id: 'SF_N60_PREMISE_REVEAL', label: 'Premise Reveal', role: 'Scene Obligation', level: 5, definition: 'Scene revealing the speculative premise', entry_conditions: ['Setup complete'], exit_conditions: ['Premise clear to reader'], typical_variants: [], failure_modes: ['Reveal is anticlimactic'], signals_in_text: ['Aha moment'], severity: 'hard' } as never,
      { node_id: 'SF_N80_INTELLECTUAL', label: 'Intellectual Engagement', role: 'Tone Marker', level: null, definition: 'Maintains intellectual engagement throughout', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: ['Thoughtful narration', 'Philosophical questions'], severity: 'hard' } as never,
      { node_id: 'SF_N90_TECH_MAGIC', label: 'Tech as Magic', role: 'Anti-Pattern', level: null, definition: 'Technology behaves as unexplained magic', entry_conditions: [], exit_conditions: [], typical_variants: [], failure_modes: [], signals_in_text: [], severity: 'hard' } as never,
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
      { node_id: 'HJ_N01_ORDINARY', label: 'Ordinary World', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: ['Story opening'], exit_conditions: ['Call received'], typical_variants: [], failure_modes: ['Too long in ordinary world'], signals_in_text: ['Mundane life details'] },
      { node_id: 'HJ_N02_CALL', label: 'Call to Adventure', role: 'Disruption', definition: 'Something disrupts the ordinary', entry_conditions: ['World established'], exit_conditions: ['Call acknowledged'], typical_variants: [], failure_modes: ['Call too subtle'], signals_in_text: ['Disrupting event'] },
      { node_id: 'HJ_N03_MENTOR', label: 'Meeting the Mentor', role: 'Catalyst', definition: 'Hero meets guide', entry_conditions: ['Call accepted'], exit_conditions: ['Guidance received'], typical_variants: [], failure_modes: ['Mentor is exposition dump'], signals_in_text: ['Wise figure appears'] },
    ],
    edges: [
      { edge_id: 'HJ_E01_DISRUPTS', from: 'HJ_N01_ORDINARY', to: 'HJ_N02_CALL', label: 'Disrupts Order', meaning: 'disrupts order', preconditions: [], effects_on_stakes: [], effects_on_character: [], common_alternatives: [], anti_patterns: [] },
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
    hybridPatterns: { title: '', description: '', hybrids: [] },
    blendingModel: { title: '', description: '', blends: [] },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { generated: '', archetypes: [], genres: [], totals: { archetypes: 1, genres: 1, totalNodes: 0, totalEdges: 0 } },
    corpusHash: 'abc123',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
  }
}

function makeSelection(): SelectionResult {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    primary_archetype: '01_heros_journey',
    primary_genre: '06_science_fiction',
    genre_blend: { enabled: false },
    hybrid_archetype: { enabled: false },
    compatibility: { matrix_classification: 'naturally compatible', rationale: ['Good fit'] },
    tone_marker: { selected: 'intellectual', genre_tone_node_id: 'SF_N80_INTELLECTUAL', integration_classification: 'neutral' },
  }
}

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    archetype: {
      id_prefix: 'HJ',
      name: "The Hero's Journey",
      archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL', 'HJ_N03_MENTOR'],
      required_roles: ['Origin', 'Disruption', 'Catalyst'],
      allowed_variants: [],
      required_edges: ['HJ_E01_DISRUPTS'],
    },
    genre: {
      id_prefix: 'SF',
      name: 'Science Fiction',
      genre_id: '06_science_fiction',
      levels: { '1': ['SF_N01_PROMISE'], '2': ['SF_N10_SPECULATIVE'], '3': ['SF_N20_HARD_SF'], '4': ['SF_N40_TECH_RULES'], '5': ['SF_N60_PREMISE_REVEAL'] },
      tone_marker: ['SF_N80_INTELLECTUAL'],
      anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N01_PROMISE', 'SF_N10_SPECULATIVE', 'SF_N40_TECH_RULES', 'SF_N60_PREMISE_REVEAL'],
      soft_constraints: ['SF_N20_HARD_SF'],
    },
    global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
    phase_guidelines: [
      { node_id: 'HJ_N01_ORDINARY', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: ['Story opening'], exit_conditions: ['Call received'], failure_modes: ['Too long'], signals_in_text: ['Mundane life'], genre_obligation_links: ['SF_N60_PREMISE_REVEAL'] },
      { node_id: 'HJ_N02_CALL', role: 'Disruption', definition: 'Something disrupts', entry_conditions: ['World established'], exit_conditions: ['Call acknowledged'], failure_modes: ['Too subtle'], signals_in_text: ['Disrupting event'], genre_obligation_links: [] },
      { node_id: 'HJ_N03_MENTOR', role: 'Catalyst', definition: 'Hero meets guide', entry_conditions: ['Call accepted'], exit_conditions: ['Guidance received'], failure_modes: ['Info dump'], signals_in_text: ['Wise figure'], genre_obligation_links: [] },
    ],
    validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' },
  }
}

describe('templateCompiler', () => {
  it('produces a template for each spine node', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    const keys = Object.keys(pack.archetype_node_templates)
    expect(keys).toContain('HJ_N01_ORDINARY')
    expect(keys).toContain('HJ_N02_CALL')
    expect(keys).toContain('HJ_N03_MENTOR')
    expect(keys).toHaveLength(3)
  })

  it('populates archetype template fields from graph nodes', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    const tpl = pack.archetype_node_templates['HJ_N01_ORDINARY']
    expect(tpl.role).toBe('Origin')
    expect(tpl.label).toBe('Ordinary World')
    expect(tpl.beat_summary_template).toContain('Hero in ordinary world')
    expect(tpl.signals_to_include).toContain('Mundane life details')
    expect(tpl.failure_modes_to_avoid).toContain('Too long in ordinary world')
    expect(tpl.entry_conditions).toContain('Story opening')
    expect(tpl.exit_conditions).toContain('Call received')
  })

  it('produces genre level templates for spine nodes only', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    const keys = Object.keys(pack.genre_level_templates)
    // 5 spine levels, tone marker and anti-pattern excluded
    expect(keys).toContain('SF_N01_PROMISE')
    expect(keys).toContain('SF_N10_SPECULATIVE')
    expect(keys).toContain('SF_N40_TECH_RULES')
    expect(keys).toContain('SF_N60_PREMISE_REVEAL')
    expect(keys).not.toContain('SF_N80_INTELLECTUAL') // tone marker
    expect(keys).not.toContain('SF_N90_TECH_MAGIC')   // anti-pattern
  })

  it('populates genre template fields', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    const tpl = pack.genre_level_templates['SF_N40_TECH_RULES']
    expect(tpl.level).toBe(4)
    expect(tpl.severity).toBe('hard')
    expect(tpl.constraint_template).toBe('Technology must follow internal rules')
    expect(tpl.binding_rules.length).toBeGreaterThan(0)
  })

  it('extracts tone guidance', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    expect(pack.tone_guidance).toBeDefined()
    expect(pack.tone_guidance!.tone_marker_id).toBe('SF_N80_INTELLECTUAL')
    expect(pack.tone_guidance!.directives).toContain('Maintains intellectual engagement throughout')
  })

  it('extracts anti-pattern guidance', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    expect(pack.anti_pattern_guidance).toBeDefined()
    expect(pack.anti_pattern_guidance).toHaveLength(1)
    expect(pack.anti_pattern_guidance![0].node_id).toBe('SF_N90_TECH_MAGIC')
  })

  it('is deterministic — same inputs produce identical output', () => {
    const selection = makeSelection()
    const contract = makeContract()
    const corpus = makeCorpus()
    const pack1 = compileTemplatePack(selection, contract, corpus)
    const pack2 = compileTemplatePack(selection, contract, corpus)
    // Compare everything except generated_at timestamp
    const strip = (p: typeof pack1) => ({ ...p, generated_at: '' })
    expect(strip(pack1)).toEqual(strip(pack2))
  })

  it('uses corpus hash from loaded corpus', () => {
    const pack = compileTemplatePack(makeSelection(), makeContract(), makeCorpus())
    expect(pack.source_corpus_hash).toBe('abc123')
  })

  it('throws on missing archetype', () => {
    const selection = makeSelection()
    selection.primary_archetype = 'nonexistent'
    expect(() => compileTemplatePack(selection, makeContract(), makeCorpus())).toThrow('Archetype not found')
  })

  it('throws on missing genre', () => {
    const selection = makeSelection()
    selection.primary_genre = 'nonexistent'
    expect(() => compileTemplatePack(selection, makeContract(), makeCorpus())).toThrow('Genre not found')
  })
})
