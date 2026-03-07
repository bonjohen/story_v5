import type { Database, SqlValue } from 'sql.js'
import type { ProjectRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createProject(
  db: Database,
  fields: { project_key: string; name: string; description?: string; status?: string },
): ProjectRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO projects (project_id, project_key, name, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, fields.project_key, fields.name, fields.description ?? null, fields.status ?? 'active', ts, ts],
  )
  return getProject(db, id)!
}

export function getProject(db: Database, projectId: string): ProjectRow | null {
  const result = db.exec('SELECT * FROM projects WHERE project_id = ?', [projectId])
  if (!result.length || !result[0].values.length) return null
  return rowToProject(result[0].columns, result[0].values[0])
}

export function listProjects(db: Database): ProjectRow[] {
  const result = db.exec('SELECT * FROM projects ORDER BY created_at')
  if (!result.length) return []
  return result[0].values.map((v) => rowToProject(result[0].columns, v))
}

export function updateProject(
  db: Database,
  projectId: string,
  changes: Partial<Pick<ProjectRow, 'name' | 'description' | 'status' | 'default_story_id' | 'json_data'>>,
): void {
  const sets: string[] = []
  const vals: SqlValue[] = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as SqlValue)
  }
  sets.push('updated_at = ?')
  vals.push(now())
  vals.push(projectId)
  db.run(`UPDATE projects SET ${sets.join(', ')} WHERE project_id = ?`, vals)
}

export function deleteProject(db: Database, projectId: string): void {
  db.run('DELETE FROM projects WHERE project_id = ?', [projectId])
}

function rowToProject(columns: string[], values: unknown[]): ProjectRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as ProjectRow
}
