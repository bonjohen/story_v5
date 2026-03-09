/**
 * OpenAI-Compatible Adapter: browser-side LLM adapter that talks to any
 * OpenAI-compatible API endpoint via fetch.
 *
 * Works with: Ollama, OpenRouter, LM Studio, vLLM, llama.cpp server,
 * Google AI Studio (via OpenAI compat), Groq, and any other provider
 * that implements the OpenAI chat completions API.
 *
 * No bridge server or WebSocket needed — calls the API directly from the browser.
 */

import type { LLMAdapter, LLMMessage, LLMResponse } from './llmAdapter.ts'
import { stripJsonFences } from './jsonUtils.ts'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface OpenAICompatibleOptions {
  /** Base URL of the API. Examples:
   *  - Ollama: http://localhost:11434/v1
   *  - OpenRouter: https://openrouter.ai/api/v1
   *  - LM Studio: http://localhost:1234/v1
   *  - vLLM: http://localhost:8000/v1
   *  - Groq: https://api.groq.com/openai/v1
   */
  baseUrl: string
  /** Model name. Examples: qwen3:32b, meta-llama/llama-3.3-70b-instruct:free */
  model: string
  /** API key (required for OpenRouter, Groq; optional for local servers). */
  apiKey?: string
  /** Max output tokens. Default: 4096 */
  maxTokens?: number
  /** Temperature. Default: 0.7 */
  temperature?: number
  /** Request timeout in ms. Default: 300_000 (5 minutes) */
  timeout?: number
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class OpenAICompatibleAdapter implements LLMAdapter {
  private baseUrl: string
  private model: string
  private apiKey: string | undefined
  private maxTokens: number
  private temperature: number
  private timeout: number

  /** Expose connected status for compatibility with bridge adapter pattern. */
  get connected(): boolean { return true }

  constructor(options: OpenAICompatibleOptions) {
    // Strip trailing slash
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.model = options.model
    this.apiKey = options.apiKey
    this.maxTokens = options.maxTokens ?? 4096
    this.temperature = options.temperature ?? 0.7
    this.timeout = options.timeout ?? 300_000
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    const body = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
    }

    const data = await this.post('/chat/completions', body)
    return this.parseResponse(data)
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    // Append JSON instruction to last user message
    const augmented = messages.map((m, i) =>
      i === messages.length - 1 && m.role === 'user'
        ? { role: m.role, content: m.content + '\n\nRespond with valid JSON only. No markdown fences, no commentary.' }
        : m,
    )

    const body: Record<string, unknown> = {
      model: this.model,
      messages: augmented.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      response_format: { type: 'json_object' },
    }

    let data: ChatCompletionResponse
    try {
      data = await this.post('/chat/completions', body)
    } catch (err) {
      // Some providers don't support response_format — retry without it
      if (err instanceof Error && (err.message.includes('response_format') || err.message.includes('400'))) {
        delete body.response_format
        data = await this.post('/chat/completions', body)
      } else {
        throw err
      }
    }

    const response = this.parseResponse(data)
    response.content = stripJsonFences(response.content)
    return response
  }

  async *completeStream(messages: LLMMessage[]): AsyncIterable<string> {
    const body = {
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      stream: true,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`LLM API error ${res.status}: ${text.slice(0, 500)}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body for streaming')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const payload = trimmed.slice(6)
          if (payload === '[DONE]') return

          try {
            const chunk = JSON.parse(payload) as StreamChunk
            const delta = chunk.choices?.[0]?.delta?.content
            if (delta) yield delta
          } catch {
            // skip malformed chunks
          }
        }
      }
    } finally {
      clearTimeout(timer)
    }
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async post(path: string, body: unknown): Promise<ChatCompletionResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`LLM API error ${res.status}: ${text.slice(0, 500)}`)
      }

      return await res.json() as ChatCompletionResponse
    } finally {
      clearTimeout(timer)
    }
  }

  private parseResponse(data: ChatCompletionResponse): LLMResponse {
    const choice = data.choices?.[0]
    const content = choice?.message?.content ?? ''

    return {
      content,
      model: data.model ?? this.model,
      usage: data.usage
        ? { input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens }
        : undefined,
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI API response types (minimal subset)
// ---------------------------------------------------------------------------

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[]
  model?: string
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

interface StreamChunk {
  choices?: { delta?: { content?: string } }[]
}
