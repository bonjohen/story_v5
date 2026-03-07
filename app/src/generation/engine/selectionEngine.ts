/**
 * Selection Engine: deterministic + explainable selection of archetype, genre,
 * and tone based on the story request and corpus data.
 *
 * No LLM calls — pure computation over cross-reference datasets.
 */

import type {
  StoryRequest,
  SelectionResult,
  LoadedCorpus,
  CompatibilityClass,
  ToneCompatibility,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const COMPATIBILITY_SCORES: Record<CompatibilityClass, number> = {
  'naturally compatible': 1.0,
  'occasionally compatible': 0.6,
  'rarely compatible': 0.2,
}

const TONE_SCORES: Record<ToneCompatibility, number> = {
  reinforcing: 0.2,
  neutral: 0.0,
  contrasting: -0.1,
}

// ---------------------------------------------------------------------------
// Name ↔ ID mapping helpers
// ---------------------------------------------------------------------------

/** Map genre display names (from matrix) to directory IDs. */
function buildGenreNameToId(corpus: LoadedCorpus): Map<string, string> {
  const map = new Map<string, string>()
  for (const [dir, graph] of corpus.genreGraphs) {
    map.set(graph.name.toLowerCase(), dir)
  }
  return map
}

/** Map archetype display names (from matrix) to directory IDs. */
function buildArchetypeNameToId(corpus: LoadedCorpus): Map<string, string> {
  const map = new Map<string, string>()
  for (const [dir, graph] of corpus.archetypeGraphs) {
    map.set(graph.name.toLowerCase(), dir)
  }
  return map
}

/** Map directory IDs to display names. */
function buildIdToName(corpus: LoadedCorpus): Map<string, string> {
  const map = new Map<string, string>()
  for (const [dir, graph] of corpus.archetypeGraphs) map.set(dir, graph.name)
  for (const [dir, graph] of corpus.genreGraphs) map.set(dir, graph.name)
  return map
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface ScoredCandidate {
  id: string
  name: string
  compatibilityScore: number
  toneScore: number
  totalScore: number
  classification: CompatibilityClass
  toneClassification: ToneCompatibility | null
}

export interface SelectionEngineResult {
  selection: SelectionResult
  alternatives: ScoredCandidate[]
}

/**
 * Run the selection engine against a story request.
 * Returns the selected configuration and scored alternatives.
 */
export function runSelection(
  request: StoryRequest,
  corpus: LoadedCorpus,
): SelectionEngineResult {
  const genreNameToId = buildGenreNameToId(corpus)
  const archetypeNameToId = buildArchetypeNameToId(corpus)
  const idToName = buildIdToName(corpus)

  // Resolve requested genre and archetype to IDs
  const genreId = resolveId(request.requested_genre, genreNameToId, corpus.genreGraphs)
  const archetypeId = resolveId(request.requested_archetype, archetypeNameToId, corpus.archetypeGraphs)

  if (!genreId) {
    throw new Error(`Unknown genre: "${request.requested_genre}"`)
  }
  if (!archetypeId) {
    throw new Error(`Unknown archetype: "${request.requested_archetype}"`)
  }

  // Look up compatibility
  const { classification, rationale } = lookupCompatibility(
    genreId,
    idToName.get(archetypeId) ?? archetypeId,
    corpus,
  )

  // Look up tone integration
  const toneResult = lookupToneIntegration(genreId, archetypeId, corpus)

  // Score alternatives (other archetypes for this genre)
  const alternatives = scoreAlternatives(genreId, corpus)

  const selection: SelectionResult = {
    schema_version: '1.0.0',
    run_id: request.run_id,
    generated_at: new Date().toISOString(),
    source_corpus_hash: request.source_corpus_hash,
    primary_archetype: archetypeId,
    primary_genre: genreId,
    compatibility: {
      matrix_classification: classification,
      rationale,
    },
    tone_marker: {
      selected: request.tone_preference,
      genre_tone_node_id: toneResult.toneNodeId,
      integration_classification: toneResult.classification,
    },
  }

  return { selection, alternatives }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveId(
  nameOrId: string,
  nameToId: Map<string, string>,
  graphs: Map<string, unknown>,
): string | null {
  // Check if it's already a valid ID
  if (graphs.has(nameOrId)) return nameOrId
  // Try case-insensitive name lookup
  const id = nameToId.get(nameOrId.toLowerCase())
  if (id) return id
  // Try partial match
  for (const [name, id] of nameToId) {
    if (name.includes(nameOrId.toLowerCase()) || nameOrId.toLowerCase().includes(name)) {
      return id
    }
  }
  return null
}

function lookupCompatibility(
  genreId: string,
  archetypeName: string,
  corpus: LoadedCorpus,
): { classification: CompatibilityClass; rationale: string[] } {
  const genreEntry = corpus.matrix.genres.find(
    (g) => g.genre.toLowerCase() === getGraphName(genreId, corpus).toLowerCase(),
  )
  if (!genreEntry) {
    return { classification: 'rarely compatible', rationale: ['Genre not found in matrix'] }
  }

  const normalizedArchName = archetypeName.toLowerCase()

  for (const entry of genreEntry.naturally_compatible) {
    if (entry.archetype.toLowerCase() === normalizedArchName) {
      return { classification: 'naturally compatible', rationale: [entry.rationale] }
    }
  }
  for (const entry of genreEntry.occasionally_compatible) {
    if (entry.archetype.toLowerCase() === normalizedArchName) {
      return { classification: 'occasionally compatible', rationale: [entry.rationale] }
    }
  }
  for (const entry of genreEntry.rarely_compatible) {
    if (entry.archetype.toLowerCase() === normalizedArchName) {
      return { classification: 'rarely compatible', rationale: [entry.rationale] }
    }
  }

  return { classification: 'rarely compatible', rationale: ['Archetype not found in genre matrix entry'] }
}

function getGraphName(id: string, corpus: LoadedCorpus): string {
  const arch = corpus.archetypeGraphs.get(id)
  if (arch) return arch.name
  const genre = corpus.genreGraphs.get(id)
  if (genre) return genre.name
  return id
}

function lookupToneIntegration(
  genreId: string,
  archetypeId: string,
  corpus: LoadedCorpus,
): { toneNodeId: string; classification: ToneCompatibility } {
  const entry = corpus.toneIntegration.integrations.find(
    (e) => e.genre_id === genreId,
  )
  if (!entry) {
    return { toneNodeId: '', classification: 'neutral' }
  }

  const interaction = entry.archetype_interactions.find(
    (a) => a.archetype === archetypeId,
  )

  return {
    toneNodeId: entry.tone_marker,
    classification: interaction?.compatibility ?? 'neutral',
  }
}

function scoreAlternatives(
  genreId: string,
  corpus: LoadedCorpus,
): ScoredCandidate[] {
  const genreName = getGraphName(genreId, corpus)
  const genreEntry = corpus.matrix.genres.find(
    (g) => g.genre.toLowerCase() === genreName.toLowerCase(),
  )
  if (!genreEntry) return []

  const toneEntry = corpus.toneIntegration.integrations.find(
    (e) => e.genre_id === genreId,
  )

  const candidates: ScoredCandidate[] = []

  const addCandidates = (
    entries: Array<{ archetype: string; rationale: string }>,
    classification: CompatibilityClass,
  ) => {
    for (const entry of entries) {
      const archetypeId = findArchetypeId(entry.archetype, corpus)
      const toneInteraction = toneEntry?.archetype_interactions.find(
        (a) => a.archetype === archetypeId,
      )
      const toneClassification = toneInteraction?.compatibility ?? null
      const compatScore = COMPATIBILITY_SCORES[classification]
      const toneScore = toneClassification ? TONE_SCORES[toneClassification] : 0

      candidates.push({
        id: archetypeId ?? entry.archetype,
        name: entry.archetype,
        compatibilityScore: compatScore,
        toneScore,
        totalScore: compatScore + toneScore,
        classification,
        toneClassification,
      })
    }
  }

  addCandidates(genreEntry.naturally_compatible, 'naturally compatible')
  addCandidates(genreEntry.occasionally_compatible, 'occasionally compatible')
  addCandidates(genreEntry.rarely_compatible, 'rarely compatible')

  // Sort by total score descending
  candidates.sort((a, b) => b.totalScore - a.totalScore)

  return candidates
}

function findArchetypeId(name: string, corpus: LoadedCorpus): string | null {
  for (const [dir, graph] of corpus.archetypeGraphs) {
    if (graph.name.toLowerCase() === name.toLowerCase()) return dir
  }
  return null
}

