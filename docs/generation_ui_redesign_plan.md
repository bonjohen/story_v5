# Generation UI Redesign Plan

Restructure the generation panel from a single monolithic form into 5 focused tabs (originally planned as 4; Analysis tab added post-plan). Remove the 6-option mode dropdown — replace with two paths: template-only (no LLM) and full generation (LLM).

**Status: Complete.** All 8 phases done, plus post-plan Analysis tab.

## Current State

- One `GenerationPanel.tsx` (882 lines) containing everything: selection, LLM connection, mode picker, generate button, fill details, import/export, event log, telemetry
- 7 sub-tabs in `App.tsx`: Run, Contract, Templates, Plan, Map, Checks, Story
- 6 generation modes: contract-only, backbone, detailed-outline, outline, draft, chapters
- Mobile: full-width overlay but still shows the monolithic form

## Target State

4 tabs replacing all existing sub-tabs:

### Tab 1: Pipeline
- LLM connection status and connect/disconnect button
- Backend selection (none / bridge)
- Bridge URL
- Max LLM calls
- Import / Export snapshot
- Telemetry (collapsed)

### Tab 2: Story Setup
- Archetype dropdown (syncs graph display)
- Genre dropdown (syncs graph display)
- Premise textarea (auto-populated from lookup)
- Tone field (auto-populated from lookup)
- Contract summary (when available) — replaces standalone Contract tab

### Tab 3: Elements
- Backbone slot templates (characters, places, objects from node analysis)
- Author override fields for each slot
- "Fill All Details" button (single LLM call)
- Entity registry display (characters with traits/motivations, places with atmosphere, objects with significance)
- Replaces standalone Templates tab

### Tab 4: Generate
- Two-button choice: "Build Structure" (no LLM — runs contract+backbone+templates) and "Generate Story" (LLM — runs full pipeline through prose)
- Progress indicator and status badge
- Event log (live)
- Story prose output as scenes complete (replaces standalone Story tab)
- Clear / Save as Instance buttons
- Error display

---

## Phase 1: Extract Shared Constants and Styles
- [X] Move `ARCHETYPE_OPTIONS`, `GENRE_OPTIONS`, `STATE_LABELS`, `LABEL`, `INPUT`, `DEFAULT_CONFIG`, `nameToDir` to a shared `generationConstants.ts` file
- [X] Update imports in `GenerationPanel.tsx` (verify nothing breaks)
- [X] Typecheck and verify

## Phase 2: Create PipelineTab Component
- [X] Create `app/src/generation/panels/PipelineTab.tsx`
- [X] Move from GenerationPanel: LLM connection UI, backend select, bridge URL, max LLM calls, import/export, telemetry disclosure
- [X] Move auto-connect logic here (runs on mount)
- [X] Typecheck and verify

## Phase 3: Create StorySetupTab Component
- [X] Create `app/src/generation/panels/StorySetupTab.tsx`
- [X] Move from GenerationPanel: archetype/genre dropdowns, premise textarea, tone input, premise lookup loading + application, graph sync logic
- [X] Include inline contract summary when contract is available (archetype name, genre name, hard/soft constraint counts, beat count)
- [X] Typecheck and verify

## Phase 4: Create ElementsTab Component
- [X] Create `app/src/generation/panels/ElementsTab.tsx`
- [X] Move from GenerationPanel: Fill All Details button + handler
- [X] Display backbone slots grouped by category (character/place/object/concept) with current template values
- [X] Show entity registry when detailBindings exist (character cards with name, role, traits, motivations, flaw; place cards; object cards)
- [X] Typecheck and verify

## Phase 5: Create GenerateTab Component
- [X] Create `app/src/generation/panels/GenerateTab.tsx`
- [X] Two buttons: "Build Structure" (mode=backbone, llm=null) and "Generate Story" (mode=draft, llm=bridge)
- [X] Move from GenerationPanel: handleStart, progress status badge, event log, error display
- [X] Embed story prose output inline (merge StoryPanel content here)
- [X] Save as Instance button, Clear button
- [X] Typecheck and verify

## Phase 6: Rewire App.tsx Tab Bar
- [X] Replace 7 conditional sub-tabs with 4 fixed tabs: Pipeline, Setup, Elements, Generate
- [X] Remove unused TracePanel import (kept ContractPanel, PlanPanel, CompliancePanel, StoryPanel, TemplatesPanel for right-side inspector)
- [X] Update `genTab` state type to `'pipeline' | 'setup' | 'elements' | 'generate'`
- [X] Default tab: 'setup' (most common starting point)
- [X] Typecheck and verify

## Phase 7: Slim Down GenerationPanel.tsx
- [X] GenerationPanel.tsx is now dead code (no imports reference it)
- [X] Kept file intact for reference — can be deleted later
- [X] All functionality lives in the 4 new tab components

## Phase 8: Polish and Mobile
- [X] All 4 tabs work in mobile full-width overlay (inherited from existing layout)
- [X] Tab bar: 44px min-height touch targets with flex centering
- [X] Generate tab auto-scrolls event log as events arrive
- [X] Tab switching preserves form state (all state in requestStore/generationStore)
- [X] Premise lookup fires on mount via StorySetupTab
- [X] Archetype/genre change clears stale results via StorySetupTab
- [X] Final typecheck clean

## Post-Plan: Analysis Tab
- [X] Create `app/src/generation/panels/AnalysisTab.tsx`
- [X] Move graph canvases (archetype/genre/compare toggle), node/edge detail panel, statistics, cross-index, timeline, character arcs from App.tsx right-side inspector
- [X] Move generation artifact panels (templates, contract, backbone, plan, story, compliance, chapters) into Analysis tab disclosures
- [X] Analysis tab renders full-width (not constrained to 340px sidebar)
- [X] Add as 5th tab between Elements and Generate in App.tsx tab bar
- [X] Clean up App.tsx: remove unused graph imports, store selectors, computed values
- [X] Typecheck and verify
