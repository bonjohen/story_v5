/**
 * Tests for the lore-aware episode contract compiler.
 */
import { describe, it, expect } from 'vitest'
import { compileEpisodeContract } from './episodeContractCompiler.ts'
import type { EpisodeContractInput } from './episodeContractCompiler.ts'
import type { StoryLore, EpisodeArcContext, EpisodeRequest, OverarchingArc } from './types.ts'
import type { SelectionResult, LoadedCorpus, GenerationConfig, PhaseGuideline } from '../artifacts/types.ts'

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
    { node_id: 'SF_N90_ANTI_PATTERN', role: 'Anti-Pattern', definition: 'Magic in sci-fi', label: 'No Magic', severity: 'hard', level: null, entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], typical_variants: [] },
  ]
  const genreEdges: never[] = []

  return {
    archetypeGraphs: new Map([['01_heros_journey', { id: '01_heros_journey', name: "Hero's Journey", type: 'archetype' as const, description: 'test', nodes: archetypeNodes as any, edges: archetypeEdges as any, _metadata: { nodeCount: 2, edgeCount: 1, nodesPerRole: {}, edgesPerMeaning: {} } }]]),
    genreGraphs: new Map([['06_science_fiction', { id: '06_science_fiction', name: 'Science Fiction', type: 'genre' as const, description: 'test', nodes: genreNodes as any, edges: genreEdges as any, _metadata: { nodeCount: 2, edgeCount: 0, nodesPerRole: {}, edgesPerMeaning: {}, severityCounts: { hard: 2, soft: 0, total: 2 } } }]]),
    variantGraphs: new Map(),
    matrix: { title: '', description: '', archetypes_reference: [], genres: [] },
    toneIntegration: { title: '', description: '', integrations: [] },
    emotionalArcs: { title: '', description: '', archetypes: [] },
    hybridPatterns: { title: '', description: '', hybrids: [] },
    blendingModel: { title: '', description: '', blends: [] },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { title: '', description: '', generated_at: '', files: [] } as any,
    corpusHash: 'test_hash',
    archetypeElements: new Map(),
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
    genre_blend: { enabled: false },
    hybrid_archetype: { enabled: false },
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
    composition_defaults: { allow_blend: false, allow_hybrid: false },
  }
}

function makeLore(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [
      {
        id: 'char_hero',
        name: 'Arion',
        role: 'protagonist',
        traits: ['brave'],
        motivations: ['save the world'],
        arc_type: 'transformative',
        relationships: [],
        status: 'alive',
        introduced_in: 'EP_001_a',
        last_appeared_in: 'EP_001_a',
        knowledge: [],
        possessions: [],
        arc_milestones: [],
      },
      {
        id: 'char_dead',
        name: 'Fallen Warrior',
        role: 'ally',
        traits: ['loyal'],
        motivations: ['protect'],
        arc_type: null,
        relationships: [],
        status: 'dead',
        introduced_in: 'EP_001_a',
        died_in: 'EP_002_a',
        last_appeared_in: 'EP_002_a',
        knowledge: [],
        possessions: [],
        arc_milestones: [],
      },
    ],
    places: [
      {
        id: 'place_castle',
        name: 'Castle Dread',
        type: 'stronghold',
        description: 'A ruined fortress',
        introduced_in: 'EP_001_a',
        last_featured_in: 'EP_001_a',
        status: 'destroyed',
        events_here: [],
      },
    ],
    objects: [],
    factions: [],
    plot_threads: [
      {
        id: 'PT_001_mystery',
        title: 'The Missing Artifact',
        description: 'Where is the relic?',
        status: 'resolved',
        urgency: 'medium',
        introduced_in: 'EP_001_a',
        progressed_in: [],
        resolved_in: 'EP_002_a',
        related_characters: ['char_hero'],
      },
    ],
    world_rules: [
      { id: 'WR_001', rule: 'FTL travel requires fuel crystals', established_in: 'EP_001_a', source: 'narrative' },
    ],
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
      { thread_id: 'PT_002_quest', action: 'advance' },
    ],
    open_plot_threads: [
      {
        id: 'PT_002_quest',
        title: 'The Great Quest',
        description: 'Find the ancient temple',
        status: 'open',
        urgency: 'high',
        introduced_in: 'EP_001_a',
        progressed_in: [],
        related_characters: ['char_hero'],
      },
    ],
  }
}

