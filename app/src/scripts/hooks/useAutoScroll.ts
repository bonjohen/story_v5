import { useEffect, useRef } from 'react'

/**
 * Auto-scrolls a container to keep the currently-highlighted paragraph visible.
 * Disables auto-scroll when the user manually scrolls, re-enables on the next
 * segment change.
 */
export function useAutoScroll(
  paragraphIndex: number,
  containerRef: React.RefObject<HTMLElement | null>,
) {
  const userScrolledRef = useRef(false)
  const lastIndexRef = useRef(-1)

  // Detect user scroll to temporarily disable auto-scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeout: ReturnType<typeof setTimeout>
    const onScroll = () => {
      // Mark as user-scrolled (debounced to distinguish from programmatic scroll)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        userScrolledRef.current = true
      }, 150)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      clearTimeout(timeout)
    }
  }, [containerRef])

  // Scroll to target paragraph when index changes
  useEffect(() => {
    if (paragraphIndex < 0) {
      lastIndexRef.current = -1
      return
    }

    // Re-enable auto-scroll when segment changes
    if (paragraphIndex !== lastIndexRef.current) {
      userScrolledRef.current = false
      lastIndexRef.current = paragraphIndex
    }

    if (userScrolledRef.current) return

    const container = containerRef.current
    if (!container) return

    const target = container.querySelector<HTMLElement>(
      `[data-paragraph-index="${paragraphIndex}"]`,
    )
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [paragraphIndex, containerRef])
}
