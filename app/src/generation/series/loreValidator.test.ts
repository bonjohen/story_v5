/**
 * Tests for the lore consistency validator.
 */
import { describe, it, expect } from 'vitest'
import { validateAgainstLore } from './loreValidator.ts'
import type { StoryLore, EpisodeArcContext, OverarchingArc } from './types.ts'
import type { StoryPlan, Scene, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeLore(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [
      {
        id: 'char_hero', name: 'Arion', role: 'protagonist',
        traits: [], motivations: [], arc_type: null, relationships: [],
        status: 'alive', introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
        current_location: 'place_village',
        knowledge: [], possessions: ['obj_sword'], arc_milestones: [],
      },
      {
        id: 'char_dead', name: 'Ghost', role: 'ally',
        traits: [], motivations: [], arc_type: null, relationships: [],
        status: 'dead', introduced_in: 'EP_001_a', died_in: 'EP_002_a',
        last_appeared_in: 'EP_002_a',
        knowledge: [], possessions: [], arc_milestones: [],
      },
    ],
    places: [],
    objects: [
      {
        id: 'obj_sword', name: 'Magic Sword', type: 'weapon',
        significance: 'Key weapon', introduced_in: 'EP_001_a',
        status: 'intact', current_holder: 'char_hero',
        custody_history: [{ holder_id: 'char_hero', acquired_in: 'EP_001_a', how: 'found' as const }],
      },
    ],
    factions: [],
    plot_threads: [
      {
        id: 'PT_001', title: 'Resolved Mystery', description: 'Done',
        status: 'resolved', urgency: 'medium',
        introduced_in: 'EP_001_a', progressed_in: [],
        resolved_in: 'EP_002_a', related_characters: [],
      },
      {
        id: 'PT_002', title: 'Critical Crisis', description: 'Urgent!',
        status: 'open', urgency: 'critical',
        introduced_in: 'EP_001_a', progressed_in: [],
        related_characters: ['char_hero'],
      },
    ],
    world_rules: [
      { id: 'WR_001', rule: 'No teleportation', established_in: 'EP_001_a', source: 'narrative' },
    ],
    event_log: [],
  }
}

function makePhaseGuideline(): PhaseGuideline {
  return {
    node_id: 'HJ_N02_CALL', role: 'Departure',
    definition: 'The call to adventure',
    entry_conditions: ['World established'], exit_conditions: ['Call is received'],
    failure_modes: [], signals_in_text: [], genre_obligation_links: [],
  }
}

function makeEpisodeContext(overrides?: Partial<EpisodeArcContext>): EpisodeArcContext {
  return {
    overarching_phase: 'HJ_N02_CALL',
    overarching_phase_guidelines: makePhaseGuideline(),
    episodic_archetype_id: '01_heros_journey',
    thread_priorities: [
      { thread_id: 'PT_002', action: 'advance' },
    ],
    open_plot_threads: [
      {
        id: 'PT_002', title: 'Critical Crisis', description: 'Urgent!',
        status: 'open', urgency: 'critical',
        introduced_in: 'EP_001_a', progressed_in: [],
        related_characters: ['char_hero'],
      },
    ],
    ...overrides,
  }
}

