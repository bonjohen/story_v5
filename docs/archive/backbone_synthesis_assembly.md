# Design Document: Templated Story Backbone + Detail Synthesis + Chapter Assembly

## 0. Scope and Goal

### Goal

Add a new generation stage that:

1. **Templatizes** output for each **Archetype node** and each **Genre level** so those pieces can be **composed** (styles + genre + vocabulary + timeline knowledge) into a **story backbone**.
2. Adds a **story-specific detail** pass that uses **user input** to create concrete names, places, objects, conflicts, and stakes, and integrates those details into the structured backbone.
3. Adds a **chapter assembly loop** where an agent iterates over scene/beat text and **integrates it into final chapter documents**.

This is explicitly an evolution of the existing “artifacts control the agent” pipeline and its planned generation phases. ([GitHub][1])

### Non-goals (for this increment)

* Not expanding the corpus beyond minimal additions needed to support templating (the archetype/genre graph corpus is already complete and validated). ([GitHub][2])
* Not building a full “novel writing suite” UI; the goal is to extend the pipeline and emit clean artifacts usable by CLI and the existing React viewer integration points. ([GitHub][1])

---

## 1. Current Baseline (What You Already Have)

### Corpus + Model

* **Archetype graphs** = temporal progression (nodes/edges).
* **Genre depth graphs** = constraints in 5 levels + tone + anti-patterns; constraints have `severity` hard/soft. ([GitHub][2])
* **Cross references** include genre–archetype compatibility, tone integration, blending, hybrid patterns, etc. ([GitHub][2])

### Generation Architecture

The pipeline is already designed around:

* deterministic selection + contract compilation (no LLM required), then planner/writer/validator/repair loops.
* **Artifacts as the controlling mechanism** (LLM follows artifacts; updates are validated). ([GitHub][1])

### Timeline / Elements Direction

You already have a timeline model that bridges abstract archetype nodes into concrete “moments” with participants/state changes, plus the explicit concept of **template timelines** at the archetype level. ([GitHub][3])

---

## 2. The Core Design Shift

Right now, the pipeline treats archetype nodes + genre constraints as inputs to contract/plan/scene specs.

The new stage formalizes a **composition layer**:

**(A) Templates**: produce reusable, composable “shape” outputs per archetype node + per genre level
→ **(B) Backbone**: assemble a story-wide structured outline that merges archetype progression + genre obligations + element/timeline expectations + style/vocab directives
→ **(C) Details**: instantiate world/story specifics from user input, binding them into the backbone slots
→ **(D) Chapters**: generate scene drafts, then stitch them into chapter documents with revision/consistency passes

This preserves the “artifact-first” discipline, but adds two missing bridges:

* **bridge #1**: from corpus knowledge to *template-able generation units*
* **bridge #2**: from scenes to *chapter-level editorial integration*

---

## 3. New Artifacts

The existing plan already defines core artifacts (`StoryRequest`, `SelectionResult`, `StoryContract`, `StoryPlan`, `ValidationResults`, `StoryTrace`). ([GitHub][4])
This design adds **four** new artifacts (minimal set):

### 3.1 `template_pack.json`

A compiled “templated knowledge bundle” derived deterministically from the corpus.

**Purpose**

* Provide stable, merge-friendly templates for:

  * each **archetype node**
  * each **genre level (L1–L5)**
  * optional tone/anti-pattern guidance blocks

