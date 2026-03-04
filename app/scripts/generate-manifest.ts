/**
 * Build-time script: generates data/manifest.json from all graph.json files.
 * Run with: npx tsx scripts/generate-manifest.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { buildGraphMetadata, buildManifest, ARCHETYPE_DIRS, GENRE_DIRS } from '../src/graph-engine/dataIndex.ts'
import { parseGraphJson } from '../src/graph-engine/normalizer.ts'
import { validateGraph, auditVocabulary } from '../src/graph-engine/validator.ts'
import type { GraphMetadata, StoryGraph } from '../src/types/graph.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_ROOT = resolve(__dirname, '../../data')

function loadGraphFromDisk(graphPath: string): StoryGraph | null {
  if (!existsSync(graphPath)) {
    console.warn(`  SKIP: ${graphPath} not found`)
    return null
  }
  const raw = JSON.parse(readFileSync(graphPath, 'utf-8'))
  return parseGraphJson(raw)
}

function main() {
  console.log('Generating data manifest...\n')

  const archetypeMetas: GraphMetadata[] = []
  const genreMetas: GraphMetadata[] = []
  const allArchetypeGraphs: StoryGraph[] = []
  const allGenreGraphs: StoryGraph[] = []
  let errors = 0

  // Archetypes
  console.log('--- Archetypes ---')
  for (const dir of ARCHETYPE_DIRS) {
    const graphPath = join(DATA_ROOT, 'archetypes', dir, 'graph.json')
    const graph = loadGraphFromDisk(graphPath)
    if (!graph) continue

    const hasNarrative = existsSync(join(DATA_ROOT, 'archetypes', dir, 'narrative.md'))
    const hasExamples = existsSync(join(DATA_ROOT, 'archetypes', dir, 'examples.md'))
    const meta = buildGraphMetadata(graph, `archetypes/${dir}`, hasNarrative, hasExamples)
    archetypeMetas.push(meta)
    allArchetypeGraphs.push(graph)

    const result = validateGraph(graph)
    const status = result.valid ? 'PASS' : 'FAIL'
    const issueCount = result.issues.length
    console.log(`  ${status} ${meta.name} — ${meta.nodeCount}N/${meta.edgeCount}E${issueCount > 0 ? ` (${issueCount} issues)` : ''}`)
    if (!result.valid) errors++
  }

  // Genres
  console.log('\n--- Genres ---')
  for (const dir of GENRE_DIRS) {
    const graphPath = join(DATA_ROOT, 'genres', dir, 'graph.json')
    const graph = loadGraphFromDisk(graphPath)
    if (!graph) continue

    const hasNarrative = existsSync(join(DATA_ROOT, 'genres', dir, 'narrative.md'))
    const hasExamples = existsSync(join(DATA_ROOT, 'genres', dir, 'examples.md'))
    const meta = buildGraphMetadata(graph, `genres/${dir}`, hasNarrative, hasExamples)
    genreMetas.push(meta)
    allGenreGraphs.push(graph)

    const result = validateGraph(graph)
    const status = result.valid ? 'PASS' : 'FAIL'
    const issueCount = result.issues.length
    console.log(`  ${status} ${meta.name} — ${meta.nodeCount}N/${meta.edgeCount}E${issueCount > 0 ? ` (${issueCount} issues)` : ''}`)
    if (!result.valid) errors++
  }

  // Vocabulary audit
  console.log('\n--- Vocabulary Audit ---')
  const archetypeAudit = auditVocabulary(allArchetypeGraphs, 'archetype')
  const genreAudit = auditVocabulary(allGenreGraphs, 'genre')

  if (archetypeAudit.unusedEdgeMeanings.length > 0) {
    console.log(`  Archetype unused edge meanings: ${archetypeAudit.unusedEdgeMeanings.join(', ')}`)
  }
  if (archetypeAudit.unusedNodeRoles.length > 0) {
    console.log(`  Archetype unused node roles: ${archetypeAudit.unusedNodeRoles.join(', ')}`)
  }
  if (genreAudit.unusedEdgeMeanings.length > 0) {
    console.log(`  Genre unused edge meanings: ${genreAudit.unusedEdgeMeanings.join(', ')}`)
  }
  if (genreAudit.unusedNodeRoles.length > 0) {
    console.log(`  Genre unused node roles: ${genreAudit.unusedNodeRoles.join(', ')}`)
  }

  // Build and write manifest
  const manifest = buildManifest(archetypeMetas, genreMetas)
  const manifestPath = join(DATA_ROOT, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`\nManifest written to ${manifestPath}`)
  console.log(`  ${manifest.totals.archetypes} archetypes, ${manifest.totals.genres} genres`)
  console.log(`  ${manifest.totals.totalNodes} total nodes, ${manifest.totals.totalEdges} total edges`)

  if (errors > 0) {
    console.log(`\n${errors} graph(s) had validation errors.`)
    process.exit(1)
  }
}

main()
