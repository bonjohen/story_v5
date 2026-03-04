# Story Elements & Timelines — Implementation Plan

*Phased plan derived from `docs/story_elements_and_timelines.md`*

This file is maintained by the coding agent so that [ ] means not started, [~] means started, and [X] means completed. All tasks must be started, meaning assign [~]. The direct transition from [ ] to [X] is not a valid transition. Use as fine a grain as practical, up to and including one item at a time. As you select a task for work, set it to [~], and as you complete it, set it to [X].
---

## Overview

This plan breaks the Story Elements & Timelines specification into 6 implementation phases, ordered by dependency and increasing complexity. Each phase produces a working, verifiable increment. Phases 1–2 establish the foundation (vocabulary and templates for all 15 archetypes); Phases 3–4 add concrete instances and genre integration; Phases 5–6 wire everything into the generation pipeline and interactive viewer.

**Data baseline** (complete, from Goals 1–3):
- 15 archetype graphs with narrative specs and examples
- 27 genre depth graphs with narrative specs and examples
- Cross-references: genre × archetype matrix, cross-archetype index, cross-genre constraint index
- Interactive viewer (React + TypeScript + Vite + Cytoscape.js + Zustand)

---

## Phase 1 — Controlled Vocabularies & Schema

**Goal**: Define all controlled vocabularies for story elements and create TypeScript interfaces for element types and timeline structures. Establish the data contracts that all subsequent phases build on.

### Controlled Vocabularies

- [X] Create `data/vocabulary/element_roles.json` — 13 character roles: protagonist, antagonist, mentor, ally, herald, threshold_guardian, shadow, trickster, shapeshifter, love_interest, foil, confidant, comic_relief
- [X] Create `data/vocabulary/place_types.json` — 10 place types: ordinary_world, threshold, special_world, sanctuary, stronghold, wasteland, crossroads, underworld, summit, home
- [X] Create `data/vocabulary/object_types.json` — 10 object types: weapon, talisman, document, treasure, mcguffin, symbol, tool, key, vessel, relic
- [X] Create `data/vocabulary/relationship_types.json` — 10 relationship types: ally, rival, mentor_student, parent_child, romantic, nemesis, servant_master, sibling, betrayer, guardian
- [X] Create `data/vocabulary/element_change_types.json` — 11 transition change types: learns, gains, loses, transforms, arrives, departs, bonds, breaks, dies, reveals, decides
- [X] Update `data/vocabulary/index.md` to document all new vocabulary files

### TypeScript Interfaces

- [X] Create `app/src/types/elements.ts` — interfaces for Character, Place, Object, Event, Faction (both template and instance levels)
- [X] Create `app/src/types/timeline.ts` — interfaces for Moment, Transition, Timeline, TemplateTimeline, CharacterState
- [X] Create `app/src/types/element-constraints.ts` — interfaces for genre element constraints

### Validation

- [X] Write validation script to verify vocabulary files follow the established format (matching `archetype_node_roles.json` pattern)
- [X] Ensure all TypeScript interfaces compile cleanly with existing codebase

**Deliverable**: 5 new vocabulary JSON files in `data/vocabulary/`, 3 new TypeScript interface files in `app/src/types/`, all compiling and internally consistent.

---

## Phase 2 — Archetype Element Templates

**Goal**: Author `elements.json` for all 15 archetypes, defining the template-level element roles and template timelines. Build the cross-archetype element role index.

### Template Authoring

Each `elements.json` contains: archetype ID, element templates (characters, places, objects with roles/types, labels, definitions, `appears_at_nodes`, required flag), and a template timeline (expected participants and transitions per archetype node).

- [X] Author `data/archetypes/01_heros_journey/elements.json`
- [X] Author `data/archetypes/02_rags_to_riches/elements.json`
- [X] Author `data/archetypes/03_the_quest/elements.json`
- [X] Author `data/archetypes/04_voyage_and_return/elements.json`
- [X] Author `data/archetypes/05_overcoming_the_monster/elements.json`
- [X] Author `data/archetypes/06_rebirth/elements.json`
- [X] Author `data/archetypes/07_tragedy/elements.json`
- [X] Author `data/archetypes/08_comedy/elements.json`
- [X] Author `data/archetypes/09_coming_of_age/elements.json`
- [X] Author `data/archetypes/10_the_revenge/elements.json`
- [X] Author `data/archetypes/11_the_escape/elements.json`
- [X] Author `data/archetypes/12_the_sacrifice/elements.json`
- [X] Author `data/archetypes/13_the_mystery_unveiled/elements.json`
- [X] Author `data/archetypes/14_the_transformation/elements.json`
- [X] Author `data/archetypes/15_the_rise_and_fall/elements.json`

### Cross-Reference

- [X] Build `data/cross_references/element_role_index.json` — which character roles, place types, and object types appear across all 15 archetypes (analogous to `cross_archetype_index.json`)

### Validation

- [X] Validate: every archetype node is referenced by at least one element template's `appears_at_nodes`
- [X] Validate: all character roles, place types, and object types used in templates exist in the controlled vocabularies
- [X] Validate: all node IDs referenced in `appears_at_nodes` and template timelines exist in the corresponding `graph.json`
- [X] Validate: every template timeline entry references a valid archetype node

