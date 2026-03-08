# Statement of Work: Story Archetype Graphs and Genre Depth Graphs

## 0. Purpose

Create two complementary analysis products:

1. **Archetype Graphs**: For each story archetype, produce a formal graph (nodes + directed edges) plus a rigorous, node-by-node and edge-by-edge explanation that models **story progression over time**.

2. **Genre Depth Graphs**: For each genre, produce a formal graph that models **setting and narrative constraints at increasing levels of detail** (broad → specific → highly specific), plus a rigorous explanation of each node and edge that shows how genre expectations shape story design.

Both products will be designed to be reusable as an educational tool and as a practical planning tool for writers.

---

## 1. Definitions and Output Format

### 1.1 Graph Standard (both archetype and genre)

Each graph is a directed labeled graph with:

* **Nodes**: concepts/states (e.g., “Call to Adventure”, “Confined Space”, “Investigation Pivot”).
* **Edges**: transitions/relationships with explicit semantics (e.g., “forces decision”, “raises stakes”, “reveals constraint”, “narrows options”).
* **Graph constraints**:

  * One clearly defined **start node**.
  * One or more **terminal nodes** (end states).
  * Optional **loops** where appropriate (e.g., repeated tests, escalating clues).
  * Optional **branching** to capture common variants.
* **Machine-readable JSON** (for rendering and tooling) plus a **human-readable narrative spec**.

### 1.2 Deliverable Structure per Item (per archetype or per genre)

For each archetype/genre, produce:

**A) Graph JSON**

* `id`, `name`, `type` (`archetype` or `genre`)
* `nodes[]`: `node_id`, `label`, `role`, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, `signals_in_text`
* `edges[]`: `edge_id`, `from`, `to`, `label`, `meaning`, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, `anti_patterns`

**B) Narrative Graph Explanation (text)**

* **Overview**: what the graph models and what it is for.
* **Node explanations**: purpose + how it appears in story + what must change while inside the node.
* **Edge explanations**: what triggers the transition + what new constraints/stakes appear + what often goes wrong.
* **Canonical walkthrough**: one clean path from start to end.
* **Variant walkthroughs**: 2–4 common variations (short).
* **Diagnostic checklist**: how to tell if a draft is missing a necessary node/edge.

**C) Example Mapping**

* Map each node/edge to **one** concrete example work (lightweight; no heavy quoting), and optionally cross-reference the other example works.

---

## 2. Workstream A: Archetype Graphs (Story Over Time)

### 2.1 Objective

For each of the 15 archetypes you defined, model the **temporal structure** of stories as a directed graph that captures:

* progression of stakes
* transformation of the protagonist (or focal character/system)
* reversals, revelations, and commitment points
* typical branching variants for that archetype

### 2.2 Scope

Included:

* 15 archetypes (as provided):

  1. The Hero’s Journey
  2. Rags to Riches
  3. The Quest
  4. Voyage and Return
  5. Overcoming the Monster
  6. Rebirth
  7. Tragedy
  8. Comedy (Restoration of Order)
  9. Coming of Age
  10. The Revenge
  11. The Escape
  12. The Sacrifice
  13. The Mystery Unveiled
  14. The Transformation
  15. The Rise and Fall

Excluded (unless later added):

* scene-level beat sheets for specific works
* genre tropes except where needed to clarify archetype variants
* full story outlines for original projects

### 2.3 Methodology

1. **Canonical archetype decomposition**

   * Identify the irreducible phases (nodes) that define the archetype.
   * Define the minimum set of transitions (edges) required for coherence.

2. **Variant modeling**

   * Add optional branches representing major variants (e.g., “refusal of the call” vs “forced call”).
   * Keep variants explicit and bounded (avoid endless branching).

3. **Failure modes**

   * For each node/edge, specify common failure patterns (e.g., “trial without cost”, “reveal without consequences”, “climax without irreversible choice”).

4. **Example mapping**

   * Anchor each archetype graph to the three example works already selected.

### 2.4 Deliverables

* **15 Archetype Graph JSON documents**
* **15 Archetype Narrative Graph Explanations**
* **15 Example Mappings** (node/edge → example moments)
* **One Cross-Archetype Index**

  * common node types across archetypes (e.g., “Commitment”, “Reversal”, “Revelation”, “Irreversible Cost”)
  * reuse map to support teaching and tooling

### 2.5 Quality and Acceptance Criteria

For each archetype:

* Graph is traversable from start to at least one terminal node without ambiguity.
* Every edge has a causal meaning, not just “and then”.
* Node entry/exit conditions are explicit and testable in a draft.
* At least 2 meaningful variants are provided (where appropriate).
* Failure modes are specific enough to guide revision.
* Example mapping is consistent with the graph semantics.

---

## 3. Workstream B: Genre Depth Graphs (Setting and Constraints by Detail Level)

### 3.1 Objective

