# Design Document: Story Elements & Timelines

## 1. Problem Statement

The story_v5 project currently models **narrative structure** (archetypes: how stories progress through phases) and **genre constraints** (depth graphs: what rules govern a story). These are the "shape" and "rules" of storytelling.

What's missing is the **substance** — the concrete things that populate a story: the characters who act, the places where action unfolds, the objects that carry significance, and the events that mark turning points. Currently these exist only as scattered prose references in narrative.md and examples.md files, or as empty placeholder fields (`setting: ""`, `characters: []`) in the generation pipeline.

Similarly, there is no formal model for **how story elements change over time**. The archetype graph provides temporal ordering of phases, but doesn't track which characters are present at each phase, how relationships evolve, or how objects change hands. This is the Timeline concept.

---

## 2. Naming: "Story Elements"

**Recommended term: Story Elements**

Rationale:
- Immediately understandable — "the elements of a story"
- Domain-appropriate — widely used in creative writing pedagogy
- Clean parallel with existing concepts: archetype nodes model structural elements, genre constraints model rule elements, and now story elements model content elements
- The individual categories (Characters, Places, Events, Objects) are natural subdivisions

Alternatives considered:
| Name | Pros | Cons |
|------|------|------|
| Story Nouns | Linguistically apt (nouns = things) | Sounds awkward |
| Narrative Entities | Precise, maps to data modeling | Clinical, jargon-heavy |
| Story Fabric | Evocative (the material woven onto structure) | Vague, not actionable |
| Story Substrate | Captures "what structure operates on" | Too academic |

---

## 3. Element Taxonomy

### 3.1 Characters
People, beings, or personified forces with agency in the story.

**Properties:**
- `id`, `name`, `aliases[]`
- `role` — narrative function: protagonist, antagonist, mentor, ally, herald, threshold guardian, shadow, trickster, shapeshifter (extensible)
- `description` — brief characterization
- `traits[]` — defining qualities (e.g., "courageous", "secretive", "self-sacrificing")
- `motivations[]` — what drives them (e.g., "protect family", "gain power", "uncover truth")
- `arc_type` — the shape of their change: "transformative", "steadfast", "tragic", "corrupted", "redemptive", or null (flat)
- `relationships[]` — connections to other characters: `{ target_id, type, description }`
  - Relationship types: ally, rival, mentor-student, parent-child, romantic, nemesis, servant-master, etc.

### 3.2 Places
Locations, settings, and spaces where story action unfolds.

**Properties:**
- `id`, `name`, `aliases[]`
- `type` — ordinary world, threshold, special world, sanctuary, stronghold, wasteland, crossroads (extensible)
- `description` — sensory/atmospheric sketch
- `rules[]` — what behaviors/physics this place enforces (e.g., "magic works differently here", "strict social hierarchy")
- `atmosphere` — dominant mood/tone
- `connections[]` — links to other places: `{ target_id, type }` (contains, borders, passage-to, portal-to)

### 3.3 Events
Significant occurrences that mark turning points or state changes. Events are distinct from archetype nodes — a node describes a *type* of phase (e.g., "Crisis"), while an event is a *specific thing that happens* within that phase (e.g., "Obi-Wan is killed by Vader").

**Properties:**
- `id`, `name`
- `description` — what happens
- `archetype_node` — which structural phase this event belongs to (optional)
- `participants[]` — character IDs involved
- `location` — place ID where it occurs
- `objects_involved[]` — object IDs
- `consequences[]` — what changes as a result: `{ entity_id, change_type, description }`
  - Change types: learns, gains, loses, transforms, dies, arrives, departs, bonds, breaks
- `preconditions[]` — what must be true for this event to occur

### 3.4 Objects
Items, artifacts, or significant physical things that carry narrative weight.

