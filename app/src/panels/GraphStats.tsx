/**
 * Graph Statistics Dashboard — node count by role/level, edge count by meaning,
 * branching factor analysis, depth/length metrics.
 */

import { useMemo } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'

interface GraphStatsProps {
  graph: NormalizedGraph
}

export function GraphStats({ graph }: GraphStatsProps) {
  const stats = useMemo(() => computeStats(graph), [graph])

  return (
    <div style={{
      padding: '12px 14px',
      overflowY: 'auto',
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        Graph Statistics
      </div>

      {/* Summary metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        marginBottom: 12,
      }}>
        <MetricCard label="Nodes" value={stats.nodeCount} />
        <MetricCard label="Edges" value={stats.edgeCount} />
        <MetricCard label="Density" value={stats.density.toFixed(2)} />
        <MetricCard label="Avg Branching" value={stats.avgBranching.toFixed(1)} />
        <MetricCard label="Max Depth" value={stats.maxDepth} />
        <MetricCard label="Longest Path" value={stats.longestPath} />
        <MetricCard label="Variants" value={stats.variantCount} />
        <MetricCard label="Terminals" value={stats.terminalCount} />
      </div>

      {/* Node roles breakdown */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}>
          Nodes by {graph.graph.type === 'genre' ? 'Level' : 'Role'}
        </div>
        {stats.roleBreakdown.map(({ label, count, pct }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 3,
            fontSize: 11,
          }}>
            <span style={{
              flex: 1,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
              {count}
            </span>
            <div style={{
              width: 60,
              height: 4,
              background: 'var(--bg-primary)',
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'var(--accent)',
                borderRadius: 2,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Edge meanings breakdown */}
      <div>
        <div style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: 6,
        }}>
          Edges by Meaning
        </div>
        {stats.meaningBreakdown.map(({ label, count, pct }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 3,
            fontSize: 11,
          }}>
            <span style={{
              flex: 1,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {label}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>
              {count}
            </span>
            <div style={{
              width: 60,
              height: 4,
              background: 'var(--bg-primary)',
              borderRadius: 2,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: '#8b5cf6',
                borderRadius: 2,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: '6px 8px',
      background: 'var(--bg-elevated)',
      borderRadius: 4,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

interface BreakdownItem { label: string; count: number; pct: number }

function computeStats(graph: NormalizedGraph) {
  const nodes = graph.graph.nodes
  const edges = graph.graph.edges
  const nodeCount = nodes.length
  const edgeCount = edges.length

  // Density
  const maxEdges = nodeCount * (nodeCount - 1)
  const density = maxEdges > 0 ? edgeCount / maxEdges : 0

  // Branching factor
  const outDegrees = nodes.map((n) => (graph.adjacency.get(n.node_id) ?? []).length)
  const avgBranching = nodeCount > 0
    ? outDegrees.reduce((s, d) => s + d, 0) / nodeCount
    : 0

  // Terminal nodes (no outgoing edges)
  const terminalCount = outDegrees.filter((d) => d === 0).length

  // Variant nodes
  const variantCount = nodes.filter((n) => {
    const match = n.node_id.match(/_N(\d{2})_/)
    if (!match) return false
    const num = parseInt(match[1], 10)
    return num >= 50 && num <= 79
  }).length

  // Max depth (longest path from any start node via BFS)
  const inDegrees = new Map<string, number>()
  for (const n of nodes) inDegrees.set(n.node_id, 0)
  for (const e of edges) inDegrees.set(e.to, (inDegrees.get(e.to) ?? 0) + 1)
  const starts = nodes.filter((n) => (inDegrees.get(n.node_id) ?? 0) === 0)

  let maxDepth = 0
  let longestPath = 0
  for (const start of starts) {
    const depths = new Map<string, number>()
    const queue = [{ id: start.node_id, depth: 0 }]
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) continue
      const { id, depth } = item
      if (depths.has(id) && (depths.get(id) ?? 0) >= depth) continue
      depths.set(id, depth)
      if (depth > maxDepth) maxDepth = depth
      const neighbors = graph.adjacency.get(id) ?? []
      for (const n of neighbors) {
        queue.push({ id: n, depth: depth + 1 })
      }
    }
    longestPath = Math.max(longestPath, depths.size)
  }

  // Role breakdown
  const roleCounts = new Map<string, number>()
  for (const n of nodes) {
    const key = graph.graph.type === 'genre' && 'level' in n
      ? `L${(n as { level: number | null }).level ?? '?'}: ${n.role}`
      : n.role
    roleCounts.set(key, (roleCounts.get(key) ?? 0) + 1)
  }
  const roleBreakdown: BreakdownItem[] = [...roleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: (count / nodeCount) * 100 }))

  // Meaning breakdown
  const meaningCounts = new Map<string, number>()
  for (const e of edges) {
    meaningCounts.set(e.meaning, (meaningCounts.get(e.meaning) ?? 0) + 1)
  }
  const meaningBreakdown: BreakdownItem[] = [...meaningCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: (count / edgeCount) * 100 }))

  return {
    nodeCount,
    edgeCount,
    density,
    avgBranching,
    maxDepth,
    longestPath,
    terminalCount,
    variantCount,
    roleBreakdown,
    meaningBreakdown,
  }
}