For each genre, model how genre works as a **constraint-and-expectation system** that becomes more specific as detail increases. This graph does not primarily model time; it models **increasing granularity** (broad → subgenre → premise conventions → setting rules → scene-level obligations).

### 3.2 Scope

Included:

* All genres listed in the genre JSON you created (minimum set, may be expanded later):
  Drama, Action, Comedy, Thriller, Fantasy, Science Fiction, Adventure, Romance, Romantic Comedy, Horror, Mystery, Crime, Detective, Superhero, Historical, War, Biography, Family, Young Adult, Literary Fiction, Children’s Literature, Satire, Psychological, Western, Political, Musical, Holiday

Excluded (unless later added):

* exhaustive trope catalogs
* market trend forecasting
* publishing strategy

### 3.3 “Increasing Levels of Detail” Model

Each genre graph uses the same five-level spine (nodes), with genre-specific expansions:

* **Level 1: Genre Promise**

  * the emotional and experiential contract with the audience

* **Level 2: Core Constraints**

  * what must be true for the genre to function (e.g., Mystery requires solvable questions and fair clueing)

* **Level 3: Subgenre Pattern**

  * common subtypes and their differing constraints (e.g., “cozy mystery” vs “hardboiled”)

* **Level 4: World/Setting Rules**

  * how setting mechanics express the genre (e.g., Horror threat logic; Sci-Fi tech plausibility; Historical period fidelity)

* **Level 5: Scene Obligations**

  * recurring scene types and beats that satisfy the genre (e.g., Thriller: escalation and ticking clock; Romance: intimacy + separation + choice)

Edges represent **refinement steps**, showing how moving deeper narrows creative degrees of freedom and increases specificity.

### 3.4 Methodology

1. **Genre promise articulation**

   * Define the audience’s expected payoff (fear, wonder, catharsis, suspense, etc.).

2. **Constraint extraction**

   * Identify what must be present and what must be avoided for the genre to read correctly.

3. **Subgenre branching**

   * Provide 3–6 subgenre nodes per genre (as applicable), each with distinct constraints.

4. **Setting rule formalization**

   * Define what “counts” as legitimate detail (e.g., Sci-Fi: consistent speculative premise; Historical: period-consistent social/tech constraints).

5. **Scene obligation library**

   * Provide a small set of scene obligations and anti-patterns per genre.

6. **Example mapping**

   * Provide at least three representative works per genre (you already have examples for many; where missing, add).

### 3.5 Deliverables

* **N Genre Depth Graph JSON documents** (N ≥ 15; includes all genres previously listed)
* **N Genre Narrative Graph Explanations**
* **One Cross-Genre Constraint Index**

  * reusable constraint types: “stakes escalation”, “fairness”, “plausibility”, “threat logic”, “relationship proof”, “institutional realism”, etc.
* **One “Genre × Archetype Compatibility Matrix”**

  * how archetype time-graphs commonly pair with genre constraint-graphs (e.g., Mystery Unveiled × Mystery/Detective/Thriller; Rebirth × Holiday/Drama; Rise and Fall × Crime/Biography/Political)

### 3.6 Quality and Acceptance Criteria

For each genre:

* Levels 1–5 are present and clearly distinguished.
* Constraints are stated as enforceable rules, not vibes.
* Subgenres meaningfully change constraints, not just labels.
* Setting rules specify what must remain consistent.
* Scene obligations are concrete and testable in a draft.
* Examples reflect the stated promise and constraints.

---

## 4. Shared Requirements Across Both Workstreams

### 4.1 Consistency and Reuse

* Use consistent terminology across all graphs (shared node/edge labels when the concept is the same).
* Maintain a small controlled vocabulary for edge meanings (e.g., “forces commitment”, “reveals truth”, “narrows options”, “raises cost”, “reframes goal”).

### 4.2 Educational Readability

* Definitions must be precise, short, and non-overlapping.
* Each node/edge explanation must answer:

  * What it is
  * Why it exists
  * How it shows up on the page/screen
  * What changes because of it

### 4.3 Tool-Friendly Output

* JSON must be stable for programmatic rendering.
* Node and edge IDs must be unique and deterministic (e.g., `HJ_N03_THRESHOLD`, `HJ_E03_CROSSING`).

---

## 5. Final Deliverables Summary

### Archetypes (Time Graphs)

* 15 archetype graph JSONs
* 15 archetype narrative specs (node/edge explanations + walkthroughs + failure modes)
* cross-archetype index

### Genres (Depth Graphs)

* all genres from the prior genre list (≥ 15) as depth graph JSONs
* matching narrative specs
* cross-genre constraint index
* genre × archetype compatibility matrix

---

## 6. Handoff Inputs Required (from you)

* Confirm the authoritative list of archetypes (already fixed at 15).
* Confirm the authoritative list of genres (must include all previously listed; additions allowed).
* Confirm whether examples must be restricted to the examples already used in earlier JSONs, or whether adding examples is allowed where missing.
