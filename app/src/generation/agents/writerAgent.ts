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
  ElementRoster,
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
 * Falls back to a stub if no LLM is provided.
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
      content: buildStubScene(scene, beat),
      model: 'stub',
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

/**
 * Generate a deterministic stub scene for testing/contract-only mode.
 */
function buildStubScene(scene: Scene, beat: Beat): string {
  return [
    `# ${scene.scene_id} — ${beat.archetype_node_id}`,
    '',
    `**Goal:** ${scene.scene_goal}`,
    '',
    `**Beat:** ${beat.summary}`,
    '',
    `[Stub scene content for ${scene.scene_id}. Replace with LLM-generated prose.]`,
  ].join('\n')
}
