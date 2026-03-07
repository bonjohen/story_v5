# User Interface Upgrade Plan

The current UI shows too much at once. Every panel, tab, toolbar button, and graph is visible simultaneously, creating cognitive overload and poor mobile usability. This plan restructures the interface around **progressive disclosure** — show only what the user needs at each moment, and let them reveal more on demand.

Usage: Mark `[~]` before working, `[X]` when done. One active item at a time.

---

## Current Problems

1. **Toolbar clutter**: 8 navigation buttons (Story, Scenes, Timeline, Encyclopedia, Manuscript, Notes, Scripts, DB) + search + export + settings — all visible at once, overflowing on mobile.
2. **Generation panel always visible**: the 340px left panel is always rendered, consuming ~30% of viewport width even when the user is just browsing graphs.
3. **Info panel tab explosion**: up to 14 tabs (Pairing, Detail, Stats, X-Index, Elements, Timeline, Arcs, Templates, Contract, Backbone, Plan, Story, Checks, Chapters) — no grouping, no way to hide irrelevant ones.
4. **Dual graph canvases always shown**: archetype + genre graphs side-by-side, halving available space even when only one is relevant.
5. **No mobile layout**: fixed widths (340px gen panel), side-by-side graphs, tiny tab text, and pointer-dependent separators don't work on touch devices.
6. **No collapsible sections**: panels are either visible or not — no accordion/disclosure pattern for dense content within panels.
7. **Inconsistent navigation**: some pages use the toolbar buttons, others use AppNav breadcrumbs. No unified shell.

---

## Design Principles

- **Hide by default, reveal on demand** — start with the minimum viable view; let users expand what they need.
- **One primary focus** — at any moment, only one major content area (graph, generation, story, etc.) occupies the viewport.
- **Mobile-first layout** — stack vertically on small screens, use drawers/sheets instead of fixed sidebars.
- **Persistent but minimal chrome** — a slim top bar with hamburger menu replaces the toolbar button row.
- **Remember preferences** — collapsed/expanded state persists via Zustand/localStorage.

---

## Phase 1 — Collapsible Navigation Shell

Replace the toolbar button row with a hamburger menu and slim app bar.

- [X] **1.1** Create `app/src/components/AppShell.tsx` — slim top bar (title + hamburger + status indicators) replacing the current toolbar header.
- [X] **1.2** Create `app/src/components/NavDrawer.tsx` — slide-out navigation drawer with grouped links: **Explore** (Structure Explorer), **Create** (Story, Scenes, Timeline, Manuscript), **Reference** (Encyclopedia, Scripts, Notes), **System** (DB, Settings, Export). Drawer closes on navigation.
- [X] **1.3** `app/src/store/uiStore.ts` — new Zustand store for UI preferences: `navOpen`, `genPanelOpen`, `infoPanelOpen`, `activeView`, `collapsedSections`. Persisted to localStorage.
- [X] **1.4** `app/src/App.tsx` — replaced toolbar buttons with `AppShellBar`. Navigation moved to `NavDrawer`. Generation panel toggled via "Generate" button. Removed `toolbarButtonStyle`, `useNavigate`.
- [X] **1.5** `app/src/index.css` — added `slideInLeft` animation for drawer.

---

## Phase 2 — Collapsible Generation Panel

Make the generation panel a toggleable sidebar instead of always-visible.

- [X] **2.1** `app/src/App.tsx` — generation panel wrapped in conditional render, toggled via `genPanelOpen` from uiStore. Default: collapsed.
- [X] **2.2** AppShell bar has "Generate" toggle button with status badges (running=amber pulse, completed=green dot).
- [X] **2.3** Mobile gen panel: fixed bottom sheet overlay with slideUp animation, 55vh max-height, rounded top corners.
- [X] **2.4** LLM Backend section wrapped in `Disclosure` component, collapsed by default, shows "bridge" badge when active.
- [X] **2.5** Gen sub-tabs (Contract, Plan, Map, Checks, Story) only render when their data exists. Run tab always visible.

---

## Phase 3 — Info Panel Simplification

Group the 14 info tabs into collapsible sections and hide empty ones.

- [X] **3.1** Replace flat tab bar with grouped accordion sections: **Graph** (Detail, Stats, Elements, X-Index), **Visualization** (Timeline, Arcs, Pairing), **Generation** (Templates, Contract, Backbone, Plan, Story, Checks, Chapters).
- [X] **3.2** Each accordion section shows item count badge and collapses to a single header line. Generation group only appears when generation has produced artifacts.
- [X] **3.3** Within each section, render content inline (no inner tabs) — each sub-panel is a collapsible disclosure widget with a header.
- [ ] **3.4** On mobile, info panel becomes a bottom sheet (swipe up to expand, swipe down to minimize). Replace drag separator with sheet handle.
- [X] **3.5** Remember which sections are expanded/collapsed in `uiStore`.

