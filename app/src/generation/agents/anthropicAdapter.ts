/**
 * AnthropicAdapter: LLM adapter that calls the Anthropic API directly
 * via the @anthropic-ai/sdk. No subprocess spawning needed.
 *
 * Reads ANTHROPIC_API_KEY from the environment.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter, LLMMessage, LLMResponse } from './llmAdapter.ts'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface AnthropicAdapterOptions {
  /** API key. Falls back to ANTHROPIC_API_KEY env var. */
  apiKey?: string
  /** Model ID. Default: claude-sonnet-4-20250514 */
  model?: string
  /** Max output tokens. Default: 4096 */
  maxTokens?: number
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic
  private model: string
  private maxTokens: number

  constructor(options: AnthropicAdapterOptions = {}) {
    this.client = new Anthropic({ apiKey: options.apiKey })
    this.model = options.model ?? 'claude-sonnet-4-20250514'
    this.maxTokens = options.maxTokens ?? 4096
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    const { system, conversation } = splitMessages(messages)

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      ...(system ? { system } : {}),
      messages: conversation,
    })

    const content = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return {
      content,
      model: response.model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    }
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.complete(messages)
  }

  async *completeStream(messages: LLMMessage[]): AsyncIterable<string> {
    const { system, conversation } = splitMessages(messages)

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      ...(system ? { system } : {}),
      messages: conversation,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitMessages(messages: LLMMessage[]): {
  system: string
  conversation: { role: 'user' | 'assistant'; content: string }[]
} {
  const systemParts: string[] = []
  const conversation: { role: 'user' | 'assistant'; content: string }[] = []

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemParts.push(msg.content)
    } else {
      conversation.push({ role: msg.role, content: msg.content })
    }
  }

  return { system: systemParts.join('\n\n'), conversation }
}
