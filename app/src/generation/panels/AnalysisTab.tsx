/**
 * AnalysisTab — graph canvases, node/edge details, statistics, cross-index,
 * timeline, character arcs, and generation artifact panels.
 *
 * Renders in the main content area (not the narrow sidebar) so graphs
 * have room to display properly.
 */

import { useCallback, useRef, useMemo, useState } from 'react'
import { GraphCanvas } from '../../render/GraphCanvas.tsx'
import { DetailPanel } from '../../panels/DetailPanel.tsx'
import { GraphStats } from '../../panels/GraphStats.tsx'
import { CrossIndexPanel } from '../../panels/CrossIndex.tsx'
import { PairingPanel } from '../../panels/PairingPanel.tsx'
import { ElementsPanel } from '../../panels/ElementsPanel.tsx'
import { TimelinePanel } from '../../panels/TimelinePanel.tsx'
import { CharacterArcPanel } from '../../panels/CharacterArcPanel.tsx'
import { GraphSearch } from '../../components/GraphSearch.tsx'
import { Disclosure } from '../../components/Disclosure.tsx'
import { ContractPanel } from './ContractPanel.tsx'
import { PlanPanel } from './PlanPanel.tsx'
import { CompliancePanel } from './CompliancePanel.tsx'
import { StoryPanel } from './StoryPanel.tsx'
import { TemplatesPanel } from './TemplatesPanel.tsx'
import { useGraphStore } from '../../store/graphStore.ts'
import { useUIStore } from '../../store/uiStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'
import { useKeyboardNav } from '../../hooks/useKeyboardNav.ts'
import { useTraceNavigation } from '../../hooks/useTraceNavigation.ts'
import type { CyCore, GenerationOverlay } from '../../render/GraphCanvas.tsx'

