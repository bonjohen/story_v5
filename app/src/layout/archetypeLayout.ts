import type { Core } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/**
 * Archetype layout: rectangular grid approximating screen aspect ratio.
 * Nodes are positioned in reading order (left-to-right, top-to-bottom)
 * following topological sort. Variant nodes (50-79 range) are offset
 * below their predecessor.
 */
export function layoutArchetype(cy: Core, normalized: NormalizedGraph) {
  const { graph, adjacency, reverseAdjacency } = normalized

  // Topological sort to determine narrative sequence
  const order = topologicalSort(graph.nodes.map((n) => n.node_id), adjacency, reverseAdjacency)

  // Separate main-path and variant nodes
  const mainNodes: string[] = []
  const variantNodes: string[] = []

  for (const id of order) {
    if (/_(N[5-7]\d)_/.test(id)) {
      variantNodes.push(id)
    } else {
      mainNodes.push(id)
    }
  }

  // Compute grid dimensions targeting ~16:9 aspect ratio
  const n = mainNodes.length
  // Target aspect ratio: cols/rows ~= 16/9 ~= 1.78
  // cols * rows >= n, cols/rows ~= 1.78
  // cols = sqrt(n * 1.78), rows = ceil(n / cols)
  const TARGET_ASPECT = 1.78
  let cols = Math.max(1, Math.round(Math.sqrt(n * TARGET_ASPECT)))
  let rows = Math.ceil(n / cols)
  // If the grid is too narrow, adjust
  if (cols < 2 && n > 1) { cols = 2; rows = Math.ceil(n / cols) }

  const NODE_W = 140
  const NODE_H = 140
  const H_SPACING = NODE_W + 60
  const V_SPACING = NODE_H + 60
  const MARGIN = 80

  // Position main-path nodes in grid reading order
  for (let i = 0; i < mainNodes.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const node = cy.getElementById(mainNodes[i])
    node.position({
      x: MARGIN + col * H_SPACING + NODE_W / 2,
      y: MARGIN + row * V_SPACING + NODE_H / 2,
    })
  }

  // Position variant nodes below their predecessor in the same column
  const variantCountPerCol = new Map<number, number>()
  for (const id of variantNodes) {
    const parents = reverseAdjacency.get(id) ?? []
    // Find the parent's grid position
    let parentCol = 0
    if (parents.length > 0) {
      const parentIdx = mainNodes.indexOf(parents[0])
      if (parentIdx >= 0) {
        parentCol = parentIdx % cols
      }
    }

    const count = variantCountPerCol.get(parentCol) ?? 0
    variantCountPerCol.set(parentCol, count + 1)

    const node = cy.getElementById(id)
    node.position({
      x: MARGIN + parentCol * H_SPACING + NODE_W / 2,
      y: MARGIN + (rows + count) * V_SPACING + NODE_H / 2,
    })
  }

  // Fit to viewport with padding
  cy.fit(undefined, 30)
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
