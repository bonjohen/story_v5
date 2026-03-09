# Element Constraint Data Analysis

## 1. Inventory: element_constraints.json Coverage

### Before This Work

| # | Genre | Had element_constraints.json? |
|---|-------|-------------------------------|
| 01 | Drama | No |
| 02 | Action | No |
| 03 | Comedy | No |
| 04 | Thriller | **Yes** |
| 05 | Fantasy | **Yes** |
| 06 | Science Fiction | **Yes** |
| 07 | Adventure | **Yes** |
| 08 | Romance | **Yes** |
| 09 | Romantic Comedy | No |
| 10 | Horror | **Yes** |
| 11 | Mystery | No |
| 12 | Crime | No |
| 13 | Detective | **Yes** |
| 14 | Superhero | **Yes** |
| 15 | Historical | No |
| 16 | War | **Yes** |
| 17 | Biography | No |
| 18 | Family | No |
| 19 | Young Adult | No |
| 20 | Literary Fiction | No |
| 21 | Children's Literature | No |
| 22 | Satire | No |
| 23 | Psychological | No |
| 24 | Western | **Yes** |
| 25 | Political | No |
| 26 | Musical | No |
| 27 | Holiday | No |

**Coverage before**: 10 of 27 genres (37%)
**Coverage after**: 27 of 27 genres (100%)

### Files Created

17 new `element_constraints.json` files for genres: 01 Drama, 02 Action, 03 Comedy, 09 Romantic Comedy, 11 Mystery, 12 Crime, 15 Historical, 17 Biography, 18 Family, 19 Young Adult, 20 Literary Fiction, 21 Children's Literature, 22 Satire, 23 Psychological, 25 Political, 26 Musical, 27 Holiday.

---

## 2. Schema Compliance

All files follow the established schema from `app/src/types/element-constraints.ts`:

```typescript
interface GenreElementConstraints {
  genre_id: string
  genre_name: string
  description: string
  character_constraints: CharacterRoleConstraint[]
  relationship_constraints: RelationshipConstraint[]
  place_constraints: PlaceTypeConstraint[]
  object_constraints: ObjectTypeConstraint[]
  element_rules: ElementRule[]
}
```

Severity values: `"required"` | `"recommended"` | `"optional"`

Each file includes:
- 2–5 character constraints (at least 1 required protagonist or equivalent)
- 1–2 relationship constraints (at least 1 required)
- 1–3 place constraints (at least 1 required)
- 1–2 object constraints (at least 1 required)
- 2 element rules with testable conditions and rule IDs following `{PREFIX}_R{NN}` convention

---

## 3. Design Rationale by Genre

### 01 Drama (DRA)
Engine: interpersonal decisions under pressure. Key constraint: intimate_opposition relationship — conflict rooted in relationship, not external threat. Rules enforce protagonist agency and irreversible choices.

### 02 Action (ACT)
Engine: physical capability against formidable opposition. Key constraint: dangerous_environment as third participant. Rules enforce cost to protagonist and climax decided by protagonist's action.

### 03 Comedy (COM)
Engine: incongruity between self-image and reality. Key constraint: social_trap forcing proximity with witnesses. Rules enforce causal escalation and forbid permanent harm to sympathetic characters.

### 09 Romantic Comedy (ROM)
Engine: dual comic + romantic engines in every scene. Key constraint: forced_proximity requiring both leads to share unavoidable setting. Rules enforce simultaneous engines and sustained misalignment.

### 11 Mystery (MYS)
Engine: fair-play investigation. Key constraints: culprit active throughout, minimum 3 suspects, minimum 3 clues before reveal. Rules enforce fair play and mid-story pivot.

### 12 Crime (CRI)
Engine: moral compromise through criminal activity. Key constraint: moral_corruption relationship — a line must be crossed. Rules enforce crime as primary plot driver and mandatory reckoning scene.

### 15 Historical (HIS)
Engine: historical conditions as causal force. Key constraint: protagonist's identity constituted by period social position. Rules enforce period-caused conflict and era-appropriate thinking.

### 17 Biography (BIO)
Engine: public/private tension in a documented life. Key constraint: archival_artifact grounding narrative in documented reality. Rules enforce crucible scene and forbid hagiography.

### 18 Family (FAM)
Engine: generational patterns and family wounds. Key constraint: family_wound — the unspoken thing the family organizes around. Rules enforce family-driven conflict and gathering disruption scene.

### 19 Young Adult (YA)
Engine: identity formation through consequential choices. Key constraint: authority figures as simultaneous shelter and cage. Rules enforce visible identity change and world-defining stakes from protagonist's perspective.

### 20 Literary Fiction (LIT)
Engine: character interiority. Key constraint: central_consciousness whose self-deceptions are the primary subject. Rules enforce interiority as engine and resonant (not vague) ending.

### 21 Children's Literature (CHI)
Engine: child agency within calibrated stakes. Key constraint: preoccupied adult structurally absent from resolution. Rules enforce experience-based takeaway and safe-frame preservation.

