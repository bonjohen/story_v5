/**
 * Item 2.7 — Unit tests for core repos (project, story, entity, relationship).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createProject, getProject, listProjects, updateProject, deleteProject } from '../repository/projectRepo.ts'
import { createStory, getStory, listStoriesByProject, updateStory, deleteStory } from '../repository/storyRepo.ts'
import { createEntity, getEntity, listEntitiesByStory, listEntitiesByType, updateEntity, deleteEntity } from '../repository/entityRepo.ts'
import { createRelationship, getRelationship, listRelationshipsForEntity, listRelationshipsByStory, deleteRelationship } from '../repository/relationshipRepo.ts'

let db: Database

beforeEach(async () => { db = await createTestDb() })
afterEach(() => { db.close() })

describe('projectRepo', () => {
  it('creates and retrieves a project', () => {
    const p = createProject(db, { project_key: 'test-proj', name: 'Test Project', description: 'A test' })
    expect(p.project_key).toBe('test-proj')
    expect(p.name).toBe('Test Project')
    expect(p.description).toBe('A test')
    expect(p.status).toBe('active')
    expect(p.project_id).toBeTruthy()

    const fetched = getProject(db, p.project_id)
    expect(fetched).toEqual(p)
  })

  it('lists projects ordered by created_at', () => {
    createProject(db, { project_key: 'p1', name: 'First' })
    createProject(db, { project_key: 'p2', name: 'Second' })
    const list = listProjects(db)
    expect(list).toHaveLength(2)
    expect(list[0].name).toBe('First')
    expect(list[1].name).toBe('Second')
  })

  it('updates a project', () => {
    const p = createProject(db, { project_key: 'upd', name: 'Before' })
    updateProject(db, p.project_id, { name: 'After', description: 'Updated' })
    const fetched = getProject(db, p.project_id)!
    expect(fetched.name).toBe('After')
    expect(fetched.description).toBe('Updated')
    expect(fetched.updated_at).not.toBe(p.updated_at)
  })

  it('deletes a project', () => {
    const p = createProject(db, { project_key: 'del', name: 'Delete Me' })
    deleteProject(db, p.project_id)
    expect(getProject(db, p.project_id)).toBeNull()
  })

  it('returns null for nonexistent project', () => {
    expect(getProject(db, 'nonexistent')).toBeNull()
  })
})

describe('storyRepo', () => {
  let projectId: string

  beforeEach(() => {
    projectId = createProject(db, { project_key: 'sp', name: 'Story Project' }).project_id
  })

  it('creates and retrieves a story', () => {
    const s = createStory(db, { project_id: projectId, story_key: 'story-1', title: 'My Story', summary: 'A tale', archetype_id: 'hero', genre_id: 'fantasy' })
    expect(s.title).toBe('My Story')
    expect(s.status).toBe('draft')
    expect(s.archetype_id).toBe('hero')
    expect(getStory(db, s.story_id)).toEqual(s)
  })

  it('lists stories by project', () => {
    createStory(db, { project_id: projectId, story_key: 's1', title: 'First' })
    createStory(db, { project_id: projectId, story_key: 's2', title: 'Second' })
    expect(listStoriesByProject(db, projectId)).toHaveLength(2)
  })

  it('updates a story', () => {
    const s = createStory(db, { project_id: projectId, story_key: 'su', title: 'Old' })
    updateStory(db, s.story_id, { title: 'New', status: 'active' })
    const fetched = getStory(db, s.story_id)!
    expect(fetched.title).toBe('New')
    expect(fetched.status).toBe('active')
  })

  it('deletes a story', () => {
    const s = createStory(db, { project_id: projectId, story_key: 'sd', title: 'Gone' })
    deleteStory(db, s.story_id)
    expect(getStory(db, s.story_id)).toBeNull()
  })
})

describe('entityRepo', () => {
  let storyId: string

  beforeEach(() => {
    const proj = createProject(db, { project_key: 'ep', name: 'Entity Project' })
    storyId = createStory(db, { project_id: proj.project_id, story_key: 'es', title: 'Entity Story' }).story_id
  })

  it('creates and retrieves an entity', () => {
    const e = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Alice', short_description: 'The hero', role_label: 'protagonist' })
    expect(e.name).toBe('Alice')
    expect(e.entity_type).toBe('character')
    expect(e.role_label).toBe('protagonist')
    expect(getEntity(db, e.entity_id)).toEqual(e)
  })

  it('lists entities by story', () => {
    createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Bob' })
    createEntity(db, { story_id: storyId, entity_type: 'location', name: 'Castle' })
    expect(listEntitiesByStory(db, storyId)).toHaveLength(2)
  })

  it('lists entities by type', () => {
    createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Charlie' })
    createEntity(db, { story_id: storyId, entity_type: 'location', name: 'Forest' })
    createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Dana' })
    expect(listEntitiesByType(db, storyId, 'character')).toHaveLength(2)
    expect(listEntitiesByType(db, storyId, 'location')).toHaveLength(1)
  })

  it('updates an entity', () => {
    const e = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Eve' })
    updateEntity(db, e.entity_id, { name: 'Eve Updated', status: 'archived' })
    const fetched = getEntity(db, e.entity_id)!
    expect(fetched.name).toBe('Eve Updated')
    expect(fetched.status).toBe('archived')
  })

  it('deletes an entity', () => {
    const e = createEntity(db, { story_id: storyId, entity_type: 'item', name: 'Sword' })
    deleteEntity(db, e.entity_id)
    expect(getEntity(db, e.entity_id)).toBeNull()
  })
})

describe('relationshipRepo', () => {
  let storyId: string
  let aliceId: string
  let bobId: string

  beforeEach(() => {
    const proj = createProject(db, { project_key: 'rp', name: 'Rel Project' })
    storyId = createStory(db, { project_id: proj.project_id, story_key: 'rs', title: 'Rel Story' }).story_id
    aliceId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Alice' }).entity_id
    bobId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Bob' }).entity_id
  })

  it('creates and retrieves a relationship', () => {
    const r = createRelationship(db, { story_id: storyId, from_entity_id: aliceId, to_entity_id: bobId, relationship_type: 'ally', strength_value: 0.8 })
    expect(r.relationship_type).toBe('ally')
    expect(r.strength_value).toBe(0.8)
    expect(getRelationship(db, r.relationship_id)).toEqual(r)
  })

  it('lists relationships for entity', () => {
    createRelationship(db, { story_id: storyId, from_entity_id: aliceId, to_entity_id: bobId, relationship_type: 'ally' })
    const aliceRels = listRelationshipsForEntity(db, aliceId)
    const bobRels = listRelationshipsForEntity(db, bobId)
    expect(aliceRels).toHaveLength(1)
    expect(bobRels).toHaveLength(1)
  })

  it('lists relationships by story', () => {
    createRelationship(db, { story_id: storyId, from_entity_id: aliceId, to_entity_id: bobId, relationship_type: 'rival' })
    expect(listRelationshipsByStory(db, storyId)).toHaveLength(1)
  })

  it('deletes a relationship', () => {
    const r = createRelationship(db, { story_id: storyId, from_entity_id: aliceId, to_entity_id: bobId, relationship_type: 'temp' })
    deleteRelationship(db, r.relationship_id)
    expect(getRelationship(db, r.relationship_id)).toBeNull()
  })
})
