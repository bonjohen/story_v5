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
 * Parse raw JSON into a typed StoryGraph, adding default values for missing optional fields.
 */
export function parseGraphJson(raw: unknown): StoryGraph {
  const data = raw as Record<string, unknown>

  if (!data || typeof data !== 'object') {
    throw new Error('Graph JSON must be an object')
  }

  if (!data.id || !data.name || !data.type || !data.nodes || !data.edges) {
    throw new Error('Graph JSON missing required fields: id, name, type, nodes, edges')
  }

  return data as unknown as StoryGraph
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
 * Load a graph from a URL (browser fetch), validate, and normalize.
 */
export async function loadGraph(url: string): Promise<NormalizedGraph> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load graph from ${url}: ${response.status}`)
  }
  const raw = await response.json()
  const graph = parseGraphJson(raw)
  return normalizeGraph(graph)
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
