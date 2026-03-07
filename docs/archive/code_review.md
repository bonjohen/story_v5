# Code Review — Full Codebase Quality & Consistency Audit

Performed 2026-03-04. Covers all data files (`data/`), application source (`app/`), scripts (`app/scripts/`), documentation (`docs/`), and configuration.

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [Data Integrity](#2-data-integrity)
3. [Application Code Quality](#3-application-code-quality)
4. [Dead Code & Unused Dependencies](#4-dead-code--unused-dependencies)
5. [Error Handling](#5-error-handling)
6. [Accessibility](#6-accessibility)
7. [Styling & UI Consistency](#7-styling--ui-consistency)
8. [State Management](#8-state-management)
9. [Script Quality](#9-script-quality)
10. [Documentation & CLAUDE.md](#10-documentation--claudemd)
11. [Vocabulary & ID Convention Issues](#11-vocabulary--id-convention-issues)
12. [Configuration & Tooling](#12-configuration--tooling)
13. [Test Coverage](#13-test-coverage)
14. [Summary Table](#14-summary-table)

---

## 1. Critical Issues

These problems cause runtime errors, data corruption risk, or significant correctness concerns.

### [X] 1.1 SVG export crashes at runtime
- **File:** `app/src/panels/ExportPanel.tsx` ~line 54
- `cyInstance.svg(...)` is called, but the `cytoscape-svg` extension is never imported or registered anywhere in the codebase. This call throws `TypeError: cyInstance.svg is not a function` at runtime when the user clicks the SVG export button.

### [X] 1.2 No React Error Boundary
- No Error Boundary component exists anywhere in the app. If any component throws during render (e.g., malformed graph data, missing fields), the entire application crashes to a white screen with no recovery path.

### [X] 1.3 Unsafe double-cast in graph parser
- **File:** `app/src/graph-engine/normalizer.ts` lines 22–32
- `parseGraphJson` validates only that 5 top-level keys exist (`id`, `name`, `type`, `nodes`, `edges`) but never checks that `nodes` and `edges` are arrays or that their elements have the required shape. It then does `return data as unknown as StoryGraph`, which completely bypasses TypeScript's type system. Any malformed graph JSON will pass through silently and cause downstream runtime errors.

### [X] 1.4 Prefix collision across archetype and genre ID namespaces
- **SA** is used by both The Sacrifice (archetype) and Satire (genre).
- **MU** is used by both The Mystery Unveiled (archetype) and Musical (genre).
- The archetype convention doc states "All IDs must be unique within the entire archetype corpus (guaranteed by the prefix system)." Within each corpus (archetype-only, genre-only) uniqueness holds, but any tool or index that combines both corpora cannot distinguish source by prefix alone.
- **Files:** `data/vocabulary/archetype_id_convention.md`, `data/vocabulary/genre_id_convention.md`

---

## 2. Data Integrity

### [X] 2.1 Genre ID SHORT_NAME exceeds documented 20-character limit — 343 violations
- **Convention file:** `data/vocabulary/genre_id_convention.md` specifies a maximum of 20 characters for the SHORT_NAME component.
- All 27 genre graphs have violations (2–22 per genre). Lengths range from 21 to 43 characters.
- Worst offenders:
  - `HI_E54_DESIRE_CONSTRAINT_TO_HISTORICAL_CONSEQUENCE` (43 chars)
  - `YA_E54_FIRST_THRESHOLD_TO_AUTHORITY_CONFRONTATION` (42 chars)
  - `HI_E53_PERIOD_ESTABLISHMENT_TO_DESIRE_CONSTRAINT` (41 chars)
- Archetype IDs have zero violations.

### [X] 2.2 `variant_file` field missing from 13 of 15 archetype graph.json files
- The `split-variants.ts` script added `variant_file` to all 15 archetypes. However, only `01_heros_journey` and `11_the_escape` received the field. The remaining 13 archetypes do not have the `variant_file` field at all, even as `null`.
- This means the JSON structural consistency claim in §1 of the data audit ("identical top-level keys") is incorrect: the 2 split archetypes have `variant_file` while the other 13 do not.
- **Affected files:** All archetype `graph.json` except `01_heros_journey` and `11_the_escape`.

### [X] 2.3 Genre `id` format inconsistency across files
- Genre `graph.json` files use bare folder names as IDs (e.g., `"01_drama"`).
- `data/example_works_registry.json` uses the `genre_` prefix (e.g., `"genre_01_drama"`).
- `data/manifest.json` uses bare folder names (matching graph.json).
- There is no single consistent genre ID format. The registry cannot do a direct lookup against graph.json IDs without stripping the prefix.

### [X] 2.4 Beat sheet files have inconsistent top-level key sets
- `beat_sheet_star_wars_iv.json`: has `runtime_minutes`, lacks `_notes` and `structure`.
- `beat_sheet_macbeth.json`: has `structure` and `_notes`, lacks `runtime_minutes`.
- `beat_sheet_shawshank_redemption.json`: has `runtime_minutes` and `_notes`, lacks `structure`.
- All three should use the same schema with optional fields explicitly set to `null` when not applicable.

### [X] 2.5 `non_western_archetype_analysis.json` cognate format inconsistency
- The `western_cognates.closest` field uses exact archetype names for 6 of 10 entries but free-form text for 4:
  - `nw_05`: `"No direct equivalent"`
  - `nw_06`: `"No direct equivalent"`
  - `nw_09`: `"Tragedy (with elements of Hero's Journey)"`
  - `nw_10`: `"Rebirth (partial cognate)"`
- A consistent structure (e.g., `closest_id` + `match_type` enum) would be more machine-readable.

### [X] 2.6 "Reckoning" node role defined in vocabulary but unused
- `data/vocabulary/archetype_node_roles.json` defines 14 roles, but only 13 appear in any archetype graph. The "Reckoning" role is defined but never used. This is either vocabulary over-specification or a missing implementation.

### [X] 2.7 JSON line ending inconsistency
- 46 JSON files use LF (Unix-style): all 42 graph.json, both variants.json, example_works_registry.json, manifest.json.
- 17 JSON files use CRLF (Windows-style): vocabularies, cross-indices, matrix, newer analysis files, beat sheets.
- No mixed endings within any individual file.

### [X] 2.8 `manifest.json` missing trailing newline
- `data/manifest.json` is the only JSON file that does not end with a newline character.

### 2.9 `_metadata` counts are accurate — PASS
- Verified across all 42 graphs: `nodeCount`, `edgeCount`, `nodesPerRole`, `edgesPerMeaning`, and `severityCounts` are all correct. No problems.

### 2.10 Edge from/to validity — PASS
- Every edge in all 42 graph.json files and both variants.json files references valid node_ids within the same graph scope. No broken edges.

### 2.11 Severity field completeness — PASS
- All 465 genre nodes and 544 genre edges have a valid `severity` field (`"hard"` or `"soft"`).

### 2.12 Controlled vocabulary compliance — PASS
- All archetype and genre nodes/edges use valid vocabulary roles and meanings.

---

## 3. Application Code Quality

### [X] 3.1 Widened role types nullify union narrowing
- **File:** `app/src/types/graph.ts` lines 67, 84
- `ArchetypeNode` declares `role: ArchetypeNodeRole | string` and `GenreNode` declares `role: GenreNodeRole | string`. The `| string` union makes the specific role types meaningless — any string passes, so the union provides zero compile-time safety.

### [X] 3.2 Non-null assertion operator usage (7 instances)
- `queue.shift()!` in BFS traversals:
  - `app/src/App.tsx` lines 141, 159
  - `app/src/panels/ConstraintChecklist.tsx` lines 47, 60
  - `app/src/components/VariantToggle.tsx` line 189
  - `app/src/panels/GraphStats.tsx` line 210
  - `app/src/layout/archetypeLayout.ts` line 88
- While technically safe (only called when `queue.length > 0`), this pattern should use a guard instead.

### [X] 3.3 Inline `import()` type in interface
- **File:** `app/src/panels/DetailPanel.tsx` line 62
- `graph?: import('../graph-engine/index.ts').NormalizedGraph | null` — dynamic import type syntax in an interface, inconsistent with the rest of the codebase which imports types at the top of the file.

### [X] 3.4 Duplicate type import from same module
- **File:** `app/src/App.tsx` lines 18–19
- Two separate `import type` statements from `'./types/graph.ts'` that should be combined into one.

### [X] 3.5 Path alias `@/` configured but never used
- `tsconfig.app.json` and `vite.config.ts` both configure `@/*` → `src/*`, but zero source files use it. All imports use relative paths. The alias configuration is dead.

### [X] 3.6 No `React.memo` usage anywhere
- Zero components use `React.memo`. Given that `GraphCanvas` re-renders on many state changes and triggers expensive Cytoscape operations, and helper components like `MetricCard`, `ToggleButton`, `TraceButton`, `CollapsibleSection` are pure presentational, this is a performance concern.

### [X] 3.7 Excessive state in App component
- **File:** `app/src/App.tsx` lines 60–74
- `App` manages 7+ pieces of local `useState` state on top of subscribing to 3 stores with ~15 selectors. The file is 647 lines. Inner components (`PanelTab`) are defined inline rather than extracted.

### [X] 3.8 Inconsistent component declaration style
- `App` uses `function App()` with `export default App` at the bottom (only default export in the codebase).
- Every other component uses `export function ComponentName()` at the declaration point.

---

## 4. Dead Code & Unused Dependencies

### [X] 4.1 Unused npm packages: `d3` and `graphology`
- **File:** `app/package.json` lines 19–20
- Listed as production dependencies but never imported in any source file. Adds ~250KB+ to bundle.

### [X] 4.2 Entire dead file: `GraphSelector.tsx`
- **File:** `app/src/components/GraphSelector.tsx`
- Exported but never imported. Presumably replaced by `GraphSelectorPanel.tsx`.

### [X] 4.3 Entire dead file: `utils/coerce.ts`
- **File:** `app/src/utils/coerce.ts`
- Exports `toArray()`, never imported anywhere. Meanwhile, three files independently define identical inline `toArr` helpers:
  - `app/src/panels/DetailPanel.tsx` line 11
  - `app/src/panels/SimulationPanel.tsx` line 12
  - `app/src/panels/ConstraintChecklist.tsx` line 13

### [X] 4.4 Dead CSS file: `App.css`
- **File:** `app/src/App.css`
- Contains only a comment: "Styles moved to index.css and inline — this file intentionally empty." Never imported.

### [X] 4.5 Exported functions never called
| Function | File | Line |
|----------|------|------|
| `computeVariantHighlight` | `app/src/components/VariantToggle.tsx` | 211 |
| `getEdgeIdsForWork` | `app/src/graph-engine/exampleParser.ts` | 175 |
| `loadGraph` | `app/src/graph-engine/normalizer.ts` | 79 |
| `buildDataIndex` | `app/src/graph-engine/dataIndex.ts` | 96 |

### [X] 4.6 Dead store members in `graphStore`
- `showVariants`, `toggleVariants`: defined, never read or called.
- `openPanels`, `togglePanel`: defined as `Set<PanelId>` but never used. `App.tsx` manages its own panel state with `useState` instead.
- `setViewMode`: defined, never called.
- `setSidebarOpen`: defined, never called.
- `ViewMode` type: exported, never imported.
- `PanelId` type: exported with values (`'examples'`, `'narrative'`, `'comparison'`) that don't match actual panel names used in the app (`'detail'`, `'stats'`, `'crossindex'`).

### [X] 4.7 Unused exported types from `types/graph.ts`
- `ArchetypeNodeRole`, `GenreNodeRole`, `StoryNode`, `StoryEdge`, `ArchetypeEdge`, `GenreEdge`: exported but never imported.
- `ArchetypeNode`: only used internally by `ArchetypeGraph` type, never directly imported.

### [X] 4.8 Dead helper function: `countVariants`
- **File:** `app/src/components/GraphSelectorPanel.tsx` lines 195–200
- Always returns 0 with a `void meta` to suppress unused-parameter warnings. Called at line 138 but is a no-op.

---

## 5. Error Handling

### [X] 5.1 `res.json()` called without checking content type
- `app/src/store/graphStore.ts` line 134
- `app/src/App.tsx` line 93
- `app/src/panels/CrossIndex.tsx` lines 68–70
- If the server returns non-JSON (e.g., HTML 404 page), this throws an opaque `SyntaxError`.

### [X] 5.2 Swallowed errors with empty catch
- `app/src/panels/ConstraintChecklist.tsx` line 112: `navigator.clipboard.writeText(text).catch(() => {})` — clipboard write silently fails with no user feedback.
- `app/src/render/GraphCanvas.tsx` line 124: `catch { // png() can fail during transitions }` — silently swallowed.

### [X] 5.3 Manifest load failure shows no error to user
- **File:** `app/src/App.tsx` line 95
- `.catch((err) => console.warn(...))` — if the manifest fails to load, the sidebar shows "Loading..." forever with no visible error state.

### [X] 5.4 `parseGraphJson` validation is shallow
- **File:** `app/src/graph-engine/normalizer.ts` lines 24–29
- Only checks for presence of 5 top-level keys. Does not verify `nodes` is an array, `type` is a valid value, or any element shape. (See also §1.3.)

---

## 6. Accessibility

### [X] 6.1 Search dropdown missing ARIA roles
- **File:** `app/src/components/GraphSearch.tsx` lines 151–209
- The search results dropdown has no `role="listbox"`, no `role="option"` on items. Arrow key navigation works (lines 83–88) but screen readers cannot announce the active option. Missing `aria-activedescendant`.

### [X] 6.2 Search input missing combobox attributes
- **File:** `app/src/components/GraphSearch.tsx` line 125
- Missing `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`.

### [X] 6.3 Settings panel has no focus trap
- **File:** `app/src/components/SettingsPanel.tsx`
- Renders as a fixed overlay but Tab key moves focus behind the panel. No Escape key handler. `RadioOption` buttons use custom `<button>` elements instead of `<input type="radio">` with `role="radiogroup"`, losing native radio semantics and arrow-key behavior.

### [X] 6.4 Export panel has no focus trap
- **File:** `app/src/panels/ExportPanel.tsx`
- Same focus trap issue as Settings panel.

### [X] 6.5 Missing `aria-label` and `aria-pressed` on toggle buttons
- `app/src/App.tsx` lines 317–355: "Stats", "X-Index", and "Simulate" toggle buttons lack `aria-label` or `aria-pressed` for toggle state.
- `app/src/panels/SimulationPanel.tsx` line 152: "Reset" button has no `aria-label`.

### [X] 6.6 Color-only information for node roles
- Role badges in `DetailPanel.tsx` and node categories in `styles.ts` use color alone to distinguish roles and meanings. No shape, icon, or text indicator for users with color vision deficiency.

### [X] 6.7 Minimap has no keyboard equivalent
- **File:** `app/src/render/GraphCanvas.tsx` lines 392–434
- The minimap is clickable for panning but has no `role`, `tabIndex`, `aria-label`, or keyboard handler.

### [X] 6.8 Edge hover tooltip inaccessible
- **File:** `app/src/App.tsx` lines 590–593
- Positioned via mouse coordinates with `pointerEvents: 'none'`. Invisible to screen readers and unreachable by keyboard.

---

## 7. Styling & UI Consistency

### [X] 7.1 All styling is inline — no CSS modules or classes
- Every component uses inline `style={{}}` objects. This is consistent across the codebase but has downsides:
  - No hover/focus pseudo-class support (all hover effects use `onMouseEnter`/`onMouseLeave` JS handlers).
  - No media queries per-component.
  - Style objects recreated on every render.
  - Styles cannot be inspected or overridden via CSS.
- **Resolution:** Acknowledged as architectural choice. Migrating to CSS modules would touch every component (~2000 lines of inline styles across 13 components). The inline approach is consistent and functional. Key layout constants have been extracted (§7.3). Future refactoring can adopt CSS-in-JS or modules incrementally.

### [X] 7.2 Hardcoded colors alongside CSS variables
- `app/src/render/styles.ts` uses hardcoded hex colors (lines 5–44) that duplicate the CSS custom properties in `index.css`. If themes change CSS variables, the Cytoscape canvas will not reflect changes because it reads from the `COLORS` object.
- `app/src/panels/DetailPanel.tsx` lines 14–53 also hardcodes hex colors for role/meaning badges.

### [X] 7.3 Magic numbers throughout
- Sidebar width `260` in `App.tsx` lines 444–445.
- Right panel width `320` at line 538.
- Toolbar height `42` in multiple files.
- Font sizes `9`, `10`, `11`, `12`, `13` px appear hundreds of times with no consistent scale or constants.

---

## 8. State Management

### [X] 8.1 `useSimulationStore` destructures entire store
- **File:** `app/src/panels/SimulationPanel.tsx` lines 19–28
- Destructuring the full store return causes re-renders on ANY store state change, defeating Zustand's selective subscription. Other files correctly use individual selectors: `useGraphStore((s) => s.currentGraph)`.

### [X] 8.2 `Set` in Zustand state is not serializable
- **File:** `app/src/store/graphStore.ts` line 37
- `openPanels: Set<PanelId>` — Zustand's devtools and persistence middleware do not serialize `Set`. Since this state is also unused (§4.6), this compounds the dead code issue.

### [X] 8.3 No persistence for user settings
- `settingsStore.ts` resets to defaults on every page load. User preferences (color scheme, layout, etc.) are lost. Zustand's `persist` middleware could preserve these.

---

## 9. Script Quality

### [X] 9.1 `as any` casts in `renumber-edges.ts`
- **File:** `app/scripts/renumber-edges.ts` lines 199–202
- Uses `(edge as any).meaning` and `(graph as any)._metadata` because the local `GraphEdge` interface omits `meaning`. The interface should include it.

### [X] 9.2 Scripts redefine types instead of importing them
- `inject-metadata.ts`, `renumber-edges.ts`, `inject-severity.ts`, `split-variants.ts` each define their own `GraphNode`, `GraphEdge`, `GraphJson` interfaces rather than importing from `app/src/types/graph.ts`. The definitions are subtly different (e.g., `[key: string]: unknown` index signatures).

### [X] 9.3 No error handling for JSON parse failures
- `renumber-edges.ts` line 114, `inject-metadata.ts` line 54, `split-variants.ts` line 68: all use `JSON.parse(readFileSync(...))` with no try/catch.

### [X] 9.4 Duplicate entries in `KNOWN_WORKS`
- **File:** `app/scripts/build-works-registry.ts` lines 124 and 138
- `'gone girl'` appears twice with different metadata (2012 novel vs. 2014 film). The second entry silently overwrites the first.

### [X] 9.5 Scripts use emoji in console output on Windows
- `inject-metadata.ts`, `inject-severity.ts`, `split-variants.ts` use checkmark emoji that may render as `?` on some Windows terminal configurations.

### [X] 9.6 No shared script utilities
- All 6 scripts independently define `__filename`, `__dirname`, `DATA_ROOT` with the same ESM workaround boilerplate.

### [X] 9.7 Scripts not covered by any tsconfig
- **File:** `app/tsconfig.node.json` line 25: includes only `vite.config.ts`.
- The `scripts/` directory is outside both `tsconfig.app.json` (covers `src/`) and `tsconfig.node.json`. Scripts get no type-checking during `tsc -b` builds.

---

## 10. Documentation & CLAUDE.md

### [X] 10.1 CLAUDE.md Repository Structure section is incomplete
- **File:** `CLAUDE.md`
- `cross_archetype_index.json` and `cross_genre_constraint_index.json` are listed as being inside `data/archetypes/` and `data/genres/` respectively. Both are actually at `data/` root level.
- 12+ new data files are not mentioned at all:
  - `data/archetype_emotional_arcs.json`
  - `data/hybrid_archetype_patterns.json`
  - `data/tone_archetype_integration.json`
  - `data/genre_blending_model.json`
  - `data/non_western_archetype_analysis.json`
  - `data/cross_medium_adaptation.json`
  - `data/corpus_validation.json`
  - `data/example_works_registry.json`
  - `data/manifest.json`
  - Beat sheet files in archetype folders
  - `variants.json` files in archetype folders

### [X] 10.2 CLAUDE.md Known Issues section lists resolved issues
- Both items listed (#13 and #10) are marked as resolved in `docs/v-next.md` archived items, but CLAUDE.md still presents them as open.

### [X] 10.3 CLAUDE.md deferred items count is stale
- States "42 items" in v-next.md but all items are now marked `[X]` (complete). Zero open items remain.

### [X] 10.4 CLAUDE.md Graph JSON Format section missing new fields
- Does not document the `severity` field on genre nodes/edges.
- Does not document the `level` field on genre nodes.
- Does not document the `_metadata` block.
- Does not document `variant_file` on archetype graphs.

### [X] 10.5 `goal_1.md` file paths are stale
- **File:** `docs/goal_1.md`
- References flat file names like `data/archetypes/01_heros_journey_graph.json` instead of the actual subdirectory structure `data/archetypes/01_heros_journey/graph.json`. Applies to all 15 archetypes across Phases 2–8.
- Phase 9 references `data/archetypes/cross_archetype_index.json` but the file is at `data/cross_archetype_index.json`.

### [X] 10.6 `goal_2.md` cross-index path is wrong
- **File:** `docs/goal_2.md` line 171
- References `data/genres/cross_genre_constraint_index.json` but the file is at `data/cross_genre_constraint_index.json`.

### [X] 10.7 Hero's Journey narrative node count mismatch after variant split
- **File:** `data/archetypes/01_heros_journey/narrative.md` line 7
- Claims "12 nodes and 12 edges" but `graph.json` now has 11/10 (variants were split to `variants.json`). The count is correct if you combine both files, but mismatches the `_metadata` in graph.json.

---

## 11. Vocabulary & ID Convention Issues

### [X] 11.1 All 8 example IDs in `genre_id_convention.md` are wrong
- **File:** `data/vocabulary/genre_id_convention.md`
- Node examples: `HR_N10_THREAT_PRESENT` (actual: `HR_N10_THREAT_ESCALATES`), `HR_N20_SLASHER` (actual: `HR_N20_SUPERNATURAL`), `HR_N60_FIRST_SCARE` (actual: `HR_N60_FIRST_ANOMALY`), `HR_N90_CONSEQUENCE_FREE` (actual: `HR_N90_CONSEQUENCE_FREE_SCARES`).
- Edge examples: `HR_E01_FEAR_REQUIRES_THREAT` (actual: `HR_E01_PROMISE_TO_THREAT`), `HR_E10_THREAT_BRANCHES_SLASHER` (actual: `HR_E10_THREAT_TO_SUPERNATURAL`), `HR_E30_SLASHER_ISOLATION` (actual: `HR_E30_SUPERNATURAL_TO_ISOLATION`), `HR_E50_ISOLATION_FIRST_SCARE` (actual: `HR_E50_ISOLATION_TO_ANOMALY`).
- These appear to be early draft names that were never updated after the actual graphs were built.

### [X] 11.2 `archetype_id_convention.md` example IDs are wrong
- Line 38: `HJ_N03_THRESHOLD` — actual is `HJ_N03_MENTOR`. The Threshold node is `HJ_N04_THRESHOLD`.
- Line 60: `TR_E07_FINAL_RECKONING` — actual is `TR_E07_WORLD_ENDURES`. No edge named `FINAL_RECKONING` exists.

### [X] 11.3 SA/MU prefix collisions
- See §1.4 above.

---

## 12. Configuration & Tooling

### [X] 12.1 `eslint-config-prettier` installed but not configured
- **File:** `app/package.json` lists it; `app/eslint.config.js` does not include it. ESLint and Prettier may conflict.

### [X] 12.2 ESLint does not use type-aware rules
- **File:** `app/eslint.config.js` line 14
- Uses `tseslint.configs.recommended` instead of `tseslint.configs.recommendedTypeChecked` or `strict`. The project has `strict: true` in tsconfig but does not leverage ESLint's type-aware linting.

### [X] 12.3 No Prettier config file
- A `"format": "prettier --write src/"` script exists but no `.prettierrc` or equivalent file. Prettier uses defaults which may not match the codebase's style choices.

### [X] 12.4 `tsconfig.node.json` does not include scripts
- See §9.7 above.

### [X] 12.5 Unused path alias
- See §3.5 above.

---

## 13. Test Coverage

### [X] 13.1 Only 3 test files exist
- `app/src/graph-engine/normalizer.test.ts` (10 tests)
- `app/src/graph-engine/validator.test.ts` (7 tests)
- `app/src/graph-engine/dataIndex.test.ts` (3 tests)

**No test coverage for:**
- Any React component (0 of 13)
- Any panel (0 of 6)
- Any Zustand store (0 of 3)
- Layout algorithms (0 of 3 files)
- `exampleParser.ts` (complex regex parsing logic, zero tests — highest-risk untested code)
- `elements.ts` builder
- `styles.ts` category mapping functions

### [X] 13.2 Testing infrastructure underutilized
- `@testing-library/react` and `@testing-library/jest-dom` are installed as dev dependencies.
- `jsdom` environment is configured in `vitest.config.ts`.
- `test-setup.ts` imports `@testing-library/jest-dom`.
- Yet zero component tests exist. Infrastructure was set up but testing was limited to the data processing layer.

---

## 14. Summary Table

| # | Issue | Severity | Category | Count |
|---|-------|----------|----------|-------|
| 1.1 | SVG export crashes at runtime | **Critical** | App | 1 |
| 1.2 | No React Error Boundary | **Critical** | App | 1 |
| 1.3 | Unsafe double-cast in graph parser | **Critical** | App | 1 |
| 1.4 | SA/MU prefix collision across namespaces | **Critical** | Data | 2 |
| 2.1 | Genre ID SHORT_NAME exceeds 20-char limit | High | Data | 343 |
| 2.2 | `variant_file` field missing from 13 archetypes | High | Data | 13 |
| 2.3 | Genre `id` format inconsistency | High | Data | 27 |
| 4.1 | Unused npm packages (`d3`, `graphology`) | High | Config | 2 |
| 11.1 | All 8 genre convention example IDs wrong | High | Docs | 8 |
| 13.1 | ~3% test coverage (20 tests, 0 component tests) | High | Testing | — |
| 3.1 | Widened role types nullify type safety | Medium | App | 2 |
| 3.6 | No `React.memo` on any component | Medium | App | — |
| 3.7 | Excessive state in App component (647 lines) | Medium | App | 1 |
| 4.2 | Dead file: `GraphSelector.tsx` | Medium | App | 1 |
| 4.3 | Dead file: `utils/coerce.ts` + 3× duplicated inline | Medium | App | 4 |
| 4.4 | Dead file: `App.css` | Medium | App | 1 |
| 4.5 | 4 exported functions never called | Medium | App | 4 |
| 4.6 | 6+ dead store members in graphStore | Medium | App | 6 |
| 4.7 | 6+ unused exported types | Medium | App | 6 |
| 5.1–5.4 | Missing/shallow error handling | Medium | App | 8 |
| 6.1–6.8 | Accessibility gaps (ARIA, focus traps, keyboard) | Medium | App | 8 |
| 7.2 | Hardcoded colors alongside CSS variables | Medium | App | 2 |
| 8.1 | Full store destructure defeats selective subscription | Medium | App | 1 |
| 9.1–9.2 | `as any` casts + redefined types in scripts | Medium | Scripts | 6 |
| 9.7 | Scripts not type-checked by any tsconfig | Medium | Config | 1 |
| 10.1–10.4 | CLAUDE.md stale/incomplete in 4 areas | Medium | Docs | 4 |
| 10.5–10.6 | Goal docs have stale file paths | Medium | Docs | 2 |
| 11.2 | Archetype convention example IDs wrong | Medium | Docs | 2 |
| 12.1–12.3 | ESLint/Prettier config gaps | Medium | Config | 3 |
| 2.4 | Beat sheet schema inconsistency | Low | Data | 3 |
| 2.5 | Non-western cognate format inconsistency | Low | Data | 4 |
| 2.6 | Unused "Reckoning" vocabulary role | Low | Data | 1 |
| 2.7 | JSON line ending inconsistency (LF vs CRLF) | Low | Data | 63 |
| 2.8 | manifest.json missing trailing newline | Low | Data | 1 |
| 3.2 | Non-null assertion operator usage | Low | App | 7 |
| 3.3 | Inline `import()` type in interface | Low | App | 1 |
| 3.4 | Duplicate type import from same module | Low | App | 1 |
| 3.5 | Unused path alias configuration | Low | Config | 1 |
| 3.8 | Inconsistent component declaration style | Low | App | 1 |
| 4.8 | Dead helper: `countVariants` always returns 0 | Low | App | 1 |
| 7.1 | All inline styles (consistent but limiting) | Low | App | — |
| 7.3 | Magic numbers (widths, heights, font sizes) | Low | App | — |
| 8.2 | `Set` in Zustand state not serializable | Low | App | 1 |
| 8.3 | No persistence for user settings | Low | App | 1 |
| 9.3–9.6 | Script robustness issues | Low | Scripts | 4 |
| 10.7 | Narrative node count mismatch after variant split | Low | Docs | 1 |

**Totals:** 4 critical, 10 high, 28 medium, 20 low.
