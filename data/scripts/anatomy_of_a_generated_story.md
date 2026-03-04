# Anatomy of a Generated Story

*An audio-friendly walkthrough of what happens at each pipeline stage. Estimated listening time: 12 minutes.*

---

## The request

Let's trace a single story through the entire generation pipeline, step by step. We'll use the simple sample request — a young engineer who discovers that her space station's AI has developed consciousness and must decide whether to report it or protect it. The genre is Science Fiction. The archetype is the Hero's Journey. The tone is somber. The length target is short story. Must-include constraints are "found family" and "ethical dilemma." Must-exclude is "time travel." Genre blending and hybrid archetypes are both disabled.

When you run this through the pipeline, eight things happen in sequence.

---

## Stage 1: Load the corpus

The orchestrator starts in the IDLE state and immediately transitions to LOADED_CORPUS. The corpus loader reads all forty-two graphs — fifteen archetypes and twenty-seven genres — plus all thirteen cross-reference files, the eleven controlled vocabularies, all fifteen archetype element templates, and the ten genre element constraint files. Everything goes into a single LoadedCorpus object in memory.

The loader uses a DataProvider interface. In the command line, that's a filesystem reader. In the browser, that's HTTP fetch. Either way, the result is identical — a fully loaded, validated corpus.

The loader also computes a stable hash of the corpus content. This hash is stamped into every artifact the pipeline produces, so you can verify later that the story was generated against a specific version of the data.

---

## Stage 2: Selection — choosing the combination

The orchestrator transitions to SELECTED. The selection engine takes the request and the corpus and scores the requested genre-archetype combination.

First, it looks up "Science Fiction" plus "The Hero's Journey" in the compatibility matrix. The matrix says this pairing is "naturally compatible" — Science Fiction's emphasis on discovery and wonder aligns well with the Hero's Journey's structure of departure, transformation, and return. That gives a base score of one-point-zero on a zero-to-one scale.

Next, it checks tone integration. Somber tone with the Hero's Journey — the tone integration file classifies this as "neutral." A somber tone neither reinforces nor fights the Hero's Journey's natural emotional arc, which is hopeful overall. The tone adjustment is zero, so the score stays at one-point-zero.

Since genre blending is disabled, the selection engine skips blend evaluation. Since hybrid archetypes are disabled, it skips hybrid evaluation. It finds the tone marker node for Science Fiction — the "sense of wonder and intellectual engagement" tone node — and records the integration classification.

The output is a SelectionResult artifact: primary archetype is the Hero's Journey, primary genre is Science Fiction, compatibility is naturally compatible, tone marker is identified, no blend, no hybrid.

---

## Stage 3: Contract — compiling the rules

The orchestrator transitions to CONTRACT_READY. The contract compiler takes the selection result and builds a StoryContract — the full set of enforceable rules for this story.

The archetype section extracts the Hero's Journey's spine — all eleven nodes in traversal order — plus the required roles, allowed variant nodes from the variants file, and all ten required edges. The story must pass through these phases.

The genre section extracts Science Fiction's constraint hierarchy — the Genre Promise, Core Constraints split into hard and soft, Subgenre Patterns, Setting Rules, and Scene Obligations. It separates hard constraints from soft constraints. Hard constraints are things like "speculative element must be central, not decorative" and "the world must operate by consistent internal rules." Soft constraints are things like choosing a specific subgenre.

The global boundaries section compiles the user's must-include and must-exclude lists. "Found family" and "ethical dilemma" become musts. "Time travel" becomes a must-not. The audience specification — adult, no content limits — becomes style limits.

The element requirements section is new. The compiler reads the Hero's Journey's `elements.json` and extracts the template roles — protagonist (required), mentor (required), shadow (required), ally (optional), and so on. Each requirement lists which archetype nodes it appears at and whether it's required or optional. It also reads Science Fiction's `element_constraints.json` and extracts the genre's element requirements — technology objects, a special world shaped by the speculative premise, and testable rules like "the speculative element must be central to the conflict." These element requirements are added to the contract alongside the structural constraints.

The phase guidelines are where archetype meets genre. For each node in the Hero's Journey spine, the compiler looks up the node's role, definition, entry conditions, exit conditions, failure modes, and signals in text from the archetype graph. Then it identifies which genre constraint nodes are most relevant to that phase and links them as genre obligation references. The Ordeal phase, for instance, links to Science Fiction's "speculative element must be central" constraint — the crisis of the story must involve the speculative premise, not just mundane danger.

