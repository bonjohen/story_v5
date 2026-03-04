/**
 * Trace Panel — shows the scene-to-node mapping table.
 * Click a scene row to highlight its archetype node and genre obligations on the canvas.
 */

import { useCallback } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'

interface TracePanelProps {
  onHighlightNodes?: (nodeIds: string[]) => void
}

export function TracePanel({ onHighlightNodes }: TracePanelProps) {
  const trace = useGenerationStore((s) => s.trace)
  const selectedSceneId = useGenerationStore((s) => s.selectedSceneId)
  const selectScene = useGenerationStore((s) => s.selectScene)

  const handleRowClick = useCallback((sceneId: string, archetypeNodeId: string, genreNodeIds: string[]) => {
    selectScene(sceneId)
    onHighlightNodes?.([archetypeNodeId, ...genreNodeIds])
  }, [selectScene, onHighlightNodes])

  if (!trace) {
    return (
      <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        No trace available. Run generation in draft mode.
      </div>
    )
  }

  return (
    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 12 }}>Story Trace</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          {trace.scene_trace.length} scenes traced
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 1fr 1fr',
        gap: 4,
        padding: '4px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 9,
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        <span>Scene</span>
        <span>Archetype Node</span>
        <span>Genre Constraints</span>
      </div>

      {/* Trace rows */}
      {trace.scene_trace.map((entry) => {
        const isSelected = selectedSceneId === entry.scene_id
        const genreNodeIds = entry.genre.satisfied_constraints
        return (
          <div
            key={entry.scene_id}
            onClick={() => handleRowClick(entry.scene_id, entry.archetype.node_id, genreNodeIds)}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr',
              gap: 4,
              padding: '6px 12px',
              cursor: 'pointer',
              background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
              borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
              borderBottom: '1px solid var(--border)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)' }}
            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--accent)' }}>
              {entry.scene_id.replace(/^scene_/, 'S')}
            </span>
            <div>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#f59e0b' }}>
                {entry.archetype.node_id}
              </div>
              {entry.archetype.edges.length > 0 && (
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                  {entry.archetype.edges.length} edges
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#22c55e' }}>
                {genreNodeIds.length} satisfied
              </div>
              {entry.genre.tone_marker && (
                <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>
                  Tone: {entry.genre.tone_marker.split('_').slice(-1)[0]?.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Notes section */}
      {trace.scene_trace.some((e) => e.notes.length > 0) && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes
          </span>
          {trace.scene_trace
            .filter((e) => e.notes.length > 0)
            .map((e) => (
              <div key={e.scene_id} style={{ padding: '3px 0' }}>
                <span style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'monospace' }}>
                  {e.scene_id}:
                </span>
                {e.notes.map((n, i) => (
                  <div key={i} style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 8 }}>
                    {n}
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
