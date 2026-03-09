import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useGenerationStore } from '../store/generationStore.ts'

// Mock speechSynthesis for ReadAloudButton (not available in jsdom)
if (!window.speechSynthesis) {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      getVoices: vi.fn(() => []),
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })
}
import { ContractPanel } from './ContractPanel.tsx'
import { PlanPanel } from './PlanPanel.tsx'
import { TracePanel } from './TracePanel.tsx'
import { CompliancePanel } from './CompliancePanel.tsx'
import type {
  StoryContract,
  StoryPlan,
  StoryTrace,
  ValidationResults,
  SelectionResult,
} from '../artifacts/types.ts'

// Reset store between tests
beforeEach(() => {
  useGenerationStore.getState().clearRun()
})

// ---------------------------------------------------------------------------
// Mock data factories
// ---------------------------------------------------------------------------

function mockContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: '',
    archetype: {
      id_prefix: 'HJ',
      name: "The Hero's Journey",
      archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL'],
      required_roles: ['Origin', 'Disruption'],
      allowed_variants: [],
      required_edges: ['HJ_E01_DISRUPTS'],
    },
    genre: {
      id_prefix: 'SF',
      name: 'Science Fiction',
      genre_id: '06_science_fiction',
      levels: { '1': ['SF_N01_PROMISE'] },
      tone_marker: ['SF_N80_TONE'],
      anti_patterns: ['SF_N90_ANTI'],
      hard_constraints: ['SF_N01_PROMISE', 'SF_N80_TONE'],
      soft_constraints: ['SF_N60_SUBTYPE'],
    },
    global_boundaries: {
      musts: ['ethical dilemma'],
      must_nots: ['time travel'],
      content_limits: [],
      style_limits: [],
    },
    phase_guidelines: [
      {
        node_id: 'HJ_N01_ORDINARY',
        role: 'Origin',
        definition: 'Ordinary world',
        entry_conditions: [],
        exit_conditions: [],
        failure_modes: [],
        signals_in_text: [],
        genre_obligation_links: ['SF_N01_PROMISE'],
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

function mockPlan(): StoryPlan {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: '',
    beats: [
      {
        beat_id: 'beat_01',
        archetype_node_id: 'HJ_N01_ORDINARY',
        summary: 'The protagonist in their ordinary world',
        required_exit_conditions: [],
        target_emotional_scores: { tension: 0.1, hope: 0.5, fear: 0.1, resolution: 0.0 },
      },
    ],
    scenes: [
      {
        scene_id: 'scene_001',
        beat_id: 'beat_01',
        setting: 'Space station',
        characters: ['Maya'],
        scene_goal: 'Establish protagonist',
        archetype_trace: { node_id: 'HJ_N01_ORDINARY', edge_in: null, edge_out: 'HJ_E01_DISRUPTS' },
        genre_obligations: [{ node_id: 'SF_N01_PROMISE', severity: 'hard' }],
        constraints_checklist: { hard: ['SF_N01_PROMISE'], soft: [], must_not: [] },
      },
    ],
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
  }
}

function mockTrace(): StoryTrace {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: '',
    scene_trace: [
      {
        scene_id: 'scene_001',
        archetype: { node_id: 'HJ_N01_ORDINARY', edges: ['HJ_E01_DISRUPTS'] },
        genre: { satisfied_constraints: ['SF_N01_PROMISE'], tone_marker: 'SF_N80_TONE' },
        notes: [],
      },
    ],
  }
}

function mockValidation(): ValidationResults {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_TEST',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: '',
    scenes: [
      {
        scene_id: 'scene_001',
        status: 'pass',
        checks: [
          { type: 'hard_constraints', status: 'pass', details: ['All constraints met'] },
          { type: 'anti_patterns', status: 'pass', details: [] },
          { type: 'tone', status: 'pass', details: [] },
        ],
      },
    ],
    global: {
      hard_constraints_coverage: 1.0,
      soft_constraints_coverage: 0.8,
      anti_pattern_violations: 0,
      tone_warnings: 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContractPanel', () => {
  it('shows placeholder when no contract', () => {
    render(<ContractPanel />)
    expect(screen.getByText(/No contract available/)).toBeInTheDocument()
  })

  it('renders contract data', () => {
    const contract = mockContract()
    const selection = { compatibility: { matrix_classification: 'naturally compatible' }, tone_marker: { integration_classification: 'reinforcing' } } as unknown as SelectionResult
    useGenerationStore.setState({ contract, selection })
    render(<ContractPanel />)
    expect(screen.getByText('Story Contract')).toBeInTheDocument()
    expect(screen.getByText("The Hero's Journey")).toBeInTheDocument()
    expect(screen.getByText('Science Fiction')).toBeInTheDocument()
  })
})

describe('PlanPanel', () => {
  it('shows placeholder when no plan', () => {
    render(<PlanPanel />)
    expect(screen.getByText(/No plan available/)).toBeInTheDocument()
  })

  it('renders plan with beats and scenes', () => {
    const contract = mockContract()
    const plan = mockPlan()
    useGenerationStore.setState({ contract, plan })
    render(<PlanPanel />)
    expect(screen.getByText('The protagonist in their ordinary world')).toBeInTheDocument()
    expect(screen.getByText('Establish protagonist')).toBeInTheDocument()
    expect(screen.getByText(/1 beats/)).toBeInTheDocument()
  })
})

describe('TracePanel', () => {
  it('shows placeholder when no trace', () => {
    render(<TracePanel />)
    expect(screen.getByText(/No trace available/)).toBeInTheDocument()
  })

  it('renders trace data', () => {
    const trace = mockTrace()
    useGenerationStore.setState({ trace })
    render(<TracePanel />)
    expect(screen.getByText('Story Trace')).toBeInTheDocument()
    expect(screen.getByText('1 scenes traced')).toBeInTheDocument()
    expect(screen.getByText('1 satisfied')).toBeInTheDocument()
  })
})

describe('CompliancePanel', () => {
  it('shows placeholder when no validation', () => {
    render(<CompliancePanel />)
    expect(screen.getByText(/No validation results/)).toBeInTheDocument()
  })

  it('renders validation dashboard', () => {
    const validation = mockValidation()
    useGenerationStore.setState({ validation })
    render(<CompliancePanel />)
    expect(screen.getByText('Compliance Dashboard')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Pass')).toBeInTheDocument()
  })
})
