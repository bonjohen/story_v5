# Scene Beat Expansion Plan

Introduce an intermediate **scene beat expansion** step between planning (1-sentence scene goals) and prose generation. Each scene gets broken into 4-8 internal beat points that define the dramatic structure, turning points, and emotional progression within the scene. The writer then generates prose for each beat point, producing full-length scenes instead of a few summary paragraphs.

**Status: Complete.**

## Problem

The current pipeline produces thin scene drafts because:

1. The **planner** gives each scene a 1-sentence goal (e.g., "Establish the ranch's financial crisis through a confrontation with the bank")
2. The **writerAgent** gets that goal + a setting + characters and is told "Write the scene as narrative prose"
3. One LLM call produces 3-5 paragraphs — a sketch, not a chapter-worthy scene

There is no intermediate structure that tells the writer *what should happen within the scene* — the dramatic beats, dialogue moments, emotional turns, and physical actions that make a scene work as narrative.

## Current Pipeline (relevant stages)

```
Backbone beats (structural)
    ↓
Planner: 1-sentence beat summary + 1-sentence scene goal (per scene)
    ↓
WriterAgent: single LLM call → 3-5 paragraphs (per scene)
    ↓
ChapterAssembler: stitch scenes together with separators
```

## Proposed Pipeline

```
Backbone beats (structural)
    ↓
Planner: 1-sentence beat summary + 1-sentence scene goal (per scene)
    ↓
NEW: SceneBeatExpander: 4-8 internal beat points per scene         ← Phase 1-2
    ↓
WriterAgent (revised): one LLM call per beat point → richer prose  ← Phase 3-4
    ↓
NEW: SceneStitcher: assemble beat prose into cohesive scene        ← Phase 5
    ↓
ChapterAssembler: stitch scenes into chapters (unchanged)
    ↓
EditorialAgent: smooth transitions (optional, unchanged)
```

## Key Design Decisions

### What is a Scene Beat Point?

A scene beat point is a discrete dramatic unit within a scene. It has:
- **A micro-goal**: what must happen in this beat (action, revelation, decision, reaction)
- **Characters active**: who participates and what they want in this moment
- **Emotional direction**: where this beat sits on the tension/hope/fear curve within the scene
- **Type**: one of a controlled set (SETUP, ESCALATION, TURNING_POINT, DIALOGUE, ACTION, REACTION, REVELATION, RESOLUTION)
- **Approximate weight**: relative length guidance (e.g., "short", "medium", "long")

### How Many Beat Points Per Scene?

- Default: 4-8 per scene, depending on the scene's structural importance
- Scenes tied to high-stakes archetype nodes (Crisis, Climax, Ordeal) get more beats (6-8)
- Transitional scenes (Ordinary World, Return) get fewer (4-5)
- The beat count is derived from the backbone beat's emotional scores and the scene's constraint density

### LLM Call Budget Impact

Current: 1 LLM call per scene (writer) + 1 per scene (planner) = ~2 per scene
Proposed: 1 per scene (beat expansion) + 4-8 per scene (writer per beat) = ~5-9 per scene

This is a significant increase. Mitigations:
- **Fast Draft mode**: skip beat expansion, use current 1-call-per-scene behavior (existing behavior preserved)
- **Template fallback**: deterministic beat expansion without LLM (always available)
- **Configurable beat count**: `max_beats_per_scene` in GenerationConfig
- **Batch mode**: group 2-3 beat points into a single LLM call to reduce total calls

---

## Types

### New Types (artifacts/types.ts)

