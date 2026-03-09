/**
 * GenerateTab — two-button generation (Build Structure / Generate Story),
 * progress, event log, story prose output, save/clear.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useInstanceStore } from '../../instance/store/instanceStore.ts'
import { instanceFromDetailBindings } from '../../instance/store/instanceBridge.ts'
import { STATE_LABELS, LABEL, DEFAULT_CONFIG } from './generationConstants.ts'
import type { StoryRequest, GenerationConfig } from '../artifacts/types.ts'

export interface GenerateTabProps {
  onHighlightNodes?: (nodes: string[]) => void
}

export function GenerateTab({ onHighlightNodes }: GenerateTabProps) {
  const status = useGenerationStore((s) => s.status)
  const running = useGenerationStore((s) => s.running)
  const events = useGenerationStore((s) => s.events)
  const error = useGenerationStore((s) => s.error)
  const contract = useGenerationStore((s) => s.contract)
  const plan = useGenerationStore((s) => s.plan)
  const startRun = useGenerationStore((s) => s.startRun)
  const clearRun = useGenerationStore((s) => s.clearRun)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const selection = useGenerationStore((s) => s.selection)
  const request = useGenerationStore((s) => s.request)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const backbone = useGenerationStore((s) => s.backbone)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const connectBridge = useRequestStore((s) => s.connectBridge)

  const loadInstance = useInstanceStore((s) => s.loadInstance)
  const [savedInstance, setSavedInstance] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  useEffect(() => {
    if (running) setSavedInstance(false)
  }, [running])

  const buildRequest = useCallback((): StoryRequest => {
    const runId = `RUN_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    return {
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
      constraints: { must_include: [], must_exclude: [] },
    }
  }, [premise, archetype, genre, tone])

  // Build Structure — no LLM, runs contract + backbone + templates
  const handleBuildStructure = useCallback(async () => {
    const req = buildRequest()
    const config: GenerationConfig = { ...DEFAULT_CONFIG, max_llm_calls: 0 }
    void startRun(req, config, 'backbone', null)
  }, [buildRequest, startRun])

  // Generate Story — LLM, runs full pipeline through prose
  const handleGenerateStory = useCallback(async () => {
    const req = buildRequest()
    const config: GenerationConfig = { ...DEFAULT_CONFIG, max_llm_calls: maxLlmCalls }

    // Always try bridge connection
    let adapter = useRequestStore.getState().bridgeAdapter
    if (!adapter) {
      try {
        await connectBridge()
        adapter = useRequestStore.getState().bridgeAdapter
      } catch {
        // fall through — will run without LLM
      }
    }
    void startRun(req, config, 'draft', adapter ?? null)
  }, [buildRequest, maxLlmCalls, startRun, connectBridge])

  const handleSaveInstance = useCallback(() => {
    if (!detailBindings) return
    const inst = instanceFromDetailBindings(detailBindings, selection ?? null, request ?? null)
    loadInstance(inst)
    setSavedInstance(true)
  }, [detailBindings, selection, request, loadInstance])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan
  const canSaveInstance = !running && detailBindings != null

  // Collect scene prose in order
  const sceneEntries = backbone
    ? backbone.beats.flatMap((beat) =>
        beat.scenes.map((scene) => ({
          beatLabel: beat.label,
          sceneGoal: scene.scene_goal,
          prose: sceneDrafts.get(scene.scene_id),
          sceneId: scene.scene_id,
        }))
      )
    : []

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
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
        {running && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
            Pipeline running...
          </span>
        )}
      </div>

      {/* Two-button choice */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={handleBuildStructure}
          disabled={running || !premise.trim()}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 4,
            border: '1px solid #f59e0b',
            background: running ? 'var(--border)' : '#f59e0b18',
            color: running ? 'var(--text-muted)' : '#f59e0b',
            cursor: running || !premise.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Build Structure
          <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
            No LLM needed
          </div>
        </button>
        <button
          onClick={handleGenerateStory}
          disabled={running || !premise.trim()}
          style={{
            flex: 1,
            padding: '10px 12px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 4,
            border: 'none',
            background: running ? 'var(--border)' : 'var(--accent)',
            color: running ? 'var(--text-muted)' : '#fff',
            cursor: running || !premise.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Generate Story
          <div style={{ fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
            Full LLM pipeline
          </div>
        </button>
      </div>

      {/* Clear / Save buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {hasResults && !running && (
          <button
            onClick={clearRun}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Clear Results
          </button>
        )}
        {canSaveInstance && (
          <button
            onClick={handleSaveInstance}
            disabled={savedInstance}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: savedInstance ? '1px solid #22c55e40' : '1px solid var(--accent)',
              background: savedInstance ? '#22c55e18' : 'var(--accent)18',
              color: savedInstance ? '#22c55e' : 'var(--accent)',
              cursor: savedInstance ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {savedInstance ? 'Saved' : 'Save as Instance'}
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

      {/* Story prose output */}
      {sceneEntries.some((s) => s.prose) && (
        <div style={{ marginBottom: 12 }}>
          <span style={LABEL}>Story</span>
          <div style={{
            marginTop: 4,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: 8,
          }}>
            {sceneEntries.map((entry) => {
              if (!entry.prose) return null
              return (
                <div key={entry.sceneId} style={{ marginBottom: 12 }}
                  onMouseEnter={() => onHighlightNodes?.([entry.sceneId])}
                  onMouseLeave={() => onHighlightNodes?.([])}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginBottom: 3 }}>
                    {entry.beatLabel} — {entry.sceneGoal}
                  </div>
                  <div style={{
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {entry.prose}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event log */}
      {events.length > 0 && (
        <div>
          <span style={LABEL}>Event Log</span>
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
  )
}
