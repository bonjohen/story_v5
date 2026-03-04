import type { Core } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import type { GenreGraph, GenreNode } from '../types/graph.ts'

/**
 * Genre layout: vertical top-to-bottom depth axis.
 * Nodes grouped by level (1–5 rows), with Tone Marker and Anti-Pattern
 * placed to the side. Progressive narrowing width represents constraint reduction.
 */
export function layoutGenre(cy: Core, normalized: NormalizedGraph) {
  const graph = normalized.graph as GenreGraph

  // Group nodes by level
  const levels = new Map<number | string, GenreNode[]>()
  const toneNodes: GenreNode[] = []
  const antiNodes: GenreNode[] = []

  for (const node of graph.nodes) {
    if (node.role === 'Tone Marker') {
      toneNodes.push(node)
    } else if (node.role === 'Anti-Pattern') {
      antiNodes.push(node)
    } else if (node.level != null) {
      const group = levels.get(node.level) ?? []
      group.push(node)
      levels.set(node.level, group)
    }
  }

  const ROW_SPACING = 140
  const START_Y = 60
  const CENTER_X = 500

  // Width narrows progressively (design spec: constraint reduction)
  const LEVEL_WIDTHS: Record<number, number> = {
    1: 200,
    2: 400,
    3: 600,
    4: 500,
    5: 400,
  }

  // Position each level's nodes in a horizontal row
  for (let level = 1; level <= 5; level++) {
    const nodes = levels.get(level) ?? []
    const y = START_Y + (level - 1) * ROW_SPACING
    const totalWidth = LEVEL_WIDTHS[level] ?? 400
    const spacing = nodes.length > 1 ? totalWidth / (nodes.length - 1) : 0
    const startX = CENTER_X - totalWidth / 2

    nodes.forEach((node, i) => {
      const x = nodes.length === 1 ? CENTER_X : startX + i * spacing
      cy.getElementById(node.node_id).position({ x, y })
    })
  }

  // Position Tone Marker nodes to the right of Level 2
  const TONE_X = CENTER_X + 380
  toneNodes.forEach((node, i) => {
    const y = START_Y + ROW_SPACING * 0.5 + i * 80
    cy.getElementById(node.node_id).position({ x: TONE_X, y })
  })

  // Position Anti-Pattern nodes to the right of Level 4-5
  const ANTI_X = CENTER_X + 380
  antiNodes.forEach((node, i) => {
    const y = START_Y + ROW_SPACING * 3.5 + i * 80
    cy.getElementById(node.node_id).position({ x: ANTI_X, y })
  })

  cy.fit(undefined, 40)
}
