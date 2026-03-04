# Story Structure Explorer

A formal modeling system for narrative structures, combining **archetype graphs** (how stories progress through time) with **genre depth graphs** (how genre constraints narrow creative choices). The corpus is consumed by an interactive visualization tool and an agentic story generation pipeline.

## What This Project Does

The project models storytelling from two complementary dimensions:

1. **Archetype Graphs (15)** — Directed graphs representing temporal story structures. Each archetype is a sequence of phases (nodes) connected by causal transitions (edges). Examples: The Hero's Journey (12 nodes), Tragedy (8 nodes), The Quest (9 nodes).

2. **Genre Depth Graphs (27)** — Constraint hierarchy trees with 5 levels of increasing specificity. Each genre graph starts with a single Genre Promise and refines through Core Constraints, Subgenre Patterns, Setting Rules, and Scene Obligations. Every node carries a severity field (`hard` or `soft`) indicating whether the constraint is non-negotiable.

3. **Cross-Reference Datasets (12)** — Matrices, indices, and models that connect the graphs: genre-archetype compatibility (27x15 matrix), emotional arc profiles, hybrid archetype patterns, genre blending rules, tone integration, non-Western archetype analysis, cross-medium adaptation, and a 107-work example registry.

4. **Interactive Viewer** — A React 19 web application with Cytoscape.js graph rendering, simulation mode, example overlays, analytics, and export (PNG, SVG, DOT, Mermaid, GraphML).

5. **Agentic Story Generation** — A planned pipeline that consumes the corpus to produce traceable, constraint-correct stories with full compliance reporting.

## Repository Structure

```
data/                              All graph data and cross-references
  vocabulary/                      Controlled vocabularies and ID conventions
    index.md                         Description of all files in this folder

  archetypes/{nn_name}/            15 archetype folders
    graph.json                       Directed graph (nodes + edges)
    variants.json                    Variant branches (where applicable)
    index.md                         Description of all files in this folder
    narrative.md                     Prose walkthrough of the graph
    examples.md                      2-4 real works mapped against the graph
  genres/{nn_name}/                27 genre folders
    graph.json                       Constraint hierarchy (5 levels + tone + anti-pattern)
    index.md                         Description of all files in this folder
    narrative.md                     Prose walkthrough of constraints
    examples.md                      2-4 real works mapped against constraints
  cross_references/                 Cross-referencing datasets and corpus metadata
    index.md                         Description of all files in this folder
    manifest.json                    Corpus inventory and statistics
    genre_archetype_matrix.json      27x15 compatibility matrix
    cross_archetype_index.json       Shared roles/meanings across archetypes
    cross_genre_constraint_index.json Shared constraints across genres
    archetype_emotional_arcs.json    Quantitative emotional trajectories
    hybrid_archetype_patterns.json   12 hybrid archetype combinations
    tone_archetype_integration.json  405 tone-archetype pairings
    genre_blending_model.json        18 genre blend patterns
    example_works_registry.json      107 works with cross-references
    non_western_archetype_analysis.json  10 non-Western narrative archetypes
    cross_medium_adaptation.json     6 works analyzed across mediums
    corpus_validation.json           Coverage validation against 50 works

app/                               Interactive viewer (React + TypeScript + Vite)
  src/
    components/                    UI components
    panels/                        Side panels (detail, simulation, export, etc.)
    render/                        Cytoscape canvas, styles, element builders
    graph-engine/                  Normalizer, validator, data index
    store/                         Zustand stores
    hooks/                         Custom React hooks
    layout/                        Graph layout algorithms
    types/                         TypeScript interfaces
  scripts/                         Data processing scripts

docs/                              Planning, specs, and task tracking
  v0_plan.md                       Authoritative statement of work
  story_design.md                  Agentic story generation system design
  story_generation_plan.md         8-phase implementation plan for generation
  interactive_viewer_design.md     UI/UX spec for graph viewer
  interactive_viewer_plan.md       Viewer implementation plan (complete)
  v-next.md                        Deferred items tracker (all resolved)
```

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Data Model

### Node Schema

Every graph node follows the same base schema:

| Field | Description |
|-------|-------------|
| `node_id` | Unique ID following `{PREFIX}_{TYPE}{##}_{SHORT_NAME}` convention |
| `label` | Human-readable name |
| `role` | Controlled vocabulary role (14 archetype roles, 7 genre roles) |
| `definition` | What this phase/constraint means |
| `entry_conditions` | What must be true before entering this node |
| `exit_conditions` | What must be true before leaving this node |
| `typical_variants` | Common variations |
| `failure_modes` | What goes wrong when mishandled |
| `signals_in_text` | How to identify this node in an actual story |

Genre nodes additionally carry `level` (1-5, 80 for tone, 90 for anti-pattern) and `severity` (`hard` | `soft`).

### Edge Schema

