/**
 * Generation-specific normalizer and validator.
 * Extends the base graph-engine validator with additional checks
 * required by the generation pipeline:
 *   - Severity field presence and propagation on genre graphs
 *   - Variant node ID ranges (50–79)
 *   - Graph connectivity (archetype spine path, genre tree rooted at L1)
 *   - ID prefix + number range conventions
 */

import type { StoryGraph, GenreGraph, GenreNode, GraphEdge } from '../../types/graph.ts'
import type { LoadedCorpus } from '../artifacts/types.ts'
import { isGenreGraph, isArchetypeGraph } from '../../graph-engine/normalizer.ts'

// ---------------------------------------------------------------------------
// Validation issue types
// ---------------------------------------------------------------------------

export interface CorpusIssue {
  severity: 'error' | 'warning'
  graph: string      // graph id (e.g. "06_science_fiction")
  message: string
  path?: string
}

export interface CorpusValidationResult {
  valid: boolean
  issues: CorpusIssue[]
  graphCount: number
  errorCount: number
  warningCount: number
}

// ---------------------------------------------------------------------------
// Full corpus validation
// ---------------------------------------------------------------------------

export function validateCorpus(corpus: LoadedCorpus): CorpusValidationResult {
  const issues: CorpusIssue[] = []

  // Validate all archetype graphs
  for (const [dir, graph] of corpus.archetypeGraphs) {
    if (!isArchetypeGraph(graph)) {
      issues.push({ severity: 'error', graph: dir, message: 'Expected archetype type' })
      continue
    }
    issues.push(...validateIdConvention(graph, dir))
    issues.push(...validateConnectivity(graph, dir))
    issues.push(...validateVariantRanges(graph, dir))
  }

  // Validate all genre graphs
  for (const [dir, graph] of corpus.genreGraphs) {
    if (!isGenreGraph(graph)) {
      issues.push({ severity: 'error', graph: dir, message: 'Expected genre type' })
      continue
    }
    issues.push(...validateIdConvention(graph, dir))
    issues.push(...validateSeverity(graph, dir))
    issues.push(...validateGenreLevels(graph, dir))
    issues.push(...validateGenreConnectivity(graph, dir))
  }

  // Validate variant graphs
  for (const [dir, graph] of corpus.variantGraphs) {
    issues.push(...validateVariantFile(graph, dir))
  }

  // Validate cross-reference consistency
  issues.push(...validateCrossRefs(corpus))

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return {
    valid: errorCount === 0,
    issues,
    graphCount: corpus.archetypeGraphs.size + corpus.genreGraphs.size,
    errorCount,
    warningCount,
  }
}

// ---------------------------------------------------------------------------
// ID convention checks
// ---------------------------------------------------------------------------

const NODE_ID_RE = /^[A-Z]{2}_N(\d{2})_[A-Z0-9_]+$/
const EDGE_ID_RE = /^[A-Z]{2}_E(\d{2})_[A-Z0-9_]+$/

