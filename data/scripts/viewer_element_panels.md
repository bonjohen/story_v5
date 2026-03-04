# The Viewer's Element Panels

*An audio-friendly guide to visualizing story elements in the interactive viewer. Estimated listening time: 9 minutes.*

---

## Three new panels

The interactive viewer has three new tabs in the right-hand panel: **Elements**, **Timeline**, and **Arcs**. These panels visualize the story elements system — who appears where, how things change over time, and what emotional trajectory each character experiences. Let's walk through each one.

---

## The Elements panel

When you're viewing an archetype graph, the Elements tab shows the character roles, place types, and object types defined in that archetype's `elements.json` template.

### The "At Node" view

By default, the panel shows elements filtered to the currently selected node. Click the Ordinary World node in the Hero's Journey graph, and the Elements panel shows:

- **Characters**: protagonist (required)
- **Places**: ordinary world (required)
- **Objects**: (none at this node)

Click the Mentor node, and the panel updates:

- **Characters**: protagonist (required), mentor (required)
- **Places**: ordinary world (required)
- **Objects**: talisman (optional)

This tells you instantly who and what is expected at each story phase. The "At Node" view answers the question: "When I'm writing this part of the story, who should be there?"

### The "All" view

Toggle from "At Node" to "All" to see every element the archetype template defines, regardless of which node is selected. Each element shows its role or type, its label, its definition, whether it's required, and which nodes it appears at.

This is the full element roster for the archetype — the complete list of structural slots that a story of this type should fill.

### Instance names

When example element data exists — currently for the Hero's Journey, the Quest, Tragedy, Rebirth, and Comedy — the panel shows instance names alongside template roles. Instead of just "protagonist," you'll see "protagonist — Luke Skywalker." Instead of just "ordinary world," you'll see "ordinary world — Tatooine."

This bridges the gap between abstract structure and concrete storytelling. You can see both the *kind* of element the pattern requires and the *specific* element a real work used to fill that role.

### Color coding

Elements are color-coded by category. Character roles appear in blue. Place types appear in green. Object types appear in amber. Required elements have a solid badge; optional elements have a lighter badge. This visual system makes it easy to scan the panel and understand the element composition at a glance.

### Genre constraints view

When you're viewing a genre graph instead of an archetype, the Elements panel switches to show **genre element constraints** — if the genre has an `element_constraints.json` file.

The display groups constraints by category: character requirements, relationship requirements, place requirements, object requirements, and element rules. Each constraint shows its severity as a colored badge — red for required, amber for recommended, gray for optional. Element rules show their rule ID and testable condition.

For the ten genres with element constraints — Romance, Horror, Thriller, Fantasy, Science Fiction, Detective, Adventure, Western, Superhero, and War — this gives you a complete picture of what the genre demands in terms of story substance. For the other seventeen genres, the panel indicates that the genre uses structural and tonal constraints rather than element composition rules.

---

## The Timeline panel

The Timeline tab visualizes character participation across archetype phases as a **swimlane chart**. This panel is only available for archetype graphs.

### Reading the swimlane

The chart has character roles on the left axis (one row per role) and archetype nodes across the top (one column per phase). Where a character participates at a phase, the cell is filled. Where they don't, the cell is empty.

For the Hero's Journey, the protagonist row is filled across all eleven columns — they're present at every phase. The mentor row has filled cells at the Mentor node and the Ordeal. The shadow row lights up at Trials, Approach, Ordeal, and Resurrection. You can instantly see which parts of the story each character inhabits.

### Transition badges

Filled cells show small icons representing the transitions that occur at each moment. A plus sign means "gains." A minus means "loses." An arrow means "arrives" or "departs." A heart means "bonds." An X means "breaks." A skull means "dies." A dot with no special icon means the character is present but no explicit state change occurs.

These badges are drawn from the template timeline data. When you hover over a cell, the tooltip shows the full transition details — "protagonist gains talisman at Mentor" or "mentor dies at Ordeal."

### Template versus instance mode

At the top of the Timeline panel, toggle buttons let you switch between **Roles** mode and **Names** mode (when example data exists).

In Roles mode, the left axis shows role labels: protagonist, mentor, shadow, ally. In Names mode, it shows character names: Luke Skywalker, Obi-Wan Kenobi, Darth Vader, Han Solo. The grid content is the same — the toggle just changes the labels for readability.

