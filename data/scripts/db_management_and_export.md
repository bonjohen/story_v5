# Database Management and Export

The Database Management page, accessible at the `/db` route or via the "DB" button in the navigation bar, provides a complete interface for inspecting, maintaining, and transferring the SQLite database. It has three tabs: Status, Vocabulary, and Coverage.

## The Status Tab

The Status tab is the dashboard. It shows three sections:

**Status section** — displays the current schema version number and the total database size in bytes. The schema version tells you which migrations have been applied. A fresh database after all migrations shows version 6.

**Tables section** — lists every table in the database with its current row count. This gives you an instant picture of what the database contains. A freshly imported vocabulary shows around 9 rows in `vocabulary_domains` and around 102 in `vocabulary_terms`. After indexing a story, you will see counts in `projects`, `stories`, `entities`, `entity_relationships`, `chapters`, `scenes`, and `term_usage`.

**Actions section** — four buttons for database operations:

*Export .db* downloads the entire database as a file called `story_metadata.db`. This is a standard SQLite database file. You can open it with any SQLite client — DB Browser for SQLite, the `sqlite3` command-line tool, Python's sqlite3 module, or any other tool that reads SQLite. The export captures everything: schema, data, indexes.

*Import .db* lets you load a previously exported database file. This replaces the current database entirely. After import, the page shows the schema version of the imported file and prompts you to reload the page to activate it.

*Import Vocabulary* runs the vocabulary importer, fetching the nine controlled vocabulary JSON files and populating the `vocabulary_domains` and `vocabulary_terms` tables. This is idempotent — running it multiple times updates existing terms rather than creating duplicates. The button shows a status message with the count of domains and terms imported.

*Reset DB* deletes the entire database and recreates it from scratch, running all migrations on the fresh database. This is a destructive operation and requires confirmation. Use it when you want to start over completely.

## The Vocabulary Tab

The Vocabulary tab opens a three-column browser for exploring all imported vocabulary terms.

The left column lists all vocabulary domains — character_role, relationship_type, place_type, object_type, change_type, archetype_node_role, archetype_edge_meaning, genre_node_role, and genre_edge_meaning. Each domain shows its name, and clicking it loads the terms for that domain.

The middle column shows all terms in the selected domain. Each term displays its label and a truncated definition. Clicking a term loads its full details.

The right column shows the selected term's complete information: its label, domain, full definition, and structural function. Below that, it lists all recorded usages of the term — every entity, relationship, scene, or other object that has been linked to this term through the term_usage table. Each usage shows the object type, a truncated object ID, and the usage role.

This browser makes the controlled vocabulary tangible. Instead of reading JSON files, you can explore the vocabulary interactively and see exactly where each term is being used across your stories.

## The Coverage Tab

The Coverage tab provides a Template Coverage view for any indexed story. Start by selecting a story from the dropdown.

For the selected story, the tab shows a coverage bar for each vocabulary domain. Each bar represents the percentage of terms in that domain that the story actually uses. The numbers are explicit: "7 / 13 (54%)" means the story uses seven of thirteen available character roles.

The bars are color-coded by coverage level: green for above 60 percent, amber for 30 to 60 percent, and red for below 30 percent. Below the bars, a "Terms Used" section lists every vocabulary term the story employs, with usage counts showing how many times each term appears.

## Persistence and Auto-Save

The database persists to IndexedDB automatically. After any write operation, a debounced save triggers after one second of inactivity. This means you do not need to manually save — the database is always up to date in IndexedDB.

If you close the browser and reopen the app, the database loads from IndexedDB with all your data intact. The only way to lose data is to clear your browser's IndexedDB storage or use the Reset DB button.

For long-term backup or transfer between browsers, use the Export button to download the `.db` file. This file contains everything and can be imported on any browser running the app.

## The DB Status Indicator

In the main navigation bar, a small "DB" badge shows the database status. Green means the database initialized successfully and is ready for queries. Red with "DB err" means initialization failed — this typically indicates a problem with the sql.js WASM file or IndexedDB access.

Clicking the DB badge navigates to the Database Management page, providing quick access to the full management interface from anywhere in the app.
