# Data Gaps Plan

## Overview

Audit of Class 1 (Descriptive Aspects / Slots / Templates) data completeness. Items below represent gaps, asymmetries, or unused definitions found across the corpus.

---

## Items

### 1. Sci-Fi Empty Relationship Constraints

- **File**: `data/genres/06_science_fiction/elements.json`
- **Issue**: `relationship_constraints` is an empty array `[]`. All other 26 genres have at least 1 entry.
- **Action**: [X] Added 3 relationship constraints: human_technology_tension (required), crew_hierarchy (optional), creator_creation (optional)

### 2. Unused Vocabulary Term: "Reckoning" Node Role

- **File**: `data/vocabulary/archetype_node_roles.json`
- **Issue**: Defined as one of 14 archetype node roles but assigned to zero nodes across all 15 archetype graphs.
- **Action**: [X] Assigned to RV_N07_FINAL_RECKONING in The Revenge (re-roled from Crisis — semantic fit: "moment of moral accounting")

### 3. Unused Vocabulary Term: "compels return" Edge Meaning

- **File**: `data/vocabulary/archetype_edge_vocabulary.json`
- **Issue**: Defined as one of 15 archetype edge meanings but used in zero edges across all 15 archetype graphs.
- **Action**: [X] Assigned to HJ_E08_ROAD_BACK in Hero's Journey (re-meaning from "raises cost" — semantic fit: "draws character back toward ordinary world")

### 4. No Genre examples_elements.json Files (0/27)

- **File**: `data/genres/*/examples_elements.json` (none exist)
- **Issue**: All 15 archetypes have `examples_elements.json` with a fully populated story instance mapped to a real work. Genres have zero. This means genre-specific example characters/places/objects are unavailable.
- **Action**: [ ] Create examples_elements.json for each genre, mapping a well-known work to genre constraints

### 5. Only 2 of 15 Archetypes Have variants.json

- **Files**: Only `data/archetypes/01_heros_journey/variants.json` and `data/archetypes/11_the_escape/variants.json` exist.
- **Issue**: 13 archetypes have `variant_file: null`. Variant nodes (ID range 50–79) provide alternative paths through a story structure.
- **Action**: [ ] Create variants.json for remaining 13 archetypes with at least 2 meaningful variant paths each, OR [ ] Remove `variant_file` field from the 13 null graphs and document variants as optional

### 6. Genre File Naming: element_constraints.json vs elements.json

- **Files**: `data/genres/*/element_constraints.json` (actual) vs `data/archetypes/*/elements.json` (archetype equivalent)
- **Issue**: Naming inconsistency between archetype and genre element files. The app handles this correctly but the asymmetry could cause confusion.
- **Action**: [X] Renamed all 27 genre files to `elements.json`. Updated 4 code paths (elementStore, corpusLoader, episodeOrchestrator.test, validate_element_constraints script) and 2 comments (contractCompiler).

---

## Notes

- All 15 archetype graph.json files are fully complete (zero missing fields).
- All 27 genre graph.json files are fully complete (severity + level on all nodes/edges).
- All cross-reference files are fully complete (405 pairings, all indexes populated).
- All 4 vocabulary files are fully populated.

---

## Class 2: Random / Population Data

Data used to populate templates and slots during story generation — seed pools, example instances, auto-fill sources.

### 7. Feature Packs Not Wired Up (7 files orphaned)

- **Files**: `data/features/voice_neutral.json`, `voice_noir.json`, `voice_epic.json`, `voice_literary.json`, `pacing_fast.json`, `pacing_measured.json`, `pacing_contemplative.json`
- **Issue**: Schema, types, and JSON files all exist. `feature_pack_ids` field exists in `BackboneAssemblerOptions.styleDirectives`. But no code loads the JSON files from disk or injects their `prompt_fragments` into the writer agent. The field is always `[]`.
- **Action**: [ ] Wire feature packs into the pipeline (loader → UI selector → writer agent prompt injection), OR [ ] Remove the orphaned files and schema

### 8. Tone Integration Matrix Loaded But Never Read

- **File**: `data/cross_references/tone_archetype_integration.json` (405 pairings: reinforcing/contrasting/neutral)
- **Issue**: `corpusLoader.ts` loads it into `corpus.toneIntegration` and it contributes to the corpus hash. But no pipeline stage (contract compiler, backbone assembler, detail synthesizer, planner, or writer agent) ever reads the value. The tone in the UI comes from `premise_lookup.json`, not this file.
- **Action**: [ ] Feed tone integration data into the contract or writer prompts, OR [ ] Remove from corpus loading if not needed

