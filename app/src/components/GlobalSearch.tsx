/**
 * Global Search — search across all entity types, notes, scenes, articles.
 * Results grouped by type. Navigates on selection.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInstanceStore } from '../instance/store/instanceStore.ts'
import { useNotesStore } from '../notes/store/notesStore.ts'
import { useSceneBoardStore } from '../sceneboard/store/sceneboardStore.ts'
import { useManuscriptStore } from '../manuscript/store/manuscriptStore.ts'

interface SearchResult {
  type: 'character' | 'place' | 'object' | 'faction' | 'thread' | 'note' | 'scene' | 'chapter'
  id: string
  label: string
  detail?: string
  route: string
}

const TYPE_COLORS: Record<string, string> = {
  character: '#3b82f6', place: '#22c55e', object: '#f59e0b', faction: '#8b5cf6',
  thread: '#ef4444', note: '#a855f7', scene: '#06b6d4', chapter: '#14b8a6',
}

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const notes = useNotesStore((s) => s.notes)
  const scenes = useSceneBoardStore((s) => s.cards)
  const chapters = useManuscriptStore((s) => s.chapters)
  const navigate = useNavigate()

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const results = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim()
    if (!q || q.length < 2) return []

    const out: SearchResult[] = []

    if (instance) {
      for (const c of instance.lore.characters) {
        if (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)) {
          out.push({ type: 'character', id: c.id, label: c.name, detail: c.role, route: '/story' })
        }
      }
      for (const p of instance.lore.places) {
        if (p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
          out.push({ type: 'place', id: p.id, label: p.name, detail: p.type, route: '/story' })
        }
      }
      for (const o of instance.lore.objects) {
        if (o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)) {
          out.push({ type: 'object', id: o.id, label: o.name, detail: o.type, route: '/story' })
        }
      }
      for (const f of instance.lore.factions) {
        if (f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q)) {
          out.push({ type: 'faction', id: f.id, label: f.name, detail: f.type, route: '/story' })
        }
      }
      for (const t of instance.lore.plot_threads) {
        if (t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) {
          out.push({ type: 'thread', id: t.id, label: t.title, detail: t.status, route: '/story' })
        }
      }
    }

    for (const n of notes) {
      if (n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) {
        out.push({ type: 'note', id: n.id, label: n.title, detail: n.tags.join(', '), route: '/notes' })
      }
    }

    for (const sc of scenes) {
      if (sc.title.toLowerCase().includes(q) || sc.synopsis.toLowerCase().includes(q)) {
        out.push({ type: 'scene', id: sc.scene_id, label: sc.title, detail: sc.status, route: '/sceneboard' })
      }
    }

    for (const ch of chapters) {
      if (ch.title.toLowerCase().includes(q)) {
        out.push({ type: 'chapter', id: ch.id, label: ch.title, detail: `${ch.scenes.length} scenes`, route: '/manuscript' })
      }
    }

    return out.slice(0, 20)
  }, [query, instance, notes, scenes, chapters])

  // Group results by type
  const grouped = useMemo(() => {
    const groups = new Map<string, SearchResult[]>()
    for (const r of results) {
      const list = groups.get(r.type) ?? []
      list.push(r)
      groups.set(r.type, list)
    }
    return groups
  }, [results])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery('')
    navigate(result.route)
  }

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search everything..."
        style={{
          width: 180, fontSize: 11, padding: '4px 8px',
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 3,
        }}
      />

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: 4, minWidth: 300,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxHeight: 400, overflowY: 'auto', zIndex: 100,
        }}>
          {Array.from(grouped.entries()).map(([type, items]) => (
            <div key={type}>
              <div style={{
                fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                color: TYPE_COLORS[type] ?? 'var(--text-muted)',
                padding: '6px 10px 2px', letterSpacing: '0.04em',
              }}>
                {type}s
              </div>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '5px 10px', fontSize: 11, cursor: 'pointer',
                    background: 'transparent', border: 'none',
                    color: 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
                >
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  {item.detail && (
                    <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 10 }}>
                      {item.detail}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
