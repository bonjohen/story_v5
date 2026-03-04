/**
 * Contract Compiler: builds a StoryContract artifact from a SelectionResult
 * and the loaded corpus. Pure computation — no LLM calls.
 *
 * The contract defines boundaries, guidelines, and exclusions that
 * constrain all downstream generation steps.
 */

import type { GenreNode } from '../../types/graph.ts'
import { isGenreGraph } from '../../graph-engine/normalizer.ts'
import type {
  SelectionResult,
  StoryRequest,
  StoryContract,
  ContractArchetype,
  ContractGenre,
  GlobalBoundaries,
  PhaseGuideline,
  ValidationPolicy,
  LoadedCorpus,
  GenerationConfig,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a StoryContract from the selection result, request, and corpus.
 */
export function compileContract(
  selection: SelectionResult,
  request: StoryRequest,
  corpus: LoadedCorpus,
  config: GenerationConfig,
): StoryContract {
  const archetypeGraph = corpus.archetypeGraphs.get(selection.primary_archetype)
  if (!archetypeGraph) {
    throw new Error(`Archetype not found: ${selection.primary_archetype}`)
  }

  const genreGraph = corpus.genreGraphs.get(selection.primary_genre)
  if (!genreGraph || !isGenreGraph(genreGraph)) {
    throw new Error(`Genre not found: ${selection.primary_genre}`)
  }

  // Load variant nodes if available
  const variantGraph = corpus.variantGraphs.get(selection.primary_archetype)

  // Build contract sections
  const archetype = buildArchetypeSection(archetypeGraph, variantGraph)
  const genre = buildGenreSection(genreGraph)
  const globalBoundaries = buildGlobalBoundaries(genreGraph, request)
  const phaseGuidelines = buildPhaseGuidelines(archetypeGraph, genreGraph)
  const validationPolicy = buildValidationPolicy(config)

  return {
    schema_version: '1.0.0',
    run_id: selection.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: selection.source_corpus_hash,
    archetype,
    genre,
    global_boundaries: globalBoundaries,
    phase_guidelines: phaseGuidelines,
    validation_policy: validationPolicy,
  }
}

// ---------------------------------------------------------------------------
// Archetype section
// ---------------------------------------------------------------------------

function buildArchetypeSection(
  graph: { id: string; name: string; nodes: Array<{ node_id: string; role: string }>; edges: Array<{ edge_id: string }> },
  variantGraph?: { nodes: Array<{ node_id: string }> } | null,
): ContractArchetype {
  const prefix = extractPrefix(graph.nodes[0]?.node_id ?? '')

  // Spine nodes = all non-variant nodes (number < 50)
  const spineNodes = graph.nodes
    .filter((n) => {
      const num = extractNodeNumber(n.node_id)
      return num < 50
    })
    .map((n) => n.node_id)

  // Required roles = unique roles from spine nodes
  const requiredRoles = [...new Set(graph.nodes.map((n) => n.role))]

  // Variant nodes from variants.json
  const allowedVariants = variantGraph
    ? variantGraph.nodes.map((n) => n.node_id)
    : []

  // Required edges (all edges in the main graph)
  const requiredEdges = graph.edges.map((e) => e.edge_id)

  return {
    id_prefix: prefix,
    name: graph.name,
    archetype_id: graph.id,
    spine_nodes: spineNodes,
    required_roles: requiredRoles,
    allowed_variants: allowedVariants,
    required_edges: requiredEdges,
  }
}

// ---------------------------------------------------------------------------
// Genre section
// ---------------------------------------------------------------------------

function buildGenreSection(
  graph: { id: string; name: string; nodes: GenreNode[]; edges: Array<{ edge_id: string; severity?: string }> },
): ContractGenre {
  const prefix = extractPrefix(graph.nodes[0]?.node_id ?? '')

  // Group nodes by level
  const levels: Record<string, string[]> = {}
  for (const node of graph.nodes) {
    if (node.level !== null && node.level >= 1 && node.level <= 5) {
      const key = String(node.level)
      if (!levels[key]) levels[key] = []
      levels[key].push(node.node_id)
    }
  }

  // Extract tone markers and anti-patterns
  const toneMarkers = graph.nodes
    .filter((n) => n.role === 'Tone Marker')
    .map((n) => n.node_id)

  const antiPatterns = graph.nodes
    .filter((n) => n.role === 'Anti-Pattern')
    .map((n) => n.node_id)

  // Partition constraints by severity
  const genreNodes = graph.nodes as Array<GenreNode & { severity?: string }>
  const hardConstraints = genreNodes
    .filter((n) => (n.severity) === 'hard')
    .map((n) => n.node_id)

  const softConstraints = genreNodes
    .filter((n) => (n.severity) === 'soft')
    .map((n) => n.node_id)

  return {
    id_prefix: prefix,
    name: graph.name,
    genre_id: graph.id,
    levels,
    tone_marker: toneMarkers,
    anti_patterns: antiPatterns,
    hard_constraints: hardConstraints,
    soft_constraints: softConstraints,
  }
}

// ---------------------------------------------------------------------------
// Global boundaries
// ---------------------------------------------------------------------------

function buildGlobalBoundaries(
  genreGraph: { nodes: GenreNode[] },
  request: StoryRequest,
): GlobalBoundaries {
  // "Musts" = genre promise + hard constraints
  const musts: string[] = []
  for (const node of genreGraph.nodes) {
    const gn = node as GenreNode & { severity?: string }
    if (gn.role === 'Genre Promise') {
      musts.push(`Genre promise: ${gn.definition}`)
    }
    if (gn.severity === 'hard' && gn.role !== 'Anti-Pattern' && gn.role !== 'Genre Promise') {
      musts.push(`${gn.label}: ${gn.definition}`)
    }
  }
  // User must_include
  for (const item of request.constraints.must_include) {
    musts.push(`User requirement: ${item}`)
  }

  // "Must nots" = anti-patterns + user exclusions
  const mustNots: string[] = []
  for (const node of genreGraph.nodes) {
    if (node.role === 'Anti-Pattern') {
      mustNots.push(`Anti-pattern: ${node.label} — ${node.definition}`)
    }
  }
  // Prohibited elements from genre edges with "prohibits element" meaning
  for (const item of request.constraints.must_exclude) {
    mustNots.push(`User exclusion: ${item}`)
  }

  return {
    musts,
    must_nots: mustNots,
    content_limits: request.audience.content_limits,
    style_limits: [],
  }
}

// ---------------------------------------------------------------------------
// Phase guidelines
// ---------------------------------------------------------------------------

function buildPhaseGuidelines(
  archetypeGraph: { nodes: Array<{ node_id: string; role: string; definition: string; entry_conditions: string | string[]; exit_conditions: string | string[]; failure_modes: string | string[]; signals_in_text: string | string[] }> },
  genreGraph: { nodes: GenreNode[] },
): PhaseGuideline[] {
  // Get Level 5 (Scene Obligation) nodes for linking
  const sceneObligations = genreGraph.nodes
    .filter((n) => n.level === 5 || n.role === 'Scene Obligation' || n.role === 'Scene Obligations')
    .map((n) => n.node_id)

  return archetypeGraph.nodes.map((node, index) => {
    // Distribute genre obligations across phases (simple round-robin)
    const linkedObligations: string[] = []
    if (sceneObligations.length > 0) {
      const idx = index % sceneObligations.length
      linkedObligations.push(sceneObligations[idx])
    }

    return {
      node_id: node.node_id,
      role: node.role,
      definition: node.definition,
      entry_conditions: toArray(node.entry_conditions),
      exit_conditions: toArray(node.exit_conditions),
      failure_modes: toArray(node.failure_modes),
      signals_in_text: toArray(node.signals_in_text),
      genre_obligation_links: linkedObligations,
    }
  })
}

// ---------------------------------------------------------------------------
// Validation policy
// ---------------------------------------------------------------------------

function buildValidationPolicy(config: GenerationConfig): ValidationPolicy {
  return {
    hard_constraints_required: true,
    anti_patterns_blocking: true,
    tone_global: config.tone_policy.mode === 'block',
    entry_exit_required: true,
    signals_required: config.signals_policy.mode === 'block' ? 'hard' : 'soft',
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function extractPrefix(nodeId: string): string {
  const match = nodeId.match(/^([A-Z]{2})_/)
  return match ? match[1] : ''
}

function extractNodeNumber(nodeId: string): number {
  const match = nodeId.match(/_N(\d{2})_/)
  return match ? parseInt(match[1], 10) : 0
}

function toArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.length > 0) return [value]
  return []
}
