import { describe, it, expect } from 'vitest'
import { buildTrace, generateComplianceReport } from './traceEngine.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  ValidationResults,
} from '../artifacts/types.ts'

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-03-04T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: {
      id_prefix: 'HJ', name: "The Hero's Journey", archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL'],
      required_roles: ['Origin', 'Disruption'], allowed_variants: [],
      required_edges: ['HJ_E01_DISRUPTS'],
    },
    genre: {
      id_prefix: 'SF', name: 'Science Fiction', genre_id: '06_science_fiction',
      levels: { '5': ['SF_N60_PREMISE_REVEAL'] },
      tone_marker: ['SF_N80_INTELLECTUAL'], anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N60_PREMISE_REVEAL'], soft_constraints: [],
    },
    global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
    phase_guidelines: [],
    validation_policy: {
      hard_constraints_required: true, anti_patterns_blocking: true,
      tone_global: true, entry_exit_required: true, signals_required: 'soft',
    },
  }
}

function makeScenes(): Scene[] {
  return [
    {
      scene_id: 'S01', beat_id: 'B01', setting: '', characters: [],
      scene_goal: 'Establish world',
      archetype_trace: { node_id: 'HJ_N01_ORDINARY', edge_in: null, edge_out: 'HJ_E01_DISRUPTS' },
      genre_obligations: [{ node_id: 'SF_N60_PREMISE_REVEAL', severity: 'hard' }],
      constraints_checklist: { hard: ['SF_N60_PREMISE_REVEAL'], soft: [], must_not: [] },
    },
    {
      scene_id: 'S02', beat_id: 'B02', setting: '', characters: [],
      scene_goal: 'Disrupt world',
      archetype_trace: { node_id: 'HJ_N02_CALL', edge_in: 'HJ_E01_DISRUPTS', edge_out: null },
      genre_obligations: [], constraints_checklist: { hard: [], soft: [], must_not: [] },
    },
  ]
}

function makeBeats(): Beat[] {
  return [
    {
      beat_id: 'B01', archetype_node_id: 'HJ_N01_ORDINARY',
      summary: 'Origin', required_exit_conditions: [],
      target_emotional_scores: { tension: 0.1, hope: 0.6, fear: 0.1, resolution: 0.0 },
    },
    {
      beat_id: 'B02', archetype_node_id: 'HJ_N02_CALL',
      summary: 'Disruption', required_exit_conditions: [],
      target_emotional_scores: { tension: 0.4, hope: 0.5, fear: 0.3, resolution: 0.0 },
    },
  ]
}

function makePassingValidation(): ValidationResults {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-03-04T00:00:00Z',
    source_corpus_hash: 'test',
    scenes: [
      {
        scene_id: 'S01', status: 'pass',
        checks: [
          { type: 'hard_constraints', status: 'pass', details: ['All hard constraints satisfied'] },
          { type: 'anti_patterns', status: 'pass', details: ['No anti-patterns'] },
          { type: 'tone', status: 'pass', details: ['Tone correct'] },
        ],
      },
      {
        scene_id: 'S02', status: 'pass',
        checks: [
          { type: 'hard_constraints', status: 'pass', details: ['No hard constraints assigned'] },
          { type: 'anti_patterns', status: 'pass', details: ['No anti-patterns'] },
          { type: 'tone', status: 'pass', details: ['Tone correct'] },
        ],
      },
    ],
    global: {
      hard_constraints_coverage: 1.0,
      soft_constraints_coverage: 1.0,
      anti_pattern_violations: 0,
      tone_warnings: 0,
    },
  }
}

describe('traceEngine — buildTrace', () => {
  it('creates one trace entry per scene', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    expect(trace.scene_trace).toHaveLength(2)
  })

  it('records archetype node and edges', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    expect(trace.scene_trace[0].archetype.node_id).toBe('HJ_N01_ORDINARY')
    expect(trace.scene_trace[0].archetype.edges).toContain('HJ_E01_DISRUPTS')
    expect(trace.scene_trace[1].archetype.node_id).toBe('HJ_N02_CALL')
    expect(trace.scene_trace[1].archetype.edges).toContain('HJ_E01_DISRUPTS')
  })

  it('records satisfied genre constraints', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    expect(trace.scene_trace[0].genre.satisfied_constraints).toContain('SF_N60_PREMISE_REVEAL')
  })

  it('records tone marker from contract', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    expect(trace.scene_trace[0].genre.tone_marker).toBe('SF_N80_INTELLECTUAL')
  })

  it('adds warning notes from validation', () => {
    const validation = makePassingValidation()
    validation.scenes[0].status = 'warn'
    validation.scenes[0].checks[2] = { type: 'tone', status: 'warn', details: ['Tone drifts'] }

    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation,
    })
    expect(trace.scene_trace[0].notes.some((n) => n.includes('warn'))).toBe(true)
  })

  it('carries metadata from contract', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    expect(trace.run_id).toBe('RUN_TEST')
    expect(trace.source_corpus_hash).toBe('test')
  })
})

describe('traceEngine — compliance report', () => {
  it('generates markdown report with summary table', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    const report = generateComplianceReport(trace, makePassingValidation(), makeContract())
    expect(report).toContain('# Compliance Report')
    expect(report).toContain('Hard constraint coverage')
    expect(report).toContain('100%')
    expect(report).toContain('PASS')
  })

  it('includes scene detail table', () => {
    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation: makePassingValidation(),
    })
    const report = generateComplianceReport(trace, makePassingValidation(), makeContract())
    expect(report).toContain('S01')
    expect(report).toContain('HJ_N01_ORDINARY')
    expect(report).toContain('S02')
  })

  it('flags unresolved issues', () => {
    const validation = makePassingValidation()
    validation.scenes[0].status = 'fail'
    validation.scenes[0].checks[0] = {
      type: 'hard_constraints', status: 'fail', details: ['Missing evidence'],
    }

    const trace = buildTrace({
      contract: makeContract(),
      scenes: makeScenes(),
      beats: makeBeats(),
      validation,
    })
    const report = generateComplianceReport(trace, validation, makeContract())
    expect(report).toContain('Unresolved Issues')
    expect(report).toContain('S01')
    expect(report).toContain('FAIL')
  })
})
