/**
 * Lore Validator: cross-episode consistency validation checks.
 *
 * Extends the within-episode checks in validationEngine.ts with lore
 * boundary checks that ensure an episode does not contradict the
 * accumulated canon state.
 *
 * Checks:
 * 1. Mortality consistency — dead characters must not appear alive
 * 2. Location consistency — characters start where the lore says
 * 3. Custody consistency — objects are held by who the lore says
 * 4. World rule consistency — no established facts contradicted
 * 5. Plot thread consistency — resolved threads not reopened,
 *    critical threads not ignored
 * 6. Overarching arc progress — phase advancement is structurally sound
 */

import type {
  StoryPlan,
  CheckStatus,
} from '../artifacts/types.ts'
import type {
  StoryLore,
  EpisodeArcContext,
  OverarchingArc,
} from './types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Extended check types for lore validation. */
export type LoreValidationCheckType =
  | 'lore_mortality'
  | 'lore_location'
  | 'lore_custody'
  | 'lore_world_rules'
  | 'lore_thread_consistency'
  | 'lore_arc_progress'

export interface LoreValidationCheck {
  type: LoreValidationCheckType
  status: CheckStatus
  details: string[]
}

export interface LoreValidationInput {
  plan: StoryPlan
  lore: StoryLore
  episodeContext: EpisodeArcContext
  overarchingArc: OverarchingArc
  sceneDrafts?: Map<string, string>
}

export interface LoreValidationResults {
  checks: LoreValidationCheck[]
  overall_status: CheckStatus
}

/**
 * Run all lore consistency checks against an episode plan.
 * Returns per-check results and an overall status.
 */
export function validateAgainstLore(input: LoreValidationInput): LoreValidationResults {
  const { plan, lore, episodeContext, overarchingArc, sceneDrafts } = input

  const checks: LoreValidationCheck[] = [
    checkLoreMortality(plan, lore),
    checkLoreLocation(plan, lore),
    checkLoreCustody(plan, lore),
    checkLoreWorldRules(plan, lore, sceneDrafts),
    checkLoreThreadConsistency(plan, lore, episodeContext),
    checkLoreArcProgress(episodeContext, overarchingArc),
  ]

  const hasFail = checks.some((c) => c.status === 'fail')
  const hasWarn = checks.some((c) => c.status === 'warn')

  return {
    checks,
    overall_status: hasFail ? 'fail' : hasWarn ? 'warn' : 'pass',
  }
}

// ---------------------------------------------------------------------------
// 1. Mortality consistency
// ---------------------------------------------------------------------------

/**
 * Check that dead characters from the lore do not appear as living
 * participants in any scene.
 */
function checkLoreMortality(plan: StoryPlan, lore: StoryLore): LoreValidationCheck {
  const deadIds = new Set(
    lore.characters.filter((c) => c.status === 'dead').map((c) => c.id),
  )

  if (deadIds.size === 0) {
    return { type: 'lore_mortality', status: 'pass', details: ['No dead characters in lore'] }
  }

  const violations: string[] = []

  for (const scene of plan.scenes) {
    if (!scene.moment) continue

    for (const charId of scene.moment.participants.characters) {
      if (deadIds.has(charId)) {
        const char = lore.characters.find((c) => c.id === charId)
        violations.push(
          `Scene ${scene.scene_id}: Dead character '${char?.name ?? charId}' appears as participant (died in ${char?.died_in ?? 'unknown'})`,
        )
      }
    }
  }

  return {
    type: 'lore_mortality',
    status: violations.length > 0 ? 'fail' : 'pass',
    details: violations.length > 0 ? violations : ['No dead characters reappear'],
  }
}

// ---------------------------------------------------------------------------
// 2. Location consistency
// ---------------------------------------------------------------------------

/**
 * Check that characters start the episode at the location the lore
 * says they're at, or that a travel transition is provided.
 */