**Properties:**
- `id`, `name`, `aliases[]`
- `type` — weapon, talisman, document, treasure, mcguffin, symbol, tool (extensible)
- `description` — what it is and what it looks like
- `significance` — why it matters to the story
- `rules[]` — what it does, constraints on use (e.g., "only destroyable in Mount Doom")
- `current_holder` — character ID or place ID (tracks possession)

### 3.5 Factions (optional, for stories with group dynamics)
Organizations, families, cultures, or other collective entities.

**Properties:**
- `id`, `name`, `aliases[]`
- `type` — kingdom, guild, family, army, cult, corporation, species (extensible)
- `description`
- `goals[]` — what the faction wants
- `members[]` — character IDs (with optional rank/role within faction)
- `relationships[]` — inter-faction relations: `{ target_id, type }` (allied, hostile, vassal, rival, neutral)

---

## 4. Template vs. Instance

Story Elements operate at **two levels**, mirroring how archetypes and genres already work:

### 4.1 Template Level — "What roles does this pattern call for?"
Tied to archetype definitions. Describes the *types* of elements a narrative pattern typically involves, without naming specifics.

**Example** (Hero's Journey template):
```json
{
  "archetype_id": "archetype_01_heros_journey",
  "element_templates": {
    "characters": [
      {
        "role": "protagonist",
        "label": "The Hero",
        "definition": "Ordinary person called to extraordinary action",
        "appears_at_nodes": ["HJ_N01", "HJ_N02", "HJ_N04", "HJ_N05", "HJ_N06", "HJ_N07", "HJ_N08", "HJ_N09", "HJ_N10", "HJ_N11"],
        "required": true
      },
      {
        "role": "mentor",
        "label": "The Mentor",
        "definition": "Wise figure who provides guidance, tools, or training",
        "appears_at_nodes": ["HJ_N03", "HJ_N07"],
        "required": true
      },
      {
        "role": "shadow",
        "label": "The Shadow / Antagonist",
        "definition": "Primary opposing force, may be person, system, or inner demon",
        "appears_at_nodes": ["HJ_N05", "HJ_N06", "HJ_N07", "HJ_N09"],
        "required": true
      }
    ],
    "places": [
      {
        "type": "ordinary_world",
        "label": "The Ordinary World",
        "definition": "Starting environment representing the hero's baseline reality",
        "appears_at_nodes": ["HJ_N01", "HJ_N11"],
        "required": true
      },
      {
        "type": "special_world",
        "label": "The Special World",
        "definition": "The unfamiliar domain where trials and transformation occur",
        "appears_at_nodes": ["HJ_N04", "HJ_N05", "HJ_N06", "HJ_N07", "HJ_N08"],
        "required": true
      }
    ],
    "objects": [
      {
        "type": "talisman",
        "label": "Gift / Talisman",
        "definition": "Item given by mentor that aids the hero in trials",
        "appears_at_nodes": ["HJ_N03", "HJ_N07"],
        "required": false
      }
    ]
  }
}
```

**Stored in:** `data/archetypes/{nn_name}/elements.json` (one per archetype)

### 4.2 Instance Level — "Who specifically fills these roles?"
Created during story planning. Maps specific named characters, places, and objects to template roles.

**Example** (Star Wars mapping to Hero's Journey):
```json
{
  "story_id": "star_wars_iv",
  "archetype_id": "archetype_01_heros_journey",
  "characters": [
    {
      "id": "char_luke",
      "name": "Luke Skywalker",
      "role": "protagonist",
      "traits": ["farm boy", "Force-sensitive", "impulsive", "idealistic"],
      "motivations": ["escape Tatooine", "avenge aunt and uncle", "learn the Force"],
      "arc_type": "transformative",
      "relationships": [
        { "target_id": "char_obiwan", "type": "mentor-student", "description": "Obi-Wan trains Luke in the Force" },
        { "target_id": "char_vader", "type": "nemesis", "description": "Vader killed Luke's father (or so Luke believes)" },
        { "target_id": "char_leia", "type": "ally", "description": "Princess in need of rescue" }
      ]
    }
  ],
  "places": [
    {
      "id": "place_tatooine",
      "name": "Tatooine",
      "type": "ordinary_world",
      "description": "Desert planet, remote and provincial",
      "atmosphere": "dusty, isolated, restless"
    },
    {
      "id": "place_death_star",
      "name": "Death Star",
      "type": "special_world",
      "description": "Imperial battle station, labyrinthine and oppressive",
      "atmosphere": "sterile, menacing, vast"
    }
  ],
  "objects": [
    {
      "id": "obj_lightsaber",
      "name": "Anakin's Lightsaber",
      "type": "talisman",
      "significance": "Gift from mentor, symbol of Jedi heritage",
      "rules": ["Requires Force sensitivity to wield effectively"]
    }
  ]
}
```

**Stored in:** `data/archetypes/{nn_name}/examples_elements.json` (alongside existing examples.md) or as part of generated story artifacts.

---

## 5. Timeline Model

A Timeline is a **time-ordered sequence of moments** that tracks how story elements participate in and are changed by the story's progression.

### 5.1 Core Concept

```
Archetype Graph (structural pattern)
    ↓ maps to
Timeline (ordered moments)
    ↓ each moment contains
Entity Participation + State Changes
```

A timeline bridges the gap between the abstract archetype graph (which says "Crisis happens after Trials") and concrete story content (which says "Luke watches Obi-Wan die, then must fly the trench run alone").

### 5.2 Moment

The fundamental unit of a timeline. Each moment represents a narrative beat where something happens to specific entities.

```json
{
  "moment_id": "M01",
  "archetype_node": "HJ_N01_ORDINARY_WORLD",
  "label": "Life on the Farm",
  "description": "Luke's restless existence on the moisture farm",
  "position": 0.0,

  "participants": {
    "characters": ["char_luke", "char_owen", "char_beru"],
    "places": ["place_tatooine"],
    "objects": []
  },

  "character_states": {
    "char_luke": {
      "emotional_state": "restless",
      "wants": "to leave Tatooine and join the Academy",
      "knows": ["nothing about his father's true identity"],
      "has": [],
      "status": "alive"
    }
  },

  "transitions": []
}
```

### 5.3 Transitions

State changes that occur at a moment — the "so what" of each beat.

```json
{
  "moment_id": "M03",
  "archetype_node": "HJ_N03_MENTOR",
  "label": "Meeting Obi-Wan",

  "participants": {
    "characters": ["char_luke", "char_obiwan"],
    "places": ["place_tatooine"],
    "objects": ["obj_lightsaber"]
  },

  "transitions": [
    {
      "entity_id": "char_luke",
      "change": "gains",
      "target": "obj_lightsaber",
      "description": "Obi-Wan gives Luke his father's lightsaber"
    },
    {
      "entity_id": "char_luke",
      "change": "learns",
      "detail": "His father was a Jedi Knight"
    },
    {
      "entity_id": "char_luke",
      "change": "bonds",
      "target": "char_obiwan",
      "description": "Accepts Obi-Wan as mentor"
    }
  ]
}
```

**Transition change types:**
- `learns` — gains knowledge or understanding
- `gains` — acquires an object, ability, or ally
- `loses` — loses an object, person, or status
- `transforms` — fundamental change in character, place, or object
- `arrives` — enters a new place
- `departs` — leaves a place
- `bonds` — forms or deepens a relationship
- `breaks` — severs or damages a relationship
- `dies` — character death (or destruction of place/object)
- `reveals` — hidden truth is exposed
- `decides` — makes a consequential choice

### 5.4 Timeline Structure

A complete timeline for a story:

```json
{
  "timeline_id": "star_wars_iv_main",
  "story_id": "star_wars_iv",
  "archetype_id": "archetype_01_heros_journey",
  "type": "master",
  "moments": [ ... ],
  "element_registry": {
    "characters": [ ... ],
    "places": [ ... ],
    "objects": [ ... ]
  }
}
```

### 5.5 Timeline Types

| Type | Description | Example |
|------|-------------|---------|
| **master** | The primary story timeline, following the archetype progression | Full Star Wars IV beat-by-beat |
| **character** | A single character's journey through the story | "Luke's arc" — only moments where Luke participates |
| **subplot** | A secondary narrative thread | "Han Solo's debt to Jabba" |
| **parallel** | For hybrid archetypes — two structural arcs running simultaneously | Hero's Journey + Quest interleaved |

Character timelines are **derived views** — computed by filtering the master timeline to moments where a specific character participates. They are not separately authored.

### 5.6 Template Timelines

At the template level, a timeline describes the *expected* entity participation pattern for an archetype, without naming specifics:

```json
{
  "archetype_id": "archetype_01_heros_journey",
  "template_timeline": [
    {
      "archetype_node": "HJ_N01_ORDINARY_WORLD",
      "expected_participants": {
        "characters": ["protagonist"],
        "places": ["ordinary_world"],
        "objects": []
      },
      "expected_transitions": [
        { "role": "protagonist", "change": "establishes_baseline" }
      ]
    },
    {
      "archetype_node": "HJ_N03_MENTOR",
      "expected_participants": {
        "characters": ["protagonist", "mentor"],
        "places": ["ordinary_world"],
        "objects": ["talisman"]
      },
      "expected_transitions": [
        { "role": "protagonist", "change": "gains", "target_role": "talisman" },
        { "role": "protagonist", "change": "bonds", "target_role": "mentor" },
        { "role": "protagonist", "change": "learns" }
      ]
    }
  ]
}
```

This allows the system to **validate** that a story plan has the right entities showing up at the right moments.

---

## 6. Integration with Existing Systems

### 6.1 Archetype Graphs (existing: `data/archetypes/`)
- Each archetype gets a new `elements.json` file defining template element roles
- Template timeline data can live in this same file or a separate `timeline_template.json`
- Existing `graph.json`, `narrative.md`, `examples.md` remain unchanged
- New `examples_elements.json` provides instance-level element mappings for existing example works

### 6.2 Genre Constraints (existing: `data/genres/`)
- Genre graphs don't need element templates (they constrain *how* elements behave, not *which* elements exist)
- However, genres can define **element constraints**: "Romance requires at least two characters with a romantic relationship", "Mystery requires an object or event that serves as the central puzzle"
- These could be added as a new field in genre `graph.json` or a separate `element_constraints.json`

### 6.3 Generation Pipeline (existing: `app/src/generation/`)
- **Contract Compiler**: Extracts element role requirements from archetype template → adds to `StoryContract`
- **Planner**: Assigns specific elements to beats/scenes (currently `setting: ""`, `characters: []` — would be populated)
- **Writer Agent**: Receives element roster + timeline context per scene (knows who's there, what they want, what they know)
- **Validation Engine**: New check — element continuity (character can't be in two places, dead characters don't reappear, objects have traceable custody)

### 6.4 Cross-References (existing: `data/cross_references/`)
- New file: `element_role_index.json` — which element roles appear across archetypes (analogous to `cross_archetype_index.json`)
- Enhancement to `example_works_registry.json` — link to element instance data

### 6.5 Interactive Viewer (existing: `app/src/`)
- Timeline visualization (future phase): horizontal swimlane view showing entity participation across archetype nodes
- Element detail panel: click a node to see which template elements appear at that phase
- Character arc overlay: emotional trajectory per character (extension of existing emotional arcs)

---

## 7. Data File Layout

```
data/
  archetypes/
    01_heros_journey/
      graph.json                    ← existing (unchanged)
      narrative.md                  ← existing (unchanged)
      examples.md                   ← existing (unchanged)
      variants.json                 ← existing (unchanged)
      elements.json                 ← NEW: template element roles + template timeline
      examples_elements.json        ← NEW: instance elements for example works (optional)
    ...

  genres/
    01_literary_fiction/
      graph.json                    ← existing (unchanged)
      element_constraints.json      ← NEW: genre-level element requirements (optional)
    ...

  cross_references/
    element_role_index.json         ← NEW: cross-archetype element role analysis
    ...

  vocabulary/
    element_roles.json              ← NEW: controlled vocabulary for character roles
    element_change_types.json       ← NEW: controlled vocabulary for transition types
    place_types.json                ← NEW: controlled vocabulary for place types
    object_types.json               ← NEW: controlled vocabulary for object types
    ...
```

---

## 8. Controlled Vocabularies (New)

Following the existing pattern (`archetype_node_roles.json`, `genre_edge_vocabulary.json`, etc.):

### 8.1 Character Roles
`protagonist`, `antagonist`, `mentor`, `ally`, `herald`, `threshold_guardian`, `shadow`, `trickster`, `shapeshifter`, `love_interest`, `foil`, `confidant`, `comic_relief`

### 8.2 Place Types
`ordinary_world`, `threshold`, `special_world`, `sanctuary`, `stronghold`, `wasteland`, `crossroads`, `underworld`, `summit`, `home`

### 8.3 Object Types
`weapon`, `talisman`, `document`, `treasure`, `mcguffin`, `symbol`, `tool`, `key`, `vessel`, `relic`

### 8.4 Relationship Types
`ally`, `rival`, `mentor_student`, `parent_child`, `romantic`, `nemesis`, `servant_master`, `sibling`, `betrayer`, `guardian`

### 8.5 Transition Change Types
`learns`, `gains`, `loses`, `transforms`, `arrives`, `departs`, `bonds`, `breaks`, `dies`, `reveals`, `decides`

---

## 9. Phased Delivery

### Phase 1 — Vocabulary & Schema
- Define controlled vocabularies (element_roles, place_types, object_types, relationship_types, change_types)
- Define TypeScript interfaces for all element types and timeline structures
- Create JSON schema documentation

### Phase 2 — Archetype Element Templates
- Author `elements.json` for all 15 archetypes (template element roles + template timelines)
- Build `element_role_index.json` cross-reference
- Validate: every archetype node referenced by at least one element role

### Phase 3 — Example Work Instances
- Author `examples_elements.json` for 3-5 archetypes with well-known works (Hero's Journey/Star Wars, Tragedy/Macbeth, Quest/Lord of the Rings, etc.)
- Full timeline instances with moments, participants, transitions

### Phase 4 — Genre Element Constraints
- Author `element_constraints.json` for genres that have strong element requirements (Romance, Mystery, Horror, etc.)
- Not all genres need these — some genres constrain tone/structure more than element composition

### Phase 5 — Generation Pipeline Integration
- Extend `StoryContract` with element role requirements
- Extend `StoryPlan` with element roster + timeline moments per scene
- Extend writer agent prompts with element context
- Add element continuity validation

### Phase 6 — Viewer Integration
- Element detail panel on archetype graph nodes
- Timeline visualization (swimlane or vertical track)
- Character arc overlays

---

## 10. Open Questions

1. **Scope of initial authoring**: Should Phase 2 cover all 15 archetypes immediately, or start with 3-5 well-understood ones (Hero's Journey, Tragedy, Quest, Rebirth, Comedy)?

2. **Events as elements vs. timeline moments**: Events could be a separate element category (like Characters, Places, Objects) OR they could simply be the timeline moments themselves. The current design treats moments as the event layer — is that sufficient, or do standalone "Event" elements add value?

3. **Faction/Group elements**: Include as a first-class category, or defer? Relevant for epic/ensemble stories but adds complexity.

4. **Depth of template timelines**: Should template timelines specify expected transitions at every archetype node, or just the key moments (origin, crisis, resolution)?

5. **Genre element constraints**: How prescriptive should these be? "Romance requires romantic relationship" is clear, but many genres are more about tone/structure than element composition.
