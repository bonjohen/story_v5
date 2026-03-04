/**
 * TypeScript interfaces for archetype and genre graph data.
 * Matches the schema defined in v0_plan.md §1.1–1.2.
 */

// --- Node role controlled vocabularies ---

export type ArchetypeNodeRole =
  | 'Origin'
  | 'Disruption'
  | 'Commitment'
  | 'Catalyst'
  | 'Threshold'
  | 'Trial'
  | 'Escalation'
  | 'Crisis'
  | 'Descent'
  | 'Transformation'
  | 'Revelation'
  | 'Irreversible Cost'
  | 'Resolution'
  | 'Reckoning'

export type GenreNodeRole =
  | 'Genre Promise'
  | 'Core Constraint'
  | 'Subgenre Pattern'
  | 'World/Setting Rules'
  | 'Scene Obligations'
  | 'Tone Marker'
  | 'Anti-Pattern'

// --- Flexible field type (some graphs use strings, others use string arrays) ---

export type StringOrArray = string | string[]

// --- Shared base types ---

export interface GraphNode {
  node_id: string
  label: string
  role: string
  definition: string
  entry_conditions: StringOrArray
  exit_conditions: StringOrArray
  typical_variants: StringOrArray
  failure_modes: StringOrArray
  signals_in_text: StringOrArray
}

export interface GraphEdge {
  edge_id: string
  from: string
  to: string
  label: string
  meaning: string
  preconditions: StringOrArray
  effects_on_stakes: StringOrArray
  effects_on_character: StringOrArray
  common_alternatives: StringOrArray
  anti_patterns: StringOrArray
}

// --- Archetype-specific types ---

export interface ArchetypeNode extends GraphNode {
  role: ArchetypeNodeRole | string
}

export interface ArchetypeEdge extends GraphEdge {}

export interface ArchetypeGraph {
  id: string
  name: string
  type: 'archetype'
  description: string
  nodes: ArchetypeNode[]
  edges: ArchetypeEdge[]
}

// --- Genre-specific types ---

export interface GenreNode extends GraphNode {
  role: GenreNodeRole | string
  level: number | null
}

export interface GenreEdge extends GraphEdge {}

export interface GenreGraph {
  id: string
  name: string
  type: 'genre'
  description: string
  nodes: GenreNode[]
  edges: GenreEdge[]
}

// --- Unified graph type ---

export type StoryGraph = ArchetypeGraph | GenreGraph
export type StoryNode = ArchetypeNode | GenreNode
export type StoryEdge = ArchetypeEdge | GenreEdge

// --- Graph metadata (for data index/manifest) ---

export interface GraphMetadata {
  id: string
  name: string
  type: 'archetype' | 'genre'
  prefix: string
  nodeCount: number
  edgeCount: number
  filePath: string
  hasNarrative: boolean
  hasExamples: boolean
}

export interface DataManifest {
  generated: string
  archetypes: GraphMetadata[]
  genres: GraphMetadata[]
  totals: {
    archetypes: number
    genres: number
    totalNodes: number
    totalEdges: number
  }
}
