/**
 * StorySetupTab — archetype/genre dropdowns, premise, tone, contract summary.
 * Syncs selections to graph display and premise lookup.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useRequestStore } from '../store/requestStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { useGraphStore } from '../../store/graphStore.ts'
import { loadPremiseLookup, lookupPremise } from '../engine/premiseLookup.ts'
import type { PremiseEntry } from '../engine/premiseLookup.ts'
import { ARCHETYPE_OPTIONS, GENRE_OPTIONS, LABEL, INPUT, nameToDir } from './generationConstants.ts'

export function StorySetupTab() {
  const running = useGenerationStore((s) => s.running)
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

  return (
    <div style={{ padding: '10px 12px' }}>
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

      {/* Tone */}
      <label style={{ display: 'block', marginBottom: 12 }}>
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
    </div>
  )
}
