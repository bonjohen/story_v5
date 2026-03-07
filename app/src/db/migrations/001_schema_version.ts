import type { Migration } from './index.ts'

export const migration001: Migration = {
  version: 1,
  description: 'Create schema_version table',
  sql: `
    CREATE TABLE IF NOT EXISTS schema_version (
      version_num INTEGER PRIMARY KEY,
      applied_at  TEXT NOT NULL,
      description TEXT
    );
  `,
}
