/**
 * Episode Planner: extends the standard planner with lore awareness
 * for series-mode episode generation.
 *
 * Key differences from standard planning:
 * 1. Element roster is populated from the lore (not built from scratch)
 * 2. New characters are only added when the episode template calls for
 *    a role not yet filled in the lore
 * 3. Plot thread advancement is woven into beat planning
 * 4. Overarching arc context informs scene goals
 */

import type {
  StoryContract,
  StoryPlan,
  Beat,
  Scene,
  SceneElement,
  ElementRoster,
  RosterEntry,
  LoadedCorpus,
  GenerationConfig,
  SelectionResult,
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { buildPlan } from '../engine/planner.ts'
import type {
  StoryLore,
  EpisodeArcContext,
  LoreCharacter,
  LorePlace,
  LoreObject,
} from './types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EpisodePlannerOptions {
  contract: StoryContract
  corpus: LoadedCorpus
  config: GenerationConfig
  llm?: LLMAdapter | null
  selection?: SelectionResult | null
  lore: StoryLore
  episodeContext: EpisodeArcContext
}

/**
 * Build a lore-aware StoryPlan for an episode.
 *
 * Uses the standard planner as the base, then overlays lore-derived
 * element assignments, thread obligations, and arc context.
 */
export async function buildEpisodePlan(options: EpisodePlannerOptions): Promise<StoryPlan> {
  const { contract, corpus, config, llm, selection, lore, episodeContext } = options

  // 1. Build the standard plan (beats, scenes, element roster from templates)
  const basePlan = await buildPlan({ contract, corpus, config, llm, selection })

  // 2. Replace the element roster with a lore-sourced one
  const loreRoster = buildLoreRoster(lore, contract, basePlan.element_roster)

  // 3. Re-populate scenes with lore element assignments
  repopulateScenesWithLoreElements(basePlan.scenes, contract, loreRoster, lore)

  // 4. Weave plot thread obligations into scenes
  weaveThreadsIntoScenes(basePlan.scenes, basePlan.beats, episodeContext)

  // 5. Add overarching arc context to scene goals
  enrichSceneGoalsWithArcContext(basePlan.scenes, basePlan.beats, episodeContext)

  return {
    ...basePlan,
    element_roster: loreRoster,
  }
}

// ---------------------------------------------------------------------------
// Lore-sourced element roster
// ---------------------------------------------------------------------------

/**
 * Build an element roster from the lore, supplementing with template
 * entries for roles not yet filled.
 *
 * Characters/places/objects that exist in the lore are used directly.
 * Only roles from the archetype template that have no lore match get
 * new placeholder entries (same as the standard planner would create).
 */
