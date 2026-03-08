/**
 * PipelineTab — LLM connection, backend settings, import/export, telemetry.
 */

import { useCallback, useRef, useEffect } from 'react'
import { useRequestStore } from '../store/requestStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { Disclosure } from '../../components/Disclosure.tsx'
import { exportSnapshot, downloadSnapshot, parseSnapshot } from '../artifacts/storySnapshot.ts'
import { LABEL, INPUT } from './generationConstants.ts'

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

  // Auto-connect to bridge on mount
  const autoConnectAttempted = useRef(false)
  useEffect(() => {
    if (autoConnectAttempted.current) return
    autoConnectAttempted.current = true
    const { bridgeStatus: bs } = useRequestStore.getState()
    if (bs === 'disconnected') {
      const timer = setTimeout(() => {
        void useRequestStore.getState().connectBridge()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleConnect = useCallback(() => {
    void connectBridge()
  }, [connectBridge])

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

  return (
    <div style={{ padding: '10px 12px' }}>
      {/* LLM Connection */}
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
          {bridgeStatus === 'connected' ? 'LLM Connected'
            : bridgeStatus === 'connecting' ? 'Connecting...'
            : bridgeStatus === 'error' ? 'Retry Connection'
            : 'Connect LLM'}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          {bridgeStatus === 'connected' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bridgeUrl}
              </span>
              <button onClick={disconnectBridge} style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                Disconnect
              </button>
            </div>
          )}
          {bridgeStatus === 'error' && (
            <span style={{ fontSize: 10, color: '#ef4444', lineHeight: 1.3 }}>
              Could not connect to bridge at {bridgeUrl}
            </span>
          )}
          {bridgeStatus === 'disconnected' && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>
              {llmBackend === 'none' ? 'No LLM — template output only' : 'Claude Code bridge'}
            </span>
          )}
        </div>
      </div>

      {/* LLM Settings */}
      <Disclosure title="LLM Settings" persistKey="gen-llm-settings" defaultCollapsed={true}
        badge={llmBackend === 'bridge' ? 'bridge' : 'template'}>
        <div style={{ padding: '4px 12px 10px' }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            <span style={LABEL}>Backend</span>
            <select
              value={llmBackend}
              onChange={(e) => setLlmBackend(e.target.value as 'none' | 'bridge')}
              disabled={running}
              style={INPUT}
            >
              <option value="none">None (deterministic template)</option>
              <option value="bridge">Claude Code (local bridge)</option>
            </select>
          </label>
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
          {llmBackend === 'bridge' && (
            <label style={{ display: 'block' }}>
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
