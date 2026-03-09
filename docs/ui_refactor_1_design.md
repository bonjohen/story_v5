# UI Data Element Inventory

Comprehensive tree of every data element saved, displayed, or referenced in the generation UI.
Used to identify duplicates, orphans, and consolidation opportunities.

---

## 1. User Input (requestStore — persisted to localStorage)

### 1.1 Story Setup
- **premise** — Free-text story idea. Editable: Setup. Read: Generate, passed to StoryRequest.
- **archetype** — One of 15 plot structures (e.g., Hero's Journey). Editable: Setup. Triggers graph load + premise lookup.
- **genre** — One of 27 genres (e.g., Fantasy, Drama). Editable: Setup. Triggers graph load + premise lookup.
- **tone** — Emotional register string (e.g., "somber, epic"). Editable: Setup. Passed to contract and writer prompts.
- **mode** — Pipeline stop point (contract-only, backbone, outline, draft, chapters). Editable: GenerationPanel only. Not exposed in current 3-tab UI.

### 1.2 LLM Connection
- **llmBackend** — Which adapter to use: none, openai, or bridge. Editable: Setup. Also on old PipelineTab.
- **openaiBaseUrl** — Endpoint URL for OpenAI-compatible server. Editable: Setup. Also on old PipelineTab.
- **openaiModel** — Model name sent to endpoint. Editable: Setup. Shown in connection badge.
- **openaiApiKey** — Optional API key for remote providers. Editable: Setup. Also on old PipelineTab.
- **bridgeUrl** — WebSocket URL for Claude Code bridge. Editable: Setup. Also on old PipelineTab.
- **bridgeStatus** — Connection state: disconnected, connecting, connected, error. Display: Setup badge. Not editable.
- **bridgeAdapter** — Runtime LLMAdapter instance. Not displayed. Used by Fill Details and Generate Story.
- **maxLlmCalls** — Hard cap per run (1–100, default 20). Editable: Setup. Passed to GenerationConfig.

### 1.3 Unused / Hidden
- **slotOverrides** — Template slot value overrides. Stored but no UI for editing yet.

---

## 2. Pipeline Artifacts (generationStore — runtime, not persisted)

### 2.1 Run Metadata
- **status** — Current OrchestratorState (IDLE through COMPLETED/FAILED). Display: Generate (badge).
- **runId** — Timestamp-based run identifier. Used in filenames and artifact metadata.
- **mode** — Copy of generation mode for this run. Set at startRun() time.
- **running** — Boolean, true while pipeline executing. Controls button disable state across all tabs.
- **error** — Error message string or null. Display: Generate (error panel).

### 2.2 Structural Artifacts
- **request** — Full StoryRequest object built from user inputs. Display: none directly. Included in snapshot export.
- **selection** — Archetype × genre pairing result with compatibility data. Display: none directly.
- **contract** — Story contract with phases, constraints, element requirements. Display: Setup (summary card), Analysis (full).
  - `contract.archetype` — Archetype spine, roles, variants, edges.
  - `contract.genre` — Genre levels, hard/soft constraints, anti-patterns, tone markers.
  - `contract.phase_guidelines[]` — Per-phase definition, entry/exit conditions, failure modes.
  - `contract.element_requirements[]` — Required characters/places/objects with roles.
  - `contract.global_boundaries` — Content limits, style limits, must/must-not rules.
- **templatePack** — Beat templates + genre constraint templates. Display: Analysis (Templates disclosure).
  - `templatePack.archetype_node_templates` — Per-beat scene obligations, required elements, signals.
  - `templatePack.genre_level_templates` — Per-constraint binding rules, anti-patterns.
  - `templatePack.tone_guidance` — Tone directives from selected marker.
- **backbone** — Story outline with beats, scenes, chapter partitioning, slots. Display: Elements (slots), Analysis.
  - `backbone.beats[]` — Beat ID, label, role, definition, scenes.
  - `backbone.beats[].scenes[]` — Scene ID, goal, slots, genre obligations, moment stubs.
  - `backbone.beats[].scenes[].slots{}` — Named template slots (category, required, description).
  - `backbone.chapter_partition[]` — Chapter groupings of beats with tone/pace goals.
  - `backbone.style_directives` — Global voice, pacing, feature pack IDs, lexicon.

### 2.3 Detail Bindings (user-editable, preserved across runs)
- **detailBindings** — Characters, places, objects + slot bindings. Editable: Elements. Exported: snapshot, instance, story.
  - `entity_registry.characters[]` — id, name, role, traits[], motivations[], flaw, backstory, arc_direction, relationships[].
  - `entity_registry.places[]` — id, name, type, features[], atmosphere.
  - `entity_registry.objects[]` — id, name, type, significance, properties[].
  - `slot_bindings{}` — Maps slot name → bound entity ID + rationale.
  - `open_mysteries[]` — Planted/resolved mystery tracking. Not exposed in UI.
  - `promises[]` — Narrative promises. Not exposed in UI.
  - `payoffs[]` — Promise payoffs. Not exposed in UI.
  - `unresolved_todos[]` — Slots that couldn't be filled. Not exposed in UI.

### 2.4 Plan
- **plan** — Beat summaries + scene specifications with element assignments. Display: Generate (scene list), Analysis.
  - `plan.beats[]` — Beat ID, summary, exit conditions, target emotional scores.
  - `plan.scenes[]` — Scene ID, beat ID, setting, characters[], goal, archetype trace, genre obligations, constraints checklist.
  - `plan.element_roster` — Characters/places/objects assigned to scenes. Built from detailBindings or contract.
  - `plan.coverage_targets` — Hard/soft constraint coverage thresholds.

### 2.5 Scene Prose
- **sceneDrafts** — Map of scene ID → prose text, streamed from LLM. Display: Generate (Story section). Export: .md file.

### 2.6 Validation & Trace
- **validation** — Per-scene and global validation results. Display: Analysis (Compliance).
  - `validation.scenes[]` — Scene ID, pass/fail status, individual checks.
  - `validation.global` — Coverage percentages, anti-pattern violations, tone warnings.
- **trace** — Archetype/genre mapping trace per scene. Display: Analysis.
- **complianceReport** — Generated text report of constraint compliance. Display: Analysis.
- **chapterManifest** — Chapter structure with scene assignments. Display: Analysis (Chapters).

### 2.7 Event Log & Telemetry
- **events[]** — Timestamped pipeline progress messages. Display: Generate (event log).
- **llmTelemetry[]** — Per-call stats: method, input/output chars, duration, status. Display: Generate (collapsible).
- **promptLog[]** — Full prompt text for each LLM call. Display: Generate (collapsible).

### 2.8 Unused
- **selectedSceneId** — For future scene highlighting on hover. Not wired to UI.

---

## 3. UI State (uiStore — persisted to localStorage)

### 3.1 Layout (persisted)
- **navOpen** — Navigation drawer visibility.
- **infoPanelOpen** — Info panel (top) visibility.
- **splitView** — Dual-graph view mode toggle.
- **collapsedSections{}** — Per-disclosure collapsed state, keyed by persistKey.

### 3.2 Locks (not persisted — always unlocked on load)
- **setupLocked** — When true, disables all Setup tab inputs.
- **elementsLocked** — When true, disables entity editing in Elements tab.

---

## 4. Where Each Tab Gets Its Data

| Data Element | Setup | Elements | Generate | Analysis |
|---|---|---|---|---|
| premise, archetype, genre, tone | Edit | Read | Read | — |
| LLM connection settings | Edit | — | — | — |
| contract | Summary | — | — | Full |
| backbone | — | Slots | — | Full |
| detailBindings | — | Edit (CRUD) | — | — |
| plan | — | — | Scene list | Full |
| sceneDrafts | — | — | Prose display | Story panel |
| events | — | — | Event log | — |
| llmTelemetry | — | — | Collapsible | — |
| promptLog | — | — | Collapsible | — |
| validation, trace, compliance | — | — | — | Full |
| templatePack | — | — | — | Templates |
| chapterManifest | — | — | — | Chapters |
| Save/Load Project | — | — | Buttons | — |
| Export Story (.md) | — | — | Button | — |
| Save as Instance | — | — | Button | — |

---

## 5. Duplicates & Overlap

| Item | Where it appears | Notes |
|---|---|---|
| LLM settings (backend, URL, model, key, maxCalls) | Setup tab | PipelineTab and GenerationPanel deleted. |
| Contract summary | Setup tab | Also available in Analysis. Setup shows a compact card. |
| sceneDrafts | Generate (prose) + Analysis (StoryPanel) | Same data, different presentation. |
| LLM Telemetry | Generate tab | PipelineTab and GenerationPanel deleted. |
| premise/archetype/genre/tone | requestStore (editable) + generationStore.request (snapshot) | Request is a frozen copy; requestStore is the live edit. Correct separation. |

---

## 6. Orphaned / Not Exposed in UI

| Data Element | Stored In | Notes |
|---|---|---|
| `slotOverrides` | requestStore | Stored, no UI to edit. |
| `selection` | generationStore | Not displayed anywhere. Available in project save. |
| `open_mysteries`, `promises`, `payoffs` | detailBindings | Filled by LLM but not shown in Elements UI. |
| `unresolved_todos` | detailBindings | Filled by synthesizer but not shown. |
| `trace` | generationStore | Available for export, no dedicated display. |

---

## 7. Refactor: Remove "Hide Generation Panel" Toggle

**Status: DONE**

The generation panel is now always visible — there is no scenario where the user needs to hide it.

### Changes Made
1. **uiStore.ts** — Removed `genPanelOpen` (boolean) and `toggleGenPanel` (action) from interface, implementation, and persistence partialize.
2. **App.tsx** — Removed the "Generate" toggle button from AppShellBar. Removed conditional `{genPanelOpen && ...}` wrapper so the panel always renders. Removed the empty-state placeholder div. Added inline status indicators (Generating.../Complete) to AppShellBar.
3. **Design doc** — Removed `genPanelOpen` from §3.1 Layout.

---

## 8. Save & Load Workflow

### 8.1 Current State
- **Snapshot Export** (Generate tab): Downloads a JSON file containing all generationStore artifacts (request, contract, backbone, detailBindings, plan, sceneDrafts, validation, trace, chapterManifest, events, llmTelemetry).
- **Snapshot Import** (Generate tab): Loads a previously exported JSON file and restores all artifacts into generationStore.
- **Export Story** (Generate tab): Downloads prose as a `.md` file.
- **Save as Instance** (Generate tab): Converts artifacts into a StoryInstance (entity editors, lore, system maps).
- **requestStore** (Setup tab): Persisted to localStorage automatically — premise, archetype, genre, tone, LLM settings survive page refresh.

### 8.2 Gaps
- No named project/session concept — only one active state at a time.
- Snapshot export is the only way to save, but it's not discoverable as "Save".
- No file picker for loading — must remember to use the Import button.
- requestStore and generationStore are independent — snapshot doesn't include requestStore settings.

### 8.3 Formalized Save/Load Design

**Save** — unified "Save Project" action on the Generate tab:
1. Combine requestStore state (premise, archetype, genre, tone, llmBackend, openaiBaseUrl, openaiModel, maxLlmCalls) + generationStore artifacts into a single `StoryProject` JSON envelope.
2. Include a `version` field for forward compatibility.
3. Include a `savedAt` ISO timestamp and optional `projectName`.
4. Trigger browser download as `{projectName}_{timestamp}.story.json`.

**Load** — unified "Load Project" action on the Generate tab:
1. Accept `.story.json` file via file picker.
2. Parse and validate the version field.
3. Restore requestStore fields (premise, archetype, genre, tone, LLM settings).
4. Restore generationStore artifacts (contract, backbone, detailBindings, plan, sceneDrafts, etc.).
5. Trigger graph reload for the restored archetype/genre selections.

### 8.4 Implementation Steps

- [X] Define `StoryProject` interface in `generation/artifacts/types.ts` with version, metadata, requestState, and generationState fields.
- [X] Add `exportProject()` and `downloadProject()` in `storySnapshot.ts` — merges requestStore + generationStore into StoryProject JSON.
- [X] Add `parseProject()` in `storySnapshot.ts` — handles both project and legacy snapshot formats.
- [X] Add `loadFromProject()` action to requestStore — restores all request fields from project.
- [X] Update GenerateTab: renamed buttons to "Save Project" / "Load Project", project name input, wired new functions.
- [X] Add backward compatibility: `parseProject()` wraps legacy `story_v5_snapshot` files with default request values.
- [X] Add round-trip tests in `storyProject.test.ts` and `loadFromProject` test.
