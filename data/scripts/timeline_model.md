# The Timeline Model

*An audio-friendly guide to how stories track change over time. Estimated listening time: 11 minutes.*

---

## What timelines solve

An archetype graph tells you *what phases* a story passes through. The story elements system tells you *who and what* populates those phases. But neither one answers a critical question: *how do things change?*

When does the protagonist gain the mentor's gift? When does the ally die? When does the object change hands? When does the protagonist learn the truth? These are the state changes that make a story feel alive — and without tracking them, a generation pipeline can produce scenes where dead characters speak, lost objects reappear, and characters know things they haven't learned yet.

The timeline model solves this. It's a time-ordered sequence of moments that tracks how story elements participate in and are changed by the story's progression.

---

## The moment

The fundamental unit of a timeline is the **moment** — a narrative beat where something happens to specific entities at a specific archetype phase.

Every moment has five components.

**Archetype node** — which structural phase this moment occurs at. This anchors the moment to the graph, creating a bridge between abstract structure and concrete content.

**Participants** — which elements are present. A participant list has three categories: characters (by role or name), places (by type or name), and objects (by type or name). If a character isn't in the participant list, they're not in this scene.

**Character states** — optional per-character snapshots describing emotional state, current desires, knowledge, possessions, and survival status. These accumulate across moments to build a running picture of each character's situation.

**Transitions** — the state changes that happen at this moment. These are the "so what" of each beat. A transition says: this entity undergoes this change, affecting this target, with this description. Transitions are the core mechanism for tracking how stories evolve.

**Position** — a normalized zero-to-one value indicating where in the story timeline this moment falls. Position zero is the beginning; position one is the end.

---

## Transitions — the language of change

Every transition uses a change type from the controlled vocabulary at `data/vocabulary/element_change_types.json`. There are eleven types, and each one describes a specific kind of state change.

**Learns** — the entity gains knowledge or understanding. Luke learns that his father was a Jedi Knight. Macbeth learns the witches' prophecy. This is information acquisition.

**Gains** — the entity acquires an object, ability, or relationship. Luke gains his father's lightsaber. Scrooge gains a new perspective. This is possession acquisition.

**Loses** — the entity loses an object, person, status, or ability. Luke loses his aunt and uncle. The protagonist loses their sanctuary. This is deprivation.

**Transforms** — a fundamental change in the entity's nature, identity, or worldview. Scrooge transforms from miser to philanthropist. The protagonist becomes someone new. This is the deepest kind of change.

**Arrives** — the entity enters a new place. Luke arrives at the Death Star. The quest party arrives at the final approach. This is spatial transition.

**Departs** — the entity leaves a place. Luke departs Tatooine. The hero departs the ordinary world. This is spatial departure.

**Bonds** — the entity forms or deepens a relationship. Luke bonds with Obi-Wan as mentor-student. The quest party bonds through shared hardship. This is relational connection.

**Breaks** — the entity severs or damages a relationship. The betrayer breaks trust. The protagonist breaks from the mentor's guidance. This is relational rupture.

**Dies** — character death or destruction of a place or object. Obi-Wan dies at the hands of Vader. The ordinary world is destroyed. This is permanent removal.

**Reveals** — a hidden truth is exposed. The truth about Luke's father is revealed. The mystery's solution is unveiled. This is information exposure.

**Decides** — the entity makes a consequential choice. The protagonist decides to accept the call. The tragic hero decides to pursue ambition. This is agency assertion.

These eleven types are exhaustive — every meaningful story state change maps to at least one. Some moments have multiple transitions: at the Mentor node, the protagonist "gains" a talisman, "bonds" with the mentor, and "learns" crucial information — three transitions in a single moment.

---

## Template timelines versus instance timelines

Like story elements themselves, timelines operate at two levels.

### Template timelines

Every archetype's `elements.json` file includes a `template_timeline` section. This describes the *expected* pattern of participation and state changes for an archetype, using role names rather than character names.

A template timeline for the Hero's Journey says: at the Ordinary World node, the protagonist establishes their baseline in the ordinary world. At the Call to Adventure node, the protagonist learns of the disruption, and the herald arrives. At the Mentor node, the protagonist gains a talisman, bonds with the mentor, and learns something essential. At the Threshold, the protagonist departs the ordinary world and arrives at the special world.

Template timelines are structural predictions. They tell the generation pipeline: "When you reach the Ordeal phase, the protagonist and the shadow should both be present, and you should expect a transformation, a loss, and possibly a death."

### Instance timelines

Instance timelines are part of the `examples_elements.json` files. They map the template's abstract expectations to specific story events.

