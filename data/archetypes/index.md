# Archetype Graphs

This folder contains 15 archetype graph deliverables. Each archetype models a **temporal story structure** — a sequence of phases a protagonist passes through from beginning to end. Nodes are story phases; edges are causal transitions between them.

## Folder Structure

Each of the 15 subfolders (`01_heros_journey/` through `15_the_rise_and_fall/`) contains the following core files:

### graph.json

The directed graph definition. Contains:
- **Nodes** — Story phases, each with a unique ID (e.g., `HJ_N01_ORDINARY_WORLD`), a `role` from the controlled vocabulary (Origin, Disruption, Catalyst, Threshold, Trial, Revelation, Descent, Crisis, Transformation, Commitment, Resolution, Ascent, Reckoning, Reintegration), a prose `definition`, `entry_conditions`, `exit_conditions`, `failure_modes`, and `signals_in_text`.
- **Edges** — Causal transitions between phases, each with a `meaning` from the controlled vocabulary (disrupts order, forces commitment, reveals truth, narrows options, raises cost, tests resolve, enables transformation, etc.), `preconditions`, `effects_on_stakes`, `effects_on_character`, and `anti_patterns`.
- **`_metadata`** — Auto-generated summary: node/edge counts, role distribution, meaning distribution.

Node IDs follow the convention `{PREFIX}_N{##}_{SHORT_NAME}` (01-09 for spine nodes, 10-49 for role-grouped nodes). Edge IDs follow `{PREFIX}_E{##}_{SHORT_NAME}`. Each graph has one start node and one or more terminal nodes.

### narrative.md

A prose walkthrough of the graph. For each node: what it represents, how it functions in a story, what goes wrong when it is mishandled (failure modes), and how to identify it in an actual text (signals). Also covers the overall arc shape, variant paths, and structural requirements. Designed as both an educational reference and a diagnostic tool for evaluating drafts.

### examples.md

Mapping of 2-4 real works against the graph. Each work is traced node-by-node and edge-by-edge, showing which story events correspond to which graph elements. Includes a primary example with detailed mappings and cross-reference examples with briefer coverage. Works span novels, films, plays, and games.

### variants.json (optional)

Variant branches — optional or alternative paths that branch from and rejoin the main spine. Variant nodes occupy the 50-79 ID range (e.g., `HJ_N50_REFUSAL`). Contains:
- Nodes and edges following the same schema as `graph.json`
- `_metadata` with `branchPoints` (where the variant diverges from the spine) and `rejoinPoints` (where it reconnects)

Present in: `01_heros_journey`, `11_the_escape`.

### beat_sheet_*.json (optional)

Scene-level mappings with timestamps for a single well-known work. Each beat maps an archetype node to specific scenes with timestamps (or page numbers) and duration percentages. Provides concrete scene-resolution evidence of how the archetype structure manifests in a real work.

Present in:
- `01_heros_journey/beat_sheet_star_wars_iv.json` — Star Wars: Episode IV
- `07_tragedy/beat_sheet_macbeth.json` — Macbeth
- `11_the_escape/beat_sheet_shawshank_redemption.json` — The Shawshank Redemption

## The 15 Archetypes

| # | Folder | Name | Nodes | Description |
|---|--------|------|-------|-------------|
| 1 | `01_heros_journey` | The Hero's Journey | 11 | Departure, initiation, and return |
| 2 | `02_rags_to_riches` | Rags to Riches | 8 | Ascent from lowly origins to success |
| 3 | `03_the_quest` | The Quest | 9 | Journey toward a specific goal |
| 4 | `04_voyage_and_return` | Voyage and Return | 7 | Travel to an unfamiliar world and back |
| 5 | `05_overcoming_the_monster` | Overcoming the Monster | 9 | Confrontation with an antagonistic force |
| 6 | `06_rebirth` | Rebirth | 8 | Transformation through redemption |
| 7 | `07_tragedy` | Tragedy | 9 | Descent from prosperity to downfall |
| 8 | `08_comedy` | Comedy | 10 | Escalating confusion resolved by restoration |
| 9 | `09_coming_of_age` | Coming of Age | 9 | Maturation through formative experience |
| 10 | `10_the_revenge` | The Revenge | 10 | Pursuit of retribution |
| 11 | `11_the_escape` | The Escape | 9 | Flight from confinement or oppression |
| 12 | `12_the_sacrifice` | The Sacrifice | 8 | Willing surrender for a greater cause |
| 13 | `13_the_mystery_unveiled` | The Mystery Unveiled | 11 | Progressive revelation of hidden truth |
| 14 | `14_the_transformation` | The Transformation | 9 | Fundamental change of identity or nature |
| 15 | `15_the_rise_and_fall` | The Rise and Fall | 11 | Ascent followed by collapse |

## Controlled Vocabularies

All archetype graphs draw from shared controlled vocabularies in `data/vocabulary/`:
- **Node roles** (14): defined in `archetype_node_roles.json`
- **Edge meanings** (15): defined in `archetype_edge_vocabulary.json`
- **ID conventions**: documented in `archetype_id_convention.md`
