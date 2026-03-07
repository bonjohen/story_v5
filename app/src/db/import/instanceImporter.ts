/**
 * Instance Importer — maps StoryInstance data into SQLite rows.
 */

import type { Database } from 'sql.js'
import type { StoryInstance } from '../../instance/types.ts'
import { createStory } from '../repository/storyRepo.ts'
import { createEntity } from '../repository/entityRepo.ts'
import { createRelationship } from '../repository/relationshipRepo.ts'
import { createScene } from '../repository/sceneRepo.ts'
import { getTermByKey, recordTermUsage } from '../repository/vocabularyRepo.ts'
import type { EntityType } from '../types.ts'

export function importStoryInstance(
  db: Database,
  instance: StoryInstance,
  projectId: string,
): { storyId: string; entities: number; relationships: number; scenes: number; termUsages: number } {
  const meta = instance.metadata
  const lore = instance.lore

  // Create story row
  const story = createStory(db, {
    project_id: projectId,
    story_key: meta.instance_id,
    title: meta.title,
    summary: meta.description,
    status: 'active',
    archetype_id: meta.archetype_id,
    genre_id: meta.genre_id,
  })
  const storyId = story.story_id

  let entityCount = 0
  let relCount = 0
  let sceneCount = 0
  let termUsages = 0

  // Map to track lore IDs -> entity DB IDs
  const entityIdMap = new Map<string, string>()

  // --- Characters ---
  for (const ch of lore.characters) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'character',
      name: ch.name,
      short_description: ch.description,
      role_label: ch.role,
      status: ch.status === 'dead' ? 'archived' : 'active',
      json_data: JSON.stringify({
        aliases: ch.aliases,
        traits: ch.traits,
        motivations: ch.motivations,
        arc_type: ch.arc_type,
        knowledge: ch.knowledge,
        possessions: ch.possessions,
        arc_milestones: ch.arc_milestones,
      }),
    })
    entityIdMap.set(ch.id, entity.entity_id)
    entityCount++

    // Record character_role term usage
    termUsages += linkTerm(db, 'character_role', ch.role, 'entity', entity.entity_id, 'assigned_role', storyId)
  }

  // --- Places ---
  for (const pl of lore.places) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'location',
      name: pl.name,
      short_description: pl.description,
      role_label: pl.type,
      status: pl.status === 'destroyed' ? 'archived' : 'active',
      json_data: JSON.stringify({
        aliases: pl.aliases,
        rules: pl.rules,
        atmosphere: pl.atmosphere,
        connections: pl.connections,
        events_here: pl.events_here,
      }),
    })
    entityIdMap.set(pl.id, entity.entity_id)
    entityCount++

    termUsages += linkTerm(db, 'place_type', pl.type, 'entity', entity.entity_id, 'assigned_type', storyId)
  }

  // --- Objects ---
  for (const obj of lore.objects) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'item',
      name: obj.name,
      short_description: obj.description,
      role_label: obj.type,
      status: obj.status === 'destroyed' ? 'archived' : 'active',
      json_data: JSON.stringify({
        aliases: obj.aliases,
        significance: obj.significance,
        rules: obj.rules,
        current_holder: obj.current_holder,
        custody_history: obj.custody_history,
      }),
    })
    entityIdMap.set(obj.id, entity.entity_id)
    entityCount++

    termUsages += linkTerm(db, 'object_type', obj.type, 'entity', entity.entity_id, 'assigned_type', storyId)
  }

  // --- Factions ---
  for (const fac of lore.factions) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'faction',
      name: fac.name,
      short_description: fac.description,
      status: fac.status === 'disbanded' || fac.status === 'destroyed' ? 'archived' : 'active',
      json_data: JSON.stringify({
        aliases: fac.aliases,
        type: fac.type,
        goals: fac.goals,
        members: fac.members,
        relationships: fac.relationships,
      }),
    })
    entityIdMap.set(fac.id, entity.entity_id)
    entityCount++
  }

  // --- Plot Threads (as entity type 'thread') ---
  for (const thread of lore.plot_threads) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'thread',
      name: thread.title,
      short_description: thread.description,
      status: thread.status === 'resolved' ? 'approved' : thread.status === 'abandoned' ? 'archived' : 'active',
      json_data: JSON.stringify({
        urgency: thread.urgency,
        related_characters: thread.related_characters,
        related_places: thread.related_places,
        related_objects: thread.related_objects,
        resolution_conditions: thread.resolution_conditions,
        anti_patterns: thread.anti_patterns,
      }),
    })
    entityIdMap.set(thread.id, entity.entity_id)
    entityCount++
  }

  // --- World Rules (as entity type 'rule') ---
  for (const rule of lore.world_rules) {
    const entity = createEntity(db, {
      story_id: storyId,
      entity_type: 'rule',
      name: rule.rule.slice(0, 80),
      short_description: rule.rule,
      json_data: JSON.stringify({ source: rule.source }),
    })
    entityIdMap.set(rule.id, entity.entity_id)
    entityCount++
  }

  // --- Character Relationships ---
  for (const ch of lore.characters) {
    const fromId = entityIdMap.get(ch.id)
    if (!fromId) continue
    for (const rel of ch.relationships) {
      const toId = entityIdMap.get(rel.target_id)
      if (!toId) continue
      createRelationship(db, {
        story_id: storyId,
        from_entity_id: fromId,
        to_entity_id: toId,
        relationship_type: rel.type,
        status: rel.current_state === 'active' ? 'active' : 'archived',
        notes: rel.description,
        json_data: JSON.stringify({
          established_in: rel.established_in,
          evolved_in: rel.evolved_in,
        }),
      })
      relCount++

      termUsages += linkTerm(db, 'relationship_type', rel.type, 'relationship', fromId, 'assigned_type', storyId)
    }
  }

  // --- Event Log (as scenes of type 'event') ---
  for (let i = 0; i < lore.event_log.length; i++) {
    const evt = lore.event_log[i]
    createScene(db, {
      story_id: storyId,
      title: evt.description.slice(0, 80),
      summary: evt.description,
      scene_type: 'event',
      timeline_order: i,
      json_data: JSON.stringify({
        event_id: evt.event_id,
        episode_id: evt.episode_id,
        participants: evt.participants,
        consequences: evt.consequences,
      }),
    })
    sceneCount++
  }

  return { storyId, entities: entityCount, relationships: relCount, scenes: sceneCount, termUsages }
}

/** Link an entity to a vocabulary term if the term exists. Returns 1 if linked, 0 if not. */
function linkTerm(
  db: Database,
  domainId: string,
  termKey: string,
  objectType: string,
  objectId: string,
  usageRole: string,
  storyId: string,
): number {
  const term = getTermByKey(db, domainId, termKey)
  if (!term) return 0
  recordTermUsage(db, {
    term_id: term.term_id,
    object_type: objectType,
    object_id: objectId,
    usage_role: usageRole,
    story_id: storyId,
  })
  return 1
}

// Re-export EntityType for use in other importers
export type { EntityType }
