/**
 * WriterAgent: generates scene prose from a scene specification + contract.
 * Builds structured prompts that enforce genre obligations, archetype trace,
 * and global boundaries. Falls back to a template-based stub if no LLM.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildWriterPrompt(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
): LLMMessage[] {
  const hardList = scene.constraints_checklist.hard.join(', ') || 'none'
  const softList = scene.constraints_checklist.soft.join(', ') || 'none'
  const mustNotList = scene.constraints_checklist.must_not.join(', ') || 'none'
  const contentLimits = contract.global_boundaries.content_limits.join(', ') || 'none'

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
        '',
        'Write the scene.',
      ].join('\n'),
    },
  ]
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
): Promise<WriteSceneResult> {
  if (!llm) {
    return {
      scene_id: scene.scene_id,
      content: buildStubScene(scene, beat),
      model: 'stub',
    }
  }

  const messages = buildWriterPrompt(scene, beat, contract)
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
