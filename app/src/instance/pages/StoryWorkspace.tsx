/**
 * Story Workspace — tabbed interface for editing the active story instance.
 * Tabs: Characters, Places, Objects, Factions, Threads, Relationships
 */

import { useState, useRef } from 'react'
import { useInstanceStore } from '../store/instanceStore.ts'
import { CharacterEditor } from '../panels/CharacterEditor.tsx'
import { PlaceEditor } from '../panels/PlaceEditor.tsx'
import { ObjectEditor } from '../panels/ObjectEditor.tsx'
import { FactionEditor } from '../panels/FactionEditor.tsx'
import { PlotThreadTracker } from '../panels/PlotThreadTracker.tsx'
import { RelationshipMap } from '../panels/RelationshipMap.tsx'
import type { StoryInstance } from '../types.ts'
import { BTN, BADGE_STYLE, INPUT } from '../panels/shared.ts'

type Tab = 'characters' | 'places' | 'objects' | 'factions' | 'threads' | 'relationships'

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'characters', label: 'Characters', color: '#3b82f6' },
  { id: 'places', label: 'Places', color: '#22c55e' },
  { id: 'objects', label: 'Objects', color: '#f59e0b' },
  { id: 'factions', label: 'Factions', color: '#8b5cf6' },
  { id: 'threads', label: 'Threads', color: '#ef4444' },
  { id: 'relationships', label: 'Relationships', color: '#06b6d4' },
]

const TOOLBAR_HEIGHT = 42

export function StoryWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>('characters')
  const index = useInstanceStore((s) => s.index)
  const activeInstanceId = useInstanceStore((s) => s.activeInstanceId)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)
  const createNewInstance = useInstanceStore((s) => s.createNewInstance)
  const setActive = useInstanceStore((s) => s.setActive)
  const deleteInstance = useInstanceStore((s) => s.deleteInstance)
  const renameInstance = useInstanceStore((s) => s.renameInstance)
  const exportInstance = useInstanceStore((s) => s.exportInstance)
  const importInstance = useInstanceStore((s) => s.importInstance)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSelector, setShowSelector] = useState(!activeInstanceId)

  const handleExport = () => {
    if (!activeInstanceId) return
    const inst = exportInstance(activeInstanceId)
    if (!inst) return
    const blob = new Blob([JSON.stringify(inst, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inst.metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}.story.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const inst = JSON.parse(reader.result as string) as StoryInstance
        if (!inst.metadata?.instance_id || !inst.lore) {
          alert('Invalid story instance file')
          return
        }
        importInstance(inst)
        setShowSelector(false)
      } catch {
        alert('Failed to parse story instance file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const lore = instance?.lore
  const counts = lore ? {
    characters: lore.characters.length,
    places: lore.places.length,
    objects: lore.objects.length,
    factions: lore.factions.length,
    threads: lore.plot_threads.length,
    relationships: lore.characters.reduce((n, c) => n + c.relationships.length, 0),
  } : null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 12,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <a
          href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
        >
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>Story Workspace</span>

        <div style={{ flex: 1 }} />

        {/* Instance selector */}
        {instance && (
          <button
            onClick={() => setShowSelector(!showSelector)}
            style={{
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {instance.metadata.title}
          </button>
        )}

        <button onClick={handleExport} disabled={!activeInstanceId} style={{ ...BTN, padding: '4px 10px', fontSize: 11 }}>
          Export
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ ...BTN, padding: '4px 10px', fontSize: 11 }}>
          Import
        </button>
        <input ref={fileInputRef} type="file" accept=".json,.story.json" onChange={handleImport} style={{ display: 'none' }} />
      </div>

      {/* Instance selector dropdown */}
      {showSelector && (
        <InstanceSelector
          index={index}
          activeId={activeInstanceId}
          onSelect={(id) => { setActive(id); setShowSelector(false) }}
          onCreate={(title) => { createNewInstance(title); setShowSelector(false) }}
          onDelete={deleteInstance}
          onRename={renameInstance}
          onClose={() => setShowSelector(false)}
        />
      )}

      {!instance ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No story instance selected.</p>
          <button onClick={() => setShowSelector(true)} style={{ ...BTN, fontSize: 13, padding: '8px 20px' }}>
            Select or Create Instance
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            padding: '0 14px',
            flexShrink: 0,
          }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              const count = counts?.[tab.id] ?? 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    color: active ? tab.color : 'var(--text-muted)',
                    borderBottom: active ? `2px solid ${tab.color}` : '2px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    borderBottomStyle: 'solid',
                    borderBottomWidth: 2,
                    borderBottomColor: active ? tab.color : 'transparent',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.label} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'characters' && <CharacterEditor />}
            {activeTab === 'places' && <PlaceEditor />}
            {activeTab === 'objects' && <ObjectEditor />}
            {activeTab === 'factions' && <FactionEditor />}
            {activeTab === 'threads' && <PlotThreadTracker />}
            {activeTab === 'relationships' && <RelationshipMap />}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Instance Selector Panel
// ---------------------------------------------------------------------------

function InstanceSelector({ index, activeId, onSelect, onCreate, onDelete, onRename, onClose }: {
  index: { instance_id: string; title: string; source: string; character_count: number; place_count: number; updated_at: string }[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: (title: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onClose: () => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  return (
    <div style={{
      position: 'absolute', top: TOOLBAR_HEIGHT, right: 0, left: 0,
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
      padding: '12px 14px', zIndex: 20,
      maxHeight: 400, overflowY: 'auto',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Story Instances</span>
        <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          x
        </button>
      </div>

      {/* Create new */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input
          style={{ ...INPUT, marginTop: 0, flex: 1 }}
          placeholder="New instance title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) { onCreate(newTitle.trim()); setNewTitle('') } }}
        />
        <button
          onClick={() => { if (newTitle.trim()) { onCreate(newTitle.trim()); setNewTitle('') } }}
          disabled={!newTitle.trim()}
          style={{ ...BTN, padding: '6px 12px', fontSize: 11 }}
        >
          Create
        </button>
      </div>

      {/* Instance list */}
      {index.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 10 }}>
          No saved instances. Create one above or use "Save as Story Instance" from the generation panel.
        </p>
      ) : (
        index.map((entry) => (
          <div
            key={entry.instance_id}
            style={{
              padding: '8px 10px',
              marginBottom: 4,
              borderRadius: 4,
              border: entry.instance_id === activeId ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: entry.instance_id === activeId ? 'var(--accent)08' : 'var(--bg-elevated)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(entry.instance_id)}
          >
            <div>
              {renamingId === entry.instance_id ? (
                <input
                  style={{ ...INPUT, marginTop: 0, width: 160 }}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameValue.trim()) {
                      onRename(entry.instance_id, renameValue.trim())
                      setRenamingId(null)
                    }
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{entry.title}</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                <span style={BADGE_STYLE('#3b82f6')}>{entry.source}</span>
                <span style={{ marginLeft: 6 }}>
                  {entry.character_count} chars · {entry.place_count} places
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setRenamingId(entry.instance_id); setRenameValue(entry.title) }}
                style={{ fontSize: 10, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                rename
              </button>
              <button
                onClick={() => { if (confirm('Delete this instance?')) onDelete(entry.instance_id) }}
                style={{ fontSize: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
