/**
 * GraphLegend — collapsible legend overlay showing node role and edge meaning colors.
 * Adapts to archetype vs genre graph type. Highlights the active role/meaning.
 */

import { useState, memo } from 'react'

// Canonical role colors — must match DetailPanel.tsx ROLE_COLORS and styles.ts canvas colors
const ARCHETYPE_ROLES: { role: string; color: string; symbol: string }[] = [
  { role: 'Origin', color: '#22c55e', symbol: '\u25B6' },
  { role: 'Catalyst', color: '#06b6d4', symbol: '\u2605' },
  { role: 'Disruption', color: '#f97316', symbol: '\u26A1' },
  { role: 'Threshold', color: '#14b8a6', symbol: '\u2192' },
  { role: 'Commitment', color: '#14b8a6', symbol: '\u2717' },
  { role: 'Trial', color: '#64748b', symbol: '\u2694' },
  { role: 'Escalation', color: '#f97316', symbol: '\u25B2' },
  { role: 'Descent', color: '#6366f1', symbol: '\u25BC' },
  { role: 'Crisis', color: '#dc2626', symbol: '\u26A0' },
  { role: 'Revelation', color: '#3b82f6', symbol: '\u25C9' },
  { role: 'Transformation', color: '#a855f7', symbol: '\u21BB' },
  { role: 'Irreversible Cost', color: '#ef4444', symbol: '\u2718' },
  { role: 'Reckoning', color: '#dc2626', symbol: '\u2696' },
  { role: 'Resolution', color: '#eab308', symbol: '\u2714' },
]

const GENRE_ROLES: { role: string; color: string; symbol: string }[] = [
  { role: 'Genre Promise', color: '#22c55e', symbol: '\u25B6' },
  { role: 'Core Constraint', color: '#f97316', symbol: '\u2717' },
  { role: 'Subgenre Pattern', color: '#3b82f6', symbol: '\u25CB' },
  { role: 'World/Setting Rules', color: '#06b6d4', symbol: '\u2302' },
  { role: 'Scene Obligations', color: '#14b8a6', symbol: '\u25A0' },
  { role: 'Tone Marker', color: '#06b6d4', symbol: '\u266A' },
  { role: 'Anti-Pattern', color: '#ef4444', symbol: '\u2298' },
]

const EDGE_MEANINGS: { meaning: string; color: string; style: string }[] = [
  { meaning: 'Escalation', color: '#f97316', style: 'solid' },
  { meaning: 'Constraint', color: '#3b82f6', style: 'dashed' },
  { meaning: 'Revelation', color: '#60a5fa', style: 'solid' },
  { meaning: 'Disruption', color: '#ef4444', style: 'solid' },
  { meaning: 'Transformation', color: '#a855f7', style: 'solid' },
  { meaning: 'Resolution', color: '#22c55e', style: 'solid' },
  { meaning: 'Branching', color: '#8b5cf6', style: 'dotted' },
  { meaning: 'Prohibition', color: '#dc2626', style: 'dashed' },
]

// Maps raw edge meaning strings to legend category names
// (mirrors MEANING_CATEGORY_MAP in styles.ts but maps to display names)
const MEANING_TO_LEGEND: Record<string, string> = {
  'escalates conflict': 'Escalation',
  'raises cost': 'Escalation',
  'narrows options': 'Constraint',
  'specifies constraint': 'Constraint',
  'narrows scope': 'Constraint',
  'restricts resolution': 'Constraint',
  'reveals truth': 'Revelation',
  'grants insight': 'Revelation',
  'disrupts order': 'Disruption',
  'triggers crisis': 'Disruption',
  'forces commitment': 'Constraint',
  'demands sacrifice': 'Constraint',
  'enables transformation': 'Transformation',
  'restores equilibrium': 'Resolution',
  'tests resolve': 'Escalation',
  'reframes goal': 'Revelation',
  'inverts expectation': 'Revelation',
  'compels return': 'Constraint',
  'branches into subtype': 'Branching',
  'mandates element': 'Constraint',
  'prohibits element': 'Prohibition',
  'inherits constraint': 'Constraint',
  'sets tone': 'Constraint',
  'introduces setting rule': 'Constraint',
  'specializes threat': 'Escalation',
  'differentiates from': 'Branching',
  'requires payoff': 'Constraint',
}

interface GraphLegendProps {
  graphType: 'archetype' | 'genre'
  activeRole?: string | null
  activeEdgeMeaning?: string | null
}

export const GraphLegend = memo(function GraphLegend({ graphType, activeRole, activeEdgeMeaning }: GraphLegendProps) {
  const [open, setOpen] = useState(false)
  const roles = graphType === 'archetype' ? ARCHETYPE_ROLES : GENRE_ROLES

  // Map raw edge meaning to legend category
  const activeLegendMeaning = activeEdgeMeaning ? MEANING_TO_LEGEND[activeEdgeMeaning] ?? null : null

  return (
    <div style={{
      position: 'absolute', top: 8, left: 8, zIndex: 10,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 6, fontSize: 10, maxWidth: 260,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', width: '100%', textAlign: 'left',
          fontWeight: 600, color: 'var(--text-secondary)', fontSize: 10,
          borderRadius: open ? '6px 6px 0 0' : 6,
        }}
      >
        <span style={{ fontSize: 8, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>{'\u25BC'}</span>
        Legend
      </button>

      {open && (
        <div style={{ padding: '4px 10px 8px', borderTop: '1px solid var(--border)' }}>
          {/* Node roles */}
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Nodes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginBottom: 8 }}>
            {roles.map((r) => {
              const isActive = activeRole === r.role
              return (
                <span key={r.role} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  padding: '1px 4px', borderRadius: 3,
                  background: isActive ? `${r.color}25` : 'transparent',
                  outline: isActive ? `1.5px solid ${r.color}` : 'none',
                  opacity: activeRole && !isActive ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                    background: r.color, flexShrink: 0,
                  }} />
                  <span style={{ color: r.color }}>{r.symbol}</span>
                  <span style={{
                    color: isActive ? r.color : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 400,
                  }}>{r.role}</span>
                </span>
              )
            })}
          </div>

          {/* Edge meanings */}
          <div style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
            Edges
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
            {EDGE_MEANINGS.map((e) => {
              const isActive = activeLegendMeaning === e.meaning
              return (
                <span key={e.meaning} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                  padding: '1px 4px', borderRadius: 3,
                  background: isActive ? `${e.color}25` : 'transparent',
                  outline: isActive ? `1.5px solid ${e.color}` : 'none',
                  opacity: activeLegendMeaning && !isActive ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}>
                  <svg width="16" height="8" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="4" x2="16" y2="4" stroke={e.color} strokeWidth="2"
                      strokeDasharray={e.style === 'dashed' ? '4,2' : e.style === 'dotted' ? '2,2' : 'none'} />
                  </svg>
                  <span style={{
                    color: isActive ? e.color : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 400,
                  }}>{e.meaning}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
