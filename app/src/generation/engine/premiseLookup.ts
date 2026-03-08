/**
 * Premise Lookup — loads the archetype×genre premise/tone matrix
 * from the cross-references JSON and provides a lookup function.
 *
 * Data file: data/cross_references/premise_lookup.json
 * Keys: "01_01" through "15_27" (archetype_genre, zero-padded)
 */

const BASE = import.meta.env.BASE_URL ?? '/'

export interface PremiseEntry {
  premise: string
  tone: string
}

type LookupMap = Record<string, PremiseEntry>

let cache: LookupMap | null = null
let loading: Promise<LookupMap> | null = null

async function load(): Promise<LookupMap> {
  const url = `${BASE}data/cross_references/premise_lookup.json`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to load premise lookup: ${resp.status}`)
  return resp.json() as Promise<LookupMap>
}

/** Load (and cache) the premise lookup map. */
export async function loadPremiseLookup(): Promise<LookupMap> {
  if (cache) return cache
  if (!loading) loading = load().then((m) => { cache = m; return m })
  return loading
}

/**
 * Map archetype/genre display names to their 1-based index
 * matching the CSV numbering convention.
 */
const ARCHETYPE_INDEX: Record<string, number> = {
  "The Hero's Journey": 1,
  'Rags to Riches': 2,
  'The Quest': 3,
  'Voyage and Return': 4,
  'Overcoming the Monster': 5,
  'Rebirth': 6,
  'Tragedy': 7,
  'Comedy': 8,
  'Coming of Age': 9,
  'The Revenge': 10,
  'The Escape': 11,
  'The Sacrifice': 12,
  'The Mystery Unveiled': 13,
  'The Transformation': 14,
  'The Rise and Fall': 15,
}

const GENRE_INDEX: Record<string, number> = {
  'Drama': 1,
  'Action': 2,
  'Comedy': 3,
  'Thriller': 4,
  'Fantasy': 5,
  'Science Fiction': 6,
  'Adventure': 7,
  'Romance': 8,
  'Romantic Comedy': 9,
  'Horror': 10,
  'Mystery': 11,
  'Crime': 12,
  'Detective': 13,
  'Superhero': 14,
  'Historical': 15,
  'War': 16,
  'Biography': 17,
  'Family': 18,
  'Young Adult': 19,
  'Literary Fiction': 20,
  "Children's Literature": 21,
  'Satire': 22,
  'Psychological': 23,
  'Western': 24,
  'Political': 25,
  'Musical': 26,
  'Holiday': 27,
}

/** Look up the sample premise and tone for an archetype+genre pair. */
export function lookupPremise(
  map: LookupMap,
  archetypeName: string,
  genreName: string,
): PremiseEntry | null {
  const a = ARCHETYPE_INDEX[archetypeName]
  const g = GENRE_INDEX[genreName]
  if (!a || !g) return null
  const key = `${String(a).padStart(2, '0')}_${String(g).padStart(2, '0')}`
  return map[key] ?? null
}
