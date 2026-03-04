/**
 * Graph JSON validator using JSON Schema (AJV) plus structural checks.
 * Validates node/edge ID formats, referential integrity, and vocabulary usage.
 */

import Ajv2020 from 'ajv/dist/2020.js'
import graphSchema from '../schemas/graph.schema.json'
import type { StoryGraph, GraphEdge, GraphNode } from '../types/graph.ts'

const ARCHETYPE_EDGE_MEANINGS = [
  'forces commitment',
  'reveals truth',
  'narrows options',
  'raises cost',
  'reframes goal',
  'tests resolve',
  'grants insight',
  'triggers crisis',
  'enables transformation',
  'restores equilibrium',
  'disrupts order',
  'demands sacrifice',
  'inverts expectation',
  'escalates conflict',
  'compels return',
]

const ARCHETYPE_NODE_ROLES = [
  'Origin',
  'Disruption',
  'Threshold',
  'Trial',
  'Revelation',
  'Reversal',
  'Commitment',
  'Crisis',
  'Transformation',
  'Irreversible Cost',
  'Resolution',
  'Descent',
  'Catalyst',
  'Reckoning',
]

const GENRE_EDGE_MEANINGS = [
  'specifies constraint',
  'narrows scope',
  'branches into subtype',
  'mandates element',
  'prohibits element',
  'inherits constraint',
  'sets tone',
  'introduces setting rule',
  'specializes threat',
  'restricts resolution',
  'differentiates from',
  'requires payoff',
]

const GENRE_NODE_ROLES = [
  'Genre Promise',
  'Core Constraint',
  'Subgenre Pattern',
  'World/Setting Rules',
  'Setting Rule',
  'Scene Obligation',
  'Scene Obligations',
  'Tone Marker',
  'Anti-Pattern',
]

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  path?: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
  stats: {
    nodeCount: number
    edgeCount: number
    startNodes: number
    terminalNodes: number
  }
}

export interface VocabularyAuditResult {
  type: 'archetype' | 'genre'
  edgeMeanings: { term: string; count: number }[]
  nodeRoles: { term: string; count: number }[]
  unusedEdgeMeanings: string[]
  unusedNodeRoles: string[]
}

const ajv = new Ajv2020({ allErrors: true })
const validateSchema = ajv.compile(graphSchema)

export function validateGraph(graph: StoryGraph): ValidationResult {
  const issues: ValidationIssue[] = []

  // 1. JSON Schema validation
  const schemaValid = validateSchema(graph)
  if (!schemaValid && validateSchema.errors) {
    for (const err of validateSchema.errors) {
      issues.push({
        severity: 'error',
        message: `Schema: ${err.instancePath} ${err.message}`,
        path: err.instancePath,
      })
    }
  }

  // 2. Collect node IDs for referential integrity
  const nodeIds = new Set(graph.nodes.map((n: GraphNode) => n.node_id))

  // 3. Check edge references point to existing nodes
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) {
      issues.push({
        severity: 'error',
        message: `Edge ${edge.edge_id}: "from" references unknown node "${edge.from}"`,
        path: `edges/${edge.edge_id}`,
      })
    }
    if (!nodeIds.has(edge.to)) {
      issues.push({
        severity: 'error',
        message: `Edge ${edge.edge_id}: "to" references unknown node "${edge.to}"`,
        path: `edges/${edge.edge_id}`,
      })
    }
  }

  // 4. Check for duplicate IDs
  const seenNodeIds = new Set<string>()
  for (const node of graph.nodes) {
    if (seenNodeIds.has(node.node_id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate node_id: "${node.node_id}"`,
        path: `nodes/${node.node_id}`,
      })
    }
    seenNodeIds.add(node.node_id)
  }

  const seenEdgeIds = new Set<string>()
  for (const edge of graph.edges) {
    if (seenEdgeIds.has(edge.edge_id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate edge_id: "${edge.edge_id}"`,
        path: `edges/${edge.edge_id}`,
      })
    }
    seenEdgeIds.add(edge.edge_id)
  }

  // 5. Check vocabulary usage
  const validMeanings =
    graph.type === 'archetype' ? ARCHETYPE_EDGE_MEANINGS : GENRE_EDGE_MEANINGS
  const validRoles = graph.type === 'archetype' ? ARCHETYPE_NODE_ROLES : GENRE_NODE_ROLES

  for (const edge of graph.edges) {
    if (!validMeanings.includes(edge.meaning)) {
      issues.push({
        severity: 'warning',
        message: `Edge ${edge.edge_id}: meaning "${edge.meaning}" not in controlled vocabulary`,
        path: `edges/${edge.edge_id}`,
      })
    }
  }

  for (const node of graph.nodes) {
    if (!validRoles.includes(node.role)) {
      issues.push({
        severity: 'warning',
        message: `Node ${node.node_id}: role "${node.role}" not in controlled vocabulary`,
        path: `nodes/${node.node_id}`,
      })
    }
  }

  // 6. Structural checks: start nodes (no incoming edges) and terminal nodes (no outgoing edges)
  const nodesWithIncoming = new Set(graph.edges.map((e: GraphEdge) => e.to))
  const nodesWithOutgoing = new Set(graph.edges.map((e: GraphEdge) => e.from))
  const startNodes = graph.nodes.filter((n: GraphNode) => !nodesWithIncoming.has(n.node_id))
  const terminalNodes = graph.nodes.filter((n: GraphNode) => !nodesWithOutgoing.has(n.node_id))

  if (startNodes.length === 0) {
    issues.push({
      severity: 'error',
      message: 'No start node found (every node has incoming edges)',
    })
  }

  if (terminalNodes.length === 0) {
    issues.push({
      severity: 'error',
      message: 'No terminal node found (every node has outgoing edges)',
    })
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      startNodes: startNodes.length,
      terminalNodes: terminalNodes.length,
    },
  }
}

/**
 * Audit vocabulary usage across an array of graphs.
 * Returns counts per term and lists unused terms.
 */
export function auditVocabulary(
  graphs: StoryGraph[],
  type: 'archetype' | 'genre',
): VocabularyAuditResult {
  const validMeanings = type === 'archetype' ? ARCHETYPE_EDGE_MEANINGS : GENRE_EDGE_MEANINGS
  const validRoles = type === 'archetype' ? ARCHETYPE_NODE_ROLES : GENRE_NODE_ROLES

  const meaningCounts = new Map<string, number>()
  const roleCounts = new Map<string, number>()

  for (const term of validMeanings) meaningCounts.set(term, 0)
  for (const term of validRoles) roleCounts.set(term, 0)

  for (const graph of graphs) {
    for (const edge of graph.edges) {
      const current = meaningCounts.get(edge.meaning)
      if (current !== undefined) {
        meaningCounts.set(edge.meaning, current + 1)
      }
    }
    for (const node of graph.nodes) {
      const current = roleCounts.get(node.role)
      if (current !== undefined) {
        roleCounts.set(node.role, current + 1)
      }
    }
  }

  return {
    type,
    edgeMeanings: [...meaningCounts.entries()].map(([term, count]) => ({ term, count })),
    nodeRoles: [...roleCounts.entries()].map(([term, count]) => ({ term, count })),
    unusedEdgeMeanings: [...meaningCounts.entries()]
      .filter(([, count]) => count === 0)
      .map(([term]) => term),
    unusedNodeRoles: [...roleCounts.entries()]
      .filter(([, count]) => count === 0)
      .map(([term]) => term),
  }
}

export { ARCHETYPE_EDGE_MEANINGS, ARCHETYPE_NODE_ROLES, GENRE_EDGE_MEANINGS, GENRE_NODE_ROLES }
