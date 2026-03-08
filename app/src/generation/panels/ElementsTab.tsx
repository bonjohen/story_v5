/**
 * ElementsTab — backbone slot templates, Fill All Details, entity registry display.
 */

import { useCallback, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { buildFillDetailsPrompt, parseFillDetailsResponse } from '../agents/fillDetailsTemplate.ts'
import { LABEL } from './generationConstants.ts'

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
      if (!adapter || !adapter.connected) {
        await connectBridge()
        adapter = useRequestStore.getState().bridgeAdapter
      }
      if (!adapter) {
        setFillError('Bridge not connected. Connect LLM first.')
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
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                color: cat === 'character' ? '#f59e0b'
                  : cat === 'place' ? '#3b82f6'
                  : cat === 'object' ? '#8b5cf6'
                  : 'var(--text-muted)',
                marginBottom: 3,
              }}>
                {cat}s ({slotsByCategory[cat].length})
              </div>
              {slotsByCategory[cat].map((slot) => {
                const binding = detailBindings?.slot_bindings?.[slot.key]
                return (
                  <div key={slot.key} style={{
                    padding: '4px 8px',
                    marginBottom: 2,
                    fontSize: 11,
                    background: 'var(--bg-elevated)',
                    borderRadius: 3,
                    borderLeft: `3px solid ${slot.required ? '#f59e0b' : 'var(--border)'}`,
                    display: 'flex',
                    gap: 6,
                    alignItems: 'baseline',
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
              width: '100%',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid #8b5cf6',
              background: fillingDetails ? 'var(--border)' : '#8b5cf618',
              color: fillingDetails ? 'var(--text-muted)' : '#8b5cf6',
              cursor: fillingDetails ? 'wait' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {fillingDetails ? 'Filling Details...' : 'Fill All Details (1 LLM Call)'}
          </button>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
            Generates characters, places, objects, events, arcs, and timeline in a single LLM call.
          </span>
          {fillError && (
            <div style={{
              marginTop: 6,
              padding: '6px 8px',
              fontSize: 11,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 4,
              border: '1px solid rgba(239,68,68,0.2)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {fillError}
            </div>
          )}
        </div>
      )}

      {/* Entity Registry */}
      {registry && (
        <div>
          <span style={LABEL}>Entity Registry</span>

          {/* Characters */}
          {registry.characters.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b', marginBottom: 3 }}>
                Characters ({registry.characters.length})
              </div>
              {registry.characters.map((ch) => (
                <div key={ch.id} style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  background: 'var(--bg-elevated)',
                  borderRadius: 4,
                  borderLeft: '3px solid #f59e0b',
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ch.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>{ch.role}</span>
                  </div>
                  {ch.traits && ch.traits.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <strong>Traits:</strong> {ch.traits.join(', ')}
                    </div>
                  )}
                  {ch.motivations && ch.motivations.length > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <strong>Motivations:</strong> {ch.motivations.join(', ')}
                    </div>
                  )}
                  {ch.flaw && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <strong>Flaw:</strong> {ch.flaw}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Places */}
          {registry.places.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#3b82f6', marginBottom: 3 }}>
                Places ({registry.places.length})
              </div>
              {registry.places.map((pl) => (
                <div key={pl.id} style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  background: 'var(--bg-elevated)',
                  borderRadius: 4,
                  borderLeft: '3px solid #3b82f6',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{pl.name}</div>
                  {pl.atmosphere && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <strong>Atmosphere:</strong> {pl.atmosphere}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Objects */}
          {registry.objects.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#8b5cf6', marginBottom: 3 }}>
                Objects ({registry.objects.length})
              </div>
              {registry.objects.map((obj) => (
                <div key={obj.id} style={{
                  padding: '6px 8px',
                  marginBottom: 4,
                  background: 'var(--bg-elevated)',
                  borderRadius: 4,
                  borderLeft: '3px solid #8b5cf6',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{obj.name}</div>
                  {obj.significance && (
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <strong>Significance:</strong> {obj.significance}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
