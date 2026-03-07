import type { Database, SqlValue } from 'sql.js'
import type { EntityRow, EntityType } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createEntity(
  db: Database,
  fields: {
    story_id: string
    entity_type: EntityType
    name: string
    short_description?: string
    status?: string
    role_label?: string
    sort_order?: number
    json_data?: string
  },
): EntityRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO entities (entity_id, story_id, entity_type, name, short_description, status, role_label, sort_order, created_at, updated_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.story_id, fields.entity_type, fields.name,
      fields.short_description ?? null, fields.status ?? 'active',
      fields.role_label ?? null, fields.sort_order ?? null,
      ts, ts, fields.json_data ?? null,
    ],
  )
  return getEntity(db, id)!
}

export function getEntity(db: Database, entityId: string): EntityRow | null {
  const result = db.exec('SELECT * FROM entities WHERE entity_id = ?', [entityId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listEntitiesByStory(db: Database, storyId: string): EntityRow[] {
  const result = db.exec('SELECT * FROM entities WHERE story_id = ? ORDER BY sort_order, name', [storyId])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function listEntitiesByType(db: Database, storyId: string, entityType: EntityType): EntityRow[] {
  const result = db.exec(
    'SELECT * FROM entities WHERE story_id = ? AND entity_type = ? ORDER BY sort_order, name',
    [storyId, entityType],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function updateEntity(
  db: Database,
  entityId: string,
  changes: Partial<Pick<EntityRow, 'name' | 'short_description' | 'status' | 'role_label' | 'sort_order' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: SqlValue[] = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as SqlValue)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(entityId)
  db.run(`UPDATE entities SET ${sets.join(', ')} WHERE entity_id = ?`, vals)
}

export function deleteEntity(db: Database, entityId: string): void {
  db.run('DELETE FROM entities WHERE entity_id = ?', [entityId])
}

function rowTo(columns: string[], values: unknown[]): EntityRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as EntityRow
}
