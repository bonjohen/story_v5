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
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import type { DataProvider } from './corpusLoader.ts'
import { loadCorpus } from './corpusLoader.ts'
import { runSelection } from './selectionEngine.ts'
import { compileContract } from './contractCompiler.ts'
import { buildPlan } from './planner.ts'
import { writeScene } from '../agents/writerAgent.ts'
import { validateScenes } from '../validators/validationEngine.ts'
import { repair } from './repairEngine.ts'
import { buildTrace, generateComplianceReport } from './traceEngine.ts'

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
  plan?: StoryPlan
  sceneDrafts?: Map<string, string>
  validation?: ValidationResults
  trace?: StoryTrace
  complianceReport?: string
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
  CONTRACT_READY: ['PLANNED', 'COMPLETED', 'FAILED'],    // COMPLETED for contract-only mode
  PLANNED: ['GENERATING_SCENE', 'COMPLETED', 'FAILED'],  // COMPLETED for outline mode
  GENERATING_SCENE: ['VALIDATING_SCENE', 'FAILED'],
  VALIDATING_SCENE: ['REPAIRING_SCENE', 'GENERATING_SCENE', 'COMPLETED', 'FAILED'],
  REPAIRING_SCENE: ['VALIDATING_SCENE', 'COMPLETED', 'FAILED'],
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
      // Need to bypass PLANNED state
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
      if (!beat) continue

      transition('GENERATING_SCENE', `Writing scene ${scene.scene_id}`)
      const writeResult = await writeScene(scene, beat, contract, llm)
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
      })

      // 7. Repair loop
      let repairAttempt = 0
      const sceneResult = validation.scenes[0]
      while (
        sceneResult &&
        sceneResult.status === 'fail' &&
        repairAttempt < config.repair_policy.max_attempts_per_scene
      ) {
        transition('REPAIRING_SCENE', `Repairing scene ${scene.scene_id} (attempt ${repairAttempt + 1})`)
        const repairResult = await repair({
          sceneId: scene.scene_id,
          originalContent: sceneDrafts.get(scene.scene_id) ?? '',
          validation: sceneResult,
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
        })
        // Update sceneResult reference
        if (validation.scenes[0]) {
          sceneResult.status = validation.scenes[0].status
          sceneResult.checks = validation.scenes[0].checks
        }
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
