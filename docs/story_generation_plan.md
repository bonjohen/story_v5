# Story Generation System — Implementation Plan

Phased implementation plan for the agentic story generation system described in `docs/story_design.md`. The system consumes the existing Story Structure Explorer corpus (42 graphs, 12 cross-reference datasets, controlled vocabularies) and produces traceable, constraint-correct story artifacts.

---

## Phase 1: Foundation — Types, Schemas, and Corpus Loader

**Goal:** Establish the type system, JSON schemas, and corpus loading infrastructure that every subsequent phase depends on.

### 1.1 Artifact TypeScript types
- [ ] Create `app/src/generation/artifacts/types.ts`
- [ ] Define `StoryRequest`, `SelectionResult`, `StoryContract`, `StoryPlan`, `ValidationResults`, `StoryTrace`
- [ ] Define discriminated unions for check statuses (`pass` | `warn` | `fail`) and severity (`hard` | `soft`)
- [ ] Define `GenerationConfig` type matching `generation_config.json` schema
- [ ] Define `RunMetadata` type (schema_version, run_id, generated_at, source_corpus_hash)

### 1.2 JSON schemas for runtime validation
- [ ] Create `app/src/generation/artifacts/schema/story_request.schema.json`
- [ ] Create `app/src/generation/artifacts/schema/selection_result.schema.json`
- [ ] Create `app/src/generation/artifacts/schema/story_contract.schema.json`
- [ ] Create `app/src/generation/artifacts/schema/story_plan.schema.json`
- [ ] Create `app/src/generation/artifacts/schema/validation_results.schema.json`
- [ ] Create `app/src/generation/artifacts/schema/story_trace.schema.json`

### 1.3 Corpus loader
- [ ] Create `app/src/generation/engine/corpusLoader.ts`
- [ ] Load archetype graphs (15) + variant files (where present)
- [ ] Load genre graphs (27)
- [ ] Load cross-reference files (matrix, emotional arcs, hybrid patterns, blending model, tone integration)
- [ ] Load controlled vocabularies (node roles, edge meanings, ID conventions)
- [ ] Load manifest.json for corpus inventory
- [ ] Compute stable `source_corpus_hash` from loaded file content

### 1.4 Normalizer and validator
- [ ] Create `app/src/generation/engine/normalizer.ts`
- [ ] Validate node/edge schema conformance
- [ ] Validate vocabulary membership (roles, meanings)
- [ ] Validate ID conventions (prefix, type, number range)
- [ ] Validate genre severity propagation (edge severity inherits from target node)
- [ ] Validate variant node ID ranges (50–79)
- [ ] Validate graph connectivity (archetype spine path exists, genre tree rooted at Level 1)

### 1.5 Corpus validation script
- [ ] Create `app/scripts/validate_corpus.ts`
- [ ] Run all normalizer checks across the full corpus
- [ ] Report pass/fail per graph with detailed error messages
- [ ] Exit with nonzero code on any failure (CI-friendly)

### 1.6 Generation config
- [ ] Create `generation_config.json` at project root
- [ ] Define defaults: signals_policy, tone_policy, repair_policy, coverage_targets, composition_defaults

### 1.7 Tests
- [ ] Unit tests for corpus loader (loads and indexes all 42 graphs)
- [ ] Unit tests for normalizer (validates schema, vocab, IDs, severity)
- [ ] Unit tests for JSON schema validation (valid and invalid artifact samples)

**Verification:** All 42 graphs load and validate. Corpus hash is stable across repeated loads. All artifact schemas validate against known-good samples.

---

## Phase 2: Selection Engine + Contract Compiler (No LLM Required)

**Goal:** Implement the deterministic selection and contract compilation pipeline. This phase requires zero LLM calls — it is pure computation over the corpus.

### 2.1 Selection engine
- [ ] Create `app/src/generation/engine/selectionEngine.ts`
- [ ] Accept `StoryRequest` as input
- [ ] Look up genre–archetype compatibility from `genre_archetype_matrix.json`
- [ ] Score candidates: natural (1.0), occasional (0.6), rare (0.2)
- [ ] Score tone compatibility from `tone_archetype_integration.json`: reinforcing (+0.2), neutral (+0.0), contrasting (−0.1)
- [ ] If user provided both archetype and genre: validate compatibility, return with rationale
- [ ] If user provided only one: rank and select the top-scoring complement
- [ ] If blending enabled: select blend pattern from `genre_blending_model.json`, reject "unstable" unless explicitly allowed
- [ ] If hybrid enabled: select hybrid pattern from `hybrid_archetype_patterns.json`, capture divergence points
- [ ] Emit `SelectionResult` artifact

