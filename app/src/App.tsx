import { useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import { GraphSelectorPanel } from './components/GraphSelectorPanel.tsx'
import { useGraphStore } from './store/graphStore.ts'
import type { GraphNode, GraphEdge } from './types/graph.ts'
import type { DataManifest } from './types/graph.ts'

/** Parse the URL pathname into a graph type and directory slug. */
function parseRoute(pathname: string): { type: 'archetype' | 'genre'; dir: string } | null {
  const match = pathname.match(/^\/(archetype|genre)\/([a-z0-9_]+)$/)
  if (!match) return null
  return { type: match[1] as 'archetype' | 'genre', dir: match[2] }
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const manifestLoaded = useRef(false)

  const currentGraph = useGraphStore((s) => s.currentGraph)
  const graphId = useGraphStore((s) => s.graphId)
  const loading = useGraphStore((s) => s.loading)
  const error = useGraphStore((s) => s.error)
  const sidebarOpen = useGraphStore((s) => s.sidebarOpen)
  const toggleSidebar = useGraphStore((s) => s.toggleSidebar)
  const loadGraph = useGraphStore((s) => s.loadGraph)
  const setManifest = useGraphStore((s) => s.setManifest)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)

  // Load manifest once at startup
  useEffect(() => {
    if (manifestLoaded.current) return
    manifestLoaded.current = true
    fetch('../data/manifest.json')
      .then((res) => res.json())
      .then((data: DataManifest) => setManifest(data))
      .catch((err) => console.warn('Failed to load manifest:', err))
  }, [setManifest])

  // Sync URL → graph loading
  useEffect(() => {
    const parsed = parseRoute(location.pathname)
    if (parsed) {
      loadGraph(parsed.type, parsed.dir)
    }
  }, [location.pathname, loadGraph])

  // Navigate when selecting a graph from the sidebar
  const handleSelectGraph = useCallback(
    (type: 'archetype' | 'genre', dir: string) => {
      navigate(`/${type}/${dir}`)
    },
    [navigate],
  )

  const selectedNode = currentGraph
    ? currentGraph.graph.nodes.find((n) => n.node_id === selectedNodeId)
    : null
  const selectedEdge = currentGraph
    ? currentGraph.graph.edges.find((e) => e.edge_id === selectedEdgeId)
    : null
  const hasDetailPanel = !!(selectedNode || selectedEdge)

  // Mode indicator info
  const graphType = currentGraph?.graph.type
  const axisLabel = graphType === 'archetype' ? 'Time' : graphType === 'genre' ? 'Depth' : null

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
        height: 42,
      }}>
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          style={{
            padding: '4px 6px',
            fontSize: 16,
            color: 'var(--text-muted)',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          {sidebarOpen ? '\u2630' : '\u2630'}
        </button>

        {/* App title */}
        <span style={{
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}>
          Story Structure Explorer
        </span>

        {/* Divider */}
        <div style={{
          width: 1,
          height: 20,
          background: 'var(--border)',
          flexShrink: 0,
        }} />

        {/* Mode indicator */}
        {graphType && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: graphType === 'archetype' ? '#f59e0b' : '#8b5cf6',
              padding: '2px 8px',
              background: graphType === 'archetype' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
              borderRadius: 3,
            }}>
              {graphType === 'archetype' ? 'Archetype' : 'Genre'}
            </span>
            {axisLabel && (
              <span style={{
                fontSize: 11,
                color: 'var(--text-muted)',
              }}>
                Axis: {axisLabel} {graphType === 'archetype' ? '\u2192' : '\u2193'}
              </span>
            )}
          </div>
        )}

        {/* Graph stats */}
        {currentGraph && (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {currentGraph.graph.name} | {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Loading / error indicators */}
        {loading && (
          <span style={{
            fontSize: 11,
            color: 'var(--accent)',
            animation: 'pulse 1.5s infinite',
          }}>
            Loading...
          </span>
        )}
        {error && (
          <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>
        )}
      </header>

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Left sidebar */}
        <aside
          style={{
            width: sidebarOpen ? 260 : 0,
            minWidth: sidebarOpen ? 260 : 0,
            background: 'var(--bg-surface)',
            borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
            transition: 'width 0.2s ease, min-width 0.2s ease',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {sidebarOpen && (
            <GraphSelectorPanel onSelect={handleSelectGraph} />
          )}
        </aside>

        {/* Center: graph canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {currentGraph ? (
            <div
              key={graphId}
              style={{
                width: '100%',
                height: '100%',
                animation: 'fadeIn 0.25s ease',
              }}
            >
              <GraphCanvas graph={currentGraph} />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>{'\u29BB'}</div>
              <div style={{ fontSize: 14 }}>Select a graph from the sidebar to begin.</div>
              <div style={{ fontSize: 11 }}>15 archetypes and 27 genres available.</div>
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {hasDetailPanel && (
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
  const clearSelection = useGraphStore((s) => s.clearSelection)
  const toArr = (v: string | string[]) => (Array.isArray(v) ? v : [v])

  const content = node ? (
    <>
      <h3 style={{ fontSize: 14, marginBottom: 4 }}>{node.label}</h3>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {node.role} | {node.node_id}
      </div>
      <p style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>{node.definition}</p>
      <Section title="Entry Conditions" items={toArr(node.entry_conditions)} />
      <Section title="Exit Conditions" items={toArr(node.exit_conditions)} />
      <Section title="Failure Modes" items={toArr(node.failure_modes)} warn />
      <Section title="Signals in Text" items={toArr(node.signals_in_text)} />
      <Section title="Variants" items={toArr(node.typical_variants)} />
    </>
  ) : edge ? (
    <>
      <h3 style={{ fontSize: 14, marginBottom: 4 }}>{edge.label}</h3>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {edge.meaning} | {edge.edge_id}
      </div>
      <Section title="Preconditions" items={toArr(edge.preconditions)} />
      <Section title="Effects on Stakes" items={toArr(edge.effects_on_stakes)} />
      <Section title="Effects on Character" items={toArr(edge.effects_on_character)} />
      <Section title="Alternatives" items={toArr(edge.common_alternatives)} />
      <Section title="Anti-Patterns" items={toArr(edge.anti_patterns)} warn />
    </>
  ) : null

  if (!content) return null

  return (
    <aside style={{
      width: 320,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      padding: 16,
      overflowY: 'auto',
      flexShrink: 0,
      animation: 'slideInRight 0.2s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}>
        <div style={{ flex: 1 }}>{content}</div>
        <button
          onClick={clearSelection}
          aria-label="Close detail panel"
          style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            padding: '0 4px',
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          {'\u00D7'}
        </button>
      </div>
    </aside>
  )
}

function Section({ title, items, warn }: { title: string; items: string[]; warn?: boolean }) {
  if (!items.length || (items.length === 1 && !items[0])) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: warn ? '#f59e0b' : 'var(--text-muted)',
        marginBottom: 4,
      }}>
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
