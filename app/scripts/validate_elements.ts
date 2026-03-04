/**
 * Element Template Validation Script
 *
 * Validates all 15 archetype elements.json files:
 * 1. Vocabulary compliance (all roles/types from controlled vocabularies)
 * 2. Node ID validity (all referenced nodes exist in graph.json)
 * 3. Node coverage (every graph node referenced by at least one element)
 * 4. Timeline validity (every timeline entry references a valid node)
 *
 * Usage: npx tsx app/scripts/validate_elements.ts
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

// Load vocabularies
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

// Find all archetype directories
const archetypeDir = join(DATA_ROOT, 'archetypes')
const dirs = readdirSync(archetypeDir).filter(d => statSync(join(archetypeDir, d)).isDirectory())

console.log('=== Element Template Validation ===\n')

for (const dir of dirs) {
  const elemPath = join(archetypeDir, dir, 'elements.json')
  const graphPath = join(archetypeDir, dir, 'graph.json')

  if (!existsSync(elemPath)) {
    log('WARN', `${dir}: no elements.json found`)
    continue
  }

  console.log(`--- ${dir} ---`)

  const elem = JSON.parse(readFileSync(elemPath, 'utf-8'))
  const graph = JSON.parse(readFileSync(graphPath, 'utf-8'))
  const graphNodeIds = new Set(graph.nodes.map((n: { node_id: string }) => n.node_id))

  // 1. Vocabulary compliance
  let vocabOk = true
  for (const c of elem.element_templates.characters) {
    if (!validRoles.has(c.role)) { log('FAIL', `Unknown character role: ${c.role}`); vocabOk = false }
  }
  for (const p of elem.element_templates.places) {
    if (!validPlaces.has(p.type)) { log('FAIL', `Unknown place type: ${p.type}`); vocabOk = false }
  }
  for (const o of elem.element_templates.objects) {
    if (!validObjects.has(o.type)) { log('FAIL', `Unknown object type: ${o.type}`); vocabOk = false }
  }
  if (vocabOk) log('PASS', 'All roles/types from controlled vocabularies')

  // 2. Node ID validity in appears_at_nodes
  const allRefNodes = new Set<string>()
  let nodeRefsOk = true
  for (const list of [elem.element_templates.characters, elem.element_templates.places, elem.element_templates.objects]) {
    for (const item of list) {
      for (const nodeId of item.appears_at_nodes) {
        allRefNodes.add(nodeId)
        if (!graphNodeIds.has(nodeId)) {
          log('FAIL', `${item.role || item.type} references unknown node: ${nodeId}`)
          nodeRefsOk = false
        }
      }
    }
  }
  if (nodeRefsOk) log('PASS', 'All node references valid')

  // 3. Every graph node referenced by at least one element
  let coverageOk = true
  for (const nodeId of graphNodeIds) {
    if (!allRefNodes.has(nodeId)) {
      log('WARN', `Node ${nodeId} not referenced by any element template`)
      coverageOk = false
    }
  }
  if (coverageOk) log('PASS', `All ${graphNodeIds.size} graph nodes covered by element templates`)

  // 4. Template timeline validation
  if (elem.template_timeline) {
    let timelineOk = true
    const timelineNodes = new Set<string>()

    for (const tm of elem.template_timeline) {
      timelineNodes.add(tm.archetype_node)
      if (!graphNodeIds.has(tm.archetype_node)) {
        log('FAIL', `Timeline references unknown node: ${tm.archetype_node}`)
        timelineOk = false
      }

      // Check transition change types
      for (const tr of tm.expected_transitions || []) {
        if (tr.change !== 'establishes_baseline' && !validChanges.has(tr.change)) {
          log('FAIL', `Timeline transition uses unknown change type: ${tr.change}`)
          timelineOk = false
        }
      }
    }

    // Check all graph nodes have timeline entries
    for (const nodeId of graphNodeIds) {
      if (!timelineNodes.has(nodeId)) {
        log('WARN', `Node ${nodeId} has no template timeline entry`)
        timelineOk = false
      }
    }

    if (timelineOk) log('PASS', `Template timeline covers all ${graphNodeIds.size} nodes with valid transitions`)
  } else {
    log('WARN', 'No template_timeline found')
  }

  // Summary for this archetype
  log('PASS', `${elem.element_templates.characters.length} characters, ${elem.element_templates.places.length} places, ${elem.element_templates.objects.length} objects`)
}

console.log(`\n=== Summary ===`)
console.log(`  Archetypes validated: ${dirs.length}`)
console.log(`  Errors: ${errors}`)
console.log(`  Warnings: ${warnings}`)
process.exit(errors > 0 ? 1 : 0)
