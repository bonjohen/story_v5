import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '../components/MarkdownRenderer.tsx'

describe('MarkdownRenderer', () => {
  it('renders HTML content', () => {
    const html = '<h1>Title</h1><p data-paragraph-index="0">Content here.</p>'
    render(<MarkdownRenderer html={html} />)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Content here.')).toBeInTheDocument()
  })

  it('renders multiple paragraphs', () => {
    const html = '<p data-paragraph-index="0">First</p><p data-paragraph-index="1">Second</p>'
    render(<MarkdownRenderer html={html} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('applies highlight to the specified paragraph', () => {
    const html = '<p data-paragraph-index="0">A</p><p data-paragraph-index="1">B</p>'
    const { container } = render(<MarkdownRenderer html={html} highlightedParagraphIndex={1} />)

    const highlighted = container.querySelector('p[data-paragraph-index="1"]') as HTMLElement
    expect(highlighted.style.borderLeft).toContain('3px solid var(--accent)')
    expect(highlighted.style.background).toContain('rgba')
  })

  it('clears highlight when index is null', () => {
    const html = '<p data-paragraph-index="0">A</p>'
    const { container, rerender } = render(
      <MarkdownRenderer html={html} highlightedParagraphIndex={0} />,
    )

    let p = container.querySelector('p[data-paragraph-index="0"]') as HTMLElement
    expect(p.style.background).toContain('rgba')

    rerender(<MarkdownRenderer html={html} highlightedParagraphIndex={null} />)
    p = container.querySelector('p[data-paragraph-index="0"]') as HTMLElement
    expect(p.style.background).toBe('')
  })

  it('handles empty content gracefully', () => {
    const { container } = render(<MarkdownRenderer html="" />)
    expect(container.querySelector('.script-content')).toBeInTheDocument()
  })
})
