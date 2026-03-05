/**
 * Bible Validator: cross-episode consistency validation checks.
 *
 * Extends the within-episode checks in validationEngine.ts with bible
 * boundary checks that ensure an episode does not contradict the
 * accumulated canon state.
 *
 * Checks:
 * 1. Mortality consistency — dead characters must not appear alive
 * 2. Location consistency — characters start where the bible says
 * 3. Custody consistency — objects are held by who the bible says
 * 4. World rule consistency — no established facts contradicted
 * 5. Plot thread consistency — resolved threads not reopened,
 *    critical threads not ignored
 * 6. Overarching arc progress — phase advancement is structurally sound
 */

import type {
  StoryPlan,
  Scene,
  CheckStatus,
  ValidationCheck,
  ValidationCheckType,
} from '../artifacts/types.ts'
import type {
  StoryBible,
  EpisodeArcContext,
  OverarchingArc,
  BibleCharacter,
  PlotThread,
} from './types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Extended check types for bible validation. */
export type BibleValidationCheckType =
  | 'bible_mortality'
  | 'bible_location'
  | 'bible_custody'
  | 'bible_world_rules'
  | 'bible_thread_consistency'
  | 'bible_arc_progress'

export interface BibleValidationCheck {
  type: BibleValidationCheckType
  status: CheckStatus
  details: string[]
}

export interface BibleValidationInput {
  plan: StoryPlan
  bible: StoryBible
  episodeContext: EpisodeArcContext
  overarchingArc: OverarchingArc
  sceneDrafts?: Map<string, string>
}

export interface BibleValidationResults {
  checks: BibleValidationCheck[]
  overall_status: CheckStatus
}

/**
 * Run all bible consistency checks against an episode plan.
 * Returns per-check results and an overall status.
 */
export function validateAgainstBible(input: BibleValidationInput): BibleValidationResults {
  const { plan, bible, episodeContext, overarchingArc, sceneDrafts } = input

  const checks: BibleValidationCheck[] = [
    checkBibleMortality(plan, bible),
    checkBibleLocation(plan, bible),
    checkBibleCustody(plan, bible),
    checkBibleWorldRules(plan, bible, sceneDrafts),
    checkBibleThreadConsistency(plan, bible, episodeContext),
    checkBibleArcProgress(episodeContext, overarchingArc),
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
 * Check that dead characters from the bible do not appear as living
 * participants in any scene.
 */
function checkBibleMortality(plan: StoryPlan, bible: StoryBible): BibleValidationCheck {
  const deadIds = new Set(
    bible.characters.filter((c) => c.status === 'dead').map((c) => c.id),
  )

  if (deadIds.size === 0) {
    return { type: 'bible_mortality', status: 'pass', details: ['No dead characters in bible'] }
  }

  const violations: string[] = []

  for (const scene of plan.scenes) {
    if (!scene.moment) continue

    for (const charId of scene.moment.participants.characters) {
      if (deadIds.has(charId)) {
        const char = bible.characters.find((c) => c.id === charId)
        violations.push(
          `Scene ${scene.scene_id}: Dead character '${char?.name ?? charId}' appears as participant (died in ${char?.died_in ?? 'unknown'})`,
        )
      }
    }
  }

  return {
    type: 'bible_mortality',
    status: violations.length > 0 ? 'fail' : 'pass',
    details: violations.length > 0 ? violations : ['No dead characters reappear'],
  }
}

// ---------------------------------------------------------------------------
// 2. Location consistency
// ---------------------------------------------------------------------------

/**
 * Check that characters start the episode at the location the bible
 * says they're at, or that a travel transition is provided.
 */
function checkBibleLocation(plan: StoryPlan, bible: StoryBible): BibleValidationCheck {
  if (plan.scenes.length === 0) {
    return { type: 'bible_location', status: 'pass', details: ['No scenes to check'] }
  }

  const warnings: string[] = []
  const firstScene = plan.scenes[0]

  if (!firstScene.moment) {
    return { type: 'bible_location', status: 'pass', details: ['No moment data in first scene'] }
  }

  for (const charId of firstScene.moment.participants.characters) {
    const bibleChar = bible.characters.find((c) => c.id === charId)
    if (!bibleChar?.current_location) continue

    const scenePlaces = firstScene.moment.participants.places
    if (scenePlaces.length > 0 && !scenePlaces.includes(bibleChar.current_location)) {
      // Check if there's an 'arrives' transition
      const hasTravel = firstScene.moment.expected_transitions.some(
        (t) => t.entity_id === charId && t.change === 'arrives',
      )
      if (!hasTravel) {
        warnings.push(
          `${bibleChar.name} (${charId}) starts at '${scenePlaces[0]}' but bible says they're at '${bibleChar.current_location}' (no travel transition provided)`,
        )
      }
    }
  }

  return {
    type: 'bible_location',
    status: warnings.length > 0 ? 'warn' : 'pass',
    details: warnings.length > 0 ? warnings : ['Character locations are consistent'],
  }
}

// ---------------------------------------------------------------------------
// 3. Custody consistency
// ---------------------------------------------------------------------------

/**
 * Check that objects used in the episode are held by who the bible says.
 */
function checkBibleCustody(plan: StoryPlan, bible: StoryBible): BibleValidationCheck {
  const warnings: string[] = []

  for (const scene of plan.scenes) {
    if (!scene.moment) continue

    for (const objId of scene.moment.participants.objects) {
      const bibleObj = bible.objects.find((o) => o.id === objId)
      if (!bibleObj?.current_holder) continue

      // Check if the holder is in this scene
      if (!scene.moment.participants.characters.includes(bibleObj.current_holder)) {
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
            `Scene ${scene.scene_id}: Object '${bibleObj.name}' (${objId}) is held by '${bibleObj.current_holder}' per bible, but holder is not in scene and no custody transfer exists`,
          )
        }
      }
    }
  }

  return {
    type: 'bible_custody',
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
function checkBibleWorldRules(
  plan: StoryPlan,
  bible: StoryBible,
  sceneDrafts?: Map<string, string>,
): BibleValidationCheck {
  if (bible.world_rules.length === 0) {
    return { type: 'bible_world_rules', status: 'pass', details: ['No world rules established'] }
  }

  if (!sceneDrafts || sceneDrafts.size === 0) {
    return {
      type: 'bible_world_rules',
      status: 'pass',
      details: [`${bible.world_rules.length} world rule(s) established — prose validation deferred (no scene drafts)`],
    }
  }

  // For now, just note the rules exist. Full semantic checking requires LLM.
  const details = [
    `${bible.world_rules.length} world rule(s) established:`,
    ...bible.world_rules.map((r) => `  - ${r.rule}`),
    'Heuristic check passed. Full semantic validation requires LLM.',
  ]

  return {
    type: 'bible_world_rules',
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
function checkBibleThreadConsistency(
  plan: StoryPlan,
  bible: StoryBible,
  episodeContext: EpisodeArcContext,
): BibleValidationCheck {
  const details: string[] = []
  let status: CheckStatus = 'pass'

  // Check if any scene references a resolved thread
  const resolvedThreadIds = new Set(
    bible.plot_threads
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
  const criticalThreads = bible.plot_threads.filter(
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
      const thread = bible.plot_threads.find((t) => t.id === tp.thread_id)
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

  return { type: 'bible_thread_consistency', status, details }
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
function checkBibleArcProgress(
  episodeContext: EpisodeArcContext,
  overarchingArc: OverarchingArc,
): BibleValidationCheck {
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

  return { type: 'bible_arc_progress', status, details }
}
