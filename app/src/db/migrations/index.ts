export interface Migration {
  version: number
  description: string
  sql: string
}

import { migration001 } from './001_schema_version.ts'
import { migration002 } from './002_core_tables.ts'
import { migration003 } from './003_vocabulary.ts'
import { migration004 } from './004_chapters_scenes.ts'
import { migration005 } from './005_artifacts_runs_tags.ts'

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
]
