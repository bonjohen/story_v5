/**
 * One-off script: injects _metadata into all graph.json files.
 * Run with: npx tsx app/scripts/inject-metadata.ts
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_ROOT = resolve(__dirname, '../../data')

interface GraphNode {
  node_id: string
  role: string
  [key: string]: unknown
}

interface GraphEdge {
  edge_id: string
  meaning: string
  [key: string]: unknown
}

interface GraphJson {
  _metadata?: Record<string, unknown>
  nodes: GraphNode[]
  edges: GraphEdge[]
  [key: string]: unknown
}

function computeMetadata(graph: GraphJson) {
  const nodesPerRole: Record<string, number> = {}
  for (const node of graph.nodes) {
    nodesPerRole[node.role] = (nodesPerRole[node.role] || 0) + 1
  }

  const edgesPerMeaning: Record<string, number> = {}
  for (const edge of graph.edges) {
    edgesPerMeaning[edge.meaning] = (edgesPerMeaning[edge.meaning] || 0) + 1
  }

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    nodesPerRole,
    edgesPerMeaning,
  }
}

function processGraphFile(filePath: string) {
  const raw = readFileSync(filePath, 'utf-8')
  let graph: GraphJson
  try {
    graph = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse ${filePath}: ${e instanceof Error ? e.message : e}`)
  }
  graph._metadata = computeMetadata(graph)

  // Place _metadata right after top-level fields, before nodes/edges
  const { _metadata, nodes, edges, ...rest } = graph
  const ordered = { ...rest, _metadata, nodes, edges }

  writeFileSync(filePath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8')
}

function main() {
  let count = 0

  for (const subdir of ['archetypes', 'genres']) {
    const base = join(DATA_ROOT, subdir)
    const folders = readdirSync(base).filter(f => {
      const full = join(base, f)
      return existsSync(join(full, 'graph.json'))
    }).sort()

    for (const folder of folders) {
      const graphPath = join(base, folder, 'graph.json')
      processGraphFile(graphPath)
      count++
      console.log(`  OK${subdir}/${folder}`)
    }
  }

  console.log(`\nInjected _metadata into ${count} graph.json files.`)
}

main()
