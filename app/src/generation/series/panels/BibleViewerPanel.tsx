/**
 * Bible Viewer Panel — displays the current state of the Story Bible:
 * characters (alive/dead), places, objects, factions, world rules.
 */

import { useState } from 'react'
import type { StoryBible, BibleCharacter, BiblePlace, BibleObject, PlotThread } from '../types.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      color, background: `${color}1a`, padding: '2px 8px', borderRadius: 3,
    }}>
      {label}
    </span>
  )
}

function statusColor(status: string): string {
  if (status === 'alive' || status === 'extant' || status === 'intact' || status === 'active') return '#22c55e'
  if (status === 'dead' || status === 'destroyed' || status === 'disbanded') return '#ef4444'
  return '#f59e0b'
}

function SectionHeader({ title, count, tab, activeTab, onSelect }: {
  title: string; count: number; tab: string; activeTab: string; onSelect: (t: string) => void
}) {
  const active = tab === activeTab
  return (
    <button
      onClick={() => onSelect(tab)}
      style={{
        padding: '8px 14px', fontSize: 11, fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        background: 'transparent', border: 'none', cursor: 'pointer',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}
    >
      {title} ({count})
    </button>
  )
}

// ---------------------------------------------------------------------------
// Character list
// ---------------------------------------------------------------------------

function CharacterList({ characters }: { characters: BibleCharacter[] }) {
  const alive = characters.filter((c) => c.status === 'alive')
  const other = characters.filter((c) => c.status !== 'alive')

  return (
    <div>
      {alive.map((c) => <CharacterRow key={c.id} character={c} />)}
      {other.length > 0 && (
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', padding: '8px 0 4px', fontWeight: 600 }}>
          Deceased / Other
        </div>
      )}
      {other.map((c) => <CharacterRow key={c.id} character={c} />)}
    </div>
  )
}

function CharacterRow({ character: c }: { character: BibleCharacter }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
          cursor: 'pointer', padding: 0,
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{c.role}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {c.current_location && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>@ {c.current_location}</span>
          )}
          <Badge label={c.status} color={statusColor(c.status)} />
        </div>
      </button>

      {expanded && (
        <div style={{ paddingTop: 8, paddingLeft: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
          {c.traits.length > 0 && <div>Traits: {c.traits.join(', ')}</div>}
          {c.motivations.length > 0 && <div>Motivations: {c.motivations.join(', ')}</div>}
          {c.knowledge.length > 0 && <div>Knows: {c.knowledge.join('; ')}</div>}
          {c.possessions.length > 0 && <div>Has: {c.possessions.join(', ')}</div>}
          {c.arc_type && <div>Arc: {c.arc_type}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Introduced: {c.introduced_in} · Last seen: {c.last_appeared_in}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Place list
// ---------------------------------------------------------------------------

function PlaceList({ places }: { places: BiblePlace[] }) {
  return (
    <div>
      {places.map((p) => (
        <div key={p.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{p.type}</span>
            </div>
            <Badge label={p.status} color={statusColor(p.status)} />
          </div>
          {p.description && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{p.description}</div>
          )}
        </div>
      ))}
      {places.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No places recorded.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Object list
// ---------------------------------------------------------------------------

function ObjectList({ objects }: { objects: BibleObject[] }) {
  return (
    <div>
      {objects.map((o) => (
        <div key={o.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{o.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{o.type}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {o.current_holder && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Held by: {o.current_holder}</span>
              )}
              <Badge label={o.status} color={statusColor(o.status)} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{o.significance}</div>
        </div>
      ))}
      {objects.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No objects recorded.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// World rules
// ---------------------------------------------------------------------------

function WorldRulesList({ rules }: { rules: StoryBible['world_rules'] }) {
  return (
    <div>
      {rules.map((r) => (
        <div key={r.id} style={{ borderBottom: '1px solid var(--border)', padding: '8px 0' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{r.rule}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Source: {r.source} · Established: {r.established_in}
          </div>
        </div>
      ))}
      {rules.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No world rules established.</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

interface BibleViewerPanelProps {
  bible: StoryBible
}

export function BibleViewerPanel({ bible }: BibleViewerPanelProps) {
  const [activeTab, setActiveTab] = useState('characters')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        <SectionHeader title="Characters" count={bible.characters.length} tab="characters" activeTab={activeTab} onSelect={setActiveTab} />
        <SectionHeader title="Places" count={bible.places.length} tab="places" activeTab={activeTab} onSelect={setActiveTab} />
        <SectionHeader title="Objects" count={bible.objects.length} tab="objects" activeTab={activeTab} onSelect={setActiveTab} />
        <SectionHeader title="Rules" count={bible.world_rules.length} tab="rules" activeTab={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {activeTab === 'characters' && <CharacterList characters={bible.characters} />}
        {activeTab === 'places' && <PlaceList places={bible.places} />}
        {activeTab === 'objects' && <ObjectList objects={bible.objects} />}
        {activeTab === 'rules' && <WorldRulesList rules={bible.world_rules} />}
      </div>
    </div>
  )
}
