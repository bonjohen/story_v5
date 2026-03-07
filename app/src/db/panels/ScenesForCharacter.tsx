/**
 * Item 9.3 — "Scenes for Character" view.
 * Select a character, see all scenes they participate in.
 */
import { useState } from 'react'
import { useDbQuery } from '../hooks.ts'
import { listEntitiesByType } from '../repository/entityRepo.ts'
import type { EntityRow, StoryRow, SceneRow } from '../types.ts'
import { listScenesForCharacter } from '../queries.ts'

export function ScenesForCharacter({ stories }: { stories: StoryRow[] }) {
  const storyId = stories.length > 0 ? stories[0].story_id : null
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  const { data: characters } = useDbQuery<EntityRow[]>(
    (db) => storyId ? listEntitiesByType(db, storyId, 'character') : [],
    [storyId],
  )

  const { data: scenes } = useDbQuery<Array<SceneRow & { participation_role: string | null }>>(
    (db) => selectedCharacterId ? listScenesForCharacter(db, selectedCharacterId) : [],
    [selectedCharacterId],
  )

  if (!storyId) {
    return <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>No stories indexed.</div>
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
          Select Character
        </label>
        <select
          value={selectedCharacterId ?? ''}
          onChange={(e) => setSelectedCharacterId(e.target.value || null)}
          style={{
            width: '100%', maxWidth: 300, padding: '6px 8px', fontSize: 12,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)',
          }}
        >
          <option value="">-- Select a character --</option>
          {(characters ?? []).map((c) => (
            <option key={c.entity_id} value={c.entity_id}>{c.name} {c.role_label ? `(${c.role_label})` : ''}</option>
          ))}
        </select>
      </div>

      {selectedCharacterId && scenes && (
        <>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
            {scenes.length} scene{scenes.length !== 1 ? 's' : ''} found
          </div>

          {scenes.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
              No scenes found for this character.
            </div>
          )}

          {scenes.map((s, i) => (
            <div key={s.scene_id} style={{
              padding: '8px 10px', marginBottom: 4,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {s.title ?? `Scene ${i + 1}`}
                </span>
                {s.participation_role && (
                  <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 8,
                    background: '#3b82f6', color: '#fff', fontWeight: 600,
                  }}>
                    {s.participation_role}
                  </span>
                )}
              </div>
              {s.summary && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {s.summary.slice(0, 150)}{s.summary.length > 150 ? '...' : ''}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10 }}>
                {s.scene_type && <span>Type: {s.scene_type}</span>}
                {s.timeline_order != null && <span>Timeline: #{s.timeline_order}</span>}
                {s.archetype_node_id && <span>Node: {s.archetype_node_id}</span>}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
