# Genre Element Constraints

*An audio-friendly guide to how genres shape story elements. Estimated listening time: 10 minutes.*

---

## What genre element constraints are

Archetype templates define which elements a *story pattern* calls for — the Hero's Journey needs a protagonist, mentor, and shadow. But genres add a second layer of requirements. Romance needs at least two characters with a romantic relationship. Horror needs an isolated setting. Detective fiction needs a puzzle object and a revelation structure.

Genre element constraints capture these requirements. They're stored in `element_constraints.json` files in the genre folders, and they define what characters, relationships, places, objects, and structural rules a genre demands or recommends.

Not every genre has these constraints. Some genres — Drama, Action, Comedy, Literary Fiction — are defined more by tone and structure than by specific element requirements. Twenty-seven genres exist in the project, but only ten have `element_constraints.json` files. The rest are explicitly marked as tone-driven or structure-driven, and their existing graph constraints are sufficient.

---

## Which genres have element constraints

The ten genres with element constraint files are:

**Romance** — requires at least two protagonist-level characters with a romantic relationship. The dual-protagonist pattern is what distinguishes Romance from other genres. Settings must include a meeting place and an intimate space.

**Horror** — requires a threat entity (antagonist role), at least one potential victim, and an isolation setting. The threat must be present and escalating. A weapon or talisman may function as protection. Objects in Horror often serve as symbols of dread.

**Thriller** — requires a clear antagonist and an information asymmetry between protagonist and audience or protagonist and antagonist. A McGuffin or document drives the plot. Settings include a stronghold for the antagonist and a crossroads where the protagonist faces impossible choices.

**Fantasy** — requires a magical system manifested through specific objects (talisman, relic, or vessel) and a special world with rules that differ from ordinary reality. Mentor figures are common. The magic system must have costs and limits.

**Science Fiction** — requires technology objects (tools or vessels) and a world governed by internally consistent speculative rules. The speculative element can't be decorative — it must be central to the conflict. Settings include a special world shaped by the speculative premise.

**Detective** — requires a detective-role protagonist, a puzzle object (McGuffin or document), and a revelation structure where hidden information is progressively exposed. Settings include a crime scene and an investigation space.

**Adventure** — requires a protagonist with resourcefulness traits, a quest objective (treasure, McGuffin, or key), and traversal across multiple distinct environments. The special world must involve escalating physical challenges.

**Western** — requires frontier settings where institutional law is absent or insufficient. Character roles include a lawman-type protagonist and an outlaw-type antagonist with a nemesis relationship. Weapons are mandatory. The climax must involve direct physical confrontation.

