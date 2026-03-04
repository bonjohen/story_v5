# The Controlled Vocabulary System

*An audio-friendly guide to why vocabularies exist and how they work. Estimated listening time: 10 minutes.*

---

## What controlled vocabularies are

Every node in this project has a role. Every edge has a meaning. But they can't just be freeform text — if one archetype calls a node "Crisis" and another calls the same structural concept "Climax" and a third calls it "Peak Conflict," you can't search across archetypes for the same idea. You can't build a cross-archetype index. You can't compare how Crisis functions differently in Tragedy versus Comedy.

Controlled vocabularies solve this. They're finite, curated lists of terms that every graph must use. If a term isn't in the vocabulary, it can't appear in a graph. If two graphs use the same term, they mean the same structural concept. This constraint is what makes the entire cross-reference system possible.

There are eleven vocabulary files in all — four for graph structure (roles and edge meanings for archetypes and genres) and five for story elements (character roles, place types, object types, relationship types, and transition change types), plus two ID convention documents. Let's walk through each group.

---

## Archetype node roles — fourteen ways a story phase can function

The file is `data/vocabulary/archetype_node_roles.json`. It defines fourteen roles. Every node in every archetype graph is assigned exactly one.

**Origin** — the character's initial stable state. Every archetype has exactly one. It's always the start node. In the Hero's Journey it's Ordinary World. In Tragedy it's Elevated State. In the Escape it's Confinement. Same structural function, radically different content.

**Disruption** — the event that breaks the equilibrium. Present in fourteen of fifteen archetypes. Call to Adventure in the Hero's Journey. Temptation in Tragedy. Spark of Hope in the Escape. The one archetype without it is Voyage and Return, which goes directly from Origin to Threshold.

**Catalyst** — an external force that accelerates or redirects the story. The Mentor in the Hero's Journey. A key clue in the Mystery Unveiled. Not every archetype uses it.

**Threshold** — the point of no return where the character commits. Crossing the Threshold in the Hero's Journey. Entering the Unfamiliar World in Voyage and Return. This is where setup ends and the main story begins.

**Trial** — a challenge that tests abilities, resolve, or values. Often appears multiple times. The Hero's Journey has two Trial nodes — Road of Trials and Road Back. Trials build progressive difficulty.

**Revelation** — a moment where hidden information is exposed. This is the Mystery Unveiled's bread and butter, but it also appears in Overcoming the Monster when the true nature of the threat is revealed, and in the Sacrifice when the hidden cost becomes clear.

**Reversal** — a turning point where fortune shifts dramatically. Fall from Grace in Rise and Fall. Reversal of Fortune in Tragedy. Can be positive or negative.

**Commitment** — a deliberate choice where the character doubles down despite knowing the cost. This separates passive experience from active agency. Choosing revenge over peace. Accepting the sacrifice. Deciding to proceed despite full knowledge of what it costs.

**Descent** — movement into a darker, more dangerous, or more constrained state. Only four archetypes use it — Hero's Journey, Tragedy, Rise and Fall, and the Escape. It's a specialized move that increases pressure and narrows options.

**Crisis** — the moment of maximum threat or tension. Universal — all fifteen archetypes have at least one. The Hero's Journey has two: the Ordeal and the Resurrection. This is the structural climax where all prior nodes converge.

**Transformation** — a fundamental change in identity, worldview, or capability. The story's core payoff. Apotheosis in the Hero's Journey. Moral Renewal in Rebirth. Identity Shift in the Transformation.

**Irreversible Cost** — a permanent loss that cannot be undone. This prevents cheap resolution. Sacrifice Made in the Sacrifice. Tragic Death in Tragedy. If the story has no irreversible cost, the stakes feel hollow.

**Resolution** — the new stable state after the conflict is resolved. Universal — all fifteen archetypes have exactly one. It's always a terminal node. Return with the Elixir, New Status, Order Restored.

**Reckoning** — a moment of moral or practical accounting where the character faces consequences. This role is defined in the vocabulary but currently unassigned in the fifteen graphs. It exists as a valid role for future use or for hybrid archetype modeling.

