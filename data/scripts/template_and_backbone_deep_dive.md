# Templates and Backbones: A Deep Dive

*How corpus data becomes composable templates, and how templates become story backbones. Estimated listening time: 12 minutes.*

---

## What a template pack contains

A TemplatePack is a JSON artifact that bundles everything the backbone assembler needs to know about an archetype and a genre. It's derived entirely from the corpus — no creativity, no randomness, no LLM. The same corpus hash and selection always produce the same pack.

The pack has four sections: archetype node templates, genre level templates, tone guidance, and anti-pattern guidance.

---

## Archetype node templates

For each spine node in the selected archetype — that is, every node with an ID number below fifty — the compiler extracts a template. Take the Hero's Journey's "Meeting the Mentor" node, HJ_N03_MENTOR.

The template records the node's role (Catalyst), its label (Meeting the Mentor), and builds a beat summary template from its definition and conditions. The summary reads something like: "Hero meets guide. Preconditions: Call accepted. Must achieve: Guidance received."

The template lists scene obligations — genre constraint nodes that the contract compiler linked to this phase. It lists required elements — if the archetype's elements.json says protagonist and mentor appear at this node, those become placeholder references like "{protagonist}" and "{mentor}". It records signals to include — the textual markers a reader should encounter — and failure modes to avoid — the specific ways this beat can go wrong.

Entry and exit conditions are preserved directly from the graph node. These are the conditions that must be true when the scene begins and the conditions that must be true when it ends.

---

## Genre level templates

For each genre constraint node at levels one through five — the five levels of the genre spine — the compiler extracts a constraint template. Take Science Fiction's Level 4 node "Technology must follow internal rules."

The template records the node ID, level number, label, and severity (hard or soft). The constraint template is the node's definition text. The binding rules are derived from the node's entry and exit conditions — things like "Requires: World established" and "Ensures: Rules demonstrated." If the node has failure modes, those become anti-patterns to block.

Tone marker nodes and anti-pattern nodes are excluded from the level templates. They get their own sections.

---

## Tone and anti-pattern guidance

Tone guidance captures the genre's tone marker node — its ID, description, and a list of directives drawn from the node's definition and signals_in_text fields. For Science Fiction, the tone guidance might say: "Maintains intellectual engagement throughout. Thoughtful narration. Philosophical questions."

Anti-pattern guidance lists each anti-pattern node with its ID, label, and description. For Science Fiction: "Tech as Magic — Technology behaves as unexplained magic." These become explicit blocks that downstream stages must respect.

---

## From templates to backbone

The BackboneAssembler takes a contract and a template pack and produces a StoryBackbone. This is where the abstract corpus knowledge becomes a concrete story structure.

---

## Beat construction

The assembler walks through the contract's spine nodes in order. For each node, it creates a beat. The beat's label, role, and definition come from the template.

The key decision is how many scenes each beat should contain. The assembler uses role-based heuristics. Roles that typically involve complex, multi-part action — Climax, Ordeal, Crisis, Battle, Confrontation, Supreme Ordeal, Dark Night, Transformation — get two scenes by default. Lighter roles — Transition, Bridge, Threshold — get one. Everything else defaults to one.

Each scene gets a unique ID built from the spine node's ID. If a beat has multiple scenes, they get suffix numbers: SCN_HJ_N05_TESTS_01 and SCN_HJ_N05_TESTS_02.

This is configurable. You can pass a defaultScenesPerBeat option to override the heuristics.

---

## Genre obligation distribution

Every hard genre constraint must appear somewhere in the backbone — this is non-negotiable. The assembler distributes them round-robin across all scenes. If there are four hard constraints and six scenes, each of the first four scenes gets one hard constraint.

Soft constraints are distributed the same way but as guidance rather than requirements.

The backbone tracks a coverage plan: hard constraints assigned versus total, soft constraints assigned versus total. In a well-formed backbone, hard_constraints_assigned should equal hard_constraints_total.

---

## Slot extraction

Slots are named placeholders for story elements. The assembler creates them from two sources.

First, the template's required_elements list. If the template for "Meeting the Mentor" includes "{protagonist}" and "{mentor}", those become character slots in every scene of that beat.

Second, the contract's element_requirements. If the contract says the "ordinary_world" place type appears at node HJ_N01_ORDINARY, that becomes a place slot in that beat's scenes.

Each slot records its name, category (character, place, object, or concept), whether it's required, and a description. Before detail synthesis, the bound_value field is empty. After detail synthesis, it contains the concrete name.

---

## Chapter partition

The assembler groups beats into chapters using a three-act structure. Act one gets roughly the first twenty-five percent of beats, act two gets the middle fifty percent, and act three gets the final twenty-five percent.

For very short stories — three beats or fewer — each beat becomes its own chapter.

For longer stories, act two may be split into multiple chapters to prevent any single chapter from being too long.

Each chapter entry includes a chapter ID, a title, the list of beat IDs it contains, a tone goal, and a pace directive. These are defaults — the detail synthesizer or a human editor can refine them.

---

## Style directives

The backbone includes global style directives: voice (default is third-person past tense), pacing (default is balanced), and an optional lexicon with canonical terms, prohibited synonyms, and naming rules.

Feature packs — modular voice and pacing instruction bundles stored in data/features/ — can be attached via the feature_pack_ids field. These propagate to the writer agent as prompt fragments.

Individual scenes can override the global style with per-scene style_overrides — useful for flashbacks, dream sequences, or action set pieces that need a different pacing.

---

## Why this structure matters

The backbone is the bridge between corpus knowledge and generated prose. Without it, the writer agent receives a flat list of constraints and must figure out structure on its own. With the backbone, the writer agent receives a scene that already knows its goal, its genre obligations, its required elements, and its style context.

Every field in the backbone is inspectable and modifiable. If the chapter partition doesn't feel right, adjust it before running the writer. If a slot binding seems wrong, change it. If a genre obligation landed on the wrong scene, move it. The backbone is a draft of structure, not a finished product.
