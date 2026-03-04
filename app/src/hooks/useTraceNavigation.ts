import { useCallback, useState, useEffect } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/**
 * Trace navigation hook — BFS forward/backward path tracing from a selected node.
 */
export function useTraceNavigation(
  currentGraph: NormalizedGraph | null,
  selectedNodeId: string | null,
  setHighlightedPath: (path: string[]) => void,
) {
  const [traceDirection, setTraceDirection] = useState<'forward' | 'backward' | null>(null)

  const handleTraceForward = useCallback(() => {
    if (!currentGraph || !selectedNodeId) return
    const visited = new Set<string>()
    const queue = [selectedNodeId]
    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (!nodeId || visited.has(nodeId)) continue
      visited.add(nodeId)
      const neighbors = currentGraph.adjacency.get(nodeId) ?? []
      for (const n of neighbors) {
        if (!visited.has(n)) queue.push(n)
      }
    }
    setHighlightedPath(Array.from(visited))
    setTraceDirection('forward')
  }, [currentGraph, selectedNodeId, setHighlightedPath])

  const handleTraceBackward = useCallback(() => {
    if (!currentGraph || !selectedNodeId) return
    const visited = new Set<string>()
    const queue = [selectedNodeId]
    while (queue.length > 0) {
      const nodeId = queue.shift()
      if (!nodeId || visited.has(nodeId)) continue
      visited.add(nodeId)
      const predecessors = currentGraph.reverseAdjacency.get(nodeId) ?? []
      for (const n of predecessors) {
        if (!visited.has(n)) queue.push(n)
      }
    }
    setHighlightedPath(Array.from(visited))
    setTraceDirection('backward')
  }, [currentGraph, selectedNodeId, setHighlightedPath])

  const handleClearTrace = useCallback(() => {
    setHighlightedPath([])
    setTraceDirection(null)
  }, [setHighlightedPath])

  // Clear trace direction when selection changes
  useEffect(() => {
    setTraceDirection(null) // eslint-disable-line react-hooks/set-state-in-effect -- reset on selection change
  }, [selectedNodeId])

  return { traceDirection, handleTraceForward, handleTraceBackward, handleClearTrace }
}
