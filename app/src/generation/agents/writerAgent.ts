/**
 * WriterAgent: generates scene prose from a scene specification + contract.
 * Builds structured prompts that enforce genre obligations, archetype trace,
 * and global boundaries. Falls back to a template-based stub if no LLM.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryContract,
  StoryPlan,
  Scene,
  Beat,
  RosterEntry,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildWriterPrompt(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  plan?: StoryPlan | null,
  priorScenes?: Scene[],
): LLMMessage[] {
  const hardList = scene.constraints_checklist.hard.join(', ') || 'none'
  const softList = scene.constraints_checklist.soft.join(', ') || 'none'
  const mustNotList = scene.constraints_checklist.must_not.join(', ') || 'none'
  const contentLimits = contract.global_boundaries.content_limits.join(', ') || 'none'

  // Build element context from plan roster and scene elements
  const elementContext = buildElementContext(scene, plan ?? null, priorScenes ?? [])

  return [
    {
      role: 'system',
      content: [
        `You are a fiction writer crafting a scene for a ${contract.genre.name} story using the ${contract.archetype.name} archetype.`,
        '',
        'Rules:',
        `- Genre: ${contract.genre.name}`,
        `- Tone markers: ${contract.genre.tone_marker.join(', ')}`,
        `- Content limits: ${contentLimits}`,
        '',
        'Your scene MUST satisfy every hard constraint listed below.',
        'Your scene SHOULD satisfy soft constraints where natural.',
        'Your scene MUST NOT exhibit any anti-pattern behavior listed below.',
        '',
        'Write the scene as narrative prose. Do not include meta-commentary or constraint labels in the output.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Scene: ${scene.scene_id} (Beat: ${beat.beat_id})`,
        `Scene goal: ${scene.scene_goal}`,
        `Beat summary: ${beat.summary}`,
        `Archetype phase: ${beat.archetype_node_id}`,
        '',
        `Hard constraints (MUST satisfy): ${hardList}`,
        `Soft constraints (SHOULD satisfy): ${softList}`,
        `Anti-patterns (MUST NOT): ${mustNotList}`,
        '',
        `Exit conditions for this beat: ${beat.required_exit_conditions.join('; ') || 'none'}`,
        '',
        `Setting: ${scene.setting || '(to be determined by writer)'}`,
        `Characters: ${scene.characters.join(', ') || '(to be determined by writer)'}`,
        ...(elementContext ? ['', elementContext] : []),
        '',
        'Write the scene.',
      ].join('\n'),
    },
  ]
}

/**
 * Build element context block for the writer prompt.
 * Includes who's in the scene, what they want, and object custody.
 */
function buildElementContext(
  scene: Scene,
  plan: StoryPlan | null,
  priorScenes: Scene[],
): string | null {
  if (!plan?.element_roster) return null

  const roster = plan.element_roster
  const lines: string[] = ['--- Element Context ---']

  // Character details for this scene
  const sceneCharIds = new Set(scene.characters)
  const charEntries = roster.characters.filter((c) => sceneCharIds.has(c.id))
  if (charEntries.length > 0) {
    lines.push('Characters in this scene:')
    for (const c of charEntries) {
      const traits = c.traits?.join(', ') || ''
      const motivations = c.motivations?.join(', ') || ''
      lines.push(`  - ${c.name} (${c.role_or_type}): ${c.description || ''}`)
      if (traits) lines.push(`    Traits: ${traits}`)
      if (motivations) lines.push(`    Motivations: ${motivations}`)
    }
  }

  // Place details
  if (scene.setting) {
    const place = roster.places.find((p) => p.id === scene.setting)
    if (place) {
      lines.push(`Setting: ${place.name} (${place.role_or_type}) — ${place.description || ''}`)
    }
  }

  // Object tracking — which objects are present and what happened to them previously
  const sceneObjIds = new Set(scene.objects ?? [])
  const objEntries = roster.objects.filter((o) => sceneObjIds.has(o.id))
  if (objEntries.length > 0) {
    lines.push('Objects present:')
    for (const o of objEntries) {
      lines.push(`  - ${o.name} (${o.role_or_type}): ${o.description || ''}`)
    }
  }

  // Track character state from prior scenes' transitions
  const stateNotes = buildCharacterStateNotes(scene, priorScenes)
  if (stateNotes.length > 0) {
    lines.push('Character state from prior scenes:')
    for (const note of stateNotes) {
      lines.push(`  - ${note}`)
    }
  }

  return lines.length > 1 ? lines.join('\n') : null
}