function makeRequest(): EpisodeRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test_hash',
    premise: 'Continue the adventure',
    medium: 'prose',
    length_target: 'short',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: '06_science_fiction',
    requested_archetype: '01_heros_journey',
    tone_preference: 'wonder',
    constraints: { must_include: [], must_exclude: [], allow_genre_blend: false, allow_hybrid_archetype: false },
    series_id: 'SER_test',
    slot_number: 3,
    candidate_label: 'a',
    lore_snapshot_id: 'SNAP_EP002',
    overarching_phase: 'HJ_N01_ORDINARY_WORLD',
    thread_priorities: [{ thread_id: 'PT_002_quest', action: 'advance' }],
  }
}

function makeOverarchingArc(): OverarchingArc {
  return {
    archetype_id: '01_heros_journey',
    archetype_name: "Hero's Journey",
    current_phase: 'HJ_N01_ORDINARY_WORLD',
    phase_history: [{ node_id: 'HJ_N01_ORDINARY_WORLD', entered_at_episode: 'EP_001_a' }],
    remaining_phases: ['HJ_N02_CALL'],
    advancement_mode: 'hybrid',
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('compileEpisodeContract', () => {
  it('produces a contract with lore_constraints', () => {
    const input: EpisodeContractInput = {
      selection: makeSelection(),
      request: makeRequest(),
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    }

    const contract = compileEpisodeContract(input)

    expect(contract.lore_constraints).toBeDefined()
    expect(contract.lore_constraints!.characters).toHaveLength(2)
    expect(contract.lore_constraints!.world_rules).toHaveLength(1)
    expect(contract.lore_constraints!.thread_obligations).toHaveLength(1)
    expect(contract.lore_constraints!.arc_phase).toBeDefined()
  })

  it('marks dead characters as must_not_appear', () => {
    const input: EpisodeContractInput = {
      selection: makeSelection(),
      request: makeRequest(),
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    }

    const contract = compileEpisodeContract(input)

    const deadChar = contract.lore_constraints!.characters.find((c) => c.id === 'char_dead')
    expect(deadChar).toBeDefined()
    expect(deadChar!.must_not_appear).toBe(true)
  })

  it('adds continuity locks for dead characters and destroyed places', () => {
    const input: EpisodeContractInput = {
      selection: makeSelection(),
      request: makeRequest(),
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    }

    const contract = compileEpisodeContract(input)

    expect(contract.lore_constraints!.continuity_locks.some((l) => l.includes('Fallen Warrior'))).toBe(true)
    expect(contract.lore_constraints!.continuity_locks.some((l) => l.includes('Castle Dread'))).toBe(true)
    expect(contract.lore_constraints!.continuity_locks.some((l) => l.includes('Missing Artifact'))).toBe(true)
  })

  it('extends global boundaries with lore musts and must_nots', () => {
    const input: EpisodeContractInput = {
      selection: makeSelection(),
      request: makeRequest(),
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    }

    const contract = compileEpisodeContract(input)

    // Should include world rules in musts
    expect(contract.global_boundaries.musts.some((m) => m.includes('FTL travel'))).toBe(true)

    // Should include dead character in must_nots
    expect(contract.global_boundaries.must_nots.some((m) => m.includes('Fallen Warrior'))).toBe(true)

    // Should include destroyed place in must_nots
    expect(contract.global_boundaries.must_nots.some((m) => m.includes('Castle Dread'))).toBe(true)
  })

  it('includes arc phase context', () => {
    const input: EpisodeContractInput = {
      selection: makeSelection(),
      request: makeRequest(),
      corpus: makeMinimalCorpus(),
      config: makeConfig(),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    }

    const contract = compileEpisodeContract(input)

    expect(contract.lore_constraints!.arc_phase!.current_phase_node_id).toBe('HJ_N01_ORDINARY_WORLD')
    expect(contract.lore_constraints!.arc_phase!.current_phase_role).toBe('Departure')
  })
})
