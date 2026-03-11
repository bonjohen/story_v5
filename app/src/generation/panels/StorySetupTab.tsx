/**
 * StorySetupTab — archetype/genre dropdowns, premise, tone, contract summary.
 * Syncs selections to graph display and premise lookup.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useRequestStore } from '../store/requestStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { loadPremiseLookup, lookupPremise } from '../engine/premiseLookup.ts'
import type { PremiseEntry } from '../engine/premiseLookup.ts'
import type { LlmBackend } from '../store/requestStore.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { ARCHETYPE_OPTIONS, GENRE_OPTIONS, LABEL, INPUT, nameToDir } from './generationConstants.ts'

export function StorySetupTab() {
  const running = useGenerationStore((s) => s.running)
  const locked = useUIStore((s) => s.setupLocked)
  const toggleLock = useUIStore((s) => s.toggleSetupLock)
  const contract = useGenerationStore((s) => s.contract)
  const clearRun = useGenerationStore((s) => s.clearRun)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const setPremise = useRequestStore((s) => s.setPremise)
  const setArchetype = useRequestStore((s) => s.setArchetype)
  const setGenre = useRequestStore((s) => s.setGenre)
  const setTone = useRequestStore((s) => s.setTone)

  const manifest = useGraphStore((s) => s.manifest)
  const loadArchetypeGraph = useGraphStore((s) => s.loadArchetypeGraph)
  const loadGenreGraph = useGraphStore((s) => s.loadGenreGraph)

  // LLM settings
  const llmBackend = useRequestStore((s) => s.llmBackend)
  const setLlmBackend = useRequestStore((s) => s.setLlmBackend)
  const openaiBaseUrl = useRequestStore((s) => s.openaiBaseUrl)
  const openaiModel = useRequestStore((s) => s.openaiModel)
  const openaiApiKey = useRequestStore((s) => s.openaiApiKey)
  const openaiPlanningModel = useRequestStore((s) => s.openaiPlanningModel)
  const setOpenaiBaseUrl = useRequestStore((s) => s.setOpenaiBaseUrl)
  const setOpenaiModel = useRequestStore((s) => s.setOpenaiModel)
  const setOpenaiApiKey = useRequestStore((s) => s.setOpenaiApiKey)
  const setOpenaiPlanningModel = useRequestStore((s) => s.setOpenaiPlanningModel)
  const bridgeUrl = useRequestStore((s) => s.bridgeUrl)
  const setBridgeUrl = useRequestStore((s) => s.setBridgeUrl)
  const bridgeStatus = useRequestStore((s) => s.bridgeStatus)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const disconnectBridge = useRequestStore((s) => s.disconnectBridge)
  const sendHello = useRequestStore((s) => s.sendHello)
  const helloResponse = useRequestStore((s) => s.helloResponse)
  const helloLoading = useRequestStore((s) => s.helloLoading)


  // Premise lookup
  type LookupMap = Record<string, PremiseEntry>
  const [premiseLookup, setPremiseLookup] = useState<LookupMap | null>(null)
  useEffect(() => {
    loadPremiseLookup().then((map) => {
      setPremiseLookup(map)
      const { archetype: a, genre: g, setPremise: sp, setTone: st } = useRequestStore.getState()
      const entry = lookupPremise(map, a, g)
      if (entry) {
        sp(entry.premise)
        st(entry.tone)
      }
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

  const disabled = running || locked

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Lock toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <button
          onClick={toggleLock}
          title={locked ? 'Unlock Setup' : 'Lock Setup'}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, padding: '2px 8px', borderRadius: 3,
            border: `1px solid ${locked ? '#f59e0b' : 'var(--border)'}`,
            background: locked ? '#f59e0b18' : 'transparent',
            color: locked ? '#f59e0b' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {locked ? '\u{1F512}' : '\u{1F513}'} {locked ? 'Locked' : 'Unlocked'}
        </button>
      </div>
      {/* Archetype + Genre row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <label style={{ flex: 1 }}>
          <span style={LABEL}>Archetype</span>
          <select
            value={archetype}
            onChange={(e) => handleArchetypeChange(e.target.value)}
            disabled={disabled}
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
            disabled={disabled}
            style={INPUT}
          >
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

      {/* Tone */}
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span style={LABEL}>Tone</span>
        <input
          type="text"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          disabled={disabled}
          placeholder="e.g., somber, epic, dark"
          style={INPUT}
        />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
          Sets the emotional register for the story.
        </span>
      </label>

      {/* Contract summary */}
      {contract && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid #f59e0b40',
          background: '#f59e0b08',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
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
            <div><strong>Spine:</strong> {contract.archetype.spine_nodes.join(' → ')}</div>
          </div>
        </div>
      )}

      {/* LLM Connection — inline status + backend selector */}
      <Disclosure title="LLM Connection" persistKey="setup-llm"
        badge={bridgeStatus === 'connected' ? openaiModel : bridgeStatus}>
        <div style={{ padding: '4px 0 10px' }}>
          {/* Backend + Connect in one row */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
            <select value={llmBackend} onChange={(e) => { setLlmBackend(e.target.value as LlmBackend); disconnectBridge() }}
              disabled={disabled} style={{ ...INPUT, flex: 1, marginTop: 0, fontSize: 11 }}>
              <option value="none">None (template only)</option>
              <option value="openai">OpenAI-Compatible</option>
              <option value="bridge">Claude Code Bridge</option>
            </select>
            <button
              onClick={() => void connectBridge()}
              disabled={disabled || bridgeStatus === 'connecting' || bridgeStatus === 'connected'}
              style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4, whiteSpace: 'nowrap',
                border: 'none', cursor: bridgeStatus === 'connected' ? 'default' : 'pointer',
                background: bridgeStatus === 'connected' ? '#22c55e' : bridgeStatus === 'error' ? '#ef4444' : 'var(--accent)',
                color: '#fff', transition: 'all 0.15s',
              }}
            >
              {bridgeStatus === 'connected' ? 'Connected' : bridgeStatus === 'connecting' ? '...' : bridgeStatus === 'error' ? 'Retry' : 'Connect'}
            </button>
            {bridgeStatus === 'connected' && (
              <button onClick={disconnectBridge} style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>×</button>
            )}
          </div>

          {/* Hello test (only when connected) */}
          {bridgeStatus === 'connected' && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <button
                onClick={() => void sendHello()}
                disabled={helloLoading}
                style={{
                  padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 3,
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: 'var(--bg-secondary)', color: 'var(--text)',
                }}
              >
                {helloLoading ? '...' : 'Test'}
              </button>
              {helloResponse && (
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {helloResponse.slice(0, 80)}{helloResponse.length > 80 ? '...' : ''}
                </span>
              )}
            </div>
          )}

          {/* OpenAI-specific fields */}
          {llmBackend === 'openai' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <label style={{ flex: 2 }}>
                  <span style={{ ...LABEL, fontSize: 9 }}>Base URL</span>
                  <input type="text" value={openaiBaseUrl} onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                    disabled={disabled || bridgeStatus === 'connected'} placeholder="http://localhost:11434/v1"
                    style={{ ...INPUT, fontFamily: 'monospace', fontSize: 10 }} />
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ ...LABEL, fontSize: 9 }}>Model</span>
                  <input type="text" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}
                    disabled={disabled || bridgeStatus === 'connected'} placeholder="llama3-8k"
                    style={{ ...INPUT, fontFamily: 'monospace', fontSize: 10 }} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <label style={{ flex: 1 }}>
                  <span style={{ ...LABEL, fontSize: 9 }}>API Key (optional)</span>
                  <input type="password" value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)}
                    disabled={disabled || bridgeStatus === 'connected'} placeholder="leave empty for Ollama"
                    style={{ ...INPUT, fontFamily: 'monospace', fontSize: 10 }} />
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ ...LABEL, fontSize: 9 }}>Planning Model</span>
                  <input type="text" value={openaiPlanningModel} onChange={(e) => setOpenaiPlanningModel(e.target.value)}
                    disabled={disabled || bridgeStatus === 'connected'} placeholder="e.g. deepseek-r1:1.5b"
                    style={{ ...INPUT, fontFamily: 'monospace', fontSize: 10 }} />
                </label>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.3, padding: '2px 4px' }}>
                Ollama tip: set <code>OLLAMA_KEEP_ALIVE=-1</code> and <code>OLLAMA_FLASH_ATTENTION=1</code> before <code>ollama serve</code>
              </div>
            </>
          )}

          {llmBackend === 'bridge' && (
            <label style={{ display: 'block', marginBottom: 6 }}>
              <span style={{ ...LABEL, fontSize: 9 }}>Bridge URL</span>
              <input type="text" value={bridgeUrl} onChange={(e) => setBridgeUrl(e.target.value)}
                disabled={disabled || bridgeStatus === 'connected'} placeholder="ws://127.0.0.1:8765"
                style={{ ...INPUT, fontFamily: 'monospace', fontSize: 10 }} />
            </label>
          )}
        </div>
      </Disclosure>
    </div>
  )
}
