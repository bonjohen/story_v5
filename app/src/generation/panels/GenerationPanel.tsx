/**
 * Generation Panel — operator console for the story generation pipeline.
 * Provides run controls, progress indicator, and event log stream.
 *
 * All form state lives in requestStore so values persist across tab switches.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import { useInstanceStore } from '../../instance/store/instanceStore.ts'
import { instanceFromDetailBindings } from '../../instance/store/instanceBridge.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { exportSnapshot, downloadSnapshot, parseSnapshot } from '../artifacts/storySnapshot.ts'
import { loadPremiseLookup, lookupPremise } from '../engine/premiseLookup.ts'
import { buildFillDetailsPrompt, parseFillDetailsResponse } from '../agents/fillDetailsTemplate.ts'
import type { PremiseEntry } from '../engine/premiseLookup.ts'
import type { StoryRequest, GenerationMode, GenerationConfig } from '../artifacts/types.ts'
import {
  DEFAULT_CONFIG,
  ARCHETYPE_OPTIONS,
  GENRE_OPTIONS,
  MODE_OPTIONS,
  STATE_LABELS,
  LABEL,
  INPUT,
  nameToDir,
} from './generationConstants.ts'

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
  const backbone = useGenerationStore((s) => s.backbone)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const setDetailBindings = useGenerationStore((s) => s.setDetailBindings)
  const selection = useGenerationStore((s) => s.selection)
  const request = useGenerationStore((s) => s.request)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)

  const loadInstance = useInstanceStore((s) => s.loadInstance)
  const [savedInstance, setSavedInstance] = useState(false)

  // Premise lookup map — loaded once from JSON, applied on load + selection change
  type LookupMap = Record<string, PremiseEntry>
  const [premiseLookup, setPremiseLookup] = useState<LookupMap | null>(null)
  useEffect(() => {
    loadPremiseLookup().then((map) => {
      setPremiseLookup(map)
      // Apply to current selections on first load
      const { archetype: a, genre: g, setPremise: sp, setTone: st } = useRequestStore.getState()
      const entry = lookupPremise(map, a, g)
      if (entry) {
        sp(entry.premise)
        st(entry.tone)
      }
    }).catch(() => {})
  }, [])

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
  const llmBackend = useRequestStore((s) => s.llmBackend)
  const bridgeUrl = useRequestStore((s) => s.bridgeUrl)
  const setPremise = useRequestStore((s) => s.setPremise)
  const setArchetype = useRequestStore((s) => s.setArchetype)
  const setGenre = useRequestStore((s) => s.setGenre)
  const setMode = useRequestStore((s) => s.setMode)
  const setTone = useRequestStore((s) => s.setTone)
  const setLlmBackend = useRequestStore((s) => s.setLlmBackend)
  const setBridgeUrl = useRequestStore((s) => s.setBridgeUrl)

  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const setMaxLlmCalls = useRequestStore((s) => s.setMaxLlmCalls)
  const bridgeStatus = useRequestStore((s) => s.bridgeStatus)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const disconnectBridge = useRequestStore((s) => s.disconnectBridge)

  // Auto-connect to bridge on mount (bridge is started by Vite plugin)
  const autoConnectAttempted = useRef(false)
  useEffect(() => {
    if (autoConnectAttempted.current) return
    autoConnectAttempted.current = true
    const { bridgeStatus: bs } = useRequestStore.getState()
    if (bs === 'disconnected') {
      // Small delay to let the bridge server finish starting
      const timer = setTimeout(() => {
        void useRequestStore.getState().connectBridge()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Apply looked-up premise and tone for the current archetype+genre pair
  const applyPremiseLookup = useCallback((archName: string, genreName: string) => {
    if (!premiseLookup) return
    const entry = lookupPremise(premiseLookup, archName, genreName)
    if (entry) {
      setPremise(entry.premise)
      setTone(entry.tone)
    }
  }, [premiseLookup, setPremise, setTone])

  // Sync archetype/genre selections to graph display + premise lookup
  // Clear stale generation results when selection changes
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

  const logRef = useRef<HTMLDivElement>(null)

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [events])

  const handleStart = useCallback(async () => {
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
      },
    }

    const config: GenerationConfig = { ...DEFAULT_CONFIG, max_llm_calls: maxLlmCalls }

    // Always try to connect adapter
    let adapter = useRequestStore.getState().bridgeAdapter
    if (!adapter) {
      try {
        await connectBridge()
        adapter = useRequestStore.getState().bridgeAdapter
      } catch {
        // fall through — will run without LLM
      }
    }
    void startRun(request, config, mode, adapter ?? null)
  }, [premise, archetype, genre, mode, tone, llmBackend, maxLlmCalls, startRun, connectBridge])

  const handleSaveInstance = useCallback(() => {
    if (!detailBindings) return
    const inst = instanceFromDetailBindings(detailBindings, selection ?? null, request ?? null)
    loadInstance(inst)
    setSavedInstance(true)
  }, [detailBindings, selection, request, loadInstance])

  // Fill All Details — single LLM call to generate all story elements
  const [fillingDetails, setFillingDetails] = useState(false)
  const [fillError, setFillError] = useState<string | null>(null)

  const handleFillDetails = useCallback(async () => {
    if (!contract || !backbone || !request) return
    setFillingDetails(true)
    setFillError(null)

    try {
      // Ensure LLM is connected
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

  // Reset saved indicator when a new run starts
  useEffect(() => {
    if (running) {
      setSavedInstance(false)
      setFillError(null)
    }
  }, [running])

  const handleConnect = useCallback(() => {
    void connectBridge()
  }, [connectBridge])

  const loadSnapshot = useGenerationStore((s) => s.loadSnapshot)

  const handleExport = useCallback(() => {
    const state = useGenerationStore.getState()
    const snapshot = exportSnapshot(state)
    downloadSnapshot(snapshot)
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const snapshot = parseSnapshot(reader.result as string)
          loadSnapshot(snapshot)
        } catch (err) {
          console.error('Failed to import snapshot:', err)
          alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [loadSnapshot])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan
  const canSaveInstance = !running && detailBindings != null

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
            rows={10}
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

        {/* LLM Connection */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid',
          borderColor: bridgeStatus === 'connected' ? '#22c55e40' : 'var(--border)',
          background: bridgeStatus === 'connected' ? '#22c55e08' : 'var(--bg-primary)',
        }}>
          <button
            onClick={handleConnect}
            disabled={running || bridgeStatus === 'connecting' || bridgeStatus === 'connected'}
            style={{
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              cursor: bridgeStatus === 'connecting' ? 'wait'
                : bridgeStatus === 'connected' ? 'default' : 'pointer',
              border: 'none',
              background: bridgeStatus === 'connected' ? '#22c55e'
                : bridgeStatus === 'error' ? '#ef4444'
                : 'var(--accent)',
              color: '#fff',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            {bridgeStatus === 'connected' ? 'LLM Connected'
              : bridgeStatus === 'connecting' ? 'Connecting...'
              : bridgeStatus === 'error' ? 'Retry Connection'
              : 'Connect LLM'}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            {bridgeStatus === 'connected' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bridgeUrl}
                </span>
                <button onClick={disconnectBridge} style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                  Disconnect
                </button>
              </div>
            )}
            {bridgeStatus === 'error' && (
              <span style={{ fontSize: 10, color: '#ef4444', lineHeight: 1.3 }}>
                Could not connect to bridge at {bridgeUrl}
              </span>
            )}
            {bridgeStatus === 'disconnected' && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {llmBackend === 'none' ? 'No LLM — template output only' : 'Claude Code bridge'}
              </span>
            )}
          </div>
        </div>

        {/* LLM Settings (collapsed) */}
        <Disclosure title="LLM Settings" persistKey="gen-llm-settings" defaultCollapsed={true}
          badge={llmBackend === 'bridge' ? 'bridge' : 'template'}>
          <div style={{ padding: '4px 12px 10px' }}>
            <label style={{ display: 'block', marginBottom: 8 }}>
              <span style={LABEL}>Backend</span>
              <select
                value={llmBackend}
                onChange={(e) => setLlmBackend(e.target.value as 'none' | 'bridge')}
                disabled={running}
                style={INPUT}
              >
                <option value="none">None (deterministic template)</option>
                <option value="bridge">Claude Code (local bridge)</option>
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 8 }}>
              <span style={LABEL}>Max LLM Calls</span>
              <input
                type="number"
                value={maxLlmCalls}
                onChange={(e) => setMaxLlmCalls(Number(e.target.value))}
                disabled={running}
                min={1}
                max={100}
                style={{ ...INPUT, width: 80 }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
                Hard cap on LLM calls per run. Pipeline stops gracefully when reached.
              </span>
            </label>
            {llmBackend === 'bridge' && (
              <label style={{ display: 'block' }}>
                <span style={LABEL}>Bridge URL</span>
                <input
                  type="text"
                  value={bridgeUrl}
                  onChange={(e) => setBridgeUrl(e.target.value)}
                  disabled={running || bridgeStatus === 'connected'}
                  placeholder="ws://127.0.0.1:8765"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }}
                />
              </label>
            )}
          </div>
        </Disclosure>

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

        {/* Fill All Details — single LLM call after backbone is ready */}
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
              Generates all characters, places, objects, events, emotional arcs, and timeline in a single LLM call using the contract and backbone.
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

        {/* Import / Export */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleImport}
            disabled={running}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Import
          </button>
          {hasResults && (
            <button
              onClick={handleExport}
              disabled={running}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: 11,
                borderRadius: 4,
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Export
            </button>
          )}
        </div>

        {/* Save as Story Instance */}
        {canSaveInstance && (
          <button
            onClick={handleSaveInstance}
            disabled={savedInstance}
            style={{
              width: '100%',
              padding: '7px 12px',
              marginBottom: 12,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: savedInstance ? '1px solid #22c55e40' : '1px solid var(--accent)',
              background: savedInstance ? '#22c55e18' : 'var(--accent)18',
              color: savedInstance ? '#22c55e' : 'var(--accent)',
              cursor: savedInstance ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {savedInstance ? 'Saved to Story Instances' : 'Save as Story Instance'}
          </button>
        )}

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

        {/* LLM Telemetry */}
        {llmTelemetry.length > 0 && (
          <Disclosure title="LLM Telemetry" persistKey="gen-llm-telemetry" defaultCollapsed={false}
            badge={`${llmTelemetry.length} calls`}>
            <div style={{ padding: '4px 0' }}>
              {/* Summary row */}
              <div style={{
                display: 'flex',
                gap: 12,
                padding: '4px 8px',
                marginBottom: 4,
                fontSize: 10,
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border)',
              }}>
                <span>Total: {llmTelemetry.length}</span>
                <span>OK: {llmTelemetry.filter(t => t.status === 'success').length}</span>
                <span style={{ color: llmTelemetry.some(t => t.status === 'error') ? '#ef4444' : undefined }}>
                  Errors: {llmTelemetry.filter(t => t.status === 'error').length}
                </span>
                <span>
                  In: {(llmTelemetry.reduce((s, t) => s + t.inputChars, 0) / 1024).toFixed(1)}KB
                </span>
                <span>
                  Out: {(llmTelemetry.filter(t => t.outputChars).reduce((s, t) => s + (t.outputChars ?? 0), 0) / 1024).toFixed(1)}KB
                </span>
              </div>
              {/* Per-call rows */}
              <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                {llmTelemetry.map((t) => (
                  <div key={t.callNumber} style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'baseline',
                    padding: '2px 8px',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    color: t.status === 'error' ? '#ef4444'
                      : t.status === 'success' ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  }}>
                    <span style={{ width: 24, flexShrink: 0, textAlign: 'right' }}>#{t.callNumber}</span>
                    <span style={{ width: 55, flexShrink: 0 }}>{t.method === 'completeJson' ? 'json' : t.method === 'completeStream' ? 'stream' : 'text'}</span>
                    <span style={{ width: 50, flexShrink: 0 }}>{(t.inputChars / 1024).toFixed(1)}K in</span>
                    <span style={{ width: 50, flexShrink: 0 }}>{t.outputChars != null ? `${(t.outputChars / 1024).toFixed(1)}K out` : '...'}</span>
                    <span style={{ width: 40, flexShrink: 0 }}>{t.durationMs != null ? `${(t.durationMs / 1000).toFixed(1)}s` : ''}</span>
                    <span style={{
                      fontWeight: 600,
                      color: t.status === 'error' ? '#ef4444'
                        : t.status === 'success' ? '#22c55e'
                        : '#f59e0b',
                    }}>
                      {t.status === 'error' ? 'FAIL' : t.status === 'success' ? 'OK' : 'WAIT'}
                    </span>
                    {t.error && (
                      <span style={{ color: '#ef4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.error.slice(0, 80)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Disclosure>
        )}
      </div>
    </div>
  )
}
