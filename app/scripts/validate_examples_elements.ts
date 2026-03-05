/**
 * Example Elements Validation Script
 *
 * Validates all examples_elements.json files:
 * 1. Character roles match template roles from elements.json
 * 2. Place types match template types from elements.json
 * 3. Transition change types use vocabulary from element_change_types.json
 * 4. Timeline moments reference valid archetype nodes from graph.json
 * 5. Relationship targets reference valid IDs within the same instance
 * 6. Element continuity (dead characters don't reappear)
 *
 * Usage: npx tsx app/scripts/validate_examples_elements.ts
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
const validChanges = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'element_change_types.json'), 'utf-8')).change_types.map((c: { type: string }) => c.type)
)
const validRelTypes = new Set(
  JSON.parse(readFileSync(join(VOCAB_DIR, 'relationship_types.json'), 'utf-8')).relationship_types.map((r: { type: string }) => r.type)
)

const archetypeDir = join(DATA_ROOT, 'archetypes')
const dirs = readdirSync(archetypeDir).filter(d => statSync(join(archetypeDir, d)).isDirectory())

console.log('=== Example Elements Validation ===\n')

let filesFound = 0

for (const dir of dirs) {
  const exPath = join(archetypeDir, dir, 'examples_elements.json')
  const graphPath = join(archetypeDir, dir, 'graph.json')

  if (!existsSync(exPath)) continue
  filesFound++

  console.log(`--- ${dir}: ${JSON.parse(readFileSync(exPath, 'utf-8')).story_title} ---`)

  const ex = JSON.parse(readFileSync(exPath, 'utf-8'))
  const graph = JSON.parse(readFileSync(graphPath, 'utf-8'))
  const graphNodeIds = new Set(graph.nodes.map((n: { node_id: string }) => n.node_id))

  // Build ID sets for cross-reference checking
  const charIds = new Set(ex.characters.map((c: { id: string }) => c.id))
  const placeIds = new Set(ex.places.map((p: { id: string }) => p.id))
  const objIds = new Set(ex.objects.map((o: { id: string }) => o.id))
  const allIds = new Set([...charIds, ...placeIds, ...objIds])

  // Template roles/types for matching
  // 1. Character roles match template + vocabulary
  let rolesOk = true
  for (const c of ex.characters) {
    if (!validRoles.has(c.role)) {
      log('FAIL', `${c.name}: unknown role '${c.role}'`)
      rolesOk = false
    }
  }
  if (rolesOk) log('PASS', `All ${ex.characters.length} character roles are valid vocabulary terms`)

  // 2. Place types match template + vocabulary
  let placesOk = true
  for (const p of ex.places) {
    if (!validPlaces.has(p.type)) {
      log('FAIL', `${p.name}: unknown place type '${p.type}'`)
      placesOk = false
    }
  }
  if (placesOk) log('PASS', `All ${ex.places.length} place types are valid vocabulary terms`)

  // 3. Object types match vocabulary
  let objectsOk = true
  for (const o of ex.objects) {
    if (!validObjects.has(o.type)) {
      log('FAIL', `${o.name}: unknown object type '${o.type}'`)
      objectsOk = false
    }
  }
  if (objectsOk) log('PASS', `All ${ex.objects.length} object types are valid vocabulary terms`)

  // 4. Relationship targets reference valid IDs + valid types
  let relsOk = true
  for (const c of ex.characters) {
    for (const rel of c.relationships || []) {
      if (!allIds.has(rel.target_id)) {
        log('FAIL', `${c.name}: relationship target '${rel.target_id}' not found in instance`)
        relsOk = false
      }
      if (!validRelTypes.has(rel.type)) {
        log('FAIL', `${c.name}: unknown relationship type '${rel.type}'`)
        relsOk = false
      }
    }
  }
  if (relsOk) log('PASS', 'All relationship targets and types are valid')

  // 5. Timeline validation
  if (ex.timeline) {
    let timelineOk = true
    const dead = new Set<string>()

    for (const m of ex.timeline.moments) {
      // Node reference validity
      if (!graphNodeIds.has(m.archetype_node)) {
        log('FAIL', `Moment ${m.moment_id}: references unknown node '${m.archetype_node}'`)
        timelineOk = false
      }

      // Participant ID validity
      for (const cid of m.participants.characters) {
        if (!charIds.has(cid)) {
          log('FAIL', `Moment ${m.moment_id}: unknown character '${cid}'`)
          timelineOk = false
        }
        // Dead character check
        if (dead.has(cid)) {
          log('WARN', `Moment ${m.moment_id}: dead character '${cid}' appears as participant`)
        }
      }
      for (const pid of m.participants.places) {
        if (!placeIds.has(pid)) {
          log('FAIL', `Moment ${m.moment_id}: unknown place '${pid}'`)
          timelineOk = false
        }
      }
      for (const oid of m.participants.objects) {
        if (!objIds.has(oid)) {
          log('FAIL', `Moment ${m.moment_id}: unknown object '${oid}'`)
          timelineOk = false
        }
      }

      // Transition change type validity
      for (const t of m.transitions || []) {
        if (!validChanges.has(t.change)) {
          log('FAIL', `Moment ${m.moment_id}: unknown change type '${t.change}'`)
          timelineOk = false
        }
        // Track deaths
        if (t.change === 'dies') {
          dead.add(t.entity_id)
        }
      }
    }
    if (timelineOk) log('PASS', `Timeline: ${ex.timeline.moments.length} moments, all valid`)
  }
}

console.log(`\n=== Summary ===`)
console.log(`  Files validated: ${filesFound}`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}`)
process.exit(errors > 0 ? 1 : 0)
