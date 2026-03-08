/**
 * Zustand store for story generation request parameters.
 * Persists form values across tab switches and re-renders.
 * The GenerationPanel reads/writes from here instead of local useState.
 *
 * Also manages the bridge adapter lifecycle so connection state
 * survives GenerationPanel mount/unmount cycles (e.g. toggling the panel).
 */

import { create } from 'zustand'
import { BridgeAdapter } from '../bridge/bridgeAdapter.ts'
import type { GenerationMode } from '../artifacts/types.ts'

export type LlmBackend = 'none' | 'bridge'
export type BridgeStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface RequestStoreState {
  // Core selections
  premise: string
  archetype: string
  genre: string
  mode: GenerationMode
  tone: string
  llmBackend: LlmBackend
  bridgeUrl: string
  maxLlmCalls: number

  // Bridge connection — lives in store so it survives panel unmount
  bridgeStatus: BridgeStatus
  bridgeAdapter: BridgeAdapter | null

  // Slot overrides — user-edited values for template slots
  // Keyed by slot_name, value is the user's override (empty string = use default)
  slotOverrides: Record<string, string>

  // Actions
  setPremise: (v: string) => void
  setArchetype: (v: string) => void
  setGenre: (v: string) => void
  setMode: (v: GenerationMode) => void
  setTone: (v: string) => void
  setLlmBackend: (v: LlmBackend) => void
  setBridgeUrl: (v: string) => void
  setMaxLlmCalls: (v: number) => void
  setSlotOverride: (slotName: string, value: string) => void
  clearSlotOverrides: () => void
  connectBridge: () => Promise<void>
  disconnectBridge: () => void
}

export const useRequestStore = create<RequestStoreState>((set, get) => ({
  premise: 'A young engineer discovers that her space station\'s AI has developed consciousness and must decide whether to report it or protect it.',
  archetype: 'The Hero\'s Journey',
  genre: 'Science Fiction',
  mode: 'detailed-outline',
  tone: 'somber',
  llmBackend: 'none',
  bridgeUrl: 'ws://127.0.0.1:8765',
  maxLlmCalls: 20,
  bridgeStatus: 'disconnected',
  bridgeAdapter: null,
  slotOverrides: {},

  setPremise: (v) => set({ premise: v }),
  setArchetype: (v) => set({ archetype: v }),
  setGenre: (v) => set({ genre: v }),
  setMode: (v) => set({ mode: v }),
  setTone: (v) => set({ tone: v }),
  setLlmBackend: (v) => set({ llmBackend: v }),
  setBridgeUrl: (v) => set({ bridgeUrl: v }),
  setMaxLlmCalls: (v) => set({ maxLlmCalls: Math.max(1, Math.min(100, v)) }),
  setSlotOverride: (slotName, value) =>
    set((s) => ({ slotOverrides: { ...s.slotOverrides, [slotName]: value } })),
  clearSlotOverrides: () => set({ slotOverrides: {} }),

  connectBridge: async () => {
    const { bridgeStatus, bridgeUrl } = get()
    if (bridgeStatus === 'connected') return
    set({ llmBackend: 'bridge', bridgeStatus: 'connecting' })
    const adapter = new BridgeAdapter({ url: bridgeUrl })
    try {
      await adapter.connect()
      set({ bridgeAdapter: adapter, bridgeStatus: 'connected' })
    } catch {
      set({ bridgeAdapter: null, bridgeStatus: 'error' })
    }
  },

  disconnectBridge: () => {
    const { bridgeAdapter } = get()
    if (bridgeAdapter) bridgeAdapter.disconnect()
    set({ bridgeAdapter: null, bridgeStatus: 'disconnected' })
  },
}))
