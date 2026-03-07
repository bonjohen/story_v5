/**
 * Template Coverage — shows which vocabulary terms a story uses vs. doesn't.
 */

import { useDbQuery } from '../hooks.ts'
import { vocabCoverageReport, listVocabTermsUsedInStory } from '../queries.ts'
import { listStoriesInProject } from '../queries.ts'
import { listProjects } from '../repository/projectRepo.ts'
import { useState } from 'react'

export function TemplateCoverage() {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null)

  // Get all stories
  const { data: stories } = useDbQuery((db) => {
    const projects = listProjects(db)
    if (projects.length === 0) return []
    return listStoriesInProject(db, projects[0].project_id)
  })

  // Coverage report
  const { data: coverage } = useDbQuery(
    (db) => selectedStoryId ? vocabCoverageReport(db, selectedStoryId) : [],
    [selectedStoryId],
  )

  // Terms used
  const { data: usedTerms } = useDbQuery(
    (db) => selectedStoryId ? listVocabTermsUsedInStory(db, selectedStoryId) : [],
    [selectedStoryId],
  )

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        Template Coverage
      </div>

      {/* Story selector */}
      <select
        value={selectedStoryId ?? ''}
        onChange={(e) => setSelectedStoryId(e.target.value || null)}
        style={{
          fontSize: 11, padding: '4px 8px', marginBottom: 12,
          background: 'var(--bg-primary)', color: 'var(--text-primary)',
          border: '1px solid var(--border)', borderRadius: 4,
        }}
      >
        <option value="">Select a story...</option>
        {stories?.map((s) => (
          <option key={s.story_id} value={s.story_id}>{s.title}</option>
        ))}
      </select>

      {selectedStoryId && coverage && (
        <>
          {/* Coverage bars */}
          {coverage.map((c) => {
            const pct = c.total_terms > 0 ? Math.round((c.used_terms / c.total_terms) * 100) : 0
            return (
              <div key={c.domain_id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{c.domain_name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {c.used_terms} / {c.total_terms} ({pct}%)
                  </span>
                </div>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: 'var(--bg-elevated)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${pct}%`,
                    background: pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            )
          })}

          {/* Used terms list */}
          {usedTerms && usedTerms.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 16, marginBottom: 6 }}>
                Terms Used ({usedTerms.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {usedTerms.map((t) => (
                  <span key={t.term_id} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 3,
                    border: '1px solid #22c55e40', color: '#22c55e',
                    background: '#22c55e08',
                  }}>
                    {t.label} ({t.usage_count})
                  </span>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!selectedStoryId && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Select a story to view template term coverage.
        </p>
      )}
    </div>
  )
}
