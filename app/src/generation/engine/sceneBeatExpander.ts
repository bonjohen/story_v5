/**
 * SceneBeatExpander: breaks each scene into 4-8 internal beat points that
 * define the dramatic structure, turning points, and emotional progression
 * within the scene.
 *
 * Deterministic logic: analyzes scene goal, constraints, emotional scores,
 * and character count to produce typed beat points with sequencing rules
 * and emotional curve distribution.
 */

import type {
  Scene,
  Beat,
  StoryContract,
  BeatExpansionConfig,
  SceneBeatType,
  SceneBeatPoint,
  SceneBeatExpansion,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default beat expansion config. */
export const DEFAULT_BEAT_EXPANSION: BeatExpansionConfig = {
  enabled: true,
  max_beats_per_scene: 8,
  min_beats_per_scene: 4,
  batch_size: 1,
}

/** High-stakes archetype node roles that warrant more beat points. */
const HIGH_STAKES_ROLES = new Set([
  'Crisis', 'Climax', 'Ordeal', 'Reckoning', 'Confrontation',
  'Dark Moment', 'Final Push', 'Transformation',
])

/** Transitional roles that warrant fewer beat points. */
const TRANSITIONAL_ROLES = new Set([
  'Ordinary World', 'Return', 'Aftermath', 'Setup', 'Epilogue',
  'New Equilibrium',
])

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Expand a single scene into internal beat points.
 * Purely deterministic — no LLM required.
 */
export function expandSceneBeats(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  config: BeatExpansionConfig = DEFAULT_BEAT_EXPANSION,
): SceneBeatExpansion {
  const beatCount = determineBeatCount(scene, beat, config)
  const sequence = buildBeatSequence(beatCount)
  const emotionalCurve = buildEmotionalCurve(sequence, beat)
  const characterAssignments = assignCharacters(sequence, scene)
  const weights = assignWeights(sequence)

  const beatPoints: SceneBeatPoint[] = sequence.map((type, i) => ({
    beat_point_id: `${scene.scene_id}_BP${String(i + 1).padStart(2, '0')}`,
    scene_id: scene.scene_id,
    sequence: i + 1,
    type,
    micro_goal: buildDeterministicMicroGoal(type, scene, beat, contract, i, sequence.length),
    characters_active: characterAssignments[i],
    emotional_target: emotionalCurve[i],
    weight: weights[i],
  }))

  // Extract role for arc summary
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]/)
  const role = roleMatch ? roleMatch[1] : beat.archetype_node_id
  const sceneArcSummary = `The ${role.toLowerCase()} scene progresses from establishing the situation through escalating tension to a turning point, then resolves toward the next story phase.`

  return {
    scene_id: scene.scene_id,
    beat_points: beatPoints,
    scene_arc_summary: sceneArcSummary,
  }
}

/**
 * Expand all scenes in a plan into beat expansions.
 */
export function expandAllSceneBeats(
  scenes: Scene[],
  beats: Beat[],
  contract: StoryContract,
  config: BeatExpansionConfig = DEFAULT_BEAT_EXPANSION,
): SceneBeatExpansion[] {
  return scenes.map((scene) => {
    const beat = beats.find((b) => b.beat_id === scene.beat_id)
    if (!beat) {
      throw new Error(`No beat found for scene ${scene.scene_id} (beat_id: ${scene.beat_id})`)
    }
    return expandSceneBeats(scene, beat, contract, config)
  })
}

// ---------------------------------------------------------------------------
// Beat count determination
// ---------------------------------------------------------------------------

/**
 * Determine how many beat points a scene should have.
 * Based on: archetype node role, constraint density, character count, emotional intensity.
 */
