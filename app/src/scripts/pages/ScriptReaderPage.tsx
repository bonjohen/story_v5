import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useScriptStore } from '../store/scriptStore.ts'
import { useTTSStore } from '../store/ttsStore.ts'
import { ScriptToolbar } from '../components/ScriptToolbar.tsx'
import { MarkdownRenderer } from '../components/MarkdownRenderer.tsx'
import { TTSControlBar } from '../components/TTSControlBar.tsx'
import { SettingsPanel } from '../../components/SettingsPanel.tsx'
import { useSettingsStore } from '../../store/settingsStore.ts'
import { useTTSKeyboard } from '../hooks/useTTSKeyboard.ts'
import { useAutoScroll } from '../hooks/useAutoScroll.ts'
import { useAudioKeepAlive } from '../hooks/useAudioKeepAlive.ts'

export function ScriptReaderPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const currentScript = useScriptStore((s) => s.currentScript)
  const loading = useScriptStore((s) => s.loading)
  const error = useScriptStore((s) => s.error)
  const loadScript = useScriptStore((s) => s.loadScript)
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const ttsStop = useTTSStore((s) => s.stop)
  const playFromIndex = useTTSStore((s) => s.playFromIndex)
  const speakText = useTTSStore((s) => s.speakText)
  const currentSegmentIndex = useTTSStore((s) => s.currentSegmentIndex)

  const contentRef = useRef<HTMLDivElement>(null)

  useTTSKeyboard()
  useAutoScroll(currentSegmentIndex, contentRef)
  useAudioKeepAlive()

  useEffect(() => {
    if (slug) void loadScript(slug)
  }, [slug, loadScript])

  // Stop TTS when leaving the page
  useEffect(() => {
    return () => ttsStop()
  }, [ttsStop])

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  /** Start reading from the clicked paragraph. */
  const handleParagraphClick = useCallback(
    (paragraphIndex: number) => {
      if (!currentScript || !ttsSupported) return
      const segments: string[] = []
      const boundaries: number[] = []
      for (const section of currentScript.sections) {
        if (section.headingIndex != null) {
          boundaries.push(section.headingIndex)
          segments[section.headingIndex] = section.heading
        } else if (section.paragraphs.length > 0) {
          boundaries.push(section.paragraphs[0].index)
        }
        for (const p of section.paragraphs) segments[p.index] = p.text
      }
      playFromIndex(segments, paragraphIndex, boundaries)
    },
    [currentScript, ttsSupported, playFromIndex],
  )

  /** Speak only the selected text. */
  const handleReadSelection = useCallback(
    (text: string) => {
      if (!ttsSupported) return
      speakText(text)
    },
    [ttsSupported, speakText],
  )

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <ScriptToolbar scriptTitle={currentScript?.meta.title} />
      {settingsOpen && <SettingsPanel />}

      {!ttsSupported && (
        <div style={{
          padding: '6px 16px',
          background: 'rgba(239,68,68,0.1)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
          fontSize: 12,
          color: '#ef4444',
          textAlign: 'center',
        }}>
          Text-to-speech is not supported in this browser.
        </div>
      )}

      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 24px',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {loading && (
            <div style={{ color: 'var(--accent)', fontSize: 13, animation: 'pulse 1.5s infinite', padding: '40px 0' }}>
              Loading script...
            </div>
          )}

          {error && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</div>
              <button
                onClick={() => void navigate('/scripts')}
                style={{
                  fontSize: 13,
                  color: 'var(--accent)',
                  padding: '6px 16px',
                  border: '1px solid var(--accent)',
                  borderRadius: 6,
                }}
              >
                Back to scripts
              </button>
            </div>
          )}

          {currentScript && (
            <MarkdownRenderer
              html={currentScript.html}
              highlightedParagraphIndex={currentSegmentIndex}
              onParagraphClick={ttsSupported ? handleParagraphClick : undefined}
              onReadSelection={ttsSupported ? handleReadSelection : undefined}
            />
          )}
        </div>
      </div>

      {/* Bottom-docked TTS player */}
      <TTSControlBar />

      {/* Screen-reader: announce current section */}
      <CurrentSectionAnnouncer
        sections={currentScript?.sections}
        segmentIndex={currentSegmentIndex}
      />
    </div>
  )
}

function CurrentSectionAnnouncer({
  sections,
  segmentIndex,
}: {
  sections?: { heading: string; headingIndex?: number; paragraphs: { index: number }[] }[]
  segmentIndex: number
}) {
  const sectionHeading = useMemo(() => {
    if (!sections || segmentIndex < 0) return ''
    for (let i = sections.length - 1; i >= 0; i--) {
      const start = sections[i].headingIndex ?? sections[i].paragraphs[0]?.index
      if (start != null && segmentIndex >= start) return sections[i].heading
    }
    return ''
  }, [sections, segmentIndex])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
      }}
    >
      {sectionHeading && `Now reading: ${sectionHeading}`}
    </div>
  )
}