```typescript
/** Type of dramatic action within a scene beat point. */
export type SceneBeatType =
  | 'setup'         // Establish setting, mood, character positions
  | 'escalation'    // Raise stakes, introduce complication
  | 'turning_point' // Reversal, surprise, key decision
  | 'dialogue'      // Character exchange that advances plot or reveals character
  | 'action'        // Physical action, confrontation, movement
  | 'reaction'      // Character processes what just happened
  | 'revelation'    // New information changes the scene's direction
  | 'resolution'    // Scene-level closure, sets up transition to next scene

/** A single dramatic beat within a scene. */
export interface SceneBeatPoint {
  beat_point_id: string            // e.g., "S01_BP01"
  scene_id: string                 // FK to parent scene
  sequence: number                 // order within the scene (1-based)
  type: SceneBeatType
  micro_goal: string               // 1-2 sentences: what must happen
  characters_active: string[]      // roster IDs participating in this beat
  emotional_target: {              // where this beat sits on the scene's arc
    tension: number                // 0-1 relative to scene
    hope: number
    fear: number
  }
  weight: 'short' | 'medium' | 'long'  // approximate prose length guidance
  notes?: string                   // optional writer guidance
}

/** The expanded beat structure for a single scene. */
export interface SceneBeatExpansion {
  scene_id: string
  beat_points: SceneBeatPoint[]
  scene_arc_summary: string        // 1-sentence summary of the scene's internal arc
}
```

### Modified Types

```typescript
// StoryPlan gains optional beat expansions
export interface StoryPlan extends RunMetadata {
  beats: Beat[]
  scenes: Scene[]
  coverage_targets: CoverageTargets
  element_roster?: ElementRoster
  scene_beat_expansions?: SceneBeatExpansion[]   // NEW
}

// GenerationConfig gains beat expansion settings
export interface GenerationConfig {
  // ...existing fields...
  beat_expansion?: {
    enabled: boolean                  // default: true (false = current behavior)
    max_beats_per_scene: number       // default: 8
    min_beats_per_scene: number       // default: 4
    batch_size: number                // beats per LLM call (default: 1, max: 3)
  }
}
```

---

## Phases

### Phase 1: Types and SceneBeatExpander Engine

Add the new types and build the deterministic beat expansion engine.

- [X] Add `SceneBeatType`, `SceneBeatPoint`, `SceneBeatExpansion` types to `artifacts/types.ts`
- [X]Add `beat_expansion` config to `GenerationConfig` type and `generation_config.json` default
- [X]Add `scene_beat_expansions` optional field to `StoryPlan`
- [X]Create `engine/sceneBeatExpander.ts`:
  - `expandSceneBeats(scene, beat, contract, config)` → `SceneBeatExpansion`
  - Deterministic logic: analyze scene goal, constraints, emotional scores, and character count to produce 4-8 typed beat points
  - Beat type sequencing rules: always start with `setup`, always end with `resolution`, `turning_point` near middle, `escalation` before turning points
  - Emotional curve: distribute the scene's target emotional scores across beat points as a rising/falling arc
  - Weight assignment: `setup` and `resolution` are `short`, `turning_point` and `dialogue` are `long`, others `medium`
- [X]Create `engine/sceneBeatExpander.test.ts` with unit tests:
  - Produces correct count range (4-8)
  - Always starts with setup, ends with resolution
  - Emotional targets sum/average to scene targets
  - Respects max/min config
- [X]Typecheck passes

### Phase 2: LLM-Enhanced Beat Expansion Agent

Add an LLM agent that enriches the deterministic beat expansion with story-specific micro-goals.

- [X]Create `agents/beatExpansionAgent.ts`:
  - `buildBeatExpansionPrompt(scene, beat, contract, deterministicExpansion, plan)` → `LLMMessage[]`
  - Prompt provides: the deterministic beat structure (types + sequence), scene goal, characters, setting, constraints, and prior scene context
  - LLM task: write a specific `micro_goal` for each beat point that advances the scene goal while respecting the beat type
  - Output format: JSON array of `{ beat_point_id, micro_goal, notes? }`
  - `enhanceBeatExpansion(llm, scene, beat, contract, expansion, plan)` → `SceneBeatExpansion`
  - Parse and validate LLM output, fall back to deterministic micro-goals on failure
