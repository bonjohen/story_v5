/**
 * GraphViewer — graph canvas tab showing the active archetype/genre graph
 * with a toggle bar, search, compare mode, and selected node/edge detail below.
 *
 * Renders inside the gen-panel tab system (full-width when active).
 */

import { useCallback, useRef, useMemo } from 'react'
import { GraphCanvas } from '../render/GraphCanvas.tsx'
import { GraphSearch } from './GraphSearch.tsx'
import { DetailPanel } from '../panels/DetailPanel.tsx'
import { useGraphStore } from '../store/graphStore.ts'
import { useUIStore } from '../store/uiStore.ts'
import { useGenerationStore } from '../generation/store/generationStore.ts'
import { useKeyboardNav } from '../hooks/useKeyboardNav.ts'
import { useTraceNavigation } from '../hooks/useTraceNavigation.ts'
import type { CyCore, GenerationOverlay } from '../render/GraphCanvas.tsx'

interface GraphViewerProps {
  genHighlightNodes: string[]
}

export function GraphViewer({ genHighlightNodes }: GraphViewerProps) {
  const archetypeGraph = useGraphStore((s) => s.archetypeGraph)
  const archetypeDir = useGraphStore((s) => s.archetypeDir)
  const genreGraph = useGraphStore((s) => s.genreGraph)
  const genreDir = useGraphStore((s) => s.genreDir)
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const viewMode = useGraphStore((s) => s.viewMode)
  const activateGraph = useGraphStore((s) => s.activateGraph)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)
  const selectNode = useGraphStore((s) => s.selectNode)
  const highlightedPath = useGraphStore((s) => s.highlightedPath)
  const setHighlightedPath = useGraphStore((s) => s.setHighlightedPath)
  const clearSelection = useGraphStore((s) => s.clearSelection)

  const splitView = useUIStore((s) => s.splitView)
  const toggleSplitView = useUIStore((s) => s.toggleSplitView)

  const genStatus = useGenerationStore((s) => s.status)
  const genContract = useGenerationStore((s) => s.contract)
  const genPlan = useGenerationStore((s) => s.plan)
  const genTrace = useGenerationStore((s) => s.trace)

  const cyArchRef = useRef<CyCore | null>(null)
  const cyGenreRef = useRef<CyCore | null>(null)
  const handleArchCyReady = useCallback((cy: CyCore) => { cyArchRef.current = cy }, [])
  const handleGenreCyReady = useCallback((cy: CyCore) => { cyGenreRef.current = cy }, [])
  const handleArchFocus = useCallback(() => activateGraph('archetype'), [activateGraph])
  const handleGenreFocus = useCallback(() => activateGraph('genre'), [activateGraph])
  const handleSearchSelect = useCallback((nodeId: string) => selectNode(nodeId), [selectNode])

  const { traceDirection, handleTraceForward, handleTraceBackward, handleClearTrace } =
    useTraceNavigation(currentGraph, selectedNodeId, setHighlightedPath)

  useKeyboardNav(currentGraph, selectedNodeId, selectNode, clearSelection, handleClearTrace)

  // Selected node/edge for detail panel
  const selectedNode = currentGraph?.graph.nodes.find((n) => n.node_id === selectedNodeId) ?? null
  const selectedEdge = currentGraph?.graph.edges.find((e) => e.edge_id === selectedEdgeId) ?? null
  const hasDetail = !!(selectedNode || selectedEdge)

  // Generation overlay for archetype graph
  const generationOverlay = useMemo<GenerationOverlay | undefined>(() => {
    if (genStatus === 'IDLE') return undefined
    if (!genPlan && !genTrace) return undefined
    const coveredNodes: string[] = []
    const antiPatternNodes: string[] = []
    const activeSceneNodes: string[] = genHighlightNodes
    if (genPlan) {
      for (const scene of genPlan.scenes) {
        coveredNodes.push(scene.archetype_trace.node_id)
        for (const ob of scene.genre_obligations) coveredNodes.push(ob.node_id)
      }
    }
    if (genContract) antiPatternNodes.push(...genContract.genre.anti_patterns)
    return { coveredNodes, antiPatternNodes, activeSceneNodes }
  }, [genStatus, genPlan, genTrace, genContract, genHighlightNodes])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Graph toggle bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => { if (splitView) toggleSplitView(); activateGraph('archetype'); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: !splitView && viewMode === 'archetype' ? 600 : 400,
              color: !splitView && viewMode === 'archetype' ? '#f59e0b' : 'var(--text-muted)',
              background: !splitView && viewMode === 'archetype' ? '#f59e0b14' : 'transparent',
              borderRight: '1px solid var(--border)',
            }}
          >Archetype</button>
          <button
            onClick={() => { if (splitView) toggleSplitView(); activateGraph('genre'); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: !splitView && viewMode === 'genre' ? 600 : 400,
              color: !splitView && viewMode === 'genre' ? '#8b5cf6' : 'var(--text-muted)',
              background: !splitView && viewMode === 'genre' ? '#8b5cf614' : 'transparent',
              borderRight: '1px solid var(--border)',
            }}
          >Genre</button>
          <button
            onClick={() => { if (!splitView) toggleSplitView(); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: splitView ? 600 : 400,
              color: splitView ? 'var(--accent)' : 'var(--text-muted)',
              background: splitView ? 'rgba(59,130,246,0.08)' : 'transparent',
            }}
          >Compare</button>
        </div>
        {!splitView && currentGraph && (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {currentGraph.graph.name}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
              {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
            </span>
          </span>
        )}
        {currentGraph && <GraphSearch graph={currentGraph} onSelect={handleSearchSelect} />}
      </div>

      {/* Graph canvas — takes available space */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', minHeight: 200 }}>
        {splitView ? (
          <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {archetypeGraph ? (
                <div key={archetypeDir ? `archetype/${archetypeDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                  <GraphCanvas graph={archetypeGraph} graphId={archetypeDir ? `archetype/${archetypeDir}` : undefined}
                    highlightedPath={viewMode === 'archetype' ? highlightedPath : undefined}
                    generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                    onCyReady={handleArchCyReady} onFocus={handleArchFocus} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No archetype loaded</div>
              )}
            </div>
            <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {genreGraph ? (
                <div key={genreDir ? `genre/${genreDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                  <GraphCanvas graph={genreGraph} graphId={genreDir ? `genre/${genreDir}` : undefined}
                    highlightedPath={viewMode === 'genre' ? highlightedPath : undefined}
                    onCyReady={handleGenreCyReady} onFocus={handleGenreFocus} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No genre loaded</div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentGraph ? (
              <div
                key={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : 'arch') : (genreDir ? `genre/${genreDir}` : 'genre')}
                style={{ width: '100%', height: '100%' }}
              >
                <GraphCanvas
                  graph={currentGraph}
                  graphId={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : undefined) : (genreDir ? `genre/${genreDir}` : undefined)}
                  highlightedPath={highlightedPath}
                  generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                  onCyReady={viewMode === 'archetype' ? handleArchCyReady : handleGenreCyReady}
                  onFocus={viewMode === 'archetype' ? handleArchFocus : handleGenreFocus}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>
                No graph loaded
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected node/edge detail — below the graph */}
      {hasDetail && currentGraph && (
        <div style={{ flexShrink: 0, maxHeight: '40%', overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
          <DetailPanel
            node={selectedNode}
            edge={selectedEdge}
            onTraceForward={handleTraceForward}
            onTraceBackward={handleTraceBackward}
            onClearTrace={handleClearTrace}
            traceActive={traceDirection}
            graph={currentGraph}
          />
        </div>
      )}
    </div>
  )
}
