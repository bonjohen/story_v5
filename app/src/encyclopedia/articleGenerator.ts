/**
 * Article Generator — deterministic article generation from StoryLore entities.
 * Produces readable markdown articles with cross-links.
 */

import type { Article, ArticleCategory } from './types.ts'
import type {
  LoreCharacter,
  LorePlace,
  LoreObject,
  LoreFaction,
  WorldRule,
  LoreEvent,
  StoryLore,
} from '../generation/series/types.ts'

function genArticleId(category: ArticleCategory, entityId: string): string {
  return `article_${category.toLowerCase()}_${entityId}`
}

function characterArticle(c: LoreCharacter): Article {
  const lines: string[] = []
  lines.push(`# ${c.name}`)
  lines.push('')
  if (c.description) lines.push(c.description, '')
  lines.push(`**Role:** ${c.role}`)
  lines.push(`**Status:** ${c.status}`)
  if (c.arc_type) lines.push(`**Arc:** ${c.arc_type}`)
  lines.push('')

  if (c.traits.length > 0) {
    lines.push('## Traits', '', c.traits.map((t) => `- ${t}`).join('\n'), '')
  }
  if (c.motivations.length > 0) {
    lines.push('## Motivations', '', c.motivations.map((m) => `- ${m}`).join('\n'), '')
  }
  if (c.knowledge.length > 0) {
    lines.push('## Knowledge', '', c.knowledge.map((k) => `- ${k}`).join('\n'), '')
  }
  if (c.possessions.length > 0) {
    lines.push('## Possessions', '', c.possessions.map((p) => `- ${p}`).join('\n'), '')
  }
  if (c.relationships.length > 0) {
    lines.push('## Relationships', '')
    for (const r of c.relationships) {
      lines.push(`- **${r.type}** with ${r.target_id}: ${r.description}`)
    }
    lines.push('')
  }

  return {
    id: genArticleId('Character', c.id),
    title: c.name,
    category: 'Character',
    content: lines.join('\n'),
    linked_entity_id: c.id,
  }
}

function placeArticle(p: LorePlace): Article {
  const lines: string[] = []
  lines.push(`# ${p.name}`, '')
  lines.push(p.description, '')
  lines.push(`**Type:** ${p.type}`)
  lines.push(`**Status:** ${p.status}`)
  if (p.atmosphere) lines.push(`**Atmosphere:** ${p.atmosphere}`)
  lines.push('')

  if (p.rules && p.rules.length > 0) {
    lines.push('## Rules', '', p.rules.map((r) => `- ${r}`).join('\n'), '')
  }
  if (p.connections && p.connections.length > 0) {
    lines.push('## Connections', '')
    for (const c of p.connections) {
      lines.push(`- ${c.type} to ${c.target_id}`)
    }
    lines.push('')
  }

  return {
    id: genArticleId('Place', p.id),
    title: p.name,
    category: 'Place',
    content: lines.join('\n'),
    linked_entity_id: p.id,
  }
}

function objectArticle(o: LoreObject): Article {
  const lines: string[] = []
  lines.push(`# ${o.name}`, '')
  if (o.description) lines.push(o.description, '')
  lines.push(`**Type:** ${o.type}`)
  lines.push(`**Status:** ${o.status}`)
  lines.push(`**Significance:** ${o.significance}`)
  if (o.current_holder) lines.push(`**Current Holder:** ${o.current_holder}`)
  lines.push('')

  if (o.custody_history.length > 0) {
    lines.push('## Custody History', '')
    for (const entry of o.custody_history) {
      lines.push(`- ${entry.holder_id} (${entry.how})`)
    }
    lines.push('')
  }

  return {
    id: genArticleId('Object', o.id),
    title: o.name,
    category: 'Object',
    content: lines.join('\n'),
    linked_entity_id: o.id,
  }
}

function factionArticle(f: LoreFaction): Article {
  const lines: string[] = []
  lines.push(`# ${f.name}`, '')
  lines.push(f.description, '')
  lines.push(`**Type:** ${f.type}`)
  lines.push(`**Status:** ${f.status}`)
  lines.push('')

  if (f.goals.length > 0) {
    lines.push('## Goals', '', f.goals.map((g) => `- ${g}`).join('\n'), '')
  }
  if (f.members.length > 0) {
    lines.push('## Members', '')
    for (const m of f.members) {
      lines.push(`- ${m.character_id}${m.rank ? ` (${m.rank})` : ''}${m.role_in_faction ? ` — ${m.role_in_faction}` : ''}`)
    }
    lines.push('')
  }

  return {
    id: genArticleId('Faction', f.id),
    title: f.name,
    category: 'Faction',
    content: lines.join('\n'),
    linked_entity_id: f.id,
  }
}

function eventArticle(e: LoreEvent): Article {
  const lines: string[] = []
  lines.push(`# ${e.description.slice(0, 60)}`, '')
  lines.push(e.description, '')
  if (e.participants.length > 0) {
    lines.push('**Participants:** ' + e.participants.join(', '))
  }
  if (e.consequences.length > 0) {
    lines.push('', '## Consequences', '', e.consequences.map((c) => `- ${c}`).join('\n'))
  }

  return {
    id: genArticleId('Event', e.event_id),
    title: e.description.slice(0, 60),
    category: 'Event',
    content: lines.join('\n'),
    linked_entity_id: e.event_id,
  }
}

function worldRuleArticle(r: WorldRule): Article {
  return {
    id: genArticleId('World Rule', r.id),
    title: r.rule.slice(0, 60),
    category: 'World Rule',
    content: `# ${r.rule}\n\n**Source:** ${r.source}\n`,
    linked_entity_id: r.id,
  }
}

/**
 * Generate all articles from a StoryLore.
 */
export function generateArticles(lore: StoryLore): Article[] {
  const articles: Article[] = []

  for (const c of lore.characters) articles.push(characterArticle(c))
  for (const p of lore.places) articles.push(placeArticle(p))
  for (const o of lore.objects) articles.push(objectArticle(o))
  for (const f of lore.factions) articles.push(factionArticle(f))
  for (const e of lore.event_log) articles.push(eventArticle(e))
  for (const r of lore.world_rules) articles.push(worldRuleArticle(r))

  // Compute backlinks
  const titleIndex = new Map<string, string>()
  for (const a of articles) titleIndex.set(a.title.toLowerCase(), a.id)

  for (const a of articles) {
    const backlinks: string[] = []
    for (const other of articles) {
      if (other.id === a.id) continue
      if (other.content.toLowerCase().includes(a.title.toLowerCase()) && a.title.length > 2) {
        backlinks.push(other.id)
      }
    }
    a.backlinks = backlinks
  }

  return articles
}
