# Story Elements and Templates

*An audio-friendly guide to the character, place, and object system. Estimated listening time: 12 minutes.*

---

## What story elements are

The archetype graphs model *structure* — the sequence of phases a story passes through. The genre graphs model *constraints* — the rules a story must follow. But neither one captures the *substance* — the concrete things that populate a story. Characters who act. Places where action unfolds. Objects that carry significance. That's what the story elements system provides.

Every archetype in this project now has an `elements.json` file that defines the element roles a story of that type typically involves. These aren't names — they're structural roles. The Hero's Journey needs a protagonist, a mentor, a shadow. Tragedy needs a protagonist, a confidant, a nemesis. The Quest needs a protagonist, allies, and a quest objective. The elements system makes these requirements explicit, testable, and traceable.

---

## The three element categories

### Characters

Characters are the agents of the story — people, beings, or personified forces with the ability to act and choose. Each character in the system has a **role** drawn from a controlled vocabulary of thirteen terms.

**Protagonist** — the central figure whose arc drives the story. Every archetype requires at least one. **Antagonist** — the primary opposing force, whether a person, system, or idea. **Mentor** — a guide who provides wisdom, tools, or training. **Ally** — a companion who supports the protagonist. **Herald** — the figure who announces or triggers the call to action. **Threshold guardian** — an obstacle at the boundary between worlds. **Shadow** — a dark mirror reflecting the protagonist's fears or flaws. **Trickster** — a disruptive or comedic figure who challenges order. **Shapeshifter** — a figure whose allegiance or identity is uncertain. **Love interest** — the focus of a romantic subplot. **Foil** — a character who highlights the protagonist through contrast. **Confidant** — a trusted figure in whom the protagonist confides. **Comic relief** — a figure whose primary function is levity.

These thirteen roles come from `data/vocabulary/element_roles.json`. Every character in every archetype template and every example instance uses one of these terms. This is what makes it possible to ask questions like "which archetypes use a mentor?" or "how does the shadow role function differently in Tragedy versus the Hero's Journey?"

### Places

Places are the settings where story action unfolds — locations, spaces, and environments with their own character. Each place has a **type** drawn from a vocabulary of ten terms.

**Ordinary world** — the starting environment representing the character's baseline reality. **Threshold** — the boundary between known and unknown. **Special world** — the unfamiliar domain where transformation occurs. **Sanctuary** — a place of safety and recovery. **Stronghold** — a fortified position of power. **Wasteland** — a desolate or depleted environment. **Crossroads** — a place of decision where paths diverge. **Underworld** — a place of death, descent, or hidden truth. **Summit** — a place of peak achievement or confrontation. **Home** — a place of return and belonging.

These come from `data/vocabulary/place_types.json`. The types are deliberately archetypal — they describe the *narrative function* of a place, not its physical characteristics. Tatooine in Star Wars is an "ordinary world." The Death Star is a "special world" and a "stronghold." A single physical location can serve different types at different points in the story.

### Objects

Objects are items, artifacts, or significant physical things that carry narrative weight. Each object has a **type** from a vocabulary of ten terms.

**Weapon** — an instrument of force or destruction. **Talisman** — a protective or empowering item. **Document** — a carrier of information or authority. **Treasure** — something of great value that motivates pursuit. **McGuffin** — an object whose significance is primarily that characters want it. **Symbol** — an object whose meaning transcends its physical nature. **Tool** — a practical instrument that enables specific actions. **Key** — an object that unlocks passage or reveals access. **Vessel** — a container that holds something significant. **Relic** — an object from the past with enduring power or meaning.

These come from `data/vocabulary/object_types.json`. Like places, these describe function rather than form. Anakin's lightsaber is a "talisman" — a gift from the mentor that symbolizes heritage. The One Ring is both a "relic" and a "McGuffin."

---

## Template versus instance

Story elements operate at two levels, and understanding this distinction is essential.

### Template level — what roles does this pattern call for?

The template level is tied to archetype definitions. It describes the *types* of elements a narrative pattern typically involves, without naming specifics.

For example, the Hero's Journey template says: "This pattern needs a protagonist who appears at all eleven nodes. It needs a mentor who appears at the Mentor and Ordeal nodes. It needs a shadow who appears at Trials, Approach, Ordeal, and Resurrection." These are structural requirements — slots that any Hero's Journey story must fill.

Template data lives in `data/archetypes/{name}/elements.json`. Every archetype has one. Each template lists character roles, place types, and object types with:

- **role** or **type** — from the controlled vocabulary
- **label** — a human-readable name for this slot (e.g., "The Mentor")
- **definition** — what this element does in this archetype
- **appears_at_nodes** — which archetype phases this element participates in
- **required** — whether this element must be present or is optional

### Instance level — who specifically fills these roles?

The instance level maps specific named characters, places, and objects to template roles. Luke Skywalker fills the protagonist role in Star Wars. Obi-Wan fills the mentor role. Tatooine fills the ordinary world role.

