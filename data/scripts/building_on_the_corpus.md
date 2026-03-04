# Building on the Corpus

*A developer-oriented audio guide to extending the project. Estimated listening time: 10 minutes.*

---

## What this guide covers

If you want to add a new archetype, a new genre, or a new cross-reference dataset to this project, there's a specific process to follow. The system is designed so that new data is automatically picked up by the viewer and the generation pipeline — but only if it conforms to the existing schemas and conventions. This guide walks through the process for each type of addition.

---

## Adding a new archetype

Let's say you want to add a sixteenth archetype — The Trickster. Here's what you need to do.

### Step 1: Choose an ID prefix

Open `data/vocabulary/archetype_id_convention.md`. The existing fifteen archetypes use prefixes HJ, RR, QU, VR, OM, RB, TR, CO, CA, RV, ES, SA, MU, TF, and RF. Pick a two-letter code that's not already taken and that's reasonably mnemonic. For The Trickster, TK would work. Add it to the prefix table.

Check `data/vocabulary/genre_id_convention.md` too — make sure your prefix doesn't collide with a genre prefix. TK isn't taken by any genre, so you're clear.

### Step 2: Create the folder and graph

Create the folder `data/archetypes/16_the_trickster/`. The numbering continues from the existing fifteen.

Create `graph.json` following the schema. The file needs:

A top-level object with `id`, `name`, `type` set to "archetype", and `description`.

A `nodes` array. Each node needs `node_id` following the convention — TK_N01_WHATEVER through TK_N09_WHATEVER for the main spine. Each node needs `label`, `role` from the fourteen-term vocabulary, `definition`, `entry_conditions`, `exit_conditions`, `typical_variants`, `failure_modes`, and `signals_in_text`.

The role must be one of the fourteen controlled vocabulary terms — Origin, Disruption, Catalyst, Threshold, Trial, Revelation, Reversal, Commitment, Crisis, Transformation, Irreversible Cost, Resolution, Descent, or Reckoning. If your archetype needs a structural concept that none of these fourteen cover, you have a design decision — either map it to the closest existing role, or propose adding a new role to the vocabulary. Adding a new role is a significant change because it affects the cross-archetype index, the viewer's color scheme, and potentially the generation pipeline.

An `edges` array. Each edge needs `edge_id` following the convention — TK_E01_WHATEVER — plus `from`, `to`, `label`, `meaning` from the fifteen-term vocabulary, `preconditions`, `effects_on_stakes`, `effects_on_character`, `common_alternatives`, and `anti_patterns`.

Your graph must have exactly one start node with role Origin and at least one terminal node with role Resolution. The entry conditions of each node should reference the exit conditions of its predecessors.

### Step 3: Write the narrative

Create `narrative.md` — a prose walkthrough of your graph. For each node, explain what it represents, how it functions, what failure looks like, and how to spot it in a real work. Cover the overall arc shape and any variant paths.

### Step 4: Write the examples

Create `examples.md` — map two to four real works against your graph, node by node and edge by edge. You need at least one primary example with full detailed mappings and one or two cross-reference examples with briefer coverage. The works should be well-known enough that your audience is likely to recognize them.

### Step 5: Create the element template

Create `elements.json` — the story elements template for your archetype. This defines the character roles, place types, and object types the archetype typically involves. Each element needs a `role` or `type` from the controlled vocabularies (`element_roles.json`, `place_types.json`, `object_types.json`), a `label`, a `definition`, an `appears_at_nodes` array referencing your graph's node IDs, and a `required` flag.

You also need a `template_timeline` section — a sequence of moments describing expected element participation and transitions at each archetype node. Use change types from `element_change_types.json`: learns, gains, loses, transforms, arrives, departs, bonds, breaks, dies, reveals, decides.

Look at `data/archetypes/01_heros_journey/elements.json` for the canonical example.

### Step 5b: Optional — add example element instances

Create `examples_elements.json` — instance-level element mappings for a well-known work. This maps specific named characters to template roles, with traits, motivations, relationships, place descriptions, and object significance. It also includes a timeline of moments with per-character states and transitions.

