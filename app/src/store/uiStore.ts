/**
 * UI preferences store — persists layout state across sessions.
 * Controls navigation drawer, generation panel, info panel, and section collapse state.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UIStoreState {
  // Navigation drawer
  navOpen: boolean
  toggleNav: () => void
  setNavOpen: (v: boolean) => void

  // Generation panel (left sidebar)
  genPanelOpen: boolean
  toggleGenPanel: () => void

  // Info panel (top)
  infoPanelOpen: boolean
  toggleInfoPanel: () => void

  // Graph view mode
  splitView: boolean
  toggleSplitView: () => void

  // Collapsed sections — keyed by section ID
  collapsedSections: Record<string, boolean>
  toggleSection: (id: string) => void
  isSectionCollapsed: (id: string) => boolean
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      navOpen: false,
      toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),
      setNavOpen: (v) => set({ navOpen: v }),

      genPanelOpen: true,
      toggleGenPanel: () => set((s) => ({ genPanelOpen: !s.genPanelOpen })),

      infoPanelOpen: true,
      toggleInfoPanel: () => set((s) => ({ infoPanelOpen: !s.infoPanelOpen })),

      splitView: false,
      toggleSplitView: () => set((s) => ({ splitView: !s.splitView })),

      collapsedSections: {},
      toggleSection: (id) =>
        set((s) => ({
          collapsedSections: {
            ...s.collapsedSections,
            [id]: !s.collapsedSections[id],
          },
        })),
      isSectionCollapsed: (id) => !!get().collapsedSections[id],
    }),
    {
      name: 'story-ui-prefs',
      partialize: (state) => ({
        genPanelOpen: state.genPanelOpen,
        infoPanelOpen: state.infoPanelOpen,
        splitView: state.splitView,
        collapsedSections: state.collapsedSections,
      }),
    },
  ),
)
