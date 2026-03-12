/**
 * Zustand store for the story generation pipeline UI.
 * Manages run state, artifacts, event logs, LLM telemetry, and scene selection.
 */

import { create } from 'zustand'
import type {
  OrchestratorState,
  StoryRequest,
  SelectionResult,
  StoryContract,
  StoryPlan,
  ValidationResults,
  StoryTrace,
  GenerationMode,
  GenerationConfig,
  TemplatePack,
  StoryBackbone,
  StoryDetailBindings,
  ChapterManifest,
  StoryRulesOverrides,
} from '../artifacts/types.ts'
import type { OrchestratorEvent, OrchestratorResult, LLMCallTelemetry } from '../engine/orchestrator.ts'
import { orchestrate } from '../engine/orchestrator.ts'
import { assembleChapters } from '../engine/chapterAssembler.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { FetchDataProvider } from '../engine/corpusLoader.ts'
import type { StorySnapshot } from '../artifacts/storySnapshot.ts'
import { snapshotToStoreState } from '../artifacts/storySnapshot.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerationStoreState {
  // Run state
  status: OrchestratorState
  runId: string | null
  mode: GenerationMode
  running: boolean

  // Artifacts
  request: StoryRequest | null
  selection: SelectionResult | null
  contract: StoryContract | null
  templatePack: TemplatePack | null
  backbone: StoryBackbone | null
  detailBindings: StoryDetailBindings | null
  plan: StoryPlan | null
  sceneDrafts: Map<string, string>
  validation: ValidationResults | null
  trace: StoryTrace | null
  complianceReport: string | null
  chapterManifest: ChapterManifest | null

  // Event log
  events: OrchestratorEvent[]

  // LLM telemetry
  llmTelemetry: LLMCallTelemetry[]

  // Prompt log — full text of each LLM prompt sent
  promptLog: { callNumber: number; messages: { role: string; content: string }[] }[]

  // UI selection
  selectedSceneId: string | null

  // Rules overrides (user edits to constraints/rules)
  rulesOverrides: StoryRulesOverrides | null

  // Per-chapter assembled prose
  chapterProse: Record<string, string>

  // Error
  error: string | null

  // Chapter generation — separate logs so setup logs are preserved
  chapterEvents: OrchestratorEvent[]
  chapterLlmTelemetry: LLMCallTelemetry[]
  chapterPromptLog: GenerationStoreState['promptLog']
  chapterError: string | null
  chapterRunning: boolean

  // Actions
  startRun: (request: StoryRequest, config: GenerationConfig, mode?: GenerationMode, llm?: LLMAdapter | null, runOptions?: { skipValidation?: boolean; planningLlm?: LLMAdapter | null }) => Promise<void>
  startChapterRun: (config: GenerationConfig, llm: LLMAdapter | null, runOptions?: { skipValidation?: boolean; planningLlm?: LLMAdapter | null }) => Promise<void>
  cancelRun: () => void
  cancelChapterRun: () => void
  loadResult: (result: OrchestratorResult, request: StoryRequest) => void
  loadSnapshot: (snapshot: StorySnapshot) => void
  setDetailBindings: (bindings: StoryDetailBindings) => void
  setRulesOverrides: (overrides: StoryRulesOverrides | null) => void
  setChapterProse: (id: string, prose: string) => void
  assembleChaptersFromState: () => Promise<void>
  selectScene: (sceneId: string | null) => void
  clearRun: () => void
}

// ---------------------------------------------------------------------------
// Default config (loaded from generation_config.json at runtime)
// ---------------------------------------------------------------------------

