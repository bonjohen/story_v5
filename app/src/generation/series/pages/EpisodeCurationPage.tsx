/**
 * Episode Curation Page — review episode candidates, compare side-by-side,
 * canonize or archive episodes.
 * Route: /series/:seriesId/slot/:slotNumber
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSeriesStore } from '../store/seriesStore.ts'
import type { Series, EpisodeSlot, Episode } from '../types.ts'

// ---------------------------------------------------------------------------
// Badge component
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

function canonStatusColor(status: string): string {
  if (status === 'canon') return '#22c55e'
  if (status === 'alternate') return '#94a3b8'
  return '#f59e0b'
}

// ---------------------------------------------------------------------------
// Candidate card
// ---------------------------------------------------------------------------

function CandidateCard({
  episodeId,
  episode,
  selected,
  onSelect,
}: {
  episodeId: string
  episode: Episode | null
  selected: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        background: selected
          ? 'rgba(139, 92, 246, 0.1)'
          : hovered
            ? 'var(--bg-surface-hover, rgba(255,255,255,0.05))'
            : 'var(--bg-surface)',
        border: `1px solid ${selected ? '#8b5cf6' : hovered ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s',
        marginBottom: 8,
      }}
      aria-label={`Select candidate ${episodeId}`}
      aria-pressed={selected}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {episode?.title ?? episodeId}
        </span>
        {episode && (
          <Badge label={episode.canon_status} color={canonStatusColor(episode.canon_status)} />
        )}
      </div>

      {episode && (
        <>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
            {episode.synopsis.length > 120 ? `${episode.synopsis.slice(0, 120)}...` : episode.synopsis}
          </p>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>Archetype: {episode.episodic_archetype_id}</span>
            <span>Phase: {episode.overarching_phase}</span>
          </div>
        </>
      )}

      {!episode && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Episode data not loaded</p>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Episode detail viewer
// ---------------------------------------------------------------------------

function EpisodeDetailView({ episode }: { episode: Episode }) {
  const [activeTab, setActiveTab] = useState<'summary' | 'delta' | 'artifacts'>('summary')

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {(['summary', 'delta', 'artifacts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              border: 'none',
              borderBottomStyle: 'solid',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 20px' }}>
        {activeTab === 'summary' && <SummaryTab episode={episode} />}
        {activeTab === 'delta' && <DeltaTab episode={episode} />}
        {activeTab === 'artifacts' && <ArtifactsTab episode={episode} />}
      </div>
    </div>
  )
}

function SummaryTab({ episode }: { episode: Episode }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, marginTop: 0 }}>
        {episode.title}
      </h3>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
        {episode.synopsis}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Characters featured */}
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Characters Featured
          </div>
          {episode.summary.characters_featured.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</p>
          )}
          {episode.summary.characters_featured.map((c) => (
            <div key={c} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '2px 0' }}>
              {c}
            </div>
          ))}
        </div>

        {/* Key events */}
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Key Events
          </div>
          {episode.summary.key_events.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</p>
          )}
          {episode.summary.key_events.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '2px 0' }}>
              {e}
            </div>
          ))}
        </div>
      </div>

      {/* Threads advanced */}
      {episode.summary.plot_threads_advanced.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
            Plot Threads Advanced
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {episode.summary.plot_threads_advanced.map((t) => (
              <Badge key={t} label={t} color="#8b5cf6" />
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>Created: {new Date(episode.created_at).toLocaleString()}</span>
        <span>Slot: {episode.slot_number}</span>
        <span>Candidate: {episode.candidate_label}</span>
        {episode.genre_accent && <span>Accent: {episode.genre_accent}</span>}
      </div>
    </div>
  )
}

function DeltaTab({ episode }: { episode: Episode }) {
  const delta = episode.state_delta

  if (!delta) {
    return <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No state delta extracted.</p>
  }

  return (
    <div>
      <DeltaSection
        title="Characters Introduced"
        count={delta.characters_introduced.length}
        items={delta.characters_introduced.map((c) => `${c.name} (${c.role})`)}
      />

      <DeltaSection
        title="Character Updates"
        count={delta.character_updates.length}
        items={delta.character_updates.map((u) =>
          `${u.character_id}: ${u.transitions.map((t) => t.change).join(', ')}`,
        )}
      />

      <DeltaSection
        title="Places Introduced"
        count={delta.places_introduced.length}
        items={delta.places_introduced.map((p) => `${p.name} (${p.type})`)}
      />

      <DeltaSection
        title="Threads Introduced"
        count={delta.threads_introduced.length}
        items={delta.threads_introduced.map((t) => `${t.title} [${t.urgency}]`)}
      />

      <DeltaSection
        title="Thread Updates"
        count={delta.thread_updates.length}
        items={delta.thread_updates.map((u) =>
          `${u.thread_id}${u.status_change ? ` → ${u.status_change}` : ''}`,
        )}
      />

      {delta.arc_phase_change && (
        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6', marginBottom: 4 }}>
            Arc Phase Change
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
            {delta.arc_phase_change.from_phase} {'\u2192'} {delta.arc_phase_change.to_phase}
          </div>
        </div>
      )}
    </div>
  )
}

function DeltaSection({ title, count, items }: { title: string; count: number; items: string[] }) {
  if (count === 0) return null

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
        {title} ({count})
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '2px 0' }}>
          {item}
        </div>
      ))}
    </div>
  )
}

