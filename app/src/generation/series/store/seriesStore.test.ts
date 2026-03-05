/**
 * Tests for the series store.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useSeriesStore } from './seriesStore.ts'
import type { Series } from '../types.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSeries(): Series {
  return {
    series_id: 'SER_test',
    title: 'Test Series',
    description: 'A test',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
    theme_tone: {
      genre_id: '06_science_fiction', genre_name: 'Science Fiction',
      tone_marker: 'wonder', themes: ['exploration'], mood: 'adventurous',
      content_limits: [], style_notes: [],
    },
    overarching_arc: {
      archetype_id: '01_heros_journey',
      archetype_name: "Hero's Journey",
      current_phase: 'HJ_N02_CALL',
      phase_history: [
        { node_id: 'HJ_N01', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_002_a' },
        { node_id: 'HJ_N02_CALL', entered_at_episode: 'EP_003_a' },
      ],
      remaining_phases: ['HJ_N03_MENTOR'],
      advancement_mode: 'hybrid',
    },
    lore: {
      schema_version: '1.0.0',
      last_updated: '2026-01-03T00:00:00Z',
      last_updated_by: 'EP_003_a',
      characters: [
        {
          id: 'char_hero', name: 'Hero', role: 'protagonist',
          traits: ['brave'], motivations: ['save world'],
          arc_type: 'transformative', relationships: [],
          status: 'alive', introduced_in: 'EP_001_a', last_appeared_in: 'EP_003_a',
          knowledge: [], possessions: [], arc_milestones: [],
        },
      ],
      places: [],
      objects: [],
      factions: [],
      plot_threads: [
        {
          id: 'PT_001', title: 'Main Quest', description: 'Find the temple',
          status: 'open', urgency: 'high',
          introduced_in: 'EP_001_a', progressed_in: ['EP_002_a'],
          related_characters: ['char_hero'],
        },
      ],
      world_rules: [],
      event_log: [],
    },
    canon_timeline: {
      episodes: [
        { slot: 1, episode_id: 'EP_001_a', title: 'The Beginning', canonized_at: '2026-01-01T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP001' },
        { slot: 2, episode_id: 'EP_002_a', title: 'The Call', canonized_at: '2026-01-02T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP002' },
        { slot: 3, episode_id: 'EP_003_a', title: 'Acceptance', canonized_at: '2026-01-03T00:00:00Z', overarching_phase: 'HJ_N02_CALL', snapshot_id: 'SNAP_EP003' },
      ],
    },
    episode_index: { episodes: [] },
    slots: [
      { slot_number: 1, target_arc_phase: 'HJ_N01', candidates: ['EP_001_a'], canon_episode: 'EP_001_a', status: 'canonized' },
      { slot_number: 2, target_arc_phase: 'HJ_N01', candidates: ['EP_002_a'], canon_episode: 'EP_002_a', status: 'canonized' },
      { slot_number: 3, target_arc_phase: 'HJ_N02_CALL', candidates: ['EP_003_a'], canon_episode: 'EP_003_a', status: 'canonized' },
    ],
    episode_count: 3,
    total_candidates_generated: 3,
    corpus_hash: 'test',
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seriesStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useSeriesStore.setState({
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
    })
  })

  it('setCurrentSeries computes derived state', () => {
    const series = makeSeries()
    useSeriesStore.getState().setCurrentSeries(series)

    const state = useSeriesStore.getState()
    expect(state.currentSeries).toBe(series)
    expect(state.statusSummary).not.toBeNull()
    expect(state.statusSummary!.title).toBe('Test Series')
    expect(state.statusSummary!.episode_count).toBe(3)
    expect(state.threadHealth).not.toBeNull()
    expect(state.threadAges.length).toBeGreaterThan(0)
  })

  it('clearCurrentSeries resets state', () => {
    useSeriesStore.getState().setCurrentSeries(makeSeries())
    useSeriesStore.getState().clearCurrentSeries()

    const state = useSeriesStore.getState()
    expect(state.currentSeries).toBeNull()
    expect(state.statusSummary).toBeNull()
    expect(state.threadHealth).toBeNull()
    expect(state.threadAges).toHaveLength(0)
  })

  it('selectSlot finds slot from series', () => {
    useSeriesStore.getState().setCurrentSeries(makeSeries())
    useSeriesStore.getState().selectSlot(2)

    const state = useSeriesStore.getState()
    expect(state.selectedSlot).not.toBeNull()
    expect(state.selectedSlot!.slot_number).toBe(2)
    expect(state.selectedSlot!.canon_episode).toBe('EP_002_a')
  })

  it('selectSlot handles missing slot', () => {
    useSeriesStore.getState().setCurrentSeries(makeSeries())
    useSeriesStore.getState().selectSlot(99)

    expect(useSeriesStore.getState().selectedSlot).toBeNull()
  })

  it('selectEpisode sets episode ID', () => {
    useSeriesStore.getState().selectEpisode('EP_002_a')
    expect(useSeriesStore.getState().selectedEpisodeId).toBe('EP_002_a')

    useSeriesStore.getState().selectEpisode(null)
    expect(useSeriesStore.getState().selectedEpisodeId).toBeNull()
  })
})
