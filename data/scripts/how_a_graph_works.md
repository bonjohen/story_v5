# How a Graph Works

*An audio-friendly deep dive into two example graphs. Estimated listening time: 14 minutes.*

---

## Two kinds of graphs

This project has two fundamentally different kinds of graphs. Archetype graphs model *time* — they're sequences of story phases a protagonist passes through from beginning to end. Genre graphs model *rules* — they're trees of constraints that narrow the creative space from a broad promise down to concrete scene-level requirements.

Let's walk through one of each. We'll use the Hero's Journey for archetypes and Horror for genres, since both are familiar enough that you'll already have intuitions about what the graphs should contain.

---

## Part 1: The Hero's Journey — an archetype graph

Open `data/archetypes/01_heros_journey/graph.json`. At the top you'll see an ID, a name, a type field set to "archetype," and a description. Then there's a metadata block that summarizes the graph — eleven nodes, ten edges, and how the nodes and edges distribute across the controlled vocabulary roles and meanings. Then come the two arrays that matter: nodes and edges.

### Walking through the nodes

The Hero's Journey has eleven nodes. They form a linear spine — one start node, a chain of phases, and one terminal node. Let's walk through them.

**Node one is Ordinary World.** Its ID is HJ_N01_ORDINARY_WORLD. The prefix HJ means Hero's Journey. The N means node. 01 means it's the first in the canonical traversal order. And ORDINARY_WORLD is a descriptive short name.

The role field says "Origin." That's from the controlled vocabulary — one of fourteen roles that archetype nodes can have. Origin means "the character's initial stable state before the story's central tension begins." Every archetype starts with an Origin node.

Now look at the prose fields. The definition says this is the protagonist's familiar, stable environment — it establishes what's normal and what the character values or lacks. The entry conditions are simple — it's the story opening, the audience has no prior context. The exit condition is specific and testable: "a disruption or summons arrives that cannot be ignored." If you're evaluating a draft, you can check whether this condition is met before the story moves on.

Typical variants list different flavors this node can take — idyllic peace masking inner dissatisfaction, oppressive normalcy, comfortable mediocrity. These aren't different nodes; they're different ways the same structural role can manifest.

Failure modes tell you what goes wrong. "World is so bland the audience has no reason to care about what the character might lose." That's a specific, actionable diagnostic. If your story's opening isn't working, check whether you're hitting one of these failure modes.

Signals in text tell you how to recognize this node in an actual story — domestic routines, unfulfilled longing, contrast between the character's life and the wider world.

**Node two is Call to Adventure** — role Disruption. This is where the equilibrium breaks. The entry conditions reference the previous node: "Ordinary world is established, an outside force intrudes." The exit condition is "the protagonist acknowledges the call exists." Notice how the entry and exit conditions create a chain — each node's exit condition sets up the next node's entry condition. That's what makes the graph a causal sequence rather than just a list.

**Node three is Meeting the Mentor** — role Catalyst. **Node four is Crossing the Threshold** — role Threshold, the first irreversible step. **Node five is Road of Trials** — role Trial. **Node six is Approach to the Inmost Cave** — role Descent. The tension is building, options are narrowing, the protagonist is heading toward the worst part.

**Node seven is the Ordeal** — role Crisis. This is the structural climax of the inner journey. "The protagonist faces the greatest challenge — a confrontation with death, the shadow, or the central antagonistic force." The failure mode here is devastating and common: "Ordeal is won too easily."

**Node eight is the Reward** — role Transformation. Having survived the ordeal, the protagonist claims the prize. **Node nine is the Road Back** — role Trial again. Yes, the same role can appear more than once. The Hero's Journey has two Trial nodes and two Crisis nodes. Roles describe *function*, not position.

**Node ten is Resurrection** — the second Crisis node. This is the external climax, the final purification. **Node eleven is Return with the Elixir** — role Resolution. The terminal node. The protagonist returns carrying the reward or wisdom gained.

That's the full spine — eleven nodes, Origin to Resolution, forming a single directed path.

### Walking through the edges

Now the edges. There are ten of them, one between each consecutive pair of nodes.

**Edge one: HJ_E01_CALL_RECEIVED.** It goes from Ordinary World to Call to Adventure. The meaning field says "disrupts order" — one of fifteen controlled edge meanings. The precondition is "ordinary world is fully established." The effects on stakes: "introduces the central problem; stakes shift from personal comfort to an external demand." The effects on character: "forces the protagonist to acknowledge a world beyond the familiar."

The anti-pattern field is especially useful: "call is so gentle it creates no urgency." That's the thing to watch for when writing or evaluating this transition.

**Edge three: HJ_E03_CROSSING.** From Mentor to Threshold. Meaning: "forces commitment." Precondition: "mentor's aid is received." Effects on stakes: "irreversibility established — the ordinary world is behind." The anti-pattern: "crossing is trivially reversible." If the character can easily go back, the threshold hasn't done its job.

**Edge six: HJ_E06_ORDEAL_BEGINS.** From Approach to Ordeal. Meaning: "triggers crisis." This is where maximum pressure begins.

**Edge seven: HJ_E07_REWARD_CLAIMED.** From Ordeal to Reward. Meaning: "enables transformation." The anti-pattern: "reward appears without the ordeal being resolved." You can't skip the hard part.

**Edge ten: HJ_E10_RETURN.** From Resurrection to Return with the Elixir. Meaning: "restores equilibrium." The story arrives at a new stable state — different from the original, because the hero is changed.

