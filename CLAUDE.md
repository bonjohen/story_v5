# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: LLM Backend Rules

- **NEVER use an Anthropic API key.** Do not import, configure, or wire `AnthropicAdapter` or any direct API key-based adapter.
- **ALWAYS use the Claude Code CLI** (`claude --print`) via `ClaudeCodeAdapter` for all LLM calls. The bridge server (`BridgeServer` in `bridgeServer.ts`) must use `ClaudeCodeAdapter`, never `AnthropicAdapter`.
- **Do NOT spawn new Claude Code instances from within an active Claude Code session.** The `ClaudeCodeAdapter` already handles nested-session prevention by cleaning env vars (`CLAUDECODE`, `CLAUDE_CODE_SSE_PORT`, `CLAUDE_CODE_ENTRYPOINT`).
- The Vite bridge plugin (`vite-bridge-plugin.ts`) auto-starts the bridge server when `npm run dev` runs.

## jcodemunch MCP Integration

This project has a **jcodemunch MCP server** configured for code intelligence. Use jcodemunch tools for codebase exploration, symbol lookup, and code search — they provide AST-aware results that are faster and more structured than raw file reads.

- **Repo identifier**: `bonjohen/story_v5` (use this for all `repo` parameters)
- **Index**: Run `index_repo(url: "bonjohen/story_v5", use_ai_summaries: false)` to index/re-index. Use `incremental: true` (default) after code changes.
- **AI summaries are disabled** (`use_ai_summaries: false`) — summaries use docstring/signature fallback only. Do not enable AI summaries (they require API keys we don't use).

### Available Tools

| Tool | Use When |
|------|----------|
| `list_repos` | Check what repos are indexed |
| `index_repo` / `index_folder` | Index or re-index the codebase |
| `invalidate_cache` | Force full re-index (deletes cached index) |
| `get_repo_outline` | Quick overview: directories, languages, symbol counts |
| `get_file_tree` | Browse file structure, optionally filtered by path prefix |
| `get_file_outline` | List all symbols in a file (functions, classes, types) with signatures |
| `get_file_content` | Read cached source, optionally sliced to line range |
| `get_symbol` | Get full source of a specific symbol by ID |
| `get_symbols` | Batch-retrieve multiple symbols at once |
| `search_symbols` | Search by name/signature/summary; filter by kind (`function`, `class`, `type`, etc.) or language |
| `search_text` | Full-text search across file contents (strings, comments, config values) |

### When to Use jcodemunch vs Built-in Tools

- **Use jcodemunch** for: understanding code structure, finding symbol definitions, exploring unfamiliar parts of the codebase, getting file outlines before diving in
- **Use built-in Read/Glob/Grep** for: reading specific known files, making edits, simple pattern matching
- **Prefer `search_symbols`** over Grep when looking for function/class/type definitions
- **Prefer `get_file_outline`** before reading a large file to understand its structure first

## CRITICAL: Always Leave Services Running

- **After ANY code change, always restart and leave the dev server running.** Run `cd /c/Projects/story_v5/app && npm run dev` in the background before finishing.
- The Vite dev server auto-starts the bridge server — no separate command needed.
- **Never finish work without confirming the app is accessible in the browser.**
- Use `run_in_background` for long-running services so they persist.

## Project Overview

This is a **data and content project** that models storytelling structures as formal directed graphs. It produces two complementary analysis products, both complete:

1. **Archetype Graphs** — model story progression over time for 15 fundamental plot structures (e.g., Hero's Journey, Tragedy, The Quest). Each archetype is a directed graph with nodes (story phases) and edges (causal transitions).

2. **Genre Depth Graphs** — model genre constraints at increasing levels of detail (Genre Promise → Core Constraints → Subgenre Pattern → World/Setting Rules → Scene Obligations) for 27 genres. Edges represent refinement steps that narrow creative degrees of freedom.

3. **Interactive Visual Graph Interface** — a web-based narrative structure exploration engine built with React 19, TypeScript, Vite, Cytoscape.js, and Zustand. All 8 implementation phases are complete, plus post-phase UI updates (info panel moved to top, simulation removed, Templates panel added, persistent form state via requestStore, character role profiles, blend/hybrid selection UI). Deployed to GitHub Pages at `/story_v5/`. See `docs/interactive_viewer_design.md` (specification) and `docs/interactive_viewer_plan.md` (implementation plan).

4. **Backbone Synthesis & Assembly** — a new generation pipeline stage that templatizes corpus knowledge, assembles story backbones with explicit slots, synthesizes story-specific details via LLM, and stitches scenes into chapter documents. See `docs/backbone_synthesis_assembly.md` (design) and `docs/backbone_synthesis_assembly_plan.md` (8-phase implementation plan).

5. **SQLite Data Layer** — a browser-side SQLite metadata store (via sql.js/WASM) that indexes story entities, scenes, chapters, vocabulary terms, and generation artifacts into a queryable relational database. Persisted to IndexedDB, exportable as `.db` file. Includes vocabulary templatization (9 domains, ~102 terms), import bridges from StoryInstance/manuscript/generation pipeline, and query UI (vocabulary browser, template coverage). See `docs/data_layer_design_plan.md` (9-phase implementation plan).

6. **Claude Code CLI Interface** — an `LLMAdapter` implementation (`ClaudeCodeAdapter`) that delegates LLM calls to the Claude Code CLI (`claude --print`) instead of calling the Anthropic API directly. Lets users run the full generation pipeline using their Claude Code subscription. See `docs/claude_code_cli_interface_design.md` (design), `docs/claude_code_cli_interface_usage.md` (usage guide), and `docs/claude_code_cli_interface_plan.md` (implementation plan).

7. **UI Upgrade (Progressive Disclosure)** — restructured the interface around progressive disclosure: hamburger menu + NavDrawer replacing toolbar buttons, collapsible generation panel, info panel with accordion groups instead of 14 flat tabs, single-graph focus mode with optional split view, mobile-responsive CSS with 44px touch targets, and consistent AppShellBar across all sub-pages. See `docs/user_interface_upgrade_plan.md` (8-phase plan).

8. **Generation UI Redesign** — replaced the monolithic GenerationPanel with 4 focused tabs: Story Setup (archetype/genre selection, premise, tone, LLM connection), Elements (editable entity CRUD for characters/places/objects), Analysis (graph canvases, statistics, node/edge detail, cross-index, timeline, character arcs, generation artifacts), and Generate (Generate Story button, event log, prose output, save/load projects, export story .md). Plus a Graph tab for Cytoscape visualization. See `docs/generation_ui_redesign_plan.md`.

9. **UI Refactor 1** — removed the "Hide generation panel" toggle (panel always visible), cleaned LLM output (stripPreamble, no beat IDs in prose), preserved elements across generation runs, human-friendly event log messages, unified StoryProject save/load (replaces snapshot import/export, captures both requestStore settings and generation artifacts). Dead files (GenerationPanel.tsx, PipelineTab.tsx) deleted. See `docs/ui_refactor_1_design.md`.

## Repository Structure

```
docs/                              ← Active planning and specs
  generation_ui_redesign_plan.md   ← 5-tab generation UI redesign (complete)
  ui_refactor_1_design.md          ← UI data element inventory + save/load design
  story_elements_and_timelines.md  ← Story elements and timeline design
  story_elements_and_timelines_plan.md ← Implementation plan
  user_interface_upgrade_plan.md   ← 8-phase UI upgrade plan (complete)
  archive/                         ← Completed plans and historical docs
    v0_plan.md                     ← Original statement of work
    goal_1.md, goal_2.md           ← Task trackers (complete)
    v-next.md                      ← Deferred items (all resolved)
    interactive_viewer_design.md   ← UI/UX spec for graph viewer
    interactive_viewer_plan.md     ← 8-phase viewer implementation plan
    backbone_synthesis_assembly.md ← Backbone pipeline design
    backbone_synthesis_assembly_plan.md ← 8-phase backbone plan
    data_layer_design_plan.md      ← 9-phase SQLite data layer plan
    claude_code_cli_interface_*.md ← CLI adapter design, usage, plan
    competition_review_plan.md     ← Author surfaces plan (complete)
    code_review.md, code_review_2_plan.md ← Bug audit plans (complete)

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
  scripts/                           ← Walkthrough scripts for TTS-enabled reader (41 scripts)
    manifest.json                    ← Script metadata and ordering
    *.md                             ← Individual walkthrough scripts
  cross_references/                  ← Cross-referencing datasets and corpus metadata
    index.md                         ← Description of all files in this folder
    manifest.json                    ← Data manifest (file listing and checksums)
    genre_archetype_matrix.json      ← 27 genres × 15 archetypes compatibility
    cross_archetype_index.json       ← Shared node roles/edge meanings across all 15
    cross_genre_constraint_index.json ← Shared constraint types across all 27
    archetype_emotional_arcs.json    ← Emotional arc analysis for archetypes
    tone_archetype_integration.json  ← Tone-archetype integration model
    example_works_registry.json      ← Consolidated registry of all example works
    non_western_archetype_analysis.json ← Non-Western archetype analysis
    cross_medium_adaptation.json     ← Cross-medium adaptation patterns
    corpus_validation.json           ← Corpus-wide validation results

app/                               ← Interactive viewer (React + TypeScript + Vite)
  src/
    components/                    ← Reusable UI components (AppShell, NavDrawer, Disclosure, GraphSearch, SettingsPanel, etc.)
    panels/                        ← Shared panels (DetailPanel, PairingPanel, ExportPanel, etc.)
    render/                        ← Cytoscape canvas, styles, element builders
    graph-engine/                  ← Normalizer, validator, data index, example parser
    generation/                    ← Story generation pipeline
      engine/                      ← Core engines (templateCompiler, backboneAssembler, detailSynthesizer, chapterAssembler, orchestrator, etc.)
      agents/                      ← LLM adapters and agent prompts (ClaudeCodeAdapter, detailAgent, writerAgent, etc.)
      artifacts/                   ← Types, JSON schemas, I/O helpers
      panels/                      ← Generation UI tabs (StorySetupTab, ElementsTab, AnalysisTab, GenerateTab) + legacy PipelineTab/GenerationPanel
      store/                       ← Generation Zustand stores (generationStore, requestStore)
      series/                      ← Series/episode generation subsystem
    store/                         ← Zustand stores (graphStore, settingsStore, uiStore)
    layout/                        ← Graph layout algorithms
    types/                         ← TypeScript interfaces
    instance/                      ← Story instance workspace (entity editors, lore management)
    manuscript/                    ← Manuscript workspace (prose editing, diff view)
    notes/                         ← Notes system (tagging, entity linking, backlinks)
    encyclopedia/                  ← Auto-generated lore encyclopedia
    sceneboard/                    ← Scene board (card-based scene planning)
    timelineview/                  ← Timeline view (chronological events, swim lanes)
    scripts/                       ← Walkthrough script pages, store, TTS engine
    db/                            ← SQLite data layer (sql.js, migrations, repos, importers, UI)
      migrations/                  ← Numbered migration SQL modules
      repository/                  ← CRUD repos for each table (projectRepo, entityRepo, etc.)
      import/                      ← Import bridges (vocabulary, instance, manuscript, generation)
      panels/                      ← DB UI panels (VocabularyBrowser, TemplateCoverage)
  public/data/                     ← Copied graph JSON data served by Vite
```

## Goal Status

- **Goal 1 — Archetype Graphs**: Complete. All 15 graph JSONs, 15 narrative specs, 15 example mappings, cross-archetype index, and validation done.
- **Goal 2 — Genre Depth Graphs**: Complete. All 27 graph JSONs, 27 narrative specs, 27 example mappings, cross-genre constraint index, genre × archetype compatibility matrix, and validation done.
- **Goal 3 — Interactive Viewer**: Complete. All 8 phases implemented plus post-phase updates: info panel moved to top, simulation removed, Templates panel and requestStore added, character role profiles, blend/hybrid selection, GitHub Pages deployment.
- **Goal 4 — Backbone Synthesis & Assembly**: Complete. All 8 phases implemented (schemas, TemplateCompiler, BackboneAssembler, feature packs, DetailSynthesizer, ChapterAssembler, orchestrator integration, documentation/scripts).
- **Goal 5 — SQLite Data Layer**: Complete. All 9 phases implemented (foundation, core schema, vocabulary templatization, chapters/scenes, artifacts/runs/tags, indexes/queries, import bridge, export/management UI, query UI). Unit tests pending.
- **Goal 6 — Claude Code CLI Interface**: Complete. All 8 phases implemented (adapter, CLI integration, docs, streaming, JSON mode, session reuse, browser bridge, verify).
- **Goal 7 — UI Upgrade (Progressive Disclosure)**: Complete. All 8 phases implemented (AppShell/NavDrawer, collapsible gen panel, info panel accordion, single-graph focus, mobile touch, disclosure widgets, sub-page consistency, polish).
- **Goal 8 — Generation UI Redesign**: Complete. All 8 phases implemented (extract constants, PipelineTab, StorySetupTab, ElementsTab, GenerateTab, rewire App.tsx, slim down GenerationPanel, polish/mobile). Plus Analysis tab added post-plan.
- **UI Refactor 1**: Complete. Removed gen panel toggle, cleaned LLM output, preserved elements across runs, human-friendly events, unified StoryProject save/load, dead file cleanup. See `docs/ui_refactor_1_design.md`.

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
- **Tests**: `cd app && npx vitest run` (all tests), `cd app && npx vitest run src/store` (specific folder)
- **Routes**: `/` (main app — always-visible generation panel with Setup/Elements/Graph/Analysis/Generate tabs), `/story` (story workspace), `/sceneboard` (scene board), `/timeline` (timeline view), `/encyclopedia` (encyclopedia), `/manuscript` (manuscript editor), `/notes` (notes browser), `/scripts` (walkthrough scripts), `/series` (series browser), `/db` (database management)

### Bug Tracking

- **Code Review 1** (`docs/archive/code_review.md`): Full audit from 2026-03-04. All 62 items acknowledged `[X]`.
- **Code Review 2** (`docs/archive/code_review_2_plan.md`): Bug audit from 2026-03-06. 43 items across 7 phases. All complete.

### Quality Standards

- Every edge must have causal meaning, not just "and then"
- Node entry/exit conditions must be explicit and testable against a draft
- Each archetype graph needs at least 2 meaningful variants
- Failure modes must be specific enough to guide revision
- Genre depth graphs must have all 5 levels clearly distinguished
- Constraints must be stated as enforceable rules, not vague descriptions
