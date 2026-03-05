/**
 * Episode Writer: extends the standard writer prompt with lore context
 * for series-mode episode generation.
 *
 * Adds to the writer prompt:
 * - Lore context block: key characters, their current state, relationships, knowledge
 * - Canon history summary: brief recap of recent canon episodes
 * - Plot thread context: active threads and their last status
 * - World rules: established facts the writer must respect
 * - Overarching arc context: where the series is in the macro arc
 */

import type { LLMMessage } from '../agents/llmAdapter.ts'
import type {
  StoryContract,
  StoryPlan,
  Scene,
  Beat,
} from '../artifacts/types.ts'
import { buildWriterPrompt } from '../agents/writerAgent.ts'
import type {
  StoryLore,
  EpisodeArcContext,
  LoreCharacter,
  CanonTimeline,
} from './types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EpisodeWriterContext {
  lore: StoryLore
  episodeContext: EpisodeArcContext
  canonTimeline: CanonTimeline
  /** Maximum number of recent episodes to include in the recap. */
  maxRecentEpisodes?: number
}

/**
 * Build a lore-aware writer prompt for an episode scene.
 *
 * Extends the standard prompt with lore context injected between
 * the system message and user message.
 */
export function buildEpisodeWriterPrompt(
  scene: Scene,
  beat: Beat,
  contract: StoryContract,
  episodeWriterContext: EpisodeWriterContext,
  plan?: StoryPlan | null,
  priorScenes?: Scene[],
): LLMMessage[] {
  const { lore, episodeContext, canonTimeline, maxRecentEpisodes = 5 } = episodeWriterContext

  // 1. Get the standard prompt
  const baseMessages = buildWriterPrompt(scene, beat, contract, plan, priorScenes)

  // 2. Build the lore context block
  const loreBlock = buildLoreContextBlock(lore, episodeContext, canonTimeline, maxRecentEpisodes)

  // 3. Insert lore context as a system message between the existing system and user messages
  const systemMsg = baseMessages[0]  // system
  const userMsg = baseMessages[1]    // user

  return [
    {
      ...systemMsg,
      content: systemMsg.content + '\n\n' + loreBlock,
    },
    userMsg,
  ]
}

// ---------------------------------------------------------------------------
// Lore context block
// ---------------------------------------------------------------------------

