/**
 * Contract Panel — displays the compiled story contract.
 * Shows boundaries, phase guidelines, and constraint summaries.
 * Click a constraint to signal node highlighting on the canvas.
 */

import { useState, useCallback } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { ReadAloudButton } from './ReadAloudButton.tsx'

interface ContractPanelProps {
  onHighlightNodes?: (nodeIds: string[]) => void
}

export function ContractPanel({ onHighlightNodes }: ContractPanelProps) {
  const contract = useGenerationStore((s) => s.contract)
  const selection = useGenerationStore((s) => s.selection)
  const [expandedSection, setExpandedSection] = useState<string | null>('boundaries')

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section))
  }, [])

  const handleNodeClick = useCallback((nodeIds: string[]) => {
    onHighlightNodes?.(nodeIds)
  }, [onHighlightNodes])

  if (!contract) {
    return (
      <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        No contract available. Run generation first.
      </div>
    )
  }

  const { archetype, genre, global_boundaries, phase_guidelines, validation_policy } = contract

  const getContractText = useCallback(() => {
    const lines: string[] = []
    lines.push(`Story Contract. Archetype: ${archetype.name}. Genre: ${genre.name}.`)
    if (selection) {
      lines.push(`Compatibility: ${selection.compatibility.matrix_classification}.`)
    }
    if (global_boundaries.musts.length > 0) {
      lines.push(`Must include: ${global_boundaries.musts.join('. ')}.`)
    }
    if (global_boundaries.must_nots.length > 0) {
      lines.push(`Must exclude: ${global_boundaries.must_nots.join('. ')}.`)
    }
    if (archetype.spine_nodes.length > 0) {
      lines.push(`Archetype spine has ${archetype.spine_nodes.length} nodes.`)
    }
    if (genre.hard_constraints.length > 0) {
      lines.push(`${genre.hard_constraints.length} hard genre constraints.`)
    }
    if (genre.soft_constraints.length > 0) {
      lines.push(`${genre.soft_constraints.length} soft genre constraints.`)
    }
    if (phase_guidelines.length > 0) {
      lines.push('Phase guidelines:')
      for (const pg of phase_guidelines) {
        lines.push(`${pg.role}: ${pg.definition}`)
      }
    }
    return lines.join('\n\n')
  }, [archetype, genre, global_boundaries, phase_guidelines, selection])

  return (
    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
      {/* Header summary */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 12 }}>Story Contract</span>
          <ReadAloudButton getText={getContractText} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: 'rgba(245,158,11,0.12)',
            color: '#f59e0b',
          }}>
            {archetype.name}
          </span>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 3,
            background: 'rgba(139,92,246,0.12)',
            color: '#8b5cf6',
          }}>
            {genre.name}
          </span>
        </div>
        {selection && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Compatibility: {selection.compatibility.matrix_classification}
            {selection.tone_marker && ` | Tone: ${selection.tone_marker.integration_classification}`}
          </div>
        )}
      </div>

      {/* Boundaries section */}
      <SectionHeader
        label="Global Boundaries"
        expanded={expandedSection === 'boundaries'}
        onClick={() => toggleSection('boundaries')}
        count={global_boundaries.musts.length + global_boundaries.must_nots.length}
      />
      {expandedSection === 'boundaries' && (
        <div style={{ padding: '6px 12px' }}>
          {global_boundaries.musts.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e' }}>Must Include</span>
              {global_boundaries.musts.map((m, i) => (
                <div key={i} style={{ padding: '2px 0', color: 'var(--text-muted)' }}>{m}</div>
              ))}
            </div>
          )}
          {global_boundaries.must_nots.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444' }}>Must Exclude</span>
              {global_boundaries.must_nots.map((m, i) => (
                <div key={i} style={{ padding: '2px 0', color: 'var(--text-muted)' }}>{m}</div>
              ))}
            </div>
          )}
          {global_boundaries.content_limits.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Content Limits</span>
              {global_boundaries.content_limits.map((m, i) => (
                <div key={i} style={{ padding: '2px 0', color: 'var(--text-muted)' }}>{m}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archetype section */}
      <SectionHeader
        label="Archetype Spine"
        expanded={expandedSection === 'archetype'}
        onClick={() => toggleSection('archetype')}
        count={archetype.spine_nodes.length}
      />
      {expandedSection === 'archetype' && (
        <div style={{ padding: '6px 12px' }}>
          {archetype.spine_nodes.map((nodeId) => (
            <div
              key={nodeId}
              onClick={() => handleNodeClick([nodeId])}
              style={{
                padding: '3px 6px',
                margin: '2px 0',
                fontSize: 10,
                fontFamily: 'monospace',
                color: 'var(--accent)',
                cursor: 'pointer',
                borderRadius: 3,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59,130,246,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {nodeId}
            </div>
          ))}
          {archetype.allowed_variants.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                Allowed Variants ({archetype.allowed_variants.length})
              </span>
              {archetype.allowed_variants.map((v) => (
                <div
                  key={v}
                  onClick={() => handleNodeClick([v])}
                  style={{
                    padding: '2px 6px',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Genre constraints section */}
      <SectionHeader
        label="Genre Constraints"
        expanded={expandedSection === 'genre'}
        onClick={() => toggleSection('genre')}
        count={genre.hard_constraints.length + genre.soft_constraints.length}
      />
      {expandedSection === 'genre' && (
        <div style={{ padding: '6px 12px' }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#ef4444' }}>
              Hard ({genre.hard_constraints.length})
            </span>
            {genre.hard_constraints.map((c) => (
              <div
                key={c}
                onClick={() => handleNodeClick([c])}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#ef4444',
                  cursor: 'pointer',
                  borderRadius: 3,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {c}
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>
              Soft ({genre.soft_constraints.length})
            </span>
            {genre.soft_constraints.map((c) => (
              <div
                key={c}
                onClick={() => handleNodeClick([c])}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: '#f59e0b',
                  cursor: 'pointer',
                  borderRadius: 3,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {c}
              </div>
            ))}
          </div>
          {genre.anti_patterns.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
                Anti-Patterns ({genre.anti_patterns.length})
              </span>
              {genre.anti_patterns.map((a) => (
                <div key={a} style={{ padding: '2px 6px', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase guidelines section */}
      <SectionHeader
        label="Phase Guidelines"
        expanded={expandedSection === 'phases'}
        onClick={() => toggleSection('phases')}
        count={phase_guidelines.length}
      />
      {expandedSection === 'phases' && (
        <div style={{ padding: '6px 12px' }}>
          {phase_guidelines.map((pg) => (
            <div
              key={pg.node_id}
              onClick={() => handleNodeClick([pg.node_id, ...pg.genre_obligation_links])}
              style={{
                padding: '6px 8px',
                margin: '3px 0',
                background: 'var(--bg-primary)',
                borderRadius: 4,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 10 }}>{pg.role}</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {pg.node_id}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pg.definition}</div>
              {pg.genre_obligation_links.length > 0 && (
                <div style={{ fontSize: 9, color: 'var(--accent)', marginTop: 2 }}>
                  {pg.genre_obligation_links.length} genre obligations linked
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Validation policy section */}
      <SectionHeader
        label="Validation Policy"
        expanded={expandedSection === 'policy'}
        onClick={() => toggleSection('policy')}
      />
      {expandedSection === 'policy' && (
        <div style={{ padding: '6px 12px' }}>
          <PolicyRow label="Hard constraints" value={validation_policy.hard_constraints_required ? 'Required' : 'Optional'} />
          <PolicyRow label="Anti-patterns" value={validation_policy.anti_patterns_blocking ? 'Blocking' : 'Warning'} />
          <PolicyRow label="Tone check" value={validation_policy.tone_global ? 'Global' : 'Off'} />
          <PolicyRow label="Entry/exit" value={validation_policy.entry_exit_required ? 'Required' : 'Optional'} />
          <PolicyRow label="Signals" value={validation_policy.signals_required} />
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label, expanded, onClick, count }: {
  label: string
  expanded: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-primary)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span>
        {expanded ? '\u25BE' : '\u25B8'} {label}
        {count != null && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 6 }}>({count})</span>
        )}
      </span>
    </button>
  )
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
