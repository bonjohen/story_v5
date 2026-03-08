/**
 * Tests for the lore-aware episode planner.
 */
import { describe, it, expect } from 'vitest'
import { buildEpisodePlan } from './episodePlanner.ts'
import type { EpisodePlannerOptions } from './episodePlanner.ts'
import type { StoryLore, EpisodeArcContext } from './types.ts'
import type { LoadedCorpus, GenerationConfig, SelectionResult, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Minimal test fixtures
// ---------------------------------------------------------------------------

function makeMinimalCorpus(): LoadedCorpus {
  const archetypeNodes = [
    { node_id: 'HJ_N01_ORDINARY_WORLD', role: 'Departure', definition: 'The hero in their normal world', label: 'Ordinary World', entry_conditions: ['Hero exists'], exit_conditions: ['A disruption arrives'], failure_modes: ['No clear world'], signals_in_text: ['daily routine'], typical_variants: [], severity: undefined, level: null },
    { node_id: 'HJ_N02_CALL', role: 'Departure', definition: 'The call to adventure', label: 'Call to Adventure', entry_conditions: ['World established'], exit_conditions: ['Call is received'], failure_modes: ['Weak call'], signals_in_text: ['summons'], typical_variants: [], severity: undefined, level: null },
  ]
  const archetypeEdges = [
    { edge_id: 'HJ_E01_ORDINARY_TO_CALL', from: 'HJ_N01_ORDINARY_WORLD', to: 'HJ_N02_CALL', label: 'Disruption', meaning: 'catalyst', preconditions: [], effects_on_stakes: '', effects_on_character: '', common_alternatives: [], anti_patterns: [] },
  ]
  const genreNodes = [
    { node_id: 'SF_N01_GENRE_PROMISE', role: 'Genre Promise', definition: 'Science fiction promise', label: 'Sci-Fi Promise', severity: 'hard', level: 1, entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], typical_variants: [] },
  ]

  return {
    archetypeGraphs: new Map([['01_heros_journey', { id: '01_heros_journey', name: "Hero's Journey", type: 'archetype' as const, description: 'test', nodes: archetypeNodes as any, edges: archetypeEdges as any, _metadata: { nodeCount: 2, edgeCount: 1, nodesPerRole: {}, edgesPerMeaning: {} } }]]),
    genreGraphs: new Map([['06_science_fiction', { id: '06_science_fiction', name: 'Science Fiction', type: 'genre' as const, description: 'test', nodes: genreNodes as any, edges: [] as any, _metadata: { nodeCount: 1, edgeCount: 0, nodesPerRole: {}, edgesPerMeaning: {}, severityCounts: { hard: 1, soft: 0, total: 1 } } }]]),
    variantGraphs: new Map(),
    matrix: { title: '', description: '', archetypes_reference: [], genres: [] },
    toneIntegration: { title: '', description: '', integrations: [] },
    emotionalArcs: { title: '', description: '', archetypes: [] },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { title: '', description: '', generated_at: '', files: [] } as any,
    corpusHash: 'test_hash',
    archetypeElements: new Map([['01_heros_journey', {
      archetype_id: '01_heros_journey',
      element_templates: {
        characters: [
          { role: 'protagonist' as const, label: 'The Hero', definition: 'Central character', appears_at_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'], required: true },
          { role: 'mentor' as const, label: 'The Mentor', definition: 'Wise guide', appears_at_nodes: ['HJ_N02_CALL'], required: true },
        ],
        places: [
          { type: 'ordinary_world' as const, label: 'Home', definition: 'Starting place', appears_at_nodes: ['HJ_N01_ORDINARY_WORLD'], required: true },
        ],
        objects: [
          { type: 'weapon' as const, label: 'The Weapon', definition: 'Key weapon', appears_at_nodes: ['HJ_N02_CALL'], required: false },
        ],
      },
    }]]),
    genreElementConstraints: new Map(),
  }
}

function makeSelection(): SelectionResult {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test_hash',
    primary_archetype: '01_heros_journey',
    primary_genre: '06_science_fiction',
    compatibility: { matrix_classification: 'naturally compatible', rationale: [] },
    tone_marker: { selected: 'wonder', genre_tone_node_id: 'SF_N80_TONE', integration_classification: 'reinforcing' },
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

function makeLoreWithHero(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [
      {
        id: 'char_arion',
        name: 'Arion',
        role: 'protagonist',
        traits: ['brave', 'curious'],
        motivations: ['save the world'],
        arc_type: 'transformative',
        relationships: [],
        status: 'alive',
        introduced_in: 'EP_001_a',
        last_appeared_in: 'EP_001_a',
        current_location: 'place_village',
        knowledge: ['The prophecy exists'],
        possessions: ['obj_amulet'],
        arc_milestones: [],
      },
    ],
    places: [
      {
        id: 'place_village',
        name: 'Starlight Village',
        type: 'ordinary_world',
        description: 'A peaceful settlement',
        introduced_in: 'EP_001_a',
        last_featured_in: 'EP_001_a',
        status: 'extant',
        events_here: [],
      },
    ],
    objects: [
      {
        id: 'obj_amulet',
        name: 'Amulet of Seeing',
        type: 'talisman',
        significance: 'Reveals hidden truths',
        introduced_in: 'EP_001_a',
        status: 'intact',
        current_holder: 'char_arion',
        custody_history: [{ holder_id: 'char_arion', acquired_in: 'EP_001_a', how: 'found' as const }],
      },
    ],
    factions: [],
    plot_threads: [
      {
        id: 'PT_001_prophecy',
        title: 'The Ancient Prophecy',
        description: 'What does the prophecy foretell?',
        status: 'open',
        urgency: 'high',
        introduced_in: 'EP_001_a',
        progressed_in: ['EP_001_a'],
        related_characters: ['char_arion'],
      },
    ],
    world_rules: [],
    event_log: [],
  }
}

function makePhaseGuideline(): PhaseGuideline {
  return {
    node_id: 'HJ_N01_ORDINARY_WORLD',
    role: 'Departure',
    definition: 'The hero in their normal world',
    entry_conditions: ['Hero exists'],
    exit_conditions: ['A disruption arrives'],
    failure_modes: ['No clear world'],
    signals_in_text: ['daily routine'],
    genre_obligation_links: [],
  }
}

function makeEpisodeContext(): EpisodeArcContext {
  return {
    overarching_phase: 'HJ_N01_ORDINARY_WORLD',
    overarching_phase_guidelines: makePhaseGuideline(),
    episodic_archetype_id: '01_heros_journey',
    thread_priorities: [
      { thread_id: 'PT_001_prophecy', action: 'advance' },
    ],
    open_plot_threads: [
      {
        id: 'PT_001_prophecy',
        title: 'The Ancient Prophecy',
        description: 'What does the prophecy foretell?',
        status: 'open',
        urgency: 'high',
        introduced_in: 'EP_001_a',
        progressed_in: ['EP_001_a'],
        related_characters: ['char_arion'],
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildEpisodePlan', () => {
  it('produces a plan with lore-sourced element roster', async () => {
    const contract = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_01_01_0001',
      generated_at: '2026-01-01T00:00:00Z',
      source_corpus_hash: 'test_hash',
      archetype: {
        id_prefix: 'HJ',
        name: "Hero's Journey",
        archetype_id: '01_heros_journey',
        spine_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'],
        required_roles: ['Departure'],
        allowed_variants: [],
        required_edges: ['HJ_E01_ORDINARY_TO_CALL'],
      },
      genre: {
        id_prefix: 'SF',
        name: 'Science Fiction',
        genre_id: '06_science_fiction',
        levels: {},
        tone_marker: [],
        anti_patterns: [],
        hard_constraints: [],
        soft_constraints: [],
      },
      global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
      phase_guidelines: [makePhaseGuideline(), { ...makePhaseGuideline(), node_id: 'HJ_N02_CALL', role: 'Departure', definition: 'Call to adventure' }],
      validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' as const },
      element_requirements: [
        { category: 'character' as const, role_or_type: 'protagonist', label: 'The Hero', definition: 'Central character', required: true, appears_at_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'] },
        { category: 'character' as const, role_or_type: 'mentor', label: 'The Mentor', definition: 'Wise guide', required: true, appears_at_nodes: ['HJ_N02_CALL'] },
        { category: 'place' as const, role_or_type: 'ordinary_world', label: 'Home', definition: 'Starting place', required: true, appears_at_nodes: ['HJ_N01_ORDINARY_WORLD'] },
      ],
    }

    const options: EpisodePlannerOptions = {
      contract,
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      selection: makeSelection(),
      lore: makeLoreWithHero(),
      episodeContext: makeEpisodeContext(),
    }

    const plan = await buildEpisodePlan(options)

    // Should use lore character 'Arion' for protagonist
    expect(plan.element_roster).toBeDefined()
    const protagonist = plan.element_roster!.characters.find((c) => c.role_or_type === 'protagonist')
    expect(protagonist).toBeDefined()
    expect(protagonist!.id).toBe('char_arion')
    expect(protagonist!.name).toBe('Arion')
  })

  it('uses lore places for roster', async () => {
    const contract = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_01_01_0001',
      generated_at: '2026-01-01T00:00:00Z',
      source_corpus_hash: 'test_hash',
      archetype: {
        id_prefix: 'HJ',
        name: "Hero's Journey",
        archetype_id: '01_heros_journey',
        spine_nodes: ['HJ_N01_ORDINARY_WORLD'],
        required_roles: ['Departure'],
        allowed_variants: [],
        required_edges: [],
      },
      genre: {
        id_prefix: 'SF',
        name: 'Science Fiction',
        genre_id: '06_science_fiction',
        levels: {},
        tone_marker: [],
        anti_patterns: [],
        hard_constraints: [],
        soft_constraints: [],
      },
      global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
      phase_guidelines: [makePhaseGuideline()],
      validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' as const },
      element_requirements: [
        { category: 'place' as const, role_or_type: 'ordinary_world', label: 'Home', definition: 'Starting place', required: true, appears_at_nodes: ['HJ_N01_ORDINARY_WORLD'] },
      ],
    }

    const plan = await buildEpisodePlan({
      contract,
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      selection: makeSelection(),
      lore: makeLoreWithHero(),
      episodeContext: makeEpisodeContext(),
    })

    const place = plan.element_roster!.places.find((p) => p.role_or_type === 'ordinary_world')
    expect(place).toBeDefined()
    expect(place!.id).toBe('place_village')
    expect(place!.name).toBe('Starlight Village')
  })

  it('weaves thread obligations into scene goals', async () => {
    const contract = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_01_01_0001',
      generated_at: '2026-01-01T00:00:00Z',
      source_corpus_hash: 'test_hash',
      archetype: {
        id_prefix: 'HJ',
        name: "Hero's Journey",
        archetype_id: '01_heros_journey',
        spine_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'],
        required_roles: ['Departure'],
        allowed_variants: [],
        required_edges: ['HJ_E01_ORDINARY_TO_CALL'],
      },
      genre: {
        id_prefix: 'SF',
        name: 'Science Fiction',
        genre_id: '06_science_fiction',
        levels: {},
        tone_marker: [],
        anti_patterns: [],
        hard_constraints: [],
        soft_constraints: [],
      },
      global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
      phase_guidelines: [makePhaseGuideline(), { ...makePhaseGuideline(), node_id: 'HJ_N02_CALL' }],
      validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' as const },
    }

    const plan = await buildEpisodePlan({
      contract,
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      selection: makeSelection(),
      lore: makeLoreWithHero(),
      episodeContext: makeEpisodeContext(),
    })

    // At least one scene should mention the thread
    const hasThread = plan.scenes.some((s) => s.scene_goal.includes('Ancient Prophecy'))
    expect(hasThread).toBe(true)
  })

  it('adds arc context to first and last scene goals', async () => {
    const contract = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_01_01_0001',
      generated_at: '2026-01-01T00:00:00Z',
      source_corpus_hash: 'test_hash',
      archetype: {
        id_prefix: 'HJ',
        name: "Hero's Journey",
        archetype_id: '01_heros_journey',
        spine_nodes: ['HJ_N01_ORDINARY_WORLD', 'HJ_N02_CALL'],
        required_roles: ['Departure'],
        allowed_variants: [],
        required_edges: ['HJ_E01_ORDINARY_TO_CALL'],
      },
      genre: {
        id_prefix: 'SF',
        name: 'Science Fiction',
        genre_id: '06_science_fiction',
        levels: {},
        tone_marker: [],
        anti_patterns: [],
        hard_constraints: [],
        soft_constraints: [],
      },
      global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
      phase_guidelines: [makePhaseGuideline(), { ...makePhaseGuideline(), node_id: 'HJ_N02_CALL' }],
      validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' as const },
    }

    const plan = await buildEpisodePlan({
      contract,
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      selection: makeSelection(),
      lore: makeLoreWithHero(),
      episodeContext: makeEpisodeContext(),
    })

    expect(plan.scenes[0].scene_goal).toContain('[Arc: Departure]')
    expect(plan.scenes[plan.scenes.length - 1].scene_goal).toContain('[Arc: Departure]')
  })
})
