import type { Database } from 'sql.js'
import type { RelationshipRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createRelationship(
  db: Database,
  fields: {
    story_id: string
    from_entity_id: string
    to_entity_id: string
    relationship_type: string
    strength_value?: number
    status?: string
    notes?: string
    json_data?: string
  },
): RelationshipRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO entity_relationships (relationship_id, story_id, from_entity_id, to_entity_id, relationship_type, strength_value, status, notes, created_at, updated_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.story_id, fields.from_entity_id, fields.to_entity_id,
      fields.relationship_type, fields.strength_value ?? null,
      fields.status ?? 'active', fields.notes ?? null,
      ts, ts, fields.json_data ?? null,
    ],
  )
  return getRelationship(db, id)!
}

export function getRelationship(db: Database, relationshipId: string): RelationshipRow | null {
  const result = db.exec('SELECT * FROM entity_relationships WHERE relationship_id = ?', [relationshipId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listRelationshipsForEntity(db: Database, entityId: string): RelationshipRow[] {
  const result = db.exec(
    'SELECT * FROM entity_relationships WHERE from_entity_id = ? OR to_entity_id = ? ORDER BY created_at',
    [entityId, entityId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function listRelationshipsByStory(db: Database, storyId: string): RelationshipRow[] {
  const result = db.exec(
    'SELECT * FROM entity_relationships WHERE story_id = ? ORDER BY created_at',
    [storyId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function deleteRelationship(db: Database, relationshipId: string): void {
  db.run('DELETE FROM entity_relationships WHERE relationship_id = ?', [relationshipId])
}

function rowTo(columns: string[], values: unknown[]): RelationshipRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as RelationshipRow
}