function ArtifactsTab({ episode }: { episode: Episode }) {
  return (
    <div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
        Generated Artifacts
      </div>

      {Object.entries(episode.artifacts).map(([key, value]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderBottom: '1px solid var(--border)',
            fontSize: 12,
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{key}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {Array.isArray(value) ? `${value.length} files` : value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Curation toolbar
// ---------------------------------------------------------------------------

function CurationToolbar({
  series,
  slot,
  selectedEpisodeId,
}: {
  series: Series | null
  slot: EpisodeSlot | null
  selectedEpisodeId: string | null
}) {
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
          onClick={() => series ? navigate(`/series/${series.series_id}`) : navigate('/series')}
          style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Back to series dashboard"
        >
          {'\u2190'} Dashboard
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {slot ? `Slot ${slot.slot_number} — ${slot.candidates.length} candidate${slot.candidates.length !== 1 ? 's' : ''}` : 'Episode Curation'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {slot && slot.status !== 'canonized' && selectedEpisodeId && (
          <button
            style={{
              fontSize: 11,
              padding: '4px 12px',
              borderRadius: 4,
              border: '1px solid #22c55e',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            aria-label="Canonize selected episode"
          >
            Canonize
          </button>
        )}
        {slot && slot.status === 'canonized' && (
          <Badge label="canonized" color="#22c55e" />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function EpisodeCurationPage() {
  const { seriesId, slotNumber } = useParams<{ seriesId: string; slotNumber: string }>()
  const currentSeries = useSeriesStore((s) => s.currentSeries)
  const loading = useSeriesStore((s) => s.currentSeriesLoading)
  const loadSeries = useSeriesStore((s) => s.loadSeries)
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null)

  useEffect(() => {
    if (seriesId && !currentSeries) {
      void loadSeries(seriesId)
    }
  }, [seriesId, currentSeries, loadSeries])

  const slotNum = slotNumber ? parseInt(slotNumber, 10) : null
  const slot = currentSeries?.slots.find((s) => s.slot_number === slotNum) ?? null

  // Find episodes for this slot from episode index
  const candidates = slot
    ? slot.candidates.map((id) =>
        currentSeries!.episode_index.episodes.find((e) => e.episode_id === id) ?? null,
      )
    : []

  // Select first candidate by default
  useEffect(() => {
    if (slot && slot.candidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(slot.candidates[0])
    }
  }, [slot, selectedCandidate])

  const selectedEpisode = selectedCandidate
    ? currentSeries?.episode_index.episodes.find((e) => e.episode_id === selectedCandidate) ?? null
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <CurationToolbar
        series={currentSeries}
        slot={slot}
        selectedEpisodeId={selectedCandidate}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: candidate list */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            padding: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
            Candidates
          </div>

          {loading && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading...</p>}

          {!loading && slot && slot.candidates.map((id, i) => (
            <CandidateCard
              key={id}
              episodeId={id}
              episode={candidates[i]}
              selected={selectedCandidate === id}
              onSelect={() => setSelectedCandidate(id)}
            />
          ))}

          {!loading && (!slot || slot.candidates.length === 0) && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              No candidates for this slot.
            </p>
          )}
        </div>

        {/* Right: episode detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {selectedEpisode && <EpisodeDetailView episode={selectedEpisode} />}

          {!selectedEpisode && selectedCandidate && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>Episode data not available</p>
              <p style={{ fontSize: 12 }}>Episode {selectedCandidate} may not be in the index yet.</p>
            </div>
          )}

          {!selectedCandidate && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>Select a candidate to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
