export interface Migration {
  version: number
  description: string
  sql: string
}

import { migration001 } from './001_schema_version.ts'
import { migration002 } from './002_core_tables.ts'

export const migrations: Migration[] = [
  migration001,
  migration002,
]
