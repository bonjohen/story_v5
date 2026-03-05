# Narrative Roles

*A guide to the controlled vocabulary that structures every graph. Estimated listening time: 8 minutes.*

---

## Why controlled vocabulary matters

Every graph in this project uses terms from a fixed vocabulary. There are fourteen roles that archetype nodes can have, fifteen meanings that archetype edges can have, seven roles for genre nodes, and twelve meanings for genre edges. These aren't arbitrary labels — they're the shared language that makes the entire corpus internally consistent and cross-referenceable.

Without controlled vocabulary, each archetype graph would invent its own terminology. The Hero's Journey might call its climax "the Ordeal," Tragedy might call it "the Point of No Return," and the Quest might call it "the Final Confrontation." All three describe the same structural function — the moment of maximum threat where the central conflict reaches its peak — but without a shared label, comparing them requires manual interpretation.

With controlled vocabulary, all three nodes share the role "Crisis." You can query the corpus for every Crisis node across all fifteen archetypes and get a precise, comparable result. The cross-archetype index is built entirely on this foundation.

---

## Archetype node roles

There are fourteen roles that archetype nodes can have. Together, they describe every structural function a story phase can serve.

**Origin.** The character's initial stable state before the story's central tension begins. Every archetype starts here. It's always a start node.

**Disruption.** An event or realization that breaks the existing equilibrium and creates the central problem. This is what launches the story's engine.

**Catalyst.** An external event or character that accelerates or redirects the story's trajectory. The mentor's appearance in the Hero's Journey is a catalyst. So is a key clue in a mystery.

**Threshold.** A point of no return where the character commits to engaging with the central problem. After this, the character can't simply go back to normal.

**Trial.** A challenge that tests the character's abilities, resolve, or values. Trials build progressive difficulty and often appear in sequences.

**Descent.** Movement into a darker, more dangerous, or more constrained state. Descent increases pressure and narrows options, usually preceding the crisis.

**Revelation.** A moment where critical hidden information is exposed, changing understanding. Revelations recontextualize prior events and force reassessment.

**Reversal.** A turning point where fortune, power, or trajectory shifts dramatically. Reversals can be positive or negative.

**Commitment.** A deliberate choice where the character doubles down despite full knowledge of the cost. This distinguishes passive experience from active agency.

**Crisis.** The moment of maximum threat or tension where the central conflict reaches its peak. The structural climax. Everything converges here.

**Transformation.** A fundamental change in the character's identity, worldview, or capability. This is the story's core payoff — the character is no longer who they were.

**Irreversible Cost.** A permanent loss that cannot be undone. This prevents cheap resolution and ensures consequences are real.

**Resolution.** The new stable state after the central conflict is resolved. Always a terminal node. Shows the lasting impact of the journey.

**Reckoning.** A moment of moral or practical accounting where the character faces the consequences of prior choices. Currently defined in the vocabulary but not assigned to any node in the fifteen archetype graphs — it's retained for future use and hybrid archetype modeling.

---

## Archetype edge meanings

There are fifteen causal meanings that archetype edges can carry. They describe *why* one phase leads to another.

**Disrupts order** — breaks an existing stable state. **Forces commitment** — compels an irreversible choice. **Reveals truth** — exposes hidden information. **Narrows options** — eliminates available paths. **Raises cost** — increases what the character stands to lose. **Reframes goal** — changes what the character is pursuing. **Tests resolve** — subjects the character to a challenge. **Grants insight** — provides new knowledge or perspective. **Triggers crisis** — initiates maximum threat. **Enables transformation** — creates conditions for fundamental change. **Restores equilibrium** — returns the story to a stable state. **Demands sacrifice** — requires giving up something of genuine value. **Inverts expectation** — subverts the anticipated outcome. **Escalates conflict** — intensifies opposition. **Compels return** — forces the character back toward the ordinary world.

These meanings ensure that every transition in every archetype has a causal explanation, not just a sequential one.

---

## Genre node roles

Genre graphs use a different vocabulary of seven roles, reflecting their hierarchical rather than temporal structure.

**Genre Promise** — the root-level contract with the audience. **Core Constraint** — the non-negotiable rules at level two. **Subgenre Pattern** — recognized subtypes at level three. **Setting Rule** — world-building requirements at level four. **Scene Obligation** — specific required scene types at level five. **Tone Marker** — the required atmospheric or emotional register, which can appear at levels two through four. **Anti-Pattern** — explicit prohibitions that define the genre by exclusion.

The first five roles form the five-level spine. Tone Marker and Anti-Pattern are structural concepts that can appear across multiple levels.

---

## Genre edge meanings

There are twelve refinement relationships that genre edges can carry. They describe how constraints narrow as you move deeper through the hierarchy.

**Specifies constraint** — translates a broad expectation into an enforceable rule. **Narrows scope** — reduces the range of valid creative choices. **Branches into subtype** — splits into a recognized subgenre. **Mandates element** — requires a specific scene type or beat. **Prohibits element** — forbids specific approaches. **Inherits constraint** — carries a parent-level rule forward unchanged. **Sets tone** — establishes the required emotional register. **Introduces setting rule** — adds a world-building requirement. **Specializes threat** — makes the source of conflict more concrete. **Restricts resolution** — constrains acceptable endings. **Differentiates from** — distinguishes this pattern from a related alternative. **Requires payoff** — demands a specific audience-facing reward.

---

## Universal versus specialized

Some roles and meanings are universal — they appear in virtually every graph. Origin and Resolution appear in all fifteen archetypes. Genre Promise appears in all twenty-seven genres. The edge meanings "disrupts order" and "forces commitment" appear across most archetypes. "Specifies constraint" and "narrows scope" appear across most genres.

Others are specialized. Irreversible Cost appears only in archetypes that involve permanent loss — Tragedy, the Sacrifice, the Escape. "Demands sacrifice" appears only in archetypes where giving something up is structurally necessary. "Specializes threat" appears primarily in genres with strong threat models — Horror, Thriller, War.

This distribution is itself informative. Looking at which roles an archetype uses — and which it omits — reveals its structural character. The Hero's Journey uses Crisis, Transformation, and Resolution but not Irreversible Cost, suggesting a fundamentally hopeful structure. Tragedy uses Crisis, Reversal, and Irreversible Cost but reaches Resolution through downfall rather than restoration. The vocabulary makes these structural signatures visible and comparable.
