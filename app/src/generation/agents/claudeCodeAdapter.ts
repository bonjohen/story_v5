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
  /** Timeout in milliseconds. Default: 120_000 (2 minutes). */
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
    this.timeout = options.timeout ?? 120_000
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
        env: { ...process.env },
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

      proc.on('close', (code) => {
        if (this.verbose) {
          console.error(`[claude-code-adapter] Call #${callId} — exit code ${code}, ${stdout.length} chars response`)
          if (stderr.trim()) {
            console.error(`[claude-code-adapter] stderr: ${stderr.trim().slice(0, 200)}`)
          }
        }

        if (code !== 0) {
          reject(new Error(
            `[claude-code-adapter] Call #${callId}: claude exited with code ${code}\n` +
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
