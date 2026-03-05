import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useTTSStore } from '../store/ttsStore.ts'
import { useScriptStore } from '../store/scriptStore.ts'
import { ProgressBar } from '../components/ProgressBar.tsx'

// Minimal mock for speechSynthesis to avoid errors
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
  constructor(text: string) { this.text = text }
})

beforeEach(() => {
  useTTSStore.setState({
    status: 'idle',
    currentSegmentIndex: -1,
    totalSegments: 0,
    sectionBoundaries: [],
  })
  useScriptStore.setState({
    currentScript: {
      meta: { slug: 'test', title: 'T', subtitle: '', estimatedMinutes: 5 },
      sections: [
        { heading: 'A', level: 1, paragraphs: [{ text: 'p1', index: 0 }] },
        { heading: 'B', level: 2, paragraphs: [{ text: 'p2', index: 1 }, { text: 'p3', index: 2 }] },
      ],
      html: '',
      totalParagraphs: 3,
    },
  })
})

describe('ProgressBar', () => {
  it('returns null when idle', () => {
    const { container } = render(<ProgressBar />)
    expect(container.firstChild).toBeNull()
  })

  it('shows progress when playing', () => {
    useTTSStore.setState({
      status: 'playing',
      currentSegmentIndex: 1,
      totalSegments: 4,
      sectionBoundaries: [0, 2],
    })
    render(<ProgressBar />)
    expect(screen.getByText(/Paragraph 2\/4/)).toBeInTheDocument()
    expect(screen.getByText(/Section 1\/2/)).toBeInTheDocument()
  })

  it('has correct aria attributes', () => {
    useTTSStore.setState({
      status: 'playing',
      currentSegmentIndex: 2,
      totalSegments: 10,
      sectionBoundaries: [0, 5],
    })
    render(<ProgressBar />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
  })

  it('handles click-to-seek', () => {
    const jumpToSegment = vi.fn()
    useTTSStore.setState({
      status: 'playing',
      currentSegmentIndex: 0,
      totalSegments: 10,
      sectionBoundaries: [0],
      jumpToSegment,
    } as never)
    render(<ProgressBar />)

    const bar = screen.getByRole('progressbar')
    // Mock getBoundingClientRect
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      right: 200,
      width: 200,
      top: 0,
      bottom: 3,
      height: 3,
      x: 0,
      y: 0,
      toJSON: () => {},
    })

    fireEvent.click(bar, { clientX: 100 }) // 50% of 200px
    expect(jumpToSegment).toHaveBeenCalledWith(5) // 50% of 10
  })
})
