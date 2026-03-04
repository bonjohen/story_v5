/**
 * Data Index: enumerates all archetype and genre graphs, computing metadata.
 * Used both at runtime (browser fetch) and as a build-time manifest generator.
 */

import type { GraphMetadata, DataManifest, StoryGraph } from '../types/graph.ts'

/** Known archetype folders (must match data/archetypes/ directory) */
const ARCHETYPE_DIRS = [
  '01_heros_journey',
  '02_rags_to_riches',
  '03_the_quest',
  '04_voyage_and_return',
  '05_overcoming_the_monster',
  '06_rebirth',
  '07_tragedy',
  '08_comedy',
  '09_coming_of_age',
  '10_the_revenge',
  '11_the_escape',
  '12_the_sacrifice',
  '13_the_mystery_unveiled',
  '14_the_transformation',
  '15_the_rise_and_fall',
]

/** Known genre folders (must match data/genres/ directory) */
const GENRE_DIRS = [
  '01_drama',
  '02_action',
  '03_comedy',
  '04_thriller',
  '05_fantasy',
  '06_science_fiction',
  '07_adventure',
  '08_romance',
  '09_romantic_comedy',
  '10_horror',
  '11_mystery',
  '12_crime',
  '13_detective',
  '14_superhero',
  '15_historical',
  '16_war',
  '17_biography',
  '18_family',
  '19_young_adult',
  '20_literary_fiction',
  '21_childrens_literature',
  '22_satire',
  '23_psychological',
  '24_western',
  '25_political',
  '26_musical',
  '27_holiday',
]

/**
 * Extract the 2-letter prefix from the first node ID in the graph.
 */
function extractPrefix(graph: StoryGraph): string {
  if (graph.nodes.length > 0) {
    const match = graph.nodes[0].node_id.match(/^([A-Z]{2})_/)
    if (match) return match[1]
  }
  return ''
}

/**
 * Build metadata for a single graph, given its base path and the parsed graph object.
 */
export function buildGraphMetadata(
  graph: StoryGraph,
  basePath: string,
  hasNarrative: boolean,
  hasExamples: boolean,
): GraphMetadata {
  return {
    id: graph.id,
    name: graph.name,
    type: graph.type,
    prefix: extractPrefix(graph),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    filePath: basePath,
    hasNarrative,
    hasExamples,
  }
}

/**
 * Produce the DataManifest JSON from computed metadata arrays.
 */
export function buildManifest(
  archetypes: GraphMetadata[],
  genres: GraphMetadata[],
): DataManifest {
  const totalNodes =
    archetypes.reduce((s, a) => s + a.nodeCount, 0) +
    genres.reduce((s, g) => s + g.nodeCount, 0)
  const totalEdges =
    archetypes.reduce((s, a) => s + a.edgeCount, 0) +
    genres.reduce((s, g) => s + g.edgeCount, 0)

  return {
    generated: new Date().toISOString(),
    archetypes,
    genres,
    totals: {
      archetypes: archetypes.length,
      genres: genres.length,
      totalNodes,
      totalEdges,
    },
  }
}

export { ARCHETYPE_DIRS, GENRE_DIRS }
