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

6. [X] **Musical narrative.md had incorrect node ID references**
`data/genres/26_musical/narrative.md` referenced `MU_N40_HEIGHTENED_EMOTIONAL_REALITY` instead of the correct `MU_N40_HEIGHTENED_REALITY` in two places (node explanation and canonical walkthrough). Fixed.

7. [ ] **Genre vocabulary files live in docs/ alongside archetype vocabulary files**
`docs/genre_edge_vocabulary.json`, `docs/genre_node_roles.json`, and `docs/genre_id_convention.md` are in `docs/` while genre deliverables are in `data/genres/`. Same structural inconsistency as archetype vocabs (#4). Consider a unified `data/vocabulary/` directory or co-locating with deliverables.

8. [ ] **Unused genre edge vocabulary terms**
The edge meanings "narrows scope", "inherits constraint", "specializes threat", and "differentiates from" appear in `docs/genre_edge_vocabulary.json` but may have very limited or zero usage across the 27 genre graphs. Audit usage counts and decide whether to remove unused terms, document them as reserved, or find graphs where they should apply.

9. [ ] **Genre graph node/edge counts vary without documented rationale**
Most genres have 15–18 nodes and 18–22 edges, but some variation exists (e.g., Drama has 2 anti-patterns, most genres have 1). The variation is structurally justified but undocumented. Consider adding a brief structural note explaining why certain genres have extra nodes.

10. [ ] **No automated validation for graph-narrative correspondence**
Narrative specs reference node/edge IDs from their graph.json, but there is no script to verify these references are correct. The Musical issue (#6) was caught by manual audit. A validation script would catch such mismatches automatically across all 27 genres.

25. [ ] **Systematic edge numbering shift in 6–8 genre graphs**
Several genre graphs number edges sequentially rather than by level-transition range. In these graphs, L3→L4 edges use the 10–29 range (instead of 30–49), L4→L5 edges use the 30–49 range (instead of 50–69), and cross-level edges use whatever range follows sequentially. Affected genres: Horror (10), Detective (13), Romantic Comedy (09), Literary Fiction (20), Children's Literature (21), Family (18), Biography (17), and Crime (12). The edge numbering convention has been clarified to accommodate the universal L1→Tone and L5→L5 patterns, but the full-range shifts in these genres remain inconsistent with the majority pattern. A future pass could renumber these edges to match the convention, updating graph.json, narrative.md, and examples.md for each affected genre.

26. [ ] **Cross-level edges (L2→L5, L2→L4) not in 70–89 range**
Several genres have edges that skip levels (e.g., Core Constraint directly to Scene Obligation) but number them in the destination level's range rather than the 70–89 cross-level range. Affected genres include Young Adult, Western, War, Crime, Detective, and Mystery. These are individually correct per the clarified convention ("when possible" language) but could be renumbered for stricter consistency.

---

## Suggestions

11. [ ] **Hybrid archetype modeling**
Many stories blend two or more archetypes (e.g., Hero's Journey + Coming of Age, Revenge + Tragedy). Add a document describing common hybrid patterns and how graphs can be composed or layered.

12. [ ] **Archetype variant graphs as separate JSON files**
Currently, variant branches (Refusal of the Call, Recapture) are embedded in the main graph JSON using the 50-79 ID range. Consider splitting variants into separate graph files for cleaner tooling.

13. [ ] **Graph visualization tooling**
The JSON graph format is machine-readable but has no rendering pipeline. Consider adding a script or tool that generates visual diagrams (e.g., Mermaid, D3, Graphviz) from the graph JSONs.

14. [X] **CLAUDE.md update**
CLAUDE.md was written before the folder restructure and before goal_1 completion. Update it to reflect the current project state, file locations, and completed deliverables.

---

## Enhancements

15. [ ] **Scene-level beat sheets**
Extend archetype graphs to scene-level resolution for specific example works — mapping each node/edge to specific scenes with timestamps or page numbers. Currently excluded per `v0_plan.md` §2.2.

16. [ ] **Interactive story planner**
Build a web-based tool that lets a writer select an archetype and genre, then walks them through the combined graph as a planning scaffold. Requires graph visualization (#13) and the genre × archetype matrix (goal 2, phase 15) as prerequisites.

17. [ ] **Non-Western archetype analysis**
The current 15 archetypes draw primarily from Western storytelling traditions. Research and potentially add archetypes from East Asian, South Asian, African, Indigenous, and Middle Eastern narrative traditions.

18. [ ] **Audience-facing genre depth selector**
Build a tool that lets a writer drill down through the five genre levels interactively, making constraint choices at each level and producing a tailored constraint sheet for their project.

19. [ ] **Cross-medium adaptation mapping**
Analyze how archetype graphs shift when a story moves between mediums (novel → film → TV series → game). Document which nodes compress, expand, or change role.

20. [ ] **Quantitative validation against a story corpus**
Test the archetype and genre graphs against a corpus of actual stories (e.g., 100 films, 100 novels) to measure coverage, identify missing patterns, and validate the controlled vocabularies empirically.

21. [ ] **Genre blending/hybridization model**
Many stories operate in two or more genres simultaneously (e.g., Sci-Fi + Thriller, Romance + Comedy, Horror + Mystery). Model how genre constraint graphs compose, which constraints dominate in conflicts, and which subgenre combinations are structurally stable vs. unstable.

22. [ ] **Narrative spec variant walkthrough expansion**
Each narrative spec currently includes 3–4 variant walkthroughs. Consider expanding to cover every subgenre path in every genre, ensuring complete coverage of all Level 3 nodes.

23. [ ] **Genre constraint severity weighting**
Not all constraints carry equal weight. Some are hard requirements (violating them breaks the genre), others are soft expectations (deviating is uncommon but valid). Consider adding a severity field to nodes/edges to distinguish must-have from should-have constraints.

24. [ ] **Tone marker integration with archetype graphs**
Genre tone markers (e.g., sustained dread for Horror, stoic and spare for Western) interact with archetype emotional arcs but this interaction is currently unmodeled. The genre × archetype matrix (Phase 15) could include tone compatibility notes.
