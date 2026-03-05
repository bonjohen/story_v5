import { describe, it, expect } from 'vitest'
import {
  computeSeriesOverview,
  computeArcProgress,
  computeCharacterStats,
  computeThreadStats,
  computeSlotStats,
} from './seriesAnalytics.ts'
import type { Series, StoryBible, BibleCharacter, PlotThread } from './types.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBible(overrides: Partial<StoryBible> = {}): StoryBible {
  return {
    schema_version: '1.0.0',
    last_updated: '2025-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [],
    places: [],
    objects: [],
    factions: [],
    plot_threads: [],
    world_rules: [],
    event_log: [],
    ...overrides,
  }
}

function makeCharacter(id: string, overrides: Partial<BibleCharacter> = {}): BibleCharacter {
  return {
    id,
    name: `Char_${id}`,
    role: 'protagonist',
    traits: ['brave'],
    motivations: ['justice'],
    arc_type: 'transformative',
    relationships: [],
    status: 'alive',
    introduced_in: 'EP_001_a',
    last_appeared_in: 'EP_003_a',
    knowledge: ['secret_1'],
    possessions: ['sword'],
    arc_milestones: [
      { episode_id: 'EP_002_a', change_type: 'learns', description: 'Learned the truth' },
    ],
    ...overrides,
  }
}

function makeThread(id: string, overrides: Partial<PlotThread> = {}): PlotThread {
  return {
    id,
    title: `Thread ${id}`,
    description: 'A thread',
    status: 'open',
    urgency: 'medium',
    introduced_in: 'EP_001_a',
    progressed_in: [],
    related_characters: [],
    ...overrides,
  }
}

