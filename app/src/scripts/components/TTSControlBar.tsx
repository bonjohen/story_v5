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

/** Touch-friendly transport button. Min 44px tap target. */
const BTN: React.CSSProperties = {
  fontSize: 18,
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-muted)',
  transition: 'all 0.15s',
  cursor: 'pointer',
  minWidth: 44,
  minHeight: 44,
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
}

/**
 * Bottom-docked TTS player bar.
 * Renders transport controls, progress, speed, and voice — all with 44px+
 * touch targets for mobile usability.
 */
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
  const currentIndex = useTTSStore((s) => s.currentSegmentIndex)
  const totalSegments = useTTSStore((s) => s.totalSegments)
  const sectionBoundaries = useTTSStore((s) => s.sectionBoundaries)
  const jumpToSegment = useTTSStore((s) => s.jumpToSegment)
  const currentScript = useScriptStore((s) => s.currentScript)
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

  // Progress computation
  const progress = totalSegments > 0 ? ((currentIndex + 1) / totalSegments) * 100 : 0
  let currentSection = 0
  for (let i = 0; i < sectionBoundaries.length; i++) {
    if (currentIndex >= sectionBoundaries[i]) currentSection = i + 1
  }
  const totalSections = currentScript?.sections.length ?? sectionBoundaries.length

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const targetIndex = Math.floor(ratio * totalSegments)
    jumpToSegment(Math.max(0, Math.min(targetIndex, totalSegments - 1)))
  }

  const disabledStyle: React.CSSProperties = {
    opacity: 0.3,
    cursor: 'default',
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Progress bar — clickable full-width strip */}
      {isActive && (
        <div
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSegments}
          aria-label="Playback progress"
          title="Click to seek"
          style={{
            height: 4,
            background: 'var(--border)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent)',
              transition: 'width 0.3s ease',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>
      )}

      {/* Status line — section/paragraph counter */}
      {isActive && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            padding: '4px 12px 0',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>
            Section {currentSection}/{totalSections}
          </span>
          <span style={{ opacity: 0.4 }}>{'\u00B7'}</span>
          <span>
            Paragraph {currentIndex + 1}/{totalSegments}
          </span>
        </div>
      )}

      {/* Transport controls */}
      <div
        role="toolbar"
        aria-label="Text-to-speech controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '8px 12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Section back */}
        <button
          onClick={() => jumpToSection('prev')}
          disabled={!isActive}
          aria-label="Previous section"
          title="Previous section"
          style={{ ...BTN, ...(isActive ? {} : disabledStyle) }}
        >
          {'\u23EE'}
        </button>

        {/* Skip back 15s */}
        <button
          onClick={() => skip(-15)}
          disabled={!isActive}
          aria-label="Skip back 15 seconds"
          title="Skip back 15s"
          style={{ ...BTN, fontSize: 13, ...(isActive ? {} : disabledStyle) }}
        >
          -15s
        </button>

        {/* Play/Pause — larger primary button */}
        <button
          onClick={handlePlayPause}
          disabled={!canPlay}
          aria-label={status === 'playing' ? 'Pause' : 'Play'}
          style={{
            ...BTN,
            fontSize: 24,
            minWidth: 56,
            minHeight: 50,
            padding: '8px 16px',
            borderColor: isActive ? 'var(--green)' : 'var(--border)',
            color: isActive ? 'var(--green)' : 'var(--text-primary)',
            background: isActive ? 'rgba(34,197,94,0.1)' : 'transparent',
            ...(canPlay ? {} : disabledStyle),
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
          style={{ ...BTN, fontSize: 13, ...(isActive ? {} : disabledStyle) }}
        >
          +15s
        </button>

        {/* Section forward */}
        <button
          onClick={() => jumpToSection('next')}
          disabled={!isActive}
          aria-label="Next section"
          title="Next section"
          style={{ ...BTN, ...(isActive ? {} : disabledStyle) }}
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
            ...(isActive
              ? {
                  borderColor: '#ef4444',
                  color: '#ef4444',
                }
              : disabledStyle),
          }}
        >
          {'\u25A0'}
        </button>

        {/* Separator */}
        <div style={{ width: 1, height: 28, background: 'var(--border)', margin: '0 4px' }} />

        {/* Speed select */}
        <select
          value={rate}
          onChange={handleSpeedChange}
          aria-label="Playback speed"
          style={{
            fontSize: 14,
            padding: '8px 10px',
            borderRadius: 6,
            minWidth: 62,
            minHeight: 44,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
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
              fontSize: 14,
              padding: '8px 10px',
              borderRadius: 6,
              maxWidth: 200,
              minHeight: 44,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
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
    </div>
  )
}