### 2.2 Contract compiler
- [ ] Create `app/src/generation/engine/contractCompiler.ts`
- [ ] Accept `SelectionResult` + loaded corpus as input
- [ ] Extract archetype spine nodes and required roles
- [ ] Extract variant nodes (if archetype has variants.json)
- [ ] Extract genre nodes by level (L1–L5 + tone + anti-patterns)
- [ ] Partition genre constraints into hard/soft using severity field
- [ ] Build `global_boundaries` from: genre promise, hard constraints, anti-patterns, user content limits
- [ ] Build `phase_guidelines` for each archetype spine node: entry/exit conditions, failure modes, signals, linked genre obligations
- [ ] Build `validation_policy` from generation config
- [ ] Emit `StoryContract` artifact

### 2.3 Artifact I/O helpers
- [ ] Create `app/src/generation/artifacts/io.ts`
- [ ] Implement `writeArtifact(runDir, name, data)` — writes JSON with schema validation
- [ ] Implement `readArtifact(runDir, name, schema)` — reads and validates JSON
- [ ] Implement `createRunDir(baseDir)` — creates `outputs/runs/{run_id}/` with timestamp-based ID

### 2.4 Tests
- [ ] Unit tests for selection engine (all branches: both provided, one missing, blend, hybrid)
- [ ] Unit tests for contract compiler (verify all spine nodes appear, hard/soft partitioning correct)
- [ ] Integration test: story_request → selection_result → story_contract round-trip
- [ ] Golden-file test: fixed input produces deterministic output

**Verification:** Given a fixed `story_request.json`, the pipeline deterministically produces `selection_result.json` and `story_contract.json`. All hard constraints appear in the contract. All anti-patterns appear in exclusions.

---

## Phase 3: Planner (LLM-Enhanced)

**Goal:** Build beat outlines and scene specifications from the story contract. Start with deterministic scaffolding, then enhance summaries with LLM.

### 3.1 LLM adapter interface
- [ ] Create `app/src/generation/agents/llmAdapter.ts`
- [ ] Define `LLMAdapter` interface: `complete(prompt, schema?) → string | object`
- [ ] Implement `AnthropicAdapter` (Claude API via Anthropic SDK)
- [ ] Implement `MockAdapter` for testing (returns canned responses)
- [ ] Model selection via `--model` flag or generation config

### 3.2 Deterministic beat scaffolding
- [ ] Create `app/src/generation/engine/planner.ts`
- [ ] Map each archetype spine node to one beat (1:1 minimum)
- [ ] Assign emotional arc targets from `archetype_emotional_arcs.json` (if available)
- [ ] For hybrid archetypes: create parallel beat segments + merge plan using divergence points

### 3.3 Scene assignment
- [ ] Assign each hard genre obligation (Level 5, severity: hard) to at least one scene
- [ ] Distribute soft obligations across beats where narratively appropriate
- [ ] Build per-scene `constraints_checklist` (hard, soft, must_not)
- [ ] Build per-scene `archetype_trace` (node, edge_in, edge_out)

### 3.4 LLM-enhanced summaries
- [ ] Create planner agent prompt in `app/src/generation/agents/plannerAgent.ts`
- [ ] LLM generates beat summaries, scene goals, setting, and character assignments
- [ ] LLM output is constrained by contract boundaries — validate before accepting
- [ ] Fallback: deterministic summaries from node definitions if LLM unavailable

### 3.5 Coverage tracking
- [ ] Build coverage map: constraint → assigned scenes, anti-patterns → monitored checks, roles → beats
- [ ] Emit `coverage_targets` in plan (hard: 1.0, soft: configurable minimum)
- [ ] Fail planning if any hard constraint is unassigned

### 3.6 Tests
- [ ] Unit tests for beat scaffolding (every spine node mapped)
- [ ] Unit tests for scene assignment (every hard obligation assigned)
- [ ] Unit tests for coverage tracking (coverage map complete)
- [ ] Integration test with mock LLM adapter

**Verification:** Every archetype spine node has at least one beat. Every hard constraint appears in at least one scene checklist. Coverage targets are met. Plan validates against JSON schema.

---

## Phase 4: Writer + Validator + Repair Loop

**Goal:** Generate scene prose, validate against constraints, and repair failures.

### 4.1 Writer agent
- [ ] Create `app/src/generation/agents/writerAgent.ts`
- [ ] Build prompt from: contract excerpt + scene spec + global boundaries
- [ ] Prompt includes: "must satisfy" (hard obligations), "must not" (anti-patterns), "maintain tone" (tone marker)
- [ ] Output: markdown scene text with optional footer metadata block
- [ ] Write to `outputs/runs/{run_id}/scene_drafts/{scene_id}.md`

