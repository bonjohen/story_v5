/**
 * System Map — multi-mode graph visualization for entity relationships.
 * View modes: All Relationships, Family Tree, Political/Faction, Knowledge Web.
 * Replaces the simpler RelationshipMap with configurable filtering and layout.
 */

import { useEffect, useRef, useMemo, useState } from 'react'
import cytoscape from 'cytoscape'
import { useInstanceStore } from '../store/instanceStore.ts'
import { roleColor } from './shared.ts'

type ViewMode = 'all' | 'family' | 'political' | 'knowledge'

const VIEW_MODES: { id: ViewMode; label: string; color: string }[] = [
  { id: 'all', label: 'All Relationships', color: '#06b6d4' },
  { id: 'family', label: 'Family Tree', color: '#ec4899' },
  { id: 'political', label: 'Political / Faction', color: '#eab308' },
  { id: 'knowledge', label: 'Knowledge Web', color: '#a855f7' },
]

const REL_COLORS: Record<string, string> = {
  ally: '#22c55e', rival: '#ef4444', mentor_student: '#f59e0b',
  parent_child: '#ec4899', romantic: '#e879f9', nemesis: '#dc2626',
  servant_master: '#94a3b8', sibling: '#06b6d4', betrayer: '#7c3aed',
  guardian: '#3b82f6',
}

const FACTION_REL_COLORS: Record<string, string> = {
  allied: '#22c55e', hostile: '#ef4444', vassal: '#f59e0b',
  rival: '#dc2626', neutral: '#94a3b8',
}

const FAMILY_REL_TYPES = new Set(['parent_child', 'sibling', 'romantic'])

