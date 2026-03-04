# The Cross-Reference Web

*An audio-friendly guide to the twelve datasets that connect everything. Estimated listening time: 11 minutes.*

---

## Why cross-references exist

The project has forty-two graphs — fifteen archetypes and twenty-seven genres. Each one stands alone as a complete model. But the interesting questions arise when you connect them. Which archetypes work best with which genres? What happens when you blend two genres? How does Horror's tone interact with the Hero's Journey's emotional arc? Which structural roles are universal and which are unique?

The twelve files in `data/cross_references/` answer these questions. They form a web of relationships that the interactive viewer uses for analysis panels and the generation pipeline uses for story construction. Let's walk through each one.

---

## The manifest — the corpus inventory

**manifest.json** is the index of everything. It lists every graph file in the corpus with its path, node count, edge count, and type. The generation pipeline loads this first as a sanity check — it knows exactly how many archetypes and genres should exist, how many nodes and edges the corpus should contain, and can verify nothing is missing before proceeding.

Think of it as the table of contents for the entire data folder.

---

## The compatibility matrix — which pairings work

**genre_archetype_matrix.json** is the single most important cross-reference file. It's a twenty-seven by fifteen matrix — every genre paired with every archetype — producing four hundred and five combinations.

Each pairing is classified into one of three tiers. "Naturally compatible" means the genre and archetype reinforce each other — their structures align without tension. Horror plus Tragedy, for instance, is naturally compatible because Tragedy's descending arc amplifies Horror's escalating dread. "Occasionally compatible" means the pairing works but requires careful handling — the structures create productive tension that must be managed. "Rarely compatible" means the pairing is structurally difficult — their fundamental requirements conflict in ways that are hard to reconcile.

Every classification comes with rationale — a short explanation of why the pairing falls where it does. The selection engine in the generation pipeline uses this matrix as its primary scoring input. When you request a story with a specific genre and archetype, the matrix tells the system whether that's a natural fit, a stretch, or a structural challenge.

---

## The cross-archetype index — shared structure

**cross_archetype_index.json** answers the question: which structural building blocks are shared across the fifteen archetypes?

It indexes all fourteen node roles and all fifteen edge meanings, showing which archetypes use each one and exactly which node or edge instantiates it. The results are revealing. Origin and Resolution are universal — every single archetype has exactly one of each, because every story starts somewhere and ends somewhere. Crisis is also universal — every archetype has at least one, though the Hero's Journey has two. Disruption appears in fourteen of fifteen — Voyage and Return is the exception, because it uses a Threshold as its first transition instead.

On the other end, Descent appears in only four archetypes — Hero's Journey, Tragedy, Rise and Fall, and the Escape. It's a specialized structural move, not a universal one.

For edge meanings, "tests resolve" appears in thirteen archetypes — almost everything includes a trial. "Compels return" appears in only three — most stories don't involve a return journey.

This index is what powers the cross-archetype comparisons in the viewer's analytics panel. When you click on a role like "Crisis" and see how it manifests differently across all fifteen archetypes, this file is the data source.

---

## The cross-genre constraint index — shared rules

**cross_genre_constraint_index.json** does the same thing for genres. It identifies sixteen recurring constraint patterns that appear across multiple genre graphs.

"Stakes Escalation" appears in eight genres — Horror, Thriller, Action, War, and four others all require that danger increases over time. "Internal Consistency" appears in seven genres — Fantasy, Science Fiction, Historical, and others all require that the world's rules be consistent. "Emotional Authenticity" appears in six genres — Drama, Romance, Biography, and others all require that characters' emotional responses feel genuine.

Each shared pattern lists the specific genre nodes that embody it, so you can trace from an abstract concept like "stakes escalation" down to the concrete constraint definition in each genre's graph.

---

## Emotional arc profiles — the feel of each archetype

**archetype_emotional_arcs.json** maps a quantitative emotional trajectory for each of the fifteen archetypes. This is where the graphs get numbers.

