# Agentic Story Generation System

## Detailed Design Document

### Uses Story Structure Explorer corpus as seed data for boundaries, guidelines, exclusions, and traceable generation

---

## 0. Scope

### 0.1 In Scope

* A new **agentic story generation tool** that consumes the existing **Story Structure Explorer** corpus:

  * 15 archetype graphs (+ variants)
  * 27 genre depth graphs
  * cross-reference datasets (matrix, indices, blending, tone integration, emotional arcs, works registry, etc.)
  * controlled vocabularies
* A deterministic, inspectable generation pipeline that produces:

  * **Story Contract** (boundaries/guidelines/exclusions)
  * **Plan/Outline** (beats/scenes with obligations)
  * **Story Draft** (scenes/prose)
  * **Trace + Compliance Report** (why decisions were made; which constraints were satisfied)

### 0.2 Out of Scope (initially)

* Fine-tuning models
* Automatic ingestion of new corpora (assume corpus is curated)
* Full “novel-length” editing suite (keep to generation + validation loop)
* External web research tools (unless explicitly added later)

---

## 1. Goals and Non-Goals

### 1.1 Goals

* **Traceable**: Every scene decision references corpus IDs (nodes/edges/constraints).
* **Constraint-correct**: Hard constraints and anti-pattern exclusions are enforced.
* **Composable**: Supports hybrid archetypes and genre blending using existing datasets.
* **Operable**: Integrates into the existing UI as an “operator console.”
* **Artifact-driven**: The pipeline is controlled by explicit JSON artifacts that can be versioned.

### 1.2 Non-Goals

* “Creativity” without structure (the system must remain corpus-driven).
* Black-box generation with no explanations.
* UI-only solution; generation must work headless/CLI as well.

---

## 2. System Overview

### 2.1 High-Level Pipeline

1. **Load + Normalize corpus**
2. **Select** archetype + genre (or confirm user selection)
3. **Compile Story Contract**
4. **Plan** beats and scenes
5. **Generate** scene drafts
6. **Validate** per scene + globally (constraints, tone, anti-patterns, entry/exit)
7. **Repair** targeted failures
8. **Export** story + trace + compliance

### 2.2 Key Principle: “Artifacts Control the Agent”

The LLM is not allowed to improvise structure. It must:

* Read the current artifact (contract / plan / scene spec)
* Write outputs consistent with it
* Update artifacts only through specified transitions (and those transitions are validated)

---

## 3. Architecture

### 3.1 Components

* **CorpusLoader**

  * Loads graphs and cross-reference JSON from `data/`
* **Normalizer / Validator**

  * Ensures schemas, vocab consistency, ID conventions, severity propagation
* **SelectionEngine**

  * Chooses archetype/genre/tone/hybrid/blend using cross-reference datasets
* **ContractCompiler**

  * Compiles the Story Contract artifact (boundaries/guidelines/exclusions)
* **Planner**

  * Builds beat outline + scene obligations mapping
* **Writer**

  * Produces scene drafts from scene spec
* **ValidationEngine**

  * Runs checks (hard constraints, tone, anti-patterns, entry/exit conditions, signals)
* **RepairEngine**

  * Produces targeted fixes to failed scenes (not full rewrite)
* **TraceEngine**

  * Produces trace map and compliance report
* **UI Integration Layer**

  * React panels and hooks for driving and inspecting the pipeline

### 3.2 Deployment Modes

* **Local CLI**: `node scripts/generate_story.ts ...`
* **Local Web App**: integrated into existing React app as “Generation” mode
* **Future**: server mode (optional), but initial implementation can run in-browser via API or locally via Node.

---

## 4. Repository / Folder Layout

Add these (without disrupting existing structure):

