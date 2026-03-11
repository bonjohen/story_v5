# Story Structure Corpus: Consolidated Reference

A complete reference covering all 15 archetype graphs, 27 genre depth graphs, controlled vocabularies, cross-references, compatibility matrices, emotional arcs, example works, non-Western archetypes, element roles, cross-medium adaptation, tone integration, and corpus validation.

**Corpus totals**: 42 graphs, 114 archetype nodes, 99 archetype edges, ~460 genre nodes, ~540 genre edges, 107 example works, 10 non-Western archetypes, 405 tone-archetype pairings.

---

# Part I: Controlled Vocabularies

## 1.1 Archetype Node Roles (14 roles)

| Role | Definition |
|------|-----------|
| Origin | Character's initial stable state before central tension begins. Always a start node. |
| Disruption | Event/realization that breaks equilibrium and creates the central problem. |
| Threshold | Point of no return where character commits to engaging with the problem. |
| Trial | Challenge testing abilities, resolve, or values. Often in sequences/loops. |
| Revelation | Critical hidden information exposed, changing understanding. |
| Reversal | Turning point where fortune/power/trajectory shifts dramatically. |
| Commitment | Deliberate choice to double down despite full knowledge of cost. |
| Crisis | Moment of maximum threat/tension; structural climax. |
| Transformation | Fundamental change in identity, worldview, or capability. |
| Irreversible Cost | Permanent loss that cannot be undone, giving weight to outcomes. |
| Resolution | New stable state after central conflict resolved. Terminal node. |
| Descent | Movement into darker/more dangerous/constrained state. Precedes Crisis. |
| Catalyst | External event/character that accelerates or redirects trajectory. |
| Reckoning | Moral/practical accounting for prior choices. (Defined but unused in current 15 graphs.) |

## 1.2 Archetype Edge Meanings (15 meanings)

| Meaning | Definition |
|---------|-----------|
| forces commitment | Compels irreversible choice, closing prior options. |
| reveals truth | Exposes hidden information reshaping understanding. |
| narrows options | Eliminates paths, increasing pressure. |
| raises cost | Increases what character stands to lose. |
| reframes goal | Changes what character pursues or why. |
| tests resolve | Subjects character to challenge measuring commitment. |
| grants insight | Provides new knowledge/skill/perspective for future action. |
| triggers crisis | Initiates moment of maximum threat demanding response. |
| enables transformation | Creates conditions for fundamental character change. |
| restores equilibrium | Returns story to stable state, resolving central tension. |
| disrupts order | Breaks existing stable state, creating disequilibrium. |
| demands sacrifice | Requires giving up something of genuine value to proceed. |
| inverts expectation | Subverts anticipated outcome, forcing reassessment. |
| escalates conflict | Intensifies opposition between character and antagonist. |
| compels return | Forces character back toward ordinary world. (Defined but unused.) |

## 1.3 Genre Node Roles (7 roles)

| Role | Level | Definition |
|------|-------|-----------|
| Genre Promise | 1 | Emotional/experiential contract with audience. Root node, exactly one per graph. |
| Core Constraint | 2 | Non-negotiable rule for genre to function. Typically 3-6 per graph. |
| Subgenre Pattern | 3 | Recognized subtype inheriting/modifying core constraints. 3-6 per graph. |
| Setting Rule | 4 | World-building requirement expressing genre concretely. |
| Scene Obligation | 5 | Specific recurring scene type audience expects. Most testable layer. |
| Tone Marker | null | Required atmospheric/emotional quality. Constrains how story feels. |
| Anti-Pattern | null | Explicit prohibition violating the genre contract. |

## 1.4 Genre Edge Meanings (12 meanings)

| Meaning | Typical Context |
|---------|----------------|
| specifies constraint | L1->L2: genre promise generates specific requirements |
| narrows scope | Any downward transition reducing valid choices |
| branches into subtype | L2->L3: core constraints generate subgenre patterns |
| mandates element | L4->L5: setting rules generate scene obligations |
| prohibits element | Edges leading to anti-pattern nodes |
| inherits constraint | L2->L3 or L3->L4: parent rule persists unchanged |
| sets tone | Edges establishing mood requirements |
| introduces setting rule | L3->L4: subgenre patterns generate setting requirements |
| specializes threat | Genre-specific threat refinement (Horror, Thriller, War) |
| restricts resolution | Constrains acceptable endings |
| differentiates from | Distinguishes subtype from sibling patterns |
| requires payoff | Demands specific audience-facing reward |

---

# Part II: Archetype Graphs (15)

## 2.1 The Hero's Journey

**Description**: A protagonist departs from the ordinary world, undergoes trials and transformation in a special world, and returns changed. The structure emphasizes initiation, crisis, and reintegration.

**Stats**: 11 nodes, 10 edges. Variant file: variants.json

| Node | Role |
|------|------|
| Ordinary World | Origin |
| Call to Adventure | Disruption |
| Meeting the Mentor | Catalyst |
| Crossing the Threshold | Threshold |
| Road of Trials | Trial |
| Approach to the Inmost Cave | Descent |
| The Ordeal | Crisis |
| Reward (Seizing the Sword) | Transformation |
| The Road Back | Trial |
| Resurrection | Crisis |
| Return with the Elixir | Resolution |

| Edge | Meaning |
|------|---------|
| Call Received | disrupts order |
| Seeks Guidance | grants insight |
| Crosses into Special World | forces commitment |
| Enters Trials | tests resolve |
| Approaches the Core | narrows options |
| Faces the Ordeal | triggers crisis |
| Claims the Reward | enables transformation |
| Begins Return | raises cost |
| Final Test | demands sacrifice |
| Returns Transformed | restores equilibrium |

---

## 2.2 Rags to Riches

**Description**: A disadvantaged protagonist rises to success, status, or fulfillment through perseverance, talent, luck, or moral worth.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Lowly State | Origin |
| Opportunity Appears | Disruption |
| Initial Rise | Threshold |
| Social Trials | Trial |
| Apparent Peak | Reversal |
| Crisis of Worth | Crisis |
| Proof of Character | Commitment |
| True Elevation | Resolution |

| Edge | Meaning |
|------|---------|
| Chance Arrives | disrupts order |
| Seizes the Chance | forces commitment |
| New World Pushes Back | tests resolve |
| Reaches the Top | raises cost |
| Foundation Cracks | reveals truth |
| Chooses Character Over Status | demands sacrifice |
| Earns True Place | restores equilibrium |

---

## 2.3 The Quest

**Description**: A protagonist or group pursues a defined objective, overcoming escalating obstacles that test commitment and cohesion.

**Stats**: 9 nodes, 8 edges. No variants.

| Node | Role |
|------|------|
| Home Ground | Origin |
| Objective Defined | Disruption |
| Gathering Companions | Catalyst |
| Journey Trials | Trial |
| Cohesion Test | Revelation |
| Final Approach | Descent |
| Climactic Ordeal | Crisis |
| Objective Won | Transformation |
| Homecoming | Resolution |

| Edge | Meaning |
|------|---------|
| Need Emerges | disrupts order |
| Assembles the Team | grants insight |
| Sets Out | forces commitment |
| Tensions Surface | reveals truth |
| Group Recommits | forces commitment |
| Engages Final Obstacle | triggers crisis |
| Claims the Prize | demands sacrifice |
| Returns Home | restores equilibrium |

---

## 2.4 Voyage and Return

**Description**: A protagonist enters an unfamiliar world, survives its rules and dangers, and returns home with insight or maturity.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Familiar World | Origin |
| Passage Into the Unknown | Threshold |
| Fascination Phase | Trial |
| Shadow Emerges | Revelation |
| Frustration and Imprisonment | Descent |
| Thrilling Escape | Crisis |
| Return Changed | Resolution |

| Edge | Meaning |
|------|---------|
| Crosses Over | disrupts order |
| Begins Exploring | grants insight |
| Darkness Appears | reveals truth |
| Becomes Trapped | narrows options |
| Breaks Free | triggers crisis |
| Returns Home | restores equilibrium |

---

## 2.5 Overcoming the Monster

**Description**: A protagonist confronts and defeats a powerful antagonist or existential threat that endangers a community or world.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Peaceful State Under Threat | Origin |
| Monster Revealed | Disruption |
| Call to Confront | Commitment |
| Preparation and Reconnaissance | Catalyst |
| Initial Encounter | Trial |
| Nightmare Phase | Descent |
| Final Confrontation | Crisis |
| World Restored | Resolution |

| Edge | Meaning |
|------|---------|
| Threat Strikes | disrupts order |
| Accepts the Mission | forces commitment |
| Gathers Tools and Knowledge | grants insight |
| First Engagement | tests resolve |
| Overwhelmed | escalates conflict |
| Key Insight Gained | reframes goal |
| Monster Falls | restores equilibrium |

