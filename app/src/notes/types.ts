/**
 * Notes types — Obsidian-like notes attached to any entity.
 */

export type EntityRefType = 'character' | 'place' | 'object' | 'faction' | 'thread' | 'scene' | 'node' | 'other'

export interface EntityRef {
  type: EntityRefType
  id: string
  label?: string
}

export interface Note {
  id: string
  title: string
  content: string          // markdown
  tags: string[]
  linked_to: EntityRef[]
  created_at: string       // ISO date
  updated_at: string       // ISO date
}

export interface SavedQuery {
  id: string
  label: string
  tags?: string[]
  entity_type?: EntityRefType
  text?: string
}