function validateIdConvention(graph: StoryGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Extract expected prefix from graph
  const expectedPrefix = graph.nodes.length > 0
    ? graph.nodes[0].node_id.match(/^([A-Z]{2})_/)?.[1] ?? ''
    : ''

  for (const node of graph.nodes) {
    if (!NODE_ID_RE.test(node.node_id)) {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Node ID "${node.node_id}" does not match convention {PREFIX}_N{##}_{NAME}`,
        path: `nodes/${node.node_id}`,
      })
    } else {
      const prefix = node.node_id.slice(0, 2)
      if (prefix !== expectedPrefix) {
        issues.push({
          severity: 'error',
          graph: dir,
          message: `Node "${node.node_id}" uses prefix "${prefix}", expected "${expectedPrefix}"`,
          path: `nodes/${node.node_id}`,
        })
      }
    }
  }

  for (const edge of graph.edges) {
    if (!EDGE_ID_RE.test(edge.edge_id)) {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Edge ID "${edge.edge_id}" does not match convention {PREFIX}_E{##}_{NAME}`,
        path: `edges/${edge.edge_id}`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Severity checks (genre graphs only)
// ---------------------------------------------------------------------------

function validateSeverity(graph: GenreGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Every genre node must have severity
  for (const node of graph.nodes) {
    const gn = node as GenreNode & { severity?: string }
    if (!gn.severity) {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Genre node "${node.node_id}" missing severity field`,
        path: `nodes/${node.node_id}`,
      })
    } else if (gn.severity !== 'hard' && gn.severity !== 'soft') {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Genre node "${node.node_id}" severity must be "hard" or "soft", got "${gn.severity}"`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  // Every genre edge must have severity
  for (const edge of graph.edges) {
    const ge = edge as GraphEdge & { severity?: string }
    if (!ge.severity) {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Genre edge "${edge.edge_id}" missing severity field`,
        path: `edges/${edge.edge_id}`,
      })
    } else if (ge.severity !== 'hard' && ge.severity !== 'soft') {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Genre edge "${edge.edge_id}" severity must be "hard" or "soft", got "${ge.severity}"`,
        path: `edges/${edge.edge_id}`,
      })
    }
  }

  // Severity propagation: edge severity should match target node severity
  const nodeById = new Map(graph.nodes.map((n) => [n.node_id, n as GenreNode & { severity?: string }]))
  for (const edge of graph.edges) {
    const ge = edge as GraphEdge & { severity?: string }
    const targetNode = nodeById.get(edge.to)
    if (ge.severity && targetNode?.severity && ge.severity !== targetNode.severity) {
      issues.push({
        severity: 'warning',
        graph: dir,
        message: `Edge "${edge.edge_id}" severity "${ge.severity}" differs from target node "${edge.to}" severity "${targetNode.severity}"`,
        path: `edges/${edge.edge_id}`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Genre level structure checks
// ---------------------------------------------------------------------------

function validateGenreLevels(graph: GenreGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Check Level 1 (Genre Promise) exists
  const l1Nodes = graph.nodes.filter((n) => n.level === 1)
  if (l1Nodes.length === 0) {
    issues.push({
      severity: 'error',
      graph: dir,
      message: 'Genre graph missing Level 1 (Genre Promise) node',
    })
  } else if (l1Nodes.length > 1) {
    issues.push({
      severity: 'warning',
      graph: dir,
      message: `Genre graph has ${l1Nodes.length} Level 1 nodes (expected 1)`,
    })
  }

  // Check tone marker and anti-pattern exist
  const toneNodes = graph.nodes.filter((n) => n.role === 'Tone Marker')
  if (toneNodes.length === 0) {
    issues.push({
      severity: 'error',
      graph: dir,
      message: 'Genre graph missing Tone Marker node',
    })
  }

  const antiPatternNodes = graph.nodes.filter((n) => n.role === 'Anti-Pattern')
  if (antiPatternNodes.length === 0) {
    issues.push({
      severity: 'error',
      graph: dir,
      message: 'Genre graph missing Anti-Pattern node',
    })
  }

  return issues
}

// ---------------------------------------------------------------------------
// Connectivity checks
// ---------------------------------------------------------------------------

function validateConnectivity(graph: StoryGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Build adjacency
  const adjacency = new Map<string, string[]>()
  for (const node of graph.nodes) adjacency.set(node.node_id, [])
  for (const edge of graph.edges) adjacency.get(edge.from)?.push(edge.to)

  // Find start nodes (no incoming edges)
  const nodesWithIncoming = new Set(graph.edges.map((e) => e.to))
  const startNodes = graph.nodes.filter((n) => !nodesWithIncoming.has(n.node_id))

  if (startNodes.length === 0) {
    issues.push({
      severity: 'error',
      graph: dir,
      message: 'No start node found (every node has incoming edges — cycle detected)',
    })
    return issues
  }

  // BFS from start nodes — all non-variant nodes should be reachable
  const visited = new Set<string>()
  const queue = startNodes.map((n) => n.node_id)
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    for (const neighbor of adjacency.get(id) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor)
    }
  }

  // Check reachability (exclude variant nodes 50-79 from required reachability)
  for (const node of graph.nodes) {
    const numMatch = node.node_id.match(/_N(\d{2})_/)
    const num = numMatch ? parseInt(numMatch[1], 10) : 0
    const isVariant = num >= 50 && num <= 79
    if (!isVariant && !visited.has(node.node_id)) {
      issues.push({
        severity: 'error',
        graph: dir,
        message: `Node "${node.node_id}" is unreachable from start nodes`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  return issues
}

function validateGenreConnectivity(graph: GenreGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Genre graphs should be rooted at the Level 1 node
  const l1Nodes = graph.nodes.filter((n) => n.level === 1)
  if (l1Nodes.length === 0) return issues // already caught by level check

  // BFS from L1 root
  const adjacency = new Map<string, string[]>()
  for (const node of graph.nodes) adjacency.set(node.node_id, [])
  for (const edge of graph.edges) adjacency.get(edge.from)?.push(edge.to)

  const visited = new Set<string>()
  const queue = [l1Nodes[0].node_id]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    for (const neighbor of adjacency.get(id) ?? []) {
      if (!visited.has(neighbor)) queue.push(neighbor)
    }
  }

  for (const node of graph.nodes) {
    if (!visited.has(node.node_id)) {
      issues.push({
        severity: 'warning',
        graph: dir,
        message: `Genre node "${node.node_id}" not reachable from Level 1 root`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Variant range checks
// ---------------------------------------------------------------------------

function validateVariantRanges(graph: StoryGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  for (const node of graph.nodes) {
    const match = node.node_id.match(/_N(\d{2})_/)
    if (!match) continue
    const num = parseInt(match[1], 10)
    // Variant nodes must be in 50-79 range
    // Spine nodes must NOT be in 50-79 range
    if (num >= 50 && num <= 79) {
      // This is a variant node in the main graph — warn (should be in variants.json after F1)
      issues.push({
        severity: 'warning',
        graph: dir,
        message: `Variant node "${node.node_id}" (N${match[1]}) found in main graph — expected in variants.json`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  return issues
}

function validateVariantFile(graph: StoryGraph, dir: string): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  for (const node of graph.nodes) {
    const match = node.node_id.match(/_N(\d{2})_/)
    if (!match) continue
    const num = parseInt(match[1], 10)
    if (num < 50 || num > 79) {
      issues.push({
        severity: 'warning',
        graph: dir,
        message: `Non-variant node "${node.node_id}" (N${match[1]}) found in variants.json — expected range 50-79`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Cross-reference consistency
// ---------------------------------------------------------------------------

function validateCrossRefs(corpus: LoadedCorpus): CorpusIssue[] {
  const issues: CorpusIssue[] = []

  // Matrix should reference all 27 genres
  if (corpus.matrix.genres.length !== corpus.genreGraphs.size) {
    issues.push({
      severity: 'warning',
      graph: 'genre_archetype_matrix',
      message: `Matrix has ${corpus.matrix.genres.length} genres but corpus has ${corpus.genreGraphs.size}`,
    })
  }

  // Emotional arcs should reference all 15 archetypes
  if (corpus.emotionalArcs.archetypes.length !== corpus.archetypeGraphs.size) {
    issues.push({
      severity: 'warning',
      graph: 'archetype_emotional_arcs',
      message: `Emotional arcs has ${corpus.emotionalArcs.archetypes.length} profiles but corpus has ${corpus.archetypeGraphs.size}`,
    })
  }

  // Tone integration should reference all 27 genres
  if (corpus.toneIntegration.integrations.length !== corpus.genreGraphs.size) {
    issues.push({
      severity: 'warning',
      graph: 'tone_archetype_integration',
      message: `Tone integration has ${corpus.toneIntegration.integrations.length} entries but corpus has ${corpus.genreGraphs.size}`,
    })
  }

  return issues
}
