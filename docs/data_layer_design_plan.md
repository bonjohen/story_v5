# SQLite Data Layer — Phased Implementation Plan

Based on `docs/data_layer_design.md`. Introduces a SQLite metadata store alongside the existing graph corpus and localStorage-based UI state.

Usage: Always set the task to in work [~] before working on it, and to [X] when complete. All items should move through the progression [ ] -> [~] -> [X].

---

## Open Questions — Resolved

The design document (section 20) lists open questions. Resolutions below guide all subsequent phases.

| # | Question | Resolution |
|---|----------|------------|
| 1 | Exact table and column names | Follow design doc names exactly. They align well with existing TypeScript types. |
| 2 | `archetype_id` / `genre_id` references | Store the corpus graph `id` field (e.g. `"01_heros_journey"`, `"01_fantasy"`). These are stable string keys already used throughout the codebase. |
| 3 | Scene-to-chapter cardinality | Many-to-one: each scene has a single `chapter_id` FK, and each chapter contains many scenes. The existing `ChapterManifest` uses `scene_ids[]` per chapter — scenes.chapter_id is the inverse of that array. A scene always belongs to exactly one chapter. |
| 4 | Timeline events vs scenes | Scenes and timeline events are the same row in V1. The `scenes` table has `timeline_order` for chronological position. Separate timeline events can be added in V2 if needed. |
| 5 | Columns vs `json_data` | Promote any field that appears in the design doc schema as a column. Use `json_data` for data imported from StoryLore that doesn't map to a named column (e.g. character traits arrays, knowledge lists). |
| 6 | Generic object tables | Not in V1. Entity types are differentiated by `entity_type` text column. |
| 7 | Soft deletes | Not in V1. Use hard deletes. Add `deleted_at` column in V2 if needed. |
| 8 | Revision tables | Not in V1. |
| 9 | Import/sync from JSON corpus | Phase 6 builds importers that read StoryInstance (from localStorage or .story.json) and write rows. Phase 7 imports corpus vocabulary terms. |
| 10 | Manuscript text storage | Manuscript prose stays on disk / in localStorage. The `artifacts` table stores file path and content hash references. |

---

## Technology Decisions

- **SQLite library**: `sql.js` (Emscripten-compiled SQLite for browser). This keeps the app as a client-side SPA with no server dependency. The DB is persisted to IndexedDB (via sql.js persistence helpers) or exported/imported as a `.db` file.
- **No ORM**: Raw SQL via a thin TypeScript repository layer. Keeps dependencies minimal and SQLite features accessible.
- **Migration runner**: Custom in-app runner that reads numbered `.sql` strings from a migrations module and applies them in order, tracking `schema_version`.
- **Location**: New directory `app/src/db/` for all database code. Migration SQL lives as template literals in `app/src/db/migrations/`.
- **DB file**: Persisted to IndexedDB under key `story_metadata_db`. Export/import as `story_metadata.db`.

---

## Existing Infrastructure Inventory

Before implementing, note what already exists and what the database augments (not replaces):

- **localStorage stores** (Zustand `persist`): `instanceStore`, `notesStore`, `workspaceStore`, `manuscriptStore`. These remain the primary UI state; the SQLite layer is a parallel queryable index.
- **StoryInstance / StoryLore**: Rich TypeScript types for characters, places, objects, factions, threads, world rules, events. The import bridge (Phase 6) maps these to entity rows.
- **Generation pipeline artifacts**: StoryRequest, SelectionResult, StoryContract, StoryBackbone, StoryPlan, ChapterManifest, scene drafts. The artifact metadata table tracks these.
- **Graph corpus**: 15 archetype + 27 genre JSON graphs in `data/`. Referenced by ID, not stored in SQLite.
- **Controlled vocabularies**: 8 JSON files in `data/vocabulary/` define template terms — character roles (13), relationship types (10), place types (10), object types (10), change types (11), archetype node roles (14), archetype edge meanings (15), genre node roles (7), genre edge meanings (12). These are the formal template terms used in story generation. Phase 3 imports them into the `vocabulary_terms` table.

---

## Phase 1 — Foundation (sql.js, migrations, schema_version)

