type Stylesheet = cytoscape.StylesheetStyle

// --- Color palette (dark-first, design spec §7.1) ---

const COLORS = {
  bg: '#0f1117',
  surface: '#1a1d27',
  border: '#2a2d3a',
  text: '#e0e0e6',
  textMuted: '#8888a0',

  // Node categories (design spec §7.2)
  start: '#22c55e',
  terminal: '#eab308',
  escalation: '#f97316',
  revelation: '#3b82f6',
  irreversible: '#ef4444',
  crisis: '#dc2626',
  transformation: '#a855f7',
  catalyst: '#06b6d4',
  descent: '#6366f1',
  commitment: '#14b8a6',
  neutral: '#64748b',

  // Genre levels
  level1: '#22c55e',
  level2: '#3b82f6',
  level3: '#a855f7',
  level4: '#f97316',
  level5: '#ef4444',
  tone: '#06b6d4',
  antiPattern: '#ef4444',

  // Edge categories (design spec §7.3)
  edgeDefault: '#4a4d5a',
  edgeEscalation: '#f97316',
  edgeConstraint: '#3b82f6',
  edgeRevelation: '#60a5fa',
  edgeDisruption: '#ef4444',

  // Selection
  selected: '#fbbf24',
  neighbor: '#fbbf2466',
}

// --- Node category mapping ---

const ROLE_CATEGORY_MAP: Record<string, string> = {
  Origin: 'start-role',
  Disruption: 'escalation',
  Threshold: 'commitment',
  Trial: 'neutral',
  Revelation: 'revelation',
  Reversal: 'revelation',
  Commitment: 'commitment',
  Crisis: 'crisis',
  Transformation: 'transformation',
  'Irreversible Cost': 'irreversible',
  Resolution: 'terminal-role',
  Descent: 'descent',
  Catalyst: 'catalyst',
  Reckoning: 'crisis',
  // Genre roles
  'Genre Promise': 'start-role',
  'Core Constraint': 'escalation',
  'Subgenre Pattern': 'revelation',
  'Setting Rule': 'catalyst',
  'World/Setting Rules': 'catalyst',
  'Scene Obligation': 'commitment',
  'Scene Obligations': 'commitment',
  'Tone Marker': 'tone',
  'Anti-Pattern': 'antipattern',
}

export function getNodeCategory(role: string, isStart: boolean, isTerminal: boolean): string {
  if (isStart) return 'start'
  if (isTerminal) return 'terminal'
  return ROLE_CATEGORY_MAP[role] ?? 'neutral'
}

// --- Edge category mapping ---

const MEANING_CATEGORY_MAP: Record<string, string> = {
  'escalates conflict': 'escalation',
  'raises cost': 'escalation',
  'narrows options': 'constraint',
  'specifies constraint': 'constraint',
  'narrows scope': 'constraint',
  'restricts resolution': 'constraint',
  'reveals truth': 'revelation',
  'grants insight': 'revelation',
  'disrupts order': 'disruption',
  'triggers crisis': 'disruption',
  'forces commitment': 'commitment',
  'demands sacrifice': 'commitment',
  'enables transformation': 'transformation',
  'restores equilibrium': 'resolution',
  'tests resolve': 'trial',
  'reframes goal': 'reframe',
  'inverts expectation': 'revelation',
  'compels return': 'return',
  'branches into subtype': 'branching',
  'mandates element': 'mandate',
  'prohibits element': 'prohibition',
  'inherits constraint': 'constraint',
  'sets tone': 'tone',
  'introduces setting rule': 'setting',
  'specializes threat': 'escalation',
  'differentiates from': 'branching',
  'requires payoff': 'mandate',
}

export function getEdgeCategory(meaning: string): string {
  return MEANING_CATEGORY_MAP[meaning] ?? 'default'
}

// --- Cytoscape stylesheet ---

