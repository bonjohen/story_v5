import { useEffect, useCallback, useRef, useState, useMemo, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
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
import { PipelineTab } from './generation/panels/PipelineTab.tsx'
import { StorySetupTab } from './generation/panels/StorySetupTab.tsx'
import { ElementsTab } from './generation/panels/ElementsTab.tsx'
import { GenerateTab } from './generation/panels/GenerateTab.tsx'
import { ContractPanel } from './generation/panels/ContractPanel.tsx'
import { PlanPanel } from './generation/panels/PlanPanel.tsx'
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
const GEN_PANEL_WIDTH = 340
const MOBILE_BREAKPOINT = 768

/** Hook to detect mobile viewport. */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

/** Parse the URL pathname into a graph type and directory slug. */
function parseRoute(pathname: string): { type: 'archetype' | 'genre'; dir: string } | null {
  const match = pathname.match(/^\/(archetype|genre)\/([a-z0-9_]+)$/)
  if (!match) return null
  return { type: match[1] as 'archetype' | 'genre', dir: match[2] }
}


export default function App() {
  const location = useLocation()
  const manifestLoaded = useRef(false)
  const isMobile = useIsMobile()

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
  const [genTab, setGenTab] = useState<'pipeline' | 'setup' | 'elements' | 'generate'>('setup')
  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])
  const [manifestError, setManifestError] = useState<string | null>(null)

  const cyArchRef = useRef<CyCore | null>(null)
  const cyGenreRef = useRef<CyCore | null>(null)

  const handleArchCyReady = useCallback((cy: CyCore) => { cyArchRef.current = cy }, [])
  const handleGenreCyReady = useCallback((cy: CyCore) => { cyGenreRef.current = cy }, [])


  // Auto-switch to Generate tab once when draft generation completes
  const autoSwitchedToGenerate = useRef(false)
  useEffect(() => {
    if (genStatus === 'COMPLETED' && genSceneDrafts.size > 0 && !autoSwitchedToGenerate.current) {
      autoSwitchedToGenerate.current = true
      setGenTab('generate')
    }
    if (genStatus === 'IDLE') {
      autoSwitchedToGenerate.current = false
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
            fontSize: isMobile ? 13 : 11,
            padding: isMobile ? '6px 16px' : '3px 10px',
            borderRadius: 4,
            border: '1px solid',
            borderColor: genPanelOpen ? '#22c55e' : 'var(--border)',
            background: genPanelOpen ? '#22c55e18' : 'transparent',
            color: genPanelOpen ? '#22c55e' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            position: 'relative',
            minHeight: 44,
            minWidth: 44,
          }}
        >
          {genPanelOpen && isMobile ? '\u2715 Close' : 'Generate'}
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

        {/* DB status indicator */}
        {dbStatus.error && (
          <span style={{ fontSize: 9, color: '#ef4444' }} title={dbStatus.error}>DB err</span>
        )}
        {dbStatus.loading && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>DB...</span>
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
      <div className="main-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Generation panel — sidebar on desktop, full-width on mobile */}
        {genPanelOpen && <div className="gen-panel" style={{
          width: isMobile ? '100%' : GEN_PANEL_WIDTH,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: isMobile ? 'none' : '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(isMobile ? { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 20 } : {}),
        }}>
          {/* 4 fixed generation tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <GenTab label="Pipeline" active={genTab === 'pipeline'} onClick={() => setGenTab('pipeline')} />
            <GenTab label="Setup" active={genTab === 'setup'} onClick={() => setGenTab('setup')} highlight />
            <GenTab label="Elements" active={genTab === 'elements'} onClick={() => setGenTab('elements')} badge={!!genBackbone} />
            <GenTab label="Generate" active={genTab === 'generate'} onClick={() => setGenTab('generate')} badge={genSceneDrafts.size > 0 || (genStatus !== 'IDLE' && genStatus !== 'COMPLETED' && genStatus !== 'FAILED')} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {genTab === 'pipeline' && <PipelineTab />}
            {genTab === 'setup' && <StorySetupTab />}
            {genTab === 'elements' && <ElementsTab />}
            {genTab === 'generate' && <GenerateTab onHighlightNodes={setGenHighlightNodes} />}
          </div>
        </div>}

        {/* Inspector — full-height scrollable panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-surface)' }}>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Graph group — contains canvas, selection detail, and metadata */}
            <Disclosure title="Graph" persistKey="info-graph" badge={currentGraph ? `${currentGraph.graph.nodes.length}N` : ''}>
              {/* Graph toggle bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderBottom: '1px solid var(--border)',
                minHeight: 30,
              }}>
                <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { if (splitView) toggleSplitView(); activateGraph('archetype'); }}
                    style={{
                      padding: '2px 12px',
                      fontSize: 10,
                      fontWeight: !splitView && viewMode === 'archetype' ? 600 : 400,
                      color: !splitView && viewMode === 'archetype' ? '#f59e0b' : 'var(--text-muted)',
                      background: !splitView && viewMode === 'archetype' ? '#f59e0b14' : 'transparent',
                      borderRight: '1px solid var(--border)',
                    }}
                  >
                    Archetype
                  </button>
                  <button
                    onClick={() => { if (splitView) toggleSplitView(); activateGraph('genre'); }}
                    style={{
                      padding: '2px 12px',
                      fontSize: 10,
                      fontWeight: !splitView && viewMode === 'genre' ? 600 : 400,
                      color: !splitView && viewMode === 'genre' ? '#8b5cf6' : 'var(--text-muted)',
                      background: !splitView && viewMode === 'genre' ? '#8b5cf614' : 'transparent',
                      borderRight: '1px solid var(--border)',
                    }}
                  >
                    Genre
                  </button>
                  <button
                    className="compare-toggle"
                    onClick={() => { if (!splitView) toggleSplitView(); }}
                    style={{
                      padding: '2px 12px',
                      fontSize: 10,
                      fontWeight: splitView ? 600 : 400,
                      color: splitView ? 'var(--accent)' : 'var(--text-muted)',
                      background: splitView ? 'rgba(59,130,246,0.08)' : 'transparent',
                    }}
                  >
                    Compare
                  </button>
                </div>
                {!splitView && currentGraph && (
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {currentGraph.graph.name}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
                      {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
                    </span>
                  </span>
                )}
              </div>

              {/* Graph canvas — embedded with fixed height */}
              <div style={{ height: 400, display: 'flex', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                {splitView ? (
                  <>
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      {archetypeGraph ? (
                        <div key={archetypeDir ? `archetype/${archetypeDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                          <GraphCanvas
                            graph={archetypeGraph}
                            graphId={archetypeDir ? `archetype/${archetypeDir}` : undefined}
                            highlightedPath={viewMode === 'archetype' ? highlightedPath : undefined}
                            generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                            onCyReady={handleArchCyReady}
                            onFocus={handleArchFocus}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No archetype loaded</div>
                      )}
                    </div>
                    <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      {genreGraph ? (
                        <div key={genreDir ? `genre/${genreDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                          <GraphCanvas
                            graph={genreGraph}
                            graphId={genreDir ? `genre/${genreDir}` : undefined}
                            highlightedPath={viewMode === 'genre' ? highlightedPath : undefined}
                            onCyReady={handleGenreCyReady}
                            onFocus={handleGenreFocus}
                          />
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No genre loaded</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    {currentGraph ? (
                      <div key={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : 'arch') : (genreDir ? `genre/${genreDir}` : 'genre')} style={{ width: '100%', height: '100%' }}>
                        <GraphCanvas
                          graph={currentGraph}
                          graphId={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : undefined) : (genreDir ? `genre/${genreDir}` : undefined)}
                          highlightedPath={highlightedPath}
                          generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                          onCyReady={viewMode === 'archetype' ? handleArchCyReady : handleGenreCyReady}
                          onFocus={viewMode === 'archetype' ? handleArchFocus : handleGenreFocus}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No graph loaded</div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected element detail — shown directly when node/edge clicked */}
              {hasDetailContent && currentGraph && (
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

              <PairingPanel />
              {currentGraph && (
                <Disclosure title="Statistics" persistKey="info-stats" defaultCollapsed depth={1}>
                  <GraphStats graph={currentGraph} />
                </Disclosure>
              )}
              {currentGraph && (
                <Disclosure title="Elements" persistKey="info-elements" defaultCollapsed depth={1}>
                  <ElementsPanel graph={currentGraph} selectedNodeId={selectedNodeId} />
                </Disclosure>
              )}
              {currentGraph && (
                <Disclosure title="Cross-Index" persistKey="info-xindex" defaultCollapsed depth={1}>
                  <CrossIndexPanel graph={currentGraph} />
                </Disclosure>
              )}
            </Disclosure>

            {/* Visualization group */}
            {archetypeGraph && (
              <Disclosure title="Visualization" persistKey="info-viz" defaultCollapsed>
                <Disclosure title="Timeline" persistKey="info-timeline" defaultCollapsed depth={1}>
                  <TimelinePanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                </Disclosure>
                <Disclosure title="Character Arcs" persistKey="info-arcs" defaultCollapsed depth={1}>
                  <CharacterArcPanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                </Disclosure>
              </Disclosure>
            )}

            {/* Generation group — only when artifacts exist */}
            {(genTemplatePack || genBackbone || genContract || genPlan || genSceneDrafts.size > 0 || genValidation || genChapterManifest) && (
              <Disclosure title="Generation" persistKey="info-gen" badge={genSceneDrafts.size > 0 ? `${genSceneDrafts.size} scenes` : ''}>
                <Disclosure title="Templates" persistKey="info-templates" defaultCollapsed depth={1}>
                  <TemplatesPanel />
                </Disclosure>
                {genContract && (
                  <Disclosure title="Contract" persistKey="info-gen-contract" defaultCollapsed depth={1}>
                    <ContractPanel onHighlightNodes={setGenHighlightNodes} />
                  </Disclosure>
                )}
                {genBackbone && (
                  <Disclosure title="Backbone" persistKey="info-gen-backbone" defaultCollapsed depth={1} badge={`${genBackbone.beats.length} beats`}>
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
                  <Disclosure title="Plan" persistKey="info-gen-plan" defaultCollapsed depth={1}>
                    <PlanPanel onHighlightNodes={setGenHighlightNodes} />
                  </Disclosure>
                )}
                {genSceneDrafts.size > 0 && (
                  <Disclosure title="Story" persistKey="info-gen-story" depth={1}>
                    <StoryPanel onHighlightNodes={setGenHighlightNodes} />
                  </Disclosure>
                )}
                {genValidation && (
                  <Disclosure title="Compliance" persistKey="info-gen-compliance" defaultCollapsed depth={1}>
                    <CompliancePanel />
                  </Disclosure>
                )}
                {genChapterManifest && (
                  <Disclosure title="Chapters" persistKey="info-gen-chapters" depth={1} badge={`${genChapterManifest.chapters.length}`}>
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
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
