# Navigation and Global Search

*A guide to navigating between surfaces and searching across your story. Estimated listening time: 6 minutes.*

---

## The navigation system

A slim app bar runs across the top of every page. On the left is a hamburger menu button that opens the navigation drawer — a slide-out panel with grouped links to every surface: Structure, Story, Scenes, Timeline, Encyclopedia, Manuscript, Notes, Scripts, Series, and Database. The drawer groups these into logical categories so you can find what you need quickly.

The app bar also shows the current page title and, on the main Structure page, includes the graph search (which searches within the loaded archetype or genre graph) and the global search (which searches across all your story data). A Generate button toggles the generation panel open and closed, with status indicators showing when generation is in progress or complete.

---

## Global search

The global search bar appears on the main Structure page, labeled "Search everything..." It searches across all entity types in your active story instance, plus notes, scenes, and manuscript chapters.

Type at least two characters to see results. Results appear in a dropdown grouped by type: characters, places, objects, factions, threads, notes, scenes, and chapters. Each result shows the entity name and a brief detail (role, status, tags, or scene count).

Click a result to navigate to the relevant surface. A character result takes you to the Story Workspace. A note result takes you to the Notes page. A scene result takes you to the Scene Board. A chapter result takes you to the Manuscript.

Global search is a fast way to jump to any entity without remembering which surface it lives on.

---

## Workspace persistence

The system remembers your navigation state across sessions. If you were on the Factions tab in the Story Workspace, that tab will be active next time you visit. This is handled by the workspace persistence store, which saves tab selections and panel states to local storage.

---

## Cross-surface workflow

The surfaces are designed to be used together, not in isolation. A typical workflow might look like this:

Start on the Structure page. Load an archetype and genre graph, explore the structure, then open the Generation panel and generate a story. Save the result as a story instance.

Move to the Story Workspace. Review the generated characters, places, and factions. Edit names, adjust traits, add relationships you want.

Check the Scene Board to see the story's scenes organized by chapter. Review the archetype coverage and genre obligation badges. Reorder scenes if needed.

Open the Timeline to see the chronological flow. Check the swim lanes to verify every important character has adequate presence. Look at the change-type badges to check pacing.

Browse the Encyclopedia to see your story world as a reader would — a coherent reference with cross-linked articles.

Go to the Manuscript Workspace to read and revise the prose. Use the diff view to compare your edits against the generated draft. Export when ready.

Throughout, use Notes to capture ideas, flag issues, and track revision tasks. Link notes to the entities they concern so you can find them from any surface.

---

## How it all fits together

Every surface reads from the same underlying data: the generation pipeline artifacts and the story instance store. Changes in one surface are reflected everywhere. Edit a character's name in the Story Workspace, and the Encyclopedia article updates, the Scene Board cards show the new name, and the Timeline events reference the new name.

This consistency is the benefit of building surfaces as views over a shared data model rather than as independent tools. The graph engine is the foundation. The author-facing surfaces are windows into it.
