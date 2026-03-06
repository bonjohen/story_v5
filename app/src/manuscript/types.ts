/**
 * Manuscript types — Scrivener-lite layer for organizing and editing prose.
 */

export type EditStatus = 'draft' | 'revised' | 'final'

export interface ManuscriptScene {
  id: string
  title: string
  synopsis: string
  draft_text: string
  revised_text?: string
  edit_status: EditStatus
  notes: string
  word_count: number
}

export interface ManuscriptChapter {
  id: string
  title: string
  scenes: ManuscriptScene[]
  status: EditStatus
}
