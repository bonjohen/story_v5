/**
 * Generation Panel — operator console for the story generation pipeline.
 * Provides run controls, progress indicator, and event log stream.
 *
 * All form state lives in requestStore so values persist across tab switches.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import type { StoryRequest, GenerationMode, GenerationConfig } from '../artifacts/types.ts'

// Default generation config matching generation_config.json
const DEFAULT_CONFIG: GenerationConfig = {
  signals_policy: { mode: 'warn', min_fraction: 0.5 },
  tone_policy: { mode: 'warn' },
  repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
  coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
  composition_defaults: { allow_blend: true, allow_hybrid: false },
}

const ARCHETYPE_OPTIONS = [
  { value: 'The Hero\'s Journey', label: 'The Hero\'s Journey' },
  { value: 'Rags to Riches', label: 'Rags to Riches' },
  { value: 'The Quest', label: 'The Quest' },
  { value: 'Voyage and Return', label: 'Voyage and Return' },
  { value: 'Overcoming the Monster', label: 'Overcoming the Monster' },
  { value: 'Rebirth', label: 'Rebirth' },
  { value: 'Tragedy', label: 'Tragedy' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Coming of Age', label: 'Coming of Age' },
  { value: 'The Revenge', label: 'The Revenge' },
  { value: 'The Escape', label: 'The Escape' },
  { value: 'The Sacrifice', label: 'The Sacrifice' },
  { value: 'The Mystery Unveiled', label: 'The Mystery Unveiled' },
  { value: 'The Transformation', label: 'The Transformation' },
  { value: 'The Rise and Fall', label: 'The Rise and Fall' },
]

const GENRE_OPTIONS = [
  'Drama', 'Action', 'Comedy', 'Thriller', 'Fantasy', 'Science Fiction',
  'Adventure', 'Romance', 'Romantic Comedy', 'Horror', 'Mystery', 'Crime',
  'Detective', 'Superhero', 'Historical', 'War', 'Biography', 'Family',
  'Young Adult', 'Literary Fiction', 'Children\'s Literature', 'Satire',
  'Psychological', 'Western', 'Political', 'Musical', 'Holiday',
]

const MODE_OPTIONS: { value: GenerationMode; label: string; description: string }[] = [
  { value: 'contract-only', label: 'Contract Only', description: 'Compile structural rules from the corpus. No AI needed.' },
  { value: 'backbone', label: 'Backbone', description: 'Assemble story backbone with beats, slots, and chapter partition. No AI needed.' },
  { value: 'detailed-outline', label: 'Detailed Outline', description: 'Fill backbone slots with concrete characters, places, and objects.' },
  { value: 'outline', label: 'Outline', description: 'Generate a beat-by-beat plan with scene summaries.' },
  { value: 'draft', label: 'Full Draft', description: 'Generate complete scene prose with compliance validation.' },
  { value: 'chapters', label: 'Chapters', description: 'Full pipeline with chapter assembly and editorial polish.' },
]

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'var(--text-muted)' },
  LOADED_CORPUS: { label: 'Corpus Loaded', color: '#3b82f6' },
  SELECTED: { label: 'Selected', color: '#3b82f6' },
  CONTRACT_READY: { label: 'Contract Ready', color: '#f59e0b' },
  TEMPLATES_COMPILED: { label: 'Templates Compiled', color: '#f59e0b' },
  BACKBONE_ASSEMBLED: { label: 'Backbone Assembled', color: '#f59e0b' },
  DETAILS_BOUND: { label: 'Details Bound', color: '#f59e0b' },
  PLANNED: { label: 'Planned', color: '#f59e0b' },
  GENERATING_SCENE: { label: 'Writing...', color: '#8b5cf6' },
  VALIDATING_SCENE: { label: 'Validating...', color: '#8b5cf6' },
  REPAIRING_SCENE: { label: 'Repairing...', color: '#f97316' },
  CHAPTERS_ASSEMBLED: { label: 'Chapters Assembled', color: '#8b5cf6' },
  COMPLETED: { label: 'Completed', color: '#22c55e' },
  FAILED: { label: 'Failed', color: '#ef4444' },
}

/** Shared label style for form fields. */
const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

/** Shared input/select style. */
const INPUT: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '6px 8px',
  fontSize: 12,
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 4,
}

