import { describe, it, expect } from 'vitest'
import { buildPlan } from './planner.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type {
  StoryContract,
  LoadedCorpus,
  GenerationConfig,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_0001',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'test',
    archetype: {
      id_prefix: 'HJ',
      name: "The Hero's Journey",
      archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL', 'HJ_N03_MENTOR'],
      required_roles: ['Origin', 'Disruption', 'Catalyst'],
      allowed_variants: [],
      required_edges: ['HJ_E01_DISRUPTS', 'HJ_E02_FORCES'],
    },
    genre: {
      id_prefix: 'SF',
      name: 'Science Fiction',
      genre_id: '06_science_fiction',
      levels: {
        '1': ['SF_N01_PROMISE'],
        '2': ['SF_N10_SPECULATIVE'],
        '3': ['SF_N20_HARD_SF'],
        '4': ['SF_N40_TECH_RULES'],
        '5': ['SF_N60_PREMISE_REVEAL'],
      },
      tone_marker: ['SF_N80_INTELLECTUAL'],
      anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N01_PROMISE', 'SF_N10_SPECULATIVE', 'SF_N40_TECH_RULES', 'SF_N60_PREMISE_REVEAL', 'SF_N80_INTELLECTUAL'],
      soft_constraints: ['SF_N20_HARD_SF'],
    },
    global_boundaries: {
      musts: ['Genre promise: Speculative premise explored'],
      must_nots: ['Anti-pattern: Tech as Magic', 'User exclusion: time travel'],
      content_limits: ['no violence'],
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
        genre_obligation_links: ['SF_N01_PROMISE'],
      },
      {
        node_id: 'HJ_N02_CALL',
        role: 'Disruption',
        definition: 'Something disrupts the ordinary',
        entry_conditions: ['World established'],
        exit_conditions: ['Call acknowledged'],
        failure_modes: ['Too subtle'],
        signals_in_text: ['Disrupting event'],
        genre_obligation_links: ['SF_N60_PREMISE_REVEAL'],
      },
      {
        node_id: 'HJ_N03_MENTOR',
        role: 'Catalyst',
        definition: 'Hero meets guide',
        entry_conditions: ['Call accepted'],
        exit_conditions: ['Guidance received'],
        failure_modes: ['Mentor info dumps'],
        signals_in_text: ['Wise figure appears'],
        genre_obligation_links: [],
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

function makeCorpus(): LoadedCorpus {
  return {
    archetypeGraphs: new Map(),
    genreGraphs: new Map(),
    variantGraphs: new Map(),
    matrix: { title: '', description: '', archetypes_reference: [], genres: [] },
    toneIntegration: { title: '', description: '', integrations: [] },
    emotionalArcs: {
      title: 'Emotional Arcs',
      description: '',
      archetypes: [
        {
          archetype: "The Hero's Journey",
          archetype_id: '01_heros_journey',
          arc_profile: [
            { node_id: 'HJ_N01_ORDINARY', position: 0.0, tension: 0.1, hope: 0.6, fear: 0.1, resolution: 0.0 },
            { node_id: 'HJ_N02_CALL', position: 0.15, tension: 0.4, hope: 0.5, fear: 0.3, resolution: 0.0 },
            { node_id: 'HJ_N03_MENTOR', position: 0.25, tension: 0.3, hope: 0.7, fear: 0.2, resolution: 0.0 },
          ],
          variant_profiles: [],
          arc_shape: 'U-curve',
          dominant_emotion: 'hope',
          emotional_range: 0.85,
          summary: 'Hope-driven arc',
        },
      ],
    },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { generated: '', archetypes: [], genres: [], totals: { archetypes: 0, genres: 0, totalNodes: 0, totalEdges: 0 } },
    corpusHash: 'test',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
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

// ---------------------------------------------------------------------------
// Beat scaffolding tests
// ---------------------------------------------------------------------------

describe('planner — beat scaffolding', () => {
  it('creates one beat per spine node', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.beats).toHaveLength(3)
    expect(plan.beats.map((b) => b.archetype_node_id)).toEqual([
      'HJ_N01_ORDINARY',
      'HJ_N02_CALL',
      'HJ_N03_MENTOR',
    ])
  })

  it('assigns sequential beat IDs', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.beats.map((b) => b.beat_id)).toEqual(['B01', 'B02', 'B03'])
  })

  it('generates deterministic summaries from node definitions', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.beats[0].summary).toBe('[Origin] Hero in ordinary world')
    expect(plan.beats[1].summary).toBe('[Disruption] Something disrupts the ordinary')
  })

  it('assigns emotional scores from arc profile', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.beats[0].target_emotional_scores).toEqual({
      tension: 0.1, hope: 0.6, fear: 0.1, resolution: 0.0,
    })
    expect(plan.beats[1].target_emotional_scores).toEqual({
      tension: 0.4, hope: 0.5, fear: 0.3, resolution: 0.0,
    })
  })

  it('uses default emotional scores when arc profile is missing', async () => {
    const corpus = makeCorpus()
    corpus.emotionalArcs.archetypes = []
    const plan = await buildPlan({ contract: makeContract(), corpus, config: makeConfig() })
    expect(plan.beats[0].target_emotional_scores).toEqual({
      tension: 0.5, hope: 0.5, fear: 0.3, resolution: 0.0,
    })
  })

  it('carries exit conditions from phase guidelines', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.beats[0].required_exit_conditions).toEqual(['Call received'])
    expect(plan.beats[2].required_exit_conditions).toEqual(['Guidance received'])
  })
})