### Step 6: Optional — add variants

If your archetype has meaningful optional or alternative paths, create `variants.json`. Variant nodes use IDs in the fifty to seventy-nine range — TK_N50 through TK_N79. The file needs nodes and edges arrays following the same schema as graph.json, plus a metadata block listing branch points and rejoin points.

### Step 7: Run the scripts

Run the metadata injector to add the `_metadata` block to your graph:

```
npx tsx app/scripts/inject-metadata.ts
```

Run the corpus validator to check vocabulary conformance:

```
npx tsx app/scripts/validate_corpus.ts
```

Run the manifest generator to update the corpus inventory:

```
npx tsx app/scripts/generate-manifest.ts
```

Run the works registry builder to pick up any new works from your examples:

```
npx tsx app/scripts/build-works-registry.ts
```

Run the element validators:

```
npx tsx app/scripts/validate_elements.ts
npx tsx app/scripts/validate_element_vocabularies.ts
```

If you created example instances, also run:

```
npx tsx app/scripts/validate_examples_elements.ts
```

### Step 8: Update the data index

Open `app/src/graph-engine/dataIndex.ts`. Add your new archetype to the ARCHETYPE_DIRS array:

```typescript
{ dir: '16_the_trickster', name: 'The Trickster' },
```

This is what the viewer's graph selector and the generation pipeline's corpus loader use to discover archetypes.

### Step 9: Update the cross-references

The cross-archetype index at `data/cross_references/cross_archetype_index.json` needs updating — add your archetype's nodes to the role index entries. If your Trickster has an Origin node, add it to the Origin section alongside the fifteen existing instances.

The element role index at `data/cross_references/element_role_index.json` needs updating — add your archetype's character roles, place types, and object types to the appropriate entries.

The compatibility matrix at `data/cross_references/genre_archetype_matrix.json` needs twenty-seven new entries — one for each genre, classifying compatibility with The Trickster.

The emotional arcs file needs a new profile. The tone integration file needs twenty-seven new pairings. The hybrid patterns file may need new entries if The Trickster hybridizes naturally with existing archetypes.

### Step 10: Test

Run the full test suite:

```
cd app && npm test
```

Start the dev server and verify your new archetype appears in the selector, renders correctly, and all panels work:

```
npm run dev
```

---

## Adding a new genre

The process for genres is similar but has some differences because genre graphs are trees rather than linear spines.

### Step 1: Choose a prefix

Pick a two-letter code that's not taken by any existing genre or archetype. Add it to `data/vocabulary/genre_id_convention.md`.

### Step 2: Create the folder and graph

Create `data/genres/28_your_genre/`. The graph must follow the five-level architecture:

- Exactly one Genre Promise node (level 1, number range 01-09)
- Three to six Core Constraint nodes (level 2, range 10-19)
- Three to six Subgenre Pattern nodes (level 3, range 20-39)
- Two to four Setting Rule nodes (level 4, range 40-59)
- Two to four Scene Obligation nodes (level 5, range 60-79)
- Exactly one Tone Marker node (level null, range 80-89)
- One or two Anti-Pattern nodes (level null, range 90-99)

Every node needs a `severity` field — "hard" or "soft." Every edge inherits severity from its target node. The general rules: Genre Promise, Core Constraints, Tone Marker, and Anti-Patterns are hard. Subgenre Patterns are soft. Setting Rules and Scene Obligations are mixed — assign based on whether violating the constraint breaks the genre or is merely uncommon.

Genre nodes need `level` in addition to all the standard fields. Edges need `severity` in addition to the standard edge fields.

### Step 3: Write narrative and examples

Same as archetypes — a prose walkthrough and two to four real work mappings.

### Step 3b: Optional — create element constraints

If your genre has strong element composition requirements (specific character roles, required relationships, or testable structural rules), create `element_constraints.json`. This defines character constraints, relationship constraints, place constraints, object constraints, and element rules, each with a severity (required, recommended, optional). Use terms from the controlled vocabularies: `element_roles.json`, `relationship_types.json`, `place_types.json`, `object_types.json`.

