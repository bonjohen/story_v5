import type { Database, SqlValue } from 'sql.js'
import type { ArtifactRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createArtifact(
  db: Database,
  fields: {
    story_id?: string
    chapter_id?: string
    scene_id?: string
    artifact_type: string
    name: string
    file_path?: string
    content_hash?: string
    format?: string
    status?: string
    generator_name?: string
    json_data?: string
  },
): ArtifactRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO artifacts (artifact_id, story_id, chapter_id, scene_id, artifact_type, name, file_path, content_hash, format, status, generator_name, created_at, updated_at, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.story_id ?? null, fields.chapter_id ?? null, fields.scene_id ?? null,
      fields.artifact_type, fields.name,
      fields.file_path ?? null, fields.content_hash ?? null,
      fields.format ?? null, fields.status ?? 'draft',
      fields.generator_name ?? null, ts, ts, fields.json_data ?? null,
    ],
  )
  return getArtifact(db, id)!
}

export function getArtifact(db: Database, artifactId: string): ArtifactRow | null {
  const result = db.exec('SELECT * FROM artifacts WHERE artifact_id = ?', [artifactId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listArtifactsByStory(db: Database, storyId: string): ArtifactRow[] {
  const result = db.exec('SELECT * FROM artifacts WHERE story_id = ? ORDER BY created_at', [storyId])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function listArtifactsByType(db: Database, storyId: string, artifactType: string): ArtifactRow[] {
  const result = db.exec(
    'SELECT * FROM artifacts WHERE story_id = ? AND artifact_type = ? ORDER BY created_at',
    [storyId, artifactType],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function updateArtifact(
  db: Database,
  artifactId: string,
  changes: Partial<Pick<ArtifactRow, 'name' | 'status' | 'file_path' | 'content_hash' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: SqlValue[] = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as SqlValue)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(artifactId)
  db.run(`UPDATE artifacts SET ${sets.join(', ')} WHERE artifact_id = ?`, vals)
}

export function deleteArtifact(db: Database, artifactId: string): void {
  db.run('DELETE FROM artifacts WHERE artifact_id = ?', [artifactId])
}

function rowTo(columns: string[], values: unknown[]): ArtifactRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as ArtifactRow
}
