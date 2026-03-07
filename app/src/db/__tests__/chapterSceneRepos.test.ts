/**
 * Item 4.5 — Unit tests for chapter/scene/scene-entity repos.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createProject } from '../repository/projectRepo.ts'
import { createStory } from '../repository/storyRepo.ts'
import { createEntity } from '../repository/entityRepo.ts'
import { createChapter, getChapter, listChaptersByStory, getChapterWithSceneCount, updateChapter, deleteChapter } from '../repository/chapterRepo.ts'
import { createScene, getScene, listScenesByChapter, listScenesByStory, countScenesByChapter, updateScene, deleteScene } from '../repository/sceneRepo.ts'
import { addEntityToScene, removeEntityFromScene, listEntitiesInScene, listScenesForEntity } from '../repository/sceneEntityRepo.ts'

let db: Database
let storyId: string

beforeEach(async () => {
  db = await createTestDb()
  const proj = createProject(db, { project_key: 'cs', name: 'Chapter Scene Project' })
  storyId = createStory(db, { project_id: proj.project_id, story_key: 'css', title: 'CS Story' }).story_id
})
afterEach(() => { db.close() })

describe('chapterRepo', () => {
  it('creates and retrieves a chapter', () => {
    const ch = createChapter(db, { story_id: storyId, chapter_number: 1, title: 'The Beginning', summary: 'It starts' })
    expect(ch.chapter_number).toBe(1)
    expect(ch.title).toBe('The Beginning')
    expect(ch.status).toBe('draft')
    expect(getChapter(db, ch.chapter_id)).toEqual(ch)
  })

  it('lists chapters by story ordered by chapter_number', () => {
    createChapter(db, { story_id: storyId, chapter_number: 2, title: 'Second' })
    createChapter(db, { story_id: storyId, chapter_number: 1, title: 'First' })
    const list = listChaptersByStory(db, storyId)
    expect(list).toHaveLength(2)
    expect(list[0].title).toBe('First')
    expect(list[1].title).toBe('Second')
  })

  it('gets chapter with scene count', () => {
    const ch = createChapter(db, { story_id: storyId, chapter_number: 1, title: 'Ch1' })
    createScene(db, { story_id: storyId, chapter_id: ch.chapter_id, scene_number: 1, title: 'S1' })
    createScene(db, { story_id: storyId, chapter_id: ch.chapter_id, scene_number: 2, title: 'S2' })
    const result = getChapterWithSceneCount(db, ch.chapter_id)!
    expect(result.scene_count).toBe(2)
    expect(result.title).toBe('Ch1')
  })

  it('updates a chapter', () => {
    const ch = createChapter(db, { story_id: storyId, chapter_number: 1, title: 'Old' })
    updateChapter(db, ch.chapter_id, { title: 'New', status: 'approved' })
    const fetched = getChapter(db, ch.chapter_id)!
    expect(fetched.title).toBe('New')
    expect(fetched.status).toBe('approved')
  })

  it('deletes a chapter', () => {
    const ch = createChapter(db, { story_id: storyId, chapter_number: 1, title: 'Gone' })
    deleteChapter(db, ch.chapter_id)
    expect(getChapter(db, ch.chapter_id)).toBeNull()
  })
})

describe('sceneRepo', () => {
  it('creates and retrieves a scene', () => {
    const s = createScene(db, { story_id: storyId, title: 'Opening', scene_type: 'action', timeline_order: 1, archetype_node_id: 'HJ_N01' })
    expect(s.title).toBe('Opening')
    expect(s.scene_type).toBe('action')
    expect(s.archetype_node_id).toBe('HJ_N01')
    expect(getScene(db, s.scene_id)).toEqual(s)
  })

  it('lists scenes by chapter', () => {
    const ch = createChapter(db, { story_id: storyId, chapter_number: 1 })
    createScene(db, { story_id: storyId, chapter_id: ch.chapter_id, scene_number: 2, title: 'Second' })
    createScene(db, { story_id: storyId, chapter_id: ch.chapter_id, scene_number: 1, title: 'First' })
    const scenes = listScenesByChapter(db, ch.chapter_id)
    expect(scenes).toHaveLength(2)
    expect(scenes[0].title).toBe('First')
  })

  it('lists scenes by story', () => {
    createScene(db, { story_id: storyId, title: 'A', timeline_order: 2 })
    createScene(db, { story_id: storyId, title: 'B', timeline_order: 1 })
    const scenes = listScenesByStory(db, storyId)
    expect(scenes).toHaveLength(2)
    expect(scenes[0].title).toBe('B')
  })

  it('counts scenes by chapter', () => {
    const ch1 = createChapter(db, { story_id: storyId, chapter_number: 1 })
    const ch2 = createChapter(db, { story_id: storyId, chapter_number: 2 })
    createScene(db, { story_id: storyId, chapter_id: ch1.chapter_id, scene_number: 1 })
    createScene(db, { story_id: storyId, chapter_id: ch1.chapter_id, scene_number: 2 })
    createScene(db, { story_id: storyId, chapter_id: ch2.chapter_id, scene_number: 1 })
    const counts = countScenesByChapter(db, storyId)
    expect(counts).toHaveLength(2)
    const ch1Count = counts.find(c => c.chapter_id === ch1.chapter_id)
    expect(ch1Count?.count).toBe(2)
  })

  it('updates a scene', () => {
    const s = createScene(db, { story_id: storyId, title: 'Old' })
    updateScene(db, s.scene_id, { title: 'New', status: 'approved' })
    const fetched = getScene(db, s.scene_id)!
    expect(fetched.title).toBe('New')
    expect(fetched.status).toBe('approved')
  })

  it('deletes a scene', () => {
    const s = createScene(db, { story_id: storyId, title: 'Gone' })
    deleteScene(db, s.scene_id)
    expect(getScene(db, s.scene_id)).toBeNull()
  })
})

describe('sceneEntityRepo', () => {
  let sceneId: string
  let entityId: string

  beforeEach(() => {
    sceneId = createScene(db, { story_id: storyId, title: 'Test Scene' }).scene_id
    entityId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Hero' }).entity_id
  })

  it('adds and lists entities in a scene', () => {
    const se = addEntityToScene(db, { scene_id: sceneId, entity_id: entityId, participation_role: 'pov' })
    expect(se.participation_role).toBe('pov')
    const inScene = listEntitiesInScene(db, sceneId)
    expect(inScene).toHaveLength(1)
    expect(inScene[0].entity_id).toBe(entityId)
  })

  it('lists scenes for an entity', () => {
    addEntityToScene(db, { scene_id: sceneId, entity_id: entityId })
    const scenes = listScenesForEntity(db, entityId)
    expect(scenes).toHaveLength(1)
    expect(scenes[0].scene_id).toBe(sceneId)
  })

  it('removes an entity from a scene', () => {
    const se = addEntityToScene(db, { scene_id: sceneId, entity_id: entityId })
    removeEntityFromScene(db, se.scene_entity_id)
    expect(listEntitiesInScene(db, sceneId)).toHaveLength(0)
  })
})
