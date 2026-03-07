# The Import Bridge: Indexing Stories to the Database

The SQLite data layer and the existing localStorage stores serve different purposes. The Zustand stores power the UI — they hold the active story instance, manuscript text, notes, and workspace state. The database provides a queryable index over that same data. The import bridge connects these two worlds.

## What Gets Imported

There are three import bridges, each handling a different data source:

**Instance importer** — takes a StoryInstance from the instance store and writes it to the database. This includes:
- A story row with the title, archetype, genre, and status
- Entity rows for every character, place, object, faction, plot thread, and world rule in the StoryLore
- Relationship rows for every entity relationship
- Term usage records linking entities to their vocabulary terms (character roles, relationship types, place types, object types)

**Manuscript importer** — takes chapter data from the manuscript store and writes chapter and scene rows. Each ManuscriptChapter becomes a chapter row, and each scene within it becomes a scene row with the correct chapter_id foreign key. Scene ordering within chapters is preserved.

**Generation importer** — takes artifacts from a generation pipeline run and creates a run row plus individual artifact rows. This tracks what the pipeline produced, when it ran, and the status of each artifact.

## How to Index a Story

From the Story Workspace, click the "Index to DB" button in the toolbar. This triggers the instance importer, which reads the active StoryInstance from the instance store. If there is manuscript data in the manuscript store, it also runs the manuscript importer.

The import process creates a default project if none exists, then creates all the rows described above. When it finishes, a status message shows the counts: how many entities, relationships, scenes, and term usage records were created.

You can re-index at any time. The importer creates new rows on each import — it does not deduplicate against previous imports. If you want a clean slate, use the Reset DB button on the Database Management page first.

## Term Usage During Import

The instance importer does more than copy data — it enriches it with vocabulary linkage. For each imported entity, it checks whether the entity's type or role corresponds to a vocabulary term and, if so, creates a term_usage record.

For characters, it looks up the character's role in the `character_role` vocabulary domain. A character with role "antagonist" gets linked to the "antagonist" term. For relationships, it checks the `relationship_type` domain. For places and objects, it checks `place_type` and `object_type` respectively.

This automatic linkage means that as soon as you index a story, the Template Coverage view can show which vocabulary terms are in use. You do not need to manually tag anything — the importer infers the connections from the data that already exists in your story instance.

## What the Database Enables

Once a story is indexed, several new capabilities become available:

**Cross-entity queries** — find all characters who appear in a specific chapter, or all scenes where two characters interact. These queries join across the scenes, scene_entities, and entities tables.

**Vocabulary-powered search** — find all entities that use a specific vocabulary term. "Show me every character with the mentor role" becomes a simple join between entities and term_usage.

**Coverage analysis** — the Template Coverage view shows which vocabulary terms your story uses and which it does not, broken down by domain.

**Export** — the entire database can be exported as a `.db` file, which is a standard SQLite database readable by any SQLite tool. This provides a portable, queryable snapshot of your story metadata.

The import bridge is deliberately one-directional. The database indexes what the stores contain; it does not write back to the stores. This keeps the architecture simple and avoids synchronization conflicts. The stores are the source of truth for editing; the database is the source of truth for querying.
