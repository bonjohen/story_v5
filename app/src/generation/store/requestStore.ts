/**
 * Zustand store for story generation request parameters.
 * Persists form values across tab switches and re-renders.
 * The GenerationPanel reads/writes from here instead of local useState.
 */

import { create } from 'zustand'
import type { GenerationMode } from '../artifacts/types.ts'

export interface RequestStoreState {
  // Core selections
  premise: string
  archetype: string
  genre: string
  mode: GenerationMode
  tone: string

  // Composition
  allowBlend: boolean
  blendGenre: string
  allowHybrid: boolean
  hybridArchetype: string

  // Slot overrides — user-edited values for template slots
  // Keyed by slot_name, value is the user's override (empty string = use default)
  slotOverrides: Record<string, string>

  // Actions
  setPremise: (v: string) => void
  setArchetype: (v: string) => void
  setGenre: (v: string) => void
  setMode: (v: GenerationMode) => void
  setTone: (v: string) => void
  setAllowBlend: (v: boolean) => void
  setBlendGenre: (v: string) => void
  setAllowHybrid: (v: boolean) => void
  setHybridArchetype: (v: string) => void
  setSlotOverride: (slotName: string, value: string) => void
  clearSlotOverrides: () => void
}

export const useRequestStore = create<RequestStoreState>((set) => ({
  premise: 'A young engineer discovers that her space station\'s AI has developed consciousness and must decide whether to report it or protect it.',
  archetype: 'The Hero\'s Journey',
  genre: 'Science Fiction',
  mode: 'draft',
  tone: 'somber',
  allowBlend: false,
  blendGenre: '',
  allowHybrid: false,
  hybridArchetype: '',
  slotOverrides: {},

  setPremise: (v) => set({ premise: v }),
  setArchetype: (v) => set({ archetype: v }),
  setGenre: (v) => set({ genre: v }),
  setMode: (v) => set({ mode: v }),
  setTone: (v) => set({ tone: v }),
  setAllowBlend: (v) => set({ allowBlend: v, ...(v ? {} : { blendGenre: '' }) }),
  setBlendGenre: (v) => set({ blendGenre: v }),
  setAllowHybrid: (v) => set({ allowHybrid: v, ...(v ? {} : { hybridArchetype: '' }) }),
  setHybridArchetype: (v) => set({ hybridArchetype: v }),
  setSlotOverride: (slotName, value) =>
    set((s) => ({ slotOverrides: { ...s.slotOverrides, [slotName]: value } })),
  clearSlotOverrides: () => set({ slotOverrides: {} }),
}))
