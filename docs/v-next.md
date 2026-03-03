V-Next Deferred Tasks — holding place for issues, suggestions, and enhancements we plan to defer.

---

## Deferred Tasks

1. [ ] **Example Expansion and Data Enrichment**
Expand the fixed set of example works across archetypes and genres by adding additional representative stories, increasing node-to-example mapping density, enriching metadata (author, year, medium, origin), and enabling deeper comparative and analytical cross-referencing.

---

## Known Issues

2. [ ] **Unused controlled vocabulary terms**
The "Reckoning" node role and "compels return" edge meaning are defined in the archetype vocabularies but not assigned to any node or edge across all 15 archetype graphs. Decide whether to remove them, document them as reserved, or find graphs where they apply.

3. [ ] **File path references in goal_1.md are stale**
Goal 1 references `docs/archetypes/` paths throughout, but archetype files have been moved to `data/archetypes/{name}/`. The goal file should be updated to reflect the current file structure, or marked as historical.

4. [ ] **Archetype vocabulary files remain in docs/**
`docs/archetype_edge_vocabulary.json`, `docs/archetype_node_roles.json`, and `docs/archetype_id_convention.md` are still in `docs/` while the archetype deliverables have moved to `data/archetypes/`. Consider consolidating vocabulary files into `data/archetypes/` or a shared `data/vocabulary/` location.

5. [ ] **cross_archetype_index.json references long-form node IDs inconsistently**
The index uses short archetype names (e.g., "Comedy" instead of "Comedy (Restoration of Order)") in some places. Standardize naming to match `archtypes.json` exactly.

---

## Suggestions

6. [ ] **Hybrid archetype modeling**
Many stories blend two or more archetypes (e.g., Hero's Journey + Coming of Age, Revenge + Tragedy). Add a document describing common hybrid patterns and how graphs can be composed or layered.

7. [ ] **Archetype variant graphs as separate JSON files**
Currently, variant branches (Refusal of the Call, Recapture) are embedded in the main graph JSON using the 50-79 ID range. Consider splitting variants into separate graph files for cleaner tooling.

8. [ ] **Graph visualization tooling**
The JSON graph format is machine-readable but has no rendering pipeline. Consider adding a script or tool that generates visual diagrams (e.g., Mermaid, D3, Graphviz) from the graph JSONs.

9. [X] **CLAUDE.md update**
CLAUDE.md was written before the folder restructure and before goal_1 completion. Update it to reflect the current project state, file locations, and completed deliverables.

---

## Enhancements

10. [ ] **Scene-level beat sheets**
Extend archetype graphs to scene-level resolution for specific example works — mapping each node/edge to specific scenes with timestamps or page numbers. Currently excluded per `v0_plan.md` §2.2.

11. [ ] **Interactive story planner**
Build a web-based tool that lets a writer select an archetype and genre, then walks them through the combined graph as a planning scaffold. Requires graph visualization (#8) and the genre × archetype matrix (goal 2, phase 15) as prerequisites.

12. [ ] **Non-Western archetype analysis**
The current 15 archetypes draw primarily from Western storytelling traditions. Research and potentially add archetypes from East Asian, South Asian, African, Indigenous, and Middle Eastern narrative traditions.

13. [ ] **Audience-facing genre depth selector**
Build a tool that lets a writer drill down through the five genre levels interactively, making constraint choices at each level and producing a tailored constraint sheet for their project.

14. [ ] **Cross-medium adaptation mapping**
Analyze how archetype graphs shift when a story moves between mediums (novel → film → TV series → game). Document which nodes compress, expand, or change role.

15. [ ] **Quantitative validation against a story corpus**
Test the archetype and genre graphs against a corpus of actual stories (e.g., 100 films, 100 novels) to measure coverage, identify missing patterns, and validate the controlled vocabularies empirically.
