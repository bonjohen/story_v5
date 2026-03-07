/**
 * Vocabulary Browser — browse all imported vocabulary domains and terms.
 */

import { useState } from 'react'
import { useDbQuery } from '../hooks.ts'
import { listDomains, listTermsByDomain, listUsagesForTerm } from '../repository/vocabularyRepo.ts'
import type { VocabularyDomainRow, VocabularyTermRow, TermUsageRow } from '../types.ts'

export function VocabularyBrowser() {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)

  const { data: domains } = useDbQuery<VocabularyDomainRow[]>((db) => listDomains(db))
  const { data: terms } = useDbQuery<VocabularyTermRow[]>(
    (db) => selectedDomain ? listTermsByDomain(db, selectedDomain) : [],
    [selectedDomain],
  )
  const { data: usages } = useDbQuery<TermUsageRow[]>(
    (db) => selectedTerm ? listUsagesForTerm(db, selectedTerm) : [],
    [selectedTerm],
  )

  return (
    <div className="vocab-browser" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Domain list */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Domains ({domains?.length ?? 0})
        </div>
        {domains?.map((d) => (
          <button
            key={d.domain_id}
            onClick={() => { setSelectedDomain(d.domain_id); setSelectedTerm(null) }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px 10px', marginBottom: 2, borderRadius: 3,
              fontSize: 11, fontWeight: selectedDomain === d.domain_id ? 600 : 400,
              color: selectedDomain === d.domain_id ? '#3b82f6' : 'var(--text-secondary)',
              background: selectedDomain === d.domain_id ? '#3b82f610' : 'transparent',
              border: 'none', cursor: 'pointer',
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Term list */}
      <div style={{
        width: 240, flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          Terms ({terms?.length ?? 0})
        </div>
        {terms?.map((t) => (
          <button
            key={t.term_id}
            onClick={() => setSelectedTerm(t.term_id)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '5px 10px', marginBottom: 2, borderRadius: 3,
              fontSize: 11,
              fontWeight: selectedTerm === t.term_id ? 600 : 400,
              color: selectedTerm === t.term_id ? '#22c55e' : 'var(--text-secondary)',
              background: selectedTerm === t.term_id ? '#22c55e10' : 'transparent',
              border: 'none', cursor: 'pointer',
            }}
          >
            <div>{t.label}</div>
            {t.definition && (
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
                {t.definition.slice(0, 80)}{t.definition.length > 80 ? '...' : ''}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Term detail + usages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {selectedTerm && terms ? (() => {
          const term = terms.find((t) => t.term_id === selectedTerm)
          if (!term) return null
          return (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {term.label}
              </h3>
              <span style={{
                fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                color: '#3b82f6', background: '#3b82f61a',
                padding: '1px 6px', borderRadius: 3,
              }}>
                {selectedDomain}
              </span>

              {term.definition && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
                  {term.definition}
                </p>
              )}

              {term.structural_function && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 12, marginBottom: 4 }}>
                    Structural Function
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {term.structural_function}
                  </p>
                </>
              )}

              {/* Usages */}
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 16, marginBottom: 6 }}>
                Usages ({usages?.length ?? 0})
              </div>
              {usages && usages.length > 0 ? (
                usages.map((u) => (
                  <div key={u.usage_id} style={{
                    padding: '4px 8px', fontSize: 11, borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: 8,
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{u.object_type}</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 10 }}>{u.object_id.slice(0, 12)}</span>
                    {u.usage_role && <span style={{ color: '#f59e0b', fontSize: 10 }}>{u.usage_role}</span>}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>No usages recorded</p>
              )}
            </>
          )
        })() : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select a term to view details.</p>
        )}
      </div>
    </div>
  )
}
