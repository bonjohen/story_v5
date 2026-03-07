# The Scene Board

*A guide to the card-based scene planning surface. Estimated listening time: 8 minutes.*

---

## What the Scene Board is

The Scene Board is a visual planning surface for your story's scenes. It takes the beat-by-beat structure that the generation pipeline produces and presents it as a board of draggable cards organized into lanes.

If you've used Plottr, Trello, or any card-based planning tool, the Scene Board will feel familiar. The difference is that every card here is backed by the graph engine — each scene knows which archetype node it serves, which genre obligations it fulfills, and which characters participate.

Navigate to it by clicking "Scenes" in the toolbar, or going to the /sceneboard route.

---

## Where scenes come from

The Scene Board auto-populates from the generation pipeline. When you generate a story plan or backbone from the main page, the Scene Board reads that data and creates cards for each scene.

Each card carries: a title, a synopsis, the archetype node it implements, a list of genre obligations (with met/unmet status), participating characters, the setting, and a status (draft, reviewed, or locked). The card also tracks which chapter the scene belongs to.

If you haven't run a generation yet, the Scene Board will be empty. That's expected — it's a view over generated data, not a standalone outliner.

---

## Lane modes

The board organizes cards into lanes, and you can switch between five lane modes using the buttons at the top:

**Chapter** groups scenes by their chapter assignment. This is the default — it shows your story as a sequence of chapters, each containing its scenes in order.

**Archetype Phase** groups scenes by which archetype node they serve. This reveals the structural skeleton: you can see all your Call to Adventure scenes together, all your Ordeal scenes together, and spot gaps where a structural phase has no scenes.

**Character** creates a lane for each character, showing every scene they appear in. This is useful for tracking character presence — if a character disappears for ten scenes, you'll see the gap immediately.

**Location** groups scenes by setting. This reveals the spatial rhythm of your story — how often you return to particular places, and which locations cluster together.

---

## Filtering

The filter bar lets you narrow the board to specific slices. You can filter by character (show only scenes featuring a particular character), by location, or clear filters to see everything.

Filters combine with lane modes. For example, you can set lane mode to Chapter and filter by a specific character to see "in which chapters does this character appear?"

---

## Scene detail

Click any card to open the detail flyout on the right side. This shows the full scene information: title, synopsis, status, archetype node, genre obligations with their met/unmet markers, characters, setting, and a notes field.

You can edit the synopsis, change the status between draft, reviewed, and locked, and add notes. The genre obligation list is read-only — it comes from the generation pipeline's compliance analysis.

The obligation badges use color coding: green dots for met obligations, red for unmet, yellow for partial. This gives you an instant sense of whether a scene is pulling its structural weight.

---

## Reordering

You can reorder scenes within the board. The position changes are tracked in the store, so your arrangement persists across page visits. This lets you experiment with scene order without affecting the underlying generation data.

---

## How it connects

The Scene Board is a view, not a source of truth. It reads from the generation pipeline's StoryPlan and StoryBackbone artifacts. If you regenerate, the board will repopulate with new data.

The board is most useful after you've generated a backbone and plan — that's when you have enough structural data for the cards to be meaningful. Before generation, there's nothing to display.
