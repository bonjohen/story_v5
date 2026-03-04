import type { Core } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/**
 * Archetype layout: horizontal left-to-right time axis.
 * Nodes are positioned by topological order (narrative sequence).
 * Variant nodes (50-79 range) are offset vertically.
 */
export function layoutArchetype(cy: Core, normalized: NormalizedGraph) {
  const { graph, adjacency, reverseAdjacency } = normalized

  // Topological sort to determine horizontal position
  const order = topologicalSort(graph.nodes.map((n) => n.node_id), adjacency, reverseAdjacency)

  // Assign columns based on topological order
  const colMap = new Map<string, number>()
  order.forEach((id, i) => colMap.set(id, i))

  // Separate main-path and variant nodes
  const mainNodes: string[] = []
  const variantNodes: string[] = []

  for (const node of graph.nodes) {
    if (/_(N[5-7]\d)_/.test(node.node_id)) {
      variantNodes.push(node.node_id)
    } else {
      mainNodes.push(node.node_id)
    }
  }

  const H_SPACING = 180
  const V_SPACING = 120
  const BASE_Y = 200

  // Position main-path nodes along the horizontal axis
  for (const id of mainNodes) {
    const col = colMap.get(id) ?? 0
    const node = cy.getElementById(id)
    node.position({ x: col * H_SPACING + 100, y: BASE_Y })
  }

  // Position variant nodes below their predecessor
  for (const id of variantNodes) {
    const col = colMap.get(id) ?? 0
    const parents = reverseAdjacency.get(id) ?? []
    // Find the vertical slot — offset below the main path
    const variantIndex = variantNodes.indexOf(id)
    const yOffset = V_SPACING * (1 + (variantIndex % 3))
    const node = cy.getElementById(id)

    if (parents.length > 0) {
      const parentCol = colMap.get(parents[0]) ?? col
      // Place between parent and next main node
      node.position({
        x: ((parentCol + col) / 2) * H_SPACING + 100,
        y: BASE_Y + yOffset,
      })
    } else {
      node.position({ x: col * H_SPACING + 100, y: BASE_Y + yOffset })
    }
  }

  // Fit to viewport with padding
  cy.fit(undefined, 40)
}

/**
 * Simple topological sort via Kahn's algorithm.
 * Returns node IDs in dependency order (start nodes first).
 */
function topologicalSort(
  nodeIds: string[],
  adjacency: Map<string, string[]>,
  reverseAdjacency: Map<string, string[]>,
): string[] {
  const inDegree = new Map<string, number>()
  for (const id of nodeIds) {
    inDegree.set(id, reverseAdjacency.get(id)?.length ?? 0)
  }

  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id)
  }

  const result: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue
    result.push(current)
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  // If any nodes weren't reached (cycles), append them
  for (const id of nodeIds) {
    if (!result.includes(id)) result.push(id)
  }

  return result
}