export function determineBeatCount(
  scene: Scene,
  beat: Beat,
  config: BeatExpansionConfig,
): number {
  const min = config.min_beats_per_scene
  const max = config.max_beats_per_scene

  // Extract role from beat summary
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]/)
  const role = roleMatch ? roleMatch[1] : ''

  // Base count starts at midpoint
  let count = Math.round((min + max) / 2)

  // High-stakes roles get more beats
  if (HIGH_STAKES_ROLES.has(role)) {
    count = Math.max(count, max - 1)
  }

  // Transitional roles get fewer beats
  if (TRANSITIONAL_ROLES.has(role)) {
    count = Math.min(count, min + 1)
  }

  // More constraints → more beats needed to satisfy them
  const constraintDensity = scene.constraints_checklist.hard.length + scene.constraints_checklist.soft.length
  if (constraintDensity >= 4) count = Math.min(count + 1, max)

  // More characters → more beats for interactions
  if (scene.characters.length >= 3) count = Math.min(count + 1, max)

  // High emotional intensity (tension + fear > 1.4) → more beats
  const intensity = beat.target_emotional_scores.tension + beat.target_emotional_scores.fear
  if (intensity > 1.4) count = Math.min(count + 1, max)

  return Math.max(min, Math.min(max, count))
}

// ---------------------------------------------------------------------------
// Beat type sequencing
// ---------------------------------------------------------------------------

/**
 * Build a sequence of beat types for the given count.
 * Rules:
 * - Always starts with 'setup'
 * - Always ends with 'resolution'
 * - 'turning_point' placed near the middle (60% through)
 * - 'escalation' placed before turning points
 * - Fill remaining slots with dialogue, action, reaction, revelation
 */
export function buildBeatSequence(count: number): SceneBeatType[] {
  if (count < 2) return ['setup']
  if (count === 2) return ['setup', 'resolution']
  if (count === 3) return ['setup', 'turning_point', 'resolution']

  const sequence: SceneBeatType[] = new Array(count)

  // Fixed positions
  sequence[0] = 'setup'
  sequence[count - 1] = 'resolution'

  // Turning point at ~60% through
  const turningPointIdx = Math.round(count * 0.6)
  // Clamp to valid interior range
  const tpIdx = Math.max(2, Math.min(turningPointIdx, count - 2))
  sequence[tpIdx] = 'turning_point'

  // Escalation just before turning point
  if (tpIdx > 1 && !sequence[tpIdx - 1]) {
    sequence[tpIdx - 1] = 'escalation'
  }

  // Fill remaining slots with a rotating pool
  const fillTypes: SceneBeatType[] = ['dialogue', 'action', 'reaction', 'revelation', 'escalation']
  let fillIdx = 0

  for (let i = 0; i < count; i++) {
    if (!sequence[i]) {
      // Position 1 is often escalation or dialogue
      if (i === 1) {
        sequence[i] = 'escalation'
      }
      // Position after turning point is usually reaction
      else if (i === tpIdx + 1) {
        sequence[i] = 'reaction'
      } else {
        sequence[i] = fillTypes[fillIdx % fillTypes.length]
        fillIdx++
      }
    }
  }

  return sequence
}

// ---------------------------------------------------------------------------
// Emotional curve
// ---------------------------------------------------------------------------

/**
 * Distribute the beat's emotional scores across beat points as a curve.
 * - Tension rises to peak at turning_point, then eases
 * - Hope is inversely weighted to tension in the first half, rises in second half
 * - Fear follows tension but lagged slightly
 */
export function buildEmotionalCurve(
  sequence: SceneBeatType[],
  beat: Beat,
): Array<{ tension: number; hope: number; fear: number }> {
  const n = sequence.length
  const base = beat.target_emotional_scores

  return sequence.map((_type, i) => {
    // Normalized position [0, 1]
    const t = n > 1 ? i / (n - 1) : 0.5

    // Tension: rises to 0.6-0.7 mark, then partially eases
    const tensionCurve = t < 0.65
      ? base.tension * (0.5 + 0.8 * (t / 0.65))
      : base.tension * (1.3 - 0.5 * ((t - 0.65) / 0.35))

    // Hope: low in first half, rises in second half
    const hopeCurve = t < 0.5
      ? base.hope * (0.3 + 0.4 * t)
      : base.hope * (0.5 + t)

    // Fear: follows tension but shifted slightly later
    const fearShifted = Math.min(1, t + 0.1)
    const fearCurve = fearShifted < 0.7
      ? base.fear * (0.4 + 0.8 * (fearShifted / 0.7))
      : base.fear * (1.2 - 0.4 * ((fearShifted - 0.7) / 0.3))

    return {
      tension: clamp(tensionCurve, 0, 1),
      hope: clamp(hopeCurve, 0, 1),
      fear: clamp(fearCurve, 0, 1),
    }
  })
}

