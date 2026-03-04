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
export type GenerationMode = 'draft' | 'outline' | 'contract-only'

/** Orchestrator states. */
export type OrchestratorState =
  | 'IDLE'
  | 'LOADED_CORPUS'
  | 'SELECTED'
  | 'CONTRACT_READY'
  | 'PLANNED'
  | 'GENERATING_SCENE'
  | 'VALIDATING_SCENE'
  | 'REPAIRING_SCENE'
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

export interface StoryContract extends RunMetadata {
  archetype: ContractArchetype
  genre: ContractGenre
  global_boundaries: GlobalBoundaries
  phase_guidelines: PhaseGuideline[]
  validation_policy: ValidationPolicy
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

export interface Beat {
  beat_id: string
  archetype_node_id: string
  summary: string
  required_exit_conditions: string[]
  target_emotional_scores: EmotionalScores
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

export interface Scene {
  scene_id: string
  beat_id: string
  setting: string
  characters: string[]
  scene_goal: string
  archetype_trace: SceneArchetypeTrace
  genre_obligations: SceneGenreObligation[]
  constraints_checklist: SceneConstraintsChecklist
}

export interface CoverageTargets {
  hard_constraints_min_coverage: number   // 1.0 for full coverage
  soft_constraints_min_coverage: number   // e.g. 0.6
}

export interface StoryPlan extends RunMetadata {
  beats: Beat[]
  scenes: Scene[]
  coverage_targets: CoverageTargets
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
  mode: 'warn' | 'block'
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
// Loaded Corpus (aggregate type for the full corpus in memory)
// ---------------------------------------------------------------------------

import type { StoryGraph, DataManifest } from '../../types/graph.ts'

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
}
