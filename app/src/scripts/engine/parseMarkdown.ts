import { marked } from 'marked'
import type { ScriptSection } from '../types.ts'

/** Convert markdown to HTML string using marked. */
export function parseMarkdownToHtml(md: string): string {
  return marked.parse(md, { async: false })
}

/**
 * Split markdown into sections based on ## headings.
 * Each section contains its heading and an array of paragraphs
 * with sequential indices across the entire document.
 * Headings with non-empty text also receive a headingIndex so
 * TTS can read them aloud and the renderer can highlight them.
 */
export function parseMarkdownToSections(md: string): ScriptSection[] {
  const lines = md.split('\n')
  const sections: ScriptSection[] = []
  let currentSection: ScriptSection | null = null
  let paragraphIndex = 0
  let buffer = ''

  const flushBuffer = () => {
    const text = buffer.trim()
    if (text && currentSection) {
      currentSection.paragraphs.push({ text, index: paragraphIndex++ })
    }
    buffer = ''
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushBuffer()
      const level = headingMatch[1].length
      const heading = headingMatch[2].trim()
      currentSection = { heading, level, headingIndex: paragraphIndex++, paragraphs: [] }
      sections.push(currentSection)
      continue
    }

    // Horizontal rules separate logical blocks but aren't content
    if (/^---+\s*$/.test(line)) {
      flushBuffer()
      continue
    }

    // Empty line flushes current paragraph buffer
    if (line.trim() === '') {
      flushBuffer()
      continue
    }

    // Skip italic subtitle lines (e.g., *Estimated listening time...*)
    if (/^\*[^*]+\*$/.test(line.trim())) {
      flushBuffer()
      continue
    }

    // Accumulate lines into paragraph buffer
    if (!currentSection) {
      // Create implicit section for content before first heading
      currentSection = { heading: '', level: 0, paragraphs: [] }
      sections.push(currentSection)
    }
    buffer += (buffer ? ' ' : '') + line.trim()
  }

  flushBuffer()
  return sections
}

/**
 * Inject data-paragraph-index attributes into heading and paragraph tags
 * in the HTML. This allows DOM targeting for TTS highlighting.
 *
 * Skips <p> tags that are italic subtitle lines — these appear before the
 * first <h2> and contain only <em> content. They get no data-paragraph-index
 * so they don't consume an index that would offset real content.
 */
export function injectParagraphIndices(html: string): string {
  let index = 0
  const firstH2 = html.indexOf('<h2')
  const boundary = firstH2 === -1 ? 0 : firstH2

  return html.replace(/<(h[1-6]|p)>([\s\S]*?)<\/\1>/g, (match, tag: string, content: string, offset: number) => {
    // Before the first <h2>, skip <p> tags whose content is only <em>...</em>
    if (tag === 'p' && offset < boundary && /^\s*<em>[\s\S]*<\/em>\s*$/.test(content)) {
      return match
    }
    return `<${tag} data-paragraph-index="${index++}">${content}</${tag}>`
  })
}

/** Count total segments (headings + paragraphs) in sections. */
export function countParagraphs(sections: ScriptSection[]): number {
  return sections.reduce(
    (sum, s) => sum + s.paragraphs.length + (s.headingIndex != null ? 1 : 0),
    0,
  )
}
