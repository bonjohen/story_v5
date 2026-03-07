# Claude Code CLI Interface — Design Document

## Overview

The Claude Code CLI Interface is an `LLMAdapter` implementation (`ClaudeCodeAdapter`) that delegates language model calls to the Claude Code CLI (`claude`) instead of calling the Anthropic API directly. This lets users run the full agentic story generation pipeline using their existing Claude Code authentication, subscription, and model routing — no API key required.

## Problem

The generation pipeline has six agentic stages that require LLM calls:

1. **Detail Synthesis** — fill backbone slots with concrete characters, places, objects
2. **Plan Enhancement** — generate beat summaries and scene goals
3. **Scene Writing** — produce prose for each scene
4. **Scene Validation** — LLM-backed compliance checking
5. **Scene Repair** — fix failing scenes via targeted edits or full rewrites
6. **Editorial Polish** — smooth chapter transitions and ensure voice consistency

Previously, these stages could only run via:
- **Anthropic API** (`AnthropicAdapter`) — requires `ANTHROPIC_API_KEY` environment variable
- **No LLM** (`--no-llm`) — all stages fall back to deterministic template generation

Users with Claude Code installed (Claude Pro/Max subscribers) couldn't leverage their subscription for generation without also having API credits.

## Solution

### Architecture

```
┌─────────────────────┐
│  generate_story.ts  │  CLI entry point
└────────┬────────────┘
         │ --claude-code flag
         ▼
┌─────────────────────┐
│  ClaudeCodeAdapter  │  implements LLMAdapter
└────────┬────────────┘
         │ spawn('claude', ['--print', ...])
         ▼
┌─────────────────────┐
│  Claude Code CLI    │  reads stdin, prints response
└─────────────────────┘
```

The `ClaudeCodeAdapter` class lives alongside the existing `AnthropicAdapter` and `MockLLMAdapter`:

```
app/src/generation/agents/
├── llmAdapter.ts            # LLMAdapter interface + MockLLMAdapter
├── anthropicAdapter.ts      # Anthropic API implementation
├── claudeCodeAdapter.ts     # Claude Code CLI implementation (new)
├── detailAgent.ts           # Prompt builder: entity synthesis
├── editorialAgent.ts        # Prompt builder: chapter polish
├── plannerAgent.ts          # Prompt builder: beat/scene enhancement
├── writerAgent.ts           # Prompt builder: scene prose
├── validatorAgent.ts        # Prompt builder: compliance checking
└── repairAgent.ts           # Prompt builder: scene repair
```

### LLMAdapter Interface

All three implementations share the same interface — zero changes needed in any agent or engine code:

```typescript
interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface LLMResponse {
  content: string
  model: string
  usage?: { input_tokens: number; output_tokens: number }
}

interface LLMAdapter {
  complete(messages: LLMMessage[]): Promise<LLMResponse>
}
```

### ClaudeCodeAdapter Behavior

Each `complete()` call:

1. **Formats messages** — system messages become a preamble, user/assistant messages follow as structured text
2. **Spawns `claude --print`** — non-interactive mode: reads stdin, writes response to stdout, exits
3. **Pipes the prompt to stdin** and collects stdout
4. **Returns the response** as an `LLMResponse` with approximate token counts

Key properties:
- **Stateless**: each call spawns a fresh `claude` process (no conversation history between calls)
- **Isolated**: the adapter passes `--print` which disables interactive mode and tool use
- **Configurable**: model, max tokens, timeout, and extra flags can be customized

### CLI Integration

The `generate_story.ts` script gains three new flags:

| Flag | Description |
|------|-------------|
| `--claude-code` | Use Claude Code CLI instead of Anthropic API |
| `--claude-path <path>` | Custom path to the `claude` binary |
| `--verbose` | Log prompt sizes and response details to stderr |

Adapter selection logic:

```typescript
if (noLlm)        → null           // deterministic fallback
if (useClaudeCode) → ClaudeCodeAdapter
else               → AnthropicAdapter
```

### Prompt Formatting

The `claude --print` command accepts a plain-text prompt on stdin. The adapter formats `LLMMessage[]` into structured text:

```
[System message content]

[User message content]

[Previous response]
[Assistant message content]

[User message content]
```

System messages are placed first as context instructions. The `[Previous response]` prefix disambiguates multi-turn conversations, though most agent calls are single-turn (system + user).

## Design Decisions

### Why `--print` mode?

Claude Code's `--print` flag runs non-interactively: it reads stdin, sends one completion, prints the result, and exits. This maps cleanly to the `LLMAdapter.complete()` contract (one request → one response). Interactive mode would require managing sessions and parsing structured output, adding complexity without benefit for this use case.

### Why spawn per call?

Each of the ~6 agent stages uses independent prompts with no shared conversation context. Spawning a fresh process per call is simple, avoids state leakage between agents, and matches the existing `AnthropicAdapter` behavior (stateless HTTP calls).

### Why not modify the browser store?

`ClaudeCodeAdapter` uses `child_process.spawn`, which requires Node.js. The browser generation store continues to pass `llm: null` for deterministic mode. This adapter is CLI-only by design. A future WebSocket bridge could expose it to the browser, but that's out of scope.

### Why approximate token counts?

`claude --print` doesn't report token usage in its output. The adapter returns `prompt.length` and `response.length` as character-based approximations. This is sufficient for logging and cost awareness but not for precise billing.

## Pipeline Interaction Points

The adapter is called at these orchestrator states:

| State | Agent | What It Does |
|-------|-------|-------------|
| `DETAILS_BOUND` | detailAgent | Fills character/place/object slots |
| `PLANNED` | plannerAgent | Enhances beat summaries and scene goals |
| `GENERATING_SCENE` | writerAgent | Writes scene prose |
| `VALIDATING_SCENE` | validatorAgent | Checks constraint compliance |
| `REPAIRING_SCENE` | repairAgent | Fixes failing scenes |
| `CHAPTERS_ASSEMBLED` | editorialAgent | Polishes chapter transitions |

Each agent builds its own prompt via `buildXxxPrompt()`, calls `llm.complete()`, and parses the response. The adapter is transparent to all agents.

## Error Handling

| Condition | Behavior |
|-----------|----------|
| `claude` not on PATH | Error with install instructions |
| `claude` exits non-zero | Error with stderr content (first 500 chars) |
| Timeout (default 2 min) | Process killed, timeout error raised |
| Empty response | Returns empty string (agents handle gracefully) |

## Files Changed

| File | Change |
|------|--------|
| `app/src/generation/agents/claudeCodeAdapter.ts` | New — adapter implementation |
| `app/scripts/generate_story.ts` | Added `--claude-code`, `--claude-path`, `--verbose`, `--max-tokens` flags |

## Future Considerations

- **Streaming**: `claude --print` streams output. A future adapter could yield partial responses for progress indication.
- **JSON mode**: some agents expect JSON responses. A `--output-format json` flag (if supported by claude CLI) could improve reliability.
- **Session reuse**: for multi-scene generation, a persistent claude session could reduce per-call overhead. This would require a different interaction model (not `--print`).
- **Browser bridge**: a local WebSocket server wrapping `ClaudeCodeAdapter` could enable LLM-powered generation from the browser UI.
