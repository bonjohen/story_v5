/**
 * Zustand store for story generation request parameters.
 * Persists form values across tab switches and re-renders.
 * The generation tabs read/write from here instead of local useState.
 *
 * Manages LLM adapter lifecycle — supports:
 *   - Bridge (WebSocket to local Claude Code bridge server)
 *   - OpenAI-compatible (direct fetch to Ollama, OpenRouter, LM Studio, etc.)
 *   - None (deterministic template output only)
 */

import { create } from 'zustand'
import { BridgeAdapter } from '../bridge/bridgeAdapter.ts'
import { OpenAICompatibleAdapter } from '../agents/openaiCompatibleAdapter.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import type { GenerationMode, StoryProjectRequest } from '../artifacts/types.ts'

export type LlmBackend = 'none' | 'bridge' | 'openai'
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

  // OpenAI-compatible settings
  openaiBaseUrl: string
  openaiModel: string
  openaiApiKey: string

  // Connection state — lives in store so it survives panel unmount
  bridgeStatus: BridgeStatus
  bridgeAdapter: LLMAdapter | null

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
  setOpenaiBaseUrl: (v: string) => void
  setOpenaiModel: (v: string) => void
  setOpenaiApiKey: (v: string) => void
  setSlotOverride: (slotName: string, value: string) => void
  clearSlotOverrides: () => void
  connectBridge: () => Promise<void>
  disconnectBridge: () => void
  loadFromProject: (req: StoryProjectRequest) => void
}

export const useRequestStore = create<RequestStoreState>((set, get) => ({
  premise: '',
  archetype: 'The Hero\'s Journey',
  genre: 'Drama',
  mode: 'detailed-outline',
  tone: '',
  llmBackend: 'openai' as LlmBackend,
  bridgeUrl: 'ws://127.0.0.1:8765',
  maxLlmCalls: 20,
  openaiBaseUrl: 'http://localhost:11434/v1',
  openaiModel: 'llama3:8b-instruct-q8_0',
  openaiApiKey: '',
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
  setOpenaiBaseUrl: (v) => set({ openaiBaseUrl: v }),
  setOpenaiModel: (v) => set({ openaiModel: v }),
  setOpenaiApiKey: (v) => set({ openaiApiKey: v }),
  setSlotOverride: (slotName, value) =>
    set((s) => ({ slotOverrides: { ...s.slotOverrides, [slotName]: value } })),
  clearSlotOverrides: () => set({ slotOverrides: {} }),

  connectBridge: async () => {
    const state = get()
    const { bridgeStatus, llmBackend } = state

    if (bridgeStatus === 'connected') {
      // Ensure llmBackend is set even if already connected
      if (llmBackend === 'none') set({ llmBackend: 'openai' })
      return
    }

    const backend = llmBackend === 'none' ? 'openai' : llmBackend
    set({ llmBackend: backend, bridgeStatus: 'connecting' })

    try {
      if (backend === 'openai') {
        // Direct fetch adapter — no connection needed, just validate URL
        const { openaiBaseUrl, openaiModel, openaiApiKey } = state
        const adapter = new OpenAICompatibleAdapter({
          baseUrl: openaiBaseUrl,
          model: openaiModel,
          apiKey: openaiApiKey || undefined,
        })
        set({ bridgeAdapter: adapter, bridgeStatus: 'connected' })
      } else {
        // WebSocket bridge to Claude Code CLI
        const adapter = new BridgeAdapter({ url: state.bridgeUrl })
        await adapter.connect()
        set({ bridgeAdapter: adapter, bridgeStatus: 'connected' })
      }
    } catch {
      set({ bridgeAdapter: null, bridgeStatus: 'error' })
    }
  },

  disconnectBridge: () => {
    const { bridgeAdapter } = get()
    if (bridgeAdapter && 'disconnect' in bridgeAdapter) {
      (bridgeAdapter as BridgeAdapter).disconnect()
    }
    set({ bridgeAdapter: null, bridgeStatus: 'disconnected' })
  },

  loadFromProject: (req) => set({
    premise: req.premise,
    archetype: req.archetype,
    genre: req.genre,
    tone: req.tone,
    llmBackend: req.llmBackend,
    bridgeUrl: req.bridgeUrl,
    maxLlmCalls: req.maxLlmCalls,
    openaiBaseUrl: req.openaiBaseUrl,
    openaiModel: req.openaiModel,
  }),
}))
