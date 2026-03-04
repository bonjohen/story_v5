/**
 * Graph Selector Panel — sidebar with tabbed archetype/genre lists,
 * search/filter, and metadata (node/edge counts).
 */

import { useState, useMemo } from 'react'
import { useGraphStore } from '../store/graphStore.ts'
import type { GraphMetadata } from '../types/graph.ts'

interface GraphSelectorPanelProps {
  onSelect: (type: 'archetype' | 'genre', dir: string) => void
}

export function GraphSelectorPanel({ onSelect }: GraphSelectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'archetype' | 'genre'>('archetype')
  const [search, setSearch] = useState('')

  const manifest = useGraphStore((s) => s.manifest)
  const graphId = useGraphStore((s) => s.graphId)

  const items = useMemo(() => {
    const list = activeTab === 'archetype'
      ? manifest?.archetypes ?? []
      : manifest?.genres ?? []

    if (!search.trim()) return list

    const q = search.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(q))
  }, [activeTab, manifest, search])

  const archetypeCount = manifest?.archetypes.length ?? 0
  const genreCount = manifest?.genres.length ?? 0

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <TabButton
          active={activeTab === 'archetype'}
          onClick={() => { setActiveTab('archetype'); setSearch('') }}
          label={`Archetypes (${archetypeCount})`}
        />
        <TabButton
          active={activeTab === 'genre'}
          onClick={() => { setActiveTab('genre'); setSearch('') }}
          label={`Genres (${genreCount})`}
        />
      </div>

      {/* Search input */}
      <div style={{ padding: '8px 10px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder={`Filter ${activeTab === 'archetype' ? 'archetypes' : 'genres'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${activeTab}s`}
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            outline: 'none',
          }}
        />
      </div>

      {/* Graph list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 4px 8px',
      }}>
        {items.length === 0 && (
          <div style={{
            padding: '16px 10px',
            color: 'var(--text-muted)',
            fontSize: 12,
            textAlign: 'center',
          }}>
            {manifest ? 'No matches.' : 'Loading...'}
          </div>
        )}
        {items.map((meta) => (
          <GraphEntry
            key={meta.id}
            meta={meta}
            active={graphId === `${meta.type}/${dirFromPath(meta.filePath)}`}
            onClick={() => onSelect(meta.type, dirFromPath(meta.filePath))}
          />
        ))}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, label }: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '8px 4px',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

function GraphEntry({ meta, active, onClick }: {
  meta: GraphMetadata
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 10px',
        borderRadius: 4,
        textAlign: 'left',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          color: active ? 'var(--text-primary)' : 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {meta.name}
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          marginTop: 1,
        }}>
          {meta.prefix} | {meta.nodeCount}N / {meta.edgeCount}E
        </div>
      </div>
    </button>
  )
}

/** Extract directory name from filePath like "archetypes/01_heros_journey" */
function dirFromPath(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1]
}
