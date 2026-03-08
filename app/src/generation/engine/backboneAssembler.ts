/**
 * Backbone Assembler: composes a TemplatePack + StoryContract into an
 * ordered StoryBackbone with explicit slots, genre obligation distribution,
 * and a default chapter partition. Mostly deterministic — no LLM calls.
 *
 * Input:  StoryContract, TemplatePack, optional style directives
 * Output: StoryBackbone
 */

import type {
  StoryContract,
  TemplatePack,
  StoryBackbone,
  BackboneBeat,
  BackboneScene,
  SlotMap,
  ChapterPartitionEntry,
  StyleDirectives,
  CoveragePlan,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BackboneAssemblerOptions {
  /** Override default style directives. */
  styleDirectives?: Partial<StyleDirectives>
  /** Target number of scenes per beat (default: varies by role). */
  defaultScenesPerBeat?: number
}

/**
 * Assemble a StoryBackbone from a contract and template pack.
 * Deterministic: same inputs always produce the same output.
 */
export function assembleBackbone(
  contract: StoryContract,
  templatePack: TemplatePack,
  options: BackboneAssemblerOptions = {},
): StoryBackbone {
  // 1. Map archetype spine nodes → beats with scenes
  const beats = buildBeats(contract, templatePack, options)

  // 2. Distribute genre obligations across scenes
  const coveragePlan = distributeGenreObligations(beats, contract)

  // 3. Extract and assign slots
  assignSlots(beats, contract, templatePack)

  // 4. Build chapter partition
  const chapterPartition = buildChapterPartition(beats)

  // 5. Build style directives
  const styleDirectives = buildStyleDirectives(contract, options)

  return {
    schema_version: '1.0.0',
    run_id: contract.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: contract.source_corpus_hash,
    archetype_id: contract.archetype.archetype_id,
    genre_id: contract.genre.genre_id,
    beats,
    chapter_partition: chapterPartition,
    style_directives: styleDirectives,
    coverage_plan: coveragePlan,
  }
}

// ---------------------------------------------------------------------------
// Beat construction
// ---------------------------------------------------------------------------

/** Roles that typically warrant multiple scenes. */
const MULTI_SCENE_ROLES = new Set([
  'Climax', 'Ordeal', 'Crisis', 'Battle', 'Confrontation',
  'Supreme Ordeal', 'Dark Night', 'Transformation',
])

/** Roles that are lightweight and can share a scene. */
const LIGHTWEIGHT_ROLES = new Set([
  'Transition', 'Bridge', 'Threshold',
])

function buildBeats(
  contract: StoryContract,
  templatePack: TemplatePack,
  options: BackboneAssemblerOptions,
): BackboneBeat[] {
  const beats: BackboneBeat[] = []

  for (const spineNodeId of contract.archetype.spine_nodes) {
    const template = templatePack.archetype_node_templates[spineNodeId]
    const guideline = contract.phase_guidelines.find(
      (g) => g.node_id === spineNodeId,
    )

    const role = template?.role ?? guideline?.role ?? 'Unknown'
    const label = template?.label ?? spineNodeId
    const rawDefinition = template?.beat_summary_template ?? guideline?.definition ?? ''

    // Enrich definition with genre obligations and structural context
    const genreLinks = guideline?.genre_obligation_links ?? []
    const signals = template?.signals_to_include ?? []
    const definitionParts = [rawDefinition]
    if (genreLinks.length > 0) {
      definitionParts.push(`Genre obligations: ${genreLinks.join(', ')}`)
    }
    if (signals.length > 0) {
      definitionParts.push(`Signals: ${signals.slice(0, 3).join('; ')}`)
    }
    const definition = definitionParts.join(' | ')

    // Determine scene count
    const sceneCount = determineSceneCount(role, options)

    const scenes: BackboneScene[] = []
    for (let i = 0; i < sceneCount; i++) {
      const suffix = sceneCount > 1 ? `_${String(i + 1).padStart(2, '0')}` : ''
      const sceneId = `SCN_${spineNodeId}${suffix}`
      const sceneGoal = sceneCount > 1
        ? `${definition} (part ${i + 1} of ${sceneCount})`
        : definition

      scenes.push({
        scene_id: sceneId,
        scene_goal: sceneGoal,
        genre_obligations: [],
        slots: {},
        moment_stub: {
          archetype_node: spineNodeId,
          participant_roles: template?.required_elements ?? [],
          expected_transitions: [],
        },
      })
    }

    beats.push({
      beat_id: `BEAT_${spineNodeId}`,
      archetype_node_id: spineNodeId,
      label,
      role,
      definition,
      scenes,
    })
  }

  return beats
}

function determineSceneCount(
  role: string,
  options: BackboneAssemblerOptions,
): number {
  if (options.defaultScenesPerBeat) return options.defaultScenesPerBeat
  if (MULTI_SCENE_ROLES.has(role)) return 2
  if (LIGHTWEIGHT_ROLES.has(role)) return 1
  return 1
}

// ---------------------------------------------------------------------------
// Genre obligation distribution
// ---------------------------------------------------------------------------

function distributeGenreObligations(
  beats: BackboneBeat[],
  contract: StoryContract,
): CoveragePlan {
  // Collect all scenes in order
  const allScenes: BackboneScene[] = beats.flatMap((b) => b.scenes)
  if (allScenes.length === 0) {
    return { hard_constraints_assigned: 0, hard_constraints_total: 0, soft_constraints_assigned: 0, soft_constraints_total: 0 }
  }

  const hardConstraints = contract.genre.hard_constraints
  const softConstraints = contract.genre.soft_constraints

  let hardAssigned = 0
  let softAssigned = 0

  // Distribute hard constraints: spread evenly across scenes, every hard must appear at least once
  for (let i = 0; i < hardConstraints.length; i++) {
    const sceneIdx = i % allScenes.length
    const nodeId = hardConstraints[i]
    const label = findConstraintLabel(nodeId, contract)
    allScenes[sceneIdx].genre_obligations.push({
      node_id: nodeId,
      severity: 'hard',
      label,
    })
    hardAssigned++
  }

  // Distribute soft constraints: spread across scenes
  for (let i = 0; i < softConstraints.length; i++) {
    const sceneIdx = i % allScenes.length
    const nodeId = softConstraints[i]
    const label = findConstraintLabel(nodeId, contract)
    allScenes[sceneIdx].genre_obligations.push({
      node_id: nodeId,
      severity: 'soft',
      label,
    })
    softAssigned++
  }

  return {
    hard_constraints_assigned: hardAssigned,
    hard_constraints_total: hardConstraints.length,
    soft_constraints_assigned: softAssigned,
    soft_constraints_total: softConstraints.length,
  }
}

function findConstraintLabel(
  nodeId: string,
  contract: StoryContract,
): string {
  const guideline = contract.phase_guidelines.find(
    (g) => g.genre_obligation_links.includes(nodeId),
  )
  return guideline ? `Obligation from ${guideline.node_id}` : nodeId
}

// ---------------------------------------------------------------------------
// Slot extraction and assignment
// ---------------------------------------------------------------------------

/** Default character slots inferred from archetype node roles when no elements.json exists. */
const ROLE_DEFAULT_SLOTS: Record<string, { slots: string[]; place?: string }> = {
  'Ordinary World':       { slots: ['protagonist'], place: 'ordinary_world' },
  'Call to Adventure':    { slots: ['protagonist', 'herald'] },
  'Refusal':              { slots: ['protagonist'] },
  'Meeting the Mentor':   { slots: ['protagonist', 'mentor'] },
  'Crossing the Threshold': { slots: ['protagonist', 'threshold_guardian'], place: 'special_world' },
  'Tests, Allies, Enemies': { slots: ['protagonist', 'ally', 'antagonist'] },
  'Approach':             { slots: ['protagonist', 'ally'] },
  'Ordeal':               { slots: ['protagonist', 'antagonist'] },
  'Supreme Ordeal':       { slots: ['protagonist', 'antagonist'] },
  'Reward':               { slots: ['protagonist'] },
  'Road Back':            { slots: ['protagonist'] },
  'Resurrection':         { slots: ['protagonist', 'antagonist'] },
  'Return':               { slots: ['protagonist'], place: 'ordinary_world' },
  'Climax':               { slots: ['protagonist', 'antagonist'] },
  'Crisis':               { slots: ['protagonist'] },
  'Resolution':           { slots: ['protagonist'] },
  'Setup':                { slots: ['protagonist'], place: 'ordinary_world' },
  'Confrontation':        { slots: ['protagonist', 'antagonist'] },
  'Transformation':       { slots: ['protagonist'] },
  'Dark Night':           { slots: ['protagonist'] },
  'Battle':               { slots: ['protagonist', 'antagonist'] },
  'Revelation':           { slots: ['protagonist'] },
  'Downfall':             { slots: ['protagonist'] },
  'Fall':                 { slots: ['protagonist'] },
  'Reckoning':            { slots: ['protagonist', 'antagonist'] },
}

/** Minimum slots every story needs — applied to the first beat. */
const CORE_SLOTS = ['protagonist', 'antagonist']

function assignSlots(
  beats: BackboneBeat[],
  contract: StoryContract,
  templatePack: TemplatePack,
): void {
  const elementRequirements = contract.element_requirements ?? []
  const hasElementData = elementRequirements.length > 0

  // Track which core slots have been assigned globally
  const globalSlots = new Set<string>()

  for (const beat of beats) {
    const template = templatePack.archetype_node_templates[beat.archetype_node_id]
    const requiredElementSlots = template?.required_elements ?? []

    // Find which element requirements appear at this archetype node
    const nodeRequirements = elementRequirements.filter(
      (er) => er.appears_at_nodes.includes(beat.archetype_node_id),
    )

    for (const scene of beat.scenes) {
      const slots: SlotMap = {}

      if (hasElementData) {
        // Use element_requirements from elements.json
        for (const slotRef of requiredElementSlots) {
          const slotName = slotRef.replace(/^\{|\}$/g, '')
          slots[slotName] = {
            slot_name: slotName,
            category: inferSlotCategory(slotName),
            required: true,
            description: `Required element: ${slotName}`,
          }
        }
        for (const er of nodeRequirements) {
          const slotName = er.role_or_type
          if (!slots[slotName]) {
            slots[slotName] = {
              slot_name: slotName,
              category: er.category === 'character' ? 'character'
                : er.category === 'place' ? 'place'
                : er.category === 'object' ? 'object'
                : 'concept',
              required: er.required,
              description: er.definition,
            }
          }
        }
      } else {
        // Infer slots from archetype node role
        const roleDefaults = beat.role ? ROLE_DEFAULT_SLOTS[beat.role] : undefined
        const slotNames = roleDefaults?.slots ?? CORE_SLOTS

        for (const slotName of slotNames) {
          slots[slotName] = {
            slot_name: slotName,
            category: inferSlotCategory(slotName),
            required: true,
            description: `${slotName} — inferred from ${beat.role} phase`,
          }
          globalSlots.add(slotName)
        }

        // Add place slot if defined for this role
        if (roleDefaults?.place) {
          slots[roleDefaults.place] = {
            slot_name: roleDefaults.place,
            category: 'place',
            required: false,
            description: `Setting for ${beat.role} phase`,
          }
          globalSlots.add(roleDefaults.place)
        }
      }

      scene.slots = slots
    }
  }

  // Ensure core slots appear at least in the first scene
  if (!hasElementData && beats.length > 0 && beats[0].scenes.length > 0) {
    const firstScene = beats[0].scenes[0]
    for (const core of CORE_SLOTS) {
      if (!firstScene.slots[core]) {
        firstScene.slots[core] = {
          slot_name: core,
          category: inferSlotCategory(core),
          required: true,
          description: `Core story role: ${core}`,
        }
      }
    }
  }
}

/** Known place and object slot names for category inference. */
const PLACE_SLOTS = new Set([
  'ordinary_world', 'special_world', 'underworld', 'home', 'threshold',
  'setting', 'arena', 'sanctuary', 'fortress', 'kingdom', 'village',
  'city', 'wilderness', 'labyrinth', 'prison', 'temple', 'court',
])

const OBJECT_SLOTS = new Set([
  'talisman', 'weapon', 'treasure', 'elixir', 'artifact', 'key',
  'map', 'potion', 'scroll', 'relic', 'token', 'gift', 'tool',
])

function inferSlotCategory(slotName: string): 'character' | 'place' | 'object' | 'concept' {
  if (PLACE_SLOTS.has(slotName)) return 'place'
  if (OBJECT_SLOTS.has(slotName)) return 'object'
  return 'character'
}

// ---------------------------------------------------------------------------
// Chapter partition
// ---------------------------------------------------------------------------

/**
 * Build a default chapter partition by grouping beats into acts.
 * Uses a simple three-act structure: ~25% Act 1, ~50% Act 2, ~25% Act 3.
 */
function buildChapterPartition(beats: BackboneBeat[]): ChapterPartitionEntry[] {
  if (beats.length === 0) return []

  const totalBeats = beats.length

  // For very short stories (≤3 beats), use two-chapter structure (setup/resolution)
  if (totalBeats <= 3) {
    const midpoint = Math.ceil(totalBeats / 2)
    const setupBeats = beats.slice(0, midpoint)
    const resolutionBeats = beats.slice(midpoint)
    const chapters: ChapterPartitionEntry[] = [
      {
        chapter_id: 'CH_01',
        title: 'Chapter 1: Setup',
        beat_ids: setupBeats.map((b) => b.beat_id),
        tone_goal: setupBeats[0].role,
      },
    ]
    if (resolutionBeats.length > 0) {
      chapters.push({
        chapter_id: 'CH_02',
        title: 'Chapter 2: Resolution',
        beat_ids: resolutionBeats.map((b) => b.beat_id),
        tone_goal: resolutionBeats[0].role,
      })
    }
    return chapters
  }

  // Three-act split
  const act1End = Math.max(1, Math.round(totalBeats * 0.25))
  const act2End = Math.max(act1End + 1, Math.round(totalBeats * 0.75))

  const chapters: ChapterPartitionEntry[] = []

  // Act 1
  const act1Beats = beats.slice(0, act1End)
  chapters.push({
    chapter_id: 'CH_01',
    title: 'Chapter 1: Setup',
    beat_ids: act1Beats.map((b) => b.beat_id),
    tone_goal: 'Establish world and characters',
    pace_directive: 'measured',
  })

  // Act 2 — split into subchapters if many beats
  const act2Beats = beats.slice(act1End, act2End)
  const act2ChunkSize = Math.max(2, Math.ceil(act2Beats.length / 2))
  for (let i = 0; i < act2Beats.length; i += act2ChunkSize) {
    const chunk = act2Beats.slice(i, i + act2ChunkSize)
    const chNum = chapters.length + 1
    chapters.push({
      chapter_id: `CH_${String(chNum).padStart(2, '0')}`,
      title: `Chapter ${chNum}: Confrontation`,
      beat_ids: chunk.map((b) => b.beat_id),
      tone_goal: 'Escalate conflict and stakes',
      pace_directive: 'building',
    })
  }

  // Act 3
  const act3Beats = beats.slice(act2End)
  if (act3Beats.length > 0) {
    const chNum = chapters.length + 1
    chapters.push({
      chapter_id: `CH_${String(chNum).padStart(2, '0')}`,
      title: `Chapter ${chNum}: Resolution`,
      beat_ids: act3Beats.map((b) => b.beat_id),
      tone_goal: 'Resolve and reflect',
      pace_directive: 'fast then reflective',
    })
  }

  return chapters
}

// ---------------------------------------------------------------------------
// Style directives
// ---------------------------------------------------------------------------

function buildStyleDirectives(
  _contract: StoryContract,
  options: BackboneAssemblerOptions,
): StyleDirectives {
  const overrides = options.styleDirectives ?? {}

  return {
    global_voice: overrides.global_voice ?? 'third-person past tense',
    global_pacing: overrides.global_pacing ?? 'balanced',
    feature_pack_ids: overrides.feature_pack_ids ?? [],
    lexicon: overrides.lexicon ?? {
      canonical_terms: {},
      prohibited_synonyms: [],
      naming_rules: [],
    },
  }
}
