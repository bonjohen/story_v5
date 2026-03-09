import { useEffect, useRef, useState, memo } from 'react'
import { useLocation } from 'react-router-dom'
import { SettingsPanel } from './components/SettingsPanel.tsx'
import { ExportPanel } from './panels/ExportPanel.tsx'
import { AppShellBar } from './components/AppShell.tsx'
import { GraphViewer } from './components/GraphViewer.tsx'
import { useUIStore } from './store/uiStore.ts'
import { PipelineTab } from './generation/panels/PipelineTab.tsx'
import { StorySetupTab } from './generation/panels/StorySetupTab.tsx'
import { ElementsTab } from './generation/panels/ElementsTab.tsx'
import { AnalysisTab } from './generation/panels/AnalysisTab.tsx'
import { GenerateTab } from './generation/panels/GenerateTab.tsx'
import { useGraphStore } from './store/graphStore.ts'
import { useSettingsStore } from './store/settingsStore.ts'
import { useGenerationStore } from './generation/store/generationStore.ts'
import { useDbInit } from './db/useDbInit.ts'
import { useRequestStore } from './generation/store/requestStore.ts'
import { nameToDir } from './generation/panels/generationConstants.ts'
import { loadPremiseLookup, lookupPremise } from './generation/engine/premiseLookup.ts'
import type { DataManifest } from './types/graph.ts'


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
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const loading = useGraphStore((s) => s.loading)
  const error = useGraphStore((s) => s.error)
  const loadGraph = useGraphStore((s) => s.loadGraph)
  const setManifest = useGraphStore((s) => s.setManifest)
  const selectNode = useGraphStore((s) => s.selectNode)

  // Settings
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  // UI preferences
  const genPanelOpen = useUIStore((s) => s.genPanelOpen)
  const toggleGenPanel = useUIStore((s) => s.toggleGenPanel)

  // Generation state
  const genStatus = useGenerationStore((s) => s.status)
  const genSceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const genBackbone = useGenerationStore((s) => s.backbone)

  // Database init
  const dbStatus = useDbInit()

  // UI state
  const [showExport, setShowExport] = useState(false)
  const exportCyRef = useRef(null)
  const [genTab, setGenTab] = useState<'pipeline' | 'setup' | 'elements' | 'graph' | 'analysis' | 'generate'>('setup')
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])


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

  // Initialize default archetype/genre graphs and premise on first manifest load.
  // This ensures everything works regardless of which tab the user visits first.
  const defaultsInitialized = useRef(false)
  useEffect(() => {
    if (defaultsInitialized.current) return
    const manifest = useGraphStore.getState().manifest
    if (!manifest) return
    defaultsInitialized.current = true

    const { archetype, genre } = useRequestStore.getState()
    const archDir = nameToDir(archetype, manifest.archetypes)
    if (archDir) void useGraphStore.getState().loadArchetypeGraph(archDir)
    const genDir = nameToDir(genre, manifest.genres)
    if (genDir) void useGraphStore.getState().loadGenreGraph(genDir)

    // Load premise/tone for default selections
    loadPremiseLookup().then((map) => {
      const { archetype: a, genre: g, premise } = useRequestStore.getState()
      // Only apply if premise is still empty (user hasn't typed anything)
      if (!premise.trim()) {
        const entry = lookupPremise(map, a, g)
        if (entry) {
          useRequestStore.getState().setPremise(entry.premise)
          useRequestStore.getState().setTone(entry.tone)
        }
      }
    }).catch(() => {})
  })

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
          cyRef={exportCyRef}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Main layout: Generation panel (left) + graph viewer (center) */}
      <div className="main-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Generation panel — always full width */}
        {genPanelOpen && <div className="gen-panel" style={{
          width: '100%',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* 6 fixed generation tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <GenTab label="Setup" active={genTab === 'setup'} onClick={() => setGenTab('setup')} highlight />
            <GenTab label="Elements" active={genTab === 'elements'} onClick={() => setGenTab('elements')} badge={!!genBackbone} />
            <GenTab label="Graph" active={genTab === 'graph'} onClick={() => setGenTab('graph')} badge={!!currentGraph} />
            <GenTab label="Analysis" active={genTab === 'analysis'} onClick={() => setGenTab('analysis')} />
            <GenTab label="Generate" active={genTab === 'generate'} onClick={() => setGenTab('generate')} badge={genSceneDrafts.size > 0 || (genStatus !== 'IDLE' && genStatus !== 'COMPLETED' && genStatus !== 'FAILED')} />
            <GenTab label="Pipeline" active={genTab === 'pipeline'} onClick={() => setGenTab('pipeline')} />
          </div>
          <div style={{ flex: 1, overflowY: genTab === 'graph' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {genTab === 'setup' && <StorySetupTab />}
            {genTab === 'elements' && <ElementsTab />}
            {genTab === 'graph' && <GraphViewer genHighlightNodes={genHighlightNodes} />}
            {genTab === 'analysis' && <AnalysisTab onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'generate' && <GenerateTab onHighlightNodes={setGenHighlightNodes} />}
            {genTab === 'pipeline' && <PipelineTab />}
          </div>
        </div>}

        {/* Prompt to open panel when closed */}
        {!genPanelOpen && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, background: 'var(--bg-surface)' }}>
            Click Generate to open the panel
          </div>
        )}
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
