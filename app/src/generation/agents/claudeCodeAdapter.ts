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
import { stripJsonFences } from './jsonUtils.ts'

/** Return a copy of process.env with all Claude Code session vars removed
 *  so child `claude --print` doesn't detect a nested session and refuse to start. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  // Remove all known Claude Code session detection vars
  const SESSION_VARS = [
    'CLAUDECODE',
    'CLAUDE_CODE_SSE_PORT',
    'CLAUDE_CODE_ENTRYPOINT',
    'CLAUDE_CODE_SESSION_ID',
    'CLAUDE_CODE_CONVERSATION_ID',
    'CLAUDE_CODE_PROJECT_DIR',
    'CLAUDE_CODE_PARENT_SESSION',
    'CLAUDE_CODE_NESTED',
  ]
  for (const key of SESSION_VARS) {
    delete env[key]
  }
  // Also remove any dynamically-set CLAUDE_CODE_* vars we may have missed
  for (const key of Object.keys(env)) {
    if (key.startsWith('CLAUDE_CODE_')) {
      delete env[key]
    }
  }
  return env
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ClaudeCodeAdapterOptions {
  /** Path to the `claude` binary. Defaults to 'claude' (found via PATH). */
  claudePath?: string
  /** Model to pass via --model flag. Omit to use Claude Code's default.
   *  Accepts aliases: 'opus', 'sonnet', 'haiku' or full names like 'claude-opus-4-6'. */
  model?: string
  /** @deprecated Not supported by claude CLI. Ignored. */
  maxTokens?: number
  /** Reasoning effort level: 'low', 'medium', 'high'. */
  effort?: 'low' | 'medium' | 'high'
  /** Maximum dollar amount to spend on API calls per invocation. */
  maxBudgetUsd?: number
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
  private effort: string | undefined
  private maxBudgetUsd: number | undefined
  private extraFlags: string[]
  private cwd: string | undefined
  private timeout: number
  private verbose: boolean
  private callCount = 0

  constructor(options: ClaudeCodeAdapterOptions = {}) {
    this.claudePath = options.claudePath ?? 'claude'
    this.model = options.model
    this.effort = options.effort
    this.maxBudgetUsd = options.maxBudgetUsd
    this.extraFlags = options.extraFlags ?? []
    this.cwd = options.cwd
    this.timeout = options.timeout ?? 600_000
    this.verbose = options.verbose ?? false
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    const { systemPrompt, userPrompt } = splitMessages(messages)

    if (this.verbose) {
      const sysLen = systemPrompt?.length ?? 0
      console.error(`\n[claude-code-adapter] Call #${callId} — sending ${userPrompt.length} chars (sys: ${sysLen})`)
    }

    const { args, stdinPrefix } = this.buildArgs(systemPrompt)
    const content = await this.spawnClaude(args, stdinPrefix + userPrompt, callId)

    return {
      content,
      model: this.model ?? 'claude-code',
      usage: {
        input_tokens: userPrompt.length + (systemPrompt?.length ?? 0),
        output_tokens: content.length,
      },
    }
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    this.callCount++
    const callId = this.callCount

    // Append a JSON-output reminder to the last user message
    const augmented = messages.map((m, i) =>
      i === messages.length - 1 && m.role === 'user'
        ? { ...m, content: m.content + '\n\nRespond with valid JSON only. No markdown fences, no commentary.' }
        : m,
    )

    const { systemPrompt, userPrompt } = splitMessages(augmented)

    if (this.verbose) {
      const sysLen = systemPrompt?.length ?? 0
      console.error(`\n[claude-code-adapter] JSON call #${callId} — sending ${userPrompt.length} chars (sys: ${sysLen})`)
    }

    const { args, stdinPrefix } = this.buildArgs(systemPrompt)
    let content = await this.spawnClaude(args, stdinPrefix + userPrompt, callId)
    content = stripJsonFences(content)

    return {
      content,
      model: this.model ?? 'claude-code',
      usage: {
        input_tokens: userPrompt.length + (systemPrompt?.length ?? 0),
        output_tokens: content.length,
      },
    }
  }

  async *completeStream(messages: LLMMessage[]): AsyncIterable<string> {
    this.callCount++
    const callId = this.callCount

    const { systemPrompt, userPrompt } = splitMessages(messages)

    if (this.verbose) {
      const sysLen = systemPrompt?.length ?? 0
      console.error(`\n[claude-code-adapter] Stream #${callId} — sending ${userPrompt.length} chars (sys: ${sysLen})`)
    }

    const { args, stdinPrefix } = this.buildArgs(systemPrompt)
    yield* this.spawnClaudeStream(args, stdinPrefix + userPrompt, callId)
  }

  private async *spawnClaudeStream(args: string[], prompt: string, callId: number): AsyncIterable<string> {
    const proc = spawn(this.claudePath, args, {
      cwd: this.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: cleanEnv(),
      timeout: this.timeout,
    })

    let stderr = ''
    let stdoutCollected = ''

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    // Write prompt to stdin and close
    proc.stdin.write(prompt)
    proc.stdin.end()

    // Yield stdout chunks as they arrive
    try {
      for await (const chunk of proc.stdout) {
        const text = (chunk as Buffer).toString()
        stdoutCollected += text
        yield text
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
        console.error(`[claude-code-adapter] stderr: ${stderr.trim().slice(0, 500)}`)
      }
    }

    if (code !== 0) {
      const stderrMsg = stderr.trim().slice(0, 500)
      const stdoutMsg = stdoutCollected.trim().slice(0, 500)
      const details = [
        stderrMsg ? `stderr: ${stderrMsg}` : null,
        stdoutMsg ? `stdout: ${stdoutMsg}` : null,
      ].filter(Boolean).join('\n') || '(no output captured)'
      throw new Error(
        `[claude-code-adapter] Stream #${callId}: claude exited with code ${code}\n${details}`
      )
    }
  }

  private buildArgs(systemPrompt?: string): { args: string[]; stdinPrefix: string } {
    const args: string[] = [
      '--print',       // Non-interactive: read stdin, print response, exit
    ]

    if (this.model) {
      args.push('--model', this.model)
    }

    if (this.effort) {
      args.push('--effort', this.effort)
    }

    if (this.maxBudgetUsd) {
      args.push('--max-budget-usd', String(this.maxBudgetUsd))
    }

    // Use native --system-prompt flag for short prompts.
    // For long system prompts (>8KB), embed in stdin to avoid
    // Windows command-line length limits (~32K total).
    let stdinPrefix = ''
    if (systemPrompt) {
      if (systemPrompt.length <= 8000) {
        args.push('--system-prompt', systemPrompt)
      } else {
        stdinPrefix = `[System Instructions]\n${systemPrompt}\n\n[User Request]\n`
      }
    }

    args.push(...this.extraFlags)
    return { args, stdinPrefix }
  }

  private spawnClaude(args: string[], prompt: string, callId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.claudePath, args, {
        cwd: this.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: cleanEnv(),
        timeout: this.timeout,
      })

      const stdoutChunks: string[] = []
      const stderrChunks: string[] = []

      proc.stdout.on('data', (chunk: Buffer) => {
        stdoutChunks.push(chunk.toString())
      })

      proc.stderr.on('data', (chunk: Buffer) => {
        stderrChunks.push(chunk.toString())
      })

      proc.on('error', (err) => {
        reject(new Error(
          `[claude-code-adapter] Call #${callId}: Failed to spawn '${this.claudePath}': ${err.message}\n` +
          'Ensure Claude Code CLI is installed and available on PATH.\n' +
          'Install: npm install -g @anthropic-ai/claude-code'
        ))
      })

      // Wait for both streams to close before processing exit code,
      // so we capture all stderr/stdout data (avoids race condition).
      let stdoutEnded = false
      let stderrEnded = false
      let exitCode: number | null = null
      let exitSignal: NodeJS.Signals | null = null

      const tryFinish = () => {
        if (!stdoutEnded || !stderrEnded || exitCode === undefined) return

        const stdout = stdoutChunks.join('')
        const stderr = stderrChunks.join('')

        if (this.verbose) {
          console.error(`[claude-code-adapter] Call #${callId} — exit code ${exitCode}, signal ${exitSignal}, ${stdout.length} chars response`)
          if (stderr.trim()) {
            console.error(`[claude-code-adapter] stderr: ${stderr.trim().slice(0, 500)}`)
          }
        }

        if (exitCode !== 0) {
          const signalInfo = exitSignal ? ` (signal: ${exitSignal})` : ''
          const hint = exitCode === null
            ? '\nProcess was killed — possible causes: timeout, out of memory, or OS termination.'
            : ''
          const stderrMsg = stderr.trim().slice(0, 500)
          const stdoutMsg = stdout.trim().slice(0, 500)
          const details = [
            stderrMsg ? `stderr: ${stderrMsg}` : null,
            stdoutMsg ? `stdout: ${stdoutMsg}` : null,
          ].filter(Boolean).join('\n') || '(no output captured)'
          reject(new Error(
            `[claude-code-adapter] Call #${callId}: claude exited with code ${exitCode}${signalInfo}${hint}\n${details}`
          ))
          return
        }

        resolve(stdout.trim())
      }

      proc.stdout.on('end', () => { stdoutEnded = true; tryFinish() })
      proc.stderr.on('end', () => { stderrEnded = true; tryFinish() })
      proc.on('close', (code, signal) => {
        exitCode = code
        exitSignal = signal
        tryFinish()
      })

      // Write prompt to stdin and close
      proc.stdin.write(prompt)
      proc.stdin.end()
    })
  }
}

// Re-export stripJsonFences for backward compatibility
export { stripJsonFences } from './jsonUtils.ts'

// ---------------------------------------------------------------------------
// Prompt formatting
// ---------------------------------------------------------------------------

/**
 * Split LLMMessage[] into a system prompt (for --system-prompt flag)
 * and a user prompt (piped to stdin).
 */
function splitMessages(messages: LLMMessage[]): { systemPrompt: string | undefined; userPrompt: string } {
  const systemMessages = messages.filter((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const systemPrompt = systemMessages.length > 0
    ? systemMessages.map((m) => m.content).join('\n\n')
    : undefined

  const parts: string[] = []
  for (const msg of conversationMessages) {
    if (msg.role === 'user') {
      parts.push(msg.content)
    } else if (msg.role === 'assistant') {
      parts.push(`[Previous response]\n${msg.content}`)
    }
  }

  return { systemPrompt, userPrompt: parts.join('\n\n') }
}
