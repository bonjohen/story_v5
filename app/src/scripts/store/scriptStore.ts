import { create } from 'zustand'
import type { ScriptMeta, ParsedScript } from '../types.ts'
import {
  parseMarkdownToHtml,
  parseMarkdownToSections,
  injectParagraphIndices,
  countParagraphs,
} from '../engine/parseMarkdown.ts'

export interface ScriptStoreState {
  scripts: ScriptMeta[]
  currentScript: ParsedScript | null
  loading: boolean
  error: string | null

  loadManifest: () => Promise<void>
  loadScript: (slug: string) => Promise<void>
  clearScript: () => void
}

export const useScriptStore = create<ScriptStoreState>((set, get) => ({
  scripts: [],
  currentScript: null,
  loading: false,
  error: null,

  loadManifest: async () => {
    if (get().scripts.length > 0) return
    set({ loading: true, error: null })
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/scripts/manifest.json`)
      if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`)
      const data = (await res.json()) as ScriptMeta[]
      set({ scripts: data, loading: false })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load scripts manifest',
        loading: false,
      })
    }
  },

  loadScript: async (slug: string) => {
    const { scripts, currentScript } = get()
    if (currentScript?.meta.slug === slug) return

    set({ loading: true, error: null, currentScript: null })
    try {
      // Load manifest if not already loaded
      if (scripts.length === 0) {
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/scripts/manifest.json`)
        if (!manifestRes.ok) throw new Error(`Manifest load failed: ${manifestRes.status}`)
        const manifestData = (await manifestRes.json()) as ScriptMeta[]
        set({ scripts: manifestData })
      }

      const res = await fetch(`${import.meta.env.BASE_URL}data/scripts/${slug}.md`)
      if (!res.ok) throw new Error(`Script not found: ${slug}`)
      const md = await res.text()
      const sections = parseMarkdownToSections(md)
      const rawHtml = parseMarkdownToHtml(md)
      const html = injectParagraphIndices(rawHtml)
      const totalParagraphs = countParagraphs(sections)

      const meta = get().scripts.find((s) => s.slug === slug) ?? {
        slug,
        title: slug.replace(/_/g, ' '),
        subtitle: '',
        estimatedMinutes: 0,
      }

      set({
        currentScript: { meta, sections, html, totalParagraphs },
        loading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load script',
        loading: false,
      })
    }
  },

  clearScript: () => set({ currentScript: null }),
}))
