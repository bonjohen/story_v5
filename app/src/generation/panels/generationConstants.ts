/**
 * Shared constants and utilities for generation panel tabs.
 */

import type { GenerationMode, GenerationConfig } from '../artifacts/types.ts'

// Default generation config matching generation_config.json
export const DEFAULT_CONFIG: GenerationConfig = {
  signals_policy: { mode: 'warn', min_fraction: 0.5 },
  tone_policy: { mode: 'warn' },
  repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
  coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
  max_llm_calls: 20,
  beat_expansion: { enabled: true, max_beats_per_scene: 8, min_beats_per_scene: 4, batch_size: 1 },
}

export const ARCHETYPE_OPTIONS = [
  { value: 'The Hero\'s Journey', label: 'The Hero\'s Journey' },
  { value: 'Rags to Riches', label: 'Rags to Riches' },
  { value: 'The Quest', label: 'The Quest' },
  { value: 'Voyage and Return', label: 'Voyage and Return' },
  { value: 'Overcoming the Monster', label: 'Overcoming the Monster' },
  { value: 'Rebirth', label: 'Rebirth' },
  { value: 'Tragedy', label: 'Tragedy' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Coming of Age', label: 'Coming of Age' },
  { value: 'The Revenge', label: 'The Revenge' },
  { value: 'The Escape', label: 'The Escape' },
  { value: 'The Sacrifice', label: 'The Sacrifice' },
  { value: 'The Mystery Unveiled', label: 'The Mystery Unveiled' },
  { value: 'The Transformation', label: 'The Transformation' },
  { value: 'The Rise and Fall', label: 'The Rise and Fall' },
]

export const GENRE_OPTIONS = [
  'Drama', 'Action', 'Comedy', 'Thriller', 'Fantasy', 'Science Fiction',
  'Adventure', 'Romance', 'Romantic Comedy', 'Horror', 'Mystery', 'Crime',
  'Detective', 'Superhero', 'Historical', 'War', 'Biography', 'Family',
  'Young Adult', 'Literary Fiction', 'Children\'s Literature', 'Satire',
  'Psychological', 'Western', 'Political', 'Musical', 'Holiday',
]

export const MODE_OPTIONS: { value: GenerationMode; label: string; description: string }[] = [
  { value: 'contract-only', label: 'Contract Only', description: 'Compile structural rules from the corpus. No AI needed.' },
  { value: 'backbone', label: 'Backbone', description: 'Assemble story backbone with beats, slots, and chapter partition. No AI needed.' },
  { value: 'detailed-outline', label: 'Detailed Outline', description: 'Fill backbone slots with concrete characters, places, and objects.' },
  { value: 'outline', label: 'Outline', description: 'Generate a beat-by-beat plan with scene summaries.' },
  { value: 'draft', label: 'Full Draft', description: 'Generate complete scene prose with compliance validation.' },
  { value: 'chapters', label: 'Chapters', description: 'Full pipeline with chapter assembly and editorial polish.' },
]

export const STATE_LABELS: Record<string, { label: string; color: string }> = {
  IDLE: { label: 'Idle', color: 'var(--text-muted)' },
  LOADED_CORPUS: { label: 'Corpus Loaded', color: '#3b82f6' },
  SELECTED: { label: 'Selected', color: '#3b82f6' },
  CONTRACT_READY: { label: 'Contract Ready', color: '#f59e0b' },
  TEMPLATES_COMPILED: { label: 'Templates Compiled', color: '#f59e0b' },
  BACKBONE_ASSEMBLED: { label: 'Backbone Assembled', color: '#f59e0b' },
  DETAILS_BOUND: { label: 'Details Bound', color: '#f59e0b' },
  PLANNED: { label: 'Planned', color: '#f59e0b' },
  EXPANDING_BEATS: { label: 'Expanding Beats...', color: '#8b5cf6' },
  GENERATING_SCENE: { label: 'Writing...', color: '#8b5cf6' },
  GENERATING_BEAT_POINT: { label: 'Writing Beat...', color: '#8b5cf6' },
  VALIDATING_SCENE: { label: 'Validating...', color: '#8b5cf6' },
  REPAIRING_SCENE: { label: 'Repairing...', color: '#f97316' },
  CHAPTERS_ASSEMBLED: { label: 'Chapters Assembled', color: '#8b5cf6' },
  COMPLETED: { label: 'Completed', color: '#22c55e' },
  FAILED: { label: 'Failed', color: '#ef4444' },
}

/** Shared label style for form fields. */
export const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

/** Shared input/select style. */
export const INPUT: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '6px 8px',
  fontSize: 12,
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  borderRadius: 4,
}

/** Map a display name to a manifest directory. Exact match first, fuzzy fallback. */
export function nameToDir(name: string, items: { name: string; filePath: string }[]): string | null {
  const exact = items.find((m) => m.name === name)
  if (exact) {
    const parts = exact.filePath.split('/')
    return parts[parts.length - 1]
  }
  const lower = name.toLowerCase()
  const ciExact = items.find((m) => m.name.toLowerCase() === lower)
  if (ciExact) {
    const parts = ciExact.filePath.split('/')
    return parts[parts.length - 1]
  }
  return null
}
