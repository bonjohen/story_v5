/**
 * NavDrawer — slide-out navigation drawer with grouped links.
 * Overlays on mobile, pushes content on desktop.
 */

import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../store/uiStore.ts'

interface NavItem {
  label: string
  path: string
  color: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Explore',
    items: [
      { label: 'Structure Explorer', path: '/', color: 'var(--accent)' },
    ],
  },
  {
    title: 'Create',
    items: [
      { label: 'Story Workspace', path: '/story', color: '#22c55e' },
      { label: 'Scene Board', path: '/sceneboard', color: '#f59e0b' },
      { label: 'Timeline', path: '/timeline', color: '#06b6d4' },
      { label: 'Manuscript', path: '/manuscript', color: '#14b8a6' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'Encyclopedia', path: '/encyclopedia', color: '#14b8a6' },
      { label: 'Walkthrough Scripts', path: '/scripts', color: 'var(--accent)' },
      { label: 'Notes', path: '/notes', color: '#a855f7' },
      { label: 'Series', path: '/series', color: '#f59e0b' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Database', path: '/db', color: '#22c55e' },
      { label: 'LLM Connection', path: '#llm', color: '#06b6d4' },
    ],
  },
]

export function NavDrawer() {
  const navOpen = useUIStore((s) => s.navOpen)
  const setNavOpen = useUIStore((s) => s.setNavOpen)
  const setLlmDialogOpen = useUIStore((s) => s.setLlmDialogOpen)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNav = useCallback((path: string) => {
    if (path === '#llm') {
      setNavOpen(false)
      setLlmDialogOpen(true)
      return
    }
    navigate(path)
    setNavOpen(false)
  }, [navigate, setNavOpen, setLlmDialogOpen])

  if (!navOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setNavOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 90,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Drawer */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          maxWidth: '80vw',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInLeft 0.2s ease',
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            Story Structure
          </span>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
            style={{
              fontSize: 18,
              padding: '4px 8px',
              color: 'var(--text-muted)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {'\u2715'}
          </button>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
                padding: '8px 16px 4px',
              }}>
                {group.title}
              </div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? item.color : 'var(--text-primary)',
                      background: isActive ? `${item.color}12` : 'transparent',
                      borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                      textAlign: 'left',
                      minHeight: 44,
                      transition: 'background 0.1s',
                    }}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
