/**
 * Simulation store — manages step-by-step graph traversal state.
 * Separate from graphStore to keep concerns clean.
 */

import { create } from 'zustand'
import type { NormalizedGraph } from '../graph-engine/index.ts'

export interface SimulationState {
  active: boolean
  currentNodeId: string | null
  visitedNodes: string[]
  visitedEdges: string[]
  availableEdges: string[] // edge IDs the user can click next
  totalNodes: number

  // Actions
  startSimulation: (graph: NormalizedGraph, startNodeId: string) => void
  advanceToNode: (graph: NormalizedGraph, edgeId: string, targetNodeId: string) => void
  resetSimulation: () => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  active: false,
  currentNodeId: null,
  visitedNodes: [],
  visitedEdges: [],
  availableEdges: [],
  totalNodes: 0,

  startSimulation: (graph, startNodeId) => {
    const availableEdges = graph.graph.edges
      .filter((e) => e.from === startNodeId)
      .map((e) => e.edge_id)

    set({
      active: true,
      currentNodeId: startNodeId,
      visitedNodes: [startNodeId],
      visitedEdges: [],
      availableEdges,
      totalNodes: graph.graph.nodes.length,
    })
  },

  advanceToNode: (graph, edgeId, targetNodeId) => {
    set((state) => {
      const visitedNodes = state.visitedNodes.includes(targetNodeId)
        ? state.visitedNodes
        : [...state.visitedNodes, targetNodeId]
      const visitedEdges = [...state.visitedEdges, edgeId]

      const availableEdges = graph.graph.edges
        .filter((e) => e.from === targetNodeId)
        .map((e) => e.edge_id)

      return {
        currentNodeId: targetNodeId,
        visitedNodes,
        visitedEdges,
        availableEdges,
      }
    })
  },

  resetSimulation: () =>
    set({
      active: false,
      currentNodeId: null,
      visitedNodes: [],
      visitedEdges: [],
      availableEdges: [],
      totalNodes: 0,
    }),
}))
