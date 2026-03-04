/**
 * Zustand store for application state.
 * Manages current graph, selection, UI mode, sidebar, loading, and panel state.
 */

import { create } from 'zustand'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import type { DataManifest } from '../types/graph.ts'
import { parseGraphJson, normalizeGraph } from '../graph-engine/index.ts'

export type ViewMode = 'archetype' | 'genre'
export type PanelId = 'detail' | 'examples' | 'narrative' | 'comparison'

export interface GraphStoreState {
  // Current graph
  currentGraph: NormalizedGraph | null
  viewMode: ViewMode
  graphId: string | null // "archetype/01_heros_journey" format

  // Loading
  loading: boolean
  error: string | null

  // Data manifest (loaded once at startup)
  manifest: DataManifest | null

  // Selection
  selectedNodeId: string | null
  selectedEdgeId: string | null
  highlightedPath: string[]

  // Variant toggle
  showVariants: boolean

  // UI panels
  sidebarOpen: boolean
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
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setManifest: (manifest: DataManifest) => void
  loadGraph: (type: 'archetype' | 'genre', dir: string) => Promise<void>
}

export const useGraphStore = create<GraphStoreState>((set, get) => ({
  currentGraph: null,
  viewMode: 'archetype',
  graphId: null,
  loading: false,
  error: null,
  manifest: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  highlightedPath: [],
  showVariants: true,
  sidebarOpen: true,
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

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setManifest: (manifest) => set({ manifest }),

  loadGraph: async (type, dir) => {
    const newId = `${type}/${dir}`
    const current = get()
    // Skip if already loaded
    if (current.graphId === newId && current.currentGraph && !current.error) return

    set({
      loading: true,
      error: null,
      graphId: newId,
    })

    try {
      const basePath =
        type === 'archetype' ? `archetypes/${dir}` : `genres/${dir}`
      const url = `../data/${basePath}/graph.json`
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
      const raw = await response.json()
      const graph = parseGraphJson(raw)
      const normalized = normalizeGraph(graph)
      set({
        currentGraph: normalized,
        viewMode: type,
        loading: false,
        selectedNodeId: null,
        selectedEdgeId: null,
        highlightedPath: [],
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load graph',
        loading: false,
      })
    }
  },
}))