**Goal:** Set up sql.js, the migration framework, and the `schema_version` table. Verify SQLite works in the browser.

- [X] **1.1** Install `sql.js` dependency. Configure Vite to serve the sql.js WASM file from `node_modules/sql.js/dist/sql-wasm.wasm` (copy to `public/` or configure `optimizeDeps`).
- [X] **1.2** Create `app/src/db/connection.ts` — singleton async module that initializes sql.js, loads the DB from IndexedDB (or creates a new one), and exposes `getDb(): Database`. Include `saveDb()` to persist back to IndexedDB after writes.
- [X] **1.3** Create `app/src/db/migrations/index.ts` — ordered array of migration objects `{ version: number, description: string, sql: string }`. First migration creates the `schema_version` table.
- [X] **1.4** Create `app/src/db/migrator.ts` — `runMigrations(db)` function that reads current version from `schema_version`, applies pending migrations in order, inserts version rows.
- [X] **1.5** Create `app/src/db/migrations/001_schema_version.ts` — migration 1: `CREATE TABLE schema_version (version_num INTEGER PRIMARY KEY, applied_at TEXT NOT NULL, description TEXT)`.
- [X] **1.6** Integration smoke test — on app startup (or lazy on first DB access), initialize sql.js, run migrations, verify `schema_version` has row with version 1. Add a simple `useEffect` in `App.tsx` or a dedicated init hook.
- [X] **1.7** Add `PRAGMA foreign_keys = ON` to connection initialization.

---

## Phase 2 — Core Schema (projects, stories, entities, relationships)

**Goal:** Create the four foundational tables and their repository layer.

- [X] **2.1** Create `app/src/db/migrations/002_core_tables.ts` — migration 2: `CREATE TABLE projects`, `CREATE TABLE stories`, `CREATE TABLE entities`, `CREATE TABLE entity_relationships`. Use exact columns from design doc sections 7.1–7.4.
- [X] **2.2** Create `app/src/db/repository/projectRepo.ts` — CRUD functions: `createProject`, `getProject`, `listProjects`, `updateProject`, `deleteProject`. All functions take the `Database` instance as first arg.
- [X] **2.3** Create `app/src/db/repository/storyRepo.ts` — CRUD: `createStory`, `getStory`, `listStoriesByProject`, `updateStory`, `deleteStory`.
- [X] **2.4** Create `app/src/db/repository/entityRepo.ts` — CRUD: `createEntity`, `getEntity`, `listEntitiesByStory`, `listEntitiesByType`, `updateEntity`, `deleteEntity`.
- [X] **2.5** Create `app/src/db/repository/relationshipRepo.ts` — CRUD: `createRelationship`, `listRelationshipsForEntity`, `listRelationshipsByStory`, `deleteRelationship`.
- [X] **2.6** Create `app/src/db/types.ts` — TypeScript interfaces matching each table row: `ProjectRow`, `StoryRow`, `EntityRow`, `RelationshipRow`, etc. Include shared types for status values.
- [ ] **2.7** Unit tests for repository functions using an in-memory sql.js database. Place in `app/src/db/__tests__/`.

---

## Phase 3 — Vocabulary & Template Terms

**Goal:** Import the controlled vocabulary items as formal template terms in the database. These terms are the building blocks used in story generation — character roles, relationship types, place types, object types, change types, and graph node/edge vocabularies. Storing them in SQLite enables queries like "which template terms does this story use" and powers templatized story section generation.

- [ ] **3.1** Create `app/src/db/migrations/003_vocabulary.ts` — migration 3:

  ```sql
  CREATE TABLE vocabulary_domains (
    domain_id   TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    source_file TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE vocabulary_terms (
    term_id     TEXT PRIMARY KEY,
    domain_id   TEXT NOT NULL,
    term_key    TEXT NOT NULL,
    label       TEXT NOT NULL,
    definition  TEXT,
    structural_function TEXT,
    applies_to  TEXT,          -- JSON array of entity types this term applies to
    sort_order  INTEGER,
    json_data   TEXT,          -- additional fields (examples, directionality, etc.)
    created_at  TEXT NOT NULL,
    FOREIGN KEY (domain_id) REFERENCES vocabulary_domains(domain_id),
    UNIQUE(domain_id, term_key)
  );

  CREATE TABLE term_usage (
    usage_id    TEXT PRIMARY KEY,
    term_id     TEXT NOT NULL,
    object_type TEXT NOT NULL,  -- 'entity', 'relationship', 'scene', 'edge', 'node'
    object_id   TEXT NOT NULL,
    usage_role  TEXT,           -- how the term is used: 'assigned_role', 'assigned_type', 'transition_type', etc.
    story_id    TEXT,
    created_at  TEXT NOT NULL,
    FOREIGN KEY (term_id) REFERENCES vocabulary_terms(term_id)
  );
  ```

