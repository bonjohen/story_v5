# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **data and content project** that models storytelling structures as formal directed graphs. It produces two complementary analysis products, both complete:

1. **Archetype Graphs** — model story progression over time for 15 fundamental plot structures (e.g., Hero's Journey, Tragedy, The Quest). Each archetype is a directed graph with nodes (story phases) and edges (causal transitions).

2. **Genre Depth Graphs** — model genre constraints at increasing levels of detail (Genre Promise → Core Constraints → Subgenre Pattern → World/Setting Rules → Scene Obligations) for 27 genres. Edges represent refinement steps that narrow creative degrees of freedom.

3. **Interactive Visual Graph Interface** — a web-based narrative structure exploration engine built with React 19, TypeScript, Vite, Cytoscape.js, and Zustand. All 8 implementation phases are complete, plus post-phase UI updates (info panel moved to top, simulation removed, Templates panel added, persistent form state via requestStore, character role profiles, blend/hybrid selection UI). Deployed to GitHub Pages at `/story_v5/`. See `docs/interactive_viewer_design.md` (specification) and `docs/interactive_viewer_plan.md` (implementation plan).

4. **Backbone Synthesis & Assembly** — a new generation pipeline stage that templatizes corpus knowledge, assembles story backbones with explicit slots, synthesizes story-specific details via LLM, and stitches scenes into chapter documents. See `docs/backbone_synthesis_assembly.md` (design) and `docs/backbone_synthesis_assembly_plan.md` (8-phase implementation plan).

## Repository Structure

```
docs/                              ← Planning, specs, and task tracking
  v0_plan.md                       ← Authoritative statement of work (read first)
  goal_1.md                        ← Goal 1 task tracker (complete)
  goal_2.md                        ← Goal 2 task tracker (complete)
  v-next.md                        ← Deferred items: issues, suggestions, enhancements
  interactive_viewer_design.md     ← UI/UX spec for interactive graph viewer
  interactive_viewer_plan.md       ← 8-phase implementation plan for the viewer
  backbone_synthesis_assembly.md   ← Design doc: template, backbone, detail, chapter stages
  backbone_synthesis_assembly_plan.md ← 8-phase implementation plan for backbone synthesis
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
      variants.json                ← Variant nodes/edges (optional, some archetypes)
      beat_sheet_*.json            ← Beat-sheet mappings (optional, some archetypes)
  genres/                          ← Goal 2 deliverables (complete)
    {nn_name}/                     ← Per-genre folder (27 total)
      graph.json
      narrative.md
      examples.md
  scripts/                           ← Walkthrough scripts for TTS-enabled reader
    manifest.json                    ← Script metadata and ordering
    *.md                             ← Individual walkthrough scripts
  features/                          ← Voice, style, and pacing feature packs (planned)
  cross_references/                  ← Cross-referencing datasets and corpus metadata
    index.md                         ← Description of all files in this folder
    manifest.json                    ← Data manifest (file listing and checksums)
    genre_archetype_matrix.json      ← 27 genres × 15 archetypes compatibility
    cross_archetype_index.json       ← Shared node roles/edge meanings across all 15
    cross_genre_constraint_index.json ← Shared constraint types across all 27
    archetype_emotional_arcs.json    ← Emotional arc analysis for archetypes
    hybrid_archetype_patterns.json   ← Hybrid/combined archetype patterns
    tone_archetype_integration.json  ← Tone-archetype integration model
    genre_blending_model.json        ← Genre blending/mixing model
    example_works_registry.json      ← Consolidated registry of all example works
    non_western_archetype_analysis.json ← Non-Western archetype analysis
    cross_medium_adaptation.json     ← Cross-medium adaptation patterns
    corpus_validation.json           ← Corpus-wide validation results

app/                               ← Interactive viewer (React + TypeScript + Vite)
  src/
    components/                    ← Reusable UI components (GraphSearch, SettingsPanel, etc.)
    panels/                        ← Side panels (DetailPanel, PairingPanel, ExportPanel, etc.)
    render/                        ← Cytoscape canvas, styles, element builders
    graph-engine/                  ← Normalizer, validator, data index, example parser
    generation/                    ← Story generation pipeline
      engine/                      ← Core engines (templateCompiler, backboneAssembler, detailSynthesizer, chapterAssembler, orchestrator, etc.)
      agents/                      ← LLM agent prompts (detailAgent, editorialAgent, plannerAgent, writerAgent, etc.)
      artifacts/                   ← Types, JSON schemas, I/O helpers
      panels/                      ← Generation UI panels (GenerationPanel, ContractPanel, TemplatesPanel, etc.)
      store/                       ← Generation Zustand stores (generationStore, requestStore)
      series/                      ← Series/episode generation subsystem
    store/                         ← Zustand stores (graphStore, settingsStore)
    layout/                        ← Graph layout algorithms
    types/                         ← TypeScript interfaces
    scripts/                       ← Walkthrough script pages, store, TTS engine
  public/data/                     ← Copied graph JSON data served by Vite
```

## Goal Status

- **Goal 1 — Archetype Graphs**: Complete. All 15 graph JSONs, 15 narrative specs, 15 example mappings, cross-archetype index, and validation done.
- **Goal 2 — Genre Depth Graphs**: Complete. All 27 graph JSONs, 27 narrative specs, 27 example mappings, cross-genre constraint index, genre × archetype compatibility matrix, and validation done.
- **Goal 3 — Interactive Viewer**: Complete. All 8 phases implemented plus post-phase updates: info panel moved to top, simulation removed, Templates panel and requestStore added, character role profiles, blend/hybrid selection, GitHub Pages deployment.
- **Goal 4 — Backbone Synthesis & Assembly**: Complete. All 8 phases implemented (schemas, TemplateCompiler, BackboneAssembler, feature packs, DetailSynthesizer, ChapterAssembler, orchestrator integration, documentation/scripts).

## Key Conventions

### Graph JSON Format

All graph deliverables follow the schema in `docs/v0_plan.md` §1.1–1.2:

- **Nodes**: `node_id`, `label`, `role`, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, `signals_in_text`
  - Genre nodes add: `severity` ("hard" or "soft"), `level` (1-5 for spine nodes, null for Tone Marker/Anti-Pattern)
- **Edges**: `edge_id`, `from`, `to`, `label`, `meaning`, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, `anti_patterns`
  - Genre edges add: `severity` ("hard" or "soft")
- **Top-level fields**: `id`, `name`, `type` ("archetype" or "genre"), `description`
  - Archetype graphs add: `variant_file` (string filename pointing to variants.json, or null)
  - `_metadata` block: `nodeCount`, `edgeCount`, `nodesPerRole`, `edgesPerMeaning`; genre graphs also include `severityCounts` (hard/soft/total)
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

Deferred work was tracked in `docs/v-next.md`. All 42 items are now resolved.

### Workflow Rules

- Commit and push at each phase end
- Echo banners for task/phase transitions
- Don't stop between phases — continue to the next
- Only mark the single active task as `[~]`
- Do not prefix bash commands with `cd /c/Projects/story_v5` — the working directory is already set to the project root

### Deployment

- **GitHub Pages**: App is deployed to `https://bonjohen.github.io/story_v5/` via `.github/workflows/deploy-scripts.yml`
- **Base path**: Vite `base` is set to `/story_v5/` in `app/vite.config.ts`
- **Data**: `app/public/data` is a symlink to `../../data/` (gitignored); CI copies `data/` into `app/public/data/` before build
- **Pre-push hook**: `.githooks/pre-push` runs `tsc -b` before every push to prevent broken builds
- **Build**: `cd app && npm run build` runs `tsc -b && vite build`
- **Typecheck only**: `cd app && npm run typecheck`

### Bug Tracking

- **Code Review 1** (`docs/code_review.md`): Full audit from 2026-03-04. All 62 items acknowledged `[X]`.
- **Code Review 2** (`docs/code_review_2_plan.md`): Bug audit from 2026-03-06. 43 items across 7 phases. Uses `[ ]` → `[~]` → `[X]` progression. Mark active item `[~]` before working, `[X]` when done. Commit and push at each phase end.

### Quality Standards

- Every edge must have causal meaning, not just "and then"
- Node entry/exit conditions must be explicit and testable against a draft
- Each archetype graph needs at least 2 meaningful variants
- Failure modes must be specific enough to guide revision
- Genre depth graphs must have all 5 levels clearly distinguished
- Constraints must be stated as enforceable rules, not vague descriptions