function buildLoreContextBlock(
  lore: StoryLore,
  episodeContext: EpisodeArcContext,
  canonTimeline: CanonTimeline,
  maxRecentEpisodes: number,
): string {
  const sections: string[] = ['=== SERIES LORE CONTEXT ===']

  // 1. Overarching arc context
  sections.push(buildArcSection(episodeContext))

  // 2. Canon history recap
  sections.push(buildCanonRecap(canonTimeline, maxRecentEpisodes))

  // 3. Key characters
  sections.push(buildCharacterSection(lore))

  // 4. Active plot threads
  sections.push(buildThreadSection(episodeContext))

  // 5. World rules
  sections.push(buildWorldRulesSection(lore))

  // 6. Continuity notes
  sections.push(buildContinuitySection(lore))

  sections.push('=== END LORE CONTEXT ===')

  return sections.join('\n\n')
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildArcSection(episodeContext: EpisodeArcContext): string {
  const guidelines = episodeContext.overarching_phase_guidelines
  const lines = [
    '--- Overarching Arc ---',
    `Current phase: ${guidelines.role} (${guidelines.node_id})`,
    `Definition: ${guidelines.definition}`,
    `Entry conditions: ${guidelines.entry_conditions.join('; ') || 'none'}`,
    `Exit conditions: ${guidelines.exit_conditions.join('; ') || 'none'}`,
  ]
  if (episodeContext.arc_advancement_target) {
    lines.push(`!! This episode should advance the arc to: ${episodeContext.arc_advancement_target}`)
  }
  return lines.join('\n')
}

function buildCanonRecap(canonTimeline: CanonTimeline, maxRecent: number): string {
  const episodes = canonTimeline.episodes
  if (episodes.length === 0) {
    return '--- Canon History ---\nThis is the first episode. No prior canon.'
  }

  const recent = episodes.slice(-maxRecent)
  const lines = [
    `--- Canon History (${episodes.length} episode${episodes.length > 1 ? 's' : ''} total, showing last ${recent.length}) ---`,
  ]
  for (const ep of recent) {
    lines.push(`  EP ${ep.slot}: "${ep.title}" [Phase: ${ep.overarching_phase}]`)
  }
  return lines.join('\n')
}

function buildCharacterSection(lore: StoryLore): string {
  if (lore.characters.length === 0) {
    return '--- Characters ---\nNo established characters.'
  }

  const lines = ['--- Characters ---']
  const living = lore.characters.filter((c) => c.status === 'alive')
  const dead = lore.characters.filter((c) => c.status === 'dead')

  for (const char of living) {
    lines.push(formatCharacter(char))
  }

  if (dead.length > 0) {
    lines.push(`Deceased: ${dead.map((c) => `${c.name} (${c.role})`).join(', ')}`)
  }

  return lines.join('\n')
}

function formatCharacter(char: LoreCharacter): string {
  const parts = [`  ${char.name} [${char.role}] — ${char.description ?? 'no description'}`]

  if (char.traits.length > 0) {
    parts.push(`    Traits: ${char.traits.join(', ')}`)
  }
  if (char.motivations.length > 0) {
    parts.push(`    Motivations: ${char.motivations.join(', ')}`)
  }
  if (char.knowledge.length > 0) {
    parts.push(`    Knows: ${char.knowledge.join('; ')}`)
  }
  if (char.possessions.length > 0) {
    parts.push(`    Possesses: ${char.possessions.join(', ')}`)
  }
  if (char.current_location) {
    parts.push(`    Location: ${char.current_location}`)
  }
  if (char.relationships.length > 0) {
    const rels = char.relationships
      .filter((r) => r.current_state === 'active')
      .map((r) => `${r.type} with ${r.target_id}`)
    if (rels.length > 0) {
      parts.push(`    Relationships: ${rels.join(', ')}`)
    }
  }

  return parts.join('\n')
}

function buildThreadSection(episodeContext: EpisodeArcContext): string {
  const threads = episodeContext.open_plot_threads
  if (threads.length === 0) {
    return '--- Active Plot Threads ---\nNo active threads.'
  }

  const lines = ['--- Active Plot Threads ---']
  for (const tp of episodeContext.thread_priorities) {
    const thread = threads.find((t) => t.id === tp.thread_id)
    if (!thread) continue
    lines.push(`  [${thread.urgency.toUpperCase()}] "${thread.title}" — ${tp.action}`)
    lines.push(`    ${thread.description}`)
    if (thread.related_characters.length > 0) {
      lines.push(`    Involves: ${thread.related_characters.join(', ')}`)
    }
  }

  // Also show threads not in priorities (for awareness)
  const priorityIds = new Set(episodeContext.thread_priorities.map((tp) => tp.thread_id))
  const unprioritized = threads.filter((t) => !priorityIds.has(t.id))
  if (unprioritized.length > 0) {
    lines.push('  Other open threads (not prioritized for this episode):')
    for (const t of unprioritized) {
      lines.push(`    - "${t.title}" [${t.urgency}]`)
    }
  }

  return lines.join('\n')
}

function buildWorldRulesSection(lore: StoryLore): string {
  if (lore.world_rules.length === 0) {
    return '--- World Rules ---\nNo established world rules.'
  }

  const lines = ['--- World Rules (MUST NOT violate) ---']
  for (const rule of lore.world_rules) {
    lines.push(`  - ${rule.rule}`)
  }
  return lines.join('\n')
}

function buildContinuitySection(lore: StoryLore): string {
  const notes: string[] = []

  // Dead characters
  const dead = lore.characters.filter((c) => c.status === 'dead')
  if (dead.length > 0) {
    notes.push(`DEAD (cannot appear alive): ${dead.map((c) => c.name).join(', ')}`)
  }

  // Destroyed places
  const destroyed = lore.places.filter((p) => p.status === 'destroyed')
  if (destroyed.length > 0) {
    notes.push(`DESTROYED (cannot be used as settings): ${destroyed.map((p) => p.name).join(', ')}`)
  }

  // Resolved threads
  const resolved = lore.plot_threads.filter((t) => t.status === 'resolved')
  if (resolved.length > 0) {
    notes.push(`RESOLVED (cannot be reopened): ${resolved.map((t) => t.title).join(', ')}`)
  }

  if (notes.length === 0) {
    return '--- Continuity Notes ---\nNo continuity restrictions.'
  }

  return ['--- Continuity Notes ---', ...notes.map((n) => `  ${n}`)].join('\n')
}
