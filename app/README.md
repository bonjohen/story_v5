# Story Structure Explorer

An interactive graph visualization tool for exploring narrative structures. The application models storytelling from two complementary dimensions — **archetype graphs** that track how stories progress through time, and **genre depth graphs** that model how genre constraints progressively narrow creative choices — then cross-references them against each other, real-world works, and cultural traditions.

Built with React 19, TypeScript, Vite, Cytoscape.js, and Zustand.

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Data Model

The project is built around a corpus of **42 directed graphs** (15 archetypes + 27 genres), supported by 12 cross-referencing datasets, controlled vocabularies, and a registry of 107 example works.

### Core Graph Types

#### Archetype Graphs (15)

Each archetype models a **temporal story structure** — a sequence of phases a story passes through from beginning to end. Nodes are story phases; edges are causal transitions between them.

| Archetype | Nodes | Description |
|-----------|-------|-------------|
| The Hero's Journey | 11 | Departure, initiation, and return |
| Rags to Riches | 8 | Ascent from lowly origins to success |
| The Quest | 9 | Journey toward a specific goal |
| Voyage and Return | 7 | Travel to an unfamiliar world and back |
| Overcoming the Monster | 9 | Confrontation with an antagonistic force |
| Rebirth | 8 | Transformation through redemption |
| Tragedy | 9 | Descent from prosperity to downfall |
| Comedy | 10 | Escalating confusion resolved by restoration |
| Coming of Age | 9 | Maturation through formative experience |
| The Revenge | 10 | Pursuit of retribution |
| The Escape | 9 | Flight from confinement or oppression |
| The Sacrifice | 8 | Willing surrender for a greater cause |
| The Mystery Unveiled | 11 | Progressive revelation of hidden truth |
| The Transformation | 9 | Fundamental change of identity or nature |
| The Rise and Fall | 11 | Ascent followed by collapse |

Archetype nodes carry a `role` from a controlled vocabulary of 14 roles (Origin, Disruption, Catalyst, Threshold, Trial, Revelation, Descent, Crisis, Transformation, Commitment, Resolution, etc.). Some archetypes also have **variant branches** — optional/alternative paths that branch from and rejoin the main spine — stored in separate `variants.json` files. Variant nodes occupy the 50-79 ID range.

#### Genre Depth Graphs (27)

Each genre models a **constraint hierarchy** — a tree of rules that progressively narrow the creative space. Nodes are constraints at increasing levels of specificity; edges represent refinement steps.

Every genre graph follows a consistent 5-level architecture:

```
Level 1: Genre Promise         (1 node — the fundamental contract with the audience)
Level 2: Core Constraints      (3-6 nodes — minimum viable genre requirements)
Level 3: Subgenre Patterns     (3-6 nodes — recognized subtypes)
Level 4: Setting Rules         (2-4 nodes — world-building/mechanical constraints)
Level 5: Scene Obligations     (2-4 nodes — concrete scene/beat requirements)
   + Tone Marker               (1 node — non-negotiable tonal register)
   + Anti-Patterns             (1-2 nodes — pitfalls that break the genre contract)
```

Genre nodes carry a `severity` field (`"hard"` or `"soft"`) indicating whether the constraint is non-negotiable or flexible.

The 27 genres: Drama, Action, Comedy, Thriller, Fantasy, Science Fiction, Adventure, Romance, Romantic Comedy, Horror, Mystery, Crime, Detective, Superhero, Historical, War, Biography, Family, Young Adult, Literary Fiction, Children's Literature, Satire, Psychological, Western, Political, Musical, Holiday.

### Node and Edge Schema

Every graph node (archetype or genre) follows the same schema:

```
node_id             Unique ID (e.g., HJ_N01_ORDINARY_WORLD)
label               Human-readable name
role                Controlled vocabulary role
definition          What this phase/constraint means
entry_conditions    What must be true before entering this node
exit_conditions     What must be true before leaving this node
typical_variants    Common variations of this node
failure_modes       What goes wrong when this node is mishandled
signals_in_text     How to identify this node in an actual story
```

