/**
 * Timeline View Store — manages timeline events for the chronology view.
 */

import { create } from 'zustand'
import type { TimelineEvent } from '../types.ts'
import type { StoryBackbone } from '../../generation/artifacts/types.ts'
import type { StoryInstance } from '../../instance/types.ts'

export interface TimelineViewStoreState {
  events: TimelineEvent[]
  selectedEventId: string | null
  showSwimLanes: boolean
  showDependencies: boolean

  selectEvent: (id: string | null) => void
  toggleSwimLanes: () => void
  toggleDependencies: () => void
  populateFromBackbone: (backbone: StoryBackbone) => void
  populateFromInstance: (instance: StoryInstance) => void
  addEvent: (event: TimelineEvent) => void
  updateEvent: (id: string, changes: Partial<TimelineEvent>) => void
  removeEvent: (id: string) => void
  clearTimeline: () => void
}

export const useTimelineViewStore = create<TimelineViewStoreState>((set) => ({
  events: [],
  selectedEventId: null,
  showSwimLanes: false,
  showDependencies: false,

  selectEvent: (id) => set({ selectedEventId: id }),
  toggleSwimLanes: () => set((s) => ({ showSwimLanes: !s.showSwimLanes })),
  toggleDependencies: () => set((s) => ({ showDependencies: !s.showDependencies })),

  populateFromBackbone: (backbone) => {
    const events: TimelineEvent[] = []
    let order = 0

    for (const beat of backbone.beats) {
      for (const scene of beat.scenes) {
        events.push({
          event_id: scene.scene_id,
          title: beat.label,
          description: scene.scene_goal,
          order: order++,
          participants: Object.values(scene.slots)
            .filter((s) => s.category === 'character')
            .map((s) => s.bound_value ?? s.slot_name),
          place: Object.values(scene.slots)
            .find((s) => s.category === 'place')
            ?.bound_value,
        })
      }
    }

    set({ events })
  },

  populateFromInstance: (instance) => {
    const events: TimelineEvent[] = instance.lore.event_log.map((e, i) => ({
      event_id: e.event_id,
      title: e.description.slice(0, 60),
      description: e.description,
      order: i,
      participants: e.participants,
      episode_id: e.episode_id,
    }))

    // Also add thread introductions as events
    for (const thread of instance.lore.plot_threads) {
      events.push({
        event_id: `thread_${thread.id}`,
        title: `Thread: ${thread.title}`,
        description: thread.description,
        order: events.length,
        participants: thread.related_characters,
        subplot: thread.title,
      })
    }

    set({ events: events.sort((a, b) => a.order - b.order) })
  },

  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),

  updateEvent: (id, changes) => set((s) => ({
    events: s.events.map((e) => (e.event_id === id ? { ...e, ...changes } : e)),
  })),

  removeEvent: (id) => set((s) => ({
    events: s.events.filter((e) => e.event_id !== id),
    selectedEventId: s.selectedEventId === id ? null : s.selectedEventId,
  })),

  clearTimeline: () => set({ events: [], selectedEventId: null }),
}))
