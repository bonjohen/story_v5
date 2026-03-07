Composition System: Genre Blends & Hybrid Archetypes                                                  
  The composition system lets a story draw from two genres (blend) and/or two archetypes (hybrid)     
  simultaneously, rather than being locked to a single genre + single archetype.                      

  Data Layer

  Two corpus JSON files in data/cross_references/ provide the reference data:

  hybrid_archetype_patterns.json — 12 documented hybrid patterns (pairs of archetypes that commonly   
  co-occur). Each entry specifies:
  - archetypes: the pair, e.g. ["01_heros_journey", "03_the_quest"]
  - frequency: how common the combination is (very_common, common, occasional)
  - shared_roles: archetype node roles both graphs have in common (e.g. Origin, Trial, Crisis)        
  - divergence_point: the structural role where the two arcs split — where a single story beat can't  
  serve both arcs identically
  - composition_method: how the two arcs combine structurally:
    - parallel_track — both run simultaneously (e.g. Quest external spine + Hero's Journey internal   
  arc)
    - sequential_override — one arc dominates early, the other takes over later
    - nested — one arc is embedded inside the other
    - alternating_dominance — scenes alternate which arc drives
  - structural_tensions: known friction points when combining
  - example_works: real published works that demonstrate this hybrid

  genre_blending_model.json — 18 blend patterns (pairs of genres). Each entry specifies:
  - genres: the pair, e.g. ["10_horror", "03_comedy"]
  - stability: stable / conditionally_stable / unstable
  - dominant_genre: which genre's constraints take priority
  - compatible_constraints: where the two genres reinforce each other
  - conflicting_constraints: where they clash, with a resolution strategy for each conflict
  - tone_synthesis: how the two tones combine
  - resolution_strategy: high-level guidance for making the blend work

  Types (generation/artifacts/types.ts)

  Key types:
  - RequestConstraints — allow_genre_blend, allow_hybrid_archetype, preferred_blend_genre,
  preferred_hybrid_archetype
  - GenreBlendSelection — result of blend selection: enabled, secondary_genre, pattern_id, stability, 
  dominance, rationale
  - HybridArchetypeSelection — result of hybrid selection: enabled, secondary_archetype, pattern_id,  
  frequency, shared_roles, divergence_point, composition_method
  - SelectionResult — includes both genre_blend and hybrid_archetype fields
  - BeatHybridInfo — per-beat annotation on backbone beats: secondary_archetype_id, shared (is this   
  role in both arcs?), divergence_beat (is this the split point?), composition_method
  - CompositionDefaults in GenerationConfig — allow_blend and allow_hybrid defaults

  UI (GenerationPanel.tsx + requestStore.ts)

  The Generation Panel exposes two checkboxes with optional dropdowns:

  1. Genre Blend checkbox — when checked, shows a dropdown to pick the secondary genre (or
  "Auto-select best match"). Stored as allowBlend + blendGenre in requestStore.
  2. Hybrid Archetype checkbox — when checked, shows a dropdown to pick the secondary archetype.      
  Stored as allowHybrid + hybridArchetype in requestStore.

  These values persist across tab switches via Zustand's persist middleware.

  Selection Engine (selectionEngine.ts)

  The selection engine (no LLM, pure computation) processes the request:

  - selectGenreBlend() — if allow_genre_blend is true:
    - If a preferred blend genre is specified, looks for a matching BlendPattern in the blending model
    - Otherwise, finds all blend patterns involving the primary genre, filters out unstable ones,     
  picks the first viable match
    - Returns a GenreBlendSelection with the secondary genre, pattern ID, stability rating, and       
  resolution rationale
  - selectHybridArchetype() — if allow_hybrid_archetype is true:
    - If a preferred hybrid is specified, looks for a matching HybridPattern
    - Otherwise, finds all hybrid patterns for the primary archetype, sorted by frequency (most common
   first)
    - Returns a HybridArchetypeSelection with composition method, shared roles, divergence point, etc.

  Both functions fall back gracefully: if the user's preferred pairing has no known pattern, they     
  still enable the selection but use sensible defaults.

  Planner (planner.ts)

  The planner uses hybrid archetype selection to annotate beats:

  - If selection.hybrid_archetype.enabled, it resolves the secondary archetype's graph, identifies    
  shared roles and the divergence point role
  - For each beat it emits, it attaches a BeatHybridInfo annotation:
    - shared: true if the beat's role (e.g. "Trial") exists in both archetype graphs
    - divergence_beat: true if this is where the arcs split
    - composition_method from the selection

  This means downstream stages (writer, validator) can see which beats serve both arcs and which are  
  specific to one, enabling appropriate prose and validation.

  Series System (seriesManager.ts)

  The series manager uses genre blending for episode-level genre accents:

  - getCompatibleAccents() — given a series' primary genre, queries the blending model for all genres 
  that have a known blend with it, returns them sorted by stability (stable first)
  - isAccentCompatible() — checks if a specific accent genre is compatible with the primary, returns  
  warnings if the blend is unstable

  This allows individual episodes in a series to have genre accent variation (e.g., a Fantasy series  
  where one episode leans into Horror elements) while respecting documented stability constraints.    

  What Doesn't Use It Yet

  The contract compiler, template compiler, and backbone assembler don't currently consume
  blend/hybrid data. The blend selection influences the selection result (which feeds the planner),   
  and the hybrid annotations flow through beats, but the genre blend's constraint merging isn't       
  implemented at the contract level — the contract currently uses only the primary genre's
  constraints.

✻ Churned for 7m 39s · 1 background task still running (↓ to manage)

● Agent "Research composition/blend/hybrid functionality" completed

● The research agent finished and confirmed what I already covered above. One additional detail it      found that I should add:
                                                                                                        Feedback Loop in App.tsx                                                                            
                                                                                                      
  There's a useEffect in App.tsx (around lines 89-117) that monitors the SelectionResult from the     
  generation store. When the selection engine auto-selects a blend or hybrid (because the user checked
   the box but left the dropdown on "Auto-select"), the result is synced back to the requestStore     
  dropdowns so the user can see what was chosen. This converts directory IDs back to display names    
  using the manifest.

  Default Configuration

  In GenerationPanel.tsx, the default config has:
  - allow_blend: true — blends are enabled by default in the config
  - allow_hybrid: false — hybrids require explicit opt-in

  However, in the requestStore initial state, both allowBlend and allowHybrid default to false, so the
   user must check the boxes in the UI to activate either feature.

  What's Wired vs. Not Yet Consumed

  The composition system is fully wired through these stages:
  1. UI (checkboxes + dropdowns) -> requestStore (persisted form state)
  2. StoryRequest (constraints) -> selectionEngine (deterministic corpus lookup)
  3. SelectionResult (blend + hybrid choices) -> planner (beat-level hybrid annotations)
  4. SelectionResult -> App.tsx (feedback to UI)
  5. Series system uses blend data for episode-level genre accent variation

  The contract compiler, template compiler, and backbone assembler do not currently consume
  blend/hybrid data. The genre blend's constraint merging (e.g., combining hard constraints from two  
  genre graphs) isn't implemented at the contract level — the contract uses only the primary genre's  
  constraint graph. Similarly, the backbone assembler doesn't incorporate secondary archetype
  structure. The hybrid annotations on beats are available for the writer/validator stages but those  
  are LLM-driven and receive the annotations as context rather than enforcing them programmatically.  