function buildLoreRoster(
  lore: StoryLore,
  contract: StoryContract,
  templateRoster?: ElementRoster,
): ElementRoster {
  const requirements = contract.element_requirements ?? []

  // Collect lore characters keyed by role
  const loreCharsByRole = new Map<string, LoreCharacter>()
  for (const char of lore.characters) {
    if (char.status !== 'dead') {
      // Use the first living character for each role
      if (!loreCharsByRole.has(char.role)) {
        loreCharsByRole.set(char.role, char)
      }
    }
  }

  // Build character roster: prefer lore entries, fall back to template
  const characters: RosterEntry[] = []
  const usedLoreCharIds = new Set<string>()

  for (const req of requirements.filter((r) => r.category === 'character')) {
    const loreChar = loreCharsByRole.get(req.role_or_type)
    if (loreChar && !usedLoreCharIds.has(loreChar.id)) {
      characters.push({
        id: loreChar.id,
        name: loreChar.name,
        category: 'character',
        role_or_type: loreChar.role,
        description: loreChar.description,
        traits: loreChar.traits,
        motivations: loreChar.motivations,
      })
      usedLoreCharIds.add(loreChar.id)
    } else {
      // No lore match — use template placeholder
      const templateEntry = templateRoster?.characters.find(
        (c) => c.role_or_type === req.role_or_type,
      )
      if (templateEntry) {
        characters.push(templateEntry)
      } else {
        characters.push({
          id: `char_new_${req.role_or_type}`,
          name: req.label,
          category: 'character',
          role_or_type: req.role_or_type,
          description: req.definition,
        })
      }
    }
  }

  // Also include any lore characters involved in thread obligations
  // who aren't already in the roster
  const loreConstraints = contract.lore_constraints
  if (loreConstraints) {
    for (const obligation of loreConstraints.thread_obligations) {
      // Find characters related to the thread
      const thread = lore.plot_threads.find((t) => t.id === obligation.thread_id)
      if (!thread) continue
      for (const charId of thread.related_characters) {
        if (usedLoreCharIds.has(charId)) continue
        const loreChar = lore.characters.find((c) => c.id === charId)
        if (loreChar && loreChar.status !== 'dead') {
          characters.push({
            id: loreChar.id,
            name: loreChar.name,
            category: 'character',
            role_or_type: loreChar.role,
            description: loreChar.description,
            traits: loreChar.traits,
            motivations: loreChar.motivations,
          })
          usedLoreCharIds.add(loreChar.id)
        }
      }
    }
  }

  // Build place roster from lore
  const lorePlacesByType = new Map<string, LorePlace>()
  for (const place of lore.places) {
    if (place.status !== 'destroyed') {
      if (!lorePlacesByType.has(place.type)) {
        lorePlacesByType.set(place.type, place)
      }
    }
  }

  const places: RosterEntry[] = []
  for (const req of requirements.filter((r) => r.category === 'place')) {
    const lorePlace = lorePlacesByType.get(req.role_or_type)
    if (lorePlace) {
      places.push({
        id: lorePlace.id,
        name: lorePlace.name,
        category: 'place',
        role_or_type: lorePlace.type,
        description: lorePlace.description,
      })
    } else {
      const templateEntry = templateRoster?.places.find(
        (p) => p.role_or_type === req.role_or_type,
      )
      places.push(templateEntry ?? {
        id: `place_new_${req.role_or_type}`,
        name: req.label,
        category: 'place',
        role_or_type: req.role_or_type,
        description: req.definition,
      })
    }
  }

  // Build object roster from lore
  const loreObjectsByType = new Map<string, LoreObject>()
  for (const obj of lore.objects) {
    if (obj.status !== 'destroyed') {
      if (!loreObjectsByType.has(obj.type)) {
        loreObjectsByType.set(obj.type, obj)
      }
    }
  }

  const objects: RosterEntry[] = []
  for (const req of requirements.filter((r) => r.category === 'object')) {
    const loreObj = loreObjectsByType.get(req.role_or_type)
    if (loreObj) {
      objects.push({
        id: loreObj.id,
        name: loreObj.name,
        category: 'object',
        role_or_type: loreObj.type,
        description: loreObj.description,
      })
    } else {
      const templateEntry = templateRoster?.objects.find(
        (o) => o.role_or_type === req.role_or_type,
      )
      objects.push(templateEntry ?? {
        id: `obj_new_${req.role_or_type}`,
        name: req.label,
        category: 'object',
        role_or_type: req.role_or_type,
        description: req.definition,
      })
    }
  }

  return { characters, places, objects }
}

// ---------------------------------------------------------------------------
// Scene element repopulation
// ---------------------------------------------------------------------------

/**
 * Re-populate scene elements using the lore roster instead of template entries.
 * Uses the same archetype node → requirement mapping as the standard planner,
 * but resolves against lore-sourced IDs.
 */
