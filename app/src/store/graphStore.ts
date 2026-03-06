/**
 * Zustand store for application state.
 * Manages dual graph display (archetype + genre), selection, and panel state.
 *
 * MDI model: both archetype and genre graphs are loaded simultaneously.
 * `currentGraph` points to whichever graph was last interacted with,
 * keeping existing panels compatible.
 */

import { create } from 'zustand'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import type { DataManifest } from '../types/graph.ts'
import { parseGraphJson, normalizeGraph } from '../graph-engine/index.ts'

export interface GraphStoreState {
  // Dual graphs (both loaded simultaneously)
  archetypeGraph: NormalizedGraph | null
  archetypeDir: string | null
  genreGraph: NormalizedGraph | null
  genreDir: string | null

  // Active graph pointer (last interacted — for panel compatibility)
  currentGraph: NormalizedGraph | null
  viewMode: 'archetype' | 'genre'
  graphId: string | null // "archetype/01_heros_journey" format

  // Loading
  loading: boolean
  error: string | null

  // Data manifest (loaded once at startup)
  manifest: DataManifest | null

  // Selection (shared — node IDs don't collide across graphs)
  selectedNodeId: string | null
  selectedEdgeId: string | null
  highlightedPath: string[]

  // Actions
  setCurrentGraph: (graph: NormalizedGraph) => void
  selectNode: (nodeId: string | null) => void
  selectEdge: (edgeId: string | null) => void
  setHighlightedPath: (path: string[]) => void
  clearSelection: () => void
  setManifest: (manifest: DataManifest) => void
  loadArchetypeGraph: (dir: string) => Promise<void>
  loadGenreGraph: (dir: string) => Promise<void>
  activateGraph: (type: 'archetype' | 'genre') => void

  // Legacy compat
  loadGraph: (type: 'archetype' | 'genre', dir: string) => Promise<void>
}

async function fetchGraph(type: 'archetype' | 'genre', dir: string): Promise<NormalizedGraph> {
  const basePath = type === 'archetype' ? `archetypes/${dir}` : `genres/${dir}`
  const url = `${import.meta.env.BASE_URL}data/${basePath}/graph.json`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) throw new Error(`Expected JSON but got ${contentType}`)
  const raw: unknown = await response.json()
  const graph = parseGraphJson(raw)
  return normalizeGraph(graph)
}

export const useGraphStore = create<GraphStoreState>((set, get) => ({
  archetypeGraph: null,
  archetypeDir: null,
  genreGraph: null,
  genreDir: null,
  currentGraph: null,
  viewMode: 'archetype',
  graphId: null,
  loading: false,
  error: null,
  manifest: null,
  selectedNodeId: null,
  selectedEdgeId: null,
  highlightedPath: [],

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

  setManifest: (manifest) => set({ manifest }),

  loadArchetypeGraph: async (dir) => {
    const current = get()
    if (current.archetypeDir === dir && current.archetypeGraph) return

    set({ loading: true, error: null })
    try {
      const normalized = await fetchGraph('archetype', dir)
      set({
        archetypeGraph: normalized,
        archetypeDir: dir,
        currentGraph: normalized,
        viewMode: 'archetype',
        graphId: `archetype/${dir}`,
        loading: false,
        selectedNodeId: null,
        selectedEdgeId: null,
        highlightedPath: [],
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load archetype',
        loading: false,
      })
    }
  },

  loadGenreGraph: async (dir) => {
    const current = get()
    if (current.genreDir === dir && current.genreGraph) return

    set({ loading: true, error: null })
    try {
      const normalized = await fetchGraph('genre', dir)
      set({
        genreGraph: normalized,
        genreDir: dir,
        currentGraph: normalized,
        viewMode: 'genre',
        graphId: `genre/${dir}`,
        loading: false,
        selectedNodeId: null,
        selectedEdgeId: null,
        highlightedPath: [],
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load genre',
        loading: false,
      })
    }
  },

  activateGraph: (type) => {
    const state = get()
    if (type === 'archetype' && state.archetypeGraph) {
      set({
        currentGraph: state.archetypeGraph,
        viewMode: 'archetype',
        graphId: `archetype/${state.archetypeDir}`,
      })
    } else if (type === 'genre' && state.genreGraph) {
      set({
        currentGraph: state.genreGraph,
        viewMode: 'genre',
        graphId: `genre/${state.genreDir}`,
      })
    }
  },

  // Legacy: dispatches to the appropriate loader
  loadGraph: async (type, dir) => {
    if (type === 'archetype') {
      await get().loadArchetypeGraph(dir)
    } else {
      await get().loadGenreGraph(dir)
    }
  },
}))
