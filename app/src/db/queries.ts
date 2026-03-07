/**
 * Named query functions for the design doc use cases + vocabulary queries.
 */

import type { Database } from 'sql.js'
import type { StoryRow, EntityRow, SceneRow, ArtifactRow, RunRow, RelationshipRow } from './types.ts'

function rowsTo<T>(result: ReturnType<Database['exec']>): T[] {
  if (!result.length) return []
  return result[0].values.map((v) => {
    const row: Record<string, unknown> = {}
    result[0].columns.forEach((col, i) => { row[col] = v[i] })
    return row as T
  })
}

/** 1. List all stories in a project */
export function listStoriesInProject(db: Database, projectId: string): StoryRow[] {
  return rowsTo<StoryRow>(db.exec(
    'SELECT * FROM stories WHERE project_id = ? ORDER BY created_at', [projectId],
  ))
}

/** 2. List all characters in a story */
export function listCharactersInStory(db: Database, storyId: string): EntityRow[] {
  return rowsTo<EntityRow>(db.exec(
    "SELECT * FROM entities WHERE story_id = ? AND entity_type = 'character' ORDER BY sort_order, name",
    [storyId],
  ))
}

/** 3. List all scenes in chapter order (many scenes per chapter) */
export function listScenesInChapterOrder(db: Database, storyId: string): Array<SceneRow & { chapter_title: string | null; chapter_number: number | null }> {
  const result = db.exec(
    `SELECT s.*, c.title as chapter_title, c.chapter_number
     FROM scenes s
     LEFT JOIN chapters c ON s.chapter_id = c.chapter_id
     WHERE s.story_id = ?
     ORDER BY c.chapter_number, s.scene_number`,
    [storyId],
  )
  return rowsTo(result)
}

/** 4. List all scenes involving a specific character */
export function listScenesForCharacter(db: Database, entityId: string): Array<SceneRow & { participation_role: string | null }> {
  const result = db.exec(
    `SELECT s.*, se.participation_role
     FROM scenes s
     JOIN scene_entities se ON se.scene_id = s.scene_id
     WHERE se.entity_id = ?
     ORDER BY s.timeline_order, s.scene_number`,
    [entityId],
  )
  return rowsTo(result)
}

/** 5. Find all unresolved artifacts */
export function findUnresolvedArtifacts(db: Database, storyId: string): ArtifactRow[] {
  return rowsTo<ArtifactRow>(db.exec(
    "SELECT * FROM artifacts WHERE story_id = ? AND status IN ('draft', 'generated') ORDER BY created_at",
    [storyId],
  ))
}

/** 6. List all generation runs for a story */
export function listGenerationRuns(db: Database, storyId: string): RunRow[] {
  return rowsTo<RunRow>(db.exec(
    'SELECT * FROM runs WHERE story_id = ? ORDER BY started_at DESC', [storyId],
  ))
}

/** 7. Find all scenes mapped to a specific archetype node */
export function findScenesByArchetypeNode(db: Database, storyId: string, archetypeNodeId: string): SceneRow[] {
  return rowsTo<SceneRow>(db.exec(
    'SELECT * FROM scenes WHERE story_id = ? AND archetype_node_id = ? ORDER BY timeline_order',
    [storyId, archetypeNodeId],
  ))
}

/** 8. Find all artifacts related to a chapter */
export function findArtifactsByChapter(db: Database, chapterId: string): ArtifactRow[] {
  return rowsTo<ArtifactRow>(db.exec(
    'SELECT * FROM artifacts WHERE chapter_id = ? ORDER BY created_at', [chapterId],
  ))
}

/** 9. List all tagged objects with a specific tag name */
export function listObjectsWithTagName(db: Database, tagName: string): Array<{ object_type: string; object_id: string; tag_name: string }> {
  const result = db.exec(
    `SELECT ta.object_type, ta.object_id, t.tag_name
     FROM tag_assignments ta
     JOIN tags t ON ta.tag_id = t.tag_id
     WHERE t.tag_name = ?
     ORDER BY ta.object_type, ta.created_at`,
    [tagName],
  )
  return rowsTo(result)
}

/** 10. Find all relationships for a given entity */
export function findRelationshipsForEntity(db: Database, entityId: string): Array<RelationshipRow & { from_name: string; to_name: string }> {
  const result = db.exec(
    `SELECT r.*, e1.name as from_name, e2.name as to_name
     FROM entity_relationships r
     JOIN entities e1 ON r.from_entity_id = e1.entity_id
     JOIN entities e2 ON r.to_entity_id = e2.entity_id
     WHERE r.from_entity_id = ? OR r.to_entity_id = ?
     ORDER BY r.relationship_type`,
    [entityId, entityId],
  )
  return rowsTo(result)
}

/** 11. List vocabulary terms used in a story */
export function listVocabTermsUsedInStory(db: Database, storyId: string): Array<{
  term_id: string; domain_id: string; term_key: string; label: string; usage_count: number
}> {
  const result = db.exec(
    `SELECT vt.term_id, vt.domain_id, vt.term_key, vt.label, COUNT(tu.usage_id) as usage_count
     FROM term_usage tu
     JOIN vocabulary_terms vt ON tu.term_id = vt.term_id
     WHERE tu.story_id = ?
     GROUP BY vt.term_id
     ORDER BY vt.domain_id, vt.term_key`,
    [storyId],
  )
  return rowsTo(result)
}

/** 12. Find entities by vocabulary term (e.g. all characters with role 'mentor') */
export function findEntitiesByVocabTerm(db: Database, domainId: string, termKey: string): Array<EntityRow & { usage_role: string | null }> {
  const result = db.exec(
    `SELECT e.*, tu.usage_role
     FROM term_usage tu
     JOIN vocabulary_terms vt ON tu.term_id = vt.term_id
     JOIN entities e ON tu.object_id = e.entity_id AND tu.object_type = 'entity'
     WHERE vt.domain_id = ? AND vt.term_key = ?
     ORDER BY e.name`,
    [domainId, termKey],
  )
  return rowsTo(result)
}

/** 13. Vocabulary coverage report for a story */
export function vocabCoverageReport(db: Database, storyId: string): Array<{
  domain_id: string; domain_name: string; total_terms: number; used_terms: number
}> {
  const result = db.exec(
    `SELECT
       vd.domain_id,
       vd.name as domain_name,
       COUNT(DISTINCT vt.term_id) as total_terms,
       COUNT(DISTINCT tu.term_id) as used_terms
     FROM vocabulary_domains vd
     JOIN vocabulary_terms vt ON vt.domain_id = vd.domain_id
     LEFT JOIN term_usage tu ON tu.term_id = vt.term_id AND tu.story_id = ?
     GROUP BY vd.domain_id
     ORDER BY vd.domain_id`,
    [storyId],
  )
  return rowsTo(result)
}