### 22 Satire (SAT)
Engine: systemic critique through comedy. Key constraints: true_believer and operator representing different relationships to the system, victim making critique concrete. Rules enforce comedy serving critique and consistent absurd logic.

### 23 Psychological (PSY)
Engine: protagonist's psychology as both danger and resolution. Key constraint: psychological_entrapment — cannot escape by simply leaving. Rules enforce internal resolution and non-resetting escalation.

### 25 Political (POL)
Engine: institutional power through negotiation and coalition. Key constraints: coalition-building and mandatory betrayal/realignment. Rules enforce political (not physical) resolution and three mandatory beat types.

### 26 Musical (MUS)
Engine: musical numbers doing narrative work. Key constraint: every song must change the situation. Rules enforce I Want / showstopper / reprise as mandatory structural beats.

### 27 Holiday (HOL)
Engine: holiday as quadruple function (gathering reason, deadline, wound mirror, healing medium). Key constraint: weighted_holiday_object carrying thematic meaning. Rules enforce broken-tradition and restoration scenes.

---

## 4. Other Data Gaps Across the Corpus

### 4.1 Genre-Level Gaps

| Data Type | Coverage | Notes |
|-----------|----------|-------|
| `graph.json` | 27/27 (100%) | Complete |
| `narrative.md` | 27/27 (100%) | Complete |
| `examples.md` | 27/27 (100%) | Complete |
| `element_constraints.json` | **27/27 (100%)** | Complete after this work |
| `elements.json` | 0/27 (0%) | Cast template for genre stories. Lower priority — element_constraints partially covers this. |

### 4.2 Archetype-Level Gaps

| Data Type | Coverage | Notes |
|-----------|----------|-------|
| `graph.json` | 15/15 (100%) | Complete |
| `narrative.md` | 15/15 (100%) | Complete |
| `examples.md` | 15/15 (100%) | Complete |
| `elements.json` | 15/15 (100%) | Complete |
| `beat_sheet_*.json` | 3/15 (20%) | Hero's Journey → Star Wars, Tragedy → Macbeth, The Escape → Shawshank. 12 archetypes missing. |
| `variants.json` | 2/15 (13%) | Hero's Journey and The Escape only. 13 archetypes missing. |

### 4.3 Script Coverage Gaps

| Area | Coverage | Notes |
|------|----------|-------|
| Overview scripts | Complete | Introduction, foundations, data model, system |
| Per-archetype deep dives | 1/15 | Single overview covers all 15; no individual scripts |
| Per-genre deep dives | 2/27 | Overview + 2 example scripts; no individual scripts |
| Author surface scripts | Complete | Instance, Scene Board, Timeline, Encyclopedia, Manuscript, Notes |
| Data layer scripts | Complete | SQLite, vocabulary, queries |

### 4.4 Cross-Reference Data

| File | Status |
|------|--------|
| `genre_archetype_matrix.json` | Complete |
| `cross_archetype_index.json` | Complete |
| `cross_genre_constraint_index.json` | Complete |
| `archetype_emotional_arcs.json` | Complete |
| `tone_archetype_integration.json` | Complete |
| `example_works_registry.json` | Complete |
| `non_western_archetype_analysis.json` | Complete |
| `cross_medium_adaptation.json` | Complete |
| `corpus_validation.json` | Complete |

---

## 5. Priority Ordering for Remaining Gaps

1. **Beat sheet mappings** (12 archetypes) — High value for generation pipeline. Each beat sheet maps an archetype's abstract graph nodes to concrete story beats using a well-known example work. Would improve the generation pipeline's ability to produce structurally sound stories.

2. **Variant graphs** (13 archetypes) — Medium value. Variants provide alternative paths through the archetype graph (e.g., reluctant hero vs. eager hero). Useful for story variety but not blocking any current functionality.

3. **Per-genre walkthrough scripts** (25 genres) — Medium value. Deep-dive scripts for individual genres would enhance the Scripts page and educational value. Large volume of work (25 scripts × ~1000 words each).

4. **Per-archetype walkthrough scripts** (14 archetypes) — Medium value. Similar to genre scripts but for individual archetypes. Would complement the existing overview.

5. **Genre `elements.json`** (27 genres) — Low priority. Element constraints already cover much of this territory. Would only add value if the pipeline needs cast templates separate from constraints.

---

## 6. Loading Mechanism

The corpus loader (`app/src/generation/engine/corpusLoader.ts`) automatically discovers and loads `element_constraints.json` files:

```typescript
async function loadGenreElementConstraints(provider: DataProvider) {
  // Iterates all GENRE_DIRS, checks if element_constraints.json exists,
  // loads and parses each one into a Map<string, GenreElementConstraints>
}
```

The `ElementsPanel` (`app/src/panels/ElementsPanel.tsx`, line 240) displays "No element constraints for this genre." when the map has no entry for the selected genre. With all 27 files present, this fallback message should never appear.

No code changes are needed — the data files are sufficient.
