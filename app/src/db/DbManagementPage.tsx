/**
 * Database Management Page — view status, export/import .db, reset.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { ensureDbInit, getDb, resetDb } from './index.ts'
import { exportDatabase, importDatabase } from './export.ts'
import { importVocabulary } from './import/vocabularyImporter.ts'
import { VocabularyBrowser } from './panels/VocabularyBrowser.tsx'
import { TemplateCoverage } from './panels/TemplateCoverage.tsx'

type DbTab = 'status' | 'vocabulary' | 'coverage'

const TOOLBAR_HEIGHT = 42

interface TableInfo {
  name: string
  count: number
}

export function DbManagementPage() {
  const [schemaVersion, setSchemaVersion] = useState<number>(0)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [dbSize, setDbSize] = useState<number>(0)
  const [status, setStatus] = useState<string>('Loading...')
  const [vocabStatus, setVocabStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DbTab>('status')
  const fileRef = useRef<HTMLInputElement>(null)

  const refreshStats = useCallback(async () => {
    try {
      await ensureDbInit()
      const db = await getDb()

      // Schema version
      const versionResult = db.exec('SELECT MAX(version_num) FROM schema_version')
      const version = versionResult.length && versionResult[0].values[0][0] != null
        ? versionResult[0].values[0][0] as number
        : 0
      setSchemaVersion(version)

      // Table row counts
      const tableNames = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name != 'schema_version' ORDER BY name")
      const tableInfo: TableInfo[] = []
      if (tableNames.length) {
        for (const row of tableNames[0].values) {
          const name = row[0] as string
          const countResult = db.exec(`SELECT COUNT(*) FROM "${name}"`)
          const count = countResult.length ? countResult[0].values[0][0] as number : 0
          tableInfo.push({ name, count })
        }
      }
      setTables(tableInfo)

      // DB size
      const exported = db.export()
      setDbSize(exported.length)

      setStatus('Ready')
    } catch (err) {
      setStatus(`Error: ${err}`)
    }
  }, [])

  useEffect(() => { void refreshStats() }, [refreshStats])

  const handleExport = async () => {
    try {
      const data = await exportDatabase()
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'story_metadata.db'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setStatus(`Export failed: ${err}`)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const result = await importDatabase(new Uint8Array(buf))
      setStatus(`Imported. Schema v${result.schemaVersion}. Reload page to activate.`)
    } catch (err) {
      setStatus(`Import failed: ${err}`)
    }
    e.target.value = ''
  }

  const handleReset = async () => {
    if (!confirm('Reset database? This deletes all indexed data.')) return
    try {
      await resetDb()
      setStatus('Database reset. Reload page.')
      setTables([])
      setSchemaVersion(0)
      setDbSize(0)
    } catch (err) {
      setStatus(`Reset failed: ${err}`)
    }
  }

  const handleImportVocab = async () => {
    try {
      setVocabStatus('Importing vocabulary...')
      await ensureDbInit()
      const db = await getDb()
      const result = await importVocabulary(db, import.meta.env.BASE_URL)
      const { saveDb } = await import('./index.ts')
      await saveDb()
      setVocabStatus(`Imported ${result.domains} domains, ${result.terms} terms`)
      void refreshStats()
      setTimeout(() => setVocabStatus(null), 5000)
    } catch (err) {
      setVocabStatus(`Error: ${err}`)
      setTimeout(() => setVocabStatus(null), 5000)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="page-shell" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      <div className="page-toolbar" style={{
        height: TOOLBAR_HEIGHT, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
        flexShrink: 0,
      }}>
        <a href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>Database</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{status}</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', flexShrink: 0,
      }}>
        {(['status', 'vocabulary', 'coverage'] as DbTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', fontSize: 11,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#22c55e' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'vocabulary' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <VocabularyBrowser />
        </div>
      )}

      {activeTab === 'coverage' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TemplateCoverage />
        </div>
      )}

      {activeTab === 'status' && (
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px', maxWidth: 640 }}>
        {/* Status */}
        <Section title="Status">
          <Row label="Schema Version" value={String(schemaVersion)} />
          <Row label="Database Size" value={formatBytes(dbSize)} />
        </Section>

        {/* Table Counts */}
        <Section title="Tables">
          {tables.map((t) => (
            <Row key={t.name} label={t.name} value={String(t.count)} />
          ))}
          {tables.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No tables found</p>}
        </Section>

        {/* Actions */}
        <Section title="Actions">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionButton label="Export .db" onClick={() => void handleExport()} />
            <ActionButton label="Import .db" onClick={() => fileRef.current?.click()} />
            <ActionButton label="Import Vocabulary" onClick={() => void handleImportVocab()} color="#3b82f6" />
            <ActionButton label="Reset DB" onClick={() => void handleReset()} color="#ef4444" />
          </div>
          {vocabStatus && (
            <p style={{ fontSize: 11, color: vocabStatus.startsWith('Error') ? '#ef4444' : '#22c55e', marginTop: 8 }}>
              {vocabStatus}
            </p>
          )}
          <input ref={fileRef} type="file" accept=".db" onChange={(e) => void handleImport(e)} style={{ display: 'none' }} />
        </Section>
      </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 8,
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 8px', fontSize: 12, borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function ActionButton({ label, onClick, color }: { label: string; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, padding: '6px 14px', borderRadius: 4,
        border: `1px solid ${color ?? 'var(--border)'}`,
        background: 'transparent',
        color: color ?? 'var(--text-primary)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
