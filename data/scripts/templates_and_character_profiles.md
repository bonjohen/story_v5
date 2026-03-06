# Templates and Character Profiles

*How the Templates panel works and how character role profiles make characters distinguishable. Estimated listening time: 10 minutes.*

---

## What the Templates panel shows

When you run the generation pipeline — even in contract-only mode — the system compiles a template pack from the corpus and synthesizes detail bindings for your story. The Templates panel in the viewer makes all of this visible. It has three sub-views: Slots, Archetype Templates, and Genre Templates.

**Slots** is the most immediately useful. It shows two things: the named characters your story needs, and the non-character bindings like settings, objects, and thematic elements. Each character appears as an expandable card showing all of its metadata — the archetype function this character serves, personality traits, motivations, a defining flaw, arc direction, backstory prompt, key relationships, and a distinguishing feature. Non-character slots appear as a list of bindings below the character cards.

**Archetype Templates** shows the raw node templates from the selected archetype. Each node in the archetype graph becomes a template entry with its beat summary, entry and exit conditions, signals to include, and failure modes to avoid. This is the structural skeleton that the backbone assembler works from.

**Genre Templates** shows the constraint templates from the selected genre. Each constraint appears with its severity level (hard or soft), the hierarchy level it belongs to (one through five), binding rules, and anti-patterns. This is the rule set that validation checks against.

---

## Why characters need role profiles

In early versions of the generation system, characters were defined by a name, a role label, and little else. A "protagonist" and a "mentor" would have different names but their metadata was thin — not enough to make them feel like distinct people rather than interchangeable story functions.

The character role profile system fixes this. There are nine base profiles — protagonist, mentor, antagonist, ally, love interest, threshold guardian, shapeshifter, trickster, and herald. Each profile is a template that generates genre-aware and tone-aware character metadata. The result is that two characters in the same story always have clearly different descriptions, motivations, flaws, and arcs — distinguishable from their metadata alone, before any prose is written.

---

## The nine role profiles

**Protagonist.** The character who drives the story and undergoes the primary transformation. The protagonist's archetype function is always "drives the central action and undergoes primary transformation." Their traits, flaw, and arc direction adapt to the genre — a Fantasy protagonist might have traits like "determined, curious, reluctantly brave" with a flaw of "self-doubt masked by stubbornness," while a Horror protagonist might have "resourceful, skeptical, emotionally guarded" with a flaw of "denial of danger until it's too late."

**Mentor.** The guide who provides wisdom, tools, or training. The mentor's archetype function is "provides guidance, wisdom, or crucial knowledge." Mentors have traits like "wise, patient, burdened by past" and their flaw is often "withholds critical information too long" or "past failure creates blind spots." Their arc direction is typically "from reserve to sacrifice" — they start guarded and end by giving something up for the protagonist.

**Antagonist.** The force opposing the protagonist. The antagonist's traits and motivations are genre-shaped — a Thriller antagonist is "calculating, patient, methodical" with a motivation of "maintaining control and eliminating threats to their plan," while a Comedy antagonist is "pompous, inflexible, self-important" with a motivation of "preserving status and authority."

**Ally.** A supportive companion. Allies have the distinguishing trait of loyalty and complementary skills. Their flaw is typically "over-reliance on the protagonist" or "personal agenda that occasionally conflicts."

**Love Interest.** The character who represents emotional connection. The love interest's traits and arc adapt strongly to genre — in Romance, they're the co-protagonist with full agency; in Action, they may be "independent, capable, grounding" with an arc from "external to integral."

**Threshold Guardian.** The gatekeeper who tests readiness. Threshold guardians are defined by their challenge function — they block progress until the protagonist proves worthy. Their arc is typically "from obstacle to ally" once the test is passed.

**Shapeshifter.** The character whose loyalties are uncertain. The shapeshifter's distinguishing feature is ambiguity — their true allegiance isn't clear until late in the story. Their traits include "charismatic, elusive, morally flexible."

**Trickster.** The disruptive, comic, or destabilizing force. Tricksters challenge the status quo through humor, deception, or unpredictability. Their flaw is "unreliability at critical moments."

**Herald.** The character who announces change. Heralds deliver the inciting information — a warning, a summons, a revelation. Their arc is brief but pivotal, often "from messenger to catalyst."

---

## How profiles adapt to genre and tone

Each profile generates its metadata using the genre and tone as inputs. The system doesn't just pick from a fixed list of traits — it constructs them contextually.

For example, the protagonist profile for a Horror story produces traits like "resourceful, skeptical, emotionally guarded" and a flaw of "denial of danger." The same protagonist profile for a Romance produces traits like "emotionally guarded, professionally driven, secretly idealistic" and a flaw of "fear of vulnerability." The archetype function stays the same — "drives the central action" — but the texture is completely different.

Tone modifies the profiles further. A somber tone shifts motivations toward duty and cost. A playful tone shifts them toward curiosity and spontaneity. An epic tone emphasizes destiny and magnitude.

The backstory prompt and distinguishing feature are also genre-aware. A Fantasy mentor's backstory prompt might be "a past failure involving forbidden knowledge" while a Crime mentor's would be "a case that went wrong and taught them the cost of shortcuts." These prompts aren't the backstory itself — they're templates that the detail synthesizer fills in during generation.

---

## Using the Templates panel

Open the Templates panel by clicking the Templates tab in the info panel after running generation. The Slots sub-view is the most useful starting point.

Expand a character card to see all nine metadata fields. Compare two characters — the protagonist and the antagonist, say — and notice how their profiles create natural opposition: the protagonist's flaw is the antagonist's strength, and vice versa. The relationships field explicitly names how characters relate to each other.

The distinguishing feature field is designed to make characters immediately recognizable. It's a single, vivid detail — a speech pattern, a physical trait, a behavioral tic — that sets this character apart from every other character in the story.

Switch to the Archetype Templates sub-view to see the structural skeleton. Each beat template shows what the story needs to accomplish at that phase — the beat summary template, the conditions, the signals. This is what the backbone assembler uses to construct the beat sequence.

Switch to Genre Templates to see the constraint rules. Each constraint shows its severity, binding rules, and anti-patterns. Hard constraints at the top of the list are the non-negotiable genre requirements. Anti-patterns at the bottom are the things that break the genre.

All three sub-views update when you change the archetype or genre in the generation sidebar and re-run. This makes the Templates panel a useful exploration tool even if you never generate a full story — you can compare how different genre-archetype combinations produce different character profiles, structural expectations, and constraint sets.
