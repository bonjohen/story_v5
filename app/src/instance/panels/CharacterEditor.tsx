/**
 * Character Editor — list/detail view for story instance characters.
 */

import { useState } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import type { LoreCharacter } from '../../generation/series/types.ts'
import type { CharacterRole, ArcType } from '../../types/elements.ts'
import { LABEL, INPUT, CARD, CARD_SELECTED, BADGE_STYLE, BTN, BTN_DANGER, statusColor, roleColor, genId } from './shared.ts'

const ROLES: CharacterRole[] = [
  'protagonist', 'antagonist', 'mentor', 'ally', 'herald',
  'threshold_guardian', 'shadow', 'trickster', 'shapeshifter',
  'love_interest', 'foil', 'confidant', 'comic_relief',
]

const ARC_TYPES = ['transformative', 'steadfast', 'tragic', 'corrupted', 'redemptive', 'none'] as const
const STATUSES = ['alive', 'dead', 'unknown', 'transformed'] as const

function emptyCharacter(): LoreCharacter {
  return {
    id: genId('char'),
    name: '',
    role: 'ally',
    traits: [],
    motivations: [],
    arc_type: null,
    relationships: [],
    status: 'alive',
    introduced_in: 'manual',
    last_appeared_in: 'manual',
    knowledge: [],
    possessions: [],
    arc_milestones: [],
  }
}