export function SystemMap() {
  const [mode, setMode] = useState<ViewMode>('all')
  const activeId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<cytoscape.Core | null>(null)

  const elements = useMemo(() => {
    if (!instance) return { nodes: [] as cytoscape.ElementDefinition[], edges: [] as cytoscape.ElementDefinition[] }

    const nodes: cytoscape.ElementDefinition[] = []
    const edges: cytoscape.ElementDefinition[] = []

    if (mode === 'all' || mode === 'family') {
      // Characters
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
          if (mode === 'family' && !FAMILY_REL_TYPES.has(rel.type)) continue
          edges.push({
            data: {
              id: `${c.id}-${rel.target_id}-${rel.type}`,
              source: c.id,
              target: rel.target_id,
              label: rel.type,
              color: REL_COLORS[rel.type] ?? '#94a3b8',
            },
          })
        }
      }

      // Factions (all mode only)
      if (mode === 'all') {
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
      }
    } else if (mode === 'political') {
      // Factions as primary nodes
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

        // Faction-to-faction relationships
        for (const rel of f.relationships) {
          edges.push({
            data: {
              id: `${f.id}-${rel.target_id}-${rel.type}`,
              source: f.id,
              target: rel.target_id,
              label: rel.type,
              color: FACTION_REL_COLORS[rel.type] ?? '#94a3b8',
            },
          })
        }

        // Members as character nodes + membership edges
        for (const m of f.members) {
          const char = instance.lore.characters.find((c) => c.id === m.character_id)
          if (!char) continue
          // Only add character node if not already present
          if (!nodes.some((n) => n.data.id === char.id)) {
            nodes.push({
              data: {
                id: char.id,
                label: char.name || char.id,
                type: 'character',
                role: char.role,
                color: roleColor(char.role),
              },
            })
          }
          edges.push({
            data: {
              id: `member-${char.id}-${f.id}`,
              source: char.id,
              target: f.id,
              label: m.rank ?? m.role_in_faction ?? 'member',
              color: '#eab30880',
            },
          })
        }
      }
    } else if (mode === 'knowledge') {
      // Characters as nodes, knowledge overlaps as edges
      const charKnowledge = new Map<string, Set<string>>()
      for (const c of instance.lore.characters) {
        nodes.push({
          data: {
            id: c.id,
            label: c.name || c.id,
            type: 'character',
            role: c.role,
            color: roleColor(c.role),
            knowledgeCount: c.knowledge.length,
          },
        })
        charKnowledge.set(c.id, new Set(c.knowledge.map((k) => k.toLowerCase())))
      }

      // Build edges: characters who share knowledge items
      const charIds = instance.lore.characters.map((c) => c.id)
      for (let i = 0; i < charIds.length; i++) {
        for (let j = i + 1; j < charIds.length; j++) {
          const aSet = charKnowledge.get(charIds[i])!
          const bSet = charKnowledge.get(charIds[j])!
          const shared: string[] = []
          for (const item of aSet) {
            if (bSet.has(item)) shared.push(item)
          }
          if (shared.length > 0) {
            edges.push({
              data: {
                id: `know-${charIds[i]}-${charIds[j]}`,
                source: charIds[i],
                target: charIds[j],
                label: `${shared.length} shared`,
                color: '#a855f7',
                width: Math.min(shared.length * 2, 8),
              },
            })
          }
        }
      }

      // Also add edges from characters whose knowledge mentions another character's name
      for (const c of instance.lore.characters) {
        for (const k of c.knowledge) {
          const kLower = k.toLowerCase()
          for (const other of instance.lore.characters) {
            if (other.id === c.id) continue
            if (kLower.includes(other.name.toLowerCase()) && other.name.length > 1) {
              const edgeId = `knows-about-${c.id}-${other.id}`
              if (!edges.some((e) => e.data.id === edgeId)) {
                edges.push({
                  data: {
                    id: edgeId,
                    source: c.id,
                    target: other.id,
                    label: 'knows about',
                    color: '#c084fc',
                  },
                })
              }
            }
          }
        }
      }
    }

    // Filter edges to only include those with existing target nodes
    const nodeIds = new Set(nodes.map((n) => n.data.id))
    const validEdges = edges.filter((e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target))

    // Deduplicate edges (same source-target pair might have duplicate IDs)
    const seen = new Set<string>()
    const dedupEdges = validEdges.filter((e) => {
      if (seen.has(e.data.id!)) return false
      seen.add(e.data.id!)
      return true
    })

    return { nodes, edges: dedupEdges }
  }, [instance, mode])

  // Layout config varies by mode
  const layoutConfig = useMemo((): cytoscape.LayoutOptions => {
    if (mode === 'family') {
      return {
        name: 'breadthfirst',
        directed: true,
        padding: 40,
        spacingFactor: 1.5,
        animate: false,
      }
    }
    if (mode === 'political') {
      return {
        name: 'cose',
        animate: false,
        padding: 40,
        nodeRepulsion: () => 12000,
        idealEdgeLength: () => 140,
      } as cytoscape.LayoutOptions
    }
    if (mode === 'knowledge') {
      return {
        name: 'circle',
        animate: false,
        padding: 40,
      }
    }
    return {
      name: 'cose',
      animate: false,
      padding: 40,
      nodeRepulsion: () => 8000,
      idealEdgeLength: () => 120,
    } as cytoscape.LayoutOptions
  }, [mode])

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
            width: 36,
            height: 36,
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
      layout: layoutConfig,
    })

    cyRef.current = cy

    return () => {
      cy.removeAllListeners()
      cy.destroy()
      cyRef.current = null
    }
  }, [elements, layoutConfig])

  if (!instance || !activeId) {
    return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No active story instance.</div>
  }

  const modeInfo = VIEW_MODES.find((v) => v.id === mode)!
  const isEmpty = elements.nodes.length === 0

  // Legend entries depend on mode
  const legendEntries = mode === 'political'
    ? Object.entries(FACTION_REL_COLORS)
    : mode === 'knowledge'
      ? [['shared knowledge', '#a855f7'], ['knows about', '#c084fc']] as [string, string][]
      : Object.entries(REL_COLORS).filter(([type]) => mode !== 'family' || FAMILY_REL_TYPES.has(type))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mode selector bar */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 12px',
        borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        {VIEW_MODES.map((v) => (
          <button
            key={v.id}
            onClick={() => setMode(v.id)}
            style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 3,
              border: '1px solid',
              borderColor: mode === v.id ? v.color : 'var(--border)',
              background: mode === v.id ? `${v.color}18` : 'transparent',
              color: mode === v.id ? v.color : 'var(--text-muted)',
              fontWeight: mode === v.id ? 600 : 400,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.03em',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Graph area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isEmpty ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12, flexDirection: 'column', gap: 8 }}>
            <span>No data for <strong>{modeInfo.label}</strong> view.</span>
            <span style={{ fontSize: 11 }}>
              {mode === 'family' && 'Add parent_child, sibling, or romantic relationships to characters.'}
              {mode === 'political' && 'Add factions with members and inter-faction relationships.'}
              {mode === 'knowledge' && 'Add knowledge entries to characters.'}
              {mode === 'all' && 'Add characters or factions with relationships first.'}
            </span>
          </div>
        ) : (
          <>
            <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-primary)' }} />
            {/* Legend */}
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '6px 10px', fontSize: 10, maxWidth: 400,
            }}>
              <div style={{ fontWeight: 600, color: modeInfo.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {modeInfo.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {legendEntries.map(([type, color]) => (
                  <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                    {type}
                  </span>
                ))}
              </div>
            </div>
            {/* Node count badge */}
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '4px 8px', fontSize: 10, color: 'var(--text-muted)',
            }}>
              {elements.nodes.length} nodes · {elements.edges.length} edges
            </div>
          </>
        )}
      </div>
    </div>
  )
}
