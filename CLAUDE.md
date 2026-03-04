# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **data and content project** (no source code, build system, or tests) that models storytelling structures as formal directed graphs. It produces two complementary analysis products:

1. **Archetype Graphs** — model story progression over time for 15 fundamental plot structures (e.g., Hero's Journey, Tragedy, The Quest). Each archetype is a directed graph with nodes (story phases) and edges (causal transitions).

2. **Genre Depth Graphs** — model genre constraints at increasing levels of detail (Genre Promise → Core Constraints → Subgenre Pattern → World/Setting Rules → Scene Obligations) for 27 genres. Edges represent refinement steps that narrow creative degrees of freedom.

## Repository Structure

```
docs/                              ← Planning, specs, and vocabulary
  v0_plan.md                       ← Authoritative statement of work (read first)
  goal_1.md                        ← Goal 1 task tracker (complete)
  goal_2.md                        ← Goal 2 task tracker (complete)
  v-next.md                        ← Deferred tasks, known issues, suggestions
  archtypes.json                   ← 15 archetypes: descriptions, examples, genres
  genres.json                      ← 27 genres: descriptions, examples, popularity
  archetype_edge_vocabulary.json   ← 15 controlled edge meanings for archetypes
  archetype_node_roles.json        ← 14 controlled node roles for archetypes
  archetype_id_convention.md       ← ID naming convention for archetype nodes/edges

data/                              ← Deliverable outputs
  archetypes/                      ← Goal 1 deliverables (complete)
    {nn_name}/                     ← Per-archetype folder (15 total)
      graph.json                   ← Directed graph JSON
      narrative.md                 ← Narrative spec (walkthroughs, failure modes)
      examples.md                  ← Example mappings to real works
    cross_archetype_index.json     ← Shared node roles/edge meanings across all 15
  genres/                          ← Goal 2 deliverables (complete)
    {nn_name}/                     ← Per-genre folder (27 total)
      graph.json
      narrative.md
      examples.md
    cross_genre_constraint_index.json  ← Shared constraint types across all 27
  genre_archetype_matrix.json      ← 27 genres × 15 archetypes compatibility
```

## Goal Status

- **Goal 1 — Archetype Graphs**: Complete. All 15 graph JSONs, 15 narrative specs, 15 example mappings, cross-archetype index, and validation done.
- **Goal 2 — Genre Depth Graphs**: Complete. All 27 graph JSONs, 27 narrative specs, 27 example mappings, cross-genre constraint index, genre × archetype compatibility matrix, and validation done.

## Key Conventions

### Graph JSON Format

All graph deliverables follow the schema in `docs/v0_plan.md` §1.1–1.2:

- **Nodes**: `node_id`, `label`, `role`, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, `signals_in_text`
- **Edges**: `edge_id`, `from`, `to`, `label`, `meaning`, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, `anti_patterns`
- Node/edge IDs: `{PREFIX}_N{##}_{SHORT_NAME}` for nodes, `{PREFIX}_E{##}_{SHORT_NAME}` for edges; variant range 50-79
- Each graph has one start node and one or more terminal nodes

### Controlled Vocabulary

Archetype edge meanings and node roles are defined in `docs/archetype_edge_vocabulary.json` and `docs/archetype_node_roles.json`. Genre equivalents will be in `docs/genre_edge_vocabulary.json` and `docs/genre_node_roles.json`.

### Task Tracking

Goal files (`docs/goal_1.md`, `docs/goal_2.md`) use checkbox syntax:
- `[ ]` — pending
- `[~]` — actively in progress (only ONE task at a time)
- `[X]` — complete

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
