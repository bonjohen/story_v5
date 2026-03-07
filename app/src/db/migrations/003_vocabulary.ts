import type { Migration } from './index.ts'

export const migration003: Migration = {
  version: 3,
  description: 'Create vocabulary_domains, vocabulary_terms, term_usage tables',
  sql: `
    CREATE TABLE vocabulary_domains (
      domain_id   TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT,
      source_file TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE vocabulary_terms (
      term_id             TEXT PRIMARY KEY,
      domain_id           TEXT NOT NULL,
      term_key            TEXT NOT NULL,
      label               TEXT NOT NULL,
      definition          TEXT,
      structural_function TEXT,
      applies_to          TEXT,
      sort_order          INTEGER,
      json_data           TEXT,
      created_at          TEXT NOT NULL,
      FOREIGN KEY (domain_id) REFERENCES vocabulary_domains(domain_id),
      UNIQUE(domain_id, term_key)
    );

    CREATE TABLE term_usage (
      usage_id    TEXT PRIMARY KEY,
      term_id     TEXT NOT NULL,
      object_type TEXT NOT NULL,
      object_id   TEXT NOT NULL,
      usage_role  TEXT,
      story_id    TEXT,
      created_at  TEXT NOT NULL,
      FOREIGN KEY (term_id) REFERENCES vocabulary_terms(term_id)
    );
  `,
}
