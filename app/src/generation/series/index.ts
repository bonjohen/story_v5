/**
 * Chapter Stories (Series) module — public API.
 *
 * This module provides:
 * - Types for Series, StoryBible, Episode, StateDelta, StateSnapshot, etc.
 * - File I/O for reading/writing series data to outputs/series/
 * - State extraction from episode plans
 * - Bible merge logic for canonization
 * - Bible validation for consistency checks
 */

// Types
export type {
  // Canon
  CanonStatus,
  // Bible entities
  BibleRelationship,
  CharacterArcMilestone,
  BibleCharacter,
  BiblePlaceConnection,
  BiblePlace,
  ObjectCustodyEntry,
  BibleObject,
  BibleFaction,
  PlotThread,
  ThemeToneAnchor,
  WorldRule,
  BibleEvent,
  StoryBible,
  // Arc
  ArcPhaseEntry,
  ArcAdvancementMode,
  OverarchingArc,
  // Episode context
  ThreadPriority,
  EpisodeArcContext,
  // Timeline
  CanonTimelineEntry,
  CanonTimeline,
  // Snapshots
  StateSnapshot,
  // Deltas
  CharacterUpdate,
  PlaceUpdate,
  ObjectUpdate,
  FactionUpdate,
  ThreadUpdate,
  ArcPhaseChange,
  StateDelta,
  // Episodes
  EpisodeSlot,
  EpisodeArtifacts,
  EpisodeSummary,
  Episode,
  EpisodeRequest,
  EpisodeIndex,
  // Branching
  Branch,
  // Series
  Series,
  SeriesConfig,
} from './types.ts'

// I/O
export {
  // Validation
  validateSeriesArtifact,
  type SeriesArtifactName,
  type SeriesValidationResult,
  // ID generation
  generateSeriesId,
  generateEpisodeId,
  generateSnapshotId,
  generatePlotThreadId,
  // Series CRUD
  createSeries,
  loadSeries,
  saveSeries,
  listSeries,
  // Bible CRUD
  loadBible,
  saveBible,
  // Snapshot CRUD
  saveSnapshot,
  loadSnapshot,
  loadLatestSnapshot,
  listSnapshots,
  // Episode CRUD
  saveEpisode,
  loadEpisode,
  saveStateDelta,
  loadStateDelta,
  listCandidates,
  saveSceneDraft,
  loadSceneDraft,
  getEpisodeDir,
  // Path helpers
  seriesDir,
  snapshotsDir,
  episodesDir,
  episodeSlotDir,
  episodeCandidateDir,
  branchesDir,
} from './io.ts'

// State extraction
export {
  extractStateDelta,
  type ExtractionInput,
} from './stateExtractor.ts'

// Bible merge
export {
  mergeDeltaIntoBible,
  createSnapshot,
  canonizeEpisode,
  deCanonizeEpisode,
  validateBible,
  validateDeltaAgainstBible,
  type BibleValidationResult,
} from './bibleMerge.ts'

// Episode contract compiler
export {
  compileEpisodeContract,
  type EpisodeContractInput,
} from './episodeContractCompiler.ts'

// Episode planner
export {
  buildEpisodePlan,
  type EpisodePlannerOptions,
} from './episodePlanner.ts'

// Episode writer
export {
  buildEpisodeWriterPrompt,
  type EpisodeWriterContext,
} from './episodeWriter.ts'

// Bible validator
export {
  validateAgainstBible,
  type BibleValidationCheck,
  type BibleValidationCheckType,
  type BibleValidationInput,
  type BibleValidationResults,
} from './bibleValidator.ts'
