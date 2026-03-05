import { useEffect, useRef } from 'react'
import { useTTSStore } from '../store/ttsStore.ts'

/**
 * Keeps speechSynthesis alive when the browser tab is backgrounded or the
 * screen locks (Chrome Android pauses tabs without an active audio context).
 *
 * Three mechanisms work together:
 *
 * 1. **Silent AudioContext oscillator** — signals to Chrome that this tab is
 *    producing audio, preventing full tab suspension. Background timers still
 *    fire (at ~1/sec) instead of being frozen.
 *
 * 2. **Watchdog timer** — polls speechSynthesis state every second. If the
 *    store says "playing" but speechSynthesis has silently stopped (Chrome
 *    cancels utterances on visibility change, or the `onend` chain breaks
 *    because the callback was delayed), the watchdog restarts from the next
 *    segment.
 *
 * 3. **MediaSession API** — registers play/pause/stop/skip handlers so the
 *    browser shows lock-screen / notification-shade controls.
 *
 * Additionally handles `visibilitychange` to resume a suspended AudioContext
 * when the page becomes visible again.
 */
export function useAudioKeepAlive() {
  const status = useTTSStore((s) => s.status)
  const pause = useTTSStore((s) => s.pause)
  const resume = useTTSStore((s) => s.resume)
  const stop = useTTSStore((s) => s.stop)
  const skip = useTTSStore((s) => s.skip)
  const jumpToSection = useTTSStore((s) => s.jumpToSection)

  const ctxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)

  // ── Silent AudioContext keepalive ──────────────────────────────────────
  useEffect(() => {
    const active = status === 'playing' || status === 'paused'

    if (active && !ctxRef.current) {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        gain.gain.value = 0 // silent
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        ctxRef.current = ctx
        oscRef.current = osc
      } catch {
        // AudioContext not supported — fail silently
      }
    }

    if (active && ctxRef.current?.state === 'suspended') {
      void ctxRef.current.resume()
    }

    if (!active && ctxRef.current) {
      oscRef.current?.stop()
      oscRef.current = null
      void ctxRef.current.close()
      ctxRef.current = null
    }
  }, [status])

  // ── Resume AudioContext when page becomes visible again ────────────────
  useEffect(() => {
    const active = status === 'playing' || status === 'paused'
    if (!active) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && ctxRef.current?.state === 'suspended') {
        void ctxRef.current.resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [status])

  // ── Watchdog: detect when speechSynthesis silently stops ──────────────
  // Chrome Android may cancel utterances when the tab is backgrounded or the
  // screen locks. The onend callback that chains segments may never fire,
  // leaving the store in "playing" state while nothing is actually speaking.
  // This timer detects that condition and restarts from the next segment.
  useEffect(() => {
    if (status !== 'playing') return

    const synth = window.speechSynthesis
    if (!synth) return

    // Give a brief grace period after status changes to "playing" —
    // the engine may be between segments.
    let graceFrames = 3

    const id = setInterval(() => {
      const { status: current, currentSegmentIndex, totalSegments } = useTTSStore.getState()

      if (current !== 'playing') return

      // speechSynthesis is still active — all good
      if (synth.speaking || synth.pending) {
        graceFrames = 3
        return
      }

      // If paused at the browser level (e.g. Chrome auto-paused it), resume
      if (synth.paused) {
        synth.resume()
        return
      }

      // Grace period: allow a few ticks for the engine to queue the next
      // utterance between segments
      if (graceFrames > 0) {
        graceFrames--
        return
      }

      // Speech has silently stopped. Restart from the next segment.
      const nextIndex = currentSegmentIndex + 1
      if (nextIndex < totalSegments) {
        const engine = useTTSStore.getState()._getEngine()
        engine.jumpTo(nextIndex)
        graceFrames = 3
      } else {
        // We were on the last segment — playback is legitimately done
        useTTSStore.getState().stop()
      }
    }, 1000)

    return () => clearInterval(id)
  }, [status])

  // ── MediaSession API for lock-screen / notification controls ──────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return

    const active = status === 'playing' || status === 'paused'
    if (!active) {
      navigator.mediaSession.metadata = null
      navigator.mediaSession.playbackState = 'none'
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Walkthrough Script',
      artist: 'Story Structure Explorer',
    })

    navigator.mediaSession.playbackState =
      status === 'playing' ? 'playing' : 'paused'

    navigator.mediaSession.setActionHandler('play', () => resume())
    navigator.mediaSession.setActionHandler('pause', () => pause())
    navigator.mediaSession.setActionHandler('stop', () => stop())
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15))
    navigator.mediaSession.setActionHandler('seekforward', () => skip(15))
    navigator.mediaSession.setActionHandler('previoustrack', () =>
      jumpToSection('prev'),
    )
    navigator.mediaSession.setActionHandler('nexttrack', () =>
      jumpToSection('next'),
    )

    return () => {
      if (!('mediaSession' in navigator)) return
      const handlers = [
        'play',
        'pause',
        'stop',
        'seekbackward',
        'seekforward',
        'previoustrack',
        'nexttrack',
      ] as const
      for (const action of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // some browsers don't support all actions
        }
      }
    }
  }, [status, pause, resume, stop, skip, jumpToSection])
}