- [ ] **3.2** Create `app/src/db/repository/vocabularyRepo.ts` — CRUD: `createDomain`, `listDomains`, `createTerm`, `listTermsByDomain`, `getTermByKey`, `recordTermUsage`, `listUsagesForTerm`, `listUsagesForObject`, `listTermsUsedInStory`.

- [ ] **3.3** Create `app/src/db/import/vocabularyImporter.ts` — `importVocabulary(db)`: reads the 8 controlled vocabulary JSON files from `data/vocabulary/` and populates `vocabulary_domains` and `vocabulary_terms`. Domain mapping:

  | Source File | Domain ID | Term Count |
  |---|---|---|
  | `element_roles.json` | `character_role` | 13 |
  | `relationship_types.json` | `relationship_type` | 10 |
  | `place_types.json` | `place_type` | 10 |
  | `object_types.json` | `object_type` | 10 |
  | `element_change_types.json` | `change_type` | 11 |
  | `archetype_node_roles.json` | `archetype_node_role` | 14 |
  | `archetype_edge_vocabulary.json` | `archetype_edge_meaning` | 15 |
  | `genre_node_roles.json` | `genre_node_role` | 7 |
  | `genre_edge_vocabulary.json` | `genre_edge_meaning` | 12 |

  Total: 9 domains, ~102 terms.

- [ ] **3.4** Wire vocabulary import into the migration or provide a manual "Import Vocabulary" action. The importer should be idempotent (upsert by `domain_id + term_key`).

- [ ] **3.5** Unit tests: verify domain/term counts after import, term lookup by key, usage recording and querying.

---

## Phase 4 — Chapters, Scenes, Scene-Entity Join

**Goal:** Add structural tables that bridge narrative units to entities. Chapters contain many scenes.

- [ ] **4.1** Create `app/src/db/migrations/004_chapters_scenes.ts` — migration 4: `CREATE TABLE chapters`, `CREATE TABLE scenes`, `CREATE TABLE scene_entities`. Columns from design doc sections 7.5–7.7. Key cardinality: `scenes.chapter_id` is a FK to `chapters.chapter_id`, and each chapter can have many scenes. Scenes are ordered within a chapter by `scene_number`.

- [ ] **4.2** Create `app/src/db/repository/chapterRepo.ts` — CRUD: `createChapter`, `listChaptersByStory`, `getChapter`, `updateChapter`, `deleteChapter`. Include `getChapterWithSceneCount` for summary views.

- [ ] **4.3** Create `app/src/db/repository/sceneRepo.ts` — CRUD: `createScene`, `listScenesByChapter`, `listScenesByStory`, `getScene`, `updateScene`, `deleteScene`. Support ordering by `timeline_order` and `scene_number`. Include `countScenesByChapter` for chapter summary.

- [ ] **4.4** Create `app/src/db/repository/sceneEntityRepo.ts` — `addEntityToScene`, `removeEntityFromScene`, `listEntitiesInScene`, `listScenesForEntity`.

- [ ] **4.5** Unit tests for chapter/scene/scene-entity repositories. Verify many-scenes-per-chapter cardinality.

---

## Phase 5 — Artifacts, Runs, Tags

**Goal:** Add operational metadata tables.

