/**
 * Example Overlay Panel — toggle example mode, select works, compare two examples.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import {
  parseExamplesMd,
  getWorkNames,
  getNodeIdsForWork,
  getNodeExample,
  getEdgeExample,
  type ParsedExamples,
} from '../graph-engine/exampleParser.ts'
import { useGraphStore } from '../store/graphStore.ts'

interface ExampleOverlayProps {
  graph: NormalizedGraph
  onHighlightNodes: (nodeIds: string[], color?: string) => void
  onClearHighlight: () => void
}

export function ExampleOverlay({ graph, onHighlightNodes, onClearHighlight }: ExampleOverlayProps) {
  const [examples, setExamples] = useState<ParsedExamples | null>(null)
  const [exampleLoading, setExampleLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [selectedWork, setSelectedWork] = useState<string | null>(null)
  const [compareWork, setCompareWork] = useState<string | null>(null)

  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)

  // Load examples.md when enabled
  useEffect(() => {
    if (!enabled || examples) return
    setExampleLoading(true) // eslint-disable-line react-hooks/set-state-in-effect -- data fetch init

    const basePath = graph.graph.type === 'archetype'
      ? `archetypes/${graph.graph.id.replace('archetype_', '')}`
      : `genres/${graph.graph.id.replace('genre_', '')}`
    const url = `${import.meta.env.BASE_URL}data/${basePath}/examples.md`

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`)
        return res.text()
      })
      .then((text) => {
        const parsed = parseExamplesMd(text)
        setExamples(parsed)
        if (parsed.works.length > 0) {
          setSelectedWork(parsed.works[0].name)
        }
      })
      .catch(() => setExamples({ works: [], nodeMappings: [], edgeMappings: [] }))
      .finally(() => setExampleLoading(false))
  }, [enabled, examples, graph])

  // Reset when graph changes
  useEffect(() => {
    setExamples(null) // eslint-disable-line react-hooks/set-state-in-effect -- reset on graph change
    setEnabled(false)
    setSelectedWork(null)
    setCompareWork(null)
  }, [graph.graph.id])

  // Update canvas highlighting when work selection changes
  useEffect(() => {
    if (!enabled || !examples || !selectedWork) {
      onClearHighlight()
      return
    }

    const nodeIds = Array.from(getNodeIdsForWork(examples, selectedWork))
      .filter((id) => id !== '__cross_ref__')

    if (compareWork) {
      const compareIds = Array.from(getNodeIdsForWork(examples, compareWork))
        .filter((id) => id !== '__cross_ref__')
      // Combine both sets
      const allIds = [...new Set([...nodeIds, ...compareIds])]
      onHighlightNodes(allIds, 'example')
    } else {
      onHighlightNodes(nodeIds, 'example')
    }
  }, [enabled, examples, selectedWork, compareWork, onHighlightNodes, onClearHighlight])

  const workNames = useMemo(() => {
    return examples ? getWorkNames(examples) : []
  }, [examples])

  // Get example text for the currently selected node/edge
  const currentNodeExample = useMemo(() => {
    if (!examples || !selectedNodeId || !selectedWork) return null
    return getNodeExample(examples, selectedNodeId, selectedWork)
  }, [examples, selectedNodeId, selectedWork])

  const currentEdgeExample = useMemo(() => {
    if (!examples || !selectedEdgeId || !selectedWork) return null
    return getEdgeExample(examples, selectedEdgeId, selectedWork)
  }, [examples, selectedEdgeId, selectedWork])

  const compareNodeExample = useMemo(() => {
    if (!examples || !selectedNodeId || !compareWork) return null
    return getNodeExample(examples, selectedNodeId, compareWork)
  }, [examples, selectedNodeId, compareWork])

  const handleToggle = useCallback(() => {
    if (enabled) {
      setEnabled(false)
      onClearHighlight()
    } else {
      setEnabled(true)
    }
  }, [enabled, onClearHighlight])

  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
    }}>
      {/* Toggle header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: enabled ? 8 : 0,
      }}>
        <span style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: enabled ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: 600,
        }}>
          Example Mode
        </span>
        <button
          onClick={handleToggle}
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 3,
            border: '1px solid',
            borderColor: enabled ? 'var(--accent)' : 'var(--border)',
            background: enabled ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: enabled ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {exampleLoading && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0' }}>
          Loading examples...
        </div>
      )}

      {enabled && examples && (
        <>
          {/* Work selector */}
          {workNames.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}>
                Primary Work
              </div>
              <select
                value={selectedWork ?? ''}
                onChange={(e) => setSelectedWork(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: 11,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                }}
              >
                {workNames.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          )}

          {/* Compare work selector */}
          {workNames.length > 1 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}>
                Compare With
              </div>
              <select
                value={compareWork ?? ''}
                onChange={(e) => setCompareWork(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  fontSize: 11,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 3,
                }}
              >
                <option value="">None</option>
                {workNames
                  .filter((w) => w !== selectedWork)
                  .map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
              </select>
            </div>
          )}

          {/* Example text for selected node */}
          {currentNodeExample && (
            <div style={{
              padding: '8px',
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              marginBottom: 6,
              borderLeft: '3px solid var(--accent)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, fontWeight: 600 }}>
                {selectedWork}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>{currentNodeExample}</div>
            </div>
          )}

          {/* Compare example */}
          {compareNodeExample && (
            <div style={{
              padding: '8px',
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              marginBottom: 6,
              borderLeft: '3px solid #8b5cf6',
            }}>
              <div style={{ fontSize: 10, color: '#8b5cf6', marginBottom: 4, fontWeight: 600 }}>
                {compareWork}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>{compareNodeExample}</div>
            </div>
          )}

          {/* Edge example */}
          {currentEdgeExample && (
            <div style={{
              padding: '8px',
              background: 'var(--bg-elevated)',
              borderRadius: 4,
              marginBottom: 6,
              borderLeft: '3px solid #22c55e',
            }}>
              <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 4, fontWeight: 600 }}>
                Edge — {selectedWork}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>{currentEdgeExample}</div>
            </div>
          )}

          {/* No mapping found */}
          {enabled && selectedNodeId && !currentNodeExample && !currentEdgeExample && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0' }}>
              No example mapping for this {selectedNodeId ? 'node' : 'edge'}.
            </div>
          )}
        </>
      )}
    </div>
  )
}
