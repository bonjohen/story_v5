# Workflow Monitoring Page Plan

## Goal

Transform the Workflow tab from a static state-machine diagram into a live monitoring dashboard. The page combines the existing pipeline graph (row-of-boxes visualization) with real-time metrics, progress tracking, and event streaming — giving the user a single view of everything happening during story generation.

## Design

The tab is split into two zones:

### Top Zone — Pipeline Graph (existing)

The current 4-row box layout stays. Enhancements:

- **Animated pulse** on the active node (CSS animation, not just a static glow)
- **Progress badge** on generation nodes — e.g., "3/12" scenes written overlaid on the Write Scene box
- **Duration badge** — elapsed time in the active state shown below the active node
- **Edge animation** — active edge (the one just traversed) gets a brighter color briefly

### Bottom Zone — Monitoring Dashboard (new)

A compact grid of monitoring widgets below the graph. Four sections:

#### 1. Run Summary Strip

A single horizontal bar with key facts:

| Field | Source |
|-------|--------|
| Status | `generationStore.status` with color-coded badge |
| Mode | `generationStore.mode` (draft/outline/chapters/etc.) |
| Archetype + Genre | `requestStore.archetype` + `requestStore.genre` |
| Elapsed time | Computed from first event timestamp to now (live counter when running) |
| LLM backend | `requestStore.llmBackend` + connection status |

#### 2. Artifact Progress

A row of small chips/badges showing which pipeline artifacts exist:

| Artifact | Store field | Check |
|----------|------------|-------|
| Request | `request` | `!= null` |
| Selection | `selection` | `!= null` |
| Contract | `contract` | `!= null` |
| Templates | `templatePack` | `!= null` |
| Backbone | `backbone` | `!= null` |
| Details | `detailBindings` | `!= null` |
| Plan | `plan` | `!= null` |
| Scenes | `sceneDrafts` | `size > 0` (show count) |
| Validation | `validation` | `!= null` |
| Chapters | `chapterManifest` | `!= null` (show count) |

Chips: green filled = complete, gray outline = pending, amber pulse = in progress (matches current status).

#### 3. LLM Metrics

A 2×3 grid of stat cards:

| Metric | Computation |
|--------|------------|
| Calls | `llmTelemetry.length` (success / error breakdown) |
| Input | Sum of `inputChars` → display as KB |
| Output | Sum of `outputChars` → display as KB |
| Avg latency | Mean of `durationMs` for successful calls |
| Total LLM time | Sum of `durationMs` |
| Throughput | `outputChars / totalLlmTimeMs` → chars/sec |

Combines both `llmTelemetry` and `chapterLlmTelemetry` when chapter generation is active.

#### 4. Live Event Feed

A scrolling log of the most recent events (last ~20), auto-scrolling to bottom. Each entry shows:

- Relative timestamp (e.g., "+12.3s")
- State badge (colored dot matching category)
- Message text

Merges `events` and `chapterEvents` into a unified timeline, sorted by timestamp.

## Data Sources

All data comes from existing Zustand stores — **no new data collection needed**:

- `useGenerationStore` — status, events, telemetry, artifacts, errors
- `useRequestStore` — archetype, genre, tone, mode, LLM backend config

## Affected Files

| File | Change |
|------|--------|
| `app/src/generation/panels/WorkflowTab.tsx` | Add monitoring widgets below the existing graph |

**Single file change.** No new files, no store modifications, no new dependencies.

## Implementation Phases

### Phase 1 — Run Summary Strip + Artifact Progress

- Add the horizontal summary bar below the graph
- Add artifact chip row
- Wire to `useGenerationStore` and `useRequestStore`
- Live elapsed-time counter using `setInterval` when `running === true`

### Phase 2 — LLM Metrics Grid

- Add the 2×3 stat card grid
- Compute aggregates from `llmTelemetry` + `chapterLlmTelemetry`
- Format numbers (KB, seconds, chars/sec)

### Phase 3 — Live Event Feed

- Merge `events` + `chapterEvents` sorted by timestamp
- Auto-scroll container with relative timestamps
- Category-colored dot per event
- Cap display at last 20 entries for performance

### Phase 4 — Graph Enhancements

- CSS pulse animation on active node
- Progress badge overlay on Write Scene / Write Beat Point nodes (scene count)
- Duration badge on active node
- Brief highlight on last-traversed edge

#### 5. Selection Detail Panel

When the user clicks a node or edge in the pipeline graph, a detail panel appears below the graph (replacing or alongside the monitoring widgets). Clicking the background dismisses it.

**Node selection** shows:

| Field | Source |
|-------|--------|
| State name + description | Hardcoded `NODES` data |
| Category | Color-coded badge |
| Status | Whether this state is visited / active / future |
| Time spent | Computed from event timestamps — duration between entering and leaving this state |
| Events in this state | Filtered subset of `events` where `event.state === selectedNode` |
| LLM calls in this state | Filtered `llmTelemetry` entries whose timestamps fall within this state's window |
| Artifact produced | Which artifact (if any) was created during this state (e.g., Contract Ready → `contract`) |

**Edge selection** shows:

| Field | Source |
|-------|--------|
| Transition label | Hardcoded `EDGES` data |
| From → To | State names with category colors |
| Condition | Edge label text (e.g., "expand", "validate", "skip validation") |
| Traversal count | How many times this edge was traversed (relevant for loops like Validate ↔ Repair, scene iteration) |
| Timestamp | When this transition last occurred (from events where state changed from→to) |

The panel is a compact card (max-height ~200px, scrollable) with a close button.

## Verification

1. `npx tsc -b` — typecheck passes
2. Tab renders pipeline graph + all 4 monitoring sections
3. Start a generation run — metrics update live, events stream, artifact chips flip green
4. Chapter generation — chapter telemetry merges into dashboard
5. Idle state — dashboard shows zeros/empty gracefully
6. Dev server running at http://localhost:5173/story_v5/

## Open Questions

- Should the event feed be filterable by category (setup vs. generation vs. chapter)?
- Should there be a "clear metrics" button to reset telemetry between runs?
- Would a mini sparkline chart for latency-over-time be useful, or is avg sufficient?
