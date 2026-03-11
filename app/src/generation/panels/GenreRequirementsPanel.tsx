/**
 * GenreRequirementsPanel — displays genre element constraints
 * (characters, relationships, places, objects, rules) from elementStore.
 */

import { useEffect } from 'react'
import { useElementStore } from '../../store/elementStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import { ENTITY_COLORS, SEVERITY_COLORS } from '../../theme/colors.ts'

const COLORS = ENTITY_COLORS

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  required: { bg: `${SEVERITY_COLORS.required}26`, text: SEVERITY_COLORS.required },
  recommended: { bg: `${SEVERITY_COLORS.recommended}26`, text: SEVERITY_COLORS.recommended },
  optional: { bg: `${SEVERITY_COLORS.optional}26`, text: SEVERITY_COLORS.optional },
}

function SeverityBadge({ severity }: { severity: string }) {
  const style = SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.optional
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px',
      borderRadius: 3, background: style.bg, color: style.text,
    }}>
      {severity}
    </span>
  )
}

function borderColor(severity: string) {
  return severity === 'required' ? '#ef4444' : severity === 'recommended' ? '#f59e0b' : '#6b7280'
}

export function GenreRequirementsPanel() {
  const genreDir = useGraphStore((s) => s.genreDir)
  const loadGenreConstraints = useElementStore((s) => s.loadGenreConstraints)
  const genreConstraints = useElementStore((s) => s.genreConstraints)
  const constraints = genreDir ? genreConstraints.get(genreDir) ?? null : null

  useEffect(() => {
    if (genreDir) void loadGenreConstraints(genreDir)
  }, [genreDir, loadGenreConstraints])

  if (!constraints) {
    return <p style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px' }}>Select a genre to see requirements.</p>
  }

  const total = constraints.character_constraints.length
    + constraints.relationship_constraints.length
    + constraints.place_constraints.length
    + constraints.object_constraints.length
    + constraints.element_rules.length

  if (total === 0) {
    return <p style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px' }}>No genre requirements found.</p>
  }

  return (
    <div style={{ padding: '4px 8px' }}>
      {/* Character constraints */}
      {constraints.character_constraints.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Characters</div>
          {constraints.character_constraints.map((c) => (
            <div key={c.role} style={{
              padding: '4px 8px', marginBottom: 3, background: `${COLORS.character}08`, borderRadius: 3,
              borderLeft: `2px solid ${borderColor(c.severity)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.character }}>{String(c.role).replace(/_/g, ' ')}</span>
                <SeverityBadge severity={c.severity} />
                {c.min_count != null && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>min {c.min_count}</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Relationship constraints */}
      {constraints.relationship_constraints.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Relationships</div>
          {constraints.relationship_constraints.map((r) => (
            <div key={r.type} style={{
              padding: '4px 8px', marginBottom: 3, background: `${COLORS.relationship}08`, borderRadius: 3,
              borderLeft: `2px solid ${borderColor(r.severity)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.relationship }}>{String(r.type).replace(/_/g, ' ')}</span>
                <SeverityBadge severity={r.severity} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.description}</div>
              {r.between_roles && (
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                  Between: {r.between_roles.join(' \u2194 ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Place constraints */}
      {constraints.place_constraints.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Places</div>
          {constraints.place_constraints.map((p) => (
            <div key={p.type} style={{
              padding: '4px 8px', marginBottom: 3, background: `${COLORS.place}08`, borderRadius: 3,
              borderLeft: `2px solid ${borderColor(p.severity)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.place }}>{String(p.type).replace(/_/g, ' ')}</span>
                <SeverityBadge severity={p.severity} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Object constraints */}
      {constraints.object_constraints.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Objects</div>
          {constraints.object_constraints.map((o) => (
            <div key={o.type} style={{
              padding: '4px 8px', marginBottom: 3, background: `${COLORS.object}08`, borderRadius: 3,
              borderLeft: `2px solid ${borderColor(o.severity)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.object }}>{String(o.type).replace(/_/g, ' ')}</span>
                <SeverityBadge severity={o.severity} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{o.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Element rules */}
      {constraints.element_rules.length > 0 && (
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Rules</div>
          {constraints.element_rules.map((rule) => (
            <div key={rule.rule_id} style={{
              marginBottom: 6, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4,
              borderLeft: `2px solid ${borderColor(rule.severity)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rule.rule_id}</span>
                <SeverityBadge severity={rule.severity} />
                <span style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{rule.applies_to}</span>
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-primary)' }}>{rule.description}</div>
              <div style={{ fontSize: 10, lineHeight: 1.4, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>
                Test: {rule.testable_condition}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
