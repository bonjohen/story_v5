/**
 * Encyclopedia Page — World Anvil-style browseable encyclopedia.
 * Two-column layout: category sidebar + article reader pane.
 */

import { useState, useMemo } from 'react'
import { useInstanceStore } from '../instance/store/instanceStore.ts'
import { generateArticles } from './articleGenerator.ts'
import { ReadAloud } from '../components/ReadAloud.tsx'
import type { Article, ArticleCategory } from './types.ts'

const TOOLBAR_HEIGHT = 42

const CATEGORIES: ArticleCategory[] = ['Character', 'Place', 'Object', 'Faction', 'Event', 'World Rule']

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  Character: '#3b82f6',
  Place: '#22c55e',
  Object: '#f59e0b',
  Faction: '#8b5cf6',
  Event: '#ef4444',
  'World Rule': '#06b6d4',
}

export function EncyclopediaPage() {
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)

  const articles = useMemo(() => {
    if (!instance) return []
    return generateArticles(instance.lore)
  }, [instance])

  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArticles = useMemo(() => {
    let result = articles
    if (selectedCategory) result = result.filter((a) => a.category === selectedCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a) =>
        a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q),
      )
    }
    return result
  }, [articles, selectedCategory, searchQuery])

  const selectedArticle = articles.find((a) => a.id === selectedArticleId)

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of articles) counts[a.category] = (counts[a.category] ?? 0) + 1
    return counts
  }, [articles])

  return (
    <div className="page-shell" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div className="page-toolbar" style={{
        height: TOOLBAR_HEIGHT, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
        flexShrink: 0, zIndex: 10,
      }}>
        <a href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#ec4899' }}>Encyclopedia</span>
        <ReadAloud text={selectedArticle ? `${selectedArticle.title}. ${selectedArticle.content}` : ''} label="Read aloud" />

        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            fontSize: 11, padding: '4px 8px', width: 200,
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 4,
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{articles.length} articles</span>
      </div>

      {!instance ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No active story instance. Create or select one from the Story workspace.
        </div>
      ) : articles.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No entities in this instance. Add characters, places, or other entities first.
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Category sidebar */}
          <div style={{
            width: 220, flexShrink: 0, borderRight: '1px solid var(--border)',
            background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column',
          }}>
            {/* Category buttons */}
            <div style={{ padding: 8 }}>
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', marginBottom: 2, borderRadius: 3,
                  fontSize: 11, fontWeight: !selectedCategory ? 600 : 400,
                  color: !selectedCategory ? 'var(--accent)' : 'var(--text-muted)',
                  background: !selectedCategory ? 'var(--accent)10' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                All ({articles.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] ?? 0
                if (count === 0) return null
                const active = selectedCategory === cat
                const color = CATEGORY_COLORS[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '6px 10px', marginBottom: 2, borderRadius: 3,
                      fontSize: 11, fontWeight: active ? 600 : 400,
                      color: active ? color : 'var(--text-muted)',
                      background: active ? `${color}10` : 'transparent',
                      border: 'none', cursor: 'pointer',
                    }}
                  >
                    {cat} ({count})
                  </button>
                )
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', flex: 1, overflowY: 'auto', padding: 6 }}>
              {filteredArticles.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedArticleId(a.id)}
                  style={{
                    padding: '6px 10px', marginBottom: 2, borderRadius: 3, cursor: 'pointer',
                    background: a.id === selectedArticleId ? 'var(--accent)10' : 'transparent',
                    borderLeft: `3px solid ${CATEGORY_COLORS[a.category]}`,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{a.category}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Article reader */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>
            {selectedArticle ? (
              <ArticleView article={selectedArticle} allArticles={articles} onNavigate={setSelectedArticleId} />
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 40, textAlign: 'center' }}>
                Select an article from the sidebar.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Article View
// ---------------------------------------------------------------------------

function ArticleView({ article, allArticles, onNavigate }: {
  article: Article
  allArticles: Article[]
  onNavigate: (id: string) => void
}) {
  const color = CATEGORY_COLORS[article.category]

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Category badge */}
      <span style={{
        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
        color, background: `${color}1a`, padding: '2px 8px', borderRadius: 3,
      }}>
        {article.category}
      </span>

      {/* Rendered content */}
      <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>
        {renderMarkdown(article.content)}
      </div>

      {/* Backlinks */}
      {article.backlinks && article.backlinks.length > 0 && (
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
            color: 'var(--text-muted)', letterSpacing: '0.04em',
          }}>
            Referenced By
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {article.backlinks.map((blId) => {
              const ref = allArticles.find((a) => a.id === blId)
              if (!ref) return null
              return (
                <button
                  key={blId}
                  onClick={() => onNavigate(blId)}
                  style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 3,
                    border: `1px solid ${CATEGORY_COLORS[ref.category]}`,
                    color: CATEGORY_COLORS[ref.category],
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  {ref.title}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simple markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key++} style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 8px' }}>{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 6px', color: 'var(--text-primary)' }}>{line.slice(3)}</h2>)
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={key++} style={{ paddingLeft: 16, position: 'relative', marginBottom: 2 }}>
          <span style={{ position: 'absolute', left: 4, color: 'var(--text-muted)' }}>-</span>
          {renderInline(line.slice(2))}
        </div>,
      )
    } else if (line.startsWith('**') && line.includes(':**')) {
      const match = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
      if (match) {
        elements.push(
          <div key={key++} style={{ marginBottom: 3 }}>
            <span style={{ fontWeight: 600 }}>{match[1]}:</span>{' '}
            <span>{match[2]}</span>
          </div>,
        )
      } else {
        elements.push(<p key={key++} style={{ margin: '4px 0' }}>{renderInline(line)}</p>)
      }
    } else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: 8 }} />)
    } else {
      elements.push(<p key={key++} style={{ margin: '4px 0' }}>{renderInline(line)}</p>)
    }
  }

  return elements
}

function renderInline(text: string): React.ReactNode {
  // Simple bold rendering
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
  )
}
