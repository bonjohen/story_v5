/**
 * Tests for series manager: thread lifecycle, arc advancement,
 * genre accent selection, and slot management.
 */
import { describe, it, expect } from 'vitest'
import {
  computeThreadAges,
  proposeUrgencyEscalations,
  applyUrgencyEscalations,
  computeThreadHealth,
  suggestThreadPriorities,
  suggestArcAdvancement,
  getNextArcPhase,
  isArcComplete,
  episodesInCurrentPhase,
  getCompatibleAccents,
  isAccentCompatible,
  createEpisodeSlot,
  getOrCreateNextSlot,
  getSeriesStatus,
} from './seriesManager.ts'
import type { StoryLore, CanonTimeline, OverarchingArc, Series, PlotThread } from './types.ts'
import type { LoadedCorpus } from '../artifacts/types.ts'
import type { StoryGraph } from '../../types/graph.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeTimeline(episodes: Array<{ id: string; phase: string }>): CanonTimeline {
  return {
    episodes: episodes.map((e, i) => ({
      slot: i + 1,
      episode_id: e.id,
      title: `Episode ${i + 1}`,
      canonized_at: `2026-01-0${i + 1}T00:00:00Z`,
      overarching_phase: e.phase,
      snapshot_id: `SNAP_EP${String(i + 1).padStart(3, '0')}`,
    })),
  }
}

function makeThread(overrides: Partial<PlotThread> = {}): PlotThread {
  return {
    id: 'PT_001',
    title: 'The Mystery',
    description: 'A mystery',
    status: 'open',
    urgency: 'medium',
    introduced_in: 'EP_001_a',
    progressed_in: [],
    related_characters: [],
    ...overrides,
  }
}

function makeLore(threads: PlotThread[] = []): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'test',
    characters: [
      {
        id: 'char_hero', name: 'Hero', role: 'protagonist',
        traits: ['brave'], motivations: ['save world'],
        arc_type: 'transformative', relationships: [],
        status: 'alive', introduced_in: 'EP_001_a', last_appeared_in: 'EP_003_a',
        knowledge: [], possessions: [], arc_milestones: [],
      },
    ],
    places: [],
    objects: [],
    factions: [],
    plot_threads: threads,
    world_rules: [],
    event_log: [],
  }
}

function makeArc(overrides: Partial<OverarchingArc> = {}): OverarchingArc {
  return {
    archetype_id: '01_heros_journey',
    archetype_name: "Hero's Journey",
    current_phase: 'HJ_N02_CALL',
    phase_history: [
      { node_id: 'HJ_N01_ORDINARY', entered_at_episode: 'EP_001_a', exited_at_episode: 'EP_002_a' },
      { node_id: 'HJ_N02_CALL', entered_at_episode: 'EP_003_a' },
    ],
    remaining_phases: ['HJ_N03_MENTOR', 'HJ_N04_THRESHOLD'],
    advancement_mode: 'hybrid',
    ...overrides,
  }
}

function makeSeries(overrides: Partial<Series> = {}): Series {
  const lore = makeLore([
    makeThread({ id: 'PT_001', title: 'Main Quest', urgency: 'high', status: 'open', introduced_in: 'EP_001_a', progressed_in: ['EP_002_a'] }),
    makeThread({ id: 'PT_002', title: 'Side Quest', urgency: 'low', status: 'open', introduced_in: 'EP_002_a', progressed_in: [] }),
  ])
  const timeline = makeTimeline([
    { id: 'EP_001_a', phase: 'HJ_N01_ORDINARY' },
    { id: 'EP_002_a', phase: 'HJ_N01_ORDINARY' },
    { id: 'EP_003_a', phase: 'HJ_N02_CALL' },
  ])

  return {
    series_id: 'SER_test',
    title: 'Test Series',
    description: 'A test',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
    theme_tone: {
      genre_id: '06_science_fiction', genre_name: 'Science Fiction',
      tone_marker: 'wonder', themes: ['exploration'], mood: 'adventurous',
      content_limits: [], style_notes: [],
    },
    overarching_arc: makeArc(),
    lore,
    canon_timeline: timeline,
    episode_index: { episodes: [] },
    slots: [
      { slot_number: 1, target_arc_phase: 'HJ_N01_ORDINARY', candidates: ['EP_001_a'], canon_episode: 'EP_001_a', status: 'canonized' },
      { slot_number: 2, target_arc_phase: 'HJ_N01_ORDINARY', candidates: ['EP_002_a'], canon_episode: 'EP_002_a', status: 'canonized' },
      { slot_number: 3, target_arc_phase: 'HJ_N02_CALL', candidates: ['EP_003_a'], canon_episode: 'EP_003_a', status: 'canonized' },
    ],
    episode_count: 3,
    total_candidates_generated: 3,
    corpus_hash: 'test',
    ...overrides,
  }
}

