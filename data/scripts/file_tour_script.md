# Repository File Tour

*An audio-friendly guide to the important files. Estimated listening time: 12 minutes.*

---

## The big picture

This repository has four top-level areas. The **docs** folder holds planning documents and specifications. The **data** folder holds the actual graph corpus — all the story structures and genre rules, stored as JSON and Markdown. The **app** folder holds the interactive viewer and the story generation pipeline, both written in TypeScript. And at the root there's a **generation_config.json** that controls the pipeline's behavior.

Let's walk through each area, starting with the data — because that's the foundation everything else is built on.

---

## The data folder

The data folder is the heart of the project. Everything in here is a deliverable — it's the corpus of narrative knowledge that the viewer displays and the generation pipeline consumes. There are four subfolders.

### data/vocabulary — the rule book

This is where the controlled vocabularies live — the dictionaries that every graph and element file in the project must conform to. There are eleven files — six for graph structure and five for story elements.

**archetype_node_roles.json** defines fourteen roles that archetype nodes can have. Things like Origin, Disruption, Catalyst, Threshold, Trial, Crisis, Transformation, Resolution. Every node in every archetype graph is assigned exactly one of these roles. They're what make it possible to compare across archetypes — you can ask "how does Crisis work in Tragedy versus Comedy?" because both graphs use the same role vocabulary.

**archetype_edge_vocabulary.json** defines fifteen edge meanings — the causal relationships between story phases. Things like "disrupts order," "forces commitment," "reveals truth," "raises cost," "enables transformation." Every edge in every archetype graph uses exactly one of these meanings. They describe *why* one phase leads to another, not just that it does.

**genre_node_roles.json** defines seven roles for genre nodes. Genre Promise, Core Constraint, Subgenre Pattern, Setting Rule, Scene Obligation, Tone Marker, and Anti-Pattern. These correspond to the five levels of the genre hierarchy plus the two special structural concepts.

**genre_edge_vocabulary.json** defines twelve edge meanings for genre graphs — refinement relationships like "specifies constraint," "branches into subtype," "mandates element," "prohibits element," "sets tone."

Five additional vocabulary files govern story elements. **element_roles.json** defines thirteen character roles — protagonist, antagonist, mentor, ally, herald, threshold guardian, shadow, trickster, shapeshifter, love interest, foil, confidant, and comic relief. **place_types.json** defines ten setting types — ordinary world, threshold, special world, sanctuary, stronghold, wasteland, crossroads, underworld, summit, and home. **object_types.json** defines ten object types — weapon, talisman, document, treasure, McGuffin, symbol, tool, key, vessel, and relic. **relationship_types.json** defines ten character relationship types — ally, rival, mentor-student, parent-child, romantic, nemesis, servant-master, sibling, betrayer, and guardian. **element_change_types.json** defines eleven transition types — learns, gains, loses, transforms, arrives, departs, bonds, breaks, dies, reveals, and decides.

Then there are two Markdown files — **archetype_id_convention.md** and **genre_id_convention.md** — that document the ID naming system. Every node and edge in the project follows the pattern: two-letter prefix, underscore, N or E for node or edge, a two-digit number, underscore, then a short name in upper snake case. So HJ_N01_ORDINARY_WORLD is the first node in the Hero's Journey. DR_E03_SPECIFIES_CONSTRAINT is the third edge in Drama. The convention files list every prefix and explain the number ranges.

### data/archetypes — fifteen story structures

There are fifteen numbered folders, 01_heros_journey through 15_the_rise_and_fall. Each one models a complete temporal story structure — the sequence of phases a protagonist passes through from beginning to end.

Every archetype folder has at least three files.

**graph.json** is the directed graph itself. It has a nodes array and an edges array. Each node has a unique ID, a label, a role from the vocabulary, a definition explaining what this phase means, entry conditions that must be true before a story can enter this phase, exit conditions that must be true before it can leave, typical variants, failure modes describing what goes wrong when this phase is mishandled, and signals in text describing how you'd identify this phase when reading an actual story. Each edge has an ID, source and target node IDs, a label, a meaning from the vocabulary, preconditions, effects on stakes, effects on character, common alternatives, and anti-patterns. There's also a metadata block at the bottom with counts and distributions.

