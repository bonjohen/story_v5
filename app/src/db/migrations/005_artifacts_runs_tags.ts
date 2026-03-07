import type { Migration } from './index.ts'

export const migration005: Migration = {
  version: 5,
  description: 'Create artifacts, runs, tags, tag_assignments tables',
  sql: `
    CREATE TABLE artifacts (
      artifact_id    TEXT PRIMARY KEY,
      story_id       TEXT,
      chapter_id     TEXT,
      scene_id       TEXT,
      artifact_type  TEXT NOT NULL,
      name           TEXT NOT NULL,
      file_path      TEXT,
      content_hash   TEXT,
      format         TEXT,
      status         TEXT,
      generator_name TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      json_data      TEXT,
      FOREIGN KEY (story_id) REFERENCES stories(story_id),
      FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id),
      FOREIGN KEY (scene_id) REFERENCES scenes(scene_id)
    );

    CREATE TABLE runs (
      run_id         TEXT PRIMARY KEY,
      project_id     TEXT,
      story_id       TEXT,
      run_type       TEXT NOT NULL,
      status         TEXT NOT NULL,
      started_at     TEXT NOT NULL,
      finished_at    TEXT,
      tool_name      TEXT,
      trigger_source TEXT,
      notes          TEXT,
      json_data      TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(project_id),
      FOREIGN KEY (story_id) REFERENCES stories(story_id)
    );

    CREATE TABLE tags (
      tag_id      TEXT PRIMARY KEY,
      project_id  TEXT,
      tag_name    TEXT NOT NULL,
      tag_type    TEXT,
      description TEXT,
      created_at  TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(project_id)
    );

    CREATE TABLE tag_assignments (
      tag_assignment_id TEXT PRIMARY KEY,
      tag_id            TEXT NOT NULL,
      object_type       TEXT NOT NULL,
      object_id         TEXT NOT NULL,
      created_at        TEXT NOT NULL,
      FOREIGN KEY (tag_id) REFERENCES tags(tag_id)
    );
  `,
}
