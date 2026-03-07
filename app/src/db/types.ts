/**
 * TypeScript interfaces matching SQLite table rows.
 */

export type Status = 'planned' | 'active' | 'draft' | 'generated' | 'reviewed' | 'approved' | 'archived' | 'deprecated' | 'failed'

export interface ProjectRow {
  project_id: string
  project_key: string
  name: string
  description: string | null
  status: Status | null
  default_story_id: string | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface StoryRow {
  story_id: string
  project_id: string
  story_key: string
  title: string
  summary: string | null
  status: Status | null
  archetype_id: string | null
  genre_id: string | null
  pov_mode: string | null
  target_length_words: number | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export type EntityType = 'character' | 'location' | 'faction' | 'item' | 'motif' | 'secret' | 'system' | 'thread' | 'rule'

export interface EntityRow {
  entity_id: string
  story_id: string
  entity_type: EntityType
  name: string
  short_description: string | null
  status: Status | null
  role_label: string | null
  introduced_in_scene_id: string | null
  introduced_in_chapter_id: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface RelationshipRow {
  relationship_id: string
  story_id: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  strength_value: number | null
  status: Status | null
  notes: string | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface ChapterRow {
  chapter_id: string
  story_id: string
  chapter_number: number | null
  title: string | null
  summary: string | null
  status: Status | null
  target_word_count: number | null
  actual_word_count: number | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface SceneRow {
  scene_id: string
  story_id: string
  chapter_id: string | null
  scene_number: number | null
  title: string | null
  summary: string | null
  status: Status | null
  scene_type: string | null
  timeline_order: number | null
  archetype_node_id: string | null
  genre_node_id: string | null
  location_entity_id: string | null
  target_word_count: number | null
  actual_word_count: number | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface SceneEntityRow {
  scene_entity_id: string
  scene_id: string
  entity_id: string
  participation_role: string | null
  created_at: string
  json_data: string | null
}

export interface ArtifactRow {
  artifact_id: string
  story_id: string | null
  chapter_id: string | null
  scene_id: string | null
  artifact_type: string
  name: string
  file_path: string | null
  content_hash: string | null
  format: string | null
  status: Status | null
  generator_name: string | null
  created_at: string
  updated_at: string
  json_data: string | null
}

export interface RunRow {
  run_id: string
  project_id: string | null
  story_id: string | null
  run_type: string
  status: string
  started_at: string
  finished_at: string | null
  tool_name: string | null
  trigger_source: string | null
  notes: string | null
  json_data: string | null
}

export interface TagRow {
  tag_id: string
  project_id: string | null
  tag_name: string
  tag_type: string | null
  description: string | null
  created_at: string
}

export interface TagAssignmentRow {
  tag_assignment_id: string
  tag_id: string
  object_type: string
  object_id: string
  created_at: string
}

export interface VocabularyDomainRow {
  domain_id: string
  name: string
  description: string | null
  source_file: string | null
  created_at: string
}

export interface VocabularyTermRow {
  term_id: string
  domain_id: string
  term_key: string
  label: string
  definition: string | null
  structural_function: string | null
  applies_to: string | null
  sort_order: number | null
  json_data: string | null
  created_at: string
}

export interface TermUsageRow {
  usage_id: string
  term_id: string
  object_type: string
  object_id: string
  usage_role: string | null
  story_id: string | null
  created_at: string
}
