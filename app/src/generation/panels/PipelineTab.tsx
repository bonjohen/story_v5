/**
 * PipelineTab — LLM connection, backend settings, import/export, telemetry.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useRequestStore } from '../store/requestStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { exportSnapshot, downloadSnapshot, parseSnapshot } from '../artifacts/storySnapshot.ts'
import { LABEL, INPUT } from './generationConstants.ts'
import type { LlmBackend } from '../store/requestStore.ts'

/** Preset configurations for common providers. */
const PRESETS = [
  { label: 'Ollama (local)', baseUrl: 'http://localhost:11434/v1', model: 'qwen3:32b', needsKey: false },
  { label: 'LM Studio (local)', baseUrl: 'http://localhost:1234/v1', model: 'loaded-model', needsKey: false },
  { label: 'OpenRouter (free)', baseUrl: 'https://openrouter.ai/api/v1', model: 'mistralai/mistral-small-3.1-24b-instruct:free', needsKey: true },
  { label: 'OpenRouter (Qwen3)', baseUrl: 'https://openrouter.ai/api/v1', model: 'qwen/qwen3-235b-a22b:free', needsKey: true },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', needsKey: true },
] as const

export function PipelineTab() {
  const running = useGenerationStore((s) => s.running)
  const contract = useGenerationStore((s) => s.contract)
  const plan = useGenerationStore((s) => s.plan)
  const llmTelemetry = useGenerationStore((s) => s.llmTelemetry)
  const loadSnapshot = useGenerationStore((s) => s.loadSnapshot)

  const llmBackend = useRequestStore((s) => s.llmBackend)
  const bridgeUrl = useRequestStore((s) => s.bridgeUrl)
  const setLlmBackend = useRequestStore((s) => s.setLlmBackend)
  const setBridgeUrl = useRequestStore((s) => s.setBridgeUrl)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const setMaxLlmCalls = useRequestStore((s) => s.setMaxLlmCalls)
  const bridgeStatus = useRequestStore((s) => s.bridgeStatus)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const disconnectBridge = useRequestStore((s) => s.disconnectBridge)

  const openaiBaseUrl = useRequestStore((s) => s.openaiBaseUrl)
  const openaiModel = useRequestStore((s) => s.openaiModel)
  const openaiApiKey = useRequestStore((s) => s.openaiApiKey)
  const setOpenaiBaseUrl = useRequestStore((s) => s.setOpenaiBaseUrl)
  const setOpenaiModel = useRequestStore((s) => s.setOpenaiModel)
  const setOpenaiApiKey = useRequestStore((s) => s.setOpenaiApiKey)

  // Auto-connect on mount if backend is set
  const autoConnectAttempted = useRef(false)
  useEffect(() => {
    if (autoConnectAttempted.current) return
    autoConnectAttempted.current = true
    const { bridgeStatus: bs, llmBackend: lb } = useRequestStore.getState()
    if (bs === 'disconnected' && lb !== 'none') {
      const timer = setTimeout(() => {
        void useRequestStore.getState().connectBridge()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConnect = useCallback(() => {
    void connectBridge()
  }, [connectBridge])

  const handlePreset = useCallback((idx: number) => {
    const p = PRESETS[idx]
    setLlmBackend('openai')
    setOpenaiBaseUrl(p.baseUrl)
    setOpenaiModel(p.model)
    if (!p.needsKey) setOpenaiApiKey('')
    disconnectBridge()
  }, [setLlmBackend, setOpenaiBaseUrl, setOpenaiModel, setOpenaiApiKey, disconnectBridge])

  const handleExport = useCallback(() => {
    const state = useGenerationStore.getState()
    const snapshot = exportSnapshot(state)
    downloadSnapshot(snapshot)
  }, [])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const snapshot = parseSnapshot(reader.result as string)
          loadSnapshot(snapshot)
        } catch (err) {
          console.error('Failed to import snapshot:', err)
          alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [loadSnapshot])

  const hasResults = contract || plan
  const backendLabel = bridgeStatus === 'connected'
    ? (llmBackend === 'openai' ? openaiModel : 'Claude Code bridge')
    : llmBackend === 'none' ? 'template only' : 'disconnected'

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* Connection status + connect button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        padding: '8px 10px',
        borderRadius: 6,
        border: '1px solid',
        borderColor: bridgeStatus === 'connected' ? '#22c55e40' : 'var(--border)',
        background: bridgeStatus === 'connected' ? '#22c55e08' : 'var(--bg-primary)',
      }}>
        <button
          onClick={handleConnect}
          disabled={running || bridgeStatus === 'connecting' || bridgeStatus === 'connected'}
          style={{
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 4,
            cursor: bridgeStatus === 'connecting' ? 'wait'
              : bridgeStatus === 'connected' ? 'default' : 'pointer',
            border: 'none',
            background: bridgeStatus === 'connected' ? '#22c55e'
              : bridgeStatus === 'error' ? '#ef4444'
              : 'var(--accent)',
            color: '#fff',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {bridgeStatus === 'connected' ? 'Connected'
            : bridgeStatus === 'connecting' ? 'Connecting...'
            : bridgeStatus === 'error' ? 'Retry'
            : 'Connect LLM'}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {bridgeStatus === 'connected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {backendLabel}
              </span>
              <button onClick={disconnectBridge} style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                Disconnect
              </button>
            </div>
          )}
          {bridgeStatus === 'error' && (
            <span style={{ fontSize: 10, color: '#ef4444', lineHeight: 1.3 }}>
              Connection failed. Check settings below.
            </span>
          )}
          {bridgeStatus === 'disconnected' && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
              {llmBackend === 'none' ? 'No LLM — template output only' : 'Not connected'}
            </span>
          )}
        </div>
      </div>

      {/* LLM Settings */}
      <Disclosure title="LLM Settings" persistKey="gen-llm-settings" defaultCollapsed={false}
        badge={backendLabel}>
        <div style={{ padding: '4px 12px 10px' }}>
          {/* Backend selector */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={LABEL}>Backend</span>
            <select
              value={llmBackend}
              onChange={(e) => {
                setLlmBackend(e.target.value as LlmBackend)
                disconnectBridge()
              }}
              disabled={running}
              style={INPUT}
            >
              <option value="none">None (deterministic template)</option>
              <option value="openai">OpenAI-Compatible (Ollama, OpenRouter, etc.)</option>
              <option value="bridge">Claude Code Bridge (WebSocket)</option>
            </select>
          </label>

          {/* OpenAI-compatible settings */}
          {llmBackend === 'openai' && (
            <>
              {/* Presets */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ ...LABEL, marginBottom: 4 }}>Quick Setup</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {PRESETS.map((p, i) => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(i)}
                      disabled={running}
                      style={{
                        fontSize: 10,
                        padding: '3px 8px',
                        borderRadius: 3,
                        border: '1px solid var(--border)',
                        color: openaiBaseUrl === p.baseUrl && openaiModel === p.model
                          ? '#22c55e' : 'var(--text-muted)',
                        background: openaiBaseUrl === p.baseUrl && openaiModel === p.model
                          ? '#22c55e10' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={LABEL}>Base URL</span>
                <input
                  type="text"
                  value={openaiBaseUrl}
                  onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  disabled={running || bridgeStatus === 'connected'}
                  placeholder="http://localhost:11434/v1"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={LABEL}>Model</span>
                <input
                  type="text"
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  disabled={running || bridgeStatus === 'connected'}
                  placeholder="qwen3:32b"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 8 }}>
                <span style={LABEL}>API Key (optional for local)</span>
                <input
                  type="password"
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  disabled={running || bridgeStatus === 'connected'}
                  placeholder="sk-... (leave empty for Ollama/LM Studio)"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }}
                />
              </label>
            </>
          )}

          {/* Bridge settings */}
          {llmBackend === 'bridge' && (
            <label style={{ display: 'block', marginBottom: 8 }}>
              <span style={LABEL}>Bridge URL</span>
              <input
                type="text"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                disabled={running || bridgeStatus === 'connected'}
                placeholder="ws://127.0.0.1:8765"
                style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }}
              />
            </label>
          )}

          {/* Max LLM calls */}
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={LABEL}>Max LLM Calls</span>
            <input
              type="number"
              value={maxLlmCalls}
              onChange={(e) => setMaxLlmCalls(Number(e.target.value))}
              disabled={running}
              min={1}
              max={100}
              style={{ ...INPUT, width: 80 }}
            />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block', lineHeight: 1.4 }}>
              Hard cap on LLM calls per run. Pipeline stops gracefully when reached.
            </span>
          </label>
        </div>
      </Disclosure>

      {/* Import / Export */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, marginBottom: 12 }}>
        <button
          onClick={handleImport}
          disabled={running}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: 11,
            borderRadius: 4,
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: running ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Import Snapshot
        </button>
        {hasResults && (
          <button
            onClick={handleExport}
            disabled={running}
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Export Snapshot
          </button>
        )}
      </div>

      {/* LLM Telemetry */}
      {llmTelemetry.length > 0 && (
        <Disclosure title="LLM Telemetry" persistKey="gen-llm-telemetry" defaultCollapsed={false}
          badge={`${llmTelemetry.length} calls`}>
          <div style={{ padding: '4px 0' }}>
            <div style={{
              display: 'flex',
              gap: 12,
              padding: '4px 8px',
              marginBottom: 4,
              fontSize: 10,
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border)',
            }}>
              <span>Total: {llmTelemetry.length}</span>
              <span>OK: {llmTelemetry.filter(t => t.status === 'success').length}</span>
              <span style={{ color: llmTelemetry.some(t => t.status === 'error') ? '#ef4444' : undefined }}>
                Errors: {llmTelemetry.filter(t => t.status === 'error').length}
              </span>
              <span>
                In: {(llmTelemetry.reduce((s, t) => s + t.inputChars, 0) / 1024).toFixed(1)}KB
              </span>
              <span>
                Out: {(llmTelemetry.filter(t => t.outputChars).reduce((s, t) => s + (t.outputChars ?? 0), 0) / 1024).toFixed(1)}KB
              </span>
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {llmTelemetry.map((t) => (
                <div key={t.callNumber} style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'baseline',
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: t.status === 'error' ? '#ef4444'
                    : t.status === 'success' ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
                }}>
                  <span style={{ width: 24, flexShrink: 0, textAlign: 'right' }}>#{t.callNumber}</span>
                  <span style={{ width: 55, flexShrink: 0 }}>{t.method === 'completeJson' ? 'json' : t.method === 'completeStream' ? 'stream' : 'text'}</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{(t.inputChars / 1024).toFixed(1)}K in</span>
                  <span style={{ width: 50, flexShrink: 0 }}>{t.outputChars != null ? `${(t.outputChars / 1024).toFixed(1)}K out` : '...'}</span>
                  <span style={{ width: 40, flexShrink: 0 }}>{t.durationMs != null ? `${(t.durationMs / 1000).toFixed(1)}s` : ''}</span>
                  <span style={{
                    fontWeight: 600,
                    color: t.status === 'error' ? '#ef4444'
                      : t.status === 'success' ? '#22c55e'
                      : '#f59e0b',
                  }}>
                    {t.status === 'error' ? 'FAIL' : t.status === 'success' ? 'OK' : 'WAIT'}
                  </span>
                  {t.error && (
                    <span style={{ color: '#ef4444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.error.slice(0, 80)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Disclosure>
      )}
    </div>
  )
}
