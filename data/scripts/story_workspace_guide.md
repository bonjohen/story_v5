# The Story Workspace

*A guide to the entity editor and instance management system. Estimated listening time: 9 minutes.*

---

## What the Story Workspace is

The Story Workspace is where your story becomes a living, editable thing. It takes the raw output of the generation pipeline — the characters, places, objects, factions, and plot threads that the system creates — and turns them into a persistent, browseable, editable story instance.

Think of it as the difference between a build log and a project. The generation pipeline produces artifacts. The Story Workspace gives those artifacts a home.

You reach it by opening the hamburger menu and selecting "Story," or navigating to the /story route.

---

## Story instances

Everything in the Story Workspace lives inside a story instance. An instance is a self-contained package: metadata (title, archetype, genre, creation date) plus a full StoryLore object holding every entity in your story.

You can have multiple instances. The instance selector in the toolbar lets you switch between them, create new ones, rename them, or delete them. Each instance is persisted to your browser's local storage, so it survives page refreshes and browser restarts.

There are two ways to create an instance. You can create a blank one from the instance selector and populate it manually. Or you can run the generation pipeline from the main Structure page, then click "Save as Story Instance" in the Generation panel. That snapshots all the generated detail bindings — characters, places, objects, relationships — into a new instance automatically.

---

## The six tabs

The workspace is organized into six tabs: Characters, Places, Objects, Factions, Threads, and Maps.

**Characters** gives you a list-detail editor for every character in your story. You can edit their name, role (protagonist, antagonist, mentor, trickster, and so on), status (active, injured, dead, transformed), arc type (transformative, steadfast, tragic, corrupted, redemptive), description, traits, motivations, knowledge, and possessions. Every character links back to the archetype and genre structures that created them.

**Places** works the same way for locations. Each place has a type (city, wilderness, sanctuary, threshold, and others), atmosphere text, rules that govern what can happen there, and connections to other places.

**Objects** tracks significant items: weapons, keys, vessels, relics. Each has a type, significance level, custody chain (who has held it), and status.

**Factions** manages groups: kingdoms, guilds, families, armies, cults, corporations. Each faction has goals, members (linked to characters), and relationships with other factions.

**Threads** is a kanban-style plot thread tracker. Threads flow through four columns — Open, Progressing, Resolved, Abandoned — with urgency color coding (green for low, amber for medium, red for high, purple for critical). This gives you a bird's-eye view of your story's unresolved tensions.

**Maps** is the visual relationship layer, which deserves its own section.

---

## Editing entities

Every editor follows the same pattern. The left side is a scrollable list of entities with name, type badge, and status indicator. Click one to select it, and the right side shows a full edit form.

All changes save immediately to the instance store. There's no save button — the workspace uses real-time persistence.

To add a new entity, click the "Add" button at the top of the list. To delete one, use the delete button in the edit form. The system generates unique IDs automatically, so you never need to worry about ID collisions.

---

## Import and export

The toolbar has Export and Import buttons. Export downloads your current story instance as a .story.json file — a portable, human-readable snapshot of everything. Import lets you load a previously exported instance.

This means you can share story instances between browsers, back them up, or version them manually. The JSON format is the same StoryInstance type used internally, so it's also useful for developers building tools against the data.

---

## How it connects to the pipeline

The Story Workspace is not a replacement for the generation pipeline — it's a companion. The pipeline generates structural plans and prose. The workspace gives you a place to inspect, edit, and extend the entities that the pipeline created.

If you generate a story and save it as an instance, you'll see every character the pipeline created, with all their traits and relationships intact. You can then edit them — change a name, adjust a motivation, add a relationship — and those changes live in the instance. The bidirectional bridge means you can also export instance data back as constraints for a new generation run.

This is the workflow the system is designed for: generate, inspect, edit, regenerate. Each cycle refines the story.
