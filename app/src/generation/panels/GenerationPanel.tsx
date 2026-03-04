/**
 * Generation Panel — operator console for the story generation pipeline.
 * Provides run controls, progress indicator, and event log stream.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
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
  { value: 'contract-only', label: 'Contract Only', description: 'Selection + contract (no LLM)' },
  { value: 'outline', label: 'Outline', description: 'Beats + scenes with summaries' },
  { value: 'draft', label: 'Full Draft', description: 'Complete scene prose generation' },
]

const STATE_LABELS: Record<string, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'var(--text-muted)' },
  LOADED_CORPUS: { label: 'Corpus Loaded', color: '#3b82f6' },
  SELECTED: { label: 'Selected', color: '#3b82f6' },
  CONTRACT_READY: { label: 'Contract Ready', color: '#f59e0b' },
  PLANNED: { label: 'Planned', color: '#f59e0b' },
  GENERATING_SCENE: { label: 'Writing...', color: '#8b5cf6' },
  VALIDATING_SCENE: { label: 'Validating...', color: '#8b5cf6' },
  REPAIRING_SCENE: { label: 'Repairing...', color: '#f97316' },
  COMPLETED: { label: 'Completed', color: '#22c55e' },
  FAILED: { label: 'Failed', color: '#ef4444' },
}

interface GenerationPanelProps {
  onClose: () => void
}

export function GenerationPanel({ onClose }: GenerationPanelProps) {
  const status = useGenerationStore((s) => s.status)
  const running = useGenerationStore((s) => s.running)
  const events = useGenerationStore((s) => s.events)
  const error = useGenerationStore((s) => s.error)
  const contract = useGenerationStore((s) => s.contract)
  const plan = useGenerationStore((s) => s.plan)
  const startRun = useGenerationStore((s) => s.startRun)
  const clearRun = useGenerationStore((s) => s.clearRun)

  // Form state
  const [premise, setPremise] = useState('A young engineer discovers that her space station\'s AI has developed consciousness and must decide whether to report it or protect it.')
  const [archetype, setArchetype] = useState('The Hero\'s Journey')
  const [genre, setGenre] = useState('Science Fiction')
  const [mode, setMode] = useState<GenerationMode>('contract-only')
  const [tone, setTone] = useState('somber')
  const [allowBlend, setAllowBlend] = useState(false)
  const [allowHybrid, setAllowHybrid] = useState(false)

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
  }, [premise, archetype, genre, mode, tone, allowBlend, allowHybrid, startRun])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan

  return (
    <div
      onKeyDown={handleKeyDown}
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
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Story Generation
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status badge */}
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 3,
            color: stateInfo.color,
            background: `${stateInfo.color}18`,
          }}>
            {stateInfo.label}
          </span>
          <button
            onClick={onClose}
            aria-label="Close generation panel"
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              padding: '2px 4px',
              borderRadius: 2,
            }}
          >
            {'\u2715'}
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {/* Premise */}
        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Premise
          </span>
          <textarea
            value={premise}
            onChange={(e) => setPremise(e.target.value)}
            disabled={running}
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              marginTop: 4,
              padding: '6px 8px',
              fontSize: 12,
              fontFamily: 'inherit',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              resize: 'vertical',
            }}
          />
        </label>

        {/* Archetype + Genre row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Archetype
            </span>
            <select
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              disabled={running}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '4px 6px',
                fontSize: 11,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
              }}
            >
              {ARCHETYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Genre
            </span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              disabled={running}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '4px 6px',
                fontSize: 11,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
              }}
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
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mode
            </span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as GenerationMode)}
              disabled={running}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '4px 6px',
                fontSize: 11,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
              }}
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
              {MODE_OPTIONS.find((m) => m.value === mode)?.description}
            </span>
          </label>
          <label style={{ flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tone
            </span>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={running}
              placeholder="e.g., somber, epic, dark"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '4px 6px',
                fontSize: 11,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 4,
              }}
            />
          </label>
        </div>

        {/* Composition toggles */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={allowBlend}
              onChange={(e) => setAllowBlend(e.target.checked)}
              disabled={running}
            />
            Genre blend
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={allowHybrid}
              onChange={(e) => setAllowHybrid(e.target.checked)}
              disabled={running}
            />
            Hybrid archetype
          </label>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleStart}
            disabled={running || !premise.trim()}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: 11,
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
                padding: '6px 12px',
                fontSize: 11,
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
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
