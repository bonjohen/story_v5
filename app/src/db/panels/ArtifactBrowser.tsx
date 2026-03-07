/**
 * Item 9.4 — Artifact browser panel.
 * List all artifacts for a story, grouped by type, with status badges.
 */
import { useMemo } from 'react'
import { useDbQuery } from '../hooks.ts'
import { listArtifactsByStory } from '../repository/artifactRepo.ts'
import type { ArtifactRow, StoryRow } from '../types.ts'

export function ArtifactBrowser({ stories }: { stories: StoryRow[] }) {
  const storyId = stories.length > 0 ? stories[0].story_id : null

  const { data: artifacts } = useDbQuery<ArtifactRow[]>(
    (db) => storyId ? listArtifactsByStory(db, storyId) : [],
    [storyId],
  )

  const grouped = useMemo(() => {
    if (!artifacts) return []
    const map = new Map<string, ArtifactRow[]>()
    for (const a of artifacts) {
      if (!map.has(a.artifact_type)) map.set(a.artifact_type, [])
      map.get(a.artifact_type)!.push(a)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [artifacts])

  if (!storyId) {
    return <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>No stories indexed.</div>
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {artifacts?.length ?? 0} artifact{(artifacts?.length ?? 0) !== 1 ? 's' : ''} total
      </div>

      {grouped.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          No artifacts found. Run generation pipeline then index to DB.
        </div>
      )}

      {grouped.map(([type, items]) => (
        <div key={type} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 6,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {type}
            <span style={{
              fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
              background: 'var(--bg-elevated)', borderRadius: 8, padding: '0 6px',
            }}>
              {items.length}
            </span>
          </div>

          {items.map((a) => (
            <div key={a.artifact_id} style={{
              padding: '6px 10px', marginBottom: 3,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{a.name}</span>
                {a.generator_name && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
                    via {a.generator_name}
                  </span>
                )}
                {a.file_path && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {a.file_path}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 8,
                background: statusColor(a.status), color: '#fff', fontWeight: 600,
              }}>
                {a.status ?? 'unknown'}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function statusColor(status: string | null): string {
  const map: Record<string, string> = {
    draft: '#f59e0b', generated: '#3b82f6', reviewed: '#8b5cf6',
    approved: '#22c55e', archived: '#6b7280', failed: '#ef4444',
  }
  return map[status ?? ''] ?? '#6b7280'
}
