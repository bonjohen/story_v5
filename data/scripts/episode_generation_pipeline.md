# The Episode Generation Pipeline

*Lore-aware compilation, state deltas, and cross-episode validation. Estimated listening time: 11 minutes.*

---

## How episode generation differs

Single-run story generation is stateless. The pipeline receives a contract — archetype, genre, tone, element templates — and produces a complete story. It doesn't need to know about anything that came before because nothing came before.

Episode generation is lore-aware. Before writing a single sentence, the pipeline loads the accumulated world state — every character, place, object, faction, plot thread, and world rule from prior episodes. That lore shapes every stage of generation, from contract compilation to scene writing to validation.

The pipeline follows a ten-state orchestration sequence. Let's walk through each one.

---

## Loading the world

The first two states are about loading context. The orchestrator begins in **LOADING_BIBLE** — it reads the series lore and arc state from disk. This gives it the current cast of characters, the map of places, the inventory of significant objects, the active plot threads and their urgency levels, and the current phase of the overarching arc.

Then it enters **LOADED_CORPUS** — loading the graph corpus itself. The archetype graph for the series' overarching arc, the genre depth graph, the cross-reference datasets. This is the same corpus the single-run pipeline uses, but now it's loaded alongside persistent world state.

---

## Selection and contract compilation

In **SELECTED**, the system runs the selection engine. For a series episode, this is partly constrained by the series configuration — the primary genre, the overarching archetype — but there's room for variation. Secondary genre accents can shift between episodes. The tone marker can modulate. These decisions happen here.

Then comes **CONTRACT_READY**, and this is where episode generation diverges most sharply from single-run. The episode contract compiler extends the standard contract with four categories of lore constraints.

**Character constraints** specify who must appear and who must not. If a character died in a prior episode, they're in the must-not-appear list. If a character has an unresolved relationship or a critical plot thread tied to them, they may be required to appear. The compiler also carries forward each character's current status, location, and relationships so the writer prompts don't contradict established facts.

**World rule constraints** are non-negotiable. If the lore says magic requires blood sacrifice, the contract includes that as an enforceable rule. The generated episode can't introduce a character casting spells for free.

**Thread obligations** are the most nuanced. The compiler examines every open and progressing plot thread, considers its urgency level, and assigns obligations for the episode. A critical-urgency thread might get a "must advance" obligation. A low-urgency thread might get "may reference." A thread whose resolution conditions are now met might get "should resolve." These obligations flow into the episode plan and ultimately into scene goals.

**Arc phase context** carries the current overarching phase — its definition, entry conditions, exit conditions, and what kind of narrative movement is appropriate. If the series is in the "Road of Trials" phase, the contract says so, and the planner knows to build obstacles rather than resolutions.

---

## Planning with lore

The **PLANNED** state is where the episode's structure takes shape. The episode planner works much like the single-run planner — it maps archetype nodes to scenes, assigns beats, determines pacing — but with a critical difference: the element roster comes from lore first.

Instead of creating a fresh protagonist, the planner checks the lore for existing characters who fill the needed roles. The protagonist is already established. The mentor might be an existing character. A new threshold guardian might be needed, and only then does the planner create one — flagging it as a new lore entity to be tracked going forward.

The same applies to places and objects. If the archetype template calls for a "sanctuary" setting, the planner checks whether the lore already has a place of type sanctuary. If so, it reuses it. The result is narrative continuity — the protagonist retreats to the same haven they discovered three episodes ago, not a newly invented one.

Plot thread obligations weave directly into beat and scene goals. If the contract says "advance the succession thread," the planner assigns that advancement to specific scenes. If a thread needs resolution, the planner builds a scene structure that can accommodate closure. This is how the macro-level narrative (overarching arc, thread obligations) translates into micro-level structure (this scene, this beat, this moment).

---

## Writing and validating scenes

**GENERATING_SCENE**, **VALIDATING_SCENE**, and **REPAIRING_SCENE** work similarly to single-run, but with lore-enriched context. Writer prompts include character backgrounds, relationship states, and relevant history from prior episodes. Validation checks not just internal consistency within the episode but also consistency with accumulated lore.

After all scenes are generated, the system enters **BIBLE_VALIDATING** — a final pass that checks the complete episode against the lore. Are dead characters still dead? Do object custody chains hold up? Does the episode contradict any established world rules? If violations are found, the system flags them for repair before proceeding.

---

## Extracting state deltas

The **EXTRACTING_DELTAS** state is unique to episode generation. It's where the system figures out what changed.

The state extractor analyzes the episode's scenes and transitions, producing a structured delta — a precise record of every state change the episode introduces. The delta has several categories.

**Characters introduced** lists any new characters who appeared for the first time. Each gets a full initial record — name, role, traits, relationships — ready to be merged into the lore.

**Character updates** captures changes to existing characters. A character might have gained new knowledge, lost a possession, formed a new relationship, broken an old one, changed status from alive to dead, or reached an arc milestone. Each change is recorded as a discrete update.

**Places introduced and updated** works the same way. New locations get initial records. Existing locations might gain new events, change status, or establish new connections to other places.

**Objects introduced and updated** tracks new items and custody changes. If a character gave the sword to another character, the delta records that transfer.

**Threads introduced and updated** captures new plot threads opened by the episode and status changes to existing threads. A thread might have progressed, resolved, or been abandoned.

**Arc phase change** is optional. If the episode triggers advancement to the next overarching arc phase, the delta records that too.

---

## Plot thread lifecycle

Plot threads deserve special attention because they're the primary mechanism for long-form narrative coherence.

A thread is born when the narrative opens a question — "Who poisoned the king?" or "Will the alliance hold?" It starts with status "open" and urgency "low." As episodes pass, the thread lifecycle unfolds.

If an episode advances the thread — provides new clues, escalates the conflict, deepens the mystery — the thread moves to "progressing" status. Each progression is recorded with the episode ID, so the system knows exactly when and how the thread was advanced.

If a thread is neglected — no episode mentions it for several episodes in a row — the urgency escalates automatically. Low becomes medium after three stale episodes. Medium becomes high after two more. High becomes critical after two more. Critical urgency means the contract compiler will assign a "must advance" obligation. The narrative can't keep ignoring this thread.

The system tracks **thread health** as an aggregate metric. It computes how many open threads were recently progressed versus how many are stalling. A healthy series has a health ratio above zero point six — most threads are getting attention. A critical series is below zero point three — too many threads are being ignored. This metric appears in the series dashboard as a quick diagnostic.

Resolution conditions are defined when a thread is created. They describe what must happen for the thread to close — "the murderer is identified and confronted" or "the alliance formally disbands." When those conditions are met, the thread can be resolved, and the planner knows to build toward closure.

---

## Canonization and the lore merge

The final two orchestrator states are **AWAITING_CURATION** and **CANONIZING**.

In awaiting curation, the generated episode — along with its delta — is presented as a candidate. You might generate multiple candidates for the same slot, comparing how each would affect the world state. This is where curatorial judgment matters. One candidate might kill a beloved character. Another might resolve a thread too early. You choose based on both story quality and strategic state impact.

When you canonize, the lore merge engine takes over. It applies the delta to the current lore using immutable operations — creating a new lore state rather than mutating the existing one. Character updates are merged: new relationships added, knowledge expanded, possessions transferred. Place and object states update. Thread statuses change. If the delta includes an arc phase change, the overarching arc advances.

After merging, the system creates a snapshot — a frozen copy of the complete lore and arc state at this moment. The episode is marked as canon. The series timeline updates. And the cycle is ready to begin again for the next episode, now generating against a world that's one chapter richer.
