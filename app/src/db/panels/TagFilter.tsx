/**
 * Item 9.6 — Tag-based filtering panel.
 * Browse tags and see which objects are tagged with each.
 */
import { useState } from 'react'
import { useDbQuery } from '../hooks.ts'
import { listTags, listObjectsWithTag } from '../repository/tagRepo.ts'
import type { TagRow, TagAssignmentRow, StoryRow } from '../types.ts'

export function TagFilter({ stories }: { stories: StoryRow[] }) {
  const projectId = stories.length > 0 ? stories[0].project_id : null
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  const { data: tags } = useDbQuery<TagRow[]>(
    (db) => listTags(db, projectId ?? undefined),
    [projectId],
  )

  const { data: assignments } = useDbQuery<TagAssignmentRow[]>(
    (db) => selectedTagId ? listObjectsWithTag(db, selectedTagId) : [],
    [selectedTagId],
  )

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {tags?.length ?? 0} tag{(tags?.length ?? 0) !== 1 ? 's' : ''}
      </div>

      {(!tags || tags.length === 0) && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          No tags created. Assign tags via the tag system to see them here.
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {(tags ?? []).map((t) => (
          <button
            key={t.tag_id}
            onClick={() => setSelectedTagId(selectedTagId === t.tag_id ? null : t.tag_id)}
            style={{
              padding: '4px 10px', fontSize: 11, borderRadius: 12,
              border: selectedTagId === t.tag_id ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: selectedTagId === t.tag_id ? 'var(--accent)15' : 'var(--bg-surface)',
              color: selectedTagId === t.tag_id ? 'var(--accent)' : 'var(--text-primary)',
              cursor: 'pointer', fontWeight: selectedTagId === t.tag_id ? 600 : 400,
            }}
          >
            {t.tag_name}
            {t.tag_type && <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>({t.tag_type})</span>}
          </button>
        ))}
      </div>

      {selectedTagId && assignments && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {assignments.length} object{assignments.length !== 1 ? 's' : ''} tagged
          </div>

          {assignments.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
              No objects have this tag.
            </div>
          )}

          {assignments.map((a) => (
            <div key={a.tag_assignment_id} style={{
              padding: '6px 10px', marginBottom: 3,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                {a.object_id.slice(0, 12)}...
              </span>
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 8,
                background: '#6b7280', color: '#fff', fontWeight: 600,
              }}>
                {a.object_type}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
