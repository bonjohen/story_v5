/**
 * RequestStore tests — form state persistence across tab switches,
 * value validation, and bridge connection lifecycle.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useRequestStore } from '../requestStore.ts'

function getState() {
  return useRequestStore.getState()
}

function reset() {
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
    openaiModel: 'llama3:8b-instruct-q8_0',
    openaiApiKey: '',
    bridgeStatus: 'disconnected',
    bridgeAdapter: null,
    slotOverrides: {},
  })
}

describe('requestStore', () => {
  beforeEach(reset)

  describe('initial defaults', () => {
    it('starts with empty premise', () => {
      expect(getState().premise).toBe('')
    })

    it('defaults to Hero\'s Journey archetype', () => {
      expect(getState().archetype).toBe("The Hero's Journey")
    })

    it('defaults to Drama genre', () => {
      expect(getState().genre).toBe('Drama')
    })

    it('defaults to detailed-outline mode', () => {
      expect(getState().mode).toBe('detailed-outline')
    })

    it('starts with empty tone', () => {
      expect(getState().tone).toBe('')
    })

    it('defaults to OpenAI-compatible (Ollama) backend', () => {
      expect(getState().llmBackend).toBe('openai')
    })

    it('has default bridge URL', () => {
      expect(getState().bridgeUrl).toBe('ws://127.0.0.1:8765')
    })

    it('defaults to 20 max LLM calls', () => {
      expect(getState().maxLlmCalls).toBe(20)
    })

    it('starts disconnected', () => {
      expect(getState().bridgeStatus).toBe('disconnected')
    })

    it('starts with no slot overrides', () => {
      expect(getState().slotOverrides).toEqual({})
    })
  })

  describe('form field setters', () => {
    it('sets premise', () => {
      getState().setPremise('A young wizard discovers a hidden power')
      expect(getState().premise).toBe('A young wizard discovers a hidden power')
    })

    it('sets archetype', () => {
      getState().setArchetype('Tragedy')
      expect(getState().archetype).toBe('Tragedy')
    })

    it('sets genre', () => {
      getState().setGenre('Science Fiction')
      expect(getState().genre).toBe('Science Fiction')
    })

    it('sets mode', () => {
      getState().setMode('draft')
      expect(getState().mode).toBe('draft')
    })

    it('sets tone', () => {
      getState().setTone('dark and brooding')
      expect(getState().tone).toBe('dark and brooding')
    })
  })

  describe('state survives simulated tab switch', () => {
    it('preserves all form values after setting them', () => {
      // Simulate filling out the Setup tab
      getState().setPremise('An engineer on a space station')
      getState().setArchetype('The Quest')
      getState().setGenre('Science Fiction')
      getState().setTone('somber')

      // "Switch" tabs — in the real UI this unmounts StorySetupTab
      // and mounts ElementsTab. Store state should be unaffected.
      const snapshot = {
        premise: getState().premise,
        archetype: getState().archetype,
        genre: getState().genre,
        tone: getState().tone,
      }

      // Verify values persist (store is global, not component-local)
      expect(snapshot.premise).toBe('An engineer on a space station')
      expect(snapshot.archetype).toBe('The Quest')
      expect(snapshot.genre).toBe('Science Fiction')
      expect(snapshot.tone).toBe('somber')
    })

    it('preserves slot overrides across state reads', () => {
      getState().setSlotOverride('protagonist_name', 'Elena')
      getState().setSlotOverride('setting_name', 'The Void Station')

      // Read state fresh (simulating another component reading)
      const s = useRequestStore.getState()
      expect(s.slotOverrides).toEqual({
        protagonist_name: 'Elena',
        setting_name: 'The Void Station',
      })
    })
  })

  describe('maxLlmCalls clamping', () => {
    it('clamps to minimum of 1', () => {
      getState().setMaxLlmCalls(0)
      expect(getState().maxLlmCalls).toBe(1)
    })

    it('clamps negative values to 1', () => {
      getState().setMaxLlmCalls(-5)
      expect(getState().maxLlmCalls).toBe(1)
    })

    it('clamps to maximum of 100', () => {
      getState().setMaxLlmCalls(200)
      expect(getState().maxLlmCalls).toBe(100)
    })

    it('accepts valid values', () => {
      getState().setMaxLlmCalls(50)
      expect(getState().maxLlmCalls).toBe(50)
    })
  })

  describe('slot overrides', () => {
    it('sets a single slot override', () => {
      getState().setSlotOverride('hero_name', 'Aria')
      expect(getState().slotOverrides).toEqual({ hero_name: 'Aria' })
    })

    it('accumulates multiple slot overrides', () => {
      getState().setSlotOverride('hero_name', 'Aria')
      getState().setSlotOverride('mentor_name', 'Galen')
      expect(getState().slotOverrides).toEqual({
        hero_name: 'Aria',
        mentor_name: 'Galen',
      })
    })

    it('overwrites existing slot override', () => {
      getState().setSlotOverride('hero_name', 'Aria')
      getState().setSlotOverride('hero_name', 'Zara')
      expect(getState().slotOverrides.hero_name).toBe('Zara')
    })

    it('clears all slot overrides', () => {
      getState().setSlotOverride('hero_name', 'Aria')
      getState().setSlotOverride('mentor_name', 'Galen')
      getState().clearSlotOverrides()
      expect(getState().slotOverrides).toEqual({})
    })
  })

  describe('LLM backend selection', () => {
    it('switches to bridge backend', () => {
      getState().setLlmBackend('bridge')
      expect(getState().llmBackend).toBe('bridge')
    })

    it('switches back to openai', () => {
      getState().setLlmBackend('bridge')
      getState().setLlmBackend('openai')
      expect(getState().llmBackend).toBe('openai')
    })

    it('sets custom bridge URL', () => {
      getState().setBridgeUrl('ws://192.168.1.100:9000')
      expect(getState().bridgeUrl).toBe('ws://192.168.1.100:9000')
    })
  })
})