```
app/
  src/
    generation/
      engine/                 # orchestrator + pure functions
      agents/                 # prompt builders + response parsers
      validators/             # rules + heuristics + LLM checks
      artifacts/              # TS types + JSON schema + IO helpers
      panels/                 # GenerationPanel, ContractPanel, TracePanel, CompliancePanel
      store/                  # generationStore (zustand)
      hooks/                  # useGeneration, useArtifacts, useRunHistory
app/scripts/
  generate_story.ts           # CLI runner (Node, alongside existing data scripts)
  validate_corpus.ts          # corpus integrity checks
  compile_contract.ts         # test harness
docs/
  story_design.md             # this doc
data/
  (unchanged; reused)
outputs/
  runs/{run_id}/              # emitted artifacts and logs per run
```

---

## 5. Data Contracts (Artifacts)

All artifacts are versioned and emitted into a run folder. They are both:

* inputs to later steps
* auditable outputs for the operator

### 5.1 Artifact Versioning

Every artifact includes:

* `schema_version` (semver-like string)
* `generated_at` (ISO timestamp)
* `run_id` (stable per run)
* `source_corpus_hash` (hash of key corpus files)

### 5.2 `story_request.json`

User-facing input request.

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_2026_03_04_0001",
  "generated_at": "2026-03-04T18:22:00Z",
  "premise": "A retired engineer discovers...",
  "medium": "novel",
  "length_target": "short_story",
  "audience": { "age_band": "adult", "content_limits": ["no sexual violence"] },
  "requested_genre": "Science Fiction",
  "requested_archetype": "The Mystery Unveiled",
  "tone_preference": "somber",
  "constraints": {
    "must_include": ["found family"],
    "must_exclude": ["time travel"],
    "allow_genre_blend": true,
    "allow_hybrid_archetype": true
  }
}
```

### 5.3 `selection_result.json`

What the SelectionEngine decided.

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "primary_archetype": "The Mystery Unveiled",
  "primary_genre": "Science Fiction",
  "genre_blend": {
    "enabled": true,
    "secondary_genre": "Thriller",
    "pattern_id": "GB_07_DOMINANT_SF_THRILLER",
    "stability": "conditionally-stable",
    "dominance": "Science Fiction",
    "rationale": ["..."]
  },
  "hybrid_archetype": {
    "enabled": false
  },
  "compatibility": {
    "matrix_classification": "naturally compatible",
    "rationale": ["..."]
  },
  "tone_marker": {
    "selected": "somber",
    "integration_classification": "reinforcing"
  }
}
```

### 5.4 `story_contract.json`

This is the core “boundaries, guidelines, exclusions” artifact.

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "archetype": {
    "id_prefix": "MU",
    "name": "The Mystery Unveiled",
    "spine_nodes": ["MU_N01_...", "..."],
    "required_roles": ["Origin", "Disruption", "Revelation", "Resolution"],
    "allowed_variants": ["MU_N50_...", "MU_N51_..."],
    "required_edges": ["MU_E01_...", "..."]
  },
  "genre": {
    "id_prefix": "SF",
    "name": "Science Fiction",
    "levels": {
      "1": ["SF_N01_GENRE_PROMISE"],
      "2": ["..."],
      "3": ["..."],
      "4": ["..."],
      "5": ["..."]
    },
    "tone_marker": ["SF_N80_INTELLECTUAL_ENGAGEMENT"],
    "anti_patterns": ["SF_N90_TECH_MAGIC"],
    "hard_constraints": ["..."],
    "soft_constraints": ["..."]
  },
  "global_boundaries": {
    "musts": ["..."],
    "must_nots": ["..."],
    "content_limits": ["no sexual violence"],
    "style_limits": ["no second-person POV"]
  },
  "phase_guidelines": [
    {
      "node_id": "MU_N01_...",
      "definition": "...",
      "entry_conditions": ["..."],
      "exit_conditions": ["..."],
      "failure_modes": ["..."],
      "signals_in_text": ["..."],
      "genre_obligation_links": ["SF_N60_PREMISE_REVEAL"]
    }
  ],
  "validation_policy": {
    "hard_constraints_required": true,
    "anti_patterns_blocking": true,
    "tone_global": true,
    "entry_exit_required": true,
    "signals_required": "soft" 
  }
}
```

### 5.5 `story_plan.json`

Beat outline + scenes. Scenes are the unit of generation.

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "beats": [
    {
      "beat_id": "B01",
      "archetype_node_id": "MU_N01_...",
      "summary": "Introduce ordinary world...",
      "required_exit_conditions": ["..."],
      "target_emotional_scores": { "tension": 0.2, "hope": 0.6, "fear": 0.1, "resolution": 0.0 }
    }
  ],
  "scenes": [
    {
      "scene_id": "S01",
      "beat_id": "B01",
      "setting": "Seattle, winter",
      "characters": ["PROTAGONIST", "NEIGHBOR"],
      "scene_goal": "Establish missing-person hook",
      "archetype_trace": {
        "node_id": "MU_N01_...",
        "edge_in": null,
        "edge_out": "MU_E01_DISRUPTS_ORDER"
      },
      "genre_obligations": [
        { "node_id": "SF_N60_PREMISE_REVEAL", "severity": "hard" }
      ],
      "constraints_checklist": {
        "hard": ["..."],
        "soft": ["..."],
        "must_not": ["SF_N90_TECH_MAGIC"]
      }
    }
  ],
  "coverage_targets": {
    "hard_constraints_min_coverage": 1.0,
    "soft_constraints_min_coverage": 0.6
  }
}
```