### Interaction

Clicking any column in the swimlane selects the corresponding node in the main graph canvas. The column header highlights in the accent color, and the Detail panel updates to show that node's full metadata. This keeps the swimlane synchronized with the graph — you can browse the timeline and jump to any phase on the canvas.

### The legend

At the bottom of the panel, a legend maps each transition icon to its meaning. This serves as a quick reference for the eleven change types used in the template timeline.

---

## The Arcs panel

The Arcs tab shows emotional arc data as an **SVG line chart**. It integrates two data sources: the emotional arc profiles from `data/cross_references/archetype_emotional_arcs.json` and the character participation data from the template timeline.

### The basic view

By default, the chart shows four colored lines — one for each emotional dimension:

- **Tension** (red) — how much pressure the story is under
- **Hope** (green) — how optimistic the trajectory feels
- **Fear** (purple) — how threatened the characters are
- **Resolution** (blue) — how much of the conflict is settled

The x-axis represents story position from beginning to end. The y-axis runs from zero to one. Each archetype node is marked as a vertical guide line, with abbreviated labels at the bottom.

For the Hero's Journey, the tension line rises through Trials and Approach, peaks at the Ordeal, drops at the Reward, rises again at the Resurrection, and falls to near-zero at the Return. The hope line follows roughly the inverse pattern. This is the W-curve shape that characterizes the Hero's Journey — two crises, two recoveries.

### Dimension toggles

Below the dropdown, four toggle buttons let you show or hide individual dimensions. If you want to focus on just tension and hope, turn off fear and resolution. The buttons are color-coded to match their lines.

### Character focus

The dropdown at the top lets you filter the arc to a specific character role. When you select "protagonist," the chart shows only the nodes where the protagonist participates — which for the Hero's Journey is all eleven, so the chart looks the same. But when you select "mentor," the chart shows only two nodes — the Mentor node and the Ordeal — creating a truncated arc that reveals the mentor's limited but pivotal emotional trajectory.

This character-focused view answers a nuanced question: "What emotional landscape does this specific character experience?" The protagonist gets the full emotional journey. The shadow only experiences the high-tension crisis points. The herald appears at a single moment of moderate tension.

### Selected node detail

When you click a node on the chart (or select one in the graph canvas), the Arcs panel highlights that point with a vertical accent line and shows the exact dimension values in a detail section below the chart. "ORDEAL — tension: 0.95, hope: 0.20, fear: 0.85, resolution: 0.05."

### Arc metadata

Below the chart, the panel shows the archetype's arc shape classification (W-curve, U-curve, J-curve, inverted-U, descending, ascending), the dominant emotion, the emotional range score, and a prose summary describing the arc's overall trajectory.

---

## How the panels work together

The three panels are designed to complement each other and the existing Detail, Stats, and Cross-Index tabs.

The **Detail** panel tells you about a single node's structure — definition, conditions, failure modes. The **Elements** panel tells you what populates that node — which characters, places, and objects are expected there. The **Timeline** panel shows you the flow across all nodes — who's where when, and what changes. The **Arcs** panel adds the emotional dimension — how intense, hopeful, fearful, or resolved each point feels.

Together they provide a complete view: structural definition, element composition, temporal flow, and emotional landscape. You can read a story's architecture from abstract to concrete, from structural phase to named character to emotional score, all within the same viewer.

---

## The data behind the panels

All three panels are powered by a dedicated Zustand store at `app/src/store/elementStore.ts`. When you navigate to an archetype graph, the store lazily loads:

- `elements.json` — the template roles, types, and template timeline
- `examples_elements.json` — the instance-level names and relationships (if available)
- The emotional arc data from `archetype_emotional_arcs.json` (loaded once, shared across all archetypes)

When you navigate to a genre graph, the store loads:

- `element_constraints.json` — the genre's element requirements (if available)

All data is cached — switching between archetypes doesn't reload data you've already viewed. The store manages loading states and errors, showing appropriate messages when data isn't available.

The panels themselves are in `app/src/panels/` — `ElementsPanel.tsx`, `TimelinePanel.tsx`, and `CharacterArcPanel.tsx`. Each one subscribes to the element store and renders its visualization. The architecture follows the same pattern as the existing panels — stateless display components driven by centralized state management.