| Field | Description |
|-------|-------------|
| `edge_id` | Unique ID following `{PREFIX}_E{##}_{SHORT_NAME}` convention |
| `from` / `to` | Source and target node IDs |
| `label` | Human-readable transition name |
| `meaning` | Controlled vocabulary meaning |
| `preconditions` | What must hold for this transition to occur |
| `effects_on_stakes` | How this transition changes the story's stakes |
| `effects_on_character` | How this affects character development |
| `common_alternatives` | Other transitions that could replace this one |
| `anti_patterns` | Misuses of this transition |

### ID Convention

All IDs follow `{PREFIX}_{TYPE}{##}_{SHORT_NAME}`:
- **Prefix**: 2-letter code per archetype/genre (HJ = Hero's Journey, DR = Drama, HR = Horror, etc.)
- **Type**: `N` for nodes, `E` for edges
- **Number**: Archetype spine 01-09, genre levels mapped to ranges (01-09 L1, 10-19 L2, 20-39 L3, 40-59 L4, 60-79 L5, 80-89 tone, 90-99 anti-pattern), variants 50-79
- **Short name**: Descriptive label in UPPER_SNAKE_CASE

### Cross-Reference Relationships

```
                    Controlled Vocabularies
                    (roles, meanings)
                           |
         +-----------------+-----------------+
         v                 v                 v
  15 Archetype      27 Genre          Manifest
  Graphs            Graphs            (index)
   + variants        + severity
   + beat sheets     + levels
         |                 |
         |    +------------+--------------------+
         |    |            |                    |
         v    v            v                    v
  Genre x          Cross-Archetype       Cross-Genre
  Archetype        Index                 Constraint
  Matrix           (shared roles)        Index
  (27 x 15)
         |
    +----+--------------------+-----------------+
    v                         v                 v
 Hybrid            Tone x Archetype       Genre
 Archetype         Integration            Blending
 Patterns          (27 x 15)              Model
 (12)                                     (18)
    |                                       |
    +---------------------------------------+
    v
 Example Works     Corpus             Non-Western
 Registry          Validation         Archetype
 (107 works)       (50 works)         Analysis (10)
                        |
                        v
                 Cross-Medium
                 Adaptation
                 (6 works)
```

## Corpus Statistics

| Category | Count |
|----------|-------|
| Archetype graphs | 15 |
| Genre graphs | 27 |
| Cross-reference datasets | 12 |
| Controlled vocabulary files | 6 |
| Example works indexed | 107 |
| Total graph nodes | 584 |
| Total graph edges | 650 |

## The 15 Archetypes

| # | Archetype | Nodes | Description |
|---|-----------|-------|-------------|
| 01 | The Hero's Journey | 12 | Departure, initiation, and return |
| 02 | Rags to Riches | 8 | Ascent from lowly origins to success |
| 03 | The Quest | 9 | Journey toward a specific goal |
| 04 | Voyage and Return | 7 | Travel to an unfamiliar world and back |
| 05 | Overcoming the Monster | 8 | Confrontation with an antagonistic force |
| 06 | Rebirth | 7 | Transformation through redemption |
| 07 | Tragedy | 8 | Descent from prosperity to downfall |
| 08 | Comedy | 7 | Escalating confusion resolved by restoration |
| 09 | Coming of Age | 7 | Maturation through formative experience |
| 10 | The Revenge | 8 | Pursuit of retribution |
| 11 | The Escape | 8 | Flight from confinement or oppression |
| 12 | The Sacrifice | 7 | Willing surrender for a greater cause |
| 13 | The Mystery Unveiled | 8 | Progressive revelation of hidden truth |
| 14 | The Transformation | 7 | Fundamental change of identity or nature |
| 15 | The Rise and Fall | 8 | Ascent followed by collapse |

## The 27 Genres

Drama, Action, Comedy, Thriller, Fantasy, Science Fiction, Adventure, Romance, Romantic Comedy, Horror, Mystery, Crime, Detective, Superhero, Historical, War, Biography, Family, Young Adult, Literary Fiction, Children's Literature, Satire, Psychological, Western, Political, Musical, Holiday.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 7** (dev server and build)
- **Cytoscape.js** (graph rendering)
- **Zustand** (state management with persistence)
- **React Router** (URL-based graph navigation)
- **Vitest** + **Testing Library** (unit and component testing)
- **ESLint** (type-aware rules via typescript-eslint) + **Prettier**

## Scripts

```bash
cd app
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint with type-aware rules
npm run format       # Prettier formatting
npm run test         # Run Vitest test suite
```

## Documentation

| Document | Description |
|----------|-------------|
| `docs/v0_plan.md` | Authoritative statement of work for the graph corpus |
| `docs/story_design.md` | Design document for the agentic story generation system |
| `docs/story_generation_plan.md` | 8-phase implementation plan for story generation |
| `docs/interactive_viewer_design.md` | UI/UX specification for the graph viewer |
| `docs/interactive_viewer_plan.md` | Implementation plan for the viewer (all 8 phases complete) |
| `docs/v-next.md` | Deferred items tracker (all items resolved) |
