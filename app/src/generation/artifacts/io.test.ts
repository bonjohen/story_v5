import { describe, it, expect } from 'vitest'
import { validateArtifact, generateRunId } from './io.ts'

describe('artifact validation', () => {
  const validRequest = {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_04_1830',
    generated_at: '2026-03-04T18:30:00Z',
    source_corpus_hash: 'abc12345',
    premise: 'A story about...',
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: 'Science Fiction',
    requested_archetype: 'The Mystery Unveiled',
    tone_preference: 'somber',
    constraints: {
      must_include: [],
      must_exclude: [],
    },
  }

  it('validates a valid story request', () => {
    const result = validateArtifact('story_request', validRequest)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a story request missing required fields', () => {
    const invalid = { ...validRequest } as Record<string, unknown>
    delete invalid.premise
    const result = validateArtifact('story_request', invalid)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects a story request with invalid run_id format', () => {
    const invalid = { ...validRequest, run_id: 'bad-id' }
    const result = validateArtifact('story_request', invalid)
    expect(result.valid).toBe(false)
  })

  it('validates a valid validation_results artifact', () => {
    const validResults = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_03_04_1830',
      generated_at: '2026-03-04T18:30:00Z',
      source_corpus_hash: 'abc12345',
      scenes: [
        {
          scene_id: 'S01',
          status: 'pass',
          checks: [
            { type: 'hard_constraints', status: 'pass', details: [] },
          ],
        },
      ],
      global: {
        hard_constraints_coverage: 1.0,
        soft_constraints_coverage: 0.8,
        anti_pattern_violations: 0,
        tone_warnings: 0,
      },
    }
    const result = validateArtifact('validation_results', validResults)
    expect(result.valid).toBe(true)
  })

  it('rejects invalid check status values', () => {
    const invalid = {
      schema_version: '1.0.0',
      run_id: 'RUN_2026_03_04_1830',
      generated_at: '2026-03-04T18:30:00Z',
      source_corpus_hash: 'abc12345',
      scenes: [
        {
          scene_id: 'S01',
          status: 'invalid_status',
          checks: [],
        },
      ],
      global: {
        hard_constraints_coverage: 1.0,
        soft_constraints_coverage: 0.8,
        anti_pattern_violations: 0,
        tone_warnings: 0,
      },
    }
    const result = validateArtifact('validation_results', invalid)
    expect(result.valid).toBe(false)
  })
})

describe('generateRunId', () => {
  it('produces a valid run ID format', () => {
    const id = generateRunId()
    expect(id).toMatch(/^RUN_\d{4}_\d{2}_\d{2}_\d{4}$/)
  })

  it('uses current date', () => {
    const id = generateRunId()
    const year = new Date().getFullYear().toString()
    expect(id).toContain(year)
  })
})
