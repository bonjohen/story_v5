# Competition Review — Phased Implementation Plan

Based on `docs/competition_review.md`. Transforms story_v5 from a structural analysis engine into a graph-native storybuilding system with author-facing surfaces.

Usage: Always set the task to in work [~] before working on it, and to [X] when complete. All items should move through the progression [ ] -> [~] -> [X].

---

## Existing Infrastructure Inventory

Before planning, note what already exists:

- **Series/Lore system** (`generation/series/`): Full `StoryLore` type with `LoreCharacter`, `LorePlace`, `LoreObject`, `LoreFaction`, `PlotThread`, `WorldRule`, `LoreEvent`. Series manager, lore merge, lore validator, state extractor, branch manager. Three UI pages (SeriesBrowser, SeriesDashboard, EpisodeCuration) and three panels (LoreViewer, ArcVisualizer, ThreadTracker).
- **Element types** (`types/elements.ts`): CharacterRole, PlaceType, ObjectType, RelationshipType, ArcType, FactionType + template/instance interfaces.
- **Timeline types** (`types/timeline.ts`): ChangeType, moment stubs, template timelines.
- **Generation pipeline**: Selection -> Contract -> Templates -> Backbone -> Details -> Plan -> Write -> Validate -> Repair -> Chapters. Full orchestrator state machine.
- **Detail bindings** (`artifacts/types.ts`): EntityRegistry (characters, places, objects), SlotBindings, unresolved todos.
- **Graph viewer**: Cytoscape canvas, detail panels, pairing panel, cross-index, elements panel, timeline panel, character arc panel, graph search, export.

Many recommendations in the competition review overlap with existing infrastructure. The plan focuses on **surfacing** existing data through new author-facing views, not re-implementing entity models.

---

## Phase 1 — Story Instance Layer (Priority 1)

**Goal:** Make story instances first-class editable objects, separate from the corpus, browseable without thinking in graph terms.

The Series system already has `StoryLore` with characters, places, objects, factions, plot threads, world rules, and event logs. The gap is: (a) standalone stories (non-series) lack an instance model, and (b) the existing LoreViewer is read-only and episode-scoped.

### Phase 1A — Unified Instance Store

- [X] **1A.1** Create `app/src/instance/types.ts` — unified `StoryInstance` interface that works for both standalone and series stories. Wraps `StoryLore` + metadata (title, archetype, genre, creation date).
- [X] **1A.2** Create `app/src/instance/store/instanceStore.ts` — Zustand store for the active story instance. CRUD for characters, places, objects, factions, relationships. Persistence to localStorage with JSON export/import.
- [X] **1A.3** Create `app/src/instance/store/instanceBridge.ts` — bidirectional bridge: populate instance from generation pipeline `DetailBindings`/`StoryLore`, and export instance data back to the pipeline as `StoryRequest` constraints.
- [X] **1A.4** Wire instance creation into the generation panel — after a successful generation run, offer "Save as Story Instance" which snapshots the detail bindings + lore into the instance store.

### Phase 1B — Entity Editor Panels

- [X] **1B.1** Create `app/src/instance/panels/CharacterEditor.tsx` — list/detail view for characters. Editable fields: name, role, traits, motivations, arc type, relationships, status, knowledge, possessions. Show linked archetype nodes and genre constraints.
- [X] **1B.2** Create `app/src/instance/panels/PlaceEditor.tsx` — list/detail for places. Editable fields: name, type, description, rules, atmosphere, connections, status.
- [X] **1B.3** Create `app/src/instance/panels/ObjectEditor.tsx` — list/detail for objects. Editable fields: name, type, description, significance, rules, custody chain, status.
- [X] **1B.4** Create `app/src/instance/panels/FactionEditor.tsx` — list/detail for factions. Editable fields: name, type, description, goals, members, relationships, status.
- [X] **1B.5** Create `app/src/instance/panels/RelationshipMap.tsx` — visual relationship graph using Cytoscape. Nodes = entities, edges = relationship types. Clickable to edit.
- [X] **1B.6** Create `app/src/instance/panels/PlotThreadTracker.tsx` — list of plot threads with status badges, urgency, linked characters/places. Reuse patterns from series `ThreadTrackerPanel`.