function makeArchetypeGraph(): StoryGraph {
  return {
    id: '01_heros_journey',
    name: "Hero's Journey",
    type: 'archetype',
    description: 'test',
    nodes: [
      { node_id: 'HJ_N01_ORDINARY', label: 'Ordinary World', role: 'Origin', definition: 'Hero in ordinary world', entry_conditions: ['Story opening'], exit_conditions: ['Call received', 'World established'], failure_modes: [], signals_in_text: [], typical_variants: [] },
      { node_id: 'HJ_N02_CALL', label: 'Call to Adventure', role: 'Disruption', definition: 'The call', entry_conditions: ['World established'], exit_conditions: ['Call acknowledged', 'Decision to act'], failure_modes: [], signals_in_text: [], typical_variants: [] },
      { node_id: 'HJ_N03_MENTOR', label: 'Mentor', role: 'Preparation', definition: 'Mentor appears', entry_conditions: ['Call accepted'], exit_conditions: ['Hero prepared'], failure_modes: [], signals_in_text: [], typical_variants: [] },
      { node_id: 'HJ_N04_THRESHOLD', label: 'Threshold', role: 'Crossing', definition: 'Cross the threshold', entry_conditions: ['Hero prepared'], exit_conditions: ['Point of no return'], failure_modes: [], signals_in_text: [], typical_variants: [] },
    ],
    edges: [
      { edge_id: 'HJ_E01', from: 'HJ_N01_ORDINARY', to: 'HJ_N02_CALL', label: 'Disruption', meaning: 'catalyst', preconditions: [], effects_on_stakes: '', effects_on_character: '', common_alternatives: [], anti_patterns: [] },
      { edge_id: 'HJ_E02', from: 'HJ_N02_CALL', to: 'HJ_N03_MENTOR', label: 'Acceptance', meaning: 'escalation', preconditions: [], effects_on_stakes: '', effects_on_character: '', common_alternatives: [], anti_patterns: [] },
    ],
  }
}

function makeMinimalCorpus(): LoadedCorpus {
  const archetypeGraphs = new Map<string, StoryGraph>()
  archetypeGraphs.set('01_heros_journey', makeArchetypeGraph())

  const genreGraphs = new Map<string, StoryGraph>()
  genreGraphs.set('06_science_fiction', {
    id: '06_science_fiction', name: 'Science Fiction', type: 'genre', description: '',
    nodes: [], edges: [],
  })
  genreGraphs.set('10_horror', {
    id: '10_horror', name: 'Horror', type: 'genre', description: '',
    nodes: [], edges: [],
  })
  genreGraphs.set('03_comedy', {
    id: '03_comedy', name: 'Comedy', type: 'genre', description: '',
    nodes: [], edges: [],
  })

  return {
    archetypeGraphs,
    genreGraphs,
    variantGraphs: new Map(),
    matrix: { title: '', description: '', archetypes_reference: [], genres: [] },
    toneIntegration: { title: '', description: '', integrations: [] },
    emotionalArcs: { title: '', description: '', archetypes: [] },
    hybridPatterns: { title: '', description: '', hybrids: [] },
    blendingModel: {
      title: '', description: '',
      blends: [
        {
          blend_id: 'sf_x_horror',
          genres: ['06_science_fiction', '10_horror'],
          stability: 'stable',
          dominant_genre: 'horror',
          compatible_constraints: [],
          conflicting_constraints: [],
          tone_synthesis: 'SF horror: technology becomes the threat',
          resolution_strategy: '',
          example_works: [],
        },
        {
          blend_id: 'sf_x_comedy',
          genres: ['06_science_fiction', '03_comedy'],
          stability: 'conditionally_stable',
          dominant_genre: 'science_fiction',
          compatible_constraints: [],
          conflicting_constraints: [],
          tone_synthesis: 'Satirical SF: absurdity of technological progress',
          resolution_strategy: '',
          example_works: [],
        },
      ],
    },
    archetypeNodeRoles: { title: '', description: '' },
    archetypeEdgeMeanings: { title: '', description: '' },
    genreNodeRoles: { title: '', description: '' },
    genreEdgeMeanings: { title: '', description: '' },
    manifest: { generated: '', archetypes: [], genres: [], totals: {} as any },
    corpusHash: 'test',
    archetypeElements: new Map(),
    genreElementConstraints: new Map(),
  } as LoadedCorpus
}

