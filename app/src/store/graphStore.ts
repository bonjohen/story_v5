/**
 * Zustand store for application state.
 * Manages current graph, selection, UI mode, sidebar, loading, and panel state.
 */

import { create } from 'zustand'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import type { DataManifest } from '../types/graph.ts'
import { parseGraphJson, normalizeGraph } from '../graph-engine/index.ts'

export interface GraphStoreState {
  // Current graph
  currentGraph: NormalizedGraph | null
  viewMode: 'archetype' | 'genre'
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

  // UI panels
  sidebarOpen: boolean

  // Actions
  setCurrentGraph: (graph: NormalizedGraph) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  setHighlightedPath: (path: string[]) => void
  clearSelection: () => void
  toggleSidebar: () => void
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
  sidebarOpen: true,

  setCurrentGraph: (graph) =>
    set({
      currentGraph: graph,
      selectedNodeId: null,
      selectedEdgeId: null,
      highlightedPath: [],
    }),

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

  clearSelection: () =>
    set({
      selectedNodeId: null,
      selectedEdgeId: null,
      highlightedPath: [],
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
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
      const contentType = response.headers.get('content-type') ?? ''
      if (!contentType.includes('json')) throw new Error(`Expected JSON but got ${contentType}`)
      const raw: unknown = await response.json()
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
