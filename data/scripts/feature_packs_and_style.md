# Feature Packs and Style

*How modular voice and pacing packs shape narrative tone without changing story structure. Estimated listening time: 8 minutes.*

---

## What feature packs are

Feature packs are modular instruction bundles stored as JSON files in the data/features/ directory. Each pack controls one aspect of how a story is told — its narrative voice, its sentence rhythm, or its recurring motifs — without changing what happens in the story.

Think of them as style overlays. The backbone defines the story's structure: which beats happen in which order, which genre obligations each scene must satisfy, which characters appear where. Feature packs define how that structure sounds on the page.

---

## The three pack types

Voice packs control narrative perspective, register, and tonal texture. The project ships with four voice packs.

Neutral Voice is the default — third-person past tense, clear and unadorned prose. It works for any genre. Epic Voice is elevated and sweeping, with flowing sentences for landscapes and short declarations for pivotal moments. Noir Voice is first-person, world-weary, with punchy sentences and loaded dialogue. Literary Voice is introspective and metaphor-rich, prioritizing interiority and thematic layering.

Pacing packs control sentence rhythm, paragraph density, and scene tempo. Three ship by default. Fast Pacing keeps sentences short, cuts scenes at tension points, and minimizes description during action. Measured Pacing varies paragraph length naturally and matches speed to emotional content. Contemplative Pacing allows scenes to develop slowly, lingers on sensory details, and builds tension through accumulation.

Motif packs — the third type — control recurring symbols and imagery. None ship by default, but the schema supports them. A motif pack might instruct the writer to weave water imagery throughout a story about grief, or to use clock metaphors in a story about mortality.

---

## What's inside a pack

Every feature pack contains five fields.

An ID and name for identification. A type — voice, pacing, or motif. A description explaining what the pack does.

Prompt fragments are the core. These are instruction strings that get injected into the writer agent's prompt. For Noir Voice, the fragments include: "Write in first-person past tense with a world-weary, sardonic narrator. Use short, punchy sentences during action. Dialogue should be clipped and loaded with subtext."

Lexicon preferences shape word choice. They include preferred terms (a map from generic words to pack-specific alternatives — "gun" becomes "piece" in noir), banned terms (words to avoid — "awesome" doesn't fit noir's register), a register label, and notes for the writer.

Validation heuristics are optional checks that the validator can run on output prose. For Literary Voice: "Flag cliche phrases and dead metaphors. Flag scenes with zero interiority or character reflection."

---

## How packs attach to the backbone

During backbone assembly, feature packs are selected based on genre tone and user preferences. The selected pack IDs go into the backbone's style_directives.feature_pack_ids array.

The style directives also carry a global_voice setting, a global_pacing setting, and a lexicon block with canonical terms, prohibited synonyms, and naming rules. Feature packs feed into these settings.

Individual scenes can override the global style through the style_overrides field. A flashback scene might switch from Measured Pacing to Contemplative. A chase scene might switch to Fast Pacing. The override applies to that scene only — the next scene reverts to the global default.

---

## How packs reach the writer

When the writer agent builds its prompt for a scene, it includes the feature pack's prompt fragments in the system message. The fragments act as persistent instructions that shape every sentence the LLM writes for that scene.

Lexicon preferences go into the prompt as word-choice guidance. If the Noir Voice pack maps "police" to "cops," the writer knows to prefer that substitution.

Validation heuristics go to the validation engine. After the scene is written, the validator checks whether the heuristic conditions are met. If Noir Voice says "Flag dialogue tags beyond 'said' and 'asked'" and the scene uses "exclaimed" three times, the validator flags it.

---

## Composing multiple packs

Packs are composable. You can attach both a voice pack and a pacing pack to the same backbone. The prompt fragments from both packs get included in the writer's prompt. The lexicon preferences merge — if both packs specify preferred terms, the map is combined.

If two packs conflict — one says to use long sentences, the other says to use short ones — the pack listed later in the feature_pack_ids array takes priority for conflicting directives. In practice, voice and pacing packs rarely conflict because they control different aspects of prose.

---

## Creating custom packs

To create a new feature pack, add a JSON file to data/features/ that matches the feature_pack.schema.json schema. Give it a unique ID, choose its type, write prompt fragments that capture the desired style, set lexicon preferences, and optionally add validation heuristics.

No code changes are needed. The pack is picked up by the backbone assembler when its ID appears in the style directives.

This makes the style system extensible without touching the generation engine. Want a "Southern Gothic" voice pack? Write one. Want an "Academic Paper" pacing pack for dry humor? Write one. The architecture supports any voice or rhythm you can describe in natural language instructions.
