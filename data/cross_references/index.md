# Cross-Reference Data

This folder contains the cross-referencing datasets and corpus-level metadata that connect the 42 graph deliverables (15 archetypes + 27 genres) to each other and to external works.

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Corpus inventory: lists every archetype and genre graph with node/edge counts, used by the viewer to populate the graph selector sidebar. |
| `genre_archetype_matrix.json` | 27 x 15 compatibility matrix. Each genre-archetype pairing is classified as *naturally compatible*, *occasionally compatible*, or *rarely compatible* with rationale. |
| `cross_archetype_index.json` | Maps which node roles and edge meanings are shared across the 15 archetypes. Shows that "Origin" and "Resolution" are universal (all 15) while "Descent" appears in only 4. |
| `cross_genre_constraint_index.json` | Maps recurring constraint types across all 27 genres. Identifies 16 shared patterns like "Stakes Escalation" (8 genres) and "Internal Consistency" (7 genres). |
| `archetype_emotional_arcs.json` | Quantitative emotional trajectory for each archetype: tension, hope, fear, and resolution scored 0-1 at each node along the spine. Classified by arc shape (U-curve, inverted-U, W-curve, etc.). |
| `hybrid_archetype_patterns.json` | 12 common hybrid patterns where two archetypes co-occur in a single work. Documents shared roles, divergence points, composition methods, and structural tensions. |
| `tone_archetype_integration.json` | 405 pairings (27 tone markers x 15 archetypes) classified as reinforcing, contrasting, or neutral. Models how genre tone interacts with archetype emotional trajectory. |
| `genre_blending_model.json` | 18 genre blend patterns documenting constraint dominance, compatible/conflicting rules, tone synthesis, and stability (stable, conditionally-stable, unstable). |
| `example_works_registry.json` | Registry of 107 real works (novels, films, plays, games) referenced across archetype and genre examples. Each work lists which graphs reference it and in what role. |
| `non_western_archetype_analysis.json` | 10 non-Western narrative archetypes from East Asian, South Asian, African, Indigenous American, and Middle Eastern traditions. Maps cognates and divergences from the Western 15. |
| `cross_medium_adaptation.json` | Analysis of 6 works adapted between mediums (novel to film, film to game, etc.). Documents which nodes compress, expand, or change role in each medium transition. |
| `element_role_index.json` | Cross-archetype analysis of story element usage. Maps which character roles, place types, and object types appear across all 15 archetypes, showing that protagonist/antagonist are nearly universal while herald and comic relief are archetype-specific. |
| `corpus_validation.json` | Quantitative validation of graph coverage against a 50-work corpus. Mean archetype coverage: 87%, mean genre coverage: 82%. |

## Usage

These files are consumed by:
- **Interactive Viewer** — The manifest populates the sidebar; cross-indices power the Cross-Index panel; the matrix feeds the compatibility display.
- **Story Generation Pipeline** — The corpus loader reads all cross-reference files to score genre-archetype compatibility, resolve hybrid/blend patterns, and set emotional arc targets.
- **Validation Scripts** — `validate_corpus.ts` checks structural integrity of the matrix, arcs, and blending model.