---

## 2.6 Rebirth

**Description**: A morally or emotionally diminished character undergoes renewal through crisis, restoring integrity or humanity.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Fallen State | Origin |
| Warning or Catalyst | Disruption |
| Resistance and Denial | Trial |
| Ordeal of Truth | Crisis |
| Turning Point | Commitment |
| Atonement | Transformation |
| Renewal | Resolution |

| Edge | Meaning |
|------|---------|
| First Crack Appears | disrupts order |
| Digs In | narrows options |
| Truth Breaks Through | reveals truth |
| Chooses Change | forces commitment |
| Makes Amends | demands sacrifice |
| Renewal Achieved | restores equilibrium |

---

## 2.7 Tragedy

**Description**: A protagonist's flaw or irreversible choice leads to downfall, emphasizing inevitability and moral consequence.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Elevated State | Origin |
| Temptation or Pressure | Disruption |
| Fatal Choice | Threshold |
| Apparent Success | Reversal |
| Unraveling | Descent |
| Recognition (Anagnorisis) | Revelation |
| Downfall (Catastrophe) | Irreversible Cost |
| Aftermath | Resolution |

| Edge | Meaning |
|------|---------|
| Flaw Activated | disrupts order |
| Crosses the Line | forces commitment |
| Reaps the Reward | raises cost |
| Cracks Appear | narrows options |
| Sees the Truth | reveals truth |
| Falls | triggers crisis |
| World Endures | restores equilibrium |

---

## 2.8 Comedy (Restoration of Order)

**Description**: Social disorder, confusion, or misunderstanding is resolved through reconciliation, restoring harmony.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Constrained Order | Origin |
| Disruption of Order | Disruption |
| Escalating Chaos | Trial |
| Dark Moment | Crisis |
| Unmasking and Recognition | Revelation |
| Reconciliation | Commitment |
| New Harmony | Resolution |

| Edge | Meaning |
|------|---------|
| Order Broken | disrupts order |
| Confusion Compounds | narrows options |
| Threatens Real Harm | raises cost |
| Truth Emerges | reveals truth |
| Chooses Forgiveness | enables transformation |
| Harmony Restored | restores equilibrium |

---

## 2.9 Coming of Age

**Description**: A young protagonist matures through formative experiences, achieving psychological or moral growth.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Innocence | Origin |
| First Exposure | Disruption |
| Testing Ground | Trial |
| Mentor or Role Model | Catalyst |
| Crisis of Identity | Crisis |
| Loss of Innocence | Irreversible Cost |
| New Maturity | Resolution |

| Edge | Meaning |
|------|---------|
| World Cracks Open | disrupts order |
| Enters the Arena | forces commitment |
| Finds a Model | grants insight |
| Identity Put to the Test | triggers crisis |
| Pays the Price of Knowing | demands sacrifice |
| Grows Up | enables transformation |

---

## 2.10 The Revenge

**Description**: A protagonist pursues retaliation for injustice, often sacrificing morality or peace in the process.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Original State | Origin |
| Inciting Wrong | Disruption |
| Vow of Revenge | Commitment |
| Preparation | Catalyst |
| Pursuit and Escalation | Trial |
| Moral Crossroads | Revelation |
| Final Reckoning | Crisis |
| Aftermath | Resolution |

| Edge | Meaning |
|------|---------|
| Wrong Committed | disrupts order |
| Swears Revenge | forces commitment |
| Builds Capability | narrows options |
| Begins the Hunt | escalates conflict |
| Confronts What They've Become | reveals truth |
| Faces the Enemy | triggers crisis |
| Lives With the Result | restores equilibrium |

---

## 2.11 The Escape

**Description**: A protagonist trapped by physical, social, or psychological confinement engineers liberation.

**Stats**: 7 nodes, 6 edges. Variant file: variants.json

| Node | Role |
|------|------|
| Confinement | Origin |
| Spark of Hope | Disruption |
| Planning the Escape | Catalyst |
| Setbacks and Near-Discovery | Trial |
| Point of No Return | Commitment |
| The Escape Attempt | Crisis |
| Freedom | Resolution |

| Edge | Meaning |
|------|---------|
| Hope Appears | disrupts order |
| Begins Planning | grants insight |
| Obstacles Arise | narrows options |
| Now or Never | forces commitment |
| Executes the Plan | triggers crisis |
| Breaks Free | restores equilibrium |

---

## 2.12 The Sacrifice

**Description**: A protagonist relinquishes something of great value for a greater good, affirming moral commitment.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Valued Life | Origin |
| Threat Emerges | Disruption |
| Realization of Cost | Revelation |
| Resistance and Struggle | Trial |
| The Decision | Commitment |
| The Sacrificial Act | Crisis |
| World Saved | Resolution |

| Edge | Meaning |
|------|---------|
| Danger Arrives | disrupts order |
| Cost Becomes Clear | reveals truth |
| Fights the Necessity | tests resolve |
| Chooses to Pay the Price | forces commitment |
| Executes the Sacrifice | demands sacrifice |
| The Cost Is Felt | restores equilibrium |

---

## 2.13 The Mystery Unveiled

**Description**: An investigation reveals hidden truths, progressively reshaping understanding of events and characters.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Surface Order | Origin |
| Central Question Posed | Disruption |
| Initial Clues | Catalyst |
| False Trail | Trial |
| Deepening Complexity | Descent |
| Key Breakthrough | Revelation |
| Confrontation with Truth | Crisis |
| New Understanding | Resolution |

| Edge | Meaning |
|------|---------|
| Question Emerges | disrupts order |
| Gathers First Clues | grants insight |
| Follows the Wrong Lead | tests resolve |
| Reorients the Investigation | reframes goal |
| Connects the Dots | reveals truth |
| Forces the Truth Into the Open | triggers crisis |
| Truth Settles | restores equilibrium |

---

## 2.14 The Transformation

**Description**: A character undergoes profound internal or external change that redefines identity or worldview.

**Stats**: 7 nodes, 6 edges. No variants.

| Node | Role |
|------|------|
| Fixed Identity | Origin |
| Catalyst of Change | Disruption |
| Denial and Struggle | Trial |
| Liminal State | Descent |
| Crucible | Crisis |
| Integration | Transformation |
| New Identity | Resolution |

| Edge | Meaning |
|------|---------|
| Change Begins | disrupts order |
| Resists the Change | narrows options |
| Falls Between Identities | reveals truth |
| Forged by Crisis | triggers crisis |
| Integrates Old and New | enables transformation |
| Settles Into New Self | restores equilibrium |

---

## 2.15 The Rise and Fall

**Description**: A protagonist ascends to power or prominence and then declines due to flaw, corruption, or shifting circumstance.

**Stats**: 8 nodes, 7 edges. No variants.

| Node | Role |
|------|------|
| Humble Origin | Origin |
| First Opportunity | Disruption |
| Rapid Ascent | Threshold |
| Peak of Power | Reversal |
| Cracks Form | Descent |
| Desperate Grip | Crisis |
| The Fall | Irreversible Cost |
| Legacy | Resolution |

| Edge | Meaning |
|------|---------|
| Seizes the Chance | disrupts order |
| Climbs Fast | raises cost |
| Reaches the Top | forces commitment |
| Erosion Begins | reveals truth |
| Clings to Power | escalates conflict |
| Everything Collapses | triggers crisis |
| World Moves On | restores equilibrium |

---

# Part III: Genre Depth Graphs (27)

Each genre graph follows a 5-level spine (Genre Promise -> Core Constraint -> Subgenre Pattern -> Setting Rule -> Scene Obligation) plus Tone Marker and Anti-Pattern nodes. Severity is marked hard or soft on every edge and node.

## 3.1 Drama

**Description**: Character-driven stories emphasizing emotional stakes, interpersonal conflict, and consequential choices.

**Stats**: 18 nodes, 21 edges. Severity: 22 hard / 17 soft.

**Nodes**:
- L1: Drama Promise
- L2: Emotional Stakes Must Be Real; Characters Must Make Consequential Choices; Grounded in Plausible Human Experience; Conflict Is Primarily Interpersonal
- L3: Domestic Drama; Social Drama; Courtroom Drama; Tragedy-Inflected Drama
- L4: Confined or Intimate Setting; Time Compression or Deadline; Social Rules Constrain Behavior
- L5: Confrontation Scene; Irreversible Choice Scene; Aftermath / New Normal Scene
- Tone: Sustained Serious Tone
- Anti-Pattern: Unearned Emotional Manipulation; Purely Passive Protagonist

## 3.2 Action

**Description**: Stories propelled by physical conflict, high-stakes confrontation, and kinetic set pieces.

**Stats**: 17 nodes, 18 edges. Severity: 25 hard / 10 soft.

