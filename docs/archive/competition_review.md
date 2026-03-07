Your project is already doing something the mainstream tools mostly do not: it treats story structure as a **formal, inspectable graph corpus** with a planned **artifact-driven generation pipeline**, rather than as a notebook, corkboard, or wiki. The repo describes 15 archetype graphs, 27 genre depth graphs, 12 cross-reference datasets, an interactive viewer with simulation/overlay/comparison modes, and a planned generation system where artifacts constrain the agent and produce trace/compliance outputs. That makes `story_v5` closer to a **narrative debugger / structural engine** than to a conventional writer’s app. ([GitHub][1])

What follows is the clean comparison:

## 1. What the major tools are really “about”

**World Anvil** uses the metaphor of a **world encyclopedia / atlas / historical archive**. Its center of gravity is articles and categories, with timelines, maps, and manuscript support layered on top. The user experience says: “build a world reference system, then navigate and publish it.” Its strongest feature pattern is structured lore management: articles, categories, world templates, timelines with events/eras, map features, and manuscripts. ([World Anvil][2])

**Campfire** uses the metaphor of a **modular story workshop**. Instead of one dominant object type, it offers modules: Characters, Relationships, Arcs, Timeline, Maps, Encyclopedia, Systems, Manuscript, and reusable templates. The core interaction model is “choose the modules you need, then fill panels with project data.” It is strong at bridging worldbuilding and drafting because the same system holds relationship webs, timelines, encyclopedia entries, and manuscript/index-card style planning. ([campfirewriting.com][3])

**Plottr** uses the metaphor of a **digital corkboard + visual timeline + series bible**. Its central object is the scene card on a timeline, organized into plotlines, linked to characters, places, notes, and tags, with filtering and act structure layered on top. It is fundamentally an outlining/planning system, not a deep world model. Its strength is that story elements are easy to connect to timeline cards and easy to restructure visually. ([Plottr][4])

**Aeon Timeline** uses the metaphor of a **chronology engine**. It is about events, dates, arcs, characters, and relationships displayed through time, with grouping and dependency views. It is strongest when you need to reason about time, causality, subplot lanes, and who was where when. ([aeontimeline.com][5])

**Scrivener** uses the metaphor of a **writer’s binder / corkboard / outliner / manuscript desk**. It is optimized for drafting long works, reorganizing chunks, and compiling a final manuscript. Its strength is the tight linkage between binder hierarchy, corkboard cards, outliner rows, metadata, and manuscript sections. ([Literature & Latte][6])

**Obsidian** uses the metaphor of a **linked knowledge vault**. The core ideas are notes, backlinks, graph view, canvas, and database-like views through Bases. It is flexible rather than story-opinionated. Its strength is emergent knowledge structure and local extensibility, not prescriptive story planning. ([Obsidian Help][7])

## 2. Where `story_v5` sits relative to them

Your project’s metaphor is not “writer workspace.” It is closer to:

* **Narrative laboratory**
* **Structural debugger**
* **Graph-native story engine**
* **Constraint compiler for story generation** ([GitHub][8])

That is a strong position because none of the other mainstream tools really make structure first-class in this way. Plottr visualizes structure, but mostly as cards and plotlines. Aeon visualizes chronology. World Anvil stores lore. Scrivener organizes manuscript chunks. Obsidian links notes. Your system formalizes **archetype progression**, **genre constraint hierarchies**, **compatibility matrices**, **tone/archetype interactions**, **example mappings**, and planned **traceable generation artifacts**. ([GitHub][1])

So the real opportunity is **not** to copy these tools wholesale. It is to add the missing author-facing layers that let people *use* your graph engine the way they currently use other tools.

## 3. What each tool has that you should consider stealing

### World Anvil

Steal the **article / category / lore page** idea, but make it graph-aware. World Anvil works because every piece of lore can live as a browseable article inside a clear hierarchy, with timelines and maps connected to it. Your project has rich structured data, but it needs an approachable “world page” layer so users can browse characters, places, factions, systems, and cultures without thinking in raw graph terms. ([World Anvil][9])

**Recommendation:** add a **Lore Registry + Article View** on top of your corpus and future story instances.

### Campfire

Steal the **module model**. Campfire succeeds because it gives authors distinct mental containers: Characters, Relationships, Arcs, Timeline, Systems, Encyclopedia, Maps, Manuscript. Your repo already hints at this direction with timeline elements, detail bindings, feature packs, and chapter assembly, but it needs explicit user-facing modules. ([campfirewriting.com][10])

**Recommendation:** define first-class modules in `story_v5` for:

