/**
 * Item 7.5 — Test import with realistic StoryInstance fixture.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createProject } from '../repository/projectRepo.ts'
import { importStoryInstance } from '../import/instanceImporter.ts'
import { listEntitiesByStory, listEntitiesByType } from '../repository/entityRepo.ts'
import { listRelationshipsByStory } from '../repository/relationshipRepo.ts'
import { listScenesByStory } from '../repository/sceneRepo.ts'
import { createDomain, createTerm } from '../repository/vocabularyRepo.ts'
import type { StoryInstance } from '../../instance/types.ts'

let db: Database
let projectId: string

function makeFixture(): StoryInstance {
  return {
    metadata: {
      instance_id: 'test-instance-1',
      title: 'The Last Guardian',
      description: 'A fantasy tale of a reluctant hero',
      archetype_id: '01_heros_journey',
      genre_id: '01_fantasy',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    },
    lore: {
      characters: [
        {
          id: 'char_1', name: 'Arin', description: 'A young guardian', role: 'protagonist',
          status: 'alive', aliases: ['The Last'], traits: ['brave', 'stubborn'],
          motivations: ['protect the realm'], arc_type: 'transformation',
          relationships: [
            { target_id: 'char_2', type: 'ally', description: 'Trusted friend', current_state: 'active', established_in: 'ep_1', evolved_in: [] },
          ],
          knowledge: [], possessions: [], arc_milestones: [],
        },
        {
          id: 'char_2', name: 'Mirka', description: 'A wandering mage', role: 'mentor',
          status: 'alive', aliases: [], traits: ['wise'],
          motivations: ['pass on knowledge'], arc_type: 'flat',
          relationships: [],
          knowledge: [], possessions: [], arc_milestones: [],
        },
      ],
      places: [
        {
          id: 'place_1', name: 'Ironhold', description: 'A fortress city', type: 'settlement',
          status: 'active', aliases: [], rules: [], atmosphere: 'grim',
          connections: [], events_here: [],
        },
      ],
      objects: [
        {
          id: 'obj_1', name: 'Starfall Blade', description: 'Legendary sword', type: 'weapon',
          status: 'active', aliases: [], significance: 'Key to the quest',
          rules: [], current_holder: 'char_1', custody_history: [],
        },
      ],
      factions: [
        {
          id: 'fac_1', name: 'The Order', description: 'Ancient protectors', type: 'organization',
          status: 'active', aliases: [], goals: ['preserve balance'],
          members: ['char_1'], relationships: [],
        },
      ],
      plot_threads: [
        {
          id: 'thread_1', title: 'The Rising Dark', description: 'An ancient evil stirs',
          status: 'active', urgency: 'high',
          related_characters: ['char_1'], related_places: ['place_1'], related_objects: ['obj_1'],
          resolution_conditions: ['Defeat the shadow'], anti_patterns: [],
        },
      ],
      world_rules: [
        { id: 'rule_1', rule: 'Magic requires a spoken incantation', source: 'world bible' },
      ],
      event_log: [
        {
          event_id: 'evt_1', episode_id: 'ep_1', description: 'Arin discovers the Starfall Blade',
          participants: ['char_1'], consequences: ['char_1 gains the blade'],
        },
        {
          event_id: 'evt_2', episode_id: 'ep_1', description: 'Mirka begins training Arin',
          participants: ['char_1', 'char_2'], consequences: ['training begins'],
        },
      ],
    },
  } as unknown as StoryInstance
}

beforeEach(async () => {
  db = await createTestDb()
  projectId = createProject(db, { project_key: 'imp', name: 'Import Project' }).project_id

  // Pre-populate vocabulary so term linkage works
  createDomain(db, { domain_id: 'character_role', name: 'Character Role' })
  createTerm(db, { domain_id: 'character_role', term_key: 'protagonist', label: 'Protagonist' })
  createTerm(db, { domain_id: 'character_role', term_key: 'mentor', label: 'Mentor' })
  createDomain(db, { domain_id: 'place_type', name: 'Place Type' })
  createTerm(db, { domain_id: 'place_type', term_key: 'settlement', label: 'Settlement' })
  createDomain(db, { domain_id: 'object_type', name: 'Object Type' })
  createTerm(db, { domain_id: 'object_type', term_key: 'weapon', label: 'Weapon' })
  createDomain(db, { domain_id: 'relationship_type', name: 'Relationship Type' })
  createTerm(db, { domain_id: 'relationship_type', term_key: 'ally', label: 'Ally' })
})
afterEach(() => { db.close() })

describe('instanceImporter', () => {
  it('imports a full StoryInstance fixture', () => {
    const result = importStoryInstance(db, makeFixture(), projectId)

    expect(result.storyId).toBeTruthy()
    // 2 characters + 1 place + 1 object + 1 faction + 1 thread + 1 rule = 7
    expect(result.entities).toBe(7)
    expect(result.relationships).toBe(1)
    // 2 events
    expect(result.scenes).toBe(2)
    // protagonist + mentor + settlement + weapon + ally = 5
    expect(result.termUsages).toBe(5)
  })

  it('creates correct entity types', () => {
    const result = importStoryInstance(db, makeFixture(), projectId)
    const entities = listEntitiesByStory(db, result.storyId)
    expect(entities).toHaveLength(7)

    const chars = listEntitiesByType(db, result.storyId, 'character')
    expect(chars).toHaveLength(2)
    expect(chars.map(c => c.name).sort()).toEqual(['Arin', 'Mirka'])

    const locations = listEntitiesByType(db, result.storyId, 'location')
    expect(locations).toHaveLength(1)
    expect(locations[0].name).toBe('Ironhold')

    const items = listEntitiesByType(db, result.storyId, 'item')
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Starfall Blade')
  })

  it('creates relationships from character data', () => {
    const result = importStoryInstance(db, makeFixture(), projectId)
    const rels = listRelationshipsByStory(db, result.storyId)
    expect(rels).toHaveLength(1)
    expect(rels[0].relationship_type).toBe('ally')
  })

  it('creates scenes from event log', () => {
    const result = importStoryInstance(db, makeFixture(), projectId)
    const scenes = listScenesByStory(db, result.storyId)
    expect(scenes).toHaveLength(2)
    expect(scenes[0].timeline_order).toBe(0)
    expect(scenes[1].timeline_order).toBe(1)
  })
})
