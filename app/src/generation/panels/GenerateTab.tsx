/**
 * GenerateTab — chapter-by-chapter generation selection.
 * Shows chapter list from backbone, per-chapter generate buttons,
 * chapter prose output, event log, and project save/load.
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
import { STATUS_COLORS, UI_COLORS } from '../../theme/colors.ts'
import type { GenerationConfig, StoryProjectRequest } from '../artifacts/types.ts'

export interface GenerateTabProps {
  onHighlightNodes?: (nodes: string[]) => void
}

export function GenerateTab({ onHighlightNodes }: GenerateTabProps) {
  const status = useGenerationStore((s) => s.status)
  const running = useGenerationStore((s) => s.chapterRunning)
  const events = useGenerationStore((s) => s.chapterEvents)
  const error = useGenerationStore((s) => s.chapterError)
  const contract = useGenerationStore((s) => s.contract)
  const plan = useGenerationStore((s) => s.plan)
  const startChapterRun = useGenerationStore((s) => s.startChapterRun)
  const clearRun = useGenerationStore((s) => s.clearRun)
  const cancelRun = useGenerationStore((s) => s.cancelChapterRun)
  const detailBindings = useGenerationStore((s) => s.detailBindings)
  const selection = useGenerationStore((s) => s.selection)
  const request = useGenerationStore((s) => s.request)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const backbone = useGenerationStore((s) => s.backbone)
  const chapterManifest = useGenerationStore((s) => s.chapterManifest)
  // chapterProse/rulesOverrides restored from project import via handleImport
  const promptLog = useGenerationStore((s) => s.chapterPromptLog)
  const llmTelemetry = useGenerationStore((s) => s.chapterLlmTelemetry)
  const loadSnapshot = useGenerationStore((s) => s.loadSnapshot)
  const assembleChaptersFromState = useGenerationStore((s) => s.assembleChaptersFromState)

  const premise = useRequestStore((s) => s.premise)
  const workingTitle = useRequestStore((s) => s.workingTitle)
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
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set())

  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (storyRef.current) storyRef.current.scrollTop = storyRef.current.scrollHeight
  }, [sceneDrafts])

  useEffect(() => {
    if (running) setSavedInstance(false)
  }, [running])

  // Derive chapter list from backbone or chapterManifest
  const chapters = chapterManifest?.chapters
    ?? backbone?.chapter_partition.map((cp) => ({
      chapter_id: cp.chapter_id,
      title: cp.title ?? cp.chapter_id,
      scene_ids: backbone.beats
        .filter((b) => cp.beat_ids.includes(b.beat_id))
        .flatMap((b) => b.scenes.map((s) => s.scene_id)),
      tone_goals: cp.tone_goal,
    }))
    ?? []

  // Chapter status: check if all scenes have drafts
  const getChapterStatus = useCallback((sceneIds: string[]): 'done' | 'partial' | 'pending' => {
    if (sceneIds.length === 0) return 'pending'
    const done = sceneIds.filter((id) => sceneDrafts.has(id)).length
    if (done === sceneIds.length) return 'done'
    if (done > 0) return 'partial'
    return 'pending'
  }, [sceneDrafts])

  const handleGenerateChapters = useCallback(async () => {
    const reqState = useRequestStore.getState()
    const effectiveSkipValidation = reqState.fastDraft || reqState.skipValidation
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

    void startChapterRun(config, adapter ?? null, {
      skipValidation: effectiveSkipValidation,
      planningLlm: planningAdapter,
    })
  }, [maxLlmCalls, startChapterRun, connectBridge])

  const toggleChapter = useCallback((chId: string) => {
    setSelectedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(chId)) next.delete(chId)
      else next.add(chId)
      return next
    })
  }, [])

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
      workingTitle: reqState.workingTitle, narrativeVoice: reqState.narrativeVoice,
    }
    const name = projectName.trim() || reqState.workingTitle || reqState.premise.slice(0, 40) || 'Untitled'
    const project = exportProject(name, reqData, genState, {
      rulesOverrides: genState.rulesOverrides,
      chapterProse: genState.chapterProse,
    })
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
          // Restore rules overrides and chapter prose if present
          if (project.rulesOverrides) {
            useGenerationStore.getState().setRulesOverrides(project.rulesOverrides)
          }
          if (project.chapterProse) {
            for (const [id, prose] of Object.entries(project.chapterProse)) {
              useGenerationStore.getState().setChapterProse(id, prose)
            }
          }
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
    const title = workingTitle || request?.premise?.slice(0, 60) || 'Story'
    const md = `# ${title}\n\n${parts.join('\n\n---\n\n')}\n`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${request?.run_id ?? 'story'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [plan, backbone, sceneDrafts, request, workingTitle])

  const stateInfo = STATE_LABELS[status] ?? { label: status, color: 'var(--text-muted)' }
  const hasResults = contract || plan
  const canSaveInstance = !running && detailBindings != null
  const hasStory = sceneDrafts.size > 0

  // Gate: Generate requires backbone + populated elements
  const hasElements = detailBindings != null && (
    detailBindings.entity_registry.characters.length > 0 ||
    detailBindings.entity_registry.places.length > 0
  )
  const canGenerate = !running && premise.trim() !== '' && !!backbone && hasElements

  return (
    <div style={{ padding: '10px 12px' }}>

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

      {/* Working Title display */}
      {workingTitle && (
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          {workingTitle}
        </div>
      )}

      {/* Progress chips */}
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

      {/* ── CHAPTER LIST ─────────────────────────────────────── */}
      {chapters.length > 0 && (
        <Disclosure title={`Chapters (${chapters.length})`} persistKey="gen-chapters">
          <div style={{ padding: '4px 8px' }}>
            {chapters.map((ch) => {
              const sceneIds = 'scene_ids' in ch ? ch.scene_ids : []
              const chStatus = getChapterStatus(sceneIds)
              const statusColor = chStatus === 'done' ? STATUS_COLORS.pass : chStatus === 'partial' ? STATUS_COLORS.warn : 'var(--text-muted)'
              const isSelected = selectedChapters.has(ch.chapter_id)

              return (
                <div key={ch.chapter_id} style={{
                  padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)',
                  borderRadius: 4, borderLeft: `3px solid ${statusColor}`,
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleChapter(ch.chapter_id)}
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {ch.title || ch.chapter_id}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {sceneIds.length} scenes
                        <span style={{ marginLeft: 8, color: statusColor, fontWeight: 600 }}>
                          {chStatus === 'done' ? 'Done' : chStatus === 'partial' ? 'Partial' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Disclosure>
      )}

      {/* Generate buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <button onClick={() => void handleGenerateChapters()} disabled={!canGenerate} style={{
            width: '100%', padding: '8px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
            border: 'none', background: canGenerate ? 'var(--accent)' : 'var(--border)',
            color: canGenerate ? '#fff' : 'var(--text-muted)',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
          }}>
            {selectedChapters.size > 0 ? `Generate Selected (${selectedChapters.size})` : 'Generate All'}
          </button>
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

      {/* Options row */}
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

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 10px', marginBottom: 10, fontSize: 11, color: STATUS_COLORS.fail,
          background: 'rgba(239,68,68,0.08)', borderRadius: 4, border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {error}
        </div>
      )}

      {/* ── CHAPTER PROSE OUTPUT ─────────────────────────────── */}
      {chapters.length > 0 && sceneDrafts.size > 0 && (
        <div style={{ marginBottom: 12 }}>
          <span style={LABEL}>
            Story Output
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
              {sceneDrafts.size} scenes written
            </span>
          </span>
          <div ref={storyRef} style={{
            marginTop: 4, maxHeight: 500, overflowY: 'auto',
            background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4, padding: 8,
          }}>
            {chapters.map((ch) => {
              const sceneIds = 'scene_ids' in ch ? ch.scene_ids : []
              const scenesWithProse = sceneIds.filter((id) => sceneDrafts.has(id))
              if (scenesWithProse.length === 0) return null
              return (
                <Disclosure
                  key={ch.chapter_id}
                  title={ch.title || ch.chapter_id}
                  persistKey={`gen-prose-${ch.chapter_id}`}
                >
                  <div style={{ padding: '4px 8px' }}>
                    {sceneIds.map((sceneId) => {
                      const prose = sceneDrafts.get(sceneId)
                      if (!prose) return null
                      const scene = backbone?.beats.flatMap(b => b.scenes).find(s => s.scene_id === sceneId)
                      return (
                        <div key={sceneId} style={{ marginBottom: 12 }}
                          onMouseEnter={() => onHighlightNodes?.([sceneId])}
                          onMouseLeave={() => onHighlightNodes?.([])}
                        >
                          <div style={{ fontSize: 10, fontWeight: 600, color: UI_COLORS.archetype, marginBottom: 3 }}>
                            {scene?.scene_goal ?? sceneId}
                          </div>
                          <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                            {prose}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Disclosure>
              )
            })}
          </div>
        </div>
      )}

      {/* Fallback when no chapters yet */}
      {chapters.length === 0 && (
        <div style={{
          padding: '8px 10px', marginBottom: 10, fontSize: 11, color: 'var(--text-muted)',
          background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 4,
        }}>
          {!backbone
            ? 'Build Structure on the Setup tab first to see chapters here.'
            : 'No chapters found in the backbone. Generate a story graph first.'}
        </div>
      )}

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

      {/* Project name */}
      {hasResults && (
        <input
          type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
          placeholder={workingTitle || premise.slice(0, 40) || 'Project name'}
          style={{
            width: '100%', padding: '4px 8px', fontSize: 11, borderRadius: 4, marginBottom: 10,
            border: '1px solid var(--border)', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', boxSizing: 'border-box',
          }}
        />
      )}

      {/* ── DEBUG ────────────────────────────────────────────── */}
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