function repopulateScenesWithLoreElements(
  scenes: Scene[],
  contract: StoryContract,
  roster: ElementRoster,
  lore: StoryLore,
): void {
  const requirements = contract.element_requirements ?? []

  // Build lookup: archetype node → requirements
  const nodeToReqs = new Map<string, typeof requirements>()
  for (const req of requirements) {
    for (const nodeId of req.appears_at_nodes) {
      if (!nodeToReqs.has(nodeId)) nodeToReqs.set(nodeId, [])
      nodeToReqs.get(nodeId)!.push(req)
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
    const nodeReqs = nodeToReqs.get(nodeId) ?? []

    const sceneElements: SceneElement[] = []
    const charIds: string[] = []
    const placeIds: string[] = []
    const objectIds: string[] = []

    for (const req of nodeReqs) {
      const entry = roleToEntry.get(`${req.category}:${req.role_or_type}`)
      if (!entry) continue

      // Skip dead characters
      if (req.category === 'character') {
        const loreChar = lore.characters.find((c) => c.id === entry.id)
        if (loreChar && loreChar.status === 'dead') continue
      }

      sceneElements.push({
        id: entry.id,
        name: entry.name,
        role_or_type: entry.role_or_type,
      })

      if (req.category === 'character') charIds.push(entry.id)
      if (req.category === 'place') placeIds.push(entry.id)
      if (req.category === 'object') objectIds.push(entry.id)
    }

    scene.scene_elements = sceneElements
    scene.characters = charIds.length > 0 ? charIds : scene.characters
    scene.objects = objectIds
    if (placeIds.length > 0) {
      scene.setting = placeIds[0]
    }

    // Update moment with lore element IDs
    const momentId = `M${String(momentIndex).padStart(2, '0')}`
    scene.moment = {
      moment_id: momentId,
      archetype_node: nodeId,
      participants: {
        characters: charIds,
        places: placeIds,
        objects: objectIds,
      },
      expected_transitions: scene.moment?.expected_transitions ?? [],
    }
    momentIndex++
  }
}

// ---------------------------------------------------------------------------
// Thread weaving
// ---------------------------------------------------------------------------

/**
 * Weave plot thread obligations into scene goals and constraints.
 *
 * Distributes thread obligations across scenes based on urgency and the
 * beat's position in the story arc.
 */
function weaveThreadsIntoScenes(
  scenes: Scene[],
  _beats: Beat[],
  episodeContext: EpisodeArcContext,
): void {
  const obligations = episodeContext.thread_priorities
  if (obligations.length === 0) return

  // Sort by urgency (critical first) then by action priority
  const actionPriority: Record<string, number> = {
    resolve: 0,
    advance: 1,
    introduce: 2,
    maintain: 3,
  }

  const sorted = [...obligations].sort((a, b) => {
    const threadA = episodeContext.open_plot_threads.find((t) => t.id === a.thread_id)
    const threadB = episodeContext.open_plot_threads.find((t) => t.id === b.thread_id)
    const urgencyOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    const urgDiff = (urgencyOrder[threadA?.urgency ?? 'medium'] ?? 2) - (urgencyOrder[threadB?.urgency ?? 'medium'] ?? 2)
    if (urgDiff !== 0) return urgDiff
    return (actionPriority[a.action] ?? 3) - (actionPriority[b.action] ?? 3)
  })

  // Distribute threads across scenes
  for (let i = 0; i < sorted.length; i++) {
    const obligation = sorted[i]
    const thread = episodeContext.open_plot_threads.find((t) => t.id === obligation.thread_id)
    if (!thread) continue

    // Assign to scene based on position:
    // - 'introduce' threads go to early scenes
    // - 'resolve' threads go to late scenes
    // - 'advance' threads go to middle scenes
    // - 'maintain' threads go to any scene
    let targetSceneIndex: number
    if (obligation.action === 'introduce') {
      targetSceneIndex = Math.min(i, Math.floor(scenes.length * 0.3))
    } else if (obligation.action === 'resolve') {
      targetSceneIndex = Math.max(scenes.length - 1 - i, Math.floor(scenes.length * 0.7))
    } else if (obligation.action === 'advance') {
      targetSceneIndex = Math.floor(scenes.length * 0.4) + (i % Math.max(1, Math.floor(scenes.length * 0.3)))
    } else {
      targetSceneIndex = i % scenes.length
    }

    targetSceneIndex = Math.max(0, Math.min(targetSceneIndex, scenes.length - 1))
    const scene = scenes[targetSceneIndex]

    // Enrich scene goal
    scene.scene_goal = `${scene.scene_goal} | Thread: ${obligation.action} '${thread.title}'`

    // Add thread-related characters to the scene if not already present
    for (const charId of thread.related_characters) {
      if (!scene.characters.includes(charId)) {
        scene.characters.push(charId)
      }
      if (scene.moment && !scene.moment.participants.characters.includes(charId)) {
        scene.moment.participants.characters.push(charId)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Arc context enrichment
// ---------------------------------------------------------------------------

/**
 * Enrich scene goals with overarching arc context.
 * Adds the current arc phase information to help the writer understand
 * how this episode fits into the larger story.
 */
function enrichSceneGoalsWithArcContext(
  scenes: Scene[],
  _beats: Beat[],
  episodeContext: EpisodeArcContext,
): void {
  const phaseGuidelines = episodeContext.overarching_phase_guidelines
  const arcLabel = `[Arc: ${phaseGuidelines.role}]`

  // Add arc context to the first and last scenes
  if (scenes.length > 0) {
    scenes[0].scene_goal = `${arcLabel} ${scenes[0].scene_goal}`
  }
  if (scenes.length > 1) {
    const lastScene = scenes[scenes.length - 1]
    lastScene.scene_goal = `${arcLabel} ${lastScene.scene_goal}`
  }

  // If there's an advancement target, annotate the last scene
  if (episodeContext.arc_advancement_target && scenes.length > 0) {
    const lastScene = scenes[scenes.length - 1]
    lastScene.scene_goal = `${lastScene.scene_goal} | Arc advancement: transition to ${episodeContext.arc_advancement_target}`
  }
}
