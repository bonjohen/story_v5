import type { Migration } from './index.ts'

export const migration002: Migration = {
  version: 2,
  description: 'Create projects, stories, entities, entity_relationships tables',
  sql: `
    CREATE TABLE projects (
      project_id       TEXT PRIMARY KEY,
      project_key      TEXT UNIQUE NOT NULL,
      name             TEXT NOT NULL,
      description      TEXT,
      status           TEXT,
      default_story_id TEXT,
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL,
      json_data        TEXT
    );

    CREATE TABLE stories (
      story_id            TEXT PRIMARY KEY,
      project_id          TEXT NOT NULL,
      story_key           TEXT UNIQUE NOT NULL,
      title               TEXT NOT NULL,
      summary             TEXT,
      status              TEXT,
      archetype_id        TEXT,
      genre_id            TEXT,
      pov_mode            TEXT,
      target_length_words INTEGER,
      created_at          TEXT NOT NULL,
      updated_at          TEXT NOT NULL,
      json_data           TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    );

    CREATE TABLE entities (
      entity_id               TEXT PRIMARY KEY,
      story_id                TEXT NOT NULL,
      entity_type             TEXT NOT NULL,
      name                    TEXT NOT NULL,
      short_description       TEXT,
      status                  TEXT,
      role_label              TEXT,
      introduced_in_scene_id  TEXT,
      introduced_in_chapter_id TEXT,
      sort_order              INTEGER,
      created_at              TEXT NOT NULL,
      updated_at              TEXT NOT NULL,
      json_data               TEXT,
      FOREIGN KEY (story_id) REFERENCES stories(story_id)
    );

    CREATE TABLE entity_relationships (
      relationship_id   TEXT PRIMARY KEY,
      story_id          TEXT NOT NULL,
      from_entity_id    TEXT NOT NULL,
      to_entity_id      TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      strength_value    REAL,
      status            TEXT,
      notes             TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL,
      json_data         TEXT,
      FOREIGN KEY (story_id) REFERENCES stories(story_id),
      FOREIGN KEY (from_entity_id) REFERENCES entities(entity_id),
      FOREIGN KEY (to_entity_id) REFERENCES entities(entity_id)
    );
  `,
}
