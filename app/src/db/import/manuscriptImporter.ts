/**
 * Manuscript Importer — maps ManuscriptChapter[] into chapter and scene rows.
 */

import type { Database } from 'sql.js'
import type { ManuscriptChapter } from '../../manuscript/types.ts'
import { createChapter } from '../repository/chapterRepo.ts'
import { createScene } from '../repository/sceneRepo.ts'

export function importManuscript(
  db: Database,
  storyId: string,
  chapters: ManuscriptChapter[],
): { chapters: number; scenes: number } {
  let chapterCount = 0
  let sceneCount = 0

  for (let ci = 0; ci < chapters.length; ci++) {
    const ch = chapters[ci]
    const chapterRow = createChapter(db, {
      story_id: storyId,
      chapter_number: ci + 1,
      title: ch.title,
      status: ch.status === 'final' ? 'approved' : ch.status === 'revised' ? 'reviewed' : 'draft',
      actual_word_count: ch.scenes.reduce((n, s) => n + s.word_count, 0),
    })
    chapterCount++

    for (let si = 0; si < ch.scenes.length; si++) {
      const sc = ch.scenes[si]
      createScene(db, {
        story_id: storyId,
        chapter_id: chapterRow.chapter_id,
        scene_number: si + 1,
        title: sc.title,
        summary: sc.synopsis,
        status: sc.edit_status === 'final' ? 'approved' : sc.edit_status === 'revised' ? 'reviewed' : 'draft',
        actual_word_count: sc.word_count,
        json_data: JSON.stringify({
          has_draft: !!sc.draft_text,
          has_revision: !!sc.revised_text,
          notes: sc.notes,
        }),
      })
      sceneCount++
    }
  }

  return { chapters: chapterCount, scenes: sceneCount }
}
