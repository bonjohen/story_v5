/**
 * ReadAloud — simple play/pause/stop control for reading page text aloud.
 * Uses the browser's speechSynthesis API.
 * Pass either `text` directly, or `contentRef` to read a DOM element's innerText.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface ReadAloudProps {
  /** Direct text to speak. */
  text?: string
  /** Ref to a DOM element whose innerText will be read. Takes precedence if text is also given. */
  contentRef?: React.RefObject<HTMLElement | null>
  /** Optional label shown next to controls. */
  label?: string
}

type SpeechState = 'idle' | 'playing' | 'paused'

export function ReadAloud({ text, contentRef, label }: ReadAloudProps) {
  const [state, setState] = useState<SpeechState>('idle')
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const getText = useCallback(() => {
    if (contentRef?.current) return contentRef.current.innerText
    return text ?? ''
  }, [contentRef, text])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (!supported) return

    if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
      return
    }

    const content = getText()
    if (!content.trim()) return

    // Start fresh
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(content)
    utter.rate = 1.0
    utter.onend = () => setState('idle')
    utter.onerror = () => setState('idle')
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
    setState('playing')
  }, [supported, state, getText])

  const handlePause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    setState('paused')
  }, [supported])

  const handleStop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setState('idle')
  }, [supported])

  if (!supported) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 0',
    }}>
      {label && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>{label}</span>
      )}

      {/* Play / Pause toggle */}
      {state === 'playing' ? (
        <button
          onClick={handlePause}
          aria-label="Pause reading"
          title="Pause"
          style={btnStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handlePlay}
          aria-label={state === 'paused' ? 'Resume reading' : 'Read aloud'}
          title={state === 'paused' ? 'Resume' : 'Play'}
          style={btnStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        </button>
      )}

      {/* Stop */}
      <button
        onClick={handleStop}
        disabled={state === 'idle'}
        aria-label="Stop reading"
        title="Stop"
        style={{
          ...btnStyle,
          opacity: state === 'idle' ? 0.3 : 1,
          cursor: state === 'idle' ? 'default' : 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      </button>

      {state !== 'idle' && (
        <span style={{ fontSize: 9, color: state === 'paused' ? '#f59e0b' : '#22c55e', fontWeight: 600, textTransform: 'uppercase' }}>
          {state}
        </span>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 4,
  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
  color: 'var(--text-muted)', cursor: 'pointer',
  padding: 0, flexShrink: 0,
}
