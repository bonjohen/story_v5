import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'

/** Extract plain-text paragraphs and section boundaries from parsed script. */
function useScriptSegments() {
  const currentScript = useScriptStore((s) => s.currentScript)
  if (!currentScript) return { segments: [], boundaries: [] }

  const segments: string[] = []
  const boundaries: number[] = []

  for (const section of currentScript.sections) {
    if (section.paragraphs.length > 0) {
      boundaries.push(section.paragraphs[0].index)
    }
    for (const p of section.paragraphs) {
      segments[p.index] = p.text
    }
  }

  return { segments, boundaries }
}

const BUTTON_BASE: React.CSSProperties = {
  fontSize: 13,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  transition: 'all 0.15s',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

export function TTSControls() {
  const status = useTTSStore((s) => s.status)
  const play = useTTSStore((s) => s.play)
  const pause = useTTSStore((s) => s.pause)
  const resume = useTTSStore((s) => s.resume)
  const stop = useTTSStore((s) => s.stop)
  const { segments, boundaries } = useScriptSegments()

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  if (!ttsSupported) return null

  const handlePlayPause = () => {
    if (status === 'idle') {
      play(segments, boundaries)
    } else if (status === 'playing') {
      pause()
    } else if (status === 'paused') {
      resume()
    }
  }

  const handleStop = () => {
    stop()
  }

  const isActive = status !== 'idle'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={handlePlayPause}
        disabled={segments.length === 0}
        aria-label={status === 'playing' ? 'Pause' : 'Play'}
        style={{
          ...BUTTON_BASE,
          borderColor: isActive ? 'var(--green)' : 'var(--border)',
          color: isActive ? 'var(--green)' : 'var(--text-muted)',
          background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
          opacity: segments.length === 0 ? 0.4 : 1,
          cursor: segments.length === 0 ? 'default' : 'pointer',
        }}
      >
        {status === 'playing' ? '\u23F8' : '\u25B6'} {status === 'playing' ? 'Pause' : 'Play'}
      </button>

      {isActive && (
        <button
          onClick={handleStop}
          aria-label="Stop"
          style={{
            ...BUTTON_BASE,
            borderColor: '#ef4444',
            color: '#ef4444',
          }}
        >
          {'\u25A0'} Stop
        </button>
      )}
    </div>
  )
}
