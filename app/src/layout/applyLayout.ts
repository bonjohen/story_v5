import type { Core } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { isGenreGraph } from '../graph-engine/index.ts'
import { layoutArchetype } from './archetypeLayout.ts'
import { layoutGenre } from './genreLayout.ts'

/**
 * Apply the correct layout mode based on graph type.
 * Archetype: horizontal left-to-right (time axis)
 * Genre: vertical top-to-bottom (depth axis)
 */
export function applyLayout(cy: Core, normalized: NormalizedGraph) {
  if (isGenreGraph(normalized.graph)) {
    layoutGenre(cy, normalized)
  } else {
    layoutArchetype(cy, normalized)
  }
}
