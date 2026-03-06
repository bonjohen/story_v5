/**
 * Workspace Store — persists open tabs, panel states, and last-visited section.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkspaceState {
  lastSection: string
  storyTab: string
  sceneBoardLane: string
  timelineShowSwimLanes: boolean
  timelineShowDependencies: boolean
  manuscriptShowDiff: boolean
  encyclopediaCategory: string | null
  notesFilterTag: string | null

  setLastSection: (section: string) => void
  setStoryTab: (tab: string) => void
  setSceneBoardLane: (lane: string) => void
  setTimelineShowSwimLanes: (v: boolean) => void
  setTimelineShowDependencies: (v: boolean) => void
  setManuscriptShowDiff: (v: boolean) => void
  setEncyclopediaCategory: (cat: string | null) => void
  setNotesFilterTag: (tag: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      lastSection: '/',
      storyTab: 'characters',
      sceneBoardLane: 'chapter',
      timelineShowSwimLanes: false,
      timelineShowDependencies: false,
      manuscriptShowDiff: false,
      encyclopediaCategory: null,
      notesFilterTag: null,

      setLastSection: (section) => set({ lastSection: section }),
      setStoryTab: (tab) => set({ storyTab: tab }),
      setSceneBoardLane: (lane) => set({ sceneBoardLane: lane }),
      setTimelineShowSwimLanes: (v) => set({ timelineShowSwimLanes: v }),
      setTimelineShowDependencies: (v) => set({ timelineShowDependencies: v }),
      setManuscriptShowDiff: (v) => set({ manuscriptShowDiff: v }),
      setEncyclopediaCategory: (cat) => set({ encyclopediaCategory: cat }),
      setNotesFilterTag: (tag) => set({ notesFilterTag: tag }),
    }),
    {
      name: 'story-workspace-state',
    },
  ),
)