### 5.6 `scene_drafts/{scene_id}.md`

Generated scene text + inline metadata markers (optional).

### 5.7 `validation_results.json`

Per-scene and global validation.

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "scenes": [
    {
      "scene_id": "S01",
      "status": "pass",
      "checks": [
        { "type": "hard_constraints", "status": "pass", "details": ["..."] },
        { "type": "anti_patterns", "status": "pass", "details": [] },
        { "type": "tone", "status": "warn", "details": ["tone drift at paragraph 3"] },
        { "type": "entry_exit", "status": "pass", "details": [] },
        { "type": "signals_in_text", "status": "pass", "details": ["..."] }
      ]
    }
  ],
  "global": {
    "hard_constraints_coverage": 1.0,
    "soft_constraints_coverage": 0.72,
    "anti_pattern_violations": 0
  }
}
```

### 5.8 `story_trace.json`

The trace map (“why this scene exists”).

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "scene_trace": [
    {
      "scene_id": "S01",
      "archetype": { "node_id": "MU_N01_...", "edges": ["MU_E01_..."] },
      "genre": { "satisfied_constraints": ["SF_N51_..."], "tone_marker": "SF_N80_..." },
      "notes": ["This scene satisfies the genre promise by..."]
    }
  ]
}
```

---

## 6. Corpus Integration

### 6.1 Required Corpus Files

* Archetypes:

  * `data/archetypes/{nn_name}/graph.json`
  * `data/archetypes/{nn_name}/variants.json` (optional)
  * `data/archetypes/{nn_name}/narrative.md`
  * `data/archetypes/{nn_name}/examples.md`
* Genres:

  * `data/genres/{nn_name}/graph.json`
  * `data/genres/{nn_name}/narrative.md`
  * `data/genres/{nn_name}/examples.md`
* Cross-refs:

  * `data/genre_archetype_matrix.json`
  * `data/tone_archetype_integration.json`
  * `data/archetype_emotional_arcs.json`
  * `data/hybrid_archetype_patterns.json`
  * `data/genre_blending_model.json`
  * indices + registry + validation as needed
* Controlled vocabularies:

  * `data/vocabulary/archetype_node_roles.json`
  * `data/vocabulary/archetype_edge_vocabulary.json`
  * `data/vocabulary/genre_node_roles.json`
  * `data/vocabulary/genre_edge_vocabulary.json`
  * `data/vocabulary/archetype_id_convention.md`
  * `data/vocabulary/genre_id_convention.md`

