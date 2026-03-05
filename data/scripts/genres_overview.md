# Genres

*An overview of the twenty-seven genre constraint hierarchies. Estimated listening time: 9 minutes.*

---

## What genre graphs model

In this project, a genre is not a label — it's a constraint space. Where archetype graphs model how a story progresses over time, genre graphs model what rules a story must follow to fulfill its contract with the audience. A Horror story promises fear and dread. A Mystery promises a solvable puzzle with fair clues. A Romance promises an emotional arc centered on an intimate relationship. These promises aren't vague aspirations — they're concrete, testable constraints that the genre graph makes explicit.

Genre graphs are hierarchies, not sequences. They don't tell you what happens first, second, third. They tell you what must be true at every level of specificity, from the broadest emotional promise down to the individual scenes the audience expects to see.

---

## The five-level architecture

Every genre graph follows a five-level spine, moving from abstract to concrete.

**Level 1: Genre Promise.** The root node. This is the emotional and experiential contract with the audience — what the genre commits to delivering. Horror promises fear and dread. Fantasy promises wonder and mythic stakes. Comedy promises amusement through humor and social friction. Every genre graph has exactly one Genre Promise node, and every other node traces back to it.

**Level 2: Core Constraints.** The non-negotiable rules. These are the minimum requirements for a story to count as this genre. Horror requires "threat must be present and escalating." Mystery requires "fair clueing — the reader must have access to the information needed to solve the puzzle." Each genre typically has three to six core constraints. These are the rules that, if violated, break the genre contract.

**Level 3: Subgenre Patterns.** Recognized subtypes that inherit from but modify the core constraints. Mystery branches into Cozy, Hardboiled, and Police Procedural. Science Fiction branches into Space Opera, Cyberpunk, and Hard SF. Each subgenre carries forward the core constraints while adding its own requirements. You can write a story that stays at level two — a generic Mystery — or you can commit to a subgenre and accept its additional rules.

**Level 4: Setting Rules.** World-building requirements that make the constraints tangible. Fantasy requires "magic system must have costs and limits." Historical requires "period-accurate social norms and technology." Horror requires "isolation amplifies threat." These are the rules that govern how the story's environment must behave.

**Level 5: Scene Obligations.** The most concrete layer. These are specific scene types or beats that the audience expects. Horror requires a "first scare or anomaly" scene. Romance requires a "declaration or commitment" scene. Mystery requires an "investigation pivot" scene. These are testable against a draft — either the scene exists or it doesn't.

---

## Beyond the spine: Tone Markers and Anti-Patterns

Two additional node roles appear outside the five-level hierarchy.

**Tone Markers** define the required emotional or atmospheric register. Horror's tone marker is "sustained dread atmosphere." Romantic Comedy's is "wit and verbal sparring." Fantasy's is "grandeur and awe." Tone markers constrain how the story feels rather than what happens. They can connect to nodes at multiple levels.

**Anti-Patterns** are explicit prohibitions — things the genre contract forbids. Mystery prohibits "unsolvable puzzle or withheld clues." Tragedy prohibits "unearned happy ending." War prohibits "consequence-free violence." Anti-patterns define the genre by exclusion and help distinguish similar genres from each other.

---

## Hard versus soft severity

Every constraint in a genre graph is classified as either **hard** or **soft**.

Hard constraints are non-negotiable. If you violate a hard constraint, you've broken the genre contract. A Mystery without fair clueing isn't a Mystery — it's something else wearing Mystery's clothes. Hard constraints are the structural load-bearing walls.

Soft constraints are adjustable. They represent strong expectations rather than absolute requirements. A Romance without a "meet cute" scene is still a Romance — it just departs from the most common pattern. Soft constraints are the defaults you can override with good reason.

The severity classification matters most when genres are blended. If two genres have conflicting hard constraints, the blend is structurally unstable. If the conflict involves soft constraints, it can usually be resolved by letting one genre's convention yield.

---

## The twenty-seven genres

The corpus covers twenty-seven genres, each with a complete graph, narrative spec, and example mappings.

**Drama.** Character-driven stories emphasizing emotional stakes and consequential choices. **Action.** Stories propelled by physical conflict and kinetic set pieces. **Comedy.** Stories designed to amuse through humor, incongruity, and social friction. **Thriller.** Suspense-driven stories focused on danger and escalating tension. **Fantasy.** Stories set in worlds with magical rules, emphasizing wonder and mythic stakes. **Science Fiction.** Stories exploring speculative technology and "what if" premises.

**Adventure.** Journey-centered stories defined by exploration and discovery. **Romance.** Stories where the central arc focuses on an intimate relationship. **Romantic Comedy.** Romance structured around humor and social friction. **Horror.** Stories designed to evoke fear through threat, the uncanny, or the monstrous. **Mystery.** Investigation-centered stories driven by unanswered questions and revelations. **Crime.** Stories focused on criminal acts and their consequences.

**Detective.** A mystery subgenre centered on a dedicated investigator. **Superhero.** Stories featuring extraordinary abilities and moral responsibility. **Historical.** Stories set in a recognizable past, using period detail as a source of stakes. **War.** Stories where armed conflict is central, emphasizing survival and human cost. **Biography.** Narratives based on real individuals. **Family.** Stories structured around family relationships and generational dynamics.

**Young Adult.** Stories centering identity formation and boundary-testing choices. **Literary Fiction.** Character- and language-forward stories prioritizing psychological depth. **Children's Literature.** Stories for children, emphasizing clarity and imaginative engagement. **Satire.** Stories using humor and exaggeration to critique social norms. **Psychological.** Stories emphasizing internal conflict and perception. **Western.** Stories set in frontier contexts, emphasizing moral codes and individualism.

**Political.** Stories driven by governance, power struggles, and institutional pressure. **Musical.** Stories where songs and performance advance plot and emotion. **Holiday.** Seasonal stories anchored to holiday contexts, emphasizing tradition and reunion.

---

## Element constraints

Ten genres have additional **element constraint files** that define required, recommended, and optional character roles, relationship types, place types, and object types. The ten genres with element constraints are Romance, Horror, Thriller, Fantasy, Science Fiction, Detective, Adventure, Western, Superhero, and War. These files specify, for example, that Fantasy requires a protagonist, a mentor, and an antagonist, recommends a threshold guardian, and optionally includes a trickster. Each element comes with testable rules — "the mentor must provide knowledge or tools that the protagonist lacks and cannot acquire alone."

---

## Genre blending

Stories rarely inhabit a single genre in pure form. The corpus includes a **genre blending model** that documents eighteen genre combinations, analyzing constraint compatibility, conflict resolution, and structural stability.

Each blend is classified as stable, conditionally stable, or unstable. Science Fiction crossed with Horror is stable — SF's technology provides the mechanism for Horror's threat, and they share an emphasis on intellectual engagement with danger. Horror crossed with Comedy is unstable — Horror demands sustained dread, Comedy demands regular relief, and the two registers fight each other at the scene level.

The blending model documents which constraints are compatible, which conflict, and how the conflict can be resolved. It's a practical tool for writers who want to work in multiple genres simultaneously and need to understand where the structural friction will appear.
