/**
 * TypeScript interfaces for Genre Element Constraints — genre-level requirements
 * on what story elements must be present for a genre to function.
 * See docs/story_elements_and_timelines.md §6.2 for the full specification.
 */

import type { CharacterRole, PlaceType, ObjectType, RelationshipType } from './elements'

// --- Constraint severity ---

export type ConstraintSeverity = 'required' | 'recommended' | 'optional'

// --- Character constraints ---

export interface CharacterRoleConstraint {
  role: CharacterRole
  severity: ConstraintSeverity
  description: string
  min_count?: number
  max_count?: number
}

// --- Relationship constraints ---

export interface RelationshipConstraint {
  type: RelationshipType
  severity: ConstraintSeverity
  description: string
  between_roles?: [CharacterRole, CharacterRole]
}

// --- Place constraints ---

export interface PlaceTypeConstraint {
  type: PlaceType
  severity: ConstraintSeverity
  description: string
}

// --- Object constraints ---

export interface ObjectTypeConstraint {
  type: ObjectType
  severity: ConstraintSeverity
  description: string
}

// --- Element rules (genre-specific behavioral constraints) ---

export interface ElementRule {
  rule_id: string
  description: string
  severity: ConstraintSeverity
  applies_to: 'characters' | 'places' | 'objects' | 'relationships'
  testable_condition: string
}

// --- Top-level genre element constraints file ---

export interface GenreElementConstraints {
  genre_id: string
  genre_name: string
  description: string
  character_constraints: CharacterRoleConstraint[]
  relationship_constraints: RelationshipConstraint[]
  place_constraints: PlaceTypeConstraint[]
  object_constraints: ObjectTypeConstraint[]
  element_rules: ElementRule[]
}
