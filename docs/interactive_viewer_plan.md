# Interactive Visual Graph Interface — Implementation Plan

*Phased plan derived from `docs/interactive_viewer_design.md`*

---

## Overview

This plan breaks the interactive viewer specification into 8 implementation phases, ordered by dependency and increasing complexity. Each phase produces a working, demonstrable increment. Phases 1–4 deliver a usable graph viewer; Phases 5–8 add the analytical and advanced features that distinguish a "narrative structure exploration engine" from a static diagram viewer.

**Technology baseline** (from design spec §9):
- React + TypeScript
- Zustand (state management)
- Cytoscape.js (graph rendering and layout — chosen for rapid prototyping with upgrade path to WebGL via Sigma.js)
- D3 (layout calculations where needed)
- Graphology (graph data structure)
- Vite (build tooling)

---

## Phase 1 — Project Scaffolding and Data Layer

**Goal**: Initialize the application, define types, and build the data pipeline from JSON files to an in-memory graph model. Also resolve data-layer housekeeping items from v-next.md that are nearly free to do while building the normalizer and data index.

- [X] Initialize React + TypeScript project with Vite
- [X] Configure ESLint, Prettier, and project structure per design spec §10
- [X] Define TypeScript interfaces for archetype graph nodes and edges (matching `v0_plan.md` §1.1–1.2 schema)
- [X] Define TypeScript interfaces for genre graph nodes and edges (same schema, genre-specific roles)
- [X] Create a **JSON Schema** file for graph.json validation (v-next #16 — the schema is the same shape as the TS interfaces, so producing both is trivial)
- [X] Build the Graph Normalizer: load archetype or genre `graph.json`, validate structure, produce a unified internal graph model
- [X] Add **graph-narrative ID validation** to the normalizer (v-next #10 — check that all node/edge IDs referenced in narrative.md and examples.md exist in graph.json; report mismatches)
- [X] Add **vocabulary usage audit** to the normalizer (v-next #2, #8 — count usage of each controlled vocabulary term across all graphs; flag unused terms)
- [X] Set up Zustand store for application state (current graph, selected node, active mode, UI panel state)
- [X] Create a graph data index: enumerate all 15 archetypes and 27 genres with metadata (name, type, node count, edge count) from the JSON files
- [X] Persist the data index as a **data manifest file** (v-next #24 — write the computed index to a JSON file for use by dashboards and automated checks)
- [X] Write unit tests for the normalizer, validator, and data index
- [X] Copy `data/archetypes/` and `data/genres/` graph.json files into the app's public data directory (or configure path aliasing)

### Data housekeeping (v-next items, done as part of Phase 1 setup):

- [X] **Fix `archetypes.json` filename** (v-next #13 — rename to `archetypes.json` and update all references in CLAUDE.md, cross-indices, and matrix; must be done before the normalizer references it)
- [X] **Fix stale paths in goal_1.md** (v-next #3 — find-replace `docs/archetypes/` → `data/archetypes/`, or mark as historical)
- [X] **Standardize cross_archetype_index.json naming** (v-next #5 — match archetype names to `archetypes.json` exactly while building the parser)
- [X] **Co-locate cross-cutting index files** (v-next #15 — move `genre_archetype_matrix.json` and `cross_genre_constraint_index.json` to a consistent location, either both at `data/` root or both in `data/indices/`)
- [X] **Mark v-next #14 as done** (CLAUDE.md has been updated)

**Deliverable**: App loads, parses any graph.json, and logs a validated graph model to the console. JSON Schema, validation script, and data manifest are produced as artifacts. Data housekeeping items resolved.

---

## Phase 2 — Core Graph Rendering

**Goal**: Render archetype and genre graphs with role-based node styling, labeled edges, and zoom/pan interaction.

- [X] Integrate Cytoscape.js as the rendering engine
- [X] Implement **Archetype Layout** (design spec §4.1):
  - Horizontal left-to-right primary axis (time)
  - Nodes positioned by narrative sequence
  - Progressive color gradient across time
  - Terminal nodes styled distinctly (gold)
  - Start nodes styled distinctly (green)
- [X] Implement **Genre Layout** (design spec §4.1):
  - Vertical top-to-bottom primary axis (depth)
  - Nodes grouped by level (1–5 rows, plus Tone/Anti-Pattern)
  - Progressive narrowing width to represent constraint reduction
  - Subgenre branching at Level 3 clearly shown
  - Scene obligations grouped at bottom tier
- [X] Apply **Node Styling** by role (design spec §7.2):
  - Map archetype node roles (Origin, Catalyst, Escalation, etc.) to visual treatments
  - Map genre node roles (Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, Anti-Pattern) to visual treatments
  - Color, border, and shape distinguish role at a glance
- [X] Apply **Edge Styling** by meaning (design spec §7.3):
  - Directed edges with arrowheads
  - Edge labels (inline or on hover)
  - Visual cues by meaning category (escalation → thicker, constraint → dashed, revelation → glow)
  - Loop edges rendered as curved arcs
- [X] Implement **zoom, pan, and fit-to-viewport** controls
- [X] Apply dark-first UI theme (design spec §7.1)
- [X] Ensure deterministic layout (same JSON → same visual, design spec §8)

**Deliverable**: Select any archetype or genre from a dropdown; graph renders with correct layout mode, styled nodes/edges, and smooth zoom/pan.

Stage, commit, and push, then continue working.
---

## Phase 3 — Graph Selector and Navigation Shell

**Goal**: Build the application chrome — graph picker, mode switcher, and URL routing.

- [ ] Build the **graph selector panel**:
  - Two tabs: Archetypes (15) and Genres (27)
  - Each entry shows name and key metadata (node count, subgenre/variant count)
  - Search/filter within each tab
- [ ] Implement **mode indicator** showing current graph type (Archetype/Genre) with appropriate axis label
- [ ] Add **URL routing** so each graph has a shareable deep link (e.g., `/archetype/heros-journey`, `/genre/horror`)
- [ ] Build the **main layout shell**:
  - Left sidebar: graph selector (collapsible)
  - Center: graph canvas
  - Right panel: detail panel (initially hidden, appears on node/edge selection)
  - Top bar: mode indicator, search, settings
- [ ] Add **graph switching animation** — smooth transition when changing graphs
- [ ] Implement **minimap** for orientation within large graphs

**Deliverable**: Full navigation between all 42 graphs with smooth transitions and deep-linkable URLs.

Stage, commit, and push, then continue working.
---

## Phase 4 — Node and Edge Detail Panels

**Goal**: Build the interaction layer that surfaces graph metadata — node detail panels and edge tooltips.

- [ ] Implement **Node Detail Panel** (design spec §5.1):
  - On node click, expand right panel with:
    - Label and role badge
    - Definition (full text)
    - Entry conditions (bulleted list)
    - Exit conditions (bulleted list)
    - Typical variants
    - Failure modes (highlighted as warnings)
    - Signals in text
  - Panel is dockable, collapsible, and scrollable
- [ ] Implement **Edge Detail Tooltip** (design spec §5.2):
  - On edge hover, show popover with:
    - Label and meaning badge
    - Preconditions
    - Effects on stakes
    - Effects on character
    - Common alternatives
    - Anti-patterns
- [ ] Add **"Trace Forward" / "Trace Backward"** from any node:
  - Highlight all nodes reachable from the selected node (forward)
  - Highlight all nodes that lead to the selected node (backward)
  - Dim unrelated nodes/edges
- [ ] Implement **global search**:
  - Search across node labels, definitions, and edge labels
  - Jump to matching node/edge in the graph canvas
- [ ] Add **keyboard navigation**:
  - Arrow keys to move between connected nodes
  - Enter to open detail panel
  - Escape to close panel
- [ ] Add **constraint checklist generator** (v-next #26 — given the current genre + selected subgenre path, extract all applicable constraints and produce a printable/exportable checklist; the detail panel already surfaces this data, so adding a "Generate Checklist" button is incremental)

**Deliverable**: Click any node to see full details; hover any edge for metadata; trace causality chains; search the graph; generate a constraint checklist for any genre path. The app is now a functional, useful graph explorer.

---

## Phase 5 — Path Simulation and Variant Toggle

**Goal**: Add step-by-step traversal and variant path visualization.

- [ ] Implement **Path Simulation Mode** (design spec §5.3):
  - User clicks "Simulate" on a start node
  - System highlights the current node and available next edges
  - User clicks an edge to advance; previous nodes trail with faded color
  - Track which nodes have been visited (structural completeness meter)
- [ ] For archetypes: show **transformation curve overlay**
  - Simple line chart overlaid on graph showing escalation/tension over the traversal
- [ ] For genres: show **constraint narrowing meter**
  - Visual indicator of how many constraints have been specified vs. total available
- [ ] Implement **Variant Toggle Mode** (design spec §5.4):
  - Toggle control listing available paths: Canonical, Variant A, Variant B, etc.
  - For archetypes: variants are defined by nodes in the 50–79 ID range
  - For genres: variants correspond to different subgenre paths (Level 3 branches)
  - Graph animates structural differences when toggling
  - Non-active variant nodes/edges dim; active path highlights
- [ ] Add **failure mode path** visualization:
  - Highlight anti-pattern nodes and the edges that lead to them
  - Show as a "what not to do" overlay
- [ ] Add **constraint sheet export** for genre depth selector (v-next #30 — after walking a genre path through simulation, export the accumulated constraints as a tailored writing guide; the constraint narrowing meter already tracks this state)

**Deliverable**: Walk through any graph step by step; toggle between canonical and variant paths; see which structural elements have been covered; export a constraint sheet for any genre path.

---

## Phase 6 — Example Mapping Overlay

**Goal**: Connect graph structure to concrete story examples.

- [ ] Build **example data parser**:
  - Parse each genre/archetype `examples.md` file into structured data
  - Extract node-to-example and edge-to-example mappings
  - Identify primary work and cross-reference works
- [ ] Implement **Example Mode toggle** (design spec §5.5):
  - Toggle button activates example overlay
  - Nodes with example mappings glow or show a badge
  - Clicking a glowing node shows the example text alongside the definition
- [ ] Add **edge example annotations**:
  - Edges with mapped examples show a subtle indicator
  - Hover reveals the example scene description
- [ ] Implement **example work selector**:
  - Dropdown of available example works for the current graph
  - Selecting a work highlights only the nodes/edges mapped to it
- [ ] Add **two-example comparison**:
  - Select two works simultaneously
  - Nodes mapped to both glow differently from nodes mapped to only one
  - Structural divergence becomes visible at a glance

**Deliverable**: Toggle example mode to see how real stories map to the graph; compare how two stories use the same structure differently.

---

## Phase 7 — Advanced Analytical Modes

**Goal**: Build the comparative and overlay features that make this a "narrative debugger."

- [ ] Implement **Archetype-Genre Overlay** (design spec §6.2):
  - Load one archetype and one genre simultaneously
  - Use the genre × archetype compatibility matrix (`data/genre_archetype_matrix.json`) to inform the overlay
  - Display archetype temporal progression alongside genre constraint depth
  - Highlight tension points where archetype demands conflict with genre constraints
  - Show compatibility rating from the matrix
- [ ] Implement **Comparative Mode** (design spec §6.3):
  - Split-screen layout: two graphs side by side
  - Support comparisons:
    - Archetype A vs. Archetype B
    - Genre A vs. Genre B
    - Same archetype, two different example works
  - Show metrics: node count, edge density, branching complexity
  - Synchronized zoom/pan option
- [ ] Build **cross-index integration**:
  - Use `cross_archetype_index.json` and `cross_genre_constraint_index.json` to show shared patterns
  - When viewing a node, show which other archetypes/genres have the same role or constraint type
  - Enable "find similar constraints across genres" search
- [ ] Add **graph statistics dashboard**:
  - Node count by role/level
  - Edge count by meaning
  - Branching factor analysis
  - Depth/length metrics
- [ ] Add **multi-archetype overlay** (v-next #37 — comparative mode already renders two graphs side by side; extend to support two archetypes aligned by narrative time, showing overlap and divergence)
- [ ] Add **genre-archetype tension analysis** (v-next #38 — overlay mode already identifies tension points; formalize into a panel showing specific constraint conflicts, e.g., Comedy's "recoverable stakes" vs. Tragedy's "irreversible consequences")
- [ ] Add **failure mode cross-reference** to cross-index integration (v-next #42 — the cross-index queries already surface shared patterns; add failure modes as a searchable category, showing which anti-patterns recur across archetypes/genres)

**Deliverable**: Overlay archetype and genre graphs to see structural tension; compare any two graphs (including two archetypes) side by side; explore cross-cutting patterns including shared failure modes; see formalized tension analysis for archetype-genre pairs.

---

## Phase 8 — Visual Polish and Accessibility

**Goal**: Achieve the design spec's quality bar — "intellectually serious, technically elegant, and visually compelling."

- [ ] Refine **dark-first UI** (design spec §7.1):
  - Soft gradients across time/depth
  - Subtle motion and transitions (not distracting)
  - Minimalist typography
  - Zero visual clutter audit
- [ ] Implement **high-contrast mode** (design spec §11):
  - Alternative color scheme for accessibility
  - User toggle in settings
- [ ] Implement **reduced-motion mode** (design spec §11):
  - Disable animations and transitions
  - User toggle or auto-detect from OS preference
- [ ] Add **screen-reader metadata** (design spec §11):
  - ARIA labels on all nodes and edges
  - Announce node role, label, and connection count
  - Panel content is screen-reader navigable
- [ ] **Performance optimization** (design spec §8):
  - Verify 60fps interaction for graphs up to 200 nodes
  - Lazy-load expanded metadata (don't parse examples.md until needed)
  - Consider WebGL upgrade path (Sigma.js) if Canvas performance is insufficient
- [ ] Add **settings panel**:
  - Layout preferences (horizontal/vertical override)
  - Color scheme (dark/light/high-contrast)
  - Motion preferences
  - Default panel position
- [ ] Add **export/share features**:
  - Export current graph view as PNG/SVG
  - Copy shareable URL to clipboard
- [ ] Add **export to standard graph formats** (v-next #25 — alongside PNG/SVG export, add DOT/Graphviz, Mermaid, and GraphML export; the graph model is already in memory, so serializing to these formats is incremental)

**Deliverable**: Production-quality visual interface meeting all accessibility requirements and performance targets, with multi-format export.

---

## Future Phases (Stretch Goals, from design spec §6.1 and §14)

These are explicitly deferred from the initial build:

- [ ] **Structural Integrity Checker** — User tags story beats; system maps to graph nodes and highlights gaps
- [ ] **3D narrative space visualization** — Three.js full 3D mode
- [ ] **Archetype morphing animation** — Animate transformation between two archetype graphs
- [ ] **Constraint heatmap visualization** — Color-code nodes by usage frequency across example works
- [ ] **Interactive "What if?" experimentation** — Drag nodes to restructure a graph and see consequences
- [ ] **AI-powered draft analysis overlay** — Upload a draft; AI maps it to the graph automatically

---

## v-next Items Addressed by This Plan

The following v-next items are resolved as part of viewer implementation work:

| v-next # | Item | Phase | Notes |
|----------|------|-------|-------|
| 2 | Unused archetype vocabulary terms | 1 | Vocab audit in normalizer |
| 3 | Stale goal_1.md paths | 1 | Housekeeping during setup |
| 5 | cross_archetype_index naming | 1 | Fixed while building parser |
| 8 | Unused genre edge vocabulary terms | 1 | Vocab audit in normalizer |
| 10 | No automated validation script | 1 | ID validation in normalizer |
| 13 | `archetypes.json` typo | 1 | Rename before normalizer references it |
| 14 | CLAUDE.md stale | 1 | Already fixed, mark done |
| 15 | Matrix placement inconsistent | 1 | Co-locate during data setup |
| 16 | No JSON schema | 1 | Produced alongside TS interfaces |
| 21 | Graph visualization tooling | 2 | Subsumed by the viewer itself |
| 24 | Data manifest file | 1 | Persisted from data index |
| 25 | Export to standard graph formats | 8 | Alongside PNG/SVG export |
| 26 | Constraint checklist generator | 4 | Button in detail panel |
| 28 | Interactive story planner | 5–7 | Subsumed by simulation + overlay |
| 30 | Genre depth selector | 5 | Constraint sheet export |
| 37 | Multi-archetype overlay | 7 | Extension of comparative mode |
| 38 | Genre-archetype tension analysis | 7 | Formalized overlay panel |
| 39 | Interactive visual graph interface | All | This plan IS item #39 |
| 42 | Failure mode cross-reference | 7 | Added to cross-index queries |

---

## Dependencies and Prerequisites

| Phase | Depends On | Data Prerequisites |
|-------|------------|-------------------|
| 1 | — | All graph.json files (complete) |
| 2 | Phase 1 | — |
| 3 | Phase 2 | — |
| 4 | Phase 2, 3 | — |
| 5 | Phase 4 | — |
| 6 | Phase 4 | All examples.md files (complete) |
| 7 | Phase 4 | genre_archetype_matrix.json, cross-indices (complete) |
| 8 | Phases 2–7 | — |

All data prerequisites are satisfied — Goal 1 and Goal 2 are complete.

---

## Estimated Scope

| Phase | Complexity | Key Risk |
|-------|-----------|----------|
| 1 — Scaffolding & Data | Low | Schema drift between archetype/genre formats |
| 2 — Core Rendering | High | Layout engine tuning for varied graph sizes |
| 3 — Navigation Shell | Medium | URL routing with state preservation |
| 4 — Detail Panels | Medium | Responsive panel layout across screen sizes |
| 5 — Path Simulation | High | Animation smoothness and state tracking |
| 6 — Example Overlay | Medium | Parsing unstructured markdown into structured data |
| 7 — Analytical Modes | High | Dual-graph overlay alignment and rendering |
| 8 — Polish & A11y | Medium | Performance testing across browsers |
