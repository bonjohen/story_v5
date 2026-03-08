/**
 * Story Snapshot — serializes/deserializes all generation artifacts
 * to a single JSON file for import/export.
 */

import type {
  StoryRequest,
  SelectionResult,
  StoryContract,
  StoryPlan,
  ValidationResults,
  StoryTrace,
  GenerationMode,
  TemplatePack,
  StoryBackbone,
  StoryDetailBindings,
  ChapterManifest,
  OrchestratorState,
} from './types.ts'
import type { OrchestratorEvent } from '../engine/orchestrator.ts'

// ---------------------------------------------------------------------------
// Snapshot type
// ---------------------------------------------------------------------------

export interface StorySnapshot {
  _format: 'story_v5_snapshot'
  _version: '1.0.0'
  exported_at: string

  // Run metadata
  status: OrchestratorState
  run_id: string | null
  mode: GenerationMode
  events: OrchestratorEvent[]
  error: string | null

  // All artifacts (null if not produced)
  request: StoryRequest | null
  selection: SelectionResult | null
  contract: StoryContract | null
  templatePack: TemplatePack | null
  backbone: StoryBackbone | null
  detailBindings: StoryDetailBindings | null
  plan: StoryPlan | null
  sceneDrafts: Record<string, string>  // Map serialized as object
  validation: ValidationResults | null
  trace: StoryTrace | null
  complianceReport: string | null
  chapterManifest: ChapterManifest | null
}

// ---------------------------------------------------------------------------
// Export — read store state, produce downloadable JSON
// ---------------------------------------------------------------------------

export function exportSnapshot(state: {
  status: OrchestratorState
  runId: string | null
  mode: GenerationMode
  events: OrchestratorEvent[]
  error: string | null
  request: StoryRequest | null
  selection: SelectionResult | null
  contract: StoryContract | null
  templatePack: TemplatePack | null
  backbone: StoryBackbone | null
  detailBindings: StoryDetailBindings | null
  plan: StoryPlan | null
  sceneDrafts: Map<string, string>
  validation: ValidationResults | null
  trace: StoryTrace | null
  complianceReport: string | null
  chapterManifest: ChapterManifest | null
}): StorySnapshot {
  return {
    _format: 'story_v5_snapshot',
    _version: '1.0.0',
    exported_at: new Date().toISOString(),
    status: state.status,
    run_id: state.runId,
    mode: state.mode,
    events: state.events,
    error: state.error,
    request: state.request,
    selection: state.selection,
    contract: state.contract,
    templatePack: state.templatePack,
    backbone: state.backbone,
    detailBindings: state.detailBindings,
    plan: state.plan,
    sceneDrafts: Object.fromEntries(state.sceneDrafts),
    validation: state.validation,
    trace: state.trace,
    complianceReport: state.complianceReport,
    chapterManifest: state.chapterManifest,
  }
}

/** Trigger browser download of a snapshot as JSON. Browser-only. */
export function downloadSnapshot(snapshot: StorySnapshot): void {
  const json = JSON.stringify(snapshot, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const runPart = snapshot.run_id ?? 'story'
  a.href = url
  a.download = `${runPart}.snapshot.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Import — parse JSON, return loadable state
// ---------------------------------------------------------------------------

export function parseSnapshot(json: string): StorySnapshot {
  const data = JSON.parse(json)
  if (data._format !== 'story_v5_snapshot') {
    throw new Error('Not a valid story snapshot file')
  }
  return data as StorySnapshot
}

/** Convert snapshot back to store-compatible shape (Map for sceneDrafts). */
export function snapshotToStoreState(snapshot: StorySnapshot) {
  return {
    status: snapshot.status,
    runId: snapshot.run_id,
    mode: snapshot.mode,
    running: false,
    events: snapshot.events,
    error: snapshot.error,
    request: snapshot.request,
    selection: snapshot.selection,
    contract: snapshot.contract,
    templatePack: snapshot.templatePack,
    backbone: snapshot.backbone,
    detailBindings: snapshot.detailBindings,
    plan: snapshot.plan,
    sceneDrafts: new Map(Object.entries(snapshot.sceneDrafts ?? {})),
    validation: snapshot.validation,
    trace: snapshot.trace,
    complianceReport: snapshot.complianceReport,
    chapterManifest: snapshot.chapterManifest,
    selectedSceneId: null,
  }
}
