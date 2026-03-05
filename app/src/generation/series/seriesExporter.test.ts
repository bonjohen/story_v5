import { describe, it, expect } from 'vitest'
import {
  exportSeriesToMarkdown,
  exportEpisodeToMarkdown,
  exportBibleToMarkdown,
  exportTimelineToMarkdown,
} from './seriesExporter.ts'
import type { Series, StoryBible, Episode } from './types.ts'

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

function makeSeries(overrides: Partial<Series> = {}): Series {
  return {
    series_id: 'SER_test',
    title: 'The Grand Adventure',
    description: 'An epic tale of heroism',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    theme_tone: {
      genre_id: 'g1', genre_name: 'Fantasy', tone_marker: 'epic',
      themes: ['heroism'], mood: 'adventurous', content_limits: [], style_notes: [],
    },
    overarching_arc: {
      archetype_id: 'a1', archetype_name: "Hero's Journey",
      current_phase: 'HJ_N02',
      phase_history: [
        { node_id: 'HJ_N01', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_001_a' },
      ],
      remaining_phases: ['HJ_N03'],
      advancement_mode: 'hybrid',
    },
    bible: makeBible({
      characters: [
        {
          id: 'c1', name: 'Hero', role: 'protagonist', traits: ['brave'], motivations: ['justice'],
          arc_type: null, relationships: [], status: 'alive',
          introduced_in: 'EP_001_a', last_appeared_in: 'EP_002_a',
          knowledge: [], possessions: [], arc_milestones: [],
        },
      ],
      places: [
        { id: 'p1', name: 'Village', type: 'ordinary_world', description: 'A quiet town',
          introduced_in: 'EP_001_a', last_featured_in: 'EP_001_a', status: 'extant', events_here: [] },
      ],
    }),
    canon_timeline: {
      episodes: [
        { slot: 1, episode_id: 'EP_001_a', title: 'The Beginning', canonized_at: '2025-01-01T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP001' },
        { slot: 2, episode_id: 'EP_002_a', title: 'The Call', canonized_at: '2025-01-02T00:00:00Z', overarching_phase: 'HJ_N02', snapshot_id: 'SNAP_EP002' },
      ],
    },
    episode_index: {
      episodes: [
        {
          episode_id: 'EP_001_a', series_id: 'SER_test', slot_number: 1, candidate_label: 'a',
          title: 'The Beginning', synopsis: 'The hero is introduced',
          created_at: '2025-01-01T00:00:00Z', canon_status: 'canon',
          overarching_phase: 'HJ_N01', episodic_archetype_id: 'a1',
          artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' },
          summary: { characters_featured: ['c1'], plot_threads_advanced: [], key_events: ['Hero introduced'] },
        },
        {
          episode_id: 'EP_002_a', series_id: 'SER_test', slot_number: 2, candidate_label: 'a',
          title: 'The Call', synopsis: 'The hero receives the call to adventure',
          created_at: '2025-01-02T00:00:00Z', canon_status: 'canon',
          overarching_phase: 'HJ_N02', episodic_archetype_id: 'a1',
          artifacts: { request: '', selection_result: '', story_contract: '', story_plan: '', scene_drafts: [], validation_results: '', story_trace: '', compliance_report: '' },
          summary: { characters_featured: ['c1'], plot_threads_advanced: [], key_events: ['Call received'] },
        },
      ],
    },
    slots: [],
    episode_count: 2,
    total_candidates_generated: 2,
    corpus_hash: 'abc',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('seriesExporter', () => {
  describe('exportSeriesToMarkdown', () => {
    it('includes series title and description', () => {
      const series = makeSeries()
      const md = exportSeriesToMarkdown(series, new Map())

      expect(md).toContain('# The Grand Adventure')
      expect(md).toContain('An epic tale of heroism')
    })

    it('includes arc progress when enabled', () => {
      const series = makeSeries()
      const md = exportSeriesToMarkdown(series, new Map(), { includeArcProgress: true })

      expect(md).toContain('## Arc Progress')
      expect(md).toContain("Hero's Journey")
    })

    it('includes bible summary when enabled', () => {
      const series = makeSeries()
      const md = exportSeriesToMarkdown(series, new Map(), { includeBibleSummary: true })

      expect(md).toContain('## Story Bible Summary')
      expect(md).toContain('Hero')
    })

    it('includes episode content', () => {
      const series = makeSeries()
      const scenes = new Map<string, string[]>()
      scenes.set('EP_001_a', ['Once upon a time...', 'The hero awoke.'])

      const md = exportSeriesToMarkdown(series, scenes)

      expect(md).toContain('## Episode 1: The Beginning')
      expect(md).toContain('Once upon a time...')
    })

    it('respects maxEpisodes option', () => {
      const series = makeSeries()
      const md = exportSeriesToMarkdown(series, new Map(), { maxEpisodes: 1 })

      expect(md).toContain('Episode 1: The Beginning')
      expect(md).not.toContain('Episode 2: The Call')
    })
  })

  describe('exportEpisodeToMarkdown', () => {
    it('exports a single episode', () => {
      const series = makeSeries()
      const episode = series.episode_index.episodes[0]
      const md = exportEpisodeToMarkdown(series, episode, ['Scene content here.'])

      expect(md).toContain('# The Beginning')
      expect(md).toContain('From: The Grand Adventure')
      expect(md).toContain('Scene content here.')
    })

    it('includes key events in summary', () => {
      const series = makeSeries()
      const episode = series.episode_index.episodes[0]
      const md = exportEpisodeToMarkdown(series, episode, [])

      expect(md).toContain('Hero introduced')
    })
  })

  describe('exportBibleToMarkdown', () => {
    it('formats characters correctly', () => {
      const bible = makeBible({
        characters: [
          {
            id: 'c1', name: 'Hero', role: 'protagonist', traits: ['brave'],
            motivations: [], arc_type: null, relationships: [], status: 'alive',
            introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
            knowledge: [], possessions: [], arc_milestones: [],
          },
        ],
      })
      const md = exportBibleToMarkdown(bible)

      expect(md).toContain('**Hero** (protagonist) [alive]')
      expect(md).toContain('brave')
    })

    it('handles empty bible', () => {
      const bible = makeBible()
      const md = exportBibleToMarkdown(bible)

      expect(md).toContain('No characters recorded')
      expect(md).toContain('No places recorded')
    })

    it('includes world rules', () => {
      const bible = makeBible({
        world_rules: [
          { id: 'r1', rule: 'Magic requires sacrifice', established_in: 'EP_001_a', source: 'narrative' },
        ],
      })
      const md = exportBibleToMarkdown(bible)

      expect(md).toContain('Magic requires sacrifice')
    })
  })

  describe('exportTimelineToMarkdown', () => {
    it('exports canon timeline with phase grouping', () => {
      const series = makeSeries()
      const md = exportTimelineToMarkdown(series)

      expect(md).toContain('Canon Timeline')
      expect(md).toContain('### Phase: HJ_N01')
      expect(md).toContain('### Phase: HJ_N02')
      expect(md).toContain('1. The Beginning')
      expect(md).toContain('2. The Call')
    })

    it('handles empty timeline', () => {
      const series = makeSeries({
        canon_timeline: { episodes: [] },
        episode_count: 0,
      })
      const md = exportTimelineToMarkdown(series)

      expect(md).toContain('No canon episodes yet')
    })
  })
})
