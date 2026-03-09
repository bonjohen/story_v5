/**
 * AppShellBar tests — rendering, hamburger menu toggle, title display,
 * and children slot.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShellBar } from '../AppShell.tsx'
import { useUIStore } from '../../store/uiStore.ts'

function resetUI() {
  useUIStore.setState({
    navOpen: false,
    genPanelOpen: true,
    infoPanelOpen: true,
    splitView: false,
    collapsedSections: {},
  })
}

function renderShell(props?: { title?: string; children?: React.ReactNode }) {
  return render(
    <MemoryRouter>
      <AppShellBar {...props} />
    </MemoryRouter>,
  )
}

describe('AppShellBar', () => {
  beforeEach(resetUI)

  describe('rendering', () => {
    it('renders with default title', () => {
      renderShell()
      expect(screen.getByText('Story Structure Explorer')).toBeInTheDocument()
    })

    it('renders with custom title', () => {
      renderShell({ title: 'My Custom Page' })
      expect(screen.getByText('My Custom Page')).toBeInTheDocument()
    })

    it('renders as a header element', () => {
      renderShell()
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  describe('hamburger menu', () => {
    it('renders the menu button', () => {
      renderShell()
      expect(screen.getByLabelText('Open navigation')).toBeInTheDocument()
    })

    it('toggles navOpen on click', () => {
      renderShell()
      const menuBtn = screen.getByLabelText('Open navigation')
      expect(useUIStore.getState().navOpen).toBe(false)

      fireEvent.click(menuBtn)
      expect(useUIStore.getState().navOpen).toBe(true)

      fireEvent.click(menuBtn)
      expect(useUIStore.getState().navOpen).toBe(false)
    })
  })

  describe('children slot', () => {
    it('renders children in the bar', () => {
      renderShell({
        children: <button data-testid="custom-btn">Custom</button>,
      })
      expect(screen.getByTestId('custom-btn')).toBeInTheDocument()
    })
  })
})