- [X]Create `agents/beatExpansionAgent.test.ts`:
  - Prompt contains all required context
  - Parse handles well-formed and malformed LLM output
  - Fallback preserves deterministic expansion
- [X]Typecheck passes

### Phase 3: Revise WriterAgent for Beat-Point Prose

Modify the writer to generate prose per beat point instead of per scene.

- [X]Add `buildBeatPointWriterPrompt(beatPoint, scene, beat, contract, plan, priorBeatProse)` to `writerAgent.ts`
  - Includes: beat point micro-goal, type, weight, characters active, emotional target
  - Includes: prior beat point prose (for continuity within the scene)
  - Weight → approximate word count guidance: short (~150 words), medium (~300 words), long (~500 words)
  - Does NOT include a scene heading — that's added during stitching
- [X]Add `writeBeatPoint(beatPoint, scene, beat, contract, llm, plan, priorBeatProse)` → `WriteSceneResult`
- [X]Add `writeBeatPointStreaming(...)` for streaming support
- [X]Add template-based fallback `buildTemplateBeatPoint(...)` for no-LLM mode
- [X]Preserve existing `writeScene()` and `buildWriterPrompt()` — they remain the Fast Draft path
- [X]Add tests for new prompt builder and beat point writer
- [X]Typecheck passes

### Phase 4: SceneStitcher

Create the engine that assembles beat point prose into a cohesive scene.

- [X]Create `engine/sceneStitcher.ts`:
  - `stitchScene(beatPointProse: Map<string, string>, expansion: SceneBeatExpansion, scene: Scene, beat: Beat)` → `string`
  - Deterministic assembly: concatenate beat point prose in sequence order
  - Add scene heading (`## {beat_role}`) at top
  - Insert subtle paragraph breaks between beat types (not `---`, just double newline)
  - No separators between beats of the same type
  - Total scene should read as continuous prose, not segmented chunks
- [X]Optional: LLM smoothing pass at scene level (reuse `editorialAgent` pattern)
  - Only if `beat_expansion.smooth_scenes` config flag is true
  - Lighter touch than chapter editorial — just fix beat-to-beat transitions
- [X]Create `engine/sceneStitcher.test.ts`:
  - Correct ordering
  - Heading present
  - All beat prose included
  - No missing beats produce errors
- [X]Typecheck passes

### Phase 5: Orchestrator Integration

Wire the new stages into the orchestrator state machine.

- [X]Add new orchestrator states: `EXPANDING_BEATS`, `GENERATING_BEAT_POINT`
- [X]Modify scene generation loop in `orchestrator.ts`:
  ```
  for each scene:
    if beat_expansion.enabled:
      1. expandSceneBeats() → deterministic expansion
      2. enhanceBeatExpansion() → LLM-enriched micro-goals (if LLM available)
      3. for each beat point:
         writeBeatPoint() → prose chunk
      4. stitchScene() → full scene prose
    else:
      writeScene() → current behavior (Fast Draft)
  ```
- [X]Add `onBeatPointChunk` callback to `OrchestratorOptions` for streaming beat-level progress
- [X]Update `OrchestratorResult` to include `scene_beat_expansions`
- [X]Respect `max_llm_calls` budget — stop gracefully if budget exhausted mid-scene
- [X]Add beat expansion to `onArtifact` callback so expansions are visible in store during generation
- [X]Typecheck passes

### Phase 6: Store and UI Updates

Surface beat expansion in the generation store and UI.

- [X]Add `sceneBeatExpansions` to `GenerationStoreState` and `INITIAL_STATE`
- [X]Update `startRun` to store beat expansions from `OrchestratorResult`
- [X]Update `onArtifact` to push partial beat expansions
- [X]Add beat expansion config controls to StorySetupTab or GenerateTab:
  - Toggle: "Expand scene beats" (default: on)
  - Slider or input: "Max beats per scene" (4-8, default: 8)