For each archetype, every node along the main spine gets four emotional scores, each between zero and one: tension, hope, fear, and resolution. The Hero's Journey, for example, starts with low tension, moderate hope, low fear, and zero resolution. Tension climbs through the trials, peaks at the Ordeal, drops slightly at the Reward, spikes again at the Resurrection, and then drops to near-zero at the Return. Hope follows an inverse pattern — it dips during the Descent and Ordeal, then rises sharply during the Reward and Return.

Each archetype is also classified by arc shape. The Hero's Journey is a U-curve — things get worse before they get better. Tragedy is a descending arc — things start good and get progressively worse. Comedy is an inverted-U with recovery — confusion builds, then resolves. Rise and Fall is a true inverted-U — ascent followed by collapse with no recovery.

The generation pipeline uses these profiles to set emotional targets for each beat in the story plan. When the planner assigns a scene to the Ordeal node, it knows the target emotional scores are high tension, low hope, high fear — and can instruct the writer agent accordingly.

Variant nodes also have emotional profiles, branching from the main spine. The Refusal of the Call in the Hero's Journey, for instance, dips hope and raises fear slightly compared to the direct path.

---

## Hybrid archetype patterns — when two arcs combine

**hybrid_archetype_patterns.json** documents twelve common hybrid patterns where two archetypes co-occur in a single work.

The most common hybrid is Hero's Journey plus Coming of Age — the protagonist grows up through the journey's trials. They share four roles: Origin, Disruption, Trial, and Resolution. They diverge at the Crisis — the Hero's Journey emphasizes external confrontation, Coming of Age emphasizes internal maturation. The composition method is "parallel track" — both arcs run simultaneously.

Another common one is Revenge plus Tragedy. They share Origin, Disruption, Commitment, and Crisis. They diverge at the resolution — Revenge can end with satisfaction, Tragedy must end with downfall. When combined, the work gets the structural tension of a revenge story that ultimately destroys the avenger. Hamlet is the canonical example.

Each hybrid lists its shared roles, divergence point, composition method — parallel track, sequential override, nested, or alternating dominance — example works, and the structural tensions the hybrid creates.

When the generation pipeline has hybrid archetypes enabled, it uses this file to determine how to layer two archetype graphs onto the same story, which beats belong to which arc, and where the arcs productively conflict.

---

## Tone-archetype integration — mood meets structure

**tone_archetype_integration.json** is the largest cross-reference by combination count — four hundred and five pairings, one for each of the twenty-seven genre tone markers crossed with each of the fifteen archetypes.

Each pairing is classified as reinforcing, contrasting, or neutral. Horror's "sustained dread atmosphere" is reinforcing with Tragedy — the descending arc naturally amplifies dread. It's contrasting with Comedy — Comic restoration actively fights dread. It's reinforcing with the Escape — flight from confinement pairs naturally with sustained fear.

Science Fiction's "sense of wonder" tone is reinforcing with the Quest — exploration and discovery align naturally. It's contrasting with Tragedy — awe and downfall create productive dissonance. It's neutral with Comedy — they operate independently.

The generation pipeline uses this during selection to evaluate whether a tone preference reinforces or fights the chosen archetype's emotional arc. Reinforcing combinations score higher; contrasting combinations score lower but aren't blocked, because productive dissonance can be powerful.

---

## Genre blending model — when rules combine

**genre_blending_model.json** documents eighteen genre blend patterns. This is the genre equivalent of hybrid archetypes — what happens when a story operates in two genres simultaneously.

Each blend documents which genre's constraints take priority in conflicts using the severity weights from the genre graphs. Compatible constraints — rules that reinforce each other across genres — are listed. So are conflicting constraints, with resolution strategies.

Horror plus Romance produces an "unstable" blend — their core requirements actively conflict. Horror demands sustained vulnerability and dread. Romance demands emotional safety and connection. The resolution strategy is "Gothic romance: Horror provides the external threat, Romance provides the internal stakes." The tone synthesis is "dread plus emotional intensity." Crimson Peak and Rebecca are the example works.

