/**
 * GraphLegend — collapsible legend overlay showing node role and edge meaning colors.
 * Adapts to archetype vs genre graph type. Highlights the active role/meaning.
 */

import { useState, memo } from 'react'
import { NODE_ROLE_COLORS, NODE_ROLE_SYMBOLS, EDGE_MEANING_COLORS, EDGE_MEANING_STYLES } from '../theme/colors.ts'

// Build role arrays from centralized constants
const ARCHETYPE_ROLE_NAMES = [
  'Origin', 'Catalyst', 'Disruption', 'Threshold', 'Commitment',
  'Trial', 'Escalation', 'Descent', 'Crisis', 'Revelation',
  'Transformation', 'Irreversible Cost', 'Reckoning', 'Resolution',
]
const GENRE_ROLE_NAMES = [
  'Genre Promise', 'Core Constraint', 'Subgenre Pattern',
  'World/Setting Rules', 'Scene Obligations', 'Tone Marker', 'Anti-Pattern',
]
const EDGE_MEANING_NAMES = [
  'Escalation', 'Constraint', 'Revelation', 'Disruption',
  'Transformation', 'Resolution', 'Branching', 'Prohibition',
]

const ARCHETYPE_ROLES = ARCHETYPE_ROLE_NAMES.map((role) => ({
  role, color: NODE_ROLE_COLORS[role] ?? '#64748b', symbol: NODE_ROLE_SYMBOLS[role] ?? '\u25CF',
}))
const GENRE_ROLES = GENRE_ROLE_NAMES.map((role) => ({
  role, color: NODE_ROLE_COLORS[role] ?? '#64748b', symbol: NODE_ROLE_SYMBOLS[role] ?? '\u25CF',
}))
const EDGE_MEANINGS = EDGE_MEANING_NAMES.map((meaning) => ({
  meaning, color: EDGE_MEANING_COLORS[meaning] ?? '#64748b', style: EDGE_MEANING_STYLES[meaning] ?? 'solid',
}))

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
