/**
 * RepairEngine: takes a failing scene draft + validation failures + contract,
 * and produces a revised scene via the repair agent or by falling back to
 * targeted heuristic edits.
 */

import type {
  StoryContract,
  Scene,
  Beat,
  SceneValidation,
  GenerationConfig,
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { repairScene } from '../agents/repairAgent.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RepairInput {
  sceneId: string
  originalContent: string
  validation: SceneValidation
  scene: Scene
  beat: Beat
  contract: StoryContract
  config: GenerationConfig
  llm: LLMAdapter | null
}

export interface RepairResult {
  scene_id: string
  revised_content: string
  attempt: number
  strategy: 'targeted_edit' | 'full_rewrite'
}

/**
 * Attempt to repair a failing scene draft.
 * Uses the repair agent (LLM) if available, otherwise applies heuristic edits.
 */
export async function repair(input: RepairInput): Promise<RepairResult> {
  const { sceneId, originalContent, validation, scene, beat, contract, config, llm } = input

  // Count blocking errors to decide strategy
  const blockingErrors = validation.checks.filter((c) => c.status === 'fail')
  const strategy: RepairResult['strategy'] =
    blockingErrors.length >= config.repair_policy.full_rewrite_threshold
      ? 'full_rewrite'
      : 'targeted_edit'

  if (llm) {
    const revised = await repairScene(
      originalContent,
      validation,
      scene,
      beat,
      contract,
      strategy,
      llm,
    )
    return { scene_id: sceneId, revised_content: revised, attempt: 1, strategy }
  }

  // Heuristic fallback: append missing constraint placeholders
  const revised = applyHeuristicRepair(originalContent, validation)
  return { scene_id: sceneId, revised_content: revised, attempt: 1, strategy: 'targeted_edit' }
}

// ---------------------------------------------------------------------------
// Heuristic repair (no LLM)
// ---------------------------------------------------------------------------

function applyHeuristicRepair(
  content: string,
  validation: SceneValidation,
): string {
  let revised = content

  // For each failing hard constraint check, append a note
  const hardCheck = validation.checks.find((c) => c.type === 'hard_constraints' && c.status === 'fail')
  if (hardCheck) {
    const missingConstraints = hardCheck.details
      .filter((d) => d.startsWith('Missing evidence for:'))
      .map((d) => d.replace('Missing evidence for: ', ''))

    if (missingConstraints.length > 0) {
      revised += '\n\n---\n'
      revised += `[Repair note: The following constraints need evidence: ${missingConstraints.join(', ')}]`
    }
  }

  // For anti-pattern violations, append a warning
  const antiCheck = validation.checks.find((c) => c.type === 'anti_patterns' && c.status === 'fail')
  if (antiCheck) {
    revised += '\n\n---\n'
    revised += `[Repair note: Anti-pattern detected — revise to remove: ${antiCheck.details.join('; ')}]`
  }

  return revised
}
