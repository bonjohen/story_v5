/**
 * Database connection — singleton async module for sql.js.
 * Loads DB from IndexedDB on init, persists back after writes.
 */

import initSqlJs, { type Database } from 'sql.js'

const IDB_KEY = 'story_metadata_db'
const IDB_STORE = 'databases'
const IDB_DB_NAME = 'story_v5_sqljs'

let db: Database | null = null
let sqlPromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> | null = null
let dbUnavailable = false

function getSqlJs() {
  if (!sqlPromise) {
    sqlPromise = initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
    }).catch((err) => {
      dbUnavailable = true
      sqlPromise = null
      throw new Error(`SQLite WASM unavailable: ${err}`)
    })
  }
  return sqlPromise
}

/** Returns true if the database failed to initialize (e.g. WASM not available). */
export function isDbUnavailable(): boolean {
  return dbUnavailable
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly')
    const store = tx.objectStore(IDB_STORE)
    const req = store.get(IDB_KEY)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => idb.close()
  })
}

async function persistToIDB(data: Uint8Array): Promise<void> {
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    store.put(data, IDB_KEY)
    tx.oncomplete = () => { idb.close(); resolve() }
    tx.onerror = () => { idb.close(); reject(tx.error) }
  })
}

export async function getDb(): Promise<Database> {
  if (db) return db

  const SQL = await getSqlJs()
  const saved = await loadFromIDB()

  if (saved) {
    db = new SQL.Database(saved)
  } else {
    db = new SQL.Database()
  }

  db.run('PRAGMA foreign_keys = ON')
  return db
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export async function saveDb(): Promise<void> {
  if (!db) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if (!db) return
    const data = db.export()
    await persistToIDB(data)
    saveTimer = null
  }, 1000)
}

export async function saveDbImmediate(): Promise<void> {
  if (!db) return
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  const data = db.export()
  await persistToIDB(data)
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}

export async function resetDb(): Promise<void> {
  closeDb()
  const idb = await openIDB()
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    store.delete(IDB_KEY)
    tx.oncomplete = () => { idb.close(); resolve() }
    tx.onerror = () => { idb.close(); reject(tx.error) }
  })
}
