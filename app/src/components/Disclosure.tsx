/**
 * Disclosure — collapsible section with header, chevron, and optional badge.
 * Remembers collapsed state via uiStore when a persistKey is provided.
 */

import { useState, memo } from 'react'
import { useUIStore } from '../store/uiStore.ts'

interface DisclosureProps {
  /** Section title */
  title: string
  /** Optional badge text (e.g., item count) */
  badge?: string | number
  /** Key for persisting collapsed state. If omitted, uses local state. */
  persistKey?: string
  /** Default collapsed state (only used when no persisted state exists). */
  defaultCollapsed?: boolean
  /** Nesting depth for indentation (0 = top level). */
  depth?: number
  children: React.ReactNode
}

export const Disclosure = memo(function Disclosure({
  title,
  badge,
  persistKey,
  defaultCollapsed = false,
  depth = 0,
  children,
}: DisclosureProps) {
  const storedCollapsed = useUIStore((s) => persistKey ? s.collapsedSections[persistKey] : undefined)
  const toggleStored = useUIStore((s) => s.toggleSection)
  const [localCollapsed, setLocalCollapsed] = useState(defaultCollapsed)

  const isCollapsed = persistKey ? (storedCollapsed ?? defaultCollapsed) : localCollapsed
  const toggle = persistKey
    ? () => toggleStored(persistKey)
    : () => setLocalCollapsed((v) => !v)

  const indent = depth * 12

  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={!isCollapsed}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: `8px 12px 8px ${12 + indent}px`,
          fontSize: depth > 0 ? 10 : 11,
          fontWeight: 600,
          color: depth > 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textAlign: 'left',
          minHeight: depth > 0 ? 30 : 36,
          transition: 'background 0.1s',
          borderLeft: depth > 0 ? `2px solid var(--border)` : 'none',
          marginLeft: depth > 0 ? indent - 12 : 0,
        }}
      >
        <span style={{
          fontSize: 8,
          transition: 'transform 0.15s',
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
        }}>
          {'\u25BC'}
        </span>
        <span style={{ flex: 1 }}>{title}</span>
        {badge !== undefined && badge !== '' && (
          <span style={{
            fontSize: 9,
            fontWeight: 400,
            color: 'var(--text-muted)',
            textTransform: 'none',
            letterSpacing: 0,
          }}>
            {badge}
          </span>
        )}
      </button>
      {!isCollapsed && (
        <div style={{ paddingLeft: 12 + indent }}>{children}</div>
      )}
    </div>
  )
})
