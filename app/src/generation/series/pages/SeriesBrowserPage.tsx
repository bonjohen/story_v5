/**
 * Series Browser Page — lists all series with status summaries.
 * Route: /series
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSeriesStore } from '../store/seriesStore.ts'
import type { SeriesListEntry } from '../store/seriesStore.ts'

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ label, color }: { label: string; color: string }) {
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
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Series card
// ---------------------------------------------------------------------------

function SeriesCard({ entry, onClick }: { entry: SeriesListEntry; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px 20px',
        background: hovered ? 'var(--bg-surface-hover, rgba(255,255,255,0.05))' : 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 12,
      }}
      aria-label={`Open series: ${entry.title}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {entry.title}
        </span>
        <StatusBadge
          label={`${entry.episode_count} ep`}
          color="#3b82f6"
        />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
        {entry.description}
      </p>

      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Phase: {entry.current_phase}</span>
        <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>
        {'\u2699'}
      </div>
      <p style={{ fontSize: 14, marginBottom: 8 }}>No series found</p>
      <p style={{ fontSize: 12 }}>
        Create a series using the generation pipeline to get started.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page toolbar
// ---------------------------------------------------------------------------

function SeriesToolbar() {
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
          onClick={() => navigate('/')}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Back to graph viewer"
        >
          {'\u2190'} Graphs
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Series Browser
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function SeriesBrowserPage() {
  const navigate = useNavigate()
  const seriesList = useSeriesStore((s) => s.seriesList)
  const loading = useSeriesStore((s) => s.seriesListLoading)
  const loadSeriesList = useSeriesStore((s) => s.loadSeriesList)

  useEffect(() => {
    void loadSeriesList()
  }, [loadSeriesList])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <SeriesToolbar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            Chapter Stories
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Persistent, ever-growing narratives composed of sequential episodes.
          </p>

          {loading && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Loading series...
            </p>
          )}

          {!loading && seriesList.length === 0 && <EmptyState />}

          {!loading && seriesList.map((entry) => (
            <SeriesCard
              key={entry.series_id}
              entry={entry}
              onClick={() => navigate(`/series/${entry.series_id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
