# V-Next — Deferred Tasks, Enhancements, and Completed Items

This document tracks all deferred work items: issues, suggestions, and enhancements. Items resolved by the interactive viewer implementation (Phases 1–8) or prior housekeeping are archived at the bottom.

---

## Open Items — Phased Implementation Plan

### Phase A — Data Housekeeping (low effort, no dependencies)

Mechanical cleanup tasks that improve consistency and documentation quality.

- [X] **#4 / #7 / #23 — Unified vocabulary directory**
  Consolidated archetype and genre vocabulary files into `data/vocabulary/`. Co-locates definitions with deliverables. All references updated.

- [X] **#9 — Document genre graph size variation rationale**
  Six genres (Drama, Biography, Young Adult, Literary Fiction, Musical, Holiday) have 18 nodes vs. the standard 17 due to a second Anti-Pattern node. Structural note added to each graph.json description.

- [X] **#18 — Romance/Romantic Comedy graph.json size consistency**
  Romance and Romantic Comedy are ~2× genre average size due to more detailed relationship-focused constraint definitions. Documented as intentional in each graph.json description.

- [X] **#40 — Graph metadata block**
  Injected `_metadata` block (nodeCount, edgeCount, nodesPerRole, edgesPerMeaning) into all 42 graph.json files via `app/scripts/inject-metadata.ts`.

### Phase B — Edge Numbering Consistency (medium effort, mechanical)

Renumber edges in affected genre graphs to match the documented convention. Each genre requires updates to graph.json, narrative.md, and examples.md.

- [X] **#11 — Systematic edge numbering shift in 6–8 genre graphs**
  Renumbered 80 edges across HR, DT, RC, LF, CL, FA, BI, CR to match level-transition ranges. Updated graph.json, narrative.md, and examples.md for each. Script at `app/scripts/renumber-edges.ts`.

