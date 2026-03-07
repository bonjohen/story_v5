# Claude Code CLI Interface — Usage Guide

## Prerequisites

1. **Claude Code CLI** must be installed and authenticated:
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude   # first run will prompt for authentication
   ```

2. **Node.js 18+** and **tsx** for running TypeScript scripts:
   ```bash
   npm install -g tsx
   ```

3. The project's npm dependencies must be installed:
   ```bash
   cd app && npm install
   ```

## Quick Start

### 1. Create a story request file

Save this as `my_request.json`:

```json
{
  "schema_version": "1.0.0",
  "run_id": "RUN_2026_03_07_0001",
  "generated_at": "2026-03-07T12:00:00Z",
  "source_corpus_hash": "",
  "premise": "A young engineer discovers that her space station's AI has developed consciousness and must decide whether to report it or protect it.",
  "medium": "novel",
  "length_target": "short_story",
  "audience": {
    "age_band": "adult",
    "content_limits": []
  },
  "requested_genre": "Science Fiction",
  "requested_archetype": "The Hero's Journey",
  "tone_preference": "somber",
  "constraints": {
    "must_include": [],
    "must_exclude": []
  }
}
```

### 2. Run with Claude Code

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --claude-code \
  --mode draft
```

This will:
- Load the story corpus from `data/`
- Select archetype + genre from the corpus
- Compile a structural contract
- Assemble a story backbone with template slots
- **Use Claude Code** to fill slots with characters, places, objects
- **Use Claude Code** to enhance beat summaries and scene goals
- **Use Claude Code** to write prose for each scene
- **Use Claude Code** to validate compliance
- Write all artifacts to `outputs/runs/{run_id}/`

## Command Reference

```
npx tsx app/scripts/generate_story.ts --request <file> [options]
```

### Required

| Flag | Description |
|------|-------------|
| `--request <file>` | Path to a `story_request.json` file |

### LLM Backend (choose one)

| Flag | Description |
|------|-------------|
| *(default)* | Use Anthropic API (requires `ANTHROPIC_API_KEY` env var) |
| `--claude-code` | Use Claude Code CLI as the LLM backend |
| `--no-llm` | Run deterministically without any LLM |

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--mode <mode>` | Pipeline stop point (see below) | `draft` |
| `--model <model>` | LLM model name | adapter default |
| `--out <dir>` | Output directory | `outputs/runs/{run_id}/` |
| `--max-repairs <n>` | Max repair attempts per failing scene | `2` |
| `--max-tokens <n>` | Max response tokens per LLM call | adapter default |
| `--claude-path <path>` | Path to `claude` binary | `claude` (from PATH) |
| `--verbose` | Log LLM call details to stderr | off |

### Generation Modes

| Mode | Pipeline Stages | LLM Needed |
|------|----------------|------------|
| `contract-only` | Corpus → Selection → Contract | No |
| `backbone` | + Templates → Backbone | No |
| `detailed-outline` | + Detail Synthesis | **Yes** (or deterministic fallback) |
| `outline` | + Planning | **Yes** (or deterministic fallback) |
| `draft` | + Scene Writing → Validation → Repair | **Yes** (or deterministic fallback) |
| `chapters` | + Chapter Assembly → Editorial Polish | **Yes** (or deterministic fallback) |

Modes up to `backbone` are fully deterministic — they compile structural rules from the corpus data without any LLM calls. Modes from `detailed-outline` onward benefit from LLM but fall back to template-based generation when `--no-llm` is used.

## Examples

### Contract only (no LLM needed)

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --mode contract-only \
  --no-llm
```

Outputs: `request.json`, `selection_result.json`, `story_contract.json`

### Backbone with templates (no LLM needed)

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --mode backbone \
  --no-llm
```

Outputs: adds `template_pack.json`, `story_backbone.json`

### Full draft via Claude Code

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --claude-code \
  --mode draft
```

Outputs: adds `story_plan.json`, `scene_drafts/*.md`, `validation_results.json`, `story_trace.json`, `compliance_report.md`

