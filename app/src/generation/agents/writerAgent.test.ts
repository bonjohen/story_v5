import { describe, it, expect } from 'vitest'
import { writeScene, buildWriterPrompt } from './writerAgent.ts'
import { MockLLMAdapter } from './llmAdapter.ts'
import type { StoryContract, Scene, Beat } from '../artifacts/types.ts'

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

  it('generates stub scene without LLM', async () => {
    const result = await writeScene(makeScene(), makeBeat(), makeContract(), null)
    expect(result.scene_id).toBe('S01')
    expect(result.content).toContain('S01')
    expect(result.content).toContain('Stub scene content')
    expect(result.model).toBe('stub')
  })
})