These fourteen roles are the structural alphabet of archetype graphs. With just fourteen concepts, you can describe the internal architecture of any temporal story structure.

---

## Archetype edge meanings — fifteen reasons one phase leads to another

The file is `data/vocabulary/archetype_edge_vocabulary.json`. Fifteen meanings. Every edge in every archetype graph uses exactly one.

The key insight is that these aren't just transitions — they're *causal explanations*. Each meaning answers the question: why does this phase follow that one?

**Disrupts order** — breaks an existing stable state. This is how Origin connects to Disruption. The world was stable; now it's not.

**Forces commitment** — compels an irreversible choice. This is how Mentor connects to Threshold. The character has the tools; now they must use them.

**Tests resolve** — subjects the character to a challenge measuring commitment. This is how Threshold connects to Trials. You've committed; now prove it.

**Narrows options** — eliminates available paths, increasing pressure. This is how Trials connect to Descent. Each test you pass closes off retreat.

**Triggers crisis** — initiates maximum threat. This is how Descent connects to Crisis. All the narrowing converges into the worst moment.

**Enables transformation** — creates conditions for fundamental change. This is how Crisis connects to Transformation. Only by surviving the worst can you become something new.

**Raises cost** — increases what the character stands to lose. **Demands sacrifice** — requires giving up something of genuine value. **Grants insight** — provides new knowledge or perspective. **Reveals truth** — exposes hidden information. **Restores equilibrium** — returns the story to stability. **Reframes goal** — changes what the character is pursuing. **Inverts expectation** — subverts the anticipated outcome. **Escalates conflict** — intensifies opposition. **Compels return** — forces the character back toward a prior state.

Fifteen meanings. That's the entire causal vocabulary for why story phases connect. When the generation pipeline builds a story plan, every transition between beats uses one of these meanings. When the validation engine checks a scene, it verifies that the transition's preconditions are met and its effects are visible in the prose.

---

## Genre node roles — seven levels of constraint

The file is `data/vocabulary/genre_node_roles.json`. Seven roles. Every node in every genre graph uses exactly one.

The first five form the hierarchy — each level is more specific than the last.

**Genre Promise** — level one. The emotional and experiential contract with the audience. Every genre has exactly one. It's the root node. Horror promises fear and dread. Mystery promises a solvable puzzle with fair resolution. Fantasy promises wonder and mythic stakes.

**Core Constraint** — level two. The non-negotiable rules. What must be true in any story claiming this genre. Horror must have a present, escalating threat. Mystery must have fair clueing. Action must resolve through physical confrontation. These are the minimum viable genre requirements — typically three to six per graph.

**Subgenre Pattern** — level three. Recognized subtypes with their own constraint profiles. Horror branches into supernatural, slasher, cosmic, and psychological. Science Fiction branches into space opera, cyberpunk, hard SF, and first contact. Choosing a subgenre is optional — the constraints are severity "soft" — but choosing one adds specificity.

**Setting Rule** — level four. World-building requirements. How the story's environment must behave. Fantasy requires a magic system with costs and limits. Historical requires period-accurate social norms. Horror requires isolation from help. These make genre constraints tangible through the setting.

**Scene Obligation** — level five. Concrete scene types the audience expects. Horror must have a first anomaly scene, an escalation sequence, and a final confrontation. Romance must have a declaration scene. Mystery must have an investigation pivot. These are the most testable layer — you can check a draft for their presence or absence.

Then the two structural roles that sit outside the hierarchy.

**Tone Marker** — the required atmospheric register. Not a plot element but a feeling the story must sustain. Horror's sustained dread. Romantic Comedy's wit and verbal sparring. Fantasy's grandeur and awe. Every genre has exactly one. They're always severity "hard."

**Anti-Pattern** — an explicit prohibition. What breaks the genre if present. Horror's consequence-free scares. Mystery's unsolvable puzzle or withheld clues. War's consequence-free violence. These define the genre by exclusion — sometimes knowing what not to do is more useful than knowing what to do.

