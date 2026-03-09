/**
 * NavDrawer tests — rendering, navigation groups, route highlighting,
 * and drawer open/close behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavDrawer } from '../NavDrawer.tsx'
import { useUIStore } from '../../store/uiStore.ts'

function resetUI() {
  useUIStore.setState({
    navOpen: false,
    infoPanelOpen: true,
    splitView: false,
    collapsedSections: {},
  })
}

function renderDrawer(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavDrawer />
    </MemoryRouter>,
  )
}

describe('NavDrawer', () => {
  beforeEach(resetUI)

  describe('visibility', () => {
    it('renders nothing when navOpen is false', () => {
      const { container } = renderDrawer()
      expect(container.innerHTML).toBe('')
    })

    it('renders navigation when navOpen is true', () => {
      useUIStore.setState({ navOpen: true })
      renderDrawer()
      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
    })
  })

  describe('navigation groups', () => {
    beforeEach(() => {
      useUIStore.setState({ navOpen: true })
    })

    it('renders all group titles', () => {
      renderDrawer()
      expect(screen.getByText('Explore')).toBeInTheDocument()
      expect(screen.getByText('Create')).toBeInTheDocument()
      expect(screen.getByText('Reference')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })

    it('renders all navigation items', () => {
      renderDrawer()
      expect(screen.getByText('Structure Explorer')).toBeInTheDocument()
      expect(screen.getByText('Story Workspace')).toBeInTheDocument()
      expect(screen.getByText('Scene Board')).toBeInTheDocument()
      expect(screen.getByText('Timeline')).toBeInTheDocument()
      expect(screen.getByText('Manuscript')).toBeInTheDocument()
      expect(screen.getByText('Encyclopedia')).toBeInTheDocument()
      expect(screen.getByText('Walkthrough Scripts')).toBeInTheDocument()
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Series')).toBeInTheDocument()
      expect(screen.getByText('Database')).toBeInTheDocument()
    })
  })

  describe('close button', () => {
    it('closes drawer when close button is clicked', () => {
      useUIStore.setState({ navOpen: true })
      renderDrawer()
      const closeBtn = screen.getByLabelText('Close navigation')
      fireEvent.click(closeBtn)
      expect(useUIStore.getState().navOpen).toBe(false)
    })
  })

  describe('backdrop', () => {
    it('closes drawer when backdrop is clicked', () => {
      useUIStore.setState({ navOpen: true })
      const { container } = renderDrawer()
      // Backdrop is the first child div (before the nav element)
      const backdrop = container.querySelector('div > div:first-child')
      expect(backdrop).toBeTruthy()
      fireEvent.click(backdrop!)
      expect(useUIStore.getState().navOpen).toBe(false)
    })
  })

  describe('drawer header', () => {
    it('shows the Story Structure title', () => {
      useUIStore.setState({ navOpen: true })
      renderDrawer()
      expect(screen.getByText('Story Structure')).toBeInTheDocument()
    })
  })
})
