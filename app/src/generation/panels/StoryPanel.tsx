/**
 * Story Panel — displays generated scene prose as a readable story.
 * Renders all scene drafts in order with scene metadata headers.
 */

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { useGenerationStore } from '../store/generationStore.ts'
import { ReadAloudButton } from './ReadAloudButton.tsx'
import { Disclosure } from '../../components/Disclosure.tsx'

interface StoryPanelProps {
  onHighlightNodes?: (nodeIds: string[]) => void
}

export function StoryPanel({ onHighlightNodes }: StoryPanelProps) {
  const plan = useGenerationStore((s) => s.plan)
  const contract = useGenerationStore((s) => s.contract)
  const sceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const request = useGenerationStore((s) => s.request)
  const selectedSceneId = useGenerationStore((s) => s.selectedSceneId)
  const selectScene = useGenerationStore((s) => s.selectScene)

  const contentRef = useRef<HTMLDivElement>(null)

  // Build ordered scenes with their prose
  const orderedScenes = useMemo(() => {
    if (!plan || sceneDrafts.size === 0) return []
    return plan.scenes
      .filter((s) => sceneDrafts.has(s.scene_id))
      .map((s) => ({
        scene: s,
        beat: plan.beats.find((b) => b.beat_id === s.beat_id),
        content: sceneDrafts.get(s.scene_id) ?? '',
      }))
  }, [plan, sceneDrafts])

  // Auto-scroll to selected scene
  useEffect(() => {
    if (!selectedSceneId || !contentRef.current) return
    const el = contentRef.current.querySelector(`[data-scene-id="${selectedSceneId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedSceneId])

  const handleSceneClick = useCallback((sceneId: string, nodeIds: string[]) => {
    selectScene(sceneId)
    onHighlightNodes?.(nodeIds)
  }, [selectScene, onHighlightNodes])

  if (sceneDrafts.size === 0) {
    return (
      <div style={{ padding: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        No story text generated yet. Run generation in Full Draft mode to produce scene prose.
      </div>
    )
  }

  const title = request?.premise
    ? request.premise.length > 80
      ? request.premise.slice(0, 80) + '...'
      : request.premise
    : 'Untitled Story'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Story header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
          lineHeight: 1.4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          display: 'flex',
          gap: 10,
        }}>
          {contract && (
            <>
              <span>{contract.archetype.name}</span>
              <span>{contract.genre.name}</span>
            </>
          )}
          <span>{orderedScenes.length} scenes</span>
          <span>{Math.round(countWords(sceneDrafts) / 1000)}k words</span>
        </div>
      </div>

      {/* Scene content */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {orderedScenes.map(({ scene, beat, content }) => {
          const isSelected = selectedSceneId === scene.scene_id
          const traceNodes = [
            scene.archetype_trace.node_id,
            ...scene.genre_obligations.map((o) => o.node_id),
          ]
          const wordCount = content.split(/\s+/).filter(Boolean).length

          return (
            <div
              key={scene.scene_id}
              data-scene-id={scene.scene_id}
              onClick={() => handleSceneClick(scene.scene_id, traceNodes)}
              style={{
                cursor: 'pointer',
                background: isSelected ? 'rgba(59,130,246,0.04)' : 'transparent',
                borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Disclosure
                title={`${scene.scene_id}${beat ? ` — ${beat.archetype_node_id}` : ''}`}
                badge={`${wordCount}w`}
                persistKey={`story-scene-${scene.scene_id}`}
              >
                <div style={{ padding: '4px 12px 12px' }}>
                  <div style={{ marginBottom: 6 }} onClick={(e) => e.stopPropagation()}>
                    <ReadAloudButton getText={() => content} />
                  </div>
                  <div style={{
                    fontSize: 12,
                    lineHeight: 1.75,
                    color: 'var(--text-primary)',
                  }}>
                    {renderMarkdown(content)}
                  </div>
                </div>
              </Disclosure>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Count total words across all scene drafts. */
function countWords(drafts: Map<string, string>): number {
  let count = 0
  for (const text of drafts.values()) {
    count += text.split(/\s+/).filter(Boolean).length
  }
  return count
}

/** Simple markdown-to-JSX renderer for scene prose. */
function renderMarkdown(text: string): React.ReactNode[] {
  const blocks = text.split('\n\n').filter((b) => b.trim())
  return blocks.map((block, i) => {
    const trimmed = block.trim()

    // Heading (## ...)
    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={i}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent)',
            margin: '12px 0 6px 0',
            padding: 0,
          }}
        >
          {trimmed.slice(3)}
        </h3>
      )
    }

    if (trimmed.startsWith('# ')) {
      return (
        <h2
          key={i}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '8px 0 6px 0',
            padding: 0,
          }}
        >
          {trimmed.slice(2)}
        </h2>
      )
    }

    // Regular paragraph — render inline formatting
    return (
      <p
        key={i}
        style={{
          margin: '0 0 10px 0',
          textIndent: i > 0 ? '1.5em' : 0,
        }}
      >
        {renderInline(trimmed)}
      </p>
    )
  })
}

/** Render inline markdown (bold, italic). */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Split on **bold** and *italic* patterns
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const m = match[0]
    if (m.startsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 600 }}>
          {m.slice(2, -2)}
        </strong>
      )
    } else {
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic' }}>
          {m.slice(1, -1)}
        </em>
      )
    }
    lastIndex = match.index + m.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}
