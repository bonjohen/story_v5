/** Metadata for a single script from the manifest. */
export interface ScriptMeta {
  slug: string
  title: string
  subtitle: string
  estimatedMinutes: number
  category?: string
}

/** A single paragraph with its sequential index across all sections. */
export interface ScriptParagraph {
  text: string
  index: number
}

/** A section (## heading) containing paragraphs. */
export interface ScriptSection {
  heading: string
  level: number
  /** Index assigned to the heading itself for TTS and highlighting. */
  headingIndex?: number
  paragraphs: ScriptParagraph[]
}

/** Fully parsed script ready for rendering and TTS. */
export interface ParsedScript {
  meta: ScriptMeta
  sections: ScriptSection[]
  html: string
  totalParagraphs: number
}