### 4.2 Validation engine
- [ ] Create `app/src/generation/validators/validationEngine.ts`
- [ ] **Hard constraint compliance:** For each hard constraint assigned to the scene, verify evidence exists (heuristic + optional LLM)
- [ ] **Anti-pattern detection (blocking):** Detect via keyword heuristics + optional LLM classification
- [ ] **Tone compliance (global):** Detect tonal drift via sentiment proxy + optional LLM check
- [ ] **Entry/exit conditions:** Verify entry conditions hold at first scene of beat, exit conditions at last
- [ ] **Signals in text:** Verify configurable fraction of archetype signals appear (default: warn only)

### 4.3 Validator agent (optional LLM checks)
- [ ] Create `app/src/generation/agents/validatorAgent.ts`
- [ ] LLM classifies each check: pass / warn / fail with minimal evidence notes
- [ ] Falls back to heuristic-only mode if LLM unavailable

### 4.4 Repair engine
- [ ] Create `app/src/generation/engine/repairEngine.ts`
- [ ] Accept: failing scene draft + validation failures + contract excerpts
- [ ] Strategy: targeted edits (insert missing evidence, remove anti-pattern sections, adjust tone)
- [ ] Full rewrite only if blocking errors exceed configurable threshold (default: 3)
- [ ] Max repair attempts per scene from generation config (default: 2)

### 4.5 Repair agent
- [ ] Create `app/src/generation/agents/repairAgent.ts`
- [ ] Prompt includes: original scene text + specific failure directives + contract constraints
- [ ] Output: revised scene text only (no new characters/plot unless plan allows)

### 4.6 Tests
- [ ] Unit tests for each validation check type (pass, warn, fail cases)
- [ ] Anti-pattern injection tests (insert known violations, verify detection)
- [ ] Integration test: write → validate → repair cycle with mock LLM
- [ ] Golden-run test: fixed seed produces schema-valid artifacts with full hard constraint coverage

**Verification:** Scenes validate against contract. Anti-patterns are detected and repaired. Validation results conform to JSON schema. Repair loop terminates within configured max attempts.

---

## Phase 5: Trace Engine + Compliance Report

**Goal:** Produce the trace map and compliance report that make every decision auditable.

### 5.1 Trace engine
- [ ] Create `app/src/generation/engine/traceEngine.ts`
- [ ] For each scene: record archetype node/edges, genre obligations satisfied, tone marker
- [ ] Aggregate: total constraint coverage, anti-pattern violation count, tone warnings
- [ ] Emit `StoryTrace` artifact

### 5.2 Compliance report
- [ ] Generate `compliance_report.md` in run folder
- [ ] Summary: hard constraint coverage, soft constraint coverage, anti-pattern violations, tone warnings
- [ ] Scene table: scene_id → archetype node → genre obligations → status
- [ ] Flag any unresolved warnings or partial coverage

### 5.3 Tests
- [ ] Unit tests for trace aggregation
- [ ] Integration test: full pipeline produces valid trace and report

**Verification:** Every scene maps to exactly one archetype node. All hard constraints are traced. Compliance report is human-readable.

---

## Phase 6: Orchestrator State Machine

**Goal:** Wire all engines into a single deterministic orchestrator with clean state transitions.

### 6.1 State machine
- [ ] Create `app/src/generation/engine/orchestrator.ts`
- [ ] States: IDLE → LOADED_CORPUS → SELECTED → CONTRACT_READY → PLANNED → GENERATING_SCENE → VALIDATING_SCENE → REPAIRING_SCENE → COMPLETED → FAILED
- [ ] Transitions validated: no skipping steps, no invalid state changes
- [ ] Progress events emitted for UI/CLI consumption

### 6.2 Run folder management
- [ ] Each run writes all artifacts to `outputs/runs/{run_id}/`
- [ ] Run ID format: `RUN_{YYYY}_{MM}_{DD}_{NNNN}`
- [ ] Input request, selection, contract, plan, scene drafts, validation, trace, compliance report

### 6.3 Error handling
- [ ] Transition to FAILED on unrecoverable errors
- [ ] Preserve partial artifacts for debugging
- [ ] Emit structured error artifacts with step and context

### 6.4 Tests
- [ ] State machine transition tests (valid and invalid)
- [ ] Full orchestration integration test (request → completion)
- [ ] Failure mode tests (LLM timeout, validation loop exhaustion)

**Verification:** Orchestrator transitions are deterministic. Full run produces all expected artifacts. Failure states preserve partial output.

---

## Phase 7: UI Panels + Cytoscape Integration

**Goal:** Integrate the generation pipeline into the existing React app as an "operator console."

### 7.1 Generation store
- [ ] Create `app/src/generation/store/generationStore.ts` (Zustand)
- [ ] State: currentRunId, artifacts, status (state machine), logs, selectedSceneId, coverageMap
- [ ] Actions: startRun, loadArtifacts, selectScene, clearRun
- [ ] Optional persistence for run history

