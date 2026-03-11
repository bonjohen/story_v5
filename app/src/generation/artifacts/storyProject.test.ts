import { describe, it, expect } from 'vitest'
import {
  exportProject,
  parseProject,
  exportSnapshot,
} from './storySnapshot.ts'
import type { StoryProjectRequest, OrchestratorState, GenerationMode } from './types.ts'

function makeMinimalGenState() {
  return {
    status: 'IDLE' as OrchestratorState,
    runId: 'RUN_2026_03_09_0001',
    mode: 'draft' as GenerationMode,
    events: [],
    error: null,
    request: null,
    selection: null,
    contract: null,
    templatePack: null,
    backbone: null,
    detailBindings: null,
    plan: null,
    sceneDrafts: new Map<string, string>(),
    validation: null,
    trace: null,
    complianceReport: null,
    chapterManifest: null,
  }
}

function makeRequest(): StoryProjectRequest {
  return {
    premise: 'A wizard discovers a lost city',
    archetype: "The Hero's Journey",
    genre: 'Fantasy',
    tone: 'epic',
    llmBackend: 'openai',
    bridgeUrl: 'ws://127.0.0.1:8765',
    maxLlmCalls: 30,
    openaiBaseUrl: 'http://localhost:11434/v1',
    openaiModel: 'llama3-8k',
  }
}

describe('StoryProject round-trip', () => {
  it('exportProject → JSON → parseProject preserves all fields', () => {
    const req = makeRequest()
    const genState = makeMinimalGenState()
    const project = exportProject('My Test Project', req, genState)

    const json = JSON.stringify(project)
    const parsed = parseProject(json)

    expect(parsed._format).toBe('story_v5_project')
    expect(parsed._version).toBe('1.0.0')
    expect(parsed.projectName).toBe('My Test Project')
    expect(parsed.request.premise).toBe('A wizard discovers a lost city')
    expect(parsed.request.archetype).toBe("The Hero's Journey")
    expect(parsed.request.genre).toBe('Fantasy')
    expect(parsed.request.tone).toBe('epic')
    expect(parsed.request.llmBackend).toBe('openai')
    expect(parsed.request.maxLlmCalls).toBe(30)
    expect(parsed.generation._format).toBe('story_v5_snapshot')
    expect(parsed.generation.run_id).toBe('RUN_2026_03_09_0001')
  })

  it('parseProject wraps legacy snapshot with defaults', () => {
    const genState = makeMinimalGenState()
    const snapshot = exportSnapshot(genState)
    const json = JSON.stringify(snapshot)
    const parsed = parseProject(json)

    expect(parsed._format).toBe('story_v5_project')
    expect(parsed.projectName).toBe('Imported Snapshot')
    expect(parsed.request.premise).toBe('')
    expect(parsed.request.archetype).toBe("The Hero's Journey")
    expect(parsed.request.genre).toBe('Drama')
    expect(parsed.request.llmBackend).toBe('openai')
    expect(parsed.generation._format).toBe('story_v5_snapshot')
  })

  it('rejects unknown format', () => {
    expect(() => parseProject('{"_format":"unknown"}')).toThrow(
      'Not a valid story project or snapshot file'
    )
  })

  it('rejects invalid JSON', () => {
    expect(() => parseProject('not json')).toThrow()
  })
})

describe('requestStore loadFromProject', () => {
  it('sets all request fields from project', async () => {
    const { useRequestStore } = await import('../store/requestStore.ts')
    const req = makeRequest()
    useRequestStore.getState().loadFromProject(req)
    const state = useRequestStore.getState()
    expect(state.premise).toBe('A wizard discovers a lost city')
    expect(state.archetype).toBe("The Hero's Journey")
    expect(state.genre).toBe('Fantasy')
    expect(state.tone).toBe('epic')
    expect(state.llmBackend).toBe('openai')
    expect(state.maxLlmCalls).toBe(30)
    expect(state.openaiBaseUrl).toBe('http://localhost:11434/v1')
    expect(state.openaiModel).toBe('llama3-8k')
  })
})