const INITIAL_STATE = {
  status: 'IDLE' as OrchestratorState,
  runId: null as string | null,
  mode: 'contract-only' as GenerationMode,
  running: false,
  request: null as StoryRequest | null,
  selection: null as SelectionResult | null,
  contract: null as StoryContract | null,
  templatePack: null as TemplatePack | null,
  backbone: null as StoryBackbone | null,
  detailBindings: null as StoryDetailBindings | null,
  plan: null as StoryPlan | null,
  sceneDrafts: new Map<string, string>(),
  validation: null as ValidationResults | null,
  trace: null as StoryTrace | null,
  complianceReport: null as string | null,
  chapterManifest: null as ChapterManifest | null,
  events: [] as OrchestratorEvent[],
  llmTelemetry: [] as LLMCallTelemetry[],
  promptLog: [] as GenerationStoreState['promptLog'],
  rulesOverrides: null as StoryRulesOverrides | null,
  chapterProse: {} as Record<string, string>,
  selectedSceneId: null as string | null,
  error: null as string | null,
  chapterEvents: [] as OrchestratorEvent[],
  chapterLlmTelemetry: [] as LLMCallTelemetry[],
  chapterPromptLog: [] as GenerationStoreState['promptLog'],
  chapterError: null as string | null,
  chapterRunning: false,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let activeAbortController: AbortController | null = null
let chapterAbortController: AbortController | null = null

export const useGenerationStore = create<GenerationStoreState>((set, get) => ({
  ...INITIAL_STATE,

  startRun: async (request, config, mode = 'contract-only', llm = null, runOptions = {}) => {
    // Cancel any existing run
    activeAbortController?.abort()
    const abortController = new AbortController()
    activeAbortController = abortController

    // Preserve user-edited detail bindings across runs
    const prevDetailBindings = useGenerationStore.getState().detailBindings

    set({
      ...INITIAL_STATE,
      status: 'IDLE',
      runId: request.run_id,
      mode,
      running: true,
      request,
      detailBindings: prevDetailBindings,
      events: [],
      llmTelemetry: [],
      promptLog: [],
      error: null,
    })

    try {
      const provider = new FetchDataProvider(`${import.meta.env.BASE_URL}data`)
      const result = await orchestrate({
        request,
        provider,
        config,
        llm,
        planningLlm: runOptions.planningLlm ?? null,
        mode,
        existingDetailBindings: prevDetailBindings,
        signal: abortController.signal,
        skipValidation: runOptions.skipValidation ?? false,
        onEvent: (event) => {
          // Update status and events; also push partial artifacts as they arrive
          set((state) => ({
            status: event.state,
            events: [...state.events, event],
          }))
        },
        onSceneChunk: (sceneId, chunk) => {
          // Append streaming chunk to sceneDrafts for live display
          set((state) => {
            const drafts = new Map(state.sceneDrafts)
            drafts.set(sceneId, (drafts.get(sceneId) ?? '') + chunk)
            return { sceneDrafts: drafts }
          })
        },
        onPrompt: (callNumber, messages) => {
          set((state) => ({
            promptLog: [...state.promptLog, { callNumber, messages: messages.map(m => ({ role: m.role, content: m.content })) }],
          }))
        },
        onArtifact: (partial) => {
          // Push each artifact into store as it's produced — survives cancellation
          set((state) => ({
            selection: partial.selection ?? state.selection,
            contract: partial.contract ?? state.contract,
            templatePack: partial.templatePack ?? state.templatePack,
            backbone: partial.backbone ?? state.backbone,
            detailBindings: partial.detailBindings ?? state.detailBindings,
            plan: partial.plan ?? state.plan,
          }))
        },
      })

      // Load all produced artifacts — keep previous detailBindings if orchestrator didn't produce new ones
      set({
        status: result.state,
        running: false,
        selection: result.selection ?? null,
        contract: result.contract ?? null,
        templatePack: result.templatePack ?? null,
        backbone: result.backbone ?? null,
        detailBindings: result.detailBindings ?? prevDetailBindings,
        plan: result.plan ?? null,
        sceneDrafts: result.sceneDrafts ?? new Map(),
        validation: result.validation ?? null,
        trace: result.trace ?? null,
        complianceReport: result.complianceReport ?? null,
        chapterManifest: result.chapterManifest ?? null,
        llmTelemetry: result.llmTelemetry ?? [],
        error: result.error ?? null,
      })
    } catch (err) {
      // On error/cancel, keep whatever artifacts were produced so far
      const msg = err instanceof Error ? err.message : String(err)
      const isCancelled = msg === 'Generation cancelled'
      set((state) => ({
        status: isCancelled ? state.status : 'FAILED',
        running: false,
        error: msg,
        // Restore detailBindings if not yet replaced
        detailBindings: state.detailBindings ?? prevDetailBindings,
      }))
    }
  },

  cancelRun: () => {
    activeAbortController?.abort()
    activeAbortController = null
    // Keep all artifacts produced so far — just stop running
    set({ running: false, error: 'Generation cancelled' })
  },

  startChapterRun: async (config, llm, runOptions = {}) => {
    // Cancel any existing chapter run
    chapterAbortController?.abort()
    const abortController = new AbortController()
    chapterAbortController = abortController

    const state = get()
    if (!state.request || !state.backbone) return

    // Reset only chapter-specific logs — preserve ALL existing artifacts and setup logs
    set({
      chapterEvents: [],
      chapterLlmTelemetry: [],
      chapterPromptLog: [],
      chapterError: null,
      chapterRunning: true,
      // Clear previous chapter outputs so they rebuild
      sceneDrafts: new Map(),
      chapterManifest: null,
    })

    try {
      const provider = new FetchDataProvider(`${import.meta.env.BASE_URL}data`)
      const result = await orchestrate({
        request: state.request,
        provider,
        config,
        llm,
        planningLlm: runOptions.planningLlm ?? null,
        mode: 'draft',
        existingDetailBindings: state.detailBindings,
        signal: abortController.signal,
        skipValidation: runOptions.skipValidation ?? false,
        existingArtifacts: {
          selection: state.selection ?? undefined,
          contract: state.contract ?? undefined,
          templatePack: state.templatePack ?? undefined,
          backbone: state.backbone ?? undefined,
          plan: state.plan ?? undefined,
        },
        onEvent: (event) => {
          set((s) => ({
            status: event.state,
            chapterEvents: [...s.chapterEvents, event],
          }))
        },
        onSceneChunk: (sceneId, chunk) => {
          set((s) => {
            const drafts = new Map(s.sceneDrafts)
            drafts.set(sceneId, (drafts.get(sceneId) ?? '') + chunk)
            return { sceneDrafts: drafts }
          })
        },
        onPrompt: (callNumber, messages) => {
          set((s) => ({
            chapterPromptLog: [...s.chapterPromptLog, { callNumber, messages: messages.map(m => ({ role: m.role, content: m.content })) }],
          }))
        },
        onArtifact: (partial) => {
          set((s) => ({
            selection: partial.selection ?? s.selection,
            contract: partial.contract ?? s.contract,
            templatePack: partial.templatePack ?? s.templatePack,
            backbone: partial.backbone ?? s.backbone,
            detailBindings: partial.detailBindings ?? s.detailBindings,
            plan: partial.plan ?? s.plan,
          }))
        },
      })

      set({
        status: result.state,
        chapterRunning: false,
        sceneDrafts: result.sceneDrafts ?? new Map(),
        validation: result.validation ?? null,
        trace: result.trace ?? null,
        complianceReport: result.complianceReport ?? null,
        chapterManifest: result.chapterManifest ?? null,
        chapterLlmTelemetry: result.llmTelemetry ?? [],
        chapterError: result.error ?? null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const isCancelled = msg === 'Generation cancelled'
      set((s) => ({
        status: isCancelled ? s.status : 'FAILED',
        chapterRunning: false,
        chapterError: msg,
      }))
    }
  },

  cancelChapterRun: () => {
    chapterAbortController?.abort()
    chapterAbortController = null
    set({ chapterRunning: false, chapterError: 'Generation cancelled' })
  },

  loadResult: (result, request) => {
    set({
      status: result.state,
      runId: result.run_id,
      running: false,
      request,
      selection: result.selection ?? null,
      contract: result.contract ?? null,
      templatePack: result.templatePack ?? null,
      backbone: result.backbone ?? null,
      detailBindings: result.detailBindings ?? null,
      plan: result.plan ?? null,
      sceneDrafts: result.sceneDrafts ?? new Map(),
      validation: result.validation ?? null,
      trace: result.trace ?? null,
      complianceReport: result.complianceReport ?? null,
      chapterManifest: result.chapterManifest ?? null,
      events: result.events,
      llmTelemetry: result.llmTelemetry ?? [],
      error: result.error ?? null,
    })
  },

  loadSnapshot: (snapshot) => set(snapshotToStoreState(snapshot)),

  setDetailBindings: (bindings) => set({ detailBindings: bindings }),

  setRulesOverrides: (overrides) => set({ rulesOverrides: overrides }),

  setChapterProse: (id, prose) => set((s) => ({ chapterProse: { ...s.chapterProse, [id]: prose } })),

  assembleChaptersFromState: async () => {
    const { backbone, sceneDrafts, plan } = get()
    if (!backbone || sceneDrafts.size === 0) return
    const result = await assembleChapters(backbone, sceneDrafts, null, plan)
    set({ chapterManifest: result.manifest })
  },

  selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

  clearRun: () => set({ ...INITIAL_STATE }),
}))
