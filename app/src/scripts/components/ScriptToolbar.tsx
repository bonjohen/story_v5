import { useSettingsStore } from '../../store/settingsStore.ts'
import { AppShellBar } from '../../components/AppShell.tsx'

interface ScriptToolbarProps {
  scriptTitle?: string
  /** Slot for TTS controls rendered in the toolbar */
  rightSlot?: React.ReactNode
}

export function ScriptToolbar({ scriptTitle, rightSlot }: ScriptToolbarProps) {
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const toggleSettings = useSettingsStore((s) => s.toggleSettings)

  const title = scriptTitle
    ? `Scripts / ${scriptTitle}`
    : 'Walkthrough Scripts'

  return (
    <AppShellBar title={title}>
      {rightSlot}
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
    </AppShellBar>
  )
}