**Deliverable**: 15 `elements.json` files (one per archetype), 1 `element_role_index.json` cross-reference, all validated against graph data and controlled vocabularies.

---

## Phase 3 — Example Work Instances

**Goal**: Author `examples_elements.json` for 5 archetypes with well-known works, providing full instance-level element mappings and timeline instances with moments, participants, and transitions.

### Instance Authoring

Each `examples_elements.json` contains: story ID, archetype ID, named characters (with traits, motivations, arc types, relationships), named places (with descriptions and atmospheres), named objects (with significance and rules), and a full timeline of moments with participant lists, character states, and transitions.

- [X] Author `data/archetypes/01_heros_journey/examples_elements.json` — Star Wars: A New Hope
- [X] Author `data/archetypes/03_the_quest/examples_elements.json` — The Lord of the Rings: The Fellowship of the Ring
- [X] Author `data/archetypes/07_tragedy/examples_elements.json` — Macbeth
- [X] Author `data/archetypes/06_rebirth/examples_elements.json` — A Christmas Carol
- [X] Author `data/archetypes/08_comedy/examples_elements.json` — The Big Lebowski

### Validation

- [X] Validate: all character roles in instances match template roles from `elements.json`
- [X] Validate: all place types in instances match template types from `elements.json`
- [X] Validate: all transition change types use vocabulary from `element_change_types.json`
- [X] Validate: timeline moments reference valid archetype nodes from `graph.json`
- [X] Validate: relationship targets reference valid character/place/object IDs within the same instance
- [X] Validate: element continuity — no character in two places simultaneously, dead characters don't reappear, object custody is traceable

**Deliverable**: 5 `examples_elements.json` files with complete element instances and timelines, all validated for internal consistency and vocabulary compliance.

---

## Phase 4 — Genre Element Constraints

**Goal**: Author `element_constraints.json` for genres that have strong element requirements. Not all 27 genres need these — focus on genres where element composition is a defining characteristic.

### Constraint Authoring

Each `element_constraints.json` defines: required character role patterns, required relationship types, minimum/maximum element counts, and genre-specific element rules.

- [X] Author `data/genres/08_romance/element_constraints.json` — romantic relationship requirement, dual protagonist pattern
- [X] Author `data/genres/10_horror/element_constraints.json` — threat entity, victim pattern, isolation rules
- [X] Author `data/genres/04_thriller/element_constraints.json` — antagonist requirement, ticking clock, information asymmetry
- [X] Author `data/genres/05_fantasy/element_constraints.json` — magical system objects, special world requirements
- [X] Author `data/genres/06_science_fiction/element_constraints.json` — technology objects, world-building rules
- [X] Author `data/genres/13_detective/element_constraints.json` — detective role, mcguffin/puzzle object, revelation structure
- [X] Author `data/genres/07_adventure/element_constraints.json` — protagonist, quest object, special world traversal
- [X] Author `data/genres/24_western/element_constraints.json` — frontier setting, lawman/outlaw roles
- [X] Author `data/genres/14_superhero/element_constraints.json` — superpowered protagonist, nemesis, dual identity
- [X] Author `data/genres/16_war/element_constraints.json` — faction requirements, battlefield settings

### Genres Explicitly Skipped (tone/structure > element composition)

The following genres constrain style and structure more than element composition and do not need `element_constraints.json`:
- 01_drama, 02_action, 03_comedy, 09_romantic_comedy, 11_mystery, 12_crime, 15_historical, 17_biography, 18_family, 19_young_adult, 20_literary_fiction, 21_childrens_literature, 22_satire, 23_psychological, 25_political, 26_musical, 27_holiday

### Validation

- [X] Validate: all character roles and relationship types in constraints use controlled vocabulary terms
- [X] Validate: constraints are testable — each rule can be checked against an element roster (not vague descriptions)

**Deliverable**: 10 `element_constraints.json` files for element-prescriptive genres, validated against controlled vocabularies.

---

## Phase 5 — Generation Pipeline Integration

**Goal**: Wire story elements and timelines into the existing generation pipeline so that story contracts include element requirements, story plans populate element rosters, and validation enforces continuity.

### Contract Compiler Extensions

- [ ] Extend `StoryContract` type with `element_requirements` field — extracted from archetype `elements.json` template
- [ ] Extend `StoryContract` type with `element_constraints` field — extracted from genre `element_constraints.json` (when present)
- [ ] Update contract compiler to load and merge element templates from selected archetype
- [ ] Update contract compiler to load and merge element constraints from selected genre (if file exists)

### Planner Extensions

- [ ] Extend `StoryPlan` type with `element_roster` field — named characters, places, objects assigned to template roles
- [ ] Extend `StoryPlan` scene/beat structures with populated `characters[]`, `setting`, `objects[]` fields (currently empty placeholders)
- [ ] Add timeline moment generation — for each planned scene, produce a moment with participants and expected transitions
- [ ] Validate element roster covers all `required: true` template roles

