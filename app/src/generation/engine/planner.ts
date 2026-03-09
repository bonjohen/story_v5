/**
 * Planner: builds beat outlines and scene specifications from a StoryContract.
 * Deterministic scaffolding with optional LLM enhancement for summaries.
 */

import type {
  StoryContract,
  StoryPlan,
  StoryDetailBindings,
  Beat,
  Scene,
  SceneElement,
  EmotionalScores,
  CoverageTargets,
  ElementRoster,
  RosterEntry,
  ContractElementRequirement,
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
  detailBindings?: StoryDetailBindings | null
}

/**
 * Build a StoryPlan from a StoryContract.
 * Deterministic scaffolding is always produced. If an LLM adapter is
 * provided, beat summaries and scene goals are enhanced.
 */
export async function buildPlan(options: PlannerOptions): Promise<StoryPlan> {
  const { contract, corpus, config, llm, selection, detailBindings } = options

  // 1. Build beats from archetype spine nodes
  const beats = buildBeats(contract, corpus, selection ?? null)

  // 2. Build scenes from beats + genre obligations
  const scenes = buildScenes(beats, contract)

  // 3. Verify coverage
  verifyCoverage(scenes, contract, config)

  // 4. Build element roster — prefer detail bindings (real names/traits) over contract placeholders
  const elementRoster = detailBindings
    ? rosterFromDetailBindings(detailBindings)
    : buildElementRoster(contract)

  // 5. Populate scenes with element assignments and timeline moments
  populateScenesWithElements(scenes, contract, elementRoster)

  // 6. Validate element roster covers required template roles
  validateElementRosterCoverage(elementRoster, contract)

  // 7. Optionally enhance with LLM
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
    ...(elementRoster.characters.length > 0 || elementRoster.places.length > 0 || elementRoster.objects.length > 0
      ? { element_roster: elementRoster }
      : {}),
  }
}

// ---------------------------------------------------------------------------
// Beat scaffolding
// ---------------------------------------------------------------------------

