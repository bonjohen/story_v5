import { describe, it, expect } from 'vitest'
import {
  parseMarkdownToHtml,
  parseMarkdownToSections,
  injectParagraphIndices,
  countParagraphs,
} from './parseMarkdown.ts'

describe('parseMarkdownToHtml', () => {
  it('converts markdown headings and paragraphs to HTML', () => {
    const md = '# Title\n\nSome text.\n\nMore text.'
    const html = parseMarkdownToHtml(md)
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<p>Some text.</p>')
    expect(html).toContain('<p>More text.</p>')
  })

  it('handles code blocks', () => {
    const md = '## Code\n\n```js\nconsole.log("hi")\n```'
    const html = parseMarkdownToHtml(md)
    expect(html).toContain('<code class="language-js">')
  })
})

describe('parseMarkdownToSections', () => {
  it('splits on headings with sequential indices including headings', () => {
    const md = [
      '# Introduction',
      '',
      'First paragraph.',
      '',
      'Second paragraph.',
      '',
      '## Details',
      '',
      'Third paragraph.',
    ].join('\n')

    const sections = parseMarkdownToSections(md)
    expect(sections).toHaveLength(2)
    expect(sections[0].heading).toBe('Introduction')
    expect(sections[0].level).toBe(1)
    expect(sections[0].headingIndex).toBe(0)
    expect(sections[0].paragraphs).toHaveLength(2)
    expect(sections[0].paragraphs[0]).toEqual({ text: 'First paragraph.', index: 1 })
    expect(sections[0].paragraphs[1]).toEqual({ text: 'Second paragraph.', index: 2 })
    expect(sections[1].heading).toBe('Details')
    expect(sections[1].level).toBe(2)
    expect(sections[1].headingIndex).toBe(3)
    expect(sections[1].paragraphs).toHaveLength(1)
    expect(sections[1].paragraphs[0]).toEqual({ text: 'Third paragraph.', index: 4 })
  })

  it('skips horizontal rules and italic subtitles', () => {
    const md = [
      '# Title',
      '',
      '*Estimated listening time: 8 minutes.*',
      '',
      '---',
      '',
      'Actual content.',
    ].join('\n')

    const sections = parseMarkdownToSections(md)
    expect(sections).toHaveLength(1)
    expect(sections[0].headingIndex).toBe(0)
    expect(sections[0].paragraphs).toHaveLength(1)
    expect(sections[0].paragraphs[0].text).toBe('Actual content.')
    expect(sections[0].paragraphs[0].index).toBe(1)
  })

  it('merges multi-line paragraphs', () => {
    const md = '# Heading\n\nLine one\nline two\nline three.'
    const sections = parseMarkdownToSections(md)
    expect(sections[0].paragraphs[0].text).toBe('Line one line two line three.')
  })

  it('returns empty array for empty input', () => {
    expect(parseMarkdownToSections('')).toEqual([])
  })
})

describe('injectParagraphIndices', () => {
  it('adds data-paragraph-index to headings and paragraphs', () => {
    const html = '<h1>Title</h1><p>First</p><p>Second</p>'
    const result = injectParagraphIndices(html)
    expect(result).toContain('<h1 data-paragraph-index="0">Title</h1>')
    expect(result).toContain('<p data-paragraph-index="1">First</p>')
    expect(result).toContain('<p data-paragraph-index="2">Second</p>')
  })

  it('handles HTML with no <p> tags', () => {
    const html = '<h1>Title</h1>'
    const result = injectParagraphIndices(html)
    expect(result).toContain('<h1 data-paragraph-index="0">Title</h1>')
  })

  it('skips italic subtitle <p> before first <h2>', () => {
    const html = '<h1>Title</h1>\n<p><em>Subtitle text</em></p>\n<h2>Section</h2>\n<p>Content</p>'
    const result = injectParagraphIndices(html)
    expect(result).toContain('<h1 data-paragraph-index="0">')
    expect(result).toContain('<p><em>Subtitle text</em></p>')
    expect(result).not.toContain('data-paragraph-index="1"><em>Subtitle')
    expect(result).toContain('<h2 data-paragraph-index="1">')
    expect(result).toContain('<p data-paragraph-index="2">Content</p>')
  })
})

describe('countParagraphs', () => {
  it('sums headings and paragraphs across sections', () => {
    const sections = [
      { heading: 'A', level: 1, headingIndex: 0, paragraphs: [{ text: 'a', index: 1 }, { text: 'b', index: 2 }] },
      { heading: 'B', level: 2, headingIndex: 3, paragraphs: [{ text: 'c', index: 4 }] },
    ]
    expect(countParagraphs(sections)).toBe(5)
  })
})