**Shape (sketch)**

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_...",
  "generated_at": "...",
  "source_corpus_hash": "...",
  "archetype_node_templates": {
    "HJ_N03_MENTOR": {
      "beat_summary_template": "The {protagonist} encounters {mentor} who offers {gift_or_insight}...",
      "scene_obligations": ["establish bond", "transfer knowledge", "foreshadow cost"],
      "required_elements": ["protagonist", "mentor", "talisman?"],
      "signals_to_include": ["reluctance", "threshold framing"],
      "failure_modes_to_avoid": ["mentor is purely exposition dump"]
    }
  },
  "genre_level_templates": {
    "HR_L5_SCENE_OBLIGATIONS": {
      "scene_obligation_template": "Include {fear_trigger} and {isolation_pressure} while maintaining {tone_marker}...",
      "hard_constraint_binding_rules": ["must satisfy at least one hard L5 per scene"],
      "anti_patterns_to_block": ["cheap jump-scare without consequence"]
    }
  }
}
```

### 3.2 `story_backbone.json`

A story-wide structured backbone created by composing templates + contract + timeline expectations.

**Purpose**

* The single authoritative structure that later text must follow.
* Contains ordered beats/scenes aligned to archetype progression, with genre obligations attached, and placeholder slots for story-specific details.

**Key fields**

* `beats[]` or `scenes[]` in order
* `archetype_node_id`, `beat_id`
* `genre_obligations[]` (hard/soft)
* `timeline_moment_stub` (or “moment plan”)
* `slots` (placeholders to be bound in detail synthesis)
* `style_directives` (global + per-beat)

### 3.3 `story_detail_bindings.json`

Concrete story/world instantiation based on user inputs.

**Purpose**

* Bind named entities, setting, factions (if used), objects, local history, theme motifs, etc. into the backbone slots.
* Create continuity-friendly registries (characters/places/objects) consistent with the timeline model. ([GitHub][3])

**Key fields**

* `entity_registry` (characters/places/objects)
* `slot_bindings` (slot → chosen entity / concept)
* `open_mysteries`, `promises`, `payoffs` (optional but useful for long-form coherence)

### 3.4 `chapter_manuscript/`

A folder artifact rather than a single JSON:

* `chapters/ch01.md`, `chapters/ch02.md`, …
* plus `chapters/manifest.json` describing mapping:

  * which scenes belong to which chapter
  * chapter-level tone/pace goals
  * editorial constraints (voice consistency, recap policy)

This matches your stated need: “agent iterates over and integrates the text into several final chapter documents.”

---

## 4. New Engine Components

These components sit inside the already-planned generation structure (`app/src/generation/...`) ([GitHub][1])

### 4.1 TemplateCompiler (deterministic)

**Input**

* corpus graphs + cross refs + controlled vocab
* `SelectionResult` / `StoryContract` (to focus templates on chosen archetype/genre)

**Output**

* `template_pack.json`

**Rules**

* Templates are built by extracting:

  * archetype node fields (`definition`, `entry_conditions`, `exit_conditions`, `signals_in_text`, `failure_modes`)
  * genre level nodes (promise/constraints/patterns/setting rules/scene obligations + severity)
* Normalize into a consistent templating schema:

  * “beat summary template”
  * “scene checklist template”
  * “signals to include”
  * “failure modes to avoid”

This is “templatize the output into this stage so it can be easily merged…” in a formalized way.

### 4.2 BackboneAssembler (mostly deterministic; optional LLM summarization)

**Input**

* `StoryContract` (already compiled from archetype spine + genre constraints) ([GitHub][4])
* `template_pack.json`
* optional: timeline template expectations if `elements.json` / timeline templates exist (your timeline design anticipates this). ([GitHub][3])
* style pack(s) + vocabulary directives (see §5)

**Output**

* `story_backbone.json`

**Responsibilities**

* Decide **scene count** and map archetype nodes → scene(s) (some nodes may expand into multiple scenes).
* Attach **hard genre obligations** so global coverage can later reach 1.0 (aligned with your acceptance criteria). ([GitHub][1])
* Produce explicit **slots** so detail synthesis has named targets:

  * `{protagonist}`, `{mentor}`, `{ordinary_world}`, `{fear_trigger}`, `{symbolic_object}`, etc.
* Produce a default chapter partition proposal (can be refined later).

### 4.3 DetailSynthesizer (LLM + rules)

**Input**

* `StoryRequest` (user input)
* `story_backbone.json`
* corpus references (optional) for “example-like” grounding
* timeline/element rules (if enabled)

**Output**

* `story_detail_bindings.json`
* updated `story_backbone.json` (slots bound, now “instantiated backbone”)

**Constraints**

* Must not violate hard constraints or anti-pattern blocks (same philosophy as writer/validator).
* Must produce registries that support continuity checks later.

### 4.4 ChapterAssembler (LLM + deterministic stitching)

**Input**

* instantiated backbone
* scene drafts (from writer loop)
* validation results + repair directives (existing loop) ([GitHub][1])

**Output**

* `chapters/chXX.md`
* `chapters/manifest.json`

**Two-phase strategy**

1. **Stitch** scenes into a chapter doc using deterministic ordering + required separators + metadata blocks.
2. **Editorial pass** per chapter:

   * smooth transitions
   * ensure consistent tense/voice
   * enforce recap policy (none / light / explicit)
   * keep evidence tags for traceability (do not delete compliance metadata; move to footers)

This is where you get “agent iterates over and integrates the text into several final chapter documents.”

---

## 5. Style, Vocabulary, and “tfeatures” Integration

You described merging with “styles, genre, common vocabulary, timeline knowledge… passed to tfeatures.”

I’m going to treat **tfeatures** as **text features**: reusable, composable instruction blocks that alter narrative voice and surface-level realizations while preserving the backbone.

### 5.1 Define “Feature Packs”

Add a new concept:

* `data/features/` (or `data/styles/`) containing modular packs:

  * voice (first-person noir, distant third, comedic asides)
  * diction constraints (avoid modern slang, high-formality)
  * motif injectors (recurring symbols)
  * pacing rules (short sentences in action, longer in reflection)

Each feature pack should compile into:

* **prompt fragments**
* **validation heuristics** (optional)
* **lexicon preferences** (preferred terms / banned terms)

### 5.2 Feature Selection + Binding

During BackboneAssembler:

* choose feature packs based on:

  * genre tone nodes (tone integration already exists in cross refs) ([GitHub][2])
  * user preferences (from `StoryRequest`)
* attach them:

  * globally
  * and optionally per-beat (“use sparse prose here”, “dialogue-heavy here”)

### 5.3 Common Vocabulary Integration

Your corpus already emphasizes controlled vocabularies and ID conventions. ([GitHub][2])
Extend that concept to writing output:

* define a `lexicon` block in `StoryContract` or `story_backbone.json`:

  * canonical names for recurring concepts
  * prohibited synonyms (for continuity)
  * title-case / naming rules for places, organizations, magic systems, etc.

---

## 6. Timeline Knowledge: Where It Enters

Your timeline model explicitly exists to bridge archetype structure to concrete moments with participants and state transitions. ([GitHub][3])

### 6.1 Minimal integration path (recommended)

* In `story_backbone.json`, add `moment_stub` per beat:

  * `archetype_node`
  * expected participant roles (template timeline concept)
  * expected transitions (learns/gains/loses/etc.) ([GitHub][3])

Then:

* DetailSynthesizer binds role slots → actual entities
* Writer Agent receives:

  * the moment spec
  * the participants present
  * what changed in prior moments
* Validator adds continuity checks (you already planned this). ([GitHub][3])

### 6.2 Full integration path (later)

* Maintain a master `timeline_instance.json` emitted per run
* Derive character/subplot timelines as computed views (already described as derived). ([GitHub][3])

---

## 7. Prompting / Agent Roles (Practical)

Your story_design already specifies writer/validator prompts and a scene metadata footer template. ([GitHub][1])
This design adds two new agent prompts:

### 7.1 DetailSynthesizer Prompt

**Input**

* backbone slots + constraints + feature packs + user request

**Output**

* JSON bindings only (no prose)
* Must include:

  * entity registry
  * slot bindings
  * any unresolved “unknowns” as explicit TODO slots (bounded list)

### 7.2 ChapterAssembler Prompt

**Input**

* ordered scene texts (already validated)
* per-chapter goals
* feature packs (voice consistency)
* chapter transition rules

**Output**

* markdown chapter text with:

  * minimal scene separators
  * optional “scene metadata footers” preserved (can be appended at end of chapter)

---

## 8. Implementation Plan: How This Fits Your Existing Phases

You already have Phase 1–2 fully sketched for artifacts/corpus loader and selection/contract compilation. ([GitHub][4])
This design inserts **two new phases** between your current Phase 2 and Phase 3/4, without breaking the architecture:

### Phase 2.5 — TemplateCompiler

* Implement `TemplateCompiler`
* Emit `template_pack.json`
* Add schemas + TS types

**Verification**

* Template pack is deterministic and stable under same corpus hash/run config.

### Phase 2.6 — BackboneAssembler + DetailSynthesizer

* Implement `BackboneAssembler` to emit `story_backbone.json`
* Implement `DetailSynthesizer` to emit `story_detail_bindings.json` and update backbone

**Verification**

* Backbone includes:

  * full ordered beats
  * assigned hard/soft obligations
  * slots + bindings
* No hard constraint contradictions introduced

### Phase 4.X — ChapterAssembler

(This comes after writer/validator/repair loop exists.)

* Implement `ChapterAssembler`
* Emit chapter docs + manifest

**Verification**

* Chapters are reproducible given fixed scene drafts
* Chapter docs preserve traceability metadata (even if moved)

---

## 9. Folder / File Layout Additions

Under the existing planned layout: ([GitHub][1])

```
app/src/generation/
  engine/
    templateCompiler.ts
    backboneAssembler.ts
    detailSynthesizer.ts
    chapterAssembler.ts
  artifacts/
    types.ts                       (extend)
    schema/
      template_pack.schema.json
      story_backbone.schema.json
      story_detail_bindings.schema.json
      chapters_manifest.schema.json