Genre nodes additionally carry `level` (1-5, 80 for tone, 90 for anti-pattern) and `severity` (`"hard"` | `"soft"`).

Every edge follows:

```
edge_id             Unique ID (e.g., HJ_E01_DISRUPTS_ORDER)
from / to           Source and target node IDs
label               Human-readable transition name
meaning             Controlled vocabulary meaning (e.g., "disrupts order")
preconditions       What must hold for this transition to occur
effects_on_stakes   How this transition changes the story's stakes
effects_on_character How this affects character development
common_alternatives Other transitions that could replace this one
anti_patterns       Misuses of this transition
```

Genre edges additionally carry `severity` inherited from their target node.

### ID Convention

All IDs follow `{PREFIX}_{TYPE}{##}_{SHORT_NAME}`:

- **Prefix**: 2-letter code per archetype/genre (HJ = Hero's Journey, DR = Drama, HR = Horror, etc.)
- **Type**: `N` for nodes, `E` for edges
- **Number**: 01-09 for spine nodes, 10-49 for role-grouped nodes, 50-79 for variants, 80+ for tone/anti-pattern
- **Short name**: Descriptive label in UPPER_SNAKE_CASE

### Cross-Reference Data

The graphs are connected by several cross-referencing datasets:

| File | Description |
|------|-------------|
| `genre_archetype_matrix.json` | 27 x 15 compatibility matrix. Each genre-archetype pairing is classified as *naturally compatible*, *occasionally compatible*, or *rarely compatible* with rationale. |
| `cross_archetype_index.json` | Maps which node roles and edge meanings are shared across the 15 archetypes. Shows that "Origin" and "Resolution" are universal (all 15) while "Descent" appears in only 4. |
| `cross_genre_constraint_index.json` | Maps recurring constraint types across all 27 genres. Identifies 16 shared patterns like "Stakes Escalation" (8 genres) and "Internal Consistency" (7 genres). |
| `example_works_registry.json` | Registry of 107 real works (novels, films, plays, games) referenced across archetype and genre examples. Each work lists which graphs reference it and in what role. |
| `archetype_emotional_arcs.json` | Quantitative emotional trajectory for each archetype: tension, hope, fear, and resolution scored 0-1 at each node along the spine. Classified by arc shape (U-curve, inverted-U, W-curve, etc.). |
| `hybrid_archetype_patterns.json` | 12 common hybrid patterns where two archetypes co-occur in a single work. Documents shared roles, divergence points, composition methods, and structural tensions. |
| `tone_archetype_integration.json` | 405 pairings (27 tone markers x 15 archetypes) classified as reinforcing, contrasting, or neutral. Models how genre tone interacts with archetype emotional trajectory. |
| `genre_blending_model.json` | 18 genre blend patterns documenting constraint dominance, compatible/conflicting rules, tone synthesis, and stability (stable, conditionally-stable, unstable). |
| `non_western_archetype_analysis.json` | 10 non-Western narrative archetypes from East Asian, South Asian, African, Indigenous American, and Middle Eastern traditions. Maps cognates and divergences from the Western 15. |
| `cross_medium_adaptation.json` | Analysis of 6 works adapted between mediums (novel to film, film to game, etc.). Documents which nodes compress, expand, or change role in each medium transition. |
| `corpus_validation.json` | Quantitative validation of graph coverage against a 50-work corpus. Mean archetype coverage: 87%, mean genre coverage: 82%. |

### Controlled Vocabularies

All graphs use controlled vocabularies to ensure consistency:

- **Archetype node roles** (14): Origin, Disruption, Catalyst, Threshold, Trial, Revelation, Descent, Crisis, Transformation, Commitment, Resolution, Ascent, Reckoning, Reintegration
- **Archetype edge meanings** (15): disrupts order, forces commitment, reveals truth, narrows options, raises cost, tests resolve, enables transformation, etc.
- **Genre node roles** (7): Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, Anti-Pattern
- **Genre edge meanings** (12): specifies constraint, branches into subtype, mandates element, prohibits element, introduces setting rule, sets tone, etc.

### Supporting Files

Each archetype and genre also has:
- `narrative.md` — Prose walkthrough of the graph: how each node functions, failure modes, and variant paths
- `examples.md` — Mapping of 2-4 real works against the graph, showing which nodes and edges correspond to story events

Three archetypes have **beat sheets** — scene-level mappings with timestamps:
- `beat_sheet_star_wars_iv.json` (Hero's Journey)
- `beat_sheet_macbeth.json` (Tragedy)
- `beat_sheet_shawshank_redemption.json` (The Escape)

### Relationship Diagram

```
                    ┌──────────────────────┐
                    │   Controlled         │
                    │   Vocabularies       │
                    │   (roles, meanings)  │
                    └──────┬───────────────┘
                           │ constrain
         ┌─────────────────┼─────────────────┐
         v                 v                 v
  ┌─────────────┐   ┌─────────────┐   ┌───────────┐
  │ 15 Archetype│   │ 27 Genre    │   │ Manifest  │
  │ Graphs      │   │ Graphs      │   │ (index)   │
  │  + variants │   │  + severity │   └───────────┘
  │  + beats    │   │  + levels   │
  └──────┬──────┘   └──────┬──────┘
         │                 │
         │    ┌────────────┼────────────────────┐
         │    │            │                    │
         v    v            v                    v
  ┌──────────────┐  ┌────────────────┐   ┌───────────────┐
  │ Genre x      │  │ Cross-Archetype│   │ Cross-Genre   │
  │ Archetype    │  │ Index          │   │ Constraint    │
  │ Matrix       │  │ (shared roles) │   │ Index         │
  │ (27 x 15)   │  └────────────────┘   └───────────────┘
  └──────────────┘
         │
    ┌────┴────────────────┬──────────────────┐
    v                     v                  v
┌──────────┐   ┌──────────────────┐   ┌───────────┐
│ Hybrid   │   │ Tone x Archetype │   │ Genre     │
│ Archetype│   │ Integration      │   │ Blending  │
│ Patterns │   │ (27 x 15)        │   │ Model     │
│ (12)     │   └──────────────────┘   │ (18)      │
└──────────┘                          └───────────┘
    │                                       │
    ├───────────────────────────────────────┘
    v
┌─────────────────┐   ┌──────────────────┐   ┌──────────────┐
│ Example Works   │   │ Corpus           │   │ Non-Western  │
│ Registry        │   │ Validation       │   │ Archetype    │
│ (107 works)     │   │ (50 works)       │   │ Analysis (10)│
└─────────────────┘   └──────────────────┘   └──────────────┘
                             │
                             v
                      ┌──────────────┐
                      │ Cross-Medium │
                      │ Adaptation   │
                      │ (6 works)    │
                      └──────────────┘
```

## Interactive Viewer

The web application renders the graphs using Cytoscape.js and provides:

- **Graph canvas** — Zoomable, pannable directed graph with role-based node coloring and edge styling
- **Sidebar** — Browse and select from all 42 graphs; toggle variant branches and failure mode overlays
- **Detail panel** — Full metadata for selected nodes/edges with entry/exit conditions, failure modes, and trace controls
- **Trace navigation** — BFS forward/backward from any node to highlight reachable paths
- **Simulation mode** — Step through a graph node by node, choosing transitions at each step
- **Example overlay** — Highlight which nodes map to scenes in real works (e.g., Star Wars mapped onto Hero's Journey)
- **Analytics** — Graph statistics, degree distributions, path lengths, and cross-index lookups
- **Export** — PNG, SVG, DOT (Graphviz), Mermaid, and GraphML output formats

## Repository Structure

```
docs/                            Planning, specs, and task tracking
data/                            All graph data and cross-references (see Data Model above)
  vocabulary/                    Controlled vocabularies and ID conventions
  archetypes/{nn_name}/          15 archetype folders (graph.json, narrative.md, examples.md)
  genres/{nn_name}/              27 genre folders (graph.json, narrative.md, examples.md)
app/                             Interactive viewer (React + TypeScript + Vite)
  src/
    components/                  UI components (GraphSearch, SettingsPanel, VariantToggle)
    panels/                      Side panels (DetailPanel, SimulationPanel, ExportPanel, etc.)
    render/                      Cytoscape canvas, styles, element builders
    graph-engine/                Normalizer, validator, data index, example parser
    store/                       Zustand stores (graphStore, simulationStore, settingsStore)
    hooks/                       Custom React hooks (keyboard nav, trace navigation)
    layout/                      Graph layout algorithms
    types/                       TypeScript interfaces
  scripts/                       Data processing scripts (metadata injection, severity, etc.)
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint with type-aware rules
npm run format       # Prettier formatting
npm run test         # Run Vitest test suite (161 tests)
```

## Story Generation System

An agentic pipeline that consumes the corpus data to generate constraint-correct stories. Built with the same TypeScript codebase as the viewer — no code duplication.

### Architecture

```
StoryRequest → Selection → Contract → Plan → Write → Validate → Repair → Trace
                 Engine     Compiler   (LLM)  (LLM)   Engine     (LLM)   Engine
```

### CLI Usage

```bash
# Contract-only mode (no LLM required)
npx tsx app/scripts/generate_story.ts --request outputs/samples/simple_request.json --mode contract-only --no-llm

# Outline mode (LLM enhances summaries)
npx tsx app/scripts/generate_story.ts --request outputs/samples/simple_request.json --mode outline

# Full draft mode
npx tsx app/scripts/generate_story.ts --request outputs/samples/simple_request.json --mode draft

# Options:
#   --request <file>     Path to story_request.json (required)
#   --out <dir>          Output directory (default: outputs/runs/{run_id}/)
#   --mode <mode>        draft | outline | contract-only (default: draft)
#   --model <model>      LLM model (default: claude-sonnet-4-20250514)
#   --max-repairs <n>    Max repair attempts per scene (default: 2)
#   --no-llm             Run without LLM (deterministic only)
```

### Pipeline Modules

| Module | File | Purpose |
|--------|------|---------|
| Corpus Loader | `engine/corpusLoader.ts` | Loads all 42 graphs + cross-references |
| Selection Engine | `engine/selectionEngine.ts` | Scores genre-archetype combinations |
| Contract Compiler | `engine/contractCompiler.ts` | Builds enforceable story contract |
| Planner | `engine/planner.ts` | Beat scaffolding + scene assignment |
| Writer Agent | `agents/writerAgent.ts` | LLM-backed scene prose generation |
| Validator | `validators/validationEngine.ts` | Heuristic + LLM constraint checking |
| Repair Engine | `engine/repairEngine.ts` | Targeted edit or full rewrite |
| Trace Engine | `engine/traceEngine.ts` | Audit trail + compliance report |
| Orchestrator | `engine/orchestrator.ts` | State machine wiring everything together |

### Configuration

See `generation_config.json` at project root:

```json
{
  "signals_policy": { "mode": "warn", "min_fraction": 0.5 },
  "tone_policy": { "mode": "warn" },
  "repair_policy": { "max_attempts_per_scene": 2, "full_rewrite_threshold": 3 },
  "coverage_targets": { "hard_constraints_min_coverage": 1.0, "soft_constraints_min_coverage": 0.6 },
  "composition_defaults": { "allow_blend": true, "allow_hybrid": false }
}
```

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 7** (dev server and build)
- **Cytoscape.js** (graph rendering)
- **Zustand** (state management with persistence)
- **React Router** (URL-based graph navigation)
- **Vitest** + **Testing Library** (unit and component testing)
- **ESLint** (type-aware rules via typescript-eslint) + **Prettier**
