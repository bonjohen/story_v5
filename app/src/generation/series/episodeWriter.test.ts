/**
 * Tests for the lore-aware episode writer prompt builder.
 */
import { describe, it, expect } from 'vitest'
import { buildEpisodeWriterPrompt } from './episodeWriter.ts'
import type { EpisodeWriterContext } from './episodeWriter.ts'
import type { StoryLore, EpisodeArcContext, CanonTimeline } from './types.ts'
import type { StoryContract, Scene, Beat, PhaseGuideline } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeScene(): Scene {
  return {
    scene_id: 'S01',
    beat_id: 'B01',
    setting: 'place_village',
    characters: ['char_arion'],
    scene_goal: 'Establish the world',
    archetype_trace: { node_id: 'HJ_N01', edge_in: null, edge_out: 'HJ_E01' },
    genre_obligations: [],
    constraints_checklist: { hard: [], soft: [], must_not: [] },
  }
}

function makeBeat(): Beat {
  return {
    beat_id: 'B01',
    archetype_node_id: 'HJ_N01',
    summary: '[Departure] The hero in their normal world',
    required_exit_conditions: ['A disruption arrives'],
    target_emotional_scores: { tension: 0.2, hope: 0.7, fear: 0.1, resolution: 0 },
  }
}

function makeContract(): StoryContract {
  return {
    schema_version: '1.0.0',
    run_id: 'RUN_2026_01_01_0001',
    generated_at: '2026-01-01T00:00:00Z',
    source_corpus_hash: 'test',
    archetype: { id_prefix: 'HJ', name: "Hero's Journey", archetype_id: '01_heros_journey', spine_nodes: [], required_roles: [], allowed_variants: [], required_edges: [] },
    genre: { id_prefix: 'SF', name: 'Science Fiction', genre_id: '06_science_fiction', levels: {}, tone_marker: ['wonder'], anti_patterns: [], hard_constraints: [], soft_constraints: [] },
    global_boundaries: { musts: [], must_nots: [], content_limits: [], style_limits: [] },
    phase_guidelines: [],
    validation_policy: { hard_constraints_required: true, anti_patterns_blocking: true, tone_global: false, entry_exit_required: true, signals_required: 'soft' },
  }
}

function makeLore(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: '2026-01-01T00:00:00Z',
    last_updated_by: 'EP_001_a',
    characters: [
      {
        id: 'char_arion', name: 'Arion', role: 'protagonist',
        traits: ['brave', 'curious'], motivations: ['find the truth'],
        arc_type: 'transformative', relationships: [],
        status: 'alive', introduced_in: 'EP_001_a', last_appeared_in: 'EP_001_a',
        current_location: 'place_village',
        knowledge: ['The prophecy exists', 'The temple is in the north'],
        possessions: ['obj_amulet'], arc_milestones: [],
      },
      {
        id: 'char_fallen', name: 'Fallen Guard', role: 'ally',
        traits: ['loyal'], motivations: ['protect'],
        arc_type: null, relationships: [],
        status: 'dead', introduced_in: 'EP_001_a', died_in: 'EP_002_a',
        last_appeared_in: 'EP_002_a',
        knowledge: [], possessions: [], arc_milestones: [],
      },
    ],
    places: [
      { id: 'place_ruins', name: 'Ancient Ruins', type: 'wasteland', description: 'Devastated area', introduced_in: 'EP_001_a', last_featured_in: 'EP_001_a', status: 'destroyed', events_here: [] },
    ],
    objects: [],
    factions: [],
    plot_threads: [
      { id: 'PT_001', title: 'The Mystery', description: 'Solved', status: 'resolved', urgency: 'medium', introduced_in: 'EP_001_a', progressed_in: [], resolved_in: 'EP_002_a', related_characters: [] },
    ],
    world_rules: [
      { id: 'WR_001', rule: 'Magic does not exist in this world', established_in: 'EP_001_a', source: 'genre' },
    ],
    event_log: [],
  }
}

function makePhaseGuideline(): PhaseGuideline {
  return {
    node_id: 'HJ_N01', role: 'Departure',
    definition: 'The hero in their normal world',
    entry_conditions: ['Hero exists'], exit_conditions: ['Disruption arrives'],
    failure_modes: [], signals_in_text: [], genre_obligation_links: [],
  }
}

function makeEpisodeContext(): EpisodeArcContext {
  return {
    overarching_phase: 'HJ_N01',
    overarching_phase_guidelines: makePhaseGuideline(),
    episodic_archetype_id: '01_heros_journey',
    thread_priorities: [
      { thread_id: 'PT_002', action: 'advance' },
    ],
    open_plot_threads: [
      { id: 'PT_002', title: 'The Great Quest', description: 'Find the temple', status: 'open', urgency: 'high', introduced_in: 'EP_001_a', progressed_in: [], related_characters: ['char_arion'] },
    ],
  }
}

function makeCanonTimeline(): CanonTimeline {
  return {
    episodes: [
      { slot: 1, episode_id: 'EP_001_a', title: 'The Beginning', canonized_at: '2026-01-01T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP001' },
      { slot: 2, episode_id: 'EP_002_a', title: 'The Fall', canonized_at: '2026-01-02T00:00:00Z', overarching_phase: 'HJ_N01', snapshot_id: 'SNAP_EP002' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildEpisodeWriterPrompt', () => {
  it('includes lore context in the system message', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('SERIES BIBLE CONTEXT')
    expect(messages[1].role).toBe('user')
  })

  it('includes character details in lore context', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    const systemContent = messages[0].content

    expect(systemContent).toContain('Arion')
    expect(systemContent).toContain('protagonist')
    expect(systemContent).toContain('brave')
    expect(systemContent).toContain('The prophecy exists')
  })

  it('lists dead characters', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    expect(messages[0].content).toContain('Fallen Guard')
    expect(messages[0].content).toContain('DEAD')
  })

  it('includes world rules', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    expect(messages[0].content).toContain('Magic does not exist')
  })

  it('includes canon history recap', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    expect(messages[0].content).toContain('The Beginning')
    expect(messages[0].content).toContain('The Fall')
    expect(messages[0].content).toContain('2 episodes total')
  })

  it('includes plot thread priorities', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    expect(messages[0].content).toContain('The Great Quest')
    expect(messages[0].content).toContain('advance')
  })

  it('includes overarching arc context', () => {
    const ctx: EpisodeWriterContext = {
      lore: makeLore(),
      episodeContext: makeEpisodeContext(),
      canonTimeline: makeCanonTimeline(),
    }

    const messages = buildEpisodeWriterPrompt(makeScene(), makeBeat(), makeContract(), ctx)
    expect(messages[0].content).toContain('Departure')
    expect(messages[0].content).toContain('Disruption arrives')
  })
})
