/**
 * Cross-Index Integration Panel — shows shared patterns across archetypes/genres.
 * Uses cross_archetype_index.json and cross_genre_constraint_index.json.
 * Shows which other archetypes/genres share the same role or constraint.
 * Includes failure mode cross-reference (v-next #42).
 */

import { useState, useEffect, useMemo } from 'react'
import { UI_COLORS, COMPAT_COLORS } from '../theme/colors.ts'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { useGraphStore } from '../store/graphStore.ts'

interface RoleInstance {
  archetype?: string
  genre?: string
  node_id: string
  label: string
}

interface RoleEntry {
  role: string
  instance_count: number
  archetype_count?: number
  genre_count?: number
  note?: string
  instances: RoleInstance[]
}

interface CrossIndex {
  title: string
  node_role_index?: { roles: RoleEntry[] }
  constraint_type_index?: { constraint_types: RoleEntry[] }
}

interface CompatibilityEntry {
  archetype: string
  rationale: string
}

interface GenreCompatibility {
  genre: string
  genre_id: number
  naturally_compatible: CompatibilityEntry[]
  occasionally_compatible: CompatibilityEntry[]
  rarely_compatible: CompatibilityEntry[]
}

interface CompatibilityMatrix {
  genres: GenreCompatibility[]
}

interface CrossIndexProps {
  graph: NormalizedGraph
}

export function CrossIndexPanel({ graph }: CrossIndexProps) {
  const [archetypeIndex, setArchetypeIndex] = useState<CrossIndex | null>(null)
  const [genreIndex, setGenreIndex] = useState<CrossIndex | null>(null)
  const [matrix, setMatrix] = useState<CompatibilityMatrix | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const isArchetype = graph.graph.type === 'archetype'

  // Load indices on mount
  useEffect(() => {
    setLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- data fetch init
    void Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/cross_references/cross_archetype_index.json`).then((r) => r.ok ? r.json() as Promise<CrossIndex> : null).catch(() => null),
      fetch(`${import.meta.env.BASE_URL}data/cross_references/cross_genre_constraint_index.json`).then((r) => r.ok ? r.json() as Promise<CrossIndex> : null).catch(() => null),
      fetch(`${import.meta.env.BASE_URL}data/cross_references/genre_archetype_matrix.json`).then((r) => r.ok ? r.json() as Promise<CompatibilityMatrix> : null).catch(() => null),
    ]).then(([arch, genre, mat]) => {
      setArchetypeIndex(arch)
      setGenreIndex(genre)
      setMatrix(mat)
    }).finally(() => setLoading(false))
  }, [])

  // Find the selected node's role
  const selectedNode = selectedNodeId
    ? graph.graph.nodes.find((n) => n.node_id === selectedNodeId)
    : null
  const selectedRole = selectedNode?.role ?? null

  // Find other instances of this role across archetypes/genres
  const sharedInstances = useMemo(() => {
    if (!selectedRole) return []

    const index = isArchetype ? archetypeIndex : genreIndex
    if (!index) return []

    const roles = isArchetype
      ? index.node_role_index?.roles ?? []
      : index.constraint_type_index?.constraint_types ?? []

    const matching = roles.find((r) => r.role === selectedRole)
    if (!matching) return []

    // Filter out instances from the current graph
    const currentGraphName = graph.graph.name
    return matching.instances.filter((inst) => {
      const name = inst.archetype ?? inst.genre ?? ''
      return name !== currentGraphName
    })
  }, [selectedRole, isArchetype, archetypeIndex, genreIndex, graph])

  // Failure mode cross-reference (v-next #42)
  const failureModes = useMemo(() => {
    if (!selectedNode) return []
    const failureText = Array.isArray(selectedNode.failure_modes)
      ? selectedNode.failure_modes
      : [selectedNode.failure_modes]
    return failureText.filter((f) => f && f.trim())
  }, [selectedNode])

  // Compatibility info for current genre (if applicable)
  const compatibility = useMemo(() => {
    if (isArchetype || !matrix) return null
    const genreEntry = matrix.genres.find((g) =>
      graph.graph.name.toLowerCase().includes(g.genre.toLowerCase())
    )
    return genreEntry ?? null
  }, [isArchetype, matrix, graph])

  if (loading) {
    return (
      <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--text-muted)' }}>
        Loading cross-index data...
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 14px', overflowY: 'auto' }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        Cross-Index Analysis
      </div>

      {/* Shared role instances */}
      {selectedRole && sharedInstances.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 4,
          }}>
            "{selectedRole}" across {isArchetype ? 'archetypes' : 'genres'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            Found in {sharedInstances.length} other {isArchetype ? 'archetypes' : 'genres'}
          </div>
          {sharedInstances.slice(0, 10).map((inst, i) => (
            <div key={i} style={{
              padding: '4px 8px',
              marginBottom: 3,
              fontSize: 11,
              background: 'var(--bg-elevated)',
              borderRadius: 3,
            }}>
              <span style={{ fontWeight: 500 }}>{inst.archetype ?? inst.genre}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>
                {inst.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Failure mode cross-reference */}
      {failureModes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: UI_COLORS.warning,
            marginBottom: 4,
          }}>
            Failure Modes (this node)
          </div>
          {failureModes.map((f, i) => (
            <div key={i} style={{
              padding: '4px 8px',
              marginBottom: 3,
              fontSize: 11,
              background: `${UI_COLORS.warning}14`,
              borderRadius: 3,
              color: UI_COLORS.warning,
            }}>
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Genre-archetype compatibility */}
      {compatibility && (
        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}>
            Archetype Compatibility
          </div>

          {compatibility.naturally_compatible.length > 0 && (
            <CompatSection
              title="Naturally Compatible"
              items={compatibility.naturally_compatible}
              color={COMPAT_COLORS.naturally_compatible}
            />
          )}
          {compatibility.occasionally_compatible.length > 0 && (
            <CompatSection
              title="Occasionally Compatible"
              items={compatibility.occasionally_compatible}
              color={COMPAT_COLORS.occasionally_compatible}
            />
          )}
          {compatibility.rarely_compatible.length > 0 && (
            <CompatSection
              title="Rarely Compatible"
              items={compatibility.rarely_compatible}
              color={COMPAT_COLORS.rarely_compatible}
            />
          )}
        </div>
      )}

      {!selectedNodeId && !compatibility && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Select a node to see cross-index data, or view a genre for compatibility info.
        </div>
      )}
    </div>
  )
}

function CompatSection({ title, items, color }: {
  title: string
  items: CompatibilityEntry[]
  color: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 4,
      }}>
        {title} ({items.length})
      </div>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '4px 8px',
          marginBottom: 3,
          fontSize: 11,
          background: 'var(--bg-elevated)',
          borderRadius: 3,
          borderLeft: `2px solid ${color}`,
        }}>
          <div style={{ fontWeight: 500 }}>{item.archetype}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {item.rationale}
          </div>
        </div>
      ))}
    </div>
  )
}
