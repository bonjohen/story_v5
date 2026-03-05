import { useEffect } from 'react'
import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'

/** Extract segments and boundaries for keyboard-triggered playback. */
function getSegmentsAndBoundaries() {
  const currentScript = useScriptStore.getState().currentScript
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

/**
 * Keyboard shortcuts for TTS control:
 * - Space: play/pause (when focus not in input/select/textarea)
 * - ArrowLeft: skip back 15s
 * - ArrowRight: skip forward 15s
 * - Shift+ArrowLeft: previous section
 * - Shift+ArrowRight: next section
 * - Escape: stop
 */
export function useTTSKeyboard() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const { status, play, pause, resume, stop, jumpToSection, skip } = useTTSStore.getState()

      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (status === 'idle') {
            const { segments, boundaries } = getSegmentsAndBoundaries()
            if (segments.length > 0) play(segments, boundaries)
          } else if (status === 'playing') {
            pause()
          } else if (status === 'paused') {
            resume()
          }
          break
        case 'ArrowLeft':
          if (status !== 'idle') {
            e.preventDefault()
            if (e.shiftKey) {
              jumpToSection('prev')
            } else {
              skip(-15)
            }
          }
          break
        case 'ArrowRight':
          if (status !== 'idle') {
            e.preventDefault()
            if (e.shiftKey) {
              jumpToSection('next')
            } else {
              skip(15)
            }
          }
          break
        case 'Escape':
          if (status !== 'idle') {
            e.preventDefault()
            stop()
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
