import { useEffect, useRef, useCallback, useState } from 'react'
import cytoscape, { type Core, type EventObject } from 'cytoscape'
import type { NormalizedGraph } from '../graph-engine/index.ts'
import { useGraphStore } from '../store/graphStore.ts'
import { buildCytoscapeElements } from './elements.ts'
import { applyLayout } from '../layout/applyLayout.ts'
import { getCoreStyle } from './styles.ts'

interface GraphCanvasProps {
  graph: NormalizedGraph
}

export function GraphCanvas({ graph }: GraphCanvasProps) {
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
      const png = cy.png({ full: true, maxWidth: MINIMAP_W, maxHeight: MINIMAP_H, bg: '#0f1117' })
      setMinimapSrc(png)

      // Compute viewport rectangle relative to full graph bounding box
      const bb = cy.elements().boundingBox()
      const ext = cy.extent()

      if (bb.w <= 0 || bb.h <= 0) return

      // Scale factor from graph coords to minimap pixels
      const scaleX = MINIMAP_W / bb.w
      const scaleY = MINIMAP_H / bb.h
      const scale = Math.min(scaleX, scaleY)

      // Offset to center the graph in the minimap
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

    // Update minimap on viewport changes
    cy.on('viewport', updateMinimap)

    applyLayout(cy, graph)

    cyRef.current = cy

    // Initial minimap render after layout
    requestAnimationFrame(() => updateMinimap())

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, handleNodeTap, handleEdgeTap, handleBgTap, updateMinimap])

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

    // Convert minimap click to graph coordinates
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
            background: '#0f1117',
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
          {/* Viewport rectangle */}
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
