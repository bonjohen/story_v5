import { describe, it, expect } from 'vitest'
import { validateScenes } from './validationEngine.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  GenerationConfig,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-03-04T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: {
      id_prefix: 'HJ',
      name: "The Hero's Journey",
      archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY'],
      required_roles: ['Origin'],
      allowed_variants: [],
      required_edges: [],
    },
    genre: {
      id_prefix: 'SF',
      name: 'Science Fiction',
      genre_id: '06_science_fiction',
      levels: { '5': ['SF_N60_PREMISE_REVEAL'] },
      tone_marker: ['SF_N80_INTELLECTUAL'],
      anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N60_PREMISE_REVEAL'],
      soft_constraints: [],
    },
    global_boundaries: {
      musts: [],
      must_nots: ['Anti-pattern: Tech as Magic'],
      content_limits: [],
      style_limits: [],
    },
    phase_guidelines: [
      {
        node_id: 'HJ_N01_ORDINARY',
        role: 'Origin',
        definition: 'Hero in ordinary world',
        entry_conditions: ['Story opening'],
        exit_conditions: ['Call received'],
        failure_modes: ['Too long'],
        signals_in_text: ['Mundane life'],
        genre_obligation_links: ['SF_N60_PREMISE_REVEAL'],
      },
    ],
    validation_policy: {
      hard_constraints_required: true,
      anti_patterns_blocking: true,
      tone_global: true,
      entry_exit_required: true,
      signals_required: 'soft',
    },
  }
}

function makeScene(): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'A space station',
    characters: ['Hero'],
    scene_goal: 'Establish ordinary world',
    archetype_trace: { node_id: 'HJ_N01_ORDINARY', edge_in: null, edge_out: null },
    genre_obligations: [{ node_id: 'SF_N60_PREMISE_REVEAL', severity: 'hard' }],
    constraints_checklist: {
      hard: ['SF_N60_PREMISE_REVEAL'],
      soft: [],
      must_not: ['SF_N90_TECH_MAGIC'],
    },
  }
}

function makeBeat(): Beat {
  return {
    beat_id: 'B01',
    archetype_node_id: 'HJ_N01_ORDINARY',
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
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validationEngine — hard constraints', () => {
  it('passes when hard constraint keywords are present', async () => {
    const drafts = new Map([['S01', 'The premise was finally revealed to the crew. A call was received.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const hardCheck = result.scenes[0].checks.find((c) => c.type === 'hard_constraints')
    expect(hardCheck?.status).toBe('pass')
  })

  it('fails when hard constraint keywords are missing', async () => {
    const drafts = new Map([['S01', 'Nothing interesting happened today.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const hardCheck = result.scenes[0].checks.find((c) => c.type === 'hard_constraints')
    expect(hardCheck?.status).toBe('fail')
  })
})

describe('validationEngine — anti-patterns', () => {
  it('passes when no anti-pattern keywords found', async () => {
    const drafts = new Map([['S01', 'The crew used carefully engineered systems. Premise was revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const antiCheck = result.scenes[0].checks.find((c) => c.type === 'anti_patterns')
    expect(antiCheck?.status).toBe('pass')
  })

  it('detects anti-pattern keywords', async () => {
    // "tech" and "magic" are both extracted as keywords from SF_N90_TECH_MAGIC
    const drafts = new Map([['S01', 'The tech magic allowed anything to happen. Premise revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const antiCheck = result.scenes[0].checks.find((c) => c.type === 'anti_patterns')
    expect(antiCheck?.status).toBe('fail')
  })
})

describe('validationEngine — tone', () => {
  it('warns when tone marker keywords missing', async () => {
    const drafts = new Map([['S01', 'A boring day at the office. Premise was revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const toneCheck = result.scenes[0].checks.find((c) => c.type === 'tone')
    expect(toneCheck?.status).toBe('warn')
  })

  it('passes when tone marker keywords present', async () => {
    const drafts = new Map([['S01', 'An intellectual atmosphere pervaded the station. Premise was revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const toneCheck = result.scenes[0].checks.find((c) => c.type === 'tone')
    expect(toneCheck?.status).toBe('pass')
  })
})

describe('validationEngine — entry/exit conditions', () => {
  it('passes when exit condition evidence present', async () => {
    const drafts = new Map([['S01', 'A call was received on the comm. Premise was revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const exitCheck = result.scenes[0].checks.find((c) => c.type === 'entry_exit')
    expect(exitCheck?.status).toBe('pass')
  })

  it('warns when exit condition evidence missing', async () => {
    const drafts = new Map([['S01', 'Nothing noteworthy happened. Premise was revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    const exitCheck = result.scenes[0].checks.find((c) => c.type === 'entry_exit')
    expect(exitCheck?.status).toBe('warn')
  })
})

describe('validationEngine — scene status', () => {
  it('marks scene as fail when hard constraints fail', async () => {
    const drafts = new Map([['S01', 'Nothing here.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    expect(result.scenes[0].status).toBe('fail')
  })

  it('marks scene as pass when all checks pass', async () => {
    const drafts = new Map([['S01', 'The intellectual premise was revealed. A call received.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    expect(result.scenes[0].status).toBe('pass')
  })
})

describe('validationEngine — global validation', () => {
  it('computes global coverage metrics', async () => {
    const drafts = new Map([['S01', 'The intellectual premise was revealed. A call received.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    expect(result.global.hard_constraints_coverage).toBe(1.0)
    expect(result.global.anti_pattern_violations).toBe(0)
  })

  it('reports anti-pattern violations in global metrics', async () => {
    const drafts = new Map([['S01', 'The tech magic solved everything. Premise revealed.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    expect(result.global.anti_pattern_violations).toBe(1)
  })
})

describe('validationEngine — with mock LLM', () => {
  it('merges LLM checks with heuristic checks', async () => {
    const llm = new MockLLMAdapter([
      // Response for hard constraint check
      'SF_N60_PREMISE_REVEAL: PASS — Premise clearly revealed in dialogue',
      // Response for anti-pattern check
      'SF_N90_TECH_MAGIC: PASS — No magic-like technology usage',
      // Response for tone check
      'PASS — Intellectual tone maintained throughout',
    ])
    const drafts = new Map([['S01', 'The intellectual premise was revealed. A call received.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
      llm,
    })
    expect(result.scenes[0].status).toBe('pass')
    // Should have LLM details merged in
    const hardCheck = result.scenes[0].checks.find((c) => c.type === 'hard_constraints')
    expect(hardCheck?.details.some((d) => d.includes('[LLM]'))).toBe(true)
  })
})

describe('validationEngine — metadata', () => {
  it('carries run_id and corpus hash', async () => {
    const drafts = new Map([['S01', 'Content here.']])
    const result = await validateScenes({
      contract: makeContract(),
      scenes: [makeScene()],
      beats: [makeBeat()],
      sceneDrafts: drafts,
      config: makeConfig(),
    })
    expect(result.run_id).toBe('RUN_TEST')
    expect(result.source_corpus_hash).toBe('test')
  })
})
