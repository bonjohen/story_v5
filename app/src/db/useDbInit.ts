/**
 * React hook to initialize the SQLite database on mount.
 */

import { useState, useEffect } from 'react'
import { initDatabase } from './index.ts'

export interface DbStatus {
  ready: boolean
  error: string | null
  schemaVersion: number
}

export function useDbInit(): DbStatus {
  const [status, setStatus] = useState<DbStatus>({
    ready: false,
    error: null,
    schemaVersion: 0,
  })

  useEffect(() => {
    let cancelled = false
    initDatabase()
      .then((result) => {
        if (!cancelled) {
          setStatus({ ready: true, error: null, schemaVersion: result.current })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Database init failed:', err)
          setStatus({ ready: false, error: String(err), schemaVersion: 0 })
        }
      })
    return () => { cancelled = true }
  }, [])

  return status
}