The validation policy sets the checking rules: hard constraints are required, anti-patterns are blocking, tone is globally enforced, entry and exit conditions are required, signals in text are checked in "soft" mode, and element continuity checks are enabled.

The output is a StoryContract artifact. This is the document that every subsequent stage is checked against.

---

## Stage 4: Planning — beats and scenes

The orchestrator transitions to PLANNED. The planner takes the contract and builds a StoryPlan.

First, it creates the beat sheet. Each beat maps to an archetype node. For the Hero's Journey, that's eleven beats. Each beat gets a summary — a short description of what this part of the story is about. With an LLM available, the summaries are enriched with story-specific detail drawn from the premise. Without an LLM, the summaries are derived from the node definitions.

Each beat also gets emotional target scores from the archetype emotional arcs data. The Ordinary World beat targets low tension, moderate hope, low fear, zero resolution. The Ordeal beat targets high tension, low hope, high fear, zero resolution. These guide the writer's tone scene by scene.

The planner now builds an **element roster** — the named characters, places, and objects that fill the contract's template roles. The protagonist gets a name, traits, and motivations derived from the premise. The mentor, shadow, and allies are populated. Settings are assigned to place type slots. Key objects are created.

Then the planner creates scenes. Each beat gets one or more scenes depending on the length target. For a short story, most beats get one scene, though key beats like Trials and the Ordeal might get two. Each scene is assigned a setting, characters, objects, and a scene goal derived from the beat and the premise. The planner uses the template timeline from `elements.json` to determine which characters and objects should be present at each beat — the Ordeal scene gets the protagonist and shadow, the Mentor scene gets the protagonist, mentor, and talisman.

Each scene also gets its constraint checklist — the specific hard constraints, soft constraints, and must-not items it's responsible for satisfying. The planner distributes genre constraints across scenes so that every hard constraint is covered by at least one scene and soft constraints reach their target coverage. For the user's must-include items, the planner assigns them to the scenes where they naturally fit — "ethical dilemma" goes to the Ordeal scene, "found family" goes to the Trials scene where alliances form.

The output is a StoryPlan artifact with the full beat sheet and scene list.

---

## Stage 5: Writing — generating prose

If the mode is "contract-only," the pipeline stops at stage three. If the mode is "outline," it stops at stage four. In "draft" mode, we continue to writing.

The orchestrator transitions to GENERATING_SCENE and loops through each scene. For every scene, the writer agent receives the scene's metadata — setting, characters, objects, goal, archetype trace, genre obligations, constraint checklist, target emotional scores, and **element context** — and generates prose.

The element context is new. It includes the full element roster for the scene — who's there, their roles, traits, and motivations. It includes **character state notes** accumulated from prior scenes' transitions — what each character has learned, gained, or lost so far. If the mentor died in a previous scene, the writer knows. If the protagonist gained a talisman two scenes ago, the writer knows who holds it. This prevents anachronistic knowledge and maintains emotional continuity.

The writer agent sends a structured prompt to the LLM. The prompt includes the contract's global boundaries, the specific scene's checklist, the element context, the previous scene's ending for continuity, and instructions to write prose that satisfies all constraints while staying within the emotional targets. The LLM returns scene prose.

The output is a collection of scene drafts — one Markdown file per scene.

---

## Stage 6: Validation — checking every scene

The orchestrator transitions to VALIDATING_SCENE. The validation engine takes each scene draft and checks it against the contract.

Nine types of checks run on every scene.

**Hard constraints:** Does the scene satisfy all the hard genre constraints it was assigned? The validator looks for evidence of each constraint in the prose. For a scene assigned the "speculative element is central" constraint, it checks whether the AI consciousness premise is driving the scene's conflict, not just sitting in the background.

**Anti-patterns:** Does the scene trigger any genre anti-pattern nodes? For Science Fiction, the anti-pattern is "speculative element is purely decorative." If the scene mentions the AI but doesn't engage with it meaningfully, that's a violation.

**Tone:** Does the scene maintain the genre's required tone? For Science Fiction, that's "wonder and intellectual engagement." For the user's requested somber tone, the validator checks that both registers are present — wonder at the AI's consciousness, tempered by the somber weight of the decision.

