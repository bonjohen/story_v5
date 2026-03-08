/**
 * Orchestrator: state machine that wires all generation engines together.
 * Manages the full pipeline from corpus loading through scene generation,
 * validation, repair, and trace output.
 */

import type {
  OrchestratorState,
  StoryRequest,
  SelectionResult,
  StoryContract,
  StoryPlan,
  ValidationResults,
  StoryTrace,
  GenerationConfig,
  GenerationMode,
  TemplatePack,
  StoryBackbone,
  StoryDetailBindings,
  ChapterManifest,
} from '../artifacts/types.ts'
import type { LLMAdapter, LLMMessage } from '../agents/llmAdapter.ts'
import type { DataProvider } from './corpusLoader.ts'
import { loadCorpus } from './corpusLoader.ts'
import { runSelection } from './selectionEngine.ts'
import { compileContract } from './contractCompiler.ts'
import { compileTemplatePack } from './templateCompiler.ts'
import { assembleBackbone } from './backboneAssembler.ts'
import { synthesizeDetails } from './detailSynthesizer.ts'
import { buildPlan } from './planner.ts'
import { writeScene, writeSceneStreaming } from '../agents/writerAgent.ts'
import { validateScenes } from '../validators/validationEngine.ts'
import { repair } from './repairEngine.ts'
import { buildTrace, generateComplianceReport } from './traceEngine.ts'
import { assembleChapters } from './chapterAssembler.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrchestratorEvent {
  state: OrchestratorState
  message: string
  timestamp: string
}

export interface OrchestratorResult {
  state: OrchestratorState
  run_id: string
  selection?: SelectionResult
  contract?: StoryContract
  templatePack?: TemplatePack
  backbone?: StoryBackbone
  detailBindings?: StoryDetailBindings
  plan?: StoryPlan
  sceneDrafts?: Map<string, string>
  validation?: ValidationResults
  trace?: StoryTrace
  complianceReport?: string
  chapterManifest?: ChapterManifest
  chapterTexts?: Map<string, string>
  events: OrchestratorEvent[]
  llmTelemetry?: LLMCallTelemetry[]
  error?: string
}

export interface OrchestratorOptions {
  request: StoryRequest
  provider: DataProvider
  config: GenerationConfig
  llm?: LLMAdapter | null
  mode?: GenerationMode
  onEvent?: (event: OrchestratorEvent) => void
  /** Called with partial text chunks during scene writing (streaming mode). */
  onSceneChunk?: (sceneId: string, chunk: string) => void
}

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<OrchestratorState, OrchestratorState[]> = {
  IDLE: ['LOADED_CORPUS'],
  LOADED_CORPUS: ['SELECTED', 'FAILED'],
  SELECTED: ['CONTRACT_READY', 'FAILED'],
  CONTRACT_READY: ['TEMPLATES_COMPILED', 'PLANNED', 'COMPLETED', 'FAILED'],
  TEMPLATES_COMPILED: ['BACKBONE_ASSEMBLED', 'FAILED'],
  BACKBONE_ASSEMBLED: ['DETAILS_BOUND', 'COMPLETED', 'FAILED'],  // COMPLETED for backbone mode
  DETAILS_BOUND: ['PLANNED', 'COMPLETED', 'FAILED'],             // COMPLETED for detailed-outline mode
  PLANNED: ['GENERATING_SCENE', 'COMPLETED', 'FAILED'],
  GENERATING_SCENE: ['VALIDATING_SCENE', 'FAILED'],
  VALIDATING_SCENE: ['REPAIRING_SCENE', 'GENERATING_SCENE', 'CHAPTERS_ASSEMBLED', 'COMPLETED', 'FAILED'],
  REPAIRING_SCENE: ['VALIDATING_SCENE', 'COMPLETED', 'FAILED'],
  CHAPTERS_ASSEMBLED: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
}

function assertTransition(from: OrchestratorState, to: OrchestratorState): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new Error(`Invalid state transition: ${from} → ${to}`)
  }
}

