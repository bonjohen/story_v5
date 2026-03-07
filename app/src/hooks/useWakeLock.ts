/**
 * Keeps the screen awake while the page is visible.
 * Uses the Screen Wake Lock API (supported on Chrome Android 84+).
 * Automatically re-acquires the lock when the page regains focus.
 */

import { useEffect, useRef } from 'react'

export function useWakeLock() {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    const acquire = async () => {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Wake lock request failed (e.g. low battery, background tab)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void acquire()
      }
    }

    void acquire()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      void lockRef.current?.release()
      lockRef.current = null
    }
  }, [])
}

/** Render-nothing component that holds the wake lock. */
export function WakeLockProvider() {
  useWakeLock()
  return null
}
