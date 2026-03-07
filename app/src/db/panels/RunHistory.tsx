/**
 * Item 9.5 — Run history panel.
 * List all generation/validation runs for a story with timestamps and status.
 */
import { useDbQuery } from '../hooks.ts'
import { listRunsByStory } from '../repository/runRepo.ts'
import type { RunRow, StoryRow } from '../types.ts'

export function RunHistory({ stories }: { stories: StoryRow[] }) {
  const storyId = stories.length > 0 ? stories[0].story_id : null

  const { data: runs } = useDbQuery<RunRow[]>(
    (db) => storyId ? listRunsByStory(db, storyId) : [],
    [storyId],
  )

  if (!storyId) {
    return <div style={{ padding: 20, fontSize: 12, color: 'var(--text-muted)' }}>No stories indexed.</div>
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {runs?.length ?? 0} run{(runs?.length ?? 0) !== 1 ? 's' : ''}
      </div>

      {(!runs || runs.length === 0) && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 20, textAlign: 'center' }}>
          No runs recorded. Run the generation pipeline then index to DB.
        </div>
      )}

      {(runs ?? []).map((r) => (
        <div key={r.run_id} style={{
          padding: '8px 10px', marginBottom: 4,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 4,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              {r.run_type}
            </span>
            <span style={{
              fontSize: 9, padding: '1px 6px', borderRadius: 8,
              background: runStatusColor(r.status), color: '#fff', fontWeight: 600,
            }}>
              {r.status}
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>Started: {formatTime(r.started_at)}</span>
            {r.finished_at && <span>Finished: {formatTime(r.finished_at)}</span>}
            {r.finished_at && r.started_at && (
              <span>Duration: {formatDuration(r.started_at, r.finished_at)}</span>
            )}
          </div>
          {r.tool_name && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Tool: {r.tool_name}</div>
          )}
          {r.notes && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {r.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function runStatusColor(status: string): string {
  const map: Record<string, string> = {
    running: '#f59e0b', completed: '#22c55e', failed: '#ef4444',
    cancelled: '#6b7280',
  }
  return map[status] ?? '#6b7280'
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return iso
  }
}

function formatDuration(start: string, end: string): string {
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  } catch {
    return ''
  }
}
