/**
 * Shared styles and helpers for instance editor panels.
 */

export const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export const INPUT: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '6px 8px',
  fontSize: 12,
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  boxSizing: 'border-box',
}

export const CARD: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '10px 12px',
  marginBottom: 6,
  cursor: 'pointer',
  transition: 'border-color 0.15s',
}

export const CARD_SELECTED: React.CSSProperties = {
  ...CARD,
  borderColor: 'var(--accent)',
}

export const BADGE_STYLE = (color: string): React.CSSProperties => ({
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  color,
  background: `${color}1a`,
  padding: '1px 6px',
  borderRadius: 3,
})

export const BTN: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 4,
  border: '1px solid var(--accent)',
  background: 'transparent',
  color: 'var(--accent)',
  cursor: 'pointer',
  transition: 'all 0.15s',
}

export const BTN_DANGER: React.CSSProperties = {
  ...BTN,
  borderColor: '#ef4444',
  color: '#ef4444',
}

export function statusColor(status: string): string {
  if (status === 'alive' || status === 'extant' || status === 'intact' || status === 'active') return '#22c55e'
  if (status === 'dead' || status === 'destroyed' || status === 'disbanded') return '#ef4444'
  if (status === 'transformed') return '#8b5cf6'
  if (status === 'lost' || status === 'unknown') return '#f59e0b'
  return 'var(--text-muted)'
}

export function roleColor(role: string): string {
  const colors: Record<string, string> = {
    protagonist: '#3b82f6',
    antagonist: '#ef4444',
    mentor: '#f59e0b',
    ally: '#22c55e',
    herald: '#8b5cf6',
    threshold_guardian: '#f97316',
    shadow: '#64748b',
    trickster: '#ec4899',
    shapeshifter: '#14b8a6',
    love_interest: '#e879f9',
    foil: '#6366f1',
    confidant: '#06b6d4',
    comic_relief: '#eab308',
  }
  return colors[role] ?? 'var(--text-muted)'
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}
