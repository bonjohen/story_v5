/**
 * TypeScript interfaces for Timelines — time-ordered sequences of moments
 * tracking how story elements participate in and are changed by the story's progression.
 * See docs/story_elements_and_timelines.md §5 for the full specification.
 */

import type { CharacterRole, PlaceType, ObjectType } from './elements'

// --- Transition change types (from controlled vocabulary) ---

export type ChangeType =
  | 'learns'
  | 'gains'
  | 'loses'
  | 'transforms'
  | 'arrives'
  | 'departs'
  | 'bonds'
  | 'breaks'
  | 'dies'
  | 'reveals'
  | 'decides'

// --- Timeline types ---

export type TimelineType = 'master' | 'character' | 'subplot' | 'parallel'

// --- Instance-level timeline structures ---

export interface Transition {
  entity_id: string
  change: ChangeType
  target?: string
  detail?: string
  description?: string
}

export interface CharacterState {
  emotional_state: string
  wants: string
  knows: string[]
  has: string[]
  status: 'alive' | 'dead' | 'unknown' | 'transformed'
}

export interface MomentParticipants {
  characters: string[]
  places: string[]
  objects: string[]
}

export interface Moment {
  moment_id: string
  archetype_node: string
  label: string
  description: string
  position: number
  participants: MomentParticipants
  character_states?: Record<string, CharacterState>
  transitions: Transition[]
}

export interface ElementRegistry {
  characters: Array<{ id: string; name: string; role: CharacterRole }>
  places: Array<{ id: string; name: string; type: PlaceType }>
  objects: Array<{ id: string; name: string; type: ObjectType }>
}

export interface Timeline {
  timeline_id: string
  story_id: string
  archetype_id: string
  type: TimelineType
  moments: Moment[]
  element_registry: ElementRegistry
}

// --- Template-level timeline structures ---

export interface TemplateTransition {
  role: CharacterRole | PlaceType | ObjectType
  change: ChangeType | 'establishes_baseline'
  target_role?: CharacterRole | PlaceType | ObjectType
  description?: string
}

export interface TemplateParticipants {
  characters: CharacterRole[]
  places: PlaceType[]
  objects: ObjectType[]
}

export interface TemplateMoment {
  archetype_node: string
  expected_participants: TemplateParticipants
  expected_transitions: TemplateTransition[]
}

export interface TemplateTimeline {
  archetype_id: string
  template_timeline: TemplateMoment[]
}

// --- Combined elements + timeline file (stored in elements.json) ---

export interface ArchetypeElementsWithTimeline {
  archetype_id: string
  element_templates: {
    characters: Array<{
      role: CharacterRole
      label: string
      definition: string
      appears_at_nodes: string[]
      required: boolean
    }>
    places: Array<{
      type: PlaceType
      label: string
      definition: string
      appears_at_nodes: string[]
      required: boolean
    }>
    objects: Array<{
      type: ObjectType
      label: string
      definition: string
      appears_at_nodes: string[]
      required: boolean
    }>
  }
  template_timeline: TemplateMoment[]
}
