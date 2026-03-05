/**
 * Arc Visualizer Panel — displays the overarching archetype arc
 * with series progress overlay: completed phases solid, current
 * highlighted, remaining dimmed.
 */

import type { OverarchingArc, CanonTimeline, ArcPhaseEntry } from '../types.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function phaseStatusColor(
  nodeId: string,
  arc: OverarchingArc,
): { bg: string; border: string; text: string; label: string } {
  if (arc.current_phase === nodeId) {
    return { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', text: '#8b5cf6', label: 'current' }
  }
  const entry = arc.phase_history.find((p) => p.node_id === nodeId && p.exited_at_episode)
  if (entry) {
    return { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', text: '#22c55e', label: 'completed' }
  }
  return { bg: 'var(--bg-surface)', border: 'var(--border)', text: 'var(--text-muted)', label: 'upcoming' }
}

// ---------------------------------------------------------------------------
// Phase node
// ---------------------------------------------------------------------------

function PhaseNode({
  nodeId,
  index,
  arc,
  timeline,
}: {
  nodeId: string
  index: number
  arc: OverarchingArc
  timeline: CanonTimeline
}) {
  const status = phaseStatusColor(nodeId, arc)
  const entry = arc.phase_history.find((p) => p.node_id === nodeId)
  const episodesInPhase = timeline.episodes.filter((e) => e.overarching_phase === nodeId)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
      {/* Index circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `2px solid ${status.border}`,
          background: status.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: status.text,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </div>

      {/* Phase info */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: status.text }}>
          {nodeId}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {entry?.entered_at_episode && `Entered: ${entry.entered_at_episode}`}
          {entry?.exited_at_episode && ` · Exited: ${entry.exited_at_episode}`}
          {episodesInPhase.length > 0 && ` · ${episodesInPhase.length} episode${episodesInPhase.length !== 1 ? 's' : ''}`}
          {!entry && 'Upcoming'}
        </div>
      </div>

      {/* Status badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          color: status.text,
          background: status.bg,
          padding: '2px 8px',
          borderRadius: 3,
        }}
      >
        {status.label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Connector line between phases
// ---------------------------------------------------------------------------

function Connector({ completed }: { completed: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 13, marginBottom: 4 }}>
      <div
        style={{
          width: 2,
          height: 16,
          background: completed ? '#22c55e' : 'var(--border)',
          borderRadius: 1,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface ArcVisualizerPanelProps {
  arc: OverarchingArc
  timeline: CanonTimeline
}

export function ArcVisualizerPanel({ arc, timeline }: ArcVisualizerPanelProps) {
  // Build full phase list in order: history phases + remaining phases
  const allPhases: string[] = []
  for (const entry of arc.phase_history) {
    if (!allPhases.includes(entry.node_id)) allPhases.push(entry.node_id)
  }
  for (const phase of arc.remaining_phases) {
    if (!allPhases.includes(phase)) allPhases.push(phase)
  }

  const totalPhases = allPhases.length
  const completedPhases = arc.phase_history.filter((p) => p.exited_at_episode).length
  const totalEpisodes = timeline.episodes.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 4 }}>
          Overarching Arc: {arc.archetype_name}
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{completedPhases}/{totalPhases} phases</span>
          <span>{totalEpisodes} episodes</span>
          <span>Mode: {arc.advancement_mode}</span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 8, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0}%`,
              background: '#8b5cf6',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Phase list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {allPhases.map((phase, i) => {
          const isCompleted = arc.phase_history.some(
            (p) => p.node_id === phase && p.exited_at_episode,
          )
          return (
            <div key={phase}>
              <PhaseNode nodeId={phase} index={i} arc={arc} timeline={timeline} />
              {i < allPhases.length - 1 && <Connector completed={isCompleted} />}
            </div>
          )
        })}

        {allPhases.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            No arc phases configured.
          </p>
        )}
      </div>
    </div>
  )
}
