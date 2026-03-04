/**
 * Story Generation CLI Runner
 *
 * Generates a story from a request JSON file using the full generation pipeline.
 * Shares all engine modules with the UI — no code duplication.
 *
 * Usage:
 *   npx tsx app/scripts/generate_story.ts --request path/to/request.json [options]
 *
 * Options:
 *   --request <file>     Path to a story_request.json file (required)
 *   --out <dir>          Output directory (default: outputs/runs/{run_id}/)
 *   --mode <mode>        Generation mode: draft | outline | contract-only (default: draft)
 *   --model <model>      LLM model to use (default: claude-sonnet-4-20250514)
 *   --max-repairs <n>    Max repair attempts per scene (default: 2)
 *   --no-llm             Run without LLM (deterministic only)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { parseGraphJson } from '../src/graph-engine/normalizer.ts'
import { ARCHETYPE_DIRS, GENRE_DIRS } from '../src/graph-engine/dataIndex.ts'
import { orchestrate } from '../src/generation/engine/orchestrator.ts'
import { AnthropicAdapter } from '../src/generation/agents/anthropicAdapter.ts'
import type { DataProvider } from '../src/generation/engine/corpusLoader.ts'
import type {
  StoryRequest,
  GenerationConfig,
  GenerationMode,
} from '../src/generation/artifacts/types.ts'
import type { StoryGraph } from '../src/types/graph.ts'

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined
}

const requestPath = getArg('--request')
const outDir = getArg('--out')
const mode = (getArg('--mode') ?? 'draft') as GenerationMode
const model = getArg('--model')
const maxRepairs = parseInt(getArg('--max-repairs') ?? '2', 10)
const noLlm = args.includes('--no-llm')

if (!requestPath) {
  console.error('Usage: npx tsx app/scripts/generate_story.ts --request <file> [--mode draft|outline|contract-only] [--no-llm]')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Load config and request
// ---------------------------------------------------------------------------

const PROJECT_ROOT = resolve(import.meta.dirname ?? '.', '../..')
const DATA_ROOT = resolve(PROJECT_ROOT, 'data')
const CONFIG_PATH = resolve(PROJECT_ROOT, 'generation_config.json')

const request: StoryRequest = JSON.parse(readFileSync(resolve(requestPath), 'utf-8'))

const config: GenerationConfig = existsSync(CONFIG_PATH)
  ? JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  : {
      signals_policy: { mode: 'warn', min_fraction: 0.5 },
      tone_policy: { mode: 'warn' },
      repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
      coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
      composition_defaults: { allow_blend: true, allow_hybrid: false },
    }

// Apply CLI overrides
config.repair_policy.max_attempts_per_scene = maxRepairs

// ---------------------------------------------------------------------------
// Node.js DataProvider (filesystem-based)
// ---------------------------------------------------------------------------

const fsProvider: DataProvider = {
  loadJson(relativePath: string): Promise<unknown> {
    const fullPath = join(DATA_ROOT, relativePath)
    if (!existsSync(fullPath)) {
      return Promise.reject(new Error(`File not found: ${fullPath}`))
    }
    const raw = JSON.parse(readFileSync(fullPath, 'utf-8'))
    // Parse graph files through the normalizer
    if (relativePath.endsWith('graph.json')) {
      return Promise.resolve(parseGraphJson(raw))
    }
    return Promise.resolve(raw)
  },
  exists(relativePath: string): Promise<boolean> {
    const fullPath = join(DATA_ROOT, relativePath)
    return Promise.resolve(existsSync(fullPath))
  },
}

// ---------------------------------------------------------------------------
// LLM adapter
// ---------------------------------------------------------------------------

const llm = noLlm ? null : new AnthropicAdapter({ model: model ?? undefined })

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== Story Generation ===`)
  console.log(`Mode: ${mode}`)
  console.log(`LLM: ${noLlm ? 'disabled' : (model ?? 'default')}`)
  console.log(`Request: ${requestPath}`)
  console.log('')

  const result = await orchestrate({
    request,
    provider: fsProvider,
    config,
    llm,
    mode,
    onEvent: (event) => {
      const time = new Date(event.timestamp).toLocaleTimeString()
      console.log(`  [${time}] ${event.state}: ${event.message}`)
    },
  })

  // Write output
  const runDir = outDir
    ? resolve(outDir)
    : resolve(PROJECT_ROOT, 'outputs', 'runs', result.run_id)

  mkdirSync(runDir, { recursive: true })

  // Write artifacts
  writeFileSync(join(runDir, 'request.json'), JSON.stringify(request, null, 2))

  if (result.selection) {
    writeFileSync(join(runDir, 'selection_result.json'), JSON.stringify(result.selection, null, 2))
  }
  if (result.contract) {
    writeFileSync(join(runDir, 'story_contract.json'), JSON.stringify(result.contract, null, 2))
  }
  if (result.plan) {
    writeFileSync(join(runDir, 'story_plan.json'), JSON.stringify(result.plan, null, 2))
  }
  if (result.sceneDrafts) {
    const draftsDir = join(runDir, 'scene_drafts')
    mkdirSync(draftsDir, { recursive: true })
    for (const [sceneId, content] of result.sceneDrafts) {
      writeFileSync(join(draftsDir, `${sceneId}.md`), content)
    }
  }
  if (result.validation) {
    writeFileSync(join(runDir, 'validation_results.json'), JSON.stringify(result.validation, null, 2))
  }
  if (result.trace) {
    writeFileSync(join(runDir, 'story_trace.json'), JSON.stringify(result.trace, null, 2))
  }
  if (result.complianceReport) {
    writeFileSync(join(runDir, 'compliance_report.md'), result.complianceReport)
  }

  console.log(`\n=== Result ===`)
  console.log(`State: ${result.state}`)
  console.log(`Output: ${runDir}`)

  if (result.error) {
    console.error(`Error: ${result.error}`)
    process.exit(1)
  }

  if (result.validation) {
    console.log(`Hard coverage: ${(result.validation.global.hard_constraints_coverage * 100).toFixed(0)}%`)
    console.log(`Anti-pattern violations: ${result.validation.global.anti_pattern_violations}`)
  }

  console.log('')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
