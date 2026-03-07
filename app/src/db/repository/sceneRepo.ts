import type { Database } from 'sql.js'
import type { SceneRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createScene(
  db: Database,
  fields: {
    story_id: string
    chapter_id?: string
    scene_number?: number
    title?: string
    summary?: string
    status?: string
    scene_type?: string
    timeline_order?: number
    archetype_node_id?: string
    genre_node_id?: string
    location_entity_id?: string
    target_word_count?: number
    json_data?: string
  },
): SceneRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO scenes (scene_id, story_id, chapter_id, scene_number, title, summary, status, scene_type, timeline_order, archetype_node_id, genre_node_id, location_entity_id, target_word_count, created_at, updated_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.story_id, fields.chapter_id ?? null,
      fields.scene_number ?? null, fields.title ?? null,
      fields.summary ?? null, fields.status ?? 'draft',
      fields.scene_type ?? null, fields.timeline_order ?? null,
      fields.archetype_node_id ?? null, fields.genre_node_id ?? null,
      fields.location_entity_id ?? null, fields.target_word_count ?? null,
      ts, ts, fields.json_data ?? null,
    ],
  )
  return getScene(db, id)!
}

export function getScene(db: Database, sceneId: string): SceneRow | null {
  const result = db.exec('SELECT * FROM scenes WHERE scene_id = ?', [sceneId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listScenesByChapter(db: Database, chapterId: string): SceneRow[] {
  const result = db.exec(
    'SELECT * FROM scenes WHERE chapter_id = ? ORDER BY scene_number',
    [chapterId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function listScenesByStory(db: Database, storyId: string): SceneRow[] {
  const result = db.exec(
    'SELECT * FROM scenes WHERE story_id = ? ORDER BY timeline_order, scene_number',
    [storyId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function countScenesByChapter(db: Database, storyId: string): Array<{ chapter_id: string; count: number }> {
  const result = db.exec(
    `SELECT chapter_id, COUNT(*) as count FROM scenes
     WHERE story_id = ? AND chapter_id IS NOT NULL
     GROUP BY chapter_id`,
    [storyId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => ({
    chapter_id: v[0] as string,
    count: v[1] as number,
  }))
}

export function updateScene(
  db: Database,
  sceneId: string,
  changes: Partial<Pick<SceneRow, 'title' | 'summary' | 'status' | 'scene_number' | 'timeline_order' | 'chapter_id' | 'archetype_node_id' | 'genre_node_id' | 'target_word_count' | 'actual_word_count' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: Array<string | number | null> = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as string | number | null)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(sceneId)
  db.run(`UPDATE scenes SET ${sets.join(', ')} WHERE scene_id = ?`, vals)
}

export function deleteScene(db: Database, sceneId: string): void {
  db.run('DELETE FROM scenes WHERE scene_id = ?', [sceneId])
}

function rowTo(columns: string[], values: unknown[]): SceneRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as SceneRow
}