**Entry and exit conditions:** Does the scene's content satisfy the archetype node's entry conditions at the beginning and exit conditions at the end? If the scene maps to the Threshold node, the exit condition is "the protagonist is fully in the special world with no easy return." The validator checks the prose for evidence of irreversibility.

**Signals in text:** Are the expected textual signals present? For the Ordeal, signals include "apparent defeat," "moment of despair," "drawing on deep reserves." The validator scans for these patterns.

**Element continuity:** Can a character logically be where the scene says they are? If scene three has the protagonist arriving at the space station, and scene four places them on a planet with no departure, that's a continuity error.

**Element mortality:** Dead characters don't participate in subsequent scenes. If the mentor dies at the Ordeal, the mentor can't appear in the Road Back. The validator tracks "dies" transitions and flags post-mortem participation.

**Object custody:** Objects have a traceable chain of possession. If the protagonist gains a device in scene two and the antagonist uses it in scene five, there must be an intervening handoff.

**Relationship consistency:** Character relationships shouldn't contradict — two characters can't be both ally and nemesis simultaneously, unless one is explicitly a shapeshifter.

Each check produces a pass, warn, or fail. The output is a ValidationResults artifact with per-scene results and global coverage statistics — what percentage of hard constraints were satisfied across the whole story, what percentage of soft constraints, how many anti-pattern violations, how many tone warnings, and how many element continuity issues.

---

## Stage 7: Repair — fixing failures

If any scene has failing checks, the orchestrator transitions to REPAIRING_SCENE. The repair engine takes the failing scene, the specific failures, and the contract, and decides what to fix.

If the failures are minor — a missing signal, a tone drift — the repair engine generates a targeted edit prompt. It tells the LLM: "This scene failed the tone check because the middle paragraph shifts to an action-adventure register. Revise that paragraph to maintain the somber, intellectually engaged tone while preserving the plot content." The LLM returns a revised scene.

If the failures are fundamental — a missed hard constraint, an anti-pattern violation — the repair engine triggers a full rewrite with the constraint checklist re-emphasized in the prompt.

After repair, the scene goes back through validation. This can loop up to the configured maximum — two attempts per scene by default. If the scene still fails after maximum repairs, it's flagged in the compliance report and the pipeline moves on.

---

## Stage 8: Tracing — building the audit trail

Once all scenes are generated, validated, and repaired, the orchestrator transitions to COMPLETED. The trace engine builds the final audit trail.

For every scene, the trace records which archetype node and edges it maps to, which genre constraints it satisfies, and which tone marker it maintains. This is the provenance record — you can trace any paragraph of prose back to the structural rules that required it.

The trace engine also generates the compliance report — a human-readable Markdown summary. It opens with the overall status: pass, warn, or fail. Then coverage metrics — hard constraint coverage as a percentage, soft constraint coverage as a percentage, anti-pattern violations count, tone warnings count. Then a per-scene breakdown showing which checks passed and which didn't.

---

## What you get

When the pipeline finishes, the output directory contains seven files.

The **request** — your original input, for reproducibility. The **selection result** — which combination was chosen and why. The **story contract** — the full set of rules. The **story plan** — the beat sheet and scene assignments. The **scene drafts** folder — the actual prose. The **validation results** — per-scene check outcomes. The **story trace** — the full audit trail. And the **compliance report** — the human-readable summary.

Every file is JSON except the scene drafts, which are Markdown, and the compliance report, which is also Markdown. Every file carries the run ID and corpus hash for traceability.

The whole system is designed so that you can start from the compliance report, identify any issues, trace them back through the validation results to the specific scene and check that failed, look up the relevant constraint in the contract, and understand exactly why the pipeline flagged it. Full traceability from prose to structure.

---

## The three modes in practice

**Contract-only** gives you the request, selection result, and story contract — no LLM required. Use this to explore what constraints a genre-archetype combination actually imposes before committing to generation.

**Outline** adds the story plan with beats and scenes — the LLM enhances summaries but the structural scaffolding is deterministic. Use this when you want a framework to write from yourself.

**Draft** runs the full pipeline — writing, validation, repair, and tracing. Use this when you want a complete generated story with full compliance documentation.

Each mode includes everything the previous mode produces, so a draft run also gives you the contract and plan for free.
