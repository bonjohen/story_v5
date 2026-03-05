/**
 * TypeScript types for the Chapter Stories (Series) system.
 *
 * A Series is a persistent, ever-growing narrative composed of sequentially
 * produced episodes. Each episode inherits accumulated world state from all
 * prior canon episodes and advances a long-running overarching arc.
 *
 * See docs/chapter_stories_design.md for the full specification.
 */

import type {
  CharacterRole,
  PlaceType,
  ObjectType,
  RelationshipType,
  ArcType,
  FactionType,
  PlaceConnectionType,
  FactionMember,
  FactionRelationship,
} from '../../types/elements.ts'
import type { ChangeType } from '../../types/timeline.ts'
import type { StoryRequest, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Canon Status
// ---------------------------------------------------------------------------

export type CanonStatus = 'draft' | 'canon' | 'alternate'

// ---------------------------------------------------------------------------
// Lore: Character
// ---------------------------------------------------------------------------

export interface LoreRelationship {
  target_id: string
  type: RelationshipType
  description: string
  established_in: string              // episode_id
  evolved_in?: string[]               // episode_ids where relationship changed
  current_state: 'active' | 'broken' | 'severed'
}

export interface CharacterArcMilestone {
  episode_id: string
  change_type: ChangeType
  description: string
}

export interface LoreCharacter {
  // Core identity (mirrors CharacterInstance)
  id: string
  name: string
  aliases?: string[]
  role: CharacterRole
  description?: string
  traits: string[]
  motivations: string[]
  arc_type: ArcType
  relationships: LoreRelationship[]

  // Lifecycle tracking
  status: 'alive' | 'dead' | 'unknown' | 'transformed'
  introduced_in: string              // episode_id
  died_in?: string                   // episode_id (if dead)
  last_appeared_in: string           // episode_id
  current_location?: string          // place_id

  // Knowledge state (accumulated from 'learns' transitions)
  knowledge: string[]

  // Inventory (accumulated from 'gains'/'loses' transitions)
  possessions: string[]              // object_ids currently held

  // Arc progression
  arc_milestones: CharacterArcMilestone[]
}

// ---------------------------------------------------------------------------
// Lore: Place
// ---------------------------------------------------------------------------

export interface LorePlaceConnection {
  target_id: string
  type: PlaceConnectionType
}

export interface LorePlace {
  id: string
  name: string
  aliases?: string[]
  type: PlaceType
  description: string
  rules?: string[]
  atmosphere?: string
  connections?: LorePlaceConnection[]

  // Lifecycle
  introduced_in: string
  last_featured_in: string
  status: 'extant' | 'destroyed' | 'transformed'
  destroyed_in?: string

  // Accumulated lore
  events_here: string[]              // event_ids of things that happened here
}

// ---------------------------------------------------------------------------
// Lore: Object
// ---------------------------------------------------------------------------

export interface ObjectCustodyEntry {
  holder_id: string
  acquired_in: string                // episode_id
  lost_in?: string                   // episode_id
  how: 'gained' | 'stolen' | 'given' | 'found' | 'inherited'
}

export interface LoreObject {
  id: string
  name: string
  aliases?: string[]
  type: ObjectType
  description?: string
  significance: string
  rules?: string[]

  // Custody chain
  current_holder?: string            // character_id or place_id
  custody_history: ObjectCustodyEntry[]

  // Lifecycle
  introduced_in: string
  status: 'intact' | 'destroyed' | 'transformed' | 'lost'
  destroyed_in?: string
}

// ---------------------------------------------------------------------------
// Lore: Faction
// ---------------------------------------------------------------------------

export interface LoreFaction {
  id: string
  name: string
  aliases?: string[]
  type: FactionType
  description: string
  goals: string[]
  members: FactionMember[]
  relationships: FactionRelationship[]

  introduced_in: string
  status: 'active' | 'disbanded' | 'destroyed'
}

// ---------------------------------------------------------------------------
// Plot Threads
// ---------------------------------------------------------------------------

export interface PlotThread {
  id: string
  title: string
  description: string
  status: 'open' | 'progressing' | 'resolved' | 'abandoned'
  urgency: 'low' | 'medium' | 'high' | 'critical'

  // Lifecycle
  introduced_in: string
  progressed_in: string[]
  resolved_in?: string

  // Structural ties
  related_characters: string[]
  related_places?: string[]
  related_objects?: string[]
  overarching_arc_phase?: string

  // Resolution guidance
  resolution_conditions?: string[]
  anti_patterns?: string[]
}

// ---------------------------------------------------------------------------
// Theme and Tone Anchor
// ---------------------------------------------------------------------------

export interface ThemeToneAnchor {
  genre_id: string
  genre_name: string
  secondary_genre_id?: string
  tone_marker: string
  themes: string[]
  mood: string
  content_limits: string[]
  style_notes: string[]
}

// ---------------------------------------------------------------------------
// World Rules
// ---------------------------------------------------------------------------

export interface WorldRule {
  id: string
  rule: string
  established_in: string             // episode_id
  source: 'genre' | 'user' | 'narrative'
}

// ---------------------------------------------------------------------------
// Event Log
// ---------------------------------------------------------------------------

export interface LoreEvent {
  event_id: string
  episode_id: string
  description: string
  participants: string[]
  consequences: string[]
}

// ---------------------------------------------------------------------------
// Story Lore
// ---------------------------------------------------------------------------

export interface StoryLore {
  schema_version: string
  last_updated: string               // ISO 8601
  last_updated_by: string            // episode_id that last changed it

  characters: LoreCharacter[]
  places: LorePlace[]
  objects: LoreObject[]
  factions: LoreFaction[]
  plot_threads: PlotThread[]

  world_rules: WorldRule[]
  event_log: LoreEvent[]
}

// ---------------------------------------------------------------------------
// Overarching Arc
// ---------------------------------------------------------------------------

export interface ArcPhaseEntry {
  node_id: string
  entered_at_episode: string
  exited_at_episode?: string
}

export type ArcAdvancementMode = 'user_directed' | 'auto_milestone' | 'hybrid'

export interface OverarchingArc {
  archetype_id: string
  archetype_name: string
  current_phase: string              // Current archetype node_id
  phase_history: ArcPhaseEntry[]
  remaining_phases: string[]
  advancement_mode: ArcAdvancementMode
}

// ---------------------------------------------------------------------------
// Episode Arc Context
// ---------------------------------------------------------------------------

export interface ThreadPriority {
  thread_id: string
  action: 'advance' | 'resolve' | 'introduce' | 'maintain'
}

export interface EpisodeArcContext {
  overarching_phase: string
  overarching_phase_guidelines: PhaseGuideline
  episodic_archetype_id: string
  arc_advancement_target?: string
  open_plot_threads: PlotThread[]
  thread_priorities: ThreadPriority[]
}

// ---------------------------------------------------------------------------
// Canon Timeline
// ---------------------------------------------------------------------------

export interface CanonTimelineEntry {
  slot: number
  episode_id: string
  title: string
  canonized_at: string               // ISO 8601
  overarching_phase: string
  snapshot_id: string
}

export interface CanonTimeline {
  episodes: CanonTimelineEntry[]
}

// ---------------------------------------------------------------------------
// State Snapshot
// ---------------------------------------------------------------------------

export interface StateSnapshot {
  snapshot_id: string
  after_episode: string              // episode_id this follows
  created_at: string                 // ISO 8601
  lore: StoryLore
  overarching_arc: OverarchingArc
}

// ---------------------------------------------------------------------------
// State Delta
// ---------------------------------------------------------------------------

export interface CharacterUpdate {
  character_id: string
  changes: Partial<LoreCharacter>
  transitions: Array<{
    change: ChangeType
    target?: string
    description: string
  }>
}

export interface PlaceUpdate {
  place_id: string
  changes: Partial<LorePlace>
}

export interface ObjectUpdate {
  object_id: string
  changes: Partial<LoreObject>
}

export interface FactionUpdate {
  faction_id: string
  changes: Partial<LoreFaction>
}

export interface ThreadUpdate {
  thread_id: string
  status_change?: PlotThread['status']
  description?: string
}

export interface ArcPhaseChange {
  from_phase: string
  to_phase: string
}

export interface StateDelta {
  episode_id: string
  extracted_at: string               // ISO 8601

  // Character changes
  characters_introduced: LoreCharacter[]
  character_updates: CharacterUpdate[]

  // Place changes
  places_introduced: LorePlace[]
  place_updates: PlaceUpdate[]

  // Object changes
  objects_introduced: LoreObject[]
  object_updates: ObjectUpdate[]

  // Faction changes
  factions_introduced?: LoreFaction[]
  faction_updates?: FactionUpdate[]

  // Plot thread changes
  threads_introduced: PlotThread[]
  thread_updates: ThreadUpdate[]

  // Overarching arc
  arc_phase_change?: ArcPhaseChange
}

// ---------------------------------------------------------------------------
// Episode Slot
// ---------------------------------------------------------------------------

export interface EpisodeSlot {
  slot_number: number
  target_arc_phase: string
  candidates: string[]               // episode_ids
  canon_episode?: string
  status: 'generating' | 'reviewing' | 'canonized'
}

// ---------------------------------------------------------------------------
// Episode
// ---------------------------------------------------------------------------

export interface EpisodeArtifacts {
  request: string
  selection_result: string
  story_contract: string
  story_plan: string
  scene_drafts: string[]
  validation_results: string
  story_trace: string
  compliance_report: string
}

export interface EpisodeSummary {
  characters_featured: string[]
  plot_threads_advanced: string[]
  key_events: string[]
}

export interface Episode {
  episode_id: string
  series_id: string
  slot_number: number
  candidate_label: string            // "a", "b", "c", etc.

  // Metadata
  title: string
  synopsis: string
  created_at: string
  canonized_at?: string
  edited_at?: string

  // Canon status
  canon_status: CanonStatus

  // Arc context
  overarching_phase: string
  episodic_archetype_id: string
  genre_accent?: string

  // Generated artifacts (file paths)
  artifacts: EpisodeArtifacts

  // State delta
  state_delta?: StateDelta

  // Summary
  summary: EpisodeSummary
}

// ---------------------------------------------------------------------------
// Episode Request (extends StoryRequest)
// ---------------------------------------------------------------------------

export interface EpisodeRequest extends StoryRequest {
  series_id: string
  slot_number: number
  candidate_label: string

  lore_snapshot_id: string
  overarching_phase: string
  arc_advancement_target?: string

  thread_priorities: ThreadPriority[]
  genre_accent?: string
}

// ---------------------------------------------------------------------------
// Episode Index
// ---------------------------------------------------------------------------

export interface EpisodeIndex {
  episodes: Episode[]
}

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

export interface Branch {
  branch_id: string
  name: string
  description: string
  fork_point: string                 // episode_id after which this diverges
  fork_snapshot_id: string
  canon_timeline: CanonTimeline
  lore: StoryLore
}

// ---------------------------------------------------------------------------
// Series (Top-Level Container)
// ---------------------------------------------------------------------------

export interface Series {
  series_id: string
  title: string
  description: string
  created_at: string                 // ISO 8601
  updated_at: string                 // ISO 8601

  // Creative anchor
  theme_tone: ThemeToneAnchor

  // Arcs
  overarching_arc: OverarchingArc

  // Lore
  lore: StoryLore

  // Canon timeline
  canon_timeline: CanonTimeline

  // Episode index
  episode_index: EpisodeIndex

  // Slot management
  slots: EpisodeSlot[]

  // Metadata
  episode_count: number
  total_candidates_generated: number
  corpus_hash: string
}

// ---------------------------------------------------------------------------
// Series Creation Config
// ---------------------------------------------------------------------------

export interface SeriesConfig {
  title: string
  description: string
  genre_id: string
  genre_name: string
  secondary_genre_id?: string
  archetype_id: string
  archetype_name: string
  tone_marker: string
  themes: string[]
  mood: string
  content_limits: string[]
  style_notes: string[]
  advancement_mode: ArcAdvancementMode
  corpus_hash: string
  /** Optional initial lore seed (for manual seeding). */
  initial_lore: Partial<StoryLore>
  /** Archetype spine node IDs in order (for overarching arc). */
  archetype_spine_nodes: string[]
}
