# Detail Synthesis: Filling the Slots

*How the DetailSynthesizer turns structural placeholders into concrete characters, places, and objects. Estimated listening time: 10 minutes.*

---

## What detail synthesis does

The backbone contains slots — named placeholders like "protagonist," "mentor," "ordinary_world," and "talisman." These are structural roles, not concrete entities. Detail synthesis is the process of binding those roles to specific characters, places, and objects that fit the story's premise, genre, and tone.

The input is a StoryRequest (with the user's premise, genre, and constraints), a StoryBackbone (with all the slots to fill), and optionally an LLM adapter. The output is a StoryDetailBindings artifact and an updated backbone with the bound values filled in.

---

## The entity registry

The core of the detail bindings is the entity registry — a catalog of every named entity in the story, organized by category.

Characters have an ID, a name, a role (matching the slot they fill), traits, motivations, and optionally a backstory. For a Science Fiction Hero's Journey, the protagonist might be "Kira Vasquez, a resourceful and curious engineer driven by intellectual honesty and fear of complacency."

Places have an ID, a name, a type (matching the slot), features, and an atmosphere. The ordinary world might be "Station Helios, an aging orbital platform with flickering lights and the hum of recycled air."

Objects have an ID, a name, a type, a significance, and properties. A talisman might be "The Cipher Key, a data crystal that unlocks the hidden AI's deeper communication protocols."

---

## Slot bindings

Each slot in the backbone gets a binding entry that maps it to an entity. The binding records the slot name, the bound entity ID, the bound value (the entity's name, for display), and optionally a rationale explaining why this entity fits.

Bindings are stored in a flat map keyed by slot name. After synthesis, the backbone's scenes have their slot bound_value fields updated to show the concrete names.

---

## Two modes of operation

The synthesizer works in two modes.

In LLM mode, the detail agent builds a prompt that includes the story premise, genre, archetype, tone, audience, content limits, inclusion and exclusion constraints, the beat summaries, and the full slot list. The prompt asks the LLM to output valid JSON matching the StoryDetailBindings schema — entity registry, slot bindings, and optionally mysteries, promises, and payoffs. The LLM is explicitly told to produce no prose, only structured data.

In deterministic mode — when no LLM is available — the synthesizer creates placeholder entities from the slot metadata. The protagonist slot becomes a character named "Protagonist." The ordinary_world slot becomes a place named "Ordinary World." These are useful for testing and for reviewing structure without committing to creative choices.

---

## Handling missing bindings

Not every slot will always get a binding. The LLM might miss one, or the deterministic mode might not have enough context to fill an optional slot meaningfully.

Required slots that don't receive a binding are tracked as unresolved TODOs. Each TODO records the slot name, the reason it's unresolved, and a suggested resolution. This gives the human operator a clear list of decisions that still need to be made — rather than silently producing a story with structural gaps.

Optional slots that don't receive a binding are simply left empty. Their absence won't break the pipeline.

---

## Long-form coherence features

For stories with many scenes, the synthesizer can generate three additional structures.

Open mysteries are questions planted early in the story that create forward tension. Each records an ID, a description, the beat where it's planted, and the beat where it's resolved. A mystery might be: "What caused the AI to develop consciousness?" planted at beat one, resolved at beat seven.

Narrative promises are commitments made to the reader — things the story's setup implies will happen. Each records when the promise is made. A promise might be: "The protagonist will face a moral choice about the AI's fate."

Payoffs are the delivery of those promises. Each records which promise it delivers on and at which beat. A payoff might be: "Kira chooses to protect the AI, sacrificing her career."

These structures are optional but valuable for tracking whether a story pays off what it sets up.

---

## Binding values back into the backbone

After synthesis, the updated backbone has its slot bound_value fields populated. When the planner and writer agent run, they can see not just "this scene needs a protagonist" but "this scene needs Kira Vasquez." This carries the creative decisions downstream without the writer needing to reinvent them.

The backbone with bound slots is the instantiated backbone — a complete, concrete story structure ready for prose generation.

---

## Practical implications

Detail synthesis is the creative inflection point of the backbone pipeline. Everything before it is deterministic: same corpus, same templates, same backbone. Everything after it is shaped by the specific characters, places, and objects chosen here.

This makes it the ideal place for human review. Before running the planner and writer, you can examine the entity registry and ask: Do these characters fit the premise? Does this world feel right for the genre? Are the names consistent with the tone? Adjust as needed, then proceed.

The separation of structural slots from creative bindings is deliberate. It means you can reuse the same backbone with different detail bindings — same story structure, different cast and setting. Or you can keep the same bindings but restructure the backbone — same characters, different plot ordering.
