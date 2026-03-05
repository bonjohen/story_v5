import { describe, it, expect } from 'vitest'
import {
  createBranch,
  generateBranchId,
  getBranchDivergenceSlot,
  computeBibleDiff,
  isBranchDivergent,
} from './branchManager.ts'
import type { Series, StateSnapshot, StoryBible, Branch } from './types.ts'

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
    title: 'Test Series',
    description: 'A test series',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    theme_tone: {
      genre_id: 'g1',
      genre_name: 'Fantasy',
      tone_marker: 'dark',
      themes: [],
      mood: 'grim',
      content_limits: [],
      style_notes: [],
    },
    overarching_arc: {
      archetype_id: 'a1',
      archetype_name: "Hero's Journey",
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
        { slot: 1, episode_id: 'EP_001_a', title: 'Episode 1', canonized_at: '2025-01-01T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP001' },
        { slot: 2, episode_id: 'EP_002_a', title: 'Episode 2', canonized_at: '2025-01-02T00:00:00Z', overarching_phase: 'HJ_N02', snapshot_id: 'SNAP_EP002' },
        { slot: 3, episode_id: 'EP_003_a', title: 'Episode 3', canonized_at: '2025-01-03T00:00:00Z', overarching_phase: 'HJ_N03', snapshot_id: 'SNAP_EP003' },
      ],
    },
    episode_index: { episodes: [] },
    slots: [],
    episode_count: 3,
    total_candidates_generated: 3,
    corpus_hash: 'abc',
    ...overrides,
  }
}

