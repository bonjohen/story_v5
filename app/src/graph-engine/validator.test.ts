import { describe, it, expect } from 'vitest'
import { validateGraph, auditVocabulary } from './validator.ts'
import type { StoryGraph } from '../types/graph.ts'

function makeArchetypeGraph(overrides: Partial<StoryGraph> = {}): StoryGraph {
  return {
    id: 'test_archetype',
    name: 'Test Archetype',
    type: 'archetype',
    description: 'A test archetype',
    nodes: [
      {
        node_id: 'TA_N01_START',
        label: 'Start',
        role: 'Origin',
        definition: 'The beginning',
        entry_conditions: ['Story opens'],
        exit_conditions: ['Something happens'],
        typical_variants: ['Variant A'],
        failure_modes: ['Too slow'],
        signals_in_text: ['Opening scene'],
      },
      {
        node_id: 'TA_N02_END',
        label: 'End',
        role: 'Resolution',
        definition: 'The ending',
        entry_conditions: ['Crisis resolved'],
        exit_conditions: ['Story ends'],
        typical_variants: ['Happy ending'],
        failure_modes: ['Unearned'],
        signals_in_text: ['Final scene'],
      },
    ],
    edges: [
      {
        edge_id: 'TA_E01_START_TO_END',
        from: 'TA_N01_START',
        to: 'TA_N02_END',
        label: 'Progression',
        meaning: 'disrupts order',
        preconditions: 'World established',
        effects_on_stakes: 'Stakes rise',
        effects_on_character: 'Character changes',
        common_alternatives: 'Alternative path',
        anti_patterns: 'Deus ex machina',
      },
    ],
    ...overrides,
  } as StoryGraph
}

function makeGenreGraph(): StoryGraph {
  return {
    id: 'test_genre',
    name: 'Test Genre',
    type: 'genre',
    description: 'A test genre',
    nodes: [
      {
        node_id: 'TG_N01_PROMISE',
        label: 'Promise',
        role: 'Genre Promise',
        level: 1,
        definition: 'The promise',
        entry_conditions: ['Reader picks up book'],
        exit_conditions: ['Promise established'],
        typical_variants: ['Dark promise'],
        failure_modes: ['Vague promise'],
        signals_in_text: ['Opening tone'],
      },
      {
        node_id: 'TG_N10_CONSTRAINT',
        label: 'Constraint',
        role: 'Core Constraint',
        level: 2,
        definition: 'A core constraint',
        entry_conditions: ['Promise made'],
        exit_conditions: ['Constraint active'],
        typical_variants: ['Strict version'],
        failure_modes: ['Too loose'],
        signals_in_text: ['Rule established'],
      },
    ],
    edges: [
      {
        edge_id: 'TG_E01_PROMISE_TO_CONSTRAINT',
        from: 'TG_N01_PROMISE',
        to: 'TG_N10_CONSTRAINT',
        label: 'Specifies',
        meaning: 'specifies constraint',
        preconditions: ['Promise established'],
        effects_on_stakes: 'Narrows the field',
        effects_on_character: 'Limits options',
        common_alternatives: ['Different constraint'],
        anti_patterns: ['Constraint ignored'],
      },
    ],
  } as StoryGraph
}

describe('validateGraph', () => {
  it('validates a well-formed archetype graph', () => {
    const result = validateGraph(makeArchetypeGraph())
    expect(result.valid).toBe(true)
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('validates a well-formed genre graph', () => {
    const result = validateGraph(makeGenreGraph())
    expect(result.valid).toBe(true)
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('reports correct node and edge counts', () => {
    const result = validateGraph(makeArchetypeGraph())
    expect(result.stats.nodeCount).toBe(2)
    expect(result.stats.edgeCount).toBe(1)
  })

  it('detects start and terminal nodes', () => {
    const result = validateGraph(makeArchetypeGraph())
    expect(result.stats.startNodes).toBe(1)
    expect(result.stats.terminalNodes).toBe(1)
  })

  it('reports edge referencing unknown node', () => {
    const graph = makeArchetypeGraph({
      edges: [
        {
          edge_id: 'TA_E01_BAD',
          from: 'TA_N01_START',
          to: 'NONEXISTENT',
          label: 'Bad',
          meaning: 'disrupts order',
          preconditions: 'None',
          effects_on_stakes: 'None',
          effects_on_character: 'None',
          common_alternatives: 'None',
          anti_patterns: 'None',
        },
      ],
    } as Partial<StoryGraph>)
    const result = validateGraph(graph)
    const edgeErrors = result.issues.filter(
      (i) => i.severity === 'error' && i.message.includes('unknown node'),
    )
    expect(edgeErrors.length).toBeGreaterThan(0)
  })

  it('warns about non-vocabulary edge meaning', () => {
    const graph = makeArchetypeGraph()
    graph.edges[0].meaning = 'does something weird'
    const result = validateGraph(graph)
    const vocabWarns = result.issues.filter(
      (i) => i.severity === 'warning' && i.message.includes('controlled vocabulary'),
    )
    expect(vocabWarns.length).toBeGreaterThan(0)
  })

  it('warns about non-vocabulary node role', () => {
    const graph = makeArchetypeGraph()
    graph.nodes[0].role = 'Magical Pony'
    const result = validateGraph(graph)
    const vocabWarns = result.issues.filter(
      (i) => i.severity === 'warning' && i.message.includes('controlled vocabulary'),
    )
    expect(vocabWarns.length).toBeGreaterThan(0)
  })

  it('detects duplicate node IDs', () => {
    const graph = makeArchetypeGraph()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(graph.nodes as any[]).push({ ...graph.nodes[0] })
    const result = validateGraph(graph)
    const dupes = result.issues.filter((i) => i.message.includes('Duplicate node_id'))
    expect(dupes.length).toBeGreaterThan(0)
  })
})

describe('auditVocabulary', () => {
  it('counts edge meaning usage across graphs', () => {
    const graphs = [makeArchetypeGraph()]
    const audit = auditVocabulary(graphs, 'archetype')
    const disrupts = audit.edgeMeanings.find((e) => e.term === 'disrupts order')
    expect(disrupts?.count).toBe(1)
  })

  it('reports unused vocabulary terms', () => {
    const graphs = [makeArchetypeGraph()]
    const audit = auditVocabulary(graphs, 'archetype')
    expect(audit.unusedEdgeMeanings.length).toBeGreaterThan(0)
    expect(audit.unusedEdgeMeanings).toContain('compels return')
  })
})
