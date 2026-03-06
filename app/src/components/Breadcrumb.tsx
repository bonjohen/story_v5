/**
 * Breadcrumb — shows navigation path for context.
 * Usage: <Breadcrumb items={[{ label: 'Story' }, { label: 'Characters' }, { label: 'Elena' }]} />
 */

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      fontSize: 11, color: 'var(--text-muted)', padding: '4px 0',
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {i > 0 && <span style={{ color: 'var(--border)' }}>/</span>}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{
                fontSize: 11, color: 'var(--accent)', background: 'transparent',
                border: 'none', cursor: 'pointer', padding: 0,
                textDecoration: 'underline',
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{ color: i === items.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: i === items.length - 1 ? 600 : 400 }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
