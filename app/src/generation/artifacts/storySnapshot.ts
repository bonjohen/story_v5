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
  StoryProject,
  StoryProjectRequest,
  StorySnapshot,
} from './types.ts'
import type { OrchestratorEvent } from '../engine/orchestrator.ts'

// Re-export so existing consumers of StorySnapshot from this module still work
export type { StorySnapshot }

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

// ---------------------------------------------------------------------------
// StoryProject — unified save/load (request settings + generation artifacts)
// ---------------------------------------------------------------------------

const DEFAULT_PROJECT_REQUEST: StoryProjectRequest = {
  premise: '',
  archetype: "The Hero's Journey",
  genre: 'Drama',
  tone: '',
  llmBackend: 'openai',
  bridgeUrl: 'ws://127.0.0.1:8765',
  maxLlmCalls: 20,
  openaiBaseUrl: 'http://localhost:11434/v1',
  openaiModel: 'llama3:8b-instruct-q8_0',
}

/** Build a StoryProject envelope from request + generation store state. */
export function exportProject(
  projectName: string,
  requestState: StoryProjectRequest,
  generationState: Parameters<typeof exportSnapshot>[0],
): StoryProject {
  return {
    _format: 'story_v5_project',
    _version: '1.0.0',
    projectName,
    savedAt: new Date().toISOString(),
    request: requestState,
    generation: exportSnapshot(generationState),
  }
}

/** Trigger browser download of a project as JSON. */
export function downloadProject(project: StoryProject): void {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'project'
  a.href = url
  a.download = `${safeName}.project.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse a JSON string as a StoryProject. Handles both formats:
 * - `story_v5_project` → return as-is
 * - `story_v5_snapshot` → wrap in a project with default request values
 */
export function parseProject(json: string): StoryProject {
  const data = JSON.parse(json)
  if (data._format === 'story_v5_project') {
    return data as StoryProject
  }
  if (data._format === 'story_v5_snapshot') {
    return {
      _format: 'story_v5_project',
      _version: '1.0.0',
      projectName: 'Imported Snapshot',
      savedAt: data.exported_at ?? new Date().toISOString(),
      request: { ...DEFAULT_PROJECT_REQUEST },
      generation: data as StorySnapshot,
    }
  }
  throw new Error('Not a valid story project or snapshot file')
}
