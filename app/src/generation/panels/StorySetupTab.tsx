/**
 * StorySetupTab — the "do everything before generation" tab.
 * Includes story config, entity editing, structure building, and story graph generation.
 */

import { useCallback, useRef, useEffect, useState, useMemo } from 'react'
import { useRequestStore } from '../store/requestStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { UI_COLORS, STATUS_COLORS, ENTITY_COLORS, COMPAT_COLORS } from '../../theme/colors.ts'
import { loadPremiseLookup, lookupPremise } from '../engine/premiseLookup.ts'
import type { PremiseEntry } from '../engine/premiseLookup.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { ARCHETYPE_OPTIONS, GENRE_OPTIONS, LABEL, INPUT, nameToDir, DEFAULT_CONFIG, STATE_LABELS } from './generationConstants.ts'
import { randomCharacter, randomPlace, randomObject } from './sampleElements.ts'
import { OpenAICompatibleAdapter } from '../agents/openaiCompatibleAdapter.ts'
import type {
  StoryRequest,
  GenerationConfig,
  StoryDetailBindings,
  DetailCharacter,
  DetailPlace,
  DetailObject,
} from '../artifacts/types.ts'

const COLORS = ENTITY_COLORS
const fieldInput: React.CSSProperties = { ...INPUT, fontSize: 11, padding: '3px 6px', marginTop: 2 }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nextId(prefix: string, existing: { id: string }[]): string {
  let n = existing.length + 1
  while (existing.some((e) => e.id === `${prefix}_${String(n).padStart(2, '0')}`)) n++
  return `${prefix}_${String(n).padStart(2, '0')}`
}

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
        <span style={{ color: STATUS_COLORS.pass, fontSize: 10 }}>{binding.bound_value}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontStyle: 'italic' }}>{slot.description || 'unfilled'}</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SAMPLE TONES for randomization
// ---------------------------------------------------------------------------

const SAMPLE_TONES = [
  'somber, reflective', 'epic, sweeping', 'dark, gritty', 'whimsical, lighthearted',
  'tense, claustrophobic', 'lyrical, poetic', 'sardonic, dry', 'warm, nostalgic',
  'urgent, breathless', 'meditative, slow-burn', 'raw, unflinching', 'hopeful, bittersweet',
]

const COMPAT_TIER_INFO = {
  naturally_compatible: { label: 'Naturally Compatible', color: COMPAT_COLORS.naturally_compatible, icon: '\u2605' },
  occasionally_compatible: { label: 'Occasionally Compatible', color: COMPAT_COLORS.occasionally_compatible, icon: '\u25C9' },
  rarely_compatible: { label: 'Rarely Compatible', color: COMPAT_COLORS.rarely_compatible, icon: '\u26A0' },
} as const

const SAMPLE_VOICES = [
  'first-person, unreliable', 'close third-person', 'omniscient narrator',
  'second-person, present tense', 'distant third-person', 'first-person, confessional',
  'epistolary', 'stream of consciousness', 'close third, past tense',
]

// ---------------------------------------------------------------------------
// StorySetupTab
// ---------------------------------------------------------------------------

