/**
 * Item 5.5 — Unit tests for artifact/run/tag repos.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createProject } from '../repository/projectRepo.ts'
import { createStory } from '../repository/storyRepo.ts'
import { createArtifact, getArtifact, listArtifactsByStory, listArtifactsByType, updateArtifact, deleteArtifact } from '../repository/artifactRepo.ts'
import { createRun, getRun, listRunsByStory, updateRun } from '../repository/runRepo.ts'
import { createTag, listTags, assignTag, removeTagAssignment, listTagsForObject, listObjectsWithTag } from '../repository/tagRepo.ts'

let db: Database
let projectId: string
let storyId: string

beforeEach(async () => {
  db = await createTestDb()
  projectId = createProject(db, { project_key: 'art', name: 'Artifact Project' }).project_id
  storyId = createStory(db, { project_id: projectId, story_key: 'as', title: 'Artifact Story' }).story_id
})
afterEach(() => { db.close() })

describe('artifactRepo', () => {
  it('creates and retrieves an artifact', () => {
    const a = createArtifact(db, { story_id: storyId, artifact_type: 'contract', name: 'Story Contract', format: 'json', generator_name: 'contractCompiler' })
    expect(a.artifact_type).toBe('contract')
    expect(a.name).toBe('Story Contract')
    expect(a.status).toBe('draft')
    expect(getArtifact(db, a.artifact_id)).toEqual(a)
  })

  it('lists artifacts by story', () => {
    createArtifact(db, { story_id: storyId, artifact_type: 'contract', name: 'C1' })
    createArtifact(db, { story_id: storyId, artifact_type: 'plan', name: 'P1' })
    expect(listArtifactsByStory(db, storyId)).toHaveLength(2)
  })

  it('lists artifacts by type', () => {
    createArtifact(db, { story_id: storyId, artifact_type: 'contract', name: 'C1' })
    createArtifact(db, { story_id: storyId, artifact_type: 'contract', name: 'C2' })
    createArtifact(db, { story_id: storyId, artifact_type: 'plan', name: 'P1' })
    expect(listArtifactsByType(db, storyId, 'contract')).toHaveLength(2)
    expect(listArtifactsByType(db, storyId, 'plan')).toHaveLength(1)
  })

  it('updates an artifact', () => {
    const a = createArtifact(db, { story_id: storyId, artifact_type: 'draft', name: 'D1' })
    updateArtifact(db, a.artifact_id, { status: 'approved', name: 'D1 Final' })
    const fetched = getArtifact(db, a.artifact_id)!
    expect(fetched.status).toBe('approved')
    expect(fetched.name).toBe('D1 Final')
  })

  it('deletes an artifact', () => {
    const a = createArtifact(db, { story_id: storyId, artifact_type: 'temp', name: 'Tmp' })
    deleteArtifact(db, a.artifact_id)
    expect(getArtifact(db, a.artifact_id)).toBeNull()
  })
})

describe('runRepo', () => {
  it('creates and retrieves a run', () => {
    const r = createRun(db, { project_id: projectId, story_id: storyId, run_type: 'generation', tool_name: 'orchestrator', trigger_source: 'manual' })
    expect(r.run_type).toBe('generation')
    expect(r.status).toBe('running')
    expect(r.finished_at).toBeNull()
    expect(getRun(db, r.run_id)).toEqual(r)
  })

  it('lists runs by story', () => {
    createRun(db, { story_id: storyId, run_type: 'generation' })
    createRun(db, { story_id: storyId, run_type: 'validation' })
    expect(listRunsByStory(db, storyId)).toHaveLength(2)
  })

  it('updates a run', () => {
    const r = createRun(db, { story_id: storyId, run_type: 'generation' })
    const finishedAt = new Date().toISOString()
    updateRun(db, r.run_id, { status: 'completed', finished_at: finishedAt, notes: 'Done' })
    const fetched = getRun(db, r.run_id)!
    expect(fetched.status).toBe('completed')
    expect(fetched.finished_at).toBe(finishedAt)
    expect(fetched.notes).toBe('Done')
  })
})

describe('tagRepo', () => {
  it('creates and lists tags', () => {
    createTag(db, { tag_name: 'important', project_id: projectId, tag_type: 'priority' })
    createTag(db, { tag_name: 'draft', project_id: projectId })
    const tags = listTags(db, projectId)
    expect(tags).toHaveLength(2)
  })

  it('lists tags without project filter', () => {
    createTag(db, { tag_name: 'global' })
    createTag(db, { tag_name: 'scoped', project_id: projectId })
    const all = listTags(db)
    expect(all).toHaveLength(2)
  })

  it('assigns and lists tags for an object', () => {
    const tag = createTag(db, { tag_name: 'reviewed', project_id: projectId })
    assignTag(db, { tag_id: tag.tag_id, object_type: 'story', object_id: storyId })
    const tags = listTagsForObject(db, 'story', storyId)
    expect(tags).toHaveLength(1)
    expect(tags[0].tag_name).toBe('reviewed')
  })

  it('lists objects with a tag', () => {
    const tag = createTag(db, { tag_name: 'flagged' })
    assignTag(db, { tag_id: tag.tag_id, object_type: 'story', object_id: storyId })
    assignTag(db, { tag_id: tag.tag_id, object_type: 'entity', object_id: 'entity-1' })
    const objs = listObjectsWithTag(db, tag.tag_id)
    expect(objs).toHaveLength(2)
  })

  it('removes a tag assignment', () => {
    const tag = createTag(db, { tag_name: 'temp' })
    const assign = assignTag(db, { tag_id: tag.tag_id, object_type: 'story', object_id: storyId })
    removeTagAssignment(db, assign.tag_assignment_id)
    expect(listTagsForObject(db, 'story', storyId)).toHaveLength(0)
  })
})