Instance data lives in `data/archetypes/{name}/examples_elements.json`. Not every archetype has one — currently five archetypes have example instances: the Hero's Journey with Star Wars, the Quest with Lord of the Rings, Tragedy with Macbeth, Rebirth with A Christmas Carol, and Comedy with The Big Lebowski.

Each instance includes richer data than the template — character traits, motivations, arc types, relationships between characters, place descriptions and atmospheres, object significance and rules. This is the concrete realization of the abstract template.

---

## How templates are structured

Let's walk through a concrete example. Open `data/archetypes/01_heros_journey/elements.json`. The file has three sections under `element_templates`.

The **characters** section lists seven roles. The protagonist is required and appears at all eleven archetype nodes. The mentor is required and appears at the Mentor node and the Ordeal. The shadow is required and appears at Trials, Approach, Ordeal, and Resurrection. The ally is optional and appears at Trials onward. The herald is optional and appears at the Call to Adventure. The threshold guardian is optional and appears at the Threshold. The shapeshifter is optional and appears at Trials and Approach.

The **places** section lists four types. The ordinary world is required and appears at the Ordinary World and Return nodes. The special world is required and appears from Threshold through Reward. The threshold is optional, appearing at the Threshold node. The underworld is optional, appearing at the Ordeal.

The **objects** section lists three types. A talisman is optional, appearing at the Mentor node and the Ordeal. A weapon is optional, appearing at Trials and the Ordeal. A treasure or McGuffin is optional, appearing at the Reward.

Each entry has an `appears_at_nodes` array that directly references node IDs from the archetype's `graph.json`. This creates a precise mapping between structural phases and element participation. You can ask: "At the Ordeal node of the Hero's Journey, who's expected to be there?" The answer: the protagonist, the shadow, possibly the mentor, in the special world or underworld, possibly with a talisman or weapon.

---

## Template timelines

Each `elements.json` also contains a `template_timeline` — a sequence of moments that describes the expected flow of element participation and state changes across the archetype.

Each moment in the template timeline specifies:

- **archetype_node** — which phase this moment occurs at
- **expected_participants** — which character roles, place types, and objects should be present
- **expected_transitions** — what changes should happen here

The transitions use a controlled vocabulary of eleven change types from `data/vocabulary/element_change_types.json`: learns, gains, loses, transforms, arrives, departs, bonds, breaks, dies, reveals, and decides. At the Mentor node, the protagonist "gains" a talisman, "bonds" with the mentor, and "learns" something crucial. At the Ordeal, the protagonist "transforms" through confronting the shadow.

The template timeline is what the generation pipeline uses to plan element participation scene by scene, and what the viewer's timeline panel visualizes as a swimlane chart.

---

## The cross-reference

The file `data/cross_references/element_role_index.json` is the cross-archetype analysis of element usage. It answers questions like:

- Which character roles appear in all fifteen archetypes? Protagonist and antagonist are nearly universal.
- Which roles are specific to certain archetypes? Herald appears mainly in the Hero's Journey and Overcoming the Monster. Comic relief appears mainly in Comedy.
- Which place types are most common? Ordinary world and special world appear in most archetypes. Underworld appears in only a few.

This index follows the same pattern as `cross_archetype_index.json` — it's the element-level equivalent of the node role cross-reference.

---

## The relationship vocabulary

Characters don't exist in isolation — they relate to each other. The system defines ten relationship types in `data/vocabulary/relationship_types.json`:

**Ally** — cooperative partnership. **Rival** — competitive opposition. **Mentor-student** — teaching and learning. **Parent-child** — familial bond. **Romantic** — love or attraction. **Nemesis** — fundamental opposition. **Servant-master** — hierarchical service. **Sibling** — fraternal bond. **Betrayer** — broken trust. **Guardian** — protective custody.

Relationships appear in instance-level data — you'll see that Luke and Obi-Wan have a "mentor-student" relationship, Luke and Vader have a "nemesis" relationship, and Luke and Leia have an "ally" relationship. The generation pipeline uses relationship types to ensure character interactions are consistent — characters with a nemesis relationship should be in opposition, not casual collaboration.

---

## Why this matters for generation

Before the story elements system, the generation pipeline had empty placeholders where characters, settings, and objects should be. The planner would create scenes with `characters: []` and `setting: ""`. The writer agent would invent characters on the fly with no structural guidance. There was no way to verify that a mentor appeared when the archetype called for one, or that the protagonist was actually present at the crisis.

Now the pipeline has concrete element data at every stage. The contract compiler extracts element requirements from the archetype template. The planner builds an element roster — assigning named characters to roles, named places to types. The writer agent receives element context for each scene — who's there, what they want, what they know at this point. And the validation engine checks element continuity — dead characters don't reappear, objects have traceable custody, characters aren't in two places at once.

The story elements system turns structural analysis into a working creative framework.