### 6.2 Normalization Rules

* Validate every node/edge conforms to documented schema.
* Ensure:

  * node roles exist in vocab
  * edge meanings exist in vocab
  * ID prefix + type + number ranges are valid
* Genre severity propagation:

  * `edge.severity = target_node.severity` (if missing)
* Variant nodes:

  * must be in 50–79 range and reference existing base node IDs for rejoin.
  * variant IDs follow `{PREFIX}_N{50-79}_{NAME}` format (no separate `V` prefix)
* Genre node number ranges by level:

  * 01–09: Level 1 (Genre Promise)
  * 10–19: Level 2 (Core Constraint)
  * 20–39: Level 3 (Subgenre Pattern)
  * 40–59: Level 4 (Setting Rule)
  * 60–79: Level 5 (Scene Obligation)
  * 80–89: Tone Marker
  * 90–99: Anti-Pattern
* ID prefix collisions:

  * `MU` is shared by archetype "The Mystery Unveiled" and genre "Musical"
  * `SA` is shared by archetype "The Sacrifice" and genre "Satire"
  * Disambiguation is by `type` field in graph.json (`"archetype"` vs `"genre"`); within each corpus all prefixes are unique

### 6.3 Corpus Hashing

Compute a stable run hash:

* concatenate sorted file list + file content hashes (or use a manifest file if present)
* store in every artifact as `source_corpus_hash`

---

## 7. Selection Engine

### 7.1 Inputs

* `story_request.json`
* `genre_archetype_matrix.json`
* optional:

  * `tone_archetype_integration.json`
  * `genre_blending_model.json`
  * `hybrid_archetype_patterns.json`

### 7.2 Outputs

* `selection_result.json`

### 7.3 Algorithm (Deterministic + Explainable)

1. If user provided both archetype and genre:

   * look up matrix classification and rationale
2. If missing one:

   * rank candidates by:

     * matrix compatibility score (natural > occasional > rare)
     * tone reinforcement score (reinforcing > neutral > contrasting) if tone requested
     * optional: “coverage confidence” from corpus validation statistics
3. If blending enabled:

   * pick blend pattern from blending model matching primary genre
   * ensure stability not “unstable” unless user explicitly allows
4. If hybrid enabled:

   * pick hybrid pattern matching archetype (and genre constraints if possible)
   * capture divergence points for planner

### 7.4 Selection Scoring

Define numeric weights:

* natural compatible: 1.0
* occasional: 0.6
* rare: 0.2
  Tone:
* reinforcing: +0.2
* neutral: +0.0
* contrasting: -0.1 (allowed, but penalized)

Return the top selection plus the scored alternatives (optional, for UI display).

---

## 8. Contract Compiler

### 8.1 Inputs

* Selected archetype/genre graphs + variants
* Controlled vocabularies
* Optional:

  * emotional arc data
  * cross-indexes (shared roles, shared constraints)
  * examples registry (for “evidence hints”)

### 8.2 Outputs

* `story_contract.json`

### 8.3 Compilation Rules

* **Boundaries**

  * Include:

    * genre promise + hard constraints + tone marker
    * anti-patterns as “must not”
    * user content limits as “must not”
* **Guidelines**

  * For each archetype spine node:

    * include entry/exit conditions
    * list failure modes
    * list signals in text
    * link to genre obligations likely to be satisfied at that phase
* **Exclusions**

  * anti-pattern nodes
  * prohibited genre constraints (if genre graph includes “prohibits element” edges)
  * user explicit excludes

---

## 9. Planner

### 9.1 Inputs

* `story_contract.json`
* optional:

  * emotional arcs data for the chosen archetype
  * cross-medium adaptation if medium != default

### 9.2 Outputs

* `story_plan.json`

### 9.3 Planning Strategy

Planner produces:

* Beats aligned to archetype spine nodes (1 beat per node minimum)
* Scenes aligned to genre Level 5 obligations:

  * schedule each hard scene obligation at least once
  * distribute across beats where it makes narrative sense
