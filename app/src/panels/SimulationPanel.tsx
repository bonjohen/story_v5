/**
 * Simulation Panel — controls step-by-step graph traversal.
 * Shows current position, available next edges, and completeness meter.
 * For archetypes: transformation curve. For genres: constraint narrowing meter.
 */

import { useCallback, useMemo } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { useSimulationStore } from '../store/simulationStore.ts'
import { toArray } from '../utils/arrays.ts'
import type { GraphNode } from '../types/graph.ts'

interface SimulationPanelProps {
  graph: NormalizedGraph
}

export function SimulationPanel({ graph }: SimulationPanelProps) {
  const active = useSimulationStore((s) => s.active)
  const currentNodeId = useSimulationStore((s) => s.currentNodeId)
  const visitedNodes = useSimulationStore((s) => s.visitedNodes)
  const availableEdges = useSimulationStore((s) => s.availableEdges)
  const totalNodes = useSimulationStore((s) => s.totalNodes)
  const startSimulation = useSimulationStore((s) => s.startSimulation)
  const advanceToNode = useSimulationStore((s) => s.advanceToNode)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)

  const isArchetype = graph.graph.type === 'archetype'

  // Find start nodes
  const startNodes = useMemo(() => {
    const targets = new Set(graph.graph.edges.map((e) => e.to))
    return graph.graph.nodes.filter((n) => !targets.has(n.node_id))
  }, [graph])

  const currentNode = currentNodeId
    ? graph.graph.nodes.find((n) => n.node_id === currentNodeId)
    : null

  const nextEdges = useMemo(() => {
    return graph.graph.edges.filter((e) => availableEdges.includes(e.edge_id))
  }, [graph, availableEdges])

  const handleStart = useCallback(
    (nodeId: string) => startSimulation(graph, nodeId),
    [graph, startSimulation],
  )

  const handleAdvance = useCallback(
    (edgeId: string) => {
      const edge = graph.graph.edges.find((e) => e.edge_id === edgeId)
      if (edge) advanceToNode(graph, edgeId, edge.to)
    },
    [graph, advanceToNode],
  )

  const completeness = totalNodes > 0 ? visitedNodes.length / totalNodes : 0
  const isTerminal = nextEdges.length === 0 && active

  // Constraint narrowing for genres
  const constraintCount = useMemo(() => {
    if (!isArchetype && active) {
      let total = 0
      let visited = 0
      for (const node of graph.graph.nodes) {
        const constraints = [
          ...toArray(node.entry_conditions).filter((s) => s.trim()),
          ...toArray(node.exit_conditions).filter((s) => s.trim()),
        ]
        total += constraints.length
        if (visitedNodes.includes(node.node_id)) {
          visited += constraints.length
        }
      }
      return { total, visited }
    }
    return null
  }, [graph, isArchetype, active, visitedNodes])

  if (!active) {
    return (
      <div style={{
        padding: '12px 14px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: 8,
        }}>
          Path Simulation
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Walk through the graph step by step. Choose a start node:
        </div>
        {startNodes.map((node) => (
          <button
            key={node.node_id}
            onClick={() => handleStart(node.node_id)}
            style={{
              display: 'block',
              width: '100%',
              padding: '6px 10px',
              marginBottom: 4,
              fontSize: 12,
              textAlign: 'left',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {'\u25B6'} {node.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Header */}
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
          Simulating
        </span>
        <button
          onClick={resetSimulation}
          aria-label="Reset simulation"
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 3,
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </div>

      {/* Current node */}
      {currentNode && (
        <div style={{
          padding: '8px 10px',
          background: 'var(--bg-elevated)',
          borderRadius: 4,
          marginBottom: 8,
          borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{currentNode.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {currentNode.role} | {currentNode.node_id}
          </div>
        </div>
      )}

      {/* Completeness meter */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}>
          <span>Structural Coverage</span>
          <span>{visitedNodes.length}/{totalNodes} ({Math.round(completeness * 100)}%)</span>
        </div>
        <div style={{
          height: 4,
          background: 'var(--bg-primary)',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${completeness * 100}%`,
            background: isTerminal ? '#22c55e' : 'var(--accent)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Constraint narrowing meter (genre only) */}
      {constraintCount && (
        <div style={{ marginBottom: 10 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: 'var(--text-muted)',
            marginBottom: 4,
          }}>
            <span>Constraints Specified</span>
            <span>{constraintCount.visited}/{constraintCount.total}</span>
          </div>
          <div style={{
            height: 4,
            background: 'var(--bg-primary)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${constraintCount.total > 0 ? (constraintCount.visited / constraintCount.total) * 100 : 0}%`,
              background: '#8b5cf6',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      )}

      {/* Transformation curve (archetype only) */}
      {isArchetype && visitedNodes.length > 1 && (
        <TransformationCurve graph={graph} visitedNodes={visitedNodes} />
      )}

      {/* Available next edges */}
      {isTerminal ? (
        <div>
          <div style={{
            padding: '8px 10px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            fontSize: 12,
            color: '#22c55e',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Terminal node reached. Simulation complete.
          </div>
          {/* Constraint sheet export (genre only, v-next #30) */}
          {!isArchetype && (
            <ConstraintSheetExport graph={graph} visitedNodes={visitedNodes} />
          )}
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}>
            Next steps ({nextEdges.length})
          </div>
          {nextEdges.map((edge) => {
            const targetNode = graph.graph.nodes.find((n) => n.node_id === edge.to)
            const alreadyVisited = visitedNodes.includes(edge.to)
            return (
              <button
                key={edge.edge_id}
                onClick={() => handleAdvance(edge.edge_id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  marginBottom: 4,
                  fontSize: 12,
                  textAlign: 'left',
                  background: alreadyVisited ? 'var(--bg-primary)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  opacity: alreadyVisited ? 0.6 : 1,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontWeight: 500 }}>
                  {'\u2192'} {edge.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {targetNode?.label ?? edge.to}
                  {alreadyVisited && ' (visited)'}
                </div>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}

/** Simple escalation/tension curve for archetype traversals */
function TransformationCurve({ graph, visitedNodes }: {
  graph: NormalizedGraph
  visitedNodes: string[]
}) {
  // Map roles to tension levels (0-1 scale)
  const TENSION: Record<string, number> = {
    'Origin': 0.1,
    'Catalyst': 0.25,
    'Disruption': 0.35,
    'Commitment': 0.3,
    'Threshold': 0.4,
    'Trial': 0.55,
    'Escalation': 0.7,
    'Descent': 0.65,
    'Crisis': 0.9,
    'Revelation': 0.75,
    'Irreversible Cost': 0.85,
    'Transformation': 0.6,
    'Resolution': 0.3,
    'Reckoning': 0.5,
  }

  const points = visitedNodes.map((id, i) => {
    const node = graph.graph.nodes.find((n) => n.node_id === id)
    const tension = node ? (TENSION[node.role] ?? 0.5) : 0.5
    return { x: i, y: tension }
  })

  if (points.length < 2) return null

  const W = 220
  const H = 40
  const maxX = points.length - 1
  const pathData = points
    .map((p, i) => {
      const x = maxX > 0 ? (p.x / maxX) * W : W / 2
      const y = H - p.y * H
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10,
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        Tension Curve
      </div>
      <svg width={W} height={H + 4} style={{ display: 'block' }}>
        <path
          d={pathData}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={maxX > 0 ? (p.x / maxX) * W : W / 2}
            cy={H - p.y * H}
            r={3}
            fill={i === points.length - 1 ? '#f59e0b' : '#f59e0b66'}
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * Constraint Sheet Export — after completing a genre simulation, export
 * accumulated constraints as a tailored writing guide (v-next #30).
 */
function ConstraintSheetExport({ graph, visitedNodes }: {
  graph: NormalizedGraph
  visitedNodes: string[]
}) {
  const handleExport = useCallback(() => {
    const visitedSet = new Set(visitedNodes)
    const lines: string[] = [
      `# Writing Constraint Sheet: ${graph.graph.name}`,
      ``,
      `_Generated from simulation path (${visitedNodes.length} nodes visited)_`,
      ``,
    ]

    // Group by level
    const nodesByLevel = new Map<number, GraphNode[]>()
    for (const id of visitedNodes) {
      const node = graph.graph.nodes.find((n) => n.node_id === id)
      if (!node) continue
      const level = 'level' in node ? (node as { level: number | null }).level ?? 0 : 0
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, [])
      nodesByLevel.get(level)!.push(node)
    }

    const levelNames: Record<number, string> = {
      1: 'Genre Promise',
      2: 'Core Constraints',
      3: 'Subgenre Pattern',
      4: 'World/Setting Rules',
      5: 'Scene Obligations',
    }

    for (const [level, nodes] of [...nodesByLevel.entries()].sort((a, b) => a[0] - b[0])) {
      const heading = levelNames[level] ?? (level === 0 ? 'General' : `Level ${level}`)
      lines.push(`## ${heading}`)
      lines.push('')

      for (const node of nodes) {
        lines.push(`### ${node.label}`)
        lines.push(`> ${node.definition}`)
        lines.push('')

        const entry = toArray(node.entry_conditions).filter((s) => s.trim())
        const exit = toArray(node.exit_conditions).filter((s) => s.trim())
        const failures = toArray(node.failure_modes).filter((s) => s.trim())
        const signals = toArray(node.signals_in_text).filter((s) => s.trim())

        if (entry.length > 0) {
          lines.push('**Must establish:**')
          for (const c of entry) lines.push(`- [ ] ${c}`)
          lines.push('')
        }
        if (exit.length > 0) {
          lines.push('**Must achieve before moving on:**')
          for (const c of exit) lines.push(`- [ ] ${c}`)
          lines.push('')
        }
        if (signals.length > 0) {
          lines.push('**Look for in text:**')
          for (const s of signals) lines.push(`- ${s}`)
          lines.push('')
        }
        if (failures.length > 0) {
          lines.push('**Avoid (failure modes):**')
          for (const f of failures) lines.push(`- \u26A0 ${f}`)
          lines.push('')
        }
      }
    }

    // Also include edge constraints along the path
    const visitedEdges = graph.graph.edges.filter(
      (e) => visitedSet.has(e.from) && visitedSet.has(e.to)
    )
    if (visitedEdges.length > 0) {
      lines.push('## Transition Requirements')
      lines.push('')
      for (const edge of visitedEdges) {
        const pre = toArray(edge.preconditions).filter((s) => s.trim())
        if (pre.length > 0) {
          lines.push(`**${edge.label}** (${edge.from} \u2192 ${edge.to}):`)
          for (const p of pre) lines.push(`- [ ] ${p}`)
          lines.push('')
        }
      }
    }

    const text = lines.join('\n')
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback: create a downloadable blob
      const blob = new Blob([text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `constraint-sheet-${graph.graph.id}.md`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [graph, visitedNodes])

  return (
    <button
      onClick={handleExport}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px 10px',
        fontSize: 12,
        textAlign: 'center',
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 4,
        color: '#8b5cf6',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'}
    >
      Export Constraint Sheet (Copy to Clipboard)
    </button>
  )
}
