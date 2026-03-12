/**
 * ElementsTab — edit story rules, templates, and data elements.
 * Shows constraints from the contract, custom rules, story structure overview,
 * and style directives. All saved in the generation store.
 */

import { useCallback, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { INPUT } from './generationConstants.ts'
import { ENTITY_COLORS, STATUS_COLORS } from '../../theme/colors.ts'
import type { StoryRulesOverrides } from '../artifacts/types.ts'

const fieldInput: React.CSSProperties = { ...INPUT, fontSize: 11, padding: '3px 6px', marginTop: 2 }

export function ElementsTab() {
  const contract = useGenerationStore((s) => s.contract)
  const backbone = useGenerationStore((s) => s.backbone)
  const rulesOverrides = useGenerationStore((s) => s.rulesOverrides)
  const setRulesOverrides = useGenerationStore((s) => s.setRulesOverrides)

  // Initialize overrides lazily
  const getOverrides = useCallback((): StoryRulesOverrides => {
    if (rulesOverrides) return rulesOverrides
    const init: StoryRulesOverrides = { constraintOverrides: {}, customRules: [], sceneNotes: {} }
    setRulesOverrides(init)
    return init
  }, [rulesOverrides, setRulesOverrides])

  const toggleConstraint = useCallback((nodeId: string, currentEnabled: boolean) => {
    const o = getOverrides()
    setRulesOverrides({
      ...o,
      constraintOverrides: {
        ...o.constraintOverrides,
        [nodeId]: { ...o.constraintOverrides[nodeId], enabled: !currentEnabled },
      },
    })
  }, [getOverrides, setRulesOverrides])

  const addCustomRule = useCallback(() => {
    const o = getOverrides()
    const id = `rule_${Date.now()}`
    setRulesOverrides({
      ...o,
      customRules: [...o.customRules, { id, description: '', severity: 'recommended' }],
    })
  }, [getOverrides, setRulesOverrides])

  const updateCustomRule = useCallback((id: string, field: 'description' | 'severity', value: string) => {
    const o = getOverrides()
    setRulesOverrides({
      ...o,
      customRules: o.customRules.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      ),
    })
  }, [getOverrides, setRulesOverrides])

  const removeCustomRule = useCallback((id: string) => {
    const o = getOverrides()
    setRulesOverrides({
      ...o,
      customRules: o.customRules.filter((r) => r.id !== id),
    })
  }, [getOverrides, setRulesOverrides])

  const updateSceneNote = useCallback((sceneId: string, note: string) => {
    const o = getOverrides()
    setRulesOverrides({
      ...o,
      sceneNotes: { ...o.sceneNotes, [sceneId]: note },
    })
  }, [getOverrides, setRulesOverrides])

  // No structure yet
  if (!contract && !backbone) {
    return (
      <div style={{ padding: '20px 12px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
          No structure yet
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
          Build Structure on the Setup tab first. This tab lets you edit story rules,
          constraints, and scene notes once the backbone exists.
        </p>
      </div>
    )
  }

  const hardConstraints = contract?.genre.hard_constraints ?? []
  const softConstraints = contract?.genre.soft_constraints ?? []
  const customRules = rulesOverrides?.customRules ?? []

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* ── CONSTRAINTS ────────────────────────────────────── */}
      <Disclosure
        title={`Constraints (${hardConstraints.length + softConstraints.length})`}
        persistKey="rules-constraints"
      >
        <div style={{ padding: '4px 8px' }}>
          {hardConstraints.length === 0 && softConstraints.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No constraints in contract.</p>
          )}
          {hardConstraints.map((nodeId) => {
            const enabled = rulesOverrides?.constraintOverrides[nodeId]?.enabled ?? true
            return (
              <ConstraintRow
                key={nodeId}
                nodeId={nodeId}
                severity="hard"
                enabled={enabled}
                onToggle={() => toggleConstraint(nodeId, enabled)}
              />
            )
          })}
          {softConstraints.map((nodeId) => {
            const enabled = rulesOverrides?.constraintOverrides[nodeId]?.enabled ?? true
            return (
              <ConstraintRow
                key={nodeId}
                nodeId={nodeId}
                severity="soft"
                enabled={enabled}
                onToggle={() => toggleConstraint(nodeId, enabled)}
              />
            )
          })}
        </div>
      </Disclosure>

      {/* ── CUSTOM RULES ───────────────────────────────────── */}
      <Disclosure
        title={`Custom Rules (${customRules.length})`}
        persistKey="rules-custom"
        defaultCollapsed
      >
        <div style={{ padding: '4px 8px' }}>
          {customRules.map((rule) => (
            <div key={rule.id} style={{
              padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
              borderRadius: 4, borderLeft: `3px solid ${ENTITY_COLORS.concept}`,
            }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                <input
                  value={rule.description}
                  placeholder="Rule description..."
                  onChange={(e) => updateCustomRule(rule.id, 'description', e.target.value)}
                  style={{ ...fieldInput, flex: 1, marginTop: 0 }}
                />
                <select
                  value={rule.severity}
                  onChange={(e) => updateCustomRule(rule.id, 'severity', e.target.value)}
                  style={{ ...fieldInput, width: 100, marginTop: 0, fontSize: 10 }}
                >
                  <option value="required">Required</option>
                  <option value="recommended">Recommended</option>
                  <option value="optional">Optional</option>
                </select>
                <button onClick={() => removeCustomRule(rule.id)} title="Remove" style={{
                  fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px',
                }}>{'\u00d7'}</button>
              </div>
            </div>
          ))}
          <button onClick={addCustomRule} style={{
            marginTop: 4, fontSize: 10, padding: '3px 10px', borderRadius: 3,
            border: `1px solid ${ENTITY_COLORS.concept}40`, color: ENTITY_COLORS.concept,
            background: `${ENTITY_COLORS.concept}10`, cursor: 'pointer',
          }}>
            + Add Rule
          </button>
        </div>
      </Disclosure>

      {/* ── STORY STRUCTURE ────────────────────────────────── */}
      {backbone && (
        <Disclosure
          title={`Story Structure (${backbone.beats.length} beats, ${backbone.chapter_partition.length} chapters)`}
          persistKey="rules-structure"
          defaultCollapsed
        >
          <div style={{ padding: '4px 8px' }}>
            {/* Chapter partition overview */}
            {backbone.chapter_partition.map((ch) => (
              <div key={ch.chapter_id} style={{
                padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
                borderRadius: 4, borderLeft: '3px solid var(--accent)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ch.title || ch.chapter_id}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Beats: {ch.beat_ids.join(', ')}
                  {ch.tone_goal && <span> | Tone: {ch.tone_goal}</span>}
                </div>
              </div>
            ))}

            {/* Beats and scenes with notes */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Beats & Scenes
              </div>
              {backbone.beats.map((beat) => (
                <div key={beat.beat_id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ENTITY_COLORS.character, padding: '2px 0' }}>
                    {beat.label}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>
                      {beat.role ?? beat.archetype_node_id}
                    </span>
                  </div>
                  {beat.scenes.map((scene) => (
                    <div key={scene.scene_id} style={{
                      padding: '4px 8px', marginLeft: 12, marginBottom: 2,
                      fontSize: 10, color: 'var(--text-secondary)',
                      background: 'var(--bg-primary)', borderRadius: 3,
                    }}>
                      <div style={{ fontWeight: 500 }}>{scene.scene_goal}</div>
                      <textarea
                        value={rulesOverrides?.sceneNotes[scene.scene_id] ?? ''}
                        placeholder="Scene notes..."
                        onChange={(e) => updateSceneNote(scene.scene_id, e.target.value)}
                        rows={1}
                        style={{
                          ...fieldInput, width: '100%', resize: 'vertical', fontFamily: 'inherit',
                          marginTop: 3, fontSize: 10, color: 'var(--text-muted)',
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      )}

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConstraintRow({ nodeId, severity, enabled, onToggle }: {
  nodeId: string
  severity: 'hard' | 'soft'
  enabled: boolean
  onToggle: () => void
}) {
  const [SeverityBadge] = useState(() => {
    const color = severity === 'hard' ? STATUS_COLORS.fail : STATUS_COLORS.warn
    return (
      <span style={{
        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 2,
        background: `${color}18`, color, textTransform: 'uppercase',
      }}>
        {severity}
      </span>
    )
  })

  return (
    <div style={{
      padding: '4px 8px', marginBottom: 2, fontSize: 11,
      background: 'var(--bg-elevated)', borderRadius: 3,
      borderLeft: `3px solid ${severity === 'hard' ? STATUS_COLORS.fail : STATUS_COLORS.warn}`,
      display: 'flex', gap: 6, alignItems: 'center',
      opacity: enabled ? 1 : 0.5,
    }}>
      <input type="checkbox" checked={enabled} onChange={onToggle} style={{ flexShrink: 0 }} />
      {SeverityBadge}
      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{nodeId}</span>
    </div>
  )
}
