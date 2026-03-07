# The Notes System

*A guide to the note-taking, tagging, and query system. Estimated listening time: 8 minutes.*

---

## What the Notes system is

The Notes system is an Obsidian-like annotation layer that lets you attach notes to any entity in your story. Notes have titles, markdown content, tags, and links to entities — characters, places, objects, factions, plot threads, scenes, or graph nodes.

Unlike the other surfaces, which derive their content from the generation pipeline or the story instance, notes are entirely user-created. They're your commentary, your reminders, your creative annotations layered on top of the structural data.

Navigate to it via the "Notes" link in the toolbar, or the /notes route.

---

## Layout

The Notes page has a three-column layout.

The **left column** is the search and filter panel. At the top is a search box for full-text filtering across all note titles and content. Below that are dropdown filters for tags and entity types. Below the filters is the note list — every note that matches the current filters, showing title, content preview, tags, and linked entities.

The **center column** is the note viewer or editor. When viewing, it shows the note title, tags, and full content. When editing, it provides input fields for title, tags (comma-separated), and a large text area for content.

The **right column** is the entity links panel. It shows which entities the selected note is linked to, with buttons to remove links. Below that is an "Add Link" section listing all entities from your active story instance that aren't already linked, so you can attach the note to additional entities with a single click.

---

## Creating and editing notes

Click "+ New Note" in the toolbar to create a blank note. It opens immediately in edit mode. Give it a title, write your content, add comma-separated tags, and click Save.

To edit an existing note, select it from the list and click the Edit button in the viewer header. The Cancel button discards unsaved changes.

To delete a note, click Delete in the viewer header. You'll be asked to confirm.

---

## Tags

Tags are free-form labels. Type them as comma-separated values in the tags field — for example, "worldbuilding, magic-system, revision-needed." Tags appear as purple badges on each note in the list.

The tag filter dropdown in the search panel shows all tags currently in use across your notes. Select a tag to see only notes with that tag.

Tags are useful for organizing notes by concern: "pacing" notes, "character-voice" notes, "plot-hole" notes, "research" notes. The system doesn't impose any tag taxonomy — you define whatever categories make sense for your workflow.

---

## Entity links

Every note can be linked to zero or more entities. An entity link is a typed reference: a character ID, a place ID, a faction ID, and so on.

Links serve two purposes. First, they organize notes around the things they're about — clicking a character in the links panel tells you this note is about that character. Second, they enable the backlinks feature: any entity detail view can show "notes referencing this entity."

To add a link, use the Add Link section in the right panel. It lists all entities from your active story instance, grouped by type. Click one to attach it.

To remove a link, click the "x" next to the entity name in the linked entities list.

---

## Saved queries

When you've set up a useful combination of search text, tag filter, and entity type filter, click "Save query" to bookmark it. Saved queries appear as small purple pills below the filter controls. Click a saved query to restore those filter settings. Click the "x" next to a saved query to remove it.

Saved queries persist across sessions, so your frequently-used views are always one click away.

---

## Backlinks

The NoteBacklinks component can be embedded in any entity detail view to show notes that reference that entity. This creates a two-way connection: the note links to the entity, and the entity's view shows the note.

This is similar to Obsidian's backlinks feature — except instead of linking between notes, you're linking between notes and story entities.

---

## How it connects

Notes are stored independently from the story instance, in their own localStorage-backed store. This means notes persist even if you switch story instances. You can have notes linked to entities across different instances if needed.

The entity link picker reads from whatever story instance is currently active. If no instance is loaded, the Add Link section will be empty, but you can still create notes with tags and content.

Notes are the most free-form surface in the system. Everything else — the Scene Board, the Timeline, the Encyclopedia — is generated or derived from structural data. Notes are your personal layer on top of that structure.
