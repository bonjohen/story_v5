/**
 * Story Instance types — unified model for both standalone and series stories.
 *
 * A StoryInstance wraps StoryLore (the canonical entity model from the series
 * system) with metadata about the story itself. This lets standalone stories
 * use the same rich entity model that series episodes accumulate over time.
 *
 * For standalone stories, lore is populated from generation DetailBindings.
 * For series stories, lore is the accumulated series StoryLore snapshot.
 */

import type { StoryLore } from '../generation/series/types.ts'

// ---------------------------------------------------------------------------
// Instance Metadata
// ---------------------------------------------------------------------------

export interface InstanceMetadata {
  instance_id: string
  title: string
  description?: string

  // Structural anchors
  archetype_id?: string
  archetype_name?: string
  genre_id?: string
  genre_name?: string
  secondary_genre_id?: string
  tone_preference?: string

  // Source tracking
  source: 'standalone' | 'series' | 'manual'
  series_id?: string             // if source === 'series'
  run_id?: string                // generation run that produced this
  generation_mode?: string       // 'draft' | 'outline' | etc.

  // Timestamps
  created_at: string             // ISO 8601
  updated_at: string             // ISO 8601
}

// ---------------------------------------------------------------------------
// Story Instance
// ---------------------------------------------------------------------------

export interface StoryInstance {
  metadata: InstanceMetadata
  lore: StoryLore
}

// ---------------------------------------------------------------------------
// Instance Index (for multi-instance management)
// ---------------------------------------------------------------------------

export interface InstanceIndexEntry {
  instance_id: string
  title: string
  source: InstanceMetadata['source']
  archetype_name?: string
  genre_name?: string
  created_at: string
  updated_at: string
  character_count: number
  place_count: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createEmptyLore(): StoryLore {
  return {
    schema_version: '1.0.0',
    last_updated: new Date().toISOString(),
    last_updated_by: 'user',
    characters: [],
    places: [],
    objects: [],
    factions: [],
    plot_threads: [],
    world_rules: [],
    event_log: [],
  }
}

export function createInstance(
  title: string,
  source: InstanceMetadata['source'] = 'manual',
): StoryInstance {
  const now = new Date().toISOString()
  return {
    metadata: {
      instance_id: `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      source,
      created_at: now,
      updated_at: now,
    },
    lore: createEmptyLore(),
  }
}

export function instanceToIndexEntry(inst: StoryInstance): InstanceIndexEntry {
  return {
    instance_id: inst.metadata.instance_id,
    title: inst.metadata.title,
    source: inst.metadata.source,
    archetype_name: inst.metadata.archetype_name,
    genre_name: inst.metadata.genre_name,
    created_at: inst.metadata.created_at,
    updated_at: inst.metadata.updated_at,
    character_count: inst.lore.characters.length,
    place_count: inst.lore.places.length,
  }
}
