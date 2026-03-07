/**
 * Item 3.5 — Unit tests for vocabulary repos (domain/term counts, lookup, usage).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Database } from 'sql.js'
import { createTestDb } from './testDb.ts'
import { createDomain, getDomain, listDomains, createTerm, getTermByKey, listTermsByDomain, recordTermUsage, listUsagesForTerm, listUsagesForObject, listTermsUsedInStory } from '../repository/vocabularyRepo.ts'
import { createProject } from '../repository/projectRepo.ts'
import { createStory } from '../repository/storyRepo.ts'
import { createEntity } from '../repository/entityRepo.ts'

let db: Database

beforeEach(async () => { db = await createTestDb() })
afterEach(() => { db.close() })

describe('vocabularyRepo — domains', () => {
  it('creates and retrieves a domain', () => {
    const d = createDomain(db, { domain_id: 'character_role', name: 'Character Role', description: 'Roles for characters', source_file: 'roles.json' })
    expect(d.domain_id).toBe('character_role')
    expect(d.name).toBe('Character Role')
    expect(getDomain(db, 'character_role')).toEqual(d)
  })

  it('lists all domains', () => {
    createDomain(db, { domain_id: 'a_domain', name: 'A' })
    createDomain(db, { domain_id: 'b_domain', name: 'B' })
    const list = listDomains(db)
    expect(list).toHaveLength(2)
    expect(list[0].domain_id).toBe('a_domain')
  })

  it('returns null for nonexistent domain', () => {
    expect(getDomain(db, 'nope')).toBeNull()
  })
})

describe('vocabularyRepo — terms', () => {
  beforeEach(() => {
    createDomain(db, { domain_id: 'edge_meaning', name: 'Edge Meaning' })
  })

  it('creates and looks up a term by key', () => {
    const t = createTerm(db, { domain_id: 'edge_meaning', term_key: 'causal', label: 'Causal', definition: 'Cause and effect' })
    expect(t.term_key).toBe('causal')
    expect(t.label).toBe('Causal')
    const fetched = getTermByKey(db, 'edge_meaning', 'causal')
    expect(fetched).toEqual(t)
  })

  it('lists terms by domain', () => {
    createTerm(db, { domain_id: 'edge_meaning', term_key: 'temporal', label: 'Temporal' })
    createTerm(db, { domain_id: 'edge_meaning', term_key: 'causal', label: 'Causal' })
    const terms = listTermsByDomain(db, 'edge_meaning')
    expect(terms).toHaveLength(2)
  })

  it('returns null for nonexistent term key', () => {
    expect(getTermByKey(db, 'edge_meaning', 'unknown')).toBeNull()
  })
})

describe('vocabularyRepo — term usage', () => {
  let storyId: string
  let entityId: string
  let termId: string

  beforeEach(() => {
    const proj = createProject(db, { project_key: 'vp', name: 'Vocab Project' })
    storyId = createStory(db, { project_id: proj.project_id, story_key: 'vs', title: 'Vocab Story' }).story_id
    entityId = createEntity(db, { story_id: storyId, entity_type: 'character', name: 'Hero' }).entity_id
    createDomain(db, { domain_id: 'char_role', name: 'Character Role' })
    termId = createTerm(db, { domain_id: 'char_role', term_key: 'protagonist', label: 'Protagonist' }).term_id
  })

  it('records and lists usages for a term', () => {
    const u = recordTermUsage(db, { term_id: termId, object_type: 'entity', object_id: entityId, usage_role: 'assigned', story_id: storyId })
    expect(u.term_id).toBe(termId)
    const usages = listUsagesForTerm(db, termId)
    expect(usages).toHaveLength(1)
    expect(usages[0].object_id).toBe(entityId)
  })

  it('lists usages for an object', () => {
    recordTermUsage(db, { term_id: termId, object_type: 'entity', object_id: entityId, story_id: storyId })
    const usages = listUsagesForObject(db, 'entity', entityId)
    expect(usages).toHaveLength(1)
  })

  it('lists terms used in a story with counts', () => {
    recordTermUsage(db, { term_id: termId, object_type: 'entity', object_id: entityId, story_id: storyId })
    recordTermUsage(db, { term_id: termId, object_type: 'entity', object_id: entityId, story_id: storyId })
    const terms = listTermsUsedInStory(db, storyId)
    expect(terms).toHaveLength(1)
    expect(terms[0].usage_count).toBe(2)
  })
})
