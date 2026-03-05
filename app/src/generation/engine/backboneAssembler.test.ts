import { describe, it, expect } from 'vitest'
import { assembleBackbone } from './backboneAssembler.ts'
import type { StoryContract, TemplatePack } from '../artifacts/types.ts'

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    archetype: {
      id_prefix: 'HJ',
      name: "The Hero's Journey",
      archetype_id: '01_heros_journey',
      spine_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL', 'HJ_N03_MENTOR', 'HJ_N04_THRESHOLD', 'HJ_N05_TESTS'],
      required_roles: ['Origin', 'Disruption', 'Catalyst', 'Threshold', 'Ordeal'],
      allowed_variants: [],
      required_edges: [],
    },
    genre: {
      id_prefix: 'SF',
      name: 'Science Fiction',
      genre_id: '06_science_fiction',
      levels: {
        '1': ['SF_N01_PROMISE'],
        '2': ['SF_N10_SPECULATIVE'],
        '3': ['SF_N20_HARD_SF'],
        '4': ['SF_N40_TECH_RULES'],
        '5': ['SF_N60_PREMISE_REVEAL'],
      },
      tone_marker: ['SF_N80_INTELLECTUAL'],
      anti_patterns: ['SF_N90_TECH_MAGIC'],
      hard_constraints: ['SF_N01_PROMISE', 'SF_N10_SPECULATIVE', 'SF_N40_TECH_RULES', 'SF_N60_PREMISE_REVEAL'],
      soft_constraints: ['SF_N20_HARD_SF'],
    },
    global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
    phase_guidelines: [
      { node_id: 'HJ_N01_ORDINARY', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], genre_obligation_links: ['SF_N60_PREMISE_REVEAL'] },
      { node_id: 'HJ_N02_CALL', role: 'Disruption', definition: 'Something disrupts', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], genre_obligation_links: [] },
      { node_id: 'HJ_N03_MENTOR', role: 'Catalyst', definition: 'Hero meets guide', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], genre_obligation_links: [] },
      { node_id: 'HJ_N04_THRESHOLD', role: 'Threshold', definition: 'Crossing the threshold', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], genre_obligation_links: [] },
      { node_id: 'HJ_N05_TESTS', role: 'Ordeal', definition: 'Tests and allies', entry_conditions: [], exit_conditions: [], failure_modes: [], signals_in_text: [], genre_obligation_links: [] },
    ],
    validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' },
    element_requirements: [
      { category: 'character', role_or_type: 'protagonist', label: 'The Hero', definition: 'Main character', required: true, appears_at_nodes: ['HJ_N01_ORDINARY', 'HJ_N02_CALL', 'HJ_N03_MENTOR'] },
      { category: 'character', role_or_type: 'mentor', label: 'The Mentor', definition: 'Guide figure', required: true, appears_at_nodes: ['HJ_N03_MENTOR'] },
      { category: 'place', role_or_type: 'ordinary_world', label: 'Ordinary World', definition: 'Starting location', required: true, appears_at_nodes: ['HJ_N01_ORDINARY'] },
    ],
  }
}

