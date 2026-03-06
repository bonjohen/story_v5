/**
 * TypeScript types for the agentic story generation pipeline.
 * All artifacts are versioned JSON emitted into a run folder.
 *
 * See docs/story_design.md §5 for full specification.
 */

// ---------------------------------------------------------------------------
// Shared enums and primitives
// ---------------------------------------------------------------------------

/** Check result status used by the validation engine. */
export type CheckStatus = 'pass' | 'warn' | 'fail'

/** Genre constraint severity. */
export type Severity = 'hard' | 'soft'

/** Genre–archetype compatibility classification (from the matrix). */
export type CompatibilityClass = 'naturally compatible' | 'occasionally compatible' | 'rarely compatible'

/** Tone–archetype integration classification. */
export type ToneCompatibility = 'reinforcing' | 'contrasting' | 'neutral'

/** Genre blend stability. */
export type BlendStability = 'stable' | 'conditionally_stable' | 'unstable'

/** Hybrid archetype composition method. */
export type CompositionMethod =
  | 'parallel_track'
  | 'sequential_override'
  | 'nested'
  | 'alternating_dominance'

/** Hybrid archetype frequency tier. */
export type HybridFrequency = 'very_common' | 'common' | 'occasional'

/** Pipeline generation mode. */
export type GenerationMode = 'draft' | 'outline' | 'contract-only' | 'backbone' | 'detailed-outline' | 'chapters'

/** Orchestrator states. */
export type OrchestratorState =
  | 'IDLE'
  | 'LOADED_CORPUS'
  | 'SELECTED'
  | 'CONTRACT_READY'
  | 'TEMPLATES_COMPILED'
  | 'BACKBONE_ASSEMBLED'
  | 'DETAILS_BOUND'
  | 'PLANNED'
  | 'GENERATING_SCENE'
  | 'VALIDATING_SCENE'
  | 'REPAIRING_SCENE'
  | 'CHAPTERS_ASSEMBLED'
  | 'COMPLETED'
  | 'FAILED'

// ---------------------------------------------------------------------------
// Run metadata (common header for every artifact)
// ---------------------------------------------------------------------------

export interface RunMetadata {
  schema_version: string
  run_id: string
  generated_at: string          // ISO 8601 timestamp
  source_corpus_hash: string
}

// ---------------------------------------------------------------------------
// 5.2 — Story Request
// ---------------------------------------------------------------------------

export interface AudienceSpec {
  age_band: string
  content_limits: string[]
}

export interface RequestConstraints {
  must_include: string[]
  must_exclude: string[]
  allow_genre_blend: boolean
  allow_hybrid_archetype: boolean
  preferred_blend_genre?: string
  preferred_hybrid_archetype?: string
}

export interface StoryRequest extends RunMetadata {
  premise: string
  medium: string
  length_target: string
  audience: AudienceSpec
  requested_genre: string
  requested_archetype: string
  tone_preference: string
  constraints: RequestConstraints
}

// ---------------------------------------------------------------------------
// 5.3 — Selection Result
// ---------------------------------------------------------------------------

export interface GenreBlendSelection {
  enabled: boolean
  secondary_genre?: string
  pattern_id?: string
  stability?: BlendStability
  dominance?: string
  rationale?: string[]
}

export interface HybridArchetypeSelection {
  enabled: boolean
  secondary_archetype?: string
  pattern_id?: string
  frequency?: HybridFrequency
  shared_roles?: string[]
  divergence_point?: { role: string; description: string }
  composition_method?: CompositionMethod
}

export interface CompatibilityInfo {
  matrix_classification: CompatibilityClass
  rationale: string[]
}

export interface ToneMarkerSelection {
  selected: string
  genre_tone_node_id: string
  integration_classification: ToneCompatibility
}

export interface SelectionResult extends RunMetadata {
  primary_archetype: string
  primary_genre: string
  genre_blend: GenreBlendSelection
  hybrid_archetype: HybridArchetypeSelection
  compatibility: CompatibilityInfo
  tone_marker: ToneMarkerSelection
}

// ---------------------------------------------------------------------------
// 5.4 — Story Contract
// ---------------------------------------------------------------------------

