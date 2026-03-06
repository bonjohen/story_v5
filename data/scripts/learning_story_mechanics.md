# Learning Story Mechanics

*Using the corpus as a study tool for narrative structure. Estimated listening time: 8 minutes.*

---

## Structure made visible

Most of the time, story structure is invisible. You experience a well-told story as a continuous flow — rising tension, a surprising twist, a satisfying resolution — without consciously noticing the structural machinery that produces those effects. The craft of storytelling lies partly in making that machinery disappear.

This project makes the machinery visible. Every archetype graph lays out the phases of a story in explicit, labeled sequence. Every genre graph lays out the constraints in explicit, labeled hierarchy. The controlled vocabularies give you precise terms for structural functions that are usually described vaguely. And the cross-reference datasets show how the same structural functions manifest across different contexts.

The result is a study tool — a way to understand not just what makes stories work, but why specific structural choices produce specific effects.

---

## Learning archetypes through failure modes

Every node in every archetype graph has a **failure modes** field. This might be the most educational part of the entire corpus.

The failure modes don't just describe what the phase should accomplish — they describe what goes wrong when it doesn't. The Hero's Journey's Ordinary World node has the failure mode: "World is so bland the audience has no reason to care about what the character might lose." The Ordeal node has: "Ordeal is won too easily." The Return with the Elixir has: "Return feels disconnected from the transformation."

These aren't abstract writing advice. They're specific, testable diagnostics. If your second act feels flat, you can walk through the relevant archetype's nodes and check each failure mode against your draft. Does the Trial node's failure mode — "challenges are repetitive rather than escalating" — describe your problem? Does the Descent node's failure mode — "the protagonist enters the low point too quickly, without enough prior success to make the fall meaningful" — apply?

This kind of structural diagnosis is difficult to perform without a formal framework. With the archetype graphs, it becomes systematic. You identify which phase your draft is struggling with, read the failure mode, and either confirm or rule out that specific structural problem.

---

## Learning genres through constraints

Genre graphs teach a different lesson. Instead of "what happens in what order," they answer "what rules must the story follow, and why."

The five-level hierarchy makes the relationship between abstract expectations and concrete obligations clear. Take Romance. The genre promise is "emotional arc centered on an intimate relationship." That's abstract. But the core constraints make it concrete: "the relationship must be the central arc, not a subplot," "both partners must have agency in the relationship," "the story must demonstrate why these specific people belong together." The scene obligations make it even more concrete: "declaration or commitment scene," "moment of vulnerability where emotional walls drop."

Reading a genre graph from top to bottom is like zooming in on a creative problem. Each level answers: "Given the constraints above, what specifically must be true at this level of detail?" The connection between levels is made explicit by the edge meanings — "specifies constraint," "narrows scope," "mandates element." You can trace any scene obligation back through the graph to the genre promise it ultimately serves.

This is especially useful for understanding why certain genre conventions exist. The "first scare" in Horror isn't an arbitrary tradition — it traces back through "mandates element" to a setting rule about establishing the threat's reality, which traces back through "introduces setting rule" to a core constraint about escalating threat, which traces back through "specifies constraint" to the genre promise of fear and dread. The convention exists because the genre contract requires it. Understanding this chain makes it possible to create alternatives that serve the same function.

---

## The viewer as study tool

The interactive viewer renders any graph as a clickable node-link diagram. For archetype graphs, the nodes flow left to right following narrative time. For genre graphs, the hierarchy descends from genre promise to scene obligations. Both archetype and genre graphs display side by side, so you can see temporal structure alongside constraint depth simultaneously.

Click any node to open its detail panel — definition, entry and exit conditions, failure modes, signals in text. Use the Trace Forward and Trace Backward buttons to highlight all nodes reachable from a selected node, dimming unrelated paths. This reveals the causal chains that connect story phases — how the Threshold's exit conditions set up the Trials, and how the Trials create the conditions for the Ordeal.

The example overlay mode grounds abstract structure in concrete works. Activate it and each node shows which scenes from a real work — Star Wars painted onto the Hero's Journey, or Macbeth onto Tragedy — correspond to that structural phase. Comparing two works against the same graph reveals which structural elements are essential and which are variable.

The Templates panel adds another dimension. It shows the character role profiles, archetype node templates, and genre constraint templates that the generation pipeline uses. Browsing the templates for a given archetype-genre combination reveals the structural expectations in detail — what characters are needed, what constraints must be met, and what failure modes to watch for.

---

## Cross-references as pattern library

The cross-reference datasets are a pattern library for anyone studying narrative structure.

The **cross-archetype index** lets you study a single structural function across all fifteen archetypes. How does the Threshold role work in the Hero's Journey versus the Quest versus Coming of Age? In the Hero's Journey, the threshold is geographical — the protagonist physically leaves the ordinary world. In the Quest, it's volitional — the group commits to pursuing the objective. In Coming of Age, it's psychological — the protagonist accepts that childhood certainties no longer hold. Same role, three different manifestations, and the comparison reveals what "threshold" really means at a structural level: the irreversible commitment to engage with the central problem.

The **genre-archetype compatibility matrix** lets you study which structural patterns work with which genre constraints, and why. The Hero's Journey is naturally compatible with Fantasy and Adventure — their constraint profiles align. It's conditionally compatible with Horror — the Journey's hopeful arc fights Horror's requirement for sustained dread, but it can work if the "return" is compromised. It's tense with Tragedy — the Journey expects transformation and return, Tragedy expects downfall.

The **example works registry** maps real stories against the formal structures. There are over a hundred example mappings across the corpus. Reading how multiple works map to the same archetype — seeing what's common across Star Wars, The Hobbit, and The Matrix in their Hero's Journey mappings — reveals which structural elements are essential and which are variable.

---

## Analysis without generation

You don't need to use the generation pipeline to benefit from this project. The corpus works as a reference library and analytical tool on its own. Read the archetype graphs to understand the structural patterns your stories follow. Read the genre graphs to understand the constraints your chosen genre imposes. Use the cross-references to find connections you hadn't noticed. Use the failure modes as a diagnostic checklist for structural problems in your drafts.

The generation pipeline is one application of the data, but the data itself — precise, consistent, cross-referenced — is the foundation. You can build your own applications, your own analytical approaches, your own teaching curricula on the same structural foundation.
