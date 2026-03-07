/**
 * Item 9.2 — Entity search panel. Search entities by name/type across all stories.
 */
import { useState, useMemo } from 'react'
import { useDbQuery } from '../hooks.ts'
import { listEntitiesByStory } from '../repository/entityRepo.ts'
import type { EntityRow, StoryRow } from '../types.ts'

export function EntitySearch({ stories }: { stories: StoryRow[] }) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const storyId = stories.length > 0 ? stories[0].story_id : null

  const { data: entities } = useDbQuery<EntityRow[]>(
    (db) => storyId ? listEntitiesByStory(db, storyId) : [],
    [storyId],
  )

  const filtered = useMemo(() => {
    if (!entities) return []
    let list = entities
    if (typeFilter !== 'all') list = list.filter((e) => e.entity_type === typeFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(q) || (e.short_description ?? '').toLowerCase().includes(q))
    }
    return list
  }, [entities, query, typeFilter])

  const types = useMemo(() => {
    if (!entities) return []
    return [...new Set(entities.map((e) => e.entity_type))].sort()
  }, [entities])

  if (!storyId) {
    return <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>No stories indexed. Import a story instance first.</div>
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search entities by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, padding: '6px 10px', fontSize: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)',
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '6px 8px', fontSize: 11,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)',
          }}
        >
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        {filtered.length} of {entities?.length ?? 0} entities
      </div>

      {filtered.map((e) => (
        <div key={e.entity_id} style={{
          padding: '8px 10px', marginBottom: 4,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</span>
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 8,
              background: typeColor(e.entity_type), color: '#fff', fontWeight: 600,
            }}>
              {e.entity_type}
            </span>
          </div>
          {e.short_description && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              {e.short_description.slice(0, 120)}{e.short_description.length > 120 ? '...' : ''}
            </div>
          )}
          {e.role_label && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'inline-block' }}>
              Role: {e.role_label}
            </span>
          )}
        </div>
      ))}

      {filtered.length === 0 && entities && entities.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          No entities match your search.
        </div>
      )}
    </div>
  )
}

function typeColor(type: string): string {
  const map: Record<string, string> = {
    character: '#3b82f6', location: '#22c55e', item: '#f59e0b',
    faction: '#8b5cf6', thread: '#ef4444', rule: '#6b7280',
    motif: '#ec4899', secret: '#f97316', system: '#06b6d4',
  }
  return map[type] ?? '#6b7280'
}
