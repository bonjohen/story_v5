import type { Database } from 'sql.js'
import type { ChapterRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createChapter(
  db: Database,
  fields: {
    story_id: string
    chapter_number?: number
    title?: string
    summary?: string
    status?: string
    target_word_count?: number
    actual_word_count?: number
    json_data?: string
  },
): ChapterRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO chapters (chapter_id, story_id, chapter_number, title, summary, status, target_word_count, actual_word_count, created_at, updated_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.story_id, fields.chapter_number ?? null,
      fields.title ?? null, fields.summary ?? null,
      fields.status ?? 'draft', fields.target_word_count ?? null,
      fields.actual_word_count ?? null,
      ts, ts, fields.json_data ?? null,
    ],
  )
  return getChapter(db, id)!
}

export function getChapter(db: Database, chapterId: string): ChapterRow | null {
  const result = db.exec('SELECT * FROM chapters WHERE chapter_id = ?', [chapterId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listChaptersByStory(db: Database, storyId: string): ChapterRow[] {
  const result = db.exec(
    'SELECT * FROM chapters WHERE story_id = ? ORDER BY chapter_number',
    [storyId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function getChapterWithSceneCount(db: Database, chapterId: string): (ChapterRow & { scene_count: number }) | null {
  const result = db.exec(
    `SELECT c.*, COUNT(s.scene_id) as scene_count
     FROM chapters c
     LEFT JOIN scenes s ON s.chapter_id = c.chapter_id
     WHERE c.chapter_id = ?
     GROUP BY c.chapter_id`,
    [chapterId],
  )
  if (!result.length || !result[0].values.length) return null
  return rowTo<ChapterRow & { scene_count: number }>(result[0].columns, result[0].values[0])
}

export function updateChapter(
  db: Database,
  chapterId: string,
  changes: Partial<Pick<ChapterRow, 'title' | 'summary' | 'status' | 'chapter_number' | 'target_word_count' | 'actual_word_count' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: Array<string | number | null> = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as string | number | null)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(chapterId)
  db.run(`UPDATE chapters SET ${sets.join(', ')} WHERE chapter_id = ?`, vals)
}

export function deleteChapter(db: Database, chapterId: string): void {
  db.run('DELETE FROM chapters WHERE chapter_id = ?', [chapterId])
}

function rowTo<T = ChapterRow>(columns: string[], values: unknown[]): T {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as T
}