- [ ] **5.1** Create `app/src/db/migrations/005_artifacts_runs_tags.ts` — migration 5: `CREATE TABLE artifacts`, `CREATE TABLE runs`, `CREATE TABLE tags`, `CREATE TABLE tag_assignments`. Columns from design doc sections 7.8–7.11.
- [ ] **5.2** Create `app/src/db/repository/artifactRepo.ts` — CRUD: `createArtifact`, `listArtifactsByStory`, `listArtifactsByType`, `getArtifact`, `updateArtifact`, `deleteArtifact`.
- [ ] **5.3** Create `app/src/db/repository/runRepo.ts` — CRUD: `createRun`, `listRunsByStory`, `getRun`, `updateRun` (for setting `finished_at` and `status`).
- [ ] **5.4** Create `app/src/db/repository/tagRepo.ts` — `createTag`, `listTags`, `assignTag`, `removeTagAssignment`, `listTagsForObject`, `listObjectsWithTag`.
- [ ] **5.5** Unit tests for artifact/run/tag repositories.

---

## Phase 6 — Indexes and Query Optimization

**Goal:** Add the recommended indexes and verify the query use cases from the design doc, plus vocabulary-aware queries.

- [ ] **6.1** Create `app/src/db/migrations/006_indexes.ts` — migration 6: all indexes from design doc section 13 (`stories(project_id)`, `entities(story_id, entity_type)`, `entity_relationships(story_id, relationship_type)`, `chapters(story_id, chapter_number)`, `scenes(story_id, chapter_id, timeline_order)`, `scene_entities(scene_id, entity_id)`, `artifacts(story_id, artifact_type)`, `runs(story_id, run_type, status)`, `tag_assignments(object_type, object_id)`), plus vocabulary indexes (`vocabulary_terms(domain_id, term_key)`, `term_usage(term_id)`, `term_usage(object_type, object_id)`, `term_usage(story_id)`).

- [ ] **6.2** Create `app/src/db/queries.ts` — named query functions for design doc section 17 use cases plus vocabulary queries:
  1. List stories in project
  2. List characters in story
  3. List scenes in chapter order (many scenes per chapter)
  4. List scenes involving character
  5. Find unresolved artifacts
  6. List generation runs
  7. Find scenes by archetype node
  8. Find artifacts by chapter
  9. List tagged objects
  10. Find relationships for entity
  11. **List vocabulary terms used in a story** — joins `term_usage` with `vocabulary_terms` to show which template terms a story employs
  12. **Find entities by vocabulary term** — e.g. "all characters with role `mentor`", "all places of type `stronghold`"
  13. **Vocabulary coverage report** — which domains/terms are used vs. unused for a given story

- [ ] **6.3** Test each named query against a populated in-memory database.

---

## Phase 7 — Import Bridge (StoryInstance -> SQLite)

**Goal:** Bridge the existing localStorage-based StoryInstance data into SQLite rows, including vocabulary term linkage.

- [ ] **7.1** Create `app/src/db/import/instanceImporter.ts` — `importStoryInstance(db, instance: StoryInstance, projectId: string)`: creates a story row, then maps `StoryLore` entities (characters, places, objects, factions) to entity rows, relationships to relationship rows, plot threads to entity rows (type `thread`), world rules to entity rows (type `rule`), and event_log entries to scene rows (type `event`). For each imported entity, also record `term_usage` rows linking:
  - Characters to their `character_role` term (from `element_roles.json` vocabulary)
  - Relationships to their `relationship_type` term
  - Places to their `place_type` term
  - Objects to their `object_type` term

- [ ] **7.2** Create `app/src/db/import/generationImporter.ts` — `importGenerationRun(db, storyId, artifacts)`: creates a run row and artifact rows from generation pipeline output (StoryBackbone, StoryPlan, ChapterManifest, scene drafts). For scenes imported from ChapterManifest, record `term_usage` for `archetype_node_role` and `genre_node_role` if the scene references archetype/genre nodes.

- [ ] **7.3** Create `app/src/db/import/manuscriptImporter.ts` — `importManuscript(db, storyId, chapters: ManuscriptChapter[])`: creates chapter rows and scene rows from manuscript store data. Each chapter gets its scenes linked via `chapter_id` FK. Scenes are numbered within each chapter by their array position.

- [ ] **7.4** Wire import into the UI — add an "Index to DB" button in the Story Workspace toolbar that imports the active instance. Show success/failure feedback. Include a "Re-import Vocabulary" button that re-runs the vocabulary importer.

