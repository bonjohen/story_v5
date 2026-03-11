/**
 * Cross-store state persistence tests — verifies that data state
 * survives tab switches and panel toggling, simulating the real
 * user workflow of filling in Setup, switching to Elements, then Generate.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useRequestStore } from '../requestStore.ts'
import { useGenerationStore } from '../generationStore.ts'
import { useUIStore } from '../../../store/uiStore.ts'

function resetAll() {
  useRequestStore.setState({
    premise: '',
    archetype: "The Hero's Journey",
    genre: 'Drama',
    mode: 'detailed-outline',
    tone: '',
    llmBackend: 'openai',
    bridgeUrl: 'ws://127.0.0.1:8765',
    maxLlmCalls: 20,
    openaiBaseUrl: 'http://localhost:11434/v1',
    openaiModel: 'llama3-8k',
    openaiApiKey: '',
    openaiPlanningModel: '',
    skipValidation: false,
    fastDraft: false,
    bridgeStatus: 'disconnected',
    bridgeAdapter: null,
    slotOverrides: {},
  })
  useGenerationStore.getState().clearRun()
  useUIStore.setState({
    navOpen: false,
    infoPanelOpen: true,
    splitView: false,
    collapsedSections: {},
    setupLocked: false,
    elementsLocked: false,
  })
}

describe('cross-store state persistence', () => {
  beforeEach(resetAll)

  describe('Setup → Elements tab switch', () => {
    it('preserves premise and archetype when switching tabs', () => {
      // User fills in Setup tab
      useRequestStore.getState().setPremise('A detective in a haunted mansion')
      useRequestStore.getState().setArchetype('The Mystery Unveiled')
      useRequestStore.getState().setGenre('Horror')
      useRequestStore.getState().setTone('gothic')

      // Simulate tab switch (components unmount/mount, store persists)
      const req = useRequestStore.getState()
      expect(req.premise).toBe('A detective in a haunted mansion')
      expect(req.archetype).toBe('The Mystery Unveiled')
      expect(req.genre).toBe('Horror')
      expect(req.tone).toBe('gothic')
    })

    it('preserves slot overrides set in Elements tab', () => {
      // User sets overrides in Elements tab
      useRequestStore.getState().setSlotOverride('protagonist', 'Detective Morgan')
      useRequestStore.getState().setSlotOverride('antagonist', 'The Specter')
      useRequestStore.getState().setSlotOverride('setting', 'Blackwood Manor')

      // Read from another tab context
      const overrides = useRequestStore.getState().slotOverrides
      expect(overrides).toEqual({
        protagonist: 'Detective Morgan',
        antagonist: 'The Specter',
        setting: 'Blackwood Manor',
      })
    })
  })

  describe('generation state persistence', () => {
    it('preserves request state across store reads', () => {
      useRequestStore.getState().setPremise('A space opera about first contact')
      useRequestStore.getState().setArchetype('The Quest')
      useRequestStore.getState().setGenre('Science Fiction')

      const req = useRequestStore.getState()
      expect(req.premise).toBe('A space opera about first contact')
      expect(req.archetype).toBe('The Quest')
      expect(req.genre).toBe('Science Fiction')
    })

    it('preserves generation artifacts across store reads', () => {
      useGenerationStore.setState({
        status: 'COMPLETED',
        runId: 'test-run-001',
        sceneDrafts: new Map([
          ['scene_01', 'The ship emerged from hyperspace...'],
          ['scene_02', 'Captain Torres surveyed the alien vessel...'],
        ]),
      })

      const gen = useGenerationStore.getState()
      expect(gen.status).toBe('COMPLETED')
      expect(gen.runId).toBe('test-run-001')
      expect(gen.sceneDrafts.size).toBe(2)
      expect(gen.sceneDrafts.get('scene_01')).toBe('The ship emerged from hyperspace...')
    })
  })

  describe('clearRun isolation', () => {
    it('clearRun does not affect request store', () => {
      // Set up both stores
      useRequestStore.getState().setPremise('A tragedy about a fallen king')
      useRequestStore.getState().setArchetype('Tragedy')
      useGenerationStore.setState({
        status: 'COMPLETED',
        runId: 'test-run-002',
      })

      // Clear generation results
      useGenerationStore.getState().clearRun()

      // Request store should be untouched
      expect(useRequestStore.getState().premise).toBe('A tragedy about a fallen king')
      expect(useRequestStore.getState().archetype).toBe('Tragedy')

      // Generation store should be reset
      expect(useGenerationStore.getState().status).toBe('IDLE')
      expect(useGenerationStore.getState().runId).toBeNull()
    })
  })

  describe('section collapse persistence', () => {
    it('collapsed sections survive across store reads', () => {
      useUIStore.getState().toggleSection('info-stats')
      useUIStore.getState().toggleSection('info-gen')

      // Fresh read
      const ui = useUIStore.getState()
      expect(ui.isSectionCollapsed('info-stats')).toBe(true)
      expect(ui.isSectionCollapsed('info-gen')).toBe(true)
      expect(ui.isSectionCollapsed('info-elements')).toBe(false)
    })
  })

  describe('full workflow simulation', () => {
    it('preserves state through Setup → Elements → Generate flow', () => {
      // Step 1: Setup tab — fill form
      useRequestStore.getState().setPremise('A coming-of-age story in rural Japan')
      useRequestStore.getState().setArchetype('Coming of Age')
      useRequestStore.getState().setGenre('Drama')
      useRequestStore.getState().setTone('wistful')

      // Step 2: Elements tab — add overrides
      useRequestStore.getState().setSlotOverride('protagonist', 'Hana')
      useRequestStore.getState().setSlotOverride('mentor', 'Grandmother Yuki')

      // Step 3: Generate tab — verify all state accessible
      const req = useRequestStore.getState()
      expect(req.premise).toBe('A coming-of-age story in rural Japan')
      expect(req.archetype).toBe('Coming of Age')
      expect(req.genre).toBe('Drama')
      expect(req.tone).toBe('wistful')
      expect(req.slotOverrides).toEqual({
        protagonist: 'Hana',
        mentor: 'Grandmother Yuki',
      })

      // Step 4: Go back to Setup — still there
      expect(useRequestStore.getState().premise).toBe('A coming-of-age story in rural Japan')

      // Step 5: Simulate generation completion
      useGenerationStore.setState({
        status: 'COMPLETED',
        sceneDrafts: new Map([['scene_01', 'Draft prose here']]),
      })

      // Step 6: Switch to Analysis tab — request and gen state intact
      expect(useRequestStore.getState().archetype).toBe('Coming of Age')
      expect(useGenerationStore.getState().status).toBe('COMPLETED')
      expect(useGenerationStore.getState().sceneDrafts.size).toBe(1)
    })
  })
})
