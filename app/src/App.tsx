import { useEffect, useCallback, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import { GraphSelectorPanel } from './components/GraphSelectorPanel.tsx'
import { VariantToggle, computeFailureModeNodes } from './components/VariantToggle.tsx'
import { DetailPanel, EdgeTooltip } from './panels/DetailPanel.tsx'
import { SimulationPanel } from './panels/SimulationPanel.tsx'
import { ExampleOverlay } from './panels/ExampleOverlay.tsx'
import { GraphStats } from './panels/GraphStats.tsx'
import { CrossIndexPanel } from './panels/CrossIndex.tsx'
import { GraphSearch } from './components/GraphSearch.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { useSimulationStore } from './store/simulationStore.ts'
import type { GraphEdge } from './types/graph.ts'
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
  const selectNode = useGraphStore((s) => s.selectNode)
  const highlightedPath = useGraphStore((s) => s.highlightedPath)
  const setHighlightedPath = useGraphStore((s) => s.setHighlightedPath)
  const clearSelection = useGraphStore((s) => s.clearSelection)

  // Simulation state
  const simActive = useSimulationStore((s) => s.active)
  const simCurrentNodeId = useSimulationStore((s) => s.currentNodeId)
  const simVisitedNodes = useSimulationStore((s) => s.visitedNodes)
  const simAvailableEdges = useSimulationStore((s) => s.availableEdges)
  const resetSimulation = useSimulationStore((s) => s.resetSimulation)

  // Edge hover tooltip state
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: GraphEdge; x: number; y: number } | null>(null)
  // Trace direction state
  const [traceDirection, setTraceDirection] = useState<'forward' | 'backward' | null>(null)
  // Variant toggle state
  const [activeVariant, setActiveVariant] = useState<string | null>(null)
  const [showFailureModes, setShowFailureModes] = useState(false)
  // Bottom panel toggle (simulation)
  const [showSimulation, setShowSimulation] = useState(false)
  // Example mode
  const [exampleMappedNodes, setExampleMappedNodes] = useState<string[]>([])
  // Right panel mode
  const [rightPanel, setRightPanel] = useState<'detail' | 'stats' | 'crossindex' | null>(null)

  const handleExampleHighlight = useCallback((nodeIds: string[]) => {
    setExampleMappedNodes(nodeIds)
  }, [])

  const handleExampleClearHighlight = useCallback(() => {
    setExampleMappedNodes([])
  }, [])

  // Load manifest once at startup
  useEffect(() => {
    if (manifestLoaded.current) return
    manifestLoaded.current = true
    fetch('../data/manifest.json')
      .then((res) => res.json())
      .then((data: DataManifest) => setManifest(data))
      .catch((err) => console.warn('Failed to load manifest:', err))
  }, [setManifest])

  // Sync URL -> graph loading
  useEffect(() => {
    const parsed = parseRoute(location.pathname)
    if (parsed) {
      loadGraph(parsed.type, parsed.dir)
    }
  }, [location.pathname, loadGraph])

  // Reset simulation and variant state when graph changes
  useEffect(() => {
    resetSimulation()
    setActiveVariant(null)
    setShowFailureModes(false)
  }, [graphId, resetSimulation])

  // Navigate when selecting a graph from the sidebar
  const handleSelectGraph = useCallback(
    (type: 'archetype' | 'genre', dir: string) => {
      navigate(`/${type}/${dir}`)
    },
    [navigate],
  )

  // Edge hover handlers (called from GraphCanvas)
  const handleEdgeHover = useCallback(
    (edgeId: string, x: number, y: number) => {
      if (!currentGraph) return
      const edge = currentGraph.graph.edges.find((e) => e.edge_id === edgeId)
      if (edge) setHoveredEdge({ edge, x, y })
    },
    [currentGraph],
  )

  const handleEdgeHoverOut = useCallback(() => {
    setHoveredEdge(null)
  }, [])

  // Trace forward: BFS from selected node following edges forward
  const handleTraceForward = useCallback(() => {
    if (!currentGraph || !selectedNodeId) return
    const visited = new Set<string>()
    const queue = [selectedNodeId]
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      const neighbors = currentGraph.adjacency.get(nodeId) ?? []
      for (const n of neighbors) {
        if (!visited.has(n)) queue.push(n)
      }
    }
    setHighlightedPath(Array.from(visited))
    setTraceDirection('forward')
  }, [currentGraph, selectedNodeId, setHighlightedPath])

  // Trace backward: BFS from selected node following edges backward
  const handleTraceBackward = useCallback(() => {
    if (!currentGraph || !selectedNodeId) return
    const visited = new Set<string>()
    const queue = [selectedNodeId]
    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      const predecessors = currentGraph.reverseAdjacency.get(nodeId) ?? []
      for (const n of predecessors) {
        if (!visited.has(n)) queue.push(n)
      }
    }
    setHighlightedPath(Array.from(visited))
    setTraceDirection('backward')
  }, [currentGraph, selectedNodeId, setHighlightedPath])

  const handleClearTrace = useCallback(() => {
    setHighlightedPath([])
    setTraceDirection(null)
  }, [setHighlightedPath])

  // Clear trace when selection changes
  useEffect(() => {
    setTraceDirection(null)
  }, [selectedNodeId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentGraph) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Escape') {
        clearSelection()
        handleClearTrace()
        return
      }

      if (!selectedNodeId) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const neighbors = currentGraph.adjacency.get(selectedNodeId) ?? []
        if (neighbors.length > 0) selectNode(neighbors[0])
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const predecessors = currentGraph.reverseAdjacency.get(selectedNodeId) ?? []
        if (predecessors.length > 0) selectNode(predecessors[0])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGraph, selectedNodeId, selectNode, clearSelection, handleClearTrace])

  // Navigate to a node from search
  const handleSearchSelect = useCallback((nodeId: string) => {
    selectNode(nodeId)
  }, [selectNode])

  const selectedNode = currentGraph
    ? currentGraph.graph.nodes.find((n) => n.node_id === selectedNodeId)
    : null
  const selectedEdge = currentGraph
    ? currentGraph.graph.edges.find((e) => e.edge_id === selectedEdgeId)
    : null
  const hasDetailPanel = !!(selectedNode || selectedEdge)

  // Failure mode nodes
  const failureModeNodes = currentGraph && showFailureModes
    ? computeFailureModeNodes(currentGraph)
    : []

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
          {'\u2630'}
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

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Mode indicator */}
        {graphType && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Axis: {axisLabel} {graphType === 'archetype' ? '\u2192' : '\u2193'}
              </span>
            )}
          </div>
        )}

        {currentGraph && (
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            {currentGraph.graph.name} | {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Analytical tools */}
        {currentGraph && (
          <>
            <button
              onClick={() => setRightPanel(rightPanel === 'stats' ? null : 'stats')}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: rightPanel === 'stats' ? 'var(--accent)' : 'var(--border)',
                background: rightPanel === 'stats' ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: rightPanel === 'stats' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Stats
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === 'crossindex' ? null : 'crossindex')}
              style={{
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: rightPanel === 'crossindex' ? 'var(--accent)' : 'var(--border)',
                background: rightPanel === 'crossindex' ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: rightPanel === 'crossindex' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              X-Index
            </button>
          </>
        )}

        {/* Simulation toggle */}
        {currentGraph && (
          <button
            onClick={() => setShowSimulation((v) => !v)}
            style={{
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: showSimulation || simActive ? 'var(--accent)' : 'var(--border)',
              background: showSimulation || simActive ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: showSimulation || simActive ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {simActive ? 'Simulating...' : 'Simulate'}
          </button>
        )}

        {/* Global search */}
        {currentGraph && (
          <GraphSearch graph={currentGraph} onSelect={handleSearchSelect} />
        )}

        {/* Loading / error indicators */}
        {loading && (
          <span style={{ fontSize: 11, color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>
            Loading...
          </span>
        )}
        {error && (
          <span style={{ fontSize: 11, color: '#ef4444' }}>{error}</span>
        )}
      </header>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <aside style={{
          width: sidebarOpen ? 260 : 0,
          minWidth: sidebarOpen ? 260 : 0,
          background: 'var(--bg-surface)',
          borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {sidebarOpen && (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <GraphSelectorPanel onSelect={handleSelectGraph} />
              </div>
              {/* Variant toggle (below graph selector) */}
              {currentGraph && (
                <VariantToggle
                  graph={currentGraph}
                  activeVariant={activeVariant}
                  onToggle={setActiveVariant}
                  showFailureModes={showFailureModes}
                  onToggleFailureModes={() => setShowFailureModes((v) => !v)}
                />
              )}
              {/* Example overlay (below variant toggle) */}
              {currentGraph && (
                <ExampleOverlay
                  graph={currentGraph}
                  onHighlightNodes={handleExampleHighlight}
                  onClearHighlight={handleExampleClearHighlight}
                />
              )}
            </>
          )}
        </aside>

        {/* Center: graph canvas + simulation panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentGraph ? (
              <div
                key={graphId}
                style={{ width: '100%', height: '100%', animation: 'fadeIn 0.25s ease' }}
              >
                <GraphCanvas
                  graph={currentGraph}
                  highlightedPath={highlightedPath}
                  onEdgeHover={handleEdgeHover}
                  onEdgeHoverOut={handleEdgeHoverOut}
                  simulationState={simActive ? {
                    currentNodeId: simCurrentNodeId,
                    visitedNodes: simVisitedNodes,
                    availableEdges: simAvailableEdges,
                  } : undefined}
                  failureModeNodes={failureModeNodes}
                  activeVariant={activeVariant}
                  exampleMappedNodes={exampleMappedNodes.length > 0 ? exampleMappedNodes : undefined}
                />
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

          {/* Simulation panel (bottom of canvas area) */}
          {currentGraph && (showSimulation || simActive) && (
            <div style={{
              maxHeight: 280,
              overflowY: 'auto',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <SimulationPanel graph={currentGraph} />
            </div>
          )}
        </div>

        {/* Right panel (tabbed: Detail / Stats / Cross-Index) */}
        {(hasDetailPanel || rightPanel) && currentGraph && (
          <aside style={{
            width: 320,
            background: 'var(--bg-surface)',
            borderLeft: '1px solid var(--border)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <PanelTab
                label="Detail"
                active={!rightPanel || rightPanel === 'detail'}
                onClick={() => setRightPanel(hasDetailPanel ? 'detail' : null)}
                badge={hasDetailPanel}
              />
              <PanelTab
                label="Stats"
                active={rightPanel === 'stats'}
                onClick={() => setRightPanel(rightPanel === 'stats' ? null : 'stats')}
              />
              <PanelTab
                label="X-Index"
                active={rightPanel === 'crossindex'}
                onClick={() => setRightPanel(rightPanel === 'crossindex' ? null : 'crossindex')}
              />
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(!rightPanel || rightPanel === 'detail') && hasDetailPanel && (
                <DetailPanel
                  node={selectedNode}
                  edge={selectedEdge}
                  onTraceForward={handleTraceForward}
                  onTraceBackward={handleTraceBackward}
                  onClearTrace={handleClearTrace}
                  traceActive={traceDirection}
                  graph={currentGraph}
                />
              )}
              {rightPanel === 'stats' && <GraphStats graph={currentGraph} />}
              {rightPanel === 'crossindex' && <CrossIndexPanel graph={currentGraph} />}
            </div>
          </aside>
        )}
      </div>

      {/* Edge hover tooltip (rendered at fixed position) */}
      {hoveredEdge && (
        <EdgeTooltip edge={hoveredEdge.edge} position={{ x: hoveredEdge.x, y: hoveredEdge.y }} />
      )}
    </div>
  )
}

function PanelTab({ label, active, onClick, badge }: {
  label: string
  active: boolean
  onClick: () => void
  badge?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 4px',
        fontSize: 10,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        position: 'relative',
      }}
    >
      {label}
      {badge && !active && (
        <span style={{
          position: 'absolute',
          top: 4,
          right: 8,
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'var(--accent)',
        }} />
      )}
    </button>
  )
}

export default App