- [ ] **7.5** Test import with a realistic StoryInstance fixture. Verify term_usage rows are created for imported entities.

---

## Phase 8 — Export and DB Management UI

**Goal:** Let users export/import the SQLite file and view DB status.

- [ ] **8.1** Create `app/src/db/export.ts` — `exportDatabase(): Uint8Array` (returns raw .db bytes), `importDatabase(bytes: Uint8Array)` (replaces current DB and re-runs migrations if needed).
- [ ] **8.2** Add DB management section to Settings panel or a new `/db` route — show: schema version, table row counts (including vocabulary domain/term counts), DB size in bytes. Buttons: Export .db, Import .db, Reset DB.
- [ ] **8.3** Add auto-save to IndexedDB after each write operation (debounced, e.g. 1 second after last write).
- [ ] **8.4** Add DB initialization status indicator — small badge in the nav bar showing whether the DB is loaded (or an error state).

---

## Phase 9 — Query UI and Integration

**Goal:** Surface SQLite queries in the app UI so the database provides visible value, including vocabulary-powered views.

- [ ] **9.1** Create `app/src/db/hooks.ts` — React hooks: `useDbQuery<T>(queryFn, deps)` that runs a query function against the DB and returns `{ data, loading, error }`. Handles DB not-yet-initialized gracefully.
- [ ] **9.2** Add entity search to Story Workspace — text input that queries `entities` table by name/type, faster than scanning the full StoryLore in memory for large instances.
- [ ] **9.3** Add "Scenes for Character" view — select a character, see all scenes they participate in (via `scene_entities` join), with chapter context. Accessible from the character editor panel.
- [ ] **9.4** Add artifact browser — list all artifacts for the current story, grouped by type, with status badges and file path links. Accessible from a new "Artifacts" tab or panel.
- [ ] **9.5** Add run history panel — list all generation/validation runs for the current story, with timestamps and status. Accessible from the Generation panel.
- [ ] **9.6** Add tag-based filtering — in the entity list views, allow filtering by tags assigned via the tag system.
- [ ] **9.7** Add vocabulary term browser — browse all imported vocabulary domains and terms. Show usage counts per term. Clicking a term shows all entities/scenes/relationships that use it across stories.
- [ ] **9.8** Add "Template Coverage" view for a story — shows which vocabulary terms from each domain are used (e.g. "7 of 13 character roles used", "4 of 10 place types used"), highlighting gaps and suggesting unused terms that might enrich the story.

---

## Dependency Graph

```
Phase 1 (Foundation) --> Phase 2 (Core Schema)
Phase 2 --> Phase 3 (Vocabulary & Template Terms)
Phase 2 --> Phase 4 (Chapters/Scenes)
Phase 2 --> Phase 5 (Artifacts/Runs/Tags)
Phase 3 + Phase 4 + Phase 5 --> Phase 6 (Indexes/Queries)
Phase 3 + Phase 2 --> Phase 7 (Import Bridge)
Phase 6 + Phase 7 --> Phase 8 (Export/Management)
Phase 6 + Phase 7 --> Phase 9 (Query UI)
```

Phase 1 is the critical path. Phases 3, 4, and 5 can run in parallel after Phase 2. Phases 8 and 9 can run in parallel after their dependencies.

---

## Estimated Scope

| Phase | Items | New Files (est.) | Complexity |
|-------|-------|------------------|------------|
| 1 — Foundation | 7 | ~5 | Medium — sql.js WASM setup, IndexedDB persistence |
| 2 — Core Schema | 7 | ~7 | Medium — 4 tables, 4 repos, types, tests |
| 3 — Vocabulary & Template Terms | 5 | ~4 | Medium — 3 tables, repo, importer for 8 vocab files |
| 4 — Chapters/Scenes | 5 | ~4 | Medium — 3 tables, 3 repos |
| 5 — Artifacts/Runs/Tags | 5 | ~4 | Medium — 4 tables, 3 repos |
| 6 — Indexes/Queries | 3 | ~2 | Low — DDL + query functions (13 named queries) |
| 7 — Import Bridge | 5 | ~4 | High — type mapping from StoryLore to relational rows + term_usage |
| 8 — Export/Management | 4 | ~3 | Low — file I/O + small UI |
| 9 — Query UI | 8 | ~5 | Medium — hooks + UI panels + vocabulary browser |
| **Total** | **49** | **~38** | |