export function getCoreStyle(graphType: 'archetype' | 'genre'): Stylesheet[] {
  return [
    // Base node style
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '11px',
        'font-family': 'system-ui, sans-serif',
        color: COLORS.text,
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'background-color': COLORS.neutral,
        'border-width': 2,
        'border-color': COLORS.border,
        width: 50,
        height: 50,
        shape: 'roundrectangle',
        'text-outline-color': COLORS.bg,
        'text-outline-width': 2,
        'transition-property': 'background-color, border-color, border-width, opacity',
        'transition-duration': 200,
      },
    },

    // Start nodes
    {
      selector: 'node.start',
      style: {
        'background-color': COLORS.start,
        'border-color': '#16a34a',
        shape: 'roundrectangle',
        width: 60,
        height: 60,
      },
    },

    // Terminal nodes
    {
      selector: 'node.terminal',
      style: {
        'background-color': COLORS.terminal,
        'border-color': '#ca8a04',
        shape: 'roundrectangle',
        width: 60,
        height: 60,
      },
    },

    // Role-based coloring
    {
      selector: 'node.escalation',
      style: { 'background-color': COLORS.escalation, 'border-color': '#ea580c' },
    },
    {
      selector: 'node.revelation',
      style: { 'background-color': COLORS.revelation, 'border-color': '#2563eb' },
    },
    {
      selector: 'node.irreversible',
      style: {
        'background-color': COLORS.surface,
        'border-color': COLORS.irreversible,
        'border-width': 3,
        'border-style': 'double',
      },
    },
    {
      selector: 'node.crisis',
      style: { 'background-color': COLORS.crisis, 'border-color': '#b91c1c' },
    },
    {
      selector: 'node.transformation',
      style: { 'background-color': COLORS.transformation, 'border-color': '#7c3aed' },
    },
    {
      selector: 'node.catalyst',
      style: { 'background-color': COLORS.catalyst, 'border-color': '#0891b2' },
    },
    {
      selector: 'node.descent',
      style: { 'background-color': COLORS.descent, 'border-color': '#4f46e5' },
    },
    {
      selector: 'node.commitment',
      style: { 'background-color': COLORS.commitment, 'border-color': '#0d9488' },
    },
    {
      selector: 'node.tone',
      style: {
        'background-color': COLORS.tone,
        'border-color': '#0891b2',
        shape: 'diamond',
        width: 45,
        height: 45,
      },
    },
    {
      selector: 'node.antipattern',
      style: {
        'background-color': COLORS.surface,
        'border-color': COLORS.antiPattern,
        'border-width': 3,
        'border-style': 'dashed',
        shape: 'octagon',
        width: 45,
        height: 45,
      },
    },

    // Variant nodes (slightly transparent)
    {
      selector: 'node.variant',
      style: {
        opacity: 0.75,
        'border-style': 'dashed',
      },
    },

    // Genre level-specific sizes (larger at top, narrowing)
    ...(graphType === 'genre'
      ? ([
          { selector: 'node.level-1', style: { width: 70, height: 50 } },
          { selector: 'node.level-2', style: { width: 60, height: 45 } },
          { selector: 'node.level-3', style: { width: 55, height: 40 } },
          { selector: 'node.level-4', style: { width: 50, height: 38 } },
          { selector: 'node.level-5', style: { width: 45, height: 35 } },
        ] as Stylesheet[])
      : []),

    // --- Edge styles ---
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': COLORS.edgeDefault,
        'target-arrow-color': COLORS.edgeDefault,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 1.2,
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-size': '9px',
        color: COLORS.textMuted,
        'text-rotation': 'autorotate',
        'text-outline-color': COLORS.bg,
        'text-outline-width': 2,
        'text-background-color': COLORS.bg,
        'text-background-opacity': 0.8,
        'text-background-padding': '2px',
        'transition-property': 'line-color, target-arrow-color, width, opacity',
        'transition-duration': 200,
      },
    },

    // Edge categories
    {
      selector: 'edge.escalation',
      style: {
        width: 3,
        'line-color': COLORS.edgeEscalation,
        'target-arrow-color': COLORS.edgeEscalation,
      },
    },
    {
      selector: 'edge.constraint',
      style: {
        'line-style': 'dashed',
        'line-color': COLORS.edgeConstraint,
        'target-arrow-color': COLORS.edgeConstraint,
      },
    },
    {
      selector: 'edge.revelation',
      style: {
        'line-color': COLORS.edgeRevelation,
        'target-arrow-color': COLORS.edgeRevelation,
      },
    },
    {
      selector: 'edge.disruption',
      style: {
        width: 3,
        'line-color': COLORS.edgeDisruption,
        'target-arrow-color': COLORS.edgeDisruption,
      },
    },
    {
      selector: 'edge.branching',
      style: {
        'line-style': 'dotted',
        'line-color': COLORS.transformation,
        'target-arrow-color': COLORS.transformation,
      },
    },
    {
      selector: 'edge.prohibition',
      style: {
        'line-style': 'dashed',
        'line-color': COLORS.antiPattern,
        'target-arrow-color': COLORS.antiPattern,
      },
    },

    // Variant edges
    {
      selector: 'edge.variant',
      style: {
        opacity: 0.6,
        'line-style': 'dashed',
      },
    },

    // Loop edges (self-referencing)
    {
      selector: 'edge[source = target]',
      style: {
        'curve-style': 'unbundled-bezier',
        'control-point-distances': 40 as unknown as number,
        'control-point-weights': 0.5 as unknown as number,
      },
    },

    // --- Selection styles ---
    {
      selector: 'node.selected',
      style: {
        'border-color': COLORS.selected,
        'border-width': 4,
        'z-index': 10,
      },
    },
    {
      selector: 'node.neighbor',
      style: {
        'border-color': COLORS.neighbor,
        'border-width': 3,
      },
    },
    {
      selector: 'edge.selected',
      style: {
        'line-color': COLORS.selected,
        'target-arrow-color': COLORS.selected,
        width: 4,
        'z-index': 10,
      },
    },
    {
      selector: 'edge.neighbor',
      style: {
        'line-color': COLORS.neighbor,
        'target-arrow-color': COLORS.neighbor,
        width: 3,
      },
    },
  ]
}

export { COLORS }