/**
 * Accumulate transitions from prior scenes to build character state notes.
 */
function buildCharacterStateNotes(
  _currentScene: Scene,
  priorScenes: Scene[],
): string[] {
  const notes: string[] = []
  const dead = new Set<string>()
  const knowledge = new Map<string, string[]>()
  const custody = new Map<string, string>()  // object_id → holder_id

  for (const scene of priorScenes) {
    if (!scene.moment) continue
    for (const t of scene.moment.expected_transitions) {
      if (t.change === 'dies') {
        dead.add(t.entity_id)
      }
      if (t.change === 'learns' && t.description) {
        if (!knowledge.has(t.entity_id)) knowledge.set(t.entity_id, [])
        knowledge.get(t.entity_id)!.push(t.description)
      }
      if (t.change === 'gains' && t.target) {
        custody.set(t.target, t.entity_id)
      }
      if (t.change === 'loses' && t.target) {
        custody.delete(t.target)
      }
    }
  }

  for (const id of dead) {
    notes.push(`${id} is dead (cannot participate)`)
  }
  for (const [charId, items] of knowledge) {
    if (!dead.has(charId)) {
      notes.push(`${charId} knows: ${items.join('; ')}`)
    }
  }
  for (const [objId, holderId] of custody) {
    if (!dead.has(holderId)) {
      notes.push(`${objId} is held by ${holderId}`)
    }
  }

  return notes
}

// ---------------------------------------------------------------------------
// Scene generation
// ---------------------------------------------------------------------------

export interface WriteSceneResult {
  scene_id: string
  content: string
  model: string
  usage?: { input_tokens: number; output_tokens: number }
}

/**
 * Generate prose for a single scene using the LLM adapter.
 * Falls back to a template-based prose generator if no LLM is provided.
 */
export async function writeScene(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  llm: LLMAdapter | null,
  plan?: StoryPlan | null,
  priorScenes?: Scene[],
): Promise<WriteSceneResult> {
  if (!llm) {
    return {
      scene_id: scene.scene_id,
      content: buildTemplateScene(scene, beat, contract, plan ?? null, priorScenes ?? []),
      model: 'template',
    }
  }

  const messages = buildWriterPrompt(scene, beat, contract, plan, priorScenes)
  const response = await llm.complete(messages)

  return {
    scene_id: scene.scene_id,
    content: response.content,
    model: response.model,
    usage: response.usage,
  }
}

// ---------------------------------------------------------------------------
// Template-based prose generator (no LLM required)
// ---------------------------------------------------------------------------

/**
 * Simple seeded PRNG for deterministic but varied output.
 * Produces values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashCode(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return h
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/**
 * Generate template-based prose for a single scene.
 * Uses the contract, beat, and element roster to construct
 * multi-paragraph narrative prose without an LLM.
 */
