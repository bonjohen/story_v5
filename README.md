# Story Structure Explorer

Interactive graph-based narrative structure exploration engine. Models storytelling structures as formal directed graphs: 15 archetype graphs (story progression) and 27 genre depth graphs (genre constraints).

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

# Start dev server
cd app
npm run dev
```

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

See `CLAUDE.md` for full repository structure and conventions.
