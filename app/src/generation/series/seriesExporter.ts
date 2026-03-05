/**
 * Series Exporter — export series data in various formats.
 *
 * Supports exporting:
 * - Full series as a combined markdown document
 * - Individual episodes as standalone documents
 * - Series lore as a reference document
 * - Canon timeline as a summary document
 */

import type {
  Series,
  StoryLore,
  Episode,
  CanonTimeline,
  LoreCharacter,
  PlotThread,
} from './types.ts'

// ---------------------------------------------------------------------------
// Full series export
// ---------------------------------------------------------------------------

export interface SeriesExportOptions {
  /** Include lore summary at the beginning */
  includeLoreSummary?: boolean
  /** Include plot thread status */
  includeThreadStatus?: boolean
  /** Include arc progress overview */
  includeArcProgress?: boolean
  /** Max episodes to include (0 = all) */
  maxEpisodes?: number
}

/**
 * Export the full series as a combined markdown document.
 * Scene content is passed in separately since it's stored as separate files.
 */
export function exportSeriesToMarkdown(
  series: Series,
  episodeScenes: Map<string, string[]>,
  options: SeriesExportOptions = {},
): string {
  const {
    includeLoreSummary = true,
    includeThreadStatus = true,
    includeArcProgress = true,
    maxEpisodes = 0,
  } = options

  const lines: string[] = []

  // Title page
  lines.push(`# ${series.title}`)
  lines.push('')
  lines.push(`*${series.description}*`)
  lines.push('')
  lines.push(`Genre: ${series.theme_tone.genre_name}`)
  lines.push(`Archetype: ${series.overarching_arc.archetype_name}`)
  lines.push(`Episodes: ${series.episode_count}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Arc progress
  if (includeArcProgress) {
    lines.push('## Arc Progress')
    lines.push('')
    const arc = series.overarching_arc
    const totalPhases = arc.phase_history.length + arc.remaining_phases.length
    const completed = arc.phase_history.filter((p) => p.exited_at_episode).length
    lines.push(`**${arc.archetype_name}**: Phase ${completed + 1} of ${totalPhases}`)
    lines.push(`Current phase: ${arc.current_phase}`)
    if (arc.remaining_phases.length > 0) {
      lines.push(`Remaining: ${arc.remaining_phases.join(' → ')}`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Lore summary
  if (includeLoreSummary) {
    lines.push('## Story Lore Summary')
    lines.push('')
    lines.push(exportLoreToMarkdown(series.lore))
    lines.push('---')
    lines.push('')
  }

  // Thread status
  if (includeThreadStatus) {
    const activeThreads = series.lore.plot_threads.filter(
      (t) => t.status === 'open' || t.status === 'progressing',
    )
    if (activeThreads.length > 0) {
      lines.push('## Active Plot Threads')
      lines.push('')
      for (const thread of activeThreads) {
        lines.push(`- **${thread.title}** [${thread.urgency}] — ${thread.description}`)
      }
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  // Episodes
  const canonEpisodes = series.canon_timeline.episodes
  const episodesToExport = maxEpisodes > 0
    ? canonEpisodes.slice(0, maxEpisodes)
    : canonEpisodes

  for (const entry of episodesToExport) {
    const episode = series.episode_index.episodes.find(
      (e) => e.episode_id === entry.episode_id,
    )
    lines.push(`## Episode ${entry.slot}: ${entry.title}`)
    lines.push('')
    if (episode) {
      lines.push(`*${episode.synopsis}*`)
      lines.push('')
      lines.push(`Archetype: ${episode.episodic_archetype_id} | Phase: ${entry.overarching_phase}`)
      lines.push('')
    }

    // Scene content
    const scenes = episodeScenes.get(entry.episode_id)
    if (scenes && scenes.length > 0) {
      for (const scene of scenes) {
        lines.push(scene)
        lines.push('')
      }
    } else {
      lines.push('*Scene content not available.*')
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Individual episode export
// ---------------------------------------------------------------------------

/**
 * Export a single episode as a standalone markdown document.
 */
export function exportEpisodeToMarkdown(
  series: Series,
  episode: Episode,
  scenes: string[],
): string {
  const lines: string[] = []

  lines.push(`# ${episode.title}`)
  lines.push('')
  lines.push(`*From: ${series.title}*`)
  lines.push('')
  lines.push(`Episode ${episode.slot_number} | ${episode.episodic_archetype_id}`)
  lines.push(`Canon status: ${episode.canon_status}`)
  lines.push('')
  lines.push(`> ${episode.synopsis}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Key characters
  if (episode.summary.characters_featured.length > 0) {
    lines.push(`**Characters:** ${episode.summary.characters_featured.join(', ')}`)
    lines.push('')
  }

  // Key events
  if (episode.summary.key_events.length > 0) {
    lines.push('**Key events:**')
    for (const event of episode.summary.key_events) {
      lines.push(`- ${event}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  // Scenes
  for (const scene of scenes) {
    lines.push(scene)
    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Lore export
// ---------------------------------------------------------------------------

/**
 * Export the story lore as a markdown reference document.
 */
export function exportLoreToMarkdown(lore: StoryLore): string {
  const lines: string[] = []

  // Characters
  lines.push('### Characters')
  lines.push('')
  if (lore.characters.length === 0) {
    lines.push('*No characters recorded.*')
  } else {
    const alive = lore.characters.filter((c) => c.status === 'alive')
    const other = lore.characters.filter((c) => c.status !== 'alive')
    for (const c of alive) {
      lines.push(formatCharacterEntry(c))
    }
    if (other.length > 0) {
      lines.push('')
      lines.push('**Deceased / Other:**')
      for (const c of other) {
        lines.push(formatCharacterEntry(c))
      }
    }
  }
  lines.push('')

  // Places
  lines.push('### Places')
  lines.push('')
  if (lore.places.length === 0) {
    lines.push('*No places recorded.*')
  } else {
    for (const p of lore.places) {
      lines.push(`- **${p.name}** (${p.type}) [${p.status}] — ${p.description || 'No description'}`)
    }
  }
  lines.push('')

  // Objects
  lines.push('### Objects')
  lines.push('')
  if (lore.objects.length === 0) {
    lines.push('*No objects recorded.*')
  } else {
    for (const o of lore.objects) {
      const holder = o.current_holder ? ` (held by: ${o.current_holder})` : ''
      lines.push(`- **${o.name}** (${o.type}) [${o.status}]${holder} — ${o.significance}`)
    }
  }
  lines.push('')

  // World rules
  if (lore.world_rules.length > 0) {
    lines.push('### World Rules')
    lines.push('')
    for (const r of lore.world_rules) {
      lines.push(`- ${r.rule} *(${r.source}, established in ${r.established_in})*`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function formatCharacterEntry(c: LoreCharacter): string {
  const location = c.current_location ? ` @ ${c.current_location}` : ''
  const traits = c.traits.length > 0 ? ` — ${c.traits.join(', ')}` : ''
  return `- **${c.name}** (${c.role}) [${c.status}]${location}${traits}`
}

// ---------------------------------------------------------------------------
// Timeline export
// ---------------------------------------------------------------------------

/**
 * Export the canon timeline as a markdown summary.
 */
export function exportTimelineToMarkdown(
  series: Series,
): string {
  const lines: string[] = []

  lines.push(`# ${series.title} — Canon Timeline`)
  lines.push('')
  lines.push(`${series.episode_count} canon episodes | Archetype: ${series.overarching_arc.archetype_name}`)
  lines.push('')

  if (series.canon_timeline.episodes.length === 0) {
    lines.push('*No canon episodes yet.*')
    return lines.join('\n')
  }

  let currentPhase = ''
  for (const entry of series.canon_timeline.episodes) {
    if (entry.overarching_phase !== currentPhase) {
      currentPhase = entry.overarching_phase
      lines.push('')
      lines.push(`### Phase: ${currentPhase}`)
      lines.push('')
    }

    const episode = series.episode_index.episodes.find(
      (e) => e.episode_id === entry.episode_id,
    )
    const synopsis = episode?.synopsis ?? ''
    lines.push(`**${entry.slot}. ${entry.title}** — ${synopsis}`)
  }

  return lines.join('\n')
}
