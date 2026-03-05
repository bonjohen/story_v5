import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'

export function ProgressBar() {
  const status = useTTSStore((s) => s.status)
  const currentIndex = useTTSStore((s) => s.currentSegmentIndex)
  const totalSegments = useTTSStore((s) => s.totalSegments)
  const sectionBoundaries = useTTSStore((s) => s.sectionBoundaries)
  const jumpToSegment = useTTSStore((s) => s.jumpToSegment)
  const currentScript = useScriptStore((s) => s.currentScript)

  if (status === 'idle') return null

  const progress = totalSegments > 0 ? ((currentIndex + 1) / totalSegments) * 100 : 0

  // Determine current section
  let currentSection = 0
  for (let i = 0; i < sectionBoundaries.length; i++) {
    if (currentIndex >= sectionBoundaries[i]) currentSection = i + 1
  }
  const totalSections = currentScript?.sections.length ?? sectionBoundaries.length

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const targetIndex = Math.floor(ratio * totalSegments)
    jumpToSegment(Math.max(0, Math.min(targetIndex, totalSegments - 1)))
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Clickable progress bar */}
      <div
        onClick={handleClick}
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={totalSegments}
        aria-label="Playback progress"
        title="Click to seek"
        style={{
          height: 3,
          background: 'var(--border)',
          cursor: 'pointer',
          position: 'relative',
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

      {/* Text indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '3px 12px',
          fontSize: 10,
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
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
    </div>
  )
}
