# SQLite Metadata Design Document for `story_v5`

## 1. Purpose

This document defines a basic SQLite-based metadata layer for `story_v5`. The goal is to provide a small, durable, queryable store for story-instance metadata and project-level metadata without attempting to replace the graph corpus or manuscript artifacts.

This database is intended to:

* store metadata associated with a story project
* store metadata about story entities and generated artifacts
* support filtering, tracking, validation, and UI display
* provide a stable foundation for later expansion
* remain simple enough for an agent to implement incrementally

For now, SQLite is the persistence layer. The coding agent may refine naming, indexing, normalization level, and migration strategy as the implementation plan is created.

---

## 2. Design Goals

The metadata store should:

* be **small and local**
* be **easy to inspect manually**
* support **incremental evolution**
* separate **metadata** from large content blobs
* avoid locking the project into premature over-modeling
* support both **structured fields** and **lightweight extensibility**
* align with the graph-first architecture of the project

The metadata store should **not** initially attempt to:

* replace the JSON graph corpus
* replace final manuscript storage
* store full generated chapter text unless explicitly needed
* become the canonical source for archetype or genre graph definitions

---

## 3. Scope

Initial scope:

* project metadata
* story metadata
* entity metadata
* scene/chapter metadata
* artifact metadata
* tag/category metadata
* relationship metadata
* run/generation metadata
* audit timestamps and status values

Out of scope for first pass:

* full text search across all prose
* vector embeddings
* binary asset storage
* large version-history storage
* collaborative multi-user editing
* remote synchronization

---

## 4. Architectural Role

The SQLite database should sit beside the existing corpus and generated files.

Suggested role separation:

* **JSON / Markdown / corpus files**
  canonical structural source material

* **SQLite metadata store**
  queryable operational metadata about project instances

* **generated outputs / draft files**
  human-readable and agent-generated working artifacts

This means the database acts as an **index and coordination layer**, not as the full project container.

---

## 5. Core Concepts

The first version should model the following concepts.

### 5.1 Project

Represents a working project or repository-level unit.

Examples:

* default repository project
* a specific story experiment
* a worldbuilding sandbox
* a generated story instance

### 5.2 Story

Represents a specific story instance within a project.

Examples:

* a single novel draft
* a short story
* an experiment combining one archetype and one genre depth path

### 5.3 Entity

Represents a concrete story object.

Examples:

* character
* location
* faction
* artifact/item
* system
* motif
* secret
* organization
* creature

### 5.4 Relationship

Represents a typed association between two entities.

Examples:

* ally
* enemy
* parent
* mentor
* owns
* controls
* hides
* loves
* fears

### 5.5 Scene

Represents a story unit smaller than a chapter.

### 5.6 Chapter

Represents a higher-level narrative grouping.

### 5.7 Artifact

Represents a generated or authored file/object associated with the project.

Examples:

* backbone synthesis
* chapter outline
* scene plan
* generated prose draft
* validation report
* compliance report
* feature pack snapshot

### 5.8 Run

Represents an execution event by a tool or generation pipeline.

Examples:

* story generation run
* validation run
* chapter assembly run
* metadata import run

### 5.9 Tag

Represents user-defined or system-defined labels.

Examples:

* protagonist
* unresolved
* draft
* validated
* horror
* romance-thread
* important-reveal

---

## 6. Storage Strategy

Use SQLite with a small set of normalized tables plus optional JSON fields for extensibility.

Recommended pattern:

* important query fields as normal columns
* flexible secondary details in `json_data`
* timestamps on all major tables
* stable IDs using UUID strings
* status and type values stored as text initially
* foreign keys enabled

This balances structure and flexibility.

---

## 7. Proposed Initial Schema

## 7.1 `projects`

Stores project-level metadata.

Suggested fields:

* `project_id` TEXT PRIMARY KEY
* `project_key` TEXT UNIQUE NOT NULL
* `name` TEXT NOT NULL
* `description` TEXT
* `status` TEXT
* `default_story_id` TEXT
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

---

## 7.2 `stories`

Stores story-instance metadata.

Suggested fields:

* `story_id` TEXT PRIMARY KEY
* `project_id` TEXT NOT NULL
* `story_key` TEXT UNIQUE NOT NULL
* `title` TEXT NOT NULL
* `summary` TEXT
* `status` TEXT
* `archetype_id` TEXT
* `genre_id` TEXT
* `pov_mode` TEXT
* `target_length_words` INTEGER
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

Foreign key:

* `project_id -> projects.project_id`

---

## 7.3 `entities`

Stores story entities.

Suggested fields:

* `entity_id` TEXT PRIMARY KEY
* `story_id` TEXT NOT NULL
* `entity_type` TEXT NOT NULL
* `name` TEXT NOT NULL
* `short_description` TEXT
* `status` TEXT
* `role_label` TEXT
* `introduced_in_scene_id` TEXT
* `introduced_in_chapter_id` TEXT
* `sort_order` INTEGER
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

Examples of `entity_type`:

* character
* location
* faction
* item
* motif
* secret
* system

---

## 7.4 `entity_relationships`

Stores typed links between entities.

Suggested fields:

* `relationship_id` TEXT PRIMARY KEY
* `story_id` TEXT NOT NULL
* `from_entity_id` TEXT NOT NULL
* `to_entity_id` TEXT NOT NULL
* `relationship_type` TEXT NOT NULL
* `strength_value` REAL
* `status` TEXT
* `notes` TEXT
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

---

## 7.5 `chapters`

Stores chapter metadata.

Suggested fields:

* `chapter_id` TEXT PRIMARY KEY
* `story_id` TEXT NOT NULL
* `chapter_number` INTEGER
* `title` TEXT
* `summary` TEXT
* `status` TEXT
* `target_word_count` INTEGER
* `actual_word_count` INTEGER
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

---

## 7.6 `scenes`

Stores scene metadata.

Suggested fields:

* `scene_id` TEXT PRIMARY KEY
* `story_id` TEXT NOT NULL
* `chapter_id` TEXT
* `scene_number` INTEGER
* `title` TEXT
* `summary` TEXT
* `status` TEXT
* `scene_type` TEXT
* `timeline_order` INTEGER
* `archetype_node_id` TEXT
* `genre_node_id` TEXT
* `location_entity_id` TEXT
* `target_word_count` INTEGER
* `actual_word_count` INTEGER
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

This is a key bridging table between formal structure and authoring.

---

## 7.7 `scene_entities`

Join table linking scenes and entities.

Suggested fields:

* `scene_entity_id` TEXT PRIMARY KEY
* `scene_id` TEXT NOT NULL
* `entity_id` TEXT NOT NULL
* `participation_role` TEXT
* `created_at` TEXT NOT NULL
* `json_data` TEXT

Examples of `participation_role`:

* pov
* present
* mentioned
* antagonist
* revealed
* introduced

---

## 7.8 `artifacts`

Stores metadata about files and generated objects.

Suggested fields:

* `artifact_id` TEXT PRIMARY KEY
* `story_id` TEXT
* `chapter_id` TEXT
* `scene_id` TEXT
* `artifact_type` TEXT NOT NULL
* `name` TEXT NOT NULL
* `file_path` TEXT
* `content_hash` TEXT
* `format` TEXT
* `status` TEXT
* `generator_name` TEXT
* `created_at` TEXT NOT NULL
* `updated_at` TEXT NOT NULL
* `json_data` TEXT

Examples of `artifact_type`:

* story_backbone
* outline
* chapter_plan
* prose_draft
* validation_report
* compliance_report
* export

---

## 7.9 `runs`

Stores execution metadata.

Suggested fields:

* `run_id` TEXT PRIMARY KEY
* `project_id` TEXT
* `story_id` TEXT
* `run_type` TEXT NOT NULL
* `status` TEXT NOT NULL
* `started_at` TEXT NOT NULL
* `finished_at` TEXT
* `tool_name` TEXT
* `trigger_source` TEXT
* `notes` TEXT
* `json_data` TEXT

Examples of `run_type`:

* import
* validate
* generate
* assemble
* sync_metadata

---

## 7.10 `tags`

Stores available tags.

Suggested fields:

* `tag_id` TEXT PRIMARY KEY
* `project_id` TEXT
* `tag_name` TEXT NOT NULL
* `tag_type` TEXT
* `description` TEXT
* `created_at` TEXT NOT NULL

---

## 7.11 `tag_assignments`

Generic tag mapping.

Suggested fields:

* `tag_assignment_id` TEXT PRIMARY KEY
* `tag_id` TEXT NOT NULL
* `object_type` TEXT NOT NULL
* `object_id` TEXT NOT NULL
* `created_at` TEXT NOT NULL

This avoids separate tag tables for each object class.

---

## 8. JSON Extensibility Pattern

Each major object table should include a `json_data` TEXT column.

Use cases:

* secondary UI flags
* experimental fields
* temporary migration fields
* metadata not yet promoted to first-class columns
* imported or derived properties

Rule of thumb:

* if a field is commonly filtered, sorted, joined, or validated, promote it to a normal column
* otherwise it may remain in `json_data`

---

## 9. ID and Key Strategy

Use two identifiers where useful:

* internal ID: UUID-like string
* human key: short stable key where needed

Examples:

