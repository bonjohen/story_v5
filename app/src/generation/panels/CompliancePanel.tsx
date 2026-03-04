/**
 * Compliance Panel — pass/warn/fail summary dashboard with per-scene drilldown.
 * Shows validation results and compliance report.
 */

import { useState, useCallback } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import type { CheckStatus, SceneValidation, ValidationCheck } from '../artifacts/types.ts'

const STATUS_COLORS: Record<CheckStatus, string> = {
  pass: '#22c55e',
  warn: '#f59e0b',
  fail: '#ef4444',
}

const STATUS_ICONS: Record<CheckStatus, string> = {
  pass: '\u2713',
  warn: '\u26A0',
  fail: '\u2717',
}

export function CompliancePanel() {
  const validation = useGenerationStore((s) => s.validation)
  const complianceReport = useGenerationStore((s) => s.complianceReport)
  const selectedSceneId = useGenerationStore((s) => s.selectedSceneId)
  const selectScene = useGenerationStore((s) => s.selectScene)
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const handleSceneClick = useCallback((sceneId: string) => {
    selectScene(sceneId)
    setExpandedSceneId((prev) => (prev === sceneId ? null : sceneId))
  }, [selectScene])

  if (!validation) {
    return (
      <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        No validation results available. Run generation in draft mode.
      </div>
    )
  }

  const { scenes, global: globalStats } = validation

  // Aggregate counts
  const passCount = scenes.filter((s) => s.status === 'pass').length
  const warnCount = scenes.filter((s) => s.status === 'warn').length
  const failCount = scenes.filter((s) => s.status === 'fail').length

  return (
    <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
      {/* Summary dashboard */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Compliance Dashboard</div>

        {/* Scene status row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <StatusCard label="Pass" count={passCount} color={STATUS_COLORS.pass} />
          <StatusCard label="Warn" count={warnCount} color={STATUS_COLORS.warn} />
          <StatusCard label="Fail" count={failCount} color={STATUS_COLORS.fail} />
        </div>

        {/* Global metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <MetricCard
            label="Hard Coverage"
            value={`${Math.round(globalStats.hard_constraints_coverage * 100)}%`}
            color={globalStats.hard_constraints_coverage >= 1.0 ? '#22c55e' : '#ef4444'}
          />
          <MetricCard
            label="Soft Coverage"
            value={`${Math.round(globalStats.soft_constraints_coverage * 100)}%`}
            color={globalStats.soft_constraints_coverage >= 0.6 ? '#22c55e' : '#f59e0b'}
          />
          <MetricCard
            label="Anti-Pattern Violations"
            value={String(globalStats.anti_pattern_violations)}
            color={globalStats.anti_pattern_violations === 0 ? '#22c55e' : '#ef4444'}
          />
          <MetricCard
            label="Tone Warnings"
            value={String(globalStats.tone_warnings)}
            color={globalStats.tone_warnings === 0 ? '#22c55e' : '#f59e0b'}
          />
        </div>
      </div>

      {/* Per-scene drilldown */}
      <div style={{ padding: '6px 0' }}>
        <div style={{
          padding: '4px 12px',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Per-Scene Results
        </div>

        {scenes.map((scene) => (
          <SceneRow
            key={scene.scene_id}
            scene={scene}
            isSelected={selectedSceneId === scene.scene_id}
            isExpanded={expandedSceneId === scene.scene_id}
            onClick={() => handleSceneClick(scene.scene_id)}
          />
        ))}
      </div>

      {/* Compliance report toggle */}
      {complianceReport && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setShowReport((v) => !v)}
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {showReport ? 'Hide' : 'Show'} Compliance Report
          </button>
          {showReport && (
            <pre style={{
              marginTop: 6,
              padding: 8,
              fontSize: 9,
              fontFamily: 'monospace',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
              maxHeight: 300,
              overflowY: 'auto',
              color: 'var(--text-muted)',
            }}>
              {complianceReport}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      flex: 1,
      textAlign: 'center',
      padding: '6px 8px',
      borderRadius: 4,
      background: `${color}12`,
      border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{count}</div>
      <div style={{ fontSize: 9, color, fontWeight: 600 }}>{label}</div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '4px 8px',
      borderRadius: 4,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

function SceneRow({ scene, isSelected, isExpanded, onClick }: {
  scene: SceneValidation
  isSelected: boolean
  isExpanded: boolean
  onClick: () => void
}) {
  const statusColor = STATUS_COLORS[scene.status]
  const statusIcon = STATUS_ICONS[scene.status]

  return (
    <div>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          cursor: 'pointer',
          background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
          borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-primary)' }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ color: statusColor, fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
          {statusIcon}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--accent)' }}>
          {scene.scene_id}
        </span>
        <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>
          {scene.status}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {scene.checks.length} checks
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {isExpanded ? '\u25BE' : '\u25B8'}
        </span>
      </div>

      {/* Expanded check details */}
      {isExpanded && (
        <div style={{ padding: '4px 12px 8px 32px' }}>
          {scene.checks.map((check, i) => (
            <CheckRow key={i} check={check} />
          ))}
        </div>
      )}
    </div>
  )
}

function CheckRow({ check }: { check: ValidationCheck }) {
  const color = STATUS_COLORS[check.status]
  const icon = STATUS_ICONS[check.status]

  return (
    <div style={{
      padding: '3px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color, fontSize: 10 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600 }}>
          {check.type.replace(/_/g, ' ')}
        </span>
        <span style={{ fontSize: 9, color, marginLeft: 'auto' }}>{check.status}</span>
      </div>
      {check.details.length > 0 && (
        <div style={{ paddingLeft: 16, marginTop: 2 }}>
          {check.details.map((d, i) => (
            <div key={i} style={{ fontSize: 9, color: 'var(--text-muted)', padding: '1px 0' }}>
              {d}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
