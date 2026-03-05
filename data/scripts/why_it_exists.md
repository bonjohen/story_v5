# Why It Exists

*The motivation behind formalizing narrative structure. Estimated listening time: 7 minutes.*

---

## The problem with informal advice

Story structure advice is everywhere. Writing guides tell you to "raise the stakes in the second act" or "make sure your protagonist has a flaw." Workshop feedback says "the pacing feels off" or "I lost track of the stakes." These observations are often correct, but they share a fundamental limitation: they're imprecise, inconsistent, and impossible to verify systematically.

Ask five writing instructors what the "midpoint reversal" means, and you'll get five different answers. Ask whether a particular scene counts as a threshold crossing, and you'll get a conversation rather than a clear yes or no. This isn't because writing instructors are wrong — it's because the vocabulary is informal. There's no shared, precise definition of what a threshold crossing requires, what distinguishes it from a mere plot point, or how to test whether a draft actually has one.

The consequence is that structural analysis stays intuitive. Experienced writers develop reliable instincts, but those instincts are hard to teach, hard to verify, and impossible for software to work with.

---

## Why directed graphs

This project takes the core insight of structural narrative theory — that stories follow recognizable patterns of phases and transitions — and expresses it as directed graphs.

A directed graph is a set of nodes connected by edges that have direction. Node A connects to Node B, not the other way around. This is exactly the right structure for modeling stories because stories are causal sequences, not just ordered lists. The Hero's Journey doesn't just happen to have an Ordeal after the Road of Trials — the trials create the conditions that make the Ordeal possible. The edge between them carries a meaning: "triggers crisis." Remove the trials and the crisis doesn't make sense.

Contrast this with a beat sheet or a numbered list of plot points. A list tells you the order. A graph tells you the causation. The entry conditions on each node specify what must be true before the story can enter that phase. The exit conditions specify what must be true before it can leave. These conditions create a chain of logical dependencies, not just a sequence. You can look at any node in isolation and determine whether a draft satisfies its requirements.

Genre structures benefit from graphs even more. A genre isn't a sequence — it's a hierarchy of constraints. Horror's promise of "fear and dread" generates core constraints like "threat must escalate." Those constraints branch into subgenre patterns — Slasher, Supernatural, Cosmic — each with its own additional rules. Those rules generate setting requirements and scene obligations. A tree-shaped graph captures this naturally. A flat list of genre conventions cannot.

---

## Why controlled vocabularies

The second design decision is controlled vocabularies — fixed sets of terms that every graph must use.

There are fourteen archetype node roles: Origin, Disruption, Threshold, Trial, Revelation, Reversal, Commitment, Crisis, Transformation, Irreversible Cost, Resolution, Descent, Catalyst, and Reckoning. Every node in every archetype graph is assigned exactly one. This means you can meaningfully ask "how does Crisis work across all fifteen archetypes?" and get a coherent answer, because the word "Crisis" means exactly the same thing everywhere it appears.

There are fifteen archetype edge meanings, seven genre node roles, and twelve genre edge meanings. Together, these vocabularies enforce consistency across forty-two graphs and thousands of individual nodes and edges. They also enable the cross-reference datasets — the compatibility matrix, the cross-archetype index, the constraint index — because shared terms create a common language for comparison.

Without controlled vocabularies, each graph would use its own terminology, and cross-referencing would require manual translation. With them, the entire corpus becomes a queryable, interconnected system.

---

## What formalism buys you

The combination of directed graphs and controlled vocabularies produces several capabilities that informal analysis cannot.

**Querying.** You can ask precise structural questions and get definitive answers. Which archetypes have more than one Crisis node? Which genres have hard constraints that conflict when blended with Comedy? Which archetype node roles never appear in the same graph? These questions have exact answers in the data.

**Validation.** You can check a story plan against its structural contract. If the plan claims to follow the Hero's Journey, you can verify that every node's entry and exit conditions are met in sequence. If it claims to be Horror, you can check every hard constraint in the genre graph. Validation turns structural analysis from a matter of opinion into a matter of fact.

**Generation.** You can use the graphs as recipes. Select an archetype, select a genre, compile the combined constraints into a contract, and produce a beat-by-beat plan that satisfies both. The plan won't write your story, but it will ensure the structural foundation is sound before you start.

**Comparison.** You can study how the same structural function works across different contexts. How does Transformation manifest in the Hero's Journey versus Rebirth versus the Transformation archetype? How do Romance and Thriller handle the same core constraint of "escalating stakes"? The shared vocabulary makes these comparisons direct.

---

## What this doesn't claim

Formalizing story structure is not the same as reducing it. This project models patterns, not laws. Real stories break rules, blend categories, and invent new structures. The Hero's Journey is a useful model of a common pattern — it is not a claim that all adventure stories must follow eleven nodes in a fixed order.

The controlled vocabularies are a tool for consistency, not a claim of completeness. There may be meaningful structural roles that the current fourteen archetype roles don't capture. The corpus is designed to be extended — new roles can be added, new archetypes and genres can be modeled — but it prioritizes precision and internal consistency over exhaustive coverage.

The goal is to make story structure precise enough to reason about clearly, not to mechanize creativity.
