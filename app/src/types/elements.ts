/**
 * TypeScript interfaces for Story Elements — the concrete things that populate a story.
 * Covers both template level (archetype patterns) and instance level (specific stories).
 * See docs/story_elements_and_timelines.md §3–4 for the full specification.
 */

// --- Controlled vocabulary type unions ---

export type CharacterRole =
  | 'protagonist'
  | 'antagonist'
  | 'mentor'
  | 'ally'
  | 'herald'
  | 'threshold_guardian'
  | 'shadow'
  | 'trickster'
  | 'shapeshifter'
  | 'love_interest'
  | 'foil'
  | 'confidant'
  | 'comic_relief'

export type PlaceType =
  | 'ordinary_world'
  | 'threshold'
  | 'special_world'
  | 'sanctuary'
  | 'stronghold'
  | 'wasteland'
  | 'crossroads'
  | 'underworld'
  | 'summit'
  | 'home'

export type ObjectType =
  | 'weapon'
  | 'talisman'
  | 'document'
  | 'treasure'
  | 'mcguffin'
  | 'symbol'
  | 'tool'
  | 'key'
  | 'vessel'
  | 'relic'

export type RelationshipType =
  | 'ally'
  | 'rival'
  | 'mentor_student'
  | 'parent_child'
  | 'romantic'
  | 'nemesis'
  | 'servant_master'
  | 'sibling'
  | 'betrayer'
  | 'guardian'

export type ArcType =
  | 'transformative'
  | 'steadfast'
  | 'tragic'
  | 'corrupted'
  | 'redemptive'
  | null

export type FactionType =
  | 'kingdom'
  | 'guild'
  | 'family'
  | 'army'
  | 'cult'
  | 'corporation'
  | 'species'

export type PlaceConnectionType =
  | 'contains'
  | 'borders'
  | 'passage_to'
  | 'portal_to'

// --- Template level: what roles does this archetype pattern call for? ---

export interface CharacterTemplate {
  role: CharacterRole
  label: string
  definition: string
  appears_at_nodes: string[]
  required: boolean
}

export interface PlaceTemplate {
  type: PlaceType
  label: string
  definition: string
  appears_at_nodes: string[]
  required: boolean
}

export interface ObjectTemplate {
  type: ObjectType
  label: string
  definition: string
  appears_at_nodes: string[]
  required: boolean
}

export interface ElementTemplates {
  characters: CharacterTemplate[]
  places: PlaceTemplate[]
  objects: ObjectTemplate[]
}

export interface ArchetypeElements {
  archetype_id: string
  element_templates: ElementTemplates
}

// --- Instance level: who specifically fills these roles? ---

export interface Relationship {
  target_id: string
  type: RelationshipType
  description: string
}

export interface CharacterInstance {
  id: string
  name: string
  aliases?: string[]
  role: CharacterRole
  description?: string
  traits: string[]
  motivations: string[]
  arc_type: ArcType
  relationships: Relationship[]
}

export interface PlaceConnection {
  target_id: string
  type: PlaceConnectionType
}

export interface PlaceInstance {
  id: string
  name: string
  aliases?: string[]
  type: PlaceType
  description: string
  rules?: string[]
  atmosphere?: string
  connections?: PlaceConnection[]
}

export interface ObjectInstance {
  id: string
  name: string
  aliases?: string[]
  type: ObjectType
  description?: string
  significance: string
  rules?: string[]
  current_holder?: string
}

export interface EventConsequence {
  entity_id: string
  change_type: string
  description: string
}

export interface EventInstance {
  id: string
  name: string
  description: string
  archetype_node?: string
  participants: string[]
  location?: string
  objects_involved?: string[]
  consequences: EventConsequence[]
  preconditions?: string[]
}

export interface FactionMember {
  character_id: string
  rank?: string
  role_in_faction?: string
}

export interface FactionRelationship {
  target_id: string
  type: 'allied' | 'hostile' | 'vassal' | 'rival' | 'neutral'
}

export interface FactionInstance {
  id: string
  name: string
  aliases?: string[]
  type: FactionType
  description: string
  goals: string[]
  members: FactionMember[]
  relationships: FactionRelationship[]
}

export interface ExampleElements {
  story_id: string
  archetype_id: string
  characters: CharacterInstance[]
  places: PlaceInstance[]
  objects: ObjectInstance[]
  events?: EventInstance[]
  factions?: FactionInstance[]
}