function buildBeats(
  contract: StoryContract,
  corpus: LoadedCorpus,
  _selection: SelectionResult | null,
): Beat[] {
  const arcEmotionalArc = corpus.emotionalArcs.archetypes.find(
    (a) => a.archetype_id === contract.archetype.archetype_id,
  )

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

    return {
      beat_id: beatId,
      archetype_node_id: phase.node_id,
      summary: `[${phase.role}] ${phase.definition}`,
      required_exit_conditions: phase.exit_conditions,
      target_emotional_scores: emotionalScores,
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
  const level5 = contract.genre.levels['5'] ?? []
  if (level5.length === 0) {
    console.warn('[planner] Genre contract has no level 5 nodes — scene obligation detection may be incomplete')
  }
  return level5.includes(nodeId)
}

// ---------------------------------------------------------------------------
// Element roster
// ---------------------------------------------------------------------------

/**
 * Build a placeholder element roster from contract element requirements.
 * Characters, places, and objects get IDs and placeholder names derived
 * from their template labels. An LLM enhancement step can later replace
 * these with story-specific names.
 */
function buildElementRoster(contract: StoryContract): ElementRoster {
  const requirements = contract.element_requirements ?? []

  const characters: RosterEntry[] = requirements
    .filter((r) => r.category === 'character')
    .map((r, i) => ({
      id: `char_${String(i + 1).padStart(2, '0')}`,
      name: r.label,
      category: 'character' as const,
      role_or_type: r.role_or_type,
      description: r.definition,
    }))

  const places: RosterEntry[] = requirements
    .filter((r) => r.category === 'place')
    .map((r, i) => ({
      id: `place_${String(i + 1).padStart(2, '0')}`,
      name: r.label,
      category: 'place' as const,
      role_or_type: r.role_or_type,
      description: r.definition,
    }))

  const objects: RosterEntry[] = requirements
    .filter((r) => r.category === 'object')
    .map((r, i) => ({
      id: `obj_${String(i + 1).padStart(2, '0')}`,
      name: r.label,
      category: 'object' as const,
      role_or_type: r.role_or_type,
      description: r.definition,
    }))

  return { characters, places, objects }
}

/**
 * Build element roster from StoryDetailBindings — uses actual character names,
 * traits, and motivations so the writer prompt gets real story details.
 */
function rosterFromDetailBindings(bindings: StoryDetailBindings): ElementRoster {
  const characters: RosterEntry[] = bindings.entity_registry.characters.map((ch) => ({
    id: ch.id,
    name: ch.name || ch.role || ch.id,
    category: 'character' as const,
    role_or_type: ch.role || 'character',
    description: [
      ch.flaw ? `Flaw: ${ch.flaw}` : '',
      ch.traits?.length ? `Traits: ${ch.traits.join(', ')}` : '',
      ch.motivations?.length ? `Motivations: ${ch.motivations.join(', ')}` : '',
    ].filter(Boolean).join('. ') || undefined,
    traits: ch.traits,
    motivations: ch.motivations,
  }))

  const places: RosterEntry[] = bindings.entity_registry.places.map((pl) => ({
    id: pl.id,
    name: pl.name || pl.type || pl.id,
    category: 'place' as const,
    role_or_type: pl.type || 'setting',
    description: [
      pl.atmosphere ? `Atmosphere: ${pl.atmosphere}` : '',
      pl.features?.length ? `Features: ${pl.features.join(', ')}` : '',
    ].filter(Boolean).join('. ') || undefined,
  }))

  const objects: RosterEntry[] = bindings.entity_registry.objects.map((obj) => ({
    id: obj.id,
    name: obj.name || obj.type || obj.id,
    category: 'object' as const,
    role_or_type: obj.type || 'object',
    description: obj.significance || undefined,
  }))

  return { characters, places, objects }
}

/**
 * Populate scenes with element assignments and timeline moments based on
 * which template elements appear at each archetype node.
 */
function populateScenesWithElements(
  scenes: Scene[],
  contract: StoryContract,
  roster: ElementRoster,
): void {
  const requirements = contract.element_requirements ?? []

  // Build lookup: archetype node → which requirements appear there
  const nodeToRequirements = new Map<string, ContractElementRequirement[]>()
  for (const req of requirements) {
    for (const nodeId of req.appears_at_nodes) {
      if (!nodeToRequirements.has(nodeId)) nodeToRequirements.set(nodeId, [])
      nodeToRequirements.get(nodeId)!.push(req)
    }
  }

  // Build lookup: role_or_type → roster entry
  const roleToEntry = new Map<string, RosterEntry>()
  for (const entry of [...roster.characters, ...roster.places, ...roster.objects]) {
    roleToEntry.set(`${entry.category}:${entry.role_or_type}`, entry)
  }

  let momentIndex = 1
  for (const scene of scenes) {
    const nodeId = scene.archetype_trace.node_id
    const nodeReqs = nodeToRequirements.get(nodeId) ?? []

    // Assign scene elements
    const sceneElements: SceneElement[] = []
    const charIds: string[] = []
    const placeIds: string[] = []
    const objectIds: string[] = []

    for (const req of nodeReqs) {
      const entry = roleToEntry.get(`${req.category}:${req.role_or_type}`)
      if (!entry) continue

      sceneElements.push({
        id: entry.id,
        name: entry.name,
        role_or_type: entry.role_or_type,
      })

      if (req.category === 'character') charIds.push(entry.id)
      if (req.category === 'place') placeIds.push(entry.id)
      if (req.category === 'object') objectIds.push(entry.id)
    }

    // Populate the scene's character and setting fields
    scene.scene_elements = sceneElements
    scene.characters = charIds.length > 0 ? charIds : scene.characters
    scene.objects = objectIds
    if (placeIds.length > 0) {
      scene.setting = placeIds[0]  // Primary place for the scene
    }

    // Build timeline moment
    const momentId = `M${String(momentIndex).padStart(2, '0')}`
    scene.moment = {
      moment_id: momentId,
      archetype_node: nodeId,
      participants: {
        characters: charIds,
        places: placeIds,
        objects: objectIds,
      },
      expected_transitions: [],  // Transitions populated by LLM enhancement or manual authoring
    }
    momentIndex++
  }
}

/**
 * Validate that the element roster covers all required template roles.
 * Logs warnings for missing required elements.
 */
function validateElementRosterCoverage(
  roster: ElementRoster,
  contract: StoryContract,
): void {
  const requirements = contract.element_requirements ?? []
  const requiredRoles = requirements.filter((r) => r.required)

  const coveredRoles = new Set<string>()
  for (const entry of [...roster.characters, ...roster.places, ...roster.objects]) {
    coveredRoles.add(`${entry.category}:${entry.role_or_type}`)
  }

  for (const req of requiredRoles) {
    const key = `${req.category}:${req.role_or_type}`
    if (!coveredRoles.has(key)) {
      console.warn(`[Planner] Missing required element: ${req.category} '${req.role_or_type}' (${req.label})`)
    }
  }
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