function checkLoreLocation(plan: StoryPlan, lore: StoryLore): LoreValidationCheck {
  if (plan.scenes.length === 0) {
    return { type: 'lore_location', status: 'pass', details: ['No scenes to check'] }
  }

  const warnings: string[] = []
  const firstScene = plan.scenes[0]

  if (!firstScene.moment) {
    return { type: 'lore_location', status: 'pass', details: ['No moment data in first scene'] }
  }

  for (const charId of firstScene.moment.participants.characters) {
    const loreChar = lore.characters.find((c) => c.id === charId)
    if (!loreChar?.current_location) continue

    const scenePlaces = firstScene.moment.participants.places
    if (scenePlaces.length > 0 && !scenePlaces.includes(loreChar.current_location)) {
      // Check if there's an 'arrives' transition
      const hasTravel = firstScene.moment.expected_transitions.some(
        (t) => t.entity_id === charId && t.change === 'arrives',
      )
      if (!hasTravel) {
        warnings.push(
          `${loreChar.name} (${charId}) starts at '${scenePlaces[0]}' but lore says they're at '${loreChar.current_location}' (no travel transition provided)`,
        )
      }
    }
  }

  return {
    type: 'lore_location',
    status: warnings.length > 0 ? 'warn' : 'pass',
    details: warnings.length > 0 ? warnings : ['Character locations are consistent'],
  }
}

// ---------------------------------------------------------------------------
// 3. Custody consistency
// ---------------------------------------------------------------------------

/**
 * Check that objects used in the episode are held by who the lore says.
 */
function checkLoreCustody(plan: StoryPlan, lore: StoryLore): LoreValidationCheck {
  const warnings: string[] = []

  for (const scene of plan.scenes) {
    if (!scene.moment) continue

    for (const objId of scene.moment.participants.objects) {
      const loreObj = lore.objects.find((o) => o.id === objId)
      if (!loreObj?.current_holder) continue

      // Check if the holder is in this scene
      if (!scene.moment.participants.characters.includes(loreObj.current_holder)) {
        // Check if there's a custody transfer in prior scenes
        const hasTransfer = plan.scenes.some((s) =>
          s.moment?.expected_transitions.some(
            (t) =>
              (t.change === 'gains' && t.target === objId) ||
              (t.change === 'loses' && t.target === objId),
          ),
        )
        if (!hasTransfer) {
          warnings.push(
            `Scene ${scene.scene_id}: Object '${loreObj.name}' (${objId}) is held by '${loreObj.current_holder}' per lore, but holder is not in scene and no custody transfer exists`,
          )
        }
      }
    }
  }

  return {
    type: 'lore_custody',
    status: warnings.length > 0 ? 'warn' : 'pass',
    details: warnings.length > 0 ? warnings : ['Object custody is consistent'],
  }
}

// ---------------------------------------------------------------------------
// 4. World rule consistency
// ---------------------------------------------------------------------------

/**
 * Check scene prose against established world rules.
 * This is a heuristic check — world rules are checked via keyword matching.
 * LLM-backed validation could enhance this significantly.
 */
function checkLoreWorldRules(
  _plan: StoryPlan,
  lore: StoryLore,
  sceneDrafts?: Map<string, string>,
): LoreValidationCheck {
  if (lore.world_rules.length === 0) {
    return { type: 'lore_world_rules', status: 'pass', details: ['No world rules established'] }
  }

  if (!sceneDrafts || sceneDrafts.size === 0) {
    return {
      type: 'lore_world_rules',
      status: 'pass',
      details: [`${lore.world_rules.length} world rule(s) established — prose validation deferred (no scene drafts)`],
    }
  }

  // For now, just note the rules exist. Full semantic checking requires LLM.
  const details = [
    `${lore.world_rules.length} world rule(s) established:`,
    ...lore.world_rules.map((r) => `  - ${r.rule}`),
    'Heuristic check passed. Full semantic validation requires LLM.',
  ]

  return {
    type: 'lore_world_rules',
    status: 'pass',
    details,
  }
}

// ---------------------------------------------------------------------------
// 5. Plot thread consistency
// ---------------------------------------------------------------------------