```

Optional data additions:

```
data/
  features/                        # voice + style + motif packs (new)
    index.md
    voice_noir.json
    voice_epic.json
    pacing_fast.json
```

Timeline-related additions already specified in your timeline doc would live under archetypes. ([GitHub][3])

---

## 10. Acceptance Criteria (Specific)

A run is successful when:

1. **All artifacts validate** against JSON schemas (existing criterion extended). ([GitHub][1])
2. `template_pack.json` is deterministic: same corpus hash + config → same template pack.
3. `story_backbone.json`:

   * contains a complete ordered beat list covering the chosen archetype spine
   * assigns all **hard** constraints somewhere in the backbone (coverage plan exists even before writing)
4. `story_detail_bindings.json`:

   * binds all required slots, or marks them as explicit bounded TODOs
   * emits registries usable for continuity validation
5. Chapter outputs:

   * every scene is present exactly once in chapter docs
   * chapter manifest correctly maps scenes → chapters
   * metadata required for trace/compliance is preserved

---

## 11. Key Design Choices (Tradeoffs)

### Determinism vs LLM freedom

* TemplateCompiler + BackboneAssembler should be *mostly deterministic* so the backbone is stable and auditable, matching your design philosophy. ([GitHub][1])
* Let the LLM be creative in **detail synthesis** and **scene prose**, but only within artifact constraints.

### Slot-first is the main unlock

Your new features become tractable when the backbone contains **explicit slots** (entities, motifs, conflicts, knowledge reveals, etc.). Slots are the glue between:

* archetype templates
* genre obligations
* timeline participation rules
* style packs
* user-specific details

### Chapter assembly is editorial, not structural

Do not let chapter assembly rewrite structure. It should:

* stitch + smooth
* preserve compliance traces
* only request repairs when a validator flags real issues

---

## 12. Suggested Next Concrete Steps (Minimal Path)

1. Add schemas/types for the four new artifacts.
2. Implement TemplateCompiler (deterministic extraction from corpus).
3. Implement BackboneAssembler (composition + slot emission).
4. Implement DetailSynthesizer (LLM JSON-only bindings).
5. Integrate these into the CLI runner modes (`--mode backbone|draft|chapters`) (already planned). ([GitHub][1])
6. After writer/repair loop exists, add ChapterAssembler.

If you want, I can draft the exact JSON schemas for `template_pack`, `story_backbone`, and `story_detail_bindings` in the style you’re already using for artifact schema files. ([GitHub][4])

[1]: https://github.com/bonjohen/story_v5/blob/main/docs/story_design.md "story_v5/docs/story_design.md at main · bonjohen/story_v5 · GitHub"
[2]: https://github.com/bonjohen/story_v5 "GitHub - bonjohen/story_v5: Story archetype graphs and genre depth graphs — formal directed graph models of storytelling structures · GitHub"
[3]: https://github.com/bonjohen/story_v5/blob/main/docs/story_elements_and_timelines.md "story_v5/docs/story_elements_and_timelines.md at main · bonjohen/story_v5 · GitHub"
[4]: https://github.com/bonjohen/story_v5/blob/main/docs/story_generation_plan.md "story_v5/docs/story_generation_plan.md at main · bonjohen/story_v5 · GitHub"
