import { useEffect, useCallback, useRef, useState, useMemo, memo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import { GraphSelectorPanel } from './components/GraphSelectorPanel.tsx'
import { VariantToggle } from './components/VariantToggle.tsx'
import { computeFailureModeNodes } from './graph-engine/index.ts'
import { DetailPanel, EdgeTooltip } from './panels/DetailPanel.tsx'
import { SimulationPanel } from './panels/SimulationPanel.tsx'
import { ExampleOverlay } from './panels/ExampleOverlay.tsx'
import { GraphStats } from './panels/GraphStats.tsx'
import { CrossIndexPanel } from './panels/CrossIndex.tsx'
import { GraphSearch } from './components/GraphSearch.tsx'
import { useKeyboardNav } from './hooks/useKeyboardNav.ts'
import { useTraceNavigation } from './hooks/useTraceNavigation.ts'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { ExportPanel } from './panels/ExportPanel.tsx'
import { GenerationPanel } from './generation/panels/GenerationPanel.tsx'
import { ContractPanel } from './generation/panels/ContractPanel.tsx'
import { PlanPanel } from './generation/panels/PlanPanel.tsx'
import { TracePanel } from './generation/panels/TracePanel.tsx'
import { CompliancePanel } from './generation/panels/CompliancePanel.tsx'
import type { CyCore, GenerationOverlay } from './render/GraphCanvas.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { useSimulationStore } from './store/simulationStore.ts'
import { useSettingsStore } from './store/settingsStore.ts'
import { useGenerationStore } from './generation/store/generationStore.ts'
import type { GraphEdge, DataManifest } from './types/graph.ts'

// Layout constants
const TOOLBAR_HEIGHT = 42
const SIDEBAR_WIDTH = 260
const DETAIL_PANEL_WIDTH = 320

/** Parse the URL pathname into a graph type and directory slug. */
function parseRoute(pathname: string): { type: 'archetype' | 'genre'; dir: string } | null {
  const match = pathname.match(/^\/(archetype|genre)\/([a-z0-9_]+)$/)
  if (!match) return null
  return { type: match[1] as 'archetype' | 'genre', dir: match[2] }
}

export default function App() {
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

  // Settings
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  // Generation state
  const genStatus = useGenerationStore((s) => s.status)
  const genRunning = useGenerationStore((s) => s.running)
  const genContract = useGenerationStore((s) => s.contract)
  const genPlan = useGenerationStore((s) => s.plan)
  const genTrace = useGenerationStore((s) => s.trace)
  const genValidation = useGenerationStore((s) => s.validation)
  // Edge hover tooltip state
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: GraphEdge; x: number; y: number } | null>(null)
  // Variant toggle state
  const [activeVariant, setActiveVariant] = useState<string | null>(null)
  const [showFailureModes, setShowFailureModes] = useState(false)
  // Bottom panel toggle (simulation)
  const [showSimulation, setShowSimulation] = useState(false)
  // Example mode
  const [exampleMappedNodes, setExampleMappedNodes] = useState<string[]>([])
  // Right panel mode
  const [rightPanel, setRightPanel] = useState<'detail' | 'stats' | 'crossindex' | null>(null)
  // Export panel
  const [showExport, setShowExport] = useState(false)
  // Generation panel
  const [showGeneration, setShowGeneration] = useState(false)
  const [genTab, setGenTab] = useState<'run' | 'contract' | 'plan' | 'trace' | 'compliance'>('run')
  // Generation overlay nodes for highlighting
  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])
  // Manifest error
  const [manifestError, setManifestError] = useState<string | null>(null)
  const cyInstanceRef = useRef<CyCore | null>(null)

  const handleCyReady = useCallback((cy: CyCore) => {
    cyInstanceRef.current = cy
  }, [])

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
    fetch('../data/cross_references/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`)
        return res.json()
      })
      .then((data: DataManifest) => setManifest(data))
      .catch((err) => {
        console.warn('Failed to load manifest:', err)
        setManifestError(err instanceof Error ? err.message : 'Failed to load manifest')
      })
  }, [setManifest])

  // Sync URL -> graph loading
  useEffect(() => {
    const parsed = parseRoute(location.pathname)
    if (parsed) {
      void loadGraph(parsed.type, parsed.dir)
    }
  }, [location.pathname, loadGraph])

  // Reset simulation and variant state when graph changes
  useEffect(() => {
    resetSimulation()
    setActiveVariant(null) // eslint-disable-line react-hooks/set-state-in-effect -- reset on graph change
    setShowFailureModes(false)
  }, [graphId, resetSimulation])

  // Navigate when selecting a graph from the sidebar
  const handleSelectGraph = useCallback(
    (type: 'archetype' | 'genre', dir: string) => {
      void navigate(`/${type}/${dir}`)
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

  // Trace navigation (BFS forward/backward)
  const { traceDirection, handleTraceForward, handleTraceBackward, handleClearTrace } =
    useTraceNavigation(currentGraph, selectedNodeId, setHighlightedPath)

  // Keyboard navigation
  useKeyboardNav(currentGraph, selectedNodeId, selectNode, clearSelection, handleClearTrace)

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

  // Generation overlay
  const generationOverlay = useMemo<GenerationOverlay | undefined>(() => {
    if (!showGeneration || genStatus === 'IDLE') return undefined
    if (!genPlan && !genTrace) return undefined

    const coveredNodes: string[] = []
    const antiPatternNodes: string[] = []
    const activeSceneNodes: string[] = genHighlightNodes

    // Collect covered nodes from plan scenes
    if (genPlan) {
      for (const scene of genPlan.scenes) {
        coveredNodes.push(scene.archetype_trace.node_id)
        for (const ob of scene.genre_obligations) {
          coveredNodes.push(ob.node_id)
        }
      }
    }

    // Collect anti-pattern nodes from contract
    if (genContract) {
      antiPatternNodes.push(...genContract.genre.anti_patterns)
    }

    return { coveredNodes, antiPatternNodes, activeSceneNodes }
  }, [showGeneration, genStatus, genPlan, genTrace, genContract, genHighlightNodes])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header role="banner" aria-label="Application toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '6px 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
        height: TOOLBAR_HEIGHT,
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
              aria-label="Toggle graph statistics panel"
              aria-pressed={rightPanel === 'stats'}
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
              aria-label="Toggle cross-index panel"
              aria-pressed={rightPanel === 'crossindex'}
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
            aria-label="Toggle simulation panel"
            aria-pressed={showSimulation || simActive}
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

        {/* Generation toggle */}
        <button
          onClick={() => setShowGeneration((v) => !v)}
          aria-label="Toggle generation panel"
          aria-pressed={showGeneration}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid',
            borderColor: showGeneration || genRunning ? '#22c55e' : 'var(--border)',
            background: showGeneration ? 'rgba(34,197,94,0.15)' : 'transparent',
            color: showGeneration || genRunning ? '#22c55e' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {genRunning ? 'Generating...' : 'Generate'}
        </button>

        {/* Global search */}
        {currentGraph && (
          <GraphSearch graph={currentGraph} onSelect={handleSearchSelect} />
        )}

        {/* Export button */}
        {currentGraph && (
          <button
            onClick={() => setShowExport((v) => !v)}
            aria-label="Export graph"
            title="Export graph"
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: showExport ? 'var(--accent)' : 'var(--border)',
              background: showExport ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: showExport ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Export
          </button>
        )}

        {/* Settings gear */}
        <button
          onClick={toggleSettings}
          aria-label="Settings"
          title="Settings"
          style={{
            fontSize: 16,
            padding: '4px 6px',
            color: settingsOpen ? 'var(--accent)' : 'var(--text-muted)',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => { if (!settingsOpen) e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {'\u2699'}
        </button>

        {/* Loading / error indicators */}
        {loading && (
          <span style={{ fontSize: 11, color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>
            Loading...
          </span>
        )}
        {(error || manifestError) && (
          <span style={{ fontSize: 11, color: '#ef4444' }}>{error || manifestError}</span>
        )}
      </header>

      {/* Settings panel overlay */}
      {settingsOpen && <SettingsPanel />}

      {/* Export panel overlay */}
      {showExport && currentGraph && (
        <ExportPanel
          graph={currentGraph}
          cyRef={cyInstanceRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Generation panel (left overlay when active) */}
      {showGeneration && (
        <div style={{
          position: 'fixed',
          top: TOOLBAR_HEIGHT,
          left: 0,
          bottom: 0,
          width: 340,
          zIndex: 20,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 16px rgba(0,0,0,0.2)',
        }}>
          {/* Generation sub-tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <GenTab label="Run" active={genTab === 'run'} onClick={() => setGenTab('run')} />
            <GenTab label="Contract" active={genTab === 'contract'} onClick={() => setGenTab('contract')} badge={!!genContract} />
            <GenTab label="Plan" active={genTab === 'plan'} onClick={() => setGenTab('plan')} badge={!!genPlan} />
            <GenTab label="Trace" active={genTab === 'trace'} onClick={() => setGenTab('trace')} badge={!!genTrace} />
            <GenTab label="Valid" active={genTab === 'compliance'} onClick={() => setGenTab('compliance')} badge={!!genValidation} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {genTab === 'run' && (
              <GenerationPanel onClose={() => setShowGeneration(false)} />
            )}
            {genTab === 'contract' && (
              <ContractPanel onHighlightNodes={setGenHighlightNodes} />
            )}
            {genTab === 'plan' && (
              <PlanPanel onHighlightNodes={setGenHighlightNodes} />
            )}
            {genTab === 'trace' && (
              <TracePanel onHighlightNodes={setGenHighlightNodes} />
            )}
            {genTab === 'compliance' && (
              <CompliancePanel />
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <aside aria-label="Graph selector sidebar" style={{
          width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          minWidth: sidebarOpen ? SIDEBAR_WIDTH : 0,
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
                  generationOverlay={generationOverlay}
                  onCyReady={handleCyReady}
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
          <aside aria-label="Detail and analysis panel" style={{
            width: DETAIL_PANEL_WIDTH,
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

      {/* Screen-reader announcements */}
      <div aria-live="polite" className="sr-only" style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
      }}>
        {selectedNode && `Selected node: ${selectedNode.label}, role: ${selectedNode.role}, ${(currentGraph?.adjacency.get(selectedNode.node_id) ?? []).length} outgoing connections`}
        {selectedEdge && `Selected edge: ${selectedEdge.label}, meaning: ${selectedEdge.meaning}, from ${selectedEdge.from} to ${selectedEdge.to}`}
        {hoveredEdge && !selectedEdge && `Edge: ${hoveredEdge.edge.label}, meaning: ${hoveredEdge.edge.meaning}`}
      </div>
    </div>
  )
}

const PanelTab = memo(function PanelTab({ label, active, onClick, badge }: {
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
})

const GenTab = memo(function GenTab({ label, active, onClick, badge }: {
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
        fontSize: 9,
        fontWeight: active ? 600 : 400,
        color: active ? '#22c55e' : 'var(--text-muted)',
        borderBottom: active ? '2px solid #22c55e' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        position: 'relative',
      }}
    >
      {label}
      {badge && !active && (
        <span style={{
          position: 'absolute',
          top: 4,
          right: 4,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#22c55e',
        }} />
      )}
    </button>
  )
})
