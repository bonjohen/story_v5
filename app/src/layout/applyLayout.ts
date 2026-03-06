import type { Core } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { isGenreGraph } from '../graph-engine/index.ts'
import { layoutArchetype } from './archetypeLayout.ts'
import { layoutGenre } from './genreLayout.ts'
import { loadPositions, applyPositions } from './positionStore.ts'

/**
 * Apply the correct layout mode based on graph type.
 * If saved positions exist for this graph, use those instead of computing layout.
 */
export function applyLayout(cy: Core, normalized: NormalizedGraph, graphId?: string) {
  if (graphId) {
    const saved = loadPositions(graphId)
    if (saved) {
      const applied = applyPositions(cy, saved)
      if (applied) return
    }
  }

  if (isGenreGraph(normalized.graph)) {
    layoutGenre(cy, normalized)
  } else {
    layoutArchetype(cy, normalized)
  }
}