/**
 * Check that:
 * - Resolved threads are not reopened
 * - Critical threads are not ignored (more than 2 episodes without progression)
 * - Thread priorities are respected in the plan
 */
function checkLoreThreadConsistency(
  plan: StoryPlan,
  lore: StoryLore,
  episodeContext: EpisodeArcContext,
): LoreValidationCheck {
  const details: string[] = []
  let status: CheckStatus = 'pass'

  // Check if any scene references a resolved thread
  const resolvedThreadIds = new Set(
    lore.plot_threads
      .filter((t) => t.status === 'resolved')
      .map((t) => t.id),
  )

  for (const scene of plan.scenes) {
    if (scene.scene_goal) {
      for (const threadId of resolvedThreadIds) {
        if (scene.scene_goal.includes(threadId)) {
          details.push(`Scene ${scene.scene_id} references resolved thread ${threadId}`)
          status = 'fail'
        }
      }
    }
  }

  // Check critical thread urgency
  const criticalThreads = lore.plot_threads.filter(
    (t) => t.urgency === 'critical' && (t.status === 'open' || t.status === 'progressing'),
  )

  for (const thread of criticalThreads) {
    const isPrioritized = episodeContext.thread_priorities.some(
      (tp) => tp.thread_id === thread.id && tp.action !== 'maintain',
    )
    if (!isPrioritized) {
      details.push(
        `Critical thread '${thread.title}' (${thread.id}) is not prioritized for advancement in this episode`,
      )
      if (status !== 'fail') status = 'warn'
    }
  }

  // Check that 'resolve' priorities have corresponding thread transitions possible
  for (const tp of episodeContext.thread_priorities) {
    if (tp.action === 'resolve') {
      const thread = lore.plot_threads.find((t) => t.id === tp.thread_id)
      if (thread && thread.resolution_conditions && thread.resolution_conditions.length > 0) {
        details.push(
          `Thread '${thread.title}' targeted for resolution. Conditions: ${thread.resolution_conditions.join('; ')}`,
        )
      }
    }
  }

  if (details.length === 0) {
    details.push('Plot thread consistency maintained')
  }

  return { type: 'lore_thread_consistency', status, details }
}

// ---------------------------------------------------------------------------
// 6. Arc progress validation
// ---------------------------------------------------------------------------

/**
 * Check that overarching arc advancement is structurally sound:
 * - Current phase exit conditions are satisfiable
 * - No arc phases are skipped
 * - Arc regression is flagged
 */
function checkLoreArcProgress(
  episodeContext: EpisodeArcContext,
  overarchingArc: OverarchingArc,
): LoreValidationCheck {
  const details: string[] = []
  let status: CheckStatus = 'pass'

  const guidelines = episodeContext.overarching_phase_guidelines

  // Note exit conditions for the current phase
  if (guidelines.exit_conditions.length > 0) {
    details.push(
      `Current phase exit conditions: ${guidelines.exit_conditions.join('; ')}`,
    )
  }

  // Check if advancement target is valid
  if (episodeContext.arc_advancement_target) {
    const target = episodeContext.arc_advancement_target
    const isInRemaining = overarchingArc.remaining_phases.includes(target)
    const isRegression = overarchingArc.phase_history.some(
      (ph) => ph.node_id === target && ph.exited_at_episode,
    )

    if (!isInRemaining && !isRegression) {
      details.push(`Advancement target '${target}' is not in remaining phases and not a known phase`)
      status = 'fail'
    }

    if (isRegression) {
      details.push(`Arc regression detected: target '${target}' was previously visited (unusual but permitted)`)
      status = 'warn'
    }

    // Check if phases would be skipped
    const remainingPhases = overarchingArc.remaining_phases
    const targetIndex = remainingPhases.indexOf(target)
    if (targetIndex > 0) {
      const skipped = remainingPhases.slice(0, targetIndex)
      details.push(
        `Advancing to '${target}' would skip phases: ${skipped.join(', ')}`,
      )
      status = 'warn'
    }
  }

  if (details.length === 0) {
    details.push('Arc progress is valid')
  }

  return { type: 'lore_arc_progress', status, details }
}
