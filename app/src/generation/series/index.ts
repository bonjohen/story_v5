/**
 * Chapter Stories (Series) module — public API.
 *
 * This module provides:
 * - Types for Series, StoryLore, Episode, StateDelta, StateSnapshot, etc.
 * - File I/O for reading/writing series data to outputs/series/
 * - State extraction from episode plans
 * - Lore merge logic for canonization
 * - Lore validation for consistency checks
 */

// Types
export type {
  // Canon
  CanonStatus,
  // Lore entities
  LoreRelationship,
  CharacterArcMilestone,
  LoreCharacter,
  LorePlaceConnection,
  LorePlace,
  ObjectCustodyEntry,
  LoreObject,
  LoreFaction,
  PlotThread,
  ThemeToneAnchor,
  WorldRule,
  LoreEvent,
  StoryLore,
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
  // Lore CRUD
  loadLore,
  saveLore,
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

// Lore merge
export {
  mergeDeltaIntoLore,
  createSnapshot,
  canonizeEpisode,
  deCanonizeEpisode,
  validateLore,
  validateDeltaAgainstLore,
  type LoreValidationResult,
} from './loreMerge.ts'

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

// Lore validator
export {
  validateAgainstLore,
  type LoreValidationCheck,
  type LoreValidationCheckType,
  type LoreValidationInput,
  type LoreValidationResults,
} from './loreValidator.ts'

// Series manager
export {
  // Thread lifecycle
  computeThreadAges,
  proposeUrgencyEscalations,
  applyUrgencyEscalations,
  computeThreadHealth,
  suggestThreadPriorities,
  type ThreadAgeInfo,
  type EscalationConfig,
  type ThreadHealthMetrics,
  // Arc advancement
  suggestArcAdvancement,
  getNextArcPhase,
  isArcComplete,
  episodesInCurrentPhase,
  type ArcAdvancementSuggestion,
  // Slot management
  createEpisodeSlot,
  getOrCreateNextSlot,
  getSeriesStatus,
  type SeriesStatusSummary,
} from './seriesManager.ts'

// Episode orchestrator
export {
  orchestrateEpisode,
  canonizeEpisodeFromDisk,
  type EpisodeOrchestratorState,
  type EpisodeOrchestratorEvent,
  type EpisodeGenerationResult,
  type EpisodeOrchestratorOptions,
} from './episodeOrchestrator.ts'

// Viewer panels
export { LoreViewerPanel } from './panels/LoreViewerPanel.tsx'
export { ArcVisualizerPanel } from './panels/ArcVisualizerPanel.tsx'
export { ThreadTrackerPanel } from './panels/ThreadTrackerPanel.tsx'

// Branch manager
export {
  createBranch,
  generateBranchId,
  listBranchIds,
  getBranchDivergenceSlot,
  computeLoreDiff,
  isBranchDivergent,
  type CreateBranchInput,
  type LoreDiffSummary,
} from './branchManager.ts'

// Series exporter
export {
  exportSeriesToMarkdown,
  exportEpisodeToMarkdown,
  exportLoreToMarkdown,
  exportTimelineToMarkdown,
  type SeriesExportOptions,
} from './seriesExporter.ts'

// Series analytics
export {
  computeSeriesOverview,
  computeArcProgress,
  computeCharacterStats,
  computeThreadStats,
  computeSlotStats,
  type SeriesOverviewStats,
  type ArcProgressStats,
  type CharacterStats,
  type ThreadStats,
  type SlotStats,
} from './seriesAnalytics.ts'

// Standalone importer
export {
  buildSeriesConfigFromRun,
  buildInitialLoreFromRun,
  buildEpisodeFromRun,
  type StandaloneRunData,
} from './standaloneImporter.ts'