/** Map a display name to a manifest directory. */
function nameToDir(name: string, items: { name: string; filePath: string }[]): string | null {
  const entry = items.find((m) =>
    m.name === name || m.name.includes(name) || name.includes(m.name)
  )
  if (!entry) return null
  const parts = entry.filePath.split('/')
  return parts[parts.length - 1]
}

export { ARCHETYPE_OPTIONS, GENRE_OPTIONS }

export function GenerationPanel() {
  const status = useGenerationStore((s) => s.status)
  const running = useGenerationStore((s) => s.running)
  const events = useGenerationStore((s) => s.events)
  const error = useGenerationStore((s) => s.error)
  const contract = useGenerationStore((s) => s.contract)
  const plan = useGenerationStore((s) => s.plan)
  const startRun = useGenerationStore((s) => s.startRun)
  const clearRun = useGenerationStore((s) => s.clearRun)

  // Graph store — sync selections to load corresponding graphs
  const manifest = useGraphStore((s) => s.manifest)
  const loadArchetypeGraph = useGraphStore((s) => s.loadArchetypeGraph)
  const loadGenreGraph = useGraphStore((s) => s.loadGenreGraph)

  // Persistent form state from request store
  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const mode = useRequestStore((s) => s.mode)
  const tone = useRequestStore((s) => s.tone)
  const allowBlend = useRequestStore((s) => s.allowBlend)
  const blendGenre = useRequestStore((s) => s.blendGenre)
  const allowHybrid = useRequestStore((s) => s.allowHybrid)
  const hybridArchetype = useRequestStore((s) => s.hybridArchetype)

  const setPremise = useRequestStore((s) => s.setPremise)
  const setArchetype = useRequestStore((s) => s.setArchetype)
  const setGenre = useRequestStore((s) => s.setGenre)
  const setMode = useRequestStore((s) => s.setMode)
  const setTone = useRequestStore((s) => s.setTone)
  const setAllowBlend = useRequestStore((s) => s.setAllowBlend)
  const setBlendGenre = useRequestStore((s) => s.setBlendGenre)
  const setAllowHybrid = useRequestStore((s) => s.setAllowHybrid)
  const setHybridArchetype = useRequestStore((s) => s.setHybridArchetype)

  // Sync archetype/genre selections to graph display
  const handleArchetypeChange = useCallback((name: string) => {
    setArchetype(name)
    if (manifest) {
      const dir = nameToDir(name, manifest.archetypes)
      if (dir) void loadArchetypeGraph(dir)
    }
  }, [manifest, loadArchetypeGraph, setArchetype])

  const handleGenreChange = useCallback((name: string) => {
    setGenre(name)
    if (manifest) {
      const dir = nameToDir(name, manifest.genres)
      if (dir) void loadGenreGraph(dir)
    }
  }, [manifest, loadGenreGraph, setGenre])

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

  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  const handleStart = useCallback(() => {
    const runId = `RUN_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    const request: StoryRequest = {
      schema_version: '1.0.0',
      run_id: runId,
      generated_at: new Date().toISOString(),
      source_corpus_hash: '',
      premise,
      medium: 'novel',
      length_target: 'short_story',
      audience: { age_band: 'adult', content_limits: [] },
      requested_genre: genre,
      requested_archetype: archetype,
      tone_preference: tone,
      constraints: {
        must_include: [],
        must_exclude: [],
        allow_genre_blend: allowBlend,
        allow_hybrid_archetype: allowHybrid,
        ...(allowBlend && blendGenre ? { preferred_blend_genre: blendGenre } : {}),
        ...(allowHybrid && hybridArchetype ? { preferred_hybrid_archetype: hybridArchetype } : {}),
      },
    }

    const config: GenerationConfig = {
      ...DEFAULT_CONFIG,
      composition_defaults: {
        allow_blend: allowBlend,
        allow_hybrid: allowHybrid,
      },
    }

    void startRun(request, config, mode)
  }, [premise, archetype, genre, mode, tone, allowBlend, blendGenre, allowHybrid, hybridArchetype, startRun])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Story Generation
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status badge */}
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 3,
            color: stateInfo.color,
            background: `${stateInfo.color}18`,
          }}>
            {stateInfo.label}
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {/* Intro */}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
          Choose an archetype and genre, describe your premise, then generate.
          The pipeline compiles a structural contract from the corpus, plans
          beats and scenes, and optionally writes full prose.
        </p>

        {/* Premise */}
        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={LABEL}>Premise</span>
          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            disabled={running}
            rows={3}
            placeholder="Describe your story idea in a sentence or two..."
            style={{
              ...INPUT,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>

        {/* Archetype + Genre row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <label style={{ flex: 1 }}>
            <span style={LABEL}>Archetype</span>
            <select
              value={archetype}
              onChange={(e) => handleArchetypeChange(e.target.value)}
              disabled={running}
              style={INPUT}
            >
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
              disabled={running}
              style={INPUT}
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Mode + Tone row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <label style={{ flex: 1 }}>
            <span style={LABEL}>Output</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as GenerationMode)}
              disabled={running}
              style={INPUT}
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
              {MODE_OPTIONS.find((m) => m.value === mode)?.description}
            </span>
          </label>
          <label style={{ flex: 1 }}>
            <span style={LABEL}>Tone</span>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={running}
              placeholder="e.g., somber, epic, dark"
              style={INPUT}
            />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
              Sets the emotional register for the story.
            </span>
          </label>
        </div>

        {/* Composition options */}
        <div style={{
          marginBottom: 12,
          padding: '8px 10px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 4,
        }}>
          <span style={{ ...LABEL, display: 'block', marginBottom: 6 }}>Composition</span>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={allowBlend}
              onChange={(e) => setAllowBlend(e.target.checked)}
              disabled={running}
              style={{ marginTop: 2 }}
            />
            <span>
              <strong>Genre blend</strong>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 1 }}>
                Mix constraints from a second genre.
              </span>
            </span>
          </label>
          {allowBlend && (
            <div style={{ marginLeft: 22, marginBottom: 6 }}>
              <select
                value={blendGenre}
                onChange={(e) => setBlendGenre(e.target.value)}
                disabled={running}
                style={{ ...INPUT, marginTop: 0 }}
              >
                <option value="">Auto-select best match</option>
                {GENRE_OPTIONS.filter((g) => g !== genre).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>
            <input
              type="checkbox"
              checked={allowHybrid}
              onChange={(e) => setAllowHybrid(e.target.checked)}
              disabled={running}
              style={{ marginTop: 2 }}
            />
            <span>
              <strong>Hybrid archetype</strong>
              <span style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 1 }}>
                Follow two archetype structures simultaneously.
              </span>
            </span>
          </label>
          {allowHybrid && (
            <div style={{ marginLeft: 22, marginBottom: 2 }}>
              <select
                value={hybridArchetype}
                onChange={(e) => setHybridArchetype(e.target.value)}
                disabled={running}
                style={{ ...INPUT, marginTop: 0 }}
              >
                <option value="">Auto-select best match</option>
                {ARCHETYPE_OPTIONS.filter((o) => o.value !== archetype).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleStart}
            disabled={running || !premise.trim()}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 4,
              background: running ? 'var(--border)' : 'var(--accent)',
              color: running ? 'var(--text-muted)' : '#fff',
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {running ? 'Running...' : 'Generate'}
          </button>
          {hasResults && !running && (
            <button
              onClick={clearRun}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 4,
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            padding: '8px 10px',
            marginBottom: 10,
            fontSize: 11,
            color: '#ef4444',
            background: 'rgba(239,68,68,0.08)',
            borderRadius: 4,
            border: '1px solid rgba(239,68,68,0.2)',
          }}>
            {error}
          </div>
        )}

        {/* Event log */}
        {events.length > 0 && (
          <div>
            <span style={LABEL}>
              Event Log
            </span>
            <div
              ref={logRef}
              style={{
                marginTop: 4,
                maxHeight: 200,
                overflowY: 'auto',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: 6,
              }}
            >
              {events.map((ev, i) => {
                const info = STATE_LABELS[ev.state] ?? { label: ev.state, color: 'var(--text-muted)' }
                return (
                  <div key={i} style={{ fontSize: 10, padding: '2px 0', display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{ color: info.color, fontWeight: 600, flexShrink: 0 }}>
                      {info.label}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {ev.message}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
