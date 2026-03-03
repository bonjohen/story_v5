# Specification: Interactive Visual Graph Interface

*For Archetype Time Graphs and Genre Depth Graphs*

---

## 1. Objective

Design and implement a high-fidelity, exploratory visual interface that renders:

* **Archetype Graphs** (temporal progression models)
* **Genre Depth Graphs** (constraint refinement hierarchies)

The system must:

* Be interactive, fluid, and scalable.
* Support structural reasoning, not just visualization.
* Operate directly from the existing graph JSON files.
* Function as both an **educational tool** and a **structural diagnostic tool**.

This is not a static graph viewer. It is a **narrative structure exploration engine**.

---

## 2. Core Design Philosophy

### 2.1 Dual Mental Models

The system supports two distinct visual metaphors:

| Type      | Primary Axis | Mental Model                       |
| --------- | ------------ | ---------------------------------- |
| Archetype | Time         | Left → Right narrative progression |
| Genre     | Depth        | Top → Bottom constraint refinement |

These must feel different while sharing the same rendering engine.

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
Graph JSON
     ↓
Graph Normalizer
     ↓
Graph Engine (stateful)
     ↓
Layout Engine (Archetype | Genre mode)
     ↓
Rendering Engine (WebGL / Canvas)
     ↓
Interaction Layer
     ↓
Analysis Layer
```

---

## 4. Functional Requirements

## 4.1 Graph Rendering

### Required Capabilities

* Directed edges with arrowheads
* Edge labels (hover or inline)
* Node expansion/collapse
* Variant path highlighting
* Loop rendering (visually distinct)
* Terminal node styling
* Branch visual clarity (no overlapping chaos)

### Archetype Layout

* Horizontal primary axis (time)
* Progressive color gradient across time
* Optional swimlanes for:

  * Protagonist
  * Antagonist
  * Stakes escalation
  * Internal transformation

### Genre Layout

* Vertical refinement stack (Level 1 → Level 5)
* Progressive narrowing width to represent constraint reduction
* Subgenre branching clearly shown
* Scene obligations grouped at bottom tier

---

## 5. Interaction Model

### 5.1 Node Interaction

On node click:

* Expand detailed panel with:

  * Definition
  * Entry conditions
  * Exit conditions
  * Failure modes
  * Signals in text
  * Example mappings

Panel must be dockable, collapsible, and searchable.

---

### 5.2 Edge Interaction

On edge hover:

* Show:

  * Meaning
  * Preconditions
  * Effects on stakes
  * Effects on character
  * Common alternatives
  * Anti-patterns

Option to “trace forward” or “trace backward” causality.

---

### 5.3 Path Simulation Mode

User selects a start node.

System:

* Allows step-by-step traversal.
* Animates transitions.
* Highlights stakes escalation.
* Tracks structural completeness.

For archetypes:

* Show transformation curve overlay.

For genres:

* Show constraint narrowing meter.

---

### 5.4 Variant Toggle Mode

Toggle between:

* Canonical path
* Variant A
* Variant B
* Failure mode path

Graph animates structural differences.

---

### 5.5 Example Mapping Overlay

Toggle “Example Mode”:

* Nodes glow when mapped to example work.
* Edge transitions annotated with example scenes.
* Can compare two examples simultaneously.
* Structural divergence visualization.

---

## 6. Advanced Analytical Features

### 6.1 Structural Integrity Checker

For any loaded story draft (future feature):

* User tags story beats.
* System maps beats to graph nodes.
* Highlights:

  * Missing structural nodes
  * Weak transitions
  * Redundant loops
  * Premature climax

---

### 6.2 Archetype ↔ Genre Overlay Mode

Load:

* One archetype
* One genre

System overlays:

* Temporal progression
* Constraint refinement

Shows tension points such as:

* Archetype demands escalation
* Genre constraints restrict escalation

Visually display compatibility pressure.

---

### 6.3 Comparative Mode

Split-screen:

* Archetype A vs Archetype B
* Genre A vs Genre B
* Same archetype across two example works

Edge density and branching complexity comparison metrics.

---

## 7. Visual Design Requirements

### 7.1 Design Language

* Dark-first UI with high contrast.
* Soft gradients across time/depth.
* Subtle motion (not distracting).
* Minimalist typography.
* Zero visual clutter.

---

### 7.2 Node Styling

Node types must be visually distinct:

| Type         | Visual Treatment |
| ------------ | ---------------- |
| Start        | Solid green      |
| Transition   | Neutral          |
| Escalation   | Orange           |
| Revelation   | Blue             |
| Irreversible | Red border       |
| Terminal     | Gold             |

---

### 7.3 Edge Styling

| Edge Meaning | Visual Cue           |
| ------------ | -------------------- |
| Escalation   | Increasing thickness |
| Constraint   | Dashed narrowing     |
| Revelation   | Glow pulse           |
| Loop         | Curved arc           |

---

## 8. Performance Requirements

* Must render graphs up to 200 nodes smoothly.
* 60fps interaction target.
* GPU-accelerated rendering (WebGL preferred).
* Lazy-load expanded metadata.
* Deterministic layout (same JSON → same visual).

---

## 9. Technology Stack Recommendations

Frontend:

* React + TypeScript
* Zustand or Redux (state)
* WebGL via:

  * PixiJS or
  * Three.js (2D mode) or
  * Sigma.js for graph layout
* D3 for layout calculations only (not rendering)

Optional:

* Graphology for graph structure
* Cytoscape.js if rapid prototyping preferred

---

## 10. File and Folder Structure

```
/app
  /components
  /graph-engine
  /layout
  /render
  /panels
  /analysis
/data
  /archetypes
  /genres
/docs
```

---

## 11. Accessibility Requirements

* Keyboard navigation
* Zoom and pan support
* Screen-reader metadata for nodes
* High-contrast mode
* Reduced-motion toggle

---

## 12. Non-Goals (Current Version)

* AI-assisted story drafting
* Automatic trope generation
* Publishing export tools
* Mobile-first optimization
* Collaboration features

---

## 13. Success Criteria

The system is successful when:

* A user can visually understand an archetype’s progression in under 60 seconds.
* A user can visually understand genre constraint refinement in under 60 seconds.
* Variant paths are clearly differentiated.
* Structural differences between two examples are visible at a glance.
* The interface feels like a “narrative debugger,” not a diagram viewer.

---

## 14. Stretch Goals (Future Versions)

* 3D narrative space visualization.
* Archetype morphing animation.
* Constraint heatmap visualization.
* Interactive “What if?” structural experimentation.
* AI-powered draft analysis overlay.

---

## 15. Summary

This interface must function as:

* A visual narrative laboratory.
* A structural debugger.
* A teaching instrument.
* A drafting companion.
* A graph-native storytelling engine.

It must be intellectually serious, technically elegant, and visually compelling.

Anything less is a diagram viewer.
