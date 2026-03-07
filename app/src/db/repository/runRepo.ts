import type { Database } from 'sql.js'
import type { RunRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

export function createRun(
  db: Database,
  fields: {
    project_id?: string
    story_id?: string
    run_type: string
    status?: string
    tool_name?: string
    trigger_source?: string
    notes?: string
    json_data?: string
  },
): RunRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO runs (run_id, project_id, story_id, run_type, status, started_at, tool_name, trigger_source, notes, json_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.project_id ?? null, fields.story_id ?? null,
      fields.run_type, fields.status ?? 'running', ts,
      fields.tool_name ?? null, fields.trigger_source ?? null,
      fields.notes ?? null, fields.json_data ?? null,
    ],
  )
  return getRun(db, id)!
}

export function getRun(db: Database, runId: string): RunRow | null {
  const result = db.exec('SELECT * FROM runs WHERE run_id = ?', [runId])
  if (!result.length || !result[0].values.length) return null
  return rowTo(result[0].columns, result[0].values[0])
}

export function listRunsByStory(db: Database, storyId: string): RunRow[] {
  const result = db.exec('SELECT * FROM runs WHERE story_id = ? ORDER BY started_at DESC', [storyId])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo(result[0].columns, v))
}

export function updateRun(
  db: Database,
  runId: string,
  changes: { finished_at?: string; status?: string; notes?: string; json_data?: string },
): void {
  const sets: string[] = []
  const vals: Array<string | null> = []
  for (const [key, val] of Object.entries(changes)) {
    sets.push(`${key} = ?`)
    vals.push(val as string | null)
  }
  vals.push(runId)
  db.run(`UPDATE runs SET ${sets.join(', ')} WHERE run_id = ?`, vals)
}

function rowTo(columns: string[], values: unknown[]): RunRow {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as unknown as RunRow
}
