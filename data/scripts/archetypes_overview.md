# Archetypes

*An overview of the fifteen fundamental plot structures. Estimated listening time: 9 minutes.*

---

## What an archetype is

An archetype, in this project, is a model of how a story progresses over time. It's a directed graph where nodes represent story phases — Ordinary World, Call to Adventure, Ordeal, Resolution — and edges represent the causal transitions between them. Each archetype captures a recognizable pattern that appears across cultures, centuries, and media: the journey that transforms the hero, the rise and fall of the ambitious, the mystery that yields its secrets through investigation.

These aren't rigid templates. They're structural models — descriptions of causal sequences that recur because they reflect fundamental patterns in how humans experience conflict, change, and resolution. A story doesn't have to follow an archetype exactly to benefit from understanding it. The model gives you a vocabulary for diagnosing why a particular structure works or doesn't.

---

## The fifteen archetypes

The corpus contains fifteen archetypes, each with its own graph, narrative spec, and example mappings.

**The Hero's Journey** is the most widely recognized. A protagonist departs the ordinary world, undergoes trials in a special world, faces a supreme ordeal, and returns transformed. Star Wars, The Matrix, The Hobbit.

**Rags to Riches** traces a disadvantaged protagonist's rise to success through perseverance, talent, or moral worth. Rocky, Slumdog Millionaire, Great Expectations.

**The Quest** follows a protagonist or group pursuing a defined objective through escalating obstacles. The Lord of the Rings, Indiana Jones, Finding Nemo.

**Voyage and Return** sends a protagonist into an unfamiliar world and back, carrying insight. Alice in Wonderland, The Wizard of Oz, Narnia.

**Overcoming the Monster** pits a protagonist against a powerful threat that endangers a community. Jaws, Jurassic Park, Beowulf.

**Rebirth** models renewal — a morally diminished character undergoes crisis and is restored. A Christmas Carol, Groundhog Day, Beauty and the Beast.

**Tragedy** follows a protagonist whose flaw or irreversible choice leads to downfall. Macbeth, Titanic, Romeo and Juliet.

**Comedy** — formally, Restoration of Order — resolves social disorder through reconciliation. A Midsummer Night's Dream, The Big Lebowski, Bridget Jones's Diary.

**Coming of Age** traces maturation through formative experience. To Kill a Mockingbird, The Breakfast Club, Lady Bird.

**The Revenge** follows a protagonist pursuing retaliation for injustice, often at moral cost. Kill Bill, The Count of Monte Cristo, Gladiator.

**The Escape** models liberation from confinement — physical, social, or psychological. The Shawshank Redemption, Escape from Alcatraz, Get Out.

**The Sacrifice** traces a protagonist who relinquishes something of great value for a greater good. Harry Potter and the Deathly Hallows, Armageddon, The Dark Knight Rises.

**The Mystery Unveiled** follows an investigation that progressively reveals hidden truths. The Sixth Sense, Gone Girl, Knives Out.

**The Transformation** models profound internal or external change that redefines identity. The Metamorphosis, Black Swan, Spider-Man.

**The Rise and Fall** traces ascent to power followed by decline through flaw or corruption. The Wolf of Wall Street, Scarface, Citizen Kane.

---

## How archetype graphs are structured

Every archetype graph follows the same schema. The top-level fields include an ID, a name, a type set to "archetype," and a description. Then comes a metadata block summarizing node count, edge count, and distributions across vocabulary roles and meanings.

The **nodes** array contains the story phases. Each node has a unique ID following the naming convention — HJ_N01_ORDINARY_WORLD for the first node of the Hero's Journey, TR_N05_DOWNFALL for the fifth node of Tragedy. Each node is assigned a role from the controlled vocabulary of fourteen archetype roles: Origin, Disruption, Threshold, Trial, Revelation, Reversal, Commitment, Crisis, Transformation, Irreversible Cost, Resolution, Descent, Catalyst, and Reckoning.

Beyond the structural metadata, each node carries prose fields designed for practical use. The **definition** explains what this phase means in the context of the story. The **entry conditions** state what must be true before the story can reach this point. The **exit conditions** state what must be true before it can move on. **Typical variants** describe the different flavors the phase can take. **Failure modes** describe what goes wrong when the phase is mishandled — these are diagnostic tools. **Signals in text** describe how to recognize the phase when reading an actual story.

The **edges** array contains the transitions. Each edge connects two nodes and carries a meaning from the controlled vocabulary of fifteen edge meanings — "disrupts order," "forces commitment," "triggers crisis," "enables transformation," and eleven others. Edges also have preconditions, effects on stakes, effects on character, common alternatives, and anti-patterns.

Every archetype has one start node with the Origin role and one or more terminal nodes, usually with the Resolution role.

---

## Variants and beat sheets

Two archetypes — the Hero's Journey and the Escape — have **variant files**. Variants are optional or alternative paths that branch from the main spine. A variant node uses IDs in the fifty to seventy-nine range. The Hero's Journey variant, for example, models the "Refusal of the Call" — an optional phase where the protagonist initially rejects the adventure before accepting.

Three archetypes have **beat sheet files** — scene-level mappings with timestamps for a well-known work. The Hero's Journey maps Star Wars Episode Four. Tragedy maps Macbeth. The Escape maps The Shawshank Redemption. Each beat connects an archetype node to specific scenes, with duration percentages showing how the original work distributes its running time across the structure.

---

## How archetypes connect

The archetypes aren't isolated. The **cross-archetype index** maps shared structural roles across all fifteen graphs. You can look up the Crisis role and see how it manifests in the Hero's Journey (the Supreme Ordeal), in Tragedy (the Point of No Return), in the Mystery Unveiled (the Revelation), and in every other archetype that contains a Crisis node.

The **hybrid archetype patterns** document combinations — stories that follow two archetypes simultaneously. A Hero's Journey combined with a Sacrifice creates a structure where the hero's transformation and return are complicated by the need for self-sacrifice. The hybrid model documents which phase sequences overlap, where they diverge, and how to resolve the tension.

The **emotional arc profiles** track the emotional trajectory of each archetype — where tension rises, where it peaks, where it resolves. These profiles feed into the tone integration model, which predicts how a genre's required tone will interact with an archetype's natural emotional shape.

---

## Where to find them

All fifteen archetype graphs live in `data/archetypes/`, numbered 01 through 15. Each folder contains `graph.json`, `narrative.md`, and `examples.md`. The controlled vocabularies are in `data/vocabulary/`. The cross-reference datasets are in `data/cross_references/`. And the interactive viewer can render any archetype graph with a single click.