Science Fiction plus Mystery is a "stable" blend. Both require internal consistency, logical problem-solving, and progressive revelation. Their constraints reinforce rather than conflict. Blade Runner and The Expanse are examples.

Each blend is classified as stable, conditionally stable, or unstable. The generation pipeline uses stability to determine how aggressively it needs to manage constraint conflicts when both genres are active.

---

## The example works registry — real stories mapped

**example_works_registry.json** is the master index of a hundred and seven real works referenced across all forty-two example files. It's the registry that connects the structural models to actual stories.

Each work has its title, creator, year, medium — novel, film, play, game — and a list of which graph example files reference it and in what role. Some works appear in multiple graphs. Star Wars Episode Four appears in the Hero's Journey examples, the Quest examples, the Adventure genre examples, and the Science Fiction genre examples — four graphs reference it. The Shawshank Redemption appears in the Escape archetype and the Drama genre.

Nineteen works appear in more than one graph, making them natural candidates for comparative analysis — you can see how the same story satisfies multiple structural models simultaneously.

---

## Corpus validation — testing the models

**corpus_validation.json** tests the graphs against a corpus of fifty well-known works. For each work, it scores archetype coverage — what percentage of the archetype's nodes are clearly present — and genre coverage — what percentage of the genre's constraints are satisfied.

Mean archetype coverage is eighty-seven percent. Mean genre coverage is eighty-two percent. These numbers tell you that the graphs capture most of what's happening in real stories, but not everything — there's always material that falls outside the model. The file also identifies systematic gaps — structural elements that real stories consistently include but the graphs don't capture, and constraints that the graphs assert but stories routinely skip.

---

## Cross-medium adaptation — stories across formats

**cross_medium_adaptation.json** analyzes six works that exist in multiple mediums — novel to film, film to television, film to game. For each work, it maps the archetype graph in both mediums and documents which nodes compress, which expand, and which change role.

Film adaptations of novels consistently compress the Road of Trials — a novel can sustain six or eight distinct trial scenes, but a film typically consolidates them into two or three. Television expansions do the opposite — the same archetype spine that fills two hours in a film gets stretched across episodes, with trial sequences and revelation sequences expanded dramatically.

Games change the most. The Trial role becomes interactive and repeatable. The Threshold becomes a player choice. The Crisis becomes a boss encounter. The structural role is preserved, but the medium's affordances change how each node manifests.

---

## Non-Western archetype analysis — beyond the fifteen

**non_western_archetype_analysis.json** documents ten narrative archetypes from traditions outside the Western canon. East Asian wuxia journeys, South Asian dharma-conflict narratives, African trickster cycles, Indigenous American vision quest structures, Middle Eastern frame-tale patterns.

Each non-Western archetype is analyzed for structural overlap with the existing fifteen. Some have close cognates — the wuxia hero's journey overlaps heavily with the Hero's Journey but diverges in its emphasis on martial mastery as spiritual cultivation. Others are genuinely distinct — the Buddhist cycle of attachment and release has no Western equivalent because it's circular rather than linear, with no terminal resolution node.

---

## How they all connect

The twelve cross-reference files form a dependency web. The controlled vocabularies define the shared language. The graphs use that language. The matrix connects the graphs. The emotional arcs, hybrid patterns, tone integration, and blending model all build on the matrix's compatibility data. The example works registry grounds everything in real stories. The corpus validation tests whether the models actually work. And the non-Western analysis and cross-medium adaptation extend the models beyond their original scope.

When the generation pipeline runs, it loads all twelve files alongside all forty-two graphs. The selection engine reads the matrix, tone integration, and blending model. The contract compiler reads the graphs and severity weights. The planner reads the emotional arcs. The validator reads the constraints and anti-patterns. Everything is connected, and every connection serves a specific purpose in turning structural knowledge into usable stories.