### 7.2 Generation panel
- [ ] Create `app/src/generation/panels/GenerationPanel.tsx`
- [ ] Run controls: select archetype/genre, configure options, start/stop
- [ ] Progress indicator with state machine status
- [ ] Log stream showing engine events

### 7.3 Contract panel
- [ ] Create `app/src/generation/panels/ContractPanel.tsx`
- [ ] Display boundaries, guidelines, exclusions
- [ ] Click constraint → highlight linked nodes on Cytoscape canvas

### 7.4 Plan panel
- [ ] Create `app/src/generation/panels/PlanPanel.tsx`
- [ ] Beat list with scenes nested under each beat
- [ ] Coverage visualization (hard: must reach 1.0, soft: progress bar)

### 7.5 Trace panel
- [ ] Create `app/src/generation/panels/TracePanel.tsx`
- [ ] Scene-to-node mapping table
- [ ] Click scene → highlight archetype node and genre obligations on canvas

### 7.6 Compliance panel
- [ ] Create `app/src/generation/panels/CompliancePanel.tsx`
- [ ] Pass/warn/fail summary dashboard
- [ ] Per-scene drilldown with check details

### 7.7 Cytoscape integration
- [ ] "Generation overlay mode" on graph canvas
- [ ] When scene selected: highlight archetype_trace.node_id, relevant edges, genre obligation nodes
- [ ] Node badges: "covered in N scenes"
- [ ] Anti-pattern nodes visually emphasized (red border/glow)

### 7.8 Tests
- [ ] Component tests for each panel (renders with mock data)
- [ ] Store tests (state transitions, artifact loading)

**Verification:** All panels render with real generation output. Scene selection highlights correct nodes on canvas. Coverage visualization updates in real time.

---

## Phase 8: CLI Runner + Polish

**Goal:** Enable headless generation via CLI and finalize shared infrastructure.

### 8.1 CLI runner
- [ ] Create `app/scripts/generate_story.ts`
- [ ] Flags: `--request`, `--out`, `--mode` (draft|outline|contract-only), `--model`, `--max-repairs-per-scene`
- [ ] Shares all engine modules with UI (no code duplication)
- [ ] Outputs to `outputs/runs/{run_id}/` matching UI structure

### 8.2 Contract-only and outline modes
- [ ] `--mode contract-only`: Stop after contract compilation (no LLM needed)
- [ ] `--mode outline`: Stop after planning (LLM for summaries only)
- [ ] `--mode draft`: Full pipeline (default)

### 8.3 Sample request files
- [ ] Create 2–3 sample `story_request.json` files in `outputs/samples/`
- [ ] Cover: simple request (one archetype + genre), blend request, hybrid request

### 8.4 Documentation
- [ ] Update `app/README.md` with generation system section
- [ ] Document CLI usage and flags
- [ ] Document generation_config.json options

### 8.5 Final tests
- [ ] End-to-end CLI test: sample request → all artifacts produced
- [ ] Verify CLI and UI produce identical artifacts from same input

**Verification:** CLI produces valid run output. Contract-only mode works without LLM. UI and CLI outputs are structurally identical.

---

## Phase Dependencies

```
Phase 1 (Foundation)
  ├── Phase 2 (Selection + Contract) ← depends on corpus loader + types
  │     └── Phase 3 (Planner) ← depends on contract compiler
  │           └── Phase 4 (Writer + Validator + Repair) ← depends on planner
  │                 └── Phase 5 (Trace + Compliance) ← depends on writer + validator
  │                       └── Phase 6 (Orchestrator) ← depends on all engines
  │                             ├── Phase 7 (UI Panels) ← depends on orchestrator
  │                             └── Phase 8 (CLI + Polish) ← depends on orchestrator
  └── Phase 6 depends on Phase 1–5 all being complete
```

Phases 7 and 8 are independent of each other and can run in parallel once Phase 6 is complete.

---

## Commit Strategy

Commit and push after each phase. Mark tasks `[X]` as completed. Each phase should be a working, testable increment:

| Phase | Commit Message Pattern |
|-------|----------------------|
| 1 | `Phase 1: Foundation — types, schemas, corpus loader` |
| 2 | `Phase 2: Selection engine + contract compiler` |
| 3 | `Phase 3: Planner with LLM-enhanced summaries` |
| 4 | `Phase 4: Writer + validator + repair loop` |
| 5 | `Phase 5: Trace engine + compliance report` |
| 6 | `Phase 6: Orchestrator state machine` |
| 7 | `Phase 7: UI panels + Cytoscape integration` |
| 8 | `Phase 8: CLI runner + polish` |
