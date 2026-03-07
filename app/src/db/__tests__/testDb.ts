/**
 * Shared test helper — creates an in-memory sql.js database with all migrations applied.
 */
import initSqlJs, { type Database } from 'sql.js'
import { runMigrations } from '../migrator.ts'

let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null

export async function createTestDb(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs()
  const db = new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  runMigrations(db)
  return db
}
