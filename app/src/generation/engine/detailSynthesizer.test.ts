import { describe, it, expect } from 'vitest'
import { synthesizeDetails } from './detailSynthesizer.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type { StoryRequest, StoryBackbone } from '../artifacts/types.ts'

function makeRequest(): StoryRequest {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    premise: 'A young engineer discovers a hidden AI in a space station',
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: 'Science Fiction',
    requested_archetype: "The Hero's Journey",
    tone_preference: 'intellectual',
    constraints: { must_include: [], must_exclude: [] },
  }
}

function makeBackbone(): StoryBackbone {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    archetype_id: '01_heros_journey',
    genre_id: '06_science_fiction',
    beats: [
      {
        beat_id: 'BEAT_HJ_N01',
        archetype_node_id: 'HJ_N01_ORDINARY',
        label: 'Ordinary World',
        role: 'Origin',
        scenes: [{
          scene_id: 'SCN_HJ_N01',
          scene_goal: 'Establish ordinary world',
          genre_obligations: [],
          slots: {
            protagonist: { slot_name: 'protagonist', category: 'character', required: true, description: 'Main character' },
            ordinary_world: { slot_name: 'ordinary_world', category: 'place', required: true, description: 'Starting location' },
          },
        }],
      },
      {
        beat_id: 'BEAT_HJ_N03',
        archetype_node_id: 'HJ_N03_MENTOR',
        label: 'Meeting the Mentor',
        role: 'Catalyst',
        scenes: [{
          scene_id: 'SCN_HJ_N03',
          scene_goal: 'Meet the mentor',
          genre_obligations: [],
          slots: {
            protagonist: { slot_name: 'protagonist', category: 'character', required: true },
            mentor: { slot_name: 'mentor', category: 'character', required: true, description: 'Guide figure' },
            talisman: { slot_name: 'talisman', category: 'object', required: false, description: 'Symbolic object' },
          },
        }],
      },
    ],
    chapter_partition: [{ chapter_id: 'CH_01', beat_ids: ['BEAT_HJ_N01', 'BEAT_HJ_N03'] }],
    style_directives: { global_voice: 'third-person past tense' },
  }
}

describe('detailSynthesizer', () => {
  describe('deterministic mode (no LLM)', () => {
    it('creates bindings for all unique slots', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const bindings = result.bindings
      expect(bindings.slot_bindings).toHaveProperty('protagonist')
      expect(bindings.slot_bindings).toHaveProperty('mentor')
      expect(bindings.slot_bindings).toHaveProperty('ordinary_world')
      expect(bindings.slot_bindings).toHaveProperty('talisman')
    })

    it('creates character entities for character slots', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const chars = result.bindings.entity_registry.characters
      expect(chars.length).toBeGreaterThanOrEqual(2) // protagonist + mentor
      expect(chars.find((c) => c.role === 'protagonist')).toBeDefined()
      expect(chars.find((c) => c.role === 'mentor')).toBeDefined()
    })

    it('creates place entities for place slots', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const places = result.bindings.entity_registry.places
      expect(places.length).toBeGreaterThanOrEqual(1) // ordinary_world
      expect(places.find((p) => p.type === 'ordinary_world')).toBeDefined()
    })

    it('creates object entities for object slots', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const objects = result.bindings.entity_registry.objects
      expect(objects.length).toBeGreaterThanOrEqual(1) // talisman
    })

    it('binds slots back into the updated backbone', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const scene1 = result.updatedBackbone.beats[0].scenes[0]
      expect(scene1.slots['protagonist'].bound_value).toBeTruthy()
      expect(scene1.slots['ordinary_world'].bound_value).toBeTruthy()
    })

    it('uses title-cased names for placeholders', async () => {
      const result = await synthesizeDetails(makeRequest(), makeBackbone())
      const binding = result.bindings.slot_bindings['ordinary_world']
      expect(binding.bound_value).toBe('Ordinary World')
    })
  })

  describe('LLM mode', () => {
    it('parses LLM JSON response into bindings', async () => {
      const llmResponse = JSON.stringify({
        entity_registry: {
          characters: [
            { id: 'char_01', name: 'Kira Vasquez', role: 'protagonist', traits: ['resourceful', 'curious'] },
            { id: 'char_02', name: 'Dr. Orin', role: 'mentor', traits: ['wise', 'secretive'] },
          ],
          places: [
            { id: 'place_01', name: 'Station Helios', type: 'ordinary_world', features: ['orbital', 'aging'] },
          ],
          objects: [
            { id: 'obj_01', name: 'The Cipher Key', type: 'talisman', significance: 'Unlocks the hidden AI' },
          ],
        },
        slot_bindings: {
          protagonist: { slot_name: 'protagonist', bound_entity_id: 'char_01', bound_value: 'Kira Vasquez' },
          mentor: { slot_name: 'mentor', bound_entity_id: 'char_02', bound_value: 'Dr. Orin' },
          ordinary_world: { slot_name: 'ordinary_world', bound_entity_id: 'place_01', bound_value: 'Station Helios' },
          talisman: { slot_name: 'talisman', bound_entity_id: 'obj_01', bound_value: 'The Cipher Key' },
        },
        open_mysteries: [],
        promises: [],
        payoffs: [],
        unresolved_todos: [],
      })

      const llm = new MockLLMAdapter([llmResponse])
      const result = await synthesizeDetails(makeRequest(), makeBackbone(), llm)
      expect(result.bindings.entity_registry.characters).toHaveLength(2)
      expect(result.bindings.slot_bindings['protagonist'].bound_value).toBe('Kira Vasquez')
    })

    it('flags unresolved required slots when LLM omits them', async () => {
      const llmResponse = JSON.stringify({
        entity_registry: { characters: [], places: [], objects: [] },
        slot_bindings: {},
      })

      const llm = new MockLLMAdapter([llmResponse])
      const result = await synthesizeDetails(makeRequest(), makeBackbone(), llm)
      // protagonist, mentor, ordinary_world are required but not bound
      expect(result.bindings.unresolved_todos).toBeDefined()
      expect(result.bindings.unresolved_todos!.length).toBeGreaterThanOrEqual(3)
    })
  })
})
