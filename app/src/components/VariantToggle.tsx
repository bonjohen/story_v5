/**
 * Variant Toggle Mode — toggle between canonical and variant paths.
 * For archetypes: variants are nodes with IDs in the 50-79 range.
 * For genres: variants are different subgenre paths (Level 3 branches).
 * Also includes failure mode overlay.
 */

import { useMemo } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'

interface VariantPath {
  id: string
  label: string
  nodeIds: string[]
}

interface VariantToggleProps {
  graph: NormalizedGraph
  activeVariant: string | null // null = canonical
  onToggle: (variantId: string | null) => void
  showFailureModes: boolean
  onToggleFailureModes: () => void
}

export function VariantToggle({
  graph,
  activeVariant,
  onToggle,
  showFailureModes,
  onToggleFailureModes,
}: VariantToggleProps) {
  const isArchetype = graph.graph.type === 'archetype'

  const variants = useMemo((): VariantPath[] => {
    if (isArchetype) {
      return extractArchetypeVariants(graph)
    } else {
      return extractGenreVariants(graph)
    }
  }, [graph, isArchetype])

  const hasAntiPatterns = useMemo(() => {
    return graph.graph.nodes.some((n) => n.role === 'Anti-Pattern')
  }, [graph])

  if (variants.length === 0 && !hasAntiPatterns) return null

  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 6,
      }}>
        Variant Paths
      </div>

      {/* Canonical (always shown) */}
      <ToggleButton
        label="Canonical Path"
        active={activeVariant === null}
        onClick={() => onToggle(null)}
        count={graph.graph.nodes.length - variants.reduce((s, v) => s + v.nodeIds.length, 0)}
      />

      {/* Variant paths */}
      {variants.map((v) => (
        <ToggleButton
          key={v.id}
          label={v.label}
          active={activeVariant === v.id}
          onClick={() => onToggle(activeVariant === v.id ? null : v.id)}
          count={v.nodeIds.length}
        />
      ))}

      {/* Failure mode overlay */}
      {hasAntiPatterns && (
        <>
          <div style={{
            height: 1,
            background: 'var(--border)',
            margin: '6px 0',
          }} />
          <ToggleButton
            label="Failure Modes"
            active={showFailureModes}
            onClick={onToggleFailureModes}
            color="#ef4444"
          />
        </>
      )}
    </div>
  )
}

function ToggleButton({ label, active, onClick, count, color }: {
  label: string
  active: boolean
  onClick: () => void
  count?: number
  color?: string
}) {
  const activeColor = color ?? 'var(--accent)'
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '5px 8px',
        marginBottom: 3,
        fontSize: 11,
        textAlign: 'left',
        borderRadius: 3,
        border: '1px solid',
        borderColor: active ? activeColor : 'transparent',
        background: active ? `${activeColor}15` : 'transparent',
        color: active ? activeColor : 'var(--text-primary)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{count}N</span>
      )}
    </button>
  )
}

/** Extract archetype variants: nodes with IDs matching N5x-N7x pattern */
function extractArchetypeVariants(graph: NormalizedGraph): VariantPath[] {
  const variantNodes = graph.graph.nodes.filter((n) => {
    const match = n.node_id.match(/_N(\d{2})_/)
    if (!match) return false
    const num = parseInt(match[1], 10)
    return num >= 50 && num <= 79
  })

  if (variantNodes.length === 0) return []

  // Group by the nearest canonical parent (connected via reverse adjacency)
  const groups = new Map<string, typeof variantNodes>()
  for (const node of variantNodes) {
    const parents = graph.reverseAdjacency.get(node.node_id) ?? []
    const parentKey = parents[0] ?? 'orphan'
    if (!groups.has(parentKey)) groups.set(parentKey, [])
    groups.get(parentKey)!.push(node)
  }

  const variants: VariantPath[] = []
  let idx = 0
  for (const [parentId, nodes] of groups) {
    const parentNode = graph.graph.nodes.find((n) => n.node_id === parentId)
    variants.push({
      id: `variant-${idx}`,
      label: `Variant: ${parentNode?.label ?? parentId}`,
      nodeIds: nodes.map((n) => n.node_id),
    })
    idx++
  }

  return variants
}

/** Extract genre variants: different Level 3 (subgenre) branches */
function extractGenreVariants(graph: NormalizedGraph): VariantPath[] {
  const level3Nodes = graph.graph.nodes.filter((n) =>
    'level' in n && (n as { level: number | null }).level === 3
  )

  if (level3Nodes.length <= 1) return []

  return level3Nodes.map((node, i) => {
    // Walk forward from this subgenre node to find all downstream
    const downstream: string[] = [node.node_id]
    const queue = [node.node_id]
    const visited = new Set([node.node_id])
    while (queue.length > 0) {
      const id = queue.shift()
      if (!id) continue
      const neighbors = graph.adjacency.get(id) ?? []
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n)
          downstream.push(n)
          queue.push(n)
        }
      }
    }

    return {
      id: `subgenre-${i}`,
      label: node.label,
      nodeIds: downstream,
    }
  })
}

// computeFailureModeNodes moved to ../graph-engine/index.ts
