# Goal 2: Genre Depth Graphs (Setting and Constraints by Detail Level)

Produce the complete set of genre depth graph deliverables as defined in `v0_plan.md` §3.
Each phase ends with a commit.

---

## Phase 1 — Controlled Vocabulary and ID Convention

Establish the shared foundation that all 27 genre graphs will depend on.

- [X] Define the controlled vocabulary of genre edge meanings (refinement relationships: e.g., "specifies constraint", "narrows scope", "branches into subtype", "mandates element", "prohibits element") and document it in `docs/genre_edge_vocabulary.json`
- [X] Define the controlled vocabulary of genre node levels/roles (the five-level spine: Genre Promise, Core Constraints, Subgenre Pattern, World/Setting Rules, Scene Obligations — plus any additional structural roles) and document it in `docs/genre_node_roles.json`
- [X] Define the ID naming convention for genre nodes and edges (prefix per genre, numbering scheme) and document it in `docs/genre_id_convention.md`

---

## Phase 2 — Genre Graph JSONs (Batch 1: Genres 1–7)

Build the first seven genre depth graph JSON documents following the schema in `v0_plan.md` §1.2A and the five-level spine in §3.3.

- [X] 1 — Drama graph JSON → `data/genres/01_drama/graph.json`
- [X] 2 — Action graph JSON → `data/genres/02_action/graph.json`
- [X] 3 — Comedy graph JSON → `data/genres/03_comedy/graph.json`
- [X] 4 — Thriller graph JSON → `data/genres/04_thriller/graph.json`
- [X] 5 — Fantasy graph JSON → `data/genres/05_fantasy/graph.json`
- [X] 6 — Science Fiction graph JSON → `data/genres/06_science_fiction/graph.json`
- [X] 7 — Adventure graph JSON → `data/genres/07_adventure/graph.json`

---

## Phase 3 — Genre Graph JSONs (Batch 2: Genres 8–14)

- [X] 8 — Romance graph JSON → `data/genres/08_romance/graph.json`
- [X] 9 — Romantic Comedy graph JSON → `data/genres/09_romantic_comedy/graph.json`
- [X] 10 — Horror graph JSON → `data/genres/10_horror/graph.json`
- [X] 11 — Mystery graph JSON → `data/genres/11_mystery/graph.json`
- [X] 12 — Crime graph JSON → `data/genres/12_crime/graph.json`
- [X] 13 — Detective graph JSON → `data/genres/13_detective/graph.json`
- [X] 14 — Superhero graph JSON → `data/genres/14_superhero/graph.json`

---

## Phase 4 — Genre Graph JSONs (Batch 3: Genres 15–20)

- [X] 15 — Historical graph JSON → `data/genres/15_historical/graph.json`
- [X] 16 — War graph JSON → `data/genres/16_war/graph.json`
- [X] 17 — Biography graph JSON → `data/genres/17_biography/graph.json`
- [X] 18 — Family graph JSON → `data/genres/18_family/graph.json`
- [X] 19 — Young Adult graph JSON → `data/genres/19_young_adult/graph.json`
- [X] 20 — Literary Fiction graph JSON → `data/genres/20_literary_fiction/graph.json`

---

## Phase 5 — Genre Graph JSONs (Batch 4: Genres 21–27)

- [X] 21 — Children's Literature graph JSON → `data/genres/21_childrens_literature/graph.json`
- [X] 22 — Satire graph JSON → `data/genres/22_satire/graph.json`
- [X] 23 — Psychological graph JSON → `data/genres/23_psychological/graph.json`
- [X] 24 — Western graph JSON → `data/genres/24_western/graph.json`
- [X] 25 — Political graph JSON → `data/genres/25_political/graph.json`
- [X] 26 — Musical graph JSON → `data/genres/26_musical/graph.json`
- [X] 27 — Holiday graph JSON → `data/genres/27_holiday/graph.json`

---

## Phase 6 — Narrative Graph Explanations (Batch 1: Genres 1–7)

For each genre, produce the narrative spec defined in `v0_plan.md` §1.2B: overview, node explanations, edge explanations, canonical walkthrough, variant walkthroughs (2–4), and diagnostic checklist.

- [X] 1 — Drama narrative spec → `data/genres/01_drama/narrative.md`
- [X] 2 — Action narrative spec → `data/genres/02_action/narrative.md`
- [X] 3 — Comedy narrative spec → `data/genres/03_comedy/narrative.md`
- [X] 4 — Thriller narrative spec → `data/genres/04_thriller/narrative.md`
- [X] 5 — Fantasy narrative spec → `data/genres/05_fantasy/narrative.md`
- [X] 6 — Science Fiction narrative spec → `data/genres/06_science_fiction/narrative.md`
- [X] 7 — Adventure narrative spec → `data/genres/07_adventure/narrative.md`

---

## Phase 7 — Narrative Graph Explanations (Batch 2: Genres 8–14)

- [X] 8 — Romance narrative spec → `data/genres/08_romance/narrative.md`
- [X] 9 — Romantic Comedy narrative spec → `data/genres/09_romantic_comedy/narrative.md`
- [X] 10 — Horror narrative spec → `data/genres/10_horror/narrative.md`
- [X] 11 — Mystery narrative spec → `data/genres/11_mystery/narrative.md`
- [X] 12 — Crime narrative spec → `data/genres/12_crime/narrative.md`
- [X] 13 — Detective narrative spec → `data/genres/13_detective/narrative.md`
- [X] 14 — Superhero narrative spec → `data/genres/14_superhero/narrative.md`

---

## Phase 8 — Narrative Graph Explanations (Batch 3: Genres 15–20)

