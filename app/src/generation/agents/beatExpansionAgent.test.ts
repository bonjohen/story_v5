import { describe, it, expect } from 'vitest'
import {
  buildBeatExpansionPrompt,
  parseBeatExpansionResponse,
} from './beatExpansionAgent.ts'
import type {
  Scene,
  Beat,
  StoryContract,
  SceneBeatExpansion,
  SceneBeatPoint,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBeat(): Beat {
  return {
    beat_id: 'B01',
    archetype_node_id: 'HJ_N01',
    summary: '[Catalyst] The hero receives a desperate plea for help.',
    required_exit_conditions: ['Hero accepts the call'],
    target_emotional_scores: { tension: 0.6, hope: 0.7, fear: 0.3, resolution: 0.1 },
  }
}

function makeScene(): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'the_ranch',
    characters: ['protagonist', 'mentor'],
    scene_goal: 'Establish the ranch crisis.',
    archetype_trace: { node_id: 'HJ_N01', edge_in: null, edge_out: 'HJ_E01' },
    genre_obligations: [],
    constraints_checklist: { hard: ['stakes_established'], soft: [], must_not: [] },
  }
}

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'test',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: { archetype_id: 'heros_journey', name: "The Hero's Journey", required_edges: [] },
    genre: { genre_id: 'drama', name: 'Drama', hard_constraints: [], soft_constraints: [], anti_patterns: [], tone_marker: ['serious'] },
    global_boundaries: { content_limits: [], max_scenes: 10, target_word_count: null },
    phase_guidelines: [],
    validation_policy: { require_all_hard: true, min_soft_coverage: 0.6, signals_check: true },
  } as unknown as StoryContract
}

function makeExpansion(): SceneBeatExpansion {
  const beatPoints: SceneBeatPoint[] = [
    { beat_point_id: 'S01_BP01', scene_id: 'S01', sequence: 1, type: 'setup', micro_goal: 'Default setup goal', characters_active: ['protagonist'], emotional_target: { tension: 0.3, hope: 0.4, fear: 0.2 }, weight: 'short' },
    { beat_point_id: 'S01_BP02', scene_id: 'S01', sequence: 2, type: 'escalation', micro_goal: 'Default escalation goal', characters_active: ['protagonist', 'mentor'], emotional_target: { tension: 0.5, hope: 0.3, fear: 0.3 }, weight: 'medium' },
    { beat_point_id: 'S01_BP03', scene_id: 'S01', sequence: 3, type: 'turning_point', micro_goal: 'Default turning point goal', characters_active: ['protagonist'], emotional_target: { tension: 0.8, hope: 0.2, fear: 0.5 }, weight: 'long' },
    { beat_point_id: 'S01_BP04', scene_id: 'S01', sequence: 4, type: 'resolution', micro_goal: 'Default resolution goal', characters_active: ['protagonist', 'mentor'], emotional_target: { tension: 0.2, hope: 0.6, fear: 0.1 }, weight: 'short' },
  ]
  return { scene_id: 'S01', beat_points: beatPoints, scene_arc_summary: 'Test arc summary' }
}

// ---------------------------------------------------------------------------
// buildBeatExpansionPrompt
// ---------------------------------------------------------------------------

describe('buildBeatExpansionPrompt', () => {
  it('includes scene goal in the prompt', () => {
    const messages = buildBeatExpansionPrompt(makeScene(), makeBeat(), makeContract(), makeExpansion())
    const content = messages.map((m) => m.content).join('\n')
    expect(content).toContain('Establish the ranch crisis.')
  })

  it('includes beat summary', () => {
    const messages = buildBeatExpansionPrompt(makeScene(), makeBeat(), makeContract(), makeExpansion())
    const content = messages.map((m) => m.content).join('\n')
    expect(content).toContain('Catalyst')
  })

  it('lists all beat points', () => {
    const messages = buildBeatExpansionPrompt(makeScene(), makeBeat(), makeContract(), makeExpansion())
    const content = messages.map((m) => m.content).join('\n')
    expect(content).toContain('S01_BP01')
    expect(content).toContain('S01_BP02')
    expect(content).toContain('S01_BP03')
    expect(content).toContain('S01_BP04')
  })

  it('includes genre and archetype names', () => {
    const messages = buildBeatExpansionPrompt(makeScene(), makeBeat(), makeContract(), makeExpansion())
    const systemPrompt = messages[0].content
    expect(systemPrompt).toContain('Drama')
    expect(systemPrompt).toContain("Hero's Journey")
  })

  it('requests JSON output format', () => {
    const messages = buildBeatExpansionPrompt(makeScene(), makeBeat(), makeContract(), makeExpansion())
    const systemPrompt = messages[0].content
    expect(systemPrompt).toContain('JSON')
  })
})

// ---------------------------------------------------------------------------
// parseBeatExpansionResponse
// ---------------------------------------------------------------------------

describe('parseBeatExpansionResponse', () => {
  it('merges valid JSON response into expansion', () => {
    const json = JSON.stringify([
      { beat_point_id: 'S01_BP01', micro_goal: 'LLM goal for setup' },
      { beat_point_id: 'S01_BP03', micro_goal: 'LLM goal for turning point' },
    ])
    const result = parseBeatExpansionResponse(json, makeExpansion())
    expect(result.beat_points[0].micro_goal).toBe('LLM goal for setup')
    expect(result.beat_points[1].micro_goal).toBe('Default escalation goal') // unchanged
    expect(result.beat_points[2].micro_goal).toBe('LLM goal for turning point')
    expect(result.beat_points[3].micro_goal).toBe('Default resolution goal') // unchanged
  })

  it('handles markdown code fences', () => {
    const json = '```json\n[{"beat_point_id":"S01_BP01","micro_goal":"Fenced goal"}]\n```'
    const result = parseBeatExpansionResponse(json, makeExpansion())
    expect(result.beat_points[0].micro_goal).toBe('Fenced goal')
  })

  it('handles leading text before JSON', () => {
    const json = 'Here are the beat points:\n[{"beat_point_id":"S01_BP01","micro_goal":"After text goal"}]'
    const result = parseBeatExpansionResponse(json, makeExpansion())
    expect(result.beat_points[0].micro_goal).toBe('After text goal')
  })

  it('preserves deterministic expansion on invalid JSON', () => {
    const result = parseBeatExpansionResponse('This is not JSON at all', makeExpansion())
    expect(result.beat_points[0].micro_goal).toBe('Default setup goal')
    expect(result.beat_points[2].micro_goal).toBe('Default turning point goal')
  })

  it('preserves deterministic expansion on empty response', () => {
    const result = parseBeatExpansionResponse('', makeExpansion())
    expect(result).toEqual(makeExpansion())
  })

  it('preserves notes from LLM response', () => {
    const json = JSON.stringify([
      { beat_point_id: 'S01_BP01', micro_goal: 'Goal with notes', notes: 'Show physical environment' },
    ])
    const result = parseBeatExpansionResponse(json, makeExpansion())
    expect(result.beat_points[0].notes).toBe('Show physical environment')
  })

  it('ignores response items with missing beat_point_id', () => {
    const json = JSON.stringify([
      { micro_goal: 'No ID' },
      { beat_point_id: 'S01_BP01', micro_goal: 'Valid' },
    ])
    const result = parseBeatExpansionResponse(json, makeExpansion())
    expect(result.beat_points[0].micro_goal).toBe('Valid')
  })
})