// ---------------------------------------------------------------------------
// Tests: Thread Lifecycle
// ---------------------------------------------------------------------------

describe('thread lifecycle', () => {
  it('computes thread ages correctly', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'HJ_N01' },
      { id: 'EP_002_a', phase: 'HJ_N01' },
      { id: 'EP_003_a', phase: 'HJ_N02' },
    ])
    const lore = makeLore([
      makeThread({
        id: 'PT_001', introduced_in: 'EP_001_a',
        progressed_in: ['EP_002_a'],
      }),
    ])

    const ages = computeThreadAges(lore, timeline)
    expect(ages).toHaveLength(1)
    expect(ages[0].age_in_episodes).toBe(3)
    expect(ages[0].episodes_since_progression).toBe(1)
    expect(ages[0].stalled).toBe(false)
  })

  it('detects stalled threads', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'HJ_N01' },
      { id: 'EP_002_a', phase: 'HJ_N01' },
      { id: 'EP_003_a', phase: 'HJ_N02' },
      { id: 'EP_004_a', phase: 'HJ_N02' },
    ])
    const lore = makeLore([
      makeThread({
        id: 'PT_001', urgency: 'high',
        introduced_in: 'EP_001_a', progressed_in: ['EP_001_a'],
      }),
    ])

    const ages = computeThreadAges(lore, timeline)
    expect(ages[0].stalled).toBe(true)
    expect(ages[0].episodes_since_progression).toBe(3)
  })

  it('proposes urgency escalations', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'P' },
      { id: 'EP_002_a', phase: 'P' },
      { id: 'EP_003_a', phase: 'P' },
      { id: 'EP_004_a', phase: 'P' },
    ])
    const lore = makeLore([
      makeThread({
        id: 'PT_001', urgency: 'low',
        introduced_in: 'EP_001_a', progressed_in: [],
      }),
    ])

    const escalations = proposeUrgencyEscalations(lore, timeline, {
      low_to_medium: 3, medium_to_high: 2, high_to_critical: 2,
    })

    expect(escalations).toHaveLength(1)
    expect(escalations[0].current_urgency).toBe('low')
    expect(escalations[0].proposed_urgency).toBe('medium')
  })

  it('applies escalations immutably', () => {
    const lore = makeLore([
      makeThread({ id: 'PT_001', urgency: 'low' }),
    ])

    const updated = applyUrgencyEscalations(lore, [
      { thread_id: 'PT_001', proposed_urgency: 'medium' },
    ])

    expect(updated.plot_threads[0].urgency).toBe('medium')
    expect(lore.plot_threads[0].urgency).toBe('low') // original unchanged
  })

  it('computes thread health metrics', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'P' },
      { id: 'EP_002_a', phase: 'P' },
      { id: 'EP_003_a', phase: 'P' },
    ])
    const lore = makeLore([
      makeThread({ id: 'PT_001', urgency: 'critical', introduced_in: 'EP_001_a', progressed_in: [] }),
      makeThread({ id: 'PT_002', urgency: 'medium', introduced_in: 'EP_001_a', progressed_in: ['EP_003_a'] }),
    ])

    const health = computeThreadHealth(lore, timeline)
    expect(health.total_open).toBe(2)
    expect(health.critical_count).toBe(1)
    expect(health.recently_progressed).toBe(1) // PT_002 progressed in last episode
    expect(health.health_ratio).toBe(0.5)
  })

  it('suggests thread priorities sorted by urgency', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'P' },
      { id: 'EP_002_a', phase: 'P' },
    ])
    const lore = makeLore([
      makeThread({ id: 'PT_001', urgency: 'low', introduced_in: 'EP_001_a', progressed_in: [] }),
      makeThread({ id: 'PT_002', urgency: 'critical', introduced_in: 'EP_001_a', progressed_in: [] }),
    ])

    const priorities = suggestThreadPriorities(lore, timeline)
    expect(priorities[0].thread_id).toBe('PT_002')
    expect(priorities[0].action).toBe('advance')
  })
})

// ---------------------------------------------------------------------------
// Tests: Arc Phase Advancement
// ---------------------------------------------------------------------------