**Superhero** — requires a superpowered protagonist with a dual identity, a nemesis with comparable power, and settings that include both a sanctuary (secret base) and a stronghold (villain's domain). Power limitations are mandatory — unlimited power eliminates narrative tension.

**War** — requires at least two factions, battlefield settings, weapon objects, and ally characters who represent the human cost of conflict. At least one ally must die or be seriously harmed. The story must present a moral dilemma — duty versus conscience.

---

## The anatomy of a constraint file

Each `element_constraints.json` has five sections. Let's walk through Horror's file as an example.

### Character constraints

```
role: antagonist, severity: required
  description: "Primary threat entity — monster, killer, supernatural force"

role: protagonist, severity: required
  description: "Central character who confronts or endures the threat"

role: ally, severity: recommended
  description: "Potential victim who may die to demonstrate the threat's danger"
```

Each character constraint specifies a role from the controlled vocabulary and a severity level. **Required** means the genre is incomplete without it — you can't have Horror without something threatening. **Recommended** means strongly expected but not strictly mandatory. **Optional** means it enhances the genre but is absent in many valid works.

### Relationship constraints

```
type: nemesis, severity: required
  description: "Protagonist must be in direct opposition to the threat entity"
```

Relationship constraints ensure that characters interact in genre-appropriate ways. Horror requires a nemesis dynamic between protagonist and antagonist. Romance requires a romantic relationship. Detective fiction requires a mentor-student or guardian dynamic between detective and informant.

### Place constraints

```
type: ordinary_world, severity: required
  description: "Initial safe environment that will be disrupted"

type: stronghold, severity: recommended
  description: "The threat entity's domain or lair"

type: sanctuary, severity: optional
  description: "Temporary refuge that may prove unsafe"
```

Place constraints shape the story's geography. Horror consistently requires isolation — the ordinary world must become unsafe, and escape must be difficult. Fantasy requires a special world with its own rules. Adventure requires multiple distinct environments for traversal.

### Object constraints

```
type: symbol, severity: recommended
  description: "Object embodying or connected to the source of horror"

type: talisman, severity: optional
  description: "Protective item that may provide temporary safety"
```

Object constraints specify what kinds of objects the genre expects. Detective fiction requires a puzzle object — the thing the detective is trying to understand. Fantasy requires magical objects with costs and limits. Western requires weapons.

### Element rules

Element rules are genre-specific structural requirements that go beyond individual element types. Each rule has an ID, description, severity, and a testable condition.

```
rule: HR_R01 — severity: required
  "The threat must be present or implied in more than half of all scenes"

rule: HR_R02 — severity: required
  "At least one ally or secondary character must die or be permanently harmed"

rule: HR_R03 — severity: recommended
  "Isolation must increase over the course of the story"
```

Rules are what make genre constraints *testable*. The validation pipeline can check whether a generated Horror story actually has the threat present in more than half its scenes, or whether an ally dies. These aren't vague aesthetic guidelines — they're concrete, verifiable conditions.

---

## Severity levels

The three severity levels control how the generation pipeline treats each constraint.

**Required** constraints are blocking failures. If a Horror story has no antagonist — no threat entity at all — the validation engine produces a hard failure. The pipeline will attempt to repair the story to introduce one.

**Recommended** constraints generate warnings. If a Horror story has no ally who dies, it's noted in the compliance report but doesn't block the story. Many valid Horror stories skip this pattern — think Alien where no disposable sidekick exists.

**Optional** constraints are purely informational. They describe genre-typical patterns that enhance the story when present but whose absence isn't noteworthy.

The generation pipeline loads these constraints at the contract compilation stage. Required character roles and relationship types become part of the story contract alongside the archetype's structural requirements. The planner uses them when building the element roster — ensuring that required elements are present. The validation engine checks them during scene validation alongside the existing hard constraint, anti-pattern, and tone checks.

---

## How constraints interact with archetype templates

Genre constraints and archetype templates are independent systems that combine at generation time. The Hero's Journey says "you need a protagonist and a mentor." Horror says "you need a protagonist and an antagonist with a nemesis relationship." When generating a Horror story using the Hero's Journey archetype, the contract compiler merges both sets of requirements:

- Protagonist (required by both)
- Mentor (required by archetype)
- Antagonist / threat entity (required by genre)
- Shadow (required by archetype — may overlap with antagonist)
- Nemesis relationship between protagonist and antagonist (required by genre)

The planner resolves overlaps — the archetype's "shadow" role and the genre's "antagonist" role often map to the same character. The mentor might double as an ally who serves as the genre's "potential victim." This merging is what produces element rosters that satisfy both structural and genre requirements simultaneously.

---

## The skipped genres

Seventeen genres do *not* have element constraint files:

Drama, Action, Comedy, Romantic Comedy, Mystery, Crime, Historical, Biography, Family, Young Adult, Literary Fiction, Children's Literature, Satire, Psychological, Political, Musical, and Holiday.

These genres constrain *tone* and *structure* more than *element composition*. Comedy doesn't require specific character types — it requires comedic timing and resolution. Drama doesn't prescribe particular element patterns — it requires emotional depth. Literary Fiction constrains prose quality, not who populates the story.

Their existing genre graph constraints — the five-level hierarchy with Core Constraints, Setting Rules, Scene Obligations, Tone Markers, and Anti-Patterns — are sufficient for generation and validation. Element constraints would be redundant or artificially prescriptive.

---

## Viewing constraints in the app

When you open a genre graph in the interactive viewer and switch to the Elements tab, the panel shows the genre's element constraints if they exist. Character constraints appear with color-coded severity badges — red for required, amber for recommended, gray for optional. Relationship requirements, place constraints, and object constraints each have their own sections. Element rules appear at the bottom with their rule IDs and testable conditions.

For genres without constraint files, the panel shows a message indicating that the genre relies on structural and tonal constraints rather than element composition rules.

This gives you a complete picture of what a genre demands — both the abstract graph constraints from the genre hierarchy and the concrete element requirements from the constraint file — all in one place.
