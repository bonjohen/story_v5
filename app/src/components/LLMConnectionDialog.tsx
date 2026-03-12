/**
 * LLMConnectionDialog — modal dialog for configuring LLM connection settings.
 * Accessible from the navigation menu. Follows the SettingsPanel pattern.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRequestStore } from '../generation/store/requestStore.ts'
import { useUIStore } from '../store/uiStore.ts'
import { STATUS_COLORS } from '../theme/colors.ts'
import { INPUT } from '../generation/panels/generationConstants.ts'
import { OpenAICompatibleAdapter } from '../generation/agents/openaiCompatibleAdapter.ts'
import type { LlmBackend } from '../generation/store/requestStore.ts'

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2,
}

type TestResult = { status: 'idle' | 'testing' | 'pass' | 'fail'; message: string }
const IDLE_RESULT: TestResult = { status: 'idle', message: '' }

export function LLMConnectionDialog() {
  const setLlmDialogOpen = useUIStore((s) => s.setLlmDialogOpen)
  const panelRef = useRef<HTMLDivElement>(null)

  // Request store state
  const llmBackend = useRequestStore((s) => s.llmBackend)
  const setLlmBackend = useRequestStore((s) => s.setLlmBackend)
  const bridgeUrl = useRequestStore((s) => s.bridgeUrl)
  const setBridgeUrl = useRequestStore((s) => s.setBridgeUrl)
  const disconnectBridge = useRequestStore((s) => s.disconnectBridge)
  const connectBridge = useRequestStore((s) => s.connectBridge)
  const openaiBaseUrl = useRequestStore((s) => s.openaiBaseUrl)
  const setOpenaiBaseUrl = useRequestStore((s) => s.setOpenaiBaseUrl)
  const openaiModel = useRequestStore((s) => s.openaiModel)
  const setOpenaiModel = useRequestStore((s) => s.setOpenaiModel)
  const openaiApiKey = useRequestStore((s) => s.openaiApiKey)
  const setOpenaiApiKey = useRequestStore((s) => s.setOpenaiApiKey)
  const openaiPlanningModel = useRequestStore((s) => s.openaiPlanningModel)
  const setOpenaiPlanningModel = useRequestStore((s) => s.setOpenaiPlanningModel)
  const bridgeError = useRequestStore((s) => s.bridgeError)
  const maxLlmCalls = useRequestStore((s) => s.maxLlmCalls)
  const setMaxLlmCalls = useRequestStore((s) => s.setMaxLlmCalls)
  const skipValidation = useRequestStore((s) => s.skipValidation)
  const setSkipValidation = useRequestStore((s) => s.setSkipValidation)
  const fastDraft = useRequestStore((s) => s.fastDraft)
  const setFastDraft = useRequestStore((s) => s.setFastDraft)

  // Test results — local state
  const [mainTest, setMainTest] = useState<TestResult>(IDLE_RESULT)
  const [planningTest, setPlanningTest] = useState<TestResult>(IDLE_RESULT)
  const testing = mainTest.status === 'testing' || planningTest.status === 'testing'

  const close = useCallback(() => setLlmDialogOpen(false), [setLlmDialogOpen])

  // Escape key to close
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [close])

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, input, select, [tabindex]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  // Test both connections
  const handleTest = useCallback(async () => {
    const state = useRequestStore.getState()

    if (state.llmBackend === 'none') {
      setMainTest({ status: 'pass', message: 'No LLM backend selected (template-only mode)' })
      setPlanningTest(IDLE_RESULT)
      return
    }

    // --- Test main model ---
    setMainTest({ status: 'testing', message: '' })
    try {
      let adapter
      if (state.llmBackend === 'openai') {
        adapter = new OpenAICompatibleAdapter({
          baseUrl: state.openaiBaseUrl,
          model: state.openaiModel,
          apiKey: state.openaiApiKey || undefined,
        })
      } else {
        // Bridge — use connectBridge which handles BridgeAdapter
        // For a quick test, create a temporary OpenAI adapter pointed at bridge
        // Actually, just use the store's connectBridge for bridge backend
        await connectBridge()
        const newState = useRequestStore.getState()
        if (newState.bridgeStatus === 'connected') {
          setMainTest({ status: 'pass', message: `Connected — ${newState.helloResponse?.slice(0, 80) ?? 'OK'}` })
        } else {
          setMainTest({ status: 'fail', message: newState.bridgeError ?? 'Connection failed' })
        }
        // Skip to planning test
        testPlanning(state)
        return
      }
      const resp = await adapter.complete([{ role: 'user', content: 'Hello' }])
      const reply = resp.content.trim().slice(0, 80)
      setMainTest({ status: 'pass', message: `${state.openaiModel} — ${reply}` })
    } catch (err) {
      setMainTest({ status: 'fail', message: err instanceof Error ? err.message : String(err) })
    }

    // --- Test planning model ---
    testPlanning(state)

    async function testPlanning(s: typeof state) {
      if (!s.openaiPlanningModel || s.llmBackend !== 'openai') {
        setPlanningTest(IDLE_RESULT)
        return
      }
      setPlanningTest({ status: 'testing', message: '' })
      try {
        const planAdapter = new OpenAICompatibleAdapter({
          baseUrl: s.openaiBaseUrl,
          model: s.openaiPlanningModel,
          apiKey: s.openaiApiKey || undefined,
        })
        const resp = await planAdapter.complete([{ role: 'user', content: 'Hello' }])
        const reply = resp.content.trim().slice(0, 80)
        setPlanningTest({ status: 'pass', message: `${s.openaiPlanningModel} — ${reply}` })
      } catch (err) {
        setPlanningTest({ status: 'fail', message: err instanceof Error ? err.message : String(err) })
      }
    }
  }, [connectBridge])

  // Save — reconnect with current settings
  const handleSave = useCallback(async () => {
    disconnectBridge()
    const state = useRequestStore.getState()
    if (state.llmBackend !== 'none') {
      await connectBridge()
    }
  }, [disconnectBridge, connectBridge])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Dialog */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="LLM Connection"
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 460,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 201,
          padding: 20,
          animation: 'fadeIn 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            LLM Connection
          </span>
          <button
            onClick={close}
            aria-label="Close"
            style={{
              fontSize: 18,
              color: 'var(--text-muted)',
              padding: '4px 8px',
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {'\u2715'}
          </button>
        </div>

        {/* Backend selector */}
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={LABEL}>Backend</span>
          <select
            value={llmBackend}
            onChange={(e) => { setLlmBackend(e.target.value as LlmBackend); disconnectBridge() }}
            style={{ ...INPUT, fontSize: 12 }}
          >
            <option value="none">None (template only)</option>
            <option value="openai">OpenAI-Compatible</option>
            <option value="bridge">Claude Code Bridge</option>
          </select>
        </label>

        {/* OpenAI-specific fields */}
        {llmBackend === 'openai' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <label style={{ flex: 2 }}>
                <span style={LABEL}>Base URL</span>
                <input type="text" value={openaiBaseUrl} onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Model</span>
                <input type="text" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}
                  placeholder="llama3-8k"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>API Key (optional)</span>
                <input type="password" value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="leave empty for Ollama"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }} />
              </label>
              <label style={{ flex: 1 }}>
                <span style={LABEL}>Planning Model</span>
                <input type="text" value={openaiPlanningModel} onChange={(e) => setOpenaiPlanningModel(e.target.value)}
                  placeholder="e.g. deepseek-r1:1.5b"
                  style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }} />
              </label>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, padding: '4px 0', marginBottom: 12 }}>
              Ollama tip: set <code style={{ background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 2 }}>OLLAMA_KEEP_ALIVE=-1</code> and <code style={{ background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 2 }}>OLLAMA_FLASH_ATTENTION=1</code> before <code style={{ background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 2 }}>ollama serve</code>
            </div>
          </>
        )}

        {llmBackend === 'bridge' && (
          <label style={{ display: 'block', marginBottom: 12 }}>
            <span style={LABEL}>Bridge URL</span>
            <input type="text" value={bridgeUrl} onChange={(e) => setBridgeUrl(e.target.value)}
              placeholder="ws://127.0.0.1:8765"
              style={{ ...INPUT, fontFamily: 'monospace', fontSize: 11 }} />
          </label>
        )}

        {/* Test Connections button + results */}
        {llmBackend !== 'none' && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => void handleTest()}
              disabled={testing}
              style={{
                padding: '6px 16px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                border: '1px solid var(--border)', cursor: testing ? 'not-allowed' : 'pointer',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {testing ? 'Testing...' : 'Test Connections'}
            </button>

            {/* Main model result */}
            {mainTest.status !== 'idle' && (
              <TestResultRow label={llmBackend === 'bridge' ? 'Bridge' : `Model: ${openaiModel}`} result={mainTest} />
            )}

            {/* Planning model result */}
            {planningTest.status !== 'idle' && (
              <TestResultRow label={`Planning: ${openaiPlanningModel}`} result={planningTest} />
            )}
          </div>
        )}

        {/* Connection/bridge error */}
        {bridgeError && mainTest.status === 'idle' && (
          <div style={{
            marginBottom: 12, padding: '8px 10px', fontSize: 11,
            background: `${STATUS_COLORS.error}12`, border: `1px solid ${STATUS_COLORS.error}40`,
            borderRadius: 4, color: STATUS_COLORS.error,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace',
            maxHeight: 120, overflowY: 'auto', lineHeight: 1.5,
          }}>
            {bridgeError}
          </div>
        )}

        {/* Generation options */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
          <div style={{ ...LABEL, marginBottom: 8 }}>Generation Options</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <label style={{ flex: 1 }}>
              <span style={{ ...LABEL, fontSize: 9 }}>Max LLM Calls</span>
              <input type="number" value={maxLlmCalls} onChange={(e) => setMaxLlmCalls(Number(e.target.value))}
                min={1} max={100} style={{ ...INPUT, fontSize: 11 }} />
            </label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 6 }}>
            <input type="checkbox" checked={skipValidation} onChange={(e) => setSkipValidation(e.target.checked)} />
            Skip Validation (saves ~72 LLM calls)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={fastDraft} onChange={(e) => setFastDraft(e.target.checked)} />
            Fast Draft (all optimizations)
          </label>
        </div>

        {/* Footer: Save + Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => void handleSave()}
            disabled={testing}
            title="Reconnect with current settings"
            style={{
              padding: '6px 20px', fontSize: 12, fontWeight: 600, borderRadius: 4,
              border: 'none', cursor: testing ? 'not-allowed' : 'pointer',
              background: 'var(--accent)', color: '#fff',
            }}
          >
            Save
          </button>
          <button
            onClick={close}
            style={{
              padding: '6px 16px', fontSize: 12, borderRadius: 4,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}


function TestResultRow({ label, result }: { label: string; result: TestResult }) {
  const color = result.status === 'pass' ? STATUS_COLORS.pass
    : result.status === 'fail' ? STATUS_COLORS.fail
    : 'var(--text-muted)'
  const icon = result.status === 'pass' ? '\u2713'
    : result.status === 'fail' ? '\u2717'
    : result.status === 'testing' ? '\u25CF'
    : ''

  return (
    <div style={{
      padding: '6px 10px', marginBottom: 4, fontSize: 11, borderRadius: 4,
      background: result.status === 'fail' ? `${STATUS_COLORS.fail}12` : result.status === 'pass' ? `${STATUS_COLORS.pass}12` : 'var(--bg-elevated)',
      border: `1px solid ${result.status === 'fail' ? `${STATUS_COLORS.fail}40` : result.status === 'pass' ? `${STATUS_COLORS.pass}40` : 'var(--border)'}`,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{
        color,
        fontWeight: 700,
        flexShrink: 0,
        animation: result.status === 'testing' ? 'pulse 1.5s infinite' : undefined,
      }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color, marginBottom: result.message ? 2 : 0 }}>{label}</div>
        {result.message && (
          <div style={{
            fontSize: 10, color: result.status === 'fail' ? STATUS_COLORS.fail : 'var(--text-muted)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', lineHeight: 1.4,
          }}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
