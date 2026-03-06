/**
 * Character Arc Panel — SVG line chart showing emotional arc dimensions
 * across archetype nodes. Optionally filters to nodes where a specific
 * character role participates, creating a per-character emotional trajectory.
 */

import { useEffect, useState, useMemo } from 'react'
import { useElementStore } from '../store/elementStore.ts'
import type { EmotionalArcPoint } from '../store/elementStore.ts'
import type { NormalizedGraph } from '../graph-engine/index.ts'

const DIMENSIONS = ['tension', 'hope', 'fear', 'resolution'] as const
type Dimension = typeof DIMENSIONS[number]

const DIM_COLORS: Record<Dimension, string> = {
  tension: '#ef4444',
  hope: '#22c55e',
  fear: '#a855f7',
  resolution: '#3b82f6',
}

interface CharacterArcPanelProps {
  graph: NormalizedGraph
  selectedNodeId: string | null
  onSelectNode?: (nodeId: string) => void
}

export function CharacterArcPanel({ graph, selectedNodeId, onSelectNode }: CharacterArcPanelProps) {
  const graphType = graph.graph.type
  const dir = graph.graph.id

  const loadEmotionalArcs = useElementStore((s) => s.loadEmotionalArcs)
  const emotionalArcs = useElementStore((s) => s.emotionalArcs)
  const archetypeTimelines = useElementStore((s) => s.archetypeTimelines)
  const loadArchetypeElements = useElementStore((s) => s.loadArchetypeElements)

  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [activeDims, setActiveDims] = useState<Set<Dimension>>(new Set(['tension', 'hope', 'fear', 'resolution']))

  useEffect(() => {
    void loadEmotionalArcs()
    if (graphType === 'archetype') {
      void loadArchetypeElements(dir)
    }
  }, [dir, graphType, loadEmotionalArcs, loadArchetypeElements])

  const arcData = graphType === 'archetype' ? emotionalArcs.get(dir) : undefined
  const timelineData = graphType === 'archetype' ? archetypeTimelines.get(dir) : undefined

  // Get all character roles from the template timeline
  const allRoles = useMemo(() => {
    if (!timelineData?.template_timeline) return []
    const roles = new Set<string>()
    const timeline = timelineData.template_timeline as Array<{
      expected_participants: { characters: string[] }
    }>
    for (const moment of timeline) {
      for (const role of moment.expected_participants.characters) {
        roles.add(role)
      }
    }
    return Array.from(roles)
  }, [timelineData])

  // Build set of nodes where selected character participates
  const characterNodes = useMemo(() => {
    if (selectedRole === 'all' || !timelineData?.template_timeline) return null
    const nodes = new Set<string>()
    const timeline = timelineData.template_timeline as Array<{
      archetype_node: string
      expected_participants: { characters: string[] }
    }>
    for (const moment of timeline) {
      if (moment.expected_participants.characters.includes(selectedRole)) {
        nodes.add(moment.archetype_node)
      }
    }
    return nodes
  }, [selectedRole, timelineData])

  if (graphType !== 'archetype') {
    return (
      <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        Character arc view is available for archetype graphs only.
      </div>
    )
  }

  if (!arcData) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>No emotional arc data available.</div>
  }

  // Filter arc points to character's nodes
  const filteredArc: EmotionalArcPoint[] = characterNodes
    ? arcData.arc_profile.filter((p) => characterNodes.has(p.node_id))
    : arcData.arc_profile

  if (filteredArc.length === 0) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>No arc data for selected character.</div>
  }

  // Chart dimensions
  const PADDING = { top: 10, right: 14, bottom: 30, left: 32 }
  const CHART_WIDTH = 280
  const CHART_HEIGHT = 140
  const plotW = CHART_WIDTH - PADDING.left - PADDING.right
  const plotH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const toggleDim = (dim: Dimension) => {
    setActiveDims((prev) => {
      const next = new Set(prev)
      if (next.has(dim)) {
        if (next.size > 1) next.delete(dim)
      } else {
        next.add(dim)
      }
      return next
    })
  }

  // Map position (0-1) to x, value (0-1) to y
  const xScale = (pos: number) => PADDING.left + pos * plotW
  const yScale = (val: number) => PADDING.top + (1 - val) * plotH

  // Build SVG path for a dimension
  const buildPath = (dim: Dimension): string => {
    return filteredArc
      .map((p, i) => {
        const x = xScale(p.position)
        const y = yScale(p[dim])
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  // Find which arc point is closest to the selected node
  const selectedPointIdx = selectedNodeId
    ? filteredArc.findIndex((p) => p.node_id === selectedNodeId)
    : -1

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Controls */}
      <div style={{ paddingLeft: 14, paddingRight: 14, marginBottom: 6 }}>
        {/* Character dropdown */}
        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
            Character focus
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{
              width: '100%',
              fontSize: 10,
              padding: '3px 4px',
              borderRadius: 3,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All nodes (archetype arc)</option>
            {allRoles.map((role) => (
              <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Dimension toggles */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {DIMENSIONS.map((dim) => {
            const active = activeDims.has(dim)
            return (
              <button
                key={dim}
                onClick={() => toggleDim(dim)}
                style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: active ? DIM_COLORS[dim] : 'var(--border)',
                  background: active ? `${DIM_COLORS[dim]}20` : 'transparent',
                  color: active ? DIM_COLORS[dim] : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {dim}
              </button>
            )
          })}
        </div>
      </div>

      {/* Arc shape badge */}
      <div style={{ paddingLeft: 14, marginBottom: 4, fontSize: 9, color: 'var(--text-muted)' }}>
        {arcData.arc_shape} &middot; dominant: {arcData.dominant_emotion} &middot; range: {arcData.emotional_range.toFixed(2)}
      </div>

      {/* SVG Chart */}
      <div style={{ paddingLeft: 4, overflowX: 'auto' }}>
        <svg
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          style={{ display: 'block' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line
                x1={PADDING.left}
                y1={yScale(v)}
                x2={PADDING.left + plotW}
                y2={yScale(v)}
                stroke="var(--border)"
                strokeWidth={0.5}
                strokeDasharray={v === 0 || v === 1 ? undefined : '2,2'}
              />
              <text
                x={PADDING.left - 4}
                y={yScale(v) + 3}
                textAnchor="end"
                fontSize={7}
                fill="var(--text-muted)"
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Node position markers on x-axis */}
          {filteredArc.map((p) => {
            const x = xScale(p.position)
            const isSelected = p.node_id === selectedNodeId
            return (
              <g key={p.node_id}>
                <line
                  x1={x}
                  y1={PADDING.top}
                  x2={x}
                  y2={PADDING.top + plotH}
                  stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={isSelected ? 1 : 0.3}
                  strokeDasharray={isSelected ? undefined : '1,3'}
                />
                <text
                  x={x}
                  y={CHART_HEIGHT - 4}
                  textAnchor="middle"
                  fontSize={6}
                  fill={isSelected ? 'var(--accent)' : 'var(--text-muted)'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectNode?.(p.node_id)}
                >
                  {p.node_id.replace(/^[A-Z]+_N\d+_/, '').substring(0, 5)}
                </text>
              </g>
            )
          })}

          {/* Dimension lines */}
          {DIMENSIONS.filter((d) => activeDims.has(d)).map((dim) => (
            <path
              key={dim}
              d={buildPath(dim)}
              fill="none"
              stroke={DIM_COLORS[dim]}
              strokeWidth={1.5}
              strokeLinejoin="round"
              opacity={0.85}
            />
          ))}

          {/* Data points */}
          {DIMENSIONS.filter((d) => activeDims.has(d)).map((dim) =>
            filteredArc.map((p) => {
              const x = xScale(p.position)
              const y = yScale(p[dim])
              const isSelected = p.node_id === selectedNodeId
              return (
                <circle
                  key={`${dim}-${p.node_id}`}
                  cx={x}
                  cy={y}
                  r={isSelected ? 3 : 1.5}
                  fill={DIM_COLORS[dim]}
                  stroke={isSelected ? 'var(--bg-primary)' : 'none'}
                  strokeWidth={isSelected ? 1 : 0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectNode?.(p.node_id)}
                >
                  <title>{`${dim}: ${p[dim].toFixed(2)} at ${p.node_id.replace(/^[A-Z]+_N\d+_/, '').replace(/_/g, ' ')}`}</title>
                </circle>
              )
            }),
          )}

          {/* Selected node highlight line */}
          {selectedPointIdx >= 0 && (
            <line
              x1={xScale(filteredArc[selectedPointIdx].position)}
              y1={PADDING.top}
              x2={xScale(filteredArc[selectedPointIdx].position)}
              y2={PADDING.top + plotH}
              stroke="var(--accent)"
              strokeWidth={1}
              opacity={0.5}
            />
          )}
        </svg>
      </div>

      {/* Selected point detail */}
      {selectedPointIdx >= 0 && (
        <div style={{
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 6,
          fontSize: 9,
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--text-primary)' }}>
            {filteredArc[selectedPointIdx].node_id.replace(/^[A-Z]+_N\d+_/, '').replace(/_/g, ' ')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DIMENSIONS.filter((d) => activeDims.has(d)).map((dim) => (
              <span key={dim} style={{ color: DIM_COLORS[dim] }}>
                {dim}: {filteredArc[selectedPointIdx][dim].toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        fontSize: 9,
        color: 'var(--text-muted)',
        lineHeight: 1.4,
      }}>
        {selectedRole !== 'all' && (
          <div style={{ marginBottom: 4, fontStyle: 'italic' }}>
            Showing {filteredArc.length} of {arcData.arc_profile.length} nodes where {selectedRole.replace(/_/g, ' ')} participates.
          </div>
        )}
        {arcData.summary}
      </div>
    </div>
  )
}
