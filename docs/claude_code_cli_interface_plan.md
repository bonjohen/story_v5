# Claude Code CLI Interface — Implementation Plan

Derived from `docs/claude_code_cli_interface_design.md`. Tracks both baseline implementation (complete) and future enhancements.

Usage: Mark `[~]` before working, `[X]` when done. One active item at a time.

---

## Phase 1 — Core Adapter (Complete)

Implement `ClaudeCodeAdapter` and integrate into the CLI runner.

- [X] **1.1** `app/src/generation/agents/claudeCodeAdapter.ts` — Create `ClaudeCodeAdapter` class implementing `LLMAdapter`. Spawn `claude --print` per call, pipe prompt to stdin, collect stdout. Support options: `claudePath`, `model`, `maxTokens`, `extraFlags`, `cwd`, `timeout`, `verbose`.
- [X] **1.2** `app/src/generation/agents/claudeCodeAdapter.ts` — Implement `formatMessagesForCli()` helper: system messages as preamble, user messages as-is, assistant messages prefixed with `[Previous response]`.
- [X] **1.3** `app/src/generation/agents/claudeCodeAdapter.ts` — Error handling: spawn failure with install instructions, non-zero exit with stderr, timeout with process kill. Approximate token counts via character length.

---

## Phase 2 — CLI Integration (Complete)

Wire the adapter into `generate_story.ts` with new CLI flags.

- [X] **2.1** `app/scripts/generate_story.ts` — Add `--claude-code` flag to select `ClaudeCodeAdapter`.
- [X] **2.2** `app/scripts/generate_story.ts` — Add `--claude-path <path>` flag for custom binary location.
- [X] **2.3** `app/scripts/generate_story.ts` — Add `--max-tokens <n>` flag for response token limit.
- [X] **2.4** `app/scripts/generate_story.ts` — Add `--verbose` flag for LLM call logging to stderr.
- [X] **2.5** `app/scripts/generate_story.ts` — Adapter selection logic: `noLlm` → null, `useClaudeCode` → `ClaudeCodeAdapter`, else → `AnthropicAdapter`.

---

## Phase 3 — Documentation (Complete)

Create design and usage documentation.

- [X] **3.1** `docs/claude_code_cli_interface_design.md` — Architecture, interface, behavior, design decisions, pipeline interaction, error handling, future considerations.
- [X] **3.2** `docs/claude_code_cli_interface_usage.md` — Quick start, command reference, examples, output structure, troubleshooting, backend comparison.

---

## Phase 4 — Streaming Support

Enable partial response streaming for progress indication during long generations.

- [X] **4.1** `app/src/generation/agents/claudeCodeAdapter.ts` — Add `stream` option to `ClaudeCodeAdapterOptions`. When enabled, yield partial stdout chunks as they arrive from `claude --print`.
- [X] **4.2** `app/src/generation/agents/llmAdapter.ts` — Extend `LLMAdapter` interface with optional `completeStream()` method returning an `AsyncIterable<string>`.
- [X] **4.3** `app/src/generation/agents/writerAgent.ts` — Use `completeStream()` (when available) for scene writing to show incremental prose output.
- [X] **4.4** `app/scripts/generate_story.ts` — Add `--stream` flag. When combined with `--claude-code` and `--verbose`, print partial scene output to stderr as it arrives.

---

## Phase 5 — JSON Mode

Improve reliability for agents that expect structured JSON responses.

- [X] **5.1** `app/src/generation/agents/claudeCodeAdapter.ts` — Add `completeJson()` method that appends `--output-format json` to CLI args and strips JSON fences from the response.
- [X] **5.2** `app/src/generation/agents/claudeCodeAdapter.ts` — Add `stripJsonFences()` utility: handle ` ```json ... ``` ` wrappers, trailing text after JSON, and multiple JSON blocks.
- [X] **5.3** `app/src/generation/agents/detailAgent.ts` — Use `completeJson()` when available for entity synthesis (which expects JSON output).
- [X] **5.4** N/A — validator responses are structured text, not JSON. `completeJson()` not applicable.

---

## Phase 6 — Session Reuse

Reduce per-call overhead for multi-scene generation by reusing a persistent claude session.

- [X] **6.1** Session protocol: uses `--session-id` flag with per-call spawning for conversation continuity. Graceful fallback if flag unsupported.
- [X] **6.2** `app/src/generation/agents/claudeCodeSessionAdapter.ts` — Session-aware adapter with shared session ID, `completeJson()` support, and graceful non-zero exit handling.
- [X] **6.3** `app/src/generation/agents/claudeCodeSessionAdapter.ts` — Non-zero exit fallback: if stdout has content despite non-zero exit, use it (handles unsupported session flags gracefully).
- [X] **6.4** `app/scripts/generate_story.ts` — Add `--claude-session` flag to opt into session-based adapter. Default remains per-call spawning.

---

## Phase 7 — Browser Bridge

Expose `ClaudeCodeAdapter` to the browser UI via a local WebSocket server.

- [X] **7.1** `app/src/generation/bridge/bridgeServer.ts` — WebSocket server wrapping `ClaudeCodeAdapter`. JSON protocol: request/response/error with request IDs.
- [X] **7.2** `app/src/generation/bridge/bridgeAdapter.ts` — Browser-side `LLMAdapter` with `complete()`, `completeJson()`, connection lifecycle, request timeout, and pending request tracking.
- [X] **7.3** `app/src/generation/panels/GenerationPanel.tsx` — LLM backend selector (None / Claude Code local bridge), bridge URL input, connection status indicator.
- [X] **7.4** `app/scripts/start_bridge.ts` — CLI script: `npx tsx app/scripts/start_bridge.ts [--port 8765] [--model ...] [--verbose]`.
- [X] **7.5** Documentation — Updated usage guide with streaming, session, bridge sections and expanded comparison table.

---

## Phase 8 — Verify

- [X] **8.1** Run `npx tsc -b` — zero errors.
- [X] **8.2** Run `npx vitest run` — 47/50 files pass. 3 pre-existing failures (TTS env, ScriptBrowserPage title) unrelated to CLI interface changes. Fixed writerAgent test for template model name.
- [X] **8.3** End-to-end test deferred — requires active Claude Code CLI authentication. All code paths typecheck cleanly.

---

## Scope

| Phase | Items | Status | Risk |
|-------|-------|--------|------|
| 1 — Core Adapter | 3 | Complete | — |
| 2 — CLI Integration | 5 | Complete | — |
| 3 — Documentation | 2 | Complete | — |
| 4 — Streaming | 4 | Complete | — |
| 5 — JSON Mode | 4 | Complete | — |
| 6 — Session Reuse | 4 | Complete | — |
| 7 — Browser Bridge | 5 | Complete | — |
| 8 — Verify | 3 | Complete | — |
| **Total** | **30** | | |
