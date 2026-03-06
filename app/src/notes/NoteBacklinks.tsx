/**
 * NoteBacklinks — reusable component showing notes that reference a given entity.
 * Can be embedded in any entity detail view.
 */

import { useNotesStore } from './store/notesStore.ts'

export function NoteBacklinks({ entityId, entityLabel }: { entityId: string; entityLabel?: string }) {
  const notes = useNotesStore((s) => s.getNotesForEntity(entityId))

  if (notes.length === 0) return null

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 4,
      }}>
        Notes referencing {entityLabel ?? entityId}
      </div>
      {notes.map((note) => (
        <div key={note.id} style={{
          padding: '4px 8px', marginBottom: 3, borderRadius: 3,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{note.title}</span>
          {note.tags.length > 0 && (
            <span style={{ marginLeft: 6, color: '#a855f7', fontSize: 10 }}>
              {note.tags.map((t) => `#${t}`).join(' ')}
            </span>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {note.content.slice(0, 100)}{note.content.length > 100 ? '...' : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
