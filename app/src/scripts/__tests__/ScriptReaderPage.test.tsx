import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useScriptStore } from '../store/scriptStore.ts'
import { ScriptReaderPage } from '../pages/ScriptReaderPage.tsx'
import type { ParsedScript } from '../types.ts'

// Mock speechSynthesis for jsdom
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
  meta: { slug: 'test_script', title: 'Test Script', subtitle: 'A test', estimatedMinutes: 5 },
  sections: [
    {
      heading: 'Introduction',
      level: 1,
      paragraphs: [
        { text: 'First paragraph.', index: 0 },
        { text: 'Second paragraph.', index: 1 },
      ],
    },
  ],
  html: '<h1>Introduction</h1><p data-paragraph-index="0">First paragraph.</p><p data-paragraph-index="1">Second paragraph.</p>',
  totalParagraphs: 2,
}

const noop = vi.fn()

beforeEach(() => {
  useScriptStore.setState({
    scripts: [mockScript.meta],
    currentScript: null,
    loading: false,
    error: null,
    // Prevent loadScript from clearing our test state
    loadScript: noop,
  } as never)
})

function renderPage(slug = 'test_script') {
  return render(
    <MemoryRouter initialEntries={[`/scripts/${slug}`]}>
      <Routes>
        <Route path="/scripts/:slug" element={<ScriptReaderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ScriptReaderPage', () => {
  it('shows loading state', () => {
    useScriptStore.setState({ loading: true })
    renderPage()
    expect(screen.getByText('Loading script...')).toBeInTheDocument()
  })

  it('shows error with back button', () => {
    useScriptStore.setState({ error: 'Script not found: bad_slug' })
    renderPage()
    expect(screen.getByText('Script not found: bad_slug')).toBeInTheDocument()
    expect(screen.getByText('Back to scripts')).toBeInTheDocument()
  })

  it('renders script content when loaded', () => {
    useScriptStore.setState({ currentScript: mockScript })
    renderPage()
    expect(screen.getByText('First paragraph.')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
  })

  it('shows script title in toolbar breadcrumb', () => {
    useScriptStore.setState({ currentScript: mockScript })
    renderPage()
    expect(screen.getByText('Test Script')).toBeInTheDocument()
  })

  it('renders TTS play button', () => {
    useScriptStore.setState({ currentScript: mockScript })
    renderPage()
    // The play button has aria-label "Play"
    expect(screen.getByLabelText('Play')).toBeInTheDocument()
  })
})
