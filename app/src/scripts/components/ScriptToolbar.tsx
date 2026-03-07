import { useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore.ts'

interface ScriptToolbarProps {
  scriptTitle?: string
  /** Slot for TTS controls rendered centered in the toolbar */
  rightSlot?: React.ReactNode
}

const TOOLBAR_HEIGHT = 42

export function ScriptToolbar({ scriptTitle, rightSlot }: ScriptToolbarProps) {
  const navigate = useNavigate()
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  return (
    <header
      role="banner"
      aria-label="Script reader toolbar"
      className="page-toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        zIndex: 10,
        height: TOOLBAR_HEIGHT,
      }}
    >
      {/* Left: breadcrumbs */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <button
          onClick={() => void navigate('/')}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Story Structure Explorer
        </button>

        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
        <button
          onClick={() => void navigate('/scripts')}
          style={{
            fontSize: 13,
            color: scriptTitle ? 'var(--text-muted)' : 'var(--text-primary)',
            fontWeight: scriptTitle ? 400 : 600,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = scriptTitle ? 'var(--text-muted)' : 'var(--text-primary)')
          }
        >
          Scripts
        </button>

        {scriptTitle && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>/</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {scriptTitle}
            </span>
          </>
        )}
      </div>

      {/* Center: TTS controls */}
      {rightSlot}

      {/* Right: settings gear (mirrors left flex to keep center balanced) */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={toggleSettings}
          aria-label="Settings"
          title="Settings"
          style={{
            fontSize: 16,
            padding: '4px 6px',
            color: settingsOpen ? 'var(--accent)' : 'var(--text-muted)',
            borderRadius: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => {
            if (!settingsOpen) e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          {'\u2699'}
        </button>
      </div>
    </header>
  )
}
