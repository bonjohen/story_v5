# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **data and content project** that models storytelling structures as formal directed graphs. It produces two complementary analysis products, both complete:

1. **Archetype Graphs** — model story progression over time for 15 fundamental plot structures (e.g., Hero's Journey, Tragedy, The Quest). Each archetype is a directed graph with nodes (story phases) and edges (causal transitions).

2. **Genre Depth Graphs** — model genre constraints at increasing levels of detail (Genre Promise → Core Constraints → Subgenre Pattern → World/Setting Rules → Scene Obligations) for 27 genres. Edges represent refinement steps that narrow creative degrees of freedom.

3. **Interactive Visual Graph Interface** — a web-based narrative structure exploration engine built with React 19, TypeScript, Vite, Cytoscape.js, and Zustand. All 8 implementation phases are complete. See `docs/interactive_viewer_design.md` (specification) and `docs/interactive_viewer_plan.md` (implementation plan, all phases `[X]`).

## Repository Structure

```
docs/                              ← Planning, specs, and task tracking
  v0_plan.md                       ← Authoritative statement of work (read first)
  goal_1.md                        ← Goal 1 task tracker (complete)
  goal_2.md                        ← Goal 2 task tracker (complete)
  v-next.md                        ← Deferred items: issues, suggestions, enhancements
  interactive_viewer_design.md     ← UI/UX spec for interactive graph viewer
  interactive_viewer_plan.md       ← 8-phase implementation plan for the viewer
  archetypes.json                   ← 15 archetypes: descriptions, examples, genres
  genres.json                      ← 27 genres: descriptions, examples, popularity

data/                              ← Deliverable outputs
  vocabulary/                      ← Controlled vocabularies and ID conventions
    archetype_edge_vocabulary.json ← 15 controlled edge meanings for archetypes
    archetype_node_roles.json      ← 14 controlled node roles for archetypes
    archetype_id_convention.md     ← ID naming convention for archetype nodes/edges
    genre_edge_vocabulary.json     ← 12 controlled edge meanings for genres
    genre_node_roles.json          ← 7 controlled node roles for genres
    genre_id_convention.md         ← ID naming convention for genre nodes/edges
  archetypes/                      ← Goal 1 deliverables (complete)
    {nn_name}/                     ← Per-archetype folder (15 total)
      graph.json                   ← Directed graph JSON
      narrative.md                 ← Narrative spec (walkthroughs, failure modes)
      examples.md                  ← Example mappings to real works
  genres/                          ← Goal 2 deliverables (complete)
    {nn_name}/                     ← Per-genre folder (27 total)
      graph.json
      narrative.md
      examples.md
  cross_archetype_index.json       ← Shared node roles/edge meanings across all 15
  cross_genre_constraint_index.json ← Shared constraint types across all 27
  genre_archetype_matrix.json      ← 27 genres × 15 archetypes compatibility

app/                               ← Interactive viewer (React + TypeScript + Vite)
  src/
    components/                    ← Reusable UI components (GraphSearch, SettingsPanel, etc.)
    panels/                        ← Side panels (DetailPanel, SimulationPanel, ExportPanel, etc.)
    render/                        ← Cytoscape canvas, styles, element builders
    graph-engine/                  ← Normalizer, validator, data index, example parser
    store/                         ← Zustand stores (graphStore, simulationStore, settingsStore)
    layout/                        ← Graph layout algorithms
    types/                         ← TypeScript interfaces
  public/data/                     ← Copied graph JSON data served by Vite
```

## Goal Status

- **Goal 1 — Archetype Graphs**: Complete. All 15 graph JSONs, 15 narrative specs, 15 example mappings, cross-archetype index, and validation done.
- **Goal 2 — Genre Depth Graphs**: Complete. All 27 graph JSONs, 27 narrative specs, 27 example mappings, cross-genre constraint index, genre × archetype compatibility matrix, and validation done.
- **Goal 3 — Interactive Viewer**: Complete. All 8 phases implemented (scaffolding, core rendering, navigation, detail panels, simulation, examples, analytics, polish/accessibility/export).

## Key Conventions

### Graph JSON Format

All graph deliverables follow the schema in `docs/v0_plan.md` §1.1–1.2:

- **Nodes**: `node_id`, `label`, `role`, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, `signals_in_text`
- **Edges**: `edge_id`, `from`, `to`, `label`, `meaning`, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, `anti_patterns`
- Node/edge IDs: `{PREFIX}_N{##}_{SHORT_NAME}` for nodes, `{PREFIX}_E{##}_{SHORT_NAME}` for edges; variant range 50-79
- Each graph has one start node and one or more terminal nodes

### Controlled Vocabulary

- **Archetype** edge meanings and node roles: `data/vocabulary/archetype_edge_vocabulary.json` and `data/vocabulary/archetype_node_roles.json`
- **Genre** edge meanings and node roles: `data/vocabulary/genre_edge_vocabulary.json` and `data/vocabulary/genre_node_roles.json`

### Task Tracking

Goal files (`docs/goal_1.md`, `docs/goal_2.md`) use checkbox syntax:
- `[ ]` — pending
- `[~]` — actively in progress (only ONE task at a time)
- `[X]` — complete

Deferred work is tracked in `docs/v-next.md` (42 items across issues, suggestions, and enhancements).

### Workflow Rules

- Commit and push at each phase end
- Echo banners for task/phase transitions
- Don't stop between phases — continue to the next
- Only mark the single active task as `[~]`

### Quality Standards

- Every edge must have causal meaning, not just "and then"
- Node entry/exit conditions must be explicit and testable against a draft
- Each archetype graph needs at least 2 meaningful variants
- Failure modes must be specific enough to guide revision
- Genre depth graphs must have all 5 levels clearly distinguished
- Constraints must be stated as enforceable rules, not vague descriptions

### Known Issues (see v-next.md for full list)

- `archetypes.json` filename is misspelled (#13) — renaming requires updating all references
- 6–8 genre graphs have systematic edge numbering shifts (#11) — convention clarified but inconsistency persists
- No automated validation script for graph-narrative ID correspondence (#10)
