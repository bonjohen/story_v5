/**
 * ElementsTab — unified view of all story elements.
 * Consolidates template slots, entity registry, and genre constraints
 * into category-based sections (Characters, Places, Objects, Concepts).
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { buildFillDetailsPrompt, parseFillDetailsResponse } from '../agents/fillDetailsTemplate.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { INPUT, DEFAULT_CONFIG } from './generationConstants.ts'
import type { StoryRequest, GenerationConfig } from '../artifacts/types.ts'
import type {
  StoryDetailBindings,
  DetailCharacter,
  DetailPlace,
  DetailObject,
} from '../artifacts/types.ts'
import { randomCharacter, randomPlace, randomObject } from './sampleElements.ts'

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const COLORS = {
  character: '#f59e0b',
  relationship: '#a855f7',
  place: '#3b82f6',
  object: '#22c55e',
  concept: '#8b5cf6',
  rule: '#ef4444',
} as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextId(prefix: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${prefix}_${String(n).padStart(2, '0')}`)) n++
  return `${prefix}_${String(n).padStart(2, '0')}`
}

const fieldInput: React.CSSProperties = { ...INPUT, fontSize: 11, padding: '3px 6px', marginTop: 2 }

// ---------------------------------------------------------------------------
// Reusable slot row
// ---------------------------------------------------------------------------

function SlotRow({ slot, binding, color, editable, onUpdate }: {
  slot: { key: string; required: boolean; description?: string }
  binding?: { bound_value?: string } | null
  color: string
  editable: boolean
  onUpdate: (key: string, value: string) => void
}) {
  return (
    <div style={{
      padding: '4px 8px', marginBottom: 2, fontSize: 11, background: 'var(--bg-elevated)', borderRadius: 3,
      borderLeft: `3px solid ${slot.required ? color : 'var(--border)'}`,
      display: 'flex', gap: 6, alignItems: 'center',
    }}>
      <span style={{ fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{slot.key}</span>
      {editable ? (
        <input
          value={binding?.bound_value ?? ''}
          placeholder={slot.description || 'unfilled'}
          onChange={(e) => onUpdate(slot.key, e.target.value)}
          style={{ ...fieldInput, flex: 1, marginTop: 0 }}
        />
      ) : binding?.bound_value ? (
        <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ElementsTab
// ---------------------------------------------------------------------------

export function ElementsTab() {
  const running = useGenerationStore((s) => s.running)
  const contract = useGenerationStore((s) => s.contract)
  const backbone = useGenerationStore((s) => s.backbone)
  const request = useGenerationStore((s) => s.request)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const setDetailBindings = useGenerationStore((s) => s.setDetailBindings)
  const startRun = useGenerationStore((s) => s.startRun)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const connectBridge = useRequestStore((s) => s.connectBridge)

  const locked = useUIStore((s) => s.elementsLocked)
  const toggleLock = useUIStore((s) => s.toggleElementsLock)


  const [fillingDetails, setFillingDetails] = useState(false)
  const [fillError, setFillError] = useState<string | null>(null)
  const [fillAbort, setFillAbort] = useState<AbortController | null>(null)
  const [fillLog, setFillLog] = useState<string[]>([])

  useEffect(() => {
    if (running) setFillError(null)
  }, [running])

  // --- Slot data from backbone ---

  const slotsByCategory = useMemo(() => {
    const map: Record<string, { key: string; required: boolean; description?: string }[]> = {}
    if (backbone) {
      const seen = new Set<string>()
      for (const beat of backbone.beats) {
        for (const scene of beat.scenes) {
          for (const [key, slot] of Object.entries(scene.slots)) {
            if (!seen.has(key)) {
              seen.add(key)
              const cat = slot.category
              if (!map[cat]) map[cat] = []
              map[cat].push({ key, required: slot.required, description: slot.description })
            }
          }
        }
      }
    }
    return map
  }, [backbone])

  const registry = detailBindings?.entity_registry
  const isEditable = !locked

  // --- Actions ---

  const handleBuildStructure = useCallback(() => {
    const runId = `RUN_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    const req: StoryRequest = {
      schema_version: '1.0.0', run_id: runId, generated_at: new Date().toISOString(),
      source_corpus_hash: '', premise, medium: 'novel', length_target: 'short_story',
      audience: { age_band: 'adult', content_limits: [] },
      requested_genre: genre, requested_archetype: archetype, tone_preference: tone,
      constraints: { must_include: [], must_exclude: [] },
    }
    const config: GenerationConfig = { ...DEFAULT_CONFIG, max_llm_calls: 0 }
    void startRun(req, config, 'backbone', null)
  }, [premise, archetype, genre, tone, startRun])

  const handleFillDetails = useCallback(async () => {
    if (!contract || !backbone || !request) return
    const abort = new AbortController()
    setFillAbort(abort)
    setFillingDetails(true)
    setFillError(null)
    const log: string[] = []
    const addLog = (msg: string) => { log.push(`${new Date().toLocaleTimeString()} ${msg}`); setFillLog([...log]) }

    try {
      addLog('Connecting to LLM...')
      let adapter = useRequestStore.getState().bridgeAdapter
      if (!adapter) {
        try { await connectBridge() } catch { /* handled below */ }
        adapter = useRequestStore.getState().bridgeAdapter
      }
      if (!adapter) {
        setFillError('LLM not connected. Configure and connect via the Setup tab.')
        setFillingDetails(false)
        setFillAbort(null)
        return
      }
      addLog('LLM connected')

      const messages = buildFillDetailsPrompt(request, contract, backbone)
      const fullText = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n')
      addLog(`Sending prompt (${(fullText.length / 1024).toFixed(1)}KB)...`)

      const response = adapter.completeJson
        ? await adapter.completeJson(messages)
        : await adapter.complete(messages)

      if (abort.signal.aborted) return

      addLog(`Response received (${(response.content.length / 1024).toFixed(1)}KB)`)
      addLog('Parsing response...')

      const { bindings } = parseFillDetailsResponse(response.content, request.run_id, backbone.source_corpus_hash)

      const chars = bindings.entity_registry.characters
      const places = bindings.entity_registry.places
      const objects = bindings.entity_registry.objects
      const slots = Object.keys(bindings.slot_bindings).length

      addLog(`Created ${chars.length} characters: ${chars.map(c => c.name || c.role).join(', ')}`)
      addLog(`Created ${places.length} places: ${places.map(p => p.name || p.type).join(', ')}`)
      addLog(`Created ${objects.length} objects: ${objects.map(o => o.name || o.type).join(', ')}`)
      addLog(`Bound ${slots} template slots`)
      addLog('Fill Details complete')

      setDetailBindings(bindings)
    } catch (err) {
      if (abort.signal.aborted) return
      const msg = err instanceof Error ? err.message : String(err)
      addLog(`Error: ${msg}`)
      console.error('[fill-details] Error:', err)
      setFillError(msg)
    } finally {
      setFillingDetails(false)
      setFillAbort(null)
    }
  }, [contract, backbone, request, connectBridge, setDetailBindings])

  const handleCancelFill = useCallback(() => {
    fillAbort?.abort()
    setFillingDetails(false)
    setFillAbort(null)
    setFillError('Fill Details cancelled')
  }, [fillAbort])

  // --- Entity editing helpers ---

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
        characters: [...b.entity_registry.characters, { id: nextId('char', b.entity_registry.characters), name: '', role: 'ally' }],
      },
    }))
  }, [updateBindings])

  const removeCharacter = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: { ...b.entity_registry, characters: b.entity_registry.characters.filter((ch) => ch.id !== id) },
    }))
  }, [updateBindings])

  const updatePlace = useCallback((id: string, field: keyof DetailPlace, value: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        places: b.entity_registry.places.map((pl) =>
          pl.id === id ? { ...pl, [field]: field === 'features' ? value.split(',').map((s) => s.trim()) : value } : pl
        ),
      },
    }))
  }, [updateBindings])

  const addPlace = useCallback(() => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        places: [...b.entity_registry.places, { id: nextId('place', b.entity_registry.places), name: '', type: 'setting' }],
      },
    }))
  }, [updateBindings])

  const removePlace = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: { ...b.entity_registry, places: b.entity_registry.places.filter((pl) => pl.id !== id) },
    }))
  }, [updateBindings])

  const updateObject = useCallback((id: string, field: keyof DetailObject, value: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        objects: b.entity_registry.objects.map((obj) =>
          obj.id === id ? { ...obj, [field]: field === 'properties' ? value.split(',').map((s) => s.trim()) : value } : obj
        ),
      },
    }))
  }, [updateBindings])

  const addObject = useCallback(() => {
    updateBindings((b) => ({
      ...b,
      entity_registry: {
        ...b.entity_registry,
        objects: [...b.entity_registry.objects, { id: nextId('obj', b.entity_registry.objects), name: '', type: 'token' }],
      },
    }))
  }, [updateBindings])

  const removeObject = useCallback((id: string) => {
    updateBindings((b) => ({
      ...b,
      entity_registry: { ...b.entity_registry, objects: b.entity_registry.objects.filter((obj) => obj.id !== id) },
    }))
  }, [updateBindings])

  // Initialize bindings from backbone slots
  const initFromSlots = useCallback(() => {
    const req = useGenerationStore.getState().request
    const bb = useGenerationStore.getState().backbone
    const slots: Record<string, { category: string; required: boolean; description?: string }> = {}
    if (bb) {
      for (const beat of bb.beats) for (const scene of beat.scenes) for (const [key, slot] of Object.entries(scene.slots))
        if (!slots[key]) slots[key] = { category: slot.category, required: slot.required, description: slot.description }
    }
    const characters: StoryDetailBindings['entity_registry']['characters'] = []
    const places: StoryDetailBindings['entity_registry']['places'] = []
    const objects: StoryDetailBindings['entity_registry']['objects'] = []
    const slotBindings: StoryDetailBindings['slot_bindings'] = {}
    let charN = 1, placeN = 1, objN = 1
    for (const [key, slot] of Object.entries(slots)) {
      if (slot.category === 'character') {
        const id = `char_${String(charN++).padStart(2, '0')}`
        characters.push({ id, name: '', role: key, traits: [], motivations: [] })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: '', rationale: slot.description ?? '' }
      } else if (slot.category === 'place') {
        const id = `place_${String(placeN++).padStart(2, '0')}`
        places.push({ id, name: '', type: key, features: [] })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: '', rationale: slot.description ?? '' }
      } else if (slot.category === 'object') {
        const id = `obj_${String(objN++).padStart(2, '0')}`
        objects.push({ id, name: '', type: key })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: '', rationale: slot.description ?? '' }
      }
    }
    setDetailBindings({
      schema_version: '1.0.0', run_id: req?.run_id ?? 'manual',
      generated_at: new Date().toISOString(), source_corpus_hash: bb?.source_corpus_hash ?? '',
      entity_registry: { characters, places, objects }, slot_bindings: slotBindings,
    })
  }, [setDetailBindings])

  // Randomize elements
  const handleRandomize = useCallback(() => {
    const req = useGenerationStore.getState().request
    const bb = useGenerationStore.getState().backbone
    const slots: Record<string, { category: string; required: boolean; description?: string }> = {}
    if (bb) {
      for (const beat of bb.beats) for (const scene of beat.scenes) for (const [key, slot] of Object.entries(scene.slots))
        if (!slots[key]) slots[key] = { category: slot.category, required: slot.required, description: slot.description }
    }
    const characters: StoryDetailBindings['entity_registry']['characters'] = []
    const places: StoryDetailBindings['entity_registry']['places'] = []
    const objects: StoryDetailBindings['entity_registry']['objects'] = []
    const slotBindings: StoryDetailBindings['slot_bindings'] = {}
    let charN = 1, placeN = 1, objN = 1
    for (const [key, slot] of Object.entries(slots)) {
      if (slot.category === 'character') {
        const id = `char_${String(charN++).padStart(2, '0')}`
        const sample = randomCharacter(key)
        characters.push({ id, ...sample })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: sample.name, rationale: slot.description ?? '' }
      } else if (slot.category === 'place') {
        const id = `place_${String(placeN++).padStart(2, '0')}`
        const sample = randomPlace(key)
        places.push({ id, ...sample })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: sample.name, rationale: slot.description ?? '' }
      } else if (slot.category === 'object') {
        const id = `obj_${String(objN++).padStart(2, '0')}`
        const sample = randomObject(key)
        objects.push({ id, ...sample })
        slotBindings[key] = { slot_name: key, bound_entity_id: id, bound_value: sample.name, rationale: slot.description ?? '' }
      }
    }
    setDetailBindings({
      schema_version: '1.0.0', run_id: req?.run_id ?? 'manual',
      generated_at: new Date().toISOString(), source_corpus_hash: bb?.source_corpus_hash ?? '',
      entity_registry: { characters, places, objects }, slot_bindings: slotBindings,
    })
    useUIStore.setState((s) => ({
      collapsedSections: { ...s.collapsedSections, 'elem-characters': false },
    }))
  }, [setDetailBindings])

  // Update a slot binding value (auto-initializes bindings if needed)
  const updateSlotBinding = useCallback((slotKey: string, value: string) => {
    const state = useGenerationStore.getState()
    let current = state.detailBindings
    if (!current) {
      initFromSlots()
      current = useGenerationStore.getState().detailBindings
      if (!current) return
    }
    const existing = current.slot_bindings[slotKey]
    setDetailBindings({
      ...current,
      slot_bindings: {
        ...current.slot_bindings,
        [slotKey]: {
          slot_name: slotKey,
          bound_entity_id: existing?.bound_entity_id ?? '',
          bound_value: value,
          rationale: existing?.rationale ?? '',
        },
      },
    })
  }, [initFromSlots, setDetailBindings])

  // --- Counts ---
  const charSlots = slotsByCategory['character'] ?? []
  const placeSlots = slotsByCategory['place'] ?? []
  const objectSlots = slotsByCategory['object'] ?? []
  const conceptSlots = slotsByCategory['concept'] ?? []
  const charCount = registry?.characters.length ?? 0
  const placeCount = registry?.places.length ?? 0
  const objectCount = registry?.objects.length ?? 0

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* ── ACTION BAR ─────────────────────────────────────── */}
      {/* Build Structure — top of tab, the critical first action */}
      {!backbone && !running && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={handleBuildStructure}
            disabled={!premise.trim()}
            style={{
              width: '100%', padding: '10px 12px', fontSize: 12, fontWeight: 600,
              borderRadius: 4, border: '1px solid #f59e0b',
              background: '#f59e0b18', color: !premise.trim() ? 'var(--text-muted)' : '#f59e0b',
              cursor: !premise.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
            }}
          >
            Build Structure
            <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
              No LLM needed — creates template slots from archetype + genre
            </div>
          </button>
          {!premise.trim() && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              Enter a premise on the Setup tab first.
            </p>
          )}
        </div>
      )}

      {/* Lock + Manual Entry + Fill/Randomize — compact toolbar */}
      {backbone && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          {!registry && !locked && (
            <button onClick={initFromSlots} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 3,
              border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              Manual Entry
            </button>
          )}
          {contract && !running && !locked && (
            <>
              <button onClick={handleFillDetails} disabled={fillingDetails} style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 600, borderRadius: 3,
                border: '1px solid #8b5cf6', background: fillingDetails ? 'var(--border)' : '#8b5cf618',
                color: fillingDetails ? 'var(--text-muted)' : '#8b5cf6',
                cursor: fillingDetails ? 'wait' : 'pointer',
              }}>
                {fillingDetails ? 'Filling...' : 'Fill All (LLM)'}
              </button>
              <button onClick={handleRandomize} disabled={fillingDetails} style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 600, borderRadius: 3,
                border: '1px solid #22c55e', background: '#22c55e18', color: '#22c55e',
                cursor: fillingDetails ? 'not-allowed' : 'pointer',
              }} title="Fill all slots with randomly selected sample characters, places, and objects">
                Randomize
              </button>
              {fillingDetails && (
                <button onClick={handleCancelFill} style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 3,
                  border: '1px solid #ef4444', background: '#ef444418', color: '#ef4444', cursor: 'pointer',
                }}>Stop</button>
              )}
            </>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={toggleLock}
            title={locked ? 'Unlock Elements' : 'Lock Elements'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, padding: '2px 8px', borderRadius: 3,
              border: `1px solid ${locked ? '#f59e0b' : 'var(--border)'}`,
              background: locked ? '#f59e0b18' : 'transparent',
              color: locked ? '#f59e0b' : 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            {locked ? '\u{1F512}' : '\u{1F513}'}
          </button>
        </div>
      )}

      {/* Fill Details feedback */}
      {fillError && (
        <div style={{
          marginBottom: 8, padding: '6px 8px', fontSize: 11, color: '#ef4444',
          background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{fillError}</div>
      )}
      {fillLog.length > 0 && (
        <Disclosure title="Fill Log" persistKey="elem-fill-log" defaultCollapsed badge={`${fillLog.length}`}>
          <div style={{ maxHeight: 120, overflowY: 'auto', padding: '4px 8px' }}>
            {fillLog.map((entry, i) => (
              <div key={i} style={{ fontSize: 10, padding: '1px 0', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{entry}</div>
            ))}
          </div>
        </Disclosure>
      )}

      {/* ── CHARACTERS ─────────────────────────────────────── */}
      <Disclosure title={`Characters (${charCount || charSlots.length || 0})`} persistKey="elem-characters">
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {charSlots.map((slot) => (
            <SlotRow key={slot.key} slot={slot} binding={detailBindings?.slot_bindings?.[slot.key]}
              color={COLORS.character} editable={isEditable} onUpdate={updateSlotBinding} />
          ))}

          {registry && registry.characters.length > 0 && (
            <div style={{ marginTop: charSlots.length > 0 ? 6 : 0 }}>
              {registry.characters.map((ch) => (
                <div key={ch.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.character}`,
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={ch.name} placeholder="Name" onChange={(e) => updateCharacter(ch.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={ch.role} placeholder="Role" onChange={(e) => updateCharacter(ch.id, 'role', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10, color: COLORS.character }} />
                    {isEditable && <button onClick={() => removeCharacter(ch.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>×</button>}
                  </div>
                  <input value={ch.traits?.join(', ') ?? ''} placeholder="Traits (comma-separated)" onChange={(e) => updateCharacter(ch.id, 'traits', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.motivations?.join(', ') ?? ''} placeholder="Motivations" onChange={(e) => updateCharacter(ch.id, 'motivations', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.flaw ?? ''} placeholder="Flaw" onChange={(e) => updateCharacter(ch.id, 'flaw', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.relationships?.join(', ') ?? ''} placeholder="Relationships" onChange={(e) => updateCharacter(ch.id, 'relationships', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {isEditable && registry && (
            <button onClick={addCharacter} title="Add character" style={{
              marginTop: 4, fontSize: 10, padding: '2px 10px', borderRadius: 3,
              border: '1px solid #f59e0b40', color: '#f59e0b', background: '#f59e0b10', cursor: 'pointer',
            }}>+ Add</button>
          )}

          {!registry && charSlots.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No character data. Build structure first.</p>
          )}
        </div>
      </Disclosure>

      {/* ── PLACES ─────────────────────────────────────────── */}
      <Disclosure title={`Places (${placeCount || placeSlots.length || 0})`} persistKey="elem-places" defaultCollapsed>
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {placeSlots.map((slot) => (
            <SlotRow key={slot.key} slot={slot} binding={detailBindings?.slot_bindings?.[slot.key]}
              color={COLORS.place} editable={isEditable} onUpdate={updateSlotBinding} />
          ))}

          {registry && registry.places.length > 0 && (
            <div style={{ marginTop: placeSlots.length > 0 ? 6 : 0 }}>
              {registry.places.map((pl) => (
                <div key={pl.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.place}`,
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={pl.name} placeholder="Name" onChange={(e) => updatePlace(pl.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={pl.type} placeholder="Type" onChange={(e) => updatePlace(pl.id, 'type', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                    {isEditable && <button onClick={() => removePlace(pl.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>×</button>}
                  </div>
                  <input value={pl.atmosphere ?? ''} placeholder="Atmosphere" onChange={(e) => updatePlace(pl.id, 'atmosphere', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={pl.features?.join(', ') ?? ''} placeholder="Features" onChange={(e) => updatePlace(pl.id, 'features', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {isEditable && registry && (
            <button onClick={addPlace} title="Add place" style={{
              marginTop: 4, fontSize: 10, padding: '2px 10px', borderRadius: 3,
              border: '1px solid #3b82f640', color: '#3b82f6', background: '#3b82f610', cursor: 'pointer',
            }}>+ Add</button>
          )}

          {!registry && placeSlots.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No place data. Build structure first.</p>
          )}
        </div>
      </Disclosure>

      {/* ── OBJECTS ─────────────────────────────────────────── */}
      <Disclosure title={`Objects (${objectCount || objectSlots.length || 0})`} persistKey="elem-objects" defaultCollapsed>
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {objectSlots.map((slot) => (
            <SlotRow key={slot.key} slot={slot} binding={detailBindings?.slot_bindings?.[slot.key]}
              color={COLORS.object} editable={isEditable} onUpdate={updateSlotBinding} />
          ))}

          {registry && registry.objects.length > 0 && (
            <div style={{ marginTop: objectSlots.length > 0 ? 6 : 0 }}>
              {registry.objects.map((obj) => (
                <div key={obj.id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.object}`,
                }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                    <input value={obj.name} placeholder="Name" onChange={(e) => updateObject(obj.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                    <input value={obj.type} placeholder="Type" onChange={(e) => updateObject(obj.id, 'type', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                    {isEditable && <button onClick={() => removeObject(obj.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>×</button>}
                  </div>
                  <input value={obj.significance ?? ''} placeholder="Significance" onChange={(e) => updateObject(obj.id, 'significance', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={obj.properties?.join(', ') ?? ''} placeholder="Properties" onChange={(e) => updateObject(obj.id, 'properties', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {isEditable && registry && (
            <button onClick={addObject} title="Add object" style={{
              marginTop: 4, fontSize: 10, padding: '2px 10px', borderRadius: 3,
              border: '1px solid #22c55e40', color: '#22c55e', background: '#22c55e10', cursor: 'pointer',
            }}>+ Add</button>
          )}

          {!registry && objectSlots.length === 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No object data. Build structure first.</p>
          )}
        </div>
      </Disclosure>

      {/* ── CONCEPTS ───────────────────────────────────────── */}
      {conceptSlots.length > 0 && (
        <Disclosure title={`Concepts (${conceptSlots.length})`} persistKey="elem-concepts" defaultCollapsed>
          <div style={{ padding: '4px 8px' }}>
            {conceptSlots.map((slot) => (
              <SlotRow key={slot.key} slot={slot} binding={detailBindings?.slot_bindings?.[slot.key]}
                color={COLORS.concept} editable={isEditable} onUpdate={updateSlotBinding} />
            ))}
          </div>
        </Disclosure>
      )}
    </div>
  )
}
