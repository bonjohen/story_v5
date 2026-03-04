/**
 * Export Panel — export graph views as PNG/SVG and graph data as DOT/Mermaid/GraphML.
 * Also provides shareable URL copy.
 */

import { useState } from 'react'
import type { CyCore } from '../render/GraphCanvas.tsx'
import type { NormalizedGraph } from '../graph-engine/index.ts'

interface ExportPanelProps {
  graph: NormalizedGraph
  cyInstance: CyCore | null
  onClose: () => void
}

export function ExportPanel({ graph, cyInstance, onClose }: ExportPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const flash = (label: string) => {
    setCopied(label)
    setTimeout(() => setCopied(null), 1500)
  }

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  const prefix = graph.graph.id || 'graph'

  const handleExportPNG = () => {
    if (!cyInstance) return
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f1117'
    const png = cyInstance.png({ full: true, scale: 2, bg })
    downloadDataUrl(png, `${prefix}.png`)
    flash('PNG')
  }

  const handleExportSVG = () => {
    if (!cyInstance) return
    const svgBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#0f1117'
    const svg = cyInstance.svg({ full: true, bg: svgBg })
    downloadBlob(svg, `${prefix}.svg`, 'image/svg+xml')
    flash('SVG')
  }

  const handleExportDOT = () => {
    const dot = graphToDOT(graph)
    downloadBlob(dot, `${prefix}.dot`, 'text/vnd.graphviz')
    flash('DOT')
  }

  const handleExportMermaid = () => {
    const mmd = graphToMermaid(graph)
    downloadBlob(mmd, `${prefix}.mmd`, 'text/plain')
    flash('Mermaid')
  }

  const handleExportGraphML = () => {
    const xml = graphToGraphML(graph)
    downloadBlob(xml, `${prefix}.graphml`, 'application/xml')
    flash('GraphML')
  }

  const handleCopyURL = () => {
    navigator.clipboard.writeText(window.location.href)
    flash('URL')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 42,
      right: 0,
      width: 260,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '0 0 0 8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      zIndex: 50,
      padding: 16,
      animation: 'slideInRight 0.15s ease',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Export
        </span>
        <button
          onClick={onClose}
          aria-label="Close export panel"
          style={{ fontSize: 16, color: 'var(--text-muted)', padding: '0 4px' }}
        >
          {'\u00D7'}
        </button>
      </div>

      <ExportGroup label="Image">
        <ExportButton label="PNG" desc="High-res raster" onClick={handleExportPNG} disabled={!cyInstance} copied={copied === 'PNG'} />
        <ExportButton label="SVG" desc="Vector graphic" onClick={handleExportSVG} disabled={!cyInstance} copied={copied === 'SVG'} />
      </ExportGroup>

      <ExportGroup label="Graph Format">
        <ExportButton label="DOT" desc="Graphviz format" onClick={handleExportDOT} copied={copied === 'DOT'} />
        <ExportButton label="Mermaid" desc="Mermaid diagram" onClick={handleExportMermaid} copied={copied === 'Mermaid'} />
        <ExportButton label="GraphML" desc="XML graph format" onClick={handleExportGraphML} copied={copied === 'GraphML'} />
      </ExportGroup>

      <ExportGroup label="Share">
        <ExportButton label="Copy URL" desc="Shareable link" onClick={handleCopyURL} copied={copied === 'URL'} />
      </ExportGroup>
    </div>
  )
}

function ExportGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function ExportButton({ label, desc, onClick, disabled, copied }: {
  label: string
  desc: string
  onClick: () => void
  disabled?: boolean
  copied?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: '5px 8px',
        marginBottom: 2,
        fontSize: 12,
        textAlign: 'left',
        borderRadius: 3,
        background: copied ? 'rgba(34,197,94,0.12)' : 'transparent',
        color: disabled ? 'var(--border)' : copied ? 'var(--green)' : 'var(--text-primary)',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <span>{copied ? `${label} \u2713` : label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{desc}</span>
    </button>
  )
}

// ─── DOT/Graphviz Serializer ───

function graphToDOT(g: NormalizedGraph): string {
  const lines: string[] = []
  lines.push(`digraph "${esc(g.graph.name)}" {`)
  lines.push(`  rankdir=LR;`)
  lines.push(`  node [shape=box, style="rounded,filled", fillcolor="#22252f", fontcolor="#e0e0e6", color="#2a2d3a", fontname="Inter"];`)
  lines.push(`  edge [color="#3b82f6", fontcolor="#8888a0", fontname="Inter", fontsize=10];`)
  lines.push('')

  for (const node of g.graph.nodes) {
    lines.push(`  "${esc(node.node_id)}" [label="${esc(node.label)}"];`)
  }
  lines.push('')

  for (const edge of g.graph.edges) {
    lines.push(`  "${esc(edge.from)}" -> "${esc(edge.to)}" [label="${esc(edge.label)}"];`)
  }

  lines.push('}')
  return lines.join('\n')
}

// ─── Mermaid Serializer ───

function graphToMermaid(g: NormalizedGraph): string {
  const lines: string[] = []
  lines.push('graph LR')

  for (const node of g.graph.nodes) {
    const safeId = mermaidId(node.node_id)
    lines.push(`  ${safeId}["${esc(node.label)}"]`)
  }

  for (const edge of g.graph.edges) {
    const from = mermaidId(edge.from)
    const to = mermaidId(edge.to)
    lines.push(`  ${from} -->|"${esc(edge.label)}"| ${to}`)
  }

  return lines.join('\n')
}

// ─── GraphML Serializer ───

function graphToGraphML(g: NormalizedGraph): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<graphml xmlns="http://graphml.graphstruct.org/xmlns"')
  lines.push('  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"')
  lines.push('  xsi:schemaLocation="http://graphml.graphstruct.org/xmlns http://graphml.graphstruct.org/xmlns/1.0/graphml.xsd">')
  lines.push('  <key id="label" for="node" attr.name="label" attr.type="string"/>')
  lines.push('  <key id="role" for="node" attr.name="role" attr.type="string"/>')
  lines.push('  <key id="definition" for="node" attr.name="definition" attr.type="string"/>')
  lines.push('  <key id="elabel" for="edge" attr.name="label" attr.type="string"/>')
  lines.push('  <key id="meaning" for="edge" attr.name="meaning" attr.type="string"/>')
  lines.push(`  <graph id="${xmlEsc(g.graph.id)}" edgedefault="directed">`)

  for (const node of g.graph.nodes) {
    lines.push(`    <node id="${xmlEsc(node.node_id)}">`)
    lines.push(`      <data key="label">${xmlEsc(node.label)}</data>`)
    lines.push(`      <data key="role">${xmlEsc(node.role)}</data>`)
    lines.push(`      <data key="definition">${xmlEsc(node.definition)}</data>`)
    lines.push(`    </node>`)
  }

  for (const edge of g.graph.edges) {
    lines.push(`    <edge id="${xmlEsc(edge.edge_id)}" source="${xmlEsc(edge.from)}" target="${xmlEsc(edge.to)}">`)
    lines.push(`      <data key="elabel">${xmlEsc(edge.label)}</data>`)
    lines.push(`      <data key="meaning">${xmlEsc(edge.meaning)}</data>`)
    lines.push(`    </edge>`)
  }

  lines.push('  </graph>')
  lines.push('</graphml>')
  return lines.join('\n')
}

// ─── Helpers ───

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function mermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_')
}
