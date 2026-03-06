# Feature Packs

Modular style, voice, and pacing instruction packs that alter narrative voice and surface-level realizations while preserving the story backbone structure.

## What Feature Packs Do

Feature packs are composable instruction bundles that control **how** a story is told without changing **what** happens. They attach to the backbone globally and optionally per-beat.

Each pack contains:
- **Prompt fragments** — instructions injected into writer agent prompts
- **Lexicon preferences** — preferred terms, banned terms, register guidance
- **Validation heuristics** — optional checks the validator can run on output prose

## Pack Types

### Voice Packs
Control narrative perspective, register, and tonal texture.
- `voice_neutral.json` — balanced third-person, clear prose
- `voice_noir.json` — first-person noir, hard-boiled diction
- `voice_epic.json` — sweeping third-person, elevated register
- `voice_literary.json` — literary fiction, introspective, metaphor-rich

### Pacing Packs
Control sentence rhythm, paragraph density, and scene tempo.
- `pacing_fast.json` — short sentences, rapid scene cuts, action-forward
- `pacing_measured.json` — balanced rhythm, natural variation
- `pacing_contemplative.json` — longer passages, reflective, slow build

## How Packs Are Selected

During backbone assembly, feature packs are selected based on:
1. Genre tone nodes (from the tone_archetype_integration cross-reference)
2. User preferences in the `StoryRequest` (tone_preference field)
3. Explicit selection via style directives

Packs attach globally via `style_directives.feature_pack_ids` in the backbone, and can be overridden per-scene via `style_overrides`.

## Schema

See `app/src/generation/artifacts/schema/feature_pack.schema.json` for the formal schema. Each pack validates against this schema.
