/**
 * ClaudeCodeSessionAdapter: session-aware variant of ClaudeCodeAdapter.
 *
 * Uses `--session-id` to group related calls under a single conversation,
 * allowing the CLI to share context between calls. Each call still spawns
 * a fresh `claude` process, but the shared session ID enables conversation
 * continuity where the CLI supports it.
 *
 * Falls back gracefully to independent calls if session features are
 * unavailable in the installed claude CLI version.
 */

import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import type { LLMAdapter, LLMMessage, LLMResponse } from './llmAdapter.ts'
import { stripJsonFences } from './claudeCodeAdapter.ts'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ClaudeCodeSessionAdapterOptions {
  /** Path to the `claude` binary. Defaults to 'claude' (found via PATH). */
  claudePath?: string
  /** Model to pass via --model flag. */
  model?: string
  /** Maximum tokens for the response. */
  maxTokens?: number
  /** Working directory for the claude process. */
  cwd?: string
  /** Timeout in milliseconds. Default: 180_000 (3 minutes, longer for session overhead). */
  timeout?: number
  /** Enable verbose logging. */
  verbose?: boolean
  /** Session ID to use. Auto-generated if not provided. */
  sessionId?: string
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class ClaudeCodeSessionAdapter implements LLMAdapter {
  private claudePath: string
  private model: string | undefined
  private maxTokens: number | undefined
  private cwd: string | undefined
  private timeout: number
  private verbose: boolean
  readonly sessionId: string
  private callCount = 0

  constructor(options: ClaudeCodeSessionAdapterOptions = {}) {
    this.claudePath = options.claudePath ?? 'claude'
    this.model = options.model
    this.maxTokens = options.maxTokens
    this.cwd = options.cwd
    this.timeout = options.timeout ?? 180_000
    this.verbose = options.verbose ?? false
    this.sessionId = options.sessionId ?? randomUUID()
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    const prompt = formatSessionPrompt(messages)

    if (this.verbose) {
      console.error(`\n[claude-session] Call #${callId} (session ${this.sessionId.slice(0, 8)}...) — ${prompt.length} chars`)
    }

    const args = this.buildArgs()
    const content = await this.spawnClaude(args, prompt, callId)

    return {
      content,
      model: this.model ?? 'claude-code-session',
      usage: {
        input_tokens: prompt.length,
        output_tokens: content.length,
      },
    }
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    const prompt = formatSessionPrompt(messages)

    if (this.verbose) {
      console.error(`\n[claude-session] JSON call #${callId} (session ${this.sessionId.slice(0, 8)}...) — ${prompt.length} chars`)
    }

    const args = this.buildArgs()
    args.push('--output-format', 'json')

    let content = await this.spawnClaude(args, prompt, callId)
    content = stripJsonFences(content)

    return {
      content,
      model: this.model ?? 'claude-code-session',
      usage: {
        input_tokens: prompt.length,
        output_tokens: content.length,
      },
    }
  }

  private buildArgs(): string[] {
    const args: string[] = [
      '--print',
      '--session-id', this.sessionId,
    ]

    if (this.model) {
      args.push('--model', this.model)
    }

    if (this.maxTokens) {
      args.push('--max-tokens', String(this.maxTokens))
    }

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
          `[claude-session] Call #${callId}: Failed to spawn '${this.claudePath}': ${err.message}\n` +
          'Ensure Claude Code CLI is installed and available on PATH.'
        ))
      })

      proc.on('close', (code) => {
        if (this.verbose) {
          console.error(`[claude-session] Call #${callId} — exit code ${code}, ${stdout.length} chars`)
          if (stderr.trim()) {
            console.error(`[claude-session] stderr: ${stderr.trim().slice(0, 200)}`)
          }
        }

        if (code !== 0) {
          // If --session-id is not supported, the error is non-fatal for session features.
          // The call itself may still have produced output.
          if (stdout.trim()) {
            if (this.verbose) {
              console.error(`[claude-session] Call #${callId}: Non-zero exit but got output, using it`)
            }
            resolve(stdout.trim())
            return
          }

          reject(new Error(
            `[claude-session] Call #${callId}: claude exited with code ${code}\n` +
            `stderr: ${stderr.trim().slice(0, 500)}`
          ))
          return
        }

        resolve(stdout.trim())
      })

      proc.stdin.write(prompt)
      proc.stdin.end()
    })
  }
}

// ---------------------------------------------------------------------------
// Prompt formatting (same structure as ClaudeCodeAdapter)
// ---------------------------------------------------------------------------

function formatSessionPrompt(messages: LLMMessage[]): string {
  const systemMessages = messages.filter((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const parts: string[] = []

  if (systemMessages.length > 0) {
    for (const msg of systemMessages) {
      parts.push(msg.content)
    }
    parts.push('')
  }

  for (const msg of conversationMessages) {
    if (msg.role === 'user') {
      parts.push(msg.content)
    } else if (msg.role === 'assistant') {
      parts.push(`[Previous response]\n${msg.content}`)
    }
  }

  return parts.join('\n\n')
}
