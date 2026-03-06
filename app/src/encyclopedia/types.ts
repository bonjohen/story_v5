/**
 * Encyclopedia types — World Anvil-style browseable article system.
 */

export type ArticleCategory = 'Character' | 'Place' | 'Object' | 'Faction' | 'Event' | 'World Rule'

export interface Article {
  id: string
  title: string
  category: ArticleCategory
  content: string                    // markdown
  linked_entity_id: string           // source entity id in lore
  linked_scenes?: string[]
  backlinks?: string[]               // ids of articles that reference this one
}
