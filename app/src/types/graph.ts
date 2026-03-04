/**
 * TypeScript interfaces for archetype and genre graph data.
 * Matches the schema defined in v0_plan.md §1.1–1.2.
 */

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

export type ArchetypeNode = GraphNode

export interface ArchetypeGraph {
  id: string
  name: string
  type: 'archetype'
  description: string
  nodes: ArchetypeNode[]
  edges: GraphEdge[]
}

// --- Genre-specific types ---

export interface GenreNode extends GraphNode {
  level: number | null
}

export interface GenreGraph {
  id: string
  name: string
  type: 'genre'
  description: string
  nodes: GenreNode[]
  edges: GraphEdge[]
}

// --- Unified graph type ---

export type StoryGraph = ArchetypeGraph | GenreGraph

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
