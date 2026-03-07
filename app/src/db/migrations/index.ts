export interface Migration {
  version: number
  description: string
  sql: string
}

import { migration001 } from './001_schema_version.ts'

export const migrations: Migration[] = [
  migration001,
]