function makeTemplatePack(): TemplatePack {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_03_05_1200',
    generated_at: '2026-03-05T12:00:00Z',
    source_corpus_hash: 'abc123',
    archetype_id: '01_heros_journey',
    genre_id: '06_science_fiction',
    archetype_node_templates: {
      HJ_N01_ORDINARY: {
        node_id: 'HJ_N01_ORDINARY', role: 'Origin', label: 'Ordinary World',
        beat_summary_template: 'Hero in ordinary world',
        scene_obligations: ['SF_N60_PREMISE_REVEAL'],
        required_elements: ['{protagonist}', '{ordinary_world}'],
        signals_to_include: ['Mundane life'], failure_modes_to_avoid: ['Too long'],
        entry_conditions: ['Story opening'], exit_conditions: ['Call received'],
      },
      HJ_N02_CALL: {
        node_id: 'HJ_N02_CALL', role: 'Disruption', label: 'Call to Adventure',
        beat_summary_template: 'Something disrupts the ordinary',
        scene_obligations: [], required_elements: ['{protagonist}'],
        signals_to_include: ['Disrupting event'], failure_modes_to_avoid: ['Too subtle'],
        entry_conditions: [], exit_conditions: [],
      },
      HJ_N03_MENTOR: {
        node_id: 'HJ_N03_MENTOR', role: 'Catalyst', label: 'Meeting the Mentor',
        beat_summary_template: 'Hero meets guide',
        scene_obligations: [], required_elements: ['{protagonist}', '{mentor}'],
        signals_to_include: ['Wise figure'], failure_modes_to_avoid: ['Info dump'],
        entry_conditions: [], exit_conditions: [],
      },
      HJ_N04_THRESHOLD: {
        node_id: 'HJ_N04_THRESHOLD', role: 'Threshold', label: 'Crossing the Threshold',
        beat_summary_template: 'Crossing the threshold',
        scene_obligations: [], required_elements: ['{protagonist}'],
        signals_to_include: [], failure_modes_to_avoid: [],
        entry_conditions: [], exit_conditions: [],
      },
      HJ_N05_TESTS: {
        node_id: 'HJ_N05_TESTS', role: 'Ordeal', label: 'Tests and Allies',
        beat_summary_template: 'Tests and allies',
        scene_obligations: [], required_elements: ['{protagonist}'],
        signals_to_include: [], failure_modes_to_avoid: [],
        entry_conditions: [], exit_conditions: [],
      },
    },
    genre_level_templates: {},
  }
}

describe('backboneAssembler', () => {
  it('creates one beat per spine node', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    expect(backbone.beats).toHaveLength(5)
    expect(backbone.beats[0].archetype_node_id).toBe('HJ_N01_ORDINARY')
    expect(backbone.beats[4].archetype_node_id).toBe('HJ_N05_TESTS')
  })

  it('each beat has at least one scene', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    for (const beat of backbone.beats) {
      expect(beat.scenes.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('Ordeal role gets multiple scenes by default', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    const ordealBeat = backbone.beats.find((b) => b.role === 'Ordeal')
    expect(ordealBeat).toBeDefined()
    expect(ordealBeat!.scenes.length).toBe(2)
  })

  it('assigns all hard constraints somewhere in the backbone', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    expect(backbone.coverage_plan).toBeDefined()
    expect(backbone.coverage_plan!.hard_constraints_assigned).toBe(4)
    expect(backbone.coverage_plan!.hard_constraints_total).toBe(4)
  })

  it('distributes soft constraints across scenes', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    expect(backbone.coverage_plan!.soft_constraints_assigned).toBe(1)
    expect(backbone.coverage_plan!.soft_constraints_total).toBe(1)
  })

  it('generates slots for required elements at each beat', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    // HJ_N01 should have protagonist and ordinary_world slots
    const beat1 = backbone.beats[0]
    const scene1 = beat1.scenes[0]
    expect(scene1.slots).toHaveProperty('protagonist')
    expect(scene1.slots).toHaveProperty('ordinary_world')
    expect(scene1.slots['protagonist'].required).toBe(true)
  })

  it('generates mentor slot at the mentor beat', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    const mentorBeat = backbone.beats.find((b) => b.archetype_node_id === 'HJ_N03_MENTOR')
    expect(mentorBeat).toBeDefined()
    expect(mentorBeat!.scenes[0].slots).toHaveProperty('mentor')
  })

  it('creates chapter partition covering all beats', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    const allBeatIds = backbone.beats.map((b) => b.beat_id)
    const partitionedBeatIds = backbone.chapter_partition.flatMap((ch) => ch.beat_ids)
    expect(new Set(partitionedBeatIds)).toEqual(new Set(allBeatIds))
  })

  it('chapter partition has at least one chapter', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    expect(backbone.chapter_partition.length).toBeGreaterThanOrEqual(1)
  })

  it('every scene appears exactly once across all beats', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    const allSceneIds = backbone.beats.flatMap((b) => b.scenes.map((s) => s.scene_id))
    const unique = new Set(allSceneIds)
    expect(unique.size).toBe(allSceneIds.length)
  })

  it('includes style directives', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack())
    expect(backbone.style_directives).toBeDefined()
    expect(backbone.style_directives.global_voice).toBeTruthy()
  })

  it('accepts style overrides', () => {
    const backbone = assembleBackbone(makeContract(), makeTemplatePack(), {
      styleDirectives: { global_voice: 'first-person present tense' },
    })
    expect(backbone.style_directives.global_voice).toBe('first-person present tense')
  })
})
