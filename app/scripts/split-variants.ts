/**
 * One-off script: splits variant branches (nodes/edges in the 50-79 ID range)
 * from archetype graph.json files into separate variants.json files.
 * Run with: npx tsx app/scripts/split-variants.ts
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
  from: string
  to: string
  meaning: string
  [key: string]: unknown
}

interface GraphJson {
  _metadata?: Record<string, unknown>
  nodes: GraphNode[]
  edges: GraphEdge[]
  [key: string]: unknown
}

/** Extract the numeric ID from a node_id like HJ_N50_REFUSAL_OF_CALL ->50 */
function getNodeNum(nodeId: string): number {
  const match = nodeId.match(/_N(\d+)_/)
  return match ? parseInt(match[1], 10) : -1
}

/** Extract the numeric ID from an edge_id like HJ_E50_REFUSAL ->50 */
function getEdgeNum(edgeId: string): number {
  const match = edgeId.match(/_E(\d+)_/)
  return match ? parseInt(match[1], 10) : -1
}

function isVariantRange(num: number): boolean {
  return num >= 50 && num <= 79
}

function computeMetadata(nodes: GraphNode[], edges: GraphEdge[]) {
  const nodesPerRole: Record<string, number> = {}
  for (const node of nodes) {
    nodesPerRole[node.role] = (nodesPerRole[node.role] || 0) + 1
  }
  const edgesPerMeaning: Record<string, number> = {}
  for (const edge of edges) {
    edgesPerMeaning[edge.meaning] = (edgesPerMeaning[edge.meaning] || 0) + 1
  }
  return { nodeCount: nodes.length, edgeCount: edges.length, nodesPerRole, edgesPerMeaning }
}

function processArchetype(folder: string): { hasVariants: boolean; variantNodes: number; variantEdges: number } {
  const graphPath = join(folder, 'graph.json')
  const variantPath = join(folder, 'variants.json')
  const raw = readFileSync(graphPath, 'utf-8')
  let graph: GraphJson
  try {
    graph = JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse ${graphPath}: ${e instanceof Error ? e.message : e}`)
  }

  const variantNodeIds = new Set<string>()
  const coreNodes: GraphNode[] = []
  const variantNodes: GraphNode[] = []

  for (const node of graph.nodes) {
    const num = getNodeNum(node.node_id)
    if (isVariantRange(num)) {
      variantNodes.push(node)
      variantNodeIds.add(node.node_id)
    } else {
      coreNodes.push(node)
    }
  }

  // An edge is a variant edge if its ID is in 50-79 range OR if it connects to/from a variant node
  const coreEdges: GraphEdge[] = []
  const variantEdges: GraphEdge[] = []

  for (const edge of graph.edges) {
    const num = getEdgeNum(edge.edge_id)
    if (isVariantRange(num) || variantNodeIds.has(edge.from) || variantNodeIds.has(edge.to)) {
      variantEdges.push(edge)
    } else {
      coreEdges.push(edge)
    }
  }

  if (variantNodes.length === 0) {
    // No variants — just add variant_file: null and update metadata
    const { _metadata, nodes, edges, ...rest } = graph
    const newMeta = computeMetadata(coreNodes, coreEdges)
    const ordered = { ...rest, _metadata: newMeta, variant_file: null, nodes: coreNodes, edges: coreEdges }
    writeFileSync(graphPath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8')
    return { hasVariants: false, variantNodes: 0, variantEdges: 0 }
  }

  // Find branch points and rejoin points (core nodes referenced by variant edges)
  const branchPoints: string[] = []
  const rejoinPoints: string[] = []
  for (const edge of variantEdges) {
    if (!variantNodeIds.has(edge.from) && !branchPoints.includes(edge.from)) {
      branchPoints.push(edge.from)
    }
    if (!variantNodeIds.has(edge.to) && !rejoinPoints.includes(edge.to)) {
      rejoinPoints.push(edge.to)
    }
  }

  // Write variants.json
  const variantData = {
    parent_graph: graph.id || null,
    description: `Variant branches for ${(graph as any).name || graph.id}. Contains optional/alternative paths that branch from and rejoin the core spine.`,
    _metadata: {
      ...computeMetadata(variantNodes, variantEdges),
      branchPoints,
      rejoinPoints,
    },
    nodes: variantNodes,
    edges: variantEdges,
  }
  writeFileSync(variantPath, JSON.stringify(variantData, null, 2) + '\n', 'utf-8')

  // Update main graph.json — remove variant nodes/edges, add variant_file pointer
  const { _metadata, nodes, edges, ...rest } = graph
  const newMeta = computeMetadata(coreNodes, coreEdges)
  const ordered = { ...rest, _metadata: newMeta, variant_file: 'variants.json', nodes: coreNodes, edges: coreEdges }
  writeFileSync(graphPath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8')

  return { hasVariants: true, variantNodes: variantNodes.length, variantEdges: variantEdges.length }
}

function main() {
  const base = join(DATA_ROOT, 'archetypes')
  const folders = readdirSync(base)
    .filter(f => existsSync(join(base, f, 'graph.json')))
    .sort()

  let totalVariantFiles = 0
  let totalVariantNodes = 0
  let totalVariantEdges = 0

  for (const folder of folders) {
    const result = processArchetype(join(base, folder))
    if (result.hasVariants) {
      totalVariantFiles++
      totalVariantNodes += result.variantNodes
      totalVariantEdges += result.variantEdges
      console.log(`  OK${folder}: split ${result.variantNodes} nodes, ${result.variantEdges} edges ->variants.json`)
    } else {
      console.log(`  · ${folder}: no variant nodes (variant_file: null)`)
    }
  }

  console.log(`\nProcessed ${folders.length} archetypes. Created ${totalVariantFiles} variants.json files (${totalVariantNodes} nodes, ${totalVariantEdges} edges extracted).`)
}

main()
