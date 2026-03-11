import { describe, it, expect } from 'vitest'
import { stitchScene, buildSceneSmoothingPrompt, smoothScene } from './sceneStitcher.ts'
import type { Scene, Beat, SceneBeatExpansion, SceneBeatPoint } from '../artifacts/types.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBeat(): Beat {
  return {
    beat_id: 'B01',
    archetype_node_id: 'HJ_N01',
    summary: '[Catalyst] The hero receives a desperate plea.',
    required_exit_conditions: ['Hero accepts the call'],
    target_emotional_scores: { tension: 0.6, hope: 0.7, fear: 0.3, resolution: 0.1 },
  }
}

function makeScene(): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'the_ranch',
    characters: ['protagonist'],
    scene_goal: 'Establish the crisis.',
    archetype_trace: { node_id: 'HJ_N01', edge_in: null, edge_out: null },
    genre_obligations: [],
    constraints_checklist: { hard: [], soft: [], must_not: [] },
  }
}

function makeExpansion(): SceneBeatExpansion {
  const beatPoints: SceneBeatPoint[] = [
    { beat_point_id: 'S01_BP01', scene_id: 'S01', sequence: 1, type: 'setup', micro_goal: 'Setup goal', characters_active: ['protagonist'], emotional_target: { tension: 0.3, hope: 0.4, fear: 0.2 }, weight: 'short' },
    { beat_point_id: 'S01_BP02', scene_id: 'S01', sequence: 2, type: 'escalation', micro_goal: 'Escalation goal', characters_active: ['protagonist'], emotional_target: { tension: 0.5, hope: 0.3, fear: 0.3 }, weight: 'medium' },
    { beat_point_id: 'S01_BP03', scene_id: 'S01', sequence: 3, type: 'turning_point', micro_goal: 'Turning point goal', characters_active: ['protagonist'], emotional_target: { tension: 0.8, hope: 0.2, fear: 0.5 }, weight: 'long' },
    { beat_point_id: 'S01_BP04', scene_id: 'S01', sequence: 4, type: 'resolution', micro_goal: 'Resolution goal', characters_active: ['protagonist'], emotional_target: { tension: 0.2, hope: 0.6, fear: 0.1 }, weight: 'short' },
  ]
  return { scene_id: 'S01', beat_points: beatPoints, scene_arc_summary: 'Test arc' }
}

// ---------------------------------------------------------------------------
// stitchScene
// ---------------------------------------------------------------------------

describe('stitchScene', () => {
  it('produces scene with heading and all beat prose', () => {
    const prose = new Map([
      ['S01_BP01', 'The morning air was crisp.'],
      ['S01_BP02', 'Tension mounted as the letter arrived.'],
      ['S01_BP03', 'Everything changed in an instant.'],
      ['S01_BP04', 'He turned and walked away, resolved.'],
    ])
    const result = stitchScene(prose, makeExpansion(), makeScene(), makeBeat())
    expect(result).toContain('## Catalyst')
    expect(result).toContain('The morning air was crisp.')
    expect(result).toContain('Tension mounted')
    expect(result).toContain('Everything changed')
    expect(result).toContain('He turned and walked away')
  })

  it('maintains beat sequence order', () => {
    const prose = new Map([
      ['S01_BP03', 'Third.'],
      ['S01_BP01', 'First.'],
      ['S01_BP04', 'Fourth.'],
      ['S01_BP02', 'Second.'],
    ])
    const result = stitchScene(prose, makeExpansion(), makeScene(), makeBeat())
    const firstIdx = result.indexOf('First.')
    const secondIdx = result.indexOf('Second.')
    const thirdIdx = result.indexOf('Third.')
    const fourthIdx = result.indexOf('Fourth.')
    expect(firstIdx).toBeLessThan(secondIdx)
    expect(secondIdx).toBeLessThan(thirdIdx)
    expect(thirdIdx).toBeLessThan(fourthIdx)
  })

  it('skips missing beat prose gracefully', () => {
    const prose = new Map([
      ['S01_BP01', 'Opening.'],
      ['S01_BP04', 'Closing.'],
    ])
    const result = stitchScene(prose, makeExpansion(), makeScene(), makeBeat())
    expect(result).toContain('Opening.')
    expect(result).toContain('Closing.')
    expect(result).not.toContain('undefined')
  })

  it('starts with scene heading', () => {
    const prose = new Map([['S01_BP01', 'Content.']])
    const result = stitchScene(prose, makeExpansion(), makeScene(), makeBeat())
    expect(result.startsWith('## Catalyst')).toBe(true)
  })

  it('handles empty prose map', () => {
    const result = stitchScene(new Map(), makeExpansion(), makeScene(), makeBeat())
    expect(result).toContain('## Catalyst')
    // Should just be the heading
    expect(result.trim()).toBe('## Catalyst')
  })
})

// ---------------------------------------------------------------------------
// buildSceneSmoothingPrompt
// ---------------------------------------------------------------------------

describe('buildSceneSmoothingPrompt', () => {
  it('includes genre and role context', () => {
    const messages = buildSceneSmoothingPrompt('Some prose here.', makeBeat(), 'Drama')
    expect(messages[0].content).toContain('Drama')
    expect(messages[1].content).toContain('Catalyst')
  })

  it('includes the stitched prose', () => {
    const messages = buildSceneSmoothingPrompt('The story begins here.', makeBeat(), 'Drama')
    expect(messages[1].content).toContain('The story begins here.')
  })
})

// ---------------------------------------------------------------------------
// smoothScene
// ---------------------------------------------------------------------------

describe('smoothScene', () => {
  it('returns original prose when no LLM', async () => {
    const result = await smoothScene('Original prose.', makeBeat(), 'Drama', null)
    expect(result).toBe('Original prose.')
  })

  it('returns smoothed prose from LLM', async () => {
    const llm = new MockLLMAdapter(['## Catalyst\n\nThe smoothed and polished version of the scene.'])
    const result = await smoothScene('## Catalyst\n\nOriginal rough prose.', makeBeat(), 'Drama', llm)
    expect(result).toContain('smoothed and polished')
  })

  it('falls back to original if LLM returns too-short response', async () => {
    const llm = new MockLLMAdapter(['Short'])
    const original = 'A much longer original that should be preserved because the LLM response is too short.'
    const result = await smoothScene(original, makeBeat(), 'Drama', llm)
    expect(result).toBe(original)
  })
})
