import type { Migration } from './index.ts'

export const migration006: Migration = {
  version: 6,
  description: 'Add indexes for all major query patterns',
  sql: `
    -- Core table indexes
    CREATE INDEX IF NOT EXISTS idx_stories_project ON stories(project_id);
    CREATE INDEX IF NOT EXISTS idx_entities_story_type ON entities(story_id, entity_type);
    CREATE INDEX IF NOT EXISTS idx_relationships_story_type ON entity_relationships(story_id, relationship_type);
    CREATE INDEX IF NOT EXISTS idx_chapters_story_num ON chapters(story_id, chapter_number);
    CREATE INDEX IF NOT EXISTS idx_scenes_story_chapter_timeline ON scenes(story_id, chapter_id, timeline_order);
    CREATE INDEX IF NOT EXISTS idx_scene_entities_scene ON scene_entities(scene_id, entity_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_story_type ON artifacts(story_id, artifact_type);
    CREATE INDEX IF NOT EXISTS idx_runs_story_type_status ON runs(story_id, run_type, status);
    CREATE INDEX IF NOT EXISTS idx_tag_assignments_object ON tag_assignments(object_type, object_id);

    -- Vocabulary indexes
    CREATE INDEX IF NOT EXISTS idx_vocab_terms_domain ON vocabulary_terms(domain_id, term_key);
    CREATE INDEX IF NOT EXISTS idx_term_usage_term ON term_usage(term_id);
    CREATE INDEX IF NOT EXISTS idx_term_usage_object ON term_usage(object_type, object_id);
    CREATE INDEX IF NOT EXISTS idx_term_usage_story ON term_usage(story_id);
  `,
}