export function StorySetupTab() {
  const running = useGenerationStore((s) => s.running)
  const genError = useGenerationStore((s) => s.error)
  const genStatus = useGenerationStore((s) => s.status)
  const events = useGenerationStore((s) => s.events)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)
  const locked = useUIStore((s) => s.setupLocked)
  const toggleLock = useUIStore((s) => s.toggleSetupLock)
  const contract = useGenerationStore((s) => s.contract)
  const clearRun = useGenerationStore((s) => s.clearRun)
  const backbone = useGenerationStore((s) => s.backbone)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const setDetailBindings = useGenerationStore((s) => s.setDetailBindings)
  const startRun = useGenerationStore((s) => s.startRun)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const narrativeVoice = useRequestStore((s) => s.narrativeVoice)
  const workingTitle = useRequestStore((s) => s.workingTitle)
  const setPremise = useRequestStore((s) => s.setPremise)
  const setArchetype = useRequestStore((s) => s.setArchetype)
  const setGenre = useRequestStore((s) => s.setGenre)
  const setTone = useRequestStore((s) => s.setTone)
  const setNarrativeVoice = useRequestStore((s) => s.setNarrativeVoice)
  const setWorkingTitle = useRequestStore((s) => s.setWorkingTitle)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const bridgeError = useRequestStore((s) => s.bridgeError)

  const manifest = useGraphStore((s) => s.manifest)
  const loadArchetypeGraph = useGraphStore((s) => s.loadArchetypeGraph)
  const loadGenreGraph = useGraphStore((s) => s.loadGenreGraph)

  const elementsLocked = useUIStore((s) => s.elementsLocked)
  const toggleElementsLock = useUIStore((s) => s.toggleElementsLock)

  // Fill Details state
  const [fillError, setFillError] = useState<string | null>(null)
  const [fillLog] = useState<string[]>([])

  useEffect(() => {
    if (running) setFillError(null)
  }, [running])

  // Pre-populate narrative voice from backbone style directives
  useEffect(() => {
    if (backbone?.style_directives?.global_voice && !narrativeVoice) {
      setNarrativeVoice(backbone.style_directives.global_voice)
    }
  }, [backbone, narrativeVoice, setNarrativeVoice])

  // Compatibility matrix
  const [compatMatrix, setCompatMatrix] = useState<{ genres: { genre: string; naturally_compatible: { archetype: string; rationale: string }[]; occasionally_compatible: { archetype: string; rationale: string }[]; rarely_compatible: { archetype: string; rationale: string }[] }[] } | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cross_references/genre_archetype_matrix.json`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setCompatMatrix(data))
      .catch(() => null)
  }, [])

  const compatibility = useMemo(() => {
    if (!compatMatrix || !archetype || !genre) return null
    const genreEntry = compatMatrix.genres.find((g) => g.genre.toLowerCase() === genre.toLowerCase())
    if (!genreEntry) return null
    const archLower = archetype.toLowerCase()
    // Match by exact name or startsWith (matrix uses "Comedy (Restoration of Order)" while dropdown uses "Comedy")
    const matchArch = (c: { archetype: string }) => {
      const cl = c.archetype.toLowerCase()
      return cl === archLower || cl.startsWith(archLower + ' (')
    }
    const nat = genreEntry.naturally_compatible.find(matchArch)
    if (nat) return { tier: 'naturally_compatible' as const, rationale: nat.rationale }
    const occ = genreEntry.occasionally_compatible.find(matchArch)
    if (occ) return { tier: 'occasionally_compatible' as const, rationale: occ.rationale }
    const rare = genreEntry.rarely_compatible.find(matchArch)
    if (rare) return { tier: 'rarely_compatible' as const, rationale: rare.rationale }
    return null
  }, [compatMatrix, archetype, genre])

  // Premise lookup
  type LookupMap = Record<string, PremiseEntry>
  const [premiseLookup, setPremiseLookup] = useState<LookupMap | null>(null)
  useEffect(() => {
    loadPremiseLookup().then((map) => {
      setPremiseLookup(map)
    }).catch(() => {})
  }, [])

  const applyPremiseLookup = useCallback((archName: string, genreName: string) => {
    if (!premiseLookup) return
    const entry = lookupPremise(premiseLookup, archName, genreName)
    if (entry) {
      setPremise(entry.premise)
      setTone(entry.tone)
    }
  }, [premiseLookup, setPremise, setTone])

  const handleArchetypeChange = useCallback((name: string) => {
    setArchetype(name)
    applyPremiseLookup(name, genre)
    clearRun()
    if (manifest) {
      const dir = nameToDir(name, manifest.archetypes)
      if (dir) void loadArchetypeGraph(dir)
    }
  }, [manifest, loadArchetypeGraph, setArchetype, genre, applyPremiseLookup, clearRun])

  const handleGenreChange = useCallback((name: string) => {
    setGenre(name)
    applyPremiseLookup(archetype, name)
    clearRun()
    if (manifest) {
      const dir = nameToDir(name, manifest.genres)
      if (dir) void loadGenreGraph(dir)
    }
  }, [manifest, loadGenreGraph, setGenre, archetype, applyPremiseLookup, clearRun])

  // Sync default selections to graph store on mount
  const syncedDefaults = useRef(false)
  useEffect(() => {
    if (syncedDefaults.current || !manifest) return
    syncedDefaults.current = true
    const archDir = nameToDir(archetype, manifest.archetypes)
    if (archDir) void loadArchetypeGraph(archDir)
    const genDir = nameToDir(genre, manifest.genres)
    if (genDir) void loadGenreGraph(genDir)
  }, [manifest, archetype, genre, loadArchetypeGraph, loadGenreGraph])

  // --- Randomize Setup (fills archetype, genre, premise, tone, working title) ---
  const handleRandomizeSetup = useCallback(() => {
    // Pick random archetype and genre
    const randArch = ARCHETYPE_OPTIONS[Math.floor(Math.random() * ARCHETYPE_OPTIONS.length)]
    const randGenre = GENRE_OPTIONS[Math.floor(Math.random() * GENRE_OPTIONS.length)]
    const randTone = SAMPLE_TONES[Math.floor(Math.random() * SAMPLE_TONES.length)]
    const randVoice = SAMPLE_VOICES[Math.floor(Math.random() * SAMPLE_VOICES.length)]

    setArchetype(randArch.value)
    setGenre(randGenre)
    setNarrativeVoice(randVoice)

    // Set working title with date/time
    const now = new Date()
    const dateStr = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
    setWorkingTitle(`Working Title: ${dateStr}`)

    // Try premise lookup for the random combo; fallback to a generic premise
    if (premiseLookup) {
      const entry = lookupPremise(premiseLookup, randArch.value, randGenre)
      if (entry) {
        setPremise(entry.premise)
        setTone(entry.tone)
      } else {
        setPremise(`A ${randGenre.toLowerCase()} story following the ${randArch.value} archetype.`)
        setTone(randTone)
      }
    } else {
      setPremise(`A ${randGenre.toLowerCase()} story following the ${randArch.value} archetype.`)
      setTone(randTone)
    }

    // Load graphs for the new selections
    clearRun()
    if (manifest) {
      const archDir = nameToDir(randArch.value, manifest.archetypes)
      if (archDir) void loadArchetypeGraph(archDir)
      const genDir = nameToDir(randGenre, manifest.genres)
      if (genDir) void loadGenreGraph(genDir)
    }
  }, [premiseLookup, manifest, setArchetype, setGenre, setPremise, setTone, setNarrativeVoice, setWorkingTitle, clearRun, loadArchetypeGraph, loadGenreGraph])

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
  const isEditable = !elementsLocked

  // --- Build Structure ---
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
    // Expand entity sections so user sees the slots
    const setSec = useUIStore.getState().setSection
    setSec('setup-characters', false)
    setSec('setup-places', false)
    setSec('setup-objects', false)
  }, [premise, archetype, genre, tone, startRun])

  // Randomize elements (does NOT expand Characters)
  const handleRandomizeElements = useCallback(() => {
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

  // --- Generate Story Graph (full pipeline through planning) ---
  const handleGenerateStoryGraph = useCallback(async () => {
    // Auto-populate elements if empty — ensures roster covers required contract roles
    const genState = useGenerationStore.getState()
    if (!genState.detailBindings && genState.backbone) {
      handleRandomizeElements()
    }

    const runId = `RUN_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    const req: StoryRequest = {
      schema_version: '1.0.0', run_id: runId, generated_at: new Date().toISOString(),
      source_corpus_hash: '', premise, medium: 'novel', length_target: 'short_story',
      audience: { age_band: 'adult', content_limits: [] },
      requested_genre: genre, requested_archetype: archetype, tone_preference: tone,
      constraints: { must_include: [], must_exclude: [] },
    }
    const reqState = useRequestStore.getState()
    const beatExpansionEnabled = !reqState.fastDraft
    const effectiveMaxCalls = beatExpansionEnabled ? Math.max(maxLlmCalls, 60) : maxLlmCalls
    const config: GenerationConfig = {
      ...DEFAULT_CONFIG,
      max_llm_calls: effectiveMaxCalls,
      beat_expansion: { ...DEFAULT_CONFIG.beat_expansion!, enabled: beatExpansionEnabled },
    }

    let adapter = reqState.bridgeAdapter
    if (!adapter) {
      try {
        await connectBridge()
        adapter = useRequestStore.getState().bridgeAdapter
      } catch { /* fall through */ }
    }

    let planningAdapter = null
    if (reqState.openaiPlanningModel && reqState.llmBackend === 'openai') {
      planningAdapter = new OpenAICompatibleAdapter({
        baseUrl: reqState.openaiBaseUrl,
        model: reqState.openaiPlanningModel,
        apiKey: reqState.openaiApiKey || undefined,
      })
    }

    void startRun(req, config, 'draft', adapter ?? null, {
      skipValidation: reqState.fastDraft || reqState.skipValidation,
      planningLlm: planningAdapter,
    })
  }, [premise, archetype, genre, tone, maxLlmCalls, startRun, connectBridge, handleRandomizeElements])

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

  // Update a slot binding value
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
  const hasElements = charCount > 0 || placeCount > 0 || objectCount > 0

  const disabled = running || locked

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* ── TOP ACTION BAR: Randomize + Build Structure + Lock ─── */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
        <button
          onClick={handleRandomizeSetup}
          disabled={disabled}
          title="Randomly pick archetype, genre, premise, tone, and working title"
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: `1px solid ${STATUS_COLORS.pass}`, background: `${STATUS_COLORS.pass}18`,
            color: disabled ? 'var(--text-muted)' : STATUS_COLORS.pass,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          Randomize
        </button>
        <button
          onClick={handleBuildStructure}
          disabled={disabled || !premise.trim()}
          title="No LLM needed — creates template slots from archetype + genre"
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: `1px solid ${ENTITY_COLORS.character}`,
            background: `${ENTITY_COLORS.character}18`,
            color: (disabled || !premise.trim()) ? 'var(--text-muted)' : ENTITY_COLORS.character,
            cursor: (disabled || !premise.trim()) ? 'not-allowed' : 'pointer',
          }}
        >
          Build Structure
        </button>
        <button
          onClick={() => void handleGenerateStoryGraph()}
          disabled={running || !premise.trim() || !backbone || !hasElements}
          title={!backbone ? 'Build Structure first' : !hasElements ? 'Fill in characters, places, or objects first (use Randomize)' : 'Requires LLM — runs full pipeline through planning and draft'}
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: 'none',
            background: (running || !premise.trim() || !backbone || !hasElements) ? 'var(--border)' : 'var(--accent)',
            color: (running || !premise.trim() || !backbone || !hasElements) ? 'var(--text-muted)' : '#fff',
            cursor: (running || !premise.trim() || !backbone || !hasElements) ? 'not-allowed' : 'pointer',
          }}
        >
          Generate Story Graph
        </button>
        <button
          onClick={toggleLock}
          title={locked ? 'Unlock Setup' : 'Lock Setup'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, padding: '2px 8px', borderRadius: 3,
            border: `1px solid ${locked ? UI_COLORS.archetype : 'var(--border)'}`,
            background: locked ? '#f59e0b18' : 'transparent',
            color: locked ? UI_COLORS.archetype : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {locked ? '\u{1F512}' : '\u{1F513}'} {locked ? 'Locked' : 'Unlocked'}
        </button>
      </div>

      {/* Error banners */}
      {genError && genStatus === 'FAILED' && (
        <div style={{
          marginBottom: 10, padding: '8px 10px', fontSize: 11,
          background: `${STATUS_COLORS.fail}12`, border: `1px solid ${STATUS_COLORS.fail}40`,
          borderRadius: 4, color: STATUS_COLORS.fail,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
        }}>
          <strong>Generation failed:</strong> {genError}
        </div>
      )}
      {bridgeError && (
        <div style={{
          marginBottom: 10, padding: '8px 10px', fontSize: 11,
          background: `${STATUS_COLORS.fail}12`, border: `1px solid ${STATUS_COLORS.fail}40`,
          borderRadius: 4, color: STATUS_COLORS.fail,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
        }}>
          <strong>LLM connection error:</strong> {bridgeError}
        </div>
      )}

      {/* Working Title */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Working Title</span>
        <input
          type="text"
          value={workingTitle}
          onChange={(e) => setWorkingTitle(e.target.value)}
          disabled={disabled}
          placeholder="My Story Title..."
          style={INPUT}
        />
      </label>

      {/* Archetype + Genre row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Archetype</span>
          <select
            value={archetype}
            onChange={(e) => handleArchetypeChange(e.target.value)}
            disabled={disabled}
            style={{ ...INPUT, color: archetype ? undefined : 'var(--text-muted)' }}
          >
            <option value="" disabled>Select archetype...</option>
            {ARCHETYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Genre</span>
          <select
            value={genre}
            onChange={(e) => handleGenreChange(e.target.value)}
            disabled={disabled}
            style={{ ...INPUT, color: genre ? undefined : 'var(--text-muted)' }}
          >
            <option value="" disabled>Select genre...</option>
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Premise */}
      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={LABEL}>Premise</span>
        <textarea
          value={premise}
          onChange={(e) => setPremise(e.target.value)}
          disabled={disabled}
          rows={10}
          placeholder="Describe your story idea in a sentence or two..."
          style={{
            ...INPUT,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </label>

      {/* Tone + Narrative Voice row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Tone</span>
          <input
            type="text"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={disabled}
            placeholder="e.g., somber, epic, dark"
            style={INPUT}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Narrative Voice</span>
          <input
            type="text"
            value={narrativeVoice}
            onChange={(e) => setNarrativeVoice(e.target.value)}
            disabled={disabled}
            placeholder="e.g., first-person, close third, omniscient"
            style={INPUT}
          />
        </label>
      </div>

      {/* Compatibility */}
      {archetype && genre && compatibility && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: `1px solid ${COMPAT_TIER_INFO[compatibility.tier].color}30`,
          background: `${COMPAT_TIER_INFO[compatibility.tier].color}0a`,
          marginBottom: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 13 }}>{COMPAT_TIER_INFO[compatibility.tier].icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: COMPAT_TIER_INFO[compatibility.tier].color }}>
              {COMPAT_TIER_INFO[compatibility.tier].label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {compatibility.rationale}
          </div>
        </div>
      )}

      {/* Contract summary */}
      {contract && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid #f59e0b40',
          background: '#f59e0b08',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: UI_COLORS.archetype, marginBottom: 4 }}>
            Contract Summary
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            <div><strong>Archetype:</strong> {contract.archetype.name}</div>
            <div><strong>Genre:</strong> {contract.genre.name}</div>
            <div>
              <strong>Constraints:</strong>{' '}
              {contract.genre.hard_constraints.length} hard, {contract.genre.soft_constraints.length} soft
            </div>
            <div>
              <strong>Phases:</strong> {contract.phase_guidelines.length} phases,{' '}
              {contract.phase_guidelines.reduce((n, p) => n + (p.failure_modes?.length ?? 0), 0)} failure modes
            </div>
            <div><strong>Spine:</strong> {contract.archetype.spine_nodes.join(' \u2192 ')}</div>
          </div>
        </div>
      )}


      {/* ── ENTITY EDITING (after backbone) ────────────────── */}
      {backbone && (
        <>
          {/* Action toolbar — at the top of entity section */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            {contract && !running && !elementsLocked && (
              <button onClick={handleRandomizeElements} style={{
                padding: '3px 10px', fontSize: 10, fontWeight: 600, borderRadius: 3,
                border: `1px solid ${STATUS_COLORS.pass}`, background: `${STATUS_COLORS.pass}18`, color: STATUS_COLORS.pass,
                cursor: 'pointer',
              }} title="Replace all characters, places, and objects with random sample data from template slots">
                Randomize
              </button>
            )}
            <button
              onClick={toggleElementsLock}
              title={elementsLocked ? 'Unlock Elements' : 'Lock Elements'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, padding: '2px 8px', borderRadius: 3,
                border: `1px solid ${elementsLocked ? ENTITY_COLORS.character : 'var(--border)'}`,
                background: elementsLocked ? `${ENTITY_COLORS.character}18` : 'transparent',
                color: elementsLocked ? ENTITY_COLORS.character : 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              {elementsLocked ? '\u{1F512}' : '\u{1F513}'}
            </button>
          </div>

          {/* Fill Details feedback */}
          {fillError && (
            <div style={{
              marginBottom: 8, padding: '6px 8px', fontSize: 11, color: STATUS_COLORS.fail,
              background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>{fillError}</div>
          )}
          {fillLog.length > 0 && (
            <Disclosure title="Fill Log" persistKey="setup-fill-log" defaultCollapsed badge={`${fillLog.length}`}>
              <div style={{ maxHeight: 120, overflowY: 'auto', padding: '4px 8px' }}>
                {fillLog.map((entry, i) => (
                  <div key={i} style={{ fontSize: 10, padding: '1px 0', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{entry}</div>
                ))}
              </div>
            </Disclosure>
          )}

          {/* ── CHARACTERS ─────────────────────────────────────── */}
          <Disclosure title={`Characters (${charCount || charSlots.length || 0})`} persistKey="setup-characters" defaultCollapsed
            titleAction={isEditable ? <button onClick={addCharacter} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${ENTITY_COLORS.character}40`, color: ENTITY_COLORS.character, background: `${ENTITY_COLORS.character}10`, cursor: 'pointer', fontWeight: 600 }}>Add</button> : undefined}
          >
            <div style={{ padding: '4px 8px' }}>
              {registry && registry.characters.length > 0 && (
                <div>
                  {registry.characters.map((ch) => (
                    <div key={ch.id} style={{
                      padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.character}`,
                    }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                        {isEditable && <button onClick={() => removeCharacter(ch.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>{'\u00d7'}</button>}
                        <input value={ch.name} placeholder="Name" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                        <input value={ch.role} placeholder="Role" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'role', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10, color: COLORS.character }} />
                      </div>
                      <input value={ch.traits?.join(', ') ?? ''} placeholder="Traits (comma-separated)" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'traits', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                      <input value={ch.motivations?.join(', ') ?? ''} placeholder="Motivations" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'motivations', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                      <input value={ch.flaw ?? ''} placeholder="Flaw" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'flaw', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                      <input value={ch.relationships?.join(', ') ?? ''} placeholder="Relationships" disabled={elementsLocked} onChange={(e) => updateCharacter(ch.id, 'relationships', e.target.value)} style={fieldInput} />
                    </div>
                  ))}
                </div>
              )}
              {!registry && charSlots.length === 0 && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No character data yet.</p>
              )}
            </div>
          </Disclosure>

          {/* ── PLACES ─────────────────────────────────────────── */}
          <Disclosure title={`Places (${placeCount || placeSlots.length || 0})`} persistKey="setup-places" defaultCollapsed
            titleAction={isEditable ? <button onClick={addPlace} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${ENTITY_COLORS.place}40`, color: ENTITY_COLORS.place, background: `${ENTITY_COLORS.place}10`, cursor: 'pointer', fontWeight: 600 }}>Add</button> : undefined}
          >
            <div style={{ padding: '4px 8px' }}>
              {registry && registry.places.length > 0 && (
                <div>
                  {registry.places.map((pl) => (
                    <div key={pl.id} style={{
                      padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.place}`,
                    }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                        {isEditable && <button onClick={() => removePlace(pl.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>{'\u00d7'}</button>}
                        <input value={pl.name} placeholder="Name" disabled={elementsLocked} onChange={(e) => updatePlace(pl.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                        <input value={pl.type} placeholder="Type" disabled={elementsLocked} onChange={(e) => updatePlace(pl.id, 'type', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                      </div>
                      <input value={pl.atmosphere ?? ''} placeholder="Atmosphere" disabled={elementsLocked} onChange={(e) => updatePlace(pl.id, 'atmosphere', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                      <input value={pl.features?.join(', ') ?? ''} placeholder="Features" disabled={elementsLocked} onChange={(e) => updatePlace(pl.id, 'features', e.target.value)} style={fieldInput} />
                    </div>
                  ))}
                </div>
              )}
              {!registry && placeSlots.length === 0 && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No place data yet.</p>
              )}
            </div>
          </Disclosure>

          {/* ── OBJECTS ─────────────────────────────────────────── */}
          <Disclosure title={`Objects (${objectCount || objectSlots.length || 0})`} persistKey="setup-objects" defaultCollapsed
            titleAction={isEditable ? <button onClick={addObject} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, border: `1px solid ${ENTITY_COLORS.object}40`, color: ENTITY_COLORS.object, background: `${ENTITY_COLORS.object}10`, cursor: 'pointer', fontWeight: 600 }}>Add</button> : undefined}
          >
            <div style={{ padding: '4px 8px' }}>
              {registry && registry.objects.length > 0 && (
                <div>
                  {registry.objects.map((obj) => (
                    <div key={obj.id} style={{
                      padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: `3px solid ${COLORS.object}`,
                    }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 3 }}>
                        {isEditable && <button onClick={() => removeObject(obj.id)} title="Remove" style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', padding: '0 4px' }}>{'\u00d7'}</button>}
                        <input value={obj.name} placeholder="Name" disabled={elementsLocked} onChange={(e) => updateObject(obj.id, 'name', e.target.value)} style={{ ...fieldInput, flex: 1, fontWeight: 600 }} />
                        <input value={obj.type} placeholder="Type" disabled={elementsLocked} onChange={(e) => updateObject(obj.id, 'type', e.target.value)} style={{ ...fieldInput, width: 80, fontSize: 10 }} />
                      </div>
                      <input value={obj.significance ?? ''} placeholder="Significance" disabled={elementsLocked} onChange={(e) => updateObject(obj.id, 'significance', e.target.value)} style={{ ...fieldInput, marginBottom: 2 }} />
                      <input value={obj.properties?.join(', ') ?? ''} placeholder="Properties" disabled={elementsLocked} onChange={(e) => updateObject(obj.id, 'properties', e.target.value)} style={fieldInput} />
                    </div>
                  ))}
                </div>
              )}
              {!registry && objectSlots.length === 0 && (
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>No object data yet.</p>
              )}
            </div>
          </Disclosure>

          {/* ── CONCEPTS ───────────────────────────────────────── */}
          {conceptSlots.length > 0 && (
            <Disclosure title={`Concepts (${conceptSlots.length})`} persistKey="setup-concepts" defaultCollapsed>
              <div style={{ padding: '4px 8px' }}>
                {conceptSlots.map((slot) => (
                  <SlotRow key={slot.key} slot={slot} binding={detailBindings?.slot_bindings?.[slot.key]}
                    color={COLORS.concept} editable={isEditable} onUpdate={updateSlotBinding} />
                ))}
              </div>
            </Disclosure>
          )}
        </>
      )}

      {/* ── STYLE DIRECTIVES ─────────────────────────────── */}
      {backbone?.style_directives && (
        <Disclosure title="Style Directives" persistKey="setup-style" defaultCollapsed>
          <div style={{ padding: '4px 8px' }}>
            {backbone.style_directives.global_pacing && (
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                <strong>Pacing:</strong> {backbone.style_directives.global_pacing}
              </div>
            )}
            {backbone.style_directives.lexicon?.canonical_terms && Object.keys(backbone.style_directives.lexicon.canonical_terms).length > 0 && (
              <div style={{ fontSize: 11, marginBottom: 4 }}>
                <strong>Canonical Terms:</strong>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {Object.entries(backbone.style_directives.lexicon.canonical_terms).map(([k, v]) => (
                    <div key={k}>{k}: {v}</div>
                  ))}
                </div>
              </div>
            )}
            {backbone.style_directives.feature_pack_ids && backbone.style_directives.feature_pack_ids.length > 0 && (
              <div style={{ fontSize: 11 }}>
                <strong>Feature Packs:</strong> {backbone.style_directives.feature_pack_ids.join(', ')}
              </div>
            )}
          </div>
        </Disclosure>
      )}

      {/* ── EVENT LOG ──────────────────────────────────────── */}
      {events.length > 0 && (
        <Disclosure title="Event Log" persistKey="setup-event-log" defaultCollapsed={false} badge={`${events.length}`}>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 8px' }}>
            {events.map((ev, i) => {
              const info = STATE_LABELS[ev.state] ?? { label: ev.state, color: 'var(--text-muted)' }
              return (
                <div key={i} style={{ fontSize: 10, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <span style={{ color: info.color, fontWeight: 600, flexShrink: 0 }}>{info.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{ev.message}</span>
                </div>
              )
            })}
          </div>
        </Disclosure>
      )}

      {/* ── LLM TELEMETRY ──────────────────────────────────── */}
      {llmTelemetry.length > 0 && (
        <Disclosure title="LLM Telemetry" persistKey="setup-llm-telemetry" defaultCollapsed badge={`${llmTelemetry.length}`}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              display: 'flex', gap: 12, padding: '4px 8px', marginBottom: 4,
              fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
            }}>
              <span>OK: {llmTelemetry.filter(t => t.status === 'success').length}</span>
              <span style={{ color: llmTelemetry.some(t => t.status === 'error') ? STATUS_COLORS.fail : undefined }}>
                Err: {llmTelemetry.filter(t => t.status === 'error').length}
              </span>
              <span>In: {(llmTelemetry.reduce((s, t) => s + t.inputChars, 0) / 1024).toFixed(1)}KB</span>
              <span>Out: {(llmTelemetry.filter(t => t.outputChars).reduce((s, t) => s + (t.outputChars ?? 0), 0) / 1024).toFixed(1)}KB</span>
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {llmTelemetry.map((t) => (
                <div key={t.callNumber} style={{
                  display: 'flex', gap: 6, alignItems: 'baseline', padding: '2px 8px',
                  fontSize: 10, fontFamily: 'monospace',
                  color: t.status === 'error' ? STATUS_COLORS.fail : t.status === 'success' ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}>
                  <span style={{ width: 24, flexShrink: 0, textAlign: 'right' }}>#{t.callNumber}</span>
                  <span style={{ width: 55, flexShrink: 0 }}>{t.method === 'completeJson' ? 'json' : t.method === 'completeStream' ? 'stream' : 'text'}</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{(t.inputChars / 1024).toFixed(1)}K in</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{t.outputChars != null ? `${(t.outputChars / 1024).toFixed(1)}K out` : '...'}</span>
                  <span style={{ width: 40, flexShrink: 0 }}>{t.durationMs != null ? `${(t.durationMs / 1000).toFixed(1)}s` : ''}</span>
                  <span style={{ fontWeight: 600, color: t.status === 'error' ? STATUS_COLORS.fail : t.status === 'success' ? STATUS_COLORS.pass : STATUS_COLORS.warn }}>
                    {t.status === 'error' ? 'FAIL' : t.status === 'success' ? 'OK' : 'WAIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      )}

    </div>
  )
}
