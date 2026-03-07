/**
 * Bridge Server: WebSocket server that exposes ClaudeCodeAdapter to browser clients.
 *
 * Accepts JSON-encoded LLMMessage[] requests over WebSocket,
 * delegates to ClaudeCodeAdapter, and returns LLMResponse results.
 *
 * Protocol:
 *   Client → Server: { id: string, type: 'complete' | 'completeJson', messages: LLMMessage[] }
 *   Server → Client: { id: string, type: 'response', response: LLMResponse }
 *   Server → Client: { id: string, type: 'error', error: string }
 *
 * Designed for Node.js CLI usage — not importable in browser bundles.
 */

import { WebSocketServer, WebSocket } from 'ws'
import { ClaudeCodeAdapter } from '../agents/claudeCodeAdapter.ts'
import type { LLMMessage, LLMResponse } from '../agents/llmAdapter.ts'
import type { ClaudeCodeAdapterOptions } from '../agents/claudeCodeAdapter.ts'

// ---------------------------------------------------------------------------
// Protocol types
// ---------------------------------------------------------------------------

interface BridgeRequest {
  id: string
  type: 'complete' | 'completeJson'
  messages: LLMMessage[]
}

interface BridgeResponseOk {
  id: string
  type: 'response'
  response: LLMResponse
}

interface BridgeResponseError {
  id: string
  type: 'error'
  error: string
}

type BridgeResponse = BridgeResponseOk | BridgeResponseError

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export interface BridgeServerOptions {
  port?: number
  host?: string
  adapterOptions?: ClaudeCodeAdapterOptions
  verbose?: boolean
}

export class BridgeServer {
  private wss: WebSocketServer | null = null
  private adapter: ClaudeCodeAdapter
  private verbose: boolean
  private port: number
  private host: string

  constructor(options: BridgeServerOptions = {}) {
    this.port = options.port ?? 8765
    this.host = options.host ?? '127.0.0.1'
    this.verbose = options.verbose ?? false
    this.adapter = new ClaudeCodeAdapter(options.adapterOptions ?? {})
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({
        port: this.port,
        host: this.host,
      })

      this.wss.on('listening', () => {
        if (this.verbose) {
          console.error(`[bridge] Listening on ws://${this.host}:${this.port}`)
        }
        resolve()
      })

      this.wss.on('error', (err) => {
        reject(err)
      })

      this.wss.on('connection', (ws) => {
        if (this.verbose) {
          console.error('[bridge] Client connected')
        }
        this.handleConnection(ws)
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve()
        return
      }

      // Close all client connections
      for (const client of this.wss.clients) {
        client.close()
      }

      this.wss.close(() => {
        if (this.verbose) {
          console.error('[bridge] Server stopped')
        }
        this.wss = null
        resolve()
      })
    })
  }

  get clientCount(): number {
    return this.wss?.clients.size ?? 0
  }

  private handleConnection(ws: WebSocket): void {
    ws.on('message', async (data) => {
      let request: BridgeRequest

      try {
        request = JSON.parse(data.toString())
      } catch {
        ws.send(JSON.stringify({
          id: 'unknown',
          type: 'error',
          error: 'Invalid JSON in request',
        } satisfies BridgeResponse))
        return
      }

      if (!request.id || !request.type || !Array.isArray(request.messages)) {
        ws.send(JSON.stringify({
          id: request.id ?? 'unknown',
          type: 'error',
          error: 'Missing required fields: id, type, messages',
        } satisfies BridgeResponse))
        return
      }

      if (this.verbose) {
        console.error(`[bridge] Request ${request.id}: ${request.type} (${request.messages.length} messages)`)
      }

      try {
        let response: LLMResponse

        if (request.type === 'completeJson' && this.adapter.completeJson) {
          response = await this.adapter.completeJson(request.messages)
        } else {
          response = await this.adapter.complete(request.messages)
        }

        const reply: BridgeResponse = {
          id: request.id,
          type: 'response',
          response,
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(reply))
        }
      } catch (err) {
        const errorReply: BridgeResponse = {
          id: request.id,
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
        }

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(errorReply))
        }
      }
    })

    ws.on('close', () => {
      if (this.verbose) {
        console.error('[bridge] Client disconnected')
      }
    })
  }
}