In the Star Wars instance timeline: at the Ordinary World, Luke Skywalker is restless on Tatooine. At the Mentor node, Obi-Wan gives Luke the lightsaber (gains), explains the Jedi legacy (learns), and Luke accepts Obi-Wan as his guide (bonds). At the Ordeal, Obi-Wan dies (dies), Luke transforms through grief and resolve (transforms), and Luke gains new understanding of the Force (learns).

Each instance moment includes per-character states: Luke's emotional state is "restless" at the beginning, "determined" after the call, "grief-stricken but resolute" after the ordeal. These character states are what the writer agent uses to maintain emotional continuity scene by scene.

---

## How the pipeline uses timelines

The timeline model integrates into the generation pipeline at three stages.

### Planning

When the planner creates scenes from the beat sheet, it now populates each scene with element data based on the template timeline. For every scene mapped to an archetype node, the planner looks up the expected participants and transitions. The Ordeal scene gets the protagonist and shadow as characters, the special world as setting, and transitions for transformation and possible death. This replaces the old empty `characters: []` and `setting: ""` placeholders.

### Writing

The writer agent receives enriched per-scene context. Beyond the archetype node definition and genre constraints, it now gets:

- The element roster — who's in this scene, their roles, traits, motivations
- The setting — which place type, its description and atmosphere
- Object context — which objects are present and who holds them
- Character state notes — accumulated from prior scenes' transitions

The character state notes are the key innovation. The writer agent knows that by scene five, the protagonist has "gained" a talisman, "bonded" with the mentor, "departed" the ordinary world, and "arrived" at the special world. It knows the protagonist's knowledge includes what they've "learned" in prior scenes but not what will be "revealed" later. This prevents anachronistic knowledge and maintains emotional continuity.

### Validation

The validation engine runs four new element-specific checks:

**Element continuity** — a character can't be at a location if their last transition was "arrives" at a different location. If scene three has the protagonist arriving at the Death Star, and scene four has them at Tatooine with no departure transition, that's a continuity break.

**Element mortality** — dead characters don't participate in subsequent moments. If the mentor dies at the Ordeal, the mentor can't appear as a participant in the Reward or Road Back. The validator tracks "dies" transitions and flags any post-mortem participation.

**Object custody** — objects have a traceable chain of possession. If the protagonist "gains" a lightsaber in scene two, and scene five has the antagonist using it, there must be an intervening scene where the protagonist "loses" it and the antagonist "gains" it. Custody must be traceable.

**Relationship consistency** — character relationships should not contradict unless a shapeshifter role is involved. Two characters can't simultaneously be "ally" and "nemesis" unless one of them is explicitly a shapeshifter whose allegiance is uncertain.

---

## Timeline types

The system supports several timeline types, though currently the primary focus is on master timelines.

A **master timeline** is the primary story timeline following the archetype progression. It contains all moments for all characters. This is what the template timeline describes and what generated stories produce.

A **character timeline** is a filtered view — only the moments where a specific character participates. These are derived, not separately authored. The viewer's timeline panel can filter to show a single character's trajectory.

**Subplot timelines** and **parallel timelines** are conceptual categories for future extension — secondary narrative threads, or interleaved structural arcs for hybrid archetype stories. These aren't implemented yet but the data model supports them.

---

## Visualizing timelines

The interactive viewer renders timelines as a **swimlane chart** in the Timeline tab.

Each horizontal track represents a character role. Each column represents an archetype node, ordered left to right following the spine. Where a character participates at a node, the cell shows transition badges — small icons indicating what changes. A dot means the character is present with no explicit transition. An arrow means arrival or departure. A plus or minus means gaining or losing. A heart means bonding. An X means breaking. A skull means death.

The view can toggle between **template mode** (showing roles like "protagonist," "mentor," "shadow") and **instance mode** (showing names like "Luke Skywalker," "Obi-Wan Kenobi," "Darth Vader") when example data is available.

Clicking any column in the swimlane selects the corresponding node in the main graph, keeping the views synchronized.

---

## The emotional dimension

The timeline model connects to the emotional arc data at `data/cross_references/archetype_emotional_arcs.json`. Each archetype node has four emotional scores: tension, hope, fear, and resolution.

The viewer's Arcs panel renders these as an SVG line chart overlaid on the archetype structure. When you select a specific character role from the dropdown, the chart filters to show only the nodes where that character participates — creating a per-character emotional trajectory. The protagonist of the Hero's Journey experiences a W-shaped emotional arc across all eleven nodes. The mentor experiences only the early hope-building nodes before dying. The shadow appears only at high-tension crisis points.

This fusion of timeline participation with emotional scoring gives you a complete picture of what each character experiences — not just where they are, but how the story feels at each point where they appear.