### Writer Agent Extensions

- [ ] Extend per-scene writer context with element roster (who's there, what they want, what they know at this point)
- [ ] Add character state tracking — accumulate transitions from prior moments to compute current character state per scene
- [ ] Include object custody tracking in writer context — which character has which object at this point

### Validation Engine Extensions

- [ ] Add element continuity check — character can't appear in a scene at place A if their last transition was `arrives` at place B
- [ ] Add mortality check — dead characters don't participate in subsequent moments (unless resurrection is a story element)
- [ ] Add object custody check — objects have traceable chain of possession
- [ ] Add relationship consistency check — relationship types don't contradict (can't be both `ally` and `nemesis` simultaneously unless `shapeshifter` role)

**Deliverable**: Generation pipeline produces stories with populated element rosters, per-scene character/place/object assignments, and timeline-based continuity validation.

---

## Phase 6 — Viewer Integration

**Goal**: Add element and timeline visualization to the interactive viewer, allowing users to see which elements participate at each archetype node and trace element arcs across the timeline.

### Element Detail Panel

- [ ] Add "Elements" tab to node detail panel — when viewing an archetype node, show which template element roles appear at that phase
- [ ] Display character roles, place types, and objects expected at the selected node
- [ ] If `examples_elements.json` exists, show instance-level names alongside template roles (e.g., "Mentor → Obi-Wan Kenobi")
- [ ] Add element role badges with color-coding matching the controlled vocabulary

### Timeline Visualization

- [ ] Build timeline swimlane view — horizontal tracks (one per character role) showing participation across archetype nodes
- [ ] Render moments as cards on the swimlane, positioned at the corresponding archetype node's x-coordinate
- [ ] Show transitions as icons/badges on moment cards (learns, gains, loses, etc.)
- [ ] Support toggling between template view (roles) and instance view (named characters) when example data is available

### Character Arc Overlay

- [ ] Add character arc line overlay on the archetype graph — trace a single character's emotional/state trajectory across nodes
- [ ] Integrate with existing emotional arc data from `data/cross_references/archetype_emotional_arcs.json`
- [ ] Allow selecting which character to track via a dropdown

### Element Constraints in Genre View

- [ ] When viewing a genre graph, show element constraints (if `element_constraints.json` exists) in a sidebar panel
- [ ] Highlight constraint requirements as checklist items

### Store & Data Layer

- [ ] Extend Zustand store with element data state (loaded templates, loaded instances)
- [ ] Build element data loader — parse `elements.json` and `examples_elements.json` files
- [ ] Add element constraint loader for genre views

**Deliverable**: Interactive viewer shows element participation at each node, swimlane timeline visualization, character arc overlays, and genre element constraint display.

---

## Dependencies and Prerequisites

| Phase | Depends On | Data Prerequisites |
|-------|------------|-------------------|
| 1 — Vocabulary & Schema | — | Existing vocabulary files (pattern reference) |
| 2 — Archetype Templates | Phase 1 | All 15 archetype `graph.json` files (complete) |
| 3 — Example Instances | Phases 1, 2 | Archetype `examples.md` files (complete, for reference) |
| 4 — Genre Constraints | Phase 1 | Genre `graph.json` files (complete) |
| 5 — Pipeline Integration | Phases 1, 2, 4 | Generation pipeline code (existing in `app/src/`) |
| 6 — Viewer Integration | Phases 1, 2, 3 | Interactive viewer (complete, all 8 phases) |

All data prerequisites are satisfied — Goals 1, 2, and 3 are complete.

Phases 3 and 4 are independent of each other and can be worked in parallel.

---

## Estimated Scope

| Phase | Complexity | Key Risk |
|-------|-----------|----------|
| 1 — Vocabulary & Schema | Low | Ensuring vocabulary completeness without over-engineering |
| 2 — Archetype Templates | High | Consistent quality across 15 archetypes; accurate node-to-element mapping |
| 3 — Example Instances | High | Timeline moment authoring is labor-intensive; maintaining internal consistency |
| 4 — Genre Constraints | Medium | Determining which genres genuinely need element constraints vs. which are tone-driven |
| 5 — Pipeline Integration | High | Continuity validation logic; state tracking across scenes |
| 6 — Viewer Integration | High | Swimlane layout algorithm; syncing timeline view with graph canvas |

---

## Open Questions (to resolve before or during implementation)

1. **Events as elements vs. timeline moments**: The current design treats moments as the event layer. If standalone Event elements are needed, they would be added as a 4th element category in Phase 1 vocabulary and Phase 2 templates.

2. **Faction/Group elements**: Deferred from initial implementation. Can be added as a Phase 2.5 if needed for ensemble/epic archetypes (The Quest, Rise and Fall).

3. **Template timeline depth**: Phase 2 will specify expected transitions at every archetype node (not just key moments), since the data is already structured per-node in `graph.json`.

4. **Genre constraint prescriptiveness**: Phase 4 focuses on genres with objectively testable element requirements. Genres where constraints are subjective (tone-based) are explicitly skipped.
