# What This Project Is

*An overview of the narrative structure corpus. Estimated listening time: 8 minutes.*

---

## A corpus of story structure

This project is a structured corpus of narrative knowledge. It takes the patterns that underlie stories — the archetypes, the genre rules, the roles characters play, the constraints that separate a mystery from a romance — and represents them as formal, machine-readable data.

The result is not a writing tool in the conventional sense. There's no text generator, no AI that writes prose for you. Instead, this is an infrastructure layer — a precisely defined model of how stories work, expressed as directed graphs, controlled vocabularies, and cross-reference datasets. Everything is stored as JSON and Markdown, designed to be readable by both humans and software.

If you've ever wished you could query story structure the way you query a database — "show me every archetype where the protagonist faces an irreversible cost before the climax" or "which genres require a fair-clueing scene obligation?" — that's what this project enables.

---

## What the corpus contains

The corpus has three major components.

**Fifteen archetype graphs.** Each one models a fundamental plot structure — the Hero's Journey, Tragedy, the Quest, Rags to Riches, Comedy, and ten others. An archetype graph is a directed graph where the nodes are story phases and the edges are causal transitions. The Hero's Journey, for example, has eleven nodes running from Ordinary World through Call to Adventure, Crossing the Threshold, the Ordeal, and on to Return with the Elixir. Every node has a role from a controlled vocabulary, entry and exit conditions, failure modes, and signals for identifying the phase in an actual work. Every edge has a causal meaning — not just "and then," but "forces commitment" or "triggers crisis" or "enables transformation."

**Twenty-seven genre depth graphs.** These model genre constraints rather than temporal progression. A genre graph is a hierarchy with five levels: Genre Promise at the top, then Core Constraints, Subgenre Patterns, Setting Rules, and Scene Obligations at the bottom. Horror's genre promise is "fear and dread." Its core constraints include "threat must be present and escalating" and "sustained dread atmosphere." Its subgenre patterns branch into Slasher, Supernatural, Cosmic, and others. Its setting rules specify things like "isolation amplifies threat." Its scene obligations require specific beats like the first scare. Each constraint is classified as hard (non-negotiable) or soft (adjustable), and the system tracks which constraints conflict when genres are blended.

**Controlled vocabularies and cross-references.** The vocabularies define the exact terms every graph is allowed to use — fourteen archetype node roles, fifteen archetype edge meanings, seven genre node roles, twelve genre edge meanings. These shared dictionaries are what make the corpus internally consistent and enable cross-referencing. The cross-reference datasets then connect everything: a genre-archetype compatibility matrix scoring all four hundred and five pairings, a genre blending model for eighteen genre combinations, emotional arc profiles, hybrid archetype patterns, tone integration mappings, and a registry of example works mapped against the graphs.

---

## The interactive viewer

The corpus also includes a web-based viewer built with React, TypeScript, and Cytoscape.js. The viewer renders any graph as an interactive node-link diagram. You can click nodes to see their definitions, entry conditions, and failure modes. You can run simulations that walk through a graph phase by phase, showing how a story progresses. You can explore cross-references — click an archetype and see which genres it pairs well with, or click a genre and see its blending stability with other genres.

The viewer also includes story generation capabilities. You can select an archetype, a genre, and a tone, and the system will compile a story contract — the complete set of structural rules your combination must follow. It will then generate a beat-by-beat plan, populate it with characters and settings drawn from element templates, and produce a compliance trace showing which rules are satisfied and which are at risk.

---

## Who this is for

**Writers** can use the corpus to understand why certain story structures work and others don't. The failure modes in every archetype node are essentially a diagnostic checklist — if your second act feels flat, check whether your Trial nodes are creating genuine escalation or just repetition. The genre constraint hierarchies make implicit reader expectations explicit and testable.

**Developers** can build on the corpus as a data layer. The JSON graphs follow a consistent schema, every ID follows a documented naming convention, and the controlled vocabularies ensure that any tool built against this data will work across all forty-two graphs. The viewer's source code demonstrates one way to render and interact with the data, but the corpus is designed to support many applications.

**Researchers** interested in narrative theory can use the cross-reference datasets for comparative analysis. The cross-archetype index shows how the same structural roles — Origin, Crisis, Transformation — manifest differently across fifteen plot structures. The genre blending model documents the constraint conflicts that arise when genres are mixed, and classifies each blend as stable, conditionally stable, or unstable.

**Educators** can use the walkthrough scripts, the simulation panel, and the example mappings to teach story structure through interactive exploration rather than static diagrams.

---

## What this is not

This project does not claim that all stories reduce to fifteen archetypes or twenty-seven genres. The corpus is a model — a useful simplification that captures enough structure to be productive without pretending to be exhaustive. Real stories blend, subvert, and transcend these categories. The value is in making the underlying patterns explicit enough to reason about, not in imposing rigid templates.

The generation pipeline produces structural plans, not finished prose. It tells you that your Hero's Journey / Science Fiction story needs a Threshold crossing where the protagonist commits to the special world, and that your Fantasy genre contract requires a magic system with costs. It does not write the scenes. The creative work remains yours.
