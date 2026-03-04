/**
 * Planner: builds beat outlines and scene specifications from a StoryContract.
 * Deterministic scaffolding with optional LLM enhancement for summaries.
 */

import type {
  StoryContract,
  StoryPlan,
  Beat,
  BeatHybridInfo,
  Scene,
  EmotionalScores,
  CoverageTargets,
  LoadedCorpus,
  GenerationConfig,
  SelectionResult,
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { enhancePlanWithLLM } from '../agents/plannerAgent.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PlannerOptions {
  contract: StoryContract
  corpus: LoadedCorpus
  config: GenerationConfig
  llm?: LLMAdapter | null
  selection?: SelectionResult | null
}

/**
 * Build a StoryPlan from a StoryContract.
 * Deterministic scaffolding is always produced. If an LLM adapter is
 * provided, beat summaries and scene goals are enhanced.
 */
export async function buildPlan(options: PlannerOptions): Promise<StoryPlan> {
  const { contract, corpus, config, llm, selection } = options

  // 1. Build beats from archetype spine nodes
  const beats = buildBeats(contract, corpus, selection ?? null)

  // 2. Build scenes from beats + genre obligations
  const scenes = buildScenes(beats, contract)

  // 3. Verify coverage
  verifyCoverage(scenes, contract, config)

  // 4. Optionally enhance with LLM
  if (llm) {
    await enhancePlanWithLLM(beats, scenes, contract, llm)
  }

  const coverageTargets: CoverageTargets = {
    hard_constraints_min_coverage: config.coverage_targets.hard_constraints_min_coverage,
    soft_constraints_min_coverage: config.coverage_targets.soft_constraints_min_coverage,
  }

  return {
    schema_version: '1.0.0',
    run_id: contract.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: contract.source_corpus_hash,
    beats,
    scenes,
    coverage_targets: coverageTargets,
  }
}

// ---------------------------------------------------------------------------
// Beat scaffolding
// ---------------------------------------------------------------------------

function buildBeats(
  contract: StoryContract,
  corpus: LoadedCorpus,
  selection: SelectionResult | null,
): Beat[] {
  const arcEmotionalArc = corpus.emotionalArcs.archetypes.find(
    (a) => a.archetype_id === contract.archetype.archetype_id,
  )

  // Resolve hybrid info if enabled
  let hybridContext: {
    sharedRoles: Set<string>
    divergenceRole: string
    secondaryId: string
    compositionMethod: BeatHybridInfo['composition_method']
  } | null = null

  if (selection?.hybrid_archetype.enabled) {
    const ha = selection.hybrid_archetype
    hybridContext = {
      sharedRoles: new Set(ha.shared_roles ?? []),
      divergenceRole: ha.divergence_point?.role ?? '',
      secondaryId: ha.secondary_archetype ?? '',
      compositionMethod: ha.composition_method ?? 'parallel_track',
    }
  }

  return contract.phase_guidelines.map((phase, index) => {
    const beatId = `B${String(index + 1).padStart(2, '0')}`

    // Look up emotional scores from arc profile
    let emotionalScores: EmotionalScores = { tension: 0.5, hope: 0.5, fear: 0.3, resolution: 0.0 }
    if (arcEmotionalArc) {
      const arcPoint = arcEmotionalArc.arc_profile.find(
        (p) => p.node_id === phase.node_id,
      )
      if (arcPoint) {
        emotionalScores = {
          tension: arcPoint.tension,
          hope: arcPoint.hope,
          fear: arcPoint.fear,
          resolution: arcPoint.resolution,
        }
      }
    }

    // Build hybrid annotation if applicable
    let hybridInfo: BeatHybridInfo | undefined
    if (hybridContext) {
      hybridInfo = {
        secondary_archetype_id: hybridContext.secondaryId,
        shared: hybridContext.sharedRoles.has(phase.role),
        divergence_beat: phase.role === hybridContext.divergenceRole,
        composition_method: hybridContext.compositionMethod,
      }
    }

    return {
      beat_id: beatId,
      archetype_node_id: phase.node_id,
      summary: `[${phase.role}] ${phase.definition}`,
      required_exit_conditions: phase.exit_conditions,
      target_emotional_scores: emotionalScores,
      ...(hybridInfo ? { hybrid_info: hybridInfo } : {}),
    }
  })
}

