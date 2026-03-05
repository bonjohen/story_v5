import { useEffect, useRef, useCallback } from 'react'

interface MarkdownRendererProps {
  html: string
  highlightedParagraphIndex?: number | null
  /** Called when user clicks a paragraph to start reading from it. */
  onParagraphClick?: (paragraphIndex: number) => void
  /** Called when user selects text and clicks "Read selection". */
  onReadSelection?: (text: string) => void
}

const CONTAINER_STYLES: React.CSSProperties = {
  lineHeight: 1.75,
  fontSize: 15,
  color: 'var(--text-primary)',
  position: 'relative',
}

/**
 * Renders pre-parsed HTML (from project-owned markdown scripts).
 * Supports paragraph highlighting for TTS tracking,
 * click-to-start-reading, and read-selection.
 */
export function MarkdownRenderer({
  html,
  highlightedParagraphIndex,
  onParagraphClick,
  onReadSelection,
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear previous highlights
    container.querySelectorAll<HTMLElement>('[data-paragraph-index]').forEach((el) => {
      el.style.background = ''
      el.style.borderLeft = ''
      el.style.paddingLeft = ''
      el.style.transition = ''
      el.style.borderRadius = ''
    })

    // Apply highlight to current paragraph
    if (highlightedParagraphIndex != null && highlightedParagraphIndex >= 0) {
      const target = container.querySelector<HTMLElement>(
        `p[data-paragraph-index="${highlightedParagraphIndex}"]`,
      )
      if (target) {
        target.style.background = 'rgba(59,130,246,0.12)'
        target.style.borderLeft = '3px solid var(--accent)'
        target.style.paddingLeft = '12px'
        target.style.borderRadius = '4px'
        target.style.transition = 'background 0.2s, border-left 0.2s, padding-left 0.2s'
      }
    }
  }, [highlightedParagraphIndex])

  // Add cursor style to clickable paragraphs
  useEffect(() => {
    const container = containerRef.current
    if (!container || !onParagraphClick) return
    container.querySelectorAll<HTMLElement>('[data-paragraph-index]').forEach((el) => {
      el.style.cursor = 'pointer'
    })
  }, [html, onParagraphClick])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't trigger if user is selecting text
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 0) return

      if (!onParagraphClick) return
      const target = (e.target as HTMLElement).closest('[data-paragraph-index]')
      if (!target) return
      const idx = parseInt(target.getAttribute('data-paragraph-index') ?? '', 10)
      if (!isNaN(idx)) onParagraphClick(idx)
    },
    [onParagraphClick],
  )

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        className="script-content"
        style={CONTAINER_STYLES}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleClick}
      />
      {onReadSelection && <SelectionPopup containerRef={containerRef} onRead={onReadSelection} />}
    </div>
  )
}

/**
 * Floating "Read selection" button that appears when user selects text
 * within the script content area.
 */
function SelectionPopup({
  containerRef,
  onRead,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  onRead: (text: string) => void
}) {
  const popupRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleSelectionChange = () => {
      const popup = popupRef.current
      if (!popup) return

      const selection = window.getSelection()
      const text = selection?.toString().trim() ?? ''

      if (text.length === 0) {
        popup.style.display = 'none'
        return
      }

      // Only show if selection is within our container
      const anchorNode = selection?.anchorNode
      if (!anchorNode || !containerRef.current?.contains(anchorNode)) {
        popup.style.display = 'none'
        return
      }

      const range = selection?.getRangeAt(0)
      if (!range) {
        popup.style.display = 'none'
        return
      }

      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()

      popup.style.display = 'block'
      popup.style.top = `${rect.top - containerRect.top - 36}px`
      popup.style.left = `${rect.left - containerRect.left + rect.width / 2}px`
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [containerRef])

  const handleClick = () => {
    const text = window.getSelection()?.toString().trim()
    if (text) {
      onRead(text)
      window.getSelection()?.removeAllRanges()
    }
    if (popupRef.current) popupRef.current.style.display = 'none'
  }

  return (
    <button
      ref={popupRef}
      onClick={handleClick}
      style={{
        display: 'none',
        position: 'absolute',
        transform: 'translateX(-50%)',
        zIndex: 20,
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 4,
        border: '1px solid var(--accent)',
        background: 'var(--bg-elevated)',
        color: 'var(--accent)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {'\u25B6'} Read selection
    </button>
  )
}
