# jCodeMunch Integration Details

**Date**: 2026-03-09
**Guide**: `docs/JCODEMUNCH_INTEGRATION_GUIDE.md`
**Performed by**: Claude Code (automated)

---

## Pre-flight Checks

### 1. Prerequisites

| Check | Result |
|---|---|
| `uv --version` | `uv 0.9.7 (0adb44480 2025-10-30)` |
| `uvx --version` | `uvx 0.9.7 (0adb44480 2025-10-30)` |

Both `uv` and `uvx` were already installed. No action needed.

### 2. Existing Configuration

- **`~/.claude.json`**: No MCP servers registered (all project-level `mcpServers` blocks were empty `{}`).
- **`.claude/settings.json`** (project-level): Did not exist for `C:\Projects\story_v5`.
- **Prior `jcodemunch` reference**: `~/.claude.json` contained a project entry for `C:/Projects/jcodemunch` (a previously visited project directory), but no MCP server registration.
- **`.claudeignore`**: Does not exist for this project.

---

## Installation Steps

### Step 1: Initial Registration (project-local scope)

**Command**:
```bash
claude mcp add jcodemunch uvx jcodemunch-mcp
```

**Response**:
```
Added stdio MCP server jcodemunch with command: uvx jcodemunch-mcp to local config
File modified: C:\Users\boen3\.claude.json [project: C:\Projects\story_v5\app]
```

**Annotation**: The guide's command (`claude mcp add jcodemunch uvx jcodemunch-mcp`) defaults to `--scope local`, which registers the server only for the current project (`C:/Projects/story_v5/app`). This does **not** make it available globally as the guide implies. The registration was written into the project-specific section of `~/.claude.json`.

### Step 2: Global Registration (user scope)

**Command**:
```bash
claude mcp add --scope user jcodemunch uvx jcodemunch-mcp
```

**Response**:
```
Added stdio MCP server jcodemunch with command: uvx jcodemunch-mcp to user config
File modified: C:\Users\boen3\.claude.json
```

**Annotation**: The `--scope user` flag writes the MCP server to the top-level `mcpServers` key in `~/.claude.json`, making it available across all projects. This is what the guide intended. The guide's command is missing the `--scope user` flag — without it, registration is project-local only.

### Step 3: Remove Project-Local Duplicate

Since the user-scope registration covers all projects, the project-local duplicate was removed to avoid redundancy.

**Command**:
```bash
claude mcp remove --scope local jcodemunch
```

**Response**:
```
Removed MCP server jcodemunch from local config
File modified: C:\Users\boen3\.claude.json [project: C:\Projects\story_v5\app]
```

---

## Package Resolution

**Command**:
```bash
uvx jcodemunch-mcp --help
```

**Response**:
```
Downloading cryptography (3.3MiB)
Downloading tree-sitter-language-pack (16.1MiB)
Downloading pywin32 (9.1MiB)
Downloading pydantic-core (1.9MiB)
Installed 39 packages in 579ms
usage: jcodemunch-mcp [-h] [-V] [--log-level {DEBUG,INFO,WARNING,ERROR}]
                      [--log-file LOG_FILE]

Run the jCodeMunch MCP stdio server.

options:
  -h, --help            show this help message and exit
  -V, --version         show program's version number and exit
  --log-level {DEBUG,INFO,WARNING,ERROR}
                        Log level (also via JCODEMUNCH_LOG_LEVEL env var)
  --log-file LOG_FILE   Log file path (also via JCODEMUNCH_LOG_FILE env var).
```

**Annotation**: `uvx` downloaded and installed 39 packages on first run, including `tree-sitter-language-pack` (16.1 MiB) for AST parsing and `cryptography` (3.3 MiB). The package resolved and ran successfully. These are cached by `uv` and will not re-download on subsequent invocations.

---

## Verification

### MCP Server Health Check

**Command**:
```bash
claude mcp list
```

**Response**:
```
Checking MCP server health...

claude.ai Google Calendar: https://gcal.mcp.claude.com/mcp - ! Needs authentication
claude.ai Gmail: https://gmail.mcp.claude.com/mcp - ! Needs authentication
jcodemunch: uvx jcodemunch-mcp - ✓ Connected
```

**Status**: jcodemunch is connected and healthy.

### Final Configuration State

**`~/.claude.json`** (relevant excerpt):
```json
{
  "mcpServers": {
    "jcodemunch": {
      "type": "stdio",
      "command": "uvx",
      "args": ["jcodemunch-mcp"],
      "env": {}
    }
  }
}
```

The server is registered at user scope (top-level `mcpServers`), available to all projects.

---

## Guide Corrections / Notes

| Issue | Detail |
|---|---|
| **Missing `--scope user`** | The guide's quick-start command `claude mcp add jcodemunch uvx jcodemunch-mcp` defaults to `--scope local` (project-only). For global availability, `--scope user` is required. |
| **Config file path** | The guide says registration goes to `~/.claude.json`, which is correct, but doesn't clarify that without `--scope user` it writes to a project-specific section within that file, not the global section. |
| **No `.claudeignore`** | The guide recommends excluding `node_modules/`, `.venv/`, `dist/`, `build/` via `.claudeignore`. This project does not currently have one. Consider creating it if indexing performance is an issue. |
| **No env vars configured** | `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` were not set. These are optional — core indexing and retrieval work without them. AI-generated summaries require `ANTHROPIC_API_KEY`. |

---

## What the User Needs to Do

1. **Restart Claude Code** — The MCP server registration will take effect in the next session. The current session cannot pick up new MCP tools mid-conversation.
2. **Optional**: Create a `.claudeignore` at the project root if index performance is a concern (this project has `node_modules/` and `dist/` which tree-sitter would attempt to parse).

---

## Summary

| Step | Status |
|---|---|
| uv/uvx installed | Already present |
| jcodemunch-mcp package resolves | Verified (39 packages) |
| Global MCP registration (`--scope user`) | Done |
| Health check (`claude mcp list`) | Connected |
| Claude Code restart | **Required** (user action) |
