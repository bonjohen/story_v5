/**
 * Zustand store for series management UI.
 * Manages series list, current series, bible state, and episode candidates.
 */

import { create } from 'zustand'
import type {
  Series,
  StoryBible,
  Episode,
  EpisodeSlot,
  StateSnapshot,
  CanonTimeline,
  OverarchingArc,
  PlotThread,
  SeriesConfig,
} from '../types.ts'
import type { SeriesStatusSummary, ThreadHealthMetrics, ArcAdvancementSuggestion, ThreadAgeInfo } from '../seriesManager.ts'
import { getSeriesStatus, computeThreadHealth, computeThreadAges, suggestThreadPriorities, suggestArcAdvancement } from '../seriesManager.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeriesListEntry {
  series_id: string
  title: string
  description: string
  episode_count: number
  current_phase: string
  updated_at: string
}

export interface SeriesStoreState {
  // Series list
  seriesList: SeriesListEntry[]
  seriesListLoading: boolean
  seriesListError: string | null

  // Current series
  currentSeries: Series | null
  currentSeriesLoading: boolean
  currentSeriesError: string | null

  // Derived state (computed from currentSeries)
  statusSummary: SeriesStatusSummary | null
  threadHealth: ThreadHealthMetrics | null
  threadAges: ThreadAgeInfo[]

  // Episode slot focus
  selectedSlot: EpisodeSlot | null
  selectedEpisodeId: string | null

  // Actions
  loadSeriesList: () => Promise<void>
  loadSeries: (seriesId: string) => Promise<void>
  setCurrentSeries: (series: Series) => void
  clearCurrentSeries: () => void
  selectSlot: (slotNumber: number) => void
  selectEpisode: (episodeId: string | null) => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSeriesStore = create<SeriesStoreState>((set, get) => ({
  // Initial state
  seriesList: [],
  seriesListLoading: false,
  seriesListError: null,
  currentSeries: null,
  currentSeriesLoading: false,
  currentSeriesError: null,
  statusSummary: null,
  threadHealth: null,
  threadAges: [],
  selectedSlot: null,
  selectedEpisodeId: null,

  loadSeriesList: async () => {
    set({ seriesListLoading: true, seriesListError: null })
    try {
      // In browser context, fetch from the series output directory
      const response = await fetch('/api/series')
      if (!response.ok) {
        // If API not available, try loading from a manifest
        set({ seriesList: [], seriesListLoading: false })
        return
      }
      const data = (await response.json()) as SeriesListEntry[]
      set({ seriesList: data, seriesListLoading: false })
    } catch {
      // Graceful fallback — series API may not be running
      set({ seriesList: [], seriesListLoading: false, seriesListError: null })
    }
  },

  loadSeries: async (seriesId: string) => {
    set({ currentSeriesLoading: true, currentSeriesError: null })
    try {
      const response = await fetch(`/api/series/${seriesId}`)
      if (!response.ok) throw new Error(`Failed to load series: ${response.status}`)
      const series = (await response.json()) as Series
      get().setCurrentSeries(series)
      set({ currentSeriesLoading: false })
    } catch (err) {
      set({
        currentSeriesError: err instanceof Error ? err.message : String(err),
        currentSeriesLoading: false,
      })
    }
  },

  setCurrentSeries: (series: Series) => {
    const statusSummary = getSeriesStatus(series)
    const threadHealth = computeThreadHealth(series.bible, series.canon_timeline)
    const threadAges = computeThreadAges(series.bible, series.canon_timeline)

    set({
      currentSeries: series,
      statusSummary,
      threadHealth,
      threadAges,
      selectedSlot: null,
      selectedEpisodeId: null,
    })
  },

  clearCurrentSeries: () => {
    set({
      currentSeries: null,
      statusSummary: null,
      threadHealth: null,
      threadAges: [],
      selectedSlot: null,
      selectedEpisodeId: null,
    })
  },

  selectSlot: (slotNumber: number) => {
    const series = get().currentSeries
    if (!series) return
    const slot = series.slots.find((s) => s.slot_number === slotNumber) ?? null
    set({ selectedSlot: slot })
  },

  selectEpisode: (episodeId: string | null) => {
    set({ selectedEpisodeId: episodeId })
  },
}))
