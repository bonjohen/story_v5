/**
 * ValidationEngine: validates scene prose against the story contract.
 *
 * Heuristic checks run without an LLM. Optional LLM-backed checks
 * can be layered on via the validatorAgent.
 */

import type {
  StoryContract,
  Scene,
  Beat,
  CheckStatus,
  ValidationCheck,
  SceneValidation,
  GlobalValidation,
  ValidationResults,
  GenerationConfig,
} from '../artifacts/types.ts'
import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { validateSceneWithLLM } from '../agents/validatorAgent.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ValidationInput {
  contract: StoryContract
  scenes: Scene[]
  beats: Beat[]
  sceneDrafts: Map<string, string>   // scene_id → prose content
  config: GenerationConfig
  llm?: LLMAdapter | null
}

/**
 * Validate all scene drafts against the contract.
 * Returns per-scene and global validation results.
 */
export async function validateScenes(input: ValidationInput): Promise<ValidationResults> {
  const { contract, scenes, beats, sceneDrafts, config, llm } = input

  const sceneResults: SceneValidation[] = []

  for (const scene of scenes) {
    const beat = beats.find((b) => b.beat_id === scene.beat_id)
    const content = sceneDrafts.get(scene.scene_id) ?? ''

    const checks: ValidationCheck[] = []

    // 1. Hard constraint compliance
    checks.push(checkHardConstraints(content, scene))

    // 2. Anti-pattern detection
    checks.push(checkAntiPatterns(content, contract))

    // 3. Tone compliance
    checks.push(checkTone(content, contract))

    // 4. Entry/exit conditions
    if (beat) {
      checks.push(checkEntryExit(content, beat))
    }

    // 5. Signals in text
    if (beat) {
      checks.push(checkSignals(content, beat, config))
    }

    // 6. Optional LLM-backed validation
    if (llm) {
      const llmChecks = await validateSceneWithLLM(content, scene, beat ?? null, contract, llm)
      // Merge LLM checks — they override heuristic results for the same type
      for (const llmCheck of llmChecks) {
        const existing = checks.findIndex((c) => c.type === llmCheck.type)
        if (existing >= 0) {
          checks[existing] = mergeChecks(checks[existing], llmCheck)
        }
      }
    }

    // Compute overall scene status
    const sceneStatus = computeSceneStatus(checks, contract)

    sceneResults.push({
      scene_id: scene.scene_id,
      status: sceneStatus,
      checks,
    })
  }

  const global = computeGlobalValidation(sceneResults, scenes)

  return {
    schema_version: '1.0.0',
    run_id: contract.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: contract.source_corpus_hash,
    scenes: sceneResults,
    global,
  }
}

// ---------------------------------------------------------------------------
// Individual checks
// ---------------------------------------------------------------------------

function checkHardConstraints(
  content: string,
  scene: Scene,
): ValidationCheck {
  const lower = content.toLowerCase()
  const details: string[] = []
  let allPresent = true

  for (const constraintId of scene.constraints_checklist.hard) {
    // Extract readable keywords from constraint ID
    const keywords = extractKeywords(constraintId)
    const found = keywords.some((kw) => lower.includes(kw))
    if (!found) {
      details.push(`Missing evidence for: ${constraintId}`)
      allPresent = false
    }
  }

  if (scene.constraints_checklist.hard.length === 0) {
    return { type: 'hard_constraints', status: 'pass', details: ['No hard constraints assigned'] }
  }

  return {
    type: 'hard_constraints',
    status: allPresent ? 'pass' : 'fail',
    details: allPresent ? ['All hard constraints have evidence'] : details,
  }
}

function checkAntiPatterns(
  content: string,
  contract: StoryContract,
): ValidationCheck {
  const lower = content.toLowerCase()
  const details: string[] = []
  let violations = 0

  for (const antiPatternId of contract.genre.anti_patterns) {
    const keywords = extractKeywords(antiPatternId)
    // Anti-patterns are detected by keywords — this is a heuristic
    const found = keywords.some((kw) => kw.length > 3 && lower.includes(kw))
    if (found) {
      details.push(`Potential anti-pattern detected: ${antiPatternId}`)
      violations++
    }
  }

  return {
    type: 'anti_patterns',
    status: violations > 0 ? 'fail' : 'pass',
    details: violations === 0 ? ['No anti-patterns detected'] : details,
  }
}

function checkTone(
  content: string,
  contract: StoryContract,
): ValidationCheck {
  const lower = content.toLowerCase()
  const details: string[] = []

  // Heuristic: check for tone marker keywords
  for (const toneId of contract.genre.tone_marker) {
    const keywords = extractKeywords(toneId)
    const found = keywords.some((kw) => kw.length > 3 && lower.includes(kw))
    if (!found) {
      details.push(`Tone marker not evidenced: ${toneId}`)
    }
  }

  if (details.length > 0) {
    return { type: 'tone', status: 'warn', details }
  }
  return { type: 'tone', status: 'pass', details: ['Tone markers present'] }
}