function makeSnapshot(afterEpisode: string, bible?: StoryBible): StateSnapshot {
  return {
    snapshot_id: `SNAP_${afterEpisode}`,
    after_episode: afterEpisode,
    created_at: '2025-01-01T00:00:00Z',
    bible: bible ?? makeBible(),
    overarching_arc: {
      archetype_id: 'a1',
      archetype_name: "Hero's Journey",
      current_phase: 'HJ_N02',
      phase_history: [
        { node_id: 'HJ_N01', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_001_a' },
      ],
      remaining_phases: ['HJ_N03', 'HJ_N04', 'HJ_N05'],
      advancement_mode: 'hybrid',
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('branchManager', () => {
  describe('createBranch', () => {
    it('creates a branch forking after a canon episode', () => {
      const series = makeSeries()
      const snapshot = makeSnapshot('EP_002_a')

      const branch = createBranch(series, {
        name: 'What If',
        description: 'Alternative timeline',
        fork_after_episode: 'EP_002_a',
        fork_snapshot: snapshot,
      })

      expect(branch.branch_id).toContain('BRANCH_')
      expect(branch.name).toBe('What If')
      expect(branch.fork_point).toBe('EP_002_a')
      expect(branch.fork_snapshot_id).toBe(snapshot.snapshot_id)
      // Branch timeline should include episodes up to slot 2
      expect(branch.canon_timeline.episodes).toHaveLength(2)
      expect(branch.canon_timeline.episodes[1].episode_id).toBe('EP_002_a')
    })

    it('throws if fork episode is not in canon', () => {
      const series = makeSeries()
      const snapshot = makeSnapshot('EP_999_a')

      expect(() =>
        createBranch(series, {
          name: 'Bad Fork',
          description: 'test',
          fork_after_episode: 'EP_999_a',
          fork_snapshot: snapshot,
        }),
      ).toThrow('Fork episode EP_999_a not found')
    })

    it('deep copies the bible from the snapshot', () => {
      const bible = makeBible({
        characters: [
          {
            id: 'c1', name: 'Hero', role: 'protagonist', traits: [], motivations: [],
            arc_type: null, relationships: [], status: 'alive',
            introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
            knowledge: [], possessions: [], arc_milestones: [],
          },
        ],
      })
      const series = makeSeries()
      const snapshot = makeSnapshot('EP_001_a', bible)

      const branch = createBranch(series, {
        name: 'Test',
        description: 'test',
        fork_after_episode: 'EP_001_a',
        fork_snapshot: snapshot,
      })

      // Mutating the branch bible should not affect the snapshot
      branch.bible.characters[0].status = 'dead'
      expect(snapshot.bible.characters[0].status).toBe('alive')
    })
  })

  describe('generateBranchId', () => {
    it('generates a branch ID with slug', () => {
      const series = makeSeries()
      const id = generateBranchId(series, 'What If Scenario')
      expect(id).toBe('BRANCH_001_what_if_scenario')
    })
  })

  describe('getBranchDivergenceSlot', () => {
    it('returns the slot number of the fork point', () => {
      const series = makeSeries()
      const branch: Branch = {
        branch_id: 'BRANCH_001',
        name: 'test',
        description: '',
        fork_point: 'EP_002_a',
        fork_snapshot_id: 'SNAP_EP002',
        canon_timeline: { episodes: [] },
        bible: makeBible(),
      }

      expect(getBranchDivergenceSlot(series, branch)).toBe(2)
    })

    it('returns 0 if fork point not found', () => {
      const series = makeSeries()
      const branch: Branch = {
        branch_id: 'BRANCH_001',
        name: 'test',
        description: '',
        fork_point: 'EP_999_a',
        fork_snapshot_id: 'SNAP_EP999',
        canon_timeline: { episodes: [] },
        bible: makeBible(),
      }

      expect(getBranchDivergenceSlot(series, branch)).toBe(0)
    })
  })

  describe('computeBibleDiff', () => {
    it('detects added and removed characters', () => {
      const main = makeBible({
        characters: [
          { id: 'c1', name: 'Hero', role: 'protagonist', traits: [], motivations: [],
            arc_type: null, relationships: [], status: 'alive',
            introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
            knowledge: [], possessions: [], arc_milestones: [] },
        ],
      })
      const branch = makeBible({
        characters: [
          { id: 'c2', name: 'Villain', role: 'antagonist', traits: [], motivations: [],
            arc_type: null, relationships: [], status: 'alive',
            introduced_in: 'EP_002_a', last_appeared_in: 'EP_002_a',
            knowledge: [], possessions: [], arc_milestones: [] },
        ],
      })

      const diff = computeBibleDiff(main, branch)
      expect(diff.characters_added).toEqual(['c2'])
      expect(diff.characters_removed).toEqual(['c1'])
    })

    it('detects changed character status', () => {
      const main = makeBible({
        characters: [
          { id: 'c1', name: 'Hero', role: 'protagonist', traits: [], motivations: [],
            arc_type: null, relationships: [], status: 'alive',
            introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
            knowledge: [], possessions: [], arc_milestones: [] },
        ],
      })
      const branch = makeBible({
        characters: [
          { id: 'c1', name: 'Hero', role: 'protagonist', traits: [], motivations: [],
            arc_type: null, relationships: [], status: 'dead',
            introduced_in: 'EP_001_a', last_appeared_in: 'EP_002_a',
            knowledge: [], possessions: [], arc_milestones: [] },
        ],
      })

      const diff = computeBibleDiff(main, branch)
      expect(diff.characters_changed).toEqual(['c1'])
    })

    it('detects thread changes', () => {
      const main = makeBible({
        plot_threads: [
          { id: 'pt1', title: 'Thread', description: '', status: 'open', urgency: 'medium',
            introduced_in: 'EP_001_a', progressed_in: [], related_characters: [] },
        ],
      })
      const branch = makeBible({
        plot_threads: [
          { id: 'pt1', title: 'Thread', description: '', status: 'resolved', urgency: 'medium',
            introduced_in: 'EP_001_a', progressed_in: ['EP_002_a'], resolved_in: 'EP_002_a',
            related_characters: [] },
        ],
      })

      const diff = computeBibleDiff(main, branch)
      expect(diff.threads_changed).toEqual(['pt1'])
    })
  })

  describe('isBranchDivergent', () => {
    it('returns true if main timeline has advanced past fork', () => {
      const series = makeSeries() // 3 episodes
      const branch: Branch = {
        branch_id: 'BRANCH_001',
        name: 'test',
        description: '',
        fork_point: 'EP_001_a',
        fork_snapshot_id: 'SNAP_EP001',
        canon_timeline: { episodes: [] },
        bible: makeBible(),
      }

      expect(isBranchDivergent(series, branch)).toBe(true)
    })

    it('returns false if main timeline has not advanced past fork', () => {
      const series = makeSeries()
      const branch: Branch = {
        branch_id: 'BRANCH_001',
        name: 'test',
        description: '',
        fork_point: 'EP_003_a', // Last canon episode
        fork_snapshot_id: 'SNAP_EP003',
        canon_timeline: { episodes: [] },
        bible: makeBible(),
      }

      expect(isBranchDivergent(series, branch)).toBe(false)
    })
  })
})
