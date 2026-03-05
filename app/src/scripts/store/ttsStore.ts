import { create } from 'zustand'
import { TTSEngine } from '../engine/ttsEngine.ts'

export type TTSStatus = 'idle' | 'playing' | 'paused'

export interface TTSStoreState {
  status: TTSStatus
  currentSegmentIndex: number
  totalSegments: number
  voices: SpeechSynthesisVoice[]
  selectedVoice: SpeechSynthesisVoice | null
  rate: number
  sectionBoundaries: number[]

  // Actions
  play: (segments: string[], sectionBoundaries?: number[]) => void
  playFromIndex: (segments: string[], startIndex: number, sectionBoundaries?: number[]) => void
  speakText: (text: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
  setRate: (rate: number) => void
  setVoice: (voice: SpeechSynthesisVoice | null) => void
  jumpToSegment: (index: number) => void
  jumpToSection: (direction: 'prev' | 'next') => void
  skip: (seconds: number) => void
  loadVoices: () => void
  _getEngine: () => TTSEngine
}

let engine: TTSEngine | null = null

function getEngine(): TTSEngine {
  if (!engine) engine = new TTSEngine()
  return engine
}

/** Restore persisted voice name from localStorage. */
function restoreVoiceName(): string | null {
  try {
    return localStorage.getItem('tts-voice-name')
  } catch {
    return null
  }
}

export const useTTSStore = create<TTSStoreState>((set, get) => ({
  status: 'idle',
  currentSegmentIndex: -1,
  totalSegments: 0,
  voices: [],
  selectedVoice: null,
  rate: 1.0,
  sectionBoundaries: [],

  play: (segments, sectionBoundaries) => {
    const { selectedVoice, rate } = get()
    const eng = getEngine()
    set({
      status: 'playing',
      totalSegments: segments.length,
      currentSegmentIndex: 0,
      sectionBoundaries: sectionBoundaries ?? [],
    })
    eng.speak(segments, {
      voice: selectedVoice,
      rate,
      callbacks: {
        onSegmentStart: (index) => set({ currentSegmentIndex: index }),
        onSegmentEnd: () => {},
        onComplete: () => set({ status: 'idle', currentSegmentIndex: -1 }),
        onError: (err) => {
          console.error('TTS error:', err)
          set({ status: 'idle', currentSegmentIndex: -1 })
        },
      },
    })
  },

  playFromIndex: (segments, startIndex, sectionBoundaries) => {
    const { selectedVoice, rate } = get()
    const eng = getEngine()
    set({
      status: 'playing',
      totalSegments: segments.length,
      currentSegmentIndex: startIndex,
      sectionBoundaries: sectionBoundaries ?? [],
    })
    eng.speak(segments, {
      voice: selectedVoice,
      rate,
      callbacks: {
        onSegmentStart: (index) => set({ currentSegmentIndex: index }),
        onSegmentEnd: () => {},
        onComplete: () => set({ status: 'idle', currentSegmentIndex: -1 }),
        onError: (err) => {
          console.error('TTS error:', err)
          set({ status: 'idle', currentSegmentIndex: -1 })
        },
      },
    })
    // Jump to the start index immediately after speak sets up
    eng.jumpTo(startIndex)
  },

  speakText: (text) => {
    const { selectedVoice, rate } = get()
    const eng = getEngine()
    set({
      status: 'playing',
      totalSegments: 1,
      currentSegmentIndex: -1,
      sectionBoundaries: [],
    })
    eng.speak([text], {
      voice: selectedVoice,
      rate,
      callbacks: {
        onComplete: () => set({ status: 'idle', currentSegmentIndex: -1 }),
        onError: (err) => {
          console.error('TTS error:', err)
          set({ status: 'idle', currentSegmentIndex: -1 })
        },
      },
    })
  },

  pause: () => {
    getEngine().pause()
    set({ status: 'paused' })
  },

  resume: () => {
    getEngine().resume()
    set({ status: 'playing' })
  },

  stop: () => {
    getEngine().cancel()
    set({ status: 'idle', currentSegmentIndex: -1 })
  },

  setRate: (rate) => {
    set({ rate })
    const eng = getEngine()
    eng.setRate(rate)
    // If currently playing, restart current segment at new rate
    const { status, currentSegmentIndex } = get()
    if (status === 'playing' && currentSegmentIndex >= 0) {
      eng.jumpTo(currentSegmentIndex)
    }
  },

  setVoice: (voice) => {
    set({ selectedVoice: voice })
    getEngine().setVoice(voice)
    try {
      if (voice) localStorage.setItem('tts-voice-name', voice.name)
      else localStorage.removeItem('tts-voice-name')
    } catch { /* ignore */ }
  },

  jumpToSegment: (index) => {
    const { totalSegments, status } = get()
    if (index < 0 || index >= totalSegments) return
    if (status === 'idle') return
    getEngine().jumpTo(index)
    set({ currentSegmentIndex: index, status: 'playing' })
  },

  jumpToSection: (direction) => {
    const { currentSegmentIndex, sectionBoundaries } = get()
    if (sectionBoundaries.length === 0) return

    let target: number
    if (direction === 'next') {
      const next = sectionBoundaries.find((b) => b > currentSegmentIndex)
      if (next === undefined) return
      target = next
    } else {
      // Find the section boundary before the current one
      const candidates = sectionBoundaries.filter((b) => b < currentSegmentIndex)
      if (candidates.length === 0) {
        target = sectionBoundaries[0]
      } else {
        target = candidates[candidates.length - 1]
      }
    }
    get().jumpToSegment(target)
  },

  skip: (seconds: number) => {
    const { currentSegmentIndex, totalSegments, status, rate } = get()
    if (status === 'idle' || currentSegmentIndex < 0) return

    const eng = getEngine()
    const segments = (eng as unknown as { segments: string[] }).segments
    // Estimate ~150 words/min at 1x → 2.5 words/sec. Adjusted for rate.
    const wordsPerSec = 2.5 * rate
    const targetWords = Math.abs(seconds) * wordsPerSec
    const forward = seconds > 0

    let wordsAccum = 0
    let targetIndex = currentSegmentIndex

    if (forward) {
      for (let i = currentSegmentIndex + 1; i < totalSegments; i++) {
        const words = (segments[i] ?? '').split(/\s+/).filter(Boolean).length
        wordsAccum += words
        targetIndex = i
        if (wordsAccum >= targetWords) break
      }
    } else {
      for (let i = currentSegmentIndex - 1; i >= 0; i--) {
        const words = (segments[i] ?? '').split(/\s+/).filter(Boolean).length
        wordsAccum += words
        targetIndex = i
        if (wordsAccum >= targetWords) break
      }
    }

    if (targetIndex !== currentSegmentIndex) {
      get().jumpToSegment(targetIndex)
    }
  },

  loadVoices: () => {
    const eng = getEngine()
    const update = () => {
      const voices = eng.getVoices()
      const savedName = restoreVoiceName()
      const match = savedName ? voices.find((v) => v.name === savedName) ?? null : null
      set({ voices, selectedVoice: match })
    }
    update()
    eng.onVoicesChanged(update)
  },

  _getEngine: () => getEngine(),
}))
