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
  StoryPlan,
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
 *
 * The plan parameter bridges the ID mismatch between backbone scene IDs
 * (SCN_*) and plan scene IDs (S01, S02, ...) used as sceneDraft keys.
 * When provided, backbone scene IDs are remapped to plan scene IDs positionally.
 */
export async function assembleChapters(
  backbone: StoryBackbone,
  sceneDrafts: Map<string, string>,
  llm?: LLMAdapter | null,
  plan?: StoryPlan | null,
): Promise<ChapterAssemblerResult> {
  // Build a mapping from backbone scene IDs to sceneDraft keys.
  // If the plan is provided and its scene IDs differ from the backbone's,
  // use a positional mapping (backbone scene order → plan scene order).
  const sceneIdMap = buildSceneIdMap(backbone, sceneDrafts, plan)

  // Remap sceneDrafts so lookups work with backbone scene IDs
  const remappedDrafts = new Map<string, string>()
  for (const [backboneId, draftKey] of sceneIdMap) {
    const draft = sceneDrafts.get(draftKey)
    if (draft) remappedDrafts.set(backboneId, draft)
  }
  // Also include any drafts that already match backbone IDs directly
  for (const [key, val] of sceneDrafts) {
    if (!remappedDrafts.has(key)) remappedDrafts.set(key, val)
  }

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
    const rawText = stitchChapter(entry, remappedDrafts, sceneOrder)
    chapters.set(entry.chapter_id, rawText)
  }

  // Phase 2: Optional editorial pass
  if (llm) {
    for (const entry of chapterEntries) {
      const rawText = chapters.get(entry.chapter_id)
      if (!rawText) {
        throw new Error(`Chapter "${entry.chapter_id}" not found in stitched chapters map`)
      }
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

/**
 * Build a mapping from backbone scene IDs to sceneDraft keys.
 * If sceneDrafts already uses backbone IDs, returns identity mapping.
 * Otherwise, maps positionally: backbone scene N → plan scene N.
 */
function buildSceneIdMap(
  backbone: StoryBackbone,
  sceneDrafts: Map<string, string>,
  plan?: StoryPlan | null,
): Map<string, string> {
  const backboneSceneIds = buildSceneOrder(backbone)
  const map = new Map<string, string>()

  // Check if sceneDrafts already uses backbone scene IDs
  const directMatch = backboneSceneIds.some((id) => sceneDrafts.has(id))
  if (directMatch) {
    for (const id of backboneSceneIds) map.set(id, id)
    return map
  }

  // Use plan scene IDs for positional mapping
  if (plan) {
    const planSceneIds = plan.scenes.map((s) => s.scene_id)
    for (let i = 0; i < backboneSceneIds.length && i < planSceneIds.length; i++) {
      map.set(backboneSceneIds[i], planSceneIds[i])
    }
    return map
  }

  // Fallback: try sequential S01, S02, ... mapping
  for (let i = 0; i < backboneSceneIds.length; i++) {
    const seqId = `S${String(i + 1).padStart(2, '0')}`
    if (sceneDrafts.has(seqId)) {
      map.set(backboneSceneIds[i], seqId)
    }
  }
  return map
}

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
