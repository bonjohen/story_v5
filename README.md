# Story Structure Explorer

Interactive graph-based narrative structure exploration engine with story generation pipeline. Models storytelling structures as formal directed graphs: 15 archetype graphs (story progression) and 27 genre depth graphs (genre constraints), then uses them to generate constraint-correct stories.

**Live demo**: [bonjohen.github.io/story_v5](https://bonjohen.github.io/story_v5/)

## Features

- **42 directed graphs** — 15 archetype story structures + 27 genre constraint hierarchies
- **Story generation** — Two paths: "Build Structure" (deterministic, no LLM) or "Generate Story" (full LLM pipeline via Claude Code CLI)
- **Editable entities** — CRUD for characters, places, and objects with traits, motivations, and relationships
- **Graph analysis** — Interactive Cytoscape.js canvases with node/edge detail, trace navigation, statistics, cross-index
- **Author surfaces** — Story workspace, scene board, timeline, encyclopedia, manuscript editor, notes
- **41 walkthrough scripts** — TTS-enabled audio guides covering the entire system
- **SQLite data layer** — Browser-side metadata store with vocabulary templatization and import bridges
- **12 cross-referencing datasets** — Genre-archetype matrix, emotional arcs, hybrid patterns, corpus validation

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm

### Install and Run

```bash
cd app
npm install

# Create the data symlink (required for local development)
cd public
# Linux/macOS:
ln -s ../../data/ data
# Windows (run as admin):
mklink /D data ..\..\data

cd ../..

# Start dev server (auto-starts LLM bridge)
cd app
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
cd app
npm run build
```

The build copies `data/` into `app/public/data/` automatically via the `prebuild` script, so the symlink is only needed for local development.

### Type Check

```bash
cd app
npx tsc -b
```

## Project Structure

```
data/
  archetypes/          15 archetype graphs (graph.json, narrative.md, examples.md)
  genres/              27 genre graphs (graph.json, narrative.md, examples.md)
  scripts/             41 walkthrough scripts + manifest.json
  cross_references/    12 cross-referencing datasets
  vocabulary/          Controlled vocabularies and ID conventions

app/src/
  generation/          Story generation pipeline (5-tab UI, engines, agents, stores)
  components/          Reusable UI (AppShell, NavDrawer, Disclosure, GraphSearch)
  render/              Cytoscape graph canvas and styles
  instance/            Story workspace (entity editors, lore, system maps)
  manuscript/          Manuscript editor (chapter binder, diff view)
  sceneboard/          Scene board (card lanes, drag reorder)
  timelineview/        Timeline (swim lanes, dependency edges)
  encyclopedia/        Auto-generated lore articles
  notes/               Notes system (tags, entity linking, backlinks)
  scripts/             Walkthrough script pages and TTS engine
  db/                  SQLite data layer (sql.js/WASM)

docs/                  Design docs and archived plans
```

See [`app/README.md`](app/README.md) for detailed data model documentation and [`CLAUDE.md`](CLAUDE.md) for full conventions.