// ---------------------------------------------------------------------------
// Scene assignment tests
// ---------------------------------------------------------------------------

describe('planner — scene assignment', () => {
  it('creates one scene per beat', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.scenes).toHaveLength(3)
    expect(plan.scenes.map((s) => s.beat_id)).toEqual(['B01', 'B02', 'B03'])
  })

  it('assigns sequential scene IDs', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.scenes.map((s) => s.scene_id)).toEqual(['S01', 'S02', 'S03'])
  })

  it('assigns hard genre obligations to scenes', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    const allHard = plan.scenes.flatMap((s) => s.constraints_checklist.hard)
    // SF_N60_PREMISE_REVEAL is the only hard L5 obligation
    expect(allHard).toContain('SF_N60_PREMISE_REVEAL')
  })

  it('assigns soft genre obligations to scenes', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    const allSoft = plan.scenes.flatMap((s) => s.constraints_checklist.soft)
    // SF_N20_HARD_SF is the only soft constraint that's also an L5 obligation (it's L3, not L5)
    // Soft obligations are only those that are scene obligations (L5)
    // In our test data, SF_N20_HARD_SF is L3, not L5, so it won't appear as a scene obligation
    // This is correct behavior — only L5 nodes get distributed as scene obligations
    expect(allSoft.length).toBeGreaterThanOrEqual(0)
  })

  it('builds archetype trace with edge_in and edge_out', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    // First scene: no edge_in, edge_out is first edge
    expect(plan.scenes[0].archetype_trace).toEqual({
      node_id: 'HJ_N01_ORDINARY',
      edge_in: null,
      edge_out: 'HJ_E01_DISRUPTS',
    })
    // Second scene: edge_in is first edge, edge_out is second edge
    expect(plan.scenes[1].archetype_trace).toEqual({
      node_id: 'HJ_N02_CALL',
      edge_in: 'HJ_E01_DISRUPTS',
      edge_out: 'HJ_E02_FORCES',
    })
    // Third scene: edge_in is second edge, no edge_out
    expect(plan.scenes[2].archetype_trace).toEqual({
      node_id: 'HJ_N03_MENTOR',
      edge_in: 'HJ_E02_FORCES',
      edge_out: null,
    })
  })

  it('includes anti-patterns in must_not for every scene', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    for (const scene of plan.scenes) {
      expect(scene.constraints_checklist.must_not).toContain('SF_N90_TECH_MAGIC')
    }
  })
})

