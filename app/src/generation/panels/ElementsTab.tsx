/**
 * ElementsTab — backbone slot templates, Fill All Details, editable entity registry.
 */

import { useCallback, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { buildFillDetailsPrompt, parseFillDetailsResponse } from '../agents/fillDetailsTemplate.ts'
import { LABEL, INPUT } from './generationConstants.ts'
import type {
  StoryDetailBindings,
  DetailCharacter,
  DetailPlace,
  DetailObject,
} from '../artifacts/types.ts'

function nextId(prefix: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${prefix}_${String(n).padStart(2, '0')}`)) n++
  return `${prefix}_${String(n).padStart(2, '0')}`
}

export function ElementsTab() {
  const running = useGenerationStore((s) => s.running)
  const contract = useGenerationStore((s) => s.contract)
  const backbone = useGenerationStore((s) => s.backbone)
  const request = useGenerationStore((s) => s.request)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const setDetailBindings = useGenerationStore((s) => s.setDetailBindings)

  const connectBridge = useRequestStore((s) => s.connectBridge)

  const [fillingDetails, setFillingDetails] = useState(false)
  const [fillError, setFillError] = useState<string | null>(null)

  useEffect(() => {
    if (running) setFillError(null)
  }, [running])

  const handleFillDetails = useCallback(async () => {
    if (!contract || !backbone || !request) return
    setFillingDetails(true)
    setFillError(null)

    try {
      let adapter = useRequestStore.getState().bridgeAdapter
      if (!adapter) {
        try {
          await connectBridge()
        } catch { /* handled below */ }
        adapter = useRequestStore.getState().bridgeAdapter
      }
      if (!adapter) {
        setFillError('LLM not connected. Configure and connect via the Pipeline tab.')
        setFillingDetails(false)
        return
      }

      const messages = buildFillDetailsPrompt(request, contract, backbone)
      const response = adapter.completeJson
        ? await adapter.completeJson(messages)
        : await adapter.complete(messages)

      const { bindings } = parseFillDetailsResponse(
        response.content,
        request.run_id,
        backbone.source_corpus_hash,
      )
      setDetailBindings(bindings)
    } catch (err) {
      setFillError(err instanceof Error ? err.message : String(err))
    } finally {
      setFillingDetails(false)
    }
  }, [contract, backbone, request, connectBridge, setDetailBindings])

  // --- Entity editing helpers ---
  // Clone detailBindings and write back through setDetailBindings

  const updateBindings = useCallback((updater: (b: StoryDetailBindings) => StoryDetailBindings) => {
    const current = useGenerationStore.getState().detailBindings
    if (!current) return
    setDetailBindings(updater(current))
  }, [setDetailBindings])

  const updateCharacter = useCallback((id: string, field: keyof DetailCharacter, value: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        characters: b.entity_registry.characters.map((ch) =>
          ch.id === id
            ? { ...ch, [field]: field === 'traits' || field === 'motivations' || field === 'relationships' ? value.split(',').map((s) => s.trim()) : value }
            : ch
        ),
      },
    }))
  }, [updateBindings])

  const addCharacter = useCallback(() => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        characters: [...b.entity_registry.characters, {
          id: nextId('char', b.entity_registry.characters),
          name: '',
          role: 'ally',
        }],
      },
    }))
  }, [updateBindings])

  const removeCharacter = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        characters: b.entity_registry.characters.filter((ch) => ch.id !== id),
      },
    }))
  }, [updateBindings])

  const updatePlace = useCallback((id: string, field: keyof DetailPlace, value: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        places: b.entity_registry.places.map((pl) =>
          pl.id === id
            ? { ...pl, [field]: field === 'features' ? value.split(',').map((s) => s.trim()) : value }
            : pl
        ),
      },
    }))
  }, [updateBindings])

  const addPlace = useCallback(() => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        places: [...b.entity_registry.places, {
          id: nextId('place', b.entity_registry.places),
          name: '',
          type: 'setting',
        }],
      },
    }))
  }, [updateBindings])

  const removePlace = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        places: b.entity_registry.places.filter((pl) => pl.id !== id),
      },
    }))
  }, [updateBindings])

  const updateObject = useCallback((id: string, field: keyof DetailObject, value: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        objects: b.entity_registry.objects.map((obj) =>
          obj.id === id
            ? { ...obj, [field]: field === 'properties' ? value.split(',').map((s) => s.trim()) : value }
            : obj
        ),
      },
    }))
  }, [updateBindings])

  const addObject = useCallback(() => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        objects: [...b.entity_registry.objects, {
          id: nextId('obj', b.entity_registry.objects),
          name: '',
          type: 'token',
        }],
      },
    }))
  }, [updateBindings])

  const removeObject = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        objects: b.entity_registry.objects.filter((obj) => obj.id !== id),
      },
    }))
  }, [updateBindings])

  // Initialize empty bindings if none exist but user wants to add entities manually
  const initEmptyBindings = useCallback(() => {
    const req = useGenerationStore.getState().request
    const bb = useGenerationStore.getState().backbone
    setDetailBindings({
      schema_version: '1.0.0',
      run_id: req?.run_id ?? 'manual',
      generated_at: new Date().toISOString(),
      source_corpus_hash: bb?.source_corpus_hash ?? '',
      entity_registry: { characters: [], places: [], objects: [] },
      slot_bindings: {},
    })
  }, [setDetailBindings])

  // Collect all slots from backbone
  const allSlots: Record<string, { category: string; required: boolean; description?: string }> = {}
  if (backbone) {
    for (const beat of backbone.beats) {
      for (const scene of beat.scenes) {
        for (const [key, slot] of Object.entries(scene.slots)) {
          if (!allSlots[key]) {
            allSlots[key] = { category: slot.category, required: slot.required, description: slot.description }
          }
        }
      }
    }
  }

  const slotsByCategory: Record<string, { key: string; required: boolean; description?: string }[]> = {}
  for (const [key, slot] of Object.entries(allSlots)) {
    const cat = slot.category
    if (!slotsByCategory[cat]) slotsByCategory[cat] = []
    slotsByCategory[cat].push({ key, required: slot.required, description: slot.description })
  }

  const categoryOrder = ['character', 'place', 'object', 'concept']
  const sortedCategories = Object.keys(slotsByCategory).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  )

  const registry = detailBindings?.entity_registry

  const fieldInput: React.CSSProperties = { ...INPUT, fontSize: 11, padding: '3px 6px', marginTop: 2 }
  const catColor = (cat: string) =>
    cat === 'character' ? '#f59e0b' : cat === 'place' ? '#3b82f6' : '#8b5cf6'

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* No backbone yet */}
      {!backbone && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Run at least a Backbone generation first to see template slots here.
          Go to the Generate tab and click "Build Structure".
        </p>
      )}

      {/* Backbone slot templates */}
      {sortedCategories.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <span style={LABEL}>Template Slots</span>
          {sortedCategories.map((cat) => (
            <div key={cat} style={{ marginTop: 6 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                color: catColor(cat), marginBottom: 3,
              }}>
                {cat}s ({slotsByCategory[cat].length})
              </div>
              {slotsByCategory[cat].map((slot) => {
                const binding = detailBindings?.slot_bindings?.[slot.key]
                return (
                  <div key={slot.key} style={{
                    padding: '4px 8px', marginBottom: 2, fontSize: 11,
                    background: 'var(--bg-elevated)', borderRadius: 3,
                    borderLeft: `3px solid ${slot.required ? '#f59e0b' : 'var(--border)'}`,
                    display: 'flex', gap: 6, alignItems: 'baseline',
                  }}>
                    <span style={{ fontWeight: 500, minWidth: 80 }}>{slot.key}</span>
                    {binding ? (
                      <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>
                        {slot.description || 'unfilled'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Fill All Details button */}
      {backbone && contract && !running && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={handleFillDetails}
            disabled={fillingDetails}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 600,
              borderRadius: 4, border: '1px solid #8b5cf6',
              background: fillingDetails ? 'var(--border)' : '#8b5cf618',
              color: fillingDetails ? 'var(--text-muted)' : '#8b5cf6',
              cursor: fillingDetails ? 'wait' : 'pointer', transition: 'all 0.15s',
            }}
          >
            {fillingDetails ? 'Filling Details...' : 'Fill All Details (1 LLM Call)'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
            Generates characters, places, objects, events, arcs, and timeline in a single LLM call.
          </span>
          {fillError && (
            <div style={{
              marginTop: 6, padding: '6px 8px', fontSize: 11, color: '#ef4444',
              background: 'rgba(239,68,68,0.08)', borderRadius: 4,
              border: '1px solid rgba(239,68,68,0.2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {fillError}
            </div>
          )}
        </div>
      )}

      {/* Entity Registry — editable */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={LABEL}>Entity Registry</span>
          {!registry && (
            <button onClick={initEmptyBindings} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 3,
              border: '1px solid var(--border)', color: 'var(--text-muted)',
              cursor: 'pointer',
            }}>
              Start Empty
            </button>
          )}
        </div>

        {!registry && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            No entities yet. Use "Fill All Details" or click "Start Empty" to add manually.
          </p>
        )}

        {registry && (
          <>
            {/* Characters */}
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>
                  Characters ({registry.characters.length})
                </span>
                <button onClick={addCharacter} title="Add character" style={{
                  fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                  textAlign: 'center', borderRadius: 3, border: '1px solid #f59e0b40',
                  color: '#f59e0b', background: '#f59e0b10', cursor: 'pointer',
                }}>+</button>
              </div>
              {registry.characters.map((ch) => (
                <div key={ch.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
                  borderRadius: 4, borderLeft: '3px solid #f59e0b',
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={ch.name} placeholder="Name"
                      onChange={(e) => updateCharacter(ch.id, 'name', e.target.value)}
                      style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={ch.role} placeholder="Role"
                      onChange={(e) => updateCharacter(ch.id, 'role', e.target.value)}
                      style={{ ...fieldInput, width: 80, fontSize: 10, color: '#f59e0b' }} />
                    <button onClick={() => removeCharacter(ch.id)} title="Remove"
                      style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>
                      ×
                    </button>
                  </div>
                  <input value={ch.traits?.join(', ') ?? ''} placeholder="Traits (comma-separated)"
                    onChange={(e) => updateCharacter(ch.id, 'traits', e.target.value)}
                    style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.motivations?.join(', ') ?? ''} placeholder="Motivations (comma-separated)"
                    onChange={(e) => updateCharacter(ch.id, 'motivations', e.target.value)}
                    style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.flaw ?? ''} placeholder="Flaw"
                    onChange={(e) => updateCharacter(ch.id, 'flaw', e.target.value)}
                    style={fieldInput} />
                </div>
              ))}
            </div>

            {/* Places */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#3b82f6' }}>
                  Places ({registry.places.length})
                </span>
                <button onClick={addPlace} title="Add place" style={{
                  fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                  textAlign: 'center', borderRadius: 3, border: '1px solid #3b82f640',
                  color: '#3b82f6', background: '#3b82f610', cursor: 'pointer',
                }}>+</button>
              </div>
              {registry.places.map((pl) => (
                <div key={pl.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
                  borderRadius: 4, borderLeft: '3px solid #3b82f6',
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={pl.name} placeholder="Name"
                      onChange={(e) => updatePlace(pl.id, 'name', e.target.value)}
                      style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={pl.type} placeholder="Type"
                      onChange={(e) => updatePlace(pl.id, 'type', e.target.value)}
                      style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                    <button onClick={() => removePlace(pl.id)} title="Remove"
                      style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>
                      ×
                    </button>
                  </div>
                  <input value={pl.atmosphere ?? ''} placeholder="Atmosphere"
                    onChange={(e) => updatePlace(pl.id, 'atmosphere', e.target.value)}
                    style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={pl.features?.join(', ') ?? ''} placeholder="Features (comma-separated)"
                    onChange={(e) => updatePlace(pl.id, 'features', e.target.value)}
                    style={fieldInput} />
                </div>
              ))}
            </div>

            {/* Objects */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#8b5cf6' }}>
                  Objects ({registry.objects.length})
                </span>
                <button onClick={addObject} title="Add object" style={{
                  fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                  textAlign: 'center', borderRadius: 3, border: '1px solid #8b5cf640',
                  color: '#8b5cf6', background: '#8b5cf610', cursor: 'pointer',
                }}>+</button>
              </div>
              {registry.objects.map((obj) => (
                <div key={obj.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
                  borderRadius: 4, borderLeft: '3px solid #8b5cf6',
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={obj.name} placeholder="Name"
                      onChange={(e) => updateObject(obj.id, 'name', e.target.value)}
                      style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={obj.type} placeholder="Type"
                      onChange={(e) => updateObject(obj.id, 'type', e.target.value)}
                      style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                    <button onClick={() => removeObject(obj.id)} title="Remove"
                      style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>
                      ×
                    </button>
                  </div>
                  <input value={obj.significance ?? ''} placeholder="Significance"
                    onChange={(e) => updateObject(obj.id, 'significance', e.target.value)}
                    style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={obj.properties?.join(', ') ?? ''} placeholder="Properties (comma-separated)"
                    onChange={(e) => updateObject(obj.id, 'properties', e.target.value)}
                    style={fieldInput} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
