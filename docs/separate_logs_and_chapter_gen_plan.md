# Separate Logs & Chapter Generation Plan

## Problem

1. **Redundant execution**: "Generate Story Graph" (Setup tab) wipes all artifacts and re-executes corpus loading, selection, contract, templates, and backbone assembly — even though "Build Structure" already produced them.

2. **Shared event log**: Setup and Generate tabs share the same `events`, `llmTelemetry`, and `promptLog` arrays in generationStore. When chapter generation starts, `startRun()` resets them — losing the story graph generation log.

3. **Chapter generation doesn't work**: The Generate tab's "Generate All" button calls `startRun()` with mode='draft', which wipes all existing artifacts (backbone, contract, plan, sceneDrafts) and starts from scratch. It should write chapter prose from the existing plan without re-running the whole pipeline.

## Solution

### 1. Two separate log sets in generationStore

Add a second set of logs for chapter generation. The existing `events`/`llmTelemetry`/`promptLog` become the **setup logs** (used by "Generate Story Graph"). New fields track **chapter logs** (used by "Generate Chapter").

**New fields in generationStore:**
```typescript
chapterEvents: OrchestratorEvent[]
chapterLlmTelemetry: LLMCallTelemetry[]
chapterPromptLog: GenerationStoreState['promptLog']
chapterError: string | null
chapterRunning: boolean
```

### 2. Preserve artifacts in startRun

Modify `startRun()` to preserve existing artifacts when mode indicates a continuation:
- When called from Setup tab ("Generate Story Graph"), behavior stays the same — full reset, full pipeline.
- When called from Generate tab ("Generate Chapter"), a new `startChapterRun()` method only resets chapter-specific logs and does NOT wipe backbone/contract/plan/selection/templatePack/detailBindings.

### 3. New `startChapterRun()` method

A new entry point in generationStore that:
- Preserves all existing artifacts (backbone, contract, plan, detailBindings, selection, templatePack)
- Preserves the setup event log (`events`, `llmTelemetry`, `promptLog`)
- Resets only `chapterEvents`, `chapterLlmTelemetry`, `chapterPromptLog`, `chapterError`
- Calls `orchestrate()` with mode='draft' or mode='chapters', passing in existing artifacts so the orchestrator can skip steps 1-7
- The orchestrator needs existing artifacts passed to it — see step 4

### 4. Orchestrator: skip completed steps

The `orchestrate()` function already accepts `existingDetailBindings`. Extend it to accept pre-computed artifacts so it can jump ahead:

**New optional parameter in `orchestrate()`:**
```typescript
existingArtifacts?: {
  selection?: SelectionResult
  contract?: StoryContract
  templatePack?: TemplatePack
  backbone?: StoryBackbone
  plan?: StoryPlan
}
```

When `existingArtifacts` fields are provided, the orchestrator skips those steps and uses the provided artifacts directly, transitioning through those states instantly (emitting events so the log shows "skipped").

### 5. UI changes

**Setup tab** (`StorySetupTab.tsx`):
- Reads `events`, `llmTelemetry` (unchanged — these are the setup logs)
- No changes needed

**Generate tab** (`GenerateTab.tsx`):
- Replace "Generate All" button handler to call `startChapterRun()` instead of `startRun()`
- Read `chapterEvents`, `chapterLlmTelemetry`, `chapterPromptLog`, `chapterError`, `chapterRunning` for its log displays
- Keep reading `events` for the existing setup log if desired (as a collapsed "Setup Log" disclosure)

## Files Modified

| File | Change |
|------|--------|
| `generationStore.ts` | Add `chapterEvents`, `chapterLlmTelemetry`, `chapterPromptLog`, `chapterError`, `chapterRunning` fields + `startChapterRun()` method. Reset only chapter fields in that method. |
| `orchestrator.ts` | Add `existingArtifacts` parameter to `orchestrate()`. Skip steps whose artifacts are already provided. |
| `GenerateTab.tsx` | Wire "Generate All" / "Generate Selected" to `startChapterRun()`. Display `chapterEvents`/`chapterLlmTelemetry` instead of `events`/`llmTelemetry`. |
| `StorySetupTab.tsx` | No changes (already reads `events`/`llmTelemetry`). |

## Step-by-step

### Phase 1: generationStore changes
1. Add chapter log fields to `GenerationStoreState` interface and `INITIAL_STATE`
2. Add `startChapterRun()` method that preserves all artifacts and setup logs
3. Update `clearRun()` to also clear chapter logs
4. Include chapter fields in snapshot export/import for completeness

### Phase 2: orchestrator changes
1. Add `existingArtifacts` to the `orchestrate()` options interface
2. At each pipeline step (loadCorpus, selection, contract, templates, backbone, details, plan), check if the artifact already exists in `existingArtifacts`
3. If it exists: use it, emit a "skipped (using existing)" event, transition state
4. If it doesn't: run the step as normal

### Phase 3: GenerateTab changes
1. Subscribe to `chapterEvents`, `chapterLlmTelemetry`, `chapterPromptLog`, `chapterError`, `chapterRunning`
2. Replace `handleGenerateStory` to call `startChapterRun()`
3. Update event log / telemetry sections to use chapter-specific fields
4. Update error display and running state to use chapter-specific fields

### Phase 4: Verify
1. `cd app && npx tsc -b` — typecheck
2. Manual test: Build Structure → Randomize → Generate Story Graph → check Setup event log preserved → Generate Chapter → check Generate event log separate
3. Dev server running

## Verification

- Setup tab event log stays intact when chapter generation runs
- Chapter generation skips steps 1-7 (corpus → plan) and jumps straight to scene writing
- Both logs show independently and correctly
- Cancel works for both operations independently