Not every genre needs this — genres that primarily constrain tone and structure (like Drama, Comedy, or Literary Fiction) rely on their existing graph constraints. See `data/genres/10_horror/element_constraints.json` for a good example.

### Step 4: Run the scripts

Same set — metadata injection, validation, manifest generation, works registry. Plus run the severity injector if you want the script to set initial defaults:

```
npx tsx app/scripts/inject-severity.ts
```

If you created element constraints, validate them:

```
npx tsx app/scripts/validate_element_constraints.ts
```

### Step 5: Update the data index

Add your genre to the GENRE_DIRS array in `app/src/graph-engine/dataIndex.ts`.

### Step 6: Update cross-references

The genre constraint index needs your genre's shared patterns added. The compatibility matrix needs fifteen new entries — one for each archetype. The tone integration file needs fifteen new pairings for your genre's tone marker. The genre blending model may need entries if your genre blends naturally with existing ones.

---

## Adding a new cross-reference dataset

If you want to add a thirteenth cross-reference file — say, a dataset mapping archetypes to narrative pacing patterns — the process is lighter.

### Step 1: Create the JSON file

Place it in `data/cross_references/`. Follow the pattern of the existing files — a title, description, and structured data. Use the controlled vocabulary's role and meaning terms wherever applicable so your data connects to the existing graph structure.

### Step 2: Update the index

Add an entry to `data/cross_references/index.md` describing what your file contains and what questions it answers.

### Step 3: Update the manifest

Run the manifest generator to include your new file in the corpus inventory.

### Step 4: If the pipeline needs it

If the generation pipeline should consume your new data, add a field to the LoadedCorpus interface in `app/src/generation/artifacts/types.ts`, add a load call in `app/src/generation/engine/corpusLoader.ts`, and use the data in whichever engine module needs it.

### Step 5: If the viewer needs it

If the viewer should display your new data, add a panel or extend an existing panel in `app/src/panels/`. The CrossIndex panel is a good template for data that connects graphs to each other.

---

## Modifying the controlled vocabularies

This is the most consequential change you can make. Adding a new node role or edge meaning affects every graph that might use it, the cross-indices that index by role or meaning, the viewer's color scheme and styling, and the generation pipeline's vocabulary checks.

If you need a new archetype node role — say, "Reckoning" is defined but unassigned, and you realize you need a fifteenth role for a concept none of the existing fourteen cover — you would:

1. Add the role to `data/vocabulary/archetype_node_roles.json` with a definition, structural function, and examples
2. Update the validation script if it has hardcoded role counts
3. Update the viewer's style rules in `app/src/render/styles.ts` to assign a color to the new role
4. Update the cross-archetype index to include the new role
5. Assign the role to nodes in whichever graphs need it

For edge meanings, the process is similar — add the meaning to the vocabulary file, update styles for edge coloring, and use it in graphs.

The key principle: vocabulary changes ripple through the entire system. Only add a term if it represents a genuinely distinct structural concept that can't be adequately captured by an existing term.

---

## Validation as safety net

The system is designed so that the validation scripts catch most errors before they reach the viewer or pipeline. If you add a new graph with a node role that's not in the vocabulary, the validation script will fail. If you create an edge pointing to a node that doesn't exist, the normalizer will reject it. If you forget the severity field on a genre node, the schema validation catches it.

The workflow is: make your changes, run the scripts, run the tests, start the dev server, verify visually. If the scripts pass and the viewer renders your new data correctly, you're good.

The most common mistakes when extending the corpus:

- Using a node role or edge meaning that's not in the vocabulary — the validator catches this
- Forgetting to add the new archetype or genre to the dataIndex.ts file — the viewer won't show it
- Missing entry or exit conditions that reference other nodes — the graph's causal chain is broken
- Forgetting to update cross-references — the matrix, indices, and other files become incomplete
- Using an ID prefix that collides with an existing one — the prefix tables in the convention files prevent this if you check them first

Follow the steps, run the scripts, and the system will tell you what you missed.
