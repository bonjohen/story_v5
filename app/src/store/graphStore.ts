/**
 * Zustand store for application state.
 * Manages current graph, selection, UI mode, and panel state.
 */

import { create } from 'zustand'
import type { NormalizedGraph } from '../graph-engine/index.ts'

export type ViewMode = 'archetype' | 'genre'
export type PanelId = 'detail' | 'examples' | 'narrative' | 'comparison'

export interface GraphStoreState {
  // Current graph
  currentGraph: NormalizedGraph | null
  viewMode: ViewMode

  // Selection
  selectedNodeId: string | null
  selectedEdgeId: string | null
  highlightedPath: string[]

  // Variant toggle
  showVariants: boolean

  // UI panels
  openPanels: Set<PanelId>

  // Actions
  setCurrentGraph: (graph: NormalizedGraph) => void
  setViewMode: (mode: ViewMode) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  setHighlightedPath: (path: string[]) => void
  toggleVariants: () => void
  togglePanel: (panel: PanelId) => void
  clearSelection: () => void
}

export const useGraphStore = create<GraphStoreState>((set) => ({
  currentGraph: null,
  viewMode: 'archetype',
  selectedNodeId: null,
  selectedEdgeId: null,
  highlightedPath: [],
  showVariants: true,
  openPanels: new Set<PanelId>(['detail']),

  setCurrentGraph: (graph) =>
    set({
      currentGraph: graph,
      selectedNodeId: null,
      selectedEdgeId: null,
      highlightedPath: [],
    }),

  setViewMode: (mode) => set({ viewMode: mode }),

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
    }),

  selectEdge: (edgeId) =>
    set({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
    }),

  setHighlightedPath: (path) => set({ highlightedPath: path }),

  toggleVariants: () => set((state) => ({ showVariants: !state.showVariants })),

  togglePanel: (panel) =>
    set((state) => {
      const next = new Set(state.openPanels)
      if (next.has(panel)) {
        next.delete(panel)
      } else {
        next.add(panel)
      }
      return { openPanels: next }
    }),

  clearSelection: () =>
    set({
      selectedNodeId: null,
      selectedEdgeId: null,
      highlightedPath: [],
    }),
}))
