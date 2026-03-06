import type { Core } from 'cytoscape'

const PREFIX = 'node-positions:'

export interface NodePositions {
  [nodeId: string]: { x: number; y: number }
}

export function loadPositions(graphId: string): NodePositions | null {
  try {
    const raw = localStorage.getItem(PREFIX + graphId)
    if (!raw) return null
    return JSON.parse(raw) as NodePositions
  } catch {
    return null
  }
}

export function savePositions(graphId: string, cy: Core) {
  const positions: NodePositions = {}
  cy.nodes().forEach((node) => {
    const pos = node.position()
    positions[node.id()] = { x: pos.x, y: pos.y }
  })
  try {
    localStorage.setItem(PREFIX + graphId, JSON.stringify(positions))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function applyPositions(cy: Core, positions: NodePositions): boolean {
  let applied = false
  cy.nodes().forEach((node) => {
    const pos = positions[node.id()]
    if (pos) {
      node.position(pos)
      applied = true
    }
  })
  return applied
}
