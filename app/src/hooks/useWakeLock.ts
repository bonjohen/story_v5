/**
 * Keeps the screen awake while TTS is playing.
 * Uses the Screen Wake Lock API (supported on Chrome Android 84+).
 * Automatically re-acquires the lock when the page regains focus.
 */

import { useEffect, useRef } from 'react'
import { useTTSStore } from '../scripts/store/ttsStore.ts'

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) {
      void lockRef.current?.release()
      lockRef.current = null
      return
    }

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
  }, [active])
}

/** Render-nothing component that holds the wake lock while TTS is playing. */
export function WakeLockProvider() {
  const status = useTTSStore((s) => s.status)
  useWakeLock(status === 'playing')
  return null
}
