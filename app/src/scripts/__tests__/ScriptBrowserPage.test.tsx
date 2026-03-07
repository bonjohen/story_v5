import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useScriptStore } from '../store/scriptStore.ts'
import { ScriptBrowserPage } from '../pages/ScriptBrowserPage.tsx'
import type { ScriptMeta } from '../types.ts'


const mockScripts: ScriptMeta[] = [
  { slug: 'file_tour_script', title: 'Repository File Tour', subtitle: 'Guide to files', estimatedMinutes: 12 },
  { slug: 'walkthrough_script', title: 'Story Generation Walkthrough', subtitle: 'Generation pipeline', estimatedMinutes: 8 },
]

const noop = vi.fn()

beforeEach(() => {
  useScriptStore.setState({
    scripts: [],
    currentScript: null,
    loading: false,
    error: null,
    loadManifest: noop,
  } as never)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scripts']}>
      <ScriptBrowserPage />
    </MemoryRouter>,
  )
}

describe('ScriptBrowserPage', () => {
  it('renders the page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Walkthrough Scripts' })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    useScriptStore.setState({ loading: true })
    renderPage()
    expect(screen.getByText('Loading scripts...')).toBeInTheDocument()
  })

  it('shows error with retry', () => {
    useScriptStore.setState({ error: 'Network error' })
    renderPage()
    expect(screen.getByText('Network error')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('renders script cards from store', () => {
    useScriptStore.setState({ scripts: mockScripts })
    renderPage()
    expect(screen.getByText('Repository File Tour')).toBeInTheDocument()
    expect(screen.getByText('Story Generation Walkthrough')).toBeInTheDocument()
    expect(screen.getByText('~12 min listen')).toBeInTheDocument()
  })

  it('filters scripts by title', () => {
    useScriptStore.setState({ scripts: mockScripts })
    renderPage()

    const input = screen.getByPlaceholderText('Filter scripts...')
    fireEvent.change(input, { target: { value: 'walkthrough' } })

    expect(screen.getByText('Story Generation Walkthrough')).toBeInTheDocument()
    expect(screen.queryByText('Repository File Tour')).not.toBeInTheDocument()
  })

  it('shows empty filter message', () => {
    useScriptStore.setState({ scripts: mockScripts })
    renderPage()

    const input = screen.getByPlaceholderText('Filter scripts...')
    fireEvent.change(input, { target: { value: 'zzzzz' } })

    expect(screen.getByText(/No scripts match/)).toBeInTheDocument()
  })

  it('calls loadManifest on mount', () => {
    const loadManifest = vi.fn()
    useScriptStore.setState({ loadManifest } as never)
    renderPage()
    expect(loadManifest).toHaveBeenCalled()
  })
})