**narrative.md** is a prose walkthrough of the graph. It explains each phase in natural language — what it represents, how it functions, what failure looks like, how to spot it in a real work. This is designed to be read by a human. It's the educational companion to the structural graph.

**examples.md** maps two to four real works against the graph, node by node and edge by edge. It shows you which events in Star Wars correspond to which phases of the Hero's Journey, or which scenes in Macbeth correspond to which phases of Tragedy. There's usually one primary example with full detailed mappings and two or three cross-reference examples with briefer coverage.

Two archetypes have an additional **variants.json** file — the Hero's Journey and the Escape. Variants are optional or alternative paths that branch from the main spine and rejoin it later. Variant nodes use IDs in the fifty to seventy-nine range. The variants file has its own nodes and edges arrays plus metadata listing branch and rejoin points.

Three archetypes have **beat sheet** files — scene-level mappings with timestamps for a single well-known work. The Hero's Journey has a beat sheet for Star Wars Episode Four. Tragedy has one for Macbeth. The Escape has one for The Shawshank Redemption. Each beat maps an archetype node to specific scenes with timestamps and duration percentages.

All fifteen archetypes now have an **elements.json** file — the story elements template. This defines the character roles, place types, and object types that the archetype typically involves, using controlled vocabulary terms. Each element has an `appears_at_nodes` array linking it to specific graph phases, plus a `required` flag. The file also includes a `template_timeline` section that describes the expected flow of element participation and state changes across the archetype's spine. The generation pipeline uses this to populate scenes with characters and settings.

Five archetypes have an **examples_elements.json** file — instance-level element mappings for well-known works. The Hero's Journey maps Star Wars characters to template roles (Luke Skywalker as protagonist, Obi-Wan as mentor). The Quest maps Lord of the Rings. Tragedy maps Macbeth. Rebirth maps A Christmas Carol. Comedy maps The Big Lebowski. These include character traits, motivations, relationships, place descriptions, and object significance.

### data/genres — twenty-seven genre rule systems

There are twenty-seven numbered folders, 01_drama through 27_holiday. Each one models a genre as a constraint hierarchy — a tree of rules that progressively narrow the creative space.

Every genre folder has three files: **graph.json**, **narrative.md**, and **examples.md**, following the same pattern as archetypes. Ten genres also have an **element_constraints.json** file that defines required, recommended, and optional character roles, relationship types, place types, object types, and testable element rules. The ten genres with element constraints are Romance, Horror, Thriller, Fantasy, Science Fiction, Detective, Adventure, Western, Superhero, and War. The remaining seventeen genres constrain tone and structure rather than element composition.

Genre graphs have a different structure from archetypes. Instead of a temporal sequence, they're a tree with five levels. Level one is the Genre Promise — the single fundamental contract with the audience. Level two is Core Constraints — the three to six things that absolutely must be present. Level three is Subgenre Patterns — recognized subtypes the writer may choose from. Level four is Setting Rules — world-building and mechanical constraints. Level five is Scene Obligations — concrete scene or beat requirements. Then there's a Tone Marker node that defines the non-negotiable mood, and one or two Anti-Pattern nodes that describe what breaks the genre.

Genre nodes have two extra fields that archetype nodes don't. **Level** tells you where in the hierarchy the node sits — one through five, eighty for tone markers, ninety for anti-patterns. **Severity** is either "hard" or "soft." Hard means violating this constraint breaks the genre contract. Soft means it's uncommon but still valid. The generation pipeline uses severity to decide what's a blocking failure versus a warning.

### data/cross_references — the connective tissue

This folder has thirteen JSON files that connect the archetype and genre graphs to each other and to the real world.

**manifest.json** is the corpus inventory — counts of every file type, every graph, every node and edge. The generation pipeline loads this first to verify corpus integrity.

**genre_archetype_matrix.json** is the big compatibility table — twenty-seven genres times fifteen archetypes. Each pairing is classified as naturally compatible, occasionally compatible, or rarely compatible, with rationale. This is what the selection engine uses to score combinations.

**cross_archetype_index.json** maps which node roles and edge meanings appear in which archetypes. It tells you that Origin and Resolution are universal — all fifteen archetypes have them — while Descent only appears in four.

**cross_genre_constraint_index.json** does the same thing for genres — it identifies sixteen recurring constraint patterns like Stakes Escalation and Internal Consistency that appear across multiple genres.