* Story Elements
* Relationships
* Timeline Instance
* Scene/Chapter Assembly
* Lore/Encyclopedia
* Style/Feature Packs

### Plottr

Steal the **scene card + plotline + filter** layer. Plottr’s real advantage is not theoretical depth; it is that authors can manipulate cards quickly, view plotlines, filter by character/place/tag, and restructure easily. Your system already has beats, scene obligations, example overlays, and comparative modes, but it needs a lighter-weight author view. ([docs.plottr.com][11])

**Recommendation:** add a **Scene Board** that sits on top of the graph engine:

* cards = scenes/beats
* lanes = archetype path / subplot / POV / chapter / act
* filters = character, location, motif, unresolved obligation, hard-constraint coverage

### Aeon Timeline

Steal the **time reasoning model**. Your docs already mention a timeline model that bridges archetype nodes into concrete moments with participants and state changes, and suggest `moment_stub` plus a future `timeline_instance.json`. That is exactly the right direction. ([GitHub][12])

**Recommendation:** make timeline instance data a first-class artifact sooner:

* event date/order
* participants present
* before/after state transitions
* dependency edges
* subplot lanes
* continuity checks

### Scrivener

Steal the **manuscript assembly / binder / compile** workflow. Your chapter assembly concept is promising, but users also need a place to manually reorganize, annotate, and export the prose outcome. Scrivener’s magic is that cards, hierarchy, and manuscript remain linked. ([Literature & Latte][13])

**Recommendation:** add:

* Chapter/Scene binder
* synopsis field
* status metadata
* revision flags
* export pipeline from structured artifacts to readable manuscript

### Obsidian

Steal the **backlink + graph + local extensibility** feel. Obsidian works because anything can link to anything, and the graph is not merely decorative. Your project is already graph-native; what it lacks is frictionless note-taking and ad hoc cross-linking around the formal structure. ([Obsidian Help][7])

**Recommendation:** add:

* freeform note objects
* backlinks from notes to nodes/edges/scenes/elements
* saved graph views
* queryable views over properties

## 4. The main gaps in `story_v5`

Right now, the repo is strongest in **formal structure**, **cross-reference logic**, **visual analysis**, and **planned generation governance**. The biggest missing layers are:

**Instance-level story objects.** You have archetypes and genres, but not yet a complete first-class runtime model for characters, locations, factions, items, secrets, motifs, and relationship states as editable entities. The docs point toward this through detail bindings and timeline rules, but it needs to become explicit. ([GitHub][14])

**Authoring ergonomics.** Mainstream tools win because they give users cards, folders, timelines, encyclopedias, and manuscript views. Your project currently presents a more technical and analytical posture. ([GitHub][8])

**Concrete drafting bridge.** You have planned generation and chapter assembly, but not yet the obvious in-between workspace where users can edit scene plans and prose while seeing which graph obligations they satisfy. ([GitHub][14])

## 5. Additions I would recommend, in priority order

### Priority 1: Story Instance Layer

Add a first-class **instance model** separate from the corpus.

Core entities:

* Character
* Relationship
* Location
* Organization/Faction
* Item/Object
* Secret/Knowledge
* Theme/Motif
* Timeline Event
* Scene
* Chapter

Each should be linkable to:

* archetype node(s)
* genre constraint node(s)
* example mappings
* other entities
* manuscript scenes ([GitHub][14])

This is the single biggest unlock.

### Priority 2: Scene Board

Create a **Plottr-like scene card surface**, but graph-backed instead of card-backed alone.

Each scene card should show:

* archetype node
* genre obligations covered / unmet
* participating entities
* timeline moment
* stakes delta
* unresolved dependencies
* compliance flags

This would make your system usable by ordinary authors without giving up the graph engine. Plottr’s success shows how valuable this view is. ([docs.plottr.com][15])

### Priority 3: Timeline Instance View

Implement the timeline layer you already described:

* ordered events
* subplot lanes
* participant/state transitions
* continuity validation
* reveal tracking
* causal dependencies ([GitHub][12])

This lets you borrow Aeon’s best strength while preserving your structural core.

### Priority 4: Lore/Encyclopedia View

Add a World Anvil / Campfire-style **encyclopedia** fed by instance data and generated detail bindings:

* world pages
* character pages
* place pages
* faction/system pages
* backlinks to scenes and structure
* article hierarchy / categories ([World Anvil][9])

This gives users a “worldbuilding tool” feeling without abandoning your formalism.

### Priority 5: Manuscript Workspace

Add a Scrivener-lite layer:

