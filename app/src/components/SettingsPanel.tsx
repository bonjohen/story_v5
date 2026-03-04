/**
 * Settings Panel — user preferences for color scheme, motion, and accessibility.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSettingsStore, type ColorScheme, type MotionPreference } from '../store/settingsStore.ts'

export function SettingsPanel() {
  const colorScheme = useSettingsStore((s) => s.colorScheme)
  const motionPreference = useSettingsStore((s) => s.motionPreference)
  const setColorScheme = useSettingsStore((s) => s.setColorScheme)
  const setMotionPreference = useSettingsStore((s) => s.setMotionPreference)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape key to close
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleSettings()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [toggleSettings])

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, [tabindex]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  return (
    <div ref={panelRef} role="dialog" aria-label="Settings" onKeyDown={handleKeyDown} style={{
      position: 'fixed',
      top: 42, // matches TOOLBAR_HEIGHT in App.tsx
      right: 0,
      width: 280,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '0 0 0 8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      zIndex: 50,
      padding: 16,
      animation: 'slideInRight 0.15s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Settings
        </span>
        <button
          onClick={toggleSettings}
          style={{ fontSize: 16, color: 'var(--text-muted)', padding: '0 4px' }}
        >
          {'\u00D7'}
        </button>
      </div>

      {/* Color Scheme */}
      <SettingGroup label="Color Scheme">
        <RadioOption
          label="Dark"
          value="dark"
          current={colorScheme}
          onChange={(v) => setColorScheme(v as ColorScheme)}
        />
        <RadioOption
          label="Light"
          value="light"
          current={colorScheme}
          onChange={(v) => setColorScheme(v as ColorScheme)}
        />
        <RadioOption
          label="High Contrast"
          value="high-contrast"
          current={colorScheme}
          onChange={(v) => setColorScheme(v as ColorScheme)}
        />
      </SettingGroup>

      {/* Motion Preference */}
      <SettingGroup label="Motion">
        <RadioOption
          label="Full animations"
          value="full"
          current={motionPreference}
          onChange={(v) => setMotionPreference(v as MotionPreference)}
        />
        <RadioOption
          label="Reduced motion"
          value="reduced"
          current={motionPreference}
          onChange={(v) => setMotionPreference(v as MotionPreference)}
        />
      </SettingGroup>

      {/* Keyboard shortcuts reference */}
      <SettingGroup label="Keyboard Shortcuts">
        <ShortcutRow keys="/ or Ctrl+K" action="Focus search" />
        <ShortcutRow keys="Arrow keys" action="Navigate nodes" />
        <ShortcutRow keys="Escape" action="Clear selection" />
      </SettingGroup>
    </div>
  )
}

function SettingGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function RadioOption({ label, value, current, onChange }: {
  label: string
  value: string
  current: string
  onChange: (value: string) => void
}) {
  const isActive = value === current
  return (
    <button
      onClick={() => onChange(value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '4px 8px',
        marginBottom: 2,
        fontSize: 12,
        textAlign: 'left',
        borderRadius: 3,
        background: isActive ? 'var(--bg-elevated)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: '2px solid',
        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isActive && (
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
          }} />
        )}
      </span>
      {label}
    </button>
  )
}

function ShortcutRow({ keys, action }: { keys: string; action: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '3px 8px',
      fontSize: 11,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{action}</span>
      <code style={{
        fontSize: 10,
        padding: '1px 6px',
        background: 'var(--bg-elevated)',
        borderRadius: 3,
        color: 'var(--text-primary)',
      }}>
        {keys}
      </code>
    </div>
  )
}
