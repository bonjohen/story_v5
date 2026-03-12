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
import { persist } from 'zustand/middleware'
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
  narrativeVoice: string
  workingTitle: string
  llmBackend: LlmBackend
  bridgeUrl: string
  maxLlmCalls: number

  // OpenAI-compatible settings
  openaiBaseUrl: string
  openaiModel: string
  openaiApiKey: string
  /** Optional faster model for planning calls (beat summaries, scene goals, validation). */
  openaiPlanningModel: string

  // Performance optimization flags
  /** Skip validation/repair cycle — saves ~72 LLM calls per run. */
  skipValidation: boolean
  /** Enable all fast-draft optimizations at once. */
  fastDraft: boolean

  // Connection state — lives in store so it survives panel unmount
  bridgeStatus: BridgeStatus
  bridgeAdapter: LLMAdapter | null

  // Slot overrides — user-edited values for template slots
  // Keyed by slot_name, value is the user's override (empty string = use default)
  slotOverrides: Record<string, string>

  // Hello test — response from a quick "Hello" probe sent to the LLM
  helloResponse: string | null
  helloLoading: boolean
  // Last connection/LLM error message (surfaced in UI)
  bridgeError: string | null

  // Actions
  setPremise: (v: string) => void
  setArchetype: (v: string) => void
  setGenre: (v: string) => void
  setMode: (v: GenerationMode) => void
  setTone: (v: string) => void
  setNarrativeVoice: (v: string) => void
  setWorkingTitle: (v: string) => void
  setLlmBackend: (v: LlmBackend) => void
  setBridgeUrl: (v: string) => void
  setMaxLlmCalls: (v: number) => void
  setOpenaiBaseUrl: (v: string) => void
  setOpenaiModel: (v: string) => void
  setOpenaiApiKey: (v: string) => void
  setOpenaiPlanningModel: (v: string) => void
  setSkipValidation: (v: boolean) => void
  setFastDraft: (v: boolean) => void
  setSlotOverride: (slotName: string, value: string) => void
  clearSlotOverrides: () => void
  connectBridge: () => Promise<void>
  disconnectBridge: () => void
  sendHello: () => Promise<void>
  loadFromProject: (req: StoryProjectRequest) => void
}

export const useRequestStore = create<RequestStoreState>()(persist((set, get) => ({
  premise: '',
  archetype: '',
  genre: '',
  mode: 'detailed-outline',
  tone: '',
  narrativeVoice: '',
  workingTitle: '',
  llmBackend: 'openai' as LlmBackend,
  bridgeUrl: 'ws://127.0.0.1:8765',
  maxLlmCalls: 20,
  openaiBaseUrl: 'http://localhost:11434/v1',
  openaiModel: 'llama3-8k',
  openaiApiKey: '',
  openaiPlanningModel: 'deepseek-r1:1.5b',
  skipValidation: false,
  fastDraft: false,
  bridgeStatus: 'disconnected',
  bridgeAdapter: null,
  slotOverrides: {},
  helloResponse: null,
  helloLoading: false,
  bridgeError: null,

  setPremise: (v) => set({ premise: v }),
  setArchetype: (v) => set({ archetype: v }),
  setGenre: (v) => set({ genre: v }),
  setMode: (v) => set({ mode: v }),
  setTone: (v) => set({ tone: v }),
  setNarrativeVoice: (v) => set({ narrativeVoice: v }),
  setWorkingTitle: (v) => set({ workingTitle: v }),
  setLlmBackend: (v) => set({ llmBackend: v }),
  setBridgeUrl: (v) => set({ bridgeUrl: v }),
  setMaxLlmCalls: (v) => set({ maxLlmCalls: Math.max(1, Math.min(100, v)) }),
  setOpenaiBaseUrl: (v) => set({ openaiBaseUrl: v }),
  setOpenaiModel: (v) => set({ openaiModel: v }),
  setOpenaiApiKey: (v) => set({ openaiApiKey: v }),
  setOpenaiPlanningModel: (v) => set({ openaiPlanningModel: v }),
  setSkipValidation: (v) => set({ skipValidation: v }),
  setFastDraft: (v) => set({ fastDraft: v }),
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
    set({ llmBackend: backend, bridgeStatus: 'connecting', helloResponse: null, helloLoading: true, bridgeError: null })

    try {
      let adapter: LLMAdapter
      if (backend === 'openai') {
        const { openaiBaseUrl, openaiModel, openaiApiKey } = state
        adapter = new OpenAICompatibleAdapter({
          baseUrl: openaiBaseUrl,
          model: openaiModel,
          apiKey: openaiApiKey || undefined,
        })
      } else {
        const bridgeAdapter = new BridgeAdapter({ url: state.bridgeUrl })
        await bridgeAdapter.connect()
        adapter = bridgeAdapter
      }

      // Verify the LLM responds before marking as connected
      const response = await adapter.complete([{ role: 'user', content: 'Hello' }])
      const reply = response.content.trim().slice(0, 200)
      set({ bridgeAdapter: adapter, bridgeStatus: 'connected', helloResponse: reply, helloLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set({ bridgeAdapter: null, bridgeStatus: 'error', helloResponse: null, helloLoading: false, bridgeError: msg })
    }
  },

  disconnectBridge: () => {
    const { bridgeAdapter } = get()
    if (bridgeAdapter && 'disconnect' in bridgeAdapter) {
      (bridgeAdapter as BridgeAdapter).disconnect()
    }
    set({ bridgeAdapter: null, bridgeStatus: 'disconnected', helloResponse: null, bridgeError: null })
  },

  sendHello: async () => {
    const { bridgeAdapter, bridgeStatus } = get()
    if (bridgeStatus !== 'connected' || !bridgeAdapter) return
    set({ helloLoading: true, helloResponse: null, bridgeError: null })
    try {
      const response = await bridgeAdapter.complete([{ role: 'user', content: 'Hello' }])
      set({ helloResponse: response.content.trim().slice(0, 200), helloLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set({ helloResponse: null, helloLoading: false, bridgeError: msg })
    }
  },

  loadFromProject: (req) => set({
    premise: req.premise,
    archetype: req.archetype,
    genre: req.genre,
    tone: req.tone,
    narrativeVoice: req.narrativeVoice ?? '',
    workingTitle: req.workingTitle ?? '',
    llmBackend: req.llmBackend,
    bridgeUrl: req.bridgeUrl,
    maxLlmCalls: req.maxLlmCalls,
    openaiBaseUrl: req.openaiBaseUrl,
    openaiModel: req.openaiModel,
    skipValidation: req.skipValidation ?? false,
    fastDraft: req.fastDraft ?? false,
    openaiPlanningModel: req.openaiPlanningModel ?? '',
    slotOverrides: req.slotOverrides ?? {},
    mode: req.mode ?? 'detailed-outline',
  }),
}), {
  name: 'story-request-store',
  version: 3,
  partialize: (state) => ({
    // Only persist LLM connection settings — story content fields reset on refresh
    llmBackend: state.llmBackend,
    bridgeUrl: state.bridgeUrl,
    maxLlmCalls: state.maxLlmCalls,
    openaiBaseUrl: state.openaiBaseUrl,
    openaiModel: state.openaiModel,
    openaiPlanningModel: state.openaiPlanningModel,
    skipValidation: state.skipValidation,
    fastDraft: state.fastDraft,
  }),
}))
