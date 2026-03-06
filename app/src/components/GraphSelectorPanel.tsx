/**
 * Graph Selector Panel — sidebar with stacked archetype + genre lists.
 * Both selections persist as a pair. Clicking loads that graph in the canvas.
 */

import { useState, useMemo } from 'react'
import { useGraphStore } from '../store/graphStore.ts'
import type { GraphMetadata } from '../types/graph.ts'

interface GraphSelectorPanelProps {
  onSelect: (type: 'archetype' | 'genre', dir: string) => void
}

export function GraphSelectorPanel({ onSelect }: GraphSelectorPanelProps) {
  const [archSearch, setArchSearch] = useState('')
  const [genreSearch, setGenreSearch] = useState('')

  const manifest = useGraphStore((s) => s.manifest)
  const graphId = useGraphStore((s) => s.graphId)
  const selectedArchetypeDir = useGraphStore((s) => s.selectedArchetypeDir)
  const selectedGenreDir = useGraphStore((s) => s.selectedGenreDir)

  const archetypes = useMemo(() => {
    const list = manifest?.archetypes ?? []
    if (!archSearch.trim()) return list
    const q = archSearch.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(q))
  }, [manifest, archSearch])

  const genres = useMemo(() => {
    const list = manifest?.genres ?? []
    if (!genreSearch.trim()) return list
    const q = genreSearch.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(q))
  }, [manifest, genreSearch])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Archetype section */}
      <SelectorSection
        title="Archetype"
        count={manifest?.archetypes.length ?? 0}
        color="#f59e0b"
        items={archetypes}
        search={archSearch}
        onSearchChange={setArchSearch}
        pairedDir={selectedArchetypeDir}
        activeGraphId={graphId}
        onSelect={(dir) => onSelect('archetype', dir)}
        type="archetype"
      />

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'var(--border)',
        flexShrink: 0,
      }} />

      {/* Genre section */}
      <SelectorSection
        title="Genre"
        count={manifest?.genres.length ?? 0}
        color="#8b5cf6"
        items={genres}
        search={genreSearch}
        onSearchChange={setGenreSearch}
        pairedDir={selectedGenreDir}
        activeGraphId={graphId}
        onSelect={(dir) => onSelect('genre', dir)}
        type="genre"
      />
    </div>
  )
}

function SelectorSection({ title, count, color, items, search, onSearchChange, pairedDir, activeGraphId, onSelect, type }: {
  title: string
  count: number
  color: string
  items: GraphMetadata[]
  search: string
  onSearchChange: (v: string) => void
  pairedDir: string | null
  activeGraphId: string | null
  onSelect: (dir: string) => void
  type: 'archetype' | 'genre'
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Section header */}
      <div style={{
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color,
        }}>
          {title}
        </span>
        <span style={{
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>
          ({count})
        </span>
      </div>

      {/* Search */}
      <div style={{ padding: '0 10px 4px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder={`Filter ${title.toLowerCase()}s...`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={`Search ${title.toLowerCase()}s`}
          style={{
            width: '100%',
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

      {/* Item list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 4px 4px',
      }}>
        {items.length === 0 && (
          <div style={{
            padding: '12px 10px',
            color: 'var(--text-muted)',
            fontSize: 11,
            textAlign: 'center',
          }}>
            No matches.
          </div>
        )}
        {items.map((meta) => {
          const dir = dirFromPath(meta.filePath)
          const isActive = activeGraphId === `${type}/${dir}`
          const isPaired = pairedDir === dir

          return (
            <GraphEntry
              key={meta.id}
              meta={meta}
              isActive={isActive}
              isPaired={isPaired}
              color={color}
              onClick={() => onSelect(dir)}
            />
          )
        })}
      </div>
    </div>
  )
}

function GraphEntry({ meta, isActive, isPaired, color, onClick }: {
  meta: GraphMetadata
  isActive: boolean
  isPaired: boolean
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 10px',
        borderRadius: 4,
        textAlign: 'left',
        background: isActive
          ? `${color}18`
          : isPaired
            ? `${color}0a`
            : 'transparent',
        borderLeft: isActive
          ? `3px solid ${color}`
          : isPaired
            ? `3px solid ${color}60`
            : '3px solid transparent',
        transition: 'background 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isPaired) e.currentTarget.style.background = 'transparent'
        else if (isPaired && !isActive) e.currentTarget.style.background = `${color}0a`
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 12,
          fontWeight: isActive ? 600 : isPaired ? 500 : 400,
          color: isActive ? color : 'var(--text-primary)',
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
      {isPaired && !isActive && (
        <span style={{
          fontSize: 8,
          color,
          opacity: 0.7,
          flexShrink: 0,
          marginLeft: 4,
        }}>
          {'\u2713'}
        </span>
      )}
    </button>
  )
}

/** Extract directory name from filePath like "archetypes/01_heros_journey" */
function dirFromPath(filePath: string): string {
  const parts = filePath.split('/')
  return parts[parts.length - 1]
}