// ---------------------------------------------------------------------------
// Instrumented LLM wrapper — telemetry for every call
// ---------------------------------------------------------------------------

export interface LLMCallTelemetry {
  callNumber: number
  method: 'complete' | 'completeJson' | 'completeStream'
  messageCount: number
  inputChars: number
  systemChars: number
  userChars: number
  startedAt: string
  completedAt?: string
  durationMs?: number
  outputChars?: number
  status: 'pending' | 'success' | 'error'
  error?: string
}

function instrumentedLLM(
  llm: LLMAdapter,
  onCall: (telemetry: LLMCallTelemetry) => void,
): LLMAdapter {
  let callCount = 0

  function measure(messages: LLMMessage[], method: LLMCallTelemetry['method']): LLMCallTelemetry {
    callCount++
    const totalChars = messages.reduce((n, m) => n + m.content.length, 0)
    const systemChars = messages.filter(m => m.role === 'system').reduce((n, m) => n + m.content.length, 0)
    const userChars = messages.filter(m => m.role === 'user').reduce((n, m) => n + m.content.length, 0)
    return {
      callNumber: callCount,
      method,
      messageCount: messages.length,
      inputChars: totalChars,
      systemChars,
      userChars,
      startedAt: new Date().toISOString(),
      status: 'pending',
    }
  }

  return {
    async complete(messages) {
      const t = measure(messages, 'complete')
      onCall(t)
      try {
        const start = Date.now()
        const resp = await llm.complete(messages)
        t.completedAt = new Date().toISOString()
        t.durationMs = Date.now() - start
        t.outputChars = resp.content.length
        t.status = 'success'
        onCall(t)
        return resp
      } catch (err) {
        t.completedAt = new Date().toISOString()
        t.status = 'error'
        t.error = err instanceof Error ? err.message : String(err)
        onCall(t)
        throw err
      }
    },
    completeJson: llm.completeJson ? async (messages) => {
      const t = measure(messages, 'completeJson')
      onCall(t)
      try {
        const start = Date.now()
        const resp = await llm.completeJson!(messages)
        t.completedAt = new Date().toISOString()
        t.durationMs = Date.now() - start
        t.outputChars = resp.content.length
        t.status = 'success'
        onCall(t)
        return resp
      } catch (err) {
        t.completedAt = new Date().toISOString()
        t.status = 'error'
        t.error = err instanceof Error ? err.message : String(err)
        onCall(t)
        throw err
      }
    } : undefined,
    completeStream: llm.completeStream ? async function* (messages) {
      const t = measure(messages, 'completeStream')
      onCall(t)
      try {
        const start = Date.now()
        let totalOutput = 0
        for await (const chunk of llm.completeStream!(messages)) {
          totalOutput += chunk.length
          yield chunk
        }
        t.completedAt = new Date().toISOString()
        t.durationMs = Date.now() - start
        t.outputChars = totalOutput
        t.status = 'success'
        onCall(t)
      } catch (err) {
        t.completedAt = new Date().toISOString()
        t.status = 'error'
        t.error = err instanceof Error ? err.message : String(err)
        onCall(t)
        throw err
      }
    } : undefined,
  }
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full generation pipeline.
 * Returns all artifacts produced during the run.
 */
export async function orchestrate(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const { request, provider, config, llm: rawLlm = null, mode = 'draft', onEvent, onSceneChunk } = options

  // Wrap LLM with instrumentation — emit telemetry as events
  const telemetryLog: LLMCallTelemetry[] = []
  const llm = rawLlm ? instrumentedLLM(rawLlm, (t) => {
    // Update or add to log
    const existing = telemetryLog.findIndex(e => e.callNumber === t.callNumber)
    if (existing >= 0) telemetryLog[existing] = t
    else telemetryLog.push(t)

    // Emit as event so UI can display it
    const sizeKb = (t.inputChars / 1024).toFixed(1)
    if (t.status === 'pending') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `LLM #${t.callNumber} ${t.method} — ${sizeKb}KB input (sys:${(t.systemChars/1024).toFixed(1)}K usr:${(t.userChars/1024).toFixed(1)}K)`,
        timestamp: t.startedAt,
      })
    } else if (t.status === 'success') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `LLM #${t.callNumber} OK — ${(t.outputChars!/1024).toFixed(1)}KB out, ${((t.durationMs!)/1000).toFixed(1)}s`,
        timestamp: t.completedAt!,
      })
    } else if (t.status === 'error') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `LLM #${t.callNumber} FAILED — ${t.error?.slice(0, 200)}`,
        timestamp: t.completedAt!,
      })
    }
  }) : null

  let state: OrchestratorState = 'IDLE'
  const events: OrchestratorEvent[] = []

  function transition(to: OrchestratorState, message: string): void {
    assertTransition(state, to)
    state = to
    const event: OrchestratorEvent = {
      state,
      message,
      timestamp: new Date().toISOString(),
    }
    events.push(event)
    onEvent?.(event)
  }

  const result: OrchestratorResult = {
    state: 'IDLE',
    run_id: request.run_id,
    events,
  }

  try {
    // 1. Load corpus
    const corpus = await loadCorpus(provider)
    transition('LOADED_CORPUS', 'Corpus loaded and validated')

    // 2. Selection
    const { selection } = runSelection(request, corpus)
    result.selection = selection
    transition('SELECTED', `Selected ${selection.primary_archetype} × ${selection.primary_genre}`)

    // 3. Contract
    const contract = compileContract(selection, request, corpus, config)
    result.contract = contract
    transition('CONTRACT_READY', `Contract compiled: ${contract.phase_guidelines.length} phases`)

    // Stop here for contract-only mode
    if (mode === 'contract-only') {
      transition('COMPLETED', 'Contract-only mode — stopping after contract')
      result.state = state
      return result
    }

    // 3.5. Template compilation
    const templatePack = compileTemplatePack(selection, contract, corpus)
    result.templatePack = templatePack
    transition('TEMPLATES_COMPILED', `Templates compiled: ${Object.keys(templatePack.archetype_node_templates).length} beat templates, ${Object.keys(templatePack.genre_level_templates).length} genre constraints`)

    // 3.6. Backbone assembly
    const backbone = assembleBackbone(contract, templatePack)
    let currentBackbone = backbone
    result.backbone = backbone
    transition('BACKBONE_ASSEMBLED', `Backbone assembled: ${backbone.beats.length} beats, ${backbone.chapter_partition.length} chapters`)

    // Stop here for backbone mode
    if (mode === 'backbone') {
      transition('COMPLETED', 'Backbone mode — stopping after backbone assembly')
      result.state = state
      return result
    }

    // 3.7. Detail synthesis — use LLM only for modes that generate prose
    const useLlmForDetails = (mode === 'draft' || mode === 'chapters') ? llm : null
    const { bindings: detailBindings, updatedBackbone } = await synthesizeDetails(request, backbone, useLlmForDetails)
    currentBackbone = updatedBackbone
    result.detailBindings = detailBindings
    result.backbone = currentBackbone
    transition('DETAILS_BOUND', `Details bound: ${Object.keys(detailBindings.slot_bindings).length} slots, ${detailBindings.entity_registry.characters.length} characters`)

    // Stop here for detailed-outline mode
    if (mode === 'detailed-outline') {
      transition('COMPLETED', 'Detailed-outline mode — stopping after detail synthesis')
      result.state = state
      return result
    }

    // 4. Plan
    const plan = await buildPlan({ contract, corpus, config, llm, selection })
    result.plan = plan
    transition('PLANNED', `Plan built: ${plan.beats.length} beats, ${plan.scenes.length} scenes`)

    // Stop here for outline mode
    if (mode === 'outline') {
      transition('COMPLETED', 'Outline mode — stopping after planning')
      result.state = state
      return result
    }

    // 5. Generate scenes
    const sceneDrafts = new Map<string, string>()
    for (const scene of plan.scenes) {
      const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
      if (!beat) {
        console.warn(`[orchestrator] Skipping scene ${scene.scene_id}: no matching beat "${scene.beat_id}" found in plan`)
        continue
      }

      transition('GENERATING_SCENE', `Writing scene ${scene.scene_id}`)
      const sceneIndex = plan.scenes.indexOf(scene)
      const priorScenes = plan.scenes.slice(0, sceneIndex)
      const writeResult = onSceneChunk
        ? await writeSceneStreaming(scene, beat, contract, llm, (chunk) => onSceneChunk(scene.scene_id, chunk), plan, priorScenes)
        : await writeScene(scene, beat, contract, llm, plan, priorScenes)
      sceneDrafts.set(scene.scene_id, writeResult.content)

      // 6. Validate
      transition('VALIDATING_SCENE', `Validating scene ${scene.scene_id}`)
      let validation = await validateScenes({
        contract,
        scenes: [scene],
        beats: [beat],
        sceneDrafts: new Map([[scene.scene_id, writeResult.content]]),
        config,
        llm,
        plan,
      })

      // 7. Repair loop
      let repairAttempt = 0
      let currentSceneResult = validation.scenes[0]
      while (
        currentSceneResult &&
        currentSceneResult.status === 'fail' &&
        repairAttempt < config.repair_policy.max_attempts_per_scene
      ) {
        transition('REPAIRING_SCENE', `Repairing scene ${scene.scene_id} (attempt ${repairAttempt + 1})`)
        const repairResult = await repair({
          sceneId: scene.scene_id,
          originalContent: sceneDrafts.get(scene.scene_id) ?? '',
          validation: currentSceneResult,
          scene,
          beat,
          contract,
          config,
          llm,
        })
        sceneDrafts.set(scene.scene_id, repairResult.revised_content)
        repairAttempt++

        // Re-validate
        transition('VALIDATING_SCENE', `Re-validating scene ${scene.scene_id}`)
        validation = await validateScenes({
          contract,
          scenes: [scene],
          beats: [beat],
          sceneDrafts: new Map([[scene.scene_id, repairResult.revised_content]]),
          config,
          llm,
          plan,
        })
        // Use fresh result from re-validation (no mutation of old reference)
        currentSceneResult = validation.scenes[0]
      }
    }

    result.sceneDrafts = sceneDrafts

    // 8. Final validation of all scenes (heuristic only — LLM validation
    //    already ran per-scene during generate/repair loop above)
    const finalValidation = await validateScenes({
      contract,
      scenes: plan.scenes,
      beats: plan.beats,
      sceneDrafts,
      config,
      llm: null,   // skip LLM re-validation to avoid redundant calls
      plan,
    })
    result.validation = finalValidation

    // 9. Build trace
    const trace = buildTrace({
      contract,
      scenes: plan.scenes,
      beats: plan.beats,
      validation: finalValidation,
    })
    result.trace = trace

    // 10. Compliance report
    result.complianceReport = generateComplianceReport(trace, finalValidation, contract)

    // 11. Chapter assembly (for chapters mode)
    if (mode === 'chapters') {
      const chapterResult = await assembleChapters(currentBackbone, sceneDrafts, llm)
      result.chapterManifest = chapterResult.manifest
      result.chapterTexts = chapterResult.chapters
      transition('CHAPTERS_ASSEMBLED', `Chapters assembled: ${chapterResult.manifest.total_chapter_count} chapters`)
    }

    transition('COMPLETED', 'Generation complete')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    try {
      transition('FAILED', errorMessage)
    } catch {
      // If transition itself fails (invalid state), just set state directly
      state = 'FAILED'
      events.push({
        state: 'FAILED',
        message: errorMessage,
        timestamp: new Date().toISOString(),
      })
    }
    result.error = errorMessage
  }

  result.state = state
  if (telemetryLog.length > 0) result.llmTelemetry = telemetryLog
  return result
}
