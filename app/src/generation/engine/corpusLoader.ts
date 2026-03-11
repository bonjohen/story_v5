/**
 * Corpus Loader: loads all graph data, cross-reference files, and vocabularies
 * into a single LoadedCorpus object for the generation pipeline.
 *
 * Uses an abstract DataProvider so the same loader works in browser (fetch)
 * and Node (fs) contexts.
 */

import { parseGraphJson } from '../../graph-engine/normalizer.ts'
import { ARCHETYPE_DIRS, GENRE_DIRS } from '../../graph-engine/dataIndex.ts'
import type { StoryGraph, DataManifest } from '../../types/graph.ts'
import type { ArchetypeElements } from '../../types/elements.ts'
import type { GenreElementConstraints } from '../../types/element-constraints.ts'
import type {
  LoadedCorpus,
  GenreArchetypeMatrix,
  ToneArchetypeIntegration,
  ArchetypeEmotionalArcs,
  VocabularyFile,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Data provider interface (abstract file loading)
// ---------------------------------------------------------------------------

export interface DataProvider {
  /** Load a JSON file and return the parsed object. Path is relative to data root. */
  loadJson(relativePath: string): Promise<unknown>
  /** Check if a file exists at the given relative path. */
  exists(relativePath: string): Promise<boolean>
}

/**
 * Fetch-based data provider for browser context.
 * Loads JSON from the Vite-served /data/ directory.
 */
export class FetchDataProvider implements DataProvider {
  baseUrl: string
  constructor(baseUrl: string = '/data') {
    this.baseUrl = baseUrl
  }

  async loadJson(relativePath: string): Promise<unknown> {
    const url = `${this.baseUrl}/${relativePath}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
    }
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) {
      throw new Error(`Expected JSON for ${url}, got ${contentType}`)
    }
    return response.json() as Promise<unknown>
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${relativePath}`
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) return false
      // SPA fallbacks return 200 with text/html for missing files
      const contentType = response.headers.get('content-type') ?? ''
      return contentType.includes('json')
    } catch {
      return false
    }
  }
}

// ---------------------------------------------------------------------------
// Corpus hash computation
// ---------------------------------------------------------------------------

/**
 * Compute a stable hash from loaded corpus content.
 * Uses a simple djb2-style string hash for determinism without crypto deps.
 */
function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function computeCorpusHash(components: string[]): string {
  const sorted = [...components].sort()
  return hashString(sorted.join('|'))
}

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

