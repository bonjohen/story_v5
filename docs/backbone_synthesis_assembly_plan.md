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

- [ ] 2.1 Create `app/src/generation/engine/templateCompiler.ts`
  - Input: corpus data (loaded graphs), `SelectionResult`, `StoryContract`
  - Output: `TemplatePack`
  - Extract per archetype spine node: `definition`, `entry_conditions`, `exit_conditions`, `signals_in_text`, `failure_modes` → normalize into template fields
  - Extract per genre level node: promise/constraints/patterns/setting/obligations + severity → normalize into template fields
  - Include tone markers and anti-pattern guidance blocks
- [ ] 2.2 Add corpus hash computation
  - Hash archetype + genre graph content to produce `source_corpus_hash` for determinism verification
- [ ] 2.3 Create `app/src/generation/engine/templateCompiler.test.ts`
  - Test with Hero's Journey + Horror genre fixture
  - Verify determinism: same inputs → identical output
  - Verify all spine nodes produce templates
  - Verify genre levels L1-L5 + tone + anti-pattern all represented
- [ ] 2.4 Wire into `generationStore` as callable step
  - Add `templatePack` field to store state
  - Add `compileTemplates()` action

**Verification:** Template pack is deterministic (same corpus hash + config = same pack). All archetype spine nodes and genre levels produce templates.

---

## Phase 3 — BackboneAssembler

**Goal:** Compose template pack + contract + timeline expectations into an ordered story backbone with explicit slots.

### Tasks

- [ ] 3.1 Create `app/src/generation/engine/backboneAssembler.ts`
  - Input: `StoryContract`, `TemplatePack`, optional timeline templates, style directives
  - Output: `StoryBackbone`
  - Map archetype nodes → beats (some nodes expand to multiple scenes)
  - Assign hard genre obligations across scenes (ensure full coverage plan)
  - Emit named slots per scene: `{protagonist}`, `{mentor}`, `{ordinary_world}`, `{fear_trigger}`, etc.
  - Produce default chapter partition proposal (group beats into chapters by act structure)
  - Attach style directives globally + per-beat overrides
- [ ] 3.2 Implement scene expansion heuristics
  - Rules for when a single archetype node warrants multiple scenes (e.g., climax, ordeal)
  - Rules for combining lightweight nodes into shared scenes (e.g., sequential transitions)
- [ ] 3.3 Implement genre obligation distribution
  - Assign each hard constraint to at least one scene
  - Distribute soft constraints as guidance
  - Track coverage plan in backbone metadata
- [ ] 3.4 Implement slot extraction
  - Parse template required_elements into slot placeholders
  - Merge archetype element requirements + genre element constraints into unified slot schema
  - Mark slots as required vs optional
- [ ] 3.5 Create `app/src/generation/engine/backboneAssembler.test.ts`
  - Verify complete beat coverage of archetype spine
  - Verify all hard constraints assigned
  - Verify slots generated for all required elements
  - Verify chapter partition covers all scenes
- [ ] 3.6 Wire into `generationStore`
  - Add `backbone` field to store state
  - Add `assembleBackbone()` action

**Verification:** Backbone covers full archetype spine. All hard constraints assigned. Slots exist for all required elements. Chapter partition includes every scene exactly once.

---

## Phase 4 — Feature Packs

**Goal:** Create modular style/voice/pacing data packs and the selection logic that binds them to the backbone.

### Tasks

- [ ] 4.1 Create `data/features/` directory with `index.md` description
- [ ] 4.2 Create initial feature pack files
  - `voice_neutral.json` — default balanced voice
  - `voice_noir.json` — first-person noir style
  - `voice_epic.json` — sweeping third-person epic
  - `voice_literary.json` — literary fiction style
  - `pacing_fast.json` — short sentences, high action
  - `pacing_measured.json` — balanced pacing
  - `pacing_contemplative.json` — longer reflective passages
  - Each pack includes: `prompt_fragments[]`, `lexicon_preferences{}`, `validation_heuristics[]`
- [ ] 4.3 Define feature pack schema
  - Create `feature_pack.schema.json` in artifacts schema folder
  - Add `FeaturePack` TypeScript interface
- [ ] 4.4 Implement feature selector in `backboneAssembler.ts`
  - Select feature packs based on: genre tone nodes, user preferences from `StoryRequest`
  - Attach globally and optionally per-beat
