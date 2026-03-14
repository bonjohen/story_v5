/**
 * Manuscript Page — Scrivener-lite layer for editing prose.
 * Three-column layout: chapter tree (left), scene editor (center), metadata (right).
 */

import { useState, useEffect, useMemo } from 'react'
import { useManuscriptStore } from './store/manuscriptStore.ts'
import { useGenerationStore } from '../generation/store/generationStore.ts'
import { ReadAloud } from '../components/ReadAloud.tsx'
import { AppShellBar } from '../components/AppShell.tsx'
import type { EditStatus } from './types.ts'

const STATUS_COLORS: Record<EditStatus, string> = {
  draft: '#f59e0b',
  revised: '#3b82f6',
  final: '#22c55e',
}

export function ManuscriptPage() {
  const chapters = useManuscriptStore((s) => s.chapters)
  const selectedChapterId = useManuscriptStore((s) => s.selectedChapterId)
  const selectedSceneId = useManuscriptStore((s) => s.selectedSceneId)
  const showDiff = useManuscriptStore((s) => s.showDiff)
  const selectChapter = useManuscriptStore((s) => s.selectChapter)
  const selectScene = useManuscriptStore((s) => s.selectScene)
  const updateSceneText = useManuscriptStore((s) => s.updateSceneText)
  const updateSceneStatus = useManuscriptStore((s) => s.updateSceneStatus)
  const updateSceneNotes = useManuscriptStore((s) => s.updateSceneNotes)
  const toggleDiff = useManuscriptStore((s) => s.toggleDiff)
  const populateFromGeneration = useManuscriptStore((s) => s.populateFromGeneration)
  const exportMarkdown = useManuscriptStore((s) => s.exportMarkdown)
  const clearManuscript = useManuscriptStore((s) => s.clearManuscript)

  const chapterManifest = useGenerationStore((s) => s.chapterManifest)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const backbone = useGenerationStore((s) => s.backbone)

  // Auto-populate when no manuscript exists yet and generation data is available
  const [autoPopulated, setAutoPopulated] = useState(false)
  useEffect(() => {
    if (autoPopulated || chapters.length > 0) return
    if (chapterManifest && sceneDrafts.size > 0) {
      populateFromGeneration(chapterManifest, sceneDrafts, backbone)
      setAutoPopulated(true)
    }
  }, [chapterManifest, sceneDrafts, backbone, autoPopulated, chapters.length, populateFromGeneration])

  // Check if generation has newer prose than the manuscript
  const hasGenerationProse = chapterManifest && sceneDrafts.size > 0
  const manuscriptHasNoProse = chapters.length > 0 && chapters.every((ch) =>
    ch.scenes.every((sc) => !sc.draft_text),
  )

  const handleReloadFromGeneration = () => {
    if (chapterManifest && sceneDrafts.size > 0) {
      populateFromGeneration(chapterManifest, sceneDrafts, backbone)
      setAutoPopulated(true)
    }
  }

  // Auto-reload if manuscript has structure but no prose and generation now has prose
  useEffect(() => {
    if (manuscriptHasNoProse && hasGenerationProse) {
      populateFromGeneration(chapterManifest!, sceneDrafts, backbone)
    }
  }, [manuscriptHasNoProse, hasGenerationProse]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedChapter = chapters.find((ch) => ch.id === selectedChapterId)
  const selectedSceneObj = selectedChapter?.scenes.find((sc) => sc.id === selectedSceneId)

  const totalWords = useMemo(() => chapters.reduce((total, ch) =>
    total + ch.scenes.reduce((chTotal, sc) => chTotal + sc.word_count, 0), 0,
  ), [chapters])

  const handleExport = () => {
    const md = exportMarkdown()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manuscript.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-shell" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      <AppShellBar title="Manuscript">
        <ReadAloud text={selectedSceneObj ? (selectedSceneObj.revised_text ?? selectedSceneObj.draft_text) : ''} label="Read aloud" />

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {chapters.length} ch · {totalWords} words
        </span>

        {selectedSceneObj?.draft_text && (
          <button
            onClick={toggleDiff}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 3,
              border: '1px solid', borderColor: showDiff ? '#8b5cf6' : 'var(--border)',
              background: showDiff ? '#8b5cf618' : 'transparent',
              color: showDiff ? '#8b5cf6' : 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            Show Draft
          </button>
        )}

        {hasGenerationProse && (
          <button onClick={handleReloadFromGeneration}
            title="Replace manuscript with latest generated prose"
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 3, border: '1px solid #3b82f6', background: '#3b82f618', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
            Reload from Generation
          </button>
        )}

        <button onClick={handleExport} disabled={chapters.length === 0}
          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Export .md
        </button>

        {chapters.length > 0 && (
          <button onClick={() => { clearManuscript(); setAutoPopulated(false) }}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </AppShellBar>

      {chapters.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No manuscript to display.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Generate chapters from the main page, then navigate here.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chapter tree (left) */}
          <div style={{
            width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
            background: 'var(--bg-surface)', overflowY: 'auto',
          }}>
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Binder
              </span>
            </div>
            {chapters.map((ch) => (
              <div key={ch.id}>
                <div
                  onClick={() => selectChapter(ch.id)}
                  style={{
                    padding: '6px 10px', cursor: 'pointer',
                    background: ch.id === selectedChapterId ? 'var(--accent)08' : 'transparent',
                    borderLeft: ch.id === selectedChapterId ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ch.title}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                      color: STATUS_COLORS[ch.status],
                    }}>
                      {ch.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {ch.scenes.length} scenes · {ch.scenes.reduce((n, s) => n + s.word_count, 0)} words
                  </div>
                </div>
                {ch.id === selectedChapterId && ch.scenes.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => selectScene(ch.id, sc.id)}
                    style={{
                      padding: '4px 10px 4px 22px', cursor: 'pointer',
                      background: sc.id === selectedSceneId ? 'var(--accent)05' : 'transparent',
                      fontSize: 11, color: sc.id === selectedSceneId ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{sc.title.slice(0, 30)}</span>
                      <span style={{ fontSize: 9, color: STATUS_COLORS[sc.edit_status] }}>{sc.word_count}w</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Scene editor (center) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedSceneObj && selectedChapterId ? (
              <>
                <div style={{
                  padding: '8px 16px', borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-surface)', flexShrink: 0,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {selectedSceneObj.title}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['draft', 'revised', 'final'] as EditStatus[]).map((s) => (
                      <button key={s} onClick={() => updateSceneStatus(selectedChapterId, selectedSceneObj.id, s)}
                        style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 3,
                          border: `1px solid ${STATUS_COLORS[s]}`,
                          background: selectedSceneObj.edit_status === s ? `${STATUS_COLORS[s]}20` : 'transparent',
                          color: STATUS_COLORS[s], fontWeight: selectedSceneObj.edit_status === s ? 600 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {showDiff && selectedSceneObj.draft_text ? (
                  <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Draft (read-only) */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b', marginBottom: 6 }}>
                        Generated Draft
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {selectedSceneObj.draft_text}
                      </div>
                    </div>
                    {/* Revised (editable) */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#3b82f6', marginBottom: 6 }}>
                        Revised
                      </div>
                      <textarea
                        style={{
                          width: '100%', height: '100%', fontSize: 13,
                          background: 'transparent', color: 'var(--text-primary)',
                          border: 'none', outline: 'none', lineHeight: 1.7,
                          fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
                        }}
                        value={selectedSceneObj.revised_text ?? selectedSceneObj.draft_text}
                        onChange={(e) => updateSceneText(selectedChapterId, selectedSceneObj.id, e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                    <textarea
                      style={{
                        width: '100%', minHeight: 400, fontSize: 14,
                        background: 'transparent', color: 'var(--text-primary)',
                        border: 'none', outline: 'none', lineHeight: 1.8,
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        resize: 'none', boxSizing: 'border-box',
                      }}
                      value={selectedSceneObj.revised_text ?? selectedSceneObj.draft_text}
                      onChange={(e) => updateSceneText(selectedChapterId!, selectedSceneObj.id, e.target.value)}
                      placeholder="Start writing..."
                    />
                  </div>
                )}
              </>
            ) : selectedChapter ? (
              <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                Select a scene from the binder to edit.
              </div>
            ) : (
              <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                Select a chapter from the binder.
              </div>
            )}
          </div>

          {/* Metadata panel (right) */}
          {selectedSceneObj && selectedChapterId && (
            <div style={{
              width: 240, flexShrink: 0, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', overflowY: 'auto', padding: '12px 14px',
            }}>
              <LabelText label="Synopsis" />
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '4px 0 12px' }}>
                {selectedSceneObj.synopsis || 'No synopsis'}
              </p>

              <LabelText label="Status" />
              <div style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[selectedSceneObj.edit_status], marginTop: 4, marginBottom: 12 }}>
                {selectedSceneObj.edit_status}
              </div>

              <LabelText label="Word Count" />
              <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4, marginBottom: 12 }}>
                {selectedSceneObj.word_count}
              </div>

              <LabelText label="Notes" />
              <textarea
                style={{
                  display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 11,
                  background: 'var(--bg-primary)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box',
                }}
                rows={5}
                placeholder="Scene notes..."
                value={selectedSceneObj.notes}
                onChange={(e) => updateSceneNotes(selectedChapterId!, selectedSceneObj.id, e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LabelText({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      color: 'var(--text-muted)', letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}