* Ensure edges’ stake/character effects are reflected in beat goals
* If hybrid archetype:

  * create beat segments for each archetype branch and a merge plan

### 9.4 Planning Constraints

* No beat may violate:

  * archetype ordering (unless variant/hybrid explicitly changes it)
  * entry conditions for its node
* Each hard constraint must be assigned to:

  * a beat (global)
  * and at least one scene (evidence)

### 9.5 Coverage Tracking

During planning, maintain a coverage map:

* constraints → assigned scenes
* anti-patterns → monitored checks
* roles → represented beats

Emit coverage targets and current coverage in the plan.

---

## 10. Writer

### 10.1 Inputs

* `story_contract.json`
* `story_plan.json`
* current scene spec (single scene object)

### 10.2 Outputs

* `scene_drafts/{scene_id}.md`

### 10.3 Writer Constraints (Hard Rules)

* Must satisfy:

  * all scene hard obligations
  * not trigger any anti-patterns
  * preserve global tone marker
  * advance toward node exit conditions
* Must not:

  * introduce prohibited elements
  * contradict setting rules (Level 4)
  * skip planned story events without updating plan via an allowed change request

### 10.4 Writer Output Template

Each scene draft includes:

* Title line
* Scene text
* Optional footer metadata block:

```md
---
scene_id: S01
beat_id: B01
archetype_node: MU_N01_...
genre_obligations: [SF_N51_...]
hard_constraints_satisfied: [...]
soft_constraints_satisfied: [...]
notes: "..."
---
```

---

## 11. Validation Engine

### 11.1 Validation Types

Implement checks as a mix of:

* deterministic rules (string/regex + structural checks)
* lightweight LLM classification checks (optional but recommended)
* “signals_in_text” heuristics

### 11.2 Checks

#### A) Hard Constraint Compliance

* For each hard constraint node assigned to the scene:

  * verify evidence exists (heuristic + optional LLM)
* Coverage check:

  * global hard constraints must be satisfied somewhere (end-of-run)

#### B) Anti-Pattern Detection (Blocking)

* For each anti-pattern:

  * detect via heuristics + optional LLM
* If triggered:

  * block, produce a repair directive

#### C) Tone Compliance (Global)

* Detect tonal drift:

  * heuristic: sentiment/lexical tone proxy
  * optional LLM: “Does this maintain {tone marker}?”
* Tone warnings do not block unless user config says so.

#### D) Archetype Entry/Exit Conditions

* Entry conditions for a node must be true at first scene of the beat.
* Exit conditions must be satisfied by the last scene of the beat.

#### E) Signals in Text

* For the current archetype node:

  * verify at least N of M signals appear (N configurable)
* Default policy: warn, not block, unless configured.

### 11.3 Validation Output

* `validation_results.json` with:

  * pass/warn/fail per check
  * minimal evidence references (quotes limited; prefer indexes/notes)
  * repair directives for fails

---

## 12. Repair Engine

### 12.1 Inputs

* failing scene draft
* scene spec + contract excerpts
* validation failures + directives

### 12.2 Outputs

* revised scene draft
* updated validation record

### 12.3 Repair Strategy

* “Targeted edits”:

  * insert missing obligation evidence
  * remove/replace anti-pattern sections
  * adjust tone by rewriting specific paragraphs
* Avoid “full rewrite” unless:

  * more than K blocking errors (configurable threshold)

---

## 13. Trace Engine

### 13.1 Outputs

* `story_trace.json`
* `compliance_report.md`

### 13.2 Compliance Report Content

* Summary:

  * hard constraints coverage
  * soft constraints coverage
  * anti-pattern violations count
  * tone warnings count
* Scene table:

  * scene_id → archetype node → genre obligations satisfied → status

---

## 14. Agent Prompting (Implementation-Ready)

