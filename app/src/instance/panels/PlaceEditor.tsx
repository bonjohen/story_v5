/**
 * Place Editor — list/detail view for story instance places.
 */

import { useState } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import type { LorePlace } from '../../generation/series/types.ts'
import type { PlaceType } from '../../types/elements.ts'
import { LABEL, INPUT, CARD, CARD_SELECTED, BADGE_STYLE, BTN, BTN_DANGER, statusColor, genId } from './shared.ts'

const PLACE_TYPES: PlaceType[] = [
  'ordinary_world', 'threshold', 'special_world', 'sanctuary',
  'stronghold', 'wasteland', 'crossroads', 'underworld', 'summit', 'home',
]

const STATUSES = ['extant', 'destroyed', 'transformed'] as const

function emptyPlace(): LorePlace {
  return {
    id: genId('place'),
    name: '',
    type: 'special_world',
    description: '',
    introduced_in: 'manual',
    last_featured_in: 'manual',
    status: 'extant',
    events_here: [],
  }
}

const PLACE_COLORS: Record<string, string> = {
  ordinary_world: '#94a3b8', threshold: '#f97316', special_world: '#3b82f6',
  sanctuary: '#22c55e', stronghold: '#ef4444', wasteland: '#78716c',
  crossroads: '#f59e0b', underworld: '#7c3aed', summit: '#06b6d4', home: '#ec4899',
}

export function PlaceEditor() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const addPlace = useInstanceStore((s) => s.addPlace)
  const updatePlace = useInstanceStore((s) => s.updatePlace)
  const removePlace = useInstanceStore((s) => s.removePlace)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<LorePlace | null>(null)

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const places = instance.lore.places
  const selected = places.find((p) => p.id === selectedId)

  const handleNew = () => { setEditing(emptyPlace()); setSelectedId(null) }
  const handleSelect = (id: string) => { setSelectedId(id); setEditing(null) }
  const handleEdit = () => { if (selected) setEditing({ ...selected }) }
  const handleCancel = () => setEditing(null)

  const handleSave = () => {
    if (!editing) return
    const existing = places.find((p) => p.id === editing.id)
    if (existing) updatePlace(editing.id, editing)
    else addPlace(editing)
    setSelectedId(editing.id)
    setEditing(null)
  }

  const handleDelete = () => {
    if (selectedId) { removePlace(selectedId); setSelectedId(null) }
  }

  const set = <K extends keyof LorePlace>(key: K, value: LorePlace[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Places ({places.length})</span>
          <button onClick={handleNew} style={BTN}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {places.map((p) => (
            <div key={p.id} onClick={() => handleSelect(p.id)} style={selectedId === p.id ? CARD_SELECTED : CARD}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name || 'Unnamed'}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <span style={BADGE_STYLE(PLACE_COLORS[p.type] ?? 'var(--text-muted)')}>{p.type}</span>
                <span style={BADGE_STYLE(statusColor(p.status))}>{p.status}</span>
              </div>
            </div>
          ))}
          {places.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No places yet.</p>
          )}
        </div>
      </div>

      {/* Detail / Edit */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {editing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editing.name ? `Edit: ${editing.name}` : 'New Place'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleSave} style={{ ...BTN, background: 'var(--accent)', color: '#fff' }}>Save</button>
                <button onClick={handleCancel} style={BTN}>Cancel</button>
              </div>
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Name</span>
              <input style={INPUT} value={editing.name} onChange={(e) => set('name', e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Type</span>
                <select style={INPUT} value={editing.type} onChange={(e) => set('type', e.target.value as PlaceType)}>
                  {PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Status</span>
                <select style={INPUT} value={editing.status} onChange={(e) => set('status', e.target.value as LorePlace['status'])}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Description</span>
              <textarea style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }} rows={3} value={editing.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Atmosphere</span>
              <input style={INPUT} value={editing.atmosphere ?? ''} onChange={(e) => set('atmosphere', e.target.value || undefined)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Rules (comma-separated)</span>
              <input style={INPUT} value={editing.rules?.join(', ') ?? ''} onChange={(e) => set('rules', e.target.value ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : undefined)} />
            </label>
          </div>
        ) : selected ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selected.name || 'Unnamed'}</h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={BADGE_STYLE(PLACE_COLORS[selected.type] ?? 'var(--text-muted)')}>{selected.type}</span>
                  <span style={BADGE_STYLE(statusColor(selected.status))}>{selected.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEdit} style={BTN}>Edit</button>
                <button onClick={handleDelete} style={BTN_DANGER}>Delete</button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected.description}</p>
            {selected.atmosphere && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{selected.atmosphere}</p>}
            {selected.rules && selected.rules.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ ...LABEL, display: 'block', marginBottom: 4 }}>Rules</span>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {selected.rules.map((r, i) => <li key={i} style={{ fontSize: 11, color: 'var(--text-primary)' }}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20 }}>Select a place or create a new one.</p>
        )}
      </div>
    </div>
  )
}
