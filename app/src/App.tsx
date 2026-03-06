import { useEffect, useCallback, useRef, useState, useMemo, memo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GraphCanvas } from './render/GraphCanvas.tsx'
import { computeFailureModeNodes } from './graph-engine/index.ts'
import { DetailPanel } from './panels/DetailPanel.tsx'
import { GraphStats } from './panels/GraphStats.tsx'
import { CrossIndexPanel } from './panels/CrossIndex.tsx'
import { PairingPanel } from './panels/PairingPanel.tsx'
import { ElementsPanel } from './panels/ElementsPanel.tsx'
import { TimelinePanel } from './panels/TimelinePanel.tsx'
import { CharacterArcPanel } from './panels/CharacterArcPanel.tsx'
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
import { StoryPanel } from './generation/panels/StoryPanel.tsx'
import { TemplatesPanel } from './generation/panels/TemplatesPanel.tsx'
import type { CyCore, GenerationOverlay } from './render/GraphCanvas.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { useSettingsStore } from './store/settingsStore.ts'
import { useGenerationStore } from './generation/store/generationStore.ts'
import { useRequestStore } from './generation/store/requestStore.ts'
import type { DataManifest } from './types/graph.ts'

// Layout constants
const TOOLBAR_HEIGHT = 42
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
  const navigate = useNavigate()
  const manifestLoaded = useRef(false)

  // Store state
  const archetypeGraph = useGraphStore((s) => s.archetypeGraph)
  const archetypeDir = useGraphStore((s) => s.archetypeDir)
  const genreGraph = useGraphStore((s) => s.genreGraph)
  const genreDir = useGraphStore((s) => s.genreDir)
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const graphId = useGraphStore((s) => s.graphId)
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
  const genSelection = useGenerationStore((s) => s.selection)

  // Sync auto-selected blend/hybrid back to request store dropdowns
  const manifest = useGraphStore((s) => s.manifest)
  useEffect(() => {
    if (!genSelection) return
    const { genre_blend, hybrid_archetype } = genSelection

    // Convert directory IDs to display names using manifest
    const dirToGenreName = (dir: string): string => {
      if (!manifest) return dir
      const entry = manifest.genres.find((g) => g.filePath.endsWith(`/${dir}`) || g.filePath === dir)
      return entry?.name ?? dir
    }
    const dirToArchetypeName = (dir: string): string => {
      if (!manifest) return dir
      const entry = manifest.archetypes.find((a) => a.filePath.endsWith(`/${dir}`) || a.filePath === dir)
      return entry?.name ?? dir
    }

    if (genre_blend?.enabled && genre_blend.secondary_genre) {
      const name = dirToGenreName(genre_blend.secondary_genre)
      useRequestStore.getState().setAllowBlend(true)
      useRequestStore.getState().setBlendGenre(name)
    }
    if (hybrid_archetype?.enabled && hybrid_archetype.secondary_archetype) {
      const name = dirToArchetypeName(hybrid_archetype.secondary_archetype)
      useRequestStore.getState().setAllowHybrid(true)
      useRequestStore.getState().setHybridArchetype(name)
    }
  }, [genSelection, manifest])

  // UI state
  const [activeVariant, setActiveVariant] = useState<string | null>(null)
  const [showFailureModes, setShowFailureModes] = useState(false)

  const [exampleMappedNodes] = useState<string[]>([])
  const [showExport, setShowExport] = useState(false)
  const [genTab, setGenTab] = useState<'run' | 'contract' | 'plan' | 'trace' | 'compliance' | 'story'>('run')
  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [infoPanel, setInfoPanel] = useState<string>('pairing')
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
        const parsed = parseRoute(location.pathname)
        if (parsed) {
          void loadGraph(parsed.type, parsed.dir)
        }
        // GenerationPanel syncs its default archetype/genre selections
        // to the graph store on mount, so no need to load index-0 here.
      })
      .catch((err) => {
        console.warn('Failed to load manifest:', err)
        setManifestError(err instanceof Error ? err.message : 'Failed to load manifest')
      })
  }, [setManifest, location.pathname, loadGraph])

  // Sync URL -> graph loading
  useEffect(() => {
    const parsed = parseRoute(location.pathname)
    if (parsed) {
      void loadGraph(parsed.type, parsed.dir)
    }
  }, [location.pathname, loadGraph])

  // Reset overlays when active graph changes
  useEffect(() => {
    setActiveVariant(null)
    setShowFailureModes(false)
  }, [graphId])

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

  // Auto-switch to detail tab when node/edge is selected
  useEffect(() => {
    if (selectedNodeId || selectedEdgeId) {
      setInfoPanel('detail')
      setInfoPanelOpen(true)
    }
  }, [selectedNodeId, selectedEdgeId])

  // Failure mode nodes
  const failureModeNodes = currentGraph && showFailureModes
    ? computeFailureModeNodes(currentGraph)
    : []


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

  // Info panel tabs — progressive disclosure
  const infoTabs = useMemo(() => {
    const tabs: { id: string; label: string; badge?: boolean }[] = [
      { id: 'pairing', label: 'Pairing' },
    ]
    if (hasDetailContent) {
      tabs.push({ id: 'detail', label: 'Detail', badge: true })
    }
    tabs.push({ id: 'stats', label: 'Stats' })
    tabs.push({ id: 'crossindex', label: 'X-Index' })
    tabs.push({ id: 'elements', label: 'Elements' })
    tabs.push({ id: 'timeline', label: 'Timeline' })
    tabs.push({ id: 'arcs', label: 'Arcs' })
    tabs.push({ id: 'templates', label: 'Templates', badge: !!(genTemplatePack || genBackbone) })
    if (genContract) tabs.push({ id: 'gen-contract', label: 'Contract', badge: true })
    if (genBackbone) tabs.push({ id: 'gen-backbone', label: 'Backbone', badge: true })
    if (genPlan) tabs.push({ id: 'gen-plan', label: 'Plan', badge: true })
    if (genSceneDrafts.size > 0) tabs.push({ id: 'gen-story', label: 'Story', badge: true })
    if (genValidation) tabs.push({ id: 'gen-compliance', label: 'Checks', badge: true })
    if (genChapterManifest) tabs.push({ id: 'gen-chapters', label: 'Chapters', badge: true })
    return tabs
  }, [hasDetailContent, genContract, genBackbone, genPlan, genSceneDrafts.size, genValidation, genChapterManifest, genTemplatePack])

  const activeCyRef = viewMode === 'archetype' ? cyArchRef : cyGenreRef

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }}>
      {/* Toolbar — controls on the LEFT */}
      <header role="banner" aria-label="Application toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
        height: TOOLBAR_HEIGHT,
      }}>
        <span style={{
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}>
          Story Structure Explorer
        </span>

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />


        {/* Scripts link */}
        <button
          onClick={() => void navigate('/scripts')}
          aria-label="Browse audio scripts"
          style={toolbarButtonStyle(false, 'var(--accent)')}
        >
          Scripts
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
            style={toolbarButtonStyle(showExport, 'var(--accent)')}
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
        >
          {'\u2699'}
        </button>

        <div style={{ flex: 1 }} />

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
          cyRef={activeCyRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Main layout: Generation panel (left) + graphs (center) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Generation panel — always visible on the left */}
        <div style={{
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
            <GenTab label="Contract" active={genTab === 'contract'} onClick={() => setGenTab('contract')} badge={!!genContract} />
            <GenTab label="Plan" active={genTab === 'plan'} onClick={() => setGenTab('plan')} badge={!!genPlan} />
            <GenTab label="Map" active={genTab === 'trace'} onClick={() => setGenTab('trace')} badge={!!genTrace} />
            <GenTab label="Checks" active={genTab === 'compliance'} onClick={() => setGenTab('compliance')} badge={!!genValidation} />
            <GenTab label="Story" active={genTab === 'story'} onClick={() => setGenTab('story')} badge={genSceneDrafts.size > 0} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {genTab === 'run' && <GenerationPanel onClose={() => setGenTab('run')} />}
            {genTab === 'contract' && <ContractPanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'plan' && <PlanPanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'trace' && <TracePanel onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'compliance' && <CompliancePanel />}
            {genTab === 'story' && <StoryPanel onHighlightNodes={setGenHighlightNodes} />}
          </div>
        </div>

        {/* Info panel + graph area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top info panel */}
          <div style={{
            height: infoPanelOpen ? infoPanelHeight : 28,
            background: 'var(--bg-surface)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: draggingSep ? 'none' : 'height 0.2s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: infoPanelOpen ? '1px solid var(--border)' : 'none',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setInfoPanelOpen((v) => !v)}
                aria-label={infoPanelOpen ? 'Collapse panel' : 'Expand panel'}
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                {infoPanelOpen ? '\u25B2' : '\u25BC'}
              </button>

              <div style={{
                display: 'flex',
                flex: 1,
                overflowX: 'auto',
                gap: 0,
              }}>
                {infoTabs.map((tab) => (
                  <BottomTab
                    key={tab.id}
                    label={tab.label}
                    active={infoPanel === tab.id}
                    badge={tab.badge}
                    onClick={() => {
                      setInfoPanel(tab.id)
                      setInfoPanelOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>

            {infoPanelOpen && (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {infoPanel === 'pairing' && <PairingPanel />}
                {infoPanel === 'detail' && hasDetailContent && currentGraph && (
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
                {infoPanel === 'stats' && currentGraph && <GraphStats graph={currentGraph} />}
                {infoPanel === 'crossindex' && currentGraph && <CrossIndexPanel graph={currentGraph} />}
                {infoPanel === 'elements' && currentGraph && (
                  <ElementsPanel graph={currentGraph} selectedNodeId={selectedNodeId} />
                )}
                {infoPanel === 'timeline' && archetypeGraph && (
                  <TimelinePanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                )}
                {infoPanel === 'arcs' && archetypeGraph && (
                  <CharacterArcPanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
                )}
                {infoPanel === 'templates' && <TemplatesPanel />}
                {infoPanel === 'gen-contract' && <ContractPanel onHighlightNodes={setGenHighlightNodes} />}
                {infoPanel === 'gen-backbone' && genBackbone && (
                  <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-primary)' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Backbone</div>
                    <div style={{ marginBottom: 8 }}>{genBackbone.beats.length} beats, {genBackbone.chapter_partition.length} chapters</div>
                    {genBackbone.beats.map((beat, i) => {
                      const slotNames = beat.scenes.flatMap((s) => Object.keys(s.slots))
                      const uniqueSlots = [...new Set(slotNames)]
                      const obligationCount = beat.scenes.reduce((n, s) => n + s.genre_obligations.length, 0)
                      return (
                        <div key={i} style={{ padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: '3px solid #f59e0b' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600 }}>{beat.label}</span>
                            {beat.role && (
                              <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>
                                {beat.role}
                              </span>
                            )}
                          </div>
                          {beat.definition && (
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 3 }}>
                              {beat.definition}
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span>{beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}</span>
                            {obligationCount > 0 && <span>{obligationCount} genre obligation{obligationCount !== 1 ? 's' : ''}</span>}
                            {uniqueSlots.length > 0 && <span>Slots: {uniqueSlots.join(', ')}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {infoPanel === 'gen-plan' && <PlanPanel onHighlightNodes={setGenHighlightNodes} />}
                {infoPanel === 'gen-story' && <StoryPanel onHighlightNodes={setGenHighlightNodes} />}
                {infoPanel === 'gen-compliance' && <CompliancePanel />}
                {infoPanel === 'gen-chapters' && genChapterManifest && (
                  <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-primary)' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Chapters</div>
                    {genChapterManifest.chapters.map((ch, i) => (
                      <div key={i} style={{ padding: '4px 8px', marginBottom: 3, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                        <span style={{ fontWeight: 500 }}>{ch.title}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>
                          {ch.scene_ids.length} scenes
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Draggable separator */}
          {infoPanelOpen && (
            <div
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

          {/* Two graph documents side by side */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            {/* Archetype document */}
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
              failureModeNodes={viewMode === 'archetype' ? failureModeNodes : undefined}
              activeVariant={activeVariant}
              exampleMappedNodes={exampleMappedNodes.length > 0 ? exampleMappedNodes : undefined}
              generationOverlay={generationOverlay}
            />

            <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />

            {/* Genre document */}
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
  graph: import('./graph-engine/index.ts').NormalizedGraph | null
  graphId?: string
  onCyReady: (cy: CyCore) => void
  onFocus: () => void
  isActive: boolean
  highlightedPath?: string[]
  failureModeNodes?: string[]
  activeVariant?: string | null
  exampleMappedNodes?: string[]
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
  failureModeNodes,
  activeVariant,
  exampleMappedNodes,
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

              failureModeNodes={failureModeNodes}
              activeVariant={activeVariant}
              exampleMappedNodes={exampleMappedNodes}
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
            Select from the Generate panel
          </div>
        )}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function toolbarButtonStyle(active: boolean, activeColor: string): React.CSSProperties {
  return {
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 4,
    border: '1px solid',
    borderColor: active ? activeColor : 'var(--border)',
    background: active ? `${activeColor}18` : 'transparent',
    color: active ? activeColor : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }
}

const BottomTab = memo(function BottomTab({ label, active, onClick, badge }: {
  label: string
  active: boolean
  onClick: () => void
  badge?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        fontSize: 10,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        position: 'relative',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
      {badge && !active && (
        <span style={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--accent)',
        }} />
      )}
    </button>
  )
})

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