function makeSeries(overrides: Partial<Series> = {}): Series {
  return {
    series_id: 'SER_test',
    title: 'Test',
    description: '',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    theme_tone: {
      genre_id: 'g1', genre_name: 'Fantasy', tone_marker: 'dark',
      themes: [], mood: 'grim', content_limits: [], style_notes: [],
    },
    overarching_arc: {
      archetype_id: 'a1', archetype_name: "Hero's Journey",
      current_phase: 'HJ_N03',
      phase_history: [
        { node_id: 'HJ_N01', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_001_a' },
        { node_id: 'HJ_N02', entered_at_episode: 'EP_002_a', exited_at_episode: 'EP_002_a' },
      ],
      remaining_phases: ['HJ_N04', 'HJ_N05'],
      advancement_mode: 'hybrid',
    },
    bible: makeBible(),
    canon_timeline: {
      episodes: [
        { slot: 1, episode_id: 'EP_001_a', title: 'Ep 1', canonized_at: '2025-01-01T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP001' },
        { slot: 2, episode_id: 'EP_002_a', title: 'Ep 2', canonized_at: '2025-01-02T00:00:00Z', overarching_phase: 'HJ_N02', snapshot_id: 'SNAP_EP002' },
        { slot: 3, episode_id: 'EP_003_a', title: 'Ep 3', canonized_at: '2025-01-03T00:00:00Z', overarching_phase: 'HJ_N03', snapshot_id: 'SNAP_EP003' },
      ],
    },
    episode_index: {
      episodes: [
        { episode_id: 'EP_001_a', series_id: 'SER_test', slot_number: 1, candidate_label: 'a', title: 'Ep 1', synopsis: '', created_at: '', canon_status: 'canon', overarching_phase: 'HJ_N01', episodic_archetype_id: 'a1', artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' }, summary: { characters_featured: [], plot_threads_advanced: [], key_events: [] } },
        { episode_id: 'EP_002_a', series_id: 'SER_test', slot_number: 2, candidate_label: 'a', title: 'Ep 2', synopsis: '', created_at: '', canon_status: 'canon', overarching_phase: 'HJ_N02', episodic_archetype_id: 'a1', artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' }, summary: { characters_featured: [], plot_threads_advanced: [], key_events: [] } },
        { episode_id: 'EP_003_a', series_id: 'SER_test', slot_number: 3, candidate_label: 'a', title: 'Ep 3', synopsis: '', created_at: '', canon_status: 'canon', overarching_phase: 'HJ_N03', episodic_archetype_id: 'a1', artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' }, summary: { characters_featured: [], plot_threads_advanced: [], key_events: [] } },
        { episode_id: 'EP_002_b', series_id: 'SER_test', slot_number: 2, candidate_label: 'b', title: 'Ep 2 Alt', synopsis: '', created_at: '', canon_status: 'alternate', overarching_phase: 'HJ_N02', episodic_archetype_id: 'a1', artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' }, summary: { characters_featured: [], plot_threads_advanced: [], key_events: [] } },
      ],
    },
    slots: [
      { slot_number: 1, target_arc_phase: 'HJ_N01', candidates: ['EP_001_a'], canon_episode: 'EP_001_a', status: 'canonized' },
      { slot_number: 2, target_arc_phase: 'HJ_N02', candidates: ['EP_002_a', 'EP_002_b'], canon_episode: 'EP_002_a', status: 'canonized' },
      { slot_number: 3, target_arc_phase: 'HJ_N03', candidates: ['EP_003_a'], canon_episode: 'EP_003_a', status: 'canonized' },
    ],
    episode_count: 3,
    total_candidates_generated: 4,
    corpus_hash: 'abc',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seriesAnalytics', () => {
  describe('computeSeriesOverview', () => {
    it('computes correct overview stats', () => {
      const series = makeSeries()
      const stats = computeSeriesOverview(series)

      expect(stats.total_episodes).toBe(4)
      expect(stats.canon_episodes).toBe(3)
      expect(stats.alternate_episodes).toBe(1)
      expect(stats.total_candidates_generated).toBe(4)
    })

    it('counts bible entities', () => {
      const series = makeSeries({
        bible: makeBible({
          characters: [makeCharacter('c1'), makeCharacter('c2', { status: 'dead' })],
          places: [{ id: 'p1', name: 'Town', type: 'ordinary_world', description: '', introduced_in: 'EP_001_a', last_featured_in: 'EP_001_a', status: 'extant', events_here: [] }],
          plot_threads: [
            makeThread('t1', { status: 'open' }),
            makeThread('t2', { status: 'resolved' }),
          ],
        }),
      })
      const stats = computeSeriesOverview(series)

      expect(stats.total_characters).toBe(2)
      expect(stats.alive_characters).toBe(1)
      expect(stats.dead_characters).toBe(1)
      expect(stats.total_places).toBe(1)
      expect(stats.open_threads).toBe(1)
      expect(stats.resolved_threads).toBe(1)
    })
  })

  describe('computeArcProgress', () => {
    it('computes arc progress correctly', () => {
      const series = makeSeries()
      const progress = computeArcProgress(series)

      expect(progress.archetype_name).toBe("Hero's Journey")
      expect(progress.total_phases).toBe(4) // 2 history + 2 remaining
      expect(progress.completed_phases).toBe(2)
      expect(progress.current_phase).toBe('HJ_N03')
      expect(progress.remaining_phases).toBe(2)
      expect(progress.progress_percentage).toBe(50)
    })

    it('counts episodes in current phase', () => {
      const series = makeSeries()
      const progress = computeArcProgress(series)
      expect(progress.episodes_in_current_phase).toBe(1) // EP_003_a is in HJ_N03
    })
  })

  describe('computeCharacterStats', () => {
    it('computes stats for each character', () => {
      const bible = makeBible({
        characters: [makeCharacter('c1'), makeCharacter('c2', { status: 'dead', arc_milestones: [] })],
      })
      const stats = computeCharacterStats(bible)

      expect(stats).toHaveLength(2)
      expect(stats[0].character_id).toBe('c1')
      expect(stats[0].arc_milestones).toBe(1)
      expect(stats[0].knowledge_items).toBe(1)
      expect(stats[0].possessions).toBe(1)
    })
  })

  describe('computeThreadStats', () => {
    it('computes thread statistics', () => {
      const bible = makeBible({
        plot_threads: [
          makeThread('t1', { status: 'open', progressed_in: ['EP_002_a'] }),
          makeThread('t2', { status: 'resolved', progressed_in: ['EP_001_a', 'EP_002_a'], resolved_in: 'EP_003_a' }),
          makeThread('t3', { status: 'progressing', progressed_in: ['EP_001_a', 'EP_002_a', 'EP_003_a'] }),
        ],
      })
      const stats = computeThreadStats(bible)

      expect(stats.total).toBe(3)
      expect(stats.open).toBe(1)
      expect(stats.progressing).toBe(1)
      expect(stats.resolved).toBe(1)
      expect(stats.resolution_rate).toBeCloseTo(0.33, 1)
    })

    it('identifies longest running thread', () => {
      const bible = makeBible({
        plot_threads: [
          makeThread('t1', { status: 'open', progressed_in: ['EP_002_a'] }),
          makeThread('t2', { status: 'progressing', progressed_in: ['EP_001_a', 'EP_002_a', 'EP_003_a'] }),
        ],
      })
      const stats = computeThreadStats(bible)

      expect(stats.longest_running_thread?.id).toBe('t2')
      expect(stats.longest_running_thread?.episodes).toBe(4) // 3 progressions + 1
    })
  })

  describe('computeSlotStats', () => {
    it('computes slot statistics', () => {
      const series = makeSeries()
      const stats = computeSlotStats(series)

      expect(stats.total_slots).toBe(3)
      expect(stats.canonized_slots).toBe(3)
      expect(stats.total_candidates).toBe(4)
      expect(stats.average_candidates_per_slot).toBeCloseTo(1.3, 1)
    })
  })
})