export function CharacterEditor() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const addCharacter = useInstanceStore((s) => s.addCharacter)
  const updateCharacter = useInstanceStore((s) => s.updateCharacter)
  const removeCharacter = useInstanceStore((s) => s.removeCharacter)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<LoreCharacter | null>(null)

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const characters = instance.lore.characters
  const selected = characters.find((c) => c.id === selectedId)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setEditing(null)
  }

  const handleNew = () => {
    const c = emptyCharacter()
    setEditing(c)
    setSelectedId(null)
  }

  const handleEdit = () => {
    if (selected) setEditing({ ...selected })
  }

  const handleSave = () => {
    if (!editing) return
    const existing = characters.find((c) => c.id === editing.id)
    if (existing) {
      updateCharacter(editing.id, editing)
    } else {
      addCharacter(editing)
    }
    setSelectedId(editing.id)
    setEditing(null)
  }

  const handleDelete = () => {
    if (selectedId) {
      removeCharacter(selectedId)
      setSelectedId(null)
    }
  }

  const handleCancel = () => setEditing(null)

  // Edit form helpers
  const setField = <K extends keyof LoreCharacter>(key: K, value: LoreCharacter[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  const setListField = (key: 'traits' | 'motivations' | 'knowledge' | 'possessions', value: string) => {
    if (editing) setEditing({ ...editing, [key]: value.split(',').map((s) => s.trim()).filter(Boolean) })
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List column */}
      <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Characters ({characters.length})
          </span>
          <button onClick={handleNew} style={BTN}>+ New</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {characters.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelect(c.id)}
              style={selectedId === c.id ? CARD_SELECTED : CARD}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {c.name || 'Unnamed'}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <span style={BADGE_STYLE(roleColor(c.role))}>{c.role}</span>
                <span style={BADGE_STYLE(statusColor(c.status))}>{c.status}</span>
              </div>
            </div>
          ))}
          {characters.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No characters yet. Click + New to add one.
            </p>
          )}
        </div>
      </div>

      {/* Detail / Edit column */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {editing ? (
          <EditForm
            character={editing}
            setField={setField}
            setListField={setListField}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : selected ? (
          <DetailView character={selected} onEdit={handleEdit} onDelete={handleDelete} />
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20 }}>
            Select a character or create a new one.
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Detail View
// ---------------------------------------------------------------------------

function DetailView({ character: c, onEdit, onDelete }: {
  character: LoreCharacter
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {c.name || 'Unnamed'}
          </h3>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <span style={BADGE_STYLE(roleColor(c.role))}>{c.role}</span>
            <span style={BADGE_STYLE(statusColor(c.status))}>{c.status}</span>
            {c.arc_type && <span style={BADGE_STYLE('#8b5cf6')}>{c.arc_type}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onEdit} style={BTN}>Edit</button>
          <button onClick={onDelete} style={BTN_DANGER}>Delete</button>
        </div>
      </div>

      {c.description && (
        <Section label="Description">
          <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{c.description}</p>
        </Section>
      )}

      {c.traits.length > 0 && (
        <Section label="Traits">
          <TagList items={c.traits} color="#3b82f6" />
        </Section>
      )}

      {c.motivations.length > 0 && (
        <Section label="Motivations">
          <TagList items={c.motivations} color="#f59e0b" />
        </Section>
      )}

      {c.knowledge.length > 0 && (
        <Section label="Knowledge">
          <TagList items={c.knowledge} color="#8b5cf6" />
        </Section>
      )}

      {c.possessions.length > 0 && (
        <Section label="Possessions">
          <TagList items={c.possessions} color="#14b8a6" />
        </Section>
      )}

      {c.relationships.length > 0 && (
        <Section label="Relationships">
          {c.relationships.map((r, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text-primary)', padding: '3px 0' }}>
              <span style={{ fontWeight: 600 }}>{r.type}</span>
              <span style={{ color: 'var(--text-muted)' }}> with </span>
              {r.target_id}
              {r.description && <span style={{ color: 'var(--text-muted)' }}> — {r.description}</span>}
            </div>
          ))}
        </Section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit Form
// ---------------------------------------------------------------------------

function EditForm({ character: c, setField, setListField, onSave, onCancel }: {
  character: LoreCharacter
  setField: <K extends keyof LoreCharacter>(key: K, value: LoreCharacter[K]) => void
  setListField: (key: 'traits' | 'motivations' | 'knowledge' | 'possessions', value: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {c.name ? `Edit: ${c.name}` : 'New Character'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onSave} style={{ ...BTN, background: 'var(--accent)', color: '#fff' }}>Save</button>
          <button onClick={onCancel} style={BTN}>Cancel</button>
        </div>
      </div>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Name</span>
        <input style={INPUT} value={c.name} onChange={(e) => setField('name', e.target.value)} />
      </label>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Role</span>
          <select style={INPUT} value={c.role} onChange={(e) => setField('role', e.target.value as CharacterRole)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Status</span>
          <select style={INPUT} value={c.status} onChange={(e) => setField('status', e.target.value as LoreCharacter['status'])}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Arc Type</span>
          <select style={INPUT} value={String(c.arc_type ?? 'none')} onChange={(e) => setField('arc_type', e.target.value === 'none' ? null : e.target.value as Exclude<ArcType, null>)}>
            {ARC_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Description</span>
        <textarea
          style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }}
          rows={3}
          value={c.description ?? ''}
          onChange={(e) => setField('description', e.target.value || undefined)}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Traits (comma-separated)</span>
        <input style={INPUT} value={c.traits.join(', ')} onChange={(e) => setListField('traits', e.target.value)} />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Motivations (comma-separated)</span>
        <input style={INPUT} value={c.motivations.join(', ')} onChange={(e) => setListField('motivations', e.target.value)} />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Knowledge (comma-separated)</span>
        <input style={INPUT} value={c.knowledge.join(', ')} onChange={(e) => setListField('knowledge', e.target.value)} />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Possessions (comma-separated)</span>
        <input style={INPUT} value={c.possessions.join(', ')} onChange={(e) => setListField('possessions', e.target.value)} />
      </label>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared UI fragments
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{ ...LABEL, display: 'block', marginBottom: 4 }}>{label}</span>
      {children}
    </div>
  )
}

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((item, i) => (
        <span key={i} style={BADGE_STYLE(color)}>{item}</span>
      ))}
    </div>
  )
}
