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
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import type { DataProvider } from './corpusLoader.ts'
import { loadCorpus } from './corpusLoader.ts'
import { runSelection } from './selectionEngine.ts'
import { compileContract } from './contractCompiler.ts'
import { compileTemplatePack } from './templateCompiler.ts'
import { assembleBackbone } from './backboneAssembler.ts'
import { synthesizeDetails } from './detailSynthesizer.ts'
import { buildPlan } from './planner.ts'
import { writeScene } from '../agents/writerAgent.ts'
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
  error?: string
}

export interface OrchestratorOptions {
  request: StoryRequest
  provider: DataProvider
  config: GenerationConfig
  llm?: LLMAdapter | null
  mode?: GenerationMode
  onEvent?: (event: OrchestratorEvent) => void
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
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full generation pipeline.
 * Returns all artifacts produced during the run.
 */
export async function orchestrate(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const { request, provider, config, llm = null, mode = 'draft', onEvent } = options

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
    transition('TEMPLATES_COMPILED', `Templates compiled: ${Object.keys(templatePack.archetype_node_templates).length} archetype, ${Object.keys(templatePack.genre_level_templates).length} genre`)

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

    // 3.7. Detail synthesis
    const { bindings: detailBindings, updatedBackbone } = await synthesizeDetails(request, backbone, llm)
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
      const writeResult = await writeScene(scene, beat, contract, llm, plan, priorScenes)
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

    // 8. Final validation of all scenes
    const finalValidation = await validateScenes({
      contract,
      scenes: plan.scenes,
      beats: plan.beats,
      sceneDrafts,
      config,
      llm,
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
  return result
}
