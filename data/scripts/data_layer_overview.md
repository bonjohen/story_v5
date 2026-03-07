# The SQLite Data Layer

Up to this point, all of the story data in this system — characters, places, objects, scenes, generation artifacts — has lived in browser localStorage, managed by Zustand stores. That approach works well for single-session editing, but it has limits. You cannot run relational queries across entities. You cannot ask "which characters appear in chapter three?" without scanning every scene object in memory. You cannot export a portable database file or track which vocabulary terms a story actually uses.

The SQLite data layer solves these problems by adding a full relational database to the browser. It runs entirely client-side using sql.js, an Emscripten-compiled version of SQLite that executes as WebAssembly. There is no server. The database lives in your browser's IndexedDB storage and can be exported as a standard `.db` file at any time.

## What It Stores

The data layer has six groups of tables, built up through six database migrations:

**Core tables** — `projects`, `stories`, `entities`, and `entity_relationships`. A project contains stories. A story contains entities (characters, places, objects, factions, threads, rules). Entities can have typed relationships to one another.

**Vocabulary tables** — `vocabulary_domains` and `vocabulary_terms`. These hold the controlled vocabulary that underpins the entire system: 9 domains covering character roles, relationship types, place types, object types, change types, archetype node roles, archetype edge meanings, genre node roles, and genre edge meanings. About 102 terms in total.

**Chapter and scene tables** — `chapters`, `scenes`, and `scene_entities`. Chapters belong to stories. Each chapter contains many scenes, ordered by scene number. The `scene_entities` join table tracks which entities participate in each scene.

**Artifact and run tables** — `artifacts` and `runs`. These track generation pipeline output: what was generated, when, by which pipeline stage, and its current status.

**Tag tables** — `tags` and `tag_assignments`. A generic tagging system that can attach labels to any object type.

**Term usage table** — `term_usage`. This is the bridge between vocabulary terms and story objects. When a character is assigned the "mentor" role, a term_usage row links that character entity to the "mentor" vocabulary term. This enables powerful queries: find all mentors across all stories, or check which character roles a story has not yet used.

## How It Initializes

When the app starts, it checks IndexedDB for an existing database. If one exists, it loads it. If not, it creates a fresh database. Either way, the migration runner checks the current schema version and applies any pending migrations. This means the schema evolves forward automatically — you never need to manually update the database structure.

The database status appears as a small green "DB" indicator in the navigation bar. If initialization fails, it shows a red indicator instead.

## Architecture Decisions

Several design choices are worth noting:

The SQLite layer runs *alongside* localStorage, not instead of it. The Zustand stores remain the primary source of truth for UI state. The database is a parallel queryable index — you can think of it as a search index that happens to be a full relational database.

There is no ORM. All queries are raw SQL wrapped in a thin TypeScript repository layer. Each table has its own repository file with standard CRUD functions. Every repository function takes the Database instance as its first argument, keeping the code testable and the dependency explicit.

Migrations are numbered TypeScript modules, each exporting a version number, description, and SQL string. The migrator applies them in order, tracking progress in a `schema_version` table. Foreign keys are enforced via `PRAGMA foreign_keys = ON`.

Database writes are auto-saved to IndexedDB with a one-second debounce. This prevents excessive writes during rapid editing while ensuring data is not lost.

## The Database Management Page

The `/db` route provides a dedicated management interface with three tabs:

The **Status** tab shows the current schema version, database size, and row counts for every table. It also provides action buttons for exporting the database as a `.db` file, importing a previously exported database, importing vocabulary terms from the corpus, and resetting the database entirely.

The **Vocabulary** tab opens a three-column browser: domains on the left, terms in the middle, and term details with usage information on the right. This lets you explore the full controlled vocabulary and see where each term is actually used.

The **Coverage** tab shows template term coverage for a selected story — which vocabulary domains and terms the story uses, displayed as progress bars with percentages. This highlights gaps that might suggest opportunities for enriching the narrative.
