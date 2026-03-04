/**
 * Elements Panel — shows story element roles at a selected archetype node,
 * with optional instance-level names from example works.
 * For genre views, shows element constraints if available.
 */

import { useEffect, useState } from 'react'
import { useElementStore } from '../store/elementStore.ts'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/** Color coding for element categories */
const CATEGORY_COLORS: Record<string, string> = {
  character: '#3b82f6',
  place: '#22c55e',
  object: '#f59e0b',
  relationship: '#a855f7',
}

/** Icons for element categories */
const CATEGORY_ICONS: Record<string, string> = {
  character: '\u263A',  // smiley
  place: '\u2302',      // house
  object: '\u2726',     // four-pointed star
  relationship: '\u2194', // left-right arrow
}

interface ElementsPanelProps {
  graph: NormalizedGraph
  selectedNodeId: string | null
}

export function ElementsPanel({ graph, selectedNodeId }: ElementsPanelProps) {
  const graphType = graph.graph.type
  const graphId = graph.graph.id

  // Parse dir from graph ID (e.g., "01_heros_journey" or "07_adventure")
  const dir = graphId

  const loadArchetypeElements = useElementStore((s) => s.loadArchetypeElements)
  const loadGenreConstraints = useElementStore((s) => s.loadGenreConstraints)
  const archetypeElements = useElementStore((s) => s.archetypeElements)
  const exampleElements = useElementStore((s) => s.exampleElements)
  const genreConstraints = useElementStore((s) => s.genreConstraints)
  const loadingElements = useElementStore((s) => s.loadingElements)
  const loadingConstraints = useElementStore((s) => s.loadingConstraints)

  // Load data on mount / graph change
  useEffect(() => {
    if (graphType === 'archetype') {
      void loadArchetypeElements(dir)
    } else if (graphType === 'genre') {
      void loadGenreConstraints(dir)
    }
  }, [dir, graphType, loadArchetypeElements, loadGenreConstraints])

  if (graphType === 'archetype') {
    return (
      <ArchetypeElementsView
        dir={dir}
        selectedNodeId={selectedNodeId}
        elements={archetypeElements.get(dir) ?? null}
        examples={exampleElements.get(dir) ?? null}
        loading={loadingElements}
      />
    )
  }

  if (graphType === 'genre') {
    return (
      <GenreConstraintsView
        dir={dir}
        constraints={genreConstraints.get(dir) ?? null}
        loading={loadingConstraints}
      />
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Archetype Elements View
// ---------------------------------------------------------------------------

function ArchetypeElementsView({
  dir: _dir,
  selectedNodeId,
  elements,
  examples,
  loading,
}: {
  dir: string
  selectedNodeId: string | null
  elements: ReturnType<typeof useElementStore.getState>['archetypeElements'] extends Map<string, infer V> ? V | null : never
  examples: ReturnType<typeof useElementStore.getState>['exampleElements'] extends Map<string, infer V> ? V | null : never
  loading: boolean
}) {
  const [viewMode, setViewMode] = useState<'all' | 'node'>('node')

  if (loading) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>Loading elements...</div>
  }

  if (!elements) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>No element data available for this archetype.</div>
  }

  const templates = elements.element_templates

  // Filter elements by selected node
  const filterByNode = viewMode === 'node' && selectedNodeId
  const chars = filterByNode
    ? templates.characters.filter((c) => c.appears_at_nodes.includes(selectedNodeId))
    : templates.characters
  const places = filterByNode
    ? templates.places.filter((p) => p.appears_at_nodes.includes(selectedNodeId))
    : templates.places
  const objects = filterByNode
    ? templates.objects.filter((o) => o.appears_at_nodes.includes(selectedNodeId))
    : templates.objects

  // Build instance lookup from examples
  const instanceLookup = new Map<string, { name: string; traits?: string[] }>()
  if (examples) {
    for (const c of examples.characters ?? []) {
      instanceLookup.set(`character:${c.role}`, { name: c.name, traits: c.traits })
    }
    for (const p of examples.places ?? []) {
      instanceLookup.set(`place:${p.type}`, { name: p.name })
    }
    for (const o of examples.objects ?? []) {
      instanceLookup.set(`object:${o.type}`, { name: o.name })
    }
  }

  const hasAny = chars.length > 0 || places.length > 0 || objects.length > 0

  return (
    <div style={{ padding: '10px 14px' }}>
      {/* View mode toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        <ToggleButton label="At Node" active={viewMode === 'node'} onClick={() => setViewMode('node')} />
        <ToggleButton label="All" active={viewMode === 'all'} onClick={() => setViewMode('all')} />
      </div>

      {viewMode === 'node' && !selectedNodeId && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
          Select a node to see elements at that phase.
        </div>
      )}

      {/* Example work title */}
      {examples && (examples as Record<string, unknown>).story_title && (
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          marginBottom: 8,
          padding: '3px 6px',
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 3,
        }}>
          Example: {(examples as Record<string, unknown>).story_title as string}
        </div>
      )}

      {!hasAny && viewMode === 'node' && selectedNodeId && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No elements appear at this node.</div>
      )}

      {/* Characters */}
      {chars.length > 0 && (
        <ElementSection
          title="Characters"
          color={CATEGORY_COLORS.character}
          icon={CATEGORY_ICONS.character}
          items={chars.map((c) => ({
            role: c.role,
            label: c.label,
            definition: c.definition,
            required: c.required,
            instanceName: instanceLookup.get(`character:${c.role}`)?.name,
            instanceTraits: instanceLookup.get(`character:${c.role}`)?.traits,
          }))}
        />
      )}

      {/* Places */}
      {places.length > 0 && (
        <ElementSection
          title="Places"
          color={CATEGORY_COLORS.place}
          icon={CATEGORY_ICONS.place}
          items={places.map((p) => ({
            role: p.type,
            label: p.label,
            definition: p.definition,
            required: p.required,
            instanceName: instanceLookup.get(`place:${p.type}`)?.name,
          }))}
        />
      )}

      {/* Objects */}
      {objects.length > 0 && (
        <ElementSection
          title="Objects"
          color={CATEGORY_COLORS.object}
          icon={CATEGORY_ICONS.object}
          items={objects.map((o) => ({
            role: o.type,
            label: o.label,
            definition: o.definition,
            required: o.required,
            instanceName: instanceLookup.get(`object:${o.type}`)?.name,
          }))}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Genre Constraints View
// ---------------------------------------------------------------------------

function GenreConstraintsView({
  dir: _dir,
  constraints,
  loading,
}: {
  dir: string
  constraints: ReturnType<typeof useElementStore.getState>['genreConstraints'] extends Map<string, infer V> ? V | null : never
  loading: boolean
}) {
  if (loading) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>Loading constraints...</div>
  }

  if (!constraints) {
    return <div style={{ padding: 14, fontSize: 12, color: 'var(--text-muted)' }}>No element constraints for this genre.</div>
  }

  return (
    <div style={{ padding: '10px 14px' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
        {constraints.description}
      </p>

      {/* Character constraints */}
      {constraints.character_constraints.length > 0 && (
        <ConstraintSection
          title="Character Requirements"
          color={CATEGORY_COLORS.character}
          icon={CATEGORY_ICONS.character}
          items={constraints.character_constraints.map((c) => ({
            label: c.role,
            severity: c.severity,
            description: c.description,
          }))}
        />
      )}

      {/* Relationship constraints */}
      {constraints.relationship_constraints.length > 0 && (
        <ConstraintSection
          title="Relationship Requirements"
          color={CATEGORY_COLORS.relationship}
          icon={CATEGORY_ICONS.relationship}
          items={constraints.relationship_constraints.map((r) => ({
            label: r.type,
            severity: r.severity,
            description: r.description,
          }))}
        />
      )}

      {/* Place constraints */}
      {constraints.place_constraints.length > 0 && (
        <ConstraintSection
          title="Place Requirements"
          color={CATEGORY_COLORS.place}
          icon={CATEGORY_ICONS.place}
          items={constraints.place_constraints.map((p) => ({
            label: p.type,
            severity: p.severity,
            description: p.description,
          }))}
        />
      )}

      {/* Object constraints */}
      {constraints.object_constraints.length > 0 && (
        <ConstraintSection
          title="Object Requirements"
          color={CATEGORY_COLORS.object}
          icon={CATEGORY_ICONS.object}
          items={constraints.object_constraints.map((o) => ({
            label: o.type,
            severity: o.severity,
            description: o.description,
          }))}
        />
      )}

      {/* Element rules */}
      {constraints.element_rules.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}>
            Element Rules ({constraints.element_rules.length})
          </div>
          {constraints.element_rules.map((rule) => (
            <div key={rule.rule_id} style={{
              marginBottom: 8,
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
              borderLeft: `2px solid ${rule.severity === 'required' ? '#ef4444' : rule.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rule.rule_id}</span>
                <SeverityBadge severity={rule.severity} />
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                {rule.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function ElementSection({ title, color, icon, items }: {
  title: string
  color: string
  icon: string
  items: Array<{
    role: string
    label: string
    definition: string
    required: boolean
    instanceName?: string
    instanceTraits?: string[]
  }>
}) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          textAlign: 'left',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color,
          marginBottom: open ? 4 : 0,
          padding: '2px 0',
        }}
      >
        <span style={{
          fontSize: 8,
          transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          {'\u25B6'}
        </span>
        {icon} {title} ({items.length})
      </button>
      {open && (
        <div>
          {items.map((item) => (
            <div key={item.role} style={{
              marginBottom: 6,
              padding: '5px 8px',
              background: `${color}08`,
              borderRadius: 4,
              borderLeft: `2px solid ${color}${item.required ? '' : '40'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color,
                }}>
                  {item.label}
                </span>
                {item.required && (
                  <span style={{
                    fontSize: 8,
                    padding: '1px 4px',
                    borderRadius: 2,
                    background: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    fontWeight: 600,
                  }}>REQ</span>
                )}
                {item.instanceName && (
                  <span style={{
                    fontSize: 9,
                    color: 'var(--accent)',
                    fontStyle: 'italic',
                  }}>
                    {'\u2192'} {item.instanceName}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {item.definition}
              </div>
              {item.instanceTraits && item.instanceTraits.length > 0 && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  Traits: {item.instanceTraits.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ConstraintSection({ title, color, icon, items }: {
  title: string
  color: string
  icon: string
  items: Array<{
    label: string
    severity: string
    description: string
  }>
}) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          textAlign: 'left',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color,
          marginBottom: open ? 4 : 0,
          padding: '2px 0',
        }}
      >
        <span style={{
          fontSize: 8,
          transition: 'transform 0.15s',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          {'\u25B6'}
        </span>
        {icon} {title} ({items.length})
      </button>
      {open && (
        <div>
          {items.map((item) => (
            <div key={item.label} style={{
              marginBottom: 6,
              padding: '5px 8px',
              background: `${color}08`,
              borderRadius: 4,
              borderLeft: `2px solid ${item.severity === 'required' ? '#ef4444' : item.severity === 'recommended' ? '#f59e0b' : '#6b7280'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color }}>
                  {item.label.replace(/_/g, ' ')}
                </span>
                <SeverityBadge severity={item.severity} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    required: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
    recommended: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    optional: { bg: 'rgba(107,114,128,0.15)', text: '#6b7280' },
  }
  const c = colors[severity] ?? colors.optional
  return (
    <span style={{
      fontSize: 8,
      padding: '1px 4px',
      borderRadius: 2,
      background: c.bg,
      color: c.text,
      fontWeight: 600,
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  )
}

function ToggleButton({ label, active, onClick }: {
  label: string
  active: boolean
  onClick: () => void
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
