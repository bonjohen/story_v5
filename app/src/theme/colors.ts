/**
 * Centralized color constants for the entire app.
 * All hardcoded colors should reference these constants.
 *
 * Color system:
 *   - NODE_ROLE_COLORS: archetype/genre node roles (matches Cytoscape canvas)
 *   - EDGE_MEANING_COLORS: edge semantic categories
 *   - ENTITY_COLORS: story element categories (character, place, object, etc.)
 *   - SEVERITY_COLORS: constraint severity (required, recommended, optional)
 *   - STATUS_COLORS: pass/warn/fail traffic-light
 *   - COMPAT_COLORS: pairing compatibility tiers
 *   - EMOTION_COLORS: emotional arc dimensions
 */

// ─── Node Role Colors ─────────────────────────────────────────────────
// Canonical role→color map. Must match Cytoscape category colors in styles.ts.

export const NODE_ROLE_COLORS: Record<string, string> = {
  // Archetype roles
  Origin:             '#22c55e',
  Catalyst:           '#06b6d4',
  Disruption:         '#f97316',
  Threshold:          '#14b8a6',
  Commitment:         '#14b8a6',
  Trial:              '#64748b',
  Escalation:         '#f97316',
  Descent:            '#6366f1',
  Crisis:             '#dc2626',
  Revelation:         '#3b82f6',
  Transformation:     '#a855f7',
  'Irreversible Cost':'#ef4444',
  Reckoning:          '#dc2626',
  Resolution:         '#eab308',
  // Genre roles
  'Genre Promise':       '#22c55e',
  'Core Constraint':     '#f97316',
  'Subgenre Pattern':    '#3b82f6',
  'World/Setting Rules': '#06b6d4',
  'Scene Obligations':   '#14b8a6',
  'Tone Marker':         '#06b6d4',
  'Anti-Pattern':        '#ef4444',
}

/** Symbol indicators for roles (colorblind-accessible secondary signal) */
export const NODE_ROLE_SYMBOLS: Record<string, string> = {
  Origin:             '\u25B6',   // play
  Catalyst:           '\u2605',   // star
  Disruption:         '\u26A1',   // lightning
  Threshold:          '\u2192',   // arrow
  Commitment:         '\u2717',   // crossmark
  Trial:              '\u2694',   // swords
  Escalation:         '\u25B2',   // triangle up
  Descent:            '\u25BC',   // triangle down
  Crisis:             '\u26A0',   // warning
  Revelation:         '\u25C9',   // fisheye
  Transformation:     '\u21BB',   // cycle
  'Irreversible Cost':'\u2718',   // heavy X
  Resolution:         '\u2714',   // checkmark
  Reckoning:          '\u2696',   // scales
  // Genre roles
  'Genre Promise':       '\u25B6',
  'Core Constraint':     '\u2717',
  'Subgenre Pattern':    '\u25CB', // circle
  'World/Setting Rules': '\u2302', // house
  'Scene Obligations':   '\u25A0', // square
  'Tone Marker':         '\u266A', // music note
  'Anti-Pattern':        '\u2298', // circled slash
}

// ─── Edge Meaning Colors ──────────────────────────────────────────────

export const EDGE_MEANING_COLORS: Record<string, string> = {
  Escalation:     '#f97316',
  Constraint:     '#3b82f6',
  Revelation:     '#60a5fa',
  Disruption:     '#ef4444',
  Transformation: '#a855f7',
  Resolution:     '#22c55e',
  Branching:      '#8b5cf6',
  Prohibition:    '#dc2626',
  Refinement:     '#3b82f6',
  Narrows:        '#f59e0b',
  Requires:       '#ef4444',
  Forbids:        '#dc2626',
}

export const EDGE_MEANING_STYLES: Record<string, string> = {
  Escalation:     'solid',
  Constraint:     'dashed',
  Revelation:     'solid',
  Disruption:     'solid',
  Transformation: 'solid',
  Resolution:     'solid',
  Branching:      'dotted',
  Prohibition:    'dashed',
}

// ─── Entity Category Colors ──────────────────────────────────────────
// Story element categories: character, place, object, concept, relationship, rule.

export const ENTITY_COLORS = {
  character:    '#f59e0b',
  place:        '#3b82f6',
  object:       '#22c55e',
  concept:      '#8b5cf6',
  relationship: '#a855f7',
  rule:         '#ef4444',
} as const

// ─── Severity Colors ─────────────────────────────────────────────────
// Constraint severity levels. "required" is red, "recommended" is amber.

export const SEVERITY_COLORS = {
  required:    '#ef4444',
  recommended: '#f59e0b',
  optional:    '#64748b',
  // Aliases used in genre constraints
  hard:        '#ef4444',
  soft:        '#f59e0b',
} as const

// ─── Status Colors ───────────────────────────────────────────────────
// Traffic-light for pass/warn/fail outcomes.

export const STATUS_COLORS = {
  pass:      '#22c55e',
  warn:      '#f59e0b',
  fail:      '#ef4444',
  connected: '#22c55e',
  error:     '#ef4444',
} as const

// ─── Compatibility Tier Colors ───────────────────────────────────────

export const COMPAT_COLORS = {
  naturally_compatible:    '#22c55e',
  occasionally_compatible: '#f59e0b',
  rarely_compatible:       '#ef4444',
} as const

// ─── Emotional Arc Colors ────────────────────────────────────────────

export const EMOTION_COLORS = {
  tension:    '#ef4444',
  hope:       '#22c55e',
  fear:       '#a855f7',
  resolution: '#3b82f6',
} as const

// ─── UI Accent Colors ───────────────────────────────────────────────
// Contextual accents for graph types, sections, and actions.

export const UI_COLORS = {
  archetype:  '#f59e0b',
  genre:      '#8b5cf6',
  tone:       '#06b6d4',
  warning:    '#fbbf24',
} as const
