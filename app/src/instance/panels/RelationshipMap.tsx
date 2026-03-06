/**
 * Relationship Map — visual graph of entity relationships using Cytoscape.
 * Nodes = characters/factions, edges = relationships.
 */

import { useEffect, useRef, useMemo } from 'react'
import cytoscape from 'cytoscape'
import { useInstanceStore } from '../store/instanceStore.ts'
import { roleColor } from './shared.ts'

const REL_COLORS: Record<string, string> = {
  ally: '#22c55e', rival: '#ef4444', mentor_student: '#f59e0b',
  parent_child: '#ec4899', romantic: '#e879f9', nemesis: '#dc2626',
  servant_master: '#94a3b8', sibling: '#06b6d4', betrayer: '#7c3aed',
  guardian: '#3b82f6',
}

export function RelationshipMap() {
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const elements = useMemo(() => {
    if (!instance) return { nodes: [], edges: [] }

    const nodes: cytoscape.ElementDefinition[] = []
    const edges: cytoscape.ElementDefinition[] = []

    for (const c of instance.lore.characters) {
      nodes.push({
        data: {
          id: c.id,
          label: c.name || c.id,
          type: 'character',
          role: c.role,
          color: roleColor(c.role),
        },
      })

      for (const rel of c.relationships) {
        edges.push({
          data: {
            id: `${c.id}-${rel.target_id}-${rel.type}`,
            source: c.id,
            target: rel.target_id,
            label: rel.type,
            color: REL_COLORS[rel.type] ?? 'var(--text-muted)',
          },
        })
      }
    }

    for (const f of instance.lore.factions) {
      nodes.push({
        data: {
          id: f.id,
          label: f.name || f.id,
          type: 'faction',
          role: f.type,
          color: '#eab308',
        },
      })

      for (const rel of f.relationships) {
        edges.push({
          data: {
            id: `${f.id}-${rel.target_id}-${rel.type}`,
            source: f.id,
            target: rel.target_id,
            label: rel.type,
            color: REL_COLORS[rel.type] ?? '#94a3b8',
          },
        })
      }
    }

    // Filter edges to only include those with existing target nodes
    const nodeIds = new Set(nodes.map((n) => n.data.id))
    const validEdges = edges.filter((e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target))

    return { nodes, edges: validEdges }
  }, [instance])

  useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...elements.nodes, ...elements.edges],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': 'data(color)',
            color: '#e0e0e6',
            'font-size': 10,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            width: 28,
            height: 28,
            'border-width': 2,
            'border-color': '#2a2d3a',
          },
        },
        {
          selector: 'node[type = "faction"]',
          style: {
            shape: 'diamond',
            width: 32,
            height: 32,
          },
        },
        {
          selector: 'edge',
          style: {
            label: 'data(label)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            width: 2,
            color: '#8888a0',
            'font-size': 8,
            'text-rotation': 'autorotate',
            'text-margin-y': -8,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
      },
    })

    cyRef.current = cy

    return () => {
      cy.removeAllListeners()
      cy.destroy()
      cyRef.current = null
    }
  }, [elements])

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  if (elements.nodes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
        No entities with relationships to display. Add characters or factions first.
      </div>
    )
  }

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-primary)' }} />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 4, padding: '6px 10px', fontSize: 10,
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Relationship Types
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(REL_COLORS).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
