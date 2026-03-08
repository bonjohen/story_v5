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
} from '../artifacts/types.ts'
import type { OrchestratorEvent, OrchestratorResult, LLMCallTelemetry } from '../engine/orchestrator.ts'
import { orchestrate } from '../engine/orchestrator.ts'
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

  // UI selection
  selectedSceneId: string | null

  // Error
  error: string | null

  // Actions
  startRun: (request: StoryRequest, config: GenerationConfig, mode?: GenerationMode, llm?: LLMAdapter | null) => Promise<void>
  loadResult: (result: OrchestratorResult, request: StoryRequest) => void
  loadSnapshot: (snapshot: StorySnapshot) => void
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
  selectedSceneId: null as string | null,
  error: null as string | null,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGenerationStore = create<GenerationStoreState>((set) => ({
  ...INITIAL_STATE,

  startRun: async (request, config, mode = 'contract-only', llm = null) => {
    set({
      ...INITIAL_STATE,
      status: 'IDLE',
      runId: request.run_id,
      mode,
      running: true,
      request,
      events: [],
      llmTelemetry: [],
      error: null,
    })

    try {
      const provider = new FetchDataProvider(`${import.meta.env.BASE_URL}data`)
      const result = await orchestrate({
        request,
        provider,
        config,
        llm,
        mode,
        onEvent: (event) => {
          set((state) => ({
            status: event.state,
            events: [...state.events, event],
          }))
        },
      })

      // Load all produced artifacts
      set({
        status: result.state,
        running: false,
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
        llmTelemetry: result.llmTelemetry ?? [],
        error: result.error ?? null,
      })
    } catch (err) {
      set({
        status: 'FAILED',
        running: false,
        error: err instanceof Error ? err.message : String(err),
      })
    }
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

  selectScene: (sceneId) => set({ selectedSceneId: sceneId }),

  clearRun: () => set({ ...INITIAL_STATE }),
}))