function buildTemplateScene(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  plan: StoryPlan | null,
  priorScenes: Scene[],
): string {
  const rng = mulberry32(hashCode(scene.scene_id + contract.archetype.name))
  const paragraphs: string[] = []

  // Extract readable role from beat summary (e.g. "[Catalyst] The hero receives..." → "Catalyst")
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]\s*(.*)/)
  const role = roleMatch ? roleMatch[1] : beat.archetype_node_id
  const definition = roleMatch ? roleMatch[2] : beat.summary

  // Resolve character and place names from roster
  const roster = plan?.element_roster
  const charNames = resolveNames(scene.characters, roster?.characters ?? [])
  const placeNames = resolveNames(scene.setting ? [scene.setting] : [], roster?.places ?? [])
  const objNames = resolveNames(scene.objects ?? [], roster?.objects ?? [])

  const genreName = contract.genre.name
  const archName = contract.archetype.name
  const emotions = beat.target_emotional_scores

  // --- Heading ---
  paragraphs.push(`## ${role}`)

  // --- Opening paragraph: setting + atmosphere ---
  const settingName = placeNames[0] ?? 'an unnamed place'
  const openers = [
    `The scene opens in ${settingName}. The air carries the weight of what is to come — a ${genreName} story demands no less.`,
    `${settingName} stretches before us, a fitting stage for this moment in the ${archName}. ${getAtmosphere(emotions, rng)}.`,
    `We find ourselves in ${settingName}, where the rhythm of the ${genreName} narrative draws us deeper. ${getAtmosphere(emotions, rng)}.`,
    `In ${settingName}, the story gathers momentum. This is where the ${role.toLowerCase()} phase of the ${archName} takes shape.`,
  ]
  paragraphs.push(pick(rng, openers))

  // --- Character introduction paragraph ---
  if (charNames.length > 0) {
    const charIntros = buildCharacterParagraph(charNames, role, roster?.characters ?? [], scene, rng)
    paragraphs.push(charIntros)
  }

  // --- Core action paragraph: beat definition + scene goal ---
  const goalClean = scene.scene_goal.replace(/^Fulfill .* obligations$/, definition)
  const actionParas = [
    `The heart of this scene centers on a single imperative: ${goalClean}. In the grammar of the ${archName}, the ${role.toLowerCase()} phase demands that the story cross a specific threshold — ${definition.charAt(0).toLowerCase() + definition.slice(1)}`,
    `Here, the narrative must accomplish something essential: ${goalClean}. The ${role.toLowerCase()} is not merely a waypoint but a transformation — the kind that ${genreName} stories build toward with deliberate patience.`,
    `What unfolds here is governed by the logic of the ${role.toLowerCase()}: ${definition.charAt(0).toLowerCase() + definition.slice(1)} This is the engine that drives the scene forward, shaping every exchange and revelation.`,
  ]
  paragraphs.push(pick(rng, actionParas))

  // --- Object/prop paragraph (if objects are present) ---
  if (objNames.length > 0) {
    const objPara = buildObjectParagraph(objNames, roster?.objects ?? [], rng)
    paragraphs.push(objPara)
  }

  // --- Emotional texture paragraph ---
  paragraphs.push(buildEmotionParagraph(emotions, role, genreName, rng))

  // --- Constraint awareness paragraph ---
  if (scene.constraints_checklist.hard.length > 0 || scene.constraints_checklist.soft.length > 0) {
    paragraphs.push(buildConstraintParagraph(scene, contract, rng))
  }

  // --- Prior scene continuity (if not first scene) ---
  if (priorScenes.length > 0) {
    const lastScene = priorScenes[priorScenes.length - 1]
    const lastBeatRole = lastScene.archetype_trace.node_id
    const bridges = [
      `The reverberations of ${lastBeatRole} still echo. What was set in motion there finds its continuation here, each consequence rippling forward through the narrative.`,
      `We arrive here carrying the weight of what came before. The events of the previous scene — the choices made, the thresholds crossed — cast long shadows into this moment.`,
      `The story remembers. Every decision from the preceding scenes has narrowed the path, and now the characters must navigate within those constraints.`,
    ]
    paragraphs.push(pick(rng, bridges))
  }

  // --- Exit conditions / transition paragraph ---
  if (beat.required_exit_conditions.length > 0) {
    const conditions = beat.required_exit_conditions.slice(0, 3).join('; ')
    const exits = [
      `Before this scene can close, specific conditions must be met: ${conditions}. The narrative will not release its grip until these thresholds are satisfied.`,
      `The scene builds toward resolution, but resolution has requirements: ${conditions}. Only when these are fulfilled can the story advance to its next phase.`,
      `By the time the final line of this scene lands, the reader should sense that something irreversible has occurred. The exit demands: ${conditions}.`,
    ]
    paragraphs.push(pick(rng, exits))
  }

  // --- Closing ---
  const closers = [
    `And so the ${role.toLowerCase()} completes its work, leaving the story irrevocably changed. What follows will be shaped by what happened here.`,
    `The scene closes, but its effects radiate forward. In the architecture of the ${archName}, this moment is load-bearing — remove it, and the story collapses.`,
    `With this, the ${role.toLowerCase()} phase has done what it must. The characters carry forward not just knowledge, but the weight of consequence.`,
  ]
  paragraphs.push(pick(rng, closers))

  return paragraphs.join('\n\n')
}

