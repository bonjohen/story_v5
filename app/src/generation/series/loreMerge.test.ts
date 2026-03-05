/**
 * Tests for lore merge logic and canonization.
 */
import { describe, it, expect } from 'vitest'
import {
  mergeDeltaIntoLore,
  validateLore,
  validateDeltaAgainstLore,
} from './loreMerge.ts'
import type {
  StoryLore,
  StateDelta,
  LoreCharacter,
} from './types.ts'

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

function makeCharacter(overrides: Partial<LoreCharacter> = {}): LoreCharacter {
  return {
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
    ...overrides,
  }
}

function emptyDelta(episodeId: string): StateDelta {
  return {
    episode_id: episodeId,
    extracted_at: '2026-01-01T00:00:00Z',
    characters_introduced: [],
    character_updates: [],
    places_introduced: [],
    place_updates: [],
    objects_introduced: [],
    object_updates: [],
    threads_introduced: [],
    thread_updates: [],
  }
}

// ---------------------------------------------------------------------------
// mergeDeltaIntoLore
// ---------------------------------------------------------------------------

describe('mergeDeltaIntoLore', () => {
  it('adds introduced characters to the lore', () => {
    const lore = emptyLore()
    const delta = emptyDelta('EP_001_a')
    delta.characters_introduced = [makeCharacter()]

    const result = mergeDeltaIntoLore(lore, delta)

    expect(result.characters).toHaveLength(1)
    expect(result.characters[0].id).toBe('char_hero')
    expect(result.last_updated_by).toBe('EP_001_a')
  })

  it('does not duplicate existing characters when introduced', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter())

    const delta = emptyDelta('EP_002_a')
    delta.characters_introduced = [makeCharacter({ id: 'char_hero' })]

    const result = mergeDeltaIntoLore(lore, delta)
    expect(result.characters).toHaveLength(1)
  })

  it('applies character updates', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter())

    const delta = emptyDelta('EP_002_a')
    delta.character_updates = [{
      character_id: 'char_hero',
      changes: {
        last_appeared_in: 'EP_002_a',
        current_location: 'place_forest',
      },
      transitions: [
        { change: 'learns', description: 'Discovers the ancient prophecy' },
        { change: 'gains', target: 'obj_sword', description: 'Receives sword' },
      ],
    }]

    const result = mergeDeltaIntoLore(lore, delta)

    expect(result.characters[0].last_appeared_in).toBe('EP_002_a')
    expect(result.characters[0].current_location).toBe('place_forest')
    expect(result.characters[0].knowledge).toContain('Discovers the ancient prophecy')
    expect(result.characters[0].possessions).toContain('obj_sword')
    expect(result.characters[0].arc_milestones).toHaveLength(1)
  })

  it('handles character death updates', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter())

    const delta = emptyDelta('EP_005_a')
    delta.character_updates = [{
      character_id: 'char_hero',
      changes: {
        status: 'dead',
        died_in: 'EP_005_a',
        last_appeared_in: 'EP_005_a',
      },
      transitions: [
        { change: 'dies', description: 'Falls in the final battle' },
      ],
    }]

    const result = mergeDeltaIntoLore(lore, delta)

    expect(result.characters[0].status).toBe('dead')
    expect(result.characters[0].died_in).toBe('EP_005_a')
    expect(result.characters[0].arc_milestones).toHaveLength(1)
    expect(result.characters[0].arc_milestones[0].change_type).toBe('dies')
  })

  it('adds introduced places', () => {
    const lore = emptyLore()
    const delta = emptyDelta('EP_001_a')
    delta.places_introduced = [{
      id: 'place_castle',
      name: 'Castle Dread',
      type: 'stronghold',
      description: 'A dark fortress',
      introduced_in: 'EP_001_a',
      last_featured_in: 'EP_001_a',
      status: 'extant',
      events_here: [],
    }]

    const result = mergeDeltaIntoLore(lore, delta)
    expect(result.places).toHaveLength(1)
    expect(result.places[0].name).toBe('Castle Dread')
  })

  it('merges plot threads', () => {
    const lore = emptyLore()
    lore.plot_threads.push({
      id: 'PT_001_mystery',
      title: 'The Missing Artifact',
      description: 'Where is the ancient relic?',
      status: 'open',
      urgency: 'medium',
      introduced_in: 'EP_001_a',
      progressed_in: ['EP_001_a'],
      related_characters: ['char_hero'],
    })

    const delta = emptyDelta('EP_002_a')
    delta.thread_updates = [{
      thread_id: 'PT_001_mystery',
      status_change: 'progressing',
      description: 'A clue is found',
    }]

    const result = mergeDeltaIntoLore(lore, delta)
    expect(result.plot_threads[0].status).toBe('progressing')
    expect(result.plot_threads[0].progressed_in).toContain('EP_002_a')
  })

  it('does not mutate the input lore', () => {
    const lore = emptyLore()
    const delta = emptyDelta('EP_001_a')
    delta.characters_introduced = [makeCharacter()]

    const result = mergeDeltaIntoLore(lore, delta)
    expect(lore.characters).toHaveLength(0)
    expect(result.characters).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// validateLore
// ---------------------------------------------------------------------------

describe('validateLore', () => {
  it('passes for an empty lore', () => {
    const result = validateLore(emptyLore())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when dead character has no died_in', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter({ status: 'dead' }))

    const result = validateLore(lore)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('warns about critical open threads', () => {
    const lore = emptyLore()
    lore.plot_threads.push({
      id: 'PT_001_crisis',
      title: 'The Crisis',
      description: 'Everything is on fire',
      status: 'open',
      urgency: 'critical',
      introduced_in: 'EP_001_a',
      progressed_in: [],
      related_characters: [],
    })

    const result = validateLore(lore)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings.some((w) => w.includes('critical'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateDeltaAgainstLore
// ---------------------------------------------------------------------------

describe('validateDeltaAgainstLore', () => {
  it('fails when updating a dead character without reveal', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter({ status: 'dead', died_in: 'EP_003_a' }))

    const delta = emptyDelta('EP_004_a')
    delta.character_updates = [{
      character_id: 'char_hero',
      changes: { last_appeared_in: 'EP_004_a' },
      transitions: [
        { change: 'learns', description: 'learns something' },
      ],
    }]

    const result = validateDeltaAgainstLore(lore, delta)
    expect(result.valid).toBe(false)
  })

  it('passes when updating a dead character with a reveal', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter({ status: 'dead', died_in: 'EP_003_a' }))

    const delta = emptyDelta('EP_004_a')
    delta.character_updates = [{
      character_id: 'char_hero',
      changes: { status: 'alive', last_appeared_in: 'EP_004_a' },
      transitions: [
        { change: 'reveals', description: 'faked death' },
      ],
    }]

    const result = validateDeltaAgainstLore(lore, delta)
    expect(result.valid).toBe(true)
  })

  it('fails when introducing a character that already exists', () => {
    const lore = emptyLore()
    lore.characters.push(makeCharacter())

    const delta = emptyDelta('EP_002_a')
    delta.characters_introduced = [makeCharacter()]

    const result = validateDeltaAgainstLore(lore, delta)
    expect(result.valid).toBe(false)
  })

  it('fails when reopening a resolved thread', () => {
    const lore = emptyLore()
    lore.plot_threads.push({
      id: 'PT_001_mystery',
      title: 'The Missing Artifact',
      description: 'Resolved mystery',
      status: 'resolved',
      urgency: 'medium',
      introduced_in: 'EP_001_a',
      progressed_in: ['EP_001_a'],
      resolved_in: 'EP_003_a',
      related_characters: [],
    })

    const delta = emptyDelta('EP_005_a')
    delta.thread_updates = [{
      thread_id: 'PT_001_mystery',
      status_change: 'open',
    }]

    const result = validateDeltaAgainstLore(lore, delta)
    expect(result.valid).toBe(false)
  })
})
