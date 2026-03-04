import { describe, it, expect } from 'vitest'
import { validateSummary, buildBeatSummaryPrompt, buildSceneGoalPrompt } from './plannerAgent.ts'
import type { StoryContract, Beat, Scene } from '../artifacts/types.ts'

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
      must_nots: ['Anti-pattern: Tech as Magic', 'User exclusion: time travel'],
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

describe('plannerAgent — validateSummary', () => {
  it('accepts valid text', () => {
    const result = validateSummary('A compelling opening scene.', makeContract(), 'fallback')
    expect(result).toBe('A compelling opening scene.')
  })

  it('rejects empty text', () => {
    const result = validateSummary('', makeContract(), 'fallback')
    expect(result).toBe('fallback')
  })

  it('rejects text mentioning anti-pattern by readable name', () => {
    const result = validateSummary('The tech magic drives the plot.', makeContract(), 'fallback')
    expect(result).toBe('fallback')
  })

  it('rejects text violating user exclusions', () => {
    const result = validateSummary('The hero discovers time travel.', makeContract(), 'fallback')
    expect(result).toBe('fallback')
  })

  it('accepts text that does not violate any boundary', () => {
    const result = validateSummary('The hero discovers a hidden message.', makeContract(), 'fallback')
    expect(result).toBe('The hero discovers a hidden message.')
  })
})

describe('plannerAgent — prompt builders', () => {
  it('buildBeatSummaryPrompt includes genre and role', () => {
    const contract = makeContract()
    const messages = buildBeatSummaryPrompt(contract.phase_guidelines[0], contract)
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('Science Fiction')
    expect(messages[1].role).toBe('user')
    expect(messages[1].content).toContain('Origin')
  })

  it('buildSceneGoalPrompt includes beat summary and constraints', () => {
    const contract = makeContract()
    const beat: Beat = {
      beat_id: 'B01',
      archetype_node_id: 'HJ_N01_ORDINARY',
      summary: 'Hero in ordinary world',
      required_exit_conditions: ['Call received'],
      target_emotional_scores: { tension: 0.1, hope: 0.6, fear: 0.1, resolution: 0.0 },
    }
    const scene: Scene = {
      scene_id: 'S01',
      beat_id: 'B01',
      setting: '',
      characters: [],
      scene_goal: 'Fulfill obligations',
      archetype_trace: { node_id: 'HJ_N01_ORDINARY', edge_in: null, edge_out: null },
      genre_obligations: [],
      constraints_checklist: { hard: ['SF_N60_PREMISE_REVEAL'], soft: [], must_not: ['SF_N90_TECH_MAGIC'] },
    }
    const messages = buildSceneGoalPrompt(scene, beat, contract)
    expect(messages).toHaveLength(2)
    expect(messages[1].content).toContain('SF_N60_PREMISE_REVEAL')
  })
})
