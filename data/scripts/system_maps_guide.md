# System Maps: Relationship Visualization

*A guide to the four visual map modes for entity relationships. Estimated listening time: 8 minutes.*

---

## What System Maps are

System Maps are interactive graph visualizations that show the relationships between entities in your story. They live in the Maps tab of the Story Workspace and use Cytoscape.js to render nodes and edges that you can explore visually.

The key difference from the main Structure graph viewer is scope: the Structure viewer shows archetype and genre graphs from the corpus. System Maps show the entities in your story instance — your characters, factions, and the connections between them.

---

## Four view modes

The Maps tab offers four view modes, selectable via buttons at the top of the panel. Each mode filters and arranges the graph differently to answer different questions.

---

## All Relationships

The default mode. It shows every character as a circle node and every faction as a diamond node, with edges for every relationship in the data.

Edge colors indicate relationship type: green for ally, red for rival, amber for mentor-student, pink for parent-child, magenta for romantic, dark red for nemesis, gray for servant-master, cyan for sibling, purple for betrayer, and blue for guardian.

This is the broadest view — useful for getting an overview of your story's social fabric. In a complex story with many characters, the graph can be dense, which is when the filtered views become more useful.

The layout uses a force-directed algorithm that spaces nodes to minimize edge crossings while keeping connected nodes close together.

---

## Family Tree

The Family Tree mode filters the graph to show only family and romantic relationships: parent-child, sibling, and romantic edges. All other relationship types are hidden.

The layout switches to a hierarchical breadthfirst arrangement, which puts parent nodes above child nodes. This creates the classic family tree shape — ancestors at the top, descendants below, with sibling nodes at the same level.

This mode is especially useful for fantasy and historical fiction where dynastic relationships drive the plot. You can see at a glance who is related to whom, which family lines intersect through marriage, and where sibling rivalries exist.

---

## Political / Faction

The Political mode focuses on organizational power structures. Faction nodes are the primary entities, shown as large diamond shapes. Character nodes appear only if they're members of a faction.

Faction-to-faction edges show political relationships: allied (green), hostile (red), vassal (amber), rival (dark red), or neutral (gray). Character-to-faction edges show membership, with the character's rank or role as the edge label.

This mode answers questions like: which factions are allied? Which are at war? Who are the key members of each faction? Where do characters have dual loyalties (membership in multiple factions)?

The layout uses a force-directed algorithm that clusters faction members near their faction node.

---

## Knowledge Web

The Knowledge Web mode focuses on information — who knows what, and who knows about whom.

Every character appears as a node. Edges are created in two ways. First, if two characters share knowledge items (identical entries in their knowledge arrays), an edge appears between them labeled with the count of shared items. The edge thickness scales with the number of shared items. Second, if a character's knowledge mentions another character by name, a "knows about" edge appears.

This mode is particularly useful for mystery, thriller, and intrigue stories where information asymmetry drives tension. You can see which characters share secrets, which characters know about others without being known in return, and where knowledge clusters exist.

---

## Reading the legend

Each view mode has a legend in the bottom-left corner showing the color coding for that mode's edge types. The top-right corner shows the current node and edge count.

The legend updates when you switch modes, so you always know what the colors mean in context.

---

## How it connects

System Maps read from your active story instance — specifically, the characters, factions, their relationships, their faction memberships, and their knowledge arrays. If you edit a character's relationships in the Characters tab and then switch to the Maps tab, the graph reflects your changes immediately.

The maps are read-only views. To change relationships, edit them in the entity editors. The maps are for visualization and discovery, not editing.