**archetype_emotional_arcs.json** has quantitative emotional trajectories for all fifteen archetypes. Each node along the spine gets four scores from zero to one: tension, hope, fear, and resolution. Each archetype is classified by arc shape — U-curve, inverted-U, W-curve, descending, and so on.

**hybrid_archetype_patterns.json** documents twelve common hybrid patterns where two archetypes co-occur in a single work — like Hero's Journey plus Tragedy, or Coming of Age plus the Quest. Each hybrid lists shared roles, the divergence point where the arcs split, the composition method, example works, and structural tensions.

**tone_archetype_integration.json** has four hundred and five pairings — twenty-seven tone markers times fifteen archetypes — each classified as reinforcing, contrasting, or neutral. It models how a genre's mood interacts with an archetype's emotional trajectory.

**genre_blending_model.json** documents eighteen genre blend patterns. Each one lists which constraints are compatible, which conflict, how the tones synthesize, and whether the blend is stable or unstable.

**example_works_registry.json** is the master index of a hundred and seven real works referenced across all the example files. Each work has its creator, year, medium, and a list of which graphs reference it.

**non_western_archetype_analysis.json** documents ten narrative archetypes from East Asian, South Asian, African, Indigenous American, and Middle Eastern traditions, mapping where they overlap with the Western fifteen and where they diverge.

**cross_medium_adaptation.json** analyzes six works that exist in multiple mediums — novel to film, film to game — tracking which nodes compress, expand, or change role in each transition.

**corpus_validation.json** tests the graphs against a fifty-work corpus, measuring archetype coverage and genre coverage, identifying gaps and outliers.

**element_role_index.json** is the cross-archetype analysis of story element usage. It maps which character roles, place types, and object types appear across all fifteen archetypes — telling you that protagonist and antagonist are nearly universal while herald and comic relief are archetype-specific.

---

## The docs folder

The docs folder has the planning and specification documents that guided the project's construction.

**v0_plan.md** is the authoritative statement of work. If you want to understand the full schema for nodes and edges, the design rationale, or what the project set out to build, this is the primary source. Read this first if you're new to the project.

**story_design.md** is the design document for the story generation pipeline — the architecture, the artifact schemas, the agent responsibilities, the validation model.

**story_generation_plan.md** is the eight-phase implementation plan for the generation system. All eight phases are complete.

**interactive_viewer_design.md** is the UI/UX specification for the graph viewer — what it should look like, how it should behave, what interactions it supports.

**interactive_viewer_plan.md** is the eight-phase implementation plan for the viewer. Also fully complete.

**v-next.md** tracks forty-two deferred items — issues, suggestions, and enhancements — that were identified during development. All have been resolved.

**archetypes.json** and **genres.json** are reference catalogs — quick-lookup lists of all fifteen archetypes and twenty-seven genres with descriptions, examples, and associated metadata.

**goal_1.md** and **goal_2.md** are the task trackers for the archetype graphs and genre graphs respectively. Both are complete.

---

## The app folder

This is a React 19 plus TypeScript application built with Vite. It serves two purposes: the interactive graph viewer and the story generation pipeline. They share the same codebase — same graph engine, same type system, same data loading layer.

### app/src/types — the type system

**graph.ts** defines the core TypeScript interfaces: StoryGraph, GraphNode, GraphEdge, DataManifest. Every component in the app works with these types.

**elements.ts** defines interfaces for story element types — Character, Place, Object at both template and instance levels. **timeline.ts** defines interfaces for the timeline model — Moment, Transition, Timeline, CharacterState. **element-constraints.ts** defines interfaces for genre element constraints.

### app/src/graph-engine — the data layer

This is the engine that loads, parses, and validates graph data.

**normalizer.ts** takes raw graph JSON and produces clean, validated StoryGraph objects. It handles schema differences between archetype and genre graphs and strips out metadata.

**validator.ts** checks graphs against the controlled vocabularies — making sure every node role and edge meaning is from the approved list.

**dataIndex.ts** has the directory listings for all fifteen archetypes and twenty-seven genres — the folder names and display names the UI uses to build its selector panel.

**exampleParser.ts** parses the Markdown example files and extracts the node-to-scene mappings that the example overlay feature displays.