### 9. Example Instances Are Display-Only (not used for generation)

- **Files**: `data/archetypes/*/examples_elements.json` (15 files — e.g., Star Wars mapped to Hero's Journey)
- **Issue**: These contain fully annotated named characters, places, objects, and timeline moments for real works. The UI displays them in the Analysis tab. But the generation pipeline never uses them — not for seeding the Randomize function, not for few-shot LLM examples, not for anything.
- **Action**: [ ] Use as few-shot examples in LLM prompts, OR [ ] Feed into the Randomize pool as genre/archetype-aware alternatives, OR [ ] Leave as display-only (current behavior)

### 10. Sample Entity Pools Are Small and Genre-Agnostic

- **File**: `app/src/generation/panels/sampleElements.ts`
- **Issue**: The Randomize button draws from hardcoded pools: 2–5 entries per character role, 2–3 per place type, 2–3 per object type. All entries have a vaguely fantasy/adventure flavor. Selecting Horror or Romance produces the same character names as Hero's Journey. No genre-specific variant pools exist.
- **Action**: [ ] Expand pools with genre-keyed variants (horror names, romance names, etc.), OR [ ] Replace with data-driven pools loaded from `examples_elements.json` files

### 11. Beat Sheet Mappings Not Used (3 files orphaned)

- **Files**: `data/archetypes/01_heros_journey/beat_sheet_star_wars_iv.json`, `07_tragedy/beat_sheet_macbeth.json`, `11_the_escape/beat_sheet_shawshank_redemption.json`
- **Issue**: Detailed scene-to-node mappings with timestamps, duration percentages, and editorial notes. No code in `app/src/` fetches or displays them. Only 3 of 15 archetypes have them.
- **Action**: [ ] Display in Analysis tab as reference material, OR [ ] Remove if not planned for use

### 12. Premise Lookup Complete But Some Premises Are Short

- **File**: `data/cross_references/premise_lookup.json` (405 entries)
- **Issue**: All 405 archetype×genre pairings present. A `fix_short_premises.py` script and `short_premises_under_75.csv` report exist, suggesting a quality pass found some premises under 75 characters. Unknown how many were fixed vs remain short.
- **Action**: [ ] Audit premise lengths and expand any that are still under 75 characters

---

## Notes (Class 2)

- The primary population data source is `sampleElements.ts` (hardcoded) + `premise_lookup.json` (data file).
- `elements.json` (archetype and genre) drive slot creation and validation — they are structural, not seed data.
- The fallback slot defaults in `backboneAssembler.ts` (24 role→slot mappings) are rarely hit since all 15 archetypes have `elements.json`.

---

## Class 3: Story Instance Data

Data created during or after story generation — artifacts, user edits, persistence, and round-trip gaps.

### 13. requestStore Not Persisted (lost on refresh)

- **Store**: `app/src/generation/store/requestStore.ts`
- **Issue**: All user selections (archetype, genre, premise, tone, LLM settings, slot overrides) live in a Zustand store with no `persist` middleware. Page refresh loses everything. The StoryProject save captures most fields but silently drops `slotOverrides` and `mode`.
- **Action**: [X] Added localStorage persistence via Zustand `persist` middleware (key: `story-request-store`). Persists all form values except openaiApiKey, bridgeAdapter, bridgeStatus, and helloResponse. StoryProject save now includes slotOverrides and mode.

### 14. generationStore Telemetry and Prompt Log Not Saved

- **Store**: `app/src/generation/store/generationStore.ts`
- **Issue**: `llmTelemetry` and `promptLog` are excluded from the `StorySnapshot` type. Saving a project and reloading it loses all LLM call details (token counts, latencies, full prompt/response messages).
- **Action**: [ ] Include telemetry and promptLog in StorySnapshot, OR [ ] Accept as transient diagnostic data

### 15. manuscriptStore Not Persisted (prose edits lost on refresh)

- **Store**: `app/src/manuscript/store/manuscriptStore.ts`
- **Issue**: No `persist` middleware. User prose edits (`revised_text`), scene status changes, and notes are session-only — lost on page refresh. Not included in StoryProject save/load. Chapter titles are also not editable (no `updateChapterTitle` action).
- **Action**: [X] Added localStorage persistence via Zustand `persist` middleware (key: `story-manuscript-store`). Persists chapters, selections, and showDiff.

### 16. sceneBoardStore Not Persisted (card edits lost on refresh)

- **Store**: `app/src/sceneboard/store/sceneboardStore.ts`
- **Issue**: No `persist` middleware. Scene card status changes, genre obligation `met` flags, user notes, and manual reorders are session-only. Not in StoryProject save. The `stakes_delta` field exists in the type but is never populated by either populate method.
- **Action**: [X] Added localStorage persistence via Zustand `persist` middleware (key: `story-sceneboard-store`). Persists cards, laneMode, and selectedCardId.

### 17. timelineViewStore Not Persisted and Fields Never Populated

- **Store**: `app/src/timelineview/store/timelineViewStore.ts`
- **Issue**: No `persist` middleware. The store supports `addEvent`/`updateEvent`/`removeEvent` but it's unclear if the UI exposes edit forms. The fields `before_state`, `after_state`, `causal_dependencies`, and `change_types` exist in the type but are never populated by either `populateFromBackbone` or `populateFromInstance`. Not in StoryProject save.
- **Action**: [X] Added localStorage persistence via Zustand `persist` middleware (key: `story-timeline-store`). Persists events, selectedEventId, showSwimLanes, showDependencies. [ ] Populate missing fields from backbone/plan data. [ ] Include in StoryProject save/load.

### 18. instanceStore Bridge Conversion Is Lossy

- **Store**: `app/src/instance/store/instanceStore.ts`
- **Bridge**: `app/src/instance/instanceBridge.ts`
- **Issue**: When generation output converts to a StoryInstance via `instanceFromDetailBindings()`, several fields are always empty:
  - `character.relationships` → `[]` (never populated)
  - `character.knowledge`, `possessions`, `arc_milestones` → empty
  - `place.events_here` → empty
  - `object.custody_history` → empty
  - `factions`, `world_rules`, `event_log` → not populated at all
- Also: no `updateWorldRule` action exists — world rules are create/delete only, cannot be edited in place.
- **Action**: [ ] Enrich the bridge to populate relationships from detailBindings data. [X] Added `updateWorldRule` action to instanceStore.

### 19. instanceStore Not in StoryProject Save

- **Store**: `app/src/instance/store/instanceStore.ts`
- **Issue**: The instanceStore persists independently to localStorage (`story-instances`), but is completely excluded from StoryProject export/import. Exporting a project and importing on another machine loses all instance data. The only path is the manual "Save as instance" button followed by a separate instance export.
- **Action**: [ ] Include active instance in StoryProject save/load, OR [ ] Auto-link instance to project on "Save as instance"

### 20. notesStore Not in StoryProject Save

- **Store**: `app/src/notes/store/notesStore.ts`
- **Issue**: Notes persist to localStorage (`story-notes-store`) but are excluded from StoryProject export. Also not indexed in the SQLite DB. Entity links (`linked_to`) use string IDs with no referential integrity check — deleting an instance entity leaves orphan links in notes.
- **Action**: [ ] Include notes in StoryProject save/load, AND [ ] Add stale-link detection or cleanup

### 21. SQLite DB Is Read-Only Query Layer with Gaps

- **Store**: `app/src/db/`
- **Issue**: The DB layer is purely analytical — no UI allows insert/update/delete. Additional gaps:
  - Artifact content (contract JSON, backbone JSON, scene prose) is never stored — only metadata with stat counts. The DB cannot reconstruct generation output.
  - `scene_entity` join table (linking entities to scenes) has a repository but is never populated by importers.
  - No DB-to-store sync — importing a `.db` file does not repopulate any Zustand store.
- **Action**: [ ] Populate scene_entity during import, AND [ ] Store artifact content (or at least summaries) in artifact rows

### 22. seriesStore Is a Read-Only Server View

- **Store**: `app/src/generation/series/store/seriesStore.ts`
- **Issue**: Series data lives server-side (filesystem JSON via `/api/series` endpoints). The browser store is read-only with no local persistence. No UI for editing series metadata, arc phases, theme/tone, or lore. Series lore and instanceStore lore are separate systems with no sync path. Episode prose is stored as file paths, inaccessible client-side without the server.
- **Action**: [ ] Add client-side series editing and localStorage persistence, OR [ ] Document as server-dependent feature requiring the bridge

---

## Notes (Class 3)

- **Persistence gap partially addressed.** Now 6 of 8 stores persist to localStorage (instanceStore, notesStore, requestStore, manuscriptStore, sceneBoardStore, timelineViewStore). generationStore and seriesStore remain session-only / server-dependent.
- **StoryProject save now includes slotOverrides and mode.** Still excludes manuscript edits, scene board state, timeline events, instances, and notes from project export.
- **The round-trip path is improved:** manuscript edits now survive refresh via localStorage. Full project export round-trip still needs manuscript/sceneboard/timeline inclusion.
- **instanceStore is not linked to the project save system** — requires separate export.
