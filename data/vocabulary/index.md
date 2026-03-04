# Controlled Vocabularies

This folder contains the controlled vocabularies and ID naming conventions that govern all 42 graph deliverables (15 archetypes + 27 genres). Every node role, edge meaning, and identifier in the corpus must conform to one of these vocabularies. This ensures consistency across graphs and enables cross-referencing.

## Files

### archetype_node_roles.json

Defines the **14 canonical node roles** used across all 15 archetype graphs. Every archetype node must be assigned exactly one of these roles. Shared roles are what make the cross-archetype index possible — they let you ask "which archetypes have a Crisis node?" or "how does Origin function differently in Tragedy vs. Comedy?"

The 14 roles: Origin, Disruption, Catalyst, Threshold, Trial, Revelation, Descent, Crisis, Transformation, Commitment, Resolution, Ascent, Reckoning, Reintegration.

Each entry includes a `definition`, `structural_function`, and `examples_across_archetypes`.

### archetype_edge_vocabulary.json

Defines the **15 canonical edge meanings** used across all 15 archetype graphs. Every archetype edge must use exactly one of these meanings. They describe causal relationships between story phases — not just "what happens next" but *why* one phase leads to another.

Includes: forces commitment, reveals truth, narrows options, raises cost, reframes goal, tests resolve, disrupts order, triggers crisis, enables transformation, demands sacrifice, restores equilibrium, grants insight, escalates conflict, inverts expectations, compounds failure.

Each entry includes a `definition` and `typical_context`.

### genre_node_roles.json

Defines the **7 canonical node roles** used across all 27 genre depth graphs. The first five form the 5-level constraint hierarchy; the remaining two handle structural concepts that appear outside the main spine.

| Role | Level | Count per graph |
|------|-------|-----------------|
| Genre Promise | 1 | Exactly 1 |
| Core Constraint | 2 | 3-6 |
| Subgenre Pattern | 3 | 3-6 |
| Setting Rule | 4 | 2-4 |
| Scene Obligation | 5 | 2-4 |
| Tone Marker | — | 1 |
| Anti-Pattern | — | 1-2 |

Each entry includes a `definition`, `structural_function`, `level`, and `examples_across_genres`.

### genre_edge_vocabulary.json

Defines the **12 canonical edge meanings** used across all 27 genre depth graphs. These represent refinement relationships — how moving deeper through genre levels narrows creative degrees of freedom and increases specificity.

Includes: specifies constraint, narrows scope, branches into subtype, mandates element, prohibits element, introduces setting rule, requires payoff, sets tone, warns against, inherits constraint, reinforces constraint, modifies constraint.

Each entry includes a `definition` and `typical_context`.

### archetype_id_convention.md

Documents the ID naming convention for archetype nodes and edges:
- **Format:** `{PREFIX}_N{##}_{SHORT_NAME}` for nodes, `{PREFIX}_E{##}_{SHORT_NAME}` for edges
- **Prefix:** 2-letter code per archetype (HJ = Hero's Journey, TR = Tragedy, etc.)
- **Number ranges:** 01-09 spine nodes, 10-49 role-grouped nodes, 50-79 variant nodes
- Includes the full prefix table for all 15 archetypes.

### genre_id_convention.md

Documents the ID naming convention for genre nodes and edges:
- **Format:** `{PREFIX}_N{##}_{SHORT_NAME}` for nodes, `{PREFIX}_E{##}_{SHORT_NAME}` for edges
- **Prefix:** 2-letter code per genre (DR = Drama, HR = Horror, SF = Science Fiction, etc.)
- **Number ranges by level:** 01-09 (L1 Genre Promise), 10-19 (L2 Core Constraint), 20-39 (L3 Subgenre Pattern), 40-59 (L4 Setting Rule), 60-79 (L5 Scene Obligation), 80-89 (Tone Marker), 90-99 (Anti-Pattern)
- Includes the full prefix table for all 27 genres.

## Usage

These vocabularies are enforced at multiple points:
- **Graph authoring** — Every node and edge must use a role/meaning from these files.
- **Validation script** (`app/scripts/validate_corpus.ts`) — Checks vocabulary membership for all 42 graphs at build time.
- **Generation pipeline** — The corpus loader reads these files to validate contracts and trace constraints.
- **Interactive viewer** — Role and meaning values drive node coloring, edge styling, and the cross-index panel.
