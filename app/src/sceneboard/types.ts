/**
 * Scene Board types — Plottr-style card surface backed by the graph engine.
 */

export type SceneStatus = 'draft' | 'reviewed' | 'locked'
export type LaneMode = 'chapter' | 'act' | 'archetype_phase' | 'character' | 'location'

export interface SceneCard {
  scene_id: string
  beat_id: string
  title: string
  synopsis: string
  archetype_node_id?: string
  archetype_label?: string
  archetype_role?: string
  genre_obligations: SceneObligation[]
  characters: string[]
  setting: string
  stakes_delta?: string
  status: SceneStatus
  chapter_id?: string
  chapter_title?: string
  position: number
  notes?: string
}

export interface SceneObligation {
  node_id: string
  label?: string
  severity: 'hard' | 'soft'
  met: boolean
}
