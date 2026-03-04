/**
 * Injects severity field ("hard" | "soft") into all genre graph.json files.
 *
 * Default rules:
 *   - Genre Promise (L1): hard — the promise IS the genre
 *   - Core Constraint (L2): hard — defining constraints
 *   - Subgenre Pattern (L3): soft — choosing a subgenre is optional
 *   - Setting Rule (L4): mixed — context-dependent
 *   - Scene Obligation (L5): mixed — mandatory payoff scenes are hard, stylistic ones soft
 *   - Tone Marker: hard — tone is non-negotiable for genre identity
 *   - Anti-Pattern: hard — violations by definition
 *   - Edges: inherit severity from their target node
 *
 * Run with: npx tsx app/scripts/inject-severity.ts
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_ROOT = resolve(__dirname, '../../data')

interface GraphNode {
  node_id: string
  label: string
  role: string
  level?: number
  severity?: 'hard' | 'soft'
  [key: string]: unknown
}

interface GraphEdge {
  edge_id: string
  from: string
  to: string
  meaning: string
  severity?: 'hard' | 'soft'
  [key: string]: unknown
}

interface GraphJson {
  _metadata?: Record<string, unknown>
  nodes: GraphNode[]
  edges: GraphEdge[]
  [key: string]: unknown
}

/**
 * Genre-specific overrides for Setting Rule (L4) and Scene Obligation (L5) nodes.
 * Keys are node_ids. Only nodes that deviate from the default need entries here.
 *
 * Default for L4 (Setting Rule): "hard" — most setting rules are binding once the subgenre is chosen
 * Default for L5 (Scene Obligation): "hard" — most scene obligations are mandatory payoffs
 *
 * Overrides to "soft" capture cases where the constraint is a strong expectation
 * but not a genre-breaker if violated.
 */
const SEVERITY_OVERRIDES: Record<string, 'hard' | 'soft'> = {
  // --- Only overrides that differ from the role-based default are listed ---
  // Default: L4 (Setting Rule) = hard, L5 (Scene Obligation) = hard

  // Drama — L4: confined setting and time pressure are flexible
  'DR_N40_CONFINED_SETTING': 'soft',
  'DR_N41_TIME_PRESSURE': 'soft',
  // Drama — L5: aftermath is expected but not mandatory
  'DR_N62_AFTERMATH': 'soft',

  // Action — L4: weapon/tool rule is flexible
  'AC_N42_WEAPON_TOOL': 'soft',

  // Comedy — L4: timing mechanism is flexible
  'CM_N42_TIMING_MECHANISM': 'soft',
  // Comedy — L5: comic climax style varies
  'CM_N62_COMIC_CLIMAX': 'soft',

  // Thriller — L4: isolation is not always required
  'TH_N41_ISOLATION': 'soft',

  // Fantasy — L4: boundary between worlds is flexible
  'FN_N42_BOUNDARY': 'soft',
  // Fantasy — L5: mythic climax style varies
  'FN_N62_MYTHIC_CLIMAX': 'soft',

  // Science Fiction — L4: extrapolation anchor is flexible
  'SF_N42_EXTRAPOLATION_ANCHOR': 'soft',
  // SF — L5: resolution scene style varies
  'SF_N62_RESOLUTION_SCENE': 'soft',

  // Adventure — L4: resource scarcity is not always present
  'AV_N42_RESOURCE_SCARCITY': 'soft',
  // Adventure — L5: final approach style varies
  'AV_N62_FINAL_APPROACH': 'soft',

  // Romance — L4: forced proximity is common but not mandatory
  'RO_N40_FORCED_PROXIMITY': 'soft',
  // Romance — L5: grand gesture is flexible
  'RO_N62_GRAND_GESTURE': 'soft',

  // Romantic Comedy — L4: social audience is flexible
  'RC_N41_SOCIAL_AUDIENCE': 'soft',
  // RC — L5: grand gesture is flexible
  'RC_N62_GRAND_GESTURE': 'soft',

  // Horror — all L4/L5 remain hard (horror has strict requirements)

  // Mystery — L4: closed circle is not always required
  'MY_N40_CLOSED_CIRCLE': 'soft',

  // Crime — L4: territory/power dynamics are flexible
  'CR_N42_TERRITORY_AND_POWER': 'soft',
  // Crime — L5: moral compromise is expected but not strictly required
  'CR_N61_MORAL_COMPROMISE': 'soft',

  // Detective — L4: institutional context is flexible
  'DT_N42_INSTITUTIONAL_CONTEXT': 'soft',

  // Superhero — L4: villain ecosystem is flexible
  'SH_N42_VILLAIN_ECOSYSTEM': 'soft',

  // Historical — L5: historical consequence is flexible
  'HI_N62_HISTORICAL_CONSEQUENCE': 'soft',

  // War — L5: aftermath scene is flexible
  'WR_N62_MISSION_CLIMAX': 'soft',

  // Biography — L4: public vs private is flexible
  'BI_N42_PUBLIC_VS_PRIVATE': 'soft',
  // Biography — L5: legacy summation is expected but flexible
  'BI_N62_LEGACY_SUMMATION': 'soft',

  // Family — L4: generational interaction is expected but flexible
  'FA_N42_GENERATIONAL_INTERACTION': 'soft',
  // Family — L5: reconciliation/reunion is expected but flexible
  'FA_N62_RECONCILIATION_REUNION': 'soft',

  // Young Adult — L4: school hierarchy is not always present
  'YA_N40_SCHOOL_SOCIAL_HIERARCHY': 'soft',

  // Literary Fiction — L4: nonlinear time is flexible
  'LF_N41_NONLINEAR_TIME': 'soft',
  // LF — L5: ambiguous ending is flexible
  'LF_N62_AMBIGUOUS_ENDING': 'soft',

  // Children's Lit — L4: adult figures being present is flexible
  'CL_N42_ADULT_FIGURES_PRESENT': 'soft',
  // CL — L5: earned resolution is flexible
  'CL_N62_EARNED_RESOLUTION': 'soft',

  // Satire — L4: logical absurdity is flexible
  'SA_N42_LOGICAL_ABSURDITY': 'soft',

  // Psychological — L4: confined spaces are not always required
  'PS_N41_CONFINED_SPACES': 'soft',
  // Psych — L5: reality questioning is flexible
  'PS_N60_REALITY_QUESTIONING': 'soft',

  // Western — L5: landscape stakes scene is flexible
  'WE_N62_LANDSCAPE_STAKES': 'soft',

  // Political — L5: betrayal/realignment is expected but flexible
  'PL_N61_BETRAYAL_REALIGNMENT': 'soft',

  // Musical — L4: ensemble emotional landscape is flexible
  'MU_N42_ENSEMBLE_EMOTIONAL_LANDSCAPE': 'soft',

  // Holiday — L5: celebration restored is flexible
  'HL_N62_CELEBRATION_RESTORED': 'soft',
}

