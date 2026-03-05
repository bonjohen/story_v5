import { describe, it, expect } from 'vitest'
import { computeFailureModeNodes } from './helpers.ts'
import type { NormalizedGraph } from './normalizer.ts'

function makeGraph(nodes: Array<{ node_id: string; role: string }>): NormalizedGraph {
  return {
    graph: {
      id: 'test',
      name: 'Test',
      type: 'genre',
      description: '',
      nodes: nodes.map((n) => ({
        ...n,
        label: n.node_id,
        definition: '',
        entry_conditions: '',
        exit_conditions: '',
        typical_variants: '',
        failure_modes: '',
        signals_in_text: '',
        level: 1,
        severity: 'hard',
      })),
      edges: [],
    },
    validation: { valid: true, issues: [], stats: { nodeCount: 0, edgeCount: 0, startNodes: 0, terminalNodes: 0 } },
    nodeIndex: new Map(),
    edgeIndex: new Map(),
    adjacency: new Map(),
    reverseAdjacency: new Map(),
  }
}

describe('computeFailureModeNodes', () => {
  it('returns node IDs with Anti-Pattern role', () => {
    const graph = makeGraph([
      { node_id: 'N01', role: 'Genre Promise' },
      { node_id: 'N90', role: 'Anti-Pattern' },
      { node_id: 'N91', role: 'Anti-Pattern' },
    ])
    expect(computeFailureModeNodes(graph)).toEqual(['N90', 'N91'])
  })

  it('returns empty array when no anti-patterns', () => {
    const graph = makeGraph([
      { node_id: 'N01', role: 'Origin' },
      { node_id: 'N02', role: 'Trial' },
    ])
    expect(computeFailureModeNodes(graph)).toEqual([])
  })
})