export interface ContractArchetype {
  id_prefix: string
  name: string
  archetype_id: string          // e.g. "01_heros_journey"
  spine_nodes: string[]         // node IDs along the main spine
  required_roles: string[]
  allowed_variants: string[]    // variant node IDs (N50–N79)
  required_edges: string[]
}

export interface ContractGenre {
  id_prefix: string
  name: string
  genre_id: string              // e.g. "06_science_fiction"
  levels: Record<string, string[]>   // "1"–"5" → node IDs
  tone_marker: string[]         // tone marker node IDs
  anti_patterns: string[]       // anti-pattern node IDs
  hard_constraints: string[]    // node IDs with severity "hard"
  soft_constraints: string[]    // node IDs with severity "soft"
}

export interface GlobalBoundaries {
  musts: string[]
  must_nots: string[]
  content_limits: string[]
  style_limits: string[]
}

export interface PhaseGuideline {
  node_id: string
  role: string
  definition: string
  entry_conditions: string[]
  exit_conditions: string[]
  failure_modes: string[]
  signals_in_text: string[]
  genre_obligation_links: string[]
}

export interface ValidationPolicy {
  hard_constraints_required: boolean
  anti_patterns_blocking: boolean
  tone_global: boolean
  entry_exit_required: boolean
  signals_required: 'hard' | 'soft' | 'off'
}

/** Element template requirement extracted from archetype elements.json. */
export interface ContractElementRequirement {
  category: 'character' | 'place' | 'object'
  role_or_type: string       // e.g., "protagonist", "ordinary_world", "weapon"
  label: string              // e.g., "The Hero", "The Ordinary World"
  definition: string
  required: boolean
  appears_at_nodes: string[]
}

/** Genre element constraint imported into the contract. */
export interface ContractElementConstraint {
  category: 'character' | 'place' | 'object' | 'relationship'
  role_or_type: string
  severity: 'required' | 'recommended' | 'optional'
  description: string
}

/** Genre element rule imported into the contract. */
export interface ContractElementRule {
  rule_id: string
  description: string
  severity: 'required' | 'recommended' | 'optional'
  applies_to: string
  testable_condition: string
}

/** A lore character reference for the contract (existing character the episode must respect). */
export interface ContractLoreCharacter {
  id: string
  name: string
  role: string
  status: 'alive' | 'dead' | 'unknown' | 'transformed'
  current_location?: string
  /** Whether this character must appear in this episode. */
  must_appear: boolean
  /** Whether this character must NOT appear (e.g., dead). */
  must_not_appear: boolean
}

/** A world rule that the episode must not contradict. */
export interface ContractWorldRule {
  id: string
  rule: string
  source: 'genre' | 'user' | 'narrative'
}

