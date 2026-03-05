/**
 * Thread Tracker Panel — kanban-style board showing plot threads by status.
 * Columns: Open, Progressing, Resolved.
 */

import type { PlotThread } from '../types.ts'
import type { ThreadAgeInfo } from '../seriesManager.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Thread card
// ---------------------------------------------------------------------------

function ThreadCard({ thread, ageInfo }: { thread: PlotThread; ageInfo?: ThreadAgeInfo }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${urgencyColor(thread.urgency)}`,
        borderRadius: 4,
        padding: '8px 10px',
        marginBottom: 6,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
        {thread.title}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.4 }}>
        {thread.description.length > 80
          ? `${thread.description.slice(0, 80)}...`
          : thread.description}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
          color: urgencyColor(thread.urgency),
          background: `${urgencyColor(thread.urgency)}1a`,
          padding: '1px 6px', borderRadius: 3,
        }}>
          {thread.urgency}
        </span>

        {ageInfo && ageInfo.stalled && (
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            color: '#ef4444', background: 'rgba(239,68,68,0.1)',
            padding: '1px 6px', borderRadius: 3,
          }}>
            stalled
          </span>
        )}

        {ageInfo && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {ageInfo.age_in_episodes} ep old
          </span>
        )}
      </div>

      {thread.related_characters.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          Characters: {thread.related_characters.join(', ')}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

function Column({ title, threads, ageInfoMap, color }: {
  title: string
  threads: PlotThread[]
  ageInfoMap: Map<string, ThreadAgeInfo>
  color: string
}) {
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{
        padding: '8px 10px',
        borderBottom: `2px solid ${color}`,
        marginBottom: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          color, letterSpacing: '0.5px',
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          background: 'var(--border)', padding: '1px 6px', borderRadius: 8,
        }}>
          {threads.length}
        </span>
      </div>

      <div style={{ padding: '0 4px' }}>
        {threads.map((t) => (
          <ThreadCard key={t.id} thread={t} ageInfo={ageInfoMap.get(t.id)} />
        ))}
        {threads.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>
            None
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface ThreadTrackerPanelProps {
  threads: PlotThread[]
  threadAges: ThreadAgeInfo[]
}

export function ThreadTrackerPanel({ threads, threadAges }: ThreadTrackerPanelProps) {
  const ageInfoMap = new Map(threadAges.map((a) => [a.thread_id, a]))

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
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          Plot Thread Tracker
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {threads.length} total · {open.length + progressing.length} active · {resolved.length} resolved
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        overflowX: 'auto',
        overflowY: 'auto',
      }}>
        <Column title="Open" threads={open} ageInfoMap={ageInfoMap} color={columnColor('open')} />
        <Column title="Progressing" threads={progressing} ageInfoMap={ageInfoMap} color={columnColor('progressing')} />
        <Column title="Resolved" threads={resolved} ageInfoMap={ageInfoMap} color={columnColor('resolved')} />
        {abandoned.length > 0 && (
          <Column title="Abandoned" threads={abandoned} ageInfoMap={ageInfoMap} color={columnColor('abandoned')} />
        )}
      </div>
    </div>
  )
}
