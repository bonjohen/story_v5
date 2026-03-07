import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScriptStore } from '../store/scriptStore.ts'
import { ScriptToolbar } from '../components/ScriptToolbar.tsx'
import { SettingsPanel } from '../../components/SettingsPanel.tsx'
import { useSettingsStore } from '../../store/settingsStore.ts'
import type { ScriptMeta } from '../types.ts'

const CATEGORY_ORDER = [
  'Introduction',
  'Foundations of Story Structure',
  'The Data Model',
  'What This Enables',
  'Using the System',
  'Author Surfaces',
  'Data Layer',
  'Examples',
]

function groupByCategory(scripts: ScriptMeta[]): [string, ScriptMeta[]][] {
  const groups = new Map<string, ScriptMeta[]>()
  for (const s of scripts) {
    const cat = s.category ?? 'Other'
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(s)
  }
  // Sort by defined order, unknown categories go last
  return [...groups.entries()].sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a)
    const bi = CATEGORY_ORDER.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

export function ScriptBrowserPage() {
  const navigate = useNavigate()
  const scripts = useScriptStore((s) => s.scripts)
  const loading = useScriptStore((s) => s.loading)
  const error = useScriptStore((s) => s.error)
  const loadManifest = useScriptStore((s) => s.loadManifest)
  const settingsOpen = useSettingsStore((s) => s.settingsOpen)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    void loadManifest()
  }, [loadManifest])

  const filtered = useMemo(() => {
    if (!filter.trim()) return scripts
    const q = filter.toLowerCase()
    return scripts.filter(
      (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q),
    )
  }, [scripts, filter])

  const categories = useMemo(() => groupByCategory(filtered), [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ScriptToolbar />
      {settingsOpen && <SettingsPanel />}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Walkthrough Scripts
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Audio-friendly walkthrough scripts for the story structure corpus. Click to read, or
            use the built-in text-to-speech player.
          </p>

          {/* Search/filter */}
          <input
            type="text"
            placeholder="Filter scripts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter scripts by title or subtitle"
            style={{
              width: '100%',
              maxWidth: 360,
              padding: '7px 12px',
              fontSize: 13,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-primary)',
              marginBottom: 20,
            }}
          />

          {loading && (
            <div style={{ color: 'var(--accent)', fontSize: 13, animation: 'pulse 1.5s infinite' }}>
              Loading scripts...
            </div>
          )}

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, padding: '12px 0' }}>
              {error}
              <button
                onClick={() => void loadManifest()}
                style={{
                  marginLeft: 12,
                  fontSize: 12,
                  color: 'var(--accent)',
                  textDecoration: 'underline',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {categories.map(([category, items]) => (
            <section key={category} style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    margin: 0,
                  }}
                >
                  {category}
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '1px 7px',
                  }}
                >
                  {items.length}
                </span>
              </div>
              <div
                role="list"
                aria-label={`${category} scripts`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: 12,
                }}
              >
                {items.map((script) => (
                  <button
                    key={script.slug}
                    role="listitem"
                    onClick={() => void navigate(`/scripts/${script.slug}`)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 6,
                      padding: '16px 20px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                      textAlign: 'left',
                      width: '100%',
                      minHeight: 44,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.background = 'var(--bg-elevated)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--bg-surface)'
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {script.title}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {script.subtitle}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--accent)',
                        marginTop: 4,
                        opacity: 0.8,
                      }}
                    >
                      ~{script.estimatedMinutes} min listen
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {filtered.length === 0 && scripts.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>
              No scripts match "{filter}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
