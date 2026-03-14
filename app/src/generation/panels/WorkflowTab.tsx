import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import cytoscape from 'cytoscape'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import type { OrchestratorState } from '../artifacts/types.ts'
import type { OrchestratorEvent } from '../engine/orchestrator.ts'

// ---------------------------------------------------------------------------
// Node & edge data for the orchestrator state machine
// ---------------------------------------------------------------------------

interface WfNode {
  id: OrchestratorState
  label: string
  category: string
  description: string
  artifact?: string          // which artifact is produced in this state
  row: number
  col: number
}

const NODES: WfNode[] = [
  { id: 'IDLE',                  label: 'Idle',              category: 'start',      description: 'No generation active',                                         row: 0, col: 0 },
  { id: 'LOADED_CORPUS',         label: 'Load Corpus',       category: 'setup',      description: 'Load archetype + genre graph JSONs',                            row: 0, col: 1 },
  { id: 'SELECTED',              label: 'Select',            category: 'setup',      description: 'Match request to archetype/genre pair',        artifact: 'selection',       row: 0, col: 2 },
  { id: 'CONTRACT_READY',        label: 'Contract',          category: 'setup',      description: 'Compile phase guidelines, constraints, tone rules', artifact: 'contract',  row: 0, col: 3 },
  { id: 'TEMPLATES_COMPILED',    label: 'Templates',         category: 'setup',      description: 'Build beat + genre lookup tables',              artifact: 'templatePack',    row: 0, col: 4 },
  { id: 'BACKBONE_ASSEMBLED',    label: 'Backbone',          category: 'structure',  description: 'Assemble narrative skeleton with beats + chapter partition', artifact: 'backbone', row: 1, col: 0 },
  { id: 'DETAILS_BOUND',         label: 'Bind Details',      category: 'structure',  description: 'Assign characters/places/objects to backbone slots', artifact: 'detailBindings', row: 1, col: 1 },
  { id: 'PLANNED',               label: 'Plan',              category: 'planning',   description: 'Generate scene-by-scene goals and summaries',  artifact: 'plan',            row: 1, col: 2 },
  { id: 'EXPANDING_BEATS',       label: 'Expand Beats',      category: 'generation', description: 'Break scenes into 4–8 micro-beat points',                       row: 2, col: 0 },
  { id: 'GENERATING_BEAT_POINT', label: 'Write Beat Point',  category: 'generation', description: 'LLM writes individual beat point prose',                        row: 2, col: 1 },
  { id: 'GENERATING_SCENE',      label: 'Write Scene',       category: 'generation', description: 'LLM writes full scene prose',                  artifact: 'sceneDrafts',     row: 2, col: 2 },
  { id: 'VALIDATING_SCENE',      label: 'Validate',          category: 'validation', description: 'Check prose against genre constraints',        artifact: 'validation',      row: 2, col: 3 },
  { id: 'REPAIRING_SCENE',       label: 'Repair',            category: 'validation', description: 'LLM revises failed prose (up to 2 retries)',                    row: 2, col: 4 },
  { id: 'CHAPTERS_ASSEMBLED',    label: 'Assemble Chapters', category: 'output',     description: 'Stitch scenes into chapter documents',         artifact: 'chapterManifest', row: 3, col: 0 },
  { id: 'COMPLETED',             label: 'Complete',          category: 'terminal',   description: 'All artifacts ready',                                            row: 3, col: 1 },
]

const NODE_MAP = new Map(NODES.map((n) => [n.id, n]))

interface WfEdge {
  from: OrchestratorState
  to: OrchestratorState
  label: string
}

