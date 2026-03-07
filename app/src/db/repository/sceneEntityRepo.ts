import type { Database } from 'sql.js'
import type { SceneEntityRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function addEntityToScene(
  db: Database,
  fields: { scene_id: string; entity_id: string; participation_role?: string; json_data?: string },
): SceneEntityRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO scene_entities (scene_entity_id, scene_id, entity_id, participation_role, created_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, fields.scene_id, fields.entity_id, fields.participation_role ?? null, ts, fields.json_data ?? null],
  )
  return {
    scene_entity_id: id,
    scene_id: fields.scene_id,
    entity_id: fields.entity_id,
    participation_role: fields.participation_role ?? null,
    created_at: ts,
    json_data: fields.json_data ?? null,
  }
}

export function removeEntityFromScene(db: Database, sceneEntityId: string): void {
  db.run('DELETE FROM scene_entities WHERE scene_entity_id = ?', [sceneEntityId])
}

export function listEntitiesInScene(db: Database, sceneId: string): SceneEntityRow[] {
  const result = db.exec(
    'SELECT * FROM scene_entities WHERE scene_id = ? ORDER BY created_at',
    [sceneId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function listScenesForEntity(db: Database, entityId: string): SceneEntityRow[] {
  const result = db.exec(
    'SELECT * FROM scene_entities WHERE entity_id = ? ORDER BY created_at',
    [entityId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

function rowTo(columns: string[], values: unknown[]): SceneEntityRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as SceneEntityRow
}
