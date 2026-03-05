/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TTSEngine } from './ttsEngine.ts'

// Mock SpeechSynthesisUtterance
class MockUtterance {
  text: string
  rate = 1.0
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onboundary: ((e: { charIndex: number }) => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

function createMockSynth() {
  const utterances: MockUtterance[] = []
  return {
    speaking: false,
    paused: false,
    utterances,
    speak: vi.fn((u: MockUtterance) => {
      utterances.push(u)
    }),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as SpeechSynthesis & { utterances: MockUtterance[] }
}

// Install global mock
vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance)

describe('TTSEngine', () => {
  let synth: ReturnType<typeof createMockSynth>
  let engine: TTSEngine

  beforeEach(() => {
    synth = createMockSynth()
    engine = new TTSEngine(synth)
  })

  it('speaks segments sequentially via onend chaining', () => {
    const onSegmentStart = vi.fn()
    const onComplete = vi.fn()

    engine.speak(['Hello', 'World'], {
      callbacks: { onSegmentStart, onComplete },
    })

    // First segment should be spoken
    expect(synth.speak).toHaveBeenCalledTimes(1)
    expect(synth.utterances[0].text).toBe('Hello')
    expect(onSegmentStart).toHaveBeenCalledWith(0)

    // Simulate first segment ending
    synth.utterances[0].onend!()

    // Second segment
    expect(synth.speak).toHaveBeenCalledTimes(2)
    expect(synth.utterances[1].text).toBe('World')
    expect(onSegmentStart).toHaveBeenCalledWith(1)

    // Simulate second ending
    synth.utterances[1].onend!()
    expect(onComplete).toHaveBeenCalled()
  })

  it('skips empty segments', () => {
    const onComplete = vi.fn()
    engine.speak(['Hello', '', 'World'], { callbacks: { onComplete } })

    expect(synth.utterances[0].text).toBe('Hello')
    synth.utterances[0].onend!()

    // Empty segment should be skipped
    expect(synth.utterances[1].text).toBe('World')
    synth.utterances[1].onend!()
    expect(onComplete).toHaveBeenCalled()
  })

  it('applies rate and voice', () => {
    const mockVoice = { name: 'Test' } as SpeechSynthesisVoice
    engine.speak(['Test'], { rate: 1.5, voice: mockVoice })

    expect(synth.utterances[0].rate).toBe(1.5)
    expect(synth.utterances[0].voice).toBe(mockVoice)
  })

  it('cancel stops speech', () => {
    engine.speak(['Hello', 'World'])
    engine.cancel()

    expect(synth.cancel).toHaveBeenCalled()
    // After cancel, onend should not trigger next segment
  })

  it('pause and resume delegate to synth', () => {
    engine.speak(['Test'])
    engine.pause()
    expect(synth.pause).toHaveBeenCalled()
    engine.resume()
    expect(synth.resume).toHaveBeenCalled()
  })

  it('jumpTo speaks from the specified index', () => {
    engine.speak(['A', 'B', 'C', 'D'])
    synth.utterances[0].onend!()

    engine.jumpTo(3)
    // Should have cancelled and started segment at index 3
    expect(synth.cancel).toHaveBeenCalled()
    const lastUtterance = synth.utterances[synth.utterances.length - 1]
    expect(lastUtterance.text).toBe('D')
  })

  it('getVoices delegates to synth', () => {
    engine.getVoices()
    expect(synth.getVoices).toHaveBeenCalled()
  })
})
