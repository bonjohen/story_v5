import type { Database, SqlValue } from 'sql.js'
import type { StoryRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createStory(
  db: Database,
  fields: {
    project_id: string
    story_key: string
    title: string
    summary?: string
    status?: string
    archetype_id?: string
    genre_id?: string
    pov_mode?: string
    target_length_words?: number
  },
): StoryRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO stories (story_id, project_id, story_key, title, summary, status, archetype_id, genre_id, pov_mode, target_length_words, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.project_id, fields.story_key, fields.title,
      fields.summary ?? null, fields.status ?? 'draft',
      fields.archetype_id ?? null, fields.genre_id ?? null,
      fields.pov_mode ?? null, fields.target_length_words ?? null,
      ts, ts,
    ],
  )
  return getStory(db, id)!
}

export function getStory(db: Database, storyId: string): StoryRow | null {
  const result = db.exec('SELECT * FROM stories WHERE story_id = ?', [storyId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listStoriesByProject(db: Database, projectId: string): StoryRow[] {
  const result = db.exec('SELECT * FROM stories WHERE project_id = ? ORDER BY created_at', [projectId])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function updateStory(
  db: Database,
  storyId: string,
  changes: Partial<Pick<StoryRow, 'title' | 'summary' | 'status' | 'archetype_id' | 'genre_id' | 'pov_mode' | 'target_length_words' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: SqlValue[] = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as SqlValue)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(storyId)
  db.run(`UPDATE stories SET ${sets.join(', ')} WHERE story_id = ?`, vals)
}

export function deleteStory(db: Database, storyId: string): void {
  db.run('DELETE FROM stories WHERE story_id = ?', [storyId])
}

function rowTo(columns: string[], values: unknown[]): StoryRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as StoryRow
}