Notice the pattern. Each edge has a *meaning* — not just "and then this happens" but *why* one phase leads to another. "Disrupts order" is a causal claim. "Forces commitment" is a causal claim. "Enables transformation" is a causal claim. Every transition in every archetype graph carries this kind of reasoning.

### Variants

The Hero's Journey also has a `variants.json` file. Variant nodes occupy the fifty to seventy-nine ID range. The most famous variant is the Refusal of the Call — an optional branch where the protagonist initially rejects the call before eventually accepting it. Variants branch from and rejoin the main spine, creating alternative paths through the graph. The metadata tells you exactly where each variant diverges and reconnects.

---

## Part 2: Horror — a genre graph

Now open `data/genres/10_horror/graph.json`. The structure is immediately different. Instead of a linear spine, this is a tree. Instead of a temporal sequence, it's a hierarchy of rules.

### The five-level architecture

Horror has seventeen nodes organized into five levels, plus a tone marker and an anti-pattern.

**Level one — Genre Promise.** There's exactly one node: HR_N01_PROMISE, "Horror Promise." Its definition is the fundamental contract with the audience: "The audience is promised fear, dread, and a confrontation with threatening forces — a story where the world is not safe, something monstrous or uncanny is present, and survival or sanity is genuinely uncertain." The severity field is "hard" — meaning this isn't optional, it's the whole point.

**Level two — Core Constraints.** Four nodes branch from the promise. HR_N10 says the threat must be present, escalating, and genuinely dangerous. HR_N11 says the protagonist must be vulnerable — outmatched by the threat. HR_N12 says the atmosphere of dread must be sustained. HR_N13 says the threat must have a logic — rules even if unknown to the characters. All four are severity "hard." These are the non-negotiable requirements for any horror story.

**Level three — Subgenre Patterns.** Four nodes: Supernatural Horror, Slasher / Survival Horror, Cosmic / Existential Horror, and Psychological Horror. All four are severity "soft" — because choosing a subgenre is optional. You must satisfy the core constraints, but you don't have to commit to a specific subgenre. Each subgenre adds its own specific requirements on top of the core.

**Level four — Setting Rules.** Three nodes: Isolation Amplifies Threat, Normal Spaces Become Uncanny, and Darkness and Concealment. These are the world-building requirements — how the story's environment must behave to support the genre. Isolation is severity "hard" — horror doesn't work when the protagonist can just call for help.

**Level five — Scene Obligations.** Three nodes: First Anomaly, Escalation Sequence, and Final Confrontation. These are concrete scene requirements — things the audience expects and the genre contract demands. The first anomaly is the moment something goes wrong. The escalation builds from anomaly to undeniable danger. The final confrontation is the climactic face-off at maximum vulnerability. All three are severity "hard."

**Tone Marker.** HR_N80_DREAD_ATMOSPHERE — "Sustained Dread Atmosphere." Horror requires a pervasive, sustained atmosphere of dread — not just isolated jump scares. Severity "hard."

**Anti-Pattern.** HR_N90_CONSEQUENCE_FREE_SCARES — "Consequence-Free Scares — Boy Who Cried Wolf." This is what breaks horror — repeated scares that resolve safely, training the audience to stop feeling fear. The node IS the failure mode. Severity "hard."

### How genre edges work

Genre edges represent refinement — how moving deeper through the hierarchy narrows creative choices. The meanings are different from archetype edges.

The first four edges go from the Genre Promise to each Core Constraint. Their meaning is "specifies constraint" — the promise generates specific enforceable rules. Edge five goes from the Promise to the Tone Marker with meaning "sets tone."

At level two to three, edges use "branches into subtype." Each core constraint connects to the subgenre patterns it gives rise to. The threat escalation constraint branches into supernatural, slasher, cosmic, and psychological.

At level three to four, edges use "introduces setting rule." The supernatural subgenre introduces isolation and the uncanny. The slasher subgenre introduces isolation and concealment.

At level four to five, edges use "mandates element." Isolation mandates the first anomaly scene. The uncanny mandates the first anomaly scene. These converge — multiple setting rules feed into the same scene obligation.

And at level five, edges use "requires payoff" — the first anomaly requires the escalation sequence, and the escalation requires the final confrontation. The sequence is concrete and testable.

The anti-pattern edge uses "prohibits element" — it connects from the dread atmosphere constraint, warning that consequence-free scares destroy it.

### Severity — the key difference

The thing that makes genre graphs fundamentally different from archetype graphs is the severity field. Every node and every edge is classified as "hard" or "soft." Hard means violating it breaks the genre contract — your horror story isn't horror anymore. Soft means it's an uncommon deviation but still valid. Horror has thirty-two hard elements and eight soft elements. The generation pipeline uses this to decide what's a blocking failure versus a warning.

---

## What makes them work together

These two graph types are designed to be overlaid. When you generate a story, the archetype graph gives you the temporal sequence — where the story goes, phase by phase. The genre graph gives you the rules — what must be true at every point. The generation pipeline maps genre constraints onto archetype phases, so each scene has both a structural position in the story's arc and a set of genre obligations it must satisfy. The Hero's Journey tells you "this scene is the Ordeal." Horror tells you "the Ordeal must feature an escalating, present threat with a sustained atmosphere of dread, operating through concealment, in an isolated setting." Together they produce something much more specific and testable than either one alone.
