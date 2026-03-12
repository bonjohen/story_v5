# Workflow Tab Plan

## Goal

Add a 6th tab ("Workflow") that displays the generation pipeline as an interactive node/edge graph. The graph describes the state machine the orchestrator uses to produce story data — from IDLE through corpus loading, selection, contract, backbone, planning, scene generation, validation, chapter assembly, to COMPLETED.

## Graph Data

### Nodes (16 states)

Each node represents an orchestrator state. Nodes have a role/category for color-coding:

| Node ID | Label | Category | Description |
|---------|-------|----------|-------------|
| IDLE | Idle | start | No generation active |
| LOADED_CORPUS | Load Corpus | setup | Load archetype + genre graph JSONs |
| SELECTED | Select | setup | Match request to archetype/genre pair |
| CONTRACT_READY | Contract | setup | Compile phase guidelines, constraints, tone rules |
| TEMPLATES_COMPILED | Templates | setup | Build beat + genre lookup tables |
| BACKBONE_ASSEMBLED | Backbone | structure | Assemble narrative skeleton with beats + chapter partition |
| DETAILS_BOUND | Bind Details | structure | Assign characters/places/objects to backbone slots |
| PLANNED | Plan | planning | Generate scene-by-scene goals and summaries |
| EXPANDING_BEATS | Expand Beats | generation | Break scenes into 4-8 micro-beat points (optional) |
| GENERATING_BEAT_POINT | Write Beat Point | generation | LLM writes individual beat point prose (optional) |
| GENERATING_SCENE | Write Scene | generation | LLM writes full scene prose |
| VALIDATING_SCENE | Validate | validation | Check prose against genre constraints |
| REPAIRING_SCENE | Repair | validation | LLM revises failed prose (up to 2 retries) |
| CHAPTERS_ASSEMBLED | Assemble Chapters | output | Stitch scenes into chapter documents |
| COMPLETED | Complete | terminal | All artifacts ready |
| FAILED | Failed | terminal | Error encountered; pipeline aborted |

### Edges (transitions)

| From | To | Label | Condition |
|------|----|-------|-----------|
| IDLE | LOADED_CORPUS | start | always |
| LOADED_CORPUS | SELECTED | select | always |
| SELECTED | CONTRACT_READY | compile | always |
| CONTRACT_READY | COMPLETED | done | mode = contract-only |
| CONTRACT_READY | TEMPLATES_COMPILED | compile templates | mode != contract-only |
| TEMPLATES_COMPILED | BACKBONE_ASSEMBLED | assemble | always |
| BACKBONE_ASSEMBLED | COMPLETED | done | mode = backbone |
| BACKBONE_ASSEMBLED | DETAILS_BOUND | bind | mode != backbone |
| DETAILS_BOUND | COMPLETED | done | mode = detailed-outline |
| DETAILS_BOUND | PLANNED | plan | mode != detailed-outline |
| PLANNED | COMPLETED | done | mode = outline |
| PLANNED | EXPANDING_BEATS | expand | beat_expansion enabled |
| PLANNED | GENERATING_SCENE | write | beat_expansion disabled |
| EXPANDING_BEATS | GENERATING_BEAT_POINT | write beats | always |
| GENERATING_BEAT_POINT | GENERATING_SCENE | stitch | all beat points done |
| GENERATING_SCENE | VALIDATING_SCENE | validate | skipValidation = false |
| GENERATING_SCENE | CHAPTERS_ASSEMBLED | assemble | skipValidation = true, has chapters |
| GENERATING_SCENE | COMPLETED | done | skipValidation = true, no chapters |
| VALIDATING_SCENE | REPAIRING_SCENE | repair | validation failed |
| VALIDATING_SCENE | CHAPTERS_ASSEMBLED | assemble | validation passed, has chapters |
| VALIDATING_SCENE | COMPLETED | done | validation passed, no chapters |
| REPAIRING_SCENE | VALIDATING_SCENE | re-validate | always |
| CHAPTERS_ASSEMBLED | COMPLETED | done | always |
| * | FAILED | error | any unhandled exception |

### Category Colors

| Category | Color | Hex |
|----------|-------|-----|
| start | green | #22c55e |
| setup | cyan | #06b6d4 |
| structure | orange | #f59e0b |
| planning | blue | #3b82f6 |
| generation | purple | #a855f7 |
| validation | amber | #f97316 |
| output | teal | #14b8a6 |
| terminal | gray/red | #64748b / #ef4444 |

## Implementation

### New file: `app/src/generation/panels/WorkflowTab.tsx`

- Self-contained component, no props needed
- Renders a Cytoscape graph using the `cytoscape` library directly (like SystemMap.tsx does)
- Hardcoded graph data (nodes + edges defined inline as constants)
- Layout: `dagre` (top-to-bottom directed graph) — already available since it's used elsewhere
- Node styling: rounded rectangles, colored by category, white text
- Edge styling: directed arrows, labeled with transition condition
- Highlights the **current orchestrator state** by reading `useGenerationStore((s) => s.status)` and styling that node distinctly (glow/border)
- Read-only — no editing, no interaction beyond pan/zoom and hover tooltips
- Node tooltips show the description text

### Modified file: `app/src/App.tsx`

- Add `'workflow'` to the `genTab` union type
- Add a 6th `<GenTab>` for "Workflow"
- Render `<WorkflowTab />` when `genTab === 'workflow'`
- Import `WorkflowTab`
- Tab position: last (after Analysis)

### No other files modified

## Verification

1. `cd app && npx tsc -b` — typecheck passes
2. Tab appears and renders the graph on click
3. Current orchestrator state highlighted in the graph
4. Pan/zoom works
5. Dev server running at http://localhost:5173/story_v5/
