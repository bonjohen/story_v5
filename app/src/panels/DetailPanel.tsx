/**
 * Detail Panel — right sidebar showing full node/edge metadata.
 * Enhanced with role badges, collapsible sections, and trace controls.
 */

import { useState } from 'react'
import { useGraphStore } from '../store/graphStore.ts'
import { ConstraintChecklist } from './ConstraintChecklist.tsx'
import type { GraphNode, GraphEdge } from '../types/graph.ts'

const toArr = (v: string | string[]) => (Array.isArray(v) ? v : [v])

/** Color map for archetype node roles */
const ROLE_COLORS: Record<string, string> = {
  'Origin': '#22c55e',
  'Disruption': '#ef4444',
  'Commitment': '#f59e0b',
  'Catalyst': '#f97316',
  'Threshold': '#8b5cf6',
  'Trial': '#3b82f6',
  'Escalation': '#f97316',
  'Crisis': '#ef4444',
  'Descent': '#dc2626',
  'Transformation': '#a855f7',
  'Revelation': '#06b6d4',
  'Irreversible Cost': '#dc2626',
  'Resolution': '#22c55e',
  'Reckoning': '#eab308',
  // Genre roles
  'Genre Promise': '#3b82f6',
  'Core Constraint': '#f59e0b',
  'Subgenre Pattern': '#8b5cf6',
  'World/Setting Rules': '#06b6d4',
  'Scene Obligations': '#22c55e',
  'Tone Marker': '#06b6d4',
  'Anti-Pattern': '#ef4444',
}

/** Color map for edge meanings */
const MEANING_COLORS: Record<string, string> = {
  'Escalation': '#f97316',
  'Constraint': '#3b82f6',
  'Revelation': '#06b6d4',
  'Disruption': '#ef4444',
  'Transformation': '#a855f7',
  'Resolution': '#22c55e',
  'Branching': '#8b5cf6',
  'Prohibition': '#dc2626',
  'Refinement': '#3b82f6',
  'Narrows': '#f59e0b',
  'Requires': '#ef4444',
  'Forbids': '#dc2626',
}

interface DetailPanelProps {
  node?: GraphNode | null
  edge?: GraphEdge | null
  onTraceForward?: () => void
  onTraceBackward?: () => void
  onClearTrace?: () => void
  traceActive?: 'forward' | 'backward' | null
  graph?: import('../graph-engine/index.ts').NormalizedGraph | null
}

export function DetailPanel({
  node,
  edge,
  onTraceForward,
  onTraceBackward,
  onClearTrace,
  traceActive,
  graph,
}: DetailPanelProps) {
  const clearSelection = useGraphStore((s) => s.clearSelection)

  if (!node && !edge) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header with close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}>
          {node ? 'Node Detail' : 'Edge Detail'}
        </span>
        <button
          onClick={clearSelection}
          aria-label="Close detail panel"
          style={{ fontSize: 16, color: 'var(--text-muted)', padding: '0 4px' }}
        >
          {'\u00D7'}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 14px', flex: 1, overflowY: 'auto' }}>
        {node && <NodeDetail node={node} onTraceForward={onTraceForward} onTraceBackward={onTraceBackward} onClearTrace={onClearTrace} traceActive={traceActive} />}
        {edge && <EdgeDetail edge={edge} />}
        {node && graph && graph.graph.type === 'genre' && (
          <ConstraintChecklist graph={graph} selectedNodeId={node.node_id} />
        )}
      </div>
    </div>
  )
}

function NodeDetail({ node, onTraceForward, onTraceBackward, onClearTrace, traceActive }: {
  node: GraphNode
  onTraceForward?: () => void
  onTraceBackward?: () => void
  onClearTrace?: () => void
  traceActive?: 'forward' | 'backward' | null
}) {
  const roleColor = ROLE_COLORS[node.role] ?? 'var(--text-muted)'

  return (
    <>
      {/* Title + role badge */}
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
        {node.label}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: roleColor,
          background: `${roleColor}18`,
          padding: '2px 8px',
          borderRadius: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {node.role}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {node.node_id}
        </span>
      </div>

      {/* Definition */}
      <p style={{ fontSize: 12, marginBottom: 14, lineHeight: 1.65, color: 'var(--text-primary)' }}>
        {node.definition}
      </p>

      {/* Trace controls */}
      {(onTraceForward || onTraceBackward) && (
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}>
          <TraceButton
            label="Trace Forward"
            icon={'\u2192'}
            active={traceActive === 'forward'}
            onClick={traceActive === 'forward' ? onClearTrace : onTraceForward}
          />
          <TraceButton
            label="Trace Backward"
            icon={'\u2190'}
            active={traceActive === 'backward'}
            onClick={traceActive === 'backward' ? onClearTrace : onTraceBackward}
          />
        </div>
      )}

      {/* Collapsible sections */}
      <CollapsibleSection title="Entry Conditions" items={toArr(node.entry_conditions)} />
      <CollapsibleSection title="Exit Conditions" items={toArr(node.exit_conditions)} />
      <CollapsibleSection title="Failure Modes" items={toArr(node.failure_modes)} warn />
      <CollapsibleSection title="Signals in Text" items={toArr(node.signals_in_text)} />
      <CollapsibleSection title="Typical Variants" items={toArr(node.typical_variants)} />
    </>
  )
}