// --- Helper functions for template prose ---

function resolveNames(ids: string[], entries: RosterEntry[]): string[] {
  return ids.map((id) => {
    const entry = entries.find((e) => e.id === id)
    return entry?.name ?? id.replace(/_/g, ' ')
  })
}

function getAtmosphere(emotions: Beat['target_emotional_scores'], rng: () => number): string {
  const dominant = getDominantEmotion(emotions)
  const atmospheres: Record<string, string[]> = {
    tension: [
      'Every surface hums with barely contained pressure',
      'The tension is almost physical, like the air before a storm',
      'Something coils tightly beneath the surface of every interaction',
    ],
    hope: [
      'A fragile brightness threads through the moment',
      'There is a quality of dawn to this scene — possibility, not yet certainty',
      'Hope moves through the space like light through water',
    ],
    fear: [
      'Unease settles like dust over everything',
      'The shadows here feel deliberate, as if placed by the story itself',
      'A cold thread of dread weaves through the moment',
    ],
    resolution: [
      'There is a gathering stillness, a sense of things coming to rest',
      'The weight of accumulated events presses toward conclusion',
      'Threads that have run loose through the story begin to draw together',
    ],
  }
  return pick(rng, atmospheres[dominant] ?? atmospheres.tension)
}

function getDominantEmotion(scores: Beat['target_emotional_scores']): string {
  const entries = Object.entries(scores) as [string, number][]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

function buildCharacterParagraph(
  charNames: string[],
  role: string,
  roster: RosterEntry[],
  scene: Scene,
  rng: () => number,
): string {
  if (charNames.length === 1) {
    const entry = roster.find((r) => scene.characters.includes(r.id))
    const desc = entry?.description ? ` — ${entry.description.charAt(0).toLowerCase() + entry.description.slice(1)}` : ''
    const intros = [
      `${charNames[0]} stands at the center of this scene${desc}. The ${role.toLowerCase()} demands something of this character, and the demand cannot be refused.`,
      `This is ${charNames[0]}'s moment${desc}. What happens here will define the trajectory of everything that follows.`,
    ]
    return pick(rng, intros)
  }

  const nameList = charNames.length === 2
    ? `${charNames[0]} and ${charNames[1]}`
    : charNames.slice(0, -1).join(', ') + `, and ${charNames[charNames.length - 1]}`

  const intros = [
    `${nameList} converge in this space, each carrying their own stakes into the ${role.toLowerCase()}. The scene belongs to all of them, though not equally.`,
    `The characters who populate this moment — ${nameList} — bring with them the accumulated weight of the story so far. Their interaction here is not incidental; it is structural.`,
  ]
  return pick(rng, intros)
}

function buildObjectParagraph(objNames: string[], roster: RosterEntry[], rng: () => number): string {
  const nameList = objNames.join(', ')
  const paras = [
    `Woven through the scene: ${nameList}. In a well-constructed narrative, objects are never merely present — they carry meaning, and their presence here is deliberate.`,
    `The objects that matter in this scene — ${nameList} — serve as anchors for the story's larger concerns. They are props in the theatrical sense: essential, not decorative.`,
  ]
  return pick(rng, paras)
}

function buildEmotionParagraph(
  emotions: Beat['target_emotional_scores'],
  role: string,
  genreName: string,
  rng: () => number,
): string {
  const t = Math.round(emotions.tension * 100)
  const h = Math.round(emotions.hope * 100)
  const f = Math.round(emotions.fear * 100)
  const r = Math.round(emotions.resolution * 100)

  const dominant = getDominantEmotion(emotions)
  const emotionTextures: Record<string, string[]> = {
    tension: [
      `The emotional register of this scene runs hot: tension at ${t}%, hope at ${h}%, fear at ${f}%. This is a scene that grips rather than soothes — the ${genreName} tradition demands nothing less from a ${role.toLowerCase()}.`,
      `Emotionally, this scene is a pressure cooker. Tension dominates at ${t}%, with fear at ${f}% adding an undertow of anxiety. Hope flickers at ${h}%, but it is the hope of someone who knows the odds.`,
    ],
    hope: [
      `Against the story's darker currents, hope surfaces here at ${h}%. This is not naive optimism — in a ${genreName} story, hope is earned through suffering. Tension holds at ${t}%, and fear at ${f}%, but the ${role.toLowerCase()} tilts toward possibility.`,
      `The emotional palette of this scene leans toward hope (${h}%), though tension (${t}%) and fear (${f}%) provide necessary counterweight. A ${genreName} audience needs to believe that hope might be justified.`,
    ],
    fear: [
      `Fear runs at ${f}% through this scene, the dominant emotional frequency. Tension at ${t}% keeps the audience's attention locked. Hope at ${h}% is thin — deliberately so, because the ${role.toLowerCase()} must make the stakes feel real.`,
      `The scene is steeped in dread — fear at ${f}%, tension at ${t}%. The ${genreName} genre knows how to use fear as narrative currency, and this scene spends it freely. Hope (${h}%) is rationed carefully.`,
    ],
    resolution: [
      `Resolution emerges at ${r}%, the highest it has been. After scenes of tension (${t}%) and fear (${f}%), the ${role.toLowerCase()} allows the story to begin gathering its threads. This is not an ending, but the sense that an ending is now possible.`,
      `The emotional arc bends toward resolution here (${r}%). Tension (${t}%) has not vanished, but it has changed character — from chaotic to purposeful. The ${genreName} story knows it is approaching something conclusive.`,
    ],
  }

  return pick(rng, emotionTextures[dominant] ?? emotionTextures.tension)
}

function buildConstraintParagraph(
  scene: Scene,
  contract: StoryContract,
  rng: () => number,
): string {
  const hardCount = scene.constraints_checklist.hard.length
  const softCount = scene.constraints_checklist.soft.length
  const antiCount = scene.constraints_checklist.must_not.length

  const paras = [
    `The ${contract.genre.name} genre enforces ${hardCount} hard constraint${hardCount !== 1 ? 's' : ''} on this scene — non-negotiable requirements that the narrative must satisfy. ${softCount > 0 ? `An additional ${softCount} soft constraint${softCount !== 1 ? 's' : ''} guide${softCount === 1 ? 's' : ''} the scene without mandating specific outcomes.` : ''} ${antiCount > 0 ? `Meanwhile, ${antiCount} anti-pattern${antiCount !== 1 ? 's' : ''} define${antiCount === 1 ? 's' : ''} what the scene must *not* do — the pitfalls that would betray the genre's promise to its audience.` : ''}`,
    `Working within the ${contract.genre.name} framework means operating under constraint: ${hardCount} hard obligation${hardCount !== 1 ? 's' : ''} that cannot be shirked, ${softCount} soft guideline${softCount !== 1 ? 's' : ''} that shape the scene's texture. These are not limitations but architecture — the structure that gives the story its specific character.`,
  ]
  return pick(rng, paras)
}