---

## Vocabulary Domain Reference

The following controlled vocabularies are imported as template term domains in Phase 3. Each term carries its definition, structural function, and metadata from the source file.

| Domain | Source File | Terms | Used By |
|---|---|---|---|
| `character_role` | `data/vocabulary/element_roles.json` | 13 (protagonist, antagonist, mentor, ally, herald, threshold_guardian, shadow, trickster, shapeshifter, love_interest, foil, confidant, comic_relief) | Entity rows where `entity_type = 'character'` |
| `relationship_type` | `data/vocabulary/relationship_types.json` | 10 (ally, rival, mentor_student, parent_child, romantic, nemesis, servant_master, sibling, betrayer, guardian) | `entity_relationships.relationship_type` |
| `place_type` | `data/vocabulary/place_types.json` | 10 (ordinary_world, threshold, special_world, sanctuary, stronghold, wasteland, crossroads, underworld, summit, home) | Entity rows where `entity_type = 'place'` |
| `object_type` | `data/vocabulary/object_types.json` | 10 (weapon, talisman, document, treasure, mcguffin, symbol, tool, key, vessel, relic) | Entity rows where `entity_type = 'object'` |
| `change_type` | `data/vocabulary/element_change_types.json` | 11 (learns, gains, loses, transforms, arrives, departs, bonds, breaks, dies, reveals, decides) | Scene transitions / timeline events |
| `archetype_node_role` | `data/vocabulary/archetype_node_roles.json` | 14 (Origin, Disruption, Threshold, Trial, Revelation, Reversal, Commitment, Crisis, Transformation, Irreversible Cost, Resolution, Descent, Catalyst, Reckoning) | `scenes.archetype_node_id` mapping |
| `archetype_edge_meaning` | `data/vocabulary/archetype_edge_vocabulary.json` | 15 (forces commitment, reveals truth, narrows options, raises cost, reframes goal, tests resolve, grants insight, triggers crisis, enables transformation, restores equilibrium, disrupts order, demands sacrifice, inverts expectation, escalates conflict, compels return) | Edge transitions between scenes |
| `genre_node_role` | `data/vocabulary/genre_node_roles.json` | 7 (Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, Anti-Pattern) | `scenes.genre_node_id` mapping |
| `genre_edge_meaning` | `data/vocabulary/genre_edge_vocabulary.json` | 12 (specifies constraint, narrows scope, branches into subtype, mandates element, prohibits element, inherits constraint, sets tone, introduces setting rule, specializes threat, restricts resolution, differentiates from, requires payoff) | Genre constraint edges |

---

## Design Principles

1. **SQLite is an index, not the source of truth** — the graph corpus JSON files and generated artifacts remain canonical. SQLite provides queryable metadata about them.
2. **No server required** — sql.js runs entirely in the browser. The app remains a client-side SPA.
3. **Coexist with localStorage** — Zustand stores continue to drive UI state. SQLite provides cross-entity queries and operational tracking that localStorage cannot.
4. **Migrations are forward-only** — every schema change is a numbered migration. No manual DDL.
5. **json_data for flexibility** — structured columns for queryable fields, JSON blob for everything else. Promote fields to columns when query patterns demand it.
6. **Import, don't migrate** — data flows from StoryInstance/generation artifacts into SQLite via explicit import, not automatic sync. The user decides when to index.
7. **Vocabulary terms are template terms** — the controlled vocabulary items from `data/vocabulary/` are the formal template language of the generation pipeline. Storing them in SQLite makes them queryable, enables coverage analysis, and supports templatized story section generation where entity references are resolved against known terms.
8. **Chapters contain many scenes** — the chapter-scene relationship is one-to-many (one chapter, many scenes). Scenes are ordered within chapters by `scene_number`. This matches the existing `ChapterManifest` structure where each chapter lists multiple `scene_ids`.
