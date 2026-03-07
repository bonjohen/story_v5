/**
 * Start the Claude Code Bridge Server.
 *
 * Exposes ClaudeCodeAdapter over WebSocket so the browser UI
 * can delegate LLM calls to the local Claude Code CLI.
 *
 * Usage:
 *   npx tsx app/scripts/start_bridge.ts [options]
 *
 * Options:
 *   --port <n>           WebSocket port (default: 8765)
 *   --host <addr>        Bind address (default: 127.0.0.1)
 *   --model <model>      LLM model to use
 *   --claude-path <path> Path to claude binary
 *   --verbose            Enable verbose logging
 */

import { resolve } from 'path'
import { BridgeServer } from '../src/generation/bridge/bridgeServer.ts'

const args = process.argv.slice(2)

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined
}

const port = parseInt(getArg('--port') ?? '8765', 10)
const host = getArg('--host') ?? '127.0.0.1'
const model = getArg('--model')
const claudePath = getArg('--claude-path')
const verbose = args.includes('--verbose')
const PROJECT_ROOT = resolve(import.meta.dirname ?? '.', '../..')

const server = new BridgeServer({
  port,
  host,
  verbose,
  adapterOptions: {
    claudePath: claudePath ?? undefined,
    model: model ?? undefined,
    verbose,
    cwd: PROJECT_ROOT,
  },
})

async function main() {
  console.log(`\n=== Claude Code Bridge Server ===`)
  console.log(`Starting on ws://${host}:${port}`)
  console.log(`Model: ${model ?? '(default)'}`)
  console.log('')

  await server.start()
  console.log(`Bridge server ready. Connect from the browser UI.`)
  console.log(`Press Ctrl+C to stop.\n`)
}

process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await server.stop()
  process.exit(0)
})

main().catch((err) => {
  console.error('Failed to start bridge server:', err)
  process.exit(1)
})