- [X]Update GenerateTab event log to show beat-level progress:
  - "Expanding beats for scene 3/8: Catalyst"
  - "Writing beat point 2/6: Escalation"
- [X]Update Analysis tab to show beat expansions as a collapsible artifact
- [X]Update project save/load to include `scene_beat_expansions`
- [X]Typecheck passes

### Phase 7: Tests and Polish

- [X]Integration test: full pipeline with beat expansion enabled → produces longer, structured scene prose
- [X]Integration test: Fast Draft mode (expansion disabled) → produces current-length drafts
- [X]Verify LLM call budget: count calls with expansion on vs off
- [X]Update `consolidated_reference.md` with new artifact fields
- [X]Update `data_gaps_plan.md` if any items are affected
- [X]Run full test suite, typecheck
- [X]Commit and push

---

## Open Questions


1. **Batch beat writing**: Should we write 2-3 beat points in a single LLM call to save budget? This reduces call count but may reduce quality since each beat gets less focused attention. Configurable via `batch_size`. 
NO.

2. **Scene-level smoothing**: After stitching beat prose, should there be a light editorial pass at the scene level (before chapter assembly)? This adds 1 LLM call per scene but could smooth beat-to-beat transitions. Currently proposed as optional.
YES.

3. **Beat expansion for template mode**: When no LLM is available, the deterministic beat expansion still produces typed beat points with generic micro-goals. The template prose generator would then produce richer template prose per beat point. Worth doing, or is template mode fine as-is?
YES.

4. **Existing project compatibility**: Projects saved before this feature won't have `scene_beat_expansions`. The load path should handle this gracefully (missing = use current behavior). Need to verify. Not worried about this during the development phase.  It should fail gracefully, but no real effort is needed here.

5. **Validation scope**: The current validation engine checks scenes as a whole. Should it also validate individual beat points against constraints? Or is scene-level validation sufficient?
I think scene level is good enough.

---

## LLM Call Budget Comparison

| Scenario | Scenes | Calls/Scene (current) | Calls/Scene (expanded) | Total Current | Total Expanded |
|----------|--------|-----------------------|------------------------|---------------|----------------|
| 7-scene story | 7 | ~2 (plan + write) | ~7 (plan + expand + 5 beats) | ~14 | ~49 |
| 7-scene, batch=3 | 7 | ~2 | ~4 (plan + expand + 2 batches) | ~14 | ~28 |
| 7-scene, Fast Draft | 7 | ~2 | ~2 (unchanged) | ~14 | ~14 |

The `max_llm_calls` config (default: 20) will need to be raised for expanded mode. Suggest default of 60 when beat expansion is enabled.

---

## Files Affected

| File | Change |
|------|--------|
| `artifacts/types.ts` | Add SceneBeatType, SceneBeatPoint, SceneBeatExpansion; extend StoryPlan, GenerationConfig |
| `engine/sceneBeatExpander.ts` | **New** — deterministic beat expansion engine |
| `agents/beatExpansionAgent.ts` | **New** — LLM agent for micro-goal enrichment |
| `agents/writerAgent.ts` | Add `buildBeatPointWriterPrompt`, `writeBeatPoint`, `writeBeatPointStreaming` |
| `engine/sceneStitcher.ts` | **New** — assemble beat prose into scene |
| `engine/orchestrator.ts` | Add EXPANDING_BEATS/GENERATING_BEAT_POINT states, wire new loop |
| `store/generationStore.ts` | Add sceneBeatExpansions state, update startRun/onArtifact |
| `panels/GenerateTab.tsx` | Beat expansion toggle, beat-level progress in event log |
| `panels/StorySetupTab.tsx` | Beat expansion config controls |
| `panels/AnalysisTab.tsx` | Beat expansion artifact display |
| `artifacts/storySnapshot.ts` | Include beat expansions in project save/load |
| `generation_config.json` | Add beat_expansion defaults |
