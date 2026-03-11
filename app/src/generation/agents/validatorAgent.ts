/**
 * ValidatorAgent: LLM-backed validation checks for scene prose.
 * Combines all checks (constraints, anti-patterns, tone) into a single
 * LLM call per scene to minimize API usage.
 */

import type { LLMAdapter, LLMMessage } from './llmAdapter.ts'
import type {
  StoryContract,
  Scene,
  Beat,
  CheckStatus,
  ValidationCheck,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// LLM validation — single unified call per scene
// ---------------------------------------------------------------------------

/**
 * Run LLM-backed validation on a scene draft.
 * Uses ONE LLM call that covers hard constraints, anti-patterns, and tone.
 */
export async function validateSceneWithLLM(
  content: string,
  scene: Scene,
  _beat: Beat | null,
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<ValidationCheck[]> {
  const hardConstraints = scene.constraints_checklist.hard
  const antiPatterns = contract.genre.anti_patterns
  const toneMarkers = contract.genre.tone_marker

  // If nothing to validate via LLM, return empty
  if (hardConstraints.length === 0 && antiPatterns.length === 0 && toneMarkers.length === 0) {
    return []
  }

  const messages = buildUnifiedValidationPrompt(
    content,
    hardConstraints,
    antiPatterns,
    toneMarkers,
    contract.genre.name,
  )

  const response = await llm.complete(messages, { maxTokens: 512 })
  return parseUnifiedResponse(response.content, hardConstraints, antiPatterns)
}

// ---------------------------------------------------------------------------
// Unified prompt — one call covers everything
// ---------------------------------------------------------------------------

function buildUnifiedValidationPrompt(
  content: string,
  hardConstraints: string[],
  antiPatterns: string[],
  toneMarkers: string[],
  genreName: string,
): LLMMessage[] {
  const sections: string[] = []

  if (hardConstraints.length > 0) {
    sections.push(
      'SECTION: HARD_CONSTRAINTS',
      'For each constraint, respond: CONSTRAINT_ID: PASS|WARN|FAIL — brief note',
      ...hardConstraints.map((id) => `- ${id}`),
    )
  }

  if (antiPatterns.length > 0) {
    sections.push(
      '',
      'SECTION: ANTI_PATTERNS',
      'For each anti-pattern, respond: ANTI_PATTERN_ID: PASS|FAIL — brief note',
      'PASS = not present (good). FAIL = present (bad).',
      ...antiPatterns.map((id) => `- ${id}`),
    )
  }

  if (toneMarkers.length > 0) {
    sections.push(
      '',
      'SECTION: TONE',
      `Required tone markers: ${toneMarkers.join(', ')}`,
      'Respond: TONE: PASS|WARN|FAIL — brief explanation',
    )
  }

  return [
    {
      role: 'system',
      content: `${genreName} scene validator. One line per check, use the format in each section.`,
    },
    {
      role: 'user',
      content: [
        'Scene text (excerpt):',
        content.slice(0, 3000),
        '',
        ...sections,
      ].join('\n'),
    },
  ]
}

// ---------------------------------------------------------------------------
// Response parser — split unified response into separate ValidationCheck objects
// ---------------------------------------------------------------------------

function parseUnifiedResponse(
  response: string,
  hardConstraints: string[],
  antiPatterns: string[],
): ValidationCheck[] {
  const lines = response.trim().split('\n')
  const checks: ValidationCheck[] = []

  // Parse hard constraints
  if (hardConstraints.length > 0) {
    const details: string[] = []
    let worstStatus: CheckStatus = 'pass'
    for (const id of hardConstraints) {
      const line = lines.find((l) => l.includes(id))
      if (line) {
        const status = extractStatus(line)
        if (status === 'fail') worstStatus = 'fail'
        else if (status === 'warn' && worstStatus !== 'fail') worstStatus = 'warn'
        details.push(line.trim())
      } else {
        details.push(`${id}: no LLM response`)
      }
    }
    checks.push({ type: 'hard_constraints', status: worstStatus, details })
  }

  // Parse anti-patterns
  if (antiPatterns.length > 0) {
    const details: string[] = []
    let worstStatus: CheckStatus = 'pass'
    for (const id of antiPatterns) {
      const line = lines.find((l) => l.includes(id))
      if (line) {
        const status = extractStatus(line)
        if (status === 'fail') worstStatus = 'fail'
        else if (status === 'warn' && worstStatus !== 'fail') worstStatus = 'warn'
        details.push(line.trim())
      } else {
        details.push(`${id}: no LLM response`)
      }
    }
    checks.push({ type: 'anti_patterns', status: worstStatus, details })
  }

  // Parse tone
  const toneLine = lines.find((l) => l.toUpperCase().includes('TONE'))
  if (toneLine) {
    checks.push({
      type: 'tone',
      status: extractStatus(toneLine),
      details: [toneLine.trim().slice(0, 200)],
    })
  }

  return checks
}

function extractStatus(text: string): CheckStatus {
  const upper = text.toUpperCase()
  if (upper.includes('FAIL')) return 'fail'
  if (upper.includes('WARN')) return 'warn'
  return 'pass'
}
