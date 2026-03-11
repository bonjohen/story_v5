/**
 * Zustand store for story element data.
 * Manages loaded element templates, example instances, and genre constraints.
 * Loads data lazily when an archetype or genre is viewed.
 */

import { create } from 'zustand'
import type { ArchetypeElements, ExampleElements } from '../types/elements.ts'
import type { GenreElementConstraints } from '../types/element-constraints.ts'
import type { ArchetypeElementsWithTimeline } from '../types/timeline.ts'

export interface EmotionalArcPoint {
  node_id: string
  position: number
  tension: number
  hope: number
  fear: number
  resolution: number
}

export interface ArchetypeEmotionalArc {
  archetype: string
  archetype_id: string
  arc_profile: EmotionalArcPoint[]
  variant_profiles: Array<EmotionalArcPoint & { branches_from: string }>
  arc_shape: string
  dominant_emotion: string
  emotional_range: number
  summary: string
}

export interface ElementStoreState {
  // Archetype element templates (keyed by dir, e.g. "01_heros_journey")
  archetypeElements: Map<string, ArchetypeElements>
  // Example element instances (keyed by dir)
  exampleElements: Map<string, ExampleElements & { story_title?: string; timeline?: unknown }>
  // Timeline data (keyed by dir)
  archetypeTimelines: Map<string, ArchetypeElementsWithTimeline>
  // Genre element constraints (keyed by dir)
  genreConstraints: Map<string, GenreElementConstraints>
  // Emotional arc data (keyed by archetype_id dir)
  emotionalArcs: Map<string, ArchetypeEmotionalArc>
  emotionalArcsLoaded: boolean

  // Loading state
  loadingElements: boolean
  loadingConstraints: boolean
  elementError: string | null
  constraintError: string | null

  // Actions
  loadArchetypeElements: (dir: string) => Promise<void>
  loadGenreConstraints: (dir: string) => Promise<void>
  loadEmotionalArcs: () => Promise<void>
  clearElements: () => void
}

export const useElementStore = create<ElementStoreState>((set, get) => ({
  archetypeElements: new Map(),
  exampleElements: new Map(),
  archetypeTimelines: new Map(),
  genreConstraints: new Map(),
  emotionalArcs: new Map(),
  emotionalArcsLoaded: false,
  loadingElements: false,
  loadingConstraints: false,
  elementError: null,
  constraintError: null,

  loadArchetypeElements: async (dir: string) => {
    // Skip if already loaded
    if (get().archetypeElements.has(dir)) return

    set({ loadingElements: true, elementError: null })

    try {
      // Load elements.json
      const elemUrl = `${import.meta.env.BASE_URL}data/archetypes/${dir}/elements.json`
      const elemResponse = await fetch(elemUrl)
      if (elemResponse.ok) {
        const elemData = await elemResponse.json() as ArchetypeElements & { template_timeline?: unknown }
        const elements: ArchetypeElements = {
          archetype_id: elemData.archetype_id,
          element_templates: elemData.element_templates,
        }
        set((state) => {
          const newMap = new Map(state.archetypeElements)
          newMap.set(dir, elements)
          // Store timeline data separately if present
          const newTimelines = new Map(state.archetypeTimelines)
          if (elemData.template_timeline) {
            newTimelines.set(dir, elemData as unknown as ArchetypeElementsWithTimeline)
          }
          return { archetypeElements: newMap, archetypeTimelines: newTimelines }
        })
      }

      // Try to load examples_elements.json (optional)
      const exUrl = `${import.meta.env.BASE_URL}data/archetypes/${dir}/examples_elements.json`
      const exResponse = await fetch(exUrl)
      if (exResponse.ok) {
        const exData = await exResponse.json() as ExampleElements & { story_title?: string; timeline?: unknown }
        set((state) => {
          const newMap = new Map(state.exampleElements)
          newMap.set(dir, exData)
          return { exampleElements: newMap }
        })
      }

      set({ loadingElements: false })
    } catch (err) {
      set({
        elementError: err instanceof Error ? err.message : 'Failed to load elements',
        loadingElements: false,
      })
    }
  },

  loadGenreConstraints: async (dir: string) => {
    // Skip if already loaded
    if (get().genreConstraints.has(dir)) return

    set({ loadingConstraints: true, constraintError: null })

    try {
      const url = `${import.meta.env.BASE_URL}data/genres/${dir}/elements.json`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json() as GenreElementConstraints
        set((state) => {
          const newMap = new Map(state.genreConstraints)
          newMap.set(dir, data)
          return { genreConstraints: newMap }
        })
      }
      // If 404, this genre just doesn't have constraints — not an error
      set({ loadingConstraints: false })
    } catch (err) {
      set({
        constraintError: err instanceof Error ? err.message : 'Failed to load constraints',
        loadingConstraints: false,
      })
    }
  },

  loadEmotionalArcs: async () => {
    if (get().emotionalArcsLoaded) return

    try {
      const url = `${import.meta.env.BASE_URL}data/cross_references/archetype_emotional_arcs.json`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json() as { archetypes: ArchetypeEmotionalArc[] }
        const arcsMap = new Map<string, ArchetypeEmotionalArc>()
        for (const arc of data.archetypes) {
          arcsMap.set(arc.archetype_id, arc)
        }
        set({ emotionalArcs: arcsMap, emotionalArcsLoaded: true })
      }
    } catch (err) {
      console.warn('Failed to load emotional arcs:', err)
    }
  },

  clearElements: () => set({
    archetypeElements: new Map(),
    exampleElements: new Map(),
    archetypeTimelines: new Map(),
    genreConstraints: new Map(),
    emotionalArcs: new Map(),
    emotionalArcsLoaded: false,
    elementError: null,
    constraintError: null,
  }),
}))