This section assumes you are using a tool-calling capable LLM runtime, but remains model-agnostic.

### 14.1 Common Prompt Rules

* Always pass:

  * contract excerpt (only what’s needed)
  * scene spec
  * explicit “must / must not”
  * required output schema
* Responses must be parsed into JSON or strict markdown blocks.

### 14.2 Selector Agent Prompt (JSON Output)

**Input:** request + matrix excerpts
**Output:** `selection_result.json` fields

Constraints:

* No invented genres/archetypes outside corpus
* Provide rationale as short bullet strings

### 14.3 Contract Agent Prompt

**Output:** `story_contract.json` strictly

Rules:

* Must include anti-pattern list
* Must include phase_guidelines for every spine node
* Must link obligations where possible

### 14.4 Planner Agent Prompt

**Output:** `story_plan.json` strictly

Rules:

* Each spine node appears at least once in `beats`
* Each hard constraint appears in at least one scene checklist
* Each Level 5 hard obligation appears at least once

### 14.5 Writer Agent Prompt

**Output:** markdown scene text only

Rules:

* Must satisfy scene checklist hard requirements
* Must not trigger anti-patterns
* Must preserve tone marker

### 14.6 Validator Agent Prompt (Optional LLM Check)

**Output:** JSON checks list

Rules:

* classify each check: pass/warn/fail
* list minimal evidence notes (no long quoting)

### 14.7 Repair Agent Prompt

**Output:** revised markdown scene text only

Rules:

* must address each blocking failure explicitly
* do not introduce new characters/plot elements unless plan allows

---

## 15. TypeScript Interfaces (Canonical)

### 15.1 Core Artifact Types

Create in `app/src/generation/artifacts/types.ts`:

* `StoryRequest`
* `SelectionResult`
* `StoryContract`
* `StoryPlan`
* `ValidationResults`
* `StoryTrace`

Include discriminated unions for:

* check result statuses
* severity values

### 15.2 JSON Schema

Create JSON Schema files in `app/src/generation/artifacts/schema/` for runtime validation:

* `story_request.schema.json`
* `selection_result.schema.json`
* `story_contract.schema.json`
* `story_plan.schema.json`
* `validation_results.schema.json`
* `story_trace.schema.json`

---

## 16. Engine Orchestration

### 16.1 Orchestrator State Machine

Implement a deterministic state machine:

States:

* `IDLE`
* `LOADED_CORPUS`
* `SELECTED`
* `CONTRACT_READY`
* `PLANNED`
* `GENERATING_SCENE`
* `VALIDATING_SCENE`
* `REPAIRING_SCENE`
* `COMPLETED`
* `FAILED`

Transitions:

* Load → Select → Contract → Plan → (Generate→Validate→Repair?)* → Complete

### 16.2 Deterministic Run Folder

Each run writes:

* input request
* selection
* contract
* plan
* per-scene drafts
* validation results
* trace + report

Run ID is used everywhere and must be stable.

---

## 17. UI Integration (React App)

### 17.1 New Panels

* **GenerationPanel**

  * run controls (select, compile, plan, generate)
  * progress indicator + logs
* **ContractPanel**

  * view boundaries/guidelines/exclusions
  * highlight linked nodes/constraints
* **PlanPanel**

  * beat list + scenes
  * coverage visualization
* **TracePanel**

  * scene-to-node mapping
  * click to highlight nodes on Cytoscape canvas
* **CompliancePanel**

  * pass/warn/fail summaries
  * drilldown per scene

### 17.2 Cytoscape Integration

* When a scene is selected:

  * highlight `archetype_trace.node_id` and relevant edges
  * highlight genre obligations nodes
* Add a “generation overlay mode”:

  * node badges showing “covered in scenes: N”
  * anti-pattern nodes visually emphasized

### 17.3 Zustand Store

Add `generationStore`:

* `currentRunId`
* `artifacts` (loaded objects)
* `status` (state machine)
* `logs`
* `selectedSceneId`
* `coverageMap`