describe('arc phase advancement', () => {
  it('suggests advancement when enough episodes spent in phase', () => {
    const series = makeSeries()
    const graph = makeArchetypeGraph()

    const suggestion = suggestArcAdvancement(series, graph)
    expect(suggestion.current_phase).toBe('HJ_N02_CALL')
    expect(suggestion.next_phase).toBe('HJ_N03_MENTOR')
  })

  it('returns no advancement when arc is complete', () => {
    const series = makeSeries({
      overarching_arc: makeArc({ remaining_phases: [] }),
    })

    const suggestion = suggestArcAdvancement(series, makeArchetypeGraph())
    expect(suggestion.should_advance).toBe(false)
    expect(suggestion.next_phase).toBeNull()
    expect(suggestion.reasons).toContain('No remaining phases — arc is complete')
  })

  it('getNextArcPhase returns the next remaining phase', () => {
    const arc = makeArc()
    expect(getNextArcPhase(arc)).toBe('HJ_N03_MENTOR')
  })

  it('isArcComplete returns true when no remaining phases', () => {
    expect(isArcComplete(makeArc({ remaining_phases: [] }))).toBe(true)
    expect(isArcComplete(makeArc())).toBe(false)
  })

  it('episodesInCurrentPhase counts correctly', () => {
    const timeline = makeTimeline([
      { id: 'EP_001_a', phase: 'HJ_N01' },
      { id: 'EP_002_a', phase: 'HJ_N02_CALL' },
      { id: 'EP_003_a', phase: 'HJ_N02_CALL' },
    ])
    expect(episodesInCurrentPhase(makeArc(), timeline)).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Tests: Genre Accent Variation
// ---------------------------------------------------------------------------

describe('genre accent variation', () => {
  it('lists compatible accents for primary genre', () => {
    const corpus = makeMinimalCorpus()
    const accents = getCompatibleAccents('06_science_fiction', corpus)

    expect(accents.length).toBe(2)
    expect(accents[0].genre_id).toBe('10_horror')  // stable first
    expect(accents[0].blend_stability).toBe('stable')
    expect(accents[1].genre_id).toBe('03_comedy')
    expect(accents[1].blend_stability).toBe('conditionally_stable')
  })

  it('returns empty for genre with no blends', () => {
    const corpus = makeMinimalCorpus()
    const accents = getCompatibleAccents('01_drama', corpus)
    expect(accents).toHaveLength(0)
  })

  it('validates accent compatibility', () => {
    const corpus = makeMinimalCorpus()

    const result = isAccentCompatible('06_science_fiction', '10_horror', corpus)
    expect(result.compatible).toBe(true)
    expect(result.stability).toBe('stable')
    expect(result.warnings).toHaveLength(0)
  })

  it('warns for unknown accent combination', () => {
    const corpus = makeMinimalCorpus()

    const result = isAccentCompatible('06_science_fiction', '08_romance', corpus)
    expect(result.compatible).toBe(false)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Tests: Slot Management
// ---------------------------------------------------------------------------

describe('slot management', () => {
  it('creates a new episode slot', () => {
    const series = makeSeries()
    const { series: updated, slot } = createEpisodeSlot(series)

    expect(slot.slot_number).toBe(4)
    expect(slot.target_arc_phase).toBe('HJ_N02_CALL')
    expect(slot.status).toBe('generating')
    expect(updated.slots).toHaveLength(4)
  })

  it('creates first slot when no slots exist', () => {
    const series = makeSeries({ slots: [] })
    const { slot } = createEpisodeSlot(series)
    expect(slot.slot_number).toBe(1)
  })

  it('getOrCreateNextSlot returns existing empty slot', () => {
    const series = makeSeries({
      slots: [
        ...makeSeries().slots,
        { slot_number: 4, target_arc_phase: 'HJ_N02_CALL', candidates: [], status: 'generating' },
      ],
    })

    const { slot } = getOrCreateNextSlot(series)
    expect(slot.slot_number).toBe(4) // Existing empty slot
  })

  it('getOrCreateNextSlot creates new when all slots have candidates', () => {
    const series = makeSeries()
    const { slot } = getOrCreateNextSlot(series)
    expect(slot.slot_number).toBe(4) // New slot
  })
})

// ---------------------------------------------------------------------------
// Tests: Series Status
// ---------------------------------------------------------------------------

describe('series status', () => {
  it('returns a complete status summary', () => {
    const series = makeSeries()
    const status = getSeriesStatus(series)

    expect(status.title).toBe('Test Series')
    expect(status.episode_count).toBe(3)
    expect(status.current_arc_phase).toBe('HJ_N02_CALL')
    expect(status.arc_complete).toBe(false)
    expect(status.arc_progress_pct).toBeGreaterThan(0)
    expect(status.next_slot_number).toBe(4)
  })

  it('reports thread health', () => {
    const series = makeSeries()
    const status = getSeriesStatus(series)

    expect(status.open_threads).toBe(2)
    expect(typeof status.thread_health).toBe('string')
  })
})
