# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **data and content project** (no source code, build system, or tests) that models storytelling structures as formal directed graphs. It produces two complementary analysis products:

1. **Archetype Graphs** — model story progression over time for 15 fundamental plot structures (e.g., Hero's Journey, Tragedy, The Quest). Each archetype is a directed graph with nodes (story phases) and edges (causal transitions).

2. **Genre Depth Graphs** — model genre constraints at increasing levels of detail (Genre Promise → Core Constraints → Subgenre Pattern → World/Setting Rules → Scene Obligations) for 27 genres. Edges represent refinement steps that narrow creative degrees of freedom.

## Repository Structure

All project content lives in `docs/`:

- `docs/v0_plan.md` — The authoritative statement of work defining deliverables, methodology, quality criteria, and acceptance standards for both workstreams. **Read this first** when working on the project.
- `docs/archtypes.json` — Canonical list of 15 story archetypes with descriptions, popularity indices, genre associations, and example works.
- `docs/genres.json` — Canonical list of 27 genres with descriptions, popularity indices, and example works.
- `docs/v-next.md` — Deferred tasks for future iterations.

## Key Conventions

### Graph JSON Format

All graph deliverables must follow the schema defined in `docs/v0_plan.md` §1.1–1.2:

- **Nodes**: `node_id`, `label`, `role`, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, `signals_in_text`
- **Edges**: `edge_id`, `from`, `to`, `label`, `meaning`, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, `anti_patterns`
- Node/edge IDs must be unique and deterministic (e.g., `HJ_N03_THRESHOLD`, `HJ_E03_CROSSING`)
- Each graph must have one start node and one or more terminal nodes

### Terminology

Use a consistent controlled vocabulary for edge meanings across all graphs: "forces commitment", "reveals truth", "narrows options", "raises cost", "reframes goal", etc. Terms must not overlap.

### Quality Standards

- Every edge must have causal meaning, not just "and then"
- Node entry/exit conditions must be explicit and testable against a draft
- Each archetype graph needs at least 2 meaningful variants
- Failure modes must be specific enough to guide revision
- Genre depth graphs must have all 5 levels clearly distinguished
- Constraints must be stated as enforceable rules, not vague descriptions

## Deliverables Checklist

### Archetype Workstream
- 15 archetype graph JSONs
- 15 narrative graph explanations (node/edge explanations, walkthroughs, failure modes)
- 15 example mappings (nodes/edges mapped to moments in example works)
- 1 cross-archetype index (shared node types like "Commitment", "Reversal", "Revelation")

### Genre Workstream
- 27+ genre depth graph JSONs
- 27+ narrative graph explanations
- 1 cross-genre constraint index
- 1 genre x archetype compatibility matrix
