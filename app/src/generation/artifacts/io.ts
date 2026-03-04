/**
 * Artifact I/O helpers: read, write, and validate generation artifacts.
 * Uses AJV for JSON schema validation.
 */

import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import storyRequestSchema from './schema/story_request.schema.json'
import selectionResultSchema from './schema/selection_result.schema.json'
import storyContractSchema from './schema/story_contract.schema.json'
import storyPlanSchema from './schema/story_plan.schema.json'
import validationResultsSchema from './schema/validation_results.schema.json'
import storyTraceSchema from './schema/story_trace.schema.json'

// ---------------------------------------------------------------------------
// Schema registry
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({ allErrors: true })
addFormats(ajv)

const schemas = {
  story_request: ajv.compile(storyRequestSchema),
  selection_result: ajv.compile(selectionResultSchema),
  story_contract: ajv.compile(storyContractSchema),
  story_plan: ajv.compile(storyPlanSchema),
  validation_results: ajv.compile(validationResultsSchema),
  story_trace: ajv.compile(storyTraceSchema),
} as const

export type ArtifactName = keyof typeof schemas

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ArtifactValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate an artifact object against its JSON schema.
 */
export function validateArtifact(
  name: ArtifactName,
  data: unknown,
): ArtifactValidationResult {
  const validate = schemas[name]
  const valid = validate(data)
  if (valid) return { valid: true, errors: [] }

  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath} ${e.message}`,
  )
  return { valid: false, errors }
}

// ---------------------------------------------------------------------------
// Run ID generation
// ---------------------------------------------------------------------------

/**
 * Generate a stable run ID from the current timestamp.
 * Format: RUN_YYYY_MM_DD_NNNN where NNNN is derived from time.
 */
export function generateRunId(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const nnnn = String(
    now.getHours() * 100 + now.getMinutes(),
  ).padStart(4, '0')
  return `RUN_${yyyy}_${mm}_${dd}_${nnnn}`
}
