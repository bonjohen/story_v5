/**
 * Scene Board Store — manages scene cards populated from generation pipeline.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SceneCard, SceneStatus, LaneMode } from '../types.ts'
import type { StoryBackbone, StoryPlan } from '../../generation/artifacts/types.ts'

export interface SceneBoardStoreState {
  cards: SceneCard[]
  laneMode: LaneMode
  filterCharacter: string | null
  filterLocation: string | null
  filterStatus: SceneStatus | null
  selectedCardId: string | null

  // Actions
  setLaneMode: (mode: LaneMode) => void
  setFilterCharacter: (character: string | null) => void
  setFilterLocation: (location: string | null) => void
  setFilterStatus: (status: SceneStatus | null) => void
  selectCard: (id: string | null) => void
  updateCard: (id: string, changes: Partial<SceneCard>) => void
  reorderCard: (id: string, newPosition: number) => void
  populateFromBackbone: (backbone: StoryBackbone) => void
  populateFromPlan: (plan: StoryPlan) => void
  clearBoard: () => void
}

export const useSceneBoardStore = create<SceneBoardStoreState>()(persist((set) => ({
  cards: [],
  laneMode: 'chapter',
  filterCharacter: null,
  filterLocation: null,
  filterStatus: null,
  selectedCardId: null,

  setLaneMode: (mode) => set({ laneMode: mode }),
  setFilterCharacter: (character) => set({ filterCharacter: character }),
  setFilterLocation: (location) => set({ filterLocation: location }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  selectCard: (id) => set({ selectedCardId: id }),

  updateCard: (id, changes) => {
    set((s) => ({
      cards: s.cards.map((c) => (c.scene_id === id ? { ...c, ...changes } : c)),
    }))
  },

  reorderCard: (id, newPosition) => {
    set((s) => {
      const cards = [...s.cards]
      const idx = cards.findIndex((c) => c.scene_id === id)
      if (idx === -1) return s
      const [card] = cards.splice(idx, 1)
      card.position = newPosition
      cards.splice(newPosition, 0, card)
      // Renumber positions
      cards.forEach((c, i) => { c.position = i })
      return { cards }
    })
  },

  populateFromBackbone: (backbone) => {
    const cards: SceneCard[] = []
    let position = 0

    // Build chapter lookup
    const beatToChapter = new Map<string, { id: string; title?: string }>()
    for (const ch of backbone.chapter_partition) {
      for (const beatId of ch.beat_ids) {
        beatToChapter.set(beatId, { id: ch.chapter_id, title: ch.title })
      }
    }

    for (const beat of backbone.beats) {
      for (const scene of beat.scenes) {
        const chapter = beatToChapter.get(beat.beat_id)
        cards.push({
          scene_id: scene.scene_id,
          beat_id: beat.beat_id,
          title: beat.label,
          synopsis: scene.scene_goal,
          archetype_node_id: beat.archetype_node_id,
          archetype_label: beat.label,
          archetype_role: beat.role,
          genre_obligations: scene.genre_obligations.map((o) => ({
            node_id: o.node_id,
            label: o.label,
            severity: o.severity,
            met: false,
          })),
          characters: [],
          setting: '',
          status: 'draft',
          chapter_id: chapter?.id,
          chapter_title: chapter?.title,
          position: position++,
        })
      }
    }

    set({ cards })
  },

  populateFromPlan: (plan) => {
    // Build a beat lookup for summaries
    const beatMap = new Map(plan.beats.map((b) => [b.beat_id, b]))

    const cards: SceneCard[] = plan.scenes.map((scene, i) => {
      const beat = beatMap.get(scene.beat_id)
      return {
        scene_id: scene.scene_id,
        beat_id: scene.beat_id,
        title: beat?.summary?.slice(0, 50) ?? scene.scene_goal.slice(0, 40),
        synopsis: scene.scene_goal,
        archetype_node_id: scene.archetype_trace.node_id,
        archetype_label: beat?.summary,
        genre_obligations: scene.genre_obligations.map((o) => ({
          node_id: o.node_id,
          severity: o.severity,
          met: false,
        })),
        characters: scene.characters,
        setting: scene.setting,
        status: 'draft' as const,
        position: i,
      }
    })

    set({ cards })
  },

  clearBoard: () => set({ cards: [], selectedCardId: null }),
}), {
  name: 'story-sceneboard-store',
  partialize: (state) => ({
    cards: state.cards,
    laneMode: state.laneMode,
    selectedCardId: state.selectedCardId,
  }),
}))
