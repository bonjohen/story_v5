/**
 * Plot Thread Tracker — kanban-style board for managing plot threads.
 * Adapted from series ThreadTrackerPanel for standalone instance use.
 */

import { useState } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import type { PlotThread } from '../../generation/series/types.ts'
import { LABEL, INPUT, BTN, BADGE_STYLE, genId } from './shared.ts'

function urgencyColor(urgency: PlotThread['urgency']): string {
  if (urgency === 'critical') return '#ef4444'
  if (urgency === 'high') return '#f97316'
  if (urgency === 'medium') return '#f59e0b'
  return '#94a3b8'
}

function columnColor(status: string): string {
  if (status === 'open') return '#3b82f6'
  if (status === 'progressing') return '#f59e0b'
  if (status === 'resolved') return '#22c55e'
  return '#94a3b8'
}

const URGENCIES = ['low', 'medium', 'high', 'critical'] as const
const STATUSES = ['open', 'progressing', 'resolved', 'abandoned'] as const

function emptyThread(): PlotThread {
  return {
    id: genId('thread'),
    title: '',
    description: '',
    status: 'open',
    urgency: 'medium',
    introduced_in: 'manual',
    progressed_in: [],
    related_characters: [],
  }
}

export function PlotThreadTracker() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const addThread = useInstanceStore((s) => s.addThread)
  const updateThread = useInstanceStore((s) => s.updateThread)
  const removeThread = useInstanceStore((s) => s.removeThread)

  const [editing, setEditing] = useState<PlotThread | null>(null)

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const threads = instance.lore.plot_threads

  const handleNew = () => setEditing(emptyThread())
  const handleCancel = () => setEditing(null)

  const handleSave = () => {
    if (!editing) return
    if (threads.find((t) => t.id === editing.id)) updateThread(editing.id, editing)
    else addThread(editing)
    setEditing(null)
  }

  const handleEditThread = (thread: PlotThread) => {
    setEditing({ ...thread })
  }

  const handleDeleteThread = (id: string) => {
    removeThread(id)
  }

  const set = <K extends keyof PlotThread>(key: K, value: PlotThread[K]) => {
    if (editing) setEditing({ ...editing, [key]: value })
  }

  const open = threads.filter((t) => t.status === 'open')
  const progressing = threads.filter((t) => t.status === 'progressing')
  const resolved = threads.filter((t) => t.status === 'resolved')
  const abandoned = threads.filter((t) => t.status === 'abandoned')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Plot Threads ({threads.length})
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {open.length + progressing.length} active · {resolved.length} resolved
          </div>
        </div>
        <button onClick={handleNew} style={BTN}>+ New Thread</button>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {threads.find((t) => t.id === editing.id) ? 'Edit Thread' : 'New Thread'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSave} style={{ ...BTN, background: 'var(--accent)', color: '#fff', padding: '4px 10px', fontSize: 11 }}>Save</button>
              <button onClick={handleCancel} style={{ ...BTN, padding: '4px 10px', fontSize: 11 }}>Cancel</button>
            </div>
          </div>
          <label style={{ display: 'block', marginBottom: 6 }}>
            <span style={LABEL}>Title</span>
            <input style={INPUT} value={editing.title} onChange={(e) => set('title', e.target.value)} />
          </label>
          <label style={{ display: 'block', marginBottom: 6 }}>
            <span style={LABEL}>Description</span>
            <textarea style={{ ...INPUT, fontFamily: 'inherit', resize: 'vertical' }} rows={2} value={editing.description} onChange={(e) => set('description', e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <label style={{ flex: 1 }}>
              <span style={LABEL}>Status</span>
              <select style={INPUT} value={editing.status} onChange={(e) => set('status', e.target.value as PlotThread['status'])}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              <span style={LABEL}>Urgency</span>
              <select style={INPUT} value={editing.urgency} onChange={(e) => set('urgency', e.target.value as PlotThread['urgency'])}>
                {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
          </div>
          <label style={{ display: 'block', marginBottom: 6 }}>
            <span style={LABEL}>Related Characters (comma-separated IDs)</span>
            <input style={INPUT} value={editing.related_characters.join(', ')} onChange={(e) => set('related_characters', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
          </label>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 8,
        padding: '10px 14px',
        overflowX: 'auto',
        overflowY: 'auto',
      }}>
        <Column title="Open" threads={open} color={columnColor('open')} onEdit={handleEditThread} onDelete={handleDeleteThread} />
        <Column title="Progressing" threads={progressing} color={columnColor('progressing')} onEdit={handleEditThread} onDelete={handleDeleteThread} />
        <Column title="Resolved" threads={resolved} color={columnColor('resolved')} onEdit={handleEditThread} onDelete={handleDeleteThread} />
        {abandoned.length > 0 && (
          <Column title="Abandoned" threads={abandoned} color={columnColor('abandoned')} onEdit={handleEditThread} onDelete={handleDeleteThread} />
        )}
      </div>
    </div>
  )
}

function Column({ title, threads, color, onEdit, onDelete }: {
  title: string
  threads: PlotThread[]
  color: string
  onEdit: (t: PlotThread) => void
  onDelete: (id: string) => void
}) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <div style={{
        padding: '6px 10px',
        borderBottom: `2px solid ${color}`,
        marginBottom: 6,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color, letterSpacing: '0.5px' }}>
          {title}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          background: 'var(--border)', padding: '1px 6px', borderRadius: 8,
        }}>
          {threads.length}
        </span>
      </div>
      <div>
        {threads.map((t) => (
          <ThreadCard key={t.id} thread={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t.id)} />
        ))}
        {threads.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>None</p>
        )}
      </div>
    </div>
  )
}

function ThreadCard({ thread: t, onEdit, onDelete }: { thread: PlotThread; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${urgencyColor(t.urgency)}`,
      borderRadius: 4,
      padding: '8px 10px',
      marginBottom: 6,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
        {t.title || 'Untitled'}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>
        {t.description.length > 80 ? `${t.description.slice(0, 80)}...` : t.description}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={BADGE_STYLE(urgencyColor(t.urgency))}>{t.urgency}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onEdit} style={{ fontSize: 10, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}>edit</button>
          <button onClick={onDelete} style={{ fontSize: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>del</button>
        </div>
      </div>
    </div>
  )
}
