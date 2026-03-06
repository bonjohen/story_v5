import { describe, it, expect } from 'vitest'
import { assembleChapters } from './chapterAssembler.ts'
import { MockLLMAdapter } from '../agents/llmAdapter.ts'
import type { StoryBackbone } from '../artifacts/types.ts'

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
        beat_id: 'BEAT_N01',
        archetype_node_id: 'HJ_N01',
        label: 'Ordinary World',
        scenes: [
          { scene_id: 'SCN_01', scene_goal: 'Establish world', genre_obligations: [], slots: {} },
        ],
      },
      {
        beat_id: 'BEAT_N02',
        archetype_node_id: 'HJ_N02',
        label: 'Call to Adventure',
        scenes: [
          { scene_id: 'SCN_02', scene_goal: 'Disrupt order', genre_obligations: [], slots: {} },
        ],
      },
      {
        beat_id: 'BEAT_N03',
        archetype_node_id: 'HJ_N03',
        label: 'Meeting the Mentor',
        scenes: [
          { scene_id: 'SCN_03', scene_goal: 'Meet guide', genre_obligations: [], slots: {} },
        ],
      },
    ],
    chapter_partition: [
      { chapter_id: 'CH_01', title: 'Chapter 1: Setup', beat_ids: ['BEAT_N01', 'BEAT_N02'], tone_goal: 'Establish' },
      { chapter_id: 'CH_02', title: 'Chapter 2: Journey', beat_ids: ['BEAT_N03'], tone_goal: 'Deepen' },
    ],
    style_directives: { global_voice: 'third-person past tense', global_pacing: 'measured' },
  }
}

function makeSceneDrafts(): Map<string, string> {
  return new Map([
    ['SCN_01', 'The station hummed with the routine of another day.'],
    ['SCN_02', 'An alarm shattered the silence. Something had gone wrong.'],
    ['SCN_03', 'Dr. Orin appeared at the threshold, eyes bright with urgency.'],
  ])
}

describe('chapterAssembler', () => {
  it('creates one chapter per partition entry', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    expect(result.manifest.chapters).toHaveLength(2)
    expect(result.chapters.size).toBe(2)
  })

  it('every scene appears exactly once across all chapters', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const allSceneIds = result.manifest.chapters.flatMap((ch) => ch.scene_ids)
    expect(allSceneIds).toHaveLength(3)
    expect(new Set(allSceneIds).size).toBe(3)
    expect(allSceneIds).toContain('SCN_01')
    expect(allSceneIds).toContain('SCN_02')
    expect(allSceneIds).toContain('SCN_03')
  })

  it('chapter manifest maps scenes to correct chapters', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const ch1 = result.manifest.chapters.find((c) => c.chapter_id === 'CH_01')!
    const ch2 = result.manifest.chapters.find((c) => c.chapter_id === 'CH_02')!
    expect(ch1.scene_ids).toEqual(['SCN_01', 'SCN_02'])
    expect(ch2.scene_ids).toEqual(['SCN_03'])
  })

  it('chapter content includes scene text', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toContain('The station hummed')
    expect(ch1).toContain('An alarm shattered')
  })

  it('chapter content includes title header', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toContain('# Chapter 1: Setup')
  })

  it('chapter content includes scene separator', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toContain('---')
  })

  it('preserves metadata footer', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toContain('<!-- [CHAPTER: CH_01]')
  })

  it('handles missing scene drafts gracefully', async () => {
    const drafts = new Map([['SCN_01', 'Some text.']])
    const result = await assembleChapters(makeBackbone(), drafts)
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toContain('draft not available')
  })

  it('manifest includes total counts', async () => {
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts())
    expect(result.manifest.total_scene_count).toBe(3)
    expect(result.manifest.total_chapter_count).toBe(2)
  })

  it('editorial pass uses LLM when provided', async () => {
    const llm = new MockLLMAdapter(['Polished chapter content here.'])
    const result = await assembleChapters(makeBackbone(), makeSceneDrafts(), llm)
    // Both chapters should be polished by the mock LLM
    const ch1 = result.chapters.get('CH_01')!
    expect(ch1).toBe('Polished chapter content here.')
  })
})