**Nodes**:
- L1: Action Promise
- L2: Physical Conflict Must Resolve the Central Problem; Stakes Must Escalate Through Action; Clear Antagonist or Opposing Force; Protagonist Has Demonstrated Physical Capability
- L3: Military/Combat Action; Chase/Pursuit Action; Heist/Infiltration Action; Survival Action
- L4: Environment Is Actively Dangerous; Physical Rules Are Consistent; Weapons and Tools Are Defined
- L5: Opening Action Sequence; Escalation Set Piece; Climactic Physical Confrontation
- Tone: Kinetic Energy and Momentum
- Anti-Pattern: Consequence-Free Violence

## 3.3 Comedy

**Description**: Stories designed to amuse through humor, incongruity, and social friction, resolving through reconciliation.

**Stats**: 17 nodes, 18 edges. Severity: 22 hard / 13 soft.

**Nodes**:
- L1: Comedy Promise
- L2: Humor Must Be the Primary Engine; Incongruity Creates Comic Tension; Stakes Are Real but Recoverable; Resolution Trends Toward Reconciliation
- L3: Screwball Comedy; Farce; Dark Comedy; Fish-Out-of-Water Comedy
- L4: Social Setting Amplifies Friction; Social Rules Exist to Be Subverted; Timing and Deadline Create Urgency
- L5: Comic Setup and Disruption Scene; Comic Escalation / Complication Scene; Comic Climax / Exposure Scene
- Tone: Playful and Inviting Tone
- Anti-Pattern: Humor at Characters' Permanent Expense

## 3.4 Thriller

**Description**: Suspense-driven stories focused on danger, uncertainty, and escalating tension.

**Stats**: 17 nodes, 18 edges. Severity: 25 hard / 10 soft.

**Nodes**:
- L1: Thriller Promise
- L2: Suspense Must Be Sustained; Information Is Incomplete or Unreliable; Danger Must Escalate; Protagonist Is Vulnerable
- L3: Psychological Thriller; Conspiracy Thriller; Cat-and-Mouse Thriller; Ticking-Clock Thriller
- L4: Information Is Controlled and Contested; Protagonist Is Isolated from Help; Trust Is Unreliable
- L5: Inciting Threat Scene; Major Reversal / Trust Betrayal Scene; Climactic Confrontation Under Maximum Pressure
- Tone: Atmosphere of Dread and Uncertainty
- Anti-Pattern: False Scares and Cheap Tension

## 3.5 Fantasy

**Description**: Stories set in worlds with magical rules or supernatural forces, emphasizing wonder and mythic stakes.

**Stats**: 17 nodes, 18 edges. Severity: 22 hard / 13 soft.

**Nodes**:
- L1: Fantasy Promise
- L2: Magic/Supernatural Must Have Rules; World Must Be Internally Coherent; Stakes Must Be Mythic or Transformative; Sense of Wonder Must Be Present
- L3: Epic/High Fantasy; Urban Fantasy; Dark Fantasy; Mythic/Fairy Tale Fantasy
- L4: Magic Has Visible Cost; World Operates by Its Own Logic; Boundary Between Mundane and Magical
- L5: World Entry / Wonder Establishment Scene; Magic Under Pressure Scene; Mythic Climax / Transformation Scene
- Tone: Tone of Wonder and Grandeur
- Anti-Pattern: Deus Ex Machina Magic

## 3.6 Science Fiction

**Description**: Stories exploring speculative technology, future societies, or alternative realities.

**Stats**: 17 nodes, 18 edges. Severity: 23 hard / 12 soft.

**Nodes**:
- L1: Science Fiction Promise
- L2: Story Must Be Driven by a Speculative Premise; Speculative Elements Must Be Internally Consistent; Consequences Must Be Explored; Speculative Premise Must Feel Plausible
- L3: Hard Science Fiction; Social Science Fiction; Space Opera; Dystopian / Post-Apocalyptic
- L4: Technology Has Defined Capabilities and Limits; Society Has Adapted to the Speculative Premise; Recognizable Human Core Despite Extrapolation
- L5: Premise Establishment / World Difference Scene; Consequence / Ethical Dilemma Scene; Premise-Dependent Resolution Scene
- Tone: Intellectual Engagement and Curiosity
- Anti-Pattern: Technology as Magic

## 3.7 Adventure

**Description**: Journey-centered stories defined by exploration, discovery, and escalating obstacles.

**Stats**: 17 nodes, 18 edges. Severity: 22 hard / 13 soft.

**Nodes**:
- L1: Adventure Promise
- L2: Story Must Be Structured as a Journey; Discovery and Novelty Must Be Present; Obstacles Must Escalate; Clear External Goal Drives the Journey
- L3: Treasure Hunt / Artifact Quest; Exploration / Discovery Adventure; Rescue / Retrieval Adventure; Survival Expedition
- L4: Environments Must Be Varied and Vivid; Environment Acts as Active Force; Resources Are Limited and Must Be Managed
- L5: Departure / Journey Launch Scene; Major Discovery / Setback Scene; Final Approach / Ultimate Challenge Scene
- Tone: Tone of Excitement and Discovery
- Anti-Pattern: Static or Purposeless Wandering

## 3.8 Romance

**Description**: Stories where the central arc focuses on forming, testing, or restoring an intimate relationship.

**Stats**: 17 nodes, 20 edges. Severity: 24 hard / 13 soft.

**Nodes**:
- L1: Romance Promise
- L2: Central Relationship Must Be the Primary Story Engine; Emotional Vulnerability Must Be Present in Both Parties; Obstacles to the Relationship Must Be Genuine and Consequential; The Relationship Outcome Must Feel Earned, Not Given
- L3: Contemporary Romance; Historical Romance; Paranormal / Fantasy Romance; Romantic Suspense
- L4: Setting Must Create Proximity Between Leads; Social and Cultural Barriers Must Be Visible; Private Spaces vs. Public Performance Contrast
- L5: Meeting / Attraction Scene; Intimacy Breakthrough Scene; Grand Gesture / Declaration / Commitment Scene
- Tone: Emotional Intensity and Romantic Atmosphere
- Anti-Pattern: Relationship Without Genuine Obstacles

## 3.9 Romantic Comedy

**Description**: Romance structured around humor and social friction, moving from mismatch toward commitment.

**Stats**: 17 nodes, 23 edges. Severity: 26 hard / 14 soft.

**Nodes**:
- L1: Romantic Comedy Promise
- L2: Romance and Humor Must Be Co-Equal Engines; Couple Must Be Mismatched or in Conflict; Social Friction Generates Both Comedy and Obstacles; Resolution Must Deliver Both Romantic and Comic Satisfaction
- L3: Screwball Romance; Workplace Rom-Com; Friends-to-Lovers; Fake Relationship / Marriage of Convenience
- L4: Setting Forces Repeated Interaction; Social Audience Amplifies Comic Stakes; Public vs. Private Behavior Diverges
- L5: Meet-Cute or Charged First Encounter Scene; Misunderstanding Escalation Scene; Grand Romantic Gesture / Truth-Telling Scene
- Tone: Wit, Warmth, and Playful Energy
- Anti-Pattern: Romance Without Chemistry, Comedy Without Heart

## 3.10 Horror

**Description**: Stories designed to evoke fear or dread through threat, the uncanny, or the monstrous.

**Stats**: 17 nodes, 23 edges. Severity: 32 hard / 8 soft.

**Nodes**:
- L1: Horror Promise
- L2: Threat Must Be Present, Escalating, and Genuinely Dangerous; Protagonist Must Be Vulnerable; Atmosphere of Dread Must Be Sustained; The Threat Must Have a Logic
- L3: Supernatural Horror; Slasher / Survival Horror; Cosmic / Existential Horror; Psychological Horror
- L4: Isolation Amplifies Threat; Normal Spaces Become Uncanny; Darkness and Concealment
- L5: First Anomaly / Scare Scene; Escalation Sequence; Final Confrontation / Survival Scene
- Tone: Sustained Dread Atmosphere
- Anti-Pattern: Consequence-Free Scares

## 3.11 Mystery

**Description**: Investigation-centered stories driven by unanswered questions, clues, and revelations.

**Stats**: 17 nodes, 20 edges. Severity: 27 hard / 10 soft.

**Nodes**:
- L1: Mystery Promise
- L2: A Central Question Must Drive the Narrative; Fair Clueing; Red Herrings Allowed, Cheating Is Not; Resolution Must Explain, Not Just Reveal
- L3: Cozy Mystery; Hardboiled Mystery; Police Procedural; Locked Room / Impossible Crime
- L4: Closed Circle of Suspects; Evidence Is Physically Present; Social Dynamics Conceal and Reveal
- L5: Discovery of the Crime/Mystery Scene; Investigation Pivot Scene; Reveal/Confrontation Scene
- Tone: Intellectual Engagement and Mounting Curiosity
- Anti-Pattern: Withheld Clues / Unfair Resolution