function getDefaultSeverity(node: GraphNode): 'hard' | 'soft' {
  const role = node.role
  switch (role) {
    case 'Genre Promise':     return 'hard'
    case 'Core Constraint':   return 'hard'
    case 'Subgenre Pattern':  return 'soft'
    case 'Setting Rule':      return 'hard'  // default hard, overrides make some soft
    case 'Scene Obligation':  return 'hard'  // default hard, overrides make some soft
    case 'Tone Marker':       return 'hard'
    case 'Anti-Pattern':      return 'hard'
    default:                  return 'hard'
  }
}

function assignNodeSeverity(node: GraphNode): 'hard' | 'soft' {
  if (node.node_id in SEVERITY_OVERRIDES) {
    return SEVERITY_OVERRIDES[node.node_id]
  }
  return getDefaultSeverity(node)
}

function assignEdgeSeverity(edge: GraphEdge, nodeMap: Map<string, GraphNode>): 'hard' | 'soft' {
  // Edges inherit severity from their target node
  const targetNode = nodeMap.get(edge.to)
  if (targetNode) {
    return targetNode.severity || getDefaultSeverity(targetNode)
  }
  // Fallback: if target doesn't exist (shouldn't happen), use hard
  return 'hard'
}

function processGenreGraph(filePath: string): { nodes: number; edges: number; hard: number; soft: number } {
  const raw = readFileSync(filePath, 'utf-8')
  const graph: GraphJson = JSON.parse(raw)

  const nodeMap = new Map<string, GraphNode>()
  let hard = 0
  let soft = 0

  // Assign severity to all nodes
  for (const node of graph.nodes) {
    node.severity = assignNodeSeverity(node)
    nodeMap.set(node.node_id, node)
    if (node.severity === 'hard') hard++
    else soft++
  }

  // Assign severity to all edges (inherits from target node)
  for (const edge of graph.edges) {
    edge.severity = assignEdgeSeverity(edge, nodeMap)
    if (edge.severity === 'hard') hard++
    else soft++
  }

  // Update _metadata with severity counts
  if (graph._metadata) {
    graph._metadata.severityCounts = {
      hard,
      soft,
      total: hard + soft,
    }
  }

  // Reorder to maintain consistent key order
  const { _metadata, nodes, edges, ...rest } = graph
  const ordered = { ...rest, _metadata, nodes, edges }

  writeFileSync(filePath, JSON.stringify(ordered, null, 2) + '\n', 'utf-8')

  return { nodes: graph.nodes.length, edges: graph.edges.length, hard, soft }
}

function main() {
  const genresDir = join(DATA_ROOT, 'genres')
  const folders = readdirSync(genresDir).filter(f => {
    const full = join(genresDir, f)
    return existsSync(join(full, 'graph.json'))
  }).sort()

  let totalNodes = 0
  let totalEdges = 0
  let totalHard = 0
  let totalSoft = 0

  for (const folder of folders) {
    const graphPath = join(genresDir, folder, 'graph.json')
    const result = processGenreGraph(graphPath)
    totalNodes += result.nodes
    totalEdges += result.edges
    totalHard += result.hard
    totalSoft += result.soft
    console.log(`  ✓ ${folder}: ${result.hard} hard, ${result.soft} soft (${result.nodes} nodes, ${result.edges} edges)`)
  }

  console.log(`\nInjected severity into ${folders.length} genre graphs.`)
  console.log(`Total: ${totalNodes} nodes + ${totalEdges} edges = ${totalNodes + totalEdges} elements`)
  console.log(`Hard: ${totalHard}, Soft: ${totalSoft}`)
}

main()