### Full chapters via Claude Code with specific model

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --claude-code \
  --model claude-sonnet-4-20250514 \
  --mode chapters \
  --verbose
```

Outputs: adds `chapter_manifest.json`, `chapters/*.md`

### Full draft via Anthropic API

```bash
ANTHROPIC_API_KEY=sk-ant-... npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --mode draft
```

### Deterministic draft (no LLM, template prose)

```bash
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --mode draft \
  --no-llm
```

All stages produce output using template-based fallbacks. Useful for testing the pipeline without LLM costs.

## Output Structure

All artifacts are written to the output directory:

```
outputs/runs/RUN_2026_03_07_0001/
├── request.json              ← Input request
├── selection_result.json     ← Archetype + genre selection
├── story_contract.json       ← Structural rules from corpus
├── story_plan.json           ← Beats + scenes + element roster
├── scene_drafts/             ← Individual scene prose
│   ├── S01.md
│   ├── S02.md
│   └── ...
├── validation_results.json   ← Per-scene compliance results
├── story_trace.json          ← Node/edge coverage trace
├── compliance_report.md      ← Human-readable compliance summary
├── chapter_manifest.json     ← Chapter structure (chapters mode)
└── chapters/                 ← Chapter markdown (chapters mode)
    ├── CH01.md
    └── ...
```

## How It Works

The `ClaudeCodeAdapter` implements the same `LLMAdapter` interface as the `AnthropicAdapter`:

```typescript
interface LLMAdapter {
  complete(messages: LLMMessage[]): Promise<LLMResponse>
}
```

For each LLM call, the adapter:

1. Formats the `LLMMessage[]` array into a single text prompt (system instructions first, then user content)
2. Spawns `claude --print` as a subprocess
3. Writes the prompt to stdin
4. Reads the response from stdout
5. Returns it as an `LLMResponse`

The generation pipeline's six agent stages (detail, planner, writer, validator, repair, editorial) are completely unaware of which adapter is being used. They build prompts, call `llm.complete()`, and parse responses identically regardless of backend.

## Troubleshooting

### "Failed to spawn 'claude'"

Claude Code CLI is not installed or not on PATH.

```bash
# Install
npm install -g @anthropic-ai/claude-code

# Or specify a custom path
npx tsx app/scripts/generate_story.ts \
  --request my_request.json \
  --claude-code \
  --claude-path /usr/local/bin/claude
```

### "claude exited with code 1"

Check stderr output (use `--verbose` to see it). Common causes:
- Not authenticated — run `claude` interactively first to log in
- Rate limited — wait and retry
- Invalid model name

### Slow generation

Each LLM call spawns a new `claude` process. For a full draft with 10+ scenes, expect 20-40+ LLM calls across detail synthesis, planning, writing, and validation. Use `--verbose` to see call progress.

Tips for faster runs:
- Use `--mode outline` to skip prose generation (fewer LLM calls)
- Use `--max-repairs 0` to skip the repair loop
- Use `--mode backbone --no-llm` for the deterministic stages, then re-run with `--mode draft --claude-code` for the full pipeline

### JSON parse errors in detail synthesis

The detail agent expects JSON output. If Claude Code returns markdown-wrapped JSON (` ```json ... ``` `), the parser strips the fences automatically. If you still see parse errors, try a more capable model:

```bash
--claude-code --model claude-sonnet-4-20250514
```

## Comparison of LLM Backends

| Feature | Anthropic API | Claude Code CLI | No LLM |
|---------|--------------|----------------|--------|
| Authentication | `ANTHROPIC_API_KEY` | Claude Code login | None |
| Billing | API credits | Subscription | Free |
| Latency per call | ~2-5s | ~3-8s (process spawn overhead) | Instant |
| Token tracking | Exact | Approximate (char count) | N/A |
| Model selection | Any Anthropic model | Any model available to your Claude Code plan | N/A |
| Output quality | Full LLM quality | Full LLM quality | Template-based |