---

## Phase 4 — Single-Graph Focus Mode

Show one graph at a time instead of forcing side-by-side.

- [X] **4.1** Default to showing only the active graph (archetype or genre) at full width. Add a toggle to switch between them (segmented control in the graph header).
- [X] **4.2** Optional split view: a "Compare" toggle restores the side-by-side layout for users who want it. Default off.
- [X] **4.3** On mobile, only single-graph mode is available. The toggle is a simple archetype/genre tab.
- [X] **4.4** Graph header: merge the label bar into a compact strip — graph type badge + name + node/edge count. Remove redundant "Select from the Generate panel" placeholder.

---

## Phase 5 — Mobile Touch Optimization

Ensure all interactions work well on touch devices.

- [X] **5.1** `app/src/index.css` — increase all interactive element min-heights to 44px on mobile. Add touch-action rules. Increase font sizes for labels/tabs.
- [X] **5.2** Replace pointer-dependent drag separator with hidden separator on mobile + CSS size classes for info panel.
- [X] **5.3** Graph canvas: pinch-to-zoom already enabled via Cytoscape. Added floating zoom +/−/Fit buttons for accessibility.
- [X] **5.4** Toolbar search: on mobile, search expands into a full-width overlay via `focus-within` on `.graph-search`.
- [X] **5.5** Generation panel form: stack all fields vertically on mobile. Increase textarea and select heights for touch.

---

## Phase 6 — Disclosure Widgets Within Panels

Add expand/collapse to dense content sections inside panels.

- [X] **6.1** `app/src/components/Disclosure.tsx` — reusable collapsible section component with header, chevron, content, and optional badge. Remembers state via key in uiStore.
- [X] **6.2** `ContractPanel` — already has accordion-style SectionHeader pattern (single-open). No change needed.
- [X] **6.3** `PlanPanel` — already groups scenes by beat with expandable content. No change needed.
- [X] **6.4** `StoryPanel` — wrapped individual scenes in Disclosure with scene ID + word count badge.
- [X] **6.5** `DetailPanel` — converted CollapsibleSection to use shared Disclosure component with persistent state.

---

## Phase 7 — Sub-Page Consistency

Ensure all routes (Story, Scenes, Timeline, etc.) use the same shell and patterns.

- [X] **7.1** Wrap all route pages (`StoryWorkspace`, `SceneBoardPage`, `TimelinePage`, `EncyclopediaPage`, `ManuscriptPage`, `NotesPage`, `DbManagementPage`, `ScriptBrowserPage`, `SeriesBrowserPage`, `SeriesDashboardPage`, `EpisodeCurationPage`) in `AppShellBar` with hamburger navigation and page title.
- [X] **7.2** Each sub-page gets a consistent header: page title + optional action buttons. No duplicate navigation.
- [X] **7.3** Removed per-page back buttons/breadcrumbs. NavDrawer provides all navigation.
- [ ] **7.4** On mobile, sub-pages scroll naturally (no fixed-height constraint). Only the graph explorer uses the fixed viewport layout.

---

## Phase 8 — Polish and Verify

- [X] **8.1** Audit all panels for orphaned visible-by-default content. Gen panel hidden by default, info panel uses accordion groups, single graph mode default.
- [ ] **8.2** Test on mobile viewport (375px width) — every screen must be usable without horizontal scrolling.
- [ ] **8.3** Test on tablet viewport (768px) — verify drawer/sidebar transitions work at the breakpoint.
- [X] **8.4** Run `npx tsc -b` — zero errors.
- [X] **8.5** Run `npx vitest run` — no new test failures (1 pre-existing TTS mock issue in ContractPanel).
- [X] **8.6** Update `CLAUDE.md` with new UI architecture notes.

---

## Scope

| Phase | Items | Focus |
|-------|-------|-------|
| 1 — Collapsible Navigation Shell | 5 | Replace toolbar clutter with hamburger + drawer |
| 2 — Collapsible Generation Panel | 5 | Hide gen panel until needed |
| 3 — Info Panel Simplification | 5 | Group 14 tabs into accordion sections |
| 4 — Single-Graph Focus Mode | 4 | One graph at a time by default |
| 5 — Mobile Touch Optimization | 5 | Touch targets, gestures, responsive layout |
| 6 — Disclosure Widgets | 5 | Collapse dense content within panels |
| 7 — Sub-Page Consistency | 4 | Unified shell across all routes |
| 8 — Polish and Verify | 6 | Audit, test, document |
| **Total** | **39** | |