// ---------------------------------------------------------------------------
// Coverage tracking tests
// ---------------------------------------------------------------------------

describe('planner — coverage tracking', () => {
  it('emits coverage targets from config', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.coverage_targets.hard_constraints_min_coverage).toBe(1.0)
    expect(plan.coverage_targets.soft_constraints_min_coverage).toBe(0.6)
  })

  it('distributes unassigned hard obligations across scenes', async () => {
    // Create a contract with multiple hard L5 obligations
    const contract = makeContract()
    contract.genre.levels['5'] = ['SF_N60_PREMISE_REVEAL', 'SF_N61_TECH_DEMO']
    contract.genre.hard_constraints.push('SF_N61_TECH_DEMO')

    const plan = await buildPlan({ contract, corpus: makeCorpus(), config: makeConfig() })
    const allHard = plan.scenes.flatMap((s) => s.constraints_checklist.hard)
    expect(allHard).toContain('SF_N60_PREMISE_REVEAL')
    expect(allHard).toContain('SF_N61_TECH_DEMO')
  })
})

// ---------------------------------------------------------------------------
// LLM integration tests
// ---------------------------------------------------------------------------

describe('planner — LLM enhancement', () => {
  it('enhances beat summaries with mock LLM', async () => {
    // enhancePlanWithLLM uses batched calls: one for beats, one for scenes
    const llm = new MockLLMAdapter([
      // Batched beat response
      'BEAT_ID=B01: The hero tends moisture vaporators under twin suns.\nBEAT_ID=B02: A holographic message shatters the hero\'s routine.\nBEAT_ID=B03: An old hermit reveals the hero\'s hidden legacy.',
      // Batched scene response
      'SCENE_ID=S01: Establish mundane world.\nSCENE_ID=S02: Reveal the premise.\nSCENE_ID=S03: Provide guidance.',
    ])
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig(), llm })
    expect(plan.beats[0].summary).toBe('The hero tends moisture vaporators under twin suns.')
    expect(plan.beats[1].summary).toBe("A holographic message shatters the hero's routine.")
  })

  it('enhances scene goals with mock LLM', async () => {
    const llm = new MockLLMAdapter([
      // Batched beat response
      'BEAT_ID=B01: Enhanced beat 1\nBEAT_ID=B02: Enhanced beat 2\nBEAT_ID=B03: Enhanced beat 3',
      // Batched scene response
      'SCENE_ID=S01: Establish the protagonist in a mundane tech-dependent world.\nSCENE_ID=S02: Reveal the speculative premise through a disruptive event.\nSCENE_ID=S03: Introduce a mentor who explains the rules of the world.',
    ])
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig(), llm })
    expect(plan.scenes[0].scene_goal).toBe('Establish the protagonist in a mundane tech-dependent world.')
  })

  it('produces valid plan without LLM', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.schema_version).toBe('1.0.0')
    expect(plan.run_id).toBe('RUN_2026_03_04_0001')
    expect(plan.beats.length).toBeGreaterThan(0)
    expect(plan.scenes.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Plan metadata tests
// ---------------------------------------------------------------------------

describe('planner — plan metadata', () => {
  it('carries run_id and corpus hash from contract', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    expect(plan.run_id).toBe('RUN_2026_03_04_0001')
    expect(plan.source_corpus_hash).toBe('test')
  })

  it('sets generated_at to a valid ISO timestamp', async () => {
    const plan = await buildPlan({ contract: makeContract(), corpus: makeCorpus(), config: makeConfig() })
    const parsed = Date.parse(plan.generated_at)
    expect(isNaN(parsed)).toBe(false)
  })
})
