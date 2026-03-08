import { describe, it, expect } from 'vitest'
import { repair } from './repairEngine.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  SceneValidation,
  GenerationConfig,
} from '../artifacts/types.ts'

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
    global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
    phase_guidelines: [],
    validation_policy: {
      hard_constraints_required: true, anti_patterns_blocking: true, tone_global: true,
      entry_exit_required: true, signals_required: 'soft',
    },
  }
}

function makeScene(): Scene {
  return {
    scene_id: 'S01', beat_id: 'B01', setting: '', characters: [],
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

function makeConfig(): GenerationConfig {
  return {
    signals_policy: { mode: 'warn', min_fraction: 0.5 },
    tone_policy: { mode: 'warn' },
    repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
    max_llm_calls: 20,
  }
}

function makeFailingValidation(): SceneValidation {
  return {
    scene_id: 'S01',
    status: 'fail',
    checks: [
      { type: 'hard_constraints', status: 'fail', details: ['Missing evidence for: SF_N60_PREMISE_REVEAL'] },
      { type: 'anti_patterns', status: 'pass', details: ['No anti-patterns detected'] },
      { type: 'tone', status: 'pass', details: ['Tone markers present'] },
    ],
  }
}

describe('repairEngine', () => {
  it('repairs with LLM using targeted edit strategy', async () => {
    const llm = new MockLLMAdapter(['Revised scene with premise reveal visible.'])
    const result = await repair({
      sceneId: 'S01',
      originalContent: 'Nothing happened.',
      validation: makeFailingValidation(),
      scene: makeScene(),
      beat: makeBeat(),
      contract: makeContract(),
      config: makeConfig(),
      llm,
    })
    expect(result.scene_id).toBe('S01')
    expect(result.revised_content).toBe('Revised scene with premise reveal visible.')
    expect(result.strategy).toBe('targeted_edit')
  })

  it('uses full rewrite when many blocking errors', async () => {
    const llm = new MockLLMAdapter(['Complete rewrite of the scene.'])
    const validation: SceneValidation = {
      scene_id: 'S01',
      status: 'fail',
      checks: [
        { type: 'hard_constraints', status: 'fail', details: ['Missing constraint 1'] },
        { type: 'anti_patterns', status: 'fail', details: ['Anti-pattern found'] },
        { type: 'tone', status: 'fail', details: ['Tone completely wrong'] },
      ],
    }
    const result = await repair({
      sceneId: 'S01',
      originalContent: 'Bad scene.',
      validation,
      scene: makeScene(),
      beat: makeBeat(),
      contract: makeContract(),
      config: makeConfig(),
      llm,
    })
    expect(result.strategy).toBe('full_rewrite')
  })

  it('applies heuristic repair without LLM', async () => {
    const result = await repair({
      sceneId: 'S01',
      originalContent: 'Nothing happened.',
      validation: makeFailingValidation(),
      scene: makeScene(),
      beat: makeBeat(),
      contract: makeContract(),
      config: makeConfig(),
      llm: null,
    })
    expect(result.revised_content).toContain('Nothing happened.')
    expect(result.revised_content).toContain('Repair note')
    expect(result.revised_content).toContain('SF_N60_PREMISE_REVEAL')
  })
})