## 3.12 Crime

**Description**: Stories focused on criminal acts and their consequences, emphasizing moral compromise and power.

**Stats**: 17 nodes, 20 edges. Severity: 25 hard / 12 soft.

**Nodes**:
- L1: Crime Promise
- L2: Criminal Activity Must Be Central; Consequences Must Be Real and Proportional; Moral Ambiguity; Power Dynamics Drive the Conflict
- L3: Organized Crime / Mob Story; Heist / Caper; Crime Thriller / Noir; True Crime / Docudrama
- L4: Criminal Ecosystem; Law Enforcement Presence; Territory and Power
- L5: The Crime Scene; The Moral Compromise Scene; The Reckoning Scene
- Tone: Moral Weight and Gritty Realism
- Anti-Pattern: Glamorized Crime Without Consequences

## 3.13 Detective

**Description**: A mystery subgenre centered on a dedicated investigator whose method drives the unraveling of a case.

**Stats**: 17 nodes, 23 edges. Severity: 28 hard / 12 soft.

**Nodes**:
- L1: Detective Promise
- L2: Dedicated Investigator as Central Character; Investigator's Method Must Be Visible and Consistent; The Case Must Be Genuinely Challenging; Solution Must Come from the Detective's Work
- L3: Classic / Golden Age Detective; Hardboiled Private Eye; Police Detective; Amateur / Consulting Detective
- L4: Crime Scene as Evidence Field; Interview and Interrogation Dynamics; Institutional Context
- L5: Case Assignment / Discovery Scene; Investigation Breakthrough Scene; Confrontation / Solution Presentation Scene
- Tone: Intellectual Rigor and Methodical Persistence
- Anti-Pattern: Detective as Passive Observer

## 3.14 Superhero

**Description**: Stories featuring extraordinary abilities, emphasizing identity, moral responsibility, and major threats.

**Stats**: 17 nodes, 19 edges. Severity: 26 hard / 10 soft.

**Nodes**:
- L1: Superhero Promise
- L2: Protagonist Must Possess Extraordinary Capacity; Dual Identity Creates Structural Tension; Threats Must Escalate to Match Heroic Capacity; Power Creates Moral Obligation
- L3: Origin Story; Vigilante / Dark Hero; Team / Ensemble Superhero; Cosmic / Mythic Superhero
- L4: A Community Depends on the Hero; Power Has Rules and Defined Limits; Villain Ecosystem Mirrors the Hero
- L5: Power Demonstration Scene; Identity Crisis Scene; Climactic Battle Scene
- Tone: Heroic Grandeur Mixed with Personal Vulnerability
- Anti-Pattern: Invincible Hero with No Stakes

## 3.15 Historical

**Description**: Stories set in a recognizable past, using period detail and historical context as a primary source of stakes.

**Stats**: 17 nodes, 19 edges. Severity: 25 hard / 11 soft.

**Nodes**:
- L1: Historical Promise
- L2: Period Must Be Specific and Recognizable; Historical Context Must Generate the Conflict; Period-Accurate Social Constraints; Characters Must Exist Within Their Time's Worldview
- L3: Period Drama (Intimate); Historical Epic (Sweeping); Biographical Historical; Revisionist / Alternative History
- L4: Material Culture Must Be Period-Accurate; Social Hierarchy Constrains Characters; Historical Events Provide Structure
- L5: Period Establishment Scene; Clash Between Personal Desire and Period Constraint; Historical Consequence Scene
- Tone: Immersive Period Atmosphere
- Anti-Pattern: Anachronistic Characters

## 3.16 War

**Description**: Stories in which armed conflict is central, emphasizing combat, survival, and the human cost of violence.

**Stats**: 17 nodes, 23 edges. Severity: 28 hard / 12 soft.

**Nodes**:
- L1: War Promise
- L2: Armed Conflict Must Be Central; Human Cost of Violence Must Be Visible; Duty vs. Survival Tension; Brotherhood and Unit Cohesion
- L3: Combat/Front-Line War; Home Front War; Anti-War Narrative; Military Strategy and Command
- L4: Battlefield Geography Shapes Action; Chain of Command Constrains Individual Action; Scarcity and Danger Are Constant
- L5: Into Combat Scene; Loss/Cost-of-War Scene; Mission Climax / Final Stand
- Tone: Gravity and Visceral Intensity
- Anti-Pattern: Glorified Violence Without Human Cost

## 3.17 Biography

**Description**: Narratives based on real individuals, balancing fidelity to facts and dramatic structure.

**Stats**: 18 nodes, 20 edges. Severity: 25 hard / 13 soft.

**Nodes**:
- L1: Biography Promise
- L2: Based on a Real Person; Formative Events Must Be Selected and Dramatized; Character Arc Must Emerge from Real Events; Balance Between Fidelity and Dramatic Needs
- L3: Rise-and-Fall Biography; Portrait / Character Study; Period-of-Life Biography; Authorized / Hagiographic vs. Critical
- L4: Real Historical Context; Real Relationships Anchor the Drama; Public vs. Private Self Divergence
- L5: Defining Moment Scene; Crucible / Pressure Scene; Legacy / Summation Scene
- Tone: Intimate Revelation and Historical Gravity
- Anti-Pattern: Wikipedia Page (Chronological Without Structure); Hagiographic Distortion

## 3.18 Family

**Description**: Stories structured around family relationships and generational dynamics.

**Stats**: 17 nodes, 21 edges. Severity: 24 hard / 14 soft.

**Nodes**:
- L1: Family Genre Promise
- L2: Family Relationships Must Be the Primary Engine; Content Must Be Accessible Across Age Groups; Emotional Stakes Rooted in Belonging; Resolution Trends Toward Connection
- L3: Animated Family Adventure; Family Drama / Multigenerational; Family Comedy; Coming-of-Age Within Family
- L4: Home Spaces Are Emotionally Charged; Family Rituals Structure Narrative; Multiple Generations Interact
- L5: Family Gathering / Disruption Scene; Generational Clash Scene; Reconciliation / Reunion Scene
- Tone: Warmth, Emotional Accessibility, and Earned Sentiment
- Anti-Pattern: Saccharine Without Genuine Conflict

## 3.19 Young Adult

**Description**: Stories centering identity formation, social belonging, first love, and boundary-testing choices.

**Stats**: 18 nodes, 23 edges. Severity: 30 hard / 11 soft.

**Nodes**:
- L1: Young Adult Promise
- L2: Protagonist Must Be in Identity Formation; First Experiences Carry Disproportionate Weight; Authority Structures Must Be Tested; Choices Feel World-Defining
- L3: YA Contemporary Realism; YA Dystopian / Speculative; YA Romance; YA Adventure / Fantasy
- L4: School / Social Hierarchy as Arena; Peer Relationships Define the World; Adult World as Shelter and Cage
- L5: Identity-Defining Choice Scene; First Experience / Crossing Threshold Scene; Confrontation with Authority Scene
- Tone: Emotional Intensity and Urgent Sincerity
- Anti-Pattern: Condescension Toward Teen Experience; Static Identity

## 3.20 Literary Fiction

**Description**: Character- and language-forward stories prioritizing psychological depth, thematic complexity, and craft.

**Stats**: 18 nodes, 21 edges. Severity: 27 hard / 12 soft.

**Nodes**:
- L1: Literary Fiction Promise
- L2: Character Interiority Is the Primary Engine; Language and Style Are Expressive Tools; Thematic Complexity Without Easy Answers; Ambiguity Is a Feature
- L3: Psychological Realism; Experimental and Postmodern; Domestic Literary Fiction; Social and Political Literary Fiction
- L4: Mundane Settings Carry Symbolic Weight; Time May Be Non-Linear; Interior Life As Vivid As Exterior
- L5: Interiority Scene; Epiphany or Shift-in-Understanding Scene; Ambiguous or Resonant Ending Scene
- Tone: Contemplative, Precise, Emotionally Layered
- Anti-Pattern: Beautiful Prose Concealing Empty Story; Interiority Subordinated to Plot

## 3.21 Children's Literature

**Description**: Stories for children emphasizing clarity, imaginative engagement, and moral or emotional learning.

**Stats**: 17 nodes, 21 edges. Severity: 24 hard / 14 soft.

**Nodes**:
- L1: Children's Literature Genre Promise
- L2: Protagonist Is a Child or Child-Analog; Stakes Must Be Age-Appropriate but Genuinely Felt; Imagination and Wonder Must Be Central; Clear Moral Takeaway Without Preachiness
- L3: Picture Book / Early Reader; Middle Grade Adventure; Animal / Fantasy Allegory; Educational / Moral Fable
- L4: World Seen Through Child's Perspective; Safe-Enough Frame; Adult Figures Present but Not in Control
- L5: Wonder / Discovery Scene; Challenge That Tests the Child; Resolution with Earned Understanding
- Tone: Clarity, Warmth, and Imaginative Energy
- Anti-Pattern: Condescension or Adult Agenda Imposed

