/**
 * BridgeAdapter: browser-side LLMAdapter that connects to a local
 * BridgeServer via WebSocket to delegate LLM calls to Claude Code CLI.
 *
 * Usage:
 *   const adapter = new BridgeAdapter({ url: 'ws://127.0.0.1:8765' })
 *   await adapter.connect()
 *   const response = await adapter.complete(messages)
 *   adapter.disconnect()
 */

import type { LLMAdapter, LLMMessage, LLMResponse } from '../agents/llmAdapter.ts'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface BridgeAdapterOptions {
  /** WebSocket URL of the bridge server. Default: ws://127.0.0.1:8765 */
  url?: string
  /** Timeout per request in milliseconds. Default: 600_000 (10 minutes) */
  timeout?: number
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class BridgeAdapter implements LLMAdapter {
  private url: string
  private timeout: number
  private ws: WebSocket | null = null
  private requestId = 0
  private pending = new Map<string, {
    resolve: (response: LLMResponse) => void
    reject: (error: Error) => void
    timer: ReturnType<typeof setTimeout>
  }>()

  constructor(options: BridgeAdapterOptions = {}) {
    this.url = options.url ?? 'ws://127.0.0.1:8765'
    this.timeout = options.timeout ?? 600_000
  }

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        resolve()
      }

      this.ws.onerror = (event) => {
        reject(new Error(`Bridge connection failed: ${event}`))
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string)
      }

      this.ws.onclose = () => {
        // Reject all pending requests
        for (const [id, { reject: rej, timer }] of this.pending) {
          clearTimeout(timer)
          rej(new Error('Bridge connection closed'))
          this.pending.delete(id)
        }
        this.ws = null
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.sendRequest('complete', messages)
  }

  async completeJson(messages: LLMMessage[]): Promise<LLMResponse> {
    return this.sendRequest('completeJson', messages)
  }

  private sendRequest(type: 'complete' | 'completeJson', messages: LLMMessage[]): Promise<LLMResponse> {
    if (!this.connected) {
      return Promise.reject(new Error('Bridge not connected. Call connect() first.'))
    }

    const id = `req_${++this.requestId}`

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Bridge request ${id} timed out after ${this.timeout}ms`))
      }, this.timeout)

      this.pending.set(id, { resolve, reject, timer })

      this.ws!.send(JSON.stringify({ id, type, messages }))
    })
  }

  private handleMessage(data: string): void {
    let msg: { id: string; type: string; response?: LLMResponse; error?: string }

    try {
      msg = JSON.parse(data)
    } catch {
      return // ignore malformed messages
    }

    const pending = this.pending.get(msg.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(msg.id)

    if (msg.type === 'error') {
      pending.reject(new Error(msg.error ?? 'Unknown bridge error'))
    } else if (msg.type === 'response' && msg.response) {
      pending.resolve(msg.response)
    } else {
      pending.reject(new Error(`Unexpected bridge response type: ${msg.type}`))
    }
  }
}