/** A plot thread obligation for the episode. */
export interface ContractThreadObligation {
  thread_id: string
  title: string
  action: 'advance' | 'resolve' | 'introduce' | 'maintain'
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

/** Overarching arc phase context for the episode contract. */
export interface ContractArcPhaseContext {
  current_phase_node_id: string
  current_phase_role: string
  current_phase_definition: string
  entry_conditions: string[]
  exit_conditions: string[]
  advancement_target?: string
}

/** Lore-derived constraints that constrain episode generation. */
export interface ContractLoreConstraints {
  /** Characters from the lore that must appear or must not appear. */
  characters: ContractLoreCharacter[]
  /** World rules that cannot be contradicted. */
  world_rules: ContractWorldRule[]
  /** Plot thread obligations for this episode. */
  thread_obligations: ContractThreadObligation[]
  /** Overarching arc phase context. */
  arc_phase?: ContractArcPhaseContext
  /** Locked facts (continuity boundaries). */
  continuity_locks: string[]
}

export interface StoryContract extends RunMetadata {
  archetype: ContractArchetype
  genre: ContractGenre
  global_boundaries: GlobalBoundaries
  phase_guidelines: PhaseGuideline[]
  validation_policy: ValidationPolicy
  /** Element role requirements from archetype elements.json template. */
  element_requirements?: ContractElementRequirement[]
  /** Element constraints from genre element_constraints.json (when present). */
  element_constraints?: ContractElementConstraint[]
  /** Element rules from genre element_constraints.json (when present). */
  element_rules?: ContractElementRule[]
  /** Lore-derived constraints for series-mode episodes. */
  lore_constraints?: ContractLoreConstraints
}

// ---------------------------------------------------------------------------
// 5.5 — Story Plan
// ---------------------------------------------------------------------------

export interface EmotionalScores {
  tension: number
  hope: number
  fear: number
  resolution: number
}

export interface BeatHybridInfo {
  secondary_archetype_id: string
  shared: boolean                    // true if this beat's role exists in both archetypes
  divergence_beat: boolean           // true if this is where the arcs split
  composition_method: CompositionMethod
}

export interface Beat {
  beat_id: string
  archetype_node_id: string
  summary: string
  required_exit_conditions: string[]
  target_emotional_scores: EmotionalScores
  hybrid_info?: BeatHybridInfo
}

export interface SceneArchetypeTrace {
  node_id: string
  edge_in: string | null
  edge_out: string | null
}

export interface SceneGenreObligation {
  node_id: string
  severity: Severity
}

export interface SceneConstraintsChecklist {
  hard: string[]
  soft: string[]
  must_not: string[]
}

/** Named element assigned to a scene. */
export interface SceneElement {
  id: string
  name: string
  role_or_type: string       // matches a ContractElementRequirement
}

/** A timeline moment generated for a scene during planning. */
export interface PlanMoment {
  moment_id: string
  archetype_node: string
  participants: {
    characters: string[]     // element roster IDs
    places: string[]
    objects: string[]
  }
  expected_transitions: Array<{
    entity_id: string
    change: string           // ChangeType
    target?: string
    description?: string
  }>
}

export interface Scene {
  scene_id: string
  beat_id: string
  setting: string
  characters: string[]
  scene_goal: string
  archetype_trace: SceneArchetypeTrace
  genre_obligations: SceneGenreObligation[]
  constraints_checklist: SceneConstraintsChecklist
  /** Named elements participating in this scene (populated by planner). */
  scene_elements?: SceneElement[]
  /** Objects present in this scene. */
  objects?: string[]
  /** Timeline moment for this scene (populated by planner). */
  moment?: PlanMoment
}

export interface CoverageTargets {
  hard_constraints_min_coverage: number   // 1.0 for full coverage
  soft_constraints_min_coverage: number   // e.g. 0.6
}

/** A named element in the story's element roster. */
export interface RosterEntry {
  id: string
  name: string
  category: 'character' | 'place' | 'object'
  role_or_type: string       // e.g., "protagonist", "ordinary_world", "weapon"
  description?: string
  traits?: string[]
  motivations?: string[]
}

/** Element roster — the named cast, locations, and objects for a story. */
export interface ElementRoster {
  characters: RosterEntry[]
  places: RosterEntry[]
  objects: RosterEntry[]
}

export interface StoryPlan extends RunMetadata {
  beats: Beat[]
  scenes: Scene[]
  coverage_targets: CoverageTargets
  /** Named element roster for the story (populated by planner). */
  element_roster?: ElementRoster
}

// ---------------------------------------------------------------------------
// 5.7 — Validation Results
// ---------------------------------------------------------------------------

export type ValidationCheckType =
  | 'hard_constraints'
  | 'anti_patterns'
  | 'tone'
  | 'entry_exit'
  | 'signals_in_text'
  | 'element_continuity'
  | 'element_mortality'
  | 'element_custody'
  | 'element_relationships'

export interface ValidationCheck {
  type: ValidationCheckType
  status: CheckStatus
  details: string[]
}

export interface SceneValidation {
  scene_id: string
  status: CheckStatus
  checks: ValidationCheck[]
}

export interface GlobalValidation {
  hard_constraints_coverage: number
  soft_constraints_coverage: number
  anti_pattern_violations: number
  tone_warnings: number
}

export interface ValidationResults extends RunMetadata {
  scenes: SceneValidation[]
  global: GlobalValidation
}

// ---------------------------------------------------------------------------
// 5.8 — Story Trace
// ---------------------------------------------------------------------------

export interface SceneTraceArchetype {
  node_id: string
  edges: string[]
}

export interface SceneTraceGenre {
  satisfied_constraints: string[]
  tone_marker: string
}

export interface SceneTraceEntry {
  scene_id: string
  archetype: SceneTraceArchetype
  genre: SceneTraceGenre
  notes: string[]
}

export interface StoryTrace extends RunMetadata {
  scene_trace: SceneTraceEntry[]
}

// ---------------------------------------------------------------------------
// Generation Config (generation_config.json)
// ---------------------------------------------------------------------------

export interface SignalsPolicy {
  mode: 'warn' | 'block' | 'off'
  min_fraction: number            // e.g. 0.5
}

export interface TonePolicy {
  mode: 'warn' | 'block'
}

export interface RepairPolicy {
  max_attempts_per_scene: number  // e.g. 2
  full_rewrite_threshold: number  // blocking errors before full rewrite
}

export interface CompositionDefaults {
  allow_blend: boolean
  allow_hybrid: boolean
}

export interface GenerationConfig {
  signals_policy: SignalsPolicy
  tone_policy: TonePolicy
  repair_policy: RepairPolicy
  coverage_targets: CoverageTargets
  composition_defaults: CompositionDefaults
}

// ---------------------------------------------------------------------------
// Corpus Types (for the loaded cross-reference data)
// ---------------------------------------------------------------------------

/** A single genre entry from genre_archetype_matrix.json */
export interface MatrixGenreEntry {
  genre: string
  genre_id: number
  naturally_compatible: Array<{ archetype: string; rationale: string }>
  occasionally_compatible: Array<{ archetype: string; rationale: string }>
  rarely_compatible: Array<{ archetype: string; rationale: string }>
}

export interface GenreArchetypeMatrix {
  title: string
  description: string
  archetypes_reference: string[]
  genres: MatrixGenreEntry[]
}

/** A single integration entry from tone_archetype_integration.json */
export interface ToneArchetypeInteraction {
  archetype: string
  compatibility: ToneCompatibility
  note: string
}

export interface ToneIntegrationEntry {
  genre: string
  genre_id: string
  tone_marker: string
  tone_description: string
  archetype_interactions: ToneArchetypeInteraction[]
}

export interface ToneArchetypeIntegration {
  title: string
  description: string
  integrations: ToneIntegrationEntry[]
}

/** Emotional arc profile from archetype_emotional_arcs.json */
export interface ArcPoint {
  node_id: string
  position: number
  tension: number
  hope: number
  fear: number
  resolution: number
}

export interface VariantArcPoint {
  node_id: string
  branches_from: string
  tension: number
  hope: number
  fear: number
  resolution: number
}

export interface EmotionalArcProfile {
  archetype: string
  archetype_id: string
  arc_profile: ArcPoint[]
  variant_profiles: VariantArcPoint[]
  arc_shape: string
  dominant_emotion: string
  emotional_range: number
  summary: string
}

export interface ArchetypeEmotionalArcs {
  title: string
  description: string
  archetypes: EmotionalArcProfile[]
}

/** Hybrid pattern from hybrid_archetype_patterns.json */
export interface HybridPattern {
  hybrid_id: string
  archetypes: [string, string]
  frequency: HybridFrequency
  shared_roles: string[]
  divergence_point: { role: string; description: string }
  composition_method: CompositionMethod
  composition_description: string
  example_works: Array<{ title: string; creator: string; note: string }>
  structural_tensions: string[]
}

export interface HybridArchetypePatterns {
  title: string
  description: string
  hybrids: HybridPattern[]
}

/** Genre blend from genre_blending_model.json */
export interface BlendConflict {
  genre1: string
  genre2: string
  resolution: string
}

export interface BlendPattern {
  blend_id: string
  genres: [string, string]
  stability: BlendStability
  dominant_genre: string
  compatible_constraints: string[]
  conflicting_constraints: BlendConflict[]
  tone_synthesis: string
  resolution_strategy: string
  example_works: Array<{ title: string; note: string }>
}

export interface GenreBlendingModel {
  title: string
  description: string
  blends: BlendPattern[]
}

/** Vocabulary entry types */
export interface NodeRoleEntry {
  role: string
  definition: string
  structural_function: string
  examples_across_archetypes?: string
  examples_across_genres?: string
  level?: number | null
}

export interface EdgeMeaningEntry {
  label: string
  definition: string
  typical_context: string
}

export interface VocabularyFile {
  title: string
  description: string
  node_roles?: NodeRoleEntry[]
  edge_meanings?: EdgeMeaningEntry[]
}

// ---------------------------------------------------------------------------
// Feature Pack (modular style/voice/pacing instruction pack)
// ---------------------------------------------------------------------------

export interface FeaturePackLexicon {
  preferred_terms?: Record<string, string>
  banned_terms?: string[]
  register: string
  notes?: string
}

export interface FeaturePack {
  id: string
  name: string
  type: 'voice' | 'pacing' | 'motif'
  description: string
  prompt_fragments: string[]
  lexicon_preferences: FeaturePackLexicon
  validation_heuristics?: string[]
}

// ---------------------------------------------------------------------------
// Template Pack (backbone synthesis stage 1)
// ---------------------------------------------------------------------------

export interface ArchetypeNodeTemplate {
  node_id: string
  role: string
  label: string
  beat_summary_template: string
  scene_obligations: string[]
  required_elements: string[]
  signals_to_include: string[]
  failure_modes_to_avoid: string[]
  entry_conditions?: string[]
  exit_conditions?: string[]
}

export interface GenreLevelTemplate {
  node_id: string
  level: number | null
  label: string
  severity: Severity
  node_type?: 'spine' | 'tone_marker' | 'anti_pattern'
  constraint_template: string
  binding_rules: string[]
  anti_patterns_to_block?: string[]
}

export interface ToneGuidance {
  tone_marker_id: string
  tone_description: string
  directives: string[]
}

export interface AntiPatternGuidance {
  node_id: string
  label: string
  description: string
}

export interface TemplatePack extends RunMetadata {
  archetype_id: string
  genre_id: string
  archetype_node_templates: Record<string, ArchetypeNodeTemplate>
  genre_level_templates: Record<string, GenreLevelTemplate>
  tone_guidance?: ToneGuidance
  anti_pattern_guidance?: AntiPatternGuidance[]
}

// ---------------------------------------------------------------------------
// Story Backbone (backbone synthesis stage 2)
// ---------------------------------------------------------------------------

export interface BackboneSlot {
  slot_name: string
  category: 'character' | 'place' | 'object' | 'concept'
  required: boolean
  description?: string
  bound_value?: string
}

export type SlotMap = Record<string, BackboneSlot>

export interface BackboneMomentStub {
  archetype_node: string
  participant_roles: string[]
  expected_transitions: string[]
}

export interface BackboneSceneObligation {
  node_id: string
  severity: Severity
  label?: string
}

export interface BackboneScene {
  scene_id: string
  scene_goal: string
  genre_obligations: BackboneSceneObligation[]
  moment_stub?: BackboneMomentStub
  slots: SlotMap
  style_overrides?: Record<string, string>
}

export interface BackboneBeat {
  beat_id: string
  archetype_node_id: string
  label: string
  role?: string
  definition?: string
  scenes: BackboneScene[]
}

export interface ChapterPartitionEntry {
  chapter_id: string
  title?: string
  beat_ids: string[]
  tone_goal?: string
  pace_directive?: string
}

export interface LexiconDirectives {
  canonical_terms?: Record<string, string>
  prohibited_synonyms?: string[]
  naming_rules?: string[]
}

export interface StyleDirectives {
  global_voice?: string
  global_pacing?: string
  feature_pack_ids?: string[]
  lexicon?: LexiconDirectives
}

export interface CoveragePlan {
  hard_constraints_assigned: number
  hard_constraints_total: number
  soft_constraints_assigned: number
  soft_constraints_total: number
}

export interface StoryBackbone extends RunMetadata {
  archetype_id: string
  genre_id: string
  beats: BackboneBeat[]
  chapter_partition: ChapterPartitionEntry[]
  style_directives: StyleDirectives
  coverage_plan?: CoveragePlan
}

// ---------------------------------------------------------------------------
// Story Detail Bindings (backbone synthesis stage 3)
// ---------------------------------------------------------------------------

export interface DetailCharacter {
  id: string
  name: string
  role: string
  archetype_function?: string
  traits?: string[]
  motivations?: string[]
  flaw?: string
  backstory?: string
  arc_direction?: string
  relationships?: string[]
  distinguishing_feature?: string
}

export interface DetailPlace {
  id: string
  name: string
  type: string
  features?: string[]
  atmosphere?: string
}

export interface DetailObject {
  id: string
  name: string
  type: string
  significance?: string
  properties?: string[]
}

export interface EntityRegistry {
  characters: DetailCharacter[]
  places: DetailPlace[]
  objects: DetailObject[]
}

export interface SlotBinding {
  slot_name: string
  bound_entity_id: string
  bound_value?: string
  rationale?: string
}

export interface OpenMystery {
  id: string
  description: string
  planted_at_beat?: string
  resolved_at_beat?: string
}

export interface NarrativePromise {
  id: string
  description: string
  made_at_beat?: string
}

export interface NarrativePayoff {
  id: string
  promise_id: string
  description: string
  delivered_at_beat?: string
}

export interface UnresolvedTodo {
  slot_name: string
  reason: string
  suggested_resolution?: string
}

export interface StoryDetailBindings extends RunMetadata {
  entity_registry: EntityRegistry
  slot_bindings: Record<string, SlotBinding>
  open_mysteries?: OpenMystery[]
  promises?: NarrativePromise[]
  payoffs?: NarrativePayoff[]
  unresolved_todos?: UnresolvedTodo[]
}

// ---------------------------------------------------------------------------
// Chapter Manifest (backbone synthesis stage 4)
// ---------------------------------------------------------------------------

export interface EditorialConstraints {
  voice_consistency?: string
  recap_policy?: 'none' | 'light' | 'explicit'
  transition_style?: string
  max_word_count?: number
  min_word_count?: number
}

export interface ChapterEntry {
  chapter_id: string
  title: string
  scene_ids: string[]
  tone_goals?: string
  pace_directive?: string
  editorial_constraints?: EditorialConstraints
  file_path?: string
}

export interface ChapterManifest extends RunMetadata {
  chapters: ChapterEntry[]
  total_scene_count?: number
  total_chapter_count?: number
}

// ---------------------------------------------------------------------------
// Loaded Corpus (aggregate type for the full corpus in memory)
// ---------------------------------------------------------------------------

import type { StoryGraph, DataManifest } from '../../types/graph.ts'
import type { ArchetypeElements } from '../../types/elements.ts'
import type { GenreElementConstraints } from '../../types/element-constraints.ts'

export interface LoadedCorpus {
  /** All 42 graphs, keyed by their directory path (e.g. "01_heros_journey") */
  archetypeGraphs: Map<string, StoryGraph>
  genreGraphs: Map<string, StoryGraph>

  /** Variant graphs where available, keyed by archetype directory */
  variantGraphs: Map<string, StoryGraph>

  /** Cross-reference datasets */
  matrix: GenreArchetypeMatrix
  toneIntegration: ToneArchetypeIntegration
  emotionalArcs: ArchetypeEmotionalArcs
  hybridPatterns: HybridArchetypePatterns
  blendingModel: GenreBlendingModel

  /** Controlled vocabularies */
  archetypeNodeRoles: VocabularyFile
  archetypeEdgeMeanings: VocabularyFile
  genreNodeRoles: VocabularyFile
  genreEdgeMeanings: VocabularyFile

  /** Data manifest */
  manifest: DataManifest

  /** Stable hash of corpus content for reproducibility */
  corpusHash: string

  /** Archetype element templates, keyed by archetype directory */
  archetypeElements: Map<string, ArchetypeElements>

  /** Genre element constraints, keyed by genre directory (only for genres that have them) */
  genreElementConstraints: Map<string, GenreElementConstraints>
}
