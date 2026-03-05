# Chapter Stories: From Snapshots to Living Worlds

*How series, lore, and canon turn single runs into ongoing narratives. Estimated listening time: 12 minutes.*

---

## The problem with a single run

Up to this point, every story the pipeline generates is a one-shot. You pick an archetype, pick a genre, maybe tweak the tone — and the system produces a complete narrative from beginning to end. When it's done, the slate is blank again. Nothing persists. The characters who struggled through twelve scenes vanish the moment the output file is saved.

That's fine for standalone stories. But it breaks down the moment you want something longer — a saga, a series, or even a two-part sequel. If you run the pipeline again with the same settings, it doesn't *remember* the first story. It might invent a new protagonist, contradict established facts, forget that the villain already died. There's no continuity because there's no state.

Chapter Stories solves this. It introduces persistent, accumulating world state so that each new episode is generated *within* the context of everything that came before.

---

## The Series concept

A Series is a container for a long-running narrative. Think of it as a TV show rather than a movie. It has a title, a description, a genre, a tone — and it holds episodes. But unlike a folder of independent stories, a series maintains shared state across all its episodes.

Every series tracks three things. First, an **overarching arc** — a long-running narrative progression through an archetype's phases. If you pick the Hero's Journey, the overarching arc stretches that twelve-phase structure across potentially dozens of episodes. Second, a **story lore** — the accumulated knowledge of the world: who exists, where things are, what's happened. Third, a **canon timeline** — the ordered sequence of episodes that the reader considers "real" in the series continuity.

A series doesn't need to finish in any fixed number of episodes. It grows for as long as you keep generating and canonizing. The overarching arc provides structure and pacing, but within that structure, individual episodes can have their own local arcs, subplots, and complications.

---

## Story Lore: the world's memory

The lore is the heart of what makes a series persistent. It's a structured record of everything the story world contains and everything that's happened in it. The lore has six components.

**Characters** are the most detailed. Each character record tracks a name, aliases, role, description, traits, motivations, and arc type. But it also tracks *state* — whether the character is alive, dead, or transformed. It tracks relationships with other characters, including the current state of each relationship. It tracks possessions — which objects from the lore the character currently holds. It tracks knowledge — what the character knows. And it tracks arc milestones — the significant changes the character has undergone across episodes.

**Places** track the locations of the story world. Each place has a type, an atmosphere, a set of rules that govern what happens there, and connections to other places. When events happen at a location, they accumulate in the place's event history, so the system knows that the castle was besieged in episode three or that the tavern burned down in episode seven.

**Objects** track significant items. A sword, a letter, a crown — anything with narrative significance. Objects have a custody chain: a record of who held them and how they changed hands. If a character stole the amulet in episode four, the lore remembers that, and any future episode can reference it.

**Factions** track groups — guilds, armies, families, political parties. They have members, goals, and relationships with other factions.

**Plot threads** are perhaps the most critical component. A thread is an unresolved narrative question — "Will the heir reclaim the throne?" or "Can the detective find the real killer?" Each thread has a status — open, progressing, resolved, or abandoned — and an urgency level that escalates if the thread is neglected for too long. We'll come back to urgency escalation later.

Finally, **world rules** capture constraints established by the narrative itself. If a story establishes that magic requires blood sacrifice, that's a world rule. Future episodes can't contradict it without the system flagging a consistency violation.

---

## The dual-arc structure

Every episode in a series operates under two narrative arcs simultaneously.

The **overarching arc** is the long game. It's an archetype — Hero's Journey, Tragedy, The Quest, whatever you've chosen — stretched across the entire series. At any given point, the series is in a particular phase of that archetype. If you're running a Hero's Journey series, you might spend three episodes in the Ordinary World, two in the Road of Trials, and so on. The overarching arc determines the macro-level narrative direction: what kind of emotional territory the series is exploring right now.

The **episodic arc** is the short game. Each individual episode has its own local structure — rising tension, complications, a climax, some form of resolution or cliffhanger. The episodic arc gives each episode a satisfying shape even though it's part of a larger whole.

The system weaves these together. When compiling the contract for a new episode, it knows the current overarching arc phase and uses that to set constraints. If the series is in a "Crisis" phase, the episode's local arc needs to deepen the crisis. If the series is approaching "Resolution," the local arc should start closing threads rather than opening new ones.

Arc advancement isn't automatic. There are three modes. In **user-directed** mode, you decide when to move to the next phase. In **auto-milestone** mode, the system proposes advancement when it detects that the current phase's exit conditions are met. In **hybrid** mode, the system suggests and you approve. This keeps you in control of pacing while letting the system do the bookkeeping.

---

## Canon, drafts, and alternates

Not every generated episode becomes part of the story. The canon system gives you curatorial control.

When you generate episodes for a slot — say, episode five — the system can produce multiple candidates. Maybe candidate A sends the protagonist into exile, candidate B has them confront the antagonist directly, and candidate C introduces a new ally. Each candidate is a fully generated episode, complete with its own state changes.

All candidates start as **drafts**. You review them — reading the text, checking the state deltas, comparing how each one would affect the lore. Then you **canonize** one. The canonized episode becomes the official continuation of the story. Its state changes merge into the lore. The other candidates become **alternates** — preserved for reference or potential branching, but not part of the main timeline.

Canonization triggers a precise sequence: the state delta from the chosen episode merges into the lore, a snapshot of the complete lore state is captured (so you can revert if needed), the episode is marked as canon, and the series timeline updates. From this point forward, every future episode generates against the world state that includes this episode's contributions.

You can also **de-canonize** an episode — revert the lore to the prior snapshot and re-open that slot. This is the undo button. It's safe because snapshots are immutable copies, not diffs.

---

## State snapshots and safety nets

Every time an episode is canonized, the system creates a snapshot — a complete copy of the lore and arc state at that moment. Snapshots serve three purposes.

First, they enable **de-canonization**. If you canonize episode six and later decide it was a mistake, the system can revert to the snapshot from after episode five and try again.

Second, they enable **branching**. You can fork the series from any snapshot, creating an alternate timeline that diverges from a particular point. The original series continues unaffected. The branch starts with a copy of the lore at the fork point and evolves independently.

Third, they provide **debugging**. If something goes wrong — a character acts inconsistently, a plot thread disappears — you can inspect snapshots to see exactly when the state changed and what delta caused the problem.

---

## What comes next

This script covered the *what* — what a series is, what lore tracks, how episodes fit into arcs, and how canon works. The next two scripts go deeper. "The Episode Generation Pipeline" explains *how* episodes are actually generated within this framework — how the pipeline compiles lore-aware contracts, extracts state deltas, and validates continuity. "Managing a Series: The Viewer Interface" explains the UI — how you browse, curate, branch, and export your ongoing story through the interactive viewer.
