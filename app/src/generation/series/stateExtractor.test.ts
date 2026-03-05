/**
 * Tests for state delta extraction from episode plans.
 */
import { describe, it, expect } from 'vitest'
import { extractStateDelta } from './stateExtractor.ts'
import type { StoryPlan, Scene, ElementRoster } from '../artifacts/types.ts'
import type { StoryLore } from './types.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyLore(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [],
    places: [],
    objects: [],
    factions: [],
    plot_threads: [],
    world_rules: [],
    event_log: [],
  }
}

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'A dark forest',
    characters: [],
    scene_goal: 'Establish the world',
    archetype_trace: { node_id: 'HJ_N01', edge_in: null, edge_out: null },
    genre_obligations: [],
    constraints_checklist: { hard: [], soft: [], must_not: [] },
    ...overrides,
  }
}

function makePlan(
  roster: ElementRoster,
  scenes: Scene[],
): StoryPlan {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test_hash',
    beats: [{ beat_id: 'B01', archetype_node_id: 'HJ_N01', summary: 'test', required_exit_conditions: [], target_emotional_scores: { tension: 0, hope: 0, fear: 0, resolution: 0 } }],
    scenes,
    coverage_targets: { hard_constraints_min_coverage: 1, soft_constraints_min_coverage: 0.6 },
    element_roster: roster,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('extractStateDelta', () => {
  it('returns empty delta when plan has no roster', () => {
    const plan: StoryPlan = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_01_01_0001',
      generated_at: '2026-01-01T00:00:00Z',
      source_corpus_hash: 'test',
      beats: [],
      scenes: [],
      coverage_targets: { hard_constraints_min_coverage: 1, soft_constraints_min_coverage: 0.6 },
    }

    const delta = extractStateDelta({
      plan,
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.episode_id).toBe('EP_001_a')
    expect(delta.characters_introduced).toHaveLength(0)
    expect(delta.character_updates).toHaveLength(0)
  })

  it('identifies new characters from roster', () => {
    const roster: ElementRoster = {
      characters: [
        { id: 'char_hero', name: 'Arion', category: 'character', role_or_type: 'protagonist', traits: ['brave'], motivations: ['save the world'] },
        { id: 'char_mentor', name: 'Sage', category: 'character', role_or_type: 'mentor', traits: ['wise'], motivations: ['guide the hero'] },
      ],
      places: [],
      objects: [],
    }

    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N01',
        participants: { characters: ['char_hero', 'char_mentor'], places: ['place_village'], objects: [] },
        expected_transitions: [],
      },
    })

    const delta = extractStateDelta({
      plan: makePlan(roster, [scene]),
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.characters_introduced).toHaveLength(2)
    expect(delta.characters_introduced[0].id).toBe('char_hero')
    expect(delta.characters_introduced[0].name).toBe('Arion')
    expect(delta.characters_introduced[0].role).toBe('protagonist')
    expect(delta.characters_introduced[0].status).toBe('alive')
    expect(delta.characters_introduced[0].introduced_in).toBe('EP_001_a')
  })

  it('creates updates for existing characters with transitions', () => {
    const lore = emptyLore()
    lore.characters.push({
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
    })

    const roster: ElementRoster = {
      characters: [
        { id: 'char_hero', name: 'Arion', category: 'character', role_or_type: 'protagonist' },
      ],
      places: [],
      objects: [],
    }

    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero'], places: [], objects: [] },
        expected_transitions: [
          { entity_id: 'char_hero', change: 'learns', target: 'ancient_prophecy', description: 'Learns of the ancient prophecy' },
          { entity_id: 'char_hero', change: 'gains', target: 'sword_of_light', description: 'Receives the Sword of Light' },
        ],
      },
    })

    const delta = extractStateDelta({
      plan: makePlan(roster, [scene]),
      episodeId: 'EP_002_a',
      lore,
    })

    expect(delta.characters_introduced).toHaveLength(0)
    expect(delta.character_updates).toHaveLength(1)
    expect(delta.character_updates[0].character_id).toBe('char_hero')
    expect(delta.character_updates[0].transitions).toHaveLength(2)
    expect(delta.character_updates[0].transitions[0].change).toBe('learns')
  })

  it('handles character death transitions', () => {
    const roster: ElementRoster = {
      characters: [
        { id: 'char_villain', name: 'Malachar', category: 'character', role_or_type: 'antagonist' },
      ],
      places: [],
      objects: [],
    }

    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N07',
        participants: { characters: ['char_villain'], places: [], objects: [] },
        expected_transitions: [
          { entity_id: 'char_villain', change: 'dies', description: 'Defeated in final battle' },
        ],
      },
    })

    const delta = extractStateDelta({
      plan: makePlan(roster, [scene]),
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.characters_introduced).toHaveLength(1)
    expect(delta.characters_introduced[0].status).toBe('dead')
    expect(delta.characters_introduced[0].died_in).toBe('EP_001_a')
  })

  it('tracks new places', () => {
    const roster: ElementRoster = {
      characters: [],
      places: [
        { id: 'place_castle', name: 'Castle Dread', category: 'place', role_or_type: 'stronghold' },
      ],
      objects: [],
    }

    const delta = extractStateDelta({
      plan: makePlan(roster, [makeScene()]),
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.places_introduced).toHaveLength(1)
    expect(delta.places_introduced[0].id).toBe('place_castle')
    expect(delta.places_introduced[0].type).toBe('stronghold')
  })

  it('tracks new objects with custody', () => {
    const roster: ElementRoster = {
      characters: [
        { id: 'char_hero', name: 'Arion', category: 'character', role_or_type: 'protagonist' },
      ],
      places: [],
      objects: [
        { id: 'obj_sword', name: 'Sword of Light', category: 'object', role_or_type: 'weapon' },
      ],
    }

    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N03',
        participants: { characters: ['char_hero'], places: [], objects: ['obj_sword'] },
        expected_transitions: [
          { entity_id: 'char_hero', change: 'gains', target: 'obj_sword', description: 'Receives the Sword of Light' },
        ],
      },
    })

    const delta = extractStateDelta({
      plan: makePlan(roster, [scene]),
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.objects_introduced).toHaveLength(1)
    expect(delta.objects_introduced[0].id).toBe('obj_sword')
    expect(delta.objects_introduced[0].current_holder).toBe('char_hero')
    expect(delta.objects_introduced[0].custody_history).toHaveLength(1)
  })

  it('extracts implied plot threads from reveals', () => {
    const roster: ElementRoster = {
      characters: [
        { id: 'char_hero', name: 'Arion', category: 'character', role_or_type: 'protagonist' },
      ],
      places: [],
      objects: [],
    }

    const scene = makeScene({
      moment: {
        moment_id: 'M01',
        archetype_node: 'HJ_N02',
        participants: { characters: ['char_hero'], places: [], objects: [] },
        expected_transitions: [
          { entity_id: 'char_hero', change: 'reveals', description: 'Hidden royal lineage' },
        ],
      },
    })

    const delta = extractStateDelta({
      plan: makePlan(roster, [scene]),
      episodeId: 'EP_001_a',
      lore: emptyLore(),
    })

    expect(delta.threads_introduced.length).toBeGreaterThan(0)
    expect(delta.threads_introduced[0].title).toContain('Revelation')
    expect(delta.threads_introduced[0].status).toBe('open')
  })
})