// ---------------------------------------------------------------------------
// Character assignment
// ---------------------------------------------------------------------------

/**
 * Assign characters to each beat point.
 * - Setup: all characters present
 * - Resolution: all characters present
 * - Dialogue: at least 2 characters
 * - Other types: subset based on position
 */
function assignCharacters(sequence: SceneBeatType[], scene: Scene): string[][] {
  const allChars = scene.characters
  if (allChars.length === 0) return sequence.map(() => [])

  return sequence.map((type) => {
    switch (type) {
      case 'setup':
      case 'resolution':
        return [...allChars]
      case 'dialogue':
        // Need at least 2 for dialogue; take first 2 or all if fewer
        return allChars.length >= 2 ? allChars.slice(0, 2) : [...allChars]
      case 'reaction':
        // Usually focuses on protagonist (first character)
        return [allChars[0]]
      default:
        // Action, escalation, revelation, turning_point: all characters
        return [...allChars]
    }
  })
}

// ---------------------------------------------------------------------------
// Weight assignment
// ---------------------------------------------------------------------------

/**
 * Assign prose weight (length guidance) to each beat point.
 * - setup, resolution: 'short'
 * - turning_point, dialogue: 'long'
 * - others: 'medium'
 */
function assignWeights(sequence: SceneBeatType[]): Array<'short' | 'medium' | 'long'> {
  return sequence.map((type) => {
    switch (type) {
      case 'setup':
      case 'resolution':
        return 'short'
      case 'turning_point':
      case 'dialogue':
        return 'long'
      default:
        return 'medium'
    }
  })
}

// ---------------------------------------------------------------------------
// Deterministic micro-goals
// ---------------------------------------------------------------------------

/**
 * Build a deterministic micro-goal for a beat point based on its type,
 * position, scene context, and contract constraints.
 */
function buildDeterministicMicroGoal(
  type: SceneBeatType,
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  index: number,
  totalBeats: number,
): string {
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]\s*(.*)/)
  const role = roleMatch ? roleMatch[1] : beat.archetype_node_id
  const definition = roleMatch ? roleMatch[2] : beat.summary
  const genreName = contract.genre.name
  const setting = scene.setting || 'the scene location'

  switch (type) {
    case 'setup':
      return `Establish the ${setting} and introduce the characters present. Set the mood and atmosphere appropriate for a ${genreName} ${role.toLowerCase()} scene.`

    case 'escalation':
      if (index < totalBeats / 2) {
        return `Raise the stakes by introducing a complication or revealing pressure that demands response. Build toward the scene's central conflict.`
      }
      return `Intensify the situation further — the characters face mounting pressure with diminishing options.`

    case 'turning_point':
      return `Deliver the scene's pivotal moment: ${definition.charAt(0).toLowerCase() + definition.slice(1)} This reversal or decision changes the trajectory of the scene irreversibly.`

    case 'dialogue':
      return `A character exchange that advances the scene's objective through conversation — revealing motivations, creating conflict, or negotiating terms. The dialogue must move the plot forward, not merely fill space.`

    case 'action':
      return `Physical action, movement, or confrontation that manifests the scene's conflict in concrete terms. Show the characters doing, not merely thinking or talking.`

    case 'reaction':
      return `The characters process what has just occurred. Internal response, recalibration, and emotional reckoning — this is where the reader understands the weight of the turning point.`

    case 'revelation':
      return `New information surfaces that recontextualizes the scene or the broader story. This can come through discovery, confession, or deduction — but it must change the characters' understanding.`

    case 'resolution':
      if (beat.required_exit_conditions.length > 0) {
        const conditions = beat.required_exit_conditions.slice(0, 2).join('; ')
        return `Close the scene by satisfying the required exit conditions: ${conditions}. Set up the transition to the next story phase.`
      }
      return `Close the scene with a sense of consequence — what happened here is irreversible. Set up the transition to the next story phase.`

    default:
      return `Advance the scene's objective: ${scene.scene_goal}`
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
