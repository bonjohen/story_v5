/**
 * AnthropicAdapter: LLM adapter backed by the Anthropic Claude API.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter, LLMMessage, LLMResponse } from './llmAdapter.ts'

export interface AnthropicAdapterOptions {
  apiKey?: string
  model?: string
  maxTokens?: number
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_MAX_TOKENS = 1024

export class AnthropicAdapter implements LLMAdapter {
  private client: Anthropic
  private model: string
  private maxTokens: number

  constructor(options: AnthropicAdapterOptions = {}) {
    this.client = new Anthropic({ apiKey: options.apiKey })
    this.model = options.model ?? DEFAULT_MODEL
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    // Separate system message from conversation messages
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      ...(systemMessage ? { system: systemMessage.content } : {}),
      messages: conversationMessages,
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    const content = textBlock?.type === 'text' ? textBlock.text : ''

    return {
      content,
      model: response.model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    }
  }
}
