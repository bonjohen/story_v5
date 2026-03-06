/**
 * AppNav — shared navigation bar for all pages.
 * Highlights the active section. Provides consistent branding and navigation.
 */

import { useLocation, useNavigate } from 'react-router-dom'

export const NAV_HEIGHT = 42

interface NavItem {
  path: string
  label: string
  color: string
  match: (pathname: string) => boolean
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Structure', color: 'var(--accent)', match: (p) => p === '/' || p === '' },
  { path: '/story', label: 'Story', color: '#22c55e', match: (p) => p.startsWith('/story') },
  { path: '/sceneboard', label: 'Scenes', color: '#f59e0b', match: (p) => p.startsWith('/sceneboard') },
  { path: '/timeline', label: 'Timeline', color: '#06b6d4', match: (p) => p.startsWith('/timeline') },
  { path: '/encyclopedia', label: 'Encyclopedia', color: '#14b8a6', match: (p) => p.startsWith('/encyclopedia') },
  { path: '/manuscript', label: 'Manuscript', color: '#14b8a6', match: (p) => p.startsWith('/manuscript') },
  { path: '/notes', label: 'Notes', color: '#a855f7', match: (p) => p.startsWith('/notes') },
  { path: '/scripts', label: 'Scripts', color: 'var(--accent)', match: (p) => p.startsWith('/scripts') },
]

export function AppNav({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  // Strip base URL prefix for matching
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')
  const pathname = location.pathname.startsWith(basePath)
    ? location.pathname.slice(basePath.length) || '/'
    : location.pathname

  return (
    <div style={{
      height: NAV_HEIGHT,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 4,
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Brand */}
      <a
        href={`${import.meta.env.BASE_URL}`}
        style={{
          fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
          textDecoration: 'none', whiteSpace: 'nowrap', marginRight: 8,
        }}
      >
        Story Explorer
      </a>

      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const active = item.match(pathname)
        return (
          <button
            key={item.path}
            onClick={() => void navigate(item.path)}
            style={{
              fontSize: 11,
              fontWeight: active ? 700 : 500,
              padding: '4px 8px',
              borderRadius: 3,
              border: 'none',
              background: active ? `${item.color}15` : 'transparent',
              color: active ? item.color : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              borderBottom: active ? `2px solid ${item.color}` : '2px solid transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {item.label}
          </button>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Extra controls injected by each page */}
      {children}
    </div>
  )
}