## 3.22 Satire

**Description**: Stories using humor, exaggeration, or irony to critique social norms, institutions, or hypocrisy.

**Stats**: 17 nodes, 19 edges. Severity: 26 hard / 10 soft.

**Nodes**:
- L1: Satire Promise
- L2: A Specific Target Must Be Identified; Humor Must Serve the Critique; Exaggeration Must Reveal Truth; Real-World Parallel Must Be Legible
- L3: Political Satire; Social Satire; Institutional / Bureaucratic Satire; Media / Cultural Satire
- L4: Setting Mirrors a Real-World System; Characters Embody the Target; Logical Absurdity
- L5: Establishment of the Absurd Norm; Escalation of Absurdity; Moment of Clarity / Exposure
- Tone: Sharp Wit with Moral Purpose
- Anti-Pattern: Mockery Without Point

## 3.23 Psychological

**Description**: Stories emphasizing internal conflict, perception, and mental pressure.

**Stats**: 17 nodes, 19 edges. Severity: 24 hard / 12 soft.

**Nodes**:
- L1: Psychological Promise
- L2: Internal Conflict Is the Primary Engine; Perception and Reality Are Contested; Mental Pressure Must Escalate; Psychology Is Source of Both Danger and Resolution
- L3: Psychological Thriller; Psychological Drama; Psychological Horror; Identity and Dissociation Story
- L4: Subjective Experience Dominates; Confined Spaces Reflect Internal State; Relationships as Tools of Manipulation
- L5: Reality-Questioning Scene; Obsession and Breakdown Escalation Scene; Revelation or Confrontation-with-Self Scene
- Tone: Unsettling Interiority and Mounting Claustrophobia
- Anti-Pattern: Surface-Level Craziness Without Psychological Logic

## 3.24 Western

**Description**: Stories set on an untamed frontier where individual agency and a personal moral code are the only sources of order.

**Stats**: 17 nodes, 21 edges. Severity: 28 hard / 10 soft.

**Nodes**:
- L1: Western Promise
- L2: Frontier Setting as Active Force; Personal Moral Code Substitutes for Law; Physical Competence Determines Outcomes; Law Is Absent, Weak, or Corrupt
- L3: Classic/Traditional Western; Revisionist Western; Frontier/Settler Western; Contemporary/Neo-Western
- L4: Landscape Functions as Character; Limited Resources and Isolation; The Frontier Code Governs Conduct
- L5: Showdown / Confrontation Scene; Arrival / Departure Scene; Landscape-as-Stakes Scene
- Tone: Stoic, Spare, Elemental
- Anti-Pattern: Romanticized Violence Without Consequence

## 3.25 Political

**Description**: Stories where the central arena of conflict is power -- who holds it, who wants it, and what it costs.

**Stats**: 17 nodes, 19 edges. Severity: 25 hard / 11 soft.

**Nodes**:
- L1: Political Genre Promise
- L2: Power Structures Must Be Legible; Stakes Are Collective; Compromise and Strategy Are Primary Means; Institutional Mechanics Drive Plot
- L3: Political Thriller; Political Drama; Dystopian Political; Campaign and Election Narrative
- L4: Institutional Realism; Competing Factions With Legible Interests; Public Versus Private Face of Power
- L5: Negotiation and Deal-Making Scene; Betrayal and Political Realignment Scene; Public Speech and Political Persuasion Scene
- Tone: Calculated Intelligence and Moral Ambiguity
- Anti-Pattern: Naive Idealism

## 3.26 Musical

**Description**: Stories where emotion becomes so intense that characters break into song to express what dialogue cannot.

**Stats**: 18 nodes, 20 edges. Severity: 28 hard / 10 soft.

**Nodes**:
- L1: Musical Promise
- L2: Songs Must Advance Plot or Reveal Character; Emotional Escalation Justifies the Musical Break; The World Must Establish Song Logic; Musical and Narrative Structure Must Be Integrated
- L3: Classic Book Musical; Jukebox Musical; Rock Opera / Sung-Through Musical; Musical Comedy
- L4: Heightened Emotional Reality; Musical Numbers Have Narrative Function; Ensemble Supports Emotional Landscape
- L5: I Want Song; Showstopper / Act-Break Number; Reprise or Transformation Number
- Tone: Heightened, Emotionally Expansive, Performative
- Anti-Pattern: Songs That Halt Narrative Momentum; Inconsistent Rules for Why Characters Sing

## 3.27 Holiday

**Description**: Stories in which a seasonal occasion functions as both structural deadline and emotional catalyst.

**Stats**: 18 nodes, 21 edges. Severity: 29 hard / 10 soft.

**Nodes**:
- L1: Holiday Promise
- L2: Holiday as Structural Deadline; Reconnection or Renewal as Central Drive; Emotional Transformation Must Occur; Seasonal Setting Is Essential
- L3: Christmas / Winter Holiday; Halloween / Spooky Holiday; Valentine's Day / Romance Holiday; Thanksgiving / Harvest / Gratitude Holiday
- L4: Holiday Trappings Are Load-Bearing; Community or Family Gathering Is Required; Ticking Clock of the Holiday Deadline
- L5: Broken Tradition or Disrupted Celebration Scene; Moment of Reconnection or Forgiveness; Celebration-Restored Scene
- Tone: Warm, Nostalgic, Sentimental with Earned Emotion
- Anti-Pattern: Cynicism Punished Rather Than Transformed; Holiday as Mere Backdrop

---

# Part IV: Cross-Reference Data

## 4.1 Cross-Archetype Node Role Usage