### Phase 1C — Instance Navigation

- [X] **1C.1** Add `/story` route and `StoryWorkspace` page — tabbed interface for editing the active story instance (Characters, Places, Objects, Factions, Threads, Relationships).
- [X] **1C.2** Add instance selector to the main nav — dropdown to switch between story instances or create a new one.
- [X] **1C.3** Add JSON export/import for story instances — download as `.story.json`, upload to restore.

---

## Phase 2 — Scene Board (Priority 2)

**Goal:** Plottr-style card surface backed by the graph engine. Authors can see, rearrange, and annotate scenes without thinking in graph terms.

### Phase 2A — Scene Board Data Layer

- [ ] **2A.1** Create `app/src/sceneboard/types.ts` — `SceneCard` interface: scene_id, beat_id, title, synopsis, archetype_node, genre_obligations (met/unmet), characters, setting, stakes_delta, status (draft/reviewed/locked), chapter assignment, position (for drag ordering).
- [ ] **2A.2** Create `app/src/sceneboard/store/sceneboardStore.ts` — Zustand store. Populate from `StoryPlan` + `StoryBackbone`. Support reordering, manual editing of synopsis/characters, chapter reassignment.
- [ ] **2A.3** Bridge from generation pipeline — auto-populate scene board when a plan or backbone is generated.

### Phase 2B — Scene Board UI

- [ ] **2B.1** Create `app/src/sceneboard/SceneBoardPage.tsx` — main board view. Cards arranged in lanes (by chapter, by act, by archetype phase, by subplot). Drag-to-reorder within and between lanes.
- [ ] **2B.2** Scene card component — compact card showing: title, archetype node badge, genre obligation coverage (green/yellow/red dots), character avatars, stakes indicator, compliance flags.
- [ ] **2B.3** Lane selector — toggle between lane modes: Chapter, Act, Archetype Phase, POV Character, Location.
- [ ] **2B.4** Filter bar — filter cards by: character, location, plot thread, unresolved obligation, hard-constraint coverage, status.
- [ ] **2B.5** Scene detail flyout — click card to expand: full synopsis, constraint checklist, participating entities, timeline moment, notes field.
- [ ] **2B.6** Add `/sceneboard` route and nav link.

---

## Phase 3 — Timeline Instance View (Priority 3)

**Goal:** Aeon-style chronology view showing story events in order with participant tracking, subplot lanes, and continuity validation.

### Phase 3A — Timeline Data Layer

- [ ] **3A.1** Create `app/src/timeline/types.ts` — `TimelineEvent` interface: event_id, title, description, timestamp/order, participants, place, before_state, after_state, causal_dependencies, subplot, episode_id (for series).
- [ ] **3A.2** Create `app/src/timeline/store/timelineStore.ts` — Zustand store. Populate from backbone beats + scene moments + instance lore events. Support manual event creation and editing.
- [ ] **3A.3** Bridge from generation — extract timeline events from `StoryBackbone` beats, scene `moment` data, and `StateDelta` transitions.

### Phase 3B — Timeline UI

- [ ] **3B.1** Create `app/src/timeline/TimelinePage.tsx` — horizontal or vertical scrollable timeline. Events as cards on a track. Multiple subplot lanes stacked.
- [ ] **3B.2** Participant swim lanes — toggle character/faction lanes showing when each entity is "on screen."
- [ ] **3B.3** State transition markers — visual indicators for deaths, reveals, custody changes, relationship shifts.
- [ ] **3B.4** Continuity checker panel — validate: dead characters reappearing, objects tracking custody, knowledge consistency. Reuse logic from series `loreValidator.ts`.
- [ ] **3B.5** Causal dependency edges — optional overlay showing which events depend on which.
- [ ] **3B.6** Add `/timeline` route and nav link.

