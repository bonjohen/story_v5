# Genre Depth Graphs

This folder contains 27 genre graph deliverables. Each genre models a **constraint hierarchy** — a tree of rules that progressively narrow the creative space from a broad audience promise down to concrete scene-level obligations. Nodes are constraints at increasing levels of specificity; edges represent refinement steps.

## Folder Structure

Each of the 27 subfolders (`01_drama/` through `27_holiday/`) contains three core files, plus an optional element constraints file:

### graph.json

The directed constraint graph. Every genre graph follows a consistent 5-level architecture:

| Level | Role | Count | Purpose |
|-------|------|-------|---------|
| 1 | Genre Promise | 1 node | The fundamental contract with the audience |
| 2 | Core Constraint | 3-6 nodes | Minimum viable genre requirements |
| 3 | Subgenre Pattern | 3-6 nodes | Recognized subtypes the writer may choose from |
| 4 | Setting Rule | 2-4 nodes | World-building and mechanical constraints |
| 5 | Scene Obligation | 2-4 nodes | Concrete scene or beat requirements |
| — | Tone Marker | 1 node | Non-negotiable tonal register for the genre |
| — | Anti-Pattern | 1-2 nodes | Pitfalls that break the genre contract |

Each node carries:
- A unique ID following the convention `{PREFIX}_N{##}_{SHORT_NAME}` (e.g., `DR_N01_PROMISE`)
- A `role` from the controlled vocabulary (Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, Anti-Pattern)
- A `level` (1-5 for the hierarchy; `null` for Tone Marker and Anti-Pattern)
- A `severity` field (`"hard"` = violating this breaks the genre contract; `"soft"` = uncommon deviation but still valid)
- Prose fields: `definition`, `entry_conditions`, `exit_conditions`, `failure_modes`, `signals_in_text`

Each edge carries a `meaning` from the controlled vocabulary (specifies constraint, branches into subtype, mandates element, prohibits element, introduces setting rule, sets tone, etc.) and inherits `severity` from its target node.

The `_metadata` block summarizes node/edge counts, role distribution, meaning distribution, and severity counts.

### narrative.md

A prose walkthrough of the constraint graph. Explains how the genre promise translates into enforceable rules at each level, what failure looks like when constraints are violated, and how the tone marker and anti-patterns interact with the rest of the structure. Designed for writers, editors, and story-evaluation tools to verify that a work delivers on its genre contract.

### examples.md

Mapping of 2-4 real works against the constraint graph. Each work is traced node-by-node, showing how specific scenes, settings, and narrative choices satisfy (or deliberately subvert) each constraint. Includes a primary example with detailed mappings and cross-reference examples with briefer coverage.

### element_constraints.json (optional)

Genre-level story element requirements. Defines required, recommended, and optional character roles, relationship types, place types, object types, and testable element rules. Each constraint uses terms from the controlled vocabularies (`element_roles.json`, `place_types.json`, `object_types.json`, `relationship_types.json`) and carries a `severity` level (required, recommended, optional). Element rules include a `rule_id`, description, and `testable_condition`.

Present in 10 genres: Romance (`08_romance`), Horror (`10_horror`), Thriller (`04_thriller`), Fantasy (`05_fantasy`), Science Fiction (`06_science_fiction`), Detective (`13_detective`), Adventure (`07_adventure`), Western (`24_western`), Superhero (`14_superhero`), War (`16_war`).

The remaining 17 genres constrain tone and structure rather than element composition and do not require element constraint files.

## The 27 Genres

| # | Folder | Name |
|---|--------|------|
| 1 | `01_drama` | Drama |
| 2 | `02_action` | Action |
| 3 | `03_comedy` | Comedy |
| 4 | `04_thriller` | Thriller |
| 5 | `05_fantasy` | Fantasy |
| 6 | `06_science_fiction` | Science Fiction |
| 7 | `07_adventure` | Adventure |
| 8 | `08_romance` | Romance |
| 9 | `09_romantic_comedy` | Romantic Comedy |
| 10 | `10_horror` | Horror |
| 11 | `11_mystery` | Mystery |
| 12 | `12_crime` | Crime |
| 13 | `13_detective` | Detective |
| 14 | `14_superhero` | Superhero |
| 15 | `15_historical` | Historical |
| 16 | `16_war` | War |
| 17 | `17_biography` | Biography |
| 18 | `18_family` | Family |
| 19 | `19_young_adult` | Young Adult |
| 20 | `20_literary_fiction` | Literary Fiction |
| 21 | `21_childrens_literature` | Children's Literature |
| 22 | `22_satire` | Satire |
| 23 | `23_psychological` | Psychological |
| 24 | `24_western` | Western |
| 25 | `25_political` | Political |
| 26 | `26_musical` | Musical |
| 27 | `27_holiday` | Holiday |

## Controlled Vocabularies

All genre graphs draw from shared controlled vocabularies in `data/vocabulary/`:
- **Node roles** (7): defined in `genre_node_roles.json`
- **Edge meanings** (12): defined in `genre_edge_vocabulary.json`
- **ID conventions**: documented in `genre_id_convention.md`
