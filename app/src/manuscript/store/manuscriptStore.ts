/**
 * Manuscript Store — manages chapters and scenes for prose editing.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ManuscriptChapter, ManuscriptScene, EditStatus } from '../types.ts'
import type { ChapterManifest, StoryBackbone } from '../../generation/artifacts/types.ts'

export interface ManuscriptStoreState {
  chapters: ManuscriptChapter[]
  selectedChapterId: string | null
  selectedSceneId: string | null
  showDiff: boolean

  selectChapter: (id: string | null) => void
  selectScene: (chapterId: string, sceneId: string) => void
  updateSceneText: (chapterId: string, sceneId: string, text: string) => void
  updateSceneStatus: (chapterId: string, sceneId: string, status: EditStatus) => void
  updateSceneNotes: (chapterId: string, sceneId: string, notes: string) => void
  reorderScene: (chapterId: string, sceneId: string, newIndex: number) => void
  toggleDiff: () => void
  populateFromGeneration: (
    manifest: ChapterManifest,
    sceneDrafts: Map<string, string>,
    backbone?: StoryBackbone | null,
  ) => void
  exportMarkdown: () => string
  clearManuscript: () => void
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function chapterStatus(scenes: ManuscriptScene[]): EditStatus {
  if (scenes.every((s) => s.edit_status === 'final')) return 'final'
  if (scenes.every((s) => s.edit_status !== 'draft')) return 'revised'
  return 'draft'
}

export const useManuscriptStore = create<ManuscriptStoreState>()(persist((set, get) => ({
  chapters: [],
  selectedChapterId: null,
  selectedSceneId: null,
  showDiff: false,

  selectChapter: (id) => set({ selectedChapterId: id, selectedSceneId: null }),
  selectScene: (chapterId, sceneId) => set({ selectedChapterId: chapterId, selectedSceneId: sceneId }),
  toggleDiff: () => set((s) => ({ showDiff: !s.showDiff })),

  updateSceneText: (chapterId, sceneId, text) => {
    set((s) => ({
      chapters: s.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              scenes: ch.scenes.map((sc) =>
                sc.id === sceneId
                  ? { ...sc, revised_text: text, word_count: wordCount(text) }
                  : sc,
              ),
              status: chapterStatus(ch.scenes),
            }
          : ch,
      ),
    }))
  },

  updateSceneStatus: (chapterId, sceneId, status) => {
    set((s) => ({
      chapters: s.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              scenes: ch.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, edit_status: status } : sc,
              ),
              status: chapterStatus(
                ch.scenes.map((sc) => (sc.id === sceneId ? { ...sc, edit_status: status } : sc)),
              ),
            }
          : ch,
      ),
    }))
  },

  updateSceneNotes: (chapterId, sceneId, notes) => {
    set((s) => ({
      chapters: s.chapters.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              scenes: ch.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, notes } : sc,
              ),
            }
          : ch,
      ),
    }))
  },

  reorderScene: (chapterId, sceneId, newIndex) => {
    set((s) => ({
      chapters: s.chapters.map((ch) => {
        if (ch.id !== chapterId) return ch
        const scenes = [...ch.scenes]
        const idx = scenes.findIndex((sc) => sc.id === sceneId)
        if (idx === -1) return ch
        const [scene] = scenes.splice(idx, 1)
        scenes.splice(newIndex, 0, scene)
        return { ...ch, scenes }
      }),
    }))
  },

  populateFromGeneration: (manifest, sceneDrafts, backbone) => {
    // Build scene goal lookup from backbone
    const sceneGoals = new Map<string, string>()
    if (backbone) {
      for (const beat of backbone.beats) {
        for (const scene of beat.scenes) {
          sceneGoals.set(scene.scene_id, scene.scene_goal)
        }
      }
    }

    const chapters: ManuscriptChapter[] = manifest.chapters.map((ch) => ({
      id: ch.chapter_id,
      title: ch.title,
      scenes: ch.scene_ids.map((sceneId) => {
        const text = sceneDrafts.get(sceneId) ?? ''
        return {
          id: sceneId,
          title: sceneGoals.get(sceneId)?.slice(0, 50) ?? sceneId,
          synopsis: sceneGoals.get(sceneId) ?? '',
          draft_text: text,
          edit_status: 'draft' as EditStatus,
          notes: '',
          word_count: wordCount(text),
        }
      }),
      status: 'draft',
    }))

    set({ chapters, selectedChapterId: chapters[0]?.id ?? null, selectedSceneId: null })
  },

  exportMarkdown: () => {
    const { chapters } = get()
    const lines: string[] = []
    for (const ch of chapters) {
      lines.push(`# ${ch.title}`, '')
      for (const sc of ch.scenes) {
        const text = sc.revised_text ?? sc.draft_text
        if (text) {
          lines.push(text, '')
          lines.push('---', '')
        }
      }
    }
    return lines.join('\n')
  },

  clearManuscript: () => set({ chapters: [], selectedChapterId: null, selectedSceneId: null }),
}), {
  name: 'story-manuscript-store',
  partialize: (state) => ({
    chapters: state.chapters,
    selectedChapterId: state.selectedChapterId,
    selectedSceneId: state.selectedSceneId,
    showDiff: state.showDiff,
  }),
}))
