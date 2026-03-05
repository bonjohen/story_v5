import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'
import { TTSControlBar } from '../components/TTSControlBar.tsx'
import type { ParsedScript } from '../types.ts'

// Mock speechSynthesis
vi.stubGlobal('speechSynthesis', {
  speak: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  speaking: false,
  paused: false,
})

vi.stubGlobal('SpeechSynthesisUtterance', class {
  text: string
  rate = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  onboundary: (() => void) | null = null
  constructor(text: string) { this.text = text }
})

const mockScript: ParsedScript = {
  meta: { slug: 'test', title: 'Test', subtitle: '', estimatedMinutes: 5 },
  sections: [
    {
      heading: 'Intro',
      level: 1,
      paragraphs: [
        { text: 'First.', index: 0 },
        { text: 'Second.', index: 1 },
      ],
    },
  ],
  html: '<p data-paragraph-index="0">First.</p><p data-paragraph-index="1">Second.</p>',
  totalParagraphs: 2,
}

beforeEach(() => {
  useTTSStore.setState({
    status: 'idle',
    currentSegmentIndex: -1,
    totalSegments: 0,
    voices: [],
    selectedVoice: null,
    rate: 1.0,
    sectionBoundaries: [],
  })
  useScriptStore.setState({
    scripts: [mockScript.meta],
    currentScript: mockScript,
    loading: false,
    error: null,
  })
})

describe('TTSControlBar', () => {
  it('renders play button when idle', () => {
    render(<TTSControlBar />)
    expect(screen.getByLabelText('Play')).toBeInTheDocument()
  })

  it('shows pause button when playing', () => {
    useTTSStore.setState({ status: 'playing', totalSegments: 2, currentSegmentIndex: 0 })
    render(<TTSControlBar />)
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('shows stop and navigation buttons when active', () => {
    useTTSStore.setState({ status: 'playing', totalSegments: 2, currentSegmentIndex: 0 })
    render(<TTSControlBar />)
    expect(screen.getByLabelText('Stop')).toBeInTheDocument()
    expect(screen.getByLabelText('Previous section')).toBeInTheDocument()
    expect(screen.getByLabelText('Next section')).toBeInTheDocument()
  })

  it('has speed selector with correct options', () => {
    render(<TTSControlBar />)
    const speedSelect = screen.getByLabelText('Playback speed')
    expect(speedSelect).toBeInTheDocument()
    expect(speedSelect).toHaveValue('1')
  })

  it('speed change updates store', () => {
    render(<TTSControlBar />)
    const speedSelect = screen.getByLabelText('Playback speed')
    fireEvent.change(speedSelect, { target: { value: '1.5' } })
    expect(useTTSStore.getState().rate).toBe(1.5)
  })
})