**helpers.ts** has utility functions for graph traversal — finding start nodes, terminal nodes, successors, predecessors.

### app/src/store — state management

Several Zustand stores manage the application state.

**graphStore.ts** is the main store — which graphs are loaded (both archetype and genre), the normalized graph data, search state, and selected elements. It tracks a `currentGraph` pointer for the active graph, with single-graph focus as the default and an optional split (compare) view available in the Analysis tab.

**settingsStore.ts** handles user preferences — layout algorithm, color scheme, label visibility, animation settings. Persisted to local storage.

**elementStore.ts** manages story element data — loaded archetype templates, example instances, template timelines, genre element constraints, and emotional arc profiles. Data is loaded lazily when an archetype or genre is viewed and cached for subsequent access.

**requestStore.ts** (in the generation folder) maintains persistent form state for the generation panel's Setup tab — premise, archetype, genre, tone, blend/hybrid settings, and slot overrides. These values survive tab switches and panel navigation.

### app/src/render — the graph canvas

**GraphCanvas.tsx** is the Cytoscape.js wrapper component. It manages the canvas lifecycle, handles zoom and pan, applies layout algorithms, and bridges between React state and Cytoscape's imperative API. It also accepts a generation overlay prop for highlighting nodes during story generation.

**elements.ts** transforms StoryGraph nodes and edges into Cytoscape element definitions.

**styles.ts** defines all the visual styling rules — node colors by role, edge colors by meaning, selection highlights, trace highlights, and generation overlay colors.

### app/src/layout — layout algorithms

**archetypeLayout.ts** arranges archetype graphs in a left-to-right flow following the temporal spine, with variants branching above and below.

**genreLayout.ts** arranges genre graphs in a top-down tree following the five-level hierarchy.

**applyLayout.ts** dispatches to the correct algorithm based on graph type.

### app/src/components — reusable UI

**GraphSelectorPanel.tsx** is the sidebar listing all forty-two graphs grouped by type, with search filtering.

**GraphSearch.tsx** is the search box component with keyboard navigation.

**SettingsPanel.tsx** exposes the settings store as a form — layout, colors, labels, animations.

**VariantToggle.tsx** shows and hides variant branches on archetype graphs that have them.

**ErrorBoundary.tsx** catches rendering errors and displays a recovery UI.

### app/src/panels — feature panels

**DetailPanel.tsx** shows full metadata for a selected node or edge — definition, conditions, failure modes, signals in text.

**PairingPanel.tsx** displays the genre-archetype compatibility analysis from the cross-reference matrix, showing how well the currently loaded archetype and genre work together.

**ExampleOverlay.tsx** highlights which nodes map to scenes in real works — so you can see Star Wars painted onto the Hero's Journey graph.

**ExportPanel.tsx** exports the current graph as PNG, SVG, DOT for Graphviz, Mermaid, or GraphML.

**GraphStats.tsx** shows analytics — node and edge counts, degree distributions, longest paths, role and meaning distributions.

**CrossIndex.tsx** provides cross-reference lookups — shared roles across archetypes, shared constraints across genres, compatibility matrix entries.

**ElementsPanel.tsx** shows story element templates for archetype graphs — character roles, place types, and objects at the selected node or across all nodes. For genre graphs, it shows element constraints with severity badges. Instance names from example works appear alongside template roles when available.

**TimelinePanel.tsx** renders the swimlane timeline visualization — horizontal tracks for each character role showing participation across archetype nodes, with transition badges indicating gains, losses, bonds, deaths, and other state changes.

**CharacterArcPanel.tsx** displays emotional arc line charts with tension, hope, fear, and resolution dimensions. A dropdown filters to a specific character role, showing only the nodes where that character participates.

**ConstraintChecklist.tsx** generates a printable checklist of genre constraints for a selected graph, organized by level and severity.

### app/src/hooks — custom React hooks

**useKeyboardNav.ts** adds keyboard navigation — arrow keys to move between nodes, enter to select, escape to deselect.

**useTraceNavigation.ts** provides BFS forward and backward from any selected node, highlighting all reachable paths.

### app/src/generation — the story generation pipeline

This is the engine that turns a story request into a finished story with full compliance tracing.

**engine/corpusLoader.ts** loads all forty-two graphs, all cross-reference datasets, all archetype element templates, and all genre element constraints into a single LoadedCorpus object. It works with a DataProvider interface — the browser version fetches over HTTP, the CLI version reads from the filesystem.

