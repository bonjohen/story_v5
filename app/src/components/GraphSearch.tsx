/**
 * Global search — search across node labels, definitions, and edge labels.
 * Jump to matching node/edge in the graph canvas.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'

interface SearchResult {
  type: 'node' | 'edge'
  id: string
  label: string
  secondary: string // role for nodes, meaning for edges
}

interface GraphSearchProps {
  graph: NormalizedGraph
  onSelect: (nodeId: string) => void
}

export function GraphSearch({ graph, onSelect }: GraphSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo((): SearchResult[] => {
    if (!query.trim() || query.length < 2) return []
    const q = query.toLowerCase()
    const matches: SearchResult[] = []

    for (const node of graph.graph.nodes) {
      if (
        node.label.toLowerCase().includes(q) ||
        node.definition.toLowerCase().includes(q) ||
        node.node_id.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'node',
          id: node.node_id,
          label: node.label,
          secondary: node.role,
        })
      }
    }

    for (const edge of graph.graph.edges) {
      if (
        edge.label.toLowerCase().includes(q) ||
        edge.meaning.toLowerCase().includes(q) ||
        edge.edge_id.toLowerCase().includes(q)
      ) {
        matches.push({
          type: 'edge',
          id: edge.from, // Navigate to the source node
          label: edge.label,
          secondary: edge.meaning,
        })
      }
    }

    return matches.slice(0, 15)
  }, [graph, query])

  // Close on click outside
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0) // eslint-disable-line react-hooks/set-state-in-effect -- reset on results change
  }, [results])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      onSelect(results[activeIndex].id)
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      inputRef.current?.blur()
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result.id)
    setOpen(false)
    setQuery('')
  }

  // Keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          placeholder="Search nodes & edges... (/ or Ctrl+K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search graph"
          aria-expanded={open && results.length > 0}
          aria-controls="graph-search-results"
          aria-autocomplete="list"
          aria-activedescendant={open && results.length > 0 ? `search-result-${activeIndex}` : undefined}
          style={{
            width: 220,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            outline: 'none',
          }}
        />
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div
          id="graph-search-results"
          role="listbox"
          aria-label="Search results"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 100,
          }}>
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}-${i}`}
              id={`search-result-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => handleSelect(result)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: i === activeIndex ? 'var(--bg-surface)' : 'transparent',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                color: result.type === 'node' ? '#22c55e' : '#3b82f6',
                textTransform: 'uppercase',
                flexShrink: 0,
                width: 32,
              }}>
                {result.type}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {result.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {result.secondary}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
