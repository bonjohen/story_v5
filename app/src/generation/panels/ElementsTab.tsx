/**
 * ElementsTab — unified view of all story elements.
 * Consolidates template slots, entity registry, and genre constraints
 * into category-based sections (Characters, Relationships, Places, Objects)
 * with editable fields alongside template/constraint context.
 */

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useElementStore } from '../../store/elementStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
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

const SEVERITY_BADGE: Record<string, { bg: string; text: string }> = {
  required: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  recommended: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  optional: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
}

function SeverityBadge({ severity }: { severity: string }) {
  const c = SEVERITY_BADGE[severity] ?? SEVERITY_BADGE.optional
  return (
    <span style={{
      fontSize: 8, padding: '1px 4px', borderRadius: 2,
      background: c.bg, color: c.text, fontWeight: 600, textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextId(prefix: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${prefix}_${String(n).padStart(2, '0')}`)) n++
  return `${prefix}_${String(n).padStart(2, '0')}`
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

  // Genre constraints from elementStore
  const genreDir = useGraphStore((s) => s.genreDir)
  const loadGenreConstraints = useElementStore((s) => s.loadGenreConstraints)
  const genreConstraints = useElementStore((s) => s.genreConstraints)
  const constraints = genreDir ? genreConstraints.get(genreDir) ?? null : null

  useEffect(() => {
    if (genreDir) void loadGenreConstraints(genreDir)
  }, [genreDir, loadGenreConstraints])

  const [fillingDetails, setFillingDetails] = useState(false)
  const [fillError, setFillError] = useState<string | null>(null)
  const [fillAbort, setFillAbort] = useState<AbortController | null>(null)
  const [fillLog, setFillLog] = useState<string[]>([])
  const [promptPreview, setPromptPreview] = useState<string | null>(null)

  useEffect(() => {
    if (running) setFillError(null)
  }, [running])

  // --- Slot data from backbone ---

  const allSlots = useMemo(() => {
    const slots: Record<string, { category: string; required: boolean; description?: string }> = {}
    if (backbone) {
      for (const beat of backbone.beats) {
        for (const scene of beat.scenes) {
          for (const [key, slot] of Object.entries(scene.slots)) {
            if (!slots[key]) slots[key] = { category: slot.category, required: slot.required, description: slot.description }
          }
        }
      }
    }
    return slots
  }, [backbone])

  const slotsByCategory = useMemo(() => {
    const map: Record<string, { key: string; required: boolean; description?: string }[]> = {}
    for (const [key, slot] of Object.entries(allSlots)) {
      const cat = slot.category
      if (!map[cat]) map[cat] = []
      map[cat].push({ key, required: slot.required, description: slot.description })
    }
    return map
  }, [allSlots])

  const registry = detailBindings?.entity_registry

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
        setFillError('LLM not connected. Configure and connect via the Pipeline tab.')
        setFillingDetails(false)
        setFillAbort(null)
        return
      }
      addLog('LLM connected')

      const messages = buildFillDetailsPrompt(request, contract, backbone)
      const fullText = messages.map((m) => `[${m.role}]\n${m.content}`).join('\n\n')
      setPromptPreview(fullText)
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
  }, [setDetailBindings])

  // Update a slot binding value (auto-initializes bindings if needed)
  const updateSlotBinding = useCallback((slotKey: string, value: string) => {
    const state = useGenerationStore.getState()
    let current = state.detailBindings
    if (!current) {
      // Auto-init from backbone slots if no bindings exist yet
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

  const fieldInput: React.CSSProperties = { ...INPUT, fontSize: 11, padding: '3px 6px', marginTop: 2 }
  const isEditable = !locked

  // --- Counts ---
  const charSlots = slotsByCategory['character'] ?? []
  const placeSlots = slotsByCategory['place'] ?? []
  const objectSlots = slotsByCategory['object'] ?? []
  const conceptSlots = slotsByCategory['concept'] ?? []
  const charCount = registry?.characters.length ?? 0
  const placeCount = registry?.places.length ?? 0
  const objectCount = registry?.objects.length ?? 0
  const relConstraintCount = constraints?.relationship_constraints.length ?? 0
  const ruleCount = constraints?.element_rules.length ?? 0

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Lock toggle + Manual Entry */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 6 }}>
        {!registry && backbone && !locked && (
          <button onClick={initFromSlots} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 3,
            border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
          }}>
            Manual Entry
          </button>
        )}
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
          {locked ? '\u{1F512}' : '\u{1F513}'} {locked ? 'Locked' : 'Unlocked'}
        </button>
      </div>

      {/* Fill All Details + Randomize */}
      {backbone && contract && !running && !locked && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleFillDetails} disabled={fillingDetails} style={{
              flex: 1, padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4,
              border: '1px solid #8b5cf6',
              background: fillingDetails ? 'var(--border)' : '#8b5cf618',
              color: fillingDetails ? 'var(--text-muted)' : '#8b5cf6',
              cursor: fillingDetails ? 'wait' : 'pointer', transition: 'all 0.15s',
            }}>
              {fillingDetails ? 'Filling Details...' : 'Fill All Details (1 LLM Call)'}
            </button>
            <button onClick={handleRandomize} disabled={fillingDetails} style={{
              padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4,
              border: '1px solid #22c55e', background: '#22c55e18', color: '#22c55e',
              cursor: fillingDetails ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }} title="Fill all slots with randomly selected sample characters, places, and objects">
              Randomize
            </button>
            {fillingDetails && (
              <button onClick={handleCancelFill} style={{
                padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4,
                border: '1px solid #ef4444', background: '#ef444418', color: '#ef4444', cursor: 'pointer',
              }}>Stop</button>
            )}
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
            Generates characters, places, objects, events, arcs, and timeline in a single LLM call.
          </span>
          {fillError && (
            <div style={{
              marginTop: 6, padding: '6px 8px', fontSize: 11, color: '#ef4444',
              background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{fillError}</div>
          )}
        </div>
      )}

      {/* Fill Details log */}
      {fillLog.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            maxHeight: 150, overflowY: 'auto', background: 'var(--bg-primary)',
            border: '1px solid var(--border)', borderRadius: 4, padding: 6,
          }}>
            {fillLog.map((entry, i) => (
              <div key={i} style={{ fontSize: 10, padding: '1px 0', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{entry}</div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt preview */}
      {promptPreview && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Prompt Sent ({(promptPreview.length / 1024).toFixed(1)}KB)</span>
            <button onClick={() => setPromptPreview(null)} style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
            }}>Hide</button>
          </div>
          <pre style={{
            marginTop: 4, maxHeight: 300, overflowY: 'auto', background: 'var(--bg-primary)',
            border: '1px solid var(--border)', borderRadius: 4, padding: 8, fontSize: 10,
            lineHeight: 1.4, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{promptPreview}</pre>
        </div>
      )}

      {/* ================================================================= */}
      {/*  CHARACTERS                                                       */}
      {/* ================================================================= */}
      <Disclosure title="Characters" persistKey="elem-characters" defaultCollapsed
        badge={`${charCount || charSlots.length || constraints?.character_constraints.length || 0}`}>
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {/* Genre character constraints */}
          {constraints && constraints.character_constraints.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Genre Requirements
              </div>
              {constraints.character_constraints.map((c) => (
                <div key={c.role} style={{
                  padding: '4px 8px', marginBottom: 3, background: `${COLORS.character}08`, borderRadius: 3,
                  borderLeft: `2px solid ${c.severity === 'required' ? '#ef4444' : c.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.character }}>{String(c.role).replace(/_/g, ' ')}</span>
                    <SeverityBadge severity={c.severity} />
                    {c.min_count != null && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>min {c.min_count}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Template slots for characters */}
          {charSlots.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Template Slots
              </div>
              {charSlots.map((slot) => {
                const binding = detailBindings?.slot_bindings?.[slot.key]
                return (
                  <div key={slot.key} style={{
                    padding: '4px 8px', marginBottom: 2, fontSize: 11, background: 'var(--bg-elevated)', borderRadius: 3,
                    borderLeft: `3px solid ${slot.required ? COLORS.character : 'var(--border)'}`,
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{slot.key}</span>
                    {isEditable ? (
                      <input
                        value={binding?.bound_value ?? ''}
                        placeholder={slot.description || 'unfilled'}
                        onChange={(e) => updateSlotBinding(slot.key, e.target.value)}
                        style={{ ...fieldInput, flex: 1, marginTop: 0 }}
                      />
                    ) : binding?.bound_value ? (
                      <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Editable characters */}
          {registry && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Entities ({registry.characters.length})
                </span>
                {isEditable && (
                  <button onClick={addCharacter} title="Add character" style={{
                    fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                    textAlign: 'center', borderRadius: 3, border: '1px solid #f59e0b40',
                    color: '#f59e0b', background: '#f59e0b10', cursor: 'pointer',
                  }}>+</button>
                )}
              </div>
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
                  <input value={ch.motivations?.join(', ') ?? ''} placeholder="Motivations (comma-separated)" onChange={(e) => updateCharacter(ch.id, 'motivations', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.flaw ?? ''} placeholder="Flaw" onChange={(e) => updateCharacter(ch.id, 'flaw', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                  <input value={ch.relationships?.join(', ') ?? ''} placeholder="Relationships (comma-separated)" onChange={(e) => updateCharacter(ch.id, 'relationships', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {!registry && charSlots.length === 0 && (!constraints || constraints.character_constraints.length === 0) && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No character data. Build structure or select a genre.</p>
          )}
        </div>
      </Disclosure>

      {/* ================================================================= */}
      {/*  RELATIONSHIPS                                                    */}
      {/* ================================================================= */}
      <Disclosure title="Relationships" persistKey="elem-relationships" defaultCollapsed
        badge={`${relConstraintCount}`}>
        <div style={{ padding: '4px 8px' }}>
          {constraints && constraints.relationship_constraints.length > 0 ? (
            constraints.relationship_constraints.map((r) => (
              <div key={r.type} style={{
                padding: '4px 8px', marginBottom: 3, background: `${COLORS.relationship}08`, borderRadius: 3,
                borderLeft: `2px solid ${r.severity === 'required' ? '#ef4444' : r.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.relationship }}>{String(r.type).replace(/_/g, ' ')}</span>
                  <SeverityBadge severity={r.severity} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{r.description}</div>
                {r.between_roles && (
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                    Between: {r.between_roles.join(' \u2194 ')}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No relationship constraints. Select a genre to see requirements.</p>
          )}
        </div>
      </Disclosure>

      {/* ================================================================= */}
      {/*  PLACES                                                           */}
      {/* ================================================================= */}
      <Disclosure title="Places" persistKey="elem-places" defaultCollapsed
        badge={`${placeCount || placeSlots.length || constraints?.place_constraints.length || 0}`}>
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {/* Genre place constraints */}
          {constraints && constraints.place_constraints.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Genre Requirements
              </div>
              {constraints.place_constraints.map((p) => (
                <div key={p.type} style={{
                  padding: '4px 8px', marginBottom: 3, background: `${COLORS.place}08`, borderRadius: 3,
                  borderLeft: `2px solid ${p.severity === 'required' ? '#ef4444' : p.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.place }}>{String(p.type).replace(/_/g, ' ')}</span>
                    <SeverityBadge severity={p.severity} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{p.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Template slots for places */}
          {placeSlots.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Template Slots
              </div>
              {placeSlots.map((slot) => {
                const binding = detailBindings?.slot_bindings?.[slot.key]
                return (
                  <div key={slot.key} style={{
                    padding: '4px 8px', marginBottom: 2, fontSize: 11, background: 'var(--bg-elevated)', borderRadius: 3,
                    borderLeft: `3px solid ${slot.required ? COLORS.place : 'var(--border)'}`,
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{slot.key}</span>
                    {isEditable ? (
                      <input
                        value={binding?.bound_value ?? ''}
                        placeholder={slot.description || 'unfilled'}
                        onChange={(e) => updateSlotBinding(slot.key, e.target.value)}
                        style={{ ...fieldInput, flex: 1, marginTop: 0 }}
                      />
                    ) : binding?.bound_value ? (
                      <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Editable places */}
          {registry && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Entities ({registry.places.length})</span>
                {isEditable && (
                  <button onClick={addPlace} title="Add place" style={{
                    fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                    textAlign: 'center', borderRadius: 3, border: '1px solid #3b82f640', color: '#3b82f6', background: '#3b82f610', cursor: 'pointer',
                  }}>+</button>
                )}
              </div>
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
                  <input value={pl.features?.join(', ') ?? ''} placeholder="Features (comma-separated)" onChange={(e) => updatePlace(pl.id, 'features', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {!registry && placeSlots.length === 0 && (!constraints || constraints.place_constraints.length === 0) && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No place data. Build structure or select a genre.</p>
          )}
        </div>
      </Disclosure>

      {/* ================================================================= */}
      {/*  OBJECTS                                                          */}
      {/* ================================================================= */}
      <Disclosure title="Objects" persistKey="elem-objects" defaultCollapsed
        badge={`${objectCount || objectSlots.length || constraints?.object_constraints.length || 0}`}>
        <div style={{ padding: '4px 8px', ...(locked ? { opacity: 0.7, pointerEvents: 'none' as const } : {}) }}>
          {/* Genre object constraints */}
          {constraints && constraints.object_constraints.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Genre Requirements
              </div>
              {constraints.object_constraints.map((o) => (
                <div key={o.type} style={{
                  padding: '4px 8px', marginBottom: 3, background: `${COLORS.object}08`, borderRadius: 3,
                  borderLeft: `2px solid ${o.severity === 'required' ? '#ef4444' : o.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.object }}>{String(o.type).replace(/_/g, ' ')}</span>
                    <SeverityBadge severity={o.severity} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{o.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Template slots for objects */}
          {objectSlots.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>
                Template Slots
              </div>
              {objectSlots.map((slot) => {
                const binding = detailBindings?.slot_bindings?.[slot.key]
                return (
                  <div key={slot.key} style={{
                    padding: '4px 8px', marginBottom: 2, fontSize: 11, background: 'var(--bg-elevated)', borderRadius: 3,
                    borderLeft: `3px solid ${slot.required ? COLORS.object : 'var(--border)'}`,
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    <span style={{ fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{slot.key}</span>
                    {isEditable ? (
                      <input
                        value={binding?.bound_value ?? ''}
                        placeholder={slot.description || 'unfilled'}
                        onChange={(e) => updateSlotBinding(slot.key, e.target.value)}
                        style={{ ...fieldInput, flex: 1, marginTop: 0 }}
                      />
                    ) : binding?.bound_value ? (
                      <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Editable objects */}
          {registry && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Entities ({registry.objects.length})</span>
                {isEditable && (
                  <button onClick={addObject} title="Add object" style={{
                    fontSize: 11, fontWeight: 700, width: 20, height: 20, lineHeight: '18px',
                    textAlign: 'center', borderRadius: 3, border: '1px solid #22c55e40', color: '#22c55e', background: '#22c55e10', cursor: 'pointer',
                  }}>+</button>
                )}
              </div>
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
                  <input value={obj.properties?.join(', ') ?? ''} placeholder="Properties (comma-separated)" onChange={(e) => updateObject(obj.id, 'properties', e.target.value)} style={fieldInput} />
                </div>
              ))}
            </div>
          )}

          {!registry && objectSlots.length === 0 && (!constraints || constraints.object_constraints.length === 0) && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No object data. Build structure or select a genre.</p>
          )}
        </div>
      </Disclosure>

      {/* ================================================================= */}
      {/*  CONCEPT SLOTS                                                    */}
      {/* ================================================================= */}
      {conceptSlots.length > 0 && (
        <Disclosure title="Concepts" persistKey="elem-concepts" defaultCollapsed badge={`${conceptSlots.length}`}>
          <div style={{ padding: '4px 8px' }}>
            {conceptSlots.map((slot) => {
              const binding = detailBindings?.slot_bindings?.[slot.key]
              return (
                <div key={slot.key} style={{
                  padding: '4px 8px', marginBottom: 2, fontSize: 11, background: 'var(--bg-elevated)', borderRadius: 3,
                  borderLeft: `3px solid ${slot.required ? COLORS.concept : 'var(--border)'}`,
                  display: 'flex', gap: 6, alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 500, minWidth: 80, flexShrink: 0 }}>{slot.key}</span>
                  {isEditable ? (
                    <input
                      value={binding?.bound_value ?? ''}
                      placeholder={slot.description || 'unfilled'}
                      onChange={(e) => updateSlotBinding(slot.key, e.target.value)}
                      style={{ ...fieldInput, flex: 1, marginTop: 0 }}
                    />
                  ) : binding?.bound_value ? (
                    <span style={{ color: '#22c55e', fontSize: 10 }}>{binding.bound_value}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
                  )}
                </div>
              )
            })}
          </div>
        </Disclosure>
      )}

      {/* ================================================================= */}
      {/*  ELEMENT RULES                                                    */}
      {/* ================================================================= */}
      {constraints && constraints.element_rules.length > 0 && (
        <Disclosure title="Element Rules" persistKey="elem-rules" defaultCollapsed badge={`${ruleCount}`}>
          <div style={{ padding: '4px 8px' }}>
            {constraints.element_rules.map((rule) => (
              <div key={rule.rule_id} style={{
                marginBottom: 6, padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 4,
                borderLeft: `2px solid ${rule.severity === 'required' ? '#ef4444' : rule.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rule.rule_id}</span>
                  <SeverityBadge severity={rule.severity} />
                  <span style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{rule.applies_to}</span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-primary)' }}>{rule.description}</div>
                <div style={{ fontSize: 10, lineHeight: 1.4, color: 'var(--text-muted)', marginTop: 3, fontStyle: 'italic' }}>
                  Test: {rule.testable_condition}
                </div>
              </div>
            ))}
          </div>
        </Disclosure>
      )}

      {/* Build Structure */}
      {!backbone && !running && (
        <div style={{ marginTop: 12, marginBottom: 12 }}>
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
    </div>
  )
}
