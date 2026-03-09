/**
 * Templates Panel — Mad Libs-style beat cards.
 * Each beat shows its template text with inline editable slot fields,
 * plus entry/exit conditions, signals, obligations, and anti-patterns.
 */

import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import type { DetailCharacter } from '../artifacts/types.ts'

const CATEGORY_COLORS: Record<string, string> = {
  character: '#f59e0b',
  place: '#3b82f6',
  object: '#22c55e',
  concept: '#a855f7',
}

const ROLE_COLORS: Record<string, string> = {
  Origin: '#22c55e',
  Disruption: '#ef4444',
  Catalyst: '#f97316',
  Threshold: '#8b5cf6',
  Trial: '#3b82f6',
  Descent: '#6366f1',
  Crisis: '#ef4444',
  Transformation: '#a855f7',
  Resolution: '#22c55e',
}

type ViewMode = 'genre' | 'beats' | 'cast' | 'places' | 'relationships' | 'objects'

export function TemplatesPanel() {
  const templatePack = useGenerationStore((s) => s.templatePack)
  const backbone = useGenerationStore((s) => s.backbone)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const slotOverrides = useRequestStore((s) => s.slotOverrides)
  const setSlotOverride = useRequestStore((s) => s.setSlotOverride)

  const [viewMode, setViewMode] = useState<ViewMode>('genre')
  const [expandedBeat, setExpandedBeat] = useState<string | null>(null)

  // Build a lookup from slot name → bound value
  const slotValues = useMemo(() => {
    const map: Record<string, { value: string; category: string }> = {}
    if (backbone) {
      for (const beat of backbone.beats) {
        for (const scene of beat.scenes) {
          for (const [key, slot] of Object.entries(scene.slots)) {
            if (!map[key]) {
              map[key] = { value: slot.bound_value ?? '', category: slot.category }
            }
          }
        }
      }
    }
    if (detailBindings?.slot_bindings) {
      for (const [key, binding] of Object.entries(detailBindings.slot_bindings)) {
        if (map[key]) {
          map[key].value = binding.bound_value ?? map[key].value
        } else {
          map[key] = { value: binding.bound_value ?? '', category: 'concept' }
        }
      }
    }
    // Apply user overrides
    for (const [key, override] of Object.entries(slotOverrides)) {
      if (override && map[key]) {
        map[key].value = override
      }
    }
    return map
  }, [backbone, detailBindings, slotOverrides])

  // Entities from detail bindings
  const characters = useMemo(() => {
    if (!detailBindings?.entity_registry.characters) return []
    return Object.values(detailBindings.entity_registry.characters)
  }, [detailBindings])

  const places = useMemo(() => {
    if (!detailBindings?.entity_registry.places) return []
    return detailBindings.entity_registry.places
  }, [detailBindings])

  const objects = useMemo(() => {
    if (!detailBindings?.entity_registry.objects) return []
    return detailBindings.entity_registry.objects
  }, [detailBindings])

  // Collect all relationships from characters
  const relationships = useMemo(() => {
    const rels: { character: string; relationship: string }[] = []
    for (const ch of characters) {
      if (ch.relationships) {
        for (const r of ch.relationships) {
          rels.push({ character: ch.name, relationship: r })
        }
      }
    }
    return rels
  }, [characters])

  const hasData = !!templatePack || !!backbone

  if (!hasData) {
    return (
      <div style={{ padding: '14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Story Templates
        </div>
        <p>Run generation to see beat-by-beat story templates with editable slots.</p>
      </div>
    )
  }

  const beatCount = backbone?.beats.length ?? 0

  return (
    <div style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-primary)' }}>
      {/* View mode tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
        <TabBtn label="Genre" active={viewMode === 'genre'} count={templatePack ? Object.keys(templatePack.genre_level_templates).length : 0} onClick={() => setViewMode('genre')} />
        <TabBtn label="Beats" active={viewMode === 'beats'} count={beatCount} onClick={() => setViewMode('beats')} />
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
        <TabBtn label="Cast" active={viewMode === 'cast'} count={characters.length} onClick={() => setViewMode('cast')} editable />
        <TabBtn label="Places" active={viewMode === 'places'} count={places.length} onClick={() => setViewMode('places')} editable />
        <TabBtn label="Rels" active={viewMode === 'relationships'} count={relationships.length} onClick={() => setViewMode('relationships')} editable />
        <TabBtn label="Objects" active={viewMode === 'objects'} count={objects.length} onClick={() => setViewMode('objects')} editable />
      </div>

      {/* Beats view — Mad Libs cards */}
      {viewMode === 'beats' && backbone && templatePack && (
        <div>
          {backbone.beats.map((beat) => {
            const tmpl = templatePack.archetype_node_templates[beat.archetype_node_id]
            const isExpanded = expandedBeat === beat.beat_id
            const roleColor = ROLE_COLORS[beat.role ?? ''] ?? 'var(--text-muted)'
            const sceneSlots = beat.scenes.flatMap((s) => Object.entries(s.slots))
            const obligations = beat.scenes.flatMap((s) => s.genre_obligations)

            return (
              <div key={beat.beat_id} style={{
                marginBottom: 6,
                background: 'var(--bg-elevated)',
                borderRadius: 6,
                borderLeft: `3px solid ${roleColor}`,
                overflow: 'hidden',
              }}>
                {/* Beat header — always visible */}
                <button
                  onClick={() => setExpandedBeat(isExpanded ? null : beat.beat_id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {isExpanded ? '\u25BC' : '\u25B6'}
                  </span>
                  <span style={{ fontWeight: 700, flex: 1 }}>{beat.label}</span>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: roleColor,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: `${roleColor}14`,
                    flexShrink: 0,
                  }}>
                    {beat.role}
                  </span>
                </button>

                {/* Expanded beat card — the "Mad Libs" form */}
                {isExpanded && (
                  <div style={{ padding: '0 10px 10px' }}>
                    {/* Template text with inline slots */}
                    {tmpl && (
                      <div style={{
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: 'var(--text-primary)',
                        marginBottom: 10,
                        padding: '8px 10px',
                        background: 'var(--bg-primary)',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                      }}>
                        <TemplateText
                          text={tmpl.beat_summary_template.split('|')[0].trim()}
                          slotValues={slotValues}
                          requiredElements={tmpl.required_elements}
                          onSlotChange={setSlotOverride}
                        />
                      </div>
                    )}

                    {/* Slots for this beat */}
                    {sceneSlots.length > 0 && (
                      <Section label="Fill in the blanks">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {dedupeSlots(sceneSlots).map(([key, slot]) => {
                            const bound = slotValues[key]
                            const catColor = CATEGORY_COLORS[slot.category] ?? 'var(--text-muted)'
                            return (
                              <div key={key} style={{ flex: '1 1 140px', minWidth: 120 }}>
                                <label style={{ display: 'block', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: catColor, marginBottom: 2 }}>
                                  {slot.slot_name}
                                  {slot.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                                </label>
                                <input
                                  type="text"
                                  value={slotOverrides[key] ?? bound?.value ?? ''}
                                  onChange={(e) => setSlotOverride(key, e.target.value)}
                                  placeholder={slot.slot_name}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '4px 6px',
                                    fontSize: 11,
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    border: `1px solid var(--border)`,
                                    borderBottom: `2px solid ${catColor}`,
                                    borderRadius: '3px 3px 0 0',
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </Section>
                    )}

                    {/* Entry / Exit conditions */}
                    {tmpl && (tmpl.entry_conditions?.length || tmpl.exit_conditions?.length) && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        {tmpl.entry_conditions && tmpl.entry_conditions.length > 0 && (
                          <div style={{ flex: 1 }}>
                            <MetaLabel color="#22c55e">Entry</MetaLabel>
                            {tmpl.entry_conditions.map((c, i) => (
                              <MetaItem key={i}>{c}</MetaItem>
                            ))}
                          </div>
                        )}
                        {tmpl.exit_conditions && tmpl.exit_conditions.length > 0 && (
                          <div style={{ flex: 1 }}>
                            <MetaLabel color="#f59e0b">Exit</MetaLabel>
                            {tmpl.exit_conditions.map((c, i) => (
                              <MetaItem key={i}>{c}</MetaItem>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Signals */}
                    {tmpl && tmpl.signals_to_include.length > 0 && (
                      <Section label="Signals to include">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {tmpl.signals_to_include.map((s, i) => (
                            <span key={i} style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: 'rgba(59,130,246,0.1)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59,130,246,0.2)',
                            }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {/* Genre obligations */}
                    {obligations.length > 0 && (
                      <Section label="Genre obligations">
                        {obligations.map((ob, i) => {
                          const genreTmpl = templatePack.genre_level_templates[ob.node_id]
                          return (
                            <div key={i} style={{
                              fontSize: 10,
                              padding: '4px 8px',
                              marginBottom: 3,
                              borderRadius: 3,
                              background: ob.severity === 'hard' ? 'rgba(245,158,11,0.08)' : 'rgba(139,92,246,0.08)',
                              borderLeft: `2px solid ${ob.severity === 'hard' ? '#f59e0b' : '#8b5cf6'}`,
                              color: 'var(--text-secondary)',
                            }}>
                              <span style={{ fontWeight: 600 }}>{genreTmpl?.label ?? ob.label}</span>
                              <span style={{
                                fontSize: 8,
                                marginLeft: 6,
                                padding: '0 4px',
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                color: ob.severity === 'hard' ? '#f59e0b' : '#8b5cf6',
                              }}>
                                {ob.severity === 'hard' ? 'Required' : 'Suggested'}
                              </span>
                              {genreTmpl && (
                                <div style={{ marginTop: 2, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                  {genreTmpl.constraint_template.slice(0, 120)}{genreTmpl.constraint_template.length > 120 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </Section>
                    )}

                    {/* Anti-patterns */}
                    {tmpl && tmpl.failure_modes_to_avoid.length > 0 && (
                      <Section label="Avoid">
                        {tmpl.failure_modes_to_avoid.map((f, i) => (
                          <div key={i} style={{ fontSize: 10, color: '#fbbf24', lineHeight: 1.4, marginBottom: 2 }}>
                            {'\u2718'} {f}
                          </div>
                        ))}
                      </Section>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Tone guidance */}
          {templatePack.tone_guidance && (
            <div style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--bg-elevated)',
              borderRadius: 6,
              borderLeft: '3px solid #06b6d4',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#06b6d4', marginBottom: 4 }}>
                Tone: {templatePack.tone_guidance.tone_description}
              </div>
              {templatePack.tone_guidance.directives.map((d, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>- {d}</div>
              ))}
            </div>
          )}

          {/* Anti-pattern guidance */}
          {templatePack.anti_pattern_guidance && templatePack.anti_pattern_guidance.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#ef4444', marginBottom: 4 }}>
                Global Anti-Patterns
              </div>
              {templatePack.anti_pattern_guidance.map((ap) => (
                <div key={ap.node_id} style={{
                  padding: '4px 8px',
                  marginBottom: 3,
                  background: 'rgba(239,68,68,0.06)',
                  borderRadius: 4,
                  borderLeft: '2px solid #ef4444',
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

      {/* Cast view */}
      {viewMode === 'cast' && (
        <div>
          {characters.length > 0 ? (
            characters.map((ch) => <CharacterCard key={ch.id} character={ch} />)
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              No characters yet. Run generation to populate the cast.
            </div>
          )}
        </div>
      )}

      {/* Places view */}
      {viewMode === 'places' && (
        <div>
          {places.length > 0 ? (
            places.map((p) => (
              <div key={p.id} style={{
                padding: '6px 8px',
                marginBottom: 3,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                borderLeft: '3px solid #3b82f6',
              }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</div>
                <span style={{ fontSize: 9, color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>{p.type}</span>
                {p.features && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{p.features.join(' | ')}</div>}
                {p.atmosphere && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, fontStyle: 'italic', lineHeight: 1.4 }}>{p.atmosphere}</div>}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              No places yet. Run generation to populate locations.
            </div>
          )}
        </div>
      )}

      {/* Relationships view */}
      {viewMode === 'relationships' && (
        <div>
          {relationships.length > 0 ? (
            relationships.map((r, i) => (
              <div key={i} style={{
                padding: '6px 8px',
                marginBottom: 3,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                borderLeft: '3px solid #a855f7',
              }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#f59e0b' }}>{r.character}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{r.relationship}</div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              No relationships yet. Run generation to populate character relationships.
            </div>
          )}
        </div>
      )}

      {/* Objects view */}
      {viewMode === 'objects' && (
        <div>
          {objects.length > 0 ? (
            objects.map((o) => (
              <div key={o.id} style={{
                padding: '6px 8px',
                marginBottom: 3,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                borderLeft: '3px solid #22c55e',
              }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{o.name}</div>
                <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase' }}>{o.type}</span>
                {o.significance && <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{o.significance}</div>}
                {o.properties && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{o.properties.join(' | ')}</div>}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              No objects yet. Run generation to populate story objects.
            </div>
          )}
        </div>
      )}

      {/* Genre view */}
      {viewMode === 'genre' && templatePack && (
        <div>
          {Object.entries(templatePack.genre_level_templates).map(([nodeId, tmpl]) => (
            <GenreConstraintCard key={nodeId} tmpl={tmpl} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template text renderer — replaces {slot} with inline editable fields
// ---------------------------------------------------------------------------

function TemplateText({ text, slotValues, requiredElements, onSlotChange }: {
  text: string
  slotValues: Record<string, { value: string; category: string }>
  requiredElements?: string[]
  onSlotChange: (slot: string, value: string) => void
}) {
  // Build a version of the text with {slot} patterns injected.
  // The raw text uses natural language ("The protagonist's familiar...") while
  // required_elements has the slot names ("{protagonist}", "{ordinary_world}").
  // We replace matching words in the text with {slot_name} markers, then render.
  const processedText = useMemo(() => {
    if (!requiredElements || requiredElements.length === 0) return text

    let result = text
    for (const el of requiredElements) {
      const slotName = el.replace(/^\{|\}$/g, '')
      // Replace the slot name word (with underscores as spaces) in the text
      // e.g. "ordinary_world" matches "ordinary world" in text
      const asWords = slotName.replace(/_/g, ' ')
      // Case-insensitive replace of the word form, preserving word boundaries
      const wordPattern = new RegExp(`\\b${asWords}\\b`, 'gi')
      if (wordPattern.test(result)) {
        result = result.replace(wordPattern, `{${slotName}}`)
      } else {
        // Also try the underscore form directly
        const underscorePattern = new RegExp(`\\b${slotName}\\b`, 'gi')
        if (underscorePattern.test(result)) {
          result = result.replace(underscorePattern, `{${slotName}}`)
        }
      }
    }
    return result
  }, [text, requiredElements])

  // Split on {slot_name} patterns
  const parts = processedText.split(/(\{[a-z_]+\})/g)

  return (
    <span>
      {parts.map((part, i) => {
        const match = part.match(/^\{([a-z_]+)\}$/)
        if (!match) return <span key={i}>{part}</span>

        const slotName = match[1]
        const bound = slotValues[slotName]
        const displayValue = bound?.value || slotName.replace(/_/g, ' ')
        const catColor = CATEGORY_COLORS[bound?.category ?? 'concept'] ?? '#a855f7'

        return (
          <InlineSlot
            key={i}
            slotName={slotName}
            value={displayValue}
            color={catColor}
            onChange={(v) => onSlotChange(slotName, v)}
          />
        )
      })}
    </span>
  )
}

function InlineSlot({ slotName, value, color, onChange }: {
  slotName: string
  value: string
  color: string
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const commit = useCallback(() => {
    setEditing(false)
    if (draft.trim() && draft !== value) {
      onChange(draft.trim())
    } else {
      setDraft(value)
    }
  }, [draft, value, onChange])

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        style={{
          display: 'inline',
          width: Math.max(60, draft.length * 7 + 20),
          padding: '1px 4px',
          fontSize: 12,
          fontWeight: 600,
          color,
          background: `${color}12`,
          border: `1px solid ${color}`,
          borderRadius: 3,
          outline: 'none',
        }}
      />
    )
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      title={`Click to edit: ${slotName}`}
      style={{
        display: 'inline',
        padding: '1px 6px',
        fontWeight: 700,
        color,
        background: `${color}14`,
        borderBottom: `2px solid ${color}`,
        borderRadius: '3px 3px 0 0',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {value}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deduplicate slots across scenes in a beat (same slot can appear in multiple scenes). */
function dedupeSlots(slots: [string, { slot_name: string; category: string; required: boolean; bound_value?: string }][]) {
  const seen = new Set<string>()
  return slots.filter(([key]) => {
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function MetaLabel({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color, marginBottom: 2 }}>
      {children}
    </div>
  )
}

function MetaItem({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4, paddingLeft: 6 }}>
      {'\u2022'} {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Character card
// ---------------------------------------------------------------------------

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
          {ch.traits && ch.traits.length > 0 && <FieldRow label="Traits" values={ch.traits} />}
          {ch.motivations && ch.motivations.length > 0 && <FieldRow label="Motivations" values={ch.motivations} />}
          {ch.flaw && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#ef4444', fontSize: 9, textTransform: 'uppercase' }}>Flaw: </span>{ch.flaw}
            </div>
          )}
          {ch.arc_direction && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#3b82f6', fontSize: 9, textTransform: 'uppercase' }}>Arc: </span>{ch.arc_direction}
            </div>
          )}
          {ch.backstory && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 9, textTransform: 'uppercase' }}>Backstory: </span>{ch.backstory}
            </div>
          )}
          {ch.relationships && ch.relationships.length > 0 && <FieldRow label="Relationships" values={ch.relationships} />}
          {ch.distinguishing_feature && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: '#8b5cf6', fontSize: 9, textTransform: 'uppercase' }}>Distinguishing: </span>{ch.distinguishing_feature}
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

// ---------------------------------------------------------------------------
// Genre constraint card
// ---------------------------------------------------------------------------

function GenreConstraintCard({ tmpl }: {
  tmpl: { label: string; severity: string; level: number | null; constraint_template: string; binding_rules: string[]; anti_patterns_to_block?: string[] }
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      marginBottom: 4,
      background: 'var(--bg-elevated)',
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded((v) => !v)}
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
          {expanded ? '\u25BC' : '\u25B6'}
        </span>
        <span style={{ fontWeight: 600, flex: 1 }}>{tmpl.label}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          textTransform: 'uppercase',
          padding: '1px 5px',
          borderRadius: 3,
          color: tmpl.severity === 'hard' ? '#f59e0b' : '#8b5cf6',
          background: tmpl.severity === 'hard' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
        }}>
          {tmpl.severity === 'hard' ? 'Required' : 'Suggested'} L{tmpl.level}
        </span>
      </button>
      {expanded && (
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
              <span style={{ fontWeight: 600, color: '#ef4444' }}>Avoid: </span>
              {tmpl.anti_patterns_to_block.map((ap, i) => (
                <div key={i} style={{ marginLeft: 8, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {'\u2718'} {ap}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabBtn({ label, active, count, onClick, editable }: {
  label: string
  active: boolean
  count: number
  onClick: () => void
  editable?: boolean
}) {
  const activeColor = editable ? '#22c55e' : 'var(--accent)'
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        fontSize: 10,
        fontWeight: active ? 600 : 400,
        color: active ? activeColor : 'var(--text-muted)',
        borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {label} {count > 0 && <span style={{ opacity: 0.7 }}>({count})</span>}
    </button>
  )
}
