/**
 * Graph Normalizer: loads graph JSON, validates, and produces a typed graph model.
 * Works in both browser (fetch) and Node/test (fs) contexts.
 */

import type { StoryGraph, ArchetypeGraph, GenreGraph } from '../types/graph.ts'
import { validateGraph, type ValidationResult } from './validator.ts'

export interface NormalizedGraph {
  graph: StoryGraph
  validation: ValidationResult
  nodeIndex: Map<string, number>
  edgeIndex: Map<string, number>
  adjacency: Map<string, string[]>
  reverseAdjacency: Map<string, string[]>
}

/**
 * Parse raw JSON into a typed StoryGraph, validating structure before returning.
 */
export function parseGraphJson(raw: unknown): StoryGraph {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Graph JSON must be an object')
  }

  const data = raw as Record<string, unknown>

  if (!data.id || !data.name || !data.type || !data.nodes || !data.edges) {
    throw new Error('Graph JSON missing required fields: id, name, type, nodes, edges')
  }

  if (data.type !== 'archetype' && data.type !== 'genre') {
    throw new Error(`Graph type must be "archetype" or "genre", got ${JSON.stringify(data.type)}`)
  }

  if (!Array.isArray(data.nodes)) {
    throw new Error('Graph "nodes" must be an array')
  }

  if (!Array.isArray(data.edges)) {
    throw new Error('Graph "edges" must be an array')
  }

  for (const node of data.nodes) {
    if (!node || typeof node !== 'object') {
      throw new Error('Each node must be an object')
    }
    const n = node as Record<string, unknown>
    if (!n.node_id || !n.label || !n.role) {
      throw new Error(`Node missing required fields (node_id, label, role): ${JSON.stringify(n)}`)
    }
  }

  for (const edge of data.edges) {
    if (!edge || typeof edge !== 'object') {
      throw new Error('Each edge must be an object')
    }
    const e = edge as Record<string, unknown>
    if (!e.edge_id || !e.from || !e.to || !e.label || !e.meaning) {
      throw new Error(`Edge missing required fields (edge_id, from, to, label, meaning): ${JSON.stringify(e)}`)
    }
  }

  // At this point structure is validated; build a typed result
  const graph: StoryGraph = {
    id: data.id as string,
    name: data.name as string,
    type: data.type,
    description: (data.description as string) ?? '',
    nodes: data.nodes as StoryGraph['nodes'],
    edges: data.edges as StoryGraph['edges'],
  } as StoryGraph

  return graph
}

/**
 * Build lookup indices and adjacency lists from a graph.
 */
function buildIndices(graph: StoryGraph): Pick<
  NormalizedGraph,
  'nodeIndex' | 'edgeIndex' | 'adjacency' | 'reverseAdjacency'
> {
  const nodeIndex = new Map<string, number>()
  const edgeIndex = new Map<string, number>()
  const adjacency = new Map<string, string[]>()
  const reverseAdjacency = new Map<string, string[]>()

  graph.nodes.forEach((node, i) => {
    nodeIndex.set(node.node_id, i)
    adjacency.set(node.node_id, [])
    reverseAdjacency.set(node.node_id, [])
  })

  graph.edges.forEach((edge, i) => {
    edgeIndex.set(edge.edge_id, i)
    adjacency.get(edge.from)?.push(edge.to)
    reverseAdjacency.get(edge.to)?.push(edge.from)
  })

  return { nodeIndex, edgeIndex, adjacency, reverseAdjacency }
}

/**
 * Normalize a parsed graph: validate and build indices.
 */
export function normalizeGraph(graph: StoryGraph): NormalizedGraph {
  const validation = validateGraph(graph)
  const indices = buildIndices(graph)

  return {
    graph,
    validation,
    ...indices,
  }
}

/**
 * Type guard: is this an archetype graph?
 */
export function isArchetypeGraph(graph: StoryGraph): graph is ArchetypeGraph {
  return graph.type === 'archetype'
}

/**
 * Type guard: is this a genre graph?
 */
export function isGenreGraph(graph: StoryGraph): graph is GenreGraph {
  return graph.type === 'genre'
}
