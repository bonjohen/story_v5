import { useEffect, useRef, useCallback, memo } from 'react'
import cytoscape, { type Core, type EventObject } from 'cytoscape'
export type { Core as CyCore } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { useGraphStore } from '../store/graphStore.ts'
import { buildCytoscapeElements } from './elements.ts'
import { applyLayout } from '../layout/applyLayout.ts'
import { savePositions } from '../layout/positionStore.ts'
import { getCoreStyle } from './styles.ts'

interface SimulationVisuals {
  currentNodeId: string | null
  visitedNodes: string[]
  availableEdges: string[]
}

export interface GenerationOverlay {
  coveredNodes: string[]
  antiPatternNodes: string[]
  activeSceneNodes: string[]
}

interface GraphCanvasProps {
  graph: NormalizedGraph
  graphId?: string
  highlightedPath?: string[]
  simulationState?: SimulationVisuals
  failureModeNodes?: string[]
  activeVariant?: string | null
  exampleMappedNodes?: string[]
  generationOverlay?: GenerationOverlay
  onCyReady?: (cy: Core) => void
  onFocus?: () => void
}


export const GraphCanvas = memo(function GraphCanvas({
  graph,
  graphId,
  highlightedPath,
  simulationState,
  failureModeNodes,
  activeVariant,
  exampleMappedNodes,
  generationOverlay,
  onCyReady,
  onFocus,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  const selectNode = useGraphStore((s) => s.selectNode)
  const selectEdge = useGraphStore((s) => s.selectEdge)
  const clearSelection = useGraphStore((s) => s.clearSelection)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)

  const handleNodeTap = useCallback(
    (evt: EventObject) => {
      evt.stopPropagation()
      onFocus?.()
      selectNode((evt.target as cytoscape.NodeSingular).id())
    },
    [selectNode, onFocus],
  )

  const handleEdgeTap = useCallback(
    (evt: EventObject) => {
      evt.stopPropagation()
      onFocus?.()
      selectEdge((evt.target as cytoscape.EdgeSingular).id())
    },
    [selectEdge, onFocus],
  )

  // Only clear selection on actual background taps, not on node/edge taps
  const handleBgTap = useCallback(
    (evt: EventObject) => {
      if (evt.target === cyRef.current) {
        clearSelection()
      }
    },
    [clearSelection],
  )


  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return

    const elements = buildCytoscapeElements(graph)

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: getCoreStyle(graph.graph.type),
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      minZoom: 0.15,
      maxZoom: 3,
    })

    cy.on('tap', 'node', handleNodeTap)
    cy.on('tap', 'edge', handleEdgeTap)
    cy.on('tap', handleBgTap)
    // Save positions after a node is dragged
    if (graphId) {
      cy.on('free', 'node', () => {
        savePositions(graphId, cy)
      })
    }

    applyLayout(cy, graph, graphId)

    cyRef.current = cy
    onCyReady?.(cy)

    // Ensure graph is properly fitted after layout + container are settled
    let destroyed = false
    requestAnimationFrame(() => {
      if (destroyed) return
      cy.fit(undefined, 30)
    })

    return () => {
      destroyed = true
      cy.removeAllListeners()
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, graphId, handleNodeTap, handleEdgeTap, handleBgTap, onCyReady])

  // Sync selection highlighting
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('selected neighbor')

    if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId)
      node.addClass('selected')
      node.neighborhood().addClass('neighbor')
    }

    if (selectedEdgeId) {
      const edge = cy.getElementById(selectedEdgeId)
      edge.addClass('selected')
      edge.connectedNodes().addClass('neighbor')
    }
  }, [selectedNodeId, selectedEdgeId])

  // Path highlighting (trace forward/backward)
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('traced dimmed')

    if (highlightedPath && highlightedPath.length > 0) {
      const pathSet = new Set(highlightedPath)

      cy.nodes().forEach((node) => {
        if (pathSet.has(node.id())) {
          node.addClass('traced')
        } else {
          node.addClass('dimmed')
        }
      })

      cy.edges().forEach((edge) => {
        const src = edge.source().id()
        const tgt = edge.target().id()
        if (pathSet.has(src) && pathSet.has(tgt)) {
          edge.addClass('traced')
        } else {
          edge.addClass('dimmed')
        }
      })
    }
  }, [highlightedPath])

  // Simulation visualization
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('sim-current sim-visited sim-available sim-dimmed')

    if (!simulationState) return

    const { currentNodeId: simCurrent, visitedNodes, availableEdges: simEdges } = simulationState
    const visitedSet = new Set(visitedNodes)
    const availSet = new Set(simEdges)

    cy.nodes().forEach((node) => {
      const id = node.id()
      if (id === simCurrent) {
        node.addClass('sim-current')
      } else if (visitedSet.has(id)) {
        node.addClass('sim-visited')
      } else {
        node.addClass('sim-dimmed')
      }
    })

    cy.edges().forEach((edge) => {
      if (availSet.has(edge.id())) {
        edge.addClass('sim-available')
      } else {
        const src = edge.source().id()
        const tgt = edge.target().id()
        if (visitedSet.has(src) && visitedSet.has(tgt)) {
          edge.addClass('sim-visited')
        } else {
          edge.addClass('sim-dimmed')
        }
      }
    })
  }, [simulationState])

  // Failure mode overlay
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('failure-mode failure-path')

    if (!failureModeNodes || failureModeNodes.length === 0) return

    const failSet = new Set(failureModeNodes)

    cy.nodes().forEach((node) => {
      if (failSet.has(node.id())) {
        node.addClass('failure-mode')
      }
    })

    cy.edges().forEach((edge) => {
      if (failSet.has(edge.target().id())) {
        edge.addClass('failure-path')
      }
    })
  }, [failureModeNodes])

  // Variant highlighting
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('variant-active variant-dimmed')

    if (!activeVariant) return

    const isVariantNode = (id: string) => {
      const match = id.match(/_N(\d{2})_/)
      if (!match) return false
      const num = parseInt(match[1], 10)
      return num >= 50 && num <= 79
    }

    cy.nodes().forEach((node) => {
      if (isVariantNode(node.id())) {
        node.addClass('variant-dimmed')
      }
    })

    cy.edges().forEach((edge) => {
      if (isVariantNode(edge.source().id()) || isVariantNode(edge.target().id())) {
        edge.addClass('variant-dimmed')
      }
    })
  }, [activeVariant])

  // Example mode highlighting
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('example-mapped example-unmapped')

    if (!exampleMappedNodes || exampleMappedNodes.length === 0) return

    const mappedSet = new Set(exampleMappedNodes)

    cy.nodes().forEach((node) => {
      if (mappedSet.has(node.id())) {
        node.addClass('example-mapped')
      } else {
        node.addClass('example-unmapped')
      }
    })

    cy.edges().forEach((edge) => {
      const src = edge.source().id()
      const tgt = edge.target().id()
      if (!mappedSet.has(src) && !mappedSet.has(tgt)) {
        edge.addClass('example-unmapped')
      }
    })
  }, [exampleMappedNodes])

  // Generation overlay
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return

    cy.elements().removeClass('gen-covered gen-anti-pattern gen-active-scene gen-uncovered')

    if (!generationOverlay) return

    const { coveredNodes, antiPatternNodes, activeSceneNodes } = generationOverlay
    const coveredSet = new Set(coveredNodes)
    const antiSet = new Set(antiPatternNodes)
    const activeSet = new Set(activeSceneNodes)

    cy.nodes().forEach((node) => {
      const id = node.id()
      if (activeSet.has(id)) {
        node.addClass('gen-active-scene')
      } else if (antiSet.has(id)) {
        node.addClass('gen-anti-pattern')
      } else if (coveredSet.has(id)) {
        node.addClass('gen-covered')
      } else {
        node.addClass('gen-uncovered')
      }
    })

    cy.edges().forEach((edge) => {
      const src = edge.source().id()
      const tgt = edge.target().id()
      if (activeSet.has(src) && activeSet.has(tgt)) {
        edge.addClass('gen-active-scene')
      } else if (!coveredSet.has(src) && !coveredSet.has(tgt)) {
        edge.addClass('gen-uncovered')
      }
    })
  }, [generationOverlay])

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <div
        ref={containerRef}
        role="application"
        aria-label={`Graph canvas: ${graph.graph.name} — ${graph.graph.nodes.length} nodes, ${graph.graph.edges.length} edges. Use mouse to pan and zoom, click nodes to select.`}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Floating zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 6,
      }}>
        <button
          aria-label="Zoom in"
          onClick={() => { const cy = cyRef.current; if (cy) cy.zoom({ level: cy.zoom() * 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }) }}
          style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >+</button>
        <button
          aria-label="Zoom out"
          onClick={() => { const cy = cyRef.current; if (cy) cy.zoom({ level: cy.zoom() / 1.3, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }) }}
          style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >−</button>
        <button
          aria-label="Fit graph to view"
          onClick={() => { const cy = cyRef.current; if (cy) cy.fit(undefined, 30) }}
          style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >Fit</button>
      </div>
    </div>
  )
})
