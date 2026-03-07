/**
 * Database initialization — call once at app startup.
 */

import { getDb, saveDb, isDbUnavailable } from './connection.ts'
import { runMigrations } from './migrator.ts'

let initialized = false
let initPromise: Promise<void> | null = null

export async function initDatabase(): Promise<{ applied: number; current: number }> {
  const db = await getDb()
  const result = runMigrations(db)
  await saveDb()
  initialized = true
  return result
}

export function ensureDbInit(): Promise<void> {
  if (isDbUnavailable()) return Promise.reject(new Error('Database unavailable (WASM failed to load)'))
  if (initialized) return Promise.resolve()
  if (!initPromise) {
    initPromise = initDatabase().then(() => { /* void */ })
  }
  return initPromise
}

export { getDb, saveDb, saveDbImmediate, closeDb, resetDb, isDbUnavailable } from './connection.ts'
export { runMigrations } from './migrator.ts'
