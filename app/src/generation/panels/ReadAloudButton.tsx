/**
 * Read Aloud button — uses the TTS engine to speak long text content.
 * Provides play/pause/stop controls inline.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useTTSStore } from '../../scripts/store/ttsStore.ts'

interface ReadAloudButtonProps {
  /** Function that returns the text to speak, called at play time. */
  getText: () => string
}

export function ReadAloudButton({ getText }: ReadAloudButtonProps) {
  const status = useTTSStore((s) => s.status)
  const play = useTTSStore((s) => s.play)
  const pause = useTTSStore((s) => s.pause)
  const resume = useTTSStore((s) => s.resume)
  const stop = useTTSStore((s) => s.stop)
  const loadVoices = useTTSStore((s) => s.loadVoices)
  const voicesLoaded = useRef(false)

  useEffect(() => {
    if (!voicesLoaded.current) {
      voicesLoaded.current = true
      loadVoices()
    }
  }, [loadVoices])

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  if (!ttsSupported) return null

  const handleClick = useCallback(() => {
    if (status === 'playing') {
      pause()
    } else if (status === 'paused') {
      resume()
    } else {
      const text = getText()
      if (!text.trim()) return
      // Split into paragraph segments for better TTS handling
      const segments = text.split(/\n\n+/).map((s) => s.replace(/\n/g, ' ').trim()).filter(Boolean)
      play(segments)
    }
  }, [status, getText, play, pause, resume])

  const handleStop = useCallback(() => {
    stop()
  }, [stop])

  const isActive = status !== 'idle'
  const label = status === 'playing' ? 'Pause' : status === 'paused' ? 'Resume' : 'Read Aloud'
  const icon = status === 'playing' ? '\u23F8' : '\u25B6'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={handleClick}
        aria-label={label}
        title={label}
        style={{
          fontSize: 10,
          padding: '3px 8px',
          borderRadius: 3,
          border: `1px solid ${isActive ? '#22c55e' : 'var(--border)'}`,
          background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
          color: isActive ? '#22c55e' : 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'all 0.15s',
        }}
      >
        {icon} {label}
      </button>
      {isActive && (
        <button
          onClick={handleStop}
          aria-label="Stop"
          title="Stop"
          style={{
            fontSize: 10,
            padding: '3px 6px',
            borderRadius: 3,
            border: '1px solid #ef4444',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {'\u25A0'}
        </button>
      )}
    </div>
  )
}
