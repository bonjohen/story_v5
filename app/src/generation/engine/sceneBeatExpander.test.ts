import { describe, it, expect } from 'vitest'
import {
  expandSceneBeats,
  expandAllSceneBeats,
  determineBeatCount,
  buildBeatSequence,
  buildEmotionalCurve,
  DEFAULT_BEAT_EXPANSION,
} from './sceneBeatExpander.ts'
import type {
  Scene,
  Beat,
  StoryContract,
  BeatExpansionConfig,
  SceneBeatType,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeBeat(overrides: Partial<Beat> = {}): Beat {
  return {
    beat_id: 'B01',
    archetype_node_id: 'HJ_N01',
    summary: '[Catalyst] The hero receives a desperate plea for help.',
    required_exit_conditions: ['Hero accepts the call'],
    target_emotional_scores: { tension: 0.6, hope: 0.7, fear: 0.3, resolution: 0.1 },
    ...overrides,
  }
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'the_ranch',
    characters: ['protagonist', 'mentor'],
    scene_goal: 'Establish the ranch crisis through a confrontation with the bank.',
    archetype_trace: { node_id: 'HJ_N01', edge_in: null, edge_out: 'HJ_E01' },
    genre_obligations: [],
    constraints_checklist: { hard: ['stakes_established'], soft: ['tone_set'], must_not: [] },
    ...overrides,
  }
}

function makeContract(overrides: Partial<StoryContract> = {}): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'test-run',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: {
      archetype_id: 'heros_journey',
      name: "The Hero's Journey",
      required_edges: [],
    },
    genre: {
      genre_id: 'drama',
      name: 'Drama',
      hard_constraints: [],
      soft_constraints: [],
      anti_patterns: [],
      tone_marker: ['serious'],
    },
    global_boundaries: {
      content_limits: [],
      max_scenes: 10,
      target_word_count: null,
    },
    phase_guidelines: [],
    validation_policy: {
      require_all_hard: true,
      min_soft_coverage: 0.6,
      signals_check: true,
    },
    ...overrides,
  } as StoryContract
}

// ---------------------------------------------------------------------------
// determineBeatCount
// ---------------------------------------------------------------------------

describe('determineBeatCount', () => {
  it('returns a value within min/max bounds', () => {
    const count = determineBeatCount(makeScene(), makeBeat(), DEFAULT_BEAT_EXPANSION)
    expect(count).toBeGreaterThanOrEqual(DEFAULT_BEAT_EXPANSION.min_beats_per_scene)
    expect(count).toBeLessThanOrEqual(DEFAULT_BEAT_EXPANSION.max_beats_per_scene)
  })

  it('gives more beats to high-stakes roles', () => {
    const crisisBeat = makeBeat({ summary: '[Crisis] Everything falls apart.' })
    const ordinaryBeat = makeBeat({ summary: '[Ordinary World] Normal life.' })
    const crisisCount = determineBeatCount(makeScene(), crisisBeat, DEFAULT_BEAT_EXPANSION)
    const ordinaryCount = determineBeatCount(makeScene(), ordinaryBeat, DEFAULT_BEAT_EXPANSION)
    expect(crisisCount).toBeGreaterThanOrEqual(ordinaryCount)
  })

  it('gives fewer beats to transitional roles', () => {
    const returnBeat = makeBeat({ summary: '[Return] The hero comes home.' })
    const config: BeatExpansionConfig = { enabled: true, min_beats_per_scene: 4, max_beats_per_scene: 8, batch_size: 1 }
    const count = determineBeatCount(makeScene(), returnBeat, config)
    expect(count).toBeLessThanOrEqual(5) // min + 1
  })

  it('increases count for high constraint density', () => {
    const sparse = makeScene({ constraints_checklist: { hard: ['a'], soft: [], must_not: [] } })
    const dense = makeScene({ constraints_checklist: { hard: ['a', 'b', 'c'], soft: ['d', 'e'], must_not: [] } })
    const sparseCount = determineBeatCount(sparse, makeBeat(), DEFAULT_BEAT_EXPANSION)
    const denseCount = determineBeatCount(dense, makeBeat(), DEFAULT_BEAT_EXPANSION)
    expect(denseCount).toBeGreaterThanOrEqual(sparseCount)
  })

  it('respects custom min/max config', () => {
    const config: BeatExpansionConfig = { enabled: true, min_beats_per_scene: 3, max_beats_per_scene: 5, batch_size: 1 }
    const count = determineBeatCount(makeScene(), makeBeat(), config)
    expect(count).toBeGreaterThanOrEqual(3)
    expect(count).toBeLessThanOrEqual(5)
  })
})

// ---------------------------------------------------------------------------
// buildBeatSequence
// ---------------------------------------------------------------------------