* `story_id = "2be8..."`
* `story_key = "iron_city_draft_01"`

This supports both reliable joins and human-friendly references.

---

## 10. Status Strategy

Use text enums initially.

Suggested common statuses:

* planned
* active
* draft
* generated
* reviewed
* approved
* archived
* deprecated
* failed

The coding agent may later formalize these via lookup tables if needed.

---

## 11. Timestamp Strategy

All major records should include:

* `created_at`
* `updated_at`

Some tables should also include:

* `started_at`
* `finished_at`

Use ISO 8601 UTC timestamps stored as TEXT.

Example:

* `2026-03-06T16:12:00Z`

---

## 12. File Path Strategy

Do not store large content directly in the database at first.

Preferred approach:

* store metadata in SQLite
* store files on disk
* reference them via `file_path`
* optionally store `content_hash`

This keeps the DB small and easy to rebuild if needed.

---

## 13. Indexing Strategy

Initial recommended indexes:

* `stories(project_id)`
* `entities(story_id, entity_type)`
* `entity_relationships(story_id, relationship_type)`
* `chapters(story_id, chapter_number)`
* `scenes(story_id, chapter_id, timeline_order)`
* `scene_entities(scene_id, entity_id)`
* `artifacts(story_id, artifact_type)`
* `runs(story_id, run_type, status)`
* `tag_assignments(object_type, object_id)`

The agent can expand indexes after observing actual query patterns.

---

## 14. Foreign Key Policy

Enable SQLite foreign keys.

Use foreign keys for core integrity:

* project -> story
* story -> entities / chapters / scenes / artifacts / runs
* chapter -> scenes
* entity -> relationships
* scene -> scene_entities
* tag -> tag_assignments

Do not over-constrain early experiments if they will cause friction during imports; allow pragmatic refinement.

---

## 15. Migration Strategy

Use explicit schema migrations from the beginning.

Recommended approach:

* `schema_version` tracking table
* numbered SQL migration files
* forward-only migrations
* seed file for minimal default tags/statuses only if needed

Suggested table:

### `schema_version`

* `version_num` INTEGER PRIMARY KEY
* `applied_at` TEXT NOT NULL
* `description` TEXT

---

## 16. Suggested Initial Files

Suggested initial file layout:

* `data/story_metadata.db`
* `db/schema/001_init.sql`
* `db/schema/002_indexes.sql`
* `db/schema/003_seed_defaults.sql`
* `docs/sqlite_metadata_design.md`
* `docs/metadata_plan.md`
* `src/.../metadata_repository.py` or equivalent
* `src/.../metadata_models.py` or equivalent

The coding agent may refine structure to match the existing repo layout.

---

## 17. Initial Query Use Cases

The first version should support queries like:

* list all stories in a project
* list all characters in a story
* list all scenes in chapter order
* list all scenes involving a specific character
* find all unresolved artifacts
* list all generation runs for a story
* find all scenes mapped to a specific archetype node
* find all artifacts related to a chapter
* list all tagged objects with tag `unresolved`
* find all relationships for a given entity

If the schema does not support these cleanly, it is missing something important.

---

## 18. Non-Goals for V1

Do not add these in the initial implementation unless clearly needed:

* event sourcing
* full revision-history tables for every object
* graph database replacement
* embedding/vector tables
* binary asset BLOB storage
* multi-user ownership/permissions
* remote sync protocol

---

## 19. Recommended Implementation Order

1. create base schema
2. add migrations support
3. implement project and story tables
4. implement entities and relationships
5. implement chapters and scenes
6. implement artifact metadata
7. implement run metadata
8. implement tags
9. add indexes
10. add import/export helpers
11. add validation and test coverage

---

## 20. Open Questions for the Agent Plan

The coding agent should resolve these in the follow-up plan document:

* exact table and column names
* whether `archetype_id` and `genre_id` reference external files by path, key, or corpus ID
* whether scenes should support many-to-many chapter grouping or only one chapter
* whether timeline events should be separate from scenes in V1
* how much metadata belongs in columns vs `json_data`
* whether generic object tables should be introduced later
* whether to track soft deletes
* whether to add revision tables in V2
* how import/sync from JSON corpus should work
* whether manuscript text metadata should remain in artifacts or gain its own table

---

## 21. Recommendation Summary

Use SQLite as a **local metadata index and coordination store**.

Keep the design simple:

* normalized core tables
* JSON extension fields
* file-path references for large artifacts
* timestamps everywhere
* explicit migrations
* query support for stories, entities, scenes, artifacts, and runs

The most important implementation principle is this:

**the SQLite database should track the working story instance and its operational metadata, while the graph corpus and generated files remain outside the database as canonical structural and content artifacts.**
