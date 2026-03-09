/**
 * UIStore tests — navigation state, panel toggles, section collapse,
 * and persistence behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../uiStore.ts'

function getState() {
  return useUIStore.getState()
}

function reset() {
  useUIStore.setState({
    navOpen: false,

    infoPanelOpen: true,
    splitView: false,
    collapsedSections: {},
  })
}

describe('uiStore', () => {
  beforeEach(reset)

  describe('initial state', () => {
    it('nav drawer starts closed', () => {
      expect(getState().navOpen).toBe(false)
    })

    it('info panel starts open', () => {
      expect(getState().infoPanelOpen).toBe(true)
    })

    it('split view starts off', () => {
      expect(getState().splitView).toBe(false)
    })

    it('no sections collapsed initially', () => {
      expect(getState().collapsedSections).toEqual({})
    })
  })

  describe('toggleNav', () => {
    it('opens the nav drawer', () => {
      getState().toggleNav()
      expect(getState().navOpen).toBe(true)
    })

    it('closes the nav drawer on second toggle', () => {
      getState().toggleNav()
      getState().toggleNav()
      expect(getState().navOpen).toBe(false)
    })
  })

  describe('setNavOpen', () => {
    it('explicitly opens the drawer', () => {
      getState().setNavOpen(true)
      expect(getState().navOpen).toBe(true)
    })

    it('explicitly closes the drawer', () => {
      getState().setNavOpen(true)
      getState().setNavOpen(false)
      expect(getState().navOpen).toBe(false)
    })
  })

  describe('toggleInfoPanel', () => {
    it('closes the info panel', () => {
      getState().toggleInfoPanel()
      expect(getState().infoPanelOpen).toBe(false)
    })

    it('reopens the info panel', () => {
      getState().toggleInfoPanel()
      getState().toggleInfoPanel()
      expect(getState().infoPanelOpen).toBe(true)
    })
  })

  describe('toggleSplitView', () => {
    it('enables split view', () => {
      getState().toggleSplitView()
      expect(getState().splitView).toBe(true)
    })

    it('disables split view on second toggle', () => {
      getState().toggleSplitView()
      getState().toggleSplitView()
      expect(getState().splitView).toBe(false)
    })
  })

  describe('collapsedSections', () => {
    it('collapses a section by ID', () => {
      getState().toggleSection('info-stats')
      expect(getState().collapsedSections['info-stats']).toBe(true)
      expect(getState().isSectionCollapsed('info-stats')).toBe(true)
    })

    it('expands a collapsed section', () => {
      getState().toggleSection('info-stats')
      getState().toggleSection('info-stats')
      expect(getState().collapsedSections['info-stats']).toBe(false)
      expect(getState().isSectionCollapsed('info-stats')).toBe(false)
    })

    it('tracks multiple sections independently', () => {
      getState().toggleSection('info-stats')
      getState().toggleSection('info-elements')
      expect(getState().isSectionCollapsed('info-stats')).toBe(true)
      expect(getState().isSectionCollapsed('info-elements')).toBe(true)

      getState().toggleSection('info-stats')
      expect(getState().isSectionCollapsed('info-stats')).toBe(false)
      expect(getState().isSectionCollapsed('info-elements')).toBe(true)
    })

    it('returns false for unknown section IDs', () => {
      expect(getState().isSectionCollapsed('nonexistent')).toBe(false)
    })
  })

  describe('state independence', () => {
    it('toggling one panel does not affect others', () => {
      getState().toggleInfoPanel()
      expect(getState().infoPanelOpen).toBe(false)
      expect(getState().splitView).toBe(false)
      expect(getState().navOpen).toBe(false)
    })

    it('opening nav does not affect panels', () => {
      getState().toggleNav()
      expect(getState().navOpen).toBe(true)
      expect(getState().infoPanelOpen).toBe(true)
    })
  })
})