---

## Genre edge meanings — twelve refinement relationships

The file is `data/vocabulary/genre_edge_vocabulary.json`. Twelve meanings. These are fundamentally different from archetype edge meanings — they describe *refinement*, not *causation*. How moving deeper through the genre hierarchy narrows creative degrees of freedom.

**Specifies constraint** — translates a broad expectation into a concrete rule. This is how the Genre Promise connects to Core Constraints. The promise says "fear and dread"; the constraint says "threat must be present, escalating, and genuinely dangerous."

**Branches into subtype** — splits into recognized subgenres. Core Constraints connect to Subgenre Patterns this way. Each branch inherits the core rules but adds its own.

**Introduces setting rule** — adds a world-building requirement. Subgenre Patterns connect to Setting Rules this way.

**Mandates element** — requires a specific scene type. Setting Rules connect to Scene Obligations this way.

**Requires payoff** — demands a specific audience-facing reward. Scene Obligations chain to each other this way — the first anomaly requires the escalation, the escalation requires the final confrontation.

**Sets tone** — establishes the required emotional register. **Prohibits element** — forbids specific approaches. **Narrows scope** — reduces the range of valid choices. **Inherits constraint** — carries a parent-level constraint forward unchanged. **Specializes threat** — makes the source of tension more concrete. **Restricts resolution** — constrains how the story can end. **Differentiates from** — distinguishes this pattern from a related alternative.

---

## Story element vocabularies — five dictionaries for the substance of stories

The four vocabularies above govern *structure* — how graphs are built. Five additional vocabularies govern *content* — what populates those structures. They were introduced with the Story Elements system and control the terminology used in archetype element templates, example instances, and genre element constraints.

### Character roles — thirteen narrative functions

The file is `data/vocabulary/element_roles.json`. Thirteen terms. Every character in every archetype template and every example instance uses exactly one.

**Protagonist** — the central figure whose arc drives the story. **Antagonist** — the primary opposing force. **Mentor** — a guide who provides wisdom or tools. **Ally** — a companion who supports the protagonist. **Herald** — the figure who announces the call to action. **Threshold guardian** — an obstacle at the boundary between worlds. **Shadow** — a dark mirror of the protagonist. **Trickster** — a disruptive figure who challenges order. **Shapeshifter** — a figure whose allegiance is uncertain. **Love interest** — the focus of a romantic subplot. **Foil** — a character who highlights the protagonist through contrast. **Confidant** — a trusted figure for the protagonist to confide in. **Comic relief** — a figure whose primary function is levity.

These roles are inspired by Campbell, Vogler, and Propp but consolidated into a single practical vocabulary. The cross-archetype element role index uses them to map which roles appear in which archetypes.

### Place types — ten narrative settings

The file is `data/vocabulary/place_types.json`. Ten terms. These describe the *narrative function* of a location, not its physical form.

**Ordinary world** — the starting environment. **Threshold** — the boundary between known and unknown. **Special world** — the unfamiliar domain. **Sanctuary** — a place of safety. **Stronghold** — a fortified position. **Wasteland** — a desolate environment. **Crossroads** — a place of decision. **Underworld** — a place of descent or hidden truth. **Summit** — a place of peak confrontation. **Home** — a place of return.

A single physical location can serve different types at different story points — Tatooine is both "ordinary world" at the start and potentially "home" at the return.

### Object types — ten narrative artifacts

The file is `data/vocabulary/object_types.json`. Ten terms.

**Weapon** — instrument of force. **Talisman** — protective or empowering item. **Document** — carrier of information. **Treasure** — something of great value. **McGuffin** — an object significant primarily because characters pursue it. **Symbol** — an object with meaning beyond its form. **Tool** — a practical instrument. **Key** — something that unlocks passage. **Vessel** — a container. **Relic** — an object from the past with enduring power.

### Relationship types — ten character connections

The file is `data/vocabulary/relationship_types.json`. Ten terms.

