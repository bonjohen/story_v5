import type { Migration } from './index.ts'

export const migration004: Migration = {
  version: 4,
  description: 'Create chapters, scenes, scene_entities tables',
  sql: `
    CREATE TABLE chapters (
      chapter_id        TEXT PRIMARY KEY,
      story_id          TEXT NOT NULL,
      chapter_number    INTEGER,
      title             TEXT,
      summary           TEXT,
      status            TEXT,
      target_word_count INTEGER,
      actual_word_count INTEGER,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL,
      json_data         TEXT,
      FOREIGN KEY (story_id) REFERENCES stories(story_id)
    );

    CREATE TABLE scenes (
      scene_id           TEXT PRIMARY KEY,
      story_id           TEXT NOT NULL,
      chapter_id         TEXT,
      scene_number       INTEGER,
      title              TEXT,
      summary            TEXT,
      status             TEXT,
      scene_type         TEXT,
      timeline_order     INTEGER,
      archetype_node_id  TEXT,
      genre_node_id      TEXT,
      location_entity_id TEXT,
      target_word_count  INTEGER,
      actual_word_count  INTEGER,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      json_data          TEXT,
      FOREIGN KEY (story_id) REFERENCES stories(story_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
    );

    CREATE TABLE scene_entities (
      scene_entity_id    TEXT PRIMARY KEY,
      scene_id           TEXT NOT NULL,
      entity_id          TEXT NOT NULL,
      participation_role TEXT,
      created_at         TEXT NOT NULL,
      json_data          TEXT,
      FOREIGN KEY (scene_id) REFERENCES scenes(scene_id),
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );
  `,
}
