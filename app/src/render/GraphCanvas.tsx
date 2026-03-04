import { useEffect, useRef, useCallback } from 'react'
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

    applyLayout(cy, graph)

    cyRef.current = cy

    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [graph, handleNodeTap, handleEdgeTap, handleBgTap])

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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  )
}
