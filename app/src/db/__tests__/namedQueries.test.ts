/**
 * Item 6.3 — Test each named query against populated in-memory DB.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createProject } from '../repository/projectRepo.ts'
import { createStory } from '../repository/storyRepo.ts'
import { createEntity } from '../repository/entityRepo.ts'
import { createRelationship } from '../repository/relationshipRepo.ts'
import { createChapter } from '../repository/chapterRepo.ts'
import { createScene } from '../repository/sceneRepo.ts'
import { addEntityToScene } from '../repository/sceneEntityRepo.ts'
import { createArtifact } from '../repository/artifactRepo.ts'
import { createRun } from '../repository/runRepo.ts'
import { createTag, assignTag } from '../repository/tagRepo.ts'
import { createDomain, createTerm, recordTermUsage } from '../repository/vocabularyRepo.ts'
import {
  listStoriesInProject,
  listCharactersInStory,
  listScenesInChapterOrder,
  listScenesForCharacter,
  findUnresolvedArtifacts,
  listGenerationRuns,
  findScenesByArchetypeNode,
  findArtifactsByChapter,
  listObjectsWithTagName,
  findRelationshipsForEntity,
  listVocabTermsUsedInStory,
  findEntitiesByVocabTerm,
  vocabCoverageReport,
} from '../queries.ts'

let db: Database
let projectId: string
let storyId: string
let heroId: string
let villainId: string
let ch1Id: string
let scene1Id: string

beforeEach(async () => {
  db = await createTestDb()

  // Scaffold a populated DB
  projectId = createProject(db, { project_key: 'qp', name: 'Query Project' }).project_id
  storyId = createStory(db, { project_id: projectId, story_key: 'qs', title: 'Query Story', archetype_id: 'hero_journey' }).story_id

  heroId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Hero', role_label: 'protagonist' }).entity_id
  villainId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Villain', role_label: 'antagonist' }).entity_id
  createEntity(db, { story_id: storyId, entity_type: 'location', name: 'Castle' })

  createRelationship(db, { story_id: storyId, from_entity_id: heroId, to_entity_id: villainId, relationship_type: 'rival' })

  ch1Id = createChapter(db, { story_id: storyId, chapter_number: 1, title: 'Chapter 1' }).chapter_id
  const ch2Id = createChapter(db, { story_id: storyId, chapter_number: 2, title: 'Chapter 2' }).chapter_id

  scene1Id = createScene(db, { story_id: storyId, chapter_id: ch1Id, scene_number: 1, title: 'Opening', archetype_node_id: 'HJ_N01', timeline_order: 1 }).scene_id
  createScene(db, { story_id: storyId, chapter_id: ch1Id, scene_number: 2, title: 'Conflict', archetype_node_id: 'HJ_N02', timeline_order: 2 })
  createScene(db, { story_id: storyId, chapter_id: ch2Id, scene_number: 1, title: 'Resolution', archetype_node_id: 'HJ_N01', timeline_order: 3 })

  addEntityToScene(db, { scene_id: scene1Id, entity_id: heroId, participation_role: 'pov' })

  createArtifact(db, { story_id: storyId, artifact_type: 'contract', name: 'Contract', status: 'approved' })
  createArtifact(db, { story_id: storyId, chapter_id: ch1Id, artifact_type: 'draft', name: 'Ch1 Draft', status: 'draft' })
  createArtifact(db, { story_id: storyId, artifact_type: 'plan', name: 'Plan', status: 'generated' })

  createRun(db, { project_id: projectId, story_id: storyId, run_type: 'generation', status: 'completed' })

  const tag = createTag(db, { tag_name: 'reviewed', project_id: projectId })
  assignTag(db, { tag_id: tag.tag_id, object_type: 'story', object_id: storyId })

  // Vocabulary
  createDomain(db, { domain_id: 'char_role', name: 'Character Role' })
  const term = createTerm(db, { domain_id: 'char_role', term_key: 'protagonist', label: 'Protagonist' })
  recordTermUsage(db, { term_id: term.term_id, object_type: 'entity', object_id: heroId, usage_role: 'assigned', story_id: storyId })
})
afterEach(() => { db.close() })

describe('named queries', () => {
  it('1. listStoriesInProject', () => {
    const stories = listStoriesInProject(db, projectId)
    expect(stories).toHaveLength(1)
    expect(stories[0].title).toBe('Query Story')
  })

  it('2. listCharactersInStory', () => {
    const chars = listCharactersInStory(db, storyId)
    expect(chars).toHaveLength(2)
    expect(chars.map(c => c.name).sort()).toEqual(['Hero', 'Villain'])
  })

  it('3. listScenesInChapterOrder', () => {
    const scenes = listScenesInChapterOrder(db, storyId)
    expect(scenes).toHaveLength(3)
    expect(scenes[0].chapter_number).toBe(1)
    expect(scenes[0].title).toBe('Opening')
    expect(scenes[2].chapter_number).toBe(2)
  })

  it('4. listScenesForCharacter', () => {
    const scenes = listScenesForCharacter(db, heroId)
    expect(scenes).toHaveLength(1)
    expect(scenes[0].title).toBe('Opening')
    expect(scenes[0].participation_role).toBe('pov')
  })

  it('5. findUnresolvedArtifacts', () => {
    const artifacts = findUnresolvedArtifacts(db, storyId)
    expect(artifacts).toHaveLength(2)
    expect(artifacts.map(a => a.name).sort()).toEqual(['Ch1 Draft', 'Plan'])
  })

  it('6. listGenerationRuns', () => {
    const runs = listGenerationRuns(db, storyId)
    expect(runs).toHaveLength(1)
    expect(runs[0].status).toBe('completed')
  })

  it('7. findScenesByArchetypeNode', () => {
    const scenes = findScenesByArchetypeNode(db, storyId, 'HJ_N01')
    expect(scenes).toHaveLength(2)
  })

  it('8. findArtifactsByChapter', () => {
    const artifacts = findArtifactsByChapter(db, ch1Id)
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0].name).toBe('Ch1 Draft')
  })

  it('9. listObjectsWithTagName', () => {
    const objects = listObjectsWithTagName(db, 'reviewed')
    expect(objects).toHaveLength(1)
    expect(objects[0].object_type).toBe('story')
    expect(objects[0].object_id).toBe(storyId)
  })

  it('10. findRelationshipsForEntity', () => {
    const rels = findRelationshipsForEntity(db, heroId)
    expect(rels).toHaveLength(1)
    expect(rels[0].from_name).toBe('Hero')
    expect(rels[0].to_name).toBe('Villain')
    expect(rels[0].relationship_type).toBe('rival')
  })

  it('11. listVocabTermsUsedInStory', () => {
    const terms = listVocabTermsUsedInStory(db, storyId)
    expect(terms).toHaveLength(1)
    expect(terms[0].term_key).toBe('protagonist')
    expect(terms[0].usage_count).toBe(1)
  })

  it('12. findEntitiesByVocabTerm', () => {
    const entities = findEntitiesByVocabTerm(db, 'char_role', 'protagonist')
    expect(entities).toHaveLength(1)
    expect(entities[0].name).toBe('Hero')
    expect(entities[0].usage_role).toBe('assigned')
  })

  it('13. vocabCoverageReport', () => {
    const report = vocabCoverageReport(db, storyId)
    expect(report).toHaveLength(1)
    expect(report[0].domain_name).toBe('Character Role')
    expect(report[0].total_terms).toBe(1)
    expect(report[0].used_terms).toBe(1)
  })
})
