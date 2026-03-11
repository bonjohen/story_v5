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
import type { LLMAdapter, LLMMessage, LLMCompletionOptions } from '../agents/llmAdapter.ts'
import type { DataProvider } from './corpusLoader.ts'
import { loadCorpus } from './corpusLoader.ts'
import { runSelection } from './selectionEngine.ts'
import { compileContract } from './contractCompiler.ts'
import { compileTemplatePack } from './templateCompiler.ts'
import { assembleBackbone } from './backboneAssembler.ts'
import { synthesizeDetails } from './detailSynthesizer.ts'
import { buildPlan } from './planner.ts'
import { writeScene, writeSceneStreaming, writeBeatPoint, writeBeatPointStreaming } from '../agents/writerAgent.ts'
import { validateScenes } from '../validators/validationEngine.ts'
import { repair } from './repairEngine.ts'
import { buildTrace, generateComplianceReport } from './traceEngine.ts'
import { assembleChapters } from './chapterAssembler.ts'
import { expandSceneBeats, DEFAULT_BEAT_EXPANSION } from './sceneBeatExpander.ts'
import { enhanceBeatExpansion } from '../agents/beatExpansionAgent.ts'
import { stitchScene, smoothScene } from './sceneStitcher.ts'
import type { SceneBeatExpansion } from '../artifacts/types.ts'

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
  /** Optional separate LLM for planning calls (beat summaries, scene goals). Uses main llm if not set. */
  planningLlm?: LLMAdapter | null
  mode?: GenerationMode
  onEvent?: (event: OrchestratorEvent) => void
  /** Called with partial text chunks during scene writing (streaming mode). */
  onSceneChunk?: (sceneId: string, chunk: string) => void
  /** Called as each artifact is produced — allows progressive UI updates and cancel-safe state. */
  onArtifact?: (partial: Partial<OrchestratorResult>) => void
  /** Pre-existing detail bindings — skip detail synthesis if provided. */
  existingDetailBindings?: StoryDetailBindings | null
  /** Called with the full prompt messages for each LLM call. */
  onPrompt?: (callNumber: number, messages: LLMMessage[]) => void
  /** AbortSignal for cancellation — checked between pipeline stages. */
  signal?: AbortSignal
  /** Skip the validation/repair cycle for faster generation. */
  skipValidation?: boolean
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
  PLANNED: ['EXPANDING_BEATS', 'GENERATING_SCENE', 'COMPLETED', 'FAILED'],
  EXPANDING_BEATS: ['GENERATING_BEAT_POINT', 'GENERATING_SCENE', 'FAILED'],
  GENERATING_SCENE: ['VALIDATING_SCENE', 'GENERATING_SCENE', 'EXPANDING_BEATS', 'CHAPTERS_ASSEMBLED', 'COMPLETED', 'FAILED'],
  GENERATING_BEAT_POINT: ['GENERATING_BEAT_POINT', 'GENERATING_SCENE', 'VALIDATING_SCENE', 'FAILED'],
  VALIDATING_SCENE: ['REPAIRING_SCENE', 'GENERATING_SCENE', 'EXPANDING_BEATS', 'CHAPTERS_ASSEMBLED', 'COMPLETED', 'FAILED'],
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
  onPrompt?: (callNumber: number, messages: LLMMessage[]) => void,
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
    async complete(messages, options?: LLMCompletionOptions) {
      const t = measure(messages, 'complete')
      onCall(t)
      onPrompt?.(t.callNumber, messages)
      try {
        const start = Date.now()
        const resp = await llm.complete(messages, options)
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
    completeJson: llm.completeJson ? async (messages, options?: LLMCompletionOptions) => {
      const t = measure(messages, 'completeJson')
      onCall(t)
      onPrompt?.(t.callNumber, messages)
      try {
        const start = Date.now()
        const resp = await llm.completeJson!(messages, options)
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
    completeStream: llm.completeStream ? async function* (messages, options?: LLMCompletionOptions) {
      const t = measure(messages, 'completeStream')
      onCall(t)
      onPrompt?.(t.callNumber, messages)
      try {
        const start = Date.now()
        let totalOutput = 0
        for await (const chunk of llm.completeStream!(messages, options)) {
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
  const { request, provider, config, llm: rawLlm = null, planningLlm: rawPlanningLlm = null, mode = 'draft', onEvent, onSceneChunk, onArtifact, existingDetailBindings, onPrompt, signal, skipValidation = false } = options

  function checkCancelled() {
    if (signal?.aborted) throw new Error('Generation cancelled')
  }

  // Wrap LLM with instrumentation — emit telemetry as events
  const telemetryLog: LLMCallTelemetry[] = []
  const llm = rawLlm ? instrumentedLLM(rawLlm, (t) => {
    // Update or add to log
    const existing = telemetryLog.findIndex(e => e.callNumber === t.callNumber)
    if (existing >= 0) telemetryLog[existing] = t
    else telemetryLog.push(t)

    // Emit as event so UI can display it
    const methodLabel = t.method === 'completeStream' ? 'Streaming prose'
      : t.method === 'completeJson' ? 'Generating structured data'
      : 'Sending prompt'
    if (t.status === 'pending') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `${methodLabel} (${(t.inputChars / 1024).toFixed(1)}KB prompt)...`,
        timestamp: t.startedAt,
      })
    } else if (t.status === 'success') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `Received ${(t.outputChars! / 1024).toFixed(1)}KB in ${(t.durationMs! / 1000).toFixed(1)}s`,
        timestamp: t.completedAt!,
      })
    } else if (t.status === 'error') {
      onEvent?.({
        state: 'GENERATING_SCENE',
        message: `LLM error: ${t.error?.slice(0, 200)}`,
        timestamp: t.completedAt!,
      })
    }
  }, onPrompt) : null

  // Planning LLM — use separate adapter if provided, otherwise fall back to main LLM
  const planningLlm = rawPlanningLlm
    ? instrumentedLLM(rawPlanningLlm, (t) => {
        const existing = telemetryLog.findIndex(e => e.callNumber === t.callNumber)
        if (existing >= 0) telemetryLog[existing] = t
        else telemetryLog.push(t)
        const methodLabel = t.method === 'completeJson' ? 'Planning (JSON)' : 'Planning'
        if (t.status === 'pending') {
          onEvent?.({ state: 'GENERATING_SCENE', message: `${methodLabel} (${(t.inputChars / 1024).toFixed(1)}KB prompt)...`, timestamp: t.startedAt })
        } else if (t.status === 'success') {
          onEvent?.({ state: 'GENERATING_SCENE', message: `Planning: ${(t.outputChars! / 1024).toFixed(1)}KB in ${(t.durationMs! / 1000).toFixed(1)}s`, timestamp: t.completedAt! })
        }
      }, onPrompt)
    : llm

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
    checkCancelled()
    const corpus = await loadCorpus(provider)
    transition('LOADED_CORPUS', 'Story structure library loaded')

    // 2. Selection
    const { selection } = runSelection(request, corpus)
    result.selection = selection
    onArtifact?.({ selection })
    transition('SELECTED', `Using ${selection.primary_archetype} archetype with ${selection.primary_genre} genre`)

    // 3. Contract
    const contract = compileContract(selection, request, corpus, config)
    result.contract = contract
    onArtifact?.({ contract })
    transition('CONTRACT_READY', `Story contract ready: ${contract.phase_guidelines.length} phases, ${contract.genre.hard_constraints.length} hard constraints`)

    // Stop here for contract-only mode
    if (mode === 'contract-only') {
      transition('COMPLETED', 'Contract-only mode — stopping after contract')
      result.state = state
      return result
    }

    // 3.5. Template compilation
    const templatePack = compileTemplatePack(selection, contract, corpus)
    result.templatePack = templatePack
    onArtifact?.({ templatePack })
    transition('TEMPLATES_COMPILED', `${Object.keys(templatePack.archetype_node_templates).length} beat templates and ${Object.keys(templatePack.genre_level_templates).length} genre rules compiled`)

    // 3.6. Backbone assembly
    const backbone = assembleBackbone(contract, templatePack)
    let currentBackbone = backbone
    result.backbone = backbone
    onArtifact?.({ backbone })
    transition('BACKBONE_ASSEMBLED', `Story outline: ${backbone.beats.length} beats across ${backbone.chapter_partition.length} chapters`)

    // Stop here for backbone mode
    if (mode === 'backbone') {
      transition('COMPLETED', 'Backbone mode — stopping after backbone assembly')
      result.state = state
      return result
    }

    // 3.7. Detail synthesis — skip if user already provided bindings
    checkCancelled()
    let detailBindings: StoryDetailBindings
    if (existingDetailBindings) {
      detailBindings = existingDetailBindings
      transition('DETAILS_BOUND', `Using your ${detailBindings.entity_registry.characters.length} characters, ${detailBindings.entity_registry.places.length} places, ${detailBindings.entity_registry.objects.length} objects`)
    } else {
      const useLlmForDetails = (mode === 'draft' || mode === 'chapters') ? llm : null
      const { bindings, updatedBackbone } = await synthesizeDetails(request, backbone, useLlmForDetails)
      detailBindings = bindings
      currentBackbone = updatedBackbone
      result.backbone = currentBackbone
      transition('DETAILS_BOUND', `Created ${detailBindings.entity_registry.characters.length} characters, ${detailBindings.entity_registry.places.length} places, ${detailBindings.entity_registry.objects.length} objects`)
    }
    result.detailBindings = detailBindings
    onArtifact?.({ detailBindings, backbone: currentBackbone })

    // Stop here for detailed-outline mode
    if (mode === 'detailed-outline') {
      transition('COMPLETED', 'Detailed-outline mode — stopping after detail synthesis')
      result.state = state
      return result
    }

    // 4. Plan — use planningLlm for beat/scene summaries
    const plan = await buildPlan({ contract, corpus, config, llm: planningLlm, selection, detailBindings })
    result.plan = plan
    onArtifact?.({ plan })
    transition('PLANNED', `Scene plan ready: ${plan.scenes.length} scenes across ${plan.beats.length} beats`)

    // Stop here for outline mode
    if (mode === 'outline') {
      transition('COMPLETED', 'Outline mode — stopping after planning')
      result.state = state
      return result
    }

    // 5. Generate scenes (with optional beat expansion)
    checkCancelled()
    const sceneDrafts = new Map<string, string>()
    const totalScenes = plan.scenes.length
    const beatExpansionConfig = config.beat_expansion ?? DEFAULT_BEAT_EXPANSION
    const useBeatExpansion = beatExpansionConfig.enabled && (mode === 'draft' || mode === 'chapters')
    const allBeatExpansions: SceneBeatExpansion[] = []

    for (let si = 0; si < plan.scenes.length; si++) {
      const scene = plan.scenes[si]
      checkCancelled()
      const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
      if (!beat) {
        console.warn(`[orchestrator] Skipping scene ${scene.scene_id}: no matching beat "${scene.beat_id}" found in plan`)
        continue
      }

      // Extract human-friendly beat label (e.g. "[Catalyst] The hero receives..." → "Catalyst")
      const roleMatch = beat.summary.match(/^\[([^\]]+)\]/)
      const sceneName = roleMatch ? roleMatch[1] : scene.scene_goal
      const sceneLabel = `${si + 1}/${totalScenes}: ${sceneName}`

      if (useBeatExpansion) {
        // --- Beat expansion path ---

        // 5a. Deterministic beat expansion
        transition('EXPANDING_BEATS', `Expanding beats for ${sceneLabel}`)
        let expansion = expandSceneBeats(scene, beat, contract, beatExpansionConfig)

        // 5b. LLM-enhanced micro-goals (if LLM available)
        if (llm) {
          expansion = await enhanceBeatExpansion(llm, scene, beat, contract, expansion, plan)
        }
        allBeatExpansions.push(expansion)

        // 5c. Write each beat point
        const beatPointProse = new Map<string, string>()
        const priorBeatProse: string[] = []

        for (let bpi = 0; bpi < expansion.beat_points.length; bpi++) {
          checkCancelled()
          const bp = expansion.beat_points[bpi]
          transition('GENERATING_BEAT_POINT', `Writing beat ${bpi + 1}/${expansion.beat_points.length}: ${bp.type} (${sceneLabel})`)

          const bpResult = onSceneChunk
            ? await writeBeatPointStreaming(bp, scene, beat, contract, llm, (chunk) => onSceneChunk(scene.scene_id, chunk), plan, priorBeatProse)
            : await writeBeatPoint(bp, scene, beat, contract, llm, plan, priorBeatProse)

          beatPointProse.set(bp.beat_point_id, bpResult.content)
          priorBeatProse.push(bpResult.content)
        }

        // 5d. Stitch beat prose into scene
        let sceneProse = stitchScene(beatPointProse, expansion, scene, beat)

        // 5e. Optional scene-level smoothing
        if (llm) {
          sceneProse = await smoothScene(sceneProse, beat, contract.genre.name, llm)
        }

        transition('GENERATING_SCENE', `Scene ${sceneLabel} assembled from ${expansion.beat_points.length} beat points`)
        sceneDrafts.set(scene.scene_id, sceneProse)

      } else {
        // --- Fast Draft path (original behavior) ---
        transition('GENERATING_SCENE', `Writing ${sceneLabel}`)
        const sceneIndex = plan.scenes.indexOf(scene)
        const priorScenes = plan.scenes.slice(0, sceneIndex)
        const writeResult = onSceneChunk
          ? await writeSceneStreaming(scene, beat, contract, llm, (chunk) => onSceneChunk(scene.scene_id, chunk), plan, priorScenes)
          : await writeScene(scene, beat, contract, llm, plan, priorScenes)
        sceneDrafts.set(scene.scene_id, writeResult.content)
      }

      // 6. Validate + 7. Repair — skip entirely when skipValidation is enabled
      if (!skipValidation) {
        transition('VALIDATING_SCENE', `Checking ${sceneLabel} against genre constraints`)
        let validation = await validateScenes({
          contract,
          scenes: [scene],
          beats: [beat],
          sceneDrafts: new Map([[scene.scene_id, sceneDrafts.get(scene.scene_id)!]]),
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
          transition('REPAIRING_SCENE', `Revising ${sceneLabel} (attempt ${repairAttempt + 1})`)
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
          transition('VALIDATING_SCENE', `Re-checking ${sceneLabel}`)
          validation = await validateScenes({
            contract,
            scenes: [scene],
            beats: [beat],
            sceneDrafts: new Map([[scene.scene_id, repairResult.revised_content]]),
            config,
            llm,
            plan,
          })
          currentSceneResult = validation.scenes[0]
        }
      }
    }

    // Store beat expansions on the plan
    if (allBeatExpansions.length > 0) {
      plan.scene_beat_expansions = allBeatExpansions
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

    // 11. Chapter assembly — always run when we have drafts and a backbone with chapters
    if (currentBackbone.chapter_partition.length > 0 && sceneDrafts.size > 0) {
      const editorialLlm = mode === 'chapters' ? llm : null
      const chapterResult = await assembleChapters(currentBackbone, sceneDrafts, editorialLlm, plan)
      result.chapterManifest = chapterResult.manifest
      result.chapterTexts = chapterResult.chapters
      transition('CHAPTERS_ASSEMBLED', `${chapterResult.manifest.total_chapter_count} chapters assembled`)
    }

    transition('COMPLETED', `Story complete — ${sceneDrafts.size} scenes written`)
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
