/**
 * GenerateTab — three zones: Actions (top), Output (middle), Debug (bottom).
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { useRequestStore } from '../store/requestStore.ts'
import { useInstanceStore } from '../../instance/store/instanceStore.ts'
import { instanceFromDetailBindings } from '../../instance/store/instanceBridge.ts'
import { exportProject, downloadProject, parseProject } from '../artifacts/storySnapshot.ts'
import { OpenAICompatibleAdapter } from '../agents/openaiCompatibleAdapter.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { STATE_LABELS, LABEL, DEFAULT_CONFIG } from './generationConstants.ts'
import { ENTITY_COLORS, STATUS_COLORS, UI_COLORS } from '../../theme/colors.ts'
import type { StoryRequest, GenerationConfig, StoryProjectRequest } from '../artifacts/types.ts'

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
  const cancelRun = useGenerationStore((s) => s.cancelRun)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const selection = useGenerationStore((s) => s.selection)
  const request = useGenerationStore((s) => s.request)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const backbone = useGenerationStore((s) => s.backbone)
  const chapterManifest = useGenerationStore((s) => s.chapterManifest)
  const promptLog = useGenerationStore((s) => s.promptLog)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)
  const loadSnapshot = useGenerationStore((s) => s.loadSnapshot)
  const assembleChaptersFromState = useGenerationStore((s) => s.assembleChaptersFromState)

  const premise = useRequestStore((s) => s.premise)
  const archetype = useRequestStore((s) => s.archetype)
  const genre = useRequestStore((s) => s.genre)
  const tone = useRequestStore((s) => s.tone)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const loadFromProject = useRequestStore((s) => s.loadFromProject)
  const fastDraft = useRequestStore((s) => s.fastDraft)
  const setFastDraft = useRequestStore((s) => s.setFastDraft)
  const skipValidation = useRequestStore((s) => s.skipValidation)
  const setSkipValidation = useRequestStore((s) => s.setSkipValidation)

  const loadInstance = useInstanceStore((s) => s.loadInstance)
  const [savedInstance, setSavedInstance] = useState(false)
  const [projectName, setProjectName] = useState('')

  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (storyRef.current) storyRef.current.scrollTop = storyRef.current.scrollHeight
  }, [sceneDrafts])

  useEffect(() => {
    if (running) setSavedInstance(false)
  }, [running])

  const buildRequest = useCallback((): StoryRequest => {
    const runId = `RUN_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}_${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
    return {
      schema_version: '1.0.0', run_id: runId, generated_at: new Date().toISOString(),
      source_corpus_hash: '', premise, medium: 'novel', length_target: 'short_story',
      audience: { age_band: 'adult', content_limits: [] },
      requested_genre: genre, requested_archetype: archetype, tone_preference: tone,
      constraints: { must_include: [], must_exclude: [] },
    }
  }, [premise, archetype, genre, tone])

  const handleBuildStructure = useCallback(() => {
    const req = buildRequest()
    const config: GenerationConfig = { ...DEFAULT_CONFIG, max_llm_calls: 0 }
    void startRun(req, config, 'backbone', null)
  }, [buildRequest, startRun])

  const handleGenerateStory = useCallback(async () => {
    const req = buildRequest()
    const reqState = useRequestStore.getState()
    const effectiveSkipValidation = reqState.fastDraft || reqState.skipValidation
    // Fast Draft disables beat expansion; otherwise use defaults with higher LLM budget
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
      skipValidation: effectiveSkipValidation,
      planningLlm: planningAdapter,
    })
  }, [buildRequest, maxLlmCalls, startRun, connectBridge])

  const handleSaveInstance = useCallback(() => {
    if (!detailBindings) return
    const inst = instanceFromDetailBindings(detailBindings, selection ?? null, request ?? null)
    loadInstance(inst)
    setSavedInstance(true)
  }, [detailBindings, selection, request, loadInstance])

  const handleExport = useCallback(() => {
    const genState = useGenerationStore.getState()
    const reqState = useRequestStore.getState()
    const reqData: StoryProjectRequest = {
      premise: reqState.premise, archetype: reqState.archetype, genre: reqState.genre,
      tone: reqState.tone, llmBackend: reqState.llmBackend, bridgeUrl: reqState.bridgeUrl,
      maxLlmCalls: reqState.maxLlmCalls, openaiBaseUrl: reqState.openaiBaseUrl,
      openaiModel: reqState.openaiModel, skipValidation: reqState.skipValidation,
      fastDraft: reqState.fastDraft, openaiPlanningModel: reqState.openaiPlanningModel,
      slotOverrides: reqState.slotOverrides, mode: reqState.mode,
    }
    const name = projectName.trim() || reqState.premise.slice(0, 40) || 'Untitled'
    const project = exportProject(name, reqData, genState)
    downloadProject(project)
  }, [projectName])

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
          const project = parseProject(reader.result as string)
          loadFromProject(project.request)
          loadSnapshot(project.generation)
          setProjectName(project.projectName)
        } catch (err) {
          console.error('Failed to import project:', err)
          alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [loadSnapshot, loadFromProject])

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

  // Gate: Generate Story requires backbone + populated elements
  const hasElements = detailBindings != null && (
    detailBindings.entity_registry.characters.length > 0 ||
    detailBindings.entity_registry.places.length > 0
  )
  const canGenerate = !running && premise.trim() !== '' && !!backbone && hasElements
  const generateBlockReason = !premise.trim()
    ? 'Enter a premise on the Setup tab first'
    : !backbone
      ? 'Build Structure first to create the story backbone'
      : !hasElements
        ? 'Populate elements on the Elements tab (use Randomize or enter manually)'
        : null

  // Scene prose in order
  const sceneEntries = plan
    ? plan.scenes.map((scene) => {
        const beat = plan.beats.find((b) => b.beat_id === scene.beat_id)
        return { beatLabel: beat?.summary ?? scene.beat_id, sceneGoal: scene.scene_goal, prose: sceneDrafts.get(scene.scene_id), sceneId: scene.scene_id }
      })
    : backbone
      ? backbone.beats.flatMap((beat) =>
          beat.scenes.map((scene) => ({ beatLabel: beat.label, sceneGoal: scene.scene_goal, prose: sceneDrafts.get(scene.scene_id), sceneId: scene.scene_id })))
      : []

  let lastProseIdx = -1
  for (let j = sceneEntries.length - 1; j >= 0; j--) {
    if (sceneEntries[j].prose) { lastProseIdx = j; break }
  }

  return (
    <div style={{ padding: '10px 12px' }}>

      {/* ═══════════════════════════════════════════════════════
          ZONE 1 — Actions
          ═══════════════════════════════════════════════════════ */}

      {/* Status + progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 3,
          color: stateInfo.color, background: `${stateInfo.color}18`,
        }}>
          {stateInfo.label}
        </span>
        {running && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>
            Pipeline running...
          </span>
        )}
      </div>

      {/* Progress steps — compact inline */}
      {(contract || backbone || detailBindings || plan || sceneDrafts.size > 0 || chapterManifest) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginBottom: 10, fontSize: 10 }}>
          <ProgressChip label="Contract" done={!!contract} />
          <ProgressChip label="Backbone" done={!!backbone} />
          <ProgressChip label="Details" done={!!detailBindings} />
          <ProgressChip label="Plan" done={!!plan} />
          <ProgressChip label="Drafts" done={sceneDrafts.size > 0} count={sceneDrafts.size > 0 ? sceneDrafts.size : undefined} />
          <ProgressChip label="Chapters" done={!!chapterManifest} count={chapterManifest?.chapters.length} />
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {!backbone && (
          <button onClick={handleBuildStructure} disabled={running || !premise.trim()} style={{
            flex: 1, minWidth: 120, padding: '8px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: '1px solid #8b5cf6', background: running ? 'var(--border)' : '#8b5cf618',
            color: running || !premise.trim() ? 'var(--text-muted)' : ENTITY_COLORS.concept,
            cursor: running || !premise.trim() ? 'not-allowed' : 'pointer',
          }}>
            Build Structure
          </button>
        )}
        <div style={{ flex: 1, minWidth: 120, position: 'relative' }} title={generateBlockReason ?? undefined}>
          <button onClick={handleGenerateStory} disabled={!canGenerate} style={{
            width: '100%', padding: '8px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: 'none', background: canGenerate ? 'var(--accent)' : 'var(--border)',
            color: canGenerate ? '#fff' : 'var(--text-muted)',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
          }}>
            Generate Story
          </button>
          {generateBlockReason && !running && (
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, textAlign: 'center' }}>
              {generateBlockReason}
            </div>
          )}
        </div>
        {running && (
          <button onClick={cancelRun} style={{
            padding: '8px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: `1px solid ${STATUS_COLORS.fail}`, background: `${STATUS_COLORS.fail}18`, color: STATUS_COLORS.fail, cursor: 'pointer',
          }}>
            Stop
          </button>
        )}
      </div>

      {/* Options row — compact */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={fastDraft} onChange={(e) => setFastDraft(e.target.checked)} disabled={running} />
          <span style={{ fontWeight: 600 }} title="Skip beat expansion — one LLM call per scene instead of per-beat-point">Fast Draft</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={fastDraft || skipValidation} onChange={(e) => setSkipValidation(e.target.checked)} disabled={running || fastDraft} />
          Skip validation
        </label>
      </div>

      {/* Secondary actions */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {hasResults && !running && (
          <button onClick={clearRun} style={smallBtn}>Clear</button>
        )}
        {canSaveInstance && (
          <button onClick={handleSaveInstance} disabled={savedInstance} style={{
            ...smallBtn, color: savedInstance ? STATUS_COLORS.pass : 'var(--accent)', border: savedInstance ? `1px solid ${STATUS_COLORS.pass}40` : smallBtn.border,
          }}>
            {savedInstance ? 'Saved' : 'Save Instance'}
          </button>
        )}
        {hasStory && !running && !chapterManifest && (
          <button onClick={() => assembleChaptersFromState()} style={{ ...smallBtn, color: 'var(--accent)' }}>Assemble Chapters</button>
        )}
        {hasStory && !running && (
          <button onClick={handleExportStory} style={{ ...smallBtn, color: STATUS_COLORS.pass }}>Export .md</button>
        )}
        <button onClick={handleImport} disabled={running} style={smallBtn}>Load Project</button>
        {hasResults && (
          <button onClick={handleExport} disabled={running} style={smallBtn}>Save Project</button>
        )}
      </div>

      {/* Project name (only if results exist) */}
      {hasResults && (
        <input
          type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
          placeholder={premise.slice(0, 40) || 'Project name'}
          style={{
            width: '100%', padding: '4px 8px', fontSize: 11, borderRadius: 4, marginBottom: 10,
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', boxSizing: 'border-box',
          }}
        />
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 10px', marginBottom: 10, fontSize: 11, color: STATUS_COLORS.fail,
          background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ZONE 2 — Story Output
          ═══════════════════════════════════════════════════════ */}
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
            marginTop: 4, minHeight: 60, maxHeight: 500, overflowY: 'auto',
            background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: 8,
          }}
        >
          {sceneEntries.some((s) => s.prose) ? (
            sceneEntries.map((entry, idx) => {
              if (!entry.prose) return null
              const isLast = idx === lastProseIdx
              return (
                <div key={entry.sceneId} style={{ marginBottom: 12 }}
                  onMouseEnter={() => onHighlightNodes?.([entry.sceneId])}
                  onMouseLeave={() => onHighlightNodes?.([])}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, color: UI_COLORS.archetype, marginBottom: 3 }}>
                    {entry.beatLabel} — {entry.sceneGoal}
                    {running && isLast && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400, animation: 'pulse 1.5s infinite', marginLeft: 6 }}>
                        writing...
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {entry.prose}
                  </div>
                </div>
              )
            })
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              {!backbone
                ? 'Click "Build Structure" to create the story backbone, then populate elements before generating.'
                : !hasElements
                  ? 'Structure built. Go to the Elements tab to populate characters and places, then return here to generate.'
                  : 'Ready to generate. Click "Generate Story" to write prose.'}
            </p>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          ZONE 3 — Debug (all collapsed by default)
          ═══════════════════════════════════════════════════════ */}
      {events.length > 0 && (
        <Disclosure title="Event Log" persistKey="gen-event-log" defaultCollapsed badge={`${events.length}`}>
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

      {llmTelemetry.length > 0 && (
        <Disclosure title="LLM Telemetry" persistKey="gen-llm-telemetry" defaultCollapsed badge={`${llmTelemetry.length}`}>
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

      {promptLog.length > 0 && (
        <Disclosure title="Prompt Log" persistKey="gen-prompt-log" defaultCollapsed badge={`${promptLog.length}`}>
          <PromptLogContent entries={promptLog} />
        </Disclosure>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const smallBtn: React.CSSProperties = {
  padding: '4px 10px', fontSize: 10, borderRadius: 3,
  border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer',
}

function ProgressChip({ label, done, count }: { label: string; done: boolean; count?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      color: done ? STATUS_COLORS.pass : 'var(--text-muted)', opacity: done ? 1 : 0.5,
    }}>
      <span>{done ? '\u2611' : '\u2610'}</span>
      <span style={{ fontWeight: done ? 600 : 400 }}>{label}</span>
      {count != null && <span style={{ color: 'var(--text-muted)' }}>({count})</span>}
    </span>
  )
}

function PromptLogContent({ entries }: { entries: { callNumber: number; messages: { role: string; content: string }[] }[] }) {
  const [expandedCall, setExpandedCall] = useState<number | null>(null)
  return (
    <div style={{ padding: '4px 8px' }}>
      {entries.map((entry) => (
        <div key={entry.callNumber} style={{ marginBottom: 4 }}>
          <button
            onClick={() => setExpandedCall(expandedCall === entry.callNumber ? null : entry.callNumber)}
            style={{
              width: '100%', textAlign: 'left', padding: '4px 8px', fontSize: 10,
              background: 'var(--bg-primary)', border: '1px solid var(--border)',
              borderRadius: 3, cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'monospace',
            }}
          >
            {expandedCall === entry.callNumber ? '\u25BC' : '\u25B6'} Call #{entry.callNumber} — {entry.messages.length} msgs, {entry.messages.reduce((n, m) => n + m.content.length, 0)} chars
          </button>
          {expandedCall === entry.callNumber && (
            <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 3px 3px', maxHeight: 400, overflowY: 'auto' }}>
              {entry.messages.map((msg, j) => (
                <div key={j} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: msg.role === 'system' ? UI_COLORS.archetype : 'var(--accent)', marginBottom: 2 }}>
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
  )
}
