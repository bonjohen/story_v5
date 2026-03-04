/**
 * Edge renumbering script for genre graphs.
 * Fixes edge IDs that use sequential numbering instead of level-transition ranges.
 *
 * Convention (from data/vocabulary/genre_id_convention.md):
 *   E01-E09: L1→L2, L1→Tone
 *   E10-E29: L2→L3
 *   E30-E49: L3→L4
 *   E50-E69: L4→L5, L5→L5
 *   E70-E89: Cross-level (skip levels), L3→L3, etc.
 *   E90-E99: Any edge → Anti-Pattern
 *
 * Run with: npx tsx app/scripts/renumber-edges.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_ROOT = resolve(__dirname, '../../data/genres')

// --- Types ---

interface GraphNode {
  node_id: string
  role: string
  [key: string]: unknown
}

interface GraphEdge {
  edge_id: string
  from: string
  to: string
  [key: string]: unknown
}

interface GraphJson {
  nodes: GraphNode[]
  edges: GraphEdge[]
  [key: string]: unknown
}

// --- Helpers ---

const ROLE_TO_LEVEL: Record<string, string> = {
  'Genre Promise': 'L1',
  'Core Constraint': 'L2',
  'Subgenre Pattern': 'L3',
  'Setting Rule': 'L4',
  'Scene Obligation': 'L5',
  'Tone Marker': 'Tone',
  'Anti-Pattern': 'Anti',
}

function getLevel(nodeId: string, nodesById: Map<string, GraphNode>): string {
  const node = nodesById.get(nodeId)
  if (!node) return '?'
  return ROLE_TO_LEVEL[node.role] ?? '?'
}

function getCorrectRange(srcLevel: string, tgtLevel: string): [number, number] {
  if (tgtLevel === 'Anti') return [90, 99]
  if (srcLevel === 'L1' && tgtLevel === 'Tone') return [1, 9]
  if (srcLevel === 'L1' && tgtLevel === 'L2') return [1, 9]
  if (srcLevel === 'L2' && tgtLevel === 'L3') return [10, 29]
  if (srcLevel === 'L3' && tgtLevel === 'L4') return [30, 49]
  if (srcLevel === 'L4' && tgtLevel === 'L5') return [50, 69]
  if (srcLevel === 'L5' && tgtLevel === 'L5') return [50, 69]
  // Everything else is cross-level
  return [70, 89]
}

function extractEdgeNum(edgeId: string): number {
  const match = edgeId.match(/_E(\d+)_/)
  return match ? parseInt(match[1], 10) : -1
}

function replaceEdgeNum(edgeId: string, newNum: number): string {
  const padded = String(newNum).padStart(2, '0')
  return edgeId.replace(/_E\d+_/, `_E${padded}_`)
}

// --- Main logic ---

interface GenreConfig {
  prefix: string
  folder: string
}

const GENRES_TO_FIX: GenreConfig[] = [
  { prefix: 'HR', folder: '10_horror' },
  { prefix: 'DT', folder: '13_detective' },
  { prefix: 'RC', folder: '09_romantic_comedy' },
  { prefix: 'LF', folder: '20_literary_fiction' },
  { prefix: 'CL', folder: '21_childrens_literature' },
  { prefix: 'FA', folder: '18_family' },
  { prefix: 'BI', folder: '17_biography' },
  { prefix: 'CR', folder: '12_crime' },
]

function processGenre(config: GenreConfig): Map<string, string> {
  const graphPath = resolve(DATA_ROOT, config.folder, 'graph.json')
  const graph: GraphJson = JSON.parse(readFileSync(graphPath, 'utf-8'))

  const nodesById = new Map<string, GraphNode>()
  for (const node of graph.nodes) {
    nodesById.set(node.node_id, node)
  }

  // Group edges by their correct range
  const rangeCounters = new Map<string, number>()
  const renameMap = new Map<string, string>() // old edge_id -> new edge_id

  // First pass: identify which edges need renumbering
  const edgesNeedingFix: { edge: GraphEdge; correctRange: [number, number] }[] = []
  const edgesOk: { edge: GraphEdge; num: number }[] = []

  for (const edge of graph.edges) {
    const srcLevel = getLevel(edge.from, nodesById)
    const tgtLevel = getLevel(edge.to, nodesById)
    const currentNum = extractEdgeNum(edge.edge_id)
    const [lo, hi] = getCorrectRange(srcLevel, tgtLevel)

    if (currentNum >= lo && currentNum <= hi) {
      edgesOk.push({ edge, num: currentNum })
    } else {
      edgesNeedingFix.push({ edge, correctRange: [lo, hi] })
    }
  }

  if (edgesNeedingFix.length === 0) {
    console.log(`  ${config.prefix}: No edges need renumbering`)
    return renameMap
  }

  // Track which numbers are already used in each range by correctly-numbered edges
  const usedNumbers = new Map<string, Set<number>>()
  for (const { num } of edgesOk) {
    // Determine which range this number belongs to
    for (const [lo, hi] of [[1,9],[10,29],[30,49],[50,69],[70,89],[90,99]]) {
      if (num >= lo && num <= hi) {
        const key = `${lo}-${hi}`
        if (!usedNumbers.has(key)) usedNumbers.set(key, new Set())
        usedNumbers.get(key)!.add(num)
        break
      }
    }
  }

  // Second pass: assign new numbers
  for (const { edge, correctRange } of edgesNeedingFix) {
    const [lo, hi] = correctRange
    const key = `${lo}-${hi}`
    if (!usedNumbers.has(key)) usedNumbers.set(key, new Set())
    const used = usedNumbers.get(key)!

    // Find next available number in range
    let newNum = lo
    while (used.has(newNum) && newNum <= hi) newNum++
    if (newNum > hi) {
      console.error(`  ${config.prefix}: Range ${key} exhausted for ${edge.edge_id}!`)
      continue
    }
    used.add(newNum)

    const newId = replaceEdgeNum(edge.edge_id, newNum)
    renameMap.set(edge.edge_id, newId)
  }

  // Apply renames to graph.json
  for (const edge of graph.edges) {
    const newId = renameMap.get(edge.edge_id)
    if (newId) {
      edge.edge_id = newId
    }
  }

  // Sort edges by new numeric ID
  graph.edges.sort((a, b) => extractEdgeNum(a.edge_id) - extractEdgeNum(b.edge_id))

  // Re-inject metadata
  const nodesPerRole: Record<string, number> = {}
  for (const node of graph.nodes) {
    nodesPerRole[node.role] = (nodesPerRole[node.role] || 0) + 1
  }
  const edgesPerMeaning: Record<string, number> = {}
  for (const edge of graph.edges) {
    const meaning = (edge as any).meaning as string
    if (meaning) edgesPerMeaning[meaning] = (edgesPerMeaning[meaning] || 0) + 1
  }
  ;(graph as any)._metadata = {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    nodesPerRole,
    edgesPerMeaning,
  }

  writeFileSync(graphPath, JSON.stringify(graph, null, 2) + '\n', 'utf-8')

  // Apply renames to narrative.md and examples.md
  for (const filename of ['narrative.md', 'examples.md']) {
    const filePath = resolve(DATA_ROOT, config.folder, filename)
    let content: string
    try {
      content = readFileSync(filePath, 'utf-8')
    } catch {
      continue
    }

    let changed = false
    for (const [oldId, newId] of renameMap) {
      if (content.includes(oldId)) {
        content = content.split(oldId).join(newId)
        changed = true
      }
    }

    if (changed) {
      writeFileSync(filePath, content, 'utf-8')
    }
  }

  console.log(`  ${config.prefix}: Renumbered ${renameMap.size} edges`)
  for (const [oldId, newId] of renameMap) {
    console.log(`    ${oldId} → ${newId}`)
  }

  return renameMap
}

function main() {
  console.log('Edge renumbering script\n')
  console.log('=== Phase B1: Systematic renumbering (8 genres) ===\n')

  let totalRenamed = 0
  for (const config of GENRES_TO_FIX) {
    const renames = processGenre(config)
    totalRenamed += renames.size
  }

  console.log(`\nTotal: ${totalRenamed} edges renumbered across ${GENRES_TO_FIX.length} genres.`)
}

main()
