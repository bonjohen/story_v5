/**
 * Detail Panel — right sidebar showing full node/edge metadata.
 * Enhanced with role badges, collapsible sections, and trace controls.
 */

import { memo } from 'react'
import { useGraphStore } from '../store/graphStore.ts'
import { ConstraintChecklist } from './ConstraintChecklist.tsx'
import { Disclosure } from '../components/Disclosure.tsx'
import { toArray } from '../utils/arrays.ts'
import { NODE_ROLE_COLORS, NODE_ROLE_SYMBOLS, EDGE_MEANING_COLORS, UI_COLORS } from '../theme/colors.ts'
import type { GraphNode, GraphEdge } from '../types/graph.ts'
import type { NormalizedGraph } from '../graph-engine/index.ts'

const ROLE_SYMBOLS = NODE_ROLE_SYMBOLS
const ROLE_COLORS = NODE_ROLE_COLORS

const MEANING_COLORS = EDGE_MEANING_COLORS

interface DetailPanelProps {
  node?: GraphNode | null
  edge?: GraphEdge | null
  onTraceForward?: () => void
  onTraceBackward?: () => void
  onClearTrace?: () => void
  traceActive?: 'forward' | 'backward' | null
  graph?: NormalizedGraph | null
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

  const graphName = graph?.graph.name ?? 'Unknown'
  const graphType = graph?.graph.type === 'genre' ? 'Genre' : 'Archetype'
  const graphTypeColor = graph?.graph.type === 'genre' ? UI_COLORS.genre : UI_COLORS.archetype

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header with graph info and close button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {graph && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: graphTypeColor,
                background: `${graphTypeColor}18`,
                padding: '1px 6px',
                borderRadius: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {graphType}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}>
                {graphName}
              </span>
            </div>
          )}
          <span style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}>
            {node ? 'Node' : 'Edge'}
          </span>
        </div>
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
          {ROLE_SYMBOLS[node.role] ?? '\u25CF'} {node.role}
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
      <CollapsibleSection title="Entry Conditions" items={toArray(node.entry_conditions)} />
      <CollapsibleSection title="Exit Conditions" items={toArray(node.exit_conditions)} />
      <CollapsibleSection title="Failure Modes" items={toArray(node.failure_modes)} warn />
      <CollapsibleSection title="Signals in Text" items={toArray(node.signals_in_text)} />
      <CollapsibleSection title="Typical Variants" items={toArray(node.typical_variants)} />
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

      <CollapsibleSection title="Preconditions" items={toArray(edge.preconditions)} />
      <CollapsibleSection title="Effects on Stakes" items={toArray(edge.effects_on_stakes)} />
      <CollapsibleSection title="Effects on Character" items={toArray(edge.effects_on_character)} />
      <CollapsibleSection title="Common Alternatives" items={toArray(edge.common_alternatives)} />
      <CollapsibleSection title="Anti-Patterns" items={toArray(edge.anti_patterns)} warn />
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
  const filtered = items.filter((item) => item && item.trim())
  if (filtered.length === 0) return null

  return (
    <Disclosure title={title} badge={filtered.length} persistKey={`detail-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.65, padding: '0 12px 4px 28px' }}>
        {filtered.map((item, i) => (
          <li key={i} style={{ color: warn ? UI_COLORS.warning : 'var(--text-primary)' }}>
            {item}
          </li>
        ))}
      </ul>
    </Disclosure>
  )
}

/**
 * Edge Tooltip — shown on edge hover in the canvas.
 */
export const EdgeTooltip = memo(function EdgeTooltip({ edge, position }: {
  edge: GraphEdge
  position: { x: number; y: number }
}) {
  const meaningColor = MEANING_COLORS[edge.meaning] ?? 'var(--text-muted)'

  return (
    <div
      role="tooltip"
      aria-label={`Edge: ${edge.label}, meaning: ${edge.meaning}`}
      style={{
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
      }}
    >
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
      <TooltipList title="Preconditions" items={toArray(edge.preconditions)} />
      <TooltipList title="Effects on Stakes" items={toArray(edge.effects_on_stakes)} />
      <TooltipList title="Effects on Character" items={toArray(edge.effects_on_character)} />
      <TooltipList title="Alternatives" items={toArray(edge.common_alternatives)} />
      <TooltipList title="Anti-Patterns" items={toArray(edge.anti_patterns)} warn />
    </div>
  )
})

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
