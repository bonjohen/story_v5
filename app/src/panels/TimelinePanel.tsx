/**
 * Timeline Panel — swimlane visualization showing character participation
 * across archetype nodes. Template view shows roles; instance view shows
 * named characters from example works.
 */

import { useEffect, useState } from 'react'
import { useElementStore } from '../store/elementStore.ts'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/** Color palette for swimlane tracks */
const TRACK_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
]

// Change type labels
const CHANGE_LABELS: Record<string, string> = {
  learns: 'L',
  gains: '+',
  loses: '-',
  transforms: 'T',
  arrives: '\u2192',
  departs: '\u2190',
  bonds: '\u2661',
  breaks: '\u2718',
  dies: '\u2620',
  reveals: 'R',
  decides: 'D',
  establishes_baseline: '\u25B6',
}

interface TimelinePanelProps {
  graph: NormalizedGraph
  selectedNodeId: string | null
  onSelectNode?: (nodeId: string) => void
}

export function TimelinePanel({ graph, selectedNodeId, onSelectNode }: TimelinePanelProps) {
  const graphType = graph.graph.type
  // graph.graph.id is "archetype_01_heros_journey" but directory is "01_heros_journey"
  const dir = graph.graph.id.replace(/^archetype_/, '')

  const loadArchetypeElements = useElementStore((s) => s.loadArchetypeElements)
  const archetypeTimelines = useElementStore((s) => s.archetypeTimelines)
  const exampleElements = useElementStore((s) => s.exampleElements)
  const loadingElements = useElementStore((s) => s.loadingElements)

  const [viewMode, setViewMode] = useState<'template' | 'instance'>('template')

  useEffect(() => {
    if (graphType === 'archetype') {
      void loadArchetypeElements(dir)
    }
  }, [dir, graphType, loadArchetypeElements])

  if (graphType !== 'archetype') {
    return (
      <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        Timeline view is available for archetype graphs only.
      </div>
    )
  }

  if (loadingElements) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>Loading timeline...</div>
  }

  const timelineData = archetypeTimelines.get(dir)
  const examples = exampleElements.get(dir)

  if (!timelineData || !timelineData.template_timeline) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>No timeline data available.</div>
  }

  const templateTimeline = timelineData.template_timeline as Array<{
    archetype_node: string
    expected_participants: { characters: string[]; places: string[]; objects: string[] }
    expected_transitions: Array<{ role: string; change: string; target_role?: string }>
  }>

  // Get ordered archetype nodes from graph
  const spineNodes = graph.graph.nodes
    .filter((n) => {
      const match = n.node_id.match(/_N(\d{2})_/)
      return match ? parseInt(match[1], 10) < 50 : false
    })
    .sort((a, b) => {
      const aNum = parseInt(a.node_id.match(/_N(\d{2})_/)?.[1] ?? '0', 10)
      const bNum = parseInt(b.node_id.match(/_N(\d{2})_/)?.[1] ?? '0', 10)
      return aNum - bNum
    })

  // Collect all character roles that appear in timeline
  const allRoles = new Set<string>()
  for (const moment of templateTimeline) {
    for (const role of moment.expected_participants.characters) {
      allRoles.add(role)
    }
  }
  const roleList = Array.from(allRoles)

  // Build instance name lookup
  const instanceNames = new Map<string, string>()
  if (examples) {
    for (const c of examples.characters ?? []) {
      instanceNames.set(c.role, c.name)
    }
  }

  const hasExamples = instanceNames.size > 0

  // Build node-to-moment index
  const nodeToMoment = new Map<string, typeof templateTimeline[0]>()
  for (const m of templateTimeline) {
    nodeToMoment.set(m.archetype_node, m)
  }

  const COL_WIDTH = 70
  const ROW_HEIGHT = 28
  const LABEL_WIDTH = 110
  const totalWidth = LABEL_WIDTH + spineNodes.length * COL_WIDTH + 10

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, paddingLeft: 14 }}>
        <ToggleBtn label="Roles" active={viewMode === 'template'} onClick={() => setViewMode('template')} />
        {hasExamples && (
          <ToggleBtn label="Names" active={viewMode === 'instance'} onClick={() => setViewMode('instance')} />
        )}
      </div>

      {/* Swimlane grid */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 400 }}>
        <div style={{ minWidth: totalWidth }}>
          {/* Column headers (archetype nodes) */}
          <div style={{ display: 'flex', paddingLeft: LABEL_WIDTH, marginBottom: 2 }}>
            {spineNodes.map((node) => {
              const isSelected = node.node_id === selectedNodeId
              return (
                <div
                  key={node.node_id}
                  onClick={() => onSelectNode?.(node.node_id)}
                  style={{
                    width: COL_WIDTH,
                    fontSize: 8,
                    textAlign: 'center',
                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    padding: '2px 2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={`${node.label} (${node.node_id})`}
                >
                  {node.role}
                </div>
              )
            })}
          </div>

          {/* Swimlane rows (one per character role) */}
          {roleList.map((role, roleIdx) => {
            const color = TRACK_COLORS[roleIdx % TRACK_COLORS.length]
            const displayName = viewMode === 'instance' && instanceNames.has(role)
              ? instanceNames.get(role)!
              : role.replace(/_/g, ' ')

            return (
              <div key={role} style={{ display: 'flex', alignItems: 'center', height: ROW_HEIGHT }}>
                {/* Row label */}
                <div style={{
                  width: LABEL_WIDTH,
                  paddingLeft: 14,
                  paddingRight: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  color,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0,
                }} title={displayName}>
                  {displayName}
                </div>

                {/* Cells (one per archetype node) */}
                {spineNodes.map((node) => {
                  const moment = nodeToMoment.get(node.node_id)
                  const isPresent = moment?.expected_participants.characters.includes(role) ?? false
                  const isSelected = node.node_id === selectedNodeId
                  const transitions = moment?.expected_transitions.filter((t) => t.role === role) ?? []

                  return (
                    <div
                      key={node.node_id}
                      onClick={() => onSelectNode?.(node.node_id)}
                      style={{
                        width: COL_WIDTH,
                        height: ROW_HEIGHT - 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 3,
                        margin: '0 1px',
                        background: isPresent
                          ? isSelected ? `${color}30` : `${color}15`
                          : 'transparent',
                        border: isSelected ? `1px solid ${color}50` : '1px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      title={isPresent
                        ? `${displayName} at ${node.label}${transitions.length > 0 ? ': ' + transitions.map((t) => t.change).join(', ') : ''}`
                        : `${displayName} not present at ${node.label}`
                      }
                    >
                      {isPresent && (
                        <div style={{ display: 'flex', gap: 1 }}>
                          {transitions.length > 0
                            ? transitions.map((t, i) => (
                              <span
                                key={i}
                                style={{
                                  fontSize: 10,
                                  color,
                                  fontWeight: 600,
                                }}
                                title={`${t.change}${t.target_role ? ` (${t.target_role})` : ''}`}
                              >
                                {CHANGE_LABELS[t.change] ?? '\u25CF'}
                              </span>
                            ))
                            : <span style={{ fontSize: 8, color: `${color}80` }}>{'\u25CF'}</span>
                          }
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        paddingLeft: 14,
        paddingTop: 8,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
      }}>
        {Object.entries(CHANGE_LABELS).filter(([k]) => k !== 'establishes_baseline').map(([change, icon]) => (
          <span key={change} style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <span style={{ fontWeight: 600 }}>{icon}</span> {change}
          </span>
        ))}
      </div>
    </div>
  )
}

function ToggleBtn({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 3,
        border: '1px solid',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}
