/**
 * Faction Editor — list/detail view for story instance factions.
 */

import { useState } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import type { LoreFaction } from '../../generation/series/types.ts'
import type { FactionType } from '../../types/elements.ts'
import { LABEL, INPUT, CARD, CARD_SELECTED, BADGE_STYLE, BTN, BTN_DANGER, statusColor, genId } from './shared.ts'

const FACTION_TYPES: FactionType[] = [
  'kingdom', 'guild', 'family', 'army', 'cult', 'corporation', 'species',
]

const STATUSES = ['active', 'disbanded', 'destroyed'] as const

const FACTION_COLORS: Record<string, string> = {
  kingdom: '#eab308', guild: '#3b82f6', family: '#ec4899',
  army: '#ef4444', cult: '#7c3aed', corporation: '#94a3b8', species: '#22c55e',
}

function emptyFaction(): LoreFaction {
  return {
    id: genId('fac'),
    name: '',
    type: 'guild',
    description: '',
    goals: [],
    members: [],
    relationships: [],
    introduced_in: 'manual',
    status: 'active',
  }
}

export function FactionEditor() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const addFaction = useInstanceStore((s) => s.addFaction)
  const updateFaction = useInstanceStore((s) => s.updateFaction)
  const removeFaction = useInstanceStore((s) => s.removeFaction)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<LoreFaction | null>(null)

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const factions = instance.lore.factions
  const selected = factions.find((f) => f.id === selectedId)

  const handleNew = () => { setEditing(emptyFaction()); setSelectedId(null) }
  const handleSelect = (id: string) => { setSelectedId(id); setEditing(null) }
  const handleEdit = () => { if (selected) setEditing({ ...selected }) }
  const handleCancel = () => setEditing(null)

  const handleSave = () => {
    if (!editing) return
    if (factions.find((f) => f.id === editing.id)) updateFaction(editing.id, editing)
    else addFaction(editing)
    setSelectedId(editing.id)
    setEditing(null)
  }

  const handleDelete = () => {
    if (selectedId) { removeFaction(selectedId); setSelectedId(null) }
  }

  const set = <K extends keyof LoreFaction>(key: K, value: LoreFaction[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Factions ({factions.length})</span>
          <button onClick={handleNew} style={BTN}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {factions.map((f) => (
            <div key={f.id} onClick={() => handleSelect(f.id)} style={selectedId === f.id ? CARD_SELECTED : CARD}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{f.name || 'Unnamed'}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <span style={BADGE_STYLE(FACTION_COLORS[f.type] ?? 'var(--text-muted)')}>{f.type}</span>
                <span style={BADGE_STYLE(statusColor(f.status))}>{f.status}</span>
              </div>
            </div>
          ))}
          {factions.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No factions yet.</p>
          )}
        </div>
      </div>

      {/* Detail / Edit */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {editing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editing.name ? `Edit: ${editing.name}` : 'New Faction'}
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
                <select style={INPUT} value={editing.type} onChange={(e) => set('type', e.target.value as FactionType)}>
                  {FACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Status</span>
                <select style={INPUT} value={editing.status} onChange={(e) => set('status', e.target.value as LoreFaction['status'])}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Description</span>
              <textarea style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }} rows={3} value={editing.description} onChange={(e) => set('description', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Goals (comma-separated)</span>
              <input style={INPUT} value={editing.goals.join(', ')} onChange={(e) => set('goals', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
            </label>
          </div>
        ) : selected ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selected.name || 'Unnamed'}</h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={BADGE_STYLE(FACTION_COLORS[selected.type] ?? 'var(--text-muted)')}>{selected.type}</span>
                  <span style={BADGE_STYLE(statusColor(selected.status))}>{selected.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEdit} style={BTN}>Edit</button>
                <button onClick={handleDelete} style={BTN_DANGER}>Delete</button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected.description}</p>
            {selected.goals.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ ...LABEL, display: 'block', marginBottom: 4 }}>Goals</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.goals.map((g, i) => <span key={i} style={BADGE_STYLE('#f59e0b')}>{g}</span>)}
                </div>
              </div>
            )}
            {selected.members.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ ...LABEL, display: 'block', marginBottom: 4 }}>Members</span>
                {selected.members.map((m, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--text-primary)', padding: '2px 0' }}>
                    {m.character_id}{m.rank ? ` (${m.rank})` : ''}{m.role_in_faction ? ` — ${m.role_in_faction}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20 }}>Select a faction or create a new one.</p>
        )}
      </div>
    </div>
  )
}