describe('buildBeatSequence', () => {
  it('always starts with setup', () => {
    for (let n = 1; n <= 8; n++) {
      const seq = buildBeatSequence(n)
      expect(seq[0]).toBe('setup')
    }
  })

  it('always ends with resolution for count >= 2', () => {
    for (let n = 2; n <= 8; n++) {
      const seq = buildBeatSequence(n)
      expect(seq[seq.length - 1]).toBe('resolution')
    }
  })

  it('includes turning_point for count >= 3', () => {
    for (let n = 3; n <= 8; n++) {
      const seq = buildBeatSequence(n)
      expect(seq).toContain('turning_point')
    }
  })

  it('returns correct length', () => {
    for (let n = 1; n <= 8; n++) {
      expect(buildBeatSequence(n)).toHaveLength(n)
    }
  })

  it('places turning_point near the 60% mark', () => {
    const seq = buildBeatSequence(8)
    const tpIdx = seq.indexOf('turning_point')
    // 60% of 8 = 4.8, rounded = 5. Allow +-1.
    expect(tpIdx).toBeGreaterThanOrEqual(3)
    expect(tpIdx).toBeLessThanOrEqual(6)
  })

  it('has escalation before turning_point', () => {
    const seq = buildBeatSequence(6)
    const tpIdx = seq.indexOf('turning_point')
    const escIdx = seq.indexOf('escalation')
    expect(escIdx).toBeLessThan(tpIdx)
  })

  it('only contains valid beat types', () => {
    const validTypes: SceneBeatType[] = ['setup', 'escalation', 'turning_point', 'dialogue', 'action', 'reaction', 'revelation', 'resolution']
    const seq = buildBeatSequence(8)
    for (const t of seq) {
      expect(validTypes).toContain(t)
    }
  })
})

// ---------------------------------------------------------------------------
// buildEmotionalCurve
// ---------------------------------------------------------------------------

describe('buildEmotionalCurve', () => {
  it('returns one entry per beat in the sequence', () => {
    const seq = buildBeatSequence(6)
    const curve = buildEmotionalCurve(seq, makeBeat())
    expect(curve).toHaveLength(6)
  })

  it('all values are between 0 and 1', () => {
    const seq = buildBeatSequence(8)
    const beat = makeBeat({ target_emotional_scores: { tension: 0.9, hope: 0.8, fear: 0.9, resolution: 0.5 } })
    const curve = buildEmotionalCurve(seq, beat)
    for (const point of curve) {
      expect(point.tension).toBeGreaterThanOrEqual(0)
      expect(point.tension).toBeLessThanOrEqual(1)
      expect(point.hope).toBeGreaterThanOrEqual(0)
      expect(point.hope).toBeLessThanOrEqual(1)
      expect(point.fear).toBeGreaterThanOrEqual(0)
      expect(point.fear).toBeLessThanOrEqual(1)
    }
  })

  it('tension peaks somewhere in the middle, not at start or end', () => {
    const seq = buildBeatSequence(6)
    const curve = buildEmotionalCurve(seq, makeBeat({ target_emotional_scores: { tension: 0.8, hope: 0.5, fear: 0.6, resolution: 0.2 } }))
    const tensions = curve.map((c) => c.tension)
    const maxIdx = tensions.indexOf(Math.max(...tensions))
    expect(maxIdx).toBeGreaterThan(0)
    expect(maxIdx).toBeLessThan(tensions.length - 1)
  })
})

// ---------------------------------------------------------------------------
// expandSceneBeats (integration)
// ---------------------------------------------------------------------------

describe('expandSceneBeats', () => {
  it('produces a valid SceneBeatExpansion', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    expect(expansion.scene_id).toBe('S01')
    expect(expansion.beat_points.length).toBeGreaterThanOrEqual(4)
    expect(expansion.beat_points.length).toBeLessThanOrEqual(8)
    expect(expansion.scene_arc_summary).toBeTruthy()
  })

  it('beat_point_ids follow the S01_BP01 pattern', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    for (let i = 0; i < expansion.beat_points.length; i++) {
      expect(expansion.beat_points[i].beat_point_id).toBe(`S01_BP${String(i + 1).padStart(2, '0')}`)
    }
  })

  it('sequences are 1-based and contiguous', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    for (let i = 0; i < expansion.beat_points.length; i++) {
      expect(expansion.beat_points[i].sequence).toBe(i + 1)
    }
  })

  it('all beat points reference the parent scene', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    for (const bp of expansion.beat_points) {
      expect(bp.scene_id).toBe('S01')
    }
  })

  it('micro_goals are non-empty strings', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    for (const bp of expansion.beat_points) {
      expect(bp.micro_goal.length).toBeGreaterThan(10)
    }
  })

  it('characters_active is populated when scene has characters', () => {
    const expansion = expandSceneBeats(makeScene(), makeBeat(), makeContract())
    // Setup should have all characters
    expect(expansion.beat_points[0].characters_active).toEqual(['protagonist', 'mentor'])
  })

  it('handles scenes with no characters', () => {
    const scene = makeScene({ characters: [] })
    const expansion = expandSceneBeats(scene, makeBeat(), makeContract())
    for (const bp of expansion.beat_points) {
      expect(bp.characters_active).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------
// expandAllSceneBeats
// ---------------------------------------------------------------------------

describe('expandAllSceneBeats', () => {
  it('expands all scenes', () => {
    const scenes = [
      makeScene({ scene_id: 'S01', beat_id: 'B01' }),
      makeScene({ scene_id: 'S02', beat_id: 'B02' }),
    ]
    const beats = [
      makeBeat({ beat_id: 'B01' }),
      makeBeat({ beat_id: 'B02', summary: '[Ordeal] The hero faces the ultimate test.' }),
    ]
    const expansions = expandAllSceneBeats(scenes, beats, makeContract())
    expect(expansions).toHaveLength(2)
    expect(expansions[0].scene_id).toBe('S01')
    expect(expansions[1].scene_id).toBe('S02')
  })

  it('throws if a beat is missing for a scene', () => {
    const scenes = [makeScene({ scene_id: 'S01', beat_id: 'B99' })]
    const beats = [makeBeat({ beat_id: 'B01' })]
    expect(() => expandAllSceneBeats(scenes, beats, makeContract())).toThrow('No beat found')
  })
})