function EdgeDetail({ edge }: { edge: GraphEdge }) {
  const meaningColor = MEANING_COLORS[edge.meaning] ?? 'var(--text-muted)'

  return (
    <>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
        {edge.label}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: meaningColor,
          background: `${meaningColor}18`,
          padding: '2px 8px',
          borderRadius: 3,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {edge.meaning}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {edge.edge_id}
        </span>
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        marginBottom: 14,
        fontFamily: 'monospace',
      }}>
        {edge.from} {'\u2192'} {edge.to}
      </div>

      <CollapsibleSection title="Preconditions" items={toArr(edge.preconditions)} />
      <CollapsibleSection title="Effects on Stakes" items={toArr(edge.effects_on_stakes)} />
      <CollapsibleSection title="Effects on Character" items={toArr(edge.effects_on_character)} />
      <CollapsibleSection title="Common Alternatives" items={toArr(edge.common_alternatives)} />
      <CollapsibleSection title="Anti-Patterns" items={toArr(edge.anti_patterns)} warn />
    </>
  )
}

function TraceButton({ label, icon, active, onClick }: {
  label: string
  icon: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 4,
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
    >
      {icon} {active ? `Clear ${label.split(' ')[1]}` : label}
    </button>
  )
}

function CollapsibleSection({ title, items, warn }: {
  title: string
  items: string[]
  warn?: boolean
}) {
  const [open, setOpen] = useState(true)
  const filtered = items.filter((item) => item && item.trim())
  if (filtered.length === 0) return null

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${title}: ${filtered.length} items`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          textAlign: 'left',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: warn ? '#f59e0b' : 'var(--text-muted)',
          marginBottom: open ? 4 : 0,
          padding: '2px 0',
        }}
      >
        <span style={{
          fontSize: 8,
          transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          {'\u25B6'}
        </span>
        {title} ({filtered.length})
      </button>
      {open && (
        <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.65 }}>
          {filtered.map((item, i) => (
            <li key={i} style={{ color: warn ? '#fbbf24' : 'var(--text-primary)' }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * Edge Tooltip — shown on edge hover in the canvas.
 */
export function EdgeTooltip({ edge, position }: {
  edge: GraphEdge
  position: { x: number; y: number }
}) {
  const meaningColor = MEANING_COLORS[edge.meaning] ?? 'var(--text-muted)'

  return (
    <div style={{
      position: 'fixed',
      left: position.x + 12,
      top: position.y - 8,
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '10px 12px',
      maxWidth: 320,
      zIndex: 100,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      animation: 'fadeIn 0.15s ease',
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{edge.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          color: meaningColor,
          background: `${meaningColor}18`,
          padding: '1px 6px',
          borderRadius: 2,
          textTransform: 'uppercase',
        }}>
          {edge.meaning}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {edge.from} {'\u2192'} {edge.to}
        </span>
      </div>
      <TooltipList title="Preconditions" items={toArr(edge.preconditions)} />
      <TooltipList title="Effects on Stakes" items={toArr(edge.effects_on_stakes)} />
      <TooltipList title="Effects on Character" items={toArr(edge.effects_on_character)} />
      <TooltipList title="Alternatives" items={toArr(edge.common_alternatives)} />
      <TooltipList title="Anti-Patterns" items={toArr(edge.anti_patterns)} warn />
    </div>
  )
}

function TooltipList({ title, items, warn }: { title: string; items: string[]; warn?: boolean }) {
  const filtered = items.filter((s) => s && s.trim())
  if (filtered.length === 0) return null
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: warn ? '#f59e0b' : 'var(--text-muted)',
        marginBottom: 2,
      }}>
        {title}
      </div>
      {filtered.map((item, i) => (
        <div key={i} style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-primary)', paddingLeft: 6 }}>
          {'\u2022'} {item}
        </div>
      ))}
    </div>
  )
}
