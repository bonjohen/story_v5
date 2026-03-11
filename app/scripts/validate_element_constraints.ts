/**
 * Genre Element Constraints Validation Script
 *
 * Validates all element_constraints.json files:
 * 1. Character roles use controlled vocabulary terms
 * 2. Relationship types use controlled vocabulary terms
 * 3. Place types use controlled vocabulary terms
 * 4. Object types use controlled vocabulary terms
 * 5. Severity values are valid (required, recommended, optional)
 * 6. Element rules have required fields and testable conditions
 * 7. Rule IDs follow naming convention
 *
 * Usage: npx tsx app/scripts/validate_element_constraints.ts
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
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

// Load controlled vocabularies
const validRoles = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'element_roles.json'), 'utf-8')).character_roles.map((r: { role: string }) => r.role)
)
const validPlaces = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'place_types.json'), 'utf-8')).place_types.map((p: { type: string }) => p.type)
)
const validObjects = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'object_types.json'), 'utf-8')).object_types.map((o: { type: string }) => o.type)
)
const validRelTypes = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'relationship_types.json'), 'utf-8')).relationship_types.map((r: { type: string }) => r.type)
)

const validSeverities = new Set(['required', 'recommended', 'optional'])
const validAppliesTo = new Set(['characters', 'places', 'objects', 'relationships'])

const genreDir = join(DATA_ROOT, 'genres')
const dirs = readdirSync(genreDir).filter(d => statSync(join(genreDir, d)).isDirectory())

console.log('=== Genre Element Constraints Validation ===\n')

let filesFound = 0

for (const dir of dirs) {
  const constraintPath = join(genreDir, dir, 'elements.json')

  if (!existsSync(constraintPath)) continue
  filesFound++

  const constraints = JSON.parse(readFileSync(constraintPath, 'utf-8'))
  console.log(`--- ${dir}: ${constraints.genre_name} ---`)

  // 1. Required top-level fields
  const requiredFields = ['genre_id', 'genre_name', 'description', 'character_constraints', 'relationship_constraints', 'place_constraints', 'object_constraints', 'element_rules']
  let fieldsOk = true
  for (const field of requiredFields) {
    if (!(field in constraints)) {
      log('FAIL', `Missing required field: '${field}'`)
      fieldsOk = false
    }
  }
  if (fieldsOk) log('PASS', 'All required top-level fields present')

  // 2. Character role vocabulary compliance
  let rolesOk = true
  for (const c of constraints.character_constraints || []) {
    if (!validRoles.has(c.role)) {
      log('FAIL', `Unknown character role: '${c.role}'`)
      rolesOk = false
    }
    if (!validSeverities.has(c.severity)) {
      log('FAIL', `Invalid severity '${c.severity}' on character constraint '${c.role}'`)
      rolesOk = false
    }
  }
  if (rolesOk) log('PASS', `${(constraints.character_constraints || []).length} character constraints use valid vocabulary`)

  // 3. Relationship type vocabulary compliance
  let relsOk = true
  for (const r of constraints.relationship_constraints || []) {
    if (!validRelTypes.has(r.type)) {
      log('FAIL', `Unknown relationship type: '${r.type}'`)
      relsOk = false
    }
    if (!validSeverities.has(r.severity)) {
      log('FAIL', `Invalid severity '${r.severity}' on relationship constraint '${r.type}'`)
      relsOk = false
    }
    // Check between_roles references valid character roles
    if (r.between_roles) {
      for (const role of r.between_roles) {
        if (!validRoles.has(role)) {
          log('FAIL', `Relationship '${r.type}': between_roles references unknown role '${role}'`)
          relsOk = false
        }
      }
    }
  }
  if (relsOk) log('PASS', `${(constraints.relationship_constraints || []).length} relationship constraints use valid vocabulary`)

  // 4. Place type vocabulary compliance
  let placesOk = true
  for (const p of constraints.place_constraints || []) {
    if (!validPlaces.has(p.type)) {
      log('FAIL', `Unknown place type: '${p.type}'`)
      placesOk = false
    }
    if (!validSeverities.has(p.severity)) {
      log('FAIL', `Invalid severity '${p.severity}' on place constraint '${p.type}'`)
      placesOk = false
    }
  }
  if (placesOk) log('PASS', `${(constraints.place_constraints || []).length} place constraints use valid vocabulary`)

  // 5. Object type vocabulary compliance
  let objectsOk = true
  for (const o of constraints.object_constraints || []) {
    if (!validObjects.has(o.type)) {
      log('FAIL', `Unknown object type: '${o.type}'`)
      objectsOk = false
    }
    if (!validSeverities.has(o.severity)) {
      log('FAIL', `Invalid severity '${o.severity}' on object constraint '${o.type}'`)
      objectsOk = false
    }
  }
  if (objectsOk) log('PASS', `${(constraints.object_constraints || []).length} object constraints use valid vocabulary`)

  // 6. Element rules validation
  let rulesOk = true
  for (const rule of constraints.element_rules || []) {
    // Required rule fields
    if (!rule.rule_id) {
      log('FAIL', 'Element rule missing rule_id')
      rulesOk = false
    }
    if (!rule.description) {
      log('FAIL', `Rule ${rule.rule_id || '?'}: missing description`)
      rulesOk = false
    }
    if (!rule.severity || !validSeverities.has(rule.severity)) {
      log('FAIL', `Rule ${rule.rule_id || '?'}: invalid or missing severity '${rule.severity}'`)
      rulesOk = false
    }
    if (!rule.applies_to || !validAppliesTo.has(rule.applies_to)) {
      log('FAIL', `Rule ${rule.rule_id || '?'}: invalid or missing applies_to '${rule.applies_to}'`)
      rulesOk = false
    }
    if (!rule.testable_condition || rule.testable_condition.length < 10) {
      log('FAIL', `Rule ${rule.rule_id || '?'}: missing or too short testable_condition`)
      rulesOk = false
    }

    // Rule ID convention: 3-letter prefix + _R + 2-digit number
    if (rule.rule_id && !/^[A-Z]{2,4}_R\d{2}$/.test(rule.rule_id)) {
      log('WARN', `Rule ${rule.rule_id}: ID doesn't follow convention (PREFIX_RNN)`)
    }
  }
  if (rulesOk) log('PASS', `${(constraints.element_rules || []).length} element rules are valid and testable`)

  // 7. Genre ID consistency
  const expectedId = `genre_${dir}`
  if (constraints.genre_id !== expectedId) {
    log('WARN', `genre_id '${constraints.genre_id}' doesn't match expected '${expectedId}'`)
  }
}

console.log(`\n=== Summary ===`)
console.log(`  Files validated: ${filesFound}`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}`)
process.exit(errors > 0 ? 1 : 0)
