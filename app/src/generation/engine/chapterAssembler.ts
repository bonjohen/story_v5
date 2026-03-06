/**
 * Chapter Assembler: stitches validated scene drafts into chapter documents
 * with an optional editorial pass for transition smoothing.
 *
 * Two-phase strategy:
 * 1. Deterministic stitch: order scenes by backbone sequence, group by
 *    chapter partition, insert separators and metadata blocks.
 * 2. Optional editorial pass: LLM smooths transitions, ensures voice
 *    consistency, and enforces recap policy.
 *
 * Input:  StoryBackbone (instantiated), scene drafts, optional LLM
 * Output: Chapter markdown strings + ChapterManifest
 */

import type { LLMAdapter } from '../agents/llmAdapter.ts'
import { runEditorialAgent } from '../agents/editorialAgent.ts'
import type {
  StoryBackbone,
  ChapterManifest,
  ChapterEntry,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ChapterAssemblerResult {
  manifest: ChapterManifest
  chapters: Map<string, string>  // chapter_id → markdown content
}

/**
 * Assemble chapter documents from a backbone and scene drafts.
 * If an LLM is provided, runs an editorial pass on each chapter.
 */
export async function assembleChapters(
  backbone: StoryBackbone,
  sceneDrafts: Map<string, string>,
  llm?: LLMAdapter | null,
): Promise<ChapterAssemblerResult> {
  // Build scene ordering from backbone beats
  const sceneOrder = buildSceneOrder(backbone)

  // Build chapter entries from backbone partition
  const chapterEntries: ChapterEntry[] = backbone.chapter_partition.map((cp) => ({
    chapter_id: cp.chapter_id,
    title: cp.title ?? cp.chapter_id,
    scene_ids: getSceneIdsForBeats(cp.beat_ids, backbone),
    tone_goals: cp.tone_goal,
    pace_directive: cp.pace_directive,
    editorial_constraints: {
      recap_policy: 'none' as const,
    },
    file_path: `chapters/${cp.chapter_id.toLowerCase()}.md`,
  }))

  // Phase 1: Deterministic stitch
  const chapters = new Map<string, string>()
  for (const entry of chapterEntries) {
    const rawText = stitchChapter(entry, sceneDrafts, sceneOrder)
    chapters.set(entry.chapter_id, rawText)
  }

  // Phase 2: Optional editorial pass
  if (llm) {
    for (const entry of chapterEntries) {
      const rawText = chapters.get(entry.chapter_id)!
      const polished = await runEditorialAgent(
        llm,
        entry,
        rawText,
        backbone.style_directives,
      )
      chapters.set(entry.chapter_id, polished)
    }
  }

  // Build manifest
  const totalScenes = chapterEntries.reduce((sum, e) => sum + e.scene_ids.length, 0)
  const manifest: ChapterManifest = {
    schema_version: '1.0.0',
    run_id: backbone.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: backbone.source_corpus_hash,
    chapters: chapterEntries,
    total_scene_count: totalScenes,
    total_chapter_count: chapterEntries.length,
  }

  return { manifest, chapters }
}

// ---------------------------------------------------------------------------
// Scene ordering
// ---------------------------------------------------------------------------

function buildSceneOrder(backbone: StoryBackbone): string[] {
  const order: string[] = []
  for (const beat of backbone.beats) {
    for (const scene of beat.scenes) {
      order.push(scene.scene_id)
    }
  }
  return order
}

function getSceneIdsForBeats(
  beatIds: string[],
  backbone: StoryBackbone,
): string[] {
  const sceneIds: string[] = []
  for (const beatId of beatIds) {
    const beat = backbone.beats.find((b) => b.beat_id === beatId)
    if (beat) {
      for (const scene of beat.scenes) {
        sceneIds.push(scene.scene_id)
      }
    }
  }
  return sceneIds
}

// ---------------------------------------------------------------------------
// Chapter stitching
// ---------------------------------------------------------------------------

function stitchChapter(
  entry: ChapterEntry,
  sceneDrafts: Map<string, string>,
  sceneOrder: string[],
): string {
  const parts: string[] = []

  // Chapter header
  parts.push(`# ${entry.title}`)
  parts.push('')

  // Order scenes within this chapter according to backbone order
  const orderedSceneIds = entry.scene_ids.sort(
    (a, b) => sceneOrder.indexOf(a) - sceneOrder.indexOf(b),
  )

  for (let i = 0; i < orderedSceneIds.length; i++) {
    const sceneId = orderedSceneIds[i]
    const draft = sceneDrafts.get(sceneId)

    if (draft) {
      parts.push(draft)
    } else {
      parts.push(`<!-- Scene ${sceneId}: draft not available -->`)
    }

    // Scene separator (except after last scene)
    if (i < orderedSceneIds.length - 1) {
      parts.push('')
      parts.push('---')
      parts.push('')
    }
  }

  // Chapter metadata footer
  parts.push('')
  parts.push(`<!-- [CHAPTER: ${entry.chapter_id}] scenes: ${orderedSceneIds.join(', ')} -->`)

  return parts.join('\n')
}