**engine/selectionEngine.ts** scores genre-archetype combinations using the compatibility matrix, tone integration data, and the user's request constraints.

**engine/contractCompiler.ts** builds the enforceable story contract — archetype spine, genre constraints by severity, global boundaries, phase guidelines, validation policy, element requirements from archetype templates, and element constraints from genre constraint files.

**engine/planner.ts** creates the beat sheet, scene assignments, and element roster. Each beat maps to an archetype node with emotional scores. Each scene gets a setting, characters, objects, goal, constraint checklist, and a timeline moment with expected participants and transitions.

**agents/writerAgent.ts** generates prose for individual scenes using an LLM, staying within the constraints from the plan. The writer receives element context — who's in the scene, their traits and motivations, character state accumulated from prior scenes, and object custody tracking.

**validators/validationEngine.ts** checks each scene against hard constraints, anti-patterns, tone, entry and exit conditions, signals in text, and element continuity (mortality, object custody, relationship consistency). Each check produces a pass, warn, or fail.

**engine/repairEngine.ts** takes scenes that failed validation and either patches them with targeted edits or triggers a full rewrite.

**engine/traceEngine.ts** builds the audit trail — mapping every scene back to the archetype nodes, edges, and genre constraints it satisfies, then generating the compliance report.

**engine/orchestrator.ts** is the state machine that wires everything together. It walks through the pipeline states — idle, loaded, selected, contract ready, planned, generating, validating, repairing, completed — emitting events at each transition.

**artifacts/types.ts** defines all the TypeScript types for the pipeline's input and output artifacts — StoryRequest, SelectionResult, StoryContract, StoryPlan, ValidationResults, StoryTrace, and GenerationConfig.

**store/generationStore.ts** is the Zustand store for the generation UI — run status, loaded artifacts, selected scene, and actions to start, load, select, and clear runs.

**panels/** contains the generation UI organized as five focused tabs: PipelineTab for LLM connection and telemetry, StorySetupTab for archetype/genre/premise/tone selection, ElementsTab for editable entity management (characters, places, objects), AnalysisTab for graph visualization and all inspection panels (contract, backbone, plan, story, compliance), and GenerateTab for running the pipeline and viewing prose output.

### app/scripts — data processing tools

**validate_corpus.ts** checks all forty-two graphs against the controlled vocabularies and schema rules at build time.

**validate_elements.ts** validates archetype element templates — checking vocabulary conformance, node ID references, and template timeline completeness. **validate_element_constraints.ts** validates genre element constraint files. **validate_element_vocabularies.ts** validates the five story element vocabulary files. **validate_examples_elements.ts** validates example element instance files for internal consistency.

**generate-manifest.ts** produces manifest.json — the corpus inventory with counts and checksums.

**build-works-registry.ts** extracts all referenced works from the example files and builds the consolidated registry.

**inject-metadata.ts** computes and injects the metadata block into every graph.json.

**inject-severity.ts** adds severity classifications to all genre graph nodes and edges.

**renumber-edges.ts** renumbers edges in genre graphs to conform to the level-based numbering convention.

**split-variants.ts** extracts variant nodes and edges from archetype graphs into separate variants.json files.

**generate_story.ts** is the CLI runner for the generation pipeline.

---

## The root

**generation_config.json** controls the pipeline's behavior — how strict signals checking is, whether tone mismatches block or warn, how many repair attempts per scene, coverage thresholds for hard and soft constraints, and whether genre blending and hybrid archetypes are allowed by default.

**CLAUDE.md** contains project conventions and instructions for AI assistants working on the codebase.

---

## How it all connects

The data flows in one direction. The **vocabulary** files define the rules. The **archetype** and **genre** graphs follow those rules. The **cross-references** connect the graphs to each other. The **graph engine** loads and validates everything. The **viewer** renders it visually. The **generation pipeline** consumes it to produce stories. And the **compliance trace** proves the stories actually conform to the structures they claim to follow.

If you're exploring for the first time, start with v0_plan.md for the design rationale, then open one archetype graph.json — the Hero's Journey is the most familiar — and one genre graph.json — Horror or Science Fiction are good starting points. From there, the cross-references and the viewer will start making sense.