* chapter tree
* scene synopsis
* draft text
* edit status
* compare generated draft vs revised draft
* export to markdown/docx later ([Literature & Latte][13])

Your chapter assembly plan is the correct seed, but it needs an obvious operator-facing UI.

### Priority 6: Relationship and Systems Maps

Campfire’s Relationships and Systems modules are worth imitating because they visualize things authors care about directly: family trees, political structures, magic systems, social systems. ([campfirewriting.com][16])

In your model these should not be standalone drawings; they should be typed graphs attached to the instance layer.

### Priority 7: Notes, Backlinks, Queries

Add Obsidian-like lightweight notes:

* attach note to anything
* backlinks
* tag/query system
* saved workspaces/views ([Obsidian Help][17])

This will make your system better for research, experimentation, and human iteration.

## 6. The most important product decision

You should decide whether `story_v5` is primarily:

**A. a structural analysis engine for advanced writers and researchers**, or
**B. a full authoring environment**

My read is that the best path is:

**Be A first, then selectively steal the surfaces needed from B.**

That means:

* keep the graph corpus central
* keep artifacts central
* keep traceability central
* add authoring surfaces as *views over the graph engine*, not as independent ad hoc objects

That is how you avoid becoming “Campfire but more complicated.”

## 7. My concrete product recommendation

Position `story_v5` as:

**“A graph-native storybuilding system that combines Plottr-style planning, Aeon-style continuity, World Anvil-style lore organization, and agent-governed generation — with formal structural validation.”** ([World Anvil][2])

Build next, in this order:

1. **Story Instance Layer**
2. **Scene Board**
3. **Timeline Instance View**
4. **Lore / Encyclopedia View**
5. **Manuscript / Chapter Workspace**
6. **Relationship + Systems Views**
7. **Notes / Backlinks / Queries**

That set would give you the best parts of the current market while preserving the thing that actually makes your project special.

If you want, I can turn this into a feature-by-feature gap matrix against your repo and rank each addition by implementation difficulty and product value.

[1]: https://github.com/bonjohen/story_v5 "GitHub - bonjohen/story_v5: Story archetype graphs and genre depth graphs — formal directed graph models of storytelling structures · GitHub"
[2]: https://www.worldanvil.com/?utm_source=chatgpt.com "World Anvil Worldbuilding tools & RPG Campaign Manager ..."
[3]: https://www.campfirewriting.com/?utm_source=chatgpt.com "Campfire: Where Stories Come to Life"
[4]: https://plottr.com/features/?utm_source=chatgpt.com "Features"
[5]: https://www.aeontimeline.com/?utm_source=chatgpt.com "Aeon Timeline | Grow big ideas into brilliant narratives"
[6]: https://www.literatureandlatte.com/scrivener/overview?utm_source=chatgpt.com "Scrivener - For writing. And writing. And writing."
[7]: https://help.obsidian.md/plugins/canvas?utm_source=chatgpt.com "Canvas"
[8]: https://github.com/bonjohen/story_v5/blob/main/docs/interactive_viewer_design.md "story_v5/docs/interactive_viewer_design.md at main · bonjohen/story_v5 · GitHub"
[9]: https://www.worldanvil.com/learn/beginner-tutorials/get-started-articles?utm_source=chatgpt.com "Lesson 1: Get Started with Articles"
[10]: https://www.campfirewriting.com/learn/characters-tutorial?utm_source=chatgpt.com "Characters Module Tutorial"
[11]: https://docs.plottr.com/article/67-how-to-use-act-structure-1-0?utm_source=chatgpt.com "How to Use Act Structure 1.0"
[12]: https://github.com/bonjohen/story_v5/blob/main/docs/backbone_synthesis_assembly.md "story_v5/docs/backbone_synthesis_assembly.md at main · bonjohen/story_v5 · GitHub"
[13]: https://www.literatureandlatte.com/blog/integrating-scriveners-binder-corkboard-and-outliner?utm_source=chatgpt.com "Integrating Scrivener's Binder, Corkboard, and Outliner"
[14]: https://github.com/bonjohen/story_v5/blob/main/docs/story_design.md "story_v5/docs/story_design.md at main · bonjohen/story_v5 · GitHub"
[15]: https://docs.plottr.com/article/56-timeline-plotlines?utm_source=chatgpt.com "Timeline - Plotlines"
[16]: https://www.campfirewriting.com/learn/relationships-tutorial?utm_source=chatgpt.com "Relationships Module Tutorial"
[17]: https://help.obsidian.md/backlinks?utm_source=chatgpt.com "Backlinks - Obsidian Help"
