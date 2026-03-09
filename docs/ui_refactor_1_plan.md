# UI Refactor 1 — Release Plan

## Phase 1 — Delete dead files, update tests
- [X] Delete `GenerationPanel.tsx` (788 lines)
- [X] Delete `PipelineTab.tsx` (397 lines)
- [X] Remove `GenerationPanel` import and test block from `panels.test.tsx`
- [X] `tsc -b` clean, all tests pass

## Phase 2 — Define StoryProject type and serialization
- [X] Add `StoryProjectRequest` and `StoryProject` interfaces to `types.ts`
- [X] Add `exportProject()`, `downloadProject()`, `parseProject()` to `storySnapshot.ts`
- [X] Backward compatibility: `parseProject()` wraps legacy `story_v5_snapshot` files

## Phase 3 — Wire Save/Load into GenerateTab UI
- [X] Add `loadFromProject()` action to `requestStore.ts`
- [X] Replace snapshot export/import with project save/load in `GenerateTab.tsx`
- [X] Add project name text input (defaults to first 40 chars of premise)
- [X] Rename button labels: "Save Project" / "Load Project"

## Phase 4 — Tests and documentation
- [X] Round-trip test: `exportProject` -> `parseProject` -> verify fields
- [X] Legacy snapshot -> `parseProject` -> verify defaults
- [X] `loadFromProject` action test
- [X] Update `CLAUDE.md` with StoryProject save/load
- [X] Update `docs/ui_refactor_1_design.md` — mark implementation steps done, update orphan list
- [X] Create `docs/ui_refactor_1_plan.md` (this file)
