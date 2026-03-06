/**
 * Object Editor — list/detail view for story instance objects.
 */

import { useState } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import type { LoreObject } from '../../generation/series/types.ts'
import type { ObjectType } from '../../types/elements.ts'
import { LABEL, INPUT, CARD, CARD_SELECTED, BADGE_STYLE, BTN, BTN_DANGER, statusColor, genId } from './shared.ts'

const OBJECT_TYPES: ObjectType[] = [
  'weapon', 'talisman', 'document', 'treasure', 'mcguffin',
  'symbol', 'tool', 'key', 'vessel', 'relic',
]

const STATUSES = ['intact', 'destroyed', 'transformed', 'lost'] as const

const OBJ_COLORS: Record<string, string> = {
  weapon: '#ef4444', talisman: '#8b5cf6', document: '#3b82f6',
  treasure: '#eab308', mcguffin: '#f97316', symbol: '#ec4899',
  tool: '#94a3b8', key: '#f59e0b', vessel: '#14b8a6', relic: '#7c3aed',
}

function emptyObject(): LoreObject {
  return {
    id: genId('obj'),
    name: '',
    type: 'mcguffin',
    significance: '',
    custody_history: [],
    introduced_in: 'manual',
    status: 'intact',
  }
}

export function ObjectEditor() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const addObject = useInstanceStore((s) => s.addObject)
  const updateObject = useInstanceStore((s) => s.updateObject)
  const removeObject = useInstanceStore((s) => s.removeObject)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<LoreObject | null>(null)

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const objects = instance.lore.objects
  const selected = objects.find((o) => o.id === selectedId)

  const handleNew = () => { setEditing(emptyObject()); setSelectedId(null) }
  const handleSelect = (id: string) => { setSelectedId(id); setEditing(null) }
  const handleEdit = () => { if (selected) setEditing({ ...selected }) }
  const handleCancel = () => setEditing(null)

  const handleSave = () => {
    if (!editing) return
    if (objects.find((o) => o.id === editing.id)) updateObject(editing.id, editing)
    else addObject(editing)
    setSelectedId(editing.id)
    setEditing(null)
  }

  const handleDelete = () => {
    if (selectedId) { removeObject(selectedId); setSelectedId(null) }
  }

  const set = <K extends keyof LoreObject>(key: K, value: LoreObject[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Objects ({objects.length})</span>
          <button onClick={handleNew} style={BTN}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {objects.map((o) => (
            <div key={o.id} onClick={() => handleSelect(o.id)} style={selectedId === o.id ? CARD_SELECTED : CARD}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{o.name || 'Unnamed'}</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <span style={BADGE_STYLE(OBJ_COLORS[o.type] ?? 'var(--text-muted)')}>{o.type}</span>
                <span style={BADGE_STYLE(statusColor(o.status))}>{o.status}</span>
              </div>
            </div>
          ))}
          {objects.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No objects yet.</p>
          )}
        </div>
      </div>

      {/* Detail / Edit */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {editing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {editing.name ? `Edit: ${editing.name}` : 'New Object'}
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
                <select style={INPUT} value={editing.type} onChange={(e) => set('type', e.target.value as ObjectType)}>
                  {OBJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Status</span>
                <select style={INPUT} value={editing.status} onChange={(e) => set('status', e.target.value as LoreObject['status'])}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Significance</span>
              <textarea style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }} rows={2} value={editing.significance} onChange={(e) => set('significance', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Description</span>
              <textarea style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }} rows={2} value={editing.description ?? ''} onChange={(e) => set('description', e.target.value || undefined)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Rules (comma-separated)</span>
              <input style={INPUT} value={editing.rules?.join(', ') ?? ''} onChange={(e) => set('rules', e.target.value ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : undefined)} />
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={LABEL}>Current Holder (ID)</span>
              <input style={INPUT} value={editing.current_holder ?? ''} onChange={(e) => set('current_holder', e.target.value || undefined)} />
            </label>
          </div>
        ) : selected ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{selected.name || 'Unnamed'}</h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <span style={BADGE_STYLE(OBJ_COLORS[selected.type] ?? 'var(--text-muted)')}>{selected.type}</span>
                  <span style={BADGE_STYLE(statusColor(selected.status))}>{selected.status}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleEdit} style={BTN}>Edit</button>
                <button onClick={handleDelete} style={BTN_DANGER}>Delete</button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{selected.significance}</p>
            {selected.description && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.description}</p>}
            {selected.current_holder && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                <span style={LABEL}>Held by: </span>{selected.current_holder}
              </div>
            )}
            {selected.custody_history.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <span style={{ ...LABEL, display: 'block', marginBottom: 4 }}>Custody Chain</span>
                {selected.custody_history.map((entry, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--text-primary)', padding: '2px 0' }}>
                    {entry.holder_id} — {entry.how} (ep: {entry.acquired_in})
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20 }}>Select an object or create a new one.</p>
        )}
      </div>
    </div>
  )
}
