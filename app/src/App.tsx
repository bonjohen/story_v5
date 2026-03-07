import { useEffect, useCallback, useRef, useState, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import type { NormalizedGraph } from './graph-engine/index.ts'
import { DetailPanel } from './panels/DetailPanel.tsx'
import { GraphStats } from './panels/GraphStats.tsx'
import { CrossIndexPanel } from './panels/CrossIndex.tsx'
import { PairingPanel } from './panels/PairingPanel.tsx'
import { ElementsPanel } from './panels/ElementsPanel.tsx'
import { TimelinePanel } from './panels/TimelinePanel.tsx'
import { CharacterArcPanel } from './panels/CharacterArcPanel.tsx'
import { GraphSearch } from './components/GraphSearch.tsx'
import { GlobalSearch } from './components/GlobalSearch.tsx'
import { useKeyboardNav } from './hooks/useKeyboardNav.ts'
import { useTraceNavigation } from './hooks/useTraceNavigation.ts'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { ExportPanel } from './panels/ExportPanel.tsx'
import { Disclosure } from './components/Disclosure.tsx'
import { AppShellBar } from './components/AppShell.tsx'
import { useUIStore } from './store/uiStore.ts'
import { GenerationPanel } from './generation/panels/GenerationPanel.tsx'
import { ContractPanel } from './generation/panels/ContractPanel.tsx'
import { PlanPanel } from './generation/panels/PlanPanel.tsx'
import { TracePanel } from './generation/panels/TracePanel.tsx'
import { CompliancePanel } from './generation/panels/CompliancePanel.tsx'
import { StoryPanel } from './generation/panels/StoryPanel.tsx'
import { TemplatesPanel } from './generation/panels/TemplatesPanel.tsx'
import type { CyCore, GenerationOverlay } from './render/GraphCanvas.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { useSettingsStore } from './store/settingsStore.ts'
import { useGenerationStore } from './generation/store/generationStore.ts'
import { useDbInit } from './db/useDbInit.ts'
import type { DataManifest } from './types/graph.ts'

// Layout constants
const INFO_PANEL_DEFAULT_HEIGHT = 260
const INFO_PANEL_MIN_HEIGHT = 80
const INFO_PANEL_MAX_HEIGHT = 600
const GEN_PANEL_WIDTH = 340

/** Parse the URL pathname into a graph type and directory slug. */
function parseRoute(pathname: string): { type: 'archetype' | 'genre'; dir: string } | null {
  const match = pathname.match(/^\/(archetype|genre)\/([a-z0-9_]+)$/)
  if (!match) return null
  return { type: match[1] as 'archetype' | 'genre', dir: match[2] }
}


export default function App() {
  const location = useLocation()
  const manifestLoaded = useRef(false)

  // Store state
  const archetypeGraph = useGraphStore((s) => s.archetypeGraph)
  const archetypeDir = useGraphStore((s) => s.archetypeDir)
  const genreGraph = useGraphStore((s) => s.genreGraph)
  const genreDir = useGraphStore((s) => s.genreDir)
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const viewMode = useGraphStore((s) => s.viewMode)
  const loading = useGraphStore((s) => s.loading)
  const error = useGraphStore((s) => s.error)
  const activateGraph = useGraphStore((s) => s.activateGraph)
  const loadGraph = useGraphStore((s) => s.loadGraph)
  const setManifest = useGraphStore((s) => s.setManifest)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)
  const selectNode = useGraphStore((s) => s.selectNode)
  const highlightedPath = useGraphStore((s) => s.highlightedPath)
  const setHighlightedPath = useGraphStore((s) => s.setHighlightedPath)
  const clearSelection = useGraphStore((s) => s.clearSelection)


  // Settings
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  // UI preferences
  const genPanelOpen = useUIStore((s) => s.genPanelOpen)
  const toggleGenPanel = useUIStore((s) => s.toggleGenPanel)
  const splitView = useUIStore((s) => s.splitView)
  const toggleSplitView = useUIStore((s) => s.toggleSplitView)

  // Generation state
  const genStatus = useGenerationStore((s) => s.status)
  const genContract = useGenerationStore((s) => s.contract)
  const genPlan = useGenerationStore((s) => s.plan)
  const genTrace = useGenerationStore((s) => s.trace)
  const genValidation = useGenerationStore((s) => s.validation)
  const genSceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const genBackbone = useGenerationStore((s) => s.backbone)
  const genChapterManifest = useGenerationStore((s) => s.chapterManifest)
  const genTemplatePack = useGenerationStore((s) => s.templatePack)

  // Database init
  const dbStatus = useDbInit()

  // UI state

  const [showExport, setShowExport] = useState(false)
  const [genTab, setGenTab] = useState<'run' | 'contract' | 'plan' | 'trace' | 'compliance' | 'story'>('run')
  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [infoPanelOpen, setInfoPanelOpen] = useState(true)
  const [infoPanelHeight, setInfoPanelHeight] = useState(INFO_PANEL_DEFAULT_HEIGHT)

  const cyArchRef = useRef<CyCore | null>(null)
  const cyGenreRef = useRef<CyCore | null>(null)

  const handleArchCyReady = useCallback((cy: CyCore) => { cyArchRef.current = cy }, [])
  const handleGenreCyReady = useCallback((cy: CyCore) => { cyGenreRef.current = cy }, [])

  // Draggable separator between info panel and graph area
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const [draggingSep, setDraggingSep] = useState(false)
  const infoPanelHeightRef = useRef(INFO_PANEL_DEFAULT_HEIGHT)
  infoPanelHeightRef.current = infoPanelHeight

  const resizeCytoscape = useCallback(() => {
    cyArchRef.current?.resize()
    cyArchRef.current?.fit(undefined, 30)
    cyGenreRef.current?.resize()
    cyGenreRef.current?.fit(undefined, 30)
  }, [])

  const handleSepPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startHeight: infoPanelHeightRef.current }
    setDraggingSep(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSepPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const delta = e.clientY - dragRef.current.startY
    const next = Math.max(INFO_PANEL_MIN_HEIGHT, Math.min(INFO_PANEL_MAX_HEIGHT, dragRef.current.startHeight + delta))
    setInfoPanelHeight(next)
    // Debounced resize during drag
    if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = setTimeout(() => {
      cyArchRef.current?.resize()
      cyGenreRef.current?.resize()
    }, 100)
  }, [])

  const handleSepPointerUp = useCallback(() => {
    dragRef.current = null
    setDraggingSep(false)
    resizeCytoscape()
  }, [resizeCytoscape])

  // Resize Cytoscape when info panel is collapsed/expanded
  useEffect(() => {
    const timer = setTimeout(resizeCytoscape, 250)
    return () => clearTimeout(timer)
  }, [infoPanelOpen, resizeCytoscape])

  // Auto-switch to Story tab once when draft generation completes
  const autoSwitchedToStory = useRef(false)
  useEffect(() => {
    if (genStatus === 'COMPLETED' && genSceneDrafts.size > 0 && !autoSwitchedToStory.current) {
      autoSwitchedToStory.current = true
      setGenTab('story')
    }
    if (genStatus === 'IDLE') {
      autoSwitchedToStory.current = false
    }
  }, [genStatus, genSceneDrafts.size])

  // Load manifest once at startup
  useEffect(() => {
    if (manifestLoaded.current) return
    manifestLoaded.current = true
    fetch(`${import.meta.env.BASE_URL}data/cross_references/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest load failed: ${res.status}`)
        return res.json()
      })
      .then((data: DataManifest) => {
        setManifest(data)
        // URL sync effect handles initial graph loading
      })
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

  // Auto-select first node when archetype graph loads
  const prevArchDir = useRef<string | null>(null)
  useEffect(() => {
    if (archetypeGraph && archetypeDir && archetypeDir !== prevArchDir.current) {
      prevArchDir.current = archetypeDir
      if (archetypeGraph.graph.nodes.length > 0) {
        selectNode(archetypeGraph.graph.nodes[0].node_id)
      }
    }
  }, [archetypeGraph, archetypeDir, selectNode])

  const handleArchFocus = useCallback(() => {
    activateGraph('archetype')
  }, [activateGraph])

  const handleGenreFocus = useCallback(() => {
    activateGraph('genre')
  }, [activateGraph])

  // Trace navigation
  const { traceDirection, handleTraceForward, handleTraceBackward, handleClearTrace } =
    useTraceNavigation(currentGraph, selectedNodeId, setHighlightedPath)

  // Keyboard navigation
  useKeyboardNav(currentGraph, selectedNodeId, selectNode, clearSelection, handleClearTrace)

  const handleSearchSelect = useCallback((nodeId: string) => {
    selectNode(nodeId)
  }, [selectNode])

  // Selected node/edge from the active graph
  const selectedNode = currentGraph
    ? currentGraph.graph.nodes.find((n) => n.node_id === selectedNodeId)
    : null
  const selectedEdge = currentGraph
    ? currentGraph.graph.edges.find((e) => e.edge_id === selectedEdgeId)
    : null
  const hasDetailContent = !!(selectedNode || selectedEdge)

  // Auto-open info panel when node/edge is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setInfoPanelOpen(true)
    }
  }, [selectedNodeId, selectedEdgeId])



  // Generation overlay
  const generationOverlay = useMemo<GenerationOverlay | undefined>(() => {
    if (genStatus === 'IDLE') return undefined
    if (!genPlan && !genTrace) return undefined

    const coveredNodes: string[] = []
    const antiPatternNodes: string[] = []
    const activeSceneNodes: string[] = genHighlightNodes

    if (genPlan) {
      for (const scene of genPlan.scenes) {
        coveredNodes.push(scene.archetype_trace.node_id)
        for (const ob of scene.genre_obligations) {
          coveredNodes.push(ob.node_id)
        }
      }
    }
    if (genContract) {
      antiPatternNodes.push(...genContract.genre.anti_patterns)
    }

    return { coveredNodes, antiPatternNodes, activeSceneNodes }
  }, [genStatus, genPlan, genTrace, genContract, genHighlightNodes])

  const activeCyRef = viewMode === 'archetype' ? cyArchRef : cyGenreRef

  return (
    <div className="page-shell" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* App bar — slim top bar with hamburger menu */}
      <AppShellBar>
        {/* Generation panel toggle */}
        <button
          onClick={toggleGenPanel}
          aria-label={genPanelOpen ? 'Hide generation panel' : 'Show generation panel'}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid',
            borderColor: genPanelOpen ? '#22c55e' : 'var(--border)',
            background: genPanelOpen ? '#22c55e18' : 'transparent',
            color: genPanelOpen ? '#22c55e' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            position: 'relative',
          }}
        >
          Generate
          {genStatus !== 'IDLE' && genStatus !== 'COMPLETED' && genStatus !== 'FAILED' && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#f59e0b',
              animation: 'pulse 1.5s infinite',
            }} />
          )}
          {genStatus === 'COMPLETED' && (
            <span style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22c55e',
            }} />
          )}
        </button>

        {/* Graph search */}
        {currentGraph && (
          <GraphSearch graph={currentGraph} onSelect={handleSearchSelect} />
        )}
        <GlobalSearch />

        {/* Export */}
        {currentGraph && (
          <button
            onClick={() => setShowExport((v) => !v)}
            aria-label="Export graph"
            style={{
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 4,
              border: '1px solid',
              borderColor: showExport ? 'var(--accent)' : 'var(--border)',
              background: showExport ? 'var(--accent)18' : 'transparent',
              color: showExport ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Export
          </button>
        )}

        {/* Settings */}
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
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {'\u2699'}
        </button>

        {/* Status indicators */}
        {dbStatus.error && (
          <span style={{ fontSize: 9, color: '#ef4444' }} title={dbStatus.error}>DB err</span>
        )}
        {dbStatus.ready && (
          <span style={{ fontSize: 9, color: '#22c55e' }} title={`SQLite v${dbStatus.schemaVersion}`}>DB</span>
        )}
        {loading && (
          <span style={{ fontSize: 11, color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>
            Loading...
          </span>
        )}
        {(error || manifestError) && (
          <span style={{ fontSize: 11, color: '#ef4444' }}>{error || manifestError}</span>
        )}
      </AppShellBar>

      {/* Settings panel overlay */}
      {settingsOpen && <SettingsPanel />}

      {/* Export panel overlay */}
      {showExport && currentGraph && (
        <ExportPanel
          graph={currentGraph}
          cyRef={activeCyRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Main layout: Generation panel (left) + graphs (center) */}
      <div className="main-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Generation panel — toggleable sidebar */}
        {genPanelOpen && <div className="gen-panel" style={{
          width: GEN_PANEL_WIDTH,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Generation sub-tabs — Run always first and prominent */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <GenTab label={'\u25C0 Run'} active={genTab === 'run'} onClick={() => setGenTab('run')} highlight />
            {genContract && <GenTab label="Contract" active={genTab === 'contract'} onClick={() => setGenTab('contract')} badge />}
            {genPlan && <GenTab label="Plan" active={genTab === 'plan'} onClick={() => setGenTab('plan')} badge />}
            {genTrace && <GenTab label="Map" active={genTab === 'trace'} onClick={() => setGenTab('trace')} badge />}
            {genValidation && <GenTab label="Checks" active={genTab === 'compliance'} onClick={() => setGenTab('compliance')} badge />}
            {genSceneDrafts.size > 0 && <GenTab label="Story" active={genTab === 'story'} onClick={() => setGenTab('story')} badge />}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {genTab === 'run' && <GenerationPanel />}
            {genTab === 'contract' && <ContractPanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'plan' && <PlanPanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'trace' && <TracePanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'compliance' && <CompliancePanel />}
            {genTab === 'story' && <StoryPanel onHighlightNodes={setGenHighlightNodes} />}
          </div>
        </div>}

        {/* Info panel + graph area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Collapsible info panel — accordion sections */}
          <div style={{
            height: infoPanelOpen ? infoPanelHeight : 28,
            background: 'var(--bg-surface)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: draggingSep ? 'none' : 'height 0.2s ease',
          }}>
            {/* Collapse toggle */}
            <button
              onClick={() => setInfoPanelOpen((v) => !v)}
              aria-label={infoPanelOpen ? 'Collapse panel' : 'Expand panel'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                fontSize: 10,
                color: 'var(--text-muted)',
                flexShrink: 0,
                borderBottom: '1px solid var(--border)',
                minHeight: 28,
              }}
            >
              <span>{infoPanelOpen ? '\u25B2' : '\u25BC'}</span>
              <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Inspector
              </span>
            </button>

            {infoPanelOpen && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Graph group */}
                <Disclosure title="Graph" persistKey="info-graph" badge={currentGraph ? `${currentGraph.graph.nodes.length}N` : ''}>
                  <PairingPanel />
                  {hasDetailContent && currentGraph && (
                    <Disclosure title="Selected Element" persistKey="info-detail">
                      <DetailPanel
                        node={selectedNode}
                        edge={selectedEdge}
                        onTraceForward={handleTraceForward}
                        onTraceBackward={handleTraceBackward}
                        onClearTrace={handleClearTrace}
                        traceActive={traceDirection}
                        graph={currentGraph}
                      />
                    </Disclosure>
                  )}
                  {currentGraph && (
                    <Disclosure title="Statistics" persistKey="info-stats" defaultCollapsed>
                      <GraphStats graph={currentGraph} />
                    </Disclosure>
                  )}
                  {currentGraph && (
                    <Disclosure title="Elements" persistKey="info-elements" defaultCollapsed>
                      <ElementsPanel graph={currentGraph} selectedNodeId={selectedNodeId} />
                    </Disclosure>
                  )}
                  {currentGraph && (
                    <Disclosure title="Cross-Index" persistKey="info-xindex" defaultCollapsed>
                      <CrossIndexPanel graph={currentGraph} />
                    </Disclosure>
                  )}
                </Disclosure>

                {/* Visualization group */}
                {archetypeGraph && (
                  <Disclosure title="Visualization" persistKey="info-viz" defaultCollapsed>
                    <Disclosure title="Timeline" persistKey="info-timeline" defaultCollapsed>
                      <TimelinePanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                    </Disclosure>
                    <Disclosure title="Character Arcs" persistKey="info-arcs" defaultCollapsed>
                      <CharacterArcPanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                    </Disclosure>
                  </Disclosure>
                )}

                {/* Generation group — only when artifacts exist */}
                {(genTemplatePack || genBackbone || genContract || genPlan || genSceneDrafts.size > 0 || genValidation || genChapterManifest) && (
                  <Disclosure title="Generation" persistKey="info-gen" badge={genSceneDrafts.size > 0 ? `${genSceneDrafts.size} scenes` : ''}>
                    <Disclosure title="Templates" persistKey="info-templates" defaultCollapsed>
                      <TemplatesPanel />
                    </Disclosure>
                    {genContract && (
                      <Disclosure title="Contract" persistKey="info-gen-contract" defaultCollapsed>
                        <ContractPanel onHighlightNodes={setGenHighlightNodes} />
                      </Disclosure>
                    )}
                    {genBackbone && (
                      <Disclosure title="Backbone" persistKey="info-gen-backbone" defaultCollapsed badge={`${genBackbone.beats.length} beats`}>
                        <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-primary)' }}>
                          {genBackbone.beats.map((beat, i) => {
                            const obligationCount = beat.scenes.reduce((n, s) => n + s.genre_obligations.length, 0)
                            return (
                              <div key={i} style={{ padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: '3px solid #f59e0b' }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                                  <span style={{ fontWeight: 600 }}>{beat.label}</span>
                                  {beat.role && <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>{beat.role}</span>}
                                </div>
                                {beat.definition && <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{beat.definition}</div>}
                                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                  {beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}{obligationCount > 0 ? `, ${obligationCount} obligations` : ''}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Disclosure>
                    )}
                    {genPlan && (
                      <Disclosure title="Plan" persistKey="info-gen-plan" defaultCollapsed>
                        <PlanPanel onHighlightNodes={setGenHighlightNodes} />
                      </Disclosure>
                    )}
                    {genSceneDrafts.size > 0 && (
                      <Disclosure title="Story" persistKey="info-gen-story">
                        <StoryPanel onHighlightNodes={setGenHighlightNodes} />
                      </Disclosure>
                    )}
                    {genValidation && (
                      <Disclosure title="Compliance" persistKey="info-gen-compliance" defaultCollapsed>
                        <CompliancePanel />
                      </Disclosure>
                    )}
                    {genChapterManifest && (
                      <Disclosure title="Chapters" persistKey="info-gen-chapters" badge={`${genChapterManifest.chapters.length}`}>
                        <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-primary)' }}>
                          {genChapterManifest.chapters.map((ch, i) => (
                            <div key={i} style={{ padding: '4px 8px', marginBottom: 3, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                              <span style={{ fontWeight: 500 }}>{ch.title}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>{ch.scene_ids.length} scenes</span>
                            </div>
                          ))}
                        </div>
                      </Disclosure>
                    )}
                  </Disclosure>
                )}
              </div>
            )}
          </div>

          {/* Draggable separator */}
          {infoPanelOpen && (
            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize info panel"
              aria-valuenow={infoPanelHeight}
              aria-valuemin={INFO_PANEL_MIN_HEIGHT}
              aria-valuemax={INFO_PANEL_MAX_HEIGHT}
              tabIndex={0}
              onKeyDown={(e) => {
                const step = 20
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setInfoPanelHeight((h) => Math.max(INFO_PANEL_MIN_HEIGHT, h - step))
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setInfoPanelHeight((h) => Math.min(INFO_PANEL_MAX_HEIGHT, h + step))
                }
              }}
              onPointerDown={handleSepPointerDown}
              onPointerMove={handleSepPointerMove}
              onPointerUp={handleSepPointerUp}
              onPointerCancel={handleSepPointerUp}
              onLostPointerCapture={handleSepPointerUp}
              style={{
                height: 6,
                flexShrink: 0,
                cursor: 'row-resize',
                background: 'var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none',
              }}
            >
              <div style={{
                width: 32,
                height: 2,
                borderRadius: 1,
                background: 'var(--text-muted)',
                opacity: 0.5,
              }} />
            </div>
          )}

          {/* Graph toggle bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
            minHeight: 30,
          }}>
            {/* Segmented control: Archetype / Genre */}
            <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <button
                onClick={() => activateGraph('archetype')}
                style={{
                  padding: '2px 12px',
                  fontSize: 10,
                  fontWeight: viewMode === 'archetype' ? 600 : 400,
                  color: viewMode === 'archetype' ? '#f59e0b' : 'var(--text-muted)',
                  background: viewMode === 'archetype' ? '#f59e0b14' : 'transparent',
                  borderRight: '1px solid var(--border)',
                }}
              >
                Archetype
              </button>
              <button
                onClick={() => activateGraph('genre')}
                style={{
                  padding: '2px 12px',
                  fontSize: 10,
                  fontWeight: viewMode === 'genre' ? 600 : 400,
                  color: viewMode === 'genre' ? '#8b5cf6' : 'var(--text-muted)',
                  background: viewMode === 'genre' ? '#8b5cf614' : 'transparent',
                }}
              >
                Genre
              </button>
            </div>

            {/* Active graph name + counts */}
            {currentGraph && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {currentGraph.graph.name}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
                </span>
              </span>
            )}

            {/* Compare toggle */}
            <button
              className="compare-toggle"
              onClick={toggleSplitView}
              aria-label={splitView ? 'Single graph view' : 'Compare side-by-side'}
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid',
                borderColor: splitView ? 'var(--accent)' : 'var(--border)',
                color: splitView ? 'var(--accent)' : 'var(--text-muted)',
                background: splitView ? 'rgba(59,130,246,0.08)' : 'transparent',
              }}
            >
              Compare
            </button>
          </div>

          {/* Graph area — single or split */}
          <div className="graph-pair" style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {splitView ? (
              <>
                <GraphDocument
                  label="Archetype"
                  color="#f59e0b"
                  graphName={archetypeGraph?.graph.name ?? null}
                  graph={archetypeGraph}
                  graphId={archetypeDir ? `archetype/${archetypeDir}` : undefined}
                  onCyReady={handleArchCyReady}
                  onFocus={handleArchFocus}
                  isActive={viewMode === 'archetype'}
                  highlightedPath={viewMode === 'archetype' ? highlightedPath : undefined}
                  generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                />
                <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
                <GraphDocument
                  label="Genre"
                  color="#8b5cf6"
                  graphName={genreGraph?.graph.name ?? null}
                  graph={genreGraph}
                  graphId={genreDir ? `genre/${genreDir}` : undefined}
                  onCyReady={handleGenreCyReady}
                  onFocus={handleGenreFocus}
                  isActive={viewMode === 'genre'}
                  highlightedPath={viewMode === 'genre' ? highlightedPath : undefined}
                />
              </>
            ) : (
              /* Single graph — full width */
              viewMode === 'archetype' ? (
                <GraphDocument
                  label="Archetype"
                  color="#f59e0b"
                  graphName={archetypeGraph?.graph.name ?? null}
                  graph={archetypeGraph}
                  graphId={archetypeDir ? `archetype/${archetypeDir}` : undefined}
                  onCyReady={handleArchCyReady}
                  onFocus={handleArchFocus}
                  isActive
                  highlightedPath={highlightedPath}
                  generationOverlay={generationOverlay}
                />
              ) : (
                <GraphDocument
                  label="Genre"
                  color="#8b5cf6"
                  graphName={genreGraph?.graph.name ?? null}
                  graph={genreGraph}
                  graphId={genreDir ? `genre/${genreDir}` : undefined}
                  onCyReady={handleGenreCyReady}
                  onFocus={handleGenreFocus}
                  isActive
                  highlightedPath={highlightedPath}
                />
              )
            )}
          </div>


        </div>
      </div>

      {/* Screen-reader announcements */}
      <div aria-live="polite" className="sr-only" style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
      }}>
        {selectedNode && `Selected node: ${selectedNode.label}, role: ${selectedNode.role}`}
        {selectedEdge && `Selected edge: ${selectedEdge.label}, meaning: ${selectedEdge.meaning}`}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Graph Document — label + GraphCanvas (no dropdown — driven by GenerationPanel)
// ---------------------------------------------------------------------------

interface GraphDocumentProps {
  label: string
  color: string
  graphName: string | null
  graph: NormalizedGraph | null
  graphId?: string
  onCyReady: (cy: CyCore) => void
  onFocus: () => void
  isActive: boolean
  highlightedPath?: string[]
  generationOverlay?: GenerationOverlay
}

const GraphDocument = memo(function GraphDocument({
  label,
  color,
  graphName,
  graph,
  graphId,
  onCyReady,
  onFocus,
  isActive,
  highlightedPath,
  generationOverlay,
}: GraphDocumentProps) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minWidth: 0,
      border: isActive ? `1px solid ${color}40` : '1px solid transparent',
      transition: 'border-color 0.2s',
    }}>
      {/* Document header — label only, no dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 10px',
        background: `${color}08`,
        borderBottom: `2px solid ${color}${isActive ? '80' : '30'}`,
        flexShrink: 0,
        minHeight: 28,
      }}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color,
          flexShrink: 0,
        }}>
          {label}
        </span>
        {graphName && (
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {graphName}
          </span>
        )}
        {graph && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 8 }}>
            {graph.graph.nodes.length}N / {graph.graph.edges.length}E
          </span>
        )}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {graph ? (
          <div key={graphId} style={{ width: '100%', height: '100%', animation: 'fadeIn 0.25s ease' }}>
            <GraphCanvas
              graph={graph}
              graphId={graphId}
              highlightedPath={highlightedPath}
              generationOverlay={generationOverlay}
              onCyReady={onCyReady}
              onFocus={onFocus}
            />
          </div>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontSize: 12,
          }}>
            No graph loaded
          </div>
        )}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

const GenTab = memo(function GenTab({ label, active, onClick, badge, highlight }: {
  label: string
  active: boolean
  onClick: () => void
  badge?: boolean
  highlight?: boolean
}) {
  const baseColor = highlight && !active ? '#3b82f6' : '#22c55e'
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '7px 4px',
        fontSize: 11,
        fontWeight: active ? 600 : highlight ? 500 : 400,
        color: active ? '#22c55e' : highlight ? baseColor : 'var(--text-muted)',
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
