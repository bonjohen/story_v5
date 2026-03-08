/**
 * ClaudeCodeAdapter: LLM adapter that delegates to Claude Code CLI (`claude`).
 *
 * Instead of calling the Anthropic API directly, this adapter spawns the
 * `claude` CLI in non-interactive mode (`--print`), passing the conversation
 * as a prompt via stdin. This lets users leverage their existing Claude Code
 * authentication, model routing, and context without managing API keys.
 *
 * Designed for Node.js CLI usage — not for the browser.
 */

import { spawn } from 'child_process'
import type { LLMAdapter, LLMMessage, LLMResponse } from './llmAdapter.ts'

/** Return a copy of process.env with all Claude Code session vars removed
 *  so child `claude --print` doesn't detect a nested session and refuse to start. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.CLAUDECODE
  delete env.CLAUDE_CODE_SSE_PORT
  delete env.CLAUDE_CODE_ENTRYPOINT
  return env
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ClaudeCodeAdapterOptions {
  /** Path to the `claude` binary. Defaults to 'claude' (found via PATH). */
  claudePath?: string
  /** Model to pass via --model flag. Omit to use Claude Code's default. */
  model?: string
  /** Maximum tokens for the response via --max-tokens flag. */
  maxTokens?: number
  /** Additional CLI flags to pass to claude. */
  extraFlags?: string[]
  /** Working directory for the claude process. */
  cwd?: string
  /** Timeout in milliseconds. Default: 600_000 (10 minutes). */
  timeout?: number
  /** Enable verbose logging of prompts and responses to stderr. */
  verbose?: boolean
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClaudeCodeAdapter implements LLMAdapter {
  private claudePath: string
  private model: string | undefined
  private maxTokens: number | undefined
  private extraFlags: string[]
  private cwd: string | undefined
  private timeout: number
  private verbose: boolean
  private callCount = 0

  constructor(options: ClaudeCodeAdapterOptions = {}) {
    this.claudePath = options.claudePath ?? 'claude'
    this.model = options.model
    this.maxTokens = options.maxTokens
    this.extraFlags = options.extraFlags ?? []
    this.cwd = options.cwd
    this.timeout = options.timeout ?? 600_000
    this.verbose = options.verbose ?? false
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    // Build the prompt text from messages.
    // System messages become a preamble, user/assistant messages follow.
    const prompt = formatMessagesForCli(messages)

    if (this.verbose) {
      console.error(`\n[claude-code-adapter] Call #${callId} — sending ${prompt.length} chars`)
    }

    // Build CLI arguments
    const args = this.buildArgs()

    const content = await this.spawnClaude(args, prompt, callId)

    return {
      content,
      model: this.model ?? 'claude-code',
      usage: {
        input_tokens: prompt.length, // approximate
        output_tokens: content.length,
      },
    }
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    // Append a JSON-output reminder to the last user message to reinforce
    // the system prompt's instruction. Do NOT use --output-format json
    // as it can cause CLI crashes on some platforms.
    const augmented = messages.map((m, i) =>
      i === messages.length - 1 && m.role === 'user'
        ? { ...m, content: m.content + '\n\nRespond with valid JSON only. No markdown fences, no commentary.' }
        : m,
    )
    const prompt = formatMessagesForCli(augmented)

    if (this.verbose) {
      console.error(`\n[claude-code-adapter] JSON call #${callId} — sending ${prompt.length} chars`)
    }

    const args = this.buildArgs()

    let content = await this.spawnClaude(args, prompt, callId)
    content = stripJsonFences(content)

    return {
      content,
      model: this.model ?? 'claude-code',
      usage: {
        input_tokens: prompt.length,
        output_tokens: content.length,
      },
    }
  }

  async *completeStream(messages: LLMMessage[]): AsyncIterable<string> {
    this.callCount++
    const callId = this.callCount
    const prompt = formatMessagesForCli(messages)

    if (this.verbose) {
      console.error(`\n[claude-code-adapter] Stream #${callId} — sending ${prompt.length} chars`)
    }

    const args = this.buildArgs()
    yield* this.spawnClaudeStream(args, prompt, callId)
  }

  private async *spawnClaudeStream(args: string[], prompt: string, callId: number): AsyncIterable<string> {
    const proc = spawn(this.claudePath, args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: cleanEnv(),
      timeout: this.timeout,
    })

    let stderr = ''

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    // Write prompt to stdin and close
    proc.stdin.write(prompt)
    proc.stdin.end()

    // Yield stdout chunks as they arrive
    try {
      for await (const chunk of proc.stdout) {
        yield (chunk as Buffer).toString()
      }
    } catch (err) {
      throw new Error(
        `[claude-code-adapter] Stream #${callId}: Failed to read from '${this.claudePath}': ${(err as Error).message}\n` +
        'Ensure Claude Code CLI is installed and available on PATH.\n' +
        'Install: npm install -g @anthropic-ai/claude-code'
      )
    }

    // Wait for process to close and check exit code
    const code = await new Promise<number | null>((resolve, reject) => {
      proc.on('close', resolve)
      proc.on('error', reject)
    })

    if (this.verbose) {
      console.error(`[claude-code-adapter] Stream #${callId} — exit code ${code}`)
      if (stderr.trim()) {
        console.error(`[claude-code-adapter] stderr: ${stderr.trim().slice(0, 200)}`)
      }
    }

    if (code !== 0) {
      throw new Error(
        `[claude-code-adapter] Stream #${callId}: claude exited with code ${code}\n` +
        `stderr: ${stderr.trim().slice(0, 500)}`
      )
    }
  }

  private buildArgs(): string[] {
    const args: string[] = [
      '--print',       // Non-interactive: read stdin, print response, exit
    ]

    if (this.model) {
      args.push('--model', this.model)
    }

    if (this.maxTokens) {
      args.push('--max-tokens', String(this.maxTokens))
    }

    args.push(...this.extraFlags)
    return args
  }

  private spawnClaude(args: string[], prompt: string, callId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.claudePath, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: cleanEnv(),
        timeout: this.timeout,
      })

      let stdout = ''
      let stderr = ''

      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString()
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString()
      })

      proc.on('error', (err) => {
        reject(new Error(
          `[claude-code-adapter] Call #${callId}: Failed to spawn '${this.claudePath}': ${err.message}\n` +
          'Ensure Claude Code CLI is installed and available on PATH.\n' +
          'Install: npm install -g @anthropic-ai/claude-code'
        ))
      })

      proc.on('close', (code, signal) => {
        if (this.verbose) {
          console.error(`[claude-code-adapter] Call #${callId} — exit code ${code}, signal ${signal}, ${stdout.length} chars response`)
          if (stderr.trim()) {
            console.error(`[claude-code-adapter] stderr: ${stderr.trim().slice(0, 200)}`)
          }
        }

        if (code !== 0) {
          const signalInfo = signal ? ` (signal: ${signal})` : ''
          const hint = code === null
            ? '\nProcess was killed — possible causes: timeout, out of memory, or OS termination.'
            : ''
          reject(new Error(
            `[claude-code-adapter] Call #${callId}: claude exited with code ${code}${signalInfo}${hint}\n` +
            `stderr: ${stderr.trim().slice(0, 500)}`
          ))
          return
        }

        resolve(stdout.trim())
      })

      // Write prompt to stdin and close
      proc.stdin.write(prompt)
      proc.stdin.end()
    })
  }
}

