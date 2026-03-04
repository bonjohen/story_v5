/**
 * Constraint Checklist Generator — for genre graphs, extracts all applicable
 * constraints along a selected subgenre path and produces a copyable checklist.
 *
 * v-next #26: given the current genre + selected subgenre path, extract all
 * applicable constraints and produce a printable/exportable checklist.
 */

import { useMemo, useCallback } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import type { GraphNode } from '../types/graph.ts'

const toArr = (v: string | string[]) => (Array.isArray(v) ? v : [v])

interface ConstraintChecklistProps {
  graph: NormalizedGraph
  selectedNodeId: string | null
}

interface ConstraintItem {
  nodeLabel: string
  nodeRole: string
  level: number | null
  constraints: string[] // entry_conditions + exit_conditions
}

/**
 * Walk backward from the selected node to the root, collecting constraints.
 * Then walk forward from selected node to all reachable scene obligations.
 * Produces an ordered list of constraints from genre promise -> scene obligations.
 */
function extractConstraints(
  graph: NormalizedGraph,
  startNodeId: string,
): ConstraintItem[] {
  const nodeMap = new Map<string, GraphNode>()
  for (const node of graph.graph.nodes) {
    nodeMap.set(node.node_id, node)
  }

  // Walk backward to collect the path to root
  const backwardPath: string[] = []
  const visited = new Set<string>()
  const queue = [startNodeId]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    backwardPath.push(id)
    const predecessors = graph.reverseAdjacency.get(id) ?? []
    for (const p of predecessors) {
      if (!visited.has(p)) queue.push(p)
    }
  }

  // Walk forward to collect scene obligations and downstream nodes
  const forwardVisited = new Set<string>()
  const forwardQueue = [startNodeId]
  while (forwardQueue.length > 0) {
    const id = forwardQueue.shift()!
    if (forwardVisited.has(id)) continue
    forwardVisited.add(id)
    const neighbors = graph.adjacency.get(id) ?? []
    for (const n of neighbors) {
      if (!forwardVisited.has(n)) forwardQueue.push(n)
    }
  }

  // Merge all unique nodes
  const allNodeIds = new Set([...backwardPath, ...forwardVisited])
  const items: ConstraintItem[] = []

  // Sort by level for genre graphs
  const sortedNodes = Array.from(allNodeIds)
    .map((id) => nodeMap.get(id))
    .filter((n): n is GraphNode => !!n)
    .sort((a, b) => {
      const la = ('level' in a ? (a as { level: number | null }).level : null) ?? 99
      const lb = ('level' in b ? (b as { level: number | null }).level : null) ?? 99
      return la - lb
    })

  for (const node of sortedNodes) {
    const entryConditions = toArr(node.entry_conditions).filter((s) => s.trim())
    const exitConditions = toArr(node.exit_conditions).filter((s) => s.trim())
    const constraints = [...entryConditions, ...exitConditions]

    if (constraints.length > 0) {
      items.push({
        nodeLabel: node.label,
        nodeRole: node.role,
        level: 'level' in node ? (node as { level: number | null }).level : null,
        constraints,
      })
    }
  }

  return items
}

export function ConstraintChecklist({ graph, selectedNodeId }: ConstraintChecklistProps) {
  const isGenre = graph.graph.type === 'genre'

  const items = useMemo(() => {
    if (!isGenre || !selectedNodeId) return []
    return extractConstraints(graph, selectedNodeId)
  }, [graph, selectedNodeId, isGenre])

  const handleCopy = useCallback(() => {
    const text = formatChecklistText(graph.graph.name, items)
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback: select text
    })
  }, [graph.graph.name, items])

  if (!isGenre || items.length === 0) return null

  return (
    <div style={{
      marginTop: 12,
      padding: '10px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          Constraint Checklist
        </span>
        <button
          onClick={handleCopy}
          title="Copy checklist to clipboard"
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 3,
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          Copy
        </button>
      </div>

      {items.map((item, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginBottom: 2,
          }}>
            {item.level != null ? `L${item.level}` : ''} {item.nodeRole} — {item.nodeLabel}
          </div>
          {item.constraints.map((c, j) => (
            <div key={j} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 6,
              fontSize: 11,
              lineHeight: 1.5,
              paddingLeft: 4,
            }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{'\u25A1'}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function formatChecklistText(graphName: string, items: ConstraintItem[]): string {
  const lines: string[] = [`# Constraint Checklist: ${graphName}`, '']
  for (const item of items) {
    const level = item.level != null ? `L${item.level}` : ''
    lines.push(`## ${level} ${item.nodeRole} — ${item.nodeLabel}`)
    for (const c of item.constraints) {
      lines.push(`- [ ] ${c}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