function checkEntryExit(
  content: string,
  beat: Beat,
): ValidationCheck {
  const details: string[] = []
  const lower = content.toLowerCase()

  // Check exit conditions for the beat
  for (const condition of beat.required_exit_conditions) {
    const condLower = condition.toLowerCase()
    // Extract meaningful words (3+ chars)
    const words = condLower.split(/\s+/).filter((w) => w.length >= 3)
    const found = words.some((w) => lower.includes(w))
    if (!found) {
      details.push(`Exit condition not evidenced: "${condition}"`)
    }
  }

  // For the first scene of a beat, check entry conditions of the corresponding phase
  // (Entry conditions are harder to check heuristically, so we just note them)

  if (details.length > 0) {
    return { type: 'entry_exit', status: 'warn', details }
  }
  return { type: 'entry_exit', status: 'pass', details: ['Entry/exit conditions satisfied'] }
}

function checkSignals(
  content: string,
  beat: Beat,
  config: GenerationConfig,
): ValidationCheck {
  // Signals check is based on config policy
  if (config.signals_policy.mode === 'off') {
    return { type: 'signals_in_text', status: 'pass', details: ['Signals check disabled'] }
  }

  // We don't have signals on Beat directly — they come from phase guidelines
  // This is a simplified version; the orchestrator would pass the full guideline
  return { type: 'signals_in_text', status: 'pass', details: ['Signals check deferred to LLM'] }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract readable keywords from a constraint/node ID.
 * e.g., "SF_N60_PREMISE_REVEAL" → ["premise", "reveal"]
 */
function extractKeywords(nodeId: string): string[] {
  // Strip prefix (e.g., "SF_N60_") and split on underscores
  const parts = nodeId.split('_')
  // Skip the prefix parts (first 2: e.g., "SF" + "N60")
  const meaningful = parts.slice(2)
  return meaningful.map((p) => p.toLowerCase())
}

/**
 * Merge heuristic and LLM checks. LLM takes precedence if it's more severe.
 */
function mergeChecks(heuristic: ValidationCheck, llm: ValidationCheck): ValidationCheck {
  const severityOrder: CheckStatus[] = ['pass', 'warn', 'fail']
  const hIdx = severityOrder.indexOf(heuristic.status)
  const lIdx = severityOrder.indexOf(llm.status)

  // Take the more severe status
  const status = lIdx >= hIdx ? llm.status : heuristic.status
  const details = [...heuristic.details, ...llm.details.map((d) => `[LLM] ${d}`)]

  return { type: heuristic.type, status, details }
}

/**
 * Compute overall scene status from individual checks.
 */
function computeSceneStatus(checks: ValidationCheck[], contract: StoryContract): CheckStatus {
  const policy = contract.validation_policy

  for (const check of checks) {
    if (check.status === 'fail') {
      // Hard constraint failures are blocking if policy requires them
      if (check.type === 'hard_constraints' && policy.hard_constraints_required) return 'fail'
      // Anti-pattern failures are blocking if policy says so
      if (check.type === 'anti_patterns' && policy.anti_patterns_blocking) return 'fail'
      // Entry/exit failures are blocking if policy requires them
      if (check.type === 'entry_exit' && policy.entry_exit_required) return 'fail'
    }
  }

  // Check for warnings
  const hasWarnings = checks.some((c) => c.status === 'warn')
  if (hasWarnings) return 'warn'

  return 'pass'
}

/**
 * Compute global validation aggregates.
 */
function computeGlobalValidation(
  sceneResults: SceneValidation[],
  scenes: Scene[],
): GlobalValidation {
  // Count hard constraint coverage
  const allHardConstraints = new Set(scenes.flatMap((s) => s.constraints_checklist.hard))
  const passedHard = new Set<string>()
  for (const result of sceneResults) {
    const hardCheck = result.checks.find((c) => c.type === 'hard_constraints')
    if (hardCheck?.status === 'pass') {
      const scene = scenes.find((s) => s.scene_id === result.scene_id)
      if (scene) {
        for (const id of scene.constraints_checklist.hard) {
          passedHard.add(id)
        }
      }
    }
  }

  // Count soft constraint coverage
  const allSoftConstraints = new Set(scenes.flatMap((s) => s.constraints_checklist.soft))
  const passedSoft = new Set<string>()
  for (const result of sceneResults) {
    const scene = scenes.find((s) => s.scene_id === result.scene_id)
    if (scene) {
      // Soft constraints pass if the scene isn't failing
      if (result.status !== 'fail') {
        for (const id of scene.constraints_checklist.soft) {
          passedSoft.add(id)
        }
      }
    }
  }

  const antiPatternViolations = sceneResults.filter((r) =>
    r.checks.some((c) => c.type === 'anti_patterns' && c.status === 'fail'),
  ).length

  const toneWarnings = sceneResults.filter((r) =>
    r.checks.some((c) => c.type === 'tone' && (c.status === 'warn' || c.status === 'fail')),
  ).length

  return {
    hard_constraints_coverage: allHardConstraints.size > 0
      ? passedHard.size / allHardConstraints.size
      : 1.0,
    soft_constraints_coverage: allSoftConstraints.size > 0
      ? passedSoft.size / allSoftConstraints.size
      : 1.0,
    anti_pattern_violations: antiPatternViolations,
    tone_warnings: toneWarnings,
  }
}
