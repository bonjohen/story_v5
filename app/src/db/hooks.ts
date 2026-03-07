/**
 * React hooks for querying the SQLite database.
 */

import { useState, useEffect, useCallback } from 'react'
import type { Database } from 'sql.js'
import { ensureDbInit, getDb } from './index.ts'

export interface DbQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDbQuery<T>(
  queryFn: (db: Database) => T,
  deps: unknown[] = [],
): DbQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ensureDbInit()
      .then(() => getDb())
      .then((db) => {
        if (cancelled) return
        const result = queryFn(db)
        setData(result)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(String(err))
        setLoading(false)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, ...deps])

  return { data, loading, error, refresh }
}

/** Hook to get the raw Database instance (async). Returns null while loading. */
export function useDb(): Database | null {
  const [db, setDb] = useState<Database | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureDbInit()
      .then(() => getDb())
      .then((database) => {
        if (!cancelled) setDb(database)
      })
      .catch(() => { /* db not available */ })
    return () => { cancelled = true }
  }, [])

  return db
}
