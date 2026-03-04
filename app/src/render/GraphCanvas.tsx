import { useEffect, useRef, useCallback, useState } from 'react'
import cytoscape, { type Core, type EventObject } from 'cytoscape'
export type { Core as CyCore } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { useGraphStore } from '../store/graphStore.ts'
import { buildCytoscapeElements } from './elements.ts'
import { applyLayout } from '../layout/applyLayout.ts'
import { getCoreStyle } from './styles.ts'

interface SimulationVisuals {
  currentNodeId: string | null
  visitedNodes: string[]
  availableEdges: string[]
}

interface GraphCanvasProps {
  graph: NormalizedGraph
  highlightedPath?: string[]
  onEdgeHover?: (edgeId: string, x: number, y: number) => void
  onEdgeHoverOut?: () => void
  simulationState?: SimulationVisuals
  failureModeNodes?: string[]
  activeVariant?: string | null
  exampleMappedNodes?: string[]
  onCyReady?: (cy: Core) => void
}

export function GraphCanvas({
  graph,
  highlightedPath,
  onEdgeHover,
  onEdgeHoverOut,
  simulationState,
  failureModeNodes,
  activeVariant,
  exampleMappedNodes,
  onCyReady,
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
      selectNode(evt.target.id())
    },
    [selectNode],
  )

  const handleEdgeTap = useCallback(
    (evt: EventObject) => {
      selectEdge(evt.target.id())
    },
    [selectEdge],
  )

  const handleBgTap = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Edge hover handlers
  const handleEdgeMouseOver = useCallback(
    (evt: EventObject) => {
      if (!onEdgeHover) return
      const pos = evt.renderedPosition || evt.position
      if (pos) {
        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          onEdgeHover(evt.target.id(), rect.left + pos.x, rect.top + pos.y)
        }
      }
    },
    [onEdgeHover],
  )

  const handleEdgeMouseOut = useCallback(() => {
    onEdgeHoverOut?.()
  }, [onEdgeHoverOut])

  // Minimap state
  const [minimapSrc, setMinimapSrc] = useState<string | null>(null)
  const [viewportRect, setViewportRect] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null)
  const minimapRef = useRef<HTMLDivElement>(null)

  const MINIMAP_W = 160
  const MINIMAP_H = 120

  const updateMinimap = useCallback(() => {
    const cy = cyRef.current
    if (!cy || cy.elements().length === 0) return

    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f1117'
      const png = cy.png({ full: true, maxWidth: MINIMAP_W, maxHeight: MINIMAP_H, bg })
      setMinimapSrc(png)

      const bb = cy.elements().boundingBox()
      const ext = cy.extent()
      if (bb.w <= 0 || bb.h <= 0) return

      const scaleX = MINIMAP_W / bb.w
      const scaleY = MINIMAP_H / bb.h
      const scale = Math.min(scaleX, scaleY)

      const renderedW = bb.w * scale
      const renderedH = bb.h * scale
      const offsetX = (MINIMAP_W - renderedW) / 2
      const offsetY = (MINIMAP_H - renderedH) / 2

      setViewportRect({
        x: offsetX + (ext.x1 - bb.x1) * scale,
        y: offsetY + (ext.y1 - bb.y1) * scale,
        w: Math.min(ext.w * scale, renderedW),
        h: Math.min(ext.h * scale, renderedH),
      })
    } catch {
      // png() can fail during transitions
    }
  }, [])

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
      minZoom: 0.2,
      maxZoom: 3,
    })

    cy.on('tap', 'node', handleNodeTap)
    cy.on('tap', 'edge', handleEdgeTap)
    cy.on('tap', handleBgTap)
    cy.on('mouseover', 'edge', handleEdgeMouseOver)
    cy.on('mouseout', 'edge', handleEdgeMouseOut)
    cy.on('viewport', updateMinimap)

    applyLayout(cy, graph)

    cyRef.current = cy
    onCyReady?.(cy)

    requestAnimationFrame(() => updateMinimap())

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, handleNodeTap, handleEdgeTap, handleBgTap, handleEdgeMouseOver, handleEdgeMouseOut, updateMinimap, onCyReady])

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

    // Highlight edges that lead TO failure mode nodes
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

    // Find variant nodes (50-79 range)
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

  // Center on selected node (triggered by search or keyboard nav)
  useEffect(() => {
    const cy = cyRef.current
    if (!cy || !selectedNodeId) return

    const node = cy.getElementById(selectedNodeId)
    if (node.length > 0) {
      cy.animate({
        center: { eles: node },
        duration: 200,
      })
    }
  }, [selectedNodeId])

  // Click on minimap to pan
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cy = cyRef.current
    if (!cy || !minimapRef.current) return

    const rect = minimapRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const bb = cy.elements().boundingBox()
    if (bb.w <= 0 || bb.h <= 0) return

    const scaleX = MINIMAP_W / bb.w
    const scaleY = MINIMAP_H / bb.h
    const scale = Math.min(scaleX, scaleY)

    const renderedW = bb.w * scale
    const renderedH = bb.h * scale
    const offsetX = (MINIMAP_W - renderedW) / 2
    const offsetY = (MINIMAP_H - renderedH) / 2

    const graphX = bb.x1 + (clickX - offsetX) / scale
    const graphY = bb.y1 + (clickY - offsetY) / scale

    cy.animate({
      center: { x: graphX, y: graphY },
      duration: 200,
    })
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <div
        ref={containerRef}
        role="application"
        aria-label={`Graph canvas: ${graph.graph.name} — ${graph.graph.nodes.length} nodes, ${graph.graph.edges.length} edges. Use mouse to pan and zoom, click nodes to select.`}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Minimap */}
      {minimapSrc && (
        <div
          ref={minimapRef}
          onClick={handleMinimapClick}
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            width: MINIMAP_W,
            height: MINIMAP_H,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            overflow: 'hidden',
            cursor: 'crosshair',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        >
          <img
            src={minimapSrc}
            alt="Graph minimap"
            style={{
              width: MINIMAP_W,
              height: MINIMAP_H,
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
          {viewportRect && (
            <div style={{
              position: 'absolute',
              left: viewportRect.x,
              top: viewportRect.y,
              width: viewportRect.w,
              height: viewportRect.h,
              border: '1.5px solid var(--accent)',
              background: 'rgba(59, 130, 246, 0.08)',
              borderRadius: 2,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )}
    </div>
  )
}
