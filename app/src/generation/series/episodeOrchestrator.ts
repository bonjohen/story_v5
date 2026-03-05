/**
 * Episode Orchestrator: manages the full lore-aware episode generation
 * pipeline, from lore loading through scene generation, validation,
 * state extraction, and curation.
 *
 * Extends the standard orchestrator pattern with new states:
 *   LOADING_LORE → SELECTED → CONTRACT_READY → PLANNED →
 *   GENERATING_SCENE → VALIDATING_SCENE → REPAIRING_SCENE →
 *   EXTRACTING_DELTAS → AWAITING_CURATION → COMPLETED | FAILED
 */

import type {
  SelectionResult,
  StoryContract,
  StoryPlan,
  ValidationResults,
  StoryTrace,
  GenerationConfig,
  GenerationMode,
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import type { DataProvider } from '../engine/corpusLoader.ts'
import { loadCorpus } from '../engine/corpusLoader.ts'
import { runSelection } from '../engine/selectionEngine.ts'
import { writeScene } from '../agents/writerAgent.ts'
import { validateScenes } from '../validators/validationEngine.ts'
import { repair } from '../engine/repairEngine.ts'
import { buildTrace, generateComplianceReport } from '../engine/traceEngine.ts'

import { compileEpisodeContract } from './episodeContractCompiler.ts'
import { buildEpisodePlan } from './episodePlanner.ts'
import { validateAgainstLore } from './loreValidator.ts'
import { extractStateDelta } from './stateExtractor.ts'
import {
  canonizeEpisode as applyCanonicalization,
  validateDeltaAgainstLore,
  validateLore,
} from './loreMerge.ts'
import {
  loadSeries,
  saveSeries,
  loadLore,
  saveLore,
  loadLatestSnapshot,
  saveSnapshot,
  saveEpisode,
  saveStateDelta as persistStateDelta,
  saveSceneDraft,
  generateEpisodeId,
} from './io.ts'

import type {
  Series,
  StoryLore,
  Episode,
  EpisodeRequest,
  EpisodeArcContext,
  StateDelta,
} from './types.ts'
import type { LoreValidationResults } from './loreValidator.ts'

// ---------------------------------------------------------------------------
// Episode orchestrator states (extends base states)
// ---------------------------------------------------------------------------

export type EpisodeOrchestratorState =
  | 'IDLE'
  | 'LOADING_LORE'
  | 'LOADED_CORPUS'
  | 'SELECTED'
  | 'CONTRACT_READY'
  | 'PLANNED'
  | 'GENERATING_SCENE'
  | 'VALIDATING_SCENE'
  | 'REPAIRING_SCENE'
  | 'LORE_VALIDATING'
  | 'EXTRACTING_DELTAS'
  | 'AWAITING_CURATION'
  | 'CANONIZING'
  | 'COMPLETED'
  | 'FAILED'

// ---------------------------------------------------------------------------
// Events and results
// ---------------------------------------------------------------------------

export interface EpisodeOrchestratorEvent {
  state: EpisodeOrchestratorState
  message: string
  timestamp: string
}

export interface EpisodeGenerationResult {
  state: EpisodeOrchestratorState
  episode?: Episode
  selection?: SelectionResult
  contract?: StoryContract
  plan?: StoryPlan
  sceneDrafts?: Map<string, string>
  validation?: ValidationResults
  loreValidation?: LoreValidationResults
  stateDelta?: StateDelta
  trace?: StoryTrace
  complianceReport?: string
  events: EpisodeOrchestratorEvent[]
  error?: string
}

export interface EpisodeOrchestratorOptions {
  request: EpisodeRequest
  provider: DataProvider
  config: GenerationConfig
  baseDir: string
  llm?: LLMAdapter | null
  mode?: GenerationMode
  onEvent?: (event: EpisodeOrchestratorEvent) => void
}

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<EpisodeOrchestratorState, EpisodeOrchestratorState[]> = {
  IDLE: ['LOADING_LORE'],
  LOADING_LORE: ['LOADED_CORPUS', 'FAILED'],
  LOADED_CORPUS: ['SELECTED', 'FAILED'],
  SELECTED: ['CONTRACT_READY', 'FAILED'],
  CONTRACT_READY: ['PLANNED', 'COMPLETED', 'FAILED'],
  PLANNED: ['GENERATING_SCENE', 'LORE_VALIDATING', 'COMPLETED', 'FAILED'],
  GENERATING_SCENE: ['VALIDATING_SCENE', 'FAILED'],
  VALIDATING_SCENE: ['REPAIRING_SCENE', 'GENERATING_SCENE', 'LORE_VALIDATING', 'FAILED'],
  REPAIRING_SCENE: ['VALIDATING_SCENE', 'LORE_VALIDATING', 'FAILED'],
  LORE_VALIDATING: ['EXTRACTING_DELTAS', 'FAILED'],
  EXTRACTING_DELTAS: ['AWAITING_CURATION', 'COMPLETED', 'FAILED'],
  AWAITING_CURATION: ['CANONIZING', 'COMPLETED', 'FAILED'],
  CANONIZING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Run the full episode generation pipeline for a series.
 *
 * This is the series-mode equivalent of the standard orchestrate() function.
 * It loads the lore, generates a lore-aware contract and plan, writes
 * scenes, validates against both the contract and lore, extracts state
 * deltas, and prepares the episode for curation.
 */
export async function orchestrateEpisode(
  options: EpisodeOrchestratorOptions,
): Promise<EpisodeGenerationResult> {
  const { request, provider, config, baseDir, llm = null, mode = 'draft', onEvent } = options

  let state: EpisodeOrchestratorState = 'IDLE'
  const events: EpisodeOrchestratorEvent[] = []

  function transition(to: EpisodeOrchestratorState, message: string): void {
    const allowed = VALID_TRANSITIONS[state]
    if (!allowed.includes(to)) {
      throw new Error(`Invalid state transition: ${state} → ${to}`)
    }
    state = to
    const event: EpisodeOrchestratorEvent = { state, message, timestamp: new Date().toISOString() }
    events.push(event)
    onEvent?.(event)
  }

  const result: EpisodeGenerationResult = {
    state: 'IDLE',
    events,
  }

  try {
    // 1. Load lore and corpus
    transition('LOADING_LORE', `Loading series ${request.series_id}`)

    const series = await loadSeries(baseDir, request.series_id)
    const lore = await loadLore(baseDir, request.series_id)
    await loadLatestSnapshot(baseDir, request.series_id)
    const corpus = await loadCorpus(provider)

    transition('LOADED_CORPUS', 'Lore and corpus loaded')

    // 2. Build episode arc context
    const episodeContext = buildEpisodeArcContext(series, lore, request)

    // 3. Selection
    const { selection } = runSelection(request, corpus)
    result.selection = selection
    transition('SELECTED', `Selected ${selection.primary_archetype} × ${selection.primary_genre}`)

    // 4. Lore-aware contract
    const contract = compileEpisodeContract({
      selection,
      request,
      corpus,
      config,
      lore,
      episodeContext,
      overarchingArc: series.overarching_arc,
    })
    result.contract = contract
    transition('CONTRACT_READY', `Episode contract compiled with ${contract.lore_constraints?.continuity_locks.length ?? 0} continuity locks`)

    if (mode === 'contract-only') {
      transition('COMPLETED', 'Contract-only mode — stopping')
      result.state = state
      return result
    }

    // 5. Lore-aware plan
    const plan = await buildEpisodePlan({
      contract,
      corpus,
      config,
      llm,
      selection,
      lore,
      episodeContext,
    })
    result.plan = plan
    transition('PLANNED', `Plan built: ${plan.beats.length} beats, ${plan.scenes.length} scenes`)

    if (mode === 'outline') {
      transition('COMPLETED', 'Outline mode — stopping')
      result.state = state
      return result
    }

    // 6. Generate scenes
    const sceneDrafts = new Map<string, string>()
    for (const scene of plan.scenes) {
      const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
      if (!beat) continue

      transition('GENERATING_SCENE', `Writing scene ${scene.scene_id}`)
      const sceneIndex = plan.scenes.indexOf(scene)
      const priorScenes = plan.scenes.slice(0, sceneIndex)
      const writeResult = await writeScene(scene, beat, contract, llm, plan, priorScenes)
      sceneDrafts.set(scene.scene_id, writeResult.content)

      // 7. Validate scene
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

      // 8. Repair loop
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
        if (validation.scenes[0]) {
          sceneResult.status = validation.scenes[0].status
          sceneResult.checks = validation.scenes[0].checks
        }
      }
    }

    result.sceneDrafts = sceneDrafts

    // 9. Full validation
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

    // 10. Lore validation
    transition('LORE_VALIDATING', 'Running lore consistency checks')
    const loreValidation = validateAgainstLore({
      plan,
      lore,
      episodeContext,
      overarchingArc: series.overarching_arc,
      sceneDrafts,
    })
    result.loreValidation = loreValidation

    if (loreValidation.overall_status === 'fail') {
      // Lore validation failures are logged but don't block — user curates
      events.push({
        state,
        message: `Lore validation failed: ${loreValidation.checks.filter((c) => c.status === 'fail').map((c) => c.type).join(', ')}`,
        timestamp: new Date().toISOString(),
      })
    }

    // 11. Extract state delta
    transition('EXTRACTING_DELTAS', 'Extracting state deltas')
    const stateDelta = extractStateDelta({
      plan,
      episodeId: generateEpisodeId(request.slot_number, request.candidate_label),
      lore,
    })
    result.stateDelta = stateDelta

    // 12. Build trace
    const trace = buildTrace({
      contract,
      scenes: plan.scenes,
      beats: plan.beats,
      validation: finalValidation,
    })
    result.trace = trace
    result.complianceReport = generateComplianceReport(trace, finalValidation, contract)

    // 13. Build episode metadata
    const episodeId = generateEpisodeId(request.slot_number, request.candidate_label)
    const episode: Episode = {
      episode_id: episodeId,
      series_id: request.series_id,
      slot_number: request.slot_number,
      candidate_label: request.candidate_label,
      title: `Episode ${request.slot_number} (${request.candidate_label})`,
      synopsis: plan.beats.map((b) => b.summary).join(' → '),
      created_at: new Date().toISOString(),
      canon_status: 'draft',
      overarching_phase: request.overarching_phase,
      episodic_archetype_id: selection.primary_archetype,
      genre_accent: request.genre_accent,
      artifacts: {
        request: 'request.json',
        selection_result: 'selection_result.json',
        story_contract: 'story_contract.json',
        story_plan: 'story_plan.json',
        scene_drafts: plan.scenes.map((s) => `scene_drafts/${s.scene_id}.md`),
        validation_results: 'validation_results.json',
        story_trace: 'story_trace.json',
        compliance_report: 'compliance_report.md',
      },
      state_delta: stateDelta,
      summary: {
        characters_featured: [
          ...new Set(plan.scenes.flatMap((s) => s.characters)),
        ],
        plot_threads_advanced: request.thread_priorities
          .filter((tp) => tp.action !== 'maintain')
          .map((tp) => tp.thread_id),
        key_events: plan.beats.slice(0, 3).map((b) => b.summary),
      },
    }
    result.episode = episode

    // 14. Persist episode artifacts to disk
    await saveEpisode(baseDir, request.series_id, episode)
    for (const [sceneId, content] of sceneDrafts) {
      await saveSceneDraft(
        baseDir,
        request.series_id,
        request.slot_number,
        request.candidate_label,
        sceneId,
        content,
      )
    }
    await persistStateDelta(
      baseDir,
      request.series_id,
      request.slot_number,
      request.candidate_label,
      stateDelta,
    )

    // 15. Update series with slot and episode index
    const updatedSeries = await loadSeries(baseDir, request.series_id)
    updateSeriesWithCandidate(updatedSeries, episode)
    await saveSeries(baseDir, updatedSeries)

    transition('AWAITING_CURATION', 'Episode generated — awaiting curation')
    transition('COMPLETED', 'Episode generation complete')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    try {
      transition('FAILED', errorMessage)
    } catch {
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

// ---------------------------------------------------------------------------
// Canonization entry point
// ---------------------------------------------------------------------------

/**
 * Canonize an episode: validate its delta against the lore, merge it in,
 * create a snapshot, and update the series.
 *
 * This is called after the user selects a candidate for a slot.
 */
export async function canonizeEpisodeFromDisk(
  baseDir: string,
  seriesId: string,
  slotNumber: number,
  candidateLabel: string,
): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
  const series = await loadSeries(baseDir, seriesId)
  const lore = await loadLore(baseDir, seriesId)

  // Load the episode
  const episodeId = generateEpisodeId(slotNumber, candidateLabel)
  const episodeIndexEntry = series.episode_index.episodes.find(
    (e) => e.episode_id === episodeId,
  )
  if (!episodeIndexEntry) {
    return { success: false, errors: [`Episode ${episodeId} not found in series index`], warnings: [] }
  }

  // Load the state delta
  let stateDelta: StateDelta
  try {
    const { loadStateDelta } = await import('./io.ts')
    stateDelta = await loadStateDelta(baseDir, seriesId, slotNumber, candidateLabel)
  } catch {
    return { success: false, errors: [`Could not load state delta for ${episodeId}`], warnings: [] }
  }

  // Validate delta against lore
  const deltaValidation = validateDeltaAgainstLore(lore, stateDelta)
  if (!deltaValidation.valid) {
    return {
      success: false,
      errors: deltaValidation.errors,
      warnings: deltaValidation.warnings,
    }
  }

  // Build the Episode object for canonization
  const episode: Episode = {
    episode_id: episodeId,
    series_id: seriesId,
    slot_number: slotNumber,
    candidate_label: candidateLabel,
    title: episodeIndexEntry.title,
    synopsis: '',
    created_at: episodeIndexEntry.created_at ?? new Date().toISOString(),
    canon_status: 'draft',
    overarching_phase: series.overarching_arc.current_phase,
    episodic_archetype_id: series.overarching_arc.archetype_id,
    artifacts: {
      request: 'request.json',
      selection_result: 'selection_result.json',
      story_contract: 'story_contract.json',
      story_plan: 'story_plan.json',
      scene_drafts: [],
      validation_results: 'validation_results.json',
      story_trace: 'story_trace.json',
      compliance_report: 'compliance_report.md',
    },
    state_delta: stateDelta,
    summary: { characters_featured: [], plot_threads_advanced: [], key_events: [] },
  }

  // Apply canonization
  const { lore: updatedLore, snapshot, series: updatedSeries } =
    applyCanonicalization(series, episode, stateDelta)

  // Validate updated lore
  const loreValidation = validateLore(updatedLore)

  // Persist everything
  await saveLore(baseDir, seriesId, updatedLore)
  await saveSnapshot(baseDir, seriesId, snapshot)
  await saveSeries(baseDir, updatedSeries)
  await saveEpisode(baseDir, seriesId, episode)

  return {
    success: true,
    errors: loreValidation.errors,
    warnings: [...deltaValidation.warnings, ...loreValidation.warnings],
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEpisodeArcContext(
  series: Series,
  lore: StoryLore,
  request: EpisodeRequest,
): EpisodeArcContext {
  const arc = series.overarching_arc
  const currentPhase = arc.current_phase

  // Find the phase guideline — we build a basic one from arc metadata
  const phaseGuideline = {
    node_id: currentPhase,
    role: arc.archetype_name,
    definition: `Overarching arc phase: ${currentPhase}`,
    entry_conditions: [] as string[],
    exit_conditions: [] as string[],
    failure_modes: [] as string[],
    signals_in_text: [] as string[],
    genre_obligation_links: [] as string[],
  }

  // Collect open threads
  const openThreads = lore.plot_threads.filter(
    (t) => t.status === 'open' || t.status === 'progressing',
  )

  return {
    overarching_phase: currentPhase,
    overarching_phase_guidelines: phaseGuideline,
    episodic_archetype_id: request.requested_archetype,
    arc_advancement_target: request.arc_advancement_target,
    open_plot_threads: openThreads,
    thread_priorities: request.thread_priorities,
  }
}

function updateSeriesWithCandidate(series: Series, episode: Episode): void {
  // Add to episode index if not already present
  const exists = series.episode_index.episodes.some(
    (e) => e.episode_id === episode.episode_id,
  )
  if (!exists) {
    series.episode_index.episodes.push(episode)
  }

  // Update or create slot
  let slot = series.slots.find((s) => s.slot_number === episode.slot_number)
  if (!slot) {
    slot = {
      slot_number: episode.slot_number,
      target_arc_phase: episode.overarching_phase,
      candidates: [],
      status: 'generating',
    }
    series.slots.push(slot)
  }

  if (!slot.candidates.includes(episode.episode_id)) {
    slot.candidates.push(episode.episode_id)
  }

  // If we have at least one candidate, set status to reviewing
  if (slot.candidates.length > 0 && slot.status === 'generating') {
    slot.status = 'reviewing'
  }

  series.total_candidates_generated++
}
