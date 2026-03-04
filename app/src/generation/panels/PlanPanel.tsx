/**
 * Plan Panel — displays the story plan with beats and nested scenes.
 * Shows coverage visualization for hard and soft constraints.
 */

import { useMemo, useCallback } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import type { Scene } from '../artifacts/types.ts'

interface PlanPanelProps {
  onHighlightNodes?: (nodeIds: string[]) => void
}

export function PlanPanel({ onHighlightNodes }: PlanPanelProps) {
  const plan = useGenerationStore((s) => s.plan)
  const contract = useGenerationStore((s) => s.contract)
  const selectedSceneId = useGenerationStore((s) => s.selectedSceneId)
  const selectScene = useGenerationStore((s) => s.selectScene)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)

  const handleSceneClick = useCallback((sceneId: string, nodeIds: string[]) => {
    selectScene(sceneId)
    onHighlightNodes?.(nodeIds)
  }, [selectScene, onHighlightNodes])

  // Compute coverage stats
  const coverage = useMemo(() => {
    if (!plan || !contract) return null

    const allHard = new Set(contract.genre.hard_constraints)
    const allSoft = new Set(contract.genre.soft_constraints)
    const coveredHard = new Set<string>()
    const coveredSoft = new Set<string>()

    for (const scene of plan.scenes) {
      for (const c of scene.constraints_checklist.hard) {
        if (allHard.has(c)) coveredHard.add(c)
      }
      for (const c of scene.constraints_checklist.soft) {
        if (allSoft.has(c)) coveredSoft.add(c)
      }
    }

    return {
      hard: { covered: coveredHard.size, total: allHard.size },
      soft: { covered: coveredSoft.size, total: allSoft.size },
    }
  }, [plan, contract])

  // Group scenes by beat
  const beatSceneMap = useMemo(() => {
    if (!plan) return new Map<string, Scene[]>()
    const map = new Map<string, Scene[]>()
    for (const beat of plan.beats) {
      map.set(beat.beat_id, plan.scenes.filter((s) => s.beat_id === beat.beat_id))
    }
    return map
  }, [plan])

  if (!plan) {
    return (
      <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        No plan available. Run generation in outline or draft mode.
      </div>
    )
  }

  return (
    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
      {/* Coverage bars */}
      {coverage && (
        <div style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-primary)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Constraint Coverage
          </div>
          <CoverageBar
            label="Hard"
            covered={coverage.hard.covered}
            total={coverage.hard.total}
            color="#ef4444"
            target={1.0}
          />
          <CoverageBar
            label="Soft"
            covered={coverage.soft.covered}
            total={coverage.soft.total}
            color="#f59e0b"
            target={plan.coverage_targets.soft_constraints_min_coverage}
          />
        </div>
      )}

      {/* Plan summary */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        gap: 12,
        fontSize: 10,
        color: 'var(--text-muted)',
      }}>
        <span>{plan.beats.length} beats</span>
        <span>{plan.scenes.length} scenes</span>
        {sceneDrafts.size > 0 && <span>{sceneDrafts.size} drafts</span>}
      </div>

      {/* Beat list with nested scenes */}
      <div style={{ padding: '6px 0' }}>
        {plan.beats.map((beat, idx) => {
          const scenes = beatSceneMap.get(beat.beat_id) ?? []
          return (
            <div key={beat.beat_id} style={{ marginBottom: 4 }}>
              {/* Beat header */}
              <div style={{
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 11 }}>{beat.summary}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {beat.archetype_node_id}
                  </div>
                </div>
                {/* Emotional scores mini */}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <EmotionDot label="T" value={beat.target_emotional_scores.tension} color="#ef4444" />
                  <EmotionDot label="H" value={beat.target_emotional_scores.hope} color="#22c55e" />
                  <EmotionDot label="F" value={beat.target_emotional_scores.fear} color="#8b5cf6" />
                </div>
              </div>

              {/* Nested scenes */}
              {scenes.map((scene) => {
                const isSelected = selectedSceneId === scene.scene_id
                const hasDraft = sceneDrafts.has(scene.scene_id)
                const traceNodes = [
                  scene.archetype_trace.node_id,
                  ...scene.genre_obligations.map((o) => o.node_id),
                ]
                return (
                  <div
                    key={scene.scene_id}
                    onClick={() => handleSceneClick(scene.scene_id, traceNodes)}
                    style={{
                      padding: '4px 12px 4px 36px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400 }}>
                        {scene.scene_goal}
                      </span>
                      {hasDraft && (
                        <span style={{ fontSize: 8, color: '#22c55e', fontWeight: 600, flexShrink: 0 }}>
                          DRAFT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                      {scene.constraints_checklist.hard.length}H / {scene.constraints_checklist.soft.length}S constraints
                      {scene.characters.length > 0 && ` | ${scene.characters.join(', ')}`}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CoverageBar({ label, covered, total, color, target }: {
  label: string
  covered: number
  total: number
  color: string
  target: number
}) {
  const pct = total > 0 ? covered / total : 0
  const meetsTarget = pct >= target

  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
        <span style={{ color }}>{label}</span>
        <span style={{ color: meetsTarget ? '#22c55e' : color }}>
          {covered}/{total} ({Math.round(pct * 100)}%)
        </span>
      </div>
      <div style={{
        height: 4,
        background: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(pct * 100, 100)}%`,
          background: meetsTarget ? '#22c55e' : color,
          borderRadius: 2,
          transition: 'width 0.3s',
        }} />
        {/* Target marker */}
        <div style={{
          position: 'absolute',
          left: `${target * 100}%`,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'var(--text-muted)',
        }} />
      </div>
    </div>
  )
}

function EmotionDot({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span
      title={`${label}: ${Math.round(value * 100)}%`}
      style={{
        width: 14,
        height: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 7,
        fontWeight: 700,
        borderRadius: '50%',
        background: `${color}${Math.round(value * 255).toString(16).padStart(2, '0')}`,
        color: value > 0.5 ? '#fff' : color,
      }}
    >
      {label}
    </span>
  )
}
