/**
 * Notes Store — CRUD, tag index, backlink computation, saved queries.
 * Persisted to localStorage.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note, EntityRef, EntityRefType, SavedQuery } from '../types.ts'

export interface NotesStoreState {
  notes: Note[]
  savedQueries: SavedQuery[]

  // CRUD
  addNote: (title: string, content: string, tags: string[], linked_to: EntityRef[]) => string
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'linked_to'>>) => void
  deleteNote: (id: string) => void

  // Links
  addLink: (noteId: string, ref: EntityRef) => void
  removeLink: (noteId: string, refId: string) => void

  // Queries
  saveQuery: (query: SavedQuery) => void
  deleteSavedQuery: (id: string) => void

  // Derived (pure functions, not state)
  getNotesForEntity: (entityId: string) => Note[]
  getTagIndex: () => Map<string, Note[]>
  searchNotes: (opts: { text?: string; tags?: string[]; entityType?: EntityRefType }) => Note[]
}

function genId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

export const useNotesStore = create<NotesStoreState>()(
  persist(
    (set, get) => ({
      notes: [],
      savedQueries: [],

      addNote: (title, content, tags, linked_to) => {
        const id = genId()
        const ts = now()
        const note: Note = { id, title, content, tags, linked_to, created_at: ts, updated_at: ts }
        set((s) => ({ notes: [...s.notes, note] }))
        return id
      },

      updateNote: (id, updates) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? { ...n, ...updates, updated_at: now() }
              : n,
          ),
        }))
      },

      deleteNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      },

      addLink: (noteId, ref) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId && !n.linked_to.some((l) => l.id === ref.id && l.type === ref.type)
              ? { ...n, linked_to: [...n.linked_to, ref], updated_at: now() }
              : n,
          ),
        }))
      },

      removeLink: (noteId, refId) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === noteId
              ? { ...n, linked_to: n.linked_to.filter((l) => l.id !== refId), updated_at: now() }
              : n,
          ),
        }))
      },

      saveQuery: (query) => {
        set((s) => ({
          savedQueries: [...s.savedQueries.filter((q) => q.id !== query.id), query],
        }))
      },

      deleteSavedQuery: (id) => {
        set((s) => ({ savedQueries: s.savedQueries.filter((q) => q.id !== id) }))
      },

      getNotesForEntity: (entityId) => {
        return get().notes.filter((n) => n.linked_to.some((l) => l.id === entityId))
      },

      getTagIndex: () => {
        const index = new Map<string, Note[]>()
        for (const note of get().notes) {
          for (const tag of note.tags) {
            const list = index.get(tag) ?? []
            list.push(note)
            index.set(tag, list)
          }
        }
        return index
      },

      searchNotes: (opts) => {
        const { text, tags, entityType } = opts
        const textLower = text?.toLowerCase()
        return get().notes.filter((n) => {
          if (textLower && !n.title.toLowerCase().includes(textLower) && !n.content.toLowerCase().includes(textLower)) return false
          if (tags && tags.length > 0 && !tags.some((t) => n.tags.includes(t))) return false
          if (entityType && !n.linked_to.some((l) => l.type === entityType)) return false
          return true
        })
      },
    }),
    {
      name: 'story-notes-store',
    },
  ),
)
