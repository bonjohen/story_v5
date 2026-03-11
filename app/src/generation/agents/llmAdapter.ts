/**
 * LLM Adapter: abstract interface for language model calls.
 * Allows the generation pipeline to work with any LLM provider,
 * or with a mock adapter for testing.
 */

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  model: string
  usage?: { input_tokens: number; output_tokens: number }
}

/** Per-call options that override adapter defaults. */
export interface LLMCompletionOptions {
  /** Override max output tokens for this call. */
  maxTokens?: number
}

export interface LLMAdapter {
  /** Send a completion request and return the response text. */
  complete(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMResponse>

  /** Stream a completion, yielding partial text chunks as they arrive. Optional. */
  completeStream?(messages: LLMMessage[], options?: LLMCompletionOptions): AsyncIterable<string>

  /** Complete with JSON output mode — strips fences, validates JSON. Optional. */
  completeJson?(messages: LLMMessage[], options?: LLMCompletionOptions): Promise<LLMResponse>
}

// ---------------------------------------------------------------------------
// Mock adapter (for testing and contract-only/outline modes)
// ---------------------------------------------------------------------------

export class MockLLMAdapter implements LLMAdapter {
  private responses: string[]
  private callIndex = 0

  constructor(responses: string[] = ['Mock LLM response']) {
    this.responses = responses
  }

  async complete(_messages: LLMMessage[], _options?: LLMCompletionOptions): Promise<LLMResponse> {
    const content = this.responses[this.callIndex % this.responses.length]
    this.callIndex++
    return Promise.resolve({
      content,
      model: 'mock',
      usage: { input_tokens: 0, output_tokens: content.length },
    })
  }
}
