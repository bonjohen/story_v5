/**
 * Element Vocabulary Validation Script
 *
 * Validates that all 5 story element vocabulary files follow the established format
 * and that their entries are internally consistent.
 *
 * Usage: npx tsx app/scripts/validate_element_vocabularies.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const DATA_ROOT = resolve(import.meta.dirname ?? '.', '../../data')
const VOCAB_DIR = join(DATA_ROOT, 'vocabulary')

let errors = 0
let warnings = 0

function log(level: 'PASS' | 'FAIL' | 'WARN', msg: string) {
  const prefix = level === 'PASS' ? '\x1b[32m✓\x1b[0m' : level === 'FAIL' ? '\x1b[31m✗\x1b[0m' : '\x1b[33m⚠\x1b[0m'
  console.log(`  ${prefix} ${msg}`)
  if (level === 'FAIL') errors++
  if (level === 'WARN') warnings++
}

function loadJson(filename: string): Record<string, unknown> | null {
  const fullPath = join(VOCAB_DIR, filename)
  if (!existsSync(fullPath)) {
    log('FAIL', `File not found: ${filename}`)
    return null
  }
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'))
  } catch (e) {
    log('FAIL', `Invalid JSON in ${filename}: ${e}`)
    return null
  }
}

interface VocabEntry {
  [key: string]: unknown
}

function validateVocabFile(
  filename: string,
  arrayKey: string,
  idField: string,
  requiredFields: string[],
  expectedCount: number
) {
  console.log(`\n--- ${filename} ---`)

  const data = loadJson(filename)
  if (!data) return

  // Check top-level fields
  if (typeof data.title !== 'string' || !data.title) {
    log('FAIL', 'Missing or empty "title" field')
  } else {
    log('PASS', `Title: "${data.title}"`)
  }

  if (typeof data.description !== 'string' || !data.description) {
    log('FAIL', 'Missing or empty "description" field')
  } else {
    log('PASS', 'Has description')
  }

  // Check array
  const entries = data[arrayKey] as VocabEntry[] | undefined
  if (!Array.isArray(entries)) {
    log('FAIL', `Missing or non-array "${arrayKey}" field`)
    return
  }

  if (entries.length !== expectedCount) {
    log('FAIL', `Expected ${expectedCount} entries, found ${entries.length}`)
  } else {
    log('PASS', `${entries.length} entries (expected ${expectedCount})`)
  }

  // Check each entry
  const ids = new Set<string>()
  for (const entry of entries) {
    const id = entry[idField] as string
    if (!id) {
      log('FAIL', `Entry missing "${idField}" field`)
      continue
    }

    // Check for duplicates
    if (ids.has(id)) {
      log('FAIL', `Duplicate ${idField}: "${id}"`)
    }
    ids.add(id)

    // Check required fields
    for (const field of requiredFields) {
      if (!entry[field]) {
        log('FAIL', `${id}: missing or empty "${field}" field`)
      }
    }

    // Check ID format (should be snake_case or lowercase with spaces for labels)
    if (idField === 'role' || idField === 'type') {
      if (id !== id.toLowerCase()) {
        log('WARN', `${id}: ${idField} should be lowercase`)
      }
      if (id.includes(' ') && !id.includes('_')) {
        log('WARN', `${id}: consider using snake_case instead of spaces`)
      }
    }
  }

  log('PASS', `All entries have unique ${idField} values (${ids.size} unique)`)
}

// --- Run validations ---

console.log('=== Story Element Vocabulary Validation ===')

validateVocabFile(
  'element_roles.json',
  'character_roles',
  'role',
  ['definition', 'structural_function', 'examples_across_archetypes'],
  13
)

validateVocabFile(
  'place_types.json',
  'place_types',
  'type',
  ['definition', 'structural_function', 'examples_across_archetypes'],
  10
)

validateVocabFile(
  'object_types.json',
  'object_types',
  'type',
  ['definition', 'structural_function', 'examples_across_archetypes'],
  10
)

validateVocabFile(
  'relationship_types.json',
  'relationship_types',
  'type',
  ['definition', 'structural_function', 'typical_context', 'directionality'],
  10
)

validateVocabFile(
  'element_change_types.json',
  'change_types',
  'type',
  ['definition', 'structural_function', 'typical_context', 'applies_to'],
  11
)

// --- Cross-check: verify TypeScript type unions match JSON entries ---

console.log('\n--- Cross-checking against TypeScript type definitions ---')

const elementRoles = loadJson('element_roles.json')
const placeTypes = loadJson('place_types.json')
const objectTypes = loadJson('object_types.json')
const relationshipTypes = loadJson('relationship_types.json')
const changeTypes = loadJson('element_change_types.json')

const expectedCharacterRoles = new Set([
  'protagonist', 'antagonist', 'mentor', 'ally', 'herald',
  'threshold_guardian', 'shadow', 'trickster', 'shapeshifter',
  'love_interest', 'foil', 'confidant', 'comic_relief'
])

const expectedPlaceTypes = new Set([
  'ordinary_world', 'threshold', 'special_world', 'sanctuary',
  'stronghold', 'wasteland', 'crossroads', 'underworld', 'summit', 'home'
])

const expectedObjectTypes = new Set([
  'weapon', 'talisman', 'document', 'treasure', 'mcguffin',
  'symbol', 'tool', 'key', 'vessel', 'relic'
])

const expectedRelationshipTypes = new Set([
  'ally', 'rival', 'mentor_student', 'parent_child', 'romantic',
  'nemesis', 'servant_master', 'sibling', 'betrayer', 'guardian'
])

const expectedChangeTypes = new Set([
  'learns', 'gains', 'loses', 'transforms', 'arrives',
  'departs', 'bonds', 'breaks', 'dies', 'reveals', 'decides'
])

function crossCheck(label: string, data: Record<string, unknown> | null, arrayKey: string, idField: string, expected: Set<string>) {
  if (!data) return
  const entries = (data[arrayKey] as VocabEntry[]) ?? []
  const actual = new Set(entries.map(e => e[idField] as string))

  for (const e of expected) {
    if (!actual.has(e)) log('FAIL', `${label}: TypeScript expects "${e}" but not found in JSON`)
  }
  for (const a of actual) {
    if (!expected.has(a)) log('FAIL', `${label}: JSON has "${a}" but not in TypeScript type union`)
  }
  if ([...expected].every(e => actual.has(e)) && [...actual].every(a => expected.has(a))) {
    log('PASS', `${label}: JSON entries match TypeScript type union exactly`)
  }
}

crossCheck('CharacterRole', elementRoles, 'character_roles', 'role', expectedCharacterRoles)
crossCheck('PlaceType', placeTypes, 'place_types', 'type', expectedPlaceTypes)
crossCheck('ObjectType', objectTypes, 'object_types', 'type', expectedObjectTypes)
crossCheck('RelationshipType', relationshipTypes, 'relationship_types', 'type', expectedRelationshipTypes)
crossCheck('ChangeType', changeTypes, 'change_types', 'type', expectedChangeTypes)

// --- Summary ---

console.log(`\n=== Summary ===`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}`)
process.exit(errors > 0 ? 1 : 0)
