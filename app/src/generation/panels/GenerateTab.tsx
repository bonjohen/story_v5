/**
 * GenerateTab — two-button generation (Build Structure / Generate Story),
 * progress, event log, story prose output, save/clear.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useInstanceStore } from '../../instance/store/instanceStore.ts'
import { instanceFromDetailBindings } from '../../instance/store/instanceBridge.ts'
import { exportSnapshot, downloadSnapshot, parseSnapshot } from '../artifacts/storySnapshot.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { STATE_LABELS, LABEL, DEFAULT_CONFIG } from './generationConstants.ts'
import type { StoryRequest, GenerationConfig } from '../artifacts/types.ts'

export interface GenerateTabProps {
  onHighlightNodes?: (nodes: string[]) => void
}

function PromptLog({ entries }: { entries: { callNumber: number; messages: { role: string; content: string }[] }[] }) {
  const [expandedCall, setExpandedCall] = useState<number | null>(null)
  return (
    <div style={{ marginTop: 12 }}>
      <span style={LABEL}>Prompts Sent ({entries.length})</span>
      <div style={{ marginTop: 4 }}>
        {entries.map((entry) => (
          <div key={entry.callNumber} style={{ marginBottom: 4 }}>
            <button
              onClick={() => setExpandedCall(expandedCall === entry.callNumber ? null : entry.callNumber)}
              style={{
                width: '100%', textAlign: 'left', padding: '4px 8px', fontSize: 10,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 3, cursor: 'pointer', color: 'var(--text-primary)',
                fontFamily: 'monospace',
              }}
            >
              {expandedCall === entry.callNumber ? '\u25BC' : '\u25B6'} Call #{entry.callNumber} — {entry.messages.length} messages, {entry.messages.reduce((n, m) => n + m.content.length, 0)} chars
            </button>
            {expandedCall === entry.callNumber && (
              <div style={{
                border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 3px 3px', maxHeight: 400, overflowY: 'auto',
              }}>
                {entry.messages.map((msg, j) => (
                  <div key={j} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: msg.role === 'system' ? '#f59e0b' : '#3b82f6', marginBottom: 2 }}>
                      {msg.role}
                    </div>
                    <pre style={{ fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, color: 'var(--text-primary)' }}>
                      {msg.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
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
  const cancelRun = useGenerationStore((s) => s.cancelRun)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const selection = useGenerationStore((s) => s.selection)
  const request = useGenerationStore((s) => s.request)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const backbone = useGenerationStore((s) => s.backbone)
  const promptLog = useGenerationStore((s) => s.promptLog)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)
  const loadSnapshot = useGenerationStore((s) => s.loadSnapshot)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const connectBridge = useRequestStore((s) => s.connectBridge)

  const loadInstance = useInstanceStore((s) => s.loadInstance)
  const [savedInstance, setSavedInstance] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  // Auto-scroll story view when new prose arrives
  useEffect(() => {
    if (storyRef.current) storyRef.current.scrollTop = storyRef.current.scrollHeight
  }, [sceneDrafts])

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

  const handleExportStory = useCallback(() => {
    const entries = plan
      ? plan.scenes.map((scene) => {
          const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
          const roleMatch = beat?.summary.match(/^\[([^\]]+)\]/)
          return { label: roleMatch ? roleMatch[1] : scene.scene_goal, prose: sceneDrafts.get(scene.scene_id) }
        })
      : backbone
        ? backbone.beats.flatMap((beat) =>
            beat.scenes.map((scene) => ({ label: beat.label, prose: sceneDrafts.get(scene.scene_id) })))
        : []
    const parts = entries.filter((e) => e.prose).map((e) => `## ${e.label}\n\n${e.prose}`)
    if (parts.length === 0) return
    const title = request?.premise?.slice(0, 60) || 'Story'
    const md = `# ${title}\n\n${parts.join('\n\n---\n\n')}\n`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${request?.run_id ?? 'story'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [plan, backbone, sceneDrafts, request])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan
  const canSaveInstance = !running && detailBindings != null
  const hasStory = sceneDrafts.size > 0

  // Collect scene prose in order — use plan scenes (S01, S02...) which match sceneDrafts keys
  const sceneEntries = plan
    ? plan.scenes.map((scene) => {
        const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
        return {
          beatLabel: beat?.summary ?? scene.beat_id,
          sceneGoal: scene.scene_goal,
          prose: sceneDrafts.get(scene.scene_id),
          sceneId: scene.scene_id,
        }
      })
    : backbone
      ? backbone.beats.flatMap((beat) =>
          beat.scenes.map((scene) => ({
            beatLabel: beat.label,
            sceneGoal: scene.scene_goal,
            prose: sceneDrafts.get(scene.scene_id),
            sceneId: scene.scene_id,
          }))
        )
      : []

  // Find the last scene that has prose (for "writing..." indicator)
  let lastProseIdx = -1
  for (let j = sceneEntries.length - 1; j >= 0; j--) {
    if (sceneEntries[j].prose) { lastProseIdx = j; break }
  }

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

      {/* Generate Story button */}
      <div style={{ marginBottom: 12 }}>
        <button
          onClick={handleGenerateStory}
          disabled={running || !premise.trim()}
          style={{
            width: '100%',
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
        </button>
      </div>

      {/* Stop button — visible while running */}
      {running && (
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={cancelRun}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid #ef4444',
              background: '#ef444418',
              color: '#ef4444',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Stop Generation
          </button>
        </div>
      )}

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
        {hasStory && !running && (
          <button
            onClick={handleExportStory}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: '1px solid #22c55e',
              background: '#22c55e18',
              color: '#22c55e',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Export Story (.md)
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

      {/* Story prose output — always visible */}
      <div style={{ marginBottom: 12 }}>
        <span style={LABEL}>
          Story
          {sceneEntries.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
              {sceneEntries.filter((s) => s.prose).length}/{sceneEntries.length} scenes
            </span>
          )}
        </span>
        <div
          ref={storyRef}
          style={{
          marginTop: 4,
          minHeight: 60,
          maxHeight: 500,
          overflowY: 'auto',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: 8,
        }}>
          {sceneEntries.some((s) => s.prose) ? (
            sceneEntries.map((entry, idx) => {
              if (!entry.prose) return null
              const isLast = idx === lastProseIdx
              return (
                <div key={entry.sceneId} style={{ marginBottom: 12 }}
                  onMouseEnter={() => onHighlightNodes?.([entry.sceneId])}
                  onMouseLeave={() => onHighlightNodes?.([])}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', marginBottom: 3 }}>
                    {entry.beatLabel} — {entry.sceneGoal}
                    {running && isLast && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, animation: 'pulse 1.5s infinite', marginLeft: 6 }}>
                        writing...
                      </span>
                    )}
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
            })
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              No story yet. Click "Generate Story" to write prose.
            </p>
          )}
        </div>
      </div>

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

      {/* Import / Export */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
        <button
          onClick={handleImport}
          disabled={running}
          style={{
            flex: 1, padding: '6px 10px', fontSize: 11, borderRadius: 4,
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            cursor: running ? 'not-allowed' : 'pointer',
          }}
        >
          Import Snapshot
        </button>
        {hasResults && (
          <button
            onClick={handleExport}
            disabled={running}
            style={{
              flex: 1, padding: '6px 10px', fontSize: 11, borderRadius: 4,
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              cursor: running ? 'not-allowed' : 'pointer',
            }}
          >
            Export Snapshot
          </button>
        )}
      </div>

      {/* LLM Telemetry */}
      {llmTelemetry.length > 0 && (
        <Disclosure title="LLM Telemetry" persistKey="gen-llm-telemetry" defaultCollapsed={true}
          badge={`${llmTelemetry.length} calls`}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              display: 'flex', gap: 12, padding: '4px 8px', marginBottom: 4,
              fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
            }}>
              <span>Total: {llmTelemetry.length}</span>
              <span>OK: {llmTelemetry.filter(t => t.status === 'success').length}</span>
              <span style={{ color: llmTelemetry.some(t => t.status === 'error') ? '#ef4444' : undefined }}>
                Errors: {llmTelemetry.filter(t => t.status === 'error').length}
              </span>
              <span>In: {(llmTelemetry.reduce((s, t) => s + t.inputChars, 0) / 1024).toFixed(1)}KB</span>
              <span>Out: {(llmTelemetry.filter(t => t.outputChars).reduce((s, t) => s + (t.outputChars ?? 0), 0) / 1024).toFixed(1)}KB</span>
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {llmTelemetry.map((t) => (
                <div key={t.callNumber} style={{
                  display: 'flex', gap: 6, alignItems: 'baseline', padding: '2px 8px',
                  fontSize: 10, fontFamily: 'monospace',
                  color: t.status === 'error' ? '#ef4444' : t.status === 'success' ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}>
                  <span style={{ width: 24, flexShrink: 0, textAlign: 'right' }}>#{t.callNumber}</span>
                  <span style={{ width: 55, flexShrink: 0 }}>{t.method === 'completeJson' ? 'json' : t.method === 'completeStream' ? 'stream' : 'text'}</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{(t.inputChars / 1024).toFixed(1)}K in</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{t.outputChars != null ? `${(t.outputChars / 1024).toFixed(1)}K out` : '...'}</span>
                  <span style={{ width: 40, flexShrink: 0 }}>{t.durationMs != null ? `${(t.durationMs / 1000).toFixed(1)}s` : ''}</span>
                  <span style={{ fontWeight: 600, color: t.status === 'error' ? '#ef4444' : t.status === 'success' ? '#22c55e' : '#f59e0b' }}>
                    {t.status === 'error' ? 'FAIL' : t.status === 'success' ? 'OK' : 'WAIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      )}

      {/* Prompt log */}
      {promptLog.length > 0 && <PromptLog entries={promptLog} />}
    </div>
  )
}
