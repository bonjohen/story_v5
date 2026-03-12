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

  // Info panel (top)
  infoPanelOpen: boolean
  toggleInfoPanel: () => void

  // Graph view mode
  splitView: boolean
  toggleSplitView: () => void

  // Collapsed sections — keyed by section ID
  collapsedSections: Record<string, boolean>
  toggleSection: (id: string) => void
  setSection: (id: string, collapsed: boolean) => void
  isSectionCollapsed: (id: string) => boolean

  // Lock switches — prevent edits to Setup / Elements tabs
  setupLocked: boolean
  elementsLocked: boolean
  toggleSetupLock: () => void
  toggleElementsLock: () => void

  // LLM Connection dialog
  llmDialogOpen: boolean
  setLlmDialogOpen: (v: boolean) => void
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set, get) => ({
      navOpen: false,
      toggleNav: () => set((s) => ({ navOpen: !s.navOpen })),
      setNavOpen: (v) => set({ navOpen: v }),

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
      setSection: (id, collapsed) =>
        set((s) => ({
          collapsedSections: {
            ...s.collapsedSections,
            [id]: collapsed,
          },
        })),
      isSectionCollapsed: (id) => !!get().collapsedSections[id],

      setupLocked: false,
      elementsLocked: false,
      toggleSetupLock: () => set((s) => ({ setupLocked: !s.setupLocked })),
      toggleElementsLock: () => set((s) => ({ elementsLocked: !s.elementsLocked })),

      llmDialogOpen: false,
      setLlmDialogOpen: (v) => set({ llmDialogOpen: v }),
    }),
    {
      name: 'story-ui-prefs',
      partialize: (state) => ({
        infoPanelOpen: state.infoPanelOpen,
        splitView: state.splitView,
        // collapsedSections intentionally NOT persisted — each load starts with defaults
        // (top section expanded, rest collapsed per tab)
        // setupLocked and elementsLocked intentionally NOT persisted — always unlocked on load
      }),
    },
  ),
)
