import type { NormalizedGraph } from './normalizer.ts'

/**
 * Compute anti-pattern nodes for failure mode overlay.
 */
export function computeFailureModeNodes(graph: NormalizedGraph): string[] {
  return graph.graph.nodes
    .filter((n) => n.role === 'Anti-Pattern')
    .map((n) => n.node_id)
}
