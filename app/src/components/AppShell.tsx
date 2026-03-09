/**
 * AppShell — slim top bar replacing the cluttered toolbar.
 * Provides hamburger menu, page title, and compact status indicators.
 */

import { memo } from 'react'
import { useUIStore } from '../store/uiStore.ts'
import { NavDrawer } from './NavDrawer.tsx'

const BAR_HEIGHT = 32

interface AppShellBarProps {
  /** Optional page title override. Defaults to "Story Structure Explorer". */
  title?: string
  /** Right-side content (search, status, etc.) */
  children?: React.ReactNode
}

export const AppShellBar = memo(function AppShellBar({ title, children }: AppShellBarProps) {
  const toggleNav = useUIStore((s) => s.toggleNav)

  return (
    <>
      <NavDrawer />
      <header
        role="banner"
        aria-label="Application toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          height: BAR_HEIGHT,
          zIndex: 10,
        }}
      >
        {/* Hamburger */}
        <button
          onClick={toggleNav}
          aria-label="Open navigation"
          style={{
            fontSize: 18,
            padding: '4px 8px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {'\u2630'}
        </button>

        {/* Title */}
        <span style={{
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {title ?? 'Story Structure Explorer'}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right-side content */}
        {children}
      </header>
    </>
  )
})

export { BAR_HEIGHT }
