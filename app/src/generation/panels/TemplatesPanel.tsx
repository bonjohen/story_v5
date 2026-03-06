/**
 * Templates Panel — displays compiled templates from the generation pipeline
 * and allows users to view/edit slot bindings before or after generation.
 *
 * Two sections:
 * 1. Template Catalog — read-only view of archetype node templates and
 *    genre constraint templates compiled from the corpus
 * 2. Slot Bindings — editable table of character/place/object/concept slots
 *    with their current bound values (from backbone or user overrides)
 */

import { useState, useMemo } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import type { DetailCharacter } from '../artifacts/types.ts'

const LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
}

const CATEGORY_COLORS: Record<string, string> = {
  character: '#f59e0b',
  place: '#3b82f6',
  object: '#22c55e',
  concept: '#a855f7',
}

type ViewMode = 'slots' | 'archetype-templates' | 'genre-templates'

export function TemplatesPanel() {
  const templatePack = useGenerationStore((s) => s.templatePack)
  const backbone = useGenerationStore((s) => s.backbone)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const slotOverrides = useRequestStore((s) => s.slotOverrides)
  const setSlotOverride = useRequestStore((s) => s.setSlotOverride)

  const [viewMode, setViewMode] = useState<ViewMode>('slots')
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  // Collect all slots from backbone scenes
  const allSlots = useMemo(() => {
    if (!backbone) return []
    const seen = new Map<string, { slot_name: string; category: string; required: boolean; description?: string; bound_value?: string }>()
    for (const beat of backbone.beats) {
      for (const scene of beat.scenes) {
        for (const [key, slot] of Object.entries(scene.slots)) {
          if (!seen.has(key)) {
            seen.set(key, {
              slot_name: slot.slot_name,
              category: slot.category,
              required: slot.required,
              description: slot.description,
              bound_value: slot.bound_value,
            })
          }
        }
      }
    }
    // Merge with detail bindings if available
    if (detailBindings?.slot_bindings) {
      for (const [key, binding] of Object.entries(detailBindings.slot_bindings)) {
        const existing = seen.get(key)
        if (existing) {
          existing.bound_value = binding.bound_value ?? existing.bound_value
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => {
      const catOrder = ['character', 'place', 'object', 'concept']
      const ci = catOrder.indexOf(a.category) - catOrder.indexOf(b.category)
      if (ci !== 0) return ci
      return a.slot_name.localeCompare(b.slot_name)
    })
  }, [backbone, detailBindings])

  // Characters from detail bindings
  const characters = useMemo(() => {
    if (!detailBindings?.entity_registry.characters) return []
    return Object.values(detailBindings.entity_registry.characters)
  }, [detailBindings])

  const hasTemplates = !!templatePack
  const hasSlots = allSlots.length > 0

  if (!hasTemplates && !hasSlots) {
    return (
      <div style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div style={{ ...LABEL, marginBottom: 8 }}>Templates & Slots</div>
        <p>
          Run generation (at least to the <strong>Backbone</strong> stage) to see compiled templates and editable slot bindings.
        </p>
        <p style={{ marginTop: 8 }}>
          Templates are structural patterns extracted from the corpus for your selected archetype and genre.
          Slots are placeholders for characters, places, objects, and concepts that get bound to concrete values.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-primary)' }}>
      {/* View mode tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <TabButton label="Slots" active={viewMode === 'slots'} count={allSlots.length} onClick={() => setViewMode('slots')} />
        <TabButton label="Archetype" active={viewMode === 'archetype-templates'} count={templatePack ? Object.keys(templatePack.archetype_node_templates).length : 0} onClick={() => setViewMode('archetype-templates')} />
        <TabButton label="Genre" active={viewMode === 'genre-templates'} count={templatePack ? Object.keys(templatePack.genre_level_templates).length : 0} onClick={() => setViewMode('genre-templates')} />
      </div>

      {/* Slots view */}
      {viewMode === 'slots' && (
        <div>
          {/* Characters section */}
          {characters.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...LABEL, marginBottom: 6 }}>Characters ({characters.length})</div>
              {characters.map((ch) => (
                <CharacterCard key={ch.id} character={ch} />
              ))}
            </div>
          )}

          {/* Non-character slots (characters shown above with richer detail) */}
          {hasSlots ? (
            <div>
              {allSlots.filter((s) => s.category !== 'character').length > 0 && (
                <div style={{ ...LABEL, marginBottom: 6 }}>
                  Places, Objects & Concepts ({allSlots.filter((s) => s.category !== 'character').length})
                </div>
              )}
              {allSlots.filter((s) => s.category !== 'character').map((slot) => {
                const override = slotOverrides[slot.slot_name]
                const effectiveValue = override !== undefined && override !== '' ? override : (slot.bound_value ?? '')
                const isOverridden = override !== undefined && override !== ''
                return (
                  <div key={slot.slot_name} style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    background: 'var(--bg-elevated)',
                    borderRadius: 4,
                    borderLeft: `3px solid ${CATEGORY_COLORS[slot.category] ?? 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: CATEGORY_COLORS[slot.category] ?? 'var(--text-muted)',
                      }}>
                        {slot.category}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 11 }}>
                        {slot.slot_name}
                      </span>
                      {slot.required && (
                        <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>REQ</span>
                      )}
                      {isOverridden && (
                        <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>EDITED</span>
                      )}
                    </div>
                    {slot.description && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>
                        {slot.description}
                      </div>
                    )}
                    <input
                      type="text"
                      value={effectiveValue}
                      onChange={(e) => setSlotOverride(slot.slot_name, e.target.value)}
                      placeholder={slot.bound_value || 'Unbound — enter a value'}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '4px 6px',
                        fontSize: 11,
                        background: isOverridden ? 'rgba(34,197,94,0.06)' : 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        border: `1px solid ${isOverridden ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              No slots yet. Run generation to at least the Backbone stage.
            </div>
          )}
        </div>
      )}

      {/* Archetype templates view */}
      {viewMode === 'archetype-templates' && templatePack && (
        <div>
          <div style={{ ...LABEL, marginBottom: 6 }}>
            Archetype Node Templates ({Object.keys(templatePack.archetype_node_templates).length})
          </div>
          {Object.entries(templatePack.archetype_node_templates).map(([nodeId, tmpl]) => {
            const isExpanded = expandedTemplate === nodeId
            return (
              <div key={nodeId} style={{
                marginBottom: 4,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedTemplate(isExpanded ? null : nodeId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '6px 8px',
                    textAlign: 'left',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {isExpanded ? '\u25BC' : '\u25B6'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{tmpl.label}</span>
                  <span style={{
                    fontSize: 9,
                    color: '#f59e0b',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginLeft: 8,
                  }}>
                    {tmpl.role}
                  </span>
                </button>
                {isExpanded && (
                  <div style={{ padding: '4px 8px 8px 22px', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 4 }}>{tmpl.beat_summary_template}</div>
                    {(tmpl.entry_conditions?.length ?? 0) > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Entry: </span>
                        {tmpl.entry_conditions!.join('; ')}
                      </div>
                    )}
                    {(tmpl.exit_conditions?.length ?? 0) > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Exit: </span>
                        {tmpl.exit_conditions!.join('; ')}
                      </div>
                    )}
                    {tmpl.signals_to_include.length > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Signals: </span>
                        {tmpl.signals_to_include.join(', ')}
                      </div>
                    )}
                    {tmpl.failure_modes_to_avoid.length > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>Avoid: </span>
                        {tmpl.failure_modes_to_avoid.join(', ')}
                      </div>
                    )}
                    {tmpl.required_elements.length > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, color: '#3b82f6' }}>Elements: </span>
                        {tmpl.required_elements.join(', ')}
                      </div>
                    )}
                    {tmpl.scene_obligations.length > 0 && (
                      <div>
                        <span style={{ fontWeight: 600, color: '#8b5cf6' }}>Genre obligations: </span>
                        {tmpl.scene_obligations.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Tone guidance */}
          {templatePack.tone_guidance && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...LABEL, marginBottom: 4 }}>Tone Guidance</div>
              <div style={{
                padding: '6px 8px',
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                fontSize: 10,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{templatePack.tone_guidance.tone_description}</div>
                {templatePack.tone_guidance.directives.map((d, i) => (
                  <div key={i}>- {d}</div>
                ))}
              </div>
            </div>
          )}

          {/* Anti-pattern guidance */}
          {templatePack.anti_pattern_guidance && templatePack.anti_pattern_guidance.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ ...LABEL, marginBottom: 4 }}>Anti-Pattern Warnings</div>
              {templatePack.anti_pattern_guidance.map((ap) => (
                <div key={ap.node_id} style={{
                  padding: '6px 8px',
                  marginBottom: 3,
                  background: 'rgba(239,68,68,0.06)',
                  borderRadius: 4,
                  borderLeft: '3px solid #ef4444',
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ fontWeight: 600 }}>{ap.label}: </span>
                  {ap.description}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Genre templates view */}
      {viewMode === 'genre-templates' && templatePack && (
        <div>
          <div style={{ ...LABEL, marginBottom: 6 }}>
            Genre Constraint Templates ({Object.keys(templatePack.genre_level_templates).length})
          </div>
          {Object.entries(templatePack.genre_level_templates).map(([nodeId, tmpl]) => {
            const isExpanded = expandedTemplate === nodeId
            return (
              <div key={nodeId} style={{
                marginBottom: 4,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedTemplate(isExpanded ? null : nodeId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '6px 8px',
                    textAlign: 'left',
                    fontSize: 11,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {isExpanded ? '\u25BC' : '\u25B6'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{tmpl.label}</span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginLeft: 8,
                    color: tmpl.severity === 'hard' ? '#ef4444' : '#f59e0b',
                  }}>
                    {tmpl.severity} L{tmpl.level}
                  </span>
                </button>
                {isExpanded && (
                  <div style={{ padding: '4px 8px 8px 22px', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: 4 }}>{tmpl.constraint_template}</div>
                    {tmpl.binding_rules.length > 0 && (
                      <div style={{ marginBottom: 3 }}>
                        {tmpl.binding_rules.map((r, i) => (
                          <div key={i} style={{ color: 'var(--text-muted)' }}>{r}</div>
                        ))}
                      </div>
                    )}
                    {tmpl.anti_patterns_to_block && tmpl.anti_patterns_to_block.length > 0 && (
                      <div>
                        <span style={{ fontWeight: 600, color: '#ef4444' }}>Block: </span>
                        {tmpl.anti_patterns_to_block.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CharacterCard({ character: ch }: { character: DetailCharacter }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      padding: '6px 8px',
      marginBottom: 4,
      background: 'var(--bg-elevated)',
      borderRadius: 4,
      borderLeft: `3px solid ${CATEGORY_COLORS.character}`,
    }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          textAlign: 'left',
          fontSize: 11,
          color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span style={{ fontWeight: 600, fontSize: 12 }}>{ch.name}</span>
        <span style={{ fontSize: 9, color: CATEGORY_COLORS.character, fontWeight: 600, textTransform: 'uppercase', marginLeft: 4 }}>
          {ch.role}
        </span>
      </button>
      {ch.archetype_function && (
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
          {ch.archetype_function}
        </div>
      )}
      {expanded && (
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
          {ch.traits && ch.traits.length > 0 && (
            <FieldRow label="Traits" values={ch.traits} />
          )}
          {ch.motivations && ch.motivations.length > 0 && (
            <FieldRow label="Motivations" values={ch.motivations} />
          )}
          {ch.flaw && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#ef4444', fontSize: 9, textTransform: 'uppercase' }}>Flaw: </span>
              {ch.flaw}
            </div>
          )}
          {ch.arc_direction && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#3b82f6', fontSize: 9, textTransform: 'uppercase' }}>Arc: </span>
              {ch.arc_direction}
            </div>
          )}
          {ch.backstory && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Backstory: </span>
              {ch.backstory}
            </div>
          )}
          {ch.relationships && ch.relationships.length > 0 && (
            <FieldRow label="Relationships" values={ch.relationships} />
          )}
          {ch.distinguishing_feature && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#8b5cf6', fontSize: 9, textTransform: 'uppercase' }}>Distinguishing: </span>
              {ch.distinguishing_feature}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FieldRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div style={{ marginBottom: 3 }}>
      <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>{label}: </span>
      {values.join(' | ')}
    </div>
  )
}

function TabButton({ label, active, count, onClick }: {
  label: string
  active: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        fontSize: 10,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
    </button>
  )
}
