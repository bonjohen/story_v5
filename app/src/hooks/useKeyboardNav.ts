import { useEffect, useCallback } from 'react'
import type { NormalizedGraph } from '../graph-engine/index.ts'

/**
 * Keyboard navigation hook — handles arrow key traversal and Escape to clear selection.
 */
export function useKeyboardNav(
  currentGraph: NormalizedGraph | null,
  selectedNodeId: string | null,
  selectNode: (id: string | null) => void,
  clearSelection: () => void,
  onEscape?: () => void,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!currentGraph) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.key === 'Escape') {
        clearSelection()
        onEscape?.()
        return
      }

      if (!selectedNodeId) return

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const neighbors = currentGraph.adjacency.get(selectedNodeId) ?? []
        if (neighbors.length > 0) selectNode(neighbors[0])
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const predecessors = currentGraph.reverseAdjacency.get(selectedNodeId) ?? []
        if (predecessors.length > 0) selectNode(predecessors[0])
      }
    },
    [currentGraph, selectedNodeId, selectNode, clearSelection, onEscape],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