// ---------------------------------------------------------------------------
// JSON fence stripping
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences and trailing text from JSON responses.
 * Handles: ```json ... ```, ``` ... ```, leading/trailing whitespace,
 * and trailing text after the closing brace/bracket.
 */
export function stripJsonFences(text: string): string {
  let cleaned = text.trim()

  // Strip opening code fence (```json or ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/, '')
  }

  // Strip closing code fence
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }

  // If there's trailing text after the last } or ], remove it
  const lastBrace = cleaned.lastIndexOf('}')
  const lastBracket = cleaned.lastIndexOf(']')
  const lastJson = Math.max(lastBrace, lastBracket)
  if (lastJson >= 0 && lastJson < cleaned.length - 1) {
    const trailing = cleaned.slice(lastJson + 1).trim()
    // Only strip if trailing content is non-JSON (not another valid structure)
    if (trailing && !trailing.startsWith('{') && !trailing.startsWith('[')) {
      cleaned = cleaned.slice(0, lastJson + 1)
    }
  }

  return cleaned.trim()
}

// ---------------------------------------------------------------------------
// Prompt formatting
// ---------------------------------------------------------------------------

/**
 * Convert LLMMessage[] into a single text prompt suitable for `claude --print`.
 *
 * The claude CLI accepts a plain-text prompt on stdin. We format the messages
 * into a structured prompt that preserves the system/user/assistant roles.
 */
function formatMessagesForCli(messages: LLMMessage[]): string {
  const systemMessages = messages.filter((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const parts: string[] = []

  // System instructions go first as context
  if (systemMessages.length > 0) {
    for (const msg of systemMessages) {
      parts.push(msg.content)
    }
    parts.push('') // separator
  }

  // Conversation messages
  for (const msg of conversationMessages) {
    if (msg.role === 'user') {
      parts.push(msg.content)
    } else if (msg.role === 'assistant') {
      // Include prior assistant turns as context
      parts.push(`[Previous response]\n${msg.content}`)
    }
  }

  return parts.join('\n\n')
}