- [X] 15 — Historical narrative spec → `data/genres/15_historical/narrative.md`
- [X] 16 — War narrative spec → `data/genres/16_war/narrative.md`
- [X] 17 — Biography narrative spec → `data/genres/17_biography/narrative.md`
- [X] 18 — Family narrative spec → `data/genres/18_family/narrative.md`
- [X] 19 — Young Adult narrative spec → `data/genres/19_young_adult/narrative.md`
- [X] 20 — Literary Fiction narrative spec → `data/genres/20_literary_fiction/narrative.md`

---

## Phase 9 — Narrative Graph Explanations (Batch 4: Genres 21–27)

- [X] 21 — Children's Literature narrative spec → `data/genres/21_childrens_literature/narrative.md`
- [X] 22 — Satire narrative spec → `data/genres/22_satire/narrative.md`
- [X] 23 — Psychological narrative spec → `data/genres/23_psychological/narrative.md`
- [X] 24 — Western narrative spec → `data/genres/24_western/narrative.md`
- [X] 25 — Political narrative spec → `data/genres/25_political/narrative.md`
- [X] 26 — Musical narrative spec → `data/genres/26_musical/narrative.md`
- [X] 27 — Holiday narrative spec → `data/genres/27_holiday/narrative.md`

---

## Phase 10 — Example Mappings (Batch 1: Genres 1–7)

For each genre, map each node and edge to one concrete moment in one of the three example works listed in `docs/genres.json`. Cross-reference the other two works.

- [X] 1 — Drama example mapping → `data/genres/01_drama/examples.md`
- [X] 2 — Action example mapping → `data/genres/02_action/examples.md`
- [X] 3 — Comedy example mapping → `data/genres/03_comedy/examples.md`
- [X] 4 — Thriller example mapping → `data/genres/04_thriller/examples.md`
- [X] 5 — Fantasy example mapping → `data/genres/05_fantasy/examples.md`
- [X] 6 — Science Fiction example mapping → `data/genres/06_science_fiction/examples.md`
- [X] 7 — Adventure example mapping → `data/genres/07_adventure/examples.md`

---

## Phase 11 — Example Mappings (Batch 2: Genres 8–14)

- [X] 8 — Romance example mapping → `data/genres/08_romance/examples.md`
- [X] 9 — Romantic Comedy example mapping → `data/genres/09_romantic_comedy/examples.md`
- [X] 10 — Horror example mapping → `data/genres/10_horror/examples.md`
- [X] 11 — Mystery example mapping → `data/genres/11_mystery/examples.md`
- [X] 12 — Crime example mapping → `data/genres/12_crime/examples.md`
- [X] 13 — Detective example mapping → `data/genres/13_detective/examples.md`
- [X] 14 — Superhero example mapping → `data/genres/14_superhero/examples.md`

---

## Phase 12 — Example Mappings (Batch 3: Genres 15–20)

- [ ] 15 — Historical example mapping → `data/genres/15_historical/examples.md`
- [ ] 16 — War example mapping → `data/genres/16_war/examples.md`
- [ ] 17 — Biography example mapping → `data/genres/17_biography/examples.md`
- [ ] 18 — Family example mapping → `data/genres/18_family/examples.md`
- [ ] 19 — Young Adult example mapping → `data/genres/19_young_adult/examples.md`
- [ ] 20 — Literary Fiction example mapping → `data/genres/20_literary_fiction/examples.md`

---

## Phase 13 — Example Mappings (Batch 4: Genres 21–27)

- [ ] 21 — Children's Literature example mapping → `data/genres/21_childrens_literature/examples.md`
- [ ] 22 — Satire example mapping → `data/genres/22_satire/examples.md`
- [ ] 23 — Psychological example mapping → `data/genres/23_psychological/examples.md`
- [ ] 24 — Western example mapping → `data/genres/24_western/examples.md`
- [ ] 25 — Political example mapping → `data/genres/25_political/examples.md`
- [ ] 26 — Musical example mapping → `data/genres/26_musical/examples.md`
- [ ] 27 — Holiday example mapping → `data/genres/27_holiday/examples.md`

---

## Phase 14 — Cross-Genre Constraint Index

Build the reuse map that identifies shared constraint types across all 27 genre graphs.

- [ ] Identify common constraint types that appear across multiple genres (e.g., "stakes escalation", "fairness", "plausibility", "threat logic", "relationship proof", "institutional realism") and tabulate which genres use each
- [ ] Identify common scene obligations that recur across genres and tabulate usage
- [ ] Produce the cross-genre constraint index document → `data/genres/cross_genre_constraint_index.json`

---

## Phase 15 — Genre × Archetype Compatibility Matrix

Map how the 15 archetype time-graphs commonly pair with the 27 genre constraint-graphs.

- [ ] For each genre, identify which archetypes are naturally compatible, occasionally compatible, and rarely compatible
- [ ] For each pairing, provide a brief rationale (1–2 sentences)
- [ ] Produce the compatibility matrix document → `data/genre_archetype_matrix.json`

---

## Phase 16 — Validation and Quality Review

Apply acceptance criteria from `v0_plan.md` §3.6 across all deliverables.

- [ ] Verify Levels 1–5 are present and clearly distinguished in every genre graph
- [ ] Verify constraints are stated as enforceable rules, not vibes
- [ ] Verify subgenres meaningfully change constraints, not just labels
- [ ] Verify setting rules specify what must remain consistent
- [ ] Verify scene obligations are concrete and testable in a draft
- [ ] Verify examples reflect the stated promise and constraints
- [ ] Verify all node/edge IDs follow the naming convention from Phase 1
- [ ] Verify controlled vocabulary usage is consistent across all 27 graphs
