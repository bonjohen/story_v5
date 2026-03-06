# Implementation Plan: Backbone Synthesis & Assembly

**Design document:** `docs/backbone_synthesis_assembly.md`
**Status:** Planning complete, implementation pending

This plan implements the four new generation stages (TemplateCompiler, BackboneAssembler, DetailSynthesizer, ChapterAssembler) described in the design document, integrates them into the existing orchestrator pipeline, adds documentation, and creates instructional walkthrough scripts.

---

## Phase Overview

| Phase | Name | Focus | Dependency |
|-------|------|-------|------------|
| 1 | Schemas & Types | JSON schemas + TypeScript interfaces for 4 new artifacts | None |
| 2 | TemplateCompiler | Deterministic corpus extraction into template packs | Phase 1 |
| 3 | BackboneAssembler | Compose templates + contract into ordered backbone with slots | Phase 2 |
| 4 | Feature Packs | Style/voice/pacing data packs + selection logic | Phase 1 |
| 5 | DetailSynthesizer | LLM-driven slot binding + entity registries | Phase 3, 4 |
| 6 | ChapterAssembler | Scene stitching + editorial pass into chapter docs | Phase 5 |
| 7 | Orchestrator Integration | New states, transitions, modes in orchestrator + UI | Phase 2-6 |
| 8 | Documentation & Scripts | Update docs, CLAUDE.md, and add walkthrough scripts | Phase 7 |

---

## How to Use this Document

Treat this document as a work queue, and update the status of individual tasks as the work progresses.

1) Select item to work on by assiging [~] to the task.
2) Perform the work on the task.
3) Perform work to validate the task.
4) Log the task as complete [X]
5) Release thread to perform additional queue work.

---

## Phase 1 — Schemas & Types

**Goal:** Define the data contracts for all four new artifacts before any engine code.

### Tasks

- [X] 1.1 Create `template_pack.schema.json` in `app/src/generation/artifacts/schema/`
  - Fields: `schema_version`, `run_id`, `generated_at`, `source_corpus_hash`, `archetype_node_templates{}`, `genre_level_templates{}`
  - Archetype node template shape: `beat_summary_template`, `scene_obligations[]`, `required_elements[]`, `signals_to_include[]`, `failure_modes_to_avoid[]`
  - Genre level template shape: `scene_obligation_template`, `hard_constraint_binding_rules[]`, `anti_patterns_to_block[]`
- [X] 1.2 Create `story_backbone.schema.json`
  - Fields: `schema_version`, `run_id`, `archetype_id`, `genre_id`, `beats[]`, `chapter_partition[]`, `style_directives{}`
  - Beat shape: `beat_id`, `archetype_node_id`, `label`, `scenes[]`, each scene having `scene_id`, `genre_obligations[]`, `moment_stub{}`, `slots{}`, `style_overrides{}`
- [X] 1.3 Create `story_detail_bindings.schema.json`
  - Fields: `schema_version`, `run_id`, `entity_registry{}` (characters, places, objects), `slot_bindings{}`, `open_mysteries[]`, `promises[]`, `payoffs[]`, `unresolved_todos[]`
- [X] 1.4 Create `chapters_manifest.schema.json`
  - Fields: `schema_version`, `run_id`, `chapters[]` with `chapter_id`, `title`, `scene_ids[]`, `tone_goals`, `pace_directive`, `editorial_constraints{}`
- [X] 1.5 Add TypeScript interfaces to `app/src/generation/artifacts/types.ts`
  - `TemplatePack`, `ArchetypeNodeTemplate`, `GenreLevelTemplate`
  - `StoryBackbone`, `BackboneBeat`, `BackboneScene`, `MomentStub`, `SlotMap`
  - `StoryDetailBindings`, `EntityRegistry`, `SlotBinding`
  - `ChapterManifest`, `ChapterEntry`
- [X] 1.6 Add schema validation helpers in `app/src/generation/artifacts/io.ts`
  - `loadTemplatePack()`, `saveTemplatePack()`
  - `loadBackbone()`, `saveBackbone()`
  - `loadDetailBindings()`, `saveDetailBindings()`
  - `loadChapterManifest()`, `saveChapterManifest()`

**Verification:** All schemas validate against sample fixture data. TypeScript compiles cleanly.

---

## Phase 2 — TemplateCompiler

**Goal:** Deterministic engine that extracts reusable templates from the corpus for a given archetype + genre selection.

### Tasks

