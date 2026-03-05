/**
 * Template Compiler: deterministically extracts reusable templates from the
 * corpus for a given archetype + genre selection. No LLM calls.
 *
 * Input:  LoadedCorpus, SelectionResult, StoryContract
 * Output: TemplatePack
 */

import type { GenreNode, GraphNode } from '../../types/graph.ts'
import { isGenreGraph } from '../../graph-engine/normalizer.ts'
import type {
  SelectionResult,
  StoryContract,
  LoadedCorpus,
  TemplatePack,
  ArchetypeNodeTemplate,
  GenreLevelTemplate,
  ToneGuidance,
  AntiPatternGuidance,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile a TemplatePack from the corpus for the given selection and contract.
 * Deterministic: same inputs always produce the same output.
 */
export function compileTemplatePack(
  selection: SelectionResult,
  contract: StoryContract,
  corpus: LoadedCorpus,
): TemplatePack {
  const archetypeGraph = corpus.archetypeGraphs.get(selection.primary_archetype)
  if (!archetypeGraph) {
    throw new Error(`Archetype not found: ${selection.primary_archetype}`)
  }

  const genreGraph = corpus.genreGraphs.get(selection.primary_genre)
  if (!genreGraph || !isGenreGraph(genreGraph)) {
    throw new Error(`Genre not found: ${selection.primary_genre}`)
  }

  const archetypeNodeTemplates = buildArchetypeNodeTemplates(
    archetypeGraph.nodes,
    contract,
  )

  const genreLevelTemplates = buildGenreLevelTemplates(
    genreGraph.nodes as GenreNode[],
  )

  const toneGuidance = buildToneGuidance(
    genreGraph.nodes as GenreNode[],
    selection,
  )

  const antiPatternGuidance = buildAntiPatternGuidance(
    genreGraph.nodes as GenreNode[],
  )

  return {
    schema_version: '1.0.0',
    run_id: selection.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: corpus.corpusHash,
    archetype_id: selection.primary_archetype,
    genre_id: selection.primary_genre,
    archetype_node_templates: archetypeNodeTemplates,
    genre_level_templates: genreLevelTemplates,
    ...(toneGuidance ? { tone_guidance: toneGuidance } : {}),
    ...(antiPatternGuidance.length > 0 ? { anti_pattern_guidance: antiPatternGuidance } : {}),
  }
}

// ---------------------------------------------------------------------------
// Archetype node templates
// ---------------------------------------------------------------------------

function buildArchetypeNodeTemplates(
  nodes: GraphNode[],
  contract: StoryContract,
): Record<string, ArchetypeNodeTemplate> {
  const templates: Record<string, ArchetypeNodeTemplate> = {}

  // Only template spine nodes (number < 50)
  const spineNodes = nodes.filter((n) => {
    const num = extractNodeNumber(n.node_id)
    return num < 50
  })

  for (const node of spineNodes) {
    const guideline = contract.phase_guidelines.find(
      (g) => g.node_id === node.node_id,
    )

    // Build beat summary template from definition + entry/exit conditions
    const entryConditions = toArray(node.entry_conditions)
    const exitConditions = toArray(node.exit_conditions)
    const beatSummary = buildBeatSummaryTemplate(node, entryConditions, exitConditions)

    // Extract required elements from contract element_requirements
    const requiredElements = (contract.element_requirements ?? [])
      .filter((er) => er.appears_at_nodes.includes(node.node_id))
      .map((er) => `{${er.role_or_type}}`)

    // Scene obligations from genre obligation links
    const sceneObligations = guideline?.genre_obligation_links ?? []

    templates[node.node_id] = {
      node_id: node.node_id,
      role: node.role,
      label: node.label,
      beat_summary_template: beatSummary,
      scene_obligations: sceneObligations,
      required_elements: requiredElements,
      signals_to_include: toArray(node.signals_in_text),
      failure_modes_to_avoid: toArray(node.failure_modes),
      entry_conditions: entryConditions,
      exit_conditions: exitConditions,
    }
  }

  return templates
}

/**
 * Build a composable beat summary template from node fields.
 */
function buildBeatSummaryTemplate(
  node: GraphNode,
  entryConditions: string[],
  exitConditions: string[],
): string {
  const parts: string[] = [node.definition]

  if (entryConditions.length > 0) {
    parts.push(`Preconditions: ${entryConditions.join('; ')}`)
  }
  if (exitConditions.length > 0) {
    parts.push(`Must achieve: ${exitConditions.join('; ')}`)
  }

  return parts.join(' | ')
}

// ---------------------------------------------------------------------------
// Genre level templates
// ---------------------------------------------------------------------------

function buildGenreLevelTemplates(
  nodes: GenreNode[],
): Record<string, GenreLevelTemplate> {
  const templates: Record<string, GenreLevelTemplate> = {}

  for (const node of nodes) {
    // Determine node type
    let nodeType: 'spine' | 'tone_marker' | 'anti_pattern' = 'spine'
    if (node.role === 'Tone Marker') nodeType = 'tone_marker'
    else if (node.role === 'Anti-Pattern') nodeType = 'anti_pattern'

    // Skip tone markers and anti-patterns — they get separate guidance blocks
    if (nodeType !== 'spine') continue

    const severity = (node as GenreNode & { severity?: string }).severity as 'hard' | 'soft' | undefined
    if (!severity) continue

    // Build constraint template from definition
    const constraintTemplate = node.definition

    // Build binding rules from entry/exit conditions
    const bindingRules: string[] = []
    for (const ec of toArray(node.entry_conditions)) {
      bindingRules.push(`Requires: ${ec}`)
    }
    for (const ec of toArray(node.exit_conditions)) {
      bindingRules.push(`Ensures: ${ec}`)
    }

    // Extract anti-patterns from failure modes
    const antiPatternsToBlock = toArray(node.failure_modes)

    templates[node.node_id] = {
      node_id: node.node_id,
      level: node.level,
      label: node.label,
      severity,
      node_type: nodeType,
      constraint_template: constraintTemplate,
      binding_rules: bindingRules,
      ...(antiPatternsToBlock.length > 0 ? { anti_patterns_to_block: antiPatternsToBlock } : {}),
    }
  }

  return templates
}

// ---------------------------------------------------------------------------
// Tone guidance
// ---------------------------------------------------------------------------

function buildToneGuidance(
  nodes: GenreNode[],
  selection: SelectionResult,
): ToneGuidance | undefined {
  const toneNode = nodes.find((n) => n.role === 'Tone Marker')
  if (!toneNode) return undefined

  const directives: string[] = [
    toneNode.definition,
    ...toArray(toneNode.signals_in_text),
  ]

  return {
    tone_marker_id: toneNode.node_id,
    tone_description: toneNode.label,
    directives,
  }
}

// ---------------------------------------------------------------------------
// Anti-pattern guidance
// ---------------------------------------------------------------------------

function buildAntiPatternGuidance(
  nodes: GenreNode[],
): AntiPatternGuidance[] {
  return nodes
    .filter((n) => n.role === 'Anti-Pattern')
    .map((n) => ({
      node_id: n.node_id,
      label: n.label,
      description: n.definition,
    }))
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function extractNodeNumber(nodeId: string): number {
  const match = nodeId.match(/_N(\d{2})_/)
  return match ? parseInt(match[1], 10) : 0
}

function toArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.length > 0) return [value]
  return []
}
