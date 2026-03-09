/**
 * AnalysisTab — sidebar panels for statistics, cross-index, timeline,
 * character arcs, pairing, and generation artifacts.
 *
 * The graph canvas and node/edge detail are in the Graph tab (GraphViewer).
 * This tab renders in the 340px sidebar like all other tabs.
 */

import { useCallback } from 'react'
import { GraphStats } from '../../panels/GraphStats.tsx'
import { CrossIndexPanel } from '../../panels/CrossIndex.tsx'
import { PairingPanel } from '../../panels/PairingPanel.tsx'
import { ElementsPanel } from '../../panels/ElementsPanel.tsx'
import { TimelinePanel } from '../../panels/TimelinePanel.tsx'
import { CharacterArcPanel } from '../../panels/CharacterArcPanel.tsx'
import { Disclosure } from '../../components/Disclosure.tsx'
import { ContractPanel } from './ContractPanel.tsx'
import { PlanPanel } from './PlanPanel.tsx'
import { CompliancePanel } from './CompliancePanel.tsx'
import { StoryPanel } from './StoryPanel.tsx'
import { TemplatesPanel } from './TemplatesPanel.tsx'
import { useGraphStore } from '../../store/graphStore.ts'
import { useGenerationStore } from '../store/generationStore.ts'

interface AnalysisTabProps {
  onHighlightNodes: (nodes: string[]) => void
}

export function AnalysisTab({ onHighlightNodes }: AnalysisTabProps) {
  const archetypeGraph = useGraphStore((s) => s.archetypeGraph)
  const currentGraph = useGraphStore((s) => s.currentGraph)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const selectNode = useGraphStore((s) => s.selectNode)

  const genContract = useGenerationStore((s) => s.contract)
  const genPlan = useGenerationStore((s) => s.plan)
  const genSceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const genBackbone = useGenerationStore((s) => s.backbone)
  const genChapterManifest = useGenerationStore((s) => s.chapterManifest)
  const genTemplatePack = useGenerationStore((s) => s.templatePack)
  const genValidation = useGenerationStore((s) => s.validation)

  const handleHighlight = useCallback((nodes: string[]) => onHighlightNodes(nodes), [onHighlightNodes])

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
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
              <ContractPanel onHighlightNodes={handleHighlight} />
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
              <PlanPanel onHighlightNodes={handleHighlight} />
            </Disclosure>
          )}
          {genSceneDrafts.size > 0 && (
            <Disclosure title="Story" persistKey="info-gen-story" depth={1}>
              <StoryPanel onHighlightNodes={handleHighlight} />
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

      {!currentGraph && (
        <div style={{ padding: '16px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Select an archetype and genre in Setup to load graph data
        </div>
      )}
    </div>
  )
}