| Role | Instances | Archetypes |
|------|-----------|------------|
| Origin | 15 | All 15 (universal) |
| Crisis | 16 | All 15 (Hero's Journey has 2) |
| Resolution | 15 | All 15 (universal) |
| Disruption | 14 | All except Voyage and Return |
| Trial | 14 | 13 archetypes (Hero's Journey has 2) |
| Descent | 8 | Hero's Journey, Quest, Voyage & Return, Overcoming Monster, Tragedy, Mystery, Transformation, Rise & Fall |
| Commitment | 8 | Hero's Journey, Overcoming Monster, Rebirth, Comedy, Revenge, Escape, Sacrifice, Rags to Riches |
| Revelation | 7 | Quest, Voyage & Return, Tragedy, Comedy, Revenge, Sacrifice, Mystery |
| Catalyst | 7 | Hero's Journey, Quest, Overcoming Monster, Coming of Age, Revenge, Escape, Mystery |
| Threshold | 5 | Hero's Journey, Rags to Riches, Voyage & Return, Tragedy, Rise & Fall |
| Reversal | 4 | Rags to Riches, Tragedy, Escape (variant), Rise & Fall |
| Transformation | 4 | Hero's Journey, Quest, Rebirth, Transformation |
| Irreversible Cost | 3 | Tragedy, Coming of Age, Rise & Fall |
| Reckoning | 0 | Defined but unused |

## 4.2 Cross-Archetype Edge Meaning Usage

| Meaning | Instances | Archetypes |
|---------|-----------|------------|
| disrupts order | 15 | All 15 (universal opening edge) |
| restores equilibrium | 14 | 14 of 15 (Coming of Age uses "enables transformation") |
| forces commitment | 13 | 11 archetypes (Hero's Journey and Quest have 2 each) |
| reveals truth | 11 | 11 archetypes |
| triggers crisis | 10 | 10 archetypes |
| narrows options | 9 | 8 archetypes (Hero's Journey has 2) |
| grants insight | 7 | 7 archetypes |
| raises cost | 6 | 6 archetypes |
| demands sacrifice | 6 | 6 archetypes |
| tests resolve | 5 | 5 archetypes |
| enables transformation | 4 | 4 archetypes |
| escalates conflict | 3 | Overcoming Monster, Revenge, Rise & Fall |
| reframes goal | 2 | Overcoming Monster, Mystery Unveiled |
| inverts expectation | 1 | Escape (optional recapture branch only) |
| compels return | 0 | Defined but unused |

## 4.3 Cross-Genre Constraint Index (16 recurring types)

| Constraint Type | Genres |
|----------------|--------|
| Stakes Escalation | Drama, Action, Thriller, Horror, Adventure, Superhero, Psychological, Musical |
| Internal Consistency / Rules | Fantasy, Sci-Fi, Horror, Mystery, Detective, Action, Superhero |
| Moral Reckoning / Ethical Tension | Drama, Crime, War, Superhero, Western, Political, Literary Fiction |
| Protagonist Vulnerability vs Capability | Thriller, Horror, Action, Superhero, Western, Detective |
| Genuine Obstacles / Resistance | Romance, Romantic Comedy, Comedy, Mystery, Detective, Adventure |
| Resolution Constraint | Comedy, Romance, Romantic Comedy, Family, Mystery, Children's Lit |
| Social Rules / Hierarchy | Drama, Comedy, Historical, Mystery, Young Adult, Family |
| Isolation / Confinement | Thriller, Horror, Drama, Western, Psychological, War |
| Consequential Choice / Agency | Drama, Young Adult, Holiday, Romance, Literary Fiction |
| Plausibility / Grounding | Drama, Sci-Fi, Historical, Biography, Fantasy |
| Institutional Mechanics | Political, Detective, Crime, War, Historical |
| Public vs Private Self | Romance, Romantic Comedy, Biography, Political, Satire |
| Real Consequences / Visible Cost | Crime, War, Historical, Sci-Fi |
| Wonder / Discovery | Fantasy, Adventure, Children's Lit, Sci-Fi |
| Relationship as Engine | Romance, Romantic Comedy, Family, Drama |
| Environment as Active Force | Action, Adventure, Western, War |

---

# Part V: Genre x Archetype Compatibility Matrix

Compatibility tiers: **Natural** (genre and archetype reinforce each other), **Occasional** (workable with intent), **Rare** (requires deliberate subversion).

| Genre | Natural | Occasional | Rare |
|-------|---------|-----------|------|
| Drama | Tragedy, Coming of Age, Rebirth, Rise & Fall, Sacrifice | Hero's Journey, Rags to Riches, Revenge, Escape, Mystery, Transformation, Comedy | Quest, Voyage & Return, Overcoming Monster |
| Action | Hero's Journey, Quest, Overcoming Monster, Revenge, Escape | Rise & Fall, Sacrifice, Rags to Riches, Voyage & Return | Coming of Age, Rebirth, Tragedy, Comedy, Mystery, Transformation |
| Comedy | Comedy, Coming of Age, Voyage & Return | Rags to Riches, Rebirth, Quest, Hero's Journey, Escape | Tragedy, Revenge, Rise & Fall, Sacrifice, Overcoming Monster, Mystery, Transformation |
| Thriller | Mystery, Escape, Overcoming Monster, Revenge | Hero's Journey, Rise & Fall, Sacrifice, Transformation, Tragedy | Quest, Voyage & Return, Comedy, Coming of Age, Rebirth, Rags to Riches |
| Fantasy | Hero's Journey, Quest, Voyage & Return, Overcoming Monster | Coming of Age, Rebirth, Sacrifice, Transformation, Rags to Riches | Tragedy, Comedy, Revenge, Rise & Fall, Escape, Mystery |
| Science Fiction | Hero's Journey, Quest, Voyage & Return, Overcoming Monster, Transformation | Escape, Sacrifice, Mystery, Rise & Fall, Tragedy, Rebirth | Rags to Riches, Comedy, Revenge, Coming of Age |
| Adventure | Hero's Journey, Quest, Voyage & Return, Overcoming Monster, Escape | Revenge, Sacrifice, Rags to Riches, Coming of Age | Tragedy, Comedy, Rebirth, Rise & Fall, Mystery, Transformation |
| Romance | Comedy, Rags to Riches, Rebirth, Transformation | Hero's Journey, Coming of Age, Sacrifice, Tragedy, Voyage & Return | Quest, Overcoming Monster, Revenge, Escape, Rise & Fall, Mystery |
| Romantic Comedy | Comedy, Coming of Age, Voyage & Return | Rags to Riches, Rebirth, Transformation, Hero's Journey | Tragedy, Revenge, Rise & Fall, Sacrifice, Quest, Overcoming Monster, Escape, Mystery |
| Horror | Overcoming Monster, Escape, Voyage & Return, Mystery | Hero's Journey, Tragedy, Transformation, Sacrifice, Rebirth | Quest, Comedy, Rags to Riches, Revenge, Coming of Age, Rise & Fall |
| Mystery | Mystery Unveiled, Comedy | Hero's Journey, Revenge, Escape, Transformation, Tragedy | Quest, Voyage & Return, Overcoming Monster, Rags to Riches, Rebirth, Coming of Age, Sacrifice, Rise & Fall |
| Crime | Rise & Fall, Revenge, Tragedy, Mystery | Hero's Journey, Escape, Overcoming Monster, Rags to Riches, Sacrifice | Quest, Voyage & Return, Comedy, Coming of Age, Rebirth, Transformation |
| Detective | Mystery Unveiled | Hero's Journey, Overcoming Monster, Revenge, Tragedy, Transformation | Quest, Voyage & Return, Comedy, Rags to Riches, Rebirth, Coming of Age, Escape, Sacrifice, Rise & Fall |
| Superhero | Hero's Journey, Overcoming Monster, Sacrifice, Transformation | Quest, Rise & Fall, Coming of Age, Revenge, Rebirth | Voyage & Return, Comedy, Rags to Riches, Tragedy, Escape, Mystery |
| Historical | Tragedy, Rise & Fall, Sacrifice, Coming of Age | Hero's Journey, Quest, Revenge, Rebirth, Mystery, Rags to Riches | Voyage & Return, Overcoming Monster, Comedy, Escape, Transformation |
| War | Hero's Journey, Sacrifice, Overcoming Monster, Tragedy | Quest, Escape, Coming of Age, Revenge, Rise & Fall, Rebirth | Voyage & Return, Comedy, Rags to Riches, Mystery, Transformation |
| Biography | Rise & Fall, Coming of Age, Rags to Riches, Tragedy | Hero's Journey, Rebirth, Sacrifice, Transformation, Revenge | Quest, Voyage & Return, Overcoming Monster, Comedy, Escape, Mystery |
| Family | Coming of Age, Comedy, Voyage & Return, Quest | Hero's Journey, Rebirth, Sacrifice, Rags to Riches, Transformation | Tragedy, Revenge, Rise & Fall, Overcoming Monster, Escape, Mystery |
| Young Adult | Coming of Age, Hero's Journey, Rags to Riches, Escape | Quest, Voyage & Return, Overcoming Monster, Rebirth, Transformation, Mystery | Tragedy, Comedy, Revenge, Sacrifice, Rise & Fall |
| Literary Fiction | Tragedy, Rebirth, Transformation, Coming of Age, Rise & Fall | Mystery, Sacrifice, Voyage & Return, Comedy, Hero's Journey | Quest, Overcoming Monster, Rags to Riches, Revenge, Escape |
| Children's Lit | Voyage & Return, Quest, Coming of Age, Hero's Journey | Comedy, Overcoming Monster, Rags to Riches, Rebirth, Transformation | Tragedy, Revenge, Rise & Fall, Sacrifice, Escape, Mystery |
| Satire | Comedy, Rise & Fall, Tragedy | Voyage & Return, Rebirth, Mystery, Hero's Journey | Quest, Overcoming Monster, Rags to Riches, Revenge, Escape, Coming of Age, Sacrifice, Transformation |
| Psychological | Transformation, Mystery, Tragedy, Rebirth | Escape, Rise & Fall, Hero's Journey, Coming of Age, Sacrifice | Quest, Voyage & Return, Overcoming Monster, Comedy, Rags to Riches, Revenge |
| Western | Overcoming Monster, Revenge, Hero's Journey, Quest | Rise & Fall, Sacrifice, Escape, Tragedy, Coming of Age | Voyage & Return, Comedy, Rags to Riches, Rebirth, Mystery, Transformation |
| Political | Rise & Fall, Tragedy, Mystery, Revenge | Hero's Journey, Sacrifice, Rebirth, Escape, Comedy | Quest, Voyage & Return, Overcoming Monster, Rags to Riches, Coming of Age, Transformation |
| Musical | Comedy, Coming of Age, Rags to Riches, Voyage & Return | Hero's Journey, Rebirth, Transformation, Sacrifice | Tragedy, Revenge, Rise & Fall, Overcoming Monster, Escape, Mystery |
| Holiday | Rebirth, Comedy, Coming of Age, Sacrifice | Voyage & Return, Hero's Journey, Rags to Riches, Transformation | Tragedy, Revenge, Rise & Fall, Quest, Overcoming Monster, Escape, Mystery |

---

# Part VI: Emotional Arcs

| Archetype | Arc Shape | Dominant Emotion | Summary |
|-----------|----------|-----------------|---------|
| Hero's Journey | W-curve | hope | Double-crisis shape: trials -> ordeal -> reward -> resurrection -> resolution |
| Rags to Riches | J-curve | hope | Low start -> rises -> crashes at crisis -> sharp recovery exceeding false peak |
| The Quest | U-curve | hope | Steady build through trials -> max tension at climactic ordeal -> clean release |
| Voyage and Return | U-curve | fear | Wonder -> plunges into fear as world turns hostile -> cathartic escape |
| Overcoming the Monster | U-curve | fear | Escalating fear -> nightmare phase = max terror -> sharp restoration |
| Rebirth | ascending | hope | Near-absent hope -> deepens through resistance -> sustained ascent to renewal |
| Tragedy | descending | fear | Max hope at start -> relentless descent through unraveling to downfall |
| Comedy | U-curve | hope | Constrained -> escalates to dark moment -> unmasking -> reconciliation |
| Coming of Age | U-curve | hope | Innocence -> complexity -> identity crisis -> bittersweet maturity |
| The Revenge | inverted-U | tension | Spikes at wrong, never subsides. Ambiguous resolution. |
| The Escape | ascending | fear | High fear -> tension builds through planning -> sharpest emotional release |
| The Sacrifice | inverted-U | tension | Escalating threat -> decision is emotional fulcrum -> bittersweet |
| Mystery Unveiled | U-curve | tension | Surface calm -> steady tension -> false trail -> breakthrough -> clarity |
| The Transformation | U-curve | fear | Rigid identity shattered -> terrifying liminal state -> rapid recovery |
| The Rise and Fall | inverted-U | hope | Humble -> rapid ascent to peak -> steep fall -> muted legacy |

---

# Part VII: Element Role Index

## 7.1 Character Roles (13)

| Role | Usage | Required | Notes |
|------|-------|----------|-------|
| protagonist | 15 | 15 | Universal. Labels vary per archetype. |
| ally | 12 | 1 | Required only in Quest. |
| antagonist | 12 | 10 | Missing from Hero's Journey, Rebirth, Transformation. |
| love_interest | 9 | 1 | Required only in Sacrifice. |
| mentor | 8 | 2 | Required in Hero's Journey, Coming of Age. |
| herald | 7 | 3 | Required in Rebirth, Mystery, Transformation. |
| foil | 6 | 0 | Always optional. |
| shadow | 5 | 4 | Required in Hero's Journey, Rebirth, Transformation, Rise & Fall. |
| trickster | 5 | 0 | Always optional. |
| confidant | 5 | 0 | Always optional. |
| shapeshifter | 4 | 0 | Always optional. |
| threshold_guardian | 3 | 0 | Always optional. |
| comic_relief | 1 | 0 | Only in Comedy. |

## 7.2 Place Types (10)

| Type | Usage | Required | Notes |
|------|-------|----------|-------|
| ordinary_world | 12 | 12 | Starting location. |
| home | 11 | 11 | Return/resolution place. |
| special_world | 10 | 10 | Adventure/challenge space. |
| stronghold | 7 | 5 | Final destination or enemy domain. |
| crossroads | 6 | 6 | Decision/turning point places. |
| underworld | 4 | 4 | Deep descent locations. |
| wasteland | 4 | 4 | Desolation places. |
| threshold | 3 | 3 | Passage/boundary places. |
| summit | 3 | 2 | Required in Tragedy, Rise & Fall. |
| sanctuary | 2 | 0 | Always optional. |

## 7.3 Object Types (10)

| Type | Usage | Required | Notes |
|------|-------|----------|-------|
| symbol | 9 | 0 | Most common, always optional. |
| relic | 6 | 0 | Always optional. |
| weapon | 5 | 2 | Required in Overcoming Monster, Revenge. |
| document | 5 | 1 | Required in Mystery. |
| key | 4 | 2 | Required in Rags to Riches, Voyage & Return. |
| talisman | 3 | 0 | Always optional. |
| treasure | 3 | 3 | Required in Hero's Journey, Quest, Rise & Fall. |
| vessel | 2 | 0 | Always optional. |
| mcguffin | 2 | 1 | Required in Mystery. |
| tool | 1 | 1 | Only in Escape. |

---

# Part VIII: Cross-Medium Adaptation

6 works analyzed across 4 transition types with 12 general rules.

## Adapted Works

| Work | Archetype | Transition | Key Changes |
|------|----------|-----------|-------------|
| The Lord of the Rings | Quest | novel -> film | Origin/Catalyst compressed; Trial (Helm's Deep) massively expanded; Scouring of the Shire removed |
| Game of Thrones | Rise & Fall | novel -> TV | Parallel storylines expanded across episodes; Reversals become season climaxes; Resolution rushed |
| Jurassic Park | Overcoming Monster | novel -> film | Scientific setup compressed; Disruption/Trial expanded into set pieces; Crisis restructured |
| Les Miserables | Rebirth | novel -> stage -> film | Disruption (Bishop's mercy) preserved across all; emotional content musicalized; crisis compressed |
| The Witcher | Hero's Journey | novel -> game | Trial massively expanded (100+ hours); Crisis becomes player-determined; multiple endings |
| Romeo and Juliet | Tragedy | stage -> film | Origin visualized; Descent gains kinetic energy; Irreversible Cost gains close-up intimacy |

## General Rules

1. **Novel -> Film**: Origin/Resolution compress; Trial/Crisis expand
2. **Novel -> Film**: Intellectual exposition becomes visual spectacle
3. **Novel -> Film**: Distributed encounters consolidate into focused set pieces
4. **Novel -> TV**: Parallel storylines expand; convergent resolution compresses
5. **Novel -> TV**: Reversal nodes become season-ending climaxes
6. **Novel -> TV**: Character introductions spread across episodes
7. **Any -> Game**: Trial phase massively expands; Origin/Resolution compress
8. **Any -> Game**: Fixed plot points become branching decision trees
9. **Any -> Game**: Mentor/Catalyst nodes become distributed NPC interactions
10. **Stage -> Film**: Verbal exposition becomes visual world-building
11. **Stage -> Film**: Interior emotional states gain visual expression via cinematography
12. **Any -> Musical**: Interior states externalized through song; transformation shown through reprise

---

# Part IX: Non-Western Archetypes

10 archetypes from 5 traditions extending the Western 15.

| Name | Tradition | Western Cognate | Key Difference |
|------|----------|----------------|----------------|
| The Wuxia Hero's Path | East Asian (Chinese) | Hero's Journey | Extended training, moral code, withdrawal resolution |
| The Dharma Conflict | South Asian (Hindu) | Tragedy | Duty-vs-duty, not flaw-based; no hamartia |
| The Divine Exile and Return | South Asian (Hindu) | Voyage and Return | Exile is involuntary; protagonist already complete; cosmic restoration |
| The Trickster Cycle | African / Indigenous | Comedy | Amoral, episodic, world-changing; no moral lesson |
| The Community Restoration | African | None | Community is protagonist, not an individual |
| The Frame-Tale Labyrinth | Middle Eastern / South Asian | None | Recursive nested structure; meaning distributed across levels |
| The Cycle of Attachment and Release | East Asian (Buddhist) | Rebirth | Resolution is letting go, not renewal |
| The Vision Quest / Spirit Journey | Indigenous American | Hero's Journey | Quest for identity; vision received not achieved |
| The Shahnameh Heroic Cycle | Middle Eastern (Persian) | Tragedy + Hero's Journey | Excessive loyalty as flaw; resolution in legend |
| The Ancestor-Guided Journey | African / East Asian | Rebirth (partial) | Synthesis of past and present; ancestral wisdom |

**Key structural observations**:
- Western archetypes center individuals; African/Indigenous archetypes often center the community
- Resolution types diverge: Western = triumph/restoration; non-Western = acceptance, withdrawal, communal reconnection, legendary persistence
- Moral structure varies: good-vs-evil (Western), duty-vs-duty (South Asian), attachment-vs-release (Buddhist), amoral (Trickster)
- Time structure varies: Frame-Tale and Trickster are episodic/recursive, not linear

---

# Part X: Tone-Archetype Integration

405 pairings (27 genre tones x 15 archetypes), each classified as reinforcing, contrasting, or neutral.

**Distribution**: 180 reinforcing, 77 contrasting, 148 neutral.

**Selected examples**:

| Genre Tone | Reinforcing With | Contrasting With |
|-----------|-----------------|-----------------|
| Drama (Sustained Serious) | Hero's Journey, Tragedy, Coming of Age, Revenge, Sacrifice, Rise & Fall | Comedy, Escape |
| Horror (Sustained Dread) | Overcoming Monster, Voyage & Return, Escape, Tragedy, Transformation | Comedy, Rags to Riches, Quest |
| Comedy (Light/Playful) | Comedy, Coming of Age, Voyage & Return | Tragedy, Revenge, Rise & Fall, Sacrifice |
| Romance (Emotional Intensity) | Comedy, Rags to Riches, Rebirth, Transformation | Revenge, Rise & Fall |
| Fantasy (Wonder/Grandeur) | Hero's Journey, Quest, Voyage & Return | Tragedy, Revenge |
| Western (Stoic/Elemental) | Overcoming Monster, Revenge, Hero's Journey | Comedy, Rags to Riches |

---

# Part XI: Example Works Registry

107 works spanning all 15 archetypes and 27 genres. 19 works referenced by multiple graphs.

| Title | Creator | Year | Medium |
|-------|---------|------|--------|
| A Christmas Carol | Charles Dickens | 1843 | novella |
| A Game of Thrones | George R.R. Martin | 1996 | novel |
| A Midsummer Night's Dream | William Shakespeare | 1596 | Shakespeare comedy |
| Alice's Adventures in Wonderland | Lewis Carroll | 1865 | novel |
| All Quiet on the Western Front | Erich Maria Remarque | 1929 | novel |
| All the President's Men | Alan J. Pakula | 1976 | film |
| Animal Farm | George Orwell | 1945 | novel |
| Apocalypse Now | Francis Ford Coppola | 1979 | film |
| Armageddon | Michael Bay | 1998 | film |
| Arthur Conan Doyle -- Sherlock Holmes | Arthur Conan Doyle | 1887 | novel series |
| Beauty and the Beast | Gary Trousdale & Kirk Wise | 1991 | animated film |
| Beloved | Toni Morrison | 1987 | novel |
| Beowulf | Anonymous | 1000 | Old English epic poem |
| Black Panther | Ryan Coogler | 2018 | film |
| Black Swan | Darren Aronofsky | 2010 | film |
| Blade Runner | Ridley Scott | 1982 | film |
| Bridget Jones's Diary | Sharon Maguire | 2001 | film |
| Charlotte's Web | E.B. White | 1952 | novel |
| Chinatown | Roman Polanski | 1974 | film |
| Citizen Kane | Orson Welles | 1941 | film |
| Coco | Lee Unkrich | 2017 | film |
| Crazy Rich Asians | Jon M. Chu | 2018 | film |
| Die Hard | John McTiernan | 1988 | film |
| Dr. Strangelove | Stanley Kubrick | 1964 | film |
| Dune | Denis Villeneuve | 2021 | film |
| Elf | Jon Favreau | 2003 | film |
| Escape from Alcatraz | Don Siegel | 1979 | film |
| Fight Club | David Fincher | 1999 | film |
| Finding Nemo | Andrew Stanton | 2003 | film |
| Get Out | Jordan Peele | 2017 | film |
| Gladiator | Ridley Scott | 2000 | film |
| Gone Girl | David Fincher | 2012 | novel |
| Great Expectations | Charles Dickens | 1861 | novel |
| Groundhog Day | Harold Ramis | 1993 | film |
| Harry Potter and the Deathly Hallows Part 2 | David Yates | 2011 | film |
| Harry Potter and the Sorcerer's Stone | Chris Columbus | 2001 | film |
| Home Alone | Chris Columbus | 1990 | film |
| House of Cards | Michael Dobbs | 1990 | novel |
| Indiana Jones and the Last Crusade | Steven Spielberg | 1989 | film |
| Jaws | Steven Spielberg | 1975 | film |
| John Wick | Chad Stahelski | 2014 | film |
| Jurassic Park | Steven Spielberg | 1993 | film |
| Kill Bill: Volume 1 | Quentin Tarantino | 2003 | film |
| Knives Out | Rian Johnson | 2019 | film |
| La La Land | Damien Chazelle | 2016 | film |
| Lady Bird | Greta Gerwig | 2017 | film |
| Little Women | Louisa May Alcott | 1868 | novel |
| Macbeth | William Shakespeare | 1606 | Shakespeare tragedy |
| Mad Max: Fury Road | George Miller | 2015 | film |
| Mulan | Disney | 1998 | film |
| Murder on the Orient Express | Agatha Christie | 1934 | novel |
| Normal People | Sally Rooney | 2018 | novel |
| Oppenheimer | Christopher Nolan | 2023 | film |
| Parasite | Bong Joon-ho | 2019 | film |
| Pirates of the Caribbean | Gore Verbinski | 2003 | film |
| Pride and Prejudice | Jane Austen | 1813 | novel |
| Rocky | John G. Avildsen | 1976 | film |
| Romeo and Juliet | William Shakespeare | 1597 | Shakespeare tragedy |
| Saving Private Ryan | Steven Spielberg | 1998 | film |
| Scarface | Brian De Palma | 1983 | film |
| Schindler's List | Steven Spielberg | 1993 | film |
| Se7en | David Fincher | 1995 | film |
| Shutter Island | Martin Scorsese | 2010 | film |
| Slumdog Millionaire | Danny Boyle | 2008 | film |
| Some Like It Hot | Billy Wilder | 1959 | film |
| Spider-Man | Sam Raimi | 2002 | film |
| Star Wars: Episode IV | George Lucas | 1977 | film |
| Steve Jobs | Danny Boyle | 2015 | film |
| Superbad | Greg Mottola | 2007 | film |
| Thank You for Smoking | Jason Reitman | 2005 | film |
| The Big Lebowski | Joel & Ethan Coen | 1998 | film |
| The Breakfast Club | John Hughes | 1985 | film |
| The Cat in the Hat | Dr. Seuss | 1957 | novel |
| The Count of Monte Cristo | Alexandre Dumas | 1844 | novel |
| The Dark Knight | Christopher Nolan | 2008 | film |
| The Dark Knight Rises | Christopher Nolan | 2012 | film |
| The Exorcist | William Peter Blatty | 1971 | novel |
| The Fault in Our Stars | John Green | 2012 | novel |
| The Godfather | Francis Ford Coppola | 1972 | film |
| The Good, the Bad and the Ugly | Sergio Leone | 1966 | film |
| The Great Gatsby | F. Scott Fitzgerald | 1925 | novel |
| The Hobbit | J.R.R. Tolkien | 1937 | novel |
| The Hound of the Baskervilles | Arthur Conan Doyle | 1902 | novel |
| The Hunger Games | Suzanne Collins | 2008 | novel |
| The Ides of March | George Clooney | 2011 | film |
| The Lion, the Witch and the Wardrobe | C.S. Lewis | 1950 | novel |
| The Lord of the Rings | J.R.R. Tolkien | 1954 | novel |
| The Lord of the Rings: Fellowship (film) | Peter Jackson | 2001 | film |
| The Matrix | The Wachowskis | 1999 | film |
| The Metamorphosis | Franz Kafka | 1915 | novella |
| The Notebook | Nicholas Sparks | 1996 | novel |
| The Perks of Being a Wallflower | Stephen Chbosky | 1999 | novel |
| The Princess Bride | Rob Reiner | 1987 | film |
| The Shawshank Redemption | Frank Darabont | 1994 | film |
| The Shining | Stephen King | 1977 | novel |
| The Silence of the Lambs | Jonathan Demme | 1991 | film |
| The Sixth Sense | M. Night Shyamalan | 1999 | film |
| The Sound of Music | Robert Wise | 1965 | film |
| The Wire | David Simon | 2002 | television |
| The Wizard of Oz | Victor Fleming | 1939 | film |
| The Wolf of Wall Street | Martin Scorsese | 2013 | film |
| Titanic | James Cameron | 1997 | film |
| To Kill a Mockingbird | Harper Lee | 1960 | novel |
| True Detective Season 1 | Pizzolatto | 2014 | television |
| True Grit | Charles Portis | 1968 | novel |
| Unforgiven | Clint Eastwood | 1992 | film |
| West Side Story | Jerome Robbins & Robert Wise | 1961 | film |
| When Harry Met Sally... | Rob Reiner / Nora Ephron | 1989 | film |
| Wolf Hall | Hilary Mantel | 2009 | novel |

---

# Part XII: Corpus Validation

50 works validated against the graph model.

| Metric | Value |
|--------|-------|
| Mean archetype coverage | 87% |
| Mean genre coverage | 82% |
| Archetype coverage range | 71% - 100% |
| Genre coverage range | 65% - 94% |
| Works with full archetype coverage | 8 of 50 |
| Hard constraint violations | 12 |

**Highest archetype coverage**: Voyage & Return (1.00), Tragedy (1.00), Comedy (1.00), Coming of Age (1.00), Transformation (1.00)

**Systematic gaps identified**:
1. Multi-protagonist structures (8/50 works) -- ensemble casts require overlaying multiple archetype instances
2. Non-linear narrative techniques (6/50) -- flashbacks, frame narratives, unreliable narration
3. Meta-narrative / self-awareness (3/50) -- works commenting on own genre conventions
4. Subverted/withheld resolution (4/50) -- works deliberately denying expected resolution
5. Thematic overlays (10/50) -- social commentary, philosophy, allegory as layers beyond structure
