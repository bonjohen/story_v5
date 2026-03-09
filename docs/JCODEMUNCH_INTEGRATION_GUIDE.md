# jCodeMunch Integration Guide for Claude Code

## Overview

jCodeMunch is a token-efficient MCP (Model Context Protocol) server that uses tree-sitter AST parsing to index and retrieve code by symbol. This dramatically reduces Claude's token usage (up to 99% savings) across all Claude Code projects.

## Quick Start: Default Integration

### Installation (One Command)

Register jCodeMunch globally so it's available in all Claude Code projects:

```bash
claude mcp add jcodemunch uvx jcodemunch-mcp
```

This command:
- Registers the MCP server in `~/.claude.json`
- Makes jCodeMunch available across all projects by default
- Requires **no per-project configuration**

**After running this, restart Claude Code for changes to take effect.**

### What Gets Registered

The global registration creates an entry in your Claude configuration that all projects inherit. Each project can optionally override settings in its local `.claude/settings.json`.

---

## Project-Level Configuration

If you need project-specific settings, create or modify `.claude/settings.json`:

```json
{
  "mcp_servers": {
    "jcodemunch": {
      "command": "uvx",
      "args": ["jcodemunch-mcp"],
      "env": {
        "JCODEMUNCH_INDEX_PATH": "./.claude/jcodemunch-index",
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### Configuration Options

| Environment Variable | Purpose | Required |
|---|---|---|
| `JCODEMUNCH_INDEX_PATH` | Where to store the code index | No (default: `.claude/jcodemunch-index`) |
| `GITHUB_TOKEN` | Access private repositories and increase rate limits | No |
| `ANTHROPIC_API_KEY` | Enable AI-generated code summaries | No |

---

## Integration with Local Open Source Models

### Setup for Local Models (Ollama, LM Studio, Mistral, Llama)

jCodeMunch's core functionality (indexing and retrieval) works independently of which model you use. To use it with local models:

#### 1. Configure Claude Code for Local Model

Create or update `.claude/settings.json`:

```json
{
  "model": "local",
  "apiBaseUrl": "http://localhost:11434",
  "mcp_servers": {
    "jcodemunch": {
      "command": "uvx",
      "args": ["jcodemunch-mcp"],
      "env": {
        "JCODEMUNCH_INDEX_PATH": "./.claude/jcodemunch-index"
      }
    }
  }
}
```

#### 2. Configure Local Model Endpoint

**For Ollama:**
```json
{
  "model": "llama2",
  "apiBaseUrl": "http://localhost:11434/api"
}
```

**For LM Studio:**
```json
{
  "model": "local-model",
  "apiBaseUrl": "http://localhost:1234/v1"
}
```

#### 3. Environment Variables (Optional)

Add to your shell profile or `.env`:

```bash
# Use local model only (no fallback to Claude API)
JCODEMUNCH_LOCAL_ONLY=true

# Disable AI summaries (reduce dependencies)
JCODEMUNCH_DISABLE_SUMMARIES=true
```

### How jCodeMunch Works with Local Models

- **Indexing Phase**: Uses tree-sitter to parse code (no model required)
- **Retrieval Phase**: Returns symbol matches and context (no model required)
- **Optional Summaries**: Uses your configured model (local or Claude API)
- **Core Benefit**: Token savings apply regardless of which model you use

---

## Usage Examples

### Basic Code Exploration

With jCodeMunch installed, Claude Code can now:

```
claude code "Find all function definitions in this codebase"
claude code "How does the authentication module work?"
claude code "What calls the calculateTotal function?"
```

### Symbol-Based Queries

jCodeMunch enables efficient symbol discovery:

```
claude code "Show me where MyClass is defined"
claude code "Find all usages of the processData function"
claude code "What imports does the API module have?"
```

### Reduced Token Usage

Before jCodeMunch:
- Large codebase exploration: 50,000+ tokens
- Symbol lookup: 10,000+ tokens

After jCodeMunch:
- Large codebase exploration: 500-2,000 tokens
- Symbol lookup: 100-500 tokens

---

## Verification

### Check Global Installation

```bash
cat ~/.claude.json | grep jcodemunch
```

Should output an entry for `jcodemunch` MCP server.

### Check Project Configuration

```bash
cat .claude/settings.json
```

Should show `mcp_servers` with jCodeMunch configured.

### Test Integration

In Claude Code:

```
claude code "List all functions in the main module"
```

If jCodeMunch is working, it should use the indexed code for faster retrieval.

---

## Troubleshooting

### jCodeMunch Not Found

**Problem**: Command not found when running `claude mcp add`

**Solution**:
```bash
# Ensure uvx is installed (comes with uv)
uv --version

# If not installed, install uv:
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Stale Index

**Problem**: Code changes not reflected in searches

**Solution**:
```bash
# Clear the index to force re-indexing
rm -rf .claude/jcodemunch-index

# Or set in settings.json to auto-refresh:
"JCODEMUNCH_AUTO_REFRESH": true
```

### Local Model Not Connecting

**Problem**: Getting errors about unreachable model endpoint

**Solution**:
```bash
# Test local model endpoint
curl http://localhost:11434/api/tags

# Verify Claude Code config points to correct port
cat .claude/settings.json | grep apiBaseUrl
```

---

## Performance Tips

1. **Exclude Large Directories**: Add to `.claudeignore`:
   ```
   node_modules/
   .venv/
   dist/
   build/
   ```

2. **Index Once, Use Often**: jCodeMunch caches the index, making subsequent queries fast

3. **Use Symbol Queries**: Instead of "read all files", ask "find the UserAuth class"

4. **Monitor Token Usage**: Local models + jCodeMunch = significant cost savings

---

## Additional Resources

- [jcodemunch-mcp GitHub Repository](https://github.com/jgravelle/jcodemunch-mcp)
- [MCP Servers Documentation](https://lobehub.com/mcp/jgravelle-jcodemunch-mcp)
- [Claude Code Documentation](https://code.claude.com/docs)

---

## Summary

| Task | Command |
|---|---|
| Enable globally | `claude mcp add jcodemunch uvx jcodemunch-mcp` |
| Restart Claude Code | Close and reopen Claude Code |
| Configure for local model | Edit `.claude/settings.json` with model endpoint |
| Clear stale index | `rm -rf .claude/jcodemunch-index` |
| Verify installation | `cat ~/.claude.json \| grep jcodemunch` |