**Ally** — cooperative partnership. **Rival** — competitive opposition. **Mentor-student** — teaching and learning. **Parent-child** — familial bond. **Romantic** — love or attraction. **Nemesis** — fundamental opposition. **Servant-master** — hierarchical service. **Sibling** — fraternal bond. **Betrayer** — broken trust. **Guardian** — protective custody.

These appear in instance-level element data and in genre element constraints. Romance requires a "romantic" relationship. Detective fiction expects a "mentor-student" or "guardian" dynamic.

### Transition change types — eleven state changes

The file is `data/vocabulary/element_change_types.json`. Eleven terms. These describe what happens to story elements at each moment in a timeline.

**Learns** — gains knowledge. **Gains** — acquires an object or ability. **Loses** — loses something of value. **Transforms** — fundamental change in nature. **Arrives** — enters a new place. **Departs** — leaves a place. **Bonds** — forms or deepens a relationship. **Breaks** — severs a relationship. **Dies** — permanent removal. **Reveals** — hidden truth is exposed. **Decides** — makes a consequential choice.

Every transition in every template timeline and every example instance timeline uses exactly one of these terms. The validation engine uses them to track character state across scenes — accumulating "learns" events to build a character's knowledge, tracking "dies" events to prevent dead characters from reappearing.

---

## The ID convention — making it machine-readable

The vocabularies enforce *what* roles and meanings can be used. The ID conventions enforce *how* they're named. Two Markdown files — `archetype_id_convention.md` and `genre_id_convention.md` — document the system.

Every ID follows the pattern: two-letter prefix, underscore, N or E, two-digit number, underscore, short name. HJ_N01_ORDINARY_WORLD. HR_E05_PROMISE_TO_TONE.

The prefix table assigns a unique two-letter code to every archetype and genre. HJ for Hero's Journey, TR for Tragedy, HR for Horror, SF for Science Fiction. Within each corpus, every prefix is unique. There are two collisions across corpora — SA is both Satire and the Sacrifice, MU is both Musical and the Mystery Unveiled — but the type field in each graph disambiguates.

The number ranges encode structural information. For archetypes: 01 through 09 are spine nodes, 10 through 49 are role-grouped nodes, 50 through 79 are variant nodes. For genres: 01 through 09 are level one, 10 through 19 are level two, 20 through 39 are level three, 40 through 59 are level four, 60 through 79 are level five, 80 through 89 are tone markers, 90 through 99 are anti-patterns.

This means you can look at any ID and immediately know what corpus it belongs to, what graph it's in, whether it's a node or edge, roughly where it sits in the structure, and what it's about — all without looking it up.

---

## How vocabularies are enforced

Vocabularies aren't just documentation — they're enforced at multiple points.

During **graph authoring**, every node must use a role from the vocabulary, every edge must use a meaning from the vocabulary, and every ID must follow the naming convention.

The **validation script** at `app/scripts/validate_corpus.ts` checks all forty-two graphs at build time. If a node has a role that's not in the vocabulary, or an edge has a meaning that's not in the vocabulary, or an ID doesn't match the convention, the script fails. Additional validation scripts check story elements: `validate_elements.ts` verifies that archetype element templates use valid vocabulary terms and reference valid graph nodes. `validate_element_constraints.ts` checks genre constraint files. `validate_examples_elements.ts` validates example instances for internal consistency.

The **graph engine normalizer** in the viewer performs the same validation when loading graphs at runtime. The normalizer's vocabulary audit is what powers the cross-index panels — it builds maps from roles and meanings to the nodes and edges that use them.

The **generation pipeline** relies on vocabulary conformance for contract compilation, beat planning, element roster construction, and validation. When the contract compiler extracts the Hero's Journey's spine, it knows that every node has a role from the fourteen-term vocabulary. When it extracts element requirements, it knows every character is one of thirteen roles. When the validation engine checks a scene against a genre constraint, it knows the constraint is one of seven possible types. When it tracks element continuity, it knows every transition is one of eleven change types.

Without the controlled vocabularies, none of the cross-referencing, comparison, element tracking, or automated pipeline checking would be possible. They're the foundation that everything else is built on.
