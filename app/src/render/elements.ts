import type { ElementDefinition } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { isGenreGraph } from '../graph-engine/index.ts'
import type { GenreNode } from '../types/graph.ts'
import { getNodeCategory, getEdgeCategory } from './styles.ts'

/**
 * Convert a NormalizedGraph into Cytoscape element definitions.
 */
export function buildCytoscapeElements(normalized: NormalizedGraph): ElementDefinition[] {
  const { graph, adjacency, reverseAdjacency } = normalized
  const isGenre = isGenreGraph(graph)
  const elements: ElementDefinition[] = []

  // Determine start/terminal nodes
  const nodesWithIncoming = new Set(graph.edges.map((e) => e.to))
  const nodesWithOutgoing = new Set(graph.edges.map((e) => e.from))

  for (const node of graph.nodes) {
    const isStart = !nodesWithIncoming.has(node.node_id)
    const isTerminal = !nodesWithOutgoing.has(node.node_id)
    const isVariant = /_(N[5-7]\d)_/.test(node.node_id)
    const outDegree = adjacency.get(node.node_id)?.length ?? 0
    const inDegree = reverseAdjacency.get(node.node_id)?.length ?? 0
    const level = isGenre ? (node as GenreNode).level : null
    const category = getNodeCategory(node.role, isStart, isTerminal)

    elements.push({
      data: {
        id: node.node_id,
        label: node.label,
        role: node.role,
        definition: node.definition,
        level,
        category,
        isStart,
        isTerminal,
        isVariant,
        outDegree,
        inDegree,
      },
      classes: [
        category,
        isStart ? 'start' : '',
        isTerminal ? 'terminal' : '',
        isVariant ? 'variant' : '',
        level != null ? `level-${level}` : '',
      ]
        .filter(Boolean)
        .join(' '),
    })
  }

  for (const edge of graph.edges) {
    const category = getEdgeCategory(edge.meaning)
    const isVariantEdge = /_(E[5-7]\d)_/.test(edge.edge_id)
    const isLoop = edge.from === edge.to

    elements.push({
      data: {
        id: edge.edge_id,
        source: edge.from,
        target: edge.to,
        label: edge.label,
        meaning: edge.meaning,
        category,
        isVariant: isVariantEdge,
      },
      classes: [category, isVariantEdge ? 'variant' : '', isLoop ? 'loop' : ''].filter(Boolean).join(' '),
    })
  }

  return elements
}
