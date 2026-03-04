import { describe, it, expect } from 'vitest'
import { parseGraphJson, normalizeGraph, isArchetypeGraph, isGenreGraph } from './normalizer.ts'

const VALID_ARCHETYPE = {
  id: 'test_arch',
  name: 'Test',
  type: 'archetype',
  description: 'Test archetype',
  nodes: [
    {
      node_id: 'TA_N01_A',
      label: 'A',
      role: 'Origin',
      definition: 'Start',
      entry_conditions: ['open'],
      exit_conditions: ['done'],
      typical_variants: ['v1'],
      failure_modes: ['f1'],
      signals_in_text: ['s1'],
    },
    {
      node_id: 'TA_N02_B',
      label: 'B',
      role: 'Resolution',
      definition: 'End',
      entry_conditions: ['after A'],
      exit_conditions: ['close'],
      typical_variants: ['v2'],
      failure_modes: ['f2'],
      signals_in_text: ['s2'],
    },
  ],
  edges: [
    {
      edge_id: 'TA_E01_AB',
      from: 'TA_N01_A',
      to: 'TA_N02_B',
      label: 'A to B',
      meaning: 'disrupts order',
      preconditions: 'A done',
      effects_on_stakes: 'rise',
      effects_on_character: 'change',
      common_alternatives: 'alt',
      anti_patterns: 'bad',
    },
  ],
}

describe('parseGraphJson', () => {
  it('parses valid graph JSON', () => {
    const graph = parseGraphJson(VALID_ARCHETYPE)
    expect(graph.id).toBe('test_arch')
    expect(graph.nodes).toHaveLength(2)
    expect(graph.edges).toHaveLength(1)
  })

  it('throws on non-object input', () => {
    expect(() => parseGraphJson(null)).toThrow('must be an object')
    expect(() => parseGraphJson('string')).toThrow('must be an object')
  })

  it('throws on missing required fields', () => {
    expect(() => parseGraphJson({ id: 'x' })).toThrow('missing required fields')
  })
})

describe('normalizeGraph', () => {
  it('builds node index', () => {
    const graph = parseGraphJson(VALID_ARCHETYPE)
    const normalized = normalizeGraph(graph)
    expect(normalized.nodeIndex.get('TA_N01_A')).toBe(0)
    expect(normalized.nodeIndex.get('TA_N02_B')).toBe(1)
  })

  it('builds adjacency lists', () => {
    const graph = parseGraphJson(VALID_ARCHETYPE)
    const normalized = normalizeGraph(graph)
    expect(normalized.adjacency.get('TA_N01_A')).toEqual(['TA_N02_B'])
    expect(normalized.adjacency.get('TA_N02_B')).toEqual([])
  })

  it('builds reverse adjacency lists', () => {
    const graph = parseGraphJson(VALID_ARCHETYPE)
    const normalized = normalizeGraph(graph)
    expect(normalized.reverseAdjacency.get('TA_N02_B')).toEqual(['TA_N01_A'])
    expect(normalized.reverseAdjacency.get('TA_N01_A')).toEqual([])
  })
})

describe('type guards', () => {
  it('identifies archetype graphs', () => {
    const graph = parseGraphJson(VALID_ARCHETYPE)
    expect(isArchetypeGraph(graph)).toBe(true)
    expect(isGenreGraph(graph)).toBe(false)
  })

  it('identifies genre graphs', () => {
    const graph = parseGraphJson({ ...VALID_ARCHETYPE, type: 'genre' })
    expect(isGenreGraph(graph)).toBe(true)
    expect(isArchetypeGraph(graph)).toBe(false)
  })
})
