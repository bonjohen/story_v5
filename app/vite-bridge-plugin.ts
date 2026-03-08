/**
 * Vite plugin that auto-starts the Claude Code Bridge Server
 * when the dev server starts. The bridge listens on ws://127.0.0.1:8765
 * so the browser UI can connect without manual terminal commands.
 *
 * IMPORTANT: Cleans Claude Code session env vars so the bridge's
 * child `claude --print` calls don't detect a nested session.
 */

import type { Plugin } from 'vite'
import { spawn, type ChildProcess } from 'child_process'
import path from 'path'

/** Return a clean copy of process.env without Claude Code session vars. */
function cleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env }
  delete env.CLAUDECODE
  delete env.CLAUDE_CODE_SSE_PORT
  delete env.CLAUDE_CODE_ENTRYPOINT
  return env
}

export function bridgePlugin(): Plugin {
  let child: ChildProcess | null = null

  return {
    name: 'claude-bridge',
    apply: 'serve', // only in dev mode

    configureServer() {
      const scriptPath = path.resolve(__dirname, 'scripts/start_bridge.ts')

      child = spawn('npx', ['tsx', scriptPath, '--verbose'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: cleanEnv(),
      })

      child.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim()
        if (line) console.log(`[bridge] ${line}`)
      })

      child.stderr?.on('data', (data: Buffer) => {
        const line = data.toString().trim()
        if (line) console.log(`[bridge] ${line}`)
      })

      child.on('error', (err) => {
        console.warn(`[bridge] Failed to start bridge server: ${err.message}`)
        child = null
      })

      child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
          console.warn(`[bridge] Bridge server exited with code ${code} (port may already be in use — bridge likely already running)`)
        }
        child = null
      })

      console.log('[bridge] Starting Claude Code bridge server on ws://127.0.0.1:8765')
    },

    closeBundle() {
      if (child) {
        child.kill()
        child = null
      }
    },
  }
}
