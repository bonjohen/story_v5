import { useEffect } from 'react'
import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

/** Extract plain-text paragraphs and section boundaries from parsed script. */
function useScriptSegments() {
  const currentScript = useScriptStore((s) => s.currentScript)
  if (!currentScript) return { segments: [], boundaries: [] }

  const segments: string[] = []
  const boundaries: number[] = []

  for (const section of currentScript.sections) {
    if (section.headingIndex != null) {
      boundaries.push(section.headingIndex)
      segments[section.headingIndex] = section.heading
    } else if (section.paragraphs.length > 0) {
      boundaries.push(section.paragraphs[0].index)
    }
    for (const p of section.paragraphs) {
      segments[p.index] = p.text
    }
  }

  return { segments, boundaries }
}

const BTN: React.CSSProperties = {
  fontSize: 12,
  padding: '3px 8px',
  borderRadius: 4,
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  transition: 'all 0.15s',
  cursor: 'pointer',
  minWidth: 32,
  textAlign: 'center',
}

export function TTSControlBar() {
  const status = useTTSStore((s) => s.status)
  const rate = useTTSStore((s) => s.rate)
  const voices = useTTSStore((s) => s.voices)
  const selectedVoice = useTTSStore((s) => s.selectedVoice)
  const play = useTTSStore((s) => s.play)
  const pause = useTTSStore((s) => s.pause)
  const resume = useTTSStore((s) => s.resume)
  const stop = useTTSStore((s) => s.stop)
  const setRate = useTTSStore((s) => s.setRate)
  const setVoice = useTTSStore((s) => s.setVoice)
  const jumpToSection = useTTSStore((s) => s.jumpToSection)
  const skip = useTTSStore((s) => s.skip)
  const loadVoices = useTTSStore((s) => s.loadVoices)
  const { segments, boundaries } = useScriptSegments()

  useEffect(() => {
    void loadVoices()
  }, [loadVoices])

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  if (!ttsSupported) return null

  const isActive = status !== 'idle'
  const canPlay = segments.length > 0

  const handlePlayPause = () => {
    if (status === 'idle') {
      play(segments, boundaries)
    } else if (status === 'playing') {
      pause()
    } else if (status === 'paused') {
      resume()
    }
  }

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value
    const voice = voices.find((v) => v.name === name) ?? null
    setVoice(voice)
  }

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRate(parseFloat(e.target.value))
  }

  return (
    <div
      role="toolbar"
      aria-label="Text-to-speech controls"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {/* Section back */}
      <button
        onClick={() => jumpToSection('prev')}
        disabled={!isActive}
        aria-label="Previous section"
        title="Previous section"
        style={{ ...BTN, opacity: isActive ? 1 : 0.3, cursor: isActive ? 'pointer' : 'default' }}
      >
        {'\u23EE'}
      </button>

      {/* Skip back 15s */}
      <button
        onClick={() => skip(-15)}
        disabled={!isActive}
        aria-label="Skip back 15 seconds"
        title="Skip back 15s"
        style={{ ...BTN, opacity: isActive ? 1 : 0.3, cursor: isActive ? 'pointer' : 'default' }}
      >
        -15s
      </button>

      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        disabled={!canPlay}
        aria-label={status === 'playing' ? 'Pause' : 'Play'}
        style={{
          ...BTN,
          borderColor: isActive ? 'var(--green)' : 'var(--border)',
          color: isActive ? 'var(--green)' : 'var(--text-muted)',
          background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
          opacity: canPlay ? 1 : 0.4,
          cursor: canPlay ? 'pointer' : 'default',
          padding: '3px 12px',
        }}
      >
        {status === 'playing' ? '\u23F8' : '\u25B6'}
      </button>

      {/* Skip forward 15s */}
      <button
        onClick={() => skip(15)}
        disabled={!isActive}
        aria-label="Skip forward 15 seconds"
        title="Skip forward 15s"
        style={{ ...BTN, opacity: isActive ? 1 : 0.3, cursor: isActive ? 'pointer' : 'default' }}
      >
        +15s
      </button>

      {/* Section forward */}
      <button
        onClick={() => jumpToSection('next')}
        disabled={!isActive}
        aria-label="Next section"
        title="Next section"
        style={{ ...BTN, opacity: isActive ? 1 : 0.3, cursor: isActive ? 'pointer' : 'default' }}
      >
        {'\u23ED'}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        disabled={!isActive}
        aria-label="Stop"
        title="Stop"
        style={{
          ...BTN,
          borderColor: isActive ? '#ef4444' : 'var(--border)',
          color: isActive ? '#ef4444' : 'var(--text-muted)',
          opacity: isActive ? 1 : 0.3,
          cursor: isActive ? 'pointer' : 'default',
        }}
      >
        {'\u25A0'}
      </button>

      {/* Separator */}
      <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />

      {/* Speed select */}
      <select
        value={rate}
        onChange={handleSpeedChange}
        aria-label="Playback speed"
        style={{
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 4,
          minWidth: 56,
        }}
      >
        {SPEED_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}x
          </option>
        ))}
      </select>

      {/* Voice select */}
      {voices.length > 0 && (
        <select
          value={selectedVoice?.name ?? ''}
          onChange={handleVoiceChange}
          aria-label="Voice"
          style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            maxWidth: 160,
          }}
        >
          <option value="">Default voice</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
