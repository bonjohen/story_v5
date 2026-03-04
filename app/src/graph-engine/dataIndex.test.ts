import { describe, it, expect } from 'vitest'
import { buildGraphMetadata, buildManifest } from './dataIndex.ts'
import type { StoryGraph, GraphMetadata } from '../types/graph.ts'

const SAMPLE_GRAPH: StoryGraph = {
  id: 'test_01',
  name: 'Test Graph',
  type: 'archetype',
  description: 'Test',
  nodes: [
    {
      node_id: 'TG_N01_A',
      label: 'A',
      role: 'Origin',
      definition: 'd',
      entry_conditions: [],
      exit_conditions: [],
      typical_variants: [],
      failure_modes: [],
      signals_in_text: [],
    },
    {
      node_id: 'TG_N02_B',
      label: 'B',
      role: 'Resolution',
      definition: 'd',
      entry_conditions: [],
      exit_conditions: [],
      typical_variants: [],
      failure_modes: [],
      signals_in_text: [],
    },
  ],
  edges: [
    {
      edge_id: 'TG_E01_AB',
      from: 'TG_N01_A',
      to: 'TG_N02_B',
      label: 'E',
      meaning: 'disrupts order',
      preconditions: [],
      effects_on_stakes: [],
      effects_on_character: [],
      common_alternatives: [],
      anti_patterns: [],
    },
  ],
} as StoryGraph

describe('buildGraphMetadata', () => {
  it('extracts correct metadata', () => {
    const meta = buildGraphMetadata(SAMPLE_GRAPH, 'archetypes/test', true, false)
    expect(meta.id).toBe('test_01')
    expect(meta.name).toBe('Test Graph')
    expect(meta.type).toBe('archetype')
    expect(meta.prefix).toBe('TG')
    expect(meta.nodeCount).toBe(2)
    expect(meta.edgeCount).toBe(1)
    expect(meta.hasNarrative).toBe(true)
    expect(meta.hasExamples).toBe(false)
  })
})

describe('buildManifest', () => {
  it('computes correct totals', () => {
    const archetypes: GraphMetadata[] = [
      buildGraphMetadata(SAMPLE_GRAPH, 'archetypes/test', true, true),
    ]
    const genres: GraphMetadata[] = [
      buildGraphMetadata({ ...SAMPLE_GRAPH, type: 'genre' } as StoryGraph, 'genres/test', true, true),
    ]
    const manifest = buildManifest(archetypes, genres)
    expect(manifest.totals.archetypes).toBe(1)
    expect(manifest.totals.genres).toBe(1)
    expect(manifest.totals.totalNodes).toBe(4)
    expect(manifest.totals.totalEdges).toBe(2)
    expect(manifest.generated).toBeTruthy()
  })
})
