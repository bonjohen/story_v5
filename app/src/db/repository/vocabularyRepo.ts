import type { Database } from 'sql.js'
import type { VocabularyDomainRow, VocabularyTermRow, TermUsageRow } from '../types.ts'
import { uuid, now } from './helpers.ts'

// --- Domains ---

export function createDomain(
  db: Database,
  fields: { domain_id: string; name: string; description?: string; source_file?: string },
): VocabularyDomainRow {
  const ts = now()
  db.run(
    `INSERT OR REPLACE INTO vocabulary_domains (domain_id, name, description, source_file, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [fields.domain_id, fields.name, fields.description ?? null, fields.source_file ?? null, ts],
  )
  return getDomain(db, fields.domain_id)!
}

export function getDomain(db: Database, domainId: string): VocabularyDomainRow | null {
  const result = db.exec('SELECT * FROM vocabulary_domains WHERE domain_id = ?', [domainId])
  if (!result.length || !result[0].values.length) return null
  return rowTo<VocabularyDomainRow>(result[0].columns, result[0].values[0])
}

export function listDomains(db: Database): VocabularyDomainRow[] {
  const result = db.exec('SELECT * FROM vocabulary_domains ORDER BY domain_id')
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<VocabularyDomainRow>(result[0].columns, v))
}

// --- Terms ---

export function createTerm(
  db: Database,
  fields: {
    domain_id: string
    term_key: string
    label: string
    definition?: string
    structural_function?: string
    applies_to?: string[]
    sort_order?: number
    json_data?: Record<string, unknown>
  },
): VocabularyTermRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT OR REPLACE INTO vocabulary_terms (term_id, domain_id, term_key, label, definition, structural_function, applies_to, sort_order, json_data, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, fields.domain_id, fields.term_key, fields.label,
      fields.definition ?? null, fields.structural_function ?? null,
      fields.applies_to ? JSON.stringify(fields.applies_to) : null,
      fields.sort_order ?? null,
      fields.json_data ? JSON.stringify(fields.json_data) : null,
      ts,
    ],
  )
  return getTermByKey(db, fields.domain_id, fields.term_key)!
}

export function getTermByKey(db: Database, domainId: string, termKey: string): VocabularyTermRow | null {
  const result = db.exec(
    'SELECT * FROM vocabulary_terms WHERE domain_id = ? AND term_key = ?',
    [domainId, termKey],
  )
  if (!result.length || !result[0].values.length) return null
  return rowTo<VocabularyTermRow>(result[0].columns, result[0].values[0])
}

export function listTermsByDomain(db: Database, domainId: string): VocabularyTermRow[] {
  const result = db.exec(
    'SELECT * FROM vocabulary_terms WHERE domain_id = ? ORDER BY sort_order, term_key',
    [domainId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<VocabularyTermRow>(result[0].columns, v))
}

// --- Term Usage ---

export function recordTermUsage(
  db: Database,
  fields: {
    term_id: string
    object_type: string
    object_id: string
    usage_role?: string
    story_id?: string
  },
): TermUsageRow {
  const id = uuid()
  const ts = now()
  db.run(
    `INSERT INTO term_usage (usage_id, term_id, object_type, object_id, usage_role, story_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, fields.term_id, fields.object_type, fields.object_id, fields.usage_role ?? null, fields.story_id ?? null, ts],
  )
  return { usage_id: id, term_id: fields.term_id, object_type: fields.object_type, object_id: fields.object_id, usage_role: fields.usage_role ?? null, story_id: fields.story_id ?? null, created_at: ts }
}

export function listUsagesForTerm(db: Database, termId: string): TermUsageRow[] {
  const result = db.exec('SELECT * FROM term_usage WHERE term_id = ? ORDER BY created_at', [termId])
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<TermUsageRow>(result[0].columns, v))
}

export function listUsagesForObject(db: Database, objectType: string, objectId: string): TermUsageRow[] {
  const result = db.exec(
    'SELECT * FROM term_usage WHERE object_type = ? AND object_id = ?',
    [objectType, objectId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => rowTo<TermUsageRow>(result[0].columns, v))
}

export function listTermsUsedInStory(db: Database, storyId: string): Array<VocabularyTermRow & { usage_count: number }> {
  const result = db.exec(
    `SELECT vt.*, COUNT(tu.usage_id) as usage_count
     FROM term_usage tu
     JOIN vocabulary_terms vt ON tu.term_id = vt.term_id
     WHERE tu.story_id = ?
     GROUP BY vt.term_id
     ORDER BY vt.domain_id, vt.term_key`,
    [storyId],
  )
  if (!result.length) return []
  return result[0].values.map((v) => {
    const row = rowTo<VocabularyTermRow & { usage_count: number }>(result[0].columns, v)
    return row
  })
}

function rowTo<T>(columns: string[], values: unknown[]): T {
  const row: Record<string, unknown> = {}
  columns.forEach((col, i) => { row[col] = values[i] })
  return row as T
}