---

## Phase 4 — Lore / Encyclopedia View (Priority 4)

**Goal:** World Anvil-style browseable encyclopedia automatically populated from instance data and detail bindings.

### Phase 4A — Encyclopedia Data Layer

- [ ] **4A.1** Create `app/src/encyclopedia/types.ts` — `Article` interface: id, title, category (Character, Place, Object, Faction, Event, World Rule, Custom), content (auto-generated markdown from instance fields), linked_nodes (archetype/genre), linked_scenes, backlinks.
- [ ] **4A.2** Create `app/src/encyclopedia/articleGenerator.ts` — deterministic article generator: takes a `LoreCharacter`/`LorePlace`/etc and produces a readable markdown article with cross-links.
- [ ] **4A.3** Create `app/src/encyclopedia/store/encyclopediaStore.ts` — derived store that auto-generates articles from instance store changes.

### Phase 4B — Encyclopedia UI

- [ ] **4B.1** Create `app/src/encyclopedia/EncyclopediaPage.tsx` — two-column layout: category sidebar (Characters, Places, Objects, Factions, Events, World Rules) + article reader pane.
- [ ] **4B.2** Article view — rendered markdown with inline cross-links (click character name to navigate to character article). Show linked archetype nodes and scenes as badges.
- [ ] **4B.3** Search and filter — search across all articles, filter by category, filter by episode/chapter.
- [ ] **4B.4** "Appears in" section — for each article, show which scenes/chapters reference this entity.
- [ ] **4B.5** Add `/encyclopedia` route and nav link.

---

## Phase 5 — Manuscript Workspace (Priority 5)

**Goal:** Scrivener-lite layer for organizing and editing prose output from the generation pipeline.

### Phase 5A — Manuscript Data Layer

- [ ] **5A.1** Create `app/src/manuscript/types.ts` — `ManuscriptChapter` (id, title, scenes, status), `ManuscriptScene` (id, title, synopsis, draft_text, revised_text, edit_status: draft/revised/final, notes, word_count).
- [ ] **5A.2** Create `app/src/manuscript/store/manuscriptStore.ts` — Zustand store. Populate from generation `sceneDrafts` + `chapterManifest`. Support manual editing, status tracking, reordering.
- [ ] **5A.3** Bridge from generation — auto-populate manuscript when chapters are assembled.

### Phase 5B — Manuscript UI

- [ ] **5B.1** Create `app/src/manuscript/ManuscriptPage.tsx` — three-column layout: chapter tree (left), scene editor (center), metadata panel (right).
- [ ] **5B.2** Chapter tree / binder — collapsible tree showing chapters to scenes. Drag to reorder. Status badges (draft/revised/final). Word counts.
- [ ] **5B.3** Scene editor — rich text area for editing prose. Show generated draft vs revised draft side-by-side (diff view). Notes field.
- [ ] **5B.4** Metadata panel — for selected scene: synopsis, constraint compliance, participating entities, archetype phase, genre obligations met.
- [ ] **5B.5** Export pipeline — export full manuscript as single markdown file, or per-chapter markdown files. Include front matter with metadata.
- [ ] **5B.6** Add `/manuscript` route and nav link.

---

## Phase 6 — Relationship and Systems Maps (Priority 6)

**Goal:** Campfire-style visual maps for relationships, political structures, family trees, and world systems — backed by instance data, not standalone drawings.

- [ ] **6.1** Create `app/src/instance/panels/SystemMap.tsx` — reusable graph visualization component (Cytoscape) for typed entity relationships. Configurable node types and edge types.
- [ ] **6.2** Family tree view mode — filter relationships to parent_child, sibling, romantic. Hierarchical layout.
- [ ] **6.3** Political/faction map mode — nodes = factions + key characters, edges = faction relationships + memberships.
- [ ] **6.4** Knowledge/secret web mode — nodes = characters, edges = "knows about" relationships. Useful for mystery/thriller genres.
- [ ] **6.5** Add as a tab within the Story Workspace (`/story`) rather than a separate route.