const EDGES: WfEdge[] = [
  { from: 'IDLE',                  to: 'LOADED_CORPUS',         label: 'start' },
  { from: 'LOADED_CORPUS',         to: 'SELECTED',              label: 'select' },
  { from: 'SELECTED',              to: 'CONTRACT_READY',        label: 'compile' },
  { from: 'CONTRACT_READY',        to: 'TEMPLATES_COMPILED',    label: 'compile templates' },
  { from: 'TEMPLATES_COMPILED',    to: 'BACKBONE_ASSEMBLED',    label: 'assemble' },
  { from: 'BACKBONE_ASSEMBLED',    to: 'DETAILS_BOUND',         label: 'bind' },
  { from: 'DETAILS_BOUND',         to: 'PLANNED',               label: 'plan' },
  { from: 'PLANNED',               to: 'EXPANDING_BEATS',       label: 'expand' },
  { from: 'PLANNED',               to: 'GENERATING_SCENE',      label: 'write' },
  { from: 'EXPANDING_BEATS',       to: 'GENERATING_BEAT_POINT', label: 'write beats' },
  { from: 'GENERATING_BEAT_POINT', to: 'GENERATING_SCENE',      label: 'stitch' },
  { from: 'GENERATING_SCENE',      to: 'VALIDATING_SCENE',      label: 'validate' },
  { from: 'GENERATING_SCENE',      to: 'CHAPTERS_ASSEMBLED',    label: 'skip validation' },
  { from: 'VALIDATING_SCENE',      to: 'REPAIRING_SCENE',       label: 'failed' },
  { from: 'VALIDATING_SCENE',      to: 'CHAPTERS_ASSEMBLED',    label: 'passed' },
  { from: 'REPAIRING_SCENE',       to: 'VALIDATING_SCENE',      label: 're-validate' },
  { from: 'CHAPTERS_ASSEMBLED',    to: 'COMPLETED',             label: 'done' },
]

const EDGE_MAP = new Map(EDGES.map((e, i) => [`e${i}`, e]))

// ---------------------------------------------------------------------------
// Category → color mapping
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  start:      '#22c55e',
  setup:      '#06b6d4',
  structure:  '#f59e0b',
  planning:   '#3b82f6',
  generation: '#a855f7',
  validation: '#f97316',
  output:     '#14b8a6',
  terminal:   '#64748b',
}

// ---------------------------------------------------------------------------
// Pipeline order for visited/future classification
// ---------------------------------------------------------------------------

const ORDER: OrchestratorState[] = [
  'IDLE', 'LOADED_CORPUS', 'SELECTED', 'CONTRACT_READY',
  'TEMPLATES_COMPILED', 'BACKBONE_ASSEMBLED', 'DETAILS_BOUND', 'PLANNED',
  'EXPANDING_BEATS', 'GENERATING_BEAT_POINT', 'GENERATING_SCENE',
  'VALIDATING_SCENE', 'REPAIRING_SCENE', 'CHAPTERS_ASSEMBLED',
  'COMPLETED',
]

// ---------------------------------------------------------------------------
// Artifact names for display
// ---------------------------------------------------------------------------

const ARTIFACT_LABELS: { key: string; label: string }[] = [
  { key: 'request', label: 'Request' },
  { key: 'selection', label: 'Selection' },
  { key: 'contract', label: 'Contract' },
  { key: 'templatePack', label: 'Templates' },
  { key: 'backbone', label: 'Backbone' },
  { key: 'detailBindings', label: 'Details' },
  { key: 'plan', label: 'Plan' },
  { key: 'sceneDrafts', label: 'Scenes' },
  { key: 'validation', label: 'Validation' },
  { key: 'chapterManifest', label: 'Chapters' },
]

// ---------------------------------------------------------------------------
// Build Cytoscape elements
// ---------------------------------------------------------------------------

const COL_SPACING = 180
const ROW_SPACING = 90

function buildElements(): cytoscape.ElementDefinition[] {
  const nodes: cytoscape.ElementDefinition[] = NODES.map((n) => ({
    data: {
      id: n.id,
      label: n.label,
      category: n.category,
      description: n.description,
      color: CATEGORY_COLORS[n.category] ?? '#64748b',
    },
    position: { x: 100 + n.col * COL_SPACING, y: 60 + n.row * ROW_SPACING },
  }))

  const edges: cytoscape.ElementDefinition[] = EDGES.map((e, i) => ({
    data: { id: `e${i}`, source: e.from, target: e.to, label: e.label },
  }))

  return [...nodes, ...edges]
}

// ---------------------------------------------------------------------------
// Selection detail types
// ---------------------------------------------------------------------------

