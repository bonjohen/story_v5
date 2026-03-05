/**
 * Series Dashboard Page — shows arc progress, bible summary, thread overview,
 * and episode timeline for a specific series.
 * Route: /series/:seriesId
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSeriesStore } from '../store/seriesStore.ts'
import type { SeriesStatusSummary, ThreadAgeInfo, ThreadHealthMetrics } from '../seriesManager.ts'
import type { Series, PlotThread, BibleCharacter, EpisodeSlot, CanonTimelineEntry } from '../types.ts'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        color,
        background: `${color}1a`,
        padding: '2px 8px',
        borderRadius: 3,
      }}
    >
      {label}
    </span>
  )
}

function healthColor(status: ThreadHealthMetrics['status']): string {
  if (status === 'healthy') return '#22c55e'
  if (status === 'warning') return '#f59e0b'
  return '#ef4444'
}

function urgencyColor(urgency: PlotThread['urgency']): string {
  if (urgency === 'critical') return '#ef4444'
  if (urgency === 'high') return '#f97316'
  if (urgency === 'medium') return '#f59e0b'
  return '#94a3b8'
}

function slotStatusColor(status: EpisodeSlot['status']): string {
  if (status === 'canonized') return '#22c55e'
  if (status === 'reviewing') return '#f59e0b'
  return '#3b82f6'
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
        {title}
      </span>
      {right}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '16px 20px',
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Arc Progress
// ---------------------------------------------------------------------------

function ArcProgress({ series }: { series: Series }) {
  const arc = series.overarching_arc
  const totalPhases = arc.phase_history.length + arc.remaining_phases.length
  const completedPhases = arc.phase_history.filter((p) => p.exited_at_episode).length

  return (
    <Card>
      <SectionHeader title="Overarching Arc" right={<Badge label={arc.archetype_name} color="#8b5cf6" />} />

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span>Phase {completedPhases + 1} of {totalPhases}</span>
          <span>{Math.round(((completedPhases) / totalPhases) * 100)}% complete</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(completedPhases / totalPhases) * 100}%`,
              background: '#8b5cf6',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
        Current: <strong>{arc.current_phase}</strong>
      </div>

      {arc.remaining_phases.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Remaining: {arc.remaining_phases.join(' → ')}
        </div>
      )}

      {arc.remaining_phases.length === 0 && (
        <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
          Arc complete
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Thread Overview
// ---------------------------------------------------------------------------

function ThreadOverview({ series, threadAges, threadHealth }: {
  series: Series
  threadAges: ThreadAgeInfo[]
  threadHealth: ThreadHealthMetrics | null
}) {
  const openThreads = series.bible.plot_threads.filter(
    (t) => t.status === 'open' || t.status === 'progressing',
  )

  return (
    <Card>
      <SectionHeader
        title="Plot Threads"
        right={threadHealth && <Badge label={threadHealth.status} color={healthColor(threadHealth.status)} />}
      />

      {openThreads.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No open plot threads.</p>
      )}

      {openThreads.map((thread) => {
        const ageInfo = threadAges.find((a) => a.thread_id === thread.id)
        return (
          <div
            key={thread.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                {thread.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {ageInfo ? `${ageInfo.age_in_episodes} ep old, ${ageInfo.episodes_since_progression} since progress` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {ageInfo?.stalled && <Badge label="stalled" color="#ef4444" />}
              <Badge label={thread.urgency} color={urgencyColor(thread.urgency)} />
            </div>
          </div>
        )
      })}

      {threadHealth && (
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          {threadHealth.total_open} open · {threadHealth.recently_progressed} recently progressed ·
          {' '}{threadHealth.stalled_count} stalled · Health: {Math.round(threadHealth.health_ratio * 100)}%
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Bible Summary
// ---------------------------------------------------------------------------

function BibleSummary({ series }: { series: Series }) {
  const bible = series.bible
  const alive = bible.characters.filter((c) => c.status === 'alive')
  const dead = bible.characters.filter((c) => c.status === 'dead')

  return (
    <Card>
      <SectionHeader title="Story Bible" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <StatBox label="Characters" value={bible.characters.length} detail={`${alive.length} alive, ${dead.length} dead`} />
        <StatBox label="Places" value={bible.places.length} />
        <StatBox label="Objects" value={bible.objects.length} />
        <StatBox label="World Rules" value={bible.world_rules.length} />
      </div>

      {alive.length > 0 && (
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Key Characters
          </div>
          {alive.slice(0, 5).map((c) => (
            <div key={c.id} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '3px 0' }}>
              <strong>{c.name}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{c.role}</span>
              {c.current_location && (
                <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>@ {c.current_location}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function StatBox({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
      {detail && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{detail}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Canon Timeline
// ---------------------------------------------------------------------------

function TimelineSection({ series }: { series: Series }) {
  const episodes = series.canon_timeline.episodes

  return (
    <Card>
      <SectionHeader title="Canon Timeline" right={<Badge label={`${episodes.length} episodes`} color="#3b82f6" />} />

      {episodes.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No canon episodes yet.</p>
      )}

      {episodes.map((ep, i) => (
        <div
          key={ep.episode_id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            borderBottom: i < episodes.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#8b5cf6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {ep.slot}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ep.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {ep.episode_id} · Phase: {ep.overarching_phase}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {new Date(ep.canonized_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Episode Slots
// ---------------------------------------------------------------------------

function SlotsSection({ series }: { series: Series }) {
  return (
    <Card>
      <SectionHeader title="Episode Slots" />

      {series.slots.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No episode slots yet.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
        {series.slots.map((slot) => (
          <div
            key={slot.slot_number}
            style={{
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Slot {slot.slot_number}</span>
              <Badge label={slot.status} color={slotStatusColor(slot.status)} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {slot.candidates.length} candidate{slot.candidates.length !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Dashboard Toolbar
// ---------------------------------------------------------------------------

function DashboardToolbar({ series }: { series: Series | null }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        height: 42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/series')}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Back to series browser"
        >
          {'\u2190'} Series
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {series?.title ?? 'Loading...'}
        </span>
      </div>

      {series && (
        <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{series.episode_count} episodes</span>
          <span>·</span>
          <span>{series.theme_tone.genre_name}</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function SeriesDashboardPage() {
  const { seriesId } = useParams<{ seriesId: string }>()
  const currentSeries = useSeriesStore((s) => s.currentSeries)
  const loading = useSeriesStore((s) => s.currentSeriesLoading)
  const error = useSeriesStore((s) => s.currentSeriesError)
  const loadSeries = useSeriesStore((s) => s.loadSeries)
  const threadAges = useSeriesStore((s) => s.threadAges)
  const threadHealth = useSeriesStore((s) => s.threadHealth)

  useEffect(() => {
    if (seriesId) {
      void loadSeries(seriesId)
    }
  }, [seriesId, loadSeries])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <DashboardToolbar series={currentSeries} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Loading series...
          </p>
        )}

        {error && (
          <div style={{ padding: 20, color: '#ef4444', textAlign: 'center' }}>
            <p style={{ fontSize: 14, marginBottom: 4 }}>Failed to load series</p>
            <p style={{ fontSize: 12 }}>{error}</p>
          </div>
        )}

        {currentSeries && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {currentSeries.title}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                {currentSeries.description}
              </p>
            </div>

            {/* Two-column layout for arc + threads */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
              <ArcProgress series={currentSeries} />
              <ThreadOverview series={currentSeries} threadAges={threadAges} threadHealth={threadHealth} />
            </div>

            {/* Bible summary */}
            <BibleSummary series={currentSeries} />

            {/* Timeline and slots */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TimelineSection series={currentSeries} />
              <SlotsSection series={currentSeries} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