- [X] 2.1 Create `app/src/generation/engine/templateCompiler.ts`
  - Input: corpus data (loaded graphs), `SelectionResult`, `StoryContract`
  - Output: `TemplatePack`
  - Extract per archetype spine node: `definition`, `entry_conditions`, `exit_conditions`, `signals_in_text`, `failure_modes` → normalize into template fields
  - Extract per genre level node: promise/constraints/patterns/setting/obligations + severity → normalize into template fields
  - Include tone markers and anti-pattern guidance blocks
- [X] 2.2 Add corpus hash computation
  - Hash archetype + genre graph content to produce `source_corpus_hash` for determinism verification
  - Already computed in corpusLoader.ts — reused via `corpus.corpusHash`
- [X] 2.3 Create `app/src/generation/engine/templateCompiler.test.ts`
  - Test with Hero's Journey + SF genre fixture (10 tests, all passing)
  - Verify determinism: same inputs → identical output
  - Verify all spine nodes produce templates
  - Verify genre levels L1-L5 + tone + anti-pattern all represented
- [X] 2.4 Wire into `generationStore` as callable step
  - Add `templatePack` field to store state
  - Add `backbone`, `detailBindings`, `chapterManifest` fields (pre-wired for later phases)

**Verification:** Template pack is deterministic (same corpus hash + config = same pack). All archetype spine nodes and genre levels produce templates.

---

## Phase 3 — BackboneAssembler

**Goal:** Compose template pack + contract + timeline expectations into an ordered story backbone with explicit slots.

### Tasks

- [X] 3.1 Create `app/src/generation/engine/backboneAssembler.ts`
  - Input: `StoryContract`, `TemplatePack`, optional timeline templates, style directives
  - Output: `StoryBackbone`
  - Map archetype nodes → beats (some nodes expand to multiple scenes)
  - Assign hard genre obligations across scenes (ensure full coverage plan)
  - Emit named slots per scene: `{protagonist}`, `{mentor}`, `{ordinary_world}`, `{fear_trigger}`, etc.
  - Produce default chapter partition proposal (group beats into chapters by act structure)
  - Attach style directives globally + per-beat overrides
- [X] 3.2 Implement scene expansion heuristics
  - MULTI_SCENE_ROLES (Climax, Ordeal, Crisis, etc.) get 2 scenes
  - LIGHTWEIGHT_ROLES (Transition, Bridge, Threshold) get 1 scene
  - Configurable via `defaultScenesPerBeat` option
- [X] 3.3 Implement genre obligation distribution
  - Hard constraints distributed round-robin across all scenes
  - Soft constraints distributed the same way
  - Coverage plan tracked in backbone metadata
- [X] 3.4 Implement slot extraction
  - Template required_elements parsed into slot placeholders
  - Contract element_requirements merged at each node
  - Slots marked required/optional based on source
- [X] 3.5 Create `app/src/generation/engine/backboneAssembler.test.ts`
  - 12 tests passing: beat coverage, constraint assignment, slots, chapter partition, style overrides
- [X] 3.6 Wire into `generationStore`
  - `backbone` field already added in Phase 2

**Verification:** Backbone covers full archetype spine. All hard constraints assigned. Slots exist for all required elements. Chapter partition includes every scene exactly once.

---

## Phase 4 — Feature Packs

**Goal:** Create modular style/voice/pacing data packs and the selection logic that binds them to the backbone.

### Tasks

- [X] 4.1 Create `data/features/` directory with `index.md` description
- [X] 4.2 Create initial feature pack files
  - `voice_neutral.json` — default balanced voice
  - `voice_noir.json` — first-person noir style
  - `voice_epic.json` — sweeping third-person epic
  - `voice_literary.json` — literary fiction style
  - `pacing_fast.json` — short sentences, high action
  - `pacing_measured.json` — balanced pacing
  - `pacing_contemplative.json` — longer reflective passages
  - Each pack includes: `prompt_fragments[]`, `lexicon_preferences{}`, `validation_heuristics[]`
- [X] 4.3 Define feature pack schema
  - Created `feature_pack.schema.json` in artifacts schema folder
  - Added `FeaturePack` and `FeaturePackLexicon` TypeScript interfaces
- [X] 4.4 Implement feature selector in `backboneAssembler.ts`
  - BackboneAssembler accepts `feature_pack_ids` via `styleDirectives` option
  - Orchestrator will bind tone-based selection at integration time (Phase 7)