type Selection =
  | { kind: 'node'; id: OrchestratorState }
  | { kind: 'edge'; id: string }
  | null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKB(chars: number): string {
  const kb = chars / 1024
  return kb < 1 ? `${chars} ch` : `${kb.toFixed(1)} KB`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function relativeTime(ts: string, baseTs: string): string {
  const diff = new Date(ts).getTime() - new Date(baseTs).getTime()
  if (diff < 0) return '+0s'
  return `+${(diff / 1000).toFixed(1)}s`
}

/** Compute how many times a from→to transition appeared in the event log. */
function countTransitions(events: OrchestratorEvent[], from: OrchestratorState, to: OrchestratorState): number {
  let count = 0
  for (let i = 1; i < events.length; i++) {
    if (events[i - 1].state === from && events[i].state === to) count++
  }
  return count
}

/** Find last timestamp where a transition from→to occurred. */
function lastTransitionTime(events: OrchestratorEvent[], from: OrchestratorState, to: OrchestratorState): string | null {
  for (let i = events.length - 1; i >= 1; i--) {
    if (events[i - 1].state === from && events[i].state === to) return events[i].timestamp
  }
  return null
}

/** Compute total time spent in a given state from events. */
function timeInState(events: OrchestratorEvent[], state: OrchestratorState): number {
  let total = 0
  let enteredAt: number | null = null
  for (const evt of events) {
    if (evt.state === state && enteredAt === null) {
      enteredAt = new Date(evt.timestamp).getTime()
    } else if (evt.state !== state && enteredAt !== null) {
      total += new Date(evt.timestamp).getTime() - enteredAt
      enteredAt = null
    }
  }
  // If still in this state
  if (enteredAt !== null) {
    total += Date.now() - enteredAt
  }
  return total
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: OrchestratorState }) {
  const colors: Record<string, string> = {
    IDLE: '#64748b', COMPLETED: '#22c55e', FAILED: '#ef4444',
    LOADED_CORPUS: '#06b6d4', SELECTED: '#06b6d4', CONTRACT_READY: '#06b6d4', TEMPLATES_COMPILED: '#06b6d4',
    BACKBONE_ASSEMBLED: '#f59e0b', DETAILS_BOUND: '#f59e0b',
    PLANNED: '#3b82f6',
    EXPANDING_BEATS: '#a855f7', GENERATING_BEAT_POINT: '#a855f7', GENERATING_SCENE: '#a855f7',
    VALIDATING_SCENE: '#f97316', REPAIRING_SCENE: '#f97316',
    CHAPTERS_ASSEMBLED: '#14b8a6',
  }
  const color = colors[status] ?? '#64748b'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: '6px 10px', borderRadius: 4, background: 'var(--bg-primary)',
      border: '1px solid var(--border)', minWidth: 90,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node Detail Panel
// ---------------------------------------------------------------------------

function NodeDetail({ nodeId, events, allEvents }: {
  nodeId: OrchestratorState
  events: OrchestratorEvent[]
  allEvents: OrchestratorEvent[]
}) {
  const node = NODE_MAP.get(nodeId)
  if (!node) return null

  const stateEvents = events.filter((e) => e.state === nodeId)
  const duration = timeInState(allEvents, nodeId)
  const currentIdx = ORDER.indexOf(useGenerationStore.getState().status)
  const nodeIdx = ORDER.indexOf(nodeId)
  const classification = nodeId === useGenerationStore.getState().status ? 'active' : nodeIdx < currentIdx ? 'visited' : 'future'
  const baseTs = allEvents[0]?.timestamp

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 12, height: 12, borderRadius: 2,
          background: CATEGORY_COLORS[node.category] ?? '#64748b',
        }} />
        <strong style={{ color: '#fff', fontSize: 13 }}>{node.label}</strong>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 3,
          background: classification === 'active' ? '#22c55e33' : classification === 'visited' ? '#06b6d422' : '#64748b22',
          color: classification === 'active' ? '#22c55e' : classification === 'visited' ? '#06b6d4' : '#64748b',
        }}>{classification}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{node.category}</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{node.description}</div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
        <span style={{ color: 'var(--text-muted)' }}>Time in state: <strong style={{ color: '#fff' }}>{duration > 0 ? formatDuration(duration) : '—'}</strong></span>
        {node.artifact && (
          <span style={{ color: 'var(--text-muted)' }}>Produces: <strong style={{ color: '#fff' }}>{node.artifact}</strong></span>
        )}
      </div>
      {stateEvents.length > 0 && (
        <div style={{ maxHeight: 100, overflowY: 'auto', fontSize: 10, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {stateEvents.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <span style={{ flexShrink: 0, color: '#64748b' }}>{baseTs ? relativeTime(e.timestamp, baseTs) : ''}</span>
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edge Detail Panel
// ---------------------------------------------------------------------------

function EdgeDetail({ edgeId, allEvents }: { edgeId: string; allEvents: OrchestratorEvent[] }) {
  const edge = EDGE_MAP.get(edgeId)
  if (!edge) return null

  const fromNode = NODE_MAP.get(edge.from)
  const toNode = NODE_MAP.get(edge.to)
  const traversals = countTransitions(allEvents, edge.from, edge.to)
  const lastTime = lastTransitionTime(allEvents, edge.from, edge.to)
  const baseTs = allEvents[0]?.timestamp

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ color: '#fff', fontSize: 13 }}>{edge.label}</strong>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>transition</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <span style={{
          padding: '2px 6px', borderRadius: 3,
          background: (CATEGORY_COLORS[fromNode?.category ?? ''] ?? '#64748b') + '33',
          color: CATEGORY_COLORS[fromNode?.category ?? ''] ?? '#64748b',
        }}>{fromNode?.label ?? edge.from}</span>
        <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
        <span style={{
          padding: '2px 6px', borderRadius: 3,
          background: (CATEGORY_COLORS[toNode?.category ?? ''] ?? '#64748b') + '33',
          color: CATEGORY_COLORS[toNode?.category ?? ''] ?? '#64748b',
        }}>{toNode?.label ?? edge.to}</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
        <span style={{ color: 'var(--text-muted)' }}>Traversals: <strong style={{ color: '#fff' }}>{traversals}</strong></span>
        {lastTime && baseTs && (
          <span style={{ color: 'var(--text-muted)' }}>Last at: <strong style={{ color: '#fff' }}>{relativeTime(lastTime, baseTs)}</strong></span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WorkflowTab() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  // Store subscriptions
  const status = useGenerationStore((s) => s.status)
  const running = useGenerationStore((s) => s.running)
  const chapterRunning = useGenerationStore((s) => s.chapterRunning)
  const mode = useGenerationStore((s) => s.mode)
  const error = useGenerationStore((s) => s.error)
  const chapterError = useGenerationStore((s) => s.chapterError)
  const events = useGenerationStore((s) => s.events)
  const chapterEvents = useGenerationStore((s) => s.chapterEvents)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)
  const chapterLlmTelemetry = useGenerationStore((s) => s.chapterLlmTelemetry)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const request = useGenerationStore((s) => s.request)
  const selection = useGenerationStore((s) => s.selection)
  const contract = useGenerationStore((s) => s.contract)
  const templatePack = useGenerationStore((s) => s.templatePack)
  const backbone = useGenerationStore((s) => s.backbone)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const plan = useGenerationStore((s) => s.plan)
  const validation = useGenerationStore((s) => s.validation)
  const chapterManifest = useGenerationStore((s) => s.chapterManifest)

  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const llmBackend = useRequestStore((s) => s.llmBackend)
  const bridgeStatus = useRequestStore((s) => s.bridgeStatus)

  // Selection state
  const [sel, setSel] = useState<Selection>(null)

  // Elapsed time counter
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running && !chapterRunning) { setElapsed(0); return }
    const allEvts = [...events, ...chapterEvents]
    if (allEvts.length === 0) return
    const start = new Date(allEvts[0].timestamp).getTime()
    setElapsed(Date.now() - start)
    const id = setInterval(() => setElapsed(Date.now() - start), 1000)
    return () => clearInterval(id)
  }, [running, chapterRunning, events, chapterEvents])

  // Merged events for feed + detail
  const allEvents = useMemo(() => {
    const merged = [...events, ...chapterEvents]
    merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    return merged
  }, [events, chapterEvents])

  // Merged telemetry
  const allTelemetry = useMemo(() => [...llmTelemetry, ...chapterLlmTelemetry], [llmTelemetry, chapterLlmTelemetry])

  // LLM aggregate stats
  const llmStats = useMemo(() => {
    const ok = allTelemetry.filter((t) => t.status === 'success')
    const errs = allTelemetry.filter((t) => t.status === 'error')
    const totalInput = allTelemetry.reduce((s, t) => s + t.inputChars, 0)
    const totalOutput = ok.reduce((s, t) => s + (t.outputChars ?? 0), 0)
    const totalMs = ok.reduce((s, t) => s + (t.durationMs ?? 0), 0)
    const avgMs = ok.length > 0 ? totalMs / ok.length : 0
    const throughput = totalMs > 0 ? (totalOutput / totalMs) * 1000 : 0
    return { calls: allTelemetry.length, ok: ok.length, errs: errs.length, totalInput, totalOutput, totalMs, avgMs, throughput }
  }, [allTelemetry])

  // Artifact presence map
  const artifactPresent: Record<string, boolean | string> = useMemo(() => ({
    request: !!request,
    selection: !!selection,
    contract: !!contract,
    templatePack: !!templatePack,
    backbone: !!backbone,
    detailBindings: !!detailBindings,
    plan: !!plan,
    sceneDrafts: sceneDrafts.size > 0,
    validation: !!validation,
    chapterManifest: !!chapterManifest,
  }), [request, selection, contract, templatePack, backbone, detailBindings, plan, sceneDrafts, validation, chapterManifest])

  // Auto-scroll event feed
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight
  }, [allEvents.length])

  // Cytoscape click handler
  const handleSelect = useCallback((sel: Selection) => setSel(sel), [])

  // Mount / unmount Cytoscape
  useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(),
      layout: { name: 'preset', padding: 30 },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            color: '#fff',
            'font-size': 11,
            'font-weight': 600,
            width: 130,
            height: 40,
            shape: 'round-rectangle',
            'background-color': 'data(color)',
            'border-width': 0,
            'text-wrap': 'wrap',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'node.active',
          style: {
            'border-width': 3,
            'border-color': '#fff',
            'border-opacity': 1,
            'shadow-blur': 16,
            'shadow-color': '#fff',
            'shadow-opacity': 0.6,
            'shadow-offset-x': 0,
            'shadow-offset-y': 0,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node.visited',
          style: { opacity: 1, 'border-width': 2, 'border-color': '#22c55e' },
        },
        {
          selector: 'node.future',
          style: { opacity: 0.4 },
        },
        {
          selector: 'node.selected-node',
          style: { 'border-width': 3, 'border-color': '#facc15' },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 8,
            color: '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
            'text-background-color': '#1e293b',
            'text-background-opacity': 0.8,
            'text-background-padding': 2 as unknown as string,
          },
        },
        {
          selector: 'edge.selected-edge',
          style: { width: 3, 'line-color': '#facc15', 'target-arrow-color': '#facc15' },
        },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: true,
    })

    // Click node
    cy.on('tap', 'node', (evt) => {
      handleSelect({ kind: 'node', id: evt.target.id() as OrchestratorState })
    })
    // Click edge
    cy.on('tap', 'edge', (evt) => {
      handleSelect({ kind: 'edge', id: evt.target.id() })
    })
    // Click background — deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) handleSelect(null)
    })

    cyRef.current = cy
    return () => { cy.removeAllListeners(); cy.destroy(); cyRef.current = null }
  }, [handleSelect])

  // Highlight current orchestrator state
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    const currentIdx = ORDER.indexOf(status)
    cy.nodes().forEach((node) => {
      node.removeClass('active visited future')
      const nodeIdx = ORDER.indexOf(node.id() as OrchestratorState)
      if (node.id() === status) node.addClass('active')
      else if (currentIdx >= 0 && nodeIdx >= 0 && nodeIdx < currentIdx) node.addClass('visited')
      else node.addClass('future')
    })
  }, [status])

  // Highlight selection in graph
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().removeClass('selected-node')
    cy.edges().removeClass('selected-edge')
    if (sel?.kind === 'node') cy.getElementById(sel.id).addClass('selected-node')
    if (sel?.kind === 'edge') cy.getElementById(sel.id).addClass('selected-edge')
  }, [sel])

  // Feed entries (last 20)
  const feedEntries = useMemo(() => allEvents.slice(-20), [allEvents])
  const baseTs = allEvents[0]?.timestamp ?? ''

  const anyError = error || chapterError

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0, overflow: 'hidden' }}>
      {/* ── Pipeline Graph ── */}
      <div ref={containerRef} style={{ flexShrink: 0, height: 340, background: '#0f172a', borderRadius: '6px 6px 0 0' }} />

      {/* ── Dashboard ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: 'var(--bg-surface)', padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Selection Detail Panel */}
        {sel && (
          <div style={{
            padding: 10, borderRadius: 4, background: '#1e293b', border: '1px solid #facc1544',
            position: 'relative',
          }}>
            <button
              onClick={() => setSel(null)}
              style={{
                position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
                color: '#64748b', cursor: 'pointer', fontSize: 14, lineHeight: 1,
              }}
            >&times;</button>
            {sel.kind === 'node' && <NodeDetail nodeId={sel.id} events={allEvents} allEvents={allEvents} />}
            {sel.kind === 'edge' && <EdgeDetail edgeId={sel.id} allEvents={allEvents} />}
          </div>
        )}

        {/* Run Summary Strip */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 11 }}>
          <StatusBadge status={status} />
          <span style={{ color: 'var(--text-muted)' }}>Mode: <strong style={{ color: '#fff' }}>{mode}</strong></span>
          {(archetype || genre) && (
            <span style={{ color: 'var(--text-muted)' }}>{archetype}{archetype && genre ? ' + ' : ''}{genre}</span>
          )}
          {(running || chapterRunning) && (
            <span style={{ color: '#f59e0b' }}>Elapsed: {formatDuration(elapsed)}</span>
          )}
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            LLM: <strong style={{ color: bridgeStatus === 'connected' ? '#22c55e' : '#64748b' }}>{llmBackend}{llmBackend !== 'none' ? ` (${bridgeStatus})` : ''}</strong>
          </span>
        </div>

        {/* Error banner */}
        {anyError && (
          <div style={{ padding: '6px 10px', borderRadius: 4, background: '#ef444422', border: '1px solid #ef444444', color: '#fca5a5', fontSize: 11 }}>
            {anyError}
          </div>
        )}

        {/* Artifact Progress */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ARTIFACT_LABELS.map(({ key, label }) => {
            const present = !!artifactPresent[key]
            const count = key === 'sceneDrafts' && present ? `(${sceneDrafts.size})` :
                          key === 'chapterManifest' && chapterManifest ? `(${chapterManifest.chapters.length})` : ''
            return (
              <span key={key} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                padding: '2px 8px', borderRadius: 3, fontSize: 10, fontWeight: 500,
                background: present ? '#22c55e22' : 'transparent',
                color: present ? '#22c55e' : '#64748b',
                border: `1px solid ${present ? '#22c55e44' : '#64748b33'}`,
              }}>
                {present ? '\u2713' : '\u25CB'} {label} {count}
              </span>
            )
          })}
        </div>

        {/* LLM Metrics + Event Feed side by side */}
        <div style={{ display: 'flex', gap: 10, minHeight: 0 }}>
          {/* LLM Metrics */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start', flexShrink: 0 }}>
            <StatCard label="LLM Calls" value={`${llmStats.ok}`} sub={llmStats.errs > 0 ? `${llmStats.errs} errors` : undefined} />
            <StatCard label="Input" value={formatKB(llmStats.totalInput)} />
            <StatCard label="Output" value={formatKB(llmStats.totalOutput)} />
            <StatCard label="Avg Latency" value={llmStats.avgMs > 0 ? formatDuration(llmStats.avgMs) : '—'} />
            <StatCard label="Total LLM Time" value={llmStats.totalMs > 0 ? formatDuration(llmStats.totalMs) : '—'} />
            <StatCard label="Throughput" value={llmStats.throughput > 0 ? `${llmStats.throughput.toFixed(0)} ch/s` : '—'} />
          </div>

          {/* Live Event Feed */}
          <div ref={feedRef} style={{
            flex: 1, minWidth: 0, maxHeight: 160, overflowY: 'auto',
            background: 'var(--bg-primary)', borderRadius: 4, border: '1px solid var(--border)',
            padding: 6, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {feedEntries.length === 0 && (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>No events yet</span>
            )}
            {feedEntries.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.4 }}>
                <span style={{ flexShrink: 0, color: '#64748b', minWidth: 44, textAlign: 'right' }}>
                  {baseTs ? relativeTime(e.timestamp, baseTs) : ''}
                </span>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                  background: CATEGORY_COLORS[NODE_MAP.get(e.state)?.category ?? ''] ?? '#64748b',
                }} />
                <span style={{ color: 'var(--text-muted)' }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {cat}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
