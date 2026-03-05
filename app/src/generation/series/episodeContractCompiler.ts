/**
 * Episode Contract Compiler: extends the standard contract compiler with
 * lore awareness for series-mode episode generation.
 *
 * Wraps the existing compileContract() and adds lore-derived constraint
 * sections: existing characters, world rules, plot thread obligations,
 * arc phase constraints, and continuity locks.
 */

import type {
  SelectionResult,
  StoryContract,
  LoadedCorpus,
  GenerationConfig,
  ContractLoreCharacter,
  ContractWorldRule,
  ContractThreadObligation,
  ContractArcPhaseContext,
  ContractLoreConstraints,
} from '../artifacts/types.ts'
import { compileContract } from '../engine/contractCompiler.ts'
import type {
  EpisodeRequest,
  StoryLore,
  EpisodeArcContext,
  LoreCharacter,
  PlotThread,
  OverarchingArc,
} from './types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EpisodeContractInput {
  selection: SelectionResult
  request: EpisodeRequest
  corpus: LoadedCorpus
  config: GenerationConfig
  lore: StoryLore
  episodeContext: EpisodeArcContext
  overarchingArc: OverarchingArc
}

/**
 * Compile a lore-aware StoryContract for an episode.
 *
 * Delegates to the standard compileContract for base sections, then
 * overlays lore-derived constraints.
 */
export function compileEpisodeContract(input: EpisodeContractInput): StoryContract {
  const { selection, request, corpus, config, lore, episodeContext, overarchingArc } = input

  // 1. Build the standard contract
  const baseContract = compileContract(selection, request, corpus, config)

  // 2. Build lore constraints
  const loreConstraints = buildLoreConstraints(lore, episodeContext, overarchingArc)

  // 3. Extend global boundaries with lore-derived musts/must_nots
  const extendedBoundaries = {
    ...baseContract.global_boundaries,
    musts: [
      ...baseContract.global_boundaries.musts,
      ...buildLoreMusts(lore, episodeContext),
    ],
    must_nots: [
      ...baseContract.global_boundaries.must_nots,
      ...buildLoreMustNots(lore),
    ],
  }

  return {
    ...baseContract,
    global_boundaries: extendedBoundaries,
    lore_constraints: loreConstraints,
  }
}

// ---------------------------------------------------------------------------
// Lore constraints builder
// ---------------------------------------------------------------------------

function buildLoreConstraints(
  lore: StoryLore,
  episodeContext: EpisodeArcContext,
  overarchingArc: OverarchingArc,
): ContractLoreConstraints {
  return {
    characters: buildCharacterConstraints(lore),
    world_rules: buildWorldRuleConstraints(lore),
    thread_obligations: buildThreadObligations(episodeContext),
    arc_phase: buildArcPhaseContext(episodeContext, overarchingArc),
    continuity_locks: buildContinuityLocks(lore),
  }
}

// ---------------------------------------------------------------------------
// Character constraints
// ---------------------------------------------------------------------------

function buildCharacterConstraints(lore: StoryLore): ContractLoreCharacter[] {
  return lore.characters.map((char) => ({
    id: char.id,
    name: char.name,
    role: char.role,
    status: char.status,
    current_location: char.current_location,
    must_appear: false,  // Default; can be overridden by thread obligations
    must_not_appear: char.status === 'dead',
  }))
}

// ---------------------------------------------------------------------------
// World rules
// ---------------------------------------------------------------------------

function buildWorldRuleConstraints(lore: StoryLore): ContractWorldRule[] {
  return lore.world_rules.map((rule) => ({
    id: rule.id,
    rule: rule.rule,
    source: rule.source,
  }))
}

// ---------------------------------------------------------------------------
// Thread obligations
// ---------------------------------------------------------------------------

function buildThreadObligations(
  episodeContext: EpisodeArcContext,
): ContractThreadObligation[] {
  return episodeContext.thread_priorities.map((tp) => {
    const thread = episodeContext.open_plot_threads.find((t) => t.id === tp.thread_id)
    return {
      thread_id: tp.thread_id,
      title: thread?.title ?? tp.thread_id,
      action: tp.action,
      urgency: thread?.urgency ?? 'medium',
    }
  })
}

// ---------------------------------------------------------------------------
// Arc phase context
// ---------------------------------------------------------------------------

function buildArcPhaseContext(
  episodeContext: EpisodeArcContext,
  overarchingArc: OverarchingArc,
): ContractArcPhaseContext {
  const guidelines = episodeContext.overarching_phase_guidelines
  return {
    current_phase_node_id: guidelines.node_id,
    current_phase_role: guidelines.role,
    current_phase_definition: guidelines.definition,
    entry_conditions: guidelines.entry_conditions,
    exit_conditions: guidelines.exit_conditions,
    advancement_target: episodeContext.arc_advancement_target,
  }
}

// ---------------------------------------------------------------------------
// Continuity locks
// ---------------------------------------------------------------------------

function buildContinuityLocks(lore: StoryLore): string[] {
  const locks: string[] = []

  // Dead characters are locked
  for (const char of lore.characters) {
    if (char.status === 'dead') {
      locks.push(`Character '${char.name}' (${char.id}) is dead — cannot appear alive`)
    }
  }

  // Destroyed places are locked
  for (const place of lore.places) {
    if (place.status === 'destroyed') {
      locks.push(`Place '${place.name}' (${place.id}) is destroyed — cannot be used as active setting`)
    }
  }

  // Destroyed objects are locked
  for (const obj of lore.objects) {
    if (obj.status === 'destroyed') {
      locks.push(`Object '${obj.name}' (${obj.id}) is destroyed — cannot be used`)
    }
  }

  // Resolved threads are locked
  for (const thread of lore.plot_threads) {
    if (thread.status === 'resolved') {
      locks.push(`Plot thread '${thread.title}' (${thread.id}) is resolved — cannot be reopened`)
    }
  }

  return locks
}

// ---------------------------------------------------------------------------
// Lore-derived boundary extensions
// ---------------------------------------------------------------------------

function buildLoreMusts(
  lore: StoryLore,
  episodeContext: EpisodeArcContext,
): string[] {
  const musts: string[] = []

  // Arc phase requirements
  musts.push(
    `Episode must operate within overarching arc phase: ${episodeContext.overarching_phase} — ${episodeContext.overarching_phase_guidelines.definition}`,
  )

  // Thread obligations
  for (const tp of episodeContext.thread_priorities) {
    const thread = episodeContext.open_plot_threads.find((t) => t.id === tp.thread_id)
    if (thread && tp.action !== 'maintain') {
      musts.push(
        `Plot thread '${thread.title}': ${tp.action} (urgency: ${thread.urgency})`,
      )
    }
  }

  // World rules
  for (const rule of lore.world_rules) {
    musts.push(`World rule: ${rule.rule}`)
  }

  return musts
}

function buildLoreMustNots(lore: StoryLore): string[] {
  const mustNots: string[] = []

  // Dead characters cannot appear alive
  for (const char of lore.characters) {
    if (char.status === 'dead') {
      mustNots.push(`Dead character '${char.name}' must not appear as a living participant`)
    }
  }

  // Destroyed places cannot be active settings
  for (const place of lore.places) {
    if (place.status === 'destroyed') {
      mustNots.push(`Destroyed place '${place.name}' must not be used as an active setting`)
    }
  }

  return mustNots
}
