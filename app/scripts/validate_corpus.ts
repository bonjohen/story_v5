/**
 * Corpus Validation Script
 *
 * Runs all generation-pipeline normalizer checks across the full corpus.
 * Reports pass/fail per graph with detailed error messages.
 * Exits with nonzero code on any validation failure.
 *
 * Usage: npx tsx app/scripts/validate_corpus.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'
import { parseGraphJson } from '../src/graph-engine/normalizer.ts'
import { ARCHETYPE_DIRS, GENRE_DIRS } from '../src/graph-engine/dataIndex.ts'
import { validateCorpus } from '../src/generation/engine/normalizer.ts'
import type { StoryGraph, DataManifest } from '../src/types/graph.ts'
import type {
  GenreArchetypeMatrix,
  ToneArchetypeIntegration,
  ArchetypeEmotionalArcs,
  HybridArchetypePatterns,
  GenreBlendingModel,
  VocabularyFile,
  LoadedCorpus,
} from '../src/generation/artifacts/types.ts'

const DATA_ROOT = resolve(import.meta.dirname ?? '.', '../../data')

function loadJson(relativePath: string): unknown {
  const fullPath = join(DATA_ROOT, relativePath)
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`)
  }
  return JSON.parse(readFileSync(fullPath, 'utf-8'))
}

function loadGraphs(type: 'archetypes' | 'genres', dirs: string[]): Map<string, StoryGraph> {
  const map = new Map<string, StoryGraph>()
  for (const dir of dirs) {
    const raw = loadJson(`${type}/${dir}/graph.json`)
    map.set(dir, parseGraphJson(raw))
  }
  return map
}

function loadVariants(): Map<string, StoryGraph> {
  const map = new Map<string, StoryGraph>()
  for (const dir of ARCHETYPE_DIRS) {
    const fullPath = join(DATA_ROOT, `archetypes/${dir}/variants.json`)
    if (existsSync(fullPath)) {
      const raw = JSON.parse(readFileSync(fullPath, 'utf-8')) as Record<string, unknown>
      // Variant files have parent_graph instead of id/name/type — wrap them
      const wrapped = {
        id: `${dir}_variants`,
        name: `${raw.parent_graph ?? dir} variants`,
        type: 'archetype' as const,
        description: (raw.description as string) ?? '',
        nodes: raw.nodes ?? [],
        edges: raw.edges ?? [],
      }
      map.set(dir, parseGraphJson(wrapped))
    }
  }
  return map
}

// --- Main ---

console.log('=== Corpus Validation ===\n')
console.log(`Data root: ${DATA_ROOT}\n`)

try {
  console.log('Loading archetype graphs...')
  const archetypeGraphs = loadGraphs('archetypes', ARCHETYPE_DIRS)
  console.log(`  Loaded ${archetypeGraphs.size} archetype graphs`)

  console.log('Loading genre graphs...')
  const genreGraphs = loadGraphs('genres', GENRE_DIRS)
  console.log(`  Loaded ${genreGraphs.size} genre graphs`)

  console.log('Loading variant graphs...')
  const variantGraphs = loadVariants()
  console.log(`  Loaded ${variantGraphs.size} variant files`)

  console.log('Loading cross-reference files...')
  const matrix = loadJson('genre_archetype_matrix.json') as GenreArchetypeMatrix
  const toneIntegration = loadJson('tone_archetype_integration.json') as ToneArchetypeIntegration
  const emotionalArcs = loadJson('archetype_emotional_arcs.json') as ArchetypeEmotionalArcs
  const hybridPatterns = loadJson('hybrid_archetype_patterns.json') as HybridArchetypePatterns
  const blendingModel = loadJson('genre_blending_model.json') as GenreBlendingModel
  console.log('  Loaded 5 cross-reference files')

  console.log('Loading vocabularies...')
  const archetypeNodeRoles = loadJson('vocabulary/archetype_node_roles.json') as VocabularyFile
  const archetypeEdgeMeanings = loadJson('vocabulary/archetype_edge_vocabulary.json') as VocabularyFile
  const genreNodeRoles = loadJson('vocabulary/genre_node_roles.json') as VocabularyFile
  const genreEdgeMeanings = loadJson('vocabulary/genre_edge_vocabulary.json') as VocabularyFile
  console.log('  Loaded 4 vocabulary files')

  console.log('Loading manifest...')
  const manifest = loadJson('manifest.json') as DataManifest
  console.log('  Loaded manifest')

  const corpus: LoadedCorpus = {
    archetypeGraphs,
    genreGraphs,
    variantGraphs,
    matrix,
    toneIntegration,
    emotionalArcs,
    hybridPatterns,
    blendingModel,
    archetypeNodeRoles,
    archetypeEdgeMeanings,
    genreNodeRoles,
    genreEdgeMeanings,
    manifest,
    corpusHash: 'validation-run',
  }

  console.log('\nRunning validation checks...\n')
  const result = validateCorpus(corpus)

  // Group issues by graph
  const issuesByGraph = new Map<string, typeof result.issues>()
  for (const issue of result.issues) {
    const existing = issuesByGraph.get(issue.graph) ?? []
    existing.push(issue)
    issuesByGraph.set(issue.graph, existing)
  }

  // Report per graph
  const allGraphs = [...ARCHETYPE_DIRS, ...GENRE_DIRS]
  let passCount = 0
  for (const dir of allGraphs) {
    const graphIssues = issuesByGraph.get(dir)
    if (!graphIssues || graphIssues.length === 0) {
      passCount++
      continue
    }
    const errors = graphIssues.filter((i) => i.severity === 'error')
    const warnings = graphIssues.filter((i) => i.severity === 'warning')
    const status = errors.length > 0 ? 'FAIL' : 'WARN'
    console.log(`[${status}] ${dir}: ${errors.length} errors, ${warnings.length} warnings`)
    for (const issue of graphIssues) {
      const prefix = issue.severity === 'error' ? '  ERROR' : '  WARN '
      console.log(`${prefix}: ${issue.message}${issue.path ? ` (${issue.path})` : ''}`)
    }
  }

  // Report cross-reference issues
  for (const [key, graphIssues] of issuesByGraph) {
    if (!allGraphs.includes(key)) {
      console.log(`[WARN] ${key}:`)
      for (const issue of graphIssues) {
        console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`)
      }
    }
  }

  // Summary
  console.log('\n--- Summary ---')
  console.log(`Graphs validated: ${result.graphCount}`)
  console.log(`Passed: ${passCount}`)
  console.log(`With issues: ${issuesByGraph.size}`)
  console.log(`Total errors: ${result.errorCount}`)
  console.log(`Total warnings: ${result.warningCount}`)
  console.log(`Result: ${result.valid ? 'PASS' : 'FAIL'}`)

  if (!result.valid) {
    process.exit(1)
  }
} catch (err) {
  console.error('Fatal error during validation:', err)
  process.exit(2)
}
