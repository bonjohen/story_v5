import { describe, it, expect, beforeEach } from 'vitest'
import { useGenerationStore } from './generationStore.ts'
import type { StoryContract, StoryPlan, ValidationResults, StoryTrace, SelectionResult } from '../artifacts/types.ts'
import type { OrchestratorResult } from '../engine/orchestrator.ts'

// Reset store between tests
beforeEach(() => {
  useGenerationStore.getState().clearRun()
})

describe('generationStore', () => {
  it('starts with IDLE state', () => {
    const state = useGenerationStore.getState()
    expect(state.status).toBe('IDLE')
    expect(state.running).toBe(false)
    expect(state.runId).toBeNull()
    expect(state.contract).toBeNull()
    expect(state.plan).toBeNull()
    expect(state.events).toEqual([])
  })

  it('selectScene sets selectedSceneId', () => {
    useGenerationStore.getState().selectScene('scene_001')
    expect(useGenerationStore.getState().selectedSceneId).toBe('scene_001')
  })

  it('selectScene can clear selection', () => {
    useGenerationStore.getState().selectScene('scene_001')
    useGenerationStore.getState().selectScene(null)
    expect(useGenerationStore.getState().selectedSceneId).toBeNull()
  })

  it('clearRun resets to initial state', () => {
    useGenerationStore.getState().selectScene('scene_001')
    useGenerationStore.getState().clearRun()
    const state = useGenerationStore.getState()
    expect(state.status).toBe('IDLE')
    expect(state.selectedSceneId).toBeNull()
    expect(state.events).toEqual([])
  })

  it('loadResult populates all artifacts', () => {
    const mockContract = { archetype: { name: 'Test' } } as unknown as StoryContract
    const mockPlan = { beats: [], scenes: [] } as unknown as StoryPlan
    const mockValidation = { scenes: [], global: {} } as unknown as ValidationResults
    const mockTrace = { scene_trace: [] } as unknown as StoryTrace
    const mockSelection = { primary_archetype: 'test' } as unknown as SelectionResult

    const result: OrchestratorResult = {
      state: 'COMPLETED',
      run_id: 'RUN_TEST_001',
      selection: mockSelection,
      contract: mockContract,
      plan: mockPlan,
      sceneDrafts: new Map([['s1', 'draft text']]),
      validation: mockValidation,
      trace: mockTrace,
      complianceReport: '# Report',
      events: [{ state: 'COMPLETED', message: 'Done', timestamp: '2026-01-01T00:00:00Z' }],
    }

    const request = { run_id: 'RUN_TEST_001' } as never
    useGenerationStore.getState().loadResult(result, request)

    const state = useGenerationStore.getState()
    expect(state.status).toBe('COMPLETED')
    expect(state.runId).toBe('RUN_TEST_001')
    expect(state.contract).toBe(mockContract)
    expect(state.plan).toBe(mockPlan)
    expect(state.validation).toBe(mockValidation)
    expect(state.trace).toBe(mockTrace)
    expect(state.complianceReport).toBe('# Report')
    expect(state.sceneDrafts.get('s1')).toBe('draft text')
    expect(state.events).toHaveLength(1)
    expect(state.running).toBe(false)
  })

  it('loadResult handles partial results', () => {
    const result: OrchestratorResult = {
      state: 'FAILED',
      run_id: 'RUN_FAIL_001',
      events: [],
      error: 'Something broke',
    }

    const request = { run_id: 'RUN_FAIL_001' } as never
    useGenerationStore.getState().loadResult(result, request)

    const state = useGenerationStore.getState()
    expect(state.status).toBe('FAILED')
    expect(state.error).toBe('Something broke')
    expect(state.contract).toBeNull()
    expect(state.plan).toBeNull()
  })
})
