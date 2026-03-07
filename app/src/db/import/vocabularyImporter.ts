/**
 * Vocabulary Importer — reads controlled vocabulary JSON files and populates
 * vocabulary_domains and vocabulary_terms tables. Idempotent (uses INSERT OR REPLACE).
 */

import type { Database } from 'sql.js'
import { createDomain, createTerm } from '../repository/vocabularyRepo.ts'

interface DomainSpec {
  domain_id: string
  name: string
  description: string
  source_file: string
  items_key: string
  term_key_field: string
  label_field: string
}

const DOMAIN_SPECS: DomainSpec[] = [
  {
    domain_id: 'character_role',
    name: 'Character Roles',
    description: 'Narrative function roles for characters',
    source_file: 'data/vocabulary/element_roles.json',
    items_key: 'character_roles',
    term_key_field: 'role',
    label_field: 'role',
  },
  {
    domain_id: 'relationship_type',
    name: 'Relationship Types',
    description: 'Directional relationship types between characters',
    source_file: 'data/vocabulary/relationship_types.json',
    items_key: 'relationship_types',
    term_key_field: 'type',
    label_field: 'type',
  },
  {
    domain_id: 'place_type',
    name: 'Place Types',
    description: 'Narrative function types for locations',
    source_file: 'data/vocabulary/place_types.json',
    items_key: 'place_types',
    term_key_field: 'type',
    label_field: 'type',
  },
  {
    domain_id: 'object_type',
    name: 'Object Types',
    description: 'Narrative function types for objects',
    source_file: 'data/vocabulary/object_types.json',
    items_key: 'object_types',
    term_key_field: 'type',
    label_field: 'type',
  },
  {
    domain_id: 'change_type',
    name: 'Change Types',
    description: 'Timeline transition state changes',
    source_file: 'data/vocabulary/element_change_types.json',
    items_key: 'change_types',
    term_key_field: 'type',
    label_field: 'type',
  },
  {
    domain_id: 'archetype_node_role',
    name: 'Archetype Node Roles',
    description: 'Node roles for archetype graphs',
    source_file: 'data/vocabulary/archetype_node_roles.json',
    items_key: 'node_roles',
    term_key_field: 'role',
    label_field: 'role',
  },
  {
    domain_id: 'archetype_edge_meaning',
    name: 'Archetype Edge Meanings',
    description: 'Edge label meanings for archetype graphs',
    source_file: 'data/vocabulary/archetype_edge_vocabulary.json',
    items_key: 'edge_meanings',
    term_key_field: 'label',
    label_field: 'label',
  },
  {
    domain_id: 'genre_node_role',
    name: 'Genre Node Roles',
    description: 'Node roles for genre depth graphs',
    source_file: 'data/vocabulary/genre_node_roles.json',
    items_key: 'node_roles',
    term_key_field: 'role',
    label_field: 'role',
  },
  {
    domain_id: 'genre_edge_meaning',
    name: 'Genre Edge Meanings',
    description: 'Edge label meanings for genre depth graphs',
    source_file: 'data/vocabulary/genre_edge_vocabulary.json',
    items_key: 'edge_meanings',
    term_key_field: 'label',
    label_field: 'label',
  },
]

export async function importVocabulary(db: Database, basePath: string): Promise<{ domains: number; terms: number }> {
  let domainCount = 0
  let termCount = 0

  for (const spec of DOMAIN_SPECS) {
    const url = `${basePath}${spec.source_file}`
    let data: Record<string, unknown>
    try {
      const resp = await fetch(url)
      if (!resp.ok) {
        console.warn(`Vocabulary import: failed to fetch ${url} (${resp.status})`)
        continue
      }
      data = await resp.json() as Record<string, unknown>
    } catch (err) {
      console.warn(`Vocabulary import: error fetching ${url}`, err)
      continue
    }

    createDomain(db, {
      domain_id: spec.domain_id,
      name: spec.name,
      description: spec.description,
      source_file: spec.source_file,
    })
    domainCount++

    const items = data[spec.items_key] as Array<Record<string, unknown>> | undefined
    if (!items) {
      console.warn(`Vocabulary import: no key '${spec.items_key}' in ${url}`)
      continue
    }

    items.forEach((item, index) => {
      const termKey = String(item[spec.term_key_field] ?? '')
      const label = String(item[spec.label_field] ?? termKey)
      const definition = item.definition as string | undefined
      const structuralFunction = (item.structural_function ?? item.structuralFunction) as string | undefined
      const appliesTo = item.applies_to as string[] | undefined

      // Collect extra fields into json_data
      const knownKeys = new Set([spec.term_key_field, spec.label_field, 'definition', 'structural_function', 'applies_to'])
      const extra: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(item)) {
        if (!knownKeys.has(k)) extra[k] = v
      }

      createTerm(db, {
        domain_id: spec.domain_id,
        term_key: termKey,
        label,
        definition,
        structural_function: structuralFunction,
        applies_to: appliesTo,
        sort_order: index,
        json_data: Object.keys(extra).length > 0 ? extra : undefined,
      })
      termCount++
    })
  }

  return { domains: domainCount, terms: termCount }
}
