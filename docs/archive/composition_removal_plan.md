# Composition Removal Plan

Remove genre blending and hybrid archetype functionality from the codebase. The composition system (genre blends + hybrid archetypes) adds complexity that is not yet consumed by downstream pipeline stages. This plan removes it cleanly.

Usage: Mark `[~]` before working, `[X]` when done. One active item at a time.

---

## Phase 1 — Types & Schemas

Remove composition types, interfaces, and JSON schemas.

- [X] **1.1** `app/src/generation/artifacts/types.ts` — Remove: `BlendStability`, `CompositionMethod`, `HybridFrequency`, `GenreBlendSelection`, `HybridArchetypeSelection`, `BeatHybridInfo`, `CompositionDefaults`, `HybridPattern`, `HybridArchetypePatterns`, `BlendConflict`, `BlendPattern`, `GenreBlendingModel`. Remove `genre_blend` and `hybrid_archetype` from `SelectionResult`. Remove `hybrid_info` from `Beat`. Remove `composition_method` from `Beat`. Remove `composition_defaults` from `GenerationConfig`. Remove `allow_genre_blend`, `allow_hybrid_archetype`, `preferred_blend_genre`, `preferred_hybrid_archetype` from `RequestConstraints`. Remove `hybridPatterns` and `blendingModel` from `LoadedCorpus`.
- [X] **1.2** `app/src/generation/artifacts/schema/story_request.schema.json` — Remove blend/hybrid constraint fields.
- [X] **1.3** `app/src/generation/artifacts/schema/selection_result.schema.json` — Remove `genre_blend` and `hybrid_archetype` properties.

---

## Phase 2 — Engine Layer

Remove composition logic from selection engine, planner, and corpus loader.

- [X] **2.1** `app/src/generation/engine/selectionEngine.ts` — Remove `selectGenreBlend()`, `selectHybridArchetype()` functions and their calls from `runSelection()`. Remove blend/hybrid fields from the returned `SelectionResult`.
- [X] **2.2** `app/src/generation/engine/planner.ts` — Remove hybrid context resolution block and `BeatHybridInfo` annotation from `buildBeats()`.
- [X] **2.3** `app/src/generation/engine/corpusLoader.ts` — Remove loading of `hybrid_archetype_patterns.json` and `genre_blending_model.json`. Remove `hybridPatterns` and `blendingModel` from the returned `LoadedCorpus`.

---

## Phase 3 — UI & Store

Remove composition controls from the Generation Panel and request store.

- [X] **3.1** `app/src/generation/store/requestStore.ts` — Remove `allowBlend`, `blendGenre`, `allowHybrid`, `hybridArchetype` state and their setters.
- [X] **3.2** `app/src/generation/panels/GenerationPanel.tsx` — Remove genre blend checkbox/dropdown, hybrid archetype checkbox/dropdown, and related state bindings. Remove `composition_defaults` from `DEFAULT_CONFIG`. Remove blend/hybrid fields from the request construction.
- [X] **3.3** `app/src/App.tsx` — Remove the `useEffect` that syncs auto-selected blends/hybrids back to the request store.

---

## Phase 4 — Series System

Remove composition from series manager and types.

- [X] **4.1** `app/src/generation/series/seriesManager.ts` — Remove `AccentOption` interface, `getCompatibleAccents()`, `isAccentCompatible()` functions.
- [X] **4.2** `app/src/generation/series/index.ts` — Remove exports of removed functions/types.
- [X] **4.3** `app/src/generation/series/types.ts` — Remove `genre_accent` fields from episode slot/config types if they depend on removed blend types (keep if independent).

---

## Phase 5 — Tests

Update all test files that reference composition.

- [X] **5.1** `app/src/generation/engine/selectionEngine.test.ts` — Remove blend/hybrid test cases and mock data.
- [X] **5.2** `app/src/generation/engine/planner.test.ts` — Remove hybrid annotation test cases.
- [X] **5.3** `app/src/generation/engine/contractCompiler.test.ts` — Remove blend/hybrid fields from test fixtures.
- [X] **5.4** `app/src/generation/engine/corpusLoader.test.ts` — Remove hybridPatterns/blendingModel from test fixtures.
- [X] **5.5** `app/src/generation/engine/normalizer.test.ts` — Remove composition references from fixtures.
- [X] **5.6** `app/src/generation/engine/detailSynthesizer.test.ts` — Remove composition references from fixtures.
- [X] **5.7** `app/src/generation/engine/orchestrator.test.ts` — Remove composition references from fixtures.
- [X] **5.8** `app/src/generation/engine/repairEngine.test.ts` — Remove composition references from fixtures.
- [X] **5.9** `app/src/generation/engine/templateCompiler.test.ts` — Remove composition references from fixtures.
- [X] **5.10** `app/src/generation/artifacts/io.test.ts` — Remove composition references from fixtures.
- [X] **5.11** `app/src/generation/series/seriesManager.test.ts` — Remove accent/blend test cases.
- [X] **5.12** `app/src/generation/series/branchManager.test.ts` — Remove composition references.
- [X] **5.13** `app/src/generation/series/episodeContractCompiler.test.ts` — Remove composition references.
- [X] **5.14** `app/src/generation/series/episodeOrchestrator.test.ts` — Remove composition references.
- [X] **5.15** `app/src/generation/series/episodePlanner.test.ts` — Remove composition references.
- [X] **5.16** `app/src/generation/series/loreValidator.test.ts` — Remove composition references.
- [X] **5.17** `app/src/generation/series/seriesAnalytics.test.ts` — Remove composition references.
- [X] **5.18** `app/src/generation/series/seriesExporter.test.ts` — Remove composition references.
- [X] **5.19** `app/src/generation/series/store/seriesStore.test.ts` — Remove composition references.
- [X] **5.20** `app/src/generation/validators/validationEngine.test.ts` — Remove composition references.

---

## Phase 6 — Data & Docs

Remove data files, walkthrough scripts, and documentation references.

- [X] **6.1** Delete `data/cross_references/hybrid_archetype_patterns.json`.
- [X] **6.2** Delete `data/cross_references/genre_blending_model.json`.
- [X] **6.3** Delete `data/scripts/hybrid_archetypes_overview.md`.
- [X] **6.4** Delete `data/scripts/blend_and_hybrid_selection.md`.
- [X] **6.5** `data/scripts/manifest.json` — Remove the two script entries for hybrid_archetypes_overview and blend_and_hybrid_selection.
- [X] **6.6** `data/cross_references/index.md` — Remove references to deleted files.
- [X] **6.7** Update `CLAUDE.md` — Remove mentions of blend/hybrid selection UI, composition_defaults.
- [X] **6.8** Delete `docs/hybrid_archetypes_overview.md` if it exists in docs/.

---

## Phase 7 — Verify

- [X] **7.1** Run `npx tsc -b` — zero errors.
- [X] **7.2** Run `npx vitest run` — all tests pass.
- [X] **7.3** Commit and push.

---

## Scope

| Phase | Items | Risk |
|-------|-------|------|
| 1 — Types & Schemas | 3 | Low — removing types will surface all downstream references as compile errors |
| 2 — Engine Layer | 3 | Medium — must preserve selection/planner function signatures |
| 3 — UI & Store | 3 | Low — straightforward UI removal |
| 4 — Series System | 3 | Low — accent functions are isolated |
| 5 — Tests | 20 | Low — fixture cleanup, no logic changes |
| 6 — Data & Docs | 8 | Low — file deletions and text edits |
| 7 — Verify | 3 | Low — build + test confirmation |
| **Total** | **43** | |
