import { describe, it, expect } from 'vitest'
import {
  buildSeriesConfigFromRun,
  buildInitialLoreFromRun,
  buildEpisodeFromRun,
  type StandaloneRunData,
} from './standaloneImporter.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRunData(overrides: Partial<StandaloneRunData> = {}): StandaloneRunData {
  return {
    title: 'The Lost Kingdom',
    synopsis: 'A hero discovers a hidden kingdom',
    archetype_id: '01_heros_journey',
    archetype_name: "Hero's Journey",
    genre_id: '03_fantasy',
    genre_name: 'Fantasy',
    characters: [
      { id: 'c1', name: 'Arin', role: 'protagonist', traits: ['brave', 'curious'], motivations: ['find the truth'] },
      { id: 'c2', name: 'Morrigan', role: 'mentor', traits: ['wise'], motivations: ['protect the kingdom'] },
    ],
    places: [
      { id: 'p1', name: 'Village of Thane', type: 'ordinary_world', description: 'A quiet farming village' },
      { id: 'p2', name: 'The Lost Kingdom', type: 'special_world', description: 'A hidden underground kingdom' },
    ],
    objects: [
      { id: 'o1', name: 'Starstone', type: 'talisman', significance: 'Key to the kingdom gates' },
    ],
    scene_files: ['S01.md', 'S02.md', 'S03.md'],
    run_dir: 'outputs/runs/RUN_2025_01_15_0001',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('standaloneImporter', () => {
  describe('buildSeriesConfigFromRun', () => {
    it('builds a series config from a run', () => {
      const run = makeRunData()
      const config = buildSeriesConfigFromRun(run, {
        archetype_spine_nodes: ['HJ_N01', 'HJ_N02', 'HJ_N03'],
      })

      expect(config.title).toBe('The Lost Kingdom')
      expect(config.archetype_id).toBe('01_heros_journey')
      expect(config.genre_id).toBe('03_fantasy')
      expect(config.archetype_spine_nodes).toEqual(['HJ_N01', 'HJ_N02', 'HJ_N03'])
    })

    it('allows title and description overrides', () => {
      const run = makeRunData()
      const config = buildSeriesConfigFromRun(run, {
        title: 'Custom Title',
        description: 'Custom description',
        archetype_spine_nodes: ['HJ_N01'],
      })

      expect(config.title).toBe('Custom Title')
      expect(config.description).toBe('Custom description')
    })

    it('includes initial lore from run', () => {
      const run = makeRunData()
      const config = buildSeriesConfigFromRun(run, {
        archetype_spine_nodes: ['HJ_N01'],
      })

      expect(config.initial_lore).toBeDefined()
      expect(config.initial_lore!.characters).toHaveLength(2)
      expect(config.initial_lore!.places).toHaveLength(2)
      expect(config.initial_lore!.objects).toHaveLength(1)
    })
  })

  describe('buildInitialLoreFromRun', () => {
    it('converts run characters to lore characters', () => {
      const run = makeRunData()
      const lore = buildInitialLoreFromRun(run)

      expect(lore.characters).toHaveLength(2)
      expect(lore.characters![0].name).toBe('Arin')
      expect(lore.characters![0].status).toBe('alive')
      expect(lore.characters![0].introduced_in).toBe('EP_001_a')
      expect(lore.characters![0].traits).toEqual(['brave', 'curious'])
    })

    it('converts run places to lore places', () => {
      const run = makeRunData()
      const lore = buildInitialLoreFromRun(run)

      expect(lore.places).toHaveLength(2)
      expect(lore.places![0].name).toBe('Village of Thane')
      expect(lore.places![0].status).toBe('extant')
    })

    it('converts run objects to lore objects', () => {
      const run = makeRunData()
      const lore = buildInitialLoreFromRun(run)

      expect(lore.objects).toHaveLength(1)
      expect(lore.objects![0].name).toBe('Starstone')
      expect(lore.objects![0].status).toBe('intact')
    })

    it('handles empty arrays in run characters', () => {
      const run = makeRunData({
        characters: [
          { id: 'c1', name: 'Simple', role: 'protagonist' },
        ],
      })
      const lore = buildInitialLoreFromRun(run)

      expect(lore.characters![0].traits).toEqual([])
      expect(lore.characters![0].motivations).toEqual([])
    })
  })

  describe('buildEpisodeFromRun', () => {
    it('creates an episode object from a run', () => {
      const run = makeRunData()
      const episode = buildEpisodeFromRun('SER_lost_kingdom', run, 'HJ_N01')

      expect(episode.episode_id).toBe('EP_001_a')
      expect(episode.series_id).toBe('SER_lost_kingdom')
      expect(episode.slot_number).toBe(1)
      expect(episode.candidate_label).toBe('a')
      expect(episode.title).toBe('The Lost Kingdom')
      expect(episode.canon_status).toBe('draft')
      expect(episode.overarching_phase).toBe('HJ_N01')
    })

    it('includes scene file references', () => {
      const run = makeRunData()
      const episode = buildEpisodeFromRun('SER_test', run, 'HJ_N01')

      expect(episode.artifacts.scene_drafts).toEqual(['S01.md', 'S02.md', 'S03.md'])
    })

    it('includes character IDs in summary', () => {
      const run = makeRunData()
      const episode = buildEpisodeFromRun('SER_test', run, 'HJ_N01')

      expect(episode.summary.characters_featured).toEqual(['c1', 'c2'])
    })
  })
})
