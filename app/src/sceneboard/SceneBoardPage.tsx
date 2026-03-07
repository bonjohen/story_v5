/**
 * Scene Board Page — Plottr-style card surface backed by the graph engine.
 * Cards arranged in lanes by chapter, act, archetype phase, character, or location.
 */

import { useState, useEffect, useMemo } from 'react'
import { useSceneBoardStore } from './store/sceneboardStore.ts'
import { useGenerationStore } from '../generation/store/generationStore.ts'
import { ReadAloud } from '../components/ReadAloud.tsx'
import type { SceneCard, LaneMode, SceneStatus } from './types.ts'

const TOOLBAR_HEIGHT = 42

const LANE_MODES: { id: LaneMode; label: string }[] = [
  { id: 'chapter', label: 'Chapter' },
  { id: 'archetype_phase', label: 'Archetype Phase' },
  { id: 'character', label: 'Character' },
  { id: 'location', label: 'Location' },
]

const STATUS_COLORS: Record<SceneStatus, string> = {
  draft: '#f59e0b',
  reviewed: '#3b82f6',
  locked: '#22c55e',
}

const SEVERITY_COLORS = { hard: '#ef4444', soft: '#f59e0b' }

export function SceneBoardPage() {
  const cards = useSceneBoardStore((s) => s.cards)
  const laneMode = useSceneBoardStore((s) => s.laneMode)
  const setLaneMode = useSceneBoardStore((s) => s.setLaneMode)
  const filterCharacter = useSceneBoardStore((s) => s.filterCharacter)
  const setFilterCharacter = useSceneBoardStore((s) => s.setFilterCharacter)
  const filterLocation = useSceneBoardStore((s) => s.filterLocation)
  const setFilterLocation = useSceneBoardStore((s) => s.setFilterLocation)
  const selectedCardId = useSceneBoardStore((s) => s.selectedCardId)
  const selectCard = useSceneBoardStore((s) => s.selectCard)
  const updateCard = useSceneBoardStore((s) => s.updateCard)
  const populateFromBackbone = useSceneBoardStore((s) => s.populateFromBackbone)
  const populateFromPlan = useSceneBoardStore((s) => s.populateFromPlan)
  const clearBoard = useSceneBoardStore((s) => s.clearBoard)

  const backbone = useGenerationStore((s) => s.backbone)
  const plan = useGenerationStore((s) => s.plan)

  // Auto-populate from generation pipeline
  const [autoPopulated, setAutoPopulated] = useState(false)
  useEffect(() => {
    if (autoPopulated) return
    if (plan && plan.scenes.length > 0) {
      populateFromPlan(plan)
      setAutoPopulated(true)
    } else if (backbone && backbone.beats.length > 0) {
      populateFromBackbone(backbone)
      setAutoPopulated(true)
    }
  }, [plan, backbone, autoPopulated, populateFromPlan, populateFromBackbone])

  // Unique values for filters
  const allCharacters = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) c.characters.forEach((ch) => set.add(ch))
    return [...set].sort()
  }, [cards])

  const allLocations = useMemo(() => {
    const set = new Set<string>()
    for (const c of cards) if (c.setting) set.add(c.setting)
    return [...set].sort()
  }, [cards])

  // Apply filters
  const filteredCards = useMemo(() => {
    let result = cards
    if (filterCharacter) result = result.filter((c) => c.characters.includes(filterCharacter))
    if (filterLocation) result = result.filter((c) => c.setting === filterLocation)
    return result
  }, [cards, filterCharacter, filterLocation])

  // Group into lanes
  const lanes = useMemo(() => {
    const map = new Map<string, SceneCard[]>()
    for (const card of filteredCards) {
      let keys: string[]
      switch (laneMode) {
        case 'chapter':
          keys = [card.chapter_title ?? card.chapter_id ?? 'Unassigned']
          break
        case 'archetype_phase':
          keys = [card.archetype_role ?? card.archetype_label ?? 'Unknown']
          break
        case 'character':
          keys = card.characters.length > 0 ? card.characters : ['Unassigned']
          break
        case 'location':
          keys = [card.setting || 'Unspecified']
          break
        default:
          keys = ['All']
      }
      for (const key of keys) {
        const lane = map.get(key) ?? []
        lane.push(card)
        map.set(key, lane)
      }
    }
    return [...map.entries()].map(([name, scenes]) => ({
      name,
      scenes: scenes.sort((a, b) => a.position - b.position),
    }))
  }, [filteredCards, laneMode])

  const selectedCard = cards.find((c) => c.scene_id === selectedCardId)

  const readAloudText = useMemo(() => {
    if (cards.length === 0) return ''
    return cards.map((c) => `${c.title}. ${c.synopsis}`).join(' ')
  }, [cards])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
        flexShrink: 0, zIndex: 10,
      }}>
        <a href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>Scene Board</span>
        <ReadAloud text={readAloudText} label="Read aloud" />

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Lane mode selector */}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lanes:</span>
        {LANE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setLaneMode(m.id)}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 3,
              border: '1px solid',
              borderColor: laneMode === m.id ? '#f59e0b' : 'var(--border)',
              background: laneMode === m.id ? '#f59e0b18' : 'transparent',
              color: laneMode === m.id ? '#f59e0b' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Character filter */}
        {allCharacters.length > 0 && (
          <select
            style={{
              fontSize: 11, padding: '3px 6px', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3,
            }}
            value={filterCharacter ?? ''}
            onChange={(e) => setFilterCharacter(e.target.value || null)}
          >
            <option value="">All Characters</option>
            {allCharacters.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Location filter */}
        {allLocations.length > 0 && (
          <select
            style={{
              fontSize: 11, padding: '3px 6px', background: 'var(--bg-primary)',
              color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 3,
            }}
            value={filterLocation ?? ''}
            onChange={(e) => setFilterLocation(e.target.value || null)}
          >
            <option value="">All Locations</option>
            {allLocations.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        )}

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {filteredCards.length} scene{filteredCards.length !== 1 ? 's' : ''}
        </span>

        {cards.length > 0 && (
          <button
            onClick={() => { clearBoard(); setAutoPopulated(false) }}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 3,
              border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {cards.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No scenes to display.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Generate a backbone or plan from the main page, then navigate here.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Lanes */}
          <div style={{ flex: 1, display: 'flex', gap: 1, overflow: 'auto', padding: '8px 8px 8px 8px' }}>
            {lanes.map((lane) => (
              <Lane key={lane.name} name={lane.name} scenes={lane.scenes} selectedId={selectedCardId} onSelect={selectCard} />
            ))}
          </div>

          {/* Detail flyout */}
          {selectedCard && (
            <div style={{
              width: 320, flexShrink: 0, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', overflowY: 'auto', padding: '12px 14px',
            }}>
              <SceneDetail card={selectedCard} onUpdate={updateCard} onClose={() => selectCard(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lane
// ---------------------------------------------------------------------------

function Lane({ name, scenes, selectedId, onSelect }: {
  name: string; scenes: SceneCard[]; selectedId: string | null; onSelect: (id: string) => void
}) {
  return (
    <div style={{ minWidth: 220, flex: 1 }}>
      <div style={{
        padding: '6px 10px', borderBottom: '2px solid #f59e0b40', marginBottom: 6,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.5px' }}>
          {name}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          background: 'var(--border)', padding: '1px 6px', borderRadius: 8,
        }}>
          {scenes.length}
        </span>
      </div>
      <div style={{ padding: '0 4px' }}>
        {scenes.map((scene) => (
          <SceneCardComp
            key={scene.scene_id}
            card={scene}
            selected={scene.scene_id === selectedId}
            onClick={() => onSelect(scene.scene_id)}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene Card
// ---------------------------------------------------------------------------

function SceneCardComp({ card, selected, onClick }: {
  card: SceneCard; selected: boolean; onClick: () => void
}) {
  const metCount = card.genre_obligations.filter((o) => o.met).length
  const totalOb = card.genre_obligations.length
  const hardUnmet = card.genre_obligations.filter((o) => o.severity === 'hard' && !o.met).length

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
        borderLeft: `3px solid ${card.archetype_role ? roleToColor(card.archetype_role) : '#94a3b8'}`,
        borderRadius: 4,
        padding: '8px 10px',
        marginBottom: 6,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
        {card.title}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 6 }}>
        {card.synopsis.length > 80 ? `${card.synopsis.slice(0, 80)}...` : card.synopsis}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Archetype badge */}
        {card.archetype_role && (
          <span style={{
            fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
            color: roleToColor(card.archetype_role),
            background: `${roleToColor(card.archetype_role)}1a`,
            padding: '1px 5px', borderRadius: 2,
          }}>
            {card.archetype_role}
          </span>
        )}

        {/* Obligation coverage dots */}
        {totalOb > 0 && (
          <span style={{
            fontSize: 9, fontWeight: 600,
            color: hardUnmet > 0 ? '#ef4444' : metCount === totalOb ? '#22c55e' : '#f59e0b',
          }}>
            {metCount}/{totalOb}
          </span>
        )}

        {/* Character count */}
        {card.characters.length > 0 && (
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            {card.characters.length} char
          </span>
        )}

        {/* Status */}
        <span style={{
          fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
          color: STATUS_COLORS[card.status],
          marginLeft: 'auto',
        }}>
          {card.status}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scene Detail Flyout
// ---------------------------------------------------------------------------

function SceneDetail({ card, onUpdate, onClose }: {
  card: SceneCard; onUpdate: (id: string, changes: Partial<SceneCard>) => void; onClose: () => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {card.title}
        </h3>
        <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          x
        </button>
      </div>

      {/* Synopsis */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Synopsis</label>
        <textarea
          style={{
            display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 12,
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box',
          }}
          rows={3}
          value={card.synopsis}
          onChange={(e) => onUpdate(card.scene_id, { synopsis: e.target.value })}
        />
      </div>

      {/* Status */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Status</label>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {(['draft', 'reviewed', 'locked'] as SceneStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate(card.scene_id, { status: s })}
              style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 3,
                border: `1px solid ${STATUS_COLORS[s]}`,
                background: card.status === s ? `${STATUS_COLORS[s]}20` : 'transparent',
                color: STATUS_COLORS[s],
                fontWeight: card.status === s ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Archetype trace */}
      {card.archetype_node_id && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Archetype Node</label>
          <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>{card.archetype_label}</span>
            {card.archetype_role && (
              <span style={{
                fontSize: 9, fontWeight: 600, textTransform: 'uppercase', marginLeft: 6,
                color: roleToColor(card.archetype_role),
                background: `${roleToColor(card.archetype_role)}1a`,
                padding: '1px 5px', borderRadius: 2,
              }}>
                {card.archetype_role}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Genre obligations */}
      {card.genre_obligations.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Genre Obligations ({card.genre_obligations.filter((o) => o.met).length}/{card.genre_obligations.length})
          </label>
          <div style={{ marginTop: 4 }}>
            {card.genre_obligations.map((ob, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: 11 }}>
                <span style={{ color: ob.met ? '#22c55e' : '#ef4444' }}>{ob.met ? '\u2713' : '\u2717'}</span>
                <span style={{ color: SEVERITY_COLORS[ob.severity], fontSize: 9, fontWeight: 600, textTransform: 'uppercase' }}>
                  {ob.severity}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{ob.label ?? ob.node_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Characters */}
      {card.characters.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Characters</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {card.characters.map((c) => (
              <span key={c} style={{
                fontSize: 10, fontWeight: 600, color: '#3b82f6',
                background: '#3b82f61a', padding: '1px 6px', borderRadius: 3,
              }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Setting */}
      {card.setting && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Setting</label>
          <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 4 }}>{card.setting}</div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Notes</label>
        <textarea
          style={{
            display: 'block', width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 12,
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'inherit',
            resize: 'vertical', boxSizing: 'border-box',
          }}
          rows={3}
          placeholder="Add notes..."
          value={card.notes ?? ''}
          onChange={(e) => onUpdate(card.scene_id, { notes: e.target.value || undefined })}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleToColor(role: string): string {
  const colors: Record<string, string> = {
    Origin: '#22c55e', Disruption: '#ef4444', Commitment: '#f59e0b',
    Challenge: '#3b82f6', Transformation: '#8b5cf6', Resolution: '#06b6d4',
    Climax: '#ec4899', Return: '#14b8a6', Growth: '#eab308',
    origin: '#22c55e', disruption: '#ef4444', commitment: '#f59e0b',
    challenge: '#3b82f6', transformation: '#8b5cf6', resolution: '#06b6d4',
    climax: '#ec4899', return: '#14b8a6', growth: '#eab308',
  }
  return colors[role] ?? '#94a3b8'
}
