/**
 * Notes Page — full-page note browser with create/edit, tags, search, and saved queries.
 * Obsidian-like: notes can be linked to any entity, with tag-based filtering.
 */

import { useState, useMemo } from 'react'
import { useNotesStore } from './store/notesStore.ts'
import { useInstanceStore } from '../instance/store/instanceStore.ts'
import { ReadAloud } from '../components/ReadAloud.tsx'
import type { Note, EntityRef, EntityRefType, SavedQuery } from './types.ts'

const TOOLBAR_HEIGHT = 42
const ENTITY_TYPES: EntityRefType[] = ['character', 'place', 'object', 'faction', 'thread', 'scene', 'node', 'other']

const TYPE_COLORS: Record<EntityRefType, string> = {
  character: '#3b82f6', place: '#22c55e', object: '#f59e0b', faction: '#8b5cf6',
  thread: '#ef4444', scene: '#06b6d4', node: '#94a3b8', other: '#64748b',
}

export function NotesPage() {
  const notes = useNotesStore((s) => s.notes)
  const savedQueries = useNotesStore((s) => s.savedQueries)
  const addNote = useNotesStore((s) => s.addNote)
  const updateNote = useNotesStore((s) => s.updateNote)
  const deleteNote = useNotesStore((s) => s.deleteNote)
  const addLink = useNotesStore((s) => s.addLink)
  const removeLink = useNotesStore((s) => s.removeLink)
  const saveQuery = useNotesStore((s) => s.saveQuery)
  const deleteSavedQuery = useNotesStore((s) => s.deleteSavedQuery)
  const searchNotes = useNotesStore((s) => s.searchNotes)

  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterEntityType, setFilterEntityType] = useState<EntityRefType | null>(null)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')

  // All tags across notes
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const n of notes) {
      for (const t of n.tags) tags.add(t)
    }
    return Array.from(tags).sort()
  }, [notes])

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return searchNotes({
      text: searchText || undefined,
      tags: filterTag ? [filterTag] : undefined,
      entityType: filterEntityType ?? undefined,
    })
  }, [searchNotes, searchText, filterTag, filterEntityType, notes])

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  // Available entities from the active instance
  const availableEntities = useMemo((): EntityRef[] => {
    if (!instance) return []
    const refs: EntityRef[] = []
    for (const c of instance.lore.characters) refs.push({ type: 'character', id: c.id, label: c.name })
    for (const p of instance.lore.places) refs.push({ type: 'place', id: p.id, label: p.name })
    for (const o of instance.lore.objects) refs.push({ type: 'object', id: o.id, label: o.name })
    for (const f of instance.lore.factions) refs.push({ type: 'faction', id: f.id, label: f.name })
    for (const t of instance.lore.plot_threads) refs.push({ type: 'thread', id: t.id, label: t.title })
    return refs
  }, [instance])

  const handleCreate = () => {
    const id = addNote('Untitled Note', '', [], [])
    setSelectedId(id)
    setEditing(true)
    setEditTitle('Untitled Note')
    setEditContent('')
    setEditTags('')
  }

  const handleStartEdit = (note: Note) => {
    setEditing(true)
    setEditTitle(note.title)
    setEditContent(note.content)
    setEditTags(note.tags.join(', '))
  }

  const handleSaveEdit = () => {
    if (!selectedId) return
    updateNote(selectedId, {
      title: editTitle,
      content: editContent,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setEditing(false)
  }

  const handleSaveCurrentQuery = () => {
    const id = `sq_${Date.now()}`
    const label = [
      searchText && `"${searchText}"`,
      filterTag && `#${filterTag}`,
      filterEntityType && filterEntityType,
    ].filter(Boolean).join(' + ') || 'All notes'
    saveQuery({
      id, label,
      text: searchText || undefined,
      tags: filterTag ? [filterTag] : undefined,
      entity_type: filterEntityType ?? undefined,
    })
  }

  const handleApplyQuery = (q: SavedQuery) => {
    setSearchText(q.text ?? '')
    setFilterTag(q.tags?.[0] ?? null)
    setFilterEntityType(q.entity_type ?? null)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
        flexShrink: 0, zIndex: 10,
      }}>
        <a href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#a855f7' }}>Notes</span>
        <ReadAloud text={selectedNote ? `${selectedNote.title}. ${selectedNote.content}` : ''} label="Read aloud" />

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {notes.length} notes · {allTags.length} tags
        </span>

        <button onClick={handleCreate}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 3,
            border: '1px solid #a855f7', background: '#a855f718',
            color: '#a855f7', cursor: 'pointer', fontWeight: 600,
          }}>
          + New Note
        </button>
      </div>

      {notes.length === 0 && !editing ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No notes yet.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Create notes to annotate characters, scenes, plot threads, and more.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: search/filter + note list */}
          <div style={{
            width: 280, flexShrink: 0, borderRight: '1px solid var(--border)',
            background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column',
          }}>
            {/* Search bar */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
              <input
                placeholder="Search notes..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: '100%', padding: '5px 8px', fontSize: 11,
                  background: 'var(--bg-primary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 3,
                  boxSizing: 'border-box',
                }}
              />

              {/* Filters */}
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                <select
                  value={filterTag ?? ''}
                  onChange={(e) => setFilterTag(e.target.value || null)}
                  style={{
                    fontSize: 10, padding: '2px 4px', background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)', border: '1px solid var(--border)',
                    borderRadius: 3,
                  }}
                >
                  <option value="">All tags</option>
                  {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
                </select>

                <select
                  value={filterEntityType ?? ''}
                  onChange={(e) => setFilterEntityType((e.target.value as EntityRefType) || null)}
                  style={{
                    fontSize: 10, padding: '2px 4px', background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)', border: '1px solid var(--border)',
                    borderRadius: 3,
                  }}
                >
                  <option value="">All types</option>
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                {(searchText || filterTag || filterEntityType) && (
                  <button
                    onClick={handleSaveCurrentQuery}
                    style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 3,
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text-muted)', cursor: 'pointer',
                    }}
                  >
                    Save query
                  </button>
                )}
              </div>

              {/* Saved queries */}
              {savedQueries.length > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {savedQueries.map((q) => (
                    <span key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        onClick={() => handleApplyQuery(q)}
                        style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 10,
                          border: '1px solid #a855f740', background: '#a855f710',
                          color: '#a855f7', cursor: 'pointer',
                        }}
                      >
                        {q.label}
                      </button>
                      <button
                        onClick={() => deleteSavedQuery(q.id)}
                        style={{
                          fontSize: 8, color: 'var(--text-muted)', background: 'transparent',
                          border: 'none', cursor: 'pointer', padding: 0,
                        }}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredNotes.length === 0 ? (
                <div style={{ padding: 16, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No notes match the current filters.
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setSelectedId(note.id); setEditing(false) }}
                    style={{
                      padding: '8px 10px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      background: note.id === selectedId ? 'var(--accent)08' : 'transparent',
                      borderLeft: note.id === selectedId ? '3px solid #a855f7' : '3px solid transparent',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {note.title}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {note.content.slice(0, 60)}{note.content.length > 60 ? '...' : ''}
                    </div>
                    {note.tags.length > 0 && (
                      <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {note.tags.map((t) => (
                          <span key={t} style={{
                            fontSize: 9, padding: '1px 4px', borderRadius: 3,
                            background: '#a855f718', color: '#a855f7',
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                    {note.linked_to.length > 0 && (
                      <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {note.linked_to.map((ref) => (
                          <span key={`${ref.type}-${ref.id}`} style={{
                            fontSize: 9, padding: '1px 4px', borderRadius: 3,
                            background: `${TYPE_COLORS[ref.type]}18`,
                            color: TYPE_COLORS[ref.type],
                          }}>
                            {ref.label ?? ref.id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Center: note editor/viewer */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedNote ? (
              editing ? (
                <NoteEditor
                  title={editTitle}
                  content={editContent}
                  tags={editTags}
                  onTitleChange={setEditTitle}
                  onContentChange={setEditContent}
                  onTagsChange={setEditTags}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditing(false)}
                />
              ) : (
                <NoteViewer
                  note={selectedNote}
                  onEdit={() => handleStartEdit(selectedNote)}
                  onDelete={() => { deleteNote(selectedNote.id); setSelectedId(null) }}
                />
              )
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a note from the list or create a new one.
              </div>
            )}
          </div>

          {/* Right: entity links panel */}
          {selectedNote && !editing && (
            <div style={{
              width: 220, flexShrink: 0, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', overflowY: 'auto', padding: '12px 10px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 8,
              }}>
                Linked Entities
              </div>

              {selectedNote.linked_to.map((ref) => (
                <div key={`${ref.type}-${ref.id}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 6px', marginBottom: 3, borderRadius: 3,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 11, color: TYPE_COLORS[ref.type] }}>
                    {ref.label ?? ref.id}
                  </span>
                  <button
                    onClick={() => removeLink(selectedNote.id, ref.id)}
                    style={{
                      fontSize: 9, color: '#ef4444', background: 'transparent',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    x
                  </button>
                </div>
              ))}

              {/* Add link */}
              {availableEntities.length > 0 && (
                <>
                  <div style={{
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                    color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 12, marginBottom: 4,
                  }}>
                    Add Link
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {availableEntities
                      .filter((e) => !selectedNote.linked_to.some((l) => l.id === e.id))
                      .map((e) => (
                        <button
                          key={`${e.type}-${e.id}`}
                          onClick={() => addLink(selectedNote.id, e)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            fontSize: 10, padding: '3px 6px', marginBottom: 2,
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: 3, color: TYPE_COLORS[e.type], cursor: 'pointer',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', marginRight: 4 }}>{e.type}:</span>
                          {e.label ?? e.id}
                        </button>
                      ))}
                  </div>
                </>
              )}

              {/* Meta info */}
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 16, marginBottom: 4,
              }}>
                Info
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Created: {new Date(selectedNote.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Updated: {new Date(selectedNote.updated_at).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Note Editor
// ---------------------------------------------------------------------------

function NoteEditor({ title, content, tags, onTitleChange, onContentChange, onTagsChange, onSave, onCancel }: {
  title: string
  content: string
  tags: string
  onTitleChange: (v: string) => void
  onContentChange: (v: string) => void
  onTagsChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Note title..."
          style={{
            flex: 1, fontSize: 14, fontWeight: 600, padding: '4px 8px',
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 3,
          }}
        />
        <button onClick={onSave}
          style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 3,
            border: '1px solid #22c55e', background: '#22c55e18', color: '#22c55e',
            cursor: 'pointer', fontWeight: 600,
          }}>
          Save
        </button>
        <button onClick={onCancel}
          style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 3,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          Cancel
        </button>
      </div>

      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <input
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Tags (comma-separated)..."
          style={{
            width: '100%', fontSize: 11, padding: '4px 8px',
            background: 'var(--bg-primary)', color: '#a855f7',
            border: '1px solid var(--border)', borderRadius: 3,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Write your note here (markdown supported)..."
        style={{
          flex: 1, padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          border: 'none', outline: 'none', fontFamily: 'inherit', resize: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Note Viewer
// ---------------------------------------------------------------------------

function NoteViewer({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '8px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {note.title}
        </span>
        <button onClick={onEdit}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 3,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}>
          Edit
        </button>
        <button onClick={() => { if (confirm('Delete this note?')) onDelete() }}
          style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 3,
            border: '1px solid #ef4444', background: 'transparent',
            color: '#ef4444', cursor: 'pointer',
          }}>
          Delete
        </button>
      </div>

      {note.tags.length > 0 && (
        <div style={{
          padding: '6px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 4, flexWrap: 'wrap', flexShrink: 0,
        }}>
          {note.tags.map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 10,
              background: '#a855f718', color: '#a855f7',
            }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{
          fontSize: 13, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap',
        }}>
          {note.content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty note. Click Edit to add content.</span>}
        </div>
      </div>
    </div>
  )
}
