/**
 * TraceEngine: builds a StoryTrace from validation results, scenes, and the contract.
 * Also generates a human-readable compliance report.
 */

import type {
  StoryContract,
  Scene,
  Beat,
  StoryTrace,
  SceneTraceEntry,
  ValidationResults,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TraceInput {
  contract: StoryContract
  scenes: Scene[]
  beats: Beat[]
  validation: ValidationResults
}

/**
 * Build a StoryTrace from scenes and validation results.
 */
export function buildTrace(input: TraceInput): StoryTrace {
  const { contract, scenes, validation } = input

  const sceneTrace: SceneTraceEntry[] = scenes.map((scene) => {
    const sceneValidation = validation.scenes.find((v) => v.scene_id === scene.scene_id)

    // Collect edges from archetype trace
    const edges: string[] = []
    if (scene.archetype_trace.edge_in) edges.push(scene.archetype_trace.edge_in)
    if (scene.archetype_trace.edge_out) edges.push(scene.archetype_trace.edge_out)

    // Determine satisfied constraints from validation
    const satisfiedConstraints: string[] = []
    if (sceneValidation) {
      const hardCheck = sceneValidation.checks.find((c) => c.type === 'hard_constraints')
      if (hardCheck?.status === 'pass') {
        satisfiedConstraints.push(...scene.constraints_checklist.hard)
      }
      const softCheck = sceneValidation.checks.find((c) => c.type === 'tone')
      if (softCheck?.status === 'pass') {
        satisfiedConstraints.push(...scene.constraints_checklist.soft)
      }
    }

    // Notes from validation
    const notes: string[] = []
    if (sceneValidation) {
      for (const check of sceneValidation.checks) {
        if (check.status === 'warn') {
          notes.push(`[warn] ${check.type}: ${check.details[0] ?? ''}`)
        } else if (check.status === 'fail') {
          notes.push(`[fail] ${check.type}: ${check.details[0] ?? ''}`)
        }
      }
    }

    return {
      scene_id: scene.scene_id,
      archetype: {
        node_id: scene.archetype_trace.node_id,
        edges,
      },
      genre: {
        satisfied_constraints: satisfiedConstraints,
        tone_marker: contract.genre.tone_marker[0] ?? '',
      },
      notes,
    }
  })

  return {
    schema_version: '1.0.0',
    run_id: contract.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: contract.source_corpus_hash,
    scene_trace: sceneTrace,
  }
}

// ---------------------------------------------------------------------------
// Compliance report
// ---------------------------------------------------------------------------

/**
 * Generate a markdown compliance report from the trace and validation data.
 */
export function generateComplianceReport(
  trace: StoryTrace,
  validation: ValidationResults,
  contract: StoryContract,
): string {
  const lines: string[] = []

  lines.push('# Compliance Report')
  lines.push('')
  lines.push(`**Run ID:** ${trace.run_id}`)
  lines.push(`**Generated:** ${trace.generated_at}`)
  lines.push(`**Archetype:** ${contract.archetype.name} (${contract.archetype.archetype_id})`)
  lines.push(`**Genre:** ${contract.genre.name} (${contract.genre.genre_id})`)
  lines.push('')

  // Summary
  lines.push('## Summary')
  lines.push('')
  lines.push(`| Metric | Value |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Hard constraint coverage | ${(validation.global.hard_constraints_coverage * 100).toFixed(0)}% |`)
  lines.push(`| Soft constraint coverage | ${(validation.global.soft_constraints_coverage * 100).toFixed(0)}% |`)
  lines.push(`| Anti-pattern violations | ${validation.global.anti_pattern_violations} |`)
  lines.push(`| Tone warnings | ${validation.global.tone_warnings} |`)
  lines.push('')

  // Overall status
  const hasFailures = validation.scenes.some((s) => s.status === 'fail')
  const hasWarnings = validation.scenes.some((s) => s.status === 'warn')
  const overallStatus = hasFailures ? 'FAIL' : hasWarnings ? 'WARN' : 'PASS'
  lines.push(`**Overall status:** ${overallStatus}`)
  lines.push('')

  // Scene table
  lines.push('## Scene Details')
  lines.push('')
  lines.push('| Scene | Archetype Node | Genre Obligations | Status |')
  lines.push('|-------|---------------|-------------------|--------|')

  for (const entry of trace.scene_trace) {
    const sceneVal = validation.scenes.find((v) => v.scene_id === entry.scene_id)
    const status = sceneVal?.status ?? 'unknown'
    const obligations = entry.genre.satisfied_constraints.join(', ') || 'none'
    lines.push(`| ${entry.scene_id} | ${entry.archetype.node_id} | ${obligations} | ${status} |`)
  }

  lines.push('')

  // Unresolved issues
  const issues = validation.scenes.filter((s) => s.status !== 'pass')
  if (issues.length > 0) {
    lines.push('## Unresolved Issues')
    lines.push('')
    for (const scene of issues) {
      lines.push(`### ${scene.scene_id} — ${scene.status.toUpperCase()}`)
      for (const check of scene.checks) {
        if (check.status !== 'pass') {
          lines.push(`- **${check.type}** (${check.status}): ${check.details.join('; ')}`)
        }
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}