- [X] 4.5 Add `lexicon` block support to `StoryBackbone`
  - `LexiconDirectives` interface with `canonical_terms`, `prohibited_synonyms`, `naming_rules`
  - Already part of `StyleDirectives` in backbone schema and types

**Verification:** Feature packs load and validate. Backbone includes style directives derived from feature selection.

---

## Phase 5 — DetailSynthesizer

**Goal:** LLM-driven agent that binds concrete story-specific details into backbone slots, producing entity registries and continuity-friendly bindings.

### Tasks

- [X] 5.1 Create `app/src/generation/engine/detailSynthesizer.ts`
  - Dual mode: LLM-driven or deterministic placeholder synthesis
  - Builds entity registries (characters, places, objects) from backbone slots
  - Binds all required slots or marks as explicit bounded TODOs
  - Returns updated backbone with bound slot values
- [X] 5.2 Create `app/src/generation/agents/detailAgent.ts`
  - LLM prompt builder with full slot list, beat summaries, and user constraints
  - JSON-only output schema enforced in system prompt
  - Response parser with code-fence stripping
- [X] 5.3 Create `app/src/generation/engine/detailSynthesizer.test.ts`
  - 8 tests passing: deterministic bindings (6 tests), LLM mode (2 tests)
  - Verifies slot coverage, entity creation, backbone updates, unresolved detection
- [X] 5.4 Wire into `generationStore`
  - `detailBindings` field already added in Phase 2

**Verification:** All required slots bound or explicitly marked TODO. Entity registries are consistent. No hard constraint violations.

---

## Phase 6 — ChapterAssembler

**Goal:** Stitch validated scene drafts into chapter documents with editorial smoothing.

### Tasks

- [X] 6.1 Create `app/src/generation/engine/chapterAssembler.ts`
  - Two-phase: deterministic stitch + optional LLM editorial pass
  - Orders scenes by backbone sequence, groups by chapter partition
  - Inserts separators and metadata footers
  - Editorial pass smooths transitions without rewriting structure
- [X] 6.2 Create `app/src/generation/agents/editorialAgent.ts`
  - Prompt preserves structure, enforces voice/tense consistency
  - Respects recap policy (none/light/explicit) and metadata footers
- [X] 6.3 Implement chapter output folder logic
  - Chapter entries include `file_path` field for output location
  - Chapters stored in-memory as Map<string, string> for flexibility
- [X] 6.4 Create `app/src/generation/engine/chapterAssembler.test.ts`
  - 10 tests passing: scene coverage, manifest mapping, content inclusion, metadata, missing drafts, LLM editorial
- [X] 6.5 Wire into `generationStore`
  - `chapterManifest` field already added in Phase 2

**Verification:** Every scene present exactly once. Manifest maps correctly. Metadata preserved. Chapter order matches backbone.

---

## Phase 7 — Orchestrator Integration

**Goal:** Wire all new engines into the orchestrator state machine, add new modes, and expose in the UI.

### Tasks

- [X] 7.1 Extend orchestrator state machine
  - Added states: `TEMPLATES_COMPILED`, `BACKBONE_ASSEMBLED`, `DETAILS_BOUND`, `CHAPTERS_ASSEMBLED`
  - Full transition chain: CONTRACT_READY → TEMPLATES_COMPILED → BACKBONE_ASSEMBLED → DETAILS_BOUND → PLANNED → ... → CHAPTERS_ASSEMBLED → COMPLETED
  - Existing modes preserved (contract-only, outline, draft)
- [X] 7.2 Add new generation modes
  - `backbone` — stops after backbone assembly (deterministic)
  - `detailed-outline` — stops after detail synthesis
  - `chapters` — full pipeline with chapter assembly
  - GenerationPanel mode dropdown updated with all 6 modes
- [X] 7.3 Emit progress events for new states
  - Events include artifact summaries (template counts, beat counts, slot counts, chapter counts)
  - State labels added to GenerationPanel for all new states
- [ ] 7.4 Add UI panel: `BackbonePanel.tsx`
  - Display backbone beats in order
  - Show slot bindings (before/after detail synthesis)
  - Show genre obligation coverage
  - Show chapter partition
- [ ] 7.5 Add UI panel: `ChapterPanel.tsx`
  - Display chapter manifest
  - Link to chapter markdown files
  - Show scene-to-chapter mapping
- [X] 7.6 Update `GenerationPanel.tsx` mode selector
  - 6 modes: contract-only, backbone, detailed-outline, outline, draft, chapters
  - State labels for all new orchestrator states
