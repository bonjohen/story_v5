import { useState, useCallback } from 'react'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import { GraphSelector } from './components/GraphSelector.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { parseGraphJson, normalizeGraph } from './graph-engine/index.ts'
import type { GraphNode, GraphEdge } from './types/graph.ts'

function App() {
  const [graphId, setGraphId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentGraph = useGraphStore((s) => s.currentGraph)
  const setCurrentGraph = useGraphStore((s) => s.setCurrentGraph)
  const setViewMode = useGraphStore((s) => s.setViewMode)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)

  const handleSelect = useCallback(
    async (type: 'archetype' | 'genre', dir: string) => {
      const id = `${type}::${dir}`
      setGraphId(id)
      setLoading(true)
      setError(null)

      try {
        const basePath =
          type === 'archetype' ? `archetypes/${dir}` : `genres/${dir}`
        const url = `../data/${basePath}/graph.json`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to load: ${response.status}`)
        const raw = await response.json()
        const graph = parseGraphJson(raw)
        const normalized = normalizeGraph(graph)
        setCurrentGraph(normalized)
        setViewMode(type)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [setCurrentGraph, setViewMode],
  )

  const selectedNode = currentGraph
    ? currentGraph.graph.nodes.find((n) => n.node_id === selectedNodeId)
    : null

  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)
  const selectedEdge = currentGraph
    ? currentGraph.graph.edges.find((e) => e.edge_id === selectedEdgeId)
    : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}
        >
          Story Structure Explorer
        </span>
        <GraphSelector currentId={graphId} onSelect={handleSelect} />
        {currentGraph && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {currentGraph.graph.type === 'archetype' ? 'Archetype' : 'Genre'} |{' '}
            {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
          </span>
        )}
        {loading && <span style={{ color: 'var(--accent)', fontSize: 12 }}>Loading...</span>}
        {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
      </header>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Graph canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          {currentGraph ? (
            <GraphCanvas graph={currentGraph} />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
              }}
            >
              Select a graph from the dropdown to begin.
            </div>
          )}
        </div>

        {/* Detail panel (right side) */}
        {(selectedNode || selectedEdge) && (
          <DetailPanel node={selectedNode} edge={selectedEdge} />
        )}
      </div>
    </div>
  )
}

function DetailPanel({
  node,
  edge,
}: {
  node?: GraphNode | null
  edge?: GraphEdge | null
}) {
  const toArr = (v: string | string[]) => (Array.isArray(v) ? v : [v])

  if (node) {
    return (
      <aside
        style={{
          width: 320,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          padding: 16,
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>{node.label}</h3>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          {node.role} | {node.node_id}
        </div>
        <p style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>{node.definition}</p>

        <Section title="Entry Conditions" items={toArr(node.entry_conditions)} />
        <Section title="Exit Conditions" items={toArr(node.exit_conditions)} />
        <Section title="Failure Modes" items={toArr(node.failure_modes)} />
        <Section title="Signals in Text" items={toArr(node.signals_in_text)} />
        <Section title="Variants" items={toArr(node.typical_variants)} />
      </aside>
    )
  }

  if (edge) {
    return (
      <aside
        style={{
          width: 320,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          padding: 16,
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <h3 style={{ fontSize: 14, marginBottom: 4 }}>{edge.label}</h3>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          {edge.meaning} | {edge.edge_id}
        </div>

        <Section title="Preconditions" items={toArr(edge.preconditions)} />
        <Section title="Effects on Stakes" items={toArr(edge.effects_on_stakes)} />
        <Section title="Effects on Character" items={toArr(edge.effects_on_character)} />
        <Section title="Alternatives" items={toArr(edge.common_alternatives)} />
        <Section title="Anti-Patterns" items={toArr(edge.anti_patterns)} />
      </aside>
    )
  }

  return null
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length || (items.length === 1 && !items[0])) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.6 }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
