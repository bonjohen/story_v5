# Vocabulary Templatization

The controlled vocabulary has always been central to this project. Character roles like "mentor" and "trickster," relationship types like "rivalry" and "mentorship," place types like "stronghold" and "threshold" — these terms give the generation pipeline a shared language for describing story elements. But until the data layer was built, these terms existed only as static JSON files. They could not be queried, linked to entities, or measured for coverage.

Vocabulary templatization changes that. It promotes every controlled vocabulary term into a formal database record, stored in the `vocabulary_terms` table and linked to story objects through the `term_usage` join table.

## The Nine Domains

The system imports terms from nine vocabulary domains, each defined by a JSON file in the `data/vocabulary/` directory:

**Character roles** — 13 terms from `element_roles.json`: protagonist, antagonist, mentor, herald, threshold guardian, shapeshifter, trickster, ally, shadow, herald of change, catalyst, witness, and foil. These describe the narrative function a character serves.

**Relationship types** — 10 terms from `relationship_types.json`: alliance, rivalry, mentorship, romance, betrayal, dependency, hierarchy, kinship, enmity, and guardianship. These describe how two entities relate to each other.

**Place types** — 10 terms from `place_types.json`: stronghold, threshold, sanctuary, wilderness, underworld, crossroads, prison, arena, market, and haven. These describe a location's narrative function.

**Object types** — 10 terms from `object_types.json`: weapon, talisman, key, vessel, barrier, map, mirror, crown, gift, and trap. These describe what role a significant object plays in the story.

**Change types** — 11 terms from `element_change_types.json`: describing the kinds of transformations that story elements undergo across the narrative arc.

**Archetype node roles** — 14 terms from `archetype_node_roles.json`: the structural positions a node can occupy in an archetype graph, such as "inciting incident," "crisis," and "resolution."

**Archetype edge meanings** — 15 terms from `archetype_edge_vocabulary.json`: the causal meanings that edges carry in archetype graphs.

**Genre node roles** — 7 terms from `genre_node_roles.json`: the structural positions in genre depth graphs.

**Genre edge meanings** — 12 terms from `genre_edge_vocabulary.json`: the refinement meanings that edges carry in genre constraint hierarchies.

## How Import Works

Vocabulary import is triggered manually from the Database Management page using the "Import Vocabulary" button. The importer fetches each JSON file via the browser's fetch API, maps the terms to database rows, and inserts them using `INSERT OR REPLACE` for idempotency. You can re-import safely at any time — existing terms are updated rather than duplicated.

After import, the Vocabulary tab on the Database Management page shows all nine domains and their terms. Each term has a label, definition, and structural function description. Some terms also include information about which entity types they apply to.

## Term Usage Linkage

The real power of templatization emerges through the `term_usage` table. When you index a story to the database using the "Index to DB" button in the Story Workspace, the import bridge does not just copy entity data — it also creates term_usage records that link entities to their vocabulary terms.

For example, if a character has the role "mentor," the importer finds the "mentor" term in the `character_role` domain and creates a usage record connecting that character entity to that vocabulary term. The same happens for relationship types, place types, and object types.

This linkage enables queries that were previously impossible: "Show me all mentors across all my stories." "Which place types has this story not used yet?" "How many of the thirteen character roles appear in this narrative?"

## Template Coverage

The Template Coverage view on the Database Management page uses term_usage data to generate a coverage report for any story. For each vocabulary domain, it calculates what percentage of available terms the story uses.

A story that uses seven of thirteen character roles shows 54 percent coverage for that domain. A story with only two place types out of ten shows 20 percent. The coverage bars are color-coded: green above 60 percent, amber between 30 and 60, and red below 30.

This is not a score to maximize — a short story might only need three character roles. But the coverage view makes the vocabulary landscape visible. It can reveal opportunities: "This story has no trickster figure — would adding one create interesting tension?" It can also confirm completeness: "All five place types that matter for this genre are represented."

The coverage report transforms the controlled vocabulary from a reference document into a practical authoring tool.
