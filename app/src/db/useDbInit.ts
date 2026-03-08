/**
 * React hook to initialize the SQLite database.
 * Database is lazy-loaded — only initialized when init() is called,
 * not automatically on mount. This avoids WASM load errors when the
 * database feature isn't needed.
 */

import { useState, useCallback } from 'react'
import { initDatabase } from './index.ts'

export interface DbStatus {
  ready: boolean
  loading: boolean
  error: string | null
  schemaVersion: number
  /** Call to initialize the database on demand. */
  init: () => void
}

export function useDbInit(): DbStatus {
  const [status, setStatus] = useState<DbStatus>({
    ready: false,
    loading: false,
    error: null,
    schemaVersion: 0,
    init: () => {},
  })

  const init = useCallback(() => {
    setStatus((s) => {
      if (s.ready || s.loading) return s
      return { ...s, loading: true, error: null }
    })
    initDatabase()
      .then((result) => {
        setStatus((s) => ({ ...s, ready: true, loading: false, error: null, schemaVersion: result.current }))
      })
      .catch((err) => {
        console.warn('Database init failed:', err)
        setStatus((s) => ({ ...s, ready: false, loading: false, error: String(err) }))
      })
  }, [])

  // Attach the init function to the returned status
  status.init = init
  return status
}
