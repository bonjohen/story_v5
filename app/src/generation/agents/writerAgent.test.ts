import { describe, it, expect } from 'vitest'
import { writeScene, buildWriterPrompt, buildBeatPointWriterPrompt, writeBeatPoint } from './writerAgent.ts'
import { MockLLMAdapter } from './llmAdapter.ts'
import type { StoryContract, Scene, Beat, SceneBeatPoint } from '../artifacts/types.ts'

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-03-04T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: {
      id_prefix: 'HJ', name: "The Hero's Journey", archetype_id: '01_heros_journey',
      spine_nodes: [], required_roles: [], allowed_variants: [], required_edges: [],
    },
    genre: {
      id_prefix: 'SF', name: 'Science Fiction', genre_id: '06_science_fiction',
      levels: {}, tone_marker: ['SF_N80_INTELLECTUAL'], anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N60_PREMISE_REVEAL'], soft_constraints: [],
    },
    global_boundaries: { musts: [], must_nots: [], content_limits: ['no violence'], style_limits: [] },
    phase_guidelines: [],
    validation_policy: {
      hard_constraints_required: true, anti_patterns_blocking: true, tone_global: true,
      entry_exit_required: true, signals_required: 'soft',
    },
  }
}

function makeScene(): Scene {
  return {
    scene_id: 'S01', beat_id: 'B01', setting: 'Space station', characters: ['Hero'],
    scene_goal: 'Establish ordinary world',
    archetype_trace: { node_id: 'HJ_N01_ORDINARY', edge_in: null, edge_out: null },
    genre_obligations: [], constraints_checklist: { hard: ['SF_N60_PREMISE_REVEAL'], soft: [], must_not: ['SF_N90_TECH_MAGIC'] },
  }
}

function makeBeat(): Beat {
  return {
    beat_id: 'B01', archetype_node_id: 'HJ_N01_ORDINARY',
    summary: '[Origin] Hero in ordinary world',
    required_exit_conditions: ['Call received'],
    target_emotional_scores: { tension: 0.1, hope: 0.6, fear: 0.1, resolution: 0.0 },
  }
}

describe('writerAgent', () => {
  it('builds prompt with genre, constraints, and boundaries', () => {
    const messages = buildWriterPrompt(makeScene(), makeBeat(), makeContract())
    expect(messages).toHaveLength(2)
    expect(messages[0].content).toContain('Science Fiction')
    expect(messages[0].content).toContain('no violence')
    expect(messages[1].content).toContain('SF_N60_PREMISE_REVEAL')
    expect(messages[1].content).toContain('SF_N90_TECH_MAGIC')
  })

  it('generates scene with mock LLM', async () => {
    const llm = new MockLLMAdapter(['The stars glimmered above the station...'])
    const result = await writeScene(makeScene(), makeBeat(), makeContract(), llm)
    expect(result.scene_id).toBe('S01')
    expect(result.content).toBe('The stars glimmered above the station...')
    expect(result.model).toBe('mock')
  })

  it('generates template scene without LLM', async () => {
    const result = await writeScene(makeScene(), makeBeat(), makeContract(), null)
    expect(result.scene_id).toBe('S01')
    expect(result.content).toContain('Origin')
    expect(result.content).toContain('Science Fiction')
    expect(result.model).toBe('template')
  })
})

// ---------------------------------------------------------------------------
// Beat point writer
// ---------------------------------------------------------------------------

function makeBeatPoint(): SceneBeatPoint {
  return {
    beat_point_id: 'S01_BP01',
    scene_id: 'S01',
    sequence: 1,
    type: 'setup',
    micro_goal: 'Establish the space station environment and introduce the hero.',
    characters_active: ['Hero'],
    emotional_target: { tension: 0.2, hope: 0.5, fear: 0.1 },
    weight: 'short',
  }
}

describe('beatPointWriter', () => {
  it('builds prompt with beat point micro-goal and type', () => {
    const messages = buildBeatPointWriterPrompt(makeBeatPoint(), makeScene(), makeBeat(), makeContract())
    expect(messages).toHaveLength(2)
    expect(messages[0].content).toContain('setup')
    expect(messages[0].content).toContain('100-200 words')
    expect(messages[1].content).toContain('Establish the space station environment')
  })

  it('includes word count guidance based on weight', () => {
    const longBp = { ...makeBeatPoint(), weight: 'long' as const }
    const messages = buildBeatPointWriterPrompt(longBp, makeScene(), makeBeat(), makeContract())
    expect(messages[0].content).toContain('400-600 words')
  })

  it('includes prior beat prose for continuity', () => {
    const priorProse = ['The station hummed with quiet energy.']
    const messages = buildBeatPointWriterPrompt(makeBeatPoint(), makeScene(), makeBeat(), makeContract(), null, priorProse)
    const content = messages.map((m) => m.content).join('\n')
    expect(content).toContain('station hummed')
  })

  it('generates beat point with mock LLM', async () => {
    const llm = new MockLLMAdapter(['The docking bay stretched out before her...'])
    const result = await writeBeatPoint(makeBeatPoint(), makeScene(), makeBeat(), makeContract(), llm)
    expect(result.beat_point_id).toBe('S01_BP01')
    expect(result.scene_id).toBe('S01')
    expect(result.content).toBe('The docking bay stretched out before her...')
  })

  it('generates template beat point without LLM', async () => {
    const result = await writeBeatPoint(makeBeatPoint(), makeScene(), makeBeat(), makeContract(), null)
    expect(result.beat_point_id).toBe('S01_BP01')
    expect(result.content).toContain('scene opens')
    expect(result.model).toBe('template')
  })
})