---

## Phase 7 — Notes, Backlinks, Queries (Priority 7)

**Goal:** Obsidian-like lightweight notes attached to any entity, with backlinks and tag-based queries.

- [ ] **7.1** Create `app/src/notes/types.ts` — `Note` interface: id, title, content (markdown), tags, linked_to (array of entity refs: `{type, id}`), created_at, updated_at.
- [ ] **7.2** Create `app/src/notes/store/notesStore.ts` — Zustand store with CRUD, tag index, backlink computation.
- [ ] **7.3** Create `app/src/notes/NotesPanel.tsx` — slide-out panel accessible from any page. Create/edit notes, attach to current context (selected node, entity, scene).
- [ ] **7.4** Backlinks section — on every entity/scene/node detail view, show "Notes referencing this" with links.
- [ ] **7.5** Query view — filter notes by tag, by linked entity type, by date range. Saved queries as bookmarks.
- [ ] **7.6** Add `/notes` route for full-page note browser.

---

## Phase 8 — Navigation and Integration Polish

**Goal:** Unify all new surfaces into a cohesive navigation experience.

- [ ] **8.1** Redesign main navigation — persistent sidebar or top nav with sections: Structure (current graph viewer), Story (instance editor), Scene Board, Timeline, Encyclopedia, Manuscript, Notes. Active section highlighted.
- [ ] **8.2** Context linking — clicking an archetype node in the graph viewer shows linked instance entities. Clicking a character in the encyclopedia jumps to their scenes on the scene board.
- [ ] **8.3** Breadcrumb trail — show navigation path (e.g., Story > Characters > Elena > Scene 3).
- [ ] **8.4** Global search — search across all entity types, notes, scenes, articles. Results grouped by type.
- [ ] **8.5** Workspace persistence — save/restore open tabs, scroll positions, and panel states across sessions.

---

## Dependency Graph

```
Phase 1 (Instance Layer) --+--> Phase 2 (Scene Board)
                           +--> Phase 3 (Timeline)
                           +--> Phase 4 (Encyclopedia)
                           +--> Phase 5 (Manuscript)
                           +--> Phase 6 (Relationship Maps)
                           +--> Phase 7 (Notes/Backlinks)

Phases 2-7 are independent of each other.
Phase 8 (Navigation Polish) depends on all prior phases.
```

Phase 1 is the **critical path** — all other phases consume instance data.

---

## Estimated Scope

| Phase | Items | New Files (est.) | Complexity |
|-------|-------|-------------------|------------|
| 1 — Instance Layer | 13 | ~12 | High — foundational types, store, bridge, 6 editor panels |
| 2 — Scene Board | 9 | ~6 | High — drag/drop, lane views, filtering |
| 3 — Timeline | 9 | ~6 | Medium — builds on existing timeline types |
| 4 — Encyclopedia | 8 | ~5 | Medium — article generation is deterministic |
| 5 — Manuscript | 9 | ~6 | Medium — text editing, diff view, export |
| 6 — Relationship Maps | 5 | ~2 | Low — reuses Cytoscape + existing entity data |
| 7 — Notes/Backlinks | 6 | ~4 | Medium — backlink computation, query engine |
| 8 — Navigation Polish | 5 | ~2 | Low — wiring and UX refinement |
| **Total** | **64** | **~43** | |

---

## Design Principles (from competition review section 6)

1. **Be a structural analysis engine first** — keep the graph corpus and artifacts central.
2. **Add authoring surfaces as views over the graph engine** — not as independent ad hoc objects.
3. **Every entity links back to structure** — characters link to archetype nodes, scenes link to genre constraints.
4. **Traceability is non-negotiable** — the trace/compliance system extends to all new surfaces.
5. **Do not become "Campfire but more complicated"** — the graph engine is the differentiator.