// ---------------------------------------------------------------------------
// Scene assignment
// ---------------------------------------------------------------------------

function buildScenes(beats: Beat[], contract: StoryContract): Scene[] {
  const scenes: Scene[] = []

  // Collect hard genre obligations (Level 5 Scene Obligations with severity hard)
  const hardObligations = contract.genre.hard_constraints.filter((id) =>
    isSceneObligation(id, contract),
  )
  const softObligations = contract.genre.soft_constraints.filter((id) =>
    isSceneObligation(id, contract),
  )

  // Get edges for archetype trace
  const edgeList = contract.archetype.required_edges

  let sceneIndex = 1
  let hardObligationIndex = 0
  let softObligationIndex = 0

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i]
    const sceneId = `S${String(sceneIndex).padStart(2, '0')}`

    // Determine edge_in and edge_out
    const edgeIn = i > 0 && i - 1 < edgeList.length ? edgeList[i - 1] : null
    const edgeOut = i < edgeList.length ? edgeList[i] : null

    // Assign genre obligations to this scene
    const sceneObligations: Scene['genre_obligations'] = []

    // Assign hard obligations round-robin
    if (hardObligations.length > 0) {
      const obligationId = hardObligations[hardObligationIndex % hardObligations.length]
      sceneObligations.push({ node_id: obligationId, severity: 'hard' })
      hardObligationIndex++
    }

    // Assign soft obligations round-robin
    if (softObligations.length > 0) {
      const obligationId = softObligations[softObligationIndex % softObligations.length]
      sceneObligations.push({ node_id: obligationId, severity: 'soft' })
      softObligationIndex++
    }

    // Build constraints checklist
    const hard = sceneObligations
      .filter((o) => o.severity === 'hard')
      .map((o) => o.node_id)
    const soft = sceneObligations
      .filter((o) => o.severity === 'soft')
      .map((o) => o.node_id)
    const mustNot = contract.genre.anti_patterns

    scenes.push({
      scene_id: sceneId,
      beat_id: beat.beat_id,
      setting: '',
      characters: [],
      scene_goal: `Fulfill ${beat.archetype_node_id} obligations`,
      archetype_trace: {
        node_id: beat.archetype_node_id,
        edge_in: edgeIn,
        edge_out: edgeOut,
      },
      genre_obligations: sceneObligations,
      constraints_checklist: { hard, soft, must_not: mustNot },
    })

    sceneIndex++
  }

  return scenes
}

/**
 * Check if a constraint ID belongs to a Scene Obligation (Level 5, N60-N79).
 */
function isSceneObligation(nodeId: string, contract: StoryContract): boolean {
  // Check if it's in levels["5"]
  const level5 = contract.genre.levels['5'] ?? []
  if (level5.includes(nodeId)) return true

  // Fallback: check node number range (60-79)
  const match = nodeId.match(/_N(\d{2})_/)
  if (match) {
    const num = parseInt(match[1], 10)
    return num >= 60 && num <= 79
  }
  return false
}

// ---------------------------------------------------------------------------
// Coverage verification
// ---------------------------------------------------------------------------

function verifyCoverage(
  scenes: Scene[],
  contract: StoryContract,
  config: GenerationConfig,
): void {
  // Verify every hard constraint is assigned to at least one scene
  const assignedHard = new Set<string>()
  for (const scene of scenes) {
    for (const item of scene.constraints_checklist.hard) {
      assignedHard.add(item)
    }
  }

  const hardObligations = contract.genre.hard_constraints.filter((id) =>
    isSceneObligation(id, contract),
  )

  const unassignedHard = hardObligations.filter((id) => !assignedHard.has(id))
  if (unassignedHard.length > 0 && config.coverage_targets.hard_constraints_min_coverage >= 1.0) {
    // Distribute unassigned obligations across scenes
    let idx = 0
    for (const obligationId of unassignedHard) {
      const scene = scenes[idx % scenes.length]
      scene.genre_obligations.push({ node_id: obligationId, severity: 'hard' })
      scene.constraints_checklist.hard.push(obligationId)
      idx++
    }
  }
}