export async function loadCorpus(provider: DataProvider): Promise<LoadedCorpus> {
  // Load archetype graphs + other data in parallel (variants depend on archetype graph.json metadata)
  const [archetypeGraphsWithMeta, genreGraphs, archetypeElements, genreElementConstraints] = await Promise.all([
    loadArchetypeGraphs(provider),
    loadGenreGraphs(provider),
    loadArchetypeElements(provider),
    loadGenreElementConstraints(provider),
  ])
  const archetypeGraphs = archetypeGraphsWithMeta.graphs
  // Load variants only for archetypes that declare a variant_file (avoids 404s for the rest)
  const variantGraphs = await loadVariantGraphs(provider, archetypeGraphsWithMeta.variantDirs)

  // Load cross-reference files in parallel
  const [matrix, toneIntegration, emotionalArcs] =
    await Promise.all([
      provider.loadJson('cross_references/genre_archetype_matrix.json') as Promise<GenreArchetypeMatrix>,
      provider.loadJson('cross_references/tone_archetype_integration.json') as Promise<ToneArchetypeIntegration>,
      provider.loadJson('cross_references/archetype_emotional_arcs.json') as Promise<ArchetypeEmotionalArcs>,
    ])

  // Load vocabularies in parallel
  const [archetypeNodeRoles, archetypeEdgeMeanings, genreNodeRoles, genreEdgeMeanings] =
    await Promise.all([
      provider.loadJson('vocabulary/archetype_node_roles.json') as Promise<VocabularyFile>,
      provider.loadJson('vocabulary/archetype_edge_vocabulary.json') as Promise<VocabularyFile>,
      provider.loadJson('vocabulary/genre_node_roles.json') as Promise<VocabularyFile>,
      provider.loadJson('vocabulary/genre_edge_vocabulary.json') as Promise<VocabularyFile>,
    ])

  // Load manifest
  const manifest = (await provider.loadJson('cross_references/manifest.json')) as DataManifest

  // Compute corpus hash from graph IDs + node counts (lightweight but deterministic)
  const hashComponents: string[] = []
  for (const [dir, graph] of archetypeGraphs) {
    hashComponents.push(`a:${dir}:${graph.nodes.length}:${graph.edges.length}`)
  }
  for (const [dir, graph] of genreGraphs) {
    hashComponents.push(`g:${dir}:${graph.nodes.length}:${graph.edges.length}`)
  }
  hashComponents.push(`matrix:${matrix.genres.length}`)
  hashComponents.push(`tone:${toneIntegration.integrations.length}`)
  hashComponents.push(`arcs:${emotionalArcs.archetypes.length}`)
  hashComponents.push(`elements:${archetypeElements.size}`)
  hashComponents.push(`genreConstraints:${genreElementConstraints.size}`)

  const corpusHash = computeCorpusHash(hashComponents)

  return {
    archetypeGraphs,
    genreGraphs,
    variantGraphs,
    matrix,
    toneIntegration,
    emotionalArcs,
    archetypeNodeRoles,
    archetypeEdgeMeanings,
    genreNodeRoles,
    genreEdgeMeanings,
    manifest,
    corpusHash,
    archetypeElements,
    genreElementConstraints,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function loadArchetypeGraphs(
  provider: DataProvider,
): Promise<{ graphs: Map<string, StoryGraph>; variantDirs: string[] }> {
  const graphs = new Map<string, StoryGraph>()
  const variantDirs: string[] = []
  const results = await Promise.all(
    ARCHETYPE_DIRS.map(async (dir) => {
      const raw = await provider.loadJson(`archetypes/${dir}/graph.json`) as Record<string, unknown>
      return { dir, graph: parseGraphJson(raw), hasVariants: typeof raw.variant_file === 'string' && raw.variant_file !== '' }
    }),
  )
  for (const { dir, graph, hasVariants } of results) {
    graphs.set(dir, graph)
    if (hasVariants) variantDirs.push(dir)
  }
  return { graphs, variantDirs }
}

async function loadGenreGraphs(
  provider: DataProvider,
): Promise<Map<string, StoryGraph>> {
  const map = new Map<string, StoryGraph>()
  const results = await Promise.all(
    GENRE_DIRS.map(async (dir) => {
      const raw = await provider.loadJson(`genres/${dir}/graph.json`)
      return { dir, graph: parseGraphJson(raw) }
    }),
  )
  for (const { dir, graph } of results) {
    map.set(dir, graph)
  }
  return map
}

async function loadVariantGraphs(
  provider: DataProvider,
  variantDirs: string[],
): Promise<Map<string, StoryGraph>> {
  const map = new Map<string, StoryGraph>()
  if (variantDirs.length === 0) return map
  const results = await Promise.all(
    variantDirs.map(async (dir) => {
      const path = `archetypes/${dir}/variants.json`
      const raw = await provider.loadJson(path) as Record<string, unknown>
      // Variant files use parent_graph instead of id/name/type — wrap for parseGraphJson
      const wrapped = {
        id: `${dir}_variants`,
        name: `${(raw.parent_graph as string) ?? dir} variants`,
        type: 'archetype',
        description: (raw.description as string) ?? '',
        nodes: raw.nodes ?? [],
        edges: raw.edges ?? [],
      }
      return { dir, graph: parseGraphJson(wrapped) }
    }),
  )
  for (const result of results) {
    map.set(result.dir, result.graph)
  }
  return map
}

async function loadArchetypeElements(
  provider: DataProvider,
): Promise<Map<string, ArchetypeElements>> {
  const map = new Map<string, ArchetypeElements>()
  const results = await Promise.all(
    ARCHETYPE_DIRS.map(async (dir) => {
      try {
        const raw = await provider.loadJson(`archetypes/${dir}/elements.json`) as ArchetypeElements
        return { dir, elements: raw }
      } catch {
        return null // File doesn't exist — skip silently
      }
    }),
  )
  for (const result of results) {
    if (result) map.set(result.dir, result.elements)
  }
  return map
}

async function loadGenreElementConstraints(
  provider: DataProvider,
): Promise<Map<string, GenreElementConstraints>> {
  const map = new Map<string, GenreElementConstraints>()
  const results = await Promise.all(
    GENRE_DIRS.map(async (dir) => {
      try {
        const raw = await provider.loadJson(`genres/${dir}/elements.json`) as GenreElementConstraints
        return { dir, constraints: raw }
      } catch {
        return null // File doesn't exist — skip silently
      }
    }),
  )
  for (const result of results) {
    if (result) map.set(result.dir, result.constraints)
  }
  return map
}