export function AnalysisTab() {
  const archetypeGraph = useGraphStore((s) => s.archetypeGraph)
  const archetypeDir = useGraphStore((s) => s.archetypeDir)
  const genreGraph = useGraphStore((s) => s.genreGraph)
  const genreDir = useGraphStore((s) => s.genreDir)
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const viewMode = useGraphStore((s) => s.viewMode)
  const activateGraph = useGraphStore((s) => s.activateGraph)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId)
  const selectNode = useGraphStore((s) => s.selectNode)
  const highlightedPath = useGraphStore((s) => s.highlightedPath)
  const setHighlightedPath = useGraphStore((s) => s.setHighlightedPath)
  const clearSelection = useGraphStore((s) => s.clearSelection)

  const splitView = useUIStore((s) => s.splitView)
  const toggleSplitView = useUIStore((s) => s.toggleSplitView)

  const genStatus = useGenerationStore((s) => s.status)
  const genContract = useGenerationStore((s) => s.contract)
  const genPlan = useGenerationStore((s) => s.plan)
  const genTrace = useGenerationStore((s) => s.trace)
  const genValidation = useGenerationStore((s) => s.validation)
  const genSceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const genBackbone = useGenerationStore((s) => s.backbone)
  const genChapterManifest = useGenerationStore((s) => s.chapterManifest)
  const genTemplatePack = useGenerationStore((s) => s.templatePack)

  const [genHighlightNodes, setGenHighlightNodes] = useState<string[]>([])

  const cyArchRef = useRef<CyCore | null>(null)
  const cyGenreRef = useRef<CyCore | null>(null)

  const handleArchCyReady = useCallback((cy: CyCore) => { cyArchRef.current = cy }, [])
  const handleGenreCyReady = useCallback((cy: CyCore) => { cyGenreRef.current = cy }, [])
  const handleArchFocus = useCallback(() => activateGraph('archetype'), [activateGraph])
  const handleGenreFocus = useCallback(() => activateGraph('genre'), [activateGraph])

  const { traceDirection, handleTraceForward, handleTraceBackward, handleClearTrace } =
    useTraceNavigation(currentGraph, selectedNodeId, setHighlightedPath)

  useKeyboardNav(currentGraph, selectedNodeId, selectNode, clearSelection, handleClearTrace)

  const handleSearchSelect = useCallback((nodeId: string) => selectNode(nodeId), [selectNode])

  const selectedNode = currentGraph?.graph.nodes.find((n) => n.node_id === selectedNodeId) ?? null
  const selectedEdge = currentGraph?.graph.edges.find((e) => e.edge_id === selectedEdgeId) ?? null
  const hasDetailContent = !!(selectedNode || selectedEdge)

  // Generation overlay
  const generationOverlay = useMemo<GenerationOverlay | undefined>(() => {
    if (genStatus === 'IDLE') return undefined
    if (!genPlan && !genTrace) return undefined
    const coveredNodes: string[] = []
    const antiPatternNodes: string[] = []
    const activeSceneNodes: string[] = genHighlightNodes
    if (genPlan) {
      for (const scene of genPlan.scenes) {
        coveredNodes.push(scene.archetype_trace.node_id)
        for (const ob of scene.genre_obligations) coveredNodes.push(ob.node_id)
      }
    }
    if (genContract) antiPatternNodes.push(...genContract.genre.anti_patterns)
    return { coveredNodes, antiPatternNodes, activeSceneNodes }
  }, [genStatus, genPlan, genTrace, genContract, genHighlightNodes])

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Graph toggle bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderBottom: '1px solid var(--border)', minHeight: 30,
      }}>
        <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <button
            onClick={() => { if (splitView) toggleSplitView(); activateGraph('archetype'); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: !splitView && viewMode === 'archetype' ? 600 : 400,
              color: !splitView && viewMode === 'archetype' ? '#f59e0b' : 'var(--text-muted)',
              background: !splitView && viewMode === 'archetype' ? '#f59e0b14' : 'transparent',
              borderRight: '1px solid var(--border)',
            }}
          >Archetype</button>
          <button
            onClick={() => { if (splitView) toggleSplitView(); activateGraph('genre'); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: !splitView && viewMode === 'genre' ? 600 : 400,
              color: !splitView && viewMode === 'genre' ? '#8b5cf6' : 'var(--text-muted)',
              background: !splitView && viewMode === 'genre' ? '#8b5cf614' : 'transparent',
              borderRight: '1px solid var(--border)',
            }}
          >Genre</button>
          <button
            onClick={() => { if (!splitView) toggleSplitView(); }}
            style={{
              padding: '2px 12px', fontSize: 10,
              fontWeight: splitView ? 600 : 400,
              color: splitView ? 'var(--accent)' : 'var(--text-muted)',
              background: splitView ? 'rgba(59,130,246,0.08)' : 'transparent',
            }}
          >Compare</button>
        </div>
        {!splitView && currentGraph && (
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {currentGraph.graph.name}
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>
              {currentGraph.graph.nodes.length}N / {currentGraph.graph.edges.length}E
            </span>
          </span>
        )}
        {currentGraph && <GraphSearch graph={currentGraph} onSelect={handleSearchSelect} />}
      </div>

      {/* Graph canvas */}
      <div style={{ height: 400, display: 'flex', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        {splitView ? (
          <>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {archetypeGraph ? (
                <div key={archetypeDir ? `archetype/${archetypeDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                  <GraphCanvas graph={archetypeGraph} graphId={archetypeDir ? `archetype/${archetypeDir}` : undefined}
                    highlightedPath={viewMode === 'archetype' ? highlightedPath : undefined}
                    generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                    onCyReady={handleArchCyReady} onFocus={handleArchFocus} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No archetype loaded</div>
              )}
            </div>
            <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {genreGraph ? (
                <div key={genreDir ? `genre/${genreDir}` : undefined} style={{ width: '100%', height: '100%' }}>
                  <GraphCanvas graph={genreGraph} graphId={genreDir ? `genre/${genreDir}` : undefined}
                    highlightedPath={viewMode === 'genre' ? highlightedPath : undefined}
                    onCyReady={handleGenreCyReady} onFocus={handleGenreFocus} />
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No genre loaded</div>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {currentGraph ? (
              <div key={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : 'arch') : (genreDir ? `genre/${genreDir}` : 'genre')} style={{ width: '100%', height: '100%' }}>
                <GraphCanvas graph={currentGraph}
                  graphId={viewMode === 'archetype' ? (archetypeDir ? `archetype/${archetypeDir}` : undefined) : (genreDir ? `genre/${genreDir}` : undefined)}
                  highlightedPath={highlightedPath}
                  generationOverlay={viewMode === 'archetype' ? generationOverlay : undefined}
                  onCyReady={viewMode === 'archetype' ? handleArchCyReady : handleGenreCyReady}
                  onFocus={viewMode === 'archetype' ? handleArchFocus : handleGenreFocus} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 12 }}>No graph loaded</div>
            )}
          </div>
        )}
      </div>

      {/* Selected node/edge detail */}
      {hasDetailContent && currentGraph && (
        <DetailPanel node={selectedNode} edge={selectedEdge}
          onTraceForward={handleTraceForward} onTraceBackward={handleTraceBackward}
          onClearTrace={handleClearTrace} traceActive={traceDirection} graph={currentGraph} />
      )}

      <PairingPanel />

      {currentGraph && (
        <Disclosure title="Statistics" persistKey="info-stats" defaultCollapsed>
          <GraphStats graph={currentGraph} />
        </Disclosure>
      )}
      {currentGraph && (
        <Disclosure title="Elements" persistKey="info-elements" defaultCollapsed>
          <ElementsPanel graph={currentGraph} selectedNodeId={selectedNodeId} />
        </Disclosure>
      )}
      {currentGraph && (
        <Disclosure title="Cross-Index" persistKey="info-xindex" defaultCollapsed>
          <CrossIndexPanel graph={currentGraph} />
        </Disclosure>
      )}

      {/* Visualization */}
      {archetypeGraph && (
        <Disclosure title="Visualization" persistKey="info-viz" defaultCollapsed>
          <Disclosure title="Timeline" persistKey="info-timeline" defaultCollapsed depth={1}>
            <TimelinePanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
          </Disclosure>
          <Disclosure title="Character Arcs" persistKey="info-arcs" defaultCollapsed depth={1}>
            <CharacterArcPanel graph={archetypeGraph} selectedNodeId={selectedNodeId} onSelectNode={selectNode} />
          </Disclosure>
        </Disclosure>
      )}

      {/* Generation artifacts */}
      {(genTemplatePack || genBackbone || genContract || genPlan || genSceneDrafts.size > 0 || genValidation || genChapterManifest) && (
        <Disclosure title="Generation" persistKey="info-gen" badge={genSceneDrafts.size > 0 ? `${genSceneDrafts.size} scenes` : ''}>
          <Disclosure title="Templates" persistKey="info-templates" defaultCollapsed depth={1}>
            <TemplatesPanel />
          </Disclosure>
          {genContract && (
            <Disclosure title="Contract" persistKey="info-gen-contract" defaultCollapsed depth={1}>
              <ContractPanel onHighlightNodes={setGenHighlightNodes} />
            </Disclosure>
          )}
          {genBackbone && (
            <Disclosure title="Backbone" persistKey="info-gen-backbone" defaultCollapsed depth={1} badge={`${genBackbone.beats.length} beats`}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-primary)' }}>
                {genBackbone.beats.map((beat, i) => {
                  const obligationCount = beat.scenes.reduce((n, s) => n + s.genre_obligations.length, 0)
                  return (
                    <div key={i} style={{ padding: '6px 8px', marginBottom: 4, background: 'var(--bg-elevated)', borderRadius: 4, borderLeft: '3px solid #f59e0b' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600 }}>{beat.label}</span>
                        {beat.role && <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b' }}>{beat.role}</span>}
                      </div>
                      {beat.definition && <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{beat.definition}</div>}
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                        {beat.scenes.length} scene{beat.scenes.length !== 1 ? 's' : ''}{obligationCount > 0 ? `, ${obligationCount} obligations` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Disclosure>
          )}
          {genPlan && (
            <Disclosure title="Plan" persistKey="info-gen-plan" defaultCollapsed depth={1}>
              <PlanPanel onHighlightNodes={setGenHighlightNodes} />
            </Disclosure>
          )}
          {genSceneDrafts.size > 0 && (
            <Disclosure title="Story" persistKey="info-gen-story" depth={1}>
              <StoryPanel onHighlightNodes={setGenHighlightNodes} />
            </Disclosure>
          )}
          {genValidation && (
            <Disclosure title="Compliance" persistKey="info-gen-compliance" defaultCollapsed depth={1}>
              <CompliancePanel />
            </Disclosure>
          )}
          {genChapterManifest && (
            <Disclosure title="Chapters" persistKey="info-gen-chapters" depth={1} badge={`${genChapterManifest.chapters.length}`}>
              <div style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-primary)' }}>
                {genChapterManifest.chapters.map((ch, i) => (
                  <div key={i} style={{ padding: '4px 8px', marginBottom: 3, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                    <span style={{ fontWeight: 500 }}>{ch.title}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6, fontSize: 10 }}>{ch.scene_ids.length} scenes</span>
                  </div>
                ))}
              </div>
            </Disclosure>
          )}
        </Disclosure>
      )}
    </div>
  )
}