- [ ] 4.5 Add `lexicon` block support to `StoryBackbone`
  - Canonical names, prohibited synonyms, naming rules

**Verification:** Feature packs load and validate. Backbone includes style directives derived from feature selection.

---

## Phase 5 — DetailSynthesizer

**Goal:** LLM-driven agent that binds concrete story-specific details into backbone slots, producing entity registries and continuity-friendly bindings.

### Tasks

- [ ] 5.1 Create `app/src/generation/engine/detailSynthesizer.ts`
  - Input: `StoryRequest`, `StoryBackbone`, corpus references, timeline/element rules
  - Output: `StoryDetailBindings` + updated `StoryBackbone` (slots bound)
  - Build entity registry: characters (name, role, traits), places (name, type, features), objects (name, type, significance)
  - Bind all required slots or mark as explicit bounded TODOs
  - Generate open_mysteries, promises, payoffs for long-form coherence
- [ ] 5.2 Create `app/src/generation/agents/detailAgent.ts`
  - LLM prompt: receives backbone slots + constraints + feature packs + user request
  - Output: JSON bindings only (no prose)
  - Must include entity registry, slot bindings, unresolved list
  - Constrained to not violate hard constraints or anti-pattern blocks
- [ ] 5.3 Create `app/src/generation/engine/detailSynthesizer.test.ts`
  - Verify all required slots bound or marked as TODO
  - Verify entity registry consistency (no duplicate names, roles filled)
  - Verify hard constraints not contradicted
  - Test with mock LLM adapter
- [ ] 5.4 Wire into `generationStore`
  - Add `detailBindings` field to store state
  - Add `synthesizeDetails()` action

**Verification:** All required slots bound or explicitly marked TODO. Entity registries are consistent. No hard constraint violations.

---

## Phase 6 — ChapterAssembler

**Goal:** Stitch validated scene drafts into chapter documents with editorial smoothing.

### Tasks

- [ ] 6.1 Create `app/src/generation/engine/chapterAssembler.ts`
  - Input: instantiated backbone, scene drafts (from writer loop), validation results
  - Output: chapter markdown files + `ChapterManifest`
  - Phase 1 (deterministic): order scenes by backbone sequence, group by chapter partition, insert separators + metadata blocks
  - Phase 2 (LLM editorial): smooth transitions, ensure tense/voice consistency, enforce recap policy, preserve compliance metadata in footers
- [ ] 6.2 Create `app/src/generation/agents/editorialAgent.ts`
  - LLM prompt: receives ordered scene texts, per-chapter goals, feature packs (voice consistency), chapter transition rules
  - Output: markdown chapter text with scene separators + metadata footers
  - Must NOT rewrite structure — only smooth and polish
- [ ] 6.3 Implement chapter output folder logic
  - Write to `outputs/runs/{run_id}/chapters/ch01.md`, `ch02.md`, etc.
  - Write `outputs/runs/{run_id}/chapters/manifest.json`
- [ ] 6.4 Create `app/src/generation/engine/chapterAssembler.test.ts`
  - Verify every scene present exactly once in chapter docs
  - Verify chapter manifest correctly maps scenes → chapters
  - Verify metadata preserved (trace/compliance footers)
  - Verify chapter ordering matches backbone sequence
- [ ] 6.5 Wire into `generationStore`
  - Add `chapterManifest` field to store state
  - Add `assembleChapters()` action

**Verification:** Every scene present exactly once. Manifest maps correctly. Metadata preserved. Chapter order matches backbone.

---

## Phase 7 — Orchestrator Integration

**Goal:** Wire all new engines into the orchestrator state machine, add new modes, and expose in the UI.

### Tasks

- [ ] 7.1 Extend orchestrator state machine
  - Add new states: `TEMPLATES_COMPILED`, `BACKBONE_ASSEMBLED`, `DETAILS_BOUND`, `CHAPTERS_ASSEMBLED`
  - Add transitions:
    - `CONTRACT_READY` → `TEMPLATES_COMPILED` (TemplateCompiler)
    - `TEMPLATES_COMPILED` → `BACKBONE_ASSEMBLED` (BackboneAssembler)
    - `BACKBONE_ASSEMBLED` → `DETAILS_BOUND` (DetailSynthesizer)
    - `DETAILS_BOUND` → `PLANNED` (existing planner, now using enriched backbone)
    - After all scenes validated → `CHAPTERS_ASSEMBLED` (ChapterAssembler)
  - Preserve existing early-exit modes (`contract-only`, `outline`)
