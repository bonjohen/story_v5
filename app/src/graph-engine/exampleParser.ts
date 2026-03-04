/**
 * Example Data Parser — parses examples.md files into structured data
 * for the Example Mode overlay.
 *
 * Handles two formats:
 * 1. Table format (archetypes): markdown tables with Node/Edge ID columns
 * 2. Header format (genres): markdown headers with node IDs and paragraph descriptions
 */

export interface ExampleWork {
  name: string
  isPrimary: boolean
}

export interface NodeExampleMapping {
  nodeId: string
  workName: string
  description: string
}

export interface EdgeExampleMapping {
  edgeId: string
  workName: string
  description: string
}

export interface ParsedExamples {
  works: ExampleWork[]
  nodeMappings: NodeExampleMapping[]
  edgeMappings: EdgeExampleMapping[]
}

/**
 * Parse an examples.md file into structured data.
 */
export function parseExamplesMd(markdown: string): ParsedExamples {
  const works: ExampleWork[] = []
  const nodeMappings: NodeExampleMapping[] = []
  const edgeMappings: EdgeExampleMapping[] = []

  // Extract works from header info
  const primaryMatch = markdown.match(/\*\*Primary (?:example|Work):\*\*\s*(.+)/i)
  if (primaryMatch) {
    works.push({ name: primaryMatch[1].trim(), isPrimary: true })
  }

  // Cross-references from header
  const crossRefMatch = markdown.match(/\*\*Cross-references?:\*\*\s*(.+)/i)
  if (crossRefMatch) {
    const refs = crossRefMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    for (const ref of refs) {
      works.push({ name: ref, isPrimary: false })
    }
  }

  // Try table format first (archetypes)
  const tableNodeMappings = parseTableMappings(markdown, 'node')
  const tableEdgeMappings = parseTableMappings(markdown, 'edge')

  if (tableNodeMappings.length > 0 || tableEdgeMappings.length > 0) {
    // Table format detected
    const primaryName = works.find((w) => w.isPrimary)?.name ?? 'Primary'
    for (const m of tableNodeMappings) {
      nodeMappings.push({ nodeId: m.id, workName: primaryName, description: m.description })
    }
    for (const m of tableEdgeMappings) {
      edgeMappings.push({ edgeId: m.id, workName: primaryName, description: m.description })
    }

    // Parse cross-reference paragraphs
    const crossRefSections = markdown.matchAll(/\*\*(.+?) cross-reference:\*\*\s*(.+)/gi)
    for (const match of crossRefSections) {
      const workName = match[1].trim()
      const desc = match[2].trim()
      if (!works.some((w) => w.name.includes(workName))) {
        works.push({ name: workName, isPrimary: false })
      }
      // Create a single summary mapping for the cross-ref
      nodeMappings.push({ nodeId: '__cross_ref__', workName, description: desc })
    }
  } else {
    // Header format (genres) — parse by node ID headers
    parseHeaderFormat(markdown, works, nodeMappings)
  }

  return { works, nodeMappings, edgeMappings }
}

/** Parse markdown table rows into ID + description pairs */
function parseTableMappings(
  markdown: string,
  type: 'node' | 'edge',
): { id: string; description: string }[] {
  const results: { id: string; description: string }[] = []

  // Find the section (Node Mappings or Edge Mappings)
  const sectionHeader = type === 'node' ? /## Node Mappings/i : /## Edge Mappings/i
  const sectionMatch = markdown.match(sectionHeader)
  if (!sectionMatch || sectionMatch.index === undefined) return results

  const sectionStart = sectionMatch.index
  const nextSection = markdown.indexOf('\n## ', sectionStart + 10)
  const sectionText = nextSection > 0
    ? markdown.substring(sectionStart, nextSection)
    : markdown.substring(sectionStart)

  // Parse table rows: | ID | Label | Description |
  const rowPattern = /\|\s*([A-Z]{2}_[NE]\d{2}[A-Za-z_]*)\s*\|[^|]*\|([^|]+)\|/g
  let match
  while ((match = rowPattern.exec(sectionText)) !== null) {
    results.push({
      id: match[1].trim(),
      description: match[2].trim(),
    })
  }

  return results
}

/** Parse header-based format (genres): **NODE_ID — Label** followed by work descriptions */
function parseHeaderFormat(
  markdown: string,
  works: ExampleWork[],
  nodeMappings: NodeExampleMapping[],
): void {
  // Match patterns like **DR_N01_PROMISE — Drama Promise** followed by work-specific descriptions
  const nodeBlocks = markdown.split(/\n---\n/)

  for (const block of nodeBlocks) {
    // Extract node ID from the header
    const headerMatch = block.match(/\*\*([A-Z]{2}_N\d{2}[A-Za-z_]*)\s*(?:—|-)/)
    if (!headerMatch) continue

    const nodeId = headerMatch[1]

    // Extract per-work descriptions: - **WorkName**: description
    const workDescriptions = block.matchAll(/- \*\*(.+?)\*\*:\s*(.+?)(?=\n- \*\*|\n\n|$)/gs)
    for (const match of workDescriptions) {
      const workName = match[1].trim()
      const description = match[2].trim()

      // Add work if not already known
      if (!works.some((w) => w.name.includes(workName))) {
        works.push({ name: workName, isPrimary: works.length === 0 })
      }

      nodeMappings.push({ nodeId, workName, description })
    }
  }
}

/**
 * Get all unique work names from parsed examples.
 */
export function getWorkNames(examples: ParsedExamples): string[] {
  return examples.works.map((w) => w.name)
}

/**
 * Get all node IDs that have example mappings for a given work.
 */
export function getNodeIdsForWork(examples: ParsedExamples, workName: string): Set<string> {
  const ids = new Set<string>()
  for (const m of examples.nodeMappings) {
    if (m.workName === workName || m.workName.includes(workName)) {
      ids.add(m.nodeId)
    }
  }
  return ids
}

/**
 * Get all edge IDs that have example mappings for a given work.
 */
export function getEdgeIdsForWork(examples: ParsedExamples, workName: string): Set<string> {
  const ids = new Set<string>()
  for (const m of examples.edgeMappings) {
    if (m.workName === workName || m.workName.includes(workName)) {
      ids.add(m.edgeId)
    }
  }
  return ids
}

/**
 * Get the example description for a specific node and work.
 */
export function getNodeExample(
  examples: ParsedExamples,
  nodeId: string,
  workName: string,
): string | null {
  const mapping = examples.nodeMappings.find(
    (m) => m.nodeId === nodeId && (m.workName === workName || m.workName.includes(workName)),
  )
  return mapping?.description ?? null
}

/**
 * Get the example description for a specific edge and work.
 */
export function getEdgeExample(
  examples: ParsedExamples,
  edgeId: string,
  workName: string,
): string | null {
  const mapping = examples.edgeMappings.find(
    (m) => m.edgeId === edgeId && (m.workName === workName || m.workName.includes(workName)),
  )
  return mapping?.description ?? null
}
