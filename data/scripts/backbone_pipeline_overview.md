# The Backbone Pipeline

*An overview of the four new generation stages that bridge corpus knowledge to chapter-level output. Estimated listening time: 10 minutes.*

---

## What the backbone pipeline adds

The original generation pipeline moves from a story request through selection, contract compilation, planning, scene writing, validation, and repair. It produces individual scene drafts that satisfy structural constraints. But it leaves two gaps.

The first gap is between the corpus knowledge — all those archetype node definitions, genre constraints, failure modes, and signals — and the generation stages that actually use them. The contract compiler extracts the rules, but those rules arrive as flat lists. There's no intermediate structure that says "this beat should feel like this, use these elements, and satisfy these genre obligations."

The second gap is between individual scene drafts and finished chapter documents. The writer agent produces one scene at a time. Nothing stitches those scenes into chapters with smooth transitions, consistent voice, and editorial polish.

The backbone pipeline fills both gaps with four new stages.

---

## Stage 1: Template compilation

The TemplateCompiler is entirely deterministic — no language model involved. It takes the loaded corpus, the selection result, and the compiled contract, and extracts a TemplatePack.

For each archetype spine node, it pulls the definition, entry conditions, exit conditions, signals in text, and failure modes. It normalizes these into a template with a beat summary, scene obligations, required element slots, signals to include, and failure modes to avoid. If the contract has element requirements — protagonist appears at node one, mentor appears at node three — those become required element references in the template.

For each genre constraint node at levels one through five, it extracts the definition, severity, and conditions, and normalizes them into constraint templates with binding rules and anti-patterns to block. Tone markers and anti-patterns get their own guidance blocks.

The output is a template_pack.json artifact. Because it's deterministic, the same corpus hash and selection always produce the same template pack. This is important for reproducibility — you can verify that your templates haven't drifted.

---

## Stage 2: Backbone assembly

The BackboneAssembler takes the contract and the template pack and produces a StoryBackbone — the single authoritative structure that all later text must follow.

It maps each archetype spine node to a beat, and each beat to one or more scenes. Some archetype roles — climax, ordeal, crisis — typically warrant two scenes. Lightweight roles like transitions get one. This is configurable, but the defaults encode common narrative sense.

It distributes genre obligations across scenes. Every hard constraint must appear somewhere in the backbone. Soft constraints are distributed as guidance. The backbone tracks a coverage plan: how many hard and soft constraints are assigned versus total.

It extracts slots — named placeholders for story elements. If the archetype template says the mentor beat requires a protagonist and a mentor, those become slots in the scene. If the contract's element requirements say "ordinary_world" appears at node one, that becomes a place slot. Each slot records its category (character, place, object, or concept), whether it's required, and a description.

Finally, it builds a default chapter partition using a three-act structure: roughly twenty-five percent of beats in act one, fifty percent in act two, twenty-five percent in act three. Each chapter entry gets a tone goal and pace directive.

The backbone is also deterministic. Same contract plus same template pack equals same backbone.

---

## Stage 3: Detail synthesis

The DetailSynthesizer is the first stage that uses a language model — and it's the only backbone stage that does. It takes the story request, the assembled backbone, and an LLM adapter, and produces StoryDetailBindings.

Its job is to fill every slot with a concrete entity. The protagonist slot becomes "Kira Vasquez, a resourceful engineer." The ordinary_world slot becomes "Station Helios, an aging orbital platform." The mentor slot becomes "Dr. Orin, a secretive xenolinguist."

The output includes an entity registry — characters with names, roles, traits, motivations, and backstory; places with names, types, features, and atmosphere; objects with names, types, significance, and properties. It also includes slot bindings that map each slot name to its bound entity.

For long-form coherence, the synthesizer can generate open mysteries (questions planted early), narrative promises (commitments to the reader), and planned payoffs (where those promises deliver). These are optional but useful for stories longer than a few scenes.

If any required slot can't be filled, it's marked as an explicit unresolved TODO rather than silently skipped. This gives the human operator a clear list of decisions that still need to be made.

The synthesizer also works without an LLM, producing deterministic placeholder bindings. This is useful for testing and for pipeline stages that don't need creative names yet.

---

## Stage 4: Chapter assembly

The ChapterAssembler comes after the existing writer-validator-repair loop has produced validated scene drafts. It takes the instantiated backbone and the scene drafts and produces chapter documents.

Phase one is deterministic stitching. Scenes are ordered by their backbone sequence, grouped by the chapter partition, and joined with scene separators. Each chapter gets a markdown header and a metadata footer that records which scenes it contains — useful for traceability.

Phase two is an optional editorial pass. If an LLM is available, the editorial agent reviews each chapter and smooths transitions between scenes, ensures consistent voice and tense, and applies the chapter's recap policy. The editorial agent is explicitly constrained: it must not change plot events, character actions, or story structure. It polishes prose and fixes seams, nothing more.

The output is a ChapterManifest artifact listing all chapters with their scene mappings, plus the chapter markdown files themselves.

---

## How the stages chain together

In the orchestrator, these four stages slot between the contract compilation and the planner:

Contract Ready leads to Templates Compiled, then Backbone Assembled, then Details Bound, then Planned, then the existing scene writing loop. For the chapters mode, after the trace and compliance report, the orchestrator runs chapter assembly.

Three new early-exit modes give you control over how far the pipeline runs. Backbone mode stops after backbone assembly — useful for reviewing structure before committing to detail synthesis. Detailed-outline mode stops after detail synthesis — useful for reviewing named characters and world elements before generating prose. Chapters mode runs the full pipeline through chapter assembly.

The existing contract-only, outline, and draft modes still work exactly as before. The backbone stages run between contract and plan for all modes except contract-only.

---

## What this means in practice

The backbone pipeline turns the generation system from a flat request-to-scenes pipe into a layered composition engine. At each layer, you can inspect the output, adjust parameters, and re-run. Templates are deterministic and reproducible. The backbone is a concrete structure you can read and modify. Detail bindings give you named entities to review before any prose is written. And chapters give you finished documents rather than loose scene drafts.

The key design principle is slot-first composition. Slots are the glue between archetype templates, genre obligations, timeline rules, style packs, and user details. Everything flows through explicit, named, inspectable slots rather than being buried in prompt text.
