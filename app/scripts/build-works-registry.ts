/**
 * Builds a consolidated registry of all works referenced across 42 examples.md files.
 * Run with: npx tsx app/scripts/build-works-registry.ts
 *
 * Reads archetype and genre examples.md files, extracts work references from
 * headers and body text, normalizes to structured records, deduplicates by
 * title similarity, and writes data/example_works_registry.json.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_ROOT = resolve(__dirname, '../../data')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkReference {
  graph_id: string
  role: 'primary' | 'cross-reference'
  short_name?: string // e.g. "Shawshank" for bold labels used in genre Format B
}

interface WorkRecord {
  work_id: string
  title: string
  creator: string
  year: number | null
  medium: string
  references: WorkReference[]
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/** Normalize a title for deduplication: lowercase, strip articles, punctuation */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''"""`]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Build a dedup key from a normalized title */
function dedupKey(title: string): string {
  return normalizeTitle(title)
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '_')
}

/** Generate a work_id from title + year */
function makeWorkId(title: string, year: number | null): string {
  let slug = title
    .toLowerCase()
    .replace(/[''"""`]/g, '')
    .replace(/[–—:,.'!?()]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^(the|a|an)_/, '')
    .replace(/_+$/, '')
  if (slug.length > 50) slug = slug.slice(0, 50).replace(/_+$/, '')
  return year ? `${slug}_${year}` : slug
}

/** Strip markdown formatting from a string */
function stripMd(s: string): string {
  return s.replace(/\*+/g, '').replace(/_+/g, '').trim()
}

// ---------------------------------------------------------------------------
// Known work metadata (for enrichment and disambiguation)
// ---------------------------------------------------------------------------

const KNOWN_WORKS: Record<string, Partial<WorkRecord>> = {
  // Archetype headers (from direct parsing)
  'star wars: episode iv - a new hope': { creator: 'George Lucas', year: 1977, medium: 'film' },
  'star wars': { creator: 'George Lucas', year: 1977, medium: 'film' },
  'the hobbit': { creator: 'J.R.R. Tolkien', year: 1937, medium: 'novel' },
  'the matrix': { creator: 'The Wachowskis', year: 1999, medium: 'film' },
  'rocky': { creator: 'John G. Avildsen', year: 1976, medium: 'film' },
  'slumdog millionaire': { creator: 'Danny Boyle', year: 2008, medium: 'film' },
  'great expectations': { creator: 'Charles Dickens', year: 1861, medium: 'novel' },
  'the lord of the rings': { creator: 'J.R.R. Tolkien', year: 1954, medium: 'novel' },
  'indiana jones and the last crusade': { creator: 'Steven Spielberg', year: 1989, medium: 'film' },
  'finding nemo': { creator: 'Andrew Stanton', year: 2003, medium: 'film' },
  "alice's adventures in wonderland": { creator: 'Lewis Carroll', year: 1865, medium: 'novel' },
  'the wizard of oz': { creator: 'Victor Fleming', year: 1939, medium: 'film' },
  'the lion, the witch and the wardrobe': { creator: 'C.S. Lewis', year: 1950, medium: 'novel' },
  'jaws': { creator: 'Steven Spielberg', year: 1975, medium: 'film' },
  'jurassic park': { creator: 'Steven Spielberg', year: 1993, medium: 'film' },
  'beowulf': { creator: 'Anonymous', year: null, medium: 'epic poem' },
  'a christmas carol': { creator: 'Charles Dickens', year: 1843, medium: 'novella' },
  'groundhog day': { creator: 'Harold Ramis', year: 1993, medium: 'film' },
  'beauty and the beast': { creator: 'Gary Trousdale & Kirk Wise', year: 1991, medium: 'animated film' },
  'macbeth': { creator: 'William Shakespeare', year: null, medium: 'play' },
  'titanic': { creator: 'James Cameron', year: 1997, medium: 'film' },
  'romeo and juliet': { creator: 'William Shakespeare', year: null, medium: 'play' },
  "a midsummer night's dream": { creator: 'William Shakespeare', year: null, medium: 'play' },
  'the big lebowski': { creator: 'Joel & Ethan Coen', year: 1998, medium: 'film' },
  "bridget jones's diary": { creator: 'Sharon Maguire', year: 2001, medium: 'film' },
  'to kill a mockingbird': { creator: 'Harper Lee', year: 1960, medium: 'novel' },
  'the breakfast club': { creator: 'John Hughes', year: 1985, medium: 'film' },
  'lady bird': { creator: 'Greta Gerwig', year: 2017, medium: 'film' },
  'the count of monte cristo': { creator: 'Alexandre Dumas', year: 1844, medium: 'novel' },
  'kill bill: volume 1': { creator: 'Quentin Tarantino', year: 2003, medium: 'film' },
  'gladiator': { creator: 'Ridley Scott', year: 2000, medium: 'film' },
  'the shawshank redemption': { creator: 'Frank Darabont', year: 1994, medium: 'film' },
  'escape from alcatraz': { creator: 'Don Siegel', year: 1979, medium: 'film' },
  'get out': { creator: 'Jordan Peele', year: 2017, medium: 'film' },
  'harry potter and the deathly hallows - part 2': { creator: 'David Yates', year: 2011, medium: 'film' },
  'armageddon': { creator: 'Michael Bay', year: 1998, medium: 'film' },
  'the dark knight rises': { creator: 'Christopher Nolan', year: 2012, medium: 'film' },
  'knives out': { creator: 'Rian Johnson', year: 2019, medium: 'film' },
  'the sixth sense': { creator: 'M. Night Shyamalan', year: 1999, medium: 'film' },
  'gone girl': { creator: 'Gillian Flynn', year: 2012, medium: 'novel' },
  'black swan': { creator: 'Darren Aronofsky', year: 2010, medium: 'film' },
  'the metamorphosis': { creator: 'Franz Kafka', year: 1915, medium: 'novella' },
  'spider-man': { creator: 'Sam Raimi', year: 2002, medium: 'film' },
  'the wolf of wall street': { creator: 'Martin Scorsese', year: 2013, medium: 'film' },
  'scarface': { creator: 'Brian De Palma', year: 1983, medium: 'film' },
  'citizen kane': { creator: 'Orson Welles', year: 1941, medium: 'film' },
  // Genre works
  'the lord of the rings: the fellowship of the ring': { creator: 'Peter Jackson', year: 2001, medium: 'film' },
  "harry potter and the sorcerer's stone": { creator: 'Chris Columbus', year: 2001, medium: 'film' },
  'a game of thrones': { creator: 'George R.R. Martin', year: 1996, medium: 'novel' },
  'mad max: fury road': { creator: 'George Miller', year: 2015, medium: 'film' },
  'die hard': { creator: 'John McTiernan', year: 1988, medium: 'film' },
  'john wick': { creator: 'Chad Stahelski', year: 2014, medium: 'film' },
  'gone girl': { creator: 'David Fincher', year: 2014, medium: 'film' },
  "se7en": { creator: 'David Fincher', year: 1995, medium: 'film' },
  'the silence of the lambs': { creator: 'Jonathan Demme', year: 1991, medium: 'film' },
  'dune': { creator: 'Denis Villeneuve', year: 2021, medium: 'film' },
  'blade runner': { creator: 'Ridley Scott', year: 1982, medium: 'film' },
  'pride and prejudice': { creator: 'Jane Austen', year: 1813, medium: 'novel' },
  'the notebook': { creator: 'Nicholas Sparks', year: 1996, medium: 'novel' },
  'when harry met sally...': { creator: 'Rob Reiner', year: 1989, medium: 'film' },
  'crazy rich asians': { creator: 'Jon M. Chu', year: 2018, medium: 'film' },
  'the shining': { creator: 'Stephen King', year: 1977, medium: 'novel' },
  'the exorcist': { creator: 'William Peter Blatty', year: 1971, medium: 'novel' },
  'the hound of the baskervilles': { creator: 'Arthur Conan Doyle', year: 1902, medium: 'novel' },
  'murder on the orient express': { creator: 'Agatha Christie', year: 1934, medium: 'novel' },
  'the godfather': { creator: 'Francis Ford Coppola', year: 1972, medium: 'film' },
  'the wire': { creator: 'David Simon', year: 2002, medium: 'television' },
  'a study in scarlet': { creator: 'Arthur Conan Doyle', year: 1887, medium: 'novel' },
  'chinatown': { creator: 'Roman Polanski', year: 1974, medium: 'film' },
  'true detective': { creator: 'Nic Pizzolatto', year: 2014, medium: 'television' },
  'the dark knight': { creator: 'Christopher Nolan', year: 2008, medium: 'film' },
  'black panther': { creator: 'Ryan Coogler', year: 2018, medium: 'film' },
  "schindler's list": { creator: 'Steven Spielberg', year: 1993, medium: 'film' },
  'wolf hall': { creator: 'Hilary Mantel', year: 2009, medium: 'novel' },
  'saving private ryan': { creator: 'Steven Spielberg', year: 1998, medium: 'film' },
  'all quiet on the western front': { creator: 'Erich Maria Remarque', year: 1929, medium: 'novel' },
  'apocalypse now': { creator: 'Francis Ford Coppola', year: 1979, medium: 'film' },
  'oppenheimer': { creator: 'Christopher Nolan', year: 2023, medium: 'film' },
  'steve jobs': { creator: 'Danny Boyle', year: 2015, medium: 'film' },
  'little women': { creator: 'Louisa May Alcott', year: 1868, medium: 'novel' },
  'coco': { creator: 'Lee Unkrich', year: 2017, medium: 'film' },
  'the hunger games': { creator: 'Suzanne Collins', year: 2008, medium: 'novel' },
  'the fault in our stars': { creator: 'John Green', year: 2012, medium: 'novel' },
  'the perks of being a wallflower': { creator: 'Stephen Chbosky', year: 1999, medium: 'novel' },
  'beloved': { creator: 'Toni Morrison', year: 1987, medium: 'novel' },
  'the great gatsby': { creator: 'F. Scott Fitzgerald', year: 1925, medium: 'novel' },
  'normal people': { creator: 'Sally Rooney', year: 2018, medium: 'novel' },
  "charlotte's web": { creator: 'E.B. White', year: 1952, medium: 'novel' },
  'the cat in the hat': { creator: 'Dr. Seuss', year: 1957, medium: 'novel' },
  'dr. strangelove': { creator: 'Stanley Kubrick', year: 1964, medium: 'film' },
  'animal farm': { creator: 'George Orwell', year: 1945, medium: 'novel' },
  'thank you for smoking': { creator: 'Jason Reitman', year: 2005, medium: 'film' },
  'fight club': { creator: 'David Fincher', year: 1999, medium: 'film' },
  'shutter island': { creator: 'Martin Scorsese', year: 2010, medium: 'film' },
  'the good, the bad and the ugly': { creator: 'Sergio Leone', year: 1966, medium: 'film' },
  'true grit': { creator: 'Charles Portis', year: 1968, medium: 'novel' },
  'unforgiven': { creator: 'Clint Eastwood', year: 1992, medium: 'film' },
  "all the president's men": { creator: 'Alan J. Pakula', year: 1976, medium: 'film' },
  'house of cards': { creator: 'Michael Dobbs', year: 1990, medium: 'novel' },
  'the ides of march': { creator: 'George Clooney', year: 2011, medium: 'film' },
  'the sound of music': { creator: 'Robert Wise', year: 1965, medium: 'film' },
  'la la land': { creator: 'Damien Chazelle', year: 2016, medium: 'film' },
  'west side story': { creator: 'Jerome Robbins & Robert Wise', year: 1961, medium: 'film' },
  'home alone': { creator: 'Chris Columbus', year: 1990, medium: 'film' },
  'elf': { creator: 'Jon Favreau', year: 2003, medium: 'film' },
  'some like it hot': { creator: 'Billy Wilder', year: 1959, medium: 'film' },
  'superbad': { creator: 'Greg Mottola', year: 2007, medium: 'film' },
  'pirates of the caribbean': { creator: 'Gore Verbinski', year: 2003, medium: 'film' },
  'parasite': { creator: 'Bong Joon-ho', year: 2019, medium: 'film' },
  'silence of the lambs': { creator: 'Jonathan Demme', year: 1991, medium: 'film' },
  "sherlock holmes": { creator: 'Arthur Conan Doyle', year: 1887, medium: 'novel series' },
}

// Map short names used in genre Format B to full titles
const SHORT_NAME_TO_TITLE: Record<string, string> = {
  'shawshank': 'The Shawshank Redemption',
  'fury road': 'Mad Max: Fury Road',
  'last crusade': 'Indiana Jones and the Last Crusade',
  "sorcerer's stone": "Harry Potter and the Sorcerer's Stone",
  'game of thrones': 'A Game of Thrones',
  'se7en': 'Se7en',
  'silence of the lambs': 'The Silence of the Lambs',
  "bridget jones's diary": "Bridget Jones's Diary",
  'house of cards (1990 novel)': 'House of Cards',
  'fellowship': 'The Lord of the Rings: The Fellowship of the Ring',
}

// ---------------------------------------------------------------------------
// Extraction: Archetype format
// ---------------------------------------------------------------------------

interface RawWork {
  title: string
  creator: string
  year: number | null
  medium: string
  graph_id: string
  role: 'primary' | 'cross-reference'
  short_name?: string
}

function parseArchetypeHeader(content: string, graphId: string): RawWork[] {
  const works: RawWork[] = []

  // **Primary example:** Title (year medium) or Title (year medium, creator)
  const primaryMatch = content.match(/\*\*Primary example:\*\*\s*(.+)/)
  if (primaryMatch) {
    const parsed = parseArchetypeWorkRef(primaryMatch[1].trim())
    if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'primary' })
  }

  // **Cross-references:** Title (year medium), Title (year medium), ...
  const crossMatch = content.match(/\*\*Cross-references:\*\*\s*(.+)/)
  if (crossMatch) {
    const refs = splitCrossRefs(crossMatch[1].trim())
    for (const ref of refs) {
      const parsed = parseArchetypeWorkRef(ref.trim())
      if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'cross-reference' })
    }
  }

  return works
}

/** Split cross-references: split on "), " followed by a new title (capital letter) */
function splitCrossRefs(text: string): string[] {
  // Split after closing paren + comma: "), Title"
  const parts = text.split(/\),\s+(?=[A-Z])/)
  return parts.map((part, i) => {
    // Re-add the closing paren stripped by split (except last part which keeps it)
    if (i < parts.length - 1) return part + ')'
    return part
  }).map(s => s.trim()).filter(Boolean)
}

/** Parse "Title (year medium)" or "Title (year medium, creator)" or "Title (description)" */
function parseArchetypeWorkRef(text: string): Omit<RawWork, 'graph_id' | 'role'> | null {
  // Strip markdown
  text = stripMd(text)
  if (!text) return null

  // Pattern: Title (YYYY medium) or Title (YYYY medium, creator) or Title (description)
  const match = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (match) {
    const title = match[1].trim()
    const paren = match[2].trim()
    const yearMatch = paren.match(/^(\d{4})\s+(.+)$/)
    if (yearMatch) {
      const year = parseInt(yearMatch[1])
      const rest = yearMatch[2]
      // Check for "medium, creator"
      const commaIdx = rest.indexOf(',')
      let medium: string
      let creator = ''
      if (commaIdx > 0) {
        medium = rest.slice(0, commaIdx).trim()
        creator = rest.slice(commaIdx + 1).trim()
      } else {
        medium = rest.trim()
      }
      return { title, creator, year, medium }
    }
    // No year — description like "Shakespeare tragedy" or "Old English epic poem"
    return { title, creator: '', year: null, medium: paren }
  }

  // No parenthetical — just title
  return { title: text, creator: '', year: null, medium: '' }
}

// ---------------------------------------------------------------------------
// Extraction: Genre format (multiple sub-formats)
// ---------------------------------------------------------------------------

function parseGenreHeader(content: string, graphId: string): RawWork[] {
  const works: RawWork[] = []
  const lines = content.split('\n')

  // Restrict to first 15 lines (header area only)
  const headerLines = lines.slice(0, 15)

  // --- Format A: "## Primary Work: Title (year medium)" ---
  for (const line of headerLines) {
    const fmtA = line.match(/^##\s*Primary Work:\s*(.+)/)
    if (fmtA) {
      const parsed = parseArchetypeWorkRef(fmtA[1].trim())
      if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'primary' })
      break
    }
  }

  // --- Format B: "Primary: *Title* ..." or "**Primary:** ..." or "**Primary Reference:** ..." ---
  if (works.length === 0) {
    for (const line of headerLines) {
      const fmtB = line.match(/^\*{0,2}Primary(?:\s+Reference)?:?\*{0,2}\s+(.+)/i)
      if (fmtB) {
        const parsed = parseGenreWorkRef(fmtB[1].trim())
        if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'primary' })
        break
      }
    }
  }

  // --- Cross-references ---
  let inCrossRefs = false
  for (const line of headerLines) {
    // "Cross-references:" or "Cross-refs:" or "**Cross-References:**"
    const crossHeader = line.match(/^\*{0,2}Cross[- ]?(?:references?|refs?):?\*{0,2}\s*(.*)/i)
    if (crossHeader) {
      inCrossRefs = true
      const rest = crossHeader[1].trim()
      if (rest) {
        // Inline cross-refs: separated by ; or | or comma-after-paren
        let refs: string[]
        if (rest.includes(';') || rest.includes('|')) {
          refs = rest.split(/[;|]/).map(s => s.trim()).filter(Boolean)
        } else {
          refs = splitCrossRefs(rest)
        }
        for (const ref of refs) {
          const parsed = parseGenreWorkRef(ref)
          if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'cross-reference' })
        }
        inCrossRefs = false
      }
      continue
    }

    if (inCrossRefs) {
      // List items: "- *Title* (year) ..."  or "- **shortname** = Title (year)"
      const listMatch = line.match(/^-\s+(.+)/)
      if (listMatch) {
        const item = listMatch[1].trim()
        // Handle "**Shortname** = Full Title (year medium)" format
        const eqMatch = item.match(/^\*{2}([^*]+)\*{2}\s*=\s*(.+)/)
        if (eqMatch) {
          const parsed = parseGenreWorkRef(eqMatch[2].trim())
          if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'cross-reference', short_name: eqMatch[1].trim() })
        } else {
          const parsed = parseGenreWorkRef(item)
          if (parsed) works.push({ ...parsed, graph_id: graphId, role: 'cross-reference' })
        }
      } else if (line.trim() === '' || line.startsWith('#') || line.startsWith('---')) {
        inCrossRefs = false
      }
    }
  }

  return works
}

/** Parse genre work reference: "*Title* (year, dir. Director)" or "*Title* by Author (year medium)" etc. */
function parseGenreWorkRef(text: string): Omit<RawWork, 'graph_id' | 'role'> | null {
  text = stripMd(text).trim()
  if (!text) return null

  // Remove citation suffixes like "— cited as **ASiS**"
  text = text.replace(/\s*[-–—]\s*cited as\s+\*{0,2}\w+\*{0,2}\s*$/, '').trim()

  // "Title by Author (year medium)"
  const byMatch = text.match(/^(.+?)\s+by\s+(.+?)\s*\(([^)]+)\)\s*$/)
  if (byMatch) {
    const title = byMatch[1].trim()
    const creator = byMatch[2].trim()
    const paren = byMatch[3].trim()
    const { year, medium } = parseParenContent(paren)
    return { title, creator, year, medium }
  }

  // "Title (year, dir. Director)" or "Title (year medium)" or "Title (Creator, year medium)"
  const parenMatch = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (parenMatch) {
    const title = parenMatch[1].trim()
    const paren = parenMatch[2].trim()

    // "Creator, year medium" e.g. "Stephen King, 1977 novel"
    const creatorYearMatch = paren.match(/^([A-Z][^,]+),\s*(\d{4})(?:\s+(.+))?$/)
    if (creatorYearMatch && !creatorYearMatch[1].match(/^dir\./i)) {
      return {
        title,
        creator: creatorYearMatch[1].trim(),
        year: parseInt(creatorYearMatch[2]),
        medium: creatorYearMatch[3]?.trim() || '',
      }
    }

    // "year, dir. Director"
    const dirMatch = paren.match(/^(\d{4})(?:[-–]\d{4})?,?\s*(?:dir\.\s*|directed by\s*|created by\s*)(.+)$/i)
    if (dirMatch) {
      return { title, creator: dirMatch[2].trim(), year: parseInt(dirMatch[1]), medium: 'film' }
    }

    // "year, writer/creator info"
    const yearCreatorMatch = paren.match(/^(\d{4})(?:[-–]\d{4})?,?\s*(?:HBO|BBC|AMC|Netflix)?,?\s*(.+)?$/)
    if (yearCreatorMatch) {
      const year = parseInt(yearCreatorMatch[1])
      const rest = yearCreatorMatch[2]?.trim() || ''
      // If rest starts with a media type word
      if (rest.match(/^(film|novel|novella|play|poem|animated|television|TV)/i)) {
        return { title, creator: '', year, medium: rest }
      }
      // Try "HBO, Pizzolatto" etc
      return { title, creator: rest, year, medium: '' }
    }

    // Just "year medium"
    const simpleMatch = paren.match(/^(\d{4})\s+(.+)$/)
    if (simpleMatch) {
      return { title, creator: '', year: parseInt(simpleMatch[1]), medium: simpleMatch[2].trim() }
    }

    // Just year
    const yearOnly = paren.match(/^(\d{4})$/)
    if (yearOnly) {
      return { title, creator: '', year: parseInt(yearOnly[1]), medium: '' }
    }

    // Non-year parenthetical (e.g., "Shakespeare tragedy")
    return { title, creator: '', year: null, medium: paren }
  }

  // "Author — Title (year–year)" (detective format)
  const authorDashMatch = text.match(/^(.+?)\s*[-–—]\s*(.+?)\s*\(([^)]+)\)\s*$/)
  if (authorDashMatch) {
    const creator = authorDashMatch[1].trim()
    const title = authorDashMatch[2].trim()
    const paren = authorDashMatch[3].trim()
    const { year, medium } = parseParenContent(paren)
    return { title, creator, year, medium }
  }

  // Bare title (no parenthetical)
  if (text.length > 2 && text.length < 100) {
    return { title: text, creator: '', year: null, medium: '' }
  }

  return null
}

function parseParenContent(paren: string): { year: number | null; medium: string } {
  const yearMatch = paren.match(/(\d{4})/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null
  const medium = paren.replace(/\d{4}(?:[-–]\d{4})?/, '').replace(/^[\s,]+|[\s,]+$/g, '').trim()
  return { year, medium }
}

// ---------------------------------------------------------------------------
// Extract works from body text (genre Format B bold shortnames)
// ---------------------------------------------------------------------------

function extractGenreBodyWorks(content: string, graphId: string): RawWork[] {
  const works: RawWork[] = []
  const seenShortNames = new Set<string>()

  // Find bold labels used as work references in body: "- **ShortName**:" at start of bullet
  const bodyLabelPattern = /^-\s+\*\*([^*]+)\*\*:/gm
  let match: RegExpExecArray | null
  while ((match = bodyLabelPattern.exec(content)) !== null) {
    const shortName = match[1].trim()
    // Skip node IDs (like "FN_N01_PROMISE")
    if (shortName.match(/^[A-Z]{2}_[NE]\d/)) continue
    // Skip generic labels
    if (shortName.match(/^(Cross-refs?|Note|Example|See|Contrast|cf\.|Primary)/i)) continue
    if (seenShortNames.has(shortName.toLowerCase())) continue
    seenShortNames.add(shortName.toLowerCase())

    // This is a short name used for a work — we'll resolve it later
    works.push({
      title: shortName,
      creator: '',
      year: null,
      medium: '',
      graph_id: graphId,
      role: 'cross-reference',
      short_name: shortName,
    })
  }

  return works
}

// ---------------------------------------------------------------------------
// Main extraction and deduplication
// ---------------------------------------------------------------------------

function main() {
  const allRawWorks: RawWork[] = []

  // Process archetypes
  const archBase = join(DATA_ROOT, 'archetypes')
  const archFolders = readdirSync(archBase).filter(f =>
    existsSync(join(archBase, f, 'examples.md'))
  ).sort()

  for (const folder of archFolders) {
    const filePath = join(archBase, folder, 'examples.md')
    const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
    const graphId = `archetype_${folder}`
    const headerWorks = parseArchetypeHeader(content, graphId)
    allRawWorks.push(...headerWorks)
    console.log(`  archetype/${folder}: ${headerWorks.length} works from header`)
  }

  // Process genres
  const genreBase = join(DATA_ROOT, 'genres')
  const genreFolders = readdirSync(genreBase).filter(f =>
    existsSync(join(genreBase, f, 'examples.md'))
  ).sort()

  for (const folder of genreFolders) {
    const filePath = join(genreBase, folder, 'examples.md')
    const content = readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n')
    const graphId = `genre_${folder}`

    // Extract from header
    const headerWorks = parseGenreHeader(content, graphId)

    // Extract bold shortnames from body (Format B genres)
    const bodyWorks = extractGenreBodyWorks(content, graphId)

    // Merge: body works that are already in header (by title or resolved short name) should be dropped
    const headerDedupKeys = new Set(headerWorks.map(w => dedupKey(w.title)))
    const uniqueBodyWorks = bodyWorks.filter(w => {
      // Resolve short name to full title
      const shortKey = w.short_name?.toLowerCase() || w.title.toLowerCase()
      const resolvedTitle = SHORT_NAME_TO_TITLE[shortKey] || w.title
      return !headerDedupKeys.has(dedupKey(resolvedTitle)) && !headerDedupKeys.has(dedupKey(w.title))
    })

    allRawWorks.push(...headerWorks, ...uniqueBodyWorks)
    console.log(`  genre/${folder}: ${headerWorks.length} header + ${uniqueBodyWorks.length} body works`)
  }

  console.log(`\nTotal raw work references: ${allRawWorks.length}`)

  // Deduplicate and merge
  const workMap = new Map<string, WorkRecord>()

  for (const raw of allRawWorks) {
    // Resolve short names to full titles
    let title = raw.title
    const shortKey = raw.short_name?.toLowerCase() || title.toLowerCase()
    if (SHORT_NAME_TO_TITLE[shortKey]) {
      title = SHORT_NAME_TO_TITLE[shortKey]
    }

    const key = dedupKey(title)
    const existing = workMap.get(key)

    if (existing) {
      // Merge reference
      const refExists = existing.references.some(
        r => r.graph_id === raw.graph_id && r.role === raw.role
      )
      if (!refExists) {
        const ref: WorkReference = { graph_id: raw.graph_id, role: raw.role }
        if (raw.short_name) ref.short_name = raw.short_name
        existing.references.push(ref)
      }
      // Enrich metadata
      if (!existing.creator && raw.creator) existing.creator = raw.creator
      if (!existing.year && raw.year) existing.year = raw.year
      if (!existing.medium && raw.medium) existing.medium = raw.medium
    } else {
      // Look up known works for enrichment
      const normTitle = normalizeTitle(title)
      const known = KNOWN_WORKS[normTitle]

      const ref: WorkReference = { graph_id: raw.graph_id, role: raw.role }
      if (raw.short_name) ref.short_name = raw.short_name

      workMap.set(key, {
        work_id: makeWorkId(title, raw.year || known?.year || null),
        title,
        creator: raw.creator || known?.creator || '',
        year: raw.year || known?.year || null,
        medium: raw.medium || known?.medium || '',
        references: [ref],
      })
    }
  }

  // Sort by title
  const registry = [...workMap.values()].sort((a, b) =>
    a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
  )

  // Write output
  const output = {
    _description: 'Consolidated registry of all works referenced across archetype and genre example files.',
    _generated: new Date().toISOString().slice(0, 10),
    _stats: {
      total_works: registry.length,
      works_with_multiple_refs: registry.filter(w => w.references.length > 1).length,
      archetypes_covered: new Set(registry.flatMap(w => w.references.map(r => r.graph_id)).filter(id => id.startsWith('archetype_'))).size,
      genres_covered: new Set(registry.flatMap(w => w.references.map(r => r.graph_id)).filter(id => id.startsWith('genre_'))).size,
    },
    works: registry,
  }

  const outPath = join(DATA_ROOT, 'example_works_registry.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  console.log(`\nWrote ${registry.length} works to ${outPath}`)
  console.log(`  ${output._stats.works_with_multiple_refs} appear in multiple graphs`)
  console.log(`  ${output._stats.archetypes_covered} archetypes, ${output._stats.genres_covered} genres covered`)
}

main()