function makeOverarchingArc(): OverarchingArc {
  return {
    archetype_id: '01_heros_journey',
    archetype_name: "Hero's Journey",
    current_phase: 'HJ_N02_CALL',
    phase_history: [
      { node_id: 'HJ_N01_ORDINARY_WORLD', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_002_a' },
      { node_id: 'HJ_N02_CALL', entered_at_episode: 'EP_003_a' },
    ],
    remaining_phases: ['HJ_N03_MENTOR', 'HJ_N04_THRESHOLD'],
    advancement_mode: 'hybrid',
  }
}

function makePlan(scenes: Scene[]): StoryPlan {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test',
    beats: [],
    scenes,
    coverage_targets: { hard_constraints_min_coverage: 1, soft_constraints_min_coverage: 0.6 },
  }
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'place_village',
    characters: ['char_hero'],
    scene_goal: 'Continue the quest',
    archetype_trace: { node_id: 'HJ_N02', edge_in: null, edge_out: null },
    genre_obligations: [],
    constraints_checklist: { hard: [], soft: [], must_not: [] },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateAgainstLore', () => {
  it('passes when no violations exist', () => {
    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero'], places: ['place_village'], objects: [] },
        expected_transitions: [],
      },
    })

    const result = validateAgainstLore({
      plan: makePlan([scene]),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    })

    expect(result.overall_status).toBe('pass')
  })

  it('fails when dead character appears as participant', () => {
    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero', 'char_dead'], places: [], objects: [] },
        expected_transitions: [],
      },
    })

    const result = validateAgainstLore({
      plan: makePlan([scene]),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    })

    const mortalityCheck = result.checks.find((c) => c.type === 'lore_mortality')
    expect(mortalityCheck!.status).toBe('fail')
    expect(result.overall_status).toBe('fail')
  })

  it('warns when character location is inconsistent', () => {
    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero'], places: ['place_forest'], objects: [] },
        expected_transitions: [],
      },
    })

    const result = validateAgainstLore({
      plan: makePlan([scene]),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    })

    const locationCheck = result.checks.find((c) => c.type === 'lore_location')
    expect(locationCheck!.status).toBe('warn')
  })

  it('passes location check when travel transition exists', () => {
    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero'], places: ['place_forest'], objects: [] },
        expected_transitions: [
          { entity_id: 'char_hero', change: 'arrives', target: 'place_forest' },
        ],
      },
    })

    const result = validateAgainstLore({
      plan: makePlan([scene]),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    })

    const locationCheck = result.checks.find((c) => c.type === 'lore_location')
    expect(locationCheck!.status).toBe('pass')
  })

  it('warns when object custody holder is not in scene', () => {
    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_new'], places: [], objects: ['obj_sword'] },
        expected_transitions: [],
      },
    })

    const result = validateAgainstLore({
      plan: makePlan([scene]),
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      overarchingArc: makeOverarchingArc(),
    })

    const custodyCheck = result.checks.find((c) => c.type === 'lore_custody')
    expect(custodyCheck!.status).toBe('warn')
  })

  it('warns when critical thread is not prioritized', () => {
    const ctx = makeEpisodeContext({
      thread_priorities: [],  // No priorities at all
    })

    const result = validateAgainstLore({
      plan: makePlan([makeScene()]),
      lore: makeLore(),
      episodeContext: ctx,
      overarchingArc: makeOverarchingArc(),
    })

    const threadCheck = result.checks.find((c) => c.type === 'lore_thread_consistency')
    expect(threadCheck!.status).toBe('warn')
    expect(threadCheck!.details.some((d) => d.includes('Critical Crisis'))).toBe(true)
  })

  it('warns when arc advancement skips phases', () => {
    const ctx = makeEpisodeContext({
      arc_advancement_target: 'HJ_N04_THRESHOLD',  // skips HJ_N03_MENTOR
    })

    const result = validateAgainstLore({
      plan: makePlan([makeScene()]),
      lore: makeLore(),
      episodeContext: ctx,
      overarchingArc: makeOverarchingArc(),
    })

    const arcCheck = result.checks.find((c) => c.type === 'lore_arc_progress')
    expect(arcCheck!.status).toBe('warn')
    expect(arcCheck!.details.some((d) => d.includes('skip'))).toBe(true)
  })

  it('fails when arc advancement targets unknown phase', () => {
    const ctx = makeEpisodeContext({
      arc_advancement_target: 'HJ_N99_UNKNOWN',
    })

    const result = validateAgainstLore({
      plan: makePlan([makeScene()]),
      lore: makeLore(),
      episodeContext: ctx,
      overarchingArc: makeOverarchingArc(),
    })

    const arcCheck = result.checks.find((c) => c.type === 'lore_arc_progress')
    expect(arcCheck!.status).toBe('fail')
  })
})
