import type { Database } from 'sql.js'
import type { TagRow, TagAssignmentRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createTag(
  db: Database,
  fields: { tag_name: string; project_id?: string; tag_type?: string; description?: string },
): TagRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO tags (tag_id, project_id, tag_name, tag_type, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, fields.project_id ?? null, fields.tag_name, fields.tag_type ?? null, fields.description ?? null, ts],
  )
  return { tag_id: id, project_id: fields.project_id ?? null, tag_name: fields.tag_name, tag_type: fields.tag_type ?? null, description: fields.description ?? null, created_at: ts }
}

export function listTags(db: Database, projectId?: string): TagRow[] {
  const sql = projectId
    ? 'SELECT * FROM tags WHERE project_id = ? ORDER BY tag_name'
    : 'SELECT * FROM tags ORDER BY tag_name'
  const result = db.exec(sql, projectId ? [projectId] : [])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<TagRow>(result[0].columns, v))
}

export function assignTag(
  db: Database,
  fields: { tag_id: string; object_type: string; object_id: string },
): TagAssignmentRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO tag_assignments (tag_assignment_id, tag_id, object_type, object_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, fields.tag_id, fields.object_type, fields.object_id, ts],
  )
  return { tag_assignment_id: id, tag_id: fields.tag_id, object_type: fields.object_type, object_id: fields.object_id, created_at: ts }
}

export function removeTagAssignment(db: Database, tagAssignmentId: string): void {
  db.run('DELETE FROM tag_assignments WHERE tag_assignment_id = ?', [tagAssignmentId])
}

export function listTagsForObject(db: Database, objectType: string, objectId: string): TagRow[] {
  const result = db.exec(
    `SELECT t.* FROM tags t
     JOIN tag_assignments ta ON ta.tag_id = t.tag_id
     WHERE ta.object_type = ? AND ta.object_id = ?
     ORDER BY t.tag_name`,
    [objectType, objectId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<TagRow>(result[0].columns, v))
}

export function listObjectsWithTag(db: Database, tagId: string): TagAssignmentRow[] {
  const result = db.exec(
    'SELECT * FROM tag_assignments WHERE tag_id = ? ORDER BY created_at',
    [tagId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<TagAssignmentRow>(result[0].columns, v))
}

function rowTo<T>(columns: string[], values: unknown[]): T {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as T
}
