# Code Review 2 — Bug Audit & Phased Release Plan

Performed 2026-03-06. Covers issues introduced or remaining since `code_review.md` (2026-03-04), with focus on recent UI changes (draggable separator, detail panel graph info, blend/hybrid sync, toolbar cleanup) and generation engine.

Usage: Always set the task to in work [~] before working on it, and to [X] when complete. All items should move through the progression [ ] -> [~] -> [X]. I will monitor this file as you progress to identify what items you are currently working, which are complete, and which are not started.
---

## Table of Contents

1. [UI & State Management Bugs](#1-ui--state-management-bugs)
2. [Generation Engine Bugs](#2-generation-engine-bugs)
3. [Build, Deploy & Data Bugs](#3-build-deploy--data-bugs)
4. [Remaining from Code Review 1](#4-remaining-from-code-review-1)
5. [Phased Release Plan](#5-phased-release-plan)
6. [Summary Table](#6-summary-table)

---

## 1. UI & State Management Bugs

### Critical

#### [X] 1.0 React hooks called after early returns in CharacterArcPanel
- **File:** `app/src/panels/CharacterArcPanel.tsx:47,56,63,78`
- **Description:** Two `useMemo` calls (lines 63, 78) execute after two early `return` statements (lines 47, 56). React hooks must be called in the same order on every render. When either early return executes, the hooks are skipped, violating rules-of-hooks. This causes unpredictable behavior and will crash in React StrictMode.
- **Fix:** Move the `useMemo` calls above the early returns, or restructure the component so conditional content is in the JSX return rather than early returns.

#### [X] 1.1 Draggable separator: no `onPointerCancel` / `onLostPointerCapture`
- **File:** `app/src/App.tsx:584-608`
- **Description:** The separator uses `setPointerCapture`, but only listens for `onPointerUp`. If capture is lost (system dialog, touch interrupt), `dragRef.current` stays set and `draggingSep` stays true — the separator tracks pointer movement forever.
- **Fix:** Add `onPointerCancel={handleSepPointerUp}` and `onLostPointerCapture={handleSepPointerUp}`.

#### [X] 1.2 `handleSepPointerDown` captures on `e.target` — wrong element
- **File:** `app/src/App.tsx:145`
- **Description:** `(e.target as HTMLElement).setPointerCapture(e.pointerId)` may capture on the inner grip `<div>` (lines 600-606) instead of the separator container. Pointer events then route to the child, and `onPointerMove`/`onPointerUp` on the parent won't fire.
- **Fix:** Use `e.currentTarget` instead of `e.target`.

### High

#### [X] 1.3 Cytoscape resize not called during drag — only on release
- **File:** `app/src/App.tsx:155-163`
- **Description:** `resize()`/`fit()` are only in `handleSepPointerUp`. During drag the graph container changes size but Cytoscape doesn't know — the canvas renders at wrong dimensions until release.
- **Fix:** Debounce `resize()` during move, or use `ResizeObserver` on graph containers.

#### [X] 1.4 No Cytoscape resize when info panel collapsed/expanded
- **File:** `app/src/App.tsx:470`
- **Description:** Clicking collapse/expand changes graph area height significantly, but no `resize()`/`fit()` is called. Graph may appear squished or have dead space.
- **Fix:** `useEffect` on `infoPanelOpen` with a small delay (for CSS transition), then call resize/fit on both cy refs.

#### [X] 1.5 `handleSepPointerDown` closure re-creates on every height change
- **File:** `app/src/App.tsx:141-146`
- **Description:** Dependency `[infoPanelHeight]` means a new callback on every pixel of drag. While technically correct, it creates a new function reference mid-drag. Storing initial height in `dragRef` already makes the dep unnecessary.
- **Fix:** Store height in a ref, use `[]` dependency.

#### [ ] 1.6 Cytoscape event handlers never explicitly unbound
- **File:** `app/src/render/GraphCanvas.tsx:170-173`
- **Description:** `cy.on('tap', ...)` handlers are registered but only cleaned up implicitly via `cy.destroy()`. If Cytoscape is replaced while the component stays mounted, old handlers may fire on stale closures.
- **Fix:** Explicitly `cy.off()` in the useEffect cleanup before `cy.destroy()`.

### Medium

#### [ ] 1.7 `nameToDir` uses fuzzy matching — can match wrong items
- **File:** `app/src/generation/panels/GenerationPanel.tsx:102-109`
- **Description:** `m.name.includes(name) || name.includes(m.name)` can match "Mystery" to "The Mystery Unveiled" or "Comedy" to "Romantic Comedy".
- **Fix:** Exact match first, fuzzy fallback only if needed. Better: store directory IDs in request store.

#### [ ] 1.8 URL sync loads graph twice on initial navigation
- **File:** `app/src/App.tsx:178-207`
- **Description:** The manifest load effect (line 188) calls `loadGraph(parsed.type, parsed.dir)`. The URL sync effect (line 202) also calls `loadGraph` for the same path. Both fire on mount, loading the graph twice.
- **Fix:** Remove the `loadGraph` call from the manifest effect.

#### [ ] 1.9 Blend/hybrid sync effect may run before manifest loads
- **File:** `app/src/App.tsx:90-116`
- **Description:** If `genSelection` updates before `manifest` is loaded, directory IDs fall back to raw strings (e.g., `06_science_fiction`) shown in the dropdown. The effect won't re-run when manifest later loads because `genSelection` hasn't changed.
- **Fix:** Add a second effect that reconciles raw IDs when manifest transitions from null.

#### [ ] 1.10 `exampleMappedNodes` state is declared but never updated
- **File:** `app/src/App.tsx:122`
- **Description:** `const [exampleMappedNodes] = useState<string[]>([])` — setter discarded, state always empty array. Dead code from when example overlays existed.
- **Fix:** Remove the state and prop passing.

#### [ ] 1.11 `GenerationPanel.onClose` prop is unused
- **File:** `app/src/generation/panels/GenerationPanel.tsx:98,113`
- **Description:** Destructured as `_onClose`, never called. Caller in App.tsx:441 passes a callback that never fires.
- **Fix:** Remove from interface and caller.

#### [ ] 1.12 PairingPanel uses bidirectional `.includes()` for compatibility matching
- **File:** `app/src/panels/PairingPanel.tsx:89-109`
- **Description:** Same fuzzy matching issue as 1.7 — "Comedy" matches "Romantic Comedy" in the compatibility matrix lookup.
- **Fix:** Use exact match or normalized key lookup.

#### [ ] 1.13 Detail panel graph info shows "Unknown" when graph is null
- **File:** `app/src/panels/DetailPanel.tsx:104`
- **Description:** `graphName` defaults to `'Unknown'` when `graph` is null. Edge case: if `graph` is null but `node`/`edge` is provided, "Unknown" shows.
- **Fix:** Guard with `graph &&`.

#### [ ] 1.14 Index-based keys in 30+ list renders
- **File:** `app/src/App.tsx:534,569`, `app/src/panels/DetailPanel.tsx:353`, `app/src/panels/CrossIndex.tsx:159,187`, and others
- **Description:** Lists use `key={i}` instead of stable unique IDs. Causes identity issues if items reorder, and component state (expanded/collapsed) gets tied to position.
- **Fix:** Use item IDs where available.

#### [ ] 1.15 Graph document header uses inline `import()` type
- **File:** `app/src/App.tsx:673`
- **Description:** `graph: import('./graph-engine/index.ts').NormalizedGraph | null` — inconsistent with the rest of the codebase.
- **Fix:** Import `NormalizedGraph` at the top.

### Low

#### [ ] 1.16 `activeVariant` and `showFailureModes` states never set from UI
- **File:** `app/src/App.tsx:119-120`
- **Description:** Both states are only reset in the graph-change effect. No UI control sets them to non-null/true. Dead code.
- **Fix:** Remove or re-add the controls.

#### [ ] 1.17 Separator drag handle has no ARIA attributes
- **File:** `app/src/App.tsx:584-608`
- **Description:** No `role`, `aria-label`, `tabIndex`, or keyboard handler. Inaccessible to screen readers and keyboard users.
- **Fix:** Add `role="separator"`, `aria-orientation="horizontal"`, `tabIndex={0}`, keyboard handlers.

#### [ ] 1.18 `genSceneDrafts.size` reactivity concern
- **File:** `app/src/App.tsx:175,313`
- **Description:** `genSceneDrafts` is a Map from Zustand. Using `.size` in deps works for count changes but `useMemo` may miss content changes at same size.
- **Fix:** Use a dedicated count selector or stable key.

---

## 2. Generation Engine Bugs

### Critical

#### [X] 2.1 `updatedBackbone` scope bug in orchestrator chapter mode
- **File:** `app/src/generation/engine/orchestrator.ts:175,292`
- **Description:** `updatedBackbone` is declared inside the detail synthesis block (line 175) but used in the chapters block (line 292). If mode is `'chapters'`, the code path requires detail synthesis to have run first, but the variable's scope is local to the synthesis block. If a future refactoring changes the control flow, `updatedBackbone` will be undefined at line 292.
- **Fix:** Declare `let currentBackbone = backbone` at orchestrator function scope. After detail synthesis, assign `currentBackbone = updatedBackbone`. Use `currentBackbone` in chapters block.

#### [X] 2.2 Repair loop mutates validation reference directly
- **File:** `app/src/generation/engine/orchestrator.ts:225-261`
- **Description:** The repair loop holds a reference to `sceneResult = validation.scenes[0]` and mutates `sceneResult.status` and `sceneResult.checks` directly after re-validation. This corrupts the original validation array. The while-loop condition re-checks the mutated copy rather than the fresh validation result, potentially masking repair failures.
- **Fix:** Use the fresh `validation.scenes[0]` result object in each iteration instead of mutating the initial reference.

#### [X] 2.3 Selection engine array fallback may self-reference
- **File:** `app/src/generation/engine/selectionEngine.ts:284,348`
- **Description:** In `selectGenreBlend()` and `selectHybridArchetype()`, the code does `best.genres.find(g => g !== primary) ?? best.genres[1]`. If the primary isn't in the array (shouldn't happen, but defensive), the fallback `[1]` could return the primary itself, creating a self-blend. Additionally, if the array is malformed or short, this accesses out-of-bounds.
- **Fix:** Validate array structure before fallback. Throw if primary not found.

### High

#### [ ] 2.4 Genre node severity filtering uses fragile optional type
- **File:** `app/src/generation/engine/contractCompiler.ts:151-158`
- **Description:** Casts `graph.nodes as Array<GenreNode & { severity?: string }>` then filters on `severity === 'hard'`. A node with `severity: undefined` (field missing, not null) will be silently excluded from hard constraints, leading to incomplete contracts.
- **Fix:** Validate all genre nodes have severity before this point, or treat undefined as a data error.

#### [ ] 2.5 Trace engine uses wrong check type for soft constraints
- **File:** `app/src/generation/engine/traceEngine.ts:47-50`
- **Description:** Soft constraints are only added to `satisfiedConstraints` if the `tone` check passes — but tone and soft constraints are different dimensions. A passing tone check shouldn't validate all soft constraints.
- **Fix:** Check for `'soft_constraints'` type or implement dedicated soft constraint tracking.

#### [X] 2.6 Chapter assembler uses non-null assertion on Map.get()
- **File:** `app/src/generation/engine/chapterAssembler.ts:67`
- **Description:** `chapters.get(entry.chapter_id)!` — if the chapter wasn't added to the map, this returns undefined despite the `!` assertion. Runtime error when passed to `runEditorialAgent()`.
- **Fix:** Replace with explicit null check and throw.

#### [X] 2.7 Scene skipping is silent in orchestrator
- **File:** `app/src/generation/engine/orchestrator.ts:201-203`
- **Description:** `if (!beat) continue` silently skips scenes with no matching beat. The user won't know a scene was omitted, and the story trace will have gaps.
- **Fix:** Log a warning. Consider throwing if a scene references a non-existent beat.

#### [ ] 2.8 Unresolved detail todos don't prevent downstream processing
- **File:** `app/src/generation/engine/detailSynthesizer.ts:102-123`
- **Description:** When the LLM fails to bind required slots, unresolved todos are recorded but the artifact is returned as valid. Downstream code proceeds with incomplete entity data, leading to vague or missing character details.
- **Fix:** Throw for unresolved required slots, or flag the artifact with a status field the orchestrator can inspect.

#### [ ] 2.9 Prompt injection risk in writer agent
- **File:** `app/src/generation/agents/writerAgent.ts:39-72`
- **Description:** User-controlled character names and descriptions are interpolated directly into LLM prompts without sanitization. A character named `"Adam [IGNORE SYSTEM PROMPT]"` would be passed verbatim.
- **Fix:** Escape or quote user data in prompts. Use structured prompt format that separates data from instructions.

### Medium

#### [ ] 2.10 Scene obligation detection uses fragile node ID regex fallback
- **File:** `app/src/generation/engine/planner.ts:239-250`
- **Description:** `isSceneObligation()` checks `contract.genre.levels['5']` then falls back to regex `/_N(\d{2})_/` checking the 60-79 range. If levels aren't populated, the regex becomes the only check — and it assumes all N60-N79 nodes are Scene Obligations, which isn't guaranteed.
- **Fix:** Rely only on levels data. Log a warning if levels are empty.

#### [ ] 2.11 Backbone chapter partition breaks for short stories
- **File:** `app/src/generation/engine/backboneAssembler.ts:294-302`
- **Description:** Stories with 3 or fewer beats get one chapter per beat, breaking three-act structure. A 2-beat story gets 2 chapters instead of setup/resolution.
- **Fix:** Apply minimum chapter count or two-chapter fallback for short stories.

#### [ ] 2.12 Anti-pattern detection uses naive keyword matching
- **File:** `app/src/generation/validators/validationEngine.ts:158-165`
- **Description:** Anti-pattern keywords are checked with `lower.includes(kw)` for keywords > 3 chars. This produces false positives: "deus" from "deus ex machina" triggers on "deuterium" or "deuce".
- **Fix:** Use word-boundary matching or LLM-based validation for anti-patterns.

#### [ ] 2.13 Missing JSON response context in detail agent errors
- **File:** `app/src/generation/agents/detailAgent.ts:91-105`
- **Description:** JSON parse error throws `'Failed to parse detail synthesis response as JSON'` with no excerpt of the actual response, making debugging impossible.
- **Fix:** Include first 200 characters of the response in the error message.

#### [ ] 2.14 Missing genre node level field validation
- **File:** `app/src/generation/engine/contractCompiler.ts:134-138`
- **Description:** Filtering on `node.level !== null && node.level >= 1 && node.level <= 5` silently excludes nodes where `level` is `undefined` (vs `null`). A spine node with `undefined` level would be lost.
- **Fix:** Treat `undefined` same as `null` explicitly, or validate upstream.

### Low

#### [ ] 2.15 Silent fallback for unknown blend/hybrid patterns
- **File:** `app/src/generation/engine/selectionEngine.ts:246,308`
- **Description:** When a user specifies a preferred blend/hybrid that has no matching pattern, the code silently returns hardcoded defaults (`conditionally_stable`). No log or warning.
- **Fix:** Add console.warn for pattern-less selections.

#### [ ] 2.16 Unused `_selection` parameter in template compiler
- **File:** `app/src/generation/engine/templateCompiler.ts:203-206`
- **Description:** `buildToneGuidance` accepts `_selection` but never uses it. Dead parameter.
- **Fix:** Remove or implement.

#### [ ] 2.17 Tone marker array access without bounds check
- **File:** `app/src/generation/engine/traceEngine.ts:73`
- **Description:** `contract.genre.tone_marker[0] ?? ''` — handled by `??` but masks data integrity issues if array is empty.

---

## 3. Build, Deploy & Data Bugs

### Critical

#### [X] 3.1 `BrowserRouter` missing `basename` — routes break on GitHub Pages
- **File:** `app/src/main.tsx:16`
- **Description:** The main app's `<BrowserRouter>` has no `basename` prop. When deployed to `/story_v5/`, React Router routes like `/scripts` and `/archetype/01_heros_journey` won't resolve because the router expects paths from `/`, not `/story_v5/`. The separate `scripts-main.tsx:14` correctly uses `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}`. This is the same pattern that should be in `main.tsx`.
- **Fix:** Add `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}` to the `BrowserRouter` in `main.tsx`.

### Medium

#### [ ] 3.2 `app/public/data` symlink is gitignored — no local setup docs
- **File:** `app/.gitignore:14`, `README.md`
- **Description:** The symlink `app/public/data -> ../../data/` is in `.gitignore` and won't be cloned. README doesn't mention creating it. New developers will get 404 on all data requests locally.
- **Fix:** Add setup instructions to README: `cd app/public && ln -s ../../data/ data`.

#### [ ] 3.3 Orphaned React components never imported
- **Files:** `app/src/components/VariantToggle.tsx`, `app/src/panels/SimulationPanel.tsx`, `app/src/panels/ExampleOverlay.tsx`
- **Description:** These components exist but are never imported anywhere. Dead code increasing bundle size.
- **Fix:** Remove if not planned for future use, or document why they're kept.

#### [ ] 3.4 Large bundle warning (1.2MB)
- **File:** `app/vite.config.ts`
- **Description:** Main bundle exceeds Vite's 500KB warning threshold at ~1.2MB. The generation engine, all panels, and Cytoscape are in a single chunk.
- **Fix:** Consider code splitting for generation engine and heavy panels.

### Low

#### [ ] 3.5 `data/features/` directory referenced in CLAUDE.md but doesn't exist
- **File:** `CLAUDE.md`
- **Description:** Repository structure lists `data/features/` as "Voice, style, and pacing feature packs (planned)" but the directory doesn't exist. Feature pack logic is embedded in the template compiler.

#### [ ] 3.6 No root `.gitignore`
- **File:** Project root
- **Description:** Only `app/.gitignore` exists. Root-level artifacts like `bash.exe.stackdump` aren't ignored.
- **Fix:** Add root `.gitignore`.

#### [ ] 3.7 All JSON data files valid — PASS
- No syntax errors found in any data JSON files.

#### [ ] 3.8 Scripts manifest matches files — PASS
- All 32 slugs in `manifest.json` have corresponding `.md` files.

---

## 4. Remaining from Code Review 1

Items from `code_review.md` marked `[X]` (acknowledged) that represent ongoing tech debt:

| # | Issue | Status |
|---|-------|--------|
| 1.4 | SA/MU prefix collision across namespaces | Unchanged |
| 2.1 | 343 genre ID SHORT_NAME violations | Unchanged |
| 3.7 | App.tsx excessive state (~870 lines now, was 647) | Worse |
| 4.5 | Exported functions never called | Some remain |
| 4.6 | Dead graphStore members | Some remain |
| 6.3-6.4 | Settings/Export panels: no focus trap | Unchanged |
| 8.3 | No persistence for user settings | Unchanged |
| 13.1 | ~3% test coverage | Unchanged |

---

## 5. Phased Release Plan

### Phase 1 — Critical Fixes (1 session)

Fix separator bugs and deployment-breaking routing issue:

- [X] **1.0** Fix hooks-after-early-return in CharacterArcPanel (rules-of-hooks violation)
- [X] **3.1** Add `basename` to `BrowserRouter` in `main.tsx` (deploy blocker)
- [X] **1.1** Add `onPointerCancel` and `onLostPointerCapture` to separator
- [X] **1.2** Use `e.currentTarget` instead of `e.target` for pointer capture
- [X] **1.5** Store initial height in ref, remove from callback dependency
- [X] **1.4** Call Cytoscape `resize()`/`fit()` after info panel collapse/expand
- [X] **1.3** Add debounced `resize()` during drag, or use `ResizeObserver`

### Phase 2 — Generation Engine Critical Fixes (1 session)

Fix orchestrator bugs that can cause runtime failures:

- [X] **2.1** Hoist `updatedBackbone` to orchestrator function scope
- [X] **2.2** Fix repair loop to use fresh validation result per iteration
- [X] **2.3** Validate array structure in selection engine fallbacks
- [X] **2.6** Replace `!` assertion with explicit null check in chapter assembler
- [X] **2.7** Log warning for skipped scenes (no matching beat)

### Phase 3 — Dead Code & Props Cleanup (1 session)

Reduce App.tsx complexity and remove dead code:

- [ ] **1.11** Remove unused `onClose` prop from `GenerationPanel`
- [ ] **1.10** Remove `exampleMappedNodes` dead state
- [ ] **1.16** Remove `activeVariant` and `showFailureModes` dead state
- [ ] **1.15** Replace inline `import()` type with proper import
- [ ] **2.16** Remove unused `_selection` parameter

### Phase 4 — Selection & Sync Robustness (1 session)

Fix name-to-directory mapping and sync issues:

- [ ] **1.7** Fix `nameToDir` fuzzy matching — exact match first
- [ ] **1.12** Fix PairingPanel compatibility matching
- [ ] **1.9** Handle manifest-not-yet-loaded case in blend/hybrid sync
- [ ] **1.8** Remove duplicate `loadGraph` call on initial navigation

### Phase 5 — Generation Engine Hardening (1 session)

Fix high-severity generation issues:

- [ ] **2.4** Validate genre node severity field completeness
- [ ] **2.5** Fix trace engine soft constraint check type
- [ ] **2.8** Fail or flag unresolved required slots in detail synthesis
- [ ] **2.13** Include response excerpt in JSON parse errors
- [ ] **2.10** Remove fragile regex fallback in scene obligation detection

### Phase 6 — Accessibility, Polish & Cleanup (1 session)

- [ ] **1.17** Add ARIA attributes and keyboard support to drag separator
- [ ] **1.13** Guard graph info in DetailPanel with `graph &&` check
- [ ] **1.14** Replace index-based keys with stable IDs where possible
- [ ] **1.6** Explicitly unbind Cytoscape events in cleanup
- [ ] **3.2** Add local dev setup instructions to README
- [ ] **3.3** Remove orphaned components (VariantToggle, SimulationPanel, ExampleOverlay)
- [ ] **3.6** Add root `.gitignore`

### Phase 7 — Security & Robustness (future)

- [ ] **2.9** Sanitize user data before interpolation into LLM prompts
- [ ] **2.12** Improve anti-pattern detection (word boundaries or LLM-based)
- [ ] **2.11** Fix chapter partition for short stories
- [ ] **2.14** Validate genre node level field upstream

---

## 6. Summary Table

| # | Issue | Severity | Category | Phase |
|---|-------|----------|----------|-------|
| 1.0 | Hooks after early return (CharacterArcPanel) | Critical | UI | 1 |
| 1.1 | No `onPointerCancel` on separator | Critical | UI | 1 |
| 1.2 | Wrong element for pointer capture | Critical | UI | 1 |
| 2.1 | `updatedBackbone` scope bug | Critical | Gen | 2 |
| 2.2 | Repair loop mutates validation ref | Critical | Gen | 2 |
| 2.3 | Selection engine array self-reference | Critical | Gen | 2 |
| 1.3 | No resize during drag | High | UI | 1 |
| 1.4 | No resize on panel collapse/expand | High | UI | 1 |
| 1.5 | Stale closure in pointer down | High | UI | 1 |
| 1.6 | Cy event handlers never unbound | High | UI | 6 |
| 2.4 | Genre severity filtering fragile | High | Gen | 5 |
| 2.5 | Trace engine wrong check type | High | Gen | 5 |
| 2.6 | Chapter assembler `!` assertion | High | Gen | 2 |
| 2.7 | Silent scene skipping | High | Gen | 2 |
| 2.8 | Unresolved todos not propagated | High | Gen | 5 |
| 2.9 | Prompt injection risk | High | Gen | 7 |
| 1.7 | Fuzzy `nameToDir` matching | Medium | UI | 4 |
| 1.8 | Double graph load on init | Medium | UI | 4 |
| 1.9 | Blend/hybrid sync before manifest | Medium | UI | 4 |
| 1.10 | Dead `exampleMappedNodes` state | Medium | UI | 3 |
| 1.11 | Unused `onClose` prop | Medium | UI | 3 |
| 1.12 | PairingPanel fuzzy matching | Medium | UI | 4 |
| 1.13 | DetailPanel "Unknown" fallback | Medium | UI | 6 |
| 1.14 | Index-based keys | Medium | UI | 6 |
| 1.15 | Inline `import()` type | Medium | UI | 3 |
| 2.10 | Fragile scene obligation regex | Medium | Gen | 5 |
| 2.11 | Short story chapter partition | Medium | Gen | 7 |
| 2.12 | Naive anti-pattern keyword match | Medium | Gen | 7 |
| 2.13 | Missing JSON error context | Medium | Gen | 5 |
| 2.14 | Missing level field validation | Medium | Gen | 7 |
| 3.1 | `BrowserRouter` missing `basename` | Critical | Build | 1 |
| 3.2 | No local dev setup docs | Medium | Build | 6 |
| 3.3 | Orphaned components (3 files) | Medium | Build | 6 |
| 3.4 | Large bundle (1.2MB) | Medium | Build | — |
| 1.16 | Dead variant/failure state | Low | UI | 3 |
| 1.17 | Separator missing ARIA | Low | UI | 6 |
| 1.18 | `genSceneDrafts.size` reactivity | Low | UI | — |
| 2.15 | Silent blend/hybrid fallback | Low | Gen | — |
| 2.16 | Unused `_selection` parameter | Low | Gen | 3 |
| 2.17 | Tone marker bounds check | Low | Gen | — |
| 3.5 | `data/features/` dir missing | Low | Build | — |
| 3.6 | No root `.gitignore` | Low | Build | 6 |

**Totals:** 7 critical, 10 high, 18 medium, 8 low = **43 issues across 7 phases.**
