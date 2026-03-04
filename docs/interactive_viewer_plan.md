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

**Goal**: Initialize the application, define types, and build the data pipeline from JSON files to an in-memory graph model.

- [ ] Initialize React + TypeScript project with Vite
- [ ] Configure ESLint, Prettier, and project structure per design spec §10
- [ ] Define TypeScript interfaces for archetype graph nodes and edges (matching `v0_plan.md` §1.1–1.2 schema)
- [ ] Define TypeScript interfaces for genre graph nodes and edges (same schema, genre-specific roles)
- [ ] Build the Graph Normalizer: load archetype or genre `graph.json`, validate structure, produce a unified internal graph model
- [ ] Set up Zustand store for application state (current graph, selected node, active mode, UI panel state)
- [ ] Create a graph data index: enumerate all 15 archetypes and 27 genres with metadata (name, type, node count, edge count) from the JSON files
- [ ] Write unit tests for the normalizer and data index
- [ ] Copy `data/archetypes/` and `data/genres/` graph.json files into the app's public data directory (or configure path aliasing)

**Deliverable**: App loads, parses any graph.json, and logs a validated graph model to the console. No visual rendering yet.

---

## Phase 2 — Core Graph Rendering

**Goal**: Render archetype and genre graphs with role-based node styling, labeled edges, and zoom/pan interaction.

- [ ] Integrate Cytoscape.js as the rendering engine
- [ ] Implement **Archetype Layout** (design spec §4.1):
  - Horizontal left-to-right primary axis (time)
  - Nodes positioned by narrative sequence
  - Progressive color gradient across time
  - Terminal nodes styled distinctly (gold)
  - Start nodes styled distinctly (green)
- [ ] Implement **Genre Layout** (design spec §4.1):
  - Vertical top-to-bottom primary axis (depth)
  - Nodes grouped by level (1–5 rows, plus Tone/Anti-Pattern)
  - Progressive narrowing width to represent constraint reduction
  - Subgenre branching at Level 3 clearly shown
  - Scene obligations grouped at bottom tier
- [ ] Apply **Node Styling** by role (design spec §7.2):
  - Map archetype node roles (Origin, Catalyst, Escalation, etc.) to visual treatments
  - Map genre node roles (Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, Anti-Pattern) to visual treatments
  - Color, border, and shape distinguish role at a glance
- [ ] Apply **Edge Styling** by meaning (design spec §7.3):
  - Directed edges with arrowheads
  - Edge labels (inline or on hover)
  - Visual cues by meaning category (escalation → thicker, constraint → dashed, revelation → glow)
  - Loop edges rendered as curved arcs
- [ ] Implement **zoom, pan, and fit-to-viewport** controls
- [ ] Apply dark-first UI theme (design spec §7.1)
- [ ] Ensure deterministic layout (same JSON → same visual, design spec §8)

**Deliverable**: Select any archetype or genre from a dropdown; graph renders with correct layout mode, styled nodes/edges, and smooth zoom/pan.

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

**Deliverable**: Click any node to see full details; hover any edge for metadata; trace causality chains; search the graph. The app is now a functional, useful graph explorer.

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

**Deliverable**: Walk through any graph step by step; toggle between canonical and variant paths; see which structural elements have been covered.

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

**Deliverable**: Overlay archetype and genre graphs to see structural tension; compare any two graphs side by side; explore cross-cutting patterns.

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

**Deliverable**: Production-quality visual interface meeting all accessibility requirements and performance targets.

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
