/**
 * ValidatorAgent: LLM-backed validation checks for scene prose.
 * Provides deeper validation than keyword heuristics by having the LLM
 * classify each check as pass/warn/fail with evidence notes.
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
// LLM validation
// ---------------------------------------------------------------------------

/**
 * Run LLM-backed validation on a scene draft.
 * Returns an array of ValidationCheck results that can be merged with heuristic checks.
 */
export async function validateSceneWithLLM(
  content: string,
  scene: Scene,
  _beat: Beat | null,
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<ValidationCheck[]> {
  const checks: ValidationCheck[] = []

  // 1. Hard constraint check
  if (scene.constraints_checklist.hard.length > 0) {
    checks.push(await checkConstraintsWithLLM(content, scene.constraints_checklist.hard, 'hard', contract, llm))
  }

  // 2. Anti-pattern check
  if (contract.genre.anti_patterns.length > 0) {
    checks.push(await checkAntiPatternsWithLLM(content, contract, llm))
  }

  // 3. Tone check
  checks.push(await checkToneWithLLM(content, contract, llm))

  return checks
}

// ---------------------------------------------------------------------------
// Individual LLM checks
// ---------------------------------------------------------------------------

async function checkConstraintsWithLLM(
  content: string,
  constraintIds: string[],
  _severity: 'hard' | 'soft',
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<ValidationCheck> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: [
        `You are a story constraint validator for a ${contract.genre.name} story.`,
        'For each constraint listed, determine if the scene text provides evidence of satisfying it.',
        'Respond with EXACTLY one line per constraint in this format:',
        'CONSTRAINT_ID: PASS|WARN|FAIL — brief evidence note',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        'Scene text:',
        content.slice(0, 3000),
        '',
        'Constraints to verify:',
        ...constraintIds.map((id) => `- ${id}`),
      ].join('\n'),
    },
  ]

  const response = await llm.complete(messages)
  return parseConstraintResponse(response.content, constraintIds, 'hard_constraints')
}

async function checkAntiPatternsWithLLM(
  content: string,
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<ValidationCheck> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: [
        `You are a story anti-pattern detector for a ${contract.genre.name} story.`,
        'For each anti-pattern listed, determine if the scene text exhibits it.',
        'Respond with EXACTLY one line per anti-pattern:',
        'ANTI_PATTERN_ID: PASS|FAIL — brief evidence note',
        'PASS means the anti-pattern is NOT present (good). FAIL means it IS present (bad).',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        'Scene text:',
        content.slice(0, 3000),
        '',
        'Anti-patterns to check for:',
        ...contract.genre.anti_patterns.map((id) => `- ${id}`),
      ].join('\n'),
    },
  ]

  const response = await llm.complete(messages)
  return parseConstraintResponse(response.content, contract.genre.anti_patterns, 'anti_patterns')
}

async function checkToneWithLLM(
  content: string,
  contract: StoryContract,
  llm: LLMAdapter,
): Promise<ValidationCheck> {
  const messages: LLMMessage[] = [
    {
      role: 'system',
      content: [
        `You are a tone validator for a ${contract.genre.name} story.`,
        `The required tone markers are: ${contract.genre.tone_marker.join(', ')}.`,
        'Determine if the scene text maintains the expected tone.',
        'Respond with a single word (PASS, WARN, or FAIL) followed by a brief explanation.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        'Scene text:',
        content.slice(0, 3000),
      ].join('\n'),
    },
  ]

  const response = await llm.complete(messages)
  return parseToneResponse(response.content)
}

// ---------------------------------------------------------------------------
// Response parsers
// ---------------------------------------------------------------------------

function parseConstraintResponse(
  response: string,
  constraintIds: string[],
  type: 'hard_constraints' | 'anti_patterns',
): ValidationCheck {
  const lines = response.trim().split('\n')
  const details: string[] = []
  let worstStatus: CheckStatus = 'pass'

  for (const id of constraintIds) {
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

  return { type, status: worstStatus, details }
}

function parseToneResponse(response: string): ValidationCheck {
  const status = extractStatus(response)
  return {
    type: 'tone',
    status,
    details: [response.trim().slice(0, 200)],
  }
}

function extractStatus(text: string): CheckStatus {
  const upper = text.toUpperCase()
  if (upper.includes('FAIL')) return 'fail'
  if (upper.includes('WARN')) return 'warn'
  return 'pass'
}