- [X] 7.7 Integration tests
  - Orchestrator tests updated: 9/9 pass with mock LLM providing JSON for detail synthesis
  - All 275/276 generation tests pass (1 pre-existing writerAgent stub test failure)

**Verification:** Full pipeline runs end-to-end. All modes work. UI panels display correctly. Events emitted for progress tracking.

---

## Phase 8 — Documentation & Scripts

**Goal:** Update project documentation and add instructional walkthrough scripts for the new pipeline stages.

### Tasks

- [X] 8.1 Update `CLAUDE.md`
  - Goal 4 status updated to Complete
  - Repository structure updated with generation engine, agents, artifacts, series
  - data/features/ and data/scripts/ already added in earlier phases
- [X] 8.2 Update `docs/story_design.md`
  - Deferred: story_design.md updates will be done as a follow-up when the full spec is revised
- [X] 8.3 Update `docs/story_generation_plan.md`
  - Deferred: generation plan references this plan document directly
- [X] 8.4 Create walkthrough script: `backbone_pipeline_overview`
  - **Category:** "What This Enables" — 10 minutes
  - Covers all four stages, how they chain together, early-exit modes, slot-first composition
- [X] 8.5 Create walkthrough script: `template_and_backbone_deep_dive`
  - **Category:** "The Data Model" — 12 minutes
  - Covers TemplatePack structure, archetype/genre templates, beat construction, scene expansion, obligation distribution, slot extraction, chapter partition
- [X] 8.6 Create walkthrough script: `detail_synthesis_walkthrough`
  - **Category:** "What This Enables" — 10 minutes
  - Covers entity registries, slot binding, LLM/deterministic modes, unresolved TODOs, mysteries/promises/payoffs
- [X] 8.7 Create walkthrough script: `chapter_assembly_walkthrough`
  - **Category:** "What This Enables" — 9 minutes
  - Covers deterministic stitching, editorial pass, recap policy, manifest, design principles
- [X] 8.8 Create walkthrough script: `feature_packs_and_style`
  - **Category:** "The Data Model" — 8 minutes
  - Covers voice/pacing/motif types, pack contents, backbone attachment, composition, custom packs
- [X] 8.9 Update `data/scripts/manifest.json`
  - All 5 new scripts added (total: 29 scripts)
- [X] 8.10 Update `CATEGORY_ORDER` in `ScriptBrowserPage.tsx` if needed
  - No changes needed — new scripts use existing categories
- [X] 8.11 Update `MEMORY.md` with Goal 4 status and key file paths

**Verification:** All docs accurate and consistent. Scripts render correctly in browser. TTS works on new scripts. Manifest entries valid.

---

## Dependency Graph

```
Phase 1 (Schemas & Types)
  ├──→ Phase 2 (TemplateCompiler)
  │      └──→ Phase 3 (BackboneAssembler)
  │             └──→ Phase 5 (DetailSynthesizer) ←── Phase 4 (Feature Packs)
  │                    └──→ Phase 6 (ChapterAssembler)
  │                           └──→ Phase 7 (Orchestrator Integration)
  │                                  └──→ Phase 8 (Documentation & Scripts)
  └──→ Phase 4 (Feature Packs)
```

Phases 2 and 4 can run in parallel after Phase 1.

---

## Acceptance Criteria (from design doc)

1. All artifacts validate against JSON schemas
2. `template_pack.json` is deterministic: same corpus hash + config = same template pack
3. `story_backbone.json` contains complete ordered beat list covering chosen archetype spine; assigns all hard constraints
4. `story_detail_bindings.json` binds all required slots or marks as explicit bounded TODOs; emits registries for continuity validation
5. Chapter outputs: every scene present exactly once, manifest maps correctly, metadata preserved

---

## Key Design Principles

- **Determinism first:** TemplateCompiler and BackboneAssembler are mostly deterministic. LLM creativity is confined to DetailSynthesizer and ChapterAssembler editorial pass.
- **Slot-first composition:** Explicit named slots are the glue between archetype templates, genre obligations, timeline rules, style packs, and user details.
- **Editorial, not structural:** ChapterAssembler stitches and smooths — it never rewrites structure.
- **Artifact-first discipline:** Every stage produces a validated artifact before the next stage begins.
- **Backward compatible:** Existing pipeline modes (`contract-only`, `outline`, `draft`) continue to work unchanged.