- [X] **#12 — Cross-level edges not in 70–89 range**
  Renumbered 6 cross-level edges in YA, WE, WR, MY to E70–E89 range. (CR and DT were fixed in #11.)

### Phase C — Content Enrichment (medium effort, content-heavy)

Expand and index the example mappings across all graphs.

- [X] **#17 — Consolidated example works registry**
  Built `data/example_works_registry.json` — 107 unique works across all 42 example files. Includes metadata (creator, year, medium) and cross-references (19 works appear in multiple graphs). Extraction script at `app/scripts/build-works-registry.ts`.

- [ ] **#1 — Example expansion and data enrichment**
  Expand example works per archetype/genre, increase node-to-example mapping density, enrich metadata, and enable deeper comparative cross-referencing. Depends on #17 (registry) for gap analysis.

- [X] **#34 — Narrative spec variant walkthrough expansion**
  All 27 genre narrative specs already have 4 variant walkthroughs, one per Level 3 (Subgenre Pattern) node — 100% coverage confirmed. No expansion needed.

### Phase D — Structural Modeling Extensions (high effort, research + design)

New analytical models that extend the graph framework's expressive power.

- [ ] **#19 — Hybrid archetype modeling**
  Document common hybrid patterns (e.g., Hero's Journey + Coming of Age, Revenge + Tragedy) and describe how graphs can be composed or layered. Prerequisite for #33.

- [ ] **#33 — Genre blending/hybridization model**
  Model how genre constraint graphs compose when a story operates in multiple genres. Define which constraints dominate in conflicts and which combinations are structurally stable vs. unstable.

- [ ] **#35 — Genre constraint severity weighting**
  Add a severity field to genre nodes/edges distinguishing hard requirements (violating breaks the genre) from soft expectations (uncommon but valid deviations).

- [ ] **#36 — Tone marker integration with archetype graphs**
  Model the interaction between genre tone markers (e.g., sustained dread for Horror) and archetype emotional arcs. Extend the compatibility matrix with tone compatibility notes.

- [ ] **#41 — Archetype emotional arc profiles**
  Map the emotional trajectory (tension, hope, fear, resolution) for each archetype as a quantitative curve. Supports matching arcs to genre tone requirements (#36).

### Phase E — Advanced Analysis & Research (high effort, external data)

Research-intensive items requiring new data collection or external corpus work.

- [ ] **#29 — Non-Western archetype analysis**
  Research and potentially add archetypes from East Asian, South Asian, African, Indigenous, and Middle Eastern narrative traditions. The current 15 archetypes draw primarily from Western storytelling.

- [ ] **#31 — Cross-medium adaptation mapping**
  Analyze how archetype graphs shift between mediums (novel → film → TV → game). Document which nodes compress, expand, or change role.

- [ ] **#32 — Quantitative validation against a story corpus**
  Test archetype and genre graphs against a corpus (e.g., 100 films, 100 novels) to measure coverage, identify missing patterns, and validate vocabularies empirically.

### Phase F — Architecture Evolution (medium effort, structural changes)

Structural refactors to the graph data model.

- [ ] **#20 — Archetype variant graphs as separate JSON files**
  Split variant branches (currently embedded via 50–79 ID range) into separate graph files for cleaner tooling and independent analysis.

- [ ] **#27 — Scene-level beat sheets**
  Extend archetype graphs to scene-level resolution for specific example works — mapping each node/edge to specific scenes with timestamps or page numbers.

---

## Phase Dependencies

| Phase | Depends On | Notes |
|-------|-----------|-------|
| A — Housekeeping | — | Can start immediately |
| B — Edge Numbering | — | Independent, mechanical |
| C — Content Enrichment | #17 before #1 | Registry enables gap analysis |
| D — Modeling Extensions | — | #19 before #33; #41 supports #36 |
| E — Advanced Research | — | Independent, long-term |
| F — Architecture | — | Independent |

Phases A and B can run in parallel. Phase C requires A (vocabulary consolidation) for clean paths. Phases D, E, and F are independent and can be prioritized by interest.

---

## Archived — Completed Items

Items resolved by the interactive viewer implementation (Phases 1–8), prior housekeeping, or subsumed by delivered features.

| # | Item | Resolution |
|---|------|-----------|
| 3 | File path references in goal_1.md are stale | Fixed: updated `docs/archetypes/` → `data/archetypes/` |
| 5 | cross_archetype_index.json naming inconsistency | Fixed: standardized names to match `archetypes.json` |
| 6 | Musical narrative.md incorrect node ID references | Fixed: corrected `MU_N40_HEIGHTENED_EMOTIONAL_REALITY` → `MU_N40_HEIGHTENED_REALITY` |
| 13 | `archtypes.json` filename misspelled | Fixed: renamed to `archetypes.json`, updated all references (viewer Phase 1) |
| 14 | CLAUDE.md Goal 2 status stale | Fixed: updated to reflect Goal 2 + viewer completion |
| 15 | genre_archetype_matrix.json placement inconsistent | Fixed: co-located all cross-cutting indices at `data/` root (viewer Phase 1) |
| 16 | No JSON schema for graph.json validation | Fixed: `app/src/schemas/graph.schema.json` + AJV validation (viewer Phase 1) |
| 22 | CLAUDE.md update needed | Fixed: updated to current project state |
| 24 | Data manifest file | Fixed: `data/manifest.json` generated by `app/scripts/generate-manifest.ts` (viewer Phase 1) |
| 2 | Unused archetype controlled vocabulary terms | Resolved: vocab audit built into normalizer (viewer Phase 1) |
| 8 | Unused genre edge vocabulary terms | Resolved: vocab audit built into normalizer (viewer Phase 1) |
| 10 | No automated validation for graph-narrative correspondence | Resolved: ID validation in normalizer pipeline (viewer Phase 1) |
| 21 | Graph visualization tooling | Subsumed: the interactive viewer IS the visualization tool (viewer Phase 2) |
| 25 | Export to standard graph formats | Resolved: DOT/Graphviz, Mermaid, and GraphML export in ExportPanel (viewer Phase 8) |
| 26 | Constraint checklist generator | Resolved: ConstraintChecklist panel in detail view (viewer Phase 4) |
| 28 | Interactive story planner | Subsumed: simulation mode + overlay mode (viewer Phases 5–7) |
| 30 | Audience-facing genre depth selector | Resolved: constraint sheet export in simulation panel (viewer Phase 5) |
| 37 | Multi-archetype overlay visualization | Resolved: comparative mode with archetype alignment (viewer Phase 7) |
| 38 | Genre-archetype tension analysis | Resolved: tension analysis panel in cross-index view (viewer Phase 7) |
| 39 | Interactive visual graph interface | Resolved: full 8-phase implementation complete |
| 42 | Failure mode cross-reference index | Resolved: cross-index panel with failure mode search (viewer Phase 7) |