- [ ] 7.2 Add new generation modes
  - `backbone` — stop after backbone assembly (deterministic, no LLM)
  - `detailed-outline` — stop after detail synthesis (LLM for bindings only)
  - `chapters` — full pipeline including chapter assembly
  - Update mode dropdown in GenerationPanel
- [ ] 7.3 Emit progress events for new states
  - `templates_compiled`, `backbone_assembled`, `details_bound`, `chapters_assembled`
  - Include artifact summaries in event payloads
- [ ] 7.4 Add UI panel: `BackbonePanel.tsx`
  - Display backbone beats in order
  - Show slot bindings (before/after detail synthesis)
  - Show genre obligation coverage
  - Show chapter partition
- [ ] 7.5 Add UI panel: `ChapterPanel.tsx`
  - Display chapter manifest
  - Link to chapter markdown files
  - Show scene-to-chapter mapping
- [ ] 7.6 Update `GenerationPanel.tsx` mode selector
  - Add `backbone`, `detailed-outline`, `chapters` modes
  - Show new panels when results available
- [ ] 7.7 Integration tests
  - End-to-end test: `StoryRequest` → `TemplatePack` → `StoryBackbone` → `StoryDetailBindings` → chapters
  - Test each early-exit mode
  - Test error recovery at each new state

**Verification:** Full pipeline runs end-to-end. All modes work. UI panels display correctly. Events emitted for progress tracking.

---

## Phase 8 — Documentation & Scripts

**Goal:** Update project documentation and add instructional walkthrough scripts for the new pipeline stages.

### Tasks

- [ ] 8.1 Update `CLAUDE.md`
  - Add Goal 4 status entry for Backbone Synthesis & Assembly
  - Update repository structure with new folders/files (`data/features/`, new engine files, chapter output)
  - Add new artifact descriptions to Graph JSON Format section
- [ ] 8.2 Update `docs/story_design.md`
  - Add sections for TemplateCompiler, BackboneAssembler, DetailSynthesizer, ChapterAssembler
  - Document new artifact schemas
  - Document new orchestrator states and transitions
  - Document feature pack format
- [ ] 8.3 Update `docs/story_generation_plan.md`
  - Add Phase 9 (Backbone Synthesis & Assembly) with subtasks
  - Reference this plan document
- [ ] 8.4 Create walkthrough script: `backbone_pipeline_overview`
  - **Category:** "What This Enables"
  - Covers: what the backbone pipeline adds, the four new stages, how they chain together, what artifacts are produced
  - ~10 minutes estimated
- [ ] 8.5 Create walkthrough script: `template_and_backbone_deep_dive`
  - **Category:** "The Data Model"
  - Covers: TemplatePack structure, how corpus data becomes templates, BackboneAssembler's composition logic, slot system, scene expansion heuristics, genre obligation distribution
  - ~12 minutes estimated
- [ ] 8.6 Create walkthrough script: `detail_synthesis_walkthrough`
  - **Category:** "What This Enables"
  - Covers: how DetailSynthesizer works, entity registries, slot binding, LLM constraints, continuity support, open mysteries and promises
  - ~10 minutes estimated
- [ ] 8.7 Create walkthrough script: `chapter_assembly_walkthrough`
  - **Category:** "What This Enables"
  - Covers: scene-to-chapter stitching, editorial pass, transition smoothing, metadata preservation, chapter manifest
  - ~9 minutes estimated
- [ ] 8.8 Create walkthrough script: `feature_packs_and_style`
  - **Category:** "The Data Model"
  - Covers: what feature packs are, voice/pacing/motif types, how they attach to the backbone, lexicon system
  - ~8 minutes estimated
- [ ] 8.9 Update `data/scripts/manifest.json`
  - Add all 5 new script entries
- [ ] 8.10 Update `CATEGORY_ORDER` in `ScriptBrowserPage.tsx` if needed
  - New scripts use existing categories ("What This Enables", "The Data Model") — no changes needed unless a new category is added
- [ ] 8.11 Update `MEMORY.md` with Goal 4 status and key file paths

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
