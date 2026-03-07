import { useEffect, useRef, useCallback, useState, memo } from 'react'
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

const MINIMAP_W = 160
const MINIMAP_H = 120

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

  // --- Minimap state ---
  const [minimapSrc, setMinimapSrc] = useState<string | null>(null)
  const [viewportRect, setViewportRect] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null)
  const minimapRef = useRef<HTMLDivElement>(null)
  const minimapBBRef = useRef<{ x1: number; y1: number; w: number; h: number } | null>(null)

  const renderMinimap = useCallback(() => {
    const cy = cyRef.current
    if (!cy || cy.elements().length === 0) return

    try {
      const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--bg-primary').trim() || '#0f1117'
      const bb = cy.elements().boundingBox()
      if (bb.w <= 0 || bb.h <= 0) return

      minimapBBRef.current = { x1: bb.x1, y1: bb.y1, w: bb.w, h: bb.h }

      const png = cy.png({ full: true, maxWidth: MINIMAP_W, maxHeight: MINIMAP_H, bg })
      setMinimapSrc(png)
    } catch (e) {
      console.debug('Minimap render skipped:', e)
    }
  }, [])

  const updateViewportRect = useCallback(() => {
    const cy = cyRef.current
    const bb = minimapBBRef.current
    if (!cy || !bb || bb.w <= 0 || bb.h <= 0) return

    try {
      const ext = cy.extent()

      const scaleX = MINIMAP_W / bb.w
      const scaleY = MINIMAP_H / bb.h
      const scale = Math.min(scaleX, scaleY)

      const graphW = bb.w * scale
      const graphH = bb.h * scale
      const ox = (MINIMAP_W - graphW) / 2
      const oy = (MINIMAP_H - graphH) / 2

      const vx = ox + (ext.x1 - bb.x1) * scale
      const vy = oy + (ext.y1 - bb.y1) * scale
      const vw = ext.w * scale
      const vh = ext.h * scale

      const clampedX = Math.max(ox, Math.min(vx, ox + graphW))
      const clampedY = Math.max(oy, Math.min(vy, oy + graphH))
      const clampedW = Math.min(vw, ox + graphW - clampedX)
      const clampedH = Math.min(vh, oy + graphH - clampedY)

      setViewportRect({
        x: clampedX,
        y: clampedY,
        w: Math.max(4, clampedW),
        h: Math.max(4, clampedH),
      })
    } catch (e) {
      console.debug('Viewport rect update skipped:', e)
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
      minZoom: 0.15,
      maxZoom: 3,
    })

    cy.on('tap', 'node', handleNodeTap)
    cy.on('tap', 'edge', handleEdgeTap)
    cy.on('tap', handleBgTap)
    cy.on('viewport', updateViewportRect)

    // Save positions after a node is dragged
    if (graphId) {
      cy.on('free', 'node', () => {
        savePositions(graphId, cy)
        renderMinimap()
      })
    }

    applyLayout(cy, graph, graphId)

    cyRef.current = cy
    onCyReady?.(cy)

    // Ensure graph is properly fitted after layout + container are settled
    requestAnimationFrame(() => {
      cy.fit(undefined, 30)
      requestAnimationFrame(() => {
        renderMinimap()
        requestAnimationFrame(() => updateViewportRect())
      })
    })

    return () => {
      cy.removeAllListeners()
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, graphId, handleNodeTap, handleEdgeTap, handleBgTap, renderMinimap, updateViewportRect, onCyReady])

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

  // Click on minimap to pan
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const cy = cyRef.current
    const bb = minimapBBRef.current
    if (!cy || !minimapRef.current || !bb || bb.w <= 0 || bb.h <= 0) return

    const rect = minimapRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const scaleX = MINIMAP_W / bb.w
    const scaleY = MINIMAP_H / bb.h
    const scale = Math.min(scaleX, scaleY)
    const graphW = bb.w * scale
    const graphH = bb.h * scale
    const ox = (MINIMAP_W - graphW) / 2
    const oy = (MINIMAP_H - graphH) / 2

    const graphX = bb.x1 + (clickX - ox) / scale
    const graphY = bb.y1 + (clickY - oy) / scale

    const zoom = cy.zoom()
    cy.animate({
      pan: {
        x: cy.width() / 2 - graphX * zoom,
        y: cy.height() / 2 - graphY * zoom,
      },
      duration: 200,
    })
  }, [])

  const handleMinimapKeyDown = useCallback((e: React.KeyboardEvent) => {
    const cy = cyRef.current
    if (!cy) return
    const PAN_STEP = 50
    let dx = 0
    let dy = 0
    switch (e.key) {
      case 'ArrowLeft': dx = PAN_STEP; break
      case 'ArrowRight': dx = -PAN_STEP; break
      case 'ArrowUp': dy = PAN_STEP; break
      case 'ArrowDown': dy = -PAN_STEP; break
      default: return
    }
    e.preventDefault()
    const pan = cy.pan()
    cy.animate({ pan: { x: pan.x + dx, y: pan.y + dy }, duration: 100 })
  }, [])

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
        bottom: minimapSrc ? MINIMAP_H + 24 : 12,
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
      {/* Minimap */}
      {minimapSrc && (
        <div
          ref={minimapRef}
          role="img"
          aria-label="Graph minimap"
          tabIndex={0}
          onClick={handleMinimapClick}
          onKeyDown={handleMinimapKeyDown}
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
            alt=""
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
              background: 'rgba(59, 130, 246, 0.12)',
              borderRadius: 2,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      )}
    </div>
  )
})
