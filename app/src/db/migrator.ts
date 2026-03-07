/**
 * Migration runner — applies pending migrations in order.
 */

import type { Database } from 'sql.js'
import { migrations } from './migrations/index.ts'

export function runMigrations(db: Database): { applied: number; current: number } {
  // Ensure schema_version table exists (bootstrap: migration 1 creates it,
  // but we need to check if the table exists before querying it)
  const tableExists = db.exec(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
  )

  let currentVersion = 0
  if (tableExists.length > 0 && tableExists[0].values.length > 0) {
    const result = db.exec('SELECT MAX(version_num) FROM schema_version')
    if (result.length > 0 && result[0].values[0][0] != null) {
      currentVersion = result[0].values[0][0] as number
    }
  }

  let applied = 0
  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue

    db.run(migration.sql)

    // After migration 1 creates the table, we can insert version rows
    if (migration.version >= 1) {
      db.run(
        'INSERT INTO schema_version (version_num, applied_at, description) VALUES (?, ?, ?)',
        [migration.version, new Date().toISOString(), migration.description],
      )
    }

    applied++
  }

  const finalVersion = currentVersion + applied
  return { applied, current: finalVersion }
}
