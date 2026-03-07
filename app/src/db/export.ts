/**
 * Database export/import — raw .db file I/O.
 */

import { getDb, closeDb, saveDbImmediate } from './connection.ts'
import { runMigrations } from './migrator.ts'
import initSqlJs from 'sql.js'

/** Export the current database as a Uint8Array (.db file bytes). */
export async function exportDatabase(): Promise<Uint8Array> {
  await saveDbImmediate()
  const db = await getDb()
  return db.export()
}

/** Replace the current database with imported bytes. Re-runs migrations if needed. */
export async function importDatabase(bytes: Uint8Array): Promise<{ schemaVersion: number }> {
  closeDb()
  const SQL = await initSqlJs({
    locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
  })
  const db = new SQL.Database(bytes)
  db.run('PRAGMA foreign_keys = ON')
  const result = runMigrations(db)
  // Save imported DB to IndexedDB
  closeDb()
  // Write bytes to IndexedDB directly
  const data = db.export()
  db.close()
  await persistDirectly(data)
  return { schemaVersion: result.current }
}

async function persistDirectly(data: Uint8Array): Promise<void> {
  const IDB_DB_NAME = 'story_v5_sqljs'
  const IDB_STORE = 'databases'
  const IDB_KEY = 'story_metadata_db'

  const idb = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1)
    req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE) }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(data, IDB_KEY)
    tx.oncomplete = () => { idb.close(); resolve() }
    tx.onerror = () => { idb.close(); reject(tx.error) }
  })
}