Persist optional.

---

## 18. CLI Runner

### 18.1 Command

`app/scripts/generate_story.ts` supports:

* `--request outputs/request.json`
* `--out outputs/runs/RUN_...`
* `--mode draft|outline|contract-only`
* `--model <name>` (passed to your LLM adapter)
* `--max-repairs-per-scene N`

### 18.2 Output

Mirrors the run folder structure used by UI.

---

## 19. Validation Strategy for Implementation

### 19.1 Corpus Validation Tests

Extend existing test approach:

* schema validation for all nodes/edges
* vocabulary membership checks
* ID convention checks
* graph connectivity sanity:

  * archetype spine path exists
  * genre tree rooted at Level 1 promise

### 19.2 Generation Tests

* Golden-run tests using fixed seeds:

  * ensure artifacts validate against schema
  * ensure hard constraints coverage reaches 1.0 for a small sample
* “Anti-pattern injection” tests:

  * deliberately add a failing phrase and ensure validator catches it

---

## 20. Security / Safety Constraints

* Enforce user content limits as hard exclusions.
* Add a `content_policy` block in `story_request.json` and propagate into contract.
* If a forbidden category is requested:

  * fail early with a policy error artifact (do not generate story text)

---

## 21. Implementation Plan (Phased Deliverables)

### Phase 1: Artifacts + Corpus Loader

* Implement artifact TS types + JSON schema validation
* Implement CorpusLoader + Normalizer
* Implement `validate_corpus.ts`

### Phase 2: Selection + Contract Compiler (No LLM required)

* Implement SelectionEngine (deterministic)
* Implement ContractCompiler
* Emit `selection_result.json` and `story_contract.json`

### Phase 3: Planner (LLM optional)

* Implement Planner (start with deterministic scaffold, then LLM-enhance summaries)
* Emit `story_plan.json` with coverage map

### Phase 4: Writer + Validator + Repair Loop

* Implement Writer prompts
* Implement validator checks (heuristics first; optional LLM checks)
* Implement RepairEngine
* Emit drafts + validation + trace

### Phase 5: UI Panels

* Add GenerationPanel/Contract/Plan/Trace/Compliance
* Cytoscape highlighting and overlays

### Phase 6: CLI + Run Management

* Add CLI runner
* Ensure UI and CLI share engine modules

---

## 22. Acceptance Criteria

A run is “successful” when:

* All artifacts validate against JSON schemas
* Hard constraints coverage is 1.0
* Anti-pattern violations count is 0
* Every scene has a trace mapping to:

  * one archetype node (minimum)
  * at least one genre obligation (if any exist at Level 5)
* Compliance report generated and readable
* UI can:

  * display contract
  * display plan
  * click scene → highlight relevant nodes in graph

---

## 23. Open Decisions (Codify as Config)

Create `generation_config.json`:

* min signals required per archetype node (warn vs block)
* tone enforcement strictness (warn vs block)
* max repair attempts per scene
* default coverage targets
* blend/hybrid default enablement

Example:

```json
{
  "signals_policy": { "mode": "warn", "min_fraction": 0.5 },
  "tone_policy": { "mode": "warn" },
  "repair_policy": { "max_attempts_per_scene": 2 },
  "coverage_targets": { "soft_min": 0.6 },
  "composition_defaults": { "allow_blend": true, "allow_hybrid": false }
}
```

---

## 24. Handoff Notes for the Code-Generating Agent

Implement in this order:

1. Artifact schemas + validators
2. CorpusLoader + Normalizer + corpus tests
3. SelectionEngine (matrix + tone integration)
4. ContractCompiler (boundaries/guidelines/exclusions)
5. Planner (beats + scenes + coverage)
6. Writer + Validator + Repair loop
7. Trace + compliance report
8. UI panels + graph highlighting
9. CLI runner

Primary success metric: **artifact correctness and traceability** before prose quality.
