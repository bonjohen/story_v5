/**
 * RepairAgent: LLM-backed scene repair.
 * Takes a failing scene draft, validation failures, and contract constraints,
 * and produces a revised scene that addresses the failures.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  SceneValidation,
} from '../artifacts/types.ts'

/**
 * Repair a scene draft using the LLM.
 * Returns revised scene text.
 */
export async function repairScene(
  originalContent: string,
  validation: SceneValidation,
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  strategy: 'targeted_edit' | 'full_rewrite',
  llm: LLMAdapter,
): Promise<string> {
  const messages = buildRepairPrompt(
    originalContent,
    validation,
    scene,
    beat,
    contract,
    strategy,
  )
  const response = await llm.complete(messages)
  return response.content
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildRepairPrompt(
  originalContent: string,
  validation: SceneValidation,
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  strategy: 'targeted_edit' | 'full_rewrite',
): LLMMessage[] {
  const failingChecks = validation.checks.filter((c) => c.status === 'fail')
  const warningChecks = validation.checks.filter((c) => c.status === 'warn')

  const failureDirectives = failingChecks.map((check) => {
    const details = check.details.join('; ')
    switch (check.type) {
      case 'hard_constraints':
        return `MUST FIX — Hard constraint failures: ${details}`
      case 'anti_patterns':
        return `MUST FIX — Anti-pattern detected: ${details}. Remove or rewrite the offending sections.`
      case 'tone':
        return `MUST FIX — Tone violation: ${details}. Adjust prose to match the expected tone.`
      case 'entry_exit':
        return `MUST FIX — Entry/exit condition failure: ${details}.`
      case 'signals_in_text':
        return `SHOULD FIX — Missing signals: ${details}.`
      default:
        return `Fix: ${details}`
    }
  })

  const warningDirectives = warningChecks.map((check) => {
    return `OPTIONAL — ${check.type}: ${check.details.join('; ')}`
  })

  const strategyInstruction = strategy === 'full_rewrite'
    ? 'FULLY REWRITE the scene from scratch, keeping the same scene goal and characters.'
    : 'Make TARGETED EDITS to the existing scene. Preserve as much of the original text as possible while fixing the issues.'

  return [
    {
      role: 'system',
      content: [
        `You are a fiction editor repairing a scene for a ${contract.genre.name} story.`,
        '',
        `Strategy: ${strategyInstruction}`,
        '',
        'Rules:',
        `- Do NOT introduce new characters or plot points not in the beat plan.`,
        `- Maintain the genre tone: ${contract.genre.tone_marker.join(', ')}`,
        `- Content limits: ${contract.global_boundaries.content_limits.join(', ') || 'none'}`,
        '',
        'Output ONLY the revised scene text. No meta-commentary.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Scene: ${scene.scene_id} (Beat: ${beat.beat_id})`,
        `Scene goal: ${scene.scene_goal}`,
        `Beat: ${beat.summary}`,
        '',
        '--- ORIGINAL SCENE ---',
        originalContent.slice(0, 4000),
        '',
        '--- FAILURES TO FIX ---',
        ...failureDirectives,
        '',
        ...(warningDirectives.length > 0
          ? ['--- WARNINGS (fix if possible) ---', ...warningDirectives, '']
          : []),
        '--- CONSTRAINTS ---',
        `Hard: ${scene.constraints_checklist.hard.join(', ') || 'none'}`,
        `Must NOT: ${scene.constraints_checklist.must_not.join(', ') || 'none'}`,
        '',
        'Write the revised scene.',
      ].join('\n'),
    },
  ]
}
