/**
 * Timeline Page — Aeon-style chronology view showing story events in order
 * with participant tracking, subplot lanes, and state transition markers.
 */

import { useState, useEffect, useMemo } from 'react'
import { useTimelineViewStore } from './store/timelineViewStore.ts'
import { useGenerationStore } from '../generation/store/generationStore.ts'
import { useInstanceStore } from '../instance/store/instanceStore.ts'
import type { TimelineEvent } from './types.ts'
import type { ChangeType } from '../types/timeline.ts'

const TOOLBAR_HEIGHT = 42

const CHANGE_COLORS: Record<ChangeType, string> = {
  learns: '#3b82f6', gains: '#22c55e', loses: '#ef4444',
  transforms: '#8b5cf6', arrives: '#14b8a6', departs: '#f97316',
  bonds: '#ec4899', breaks: '#dc2626', dies: '#7f1d1d',
  reveals: '#eab308', decides: '#06b6d4',
}

export function TimelineViewPage() {
  const events = useTimelineViewStore((s) => s.events)
  const selectedEventId = useTimelineViewStore((s) => s.selectedEventId)
  const selectEvent = useTimelineViewStore((s) => s.selectEvent)
  const showSwimLanes = useTimelineViewStore((s) => s.showSwimLanes)
  const showDependencies = useTimelineViewStore((s) => s.showDependencies)
  const toggleSwimLanes = useTimelineViewStore((s) => s.toggleSwimLanes)
  const toggleDependencies = useTimelineViewStore((s) => s.toggleDependencies)
  const populateFromBackbone = useTimelineViewStore((s) => s.populateFromBackbone)
  const populateFromInstance = useTimelineViewStore((s) => s.populateFromInstance)
  const clearTimeline = useTimelineViewStore((s) => s.clearTimeline)

  const backbone = useGenerationStore((s) => s.backbone)
  const instance = useInstanceStore((s) => s.activeInstanceId ? s.instances[s.activeInstanceId] : null)

  // Auto-populate
  const [autoPopulated, setAutoPopulated] = useState(false)
  useEffect(() => {
    if (autoPopulated) return
    if (instance && instance.lore.event_log.length > 0) {
      populateFromInstance(instance)
      setAutoPopulated(true)
    } else if (backbone) {
      populateFromBackbone(backbone)
      setAutoPopulated(true)
    }
  }, [instance, backbone, autoPopulated, populateFromInstance, populateFromBackbone])

  // Unique participants for swim lanes
  const allParticipants = useMemo(() => {
    const set = new Set<string>()
    for (const e of events) e.participants.forEach((p) => set.add(p))
    return [...set].sort()
  }, [events])

  const selectedEvent = events.find((e) => e.event_id === selectedEventId)

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        height: TOOLBAR_HEIGHT, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12,
        flexShrink: 0, zIndex: 10,
      }}>
        <a href={`${import.meta.env.BASE_URL}`}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          Story Explorer
        </a>
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#06b6d4' }}>Timeline</span>

        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        <button
          onClick={toggleSwimLanes}
          style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 3,
            border: '1px solid', borderColor: showSwimLanes ? '#06b6d4' : 'var(--border)',
            background: showSwimLanes ? '#06b6d418' : 'transparent',
            color: showSwimLanes ? '#06b6d4' : 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          Swim Lanes
        </button>

        <button
          onClick={toggleDependencies}
          style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 3,
            border: '1px solid', borderColor: showDependencies ? '#8b5cf6' : 'var(--border)',
            background: showDependencies ? '#8b5cf618' : 'transparent',
            color: showDependencies ? '#8b5cf6' : 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          Dependencies
        </button>

        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{events.length} events</span>
        {events.length > 0 && (
          <button
            onClick={() => { clearTimeline(); setAutoPopulated(false) }}
            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 3, border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No timeline events.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Generate a backbone/plan or create a story instance with events.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Timeline track */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {showSwimLanes ? (
              <SwimLaneView events={events} participants={allParticipants} selectedId={selectedEventId} onSelect={selectEvent} />
            ) : (
              <VerticalTimeline events={events} selectedId={selectedEventId} onSelect={selectEvent} showDependencies={showDependencies} />
            )}
          </div>

          {/* Detail panel */}
          {selectedEvent && (
            <div style={{
              width: 320, flexShrink: 0, borderLeft: '1px solid var(--border)',
              background: 'var(--bg-surface)', overflowY: 'auto', padding: '12px 14px',
            }}>
              <EventDetail event={selectedEvent} onClose={() => selectEvent(null)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vertical Timeline
// ---------------------------------------------------------------------------

function VerticalTimeline({ events, selectedId, onSelect, showDependencies }: {
  events: TimelineEvent[]; selectedId: string | null; onSelect: (id: string) => void; showDependencies: boolean
}) {
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 8, top: 0, bottom: 0, width: 2,
        background: 'var(--border)',
      }} />

      {events.map((event, i) => (
        <div key={event.event_id} style={{ position: 'relative', marginBottom: 8 }}>
          {/* Dot on timeline */}
          <div style={{
            position: 'absolute', left: -20, top: 10,
            width: 10, height: 10, borderRadius: '50%',
            background: event.change_types?.[0] ? CHANGE_COLORS[event.change_types[0]] : 'var(--accent)',
            border: '2px solid var(--bg-primary)',
          }} />

          {/* Dependency arrow */}
          {showDependencies && event.causal_dependencies && event.causal_dependencies.length > 0 && (
            <div style={{ fontSize: 9, color: '#8b5cf6', marginBottom: 2 }}>
              depends on: {event.causal_dependencies.join(', ')}
            </div>
          )}

          {/* Event card */}
          <div
            onClick={() => onSelect(event.event_id)}
            style={{
              background: 'var(--bg-surface)',
              border: selectedId === event.event_id ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 4, padding: '8px 12px', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>#{i + 1}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: 3 }}>
              {event.description.length > 100 ? `${event.description.slice(0, 100)}...` : event.description}
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {event.participants.map((p) => (
                <span key={p} style={{
                  fontSize: 9, fontWeight: 600, color: '#3b82f6',
                  background: '#3b82f61a', padding: '1px 5px', borderRadius: 2,
                }}>
                  {p}
                </span>
              ))}
              {event.place && (
                <span style={{
                  fontSize: 9, fontWeight: 600, color: '#22c55e',
                  background: '#22c55e1a', padding: '1px 5px', borderRadius: 2,
                }}>
                  {event.place}
                </span>
              )}
              {event.change_types?.map((ct) => (
                <span key={ct} style={{
                  fontSize: 9, fontWeight: 600, color: CHANGE_COLORS[ct],
                  background: `${CHANGE_COLORS[ct]}1a`, padding: '1px 5px', borderRadius: 2,
                  textTransform: 'uppercase',
                }}>
                  {ct}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Swim Lane View
// ---------------------------------------------------------------------------

function SwimLaneView({ events, participants, selectedId, onSelect }: {
  events: TimelineEvent[]; participants: string[]; selectedId: string | null; onSelect: (id: string) => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...TH, width: 30 }}>#</th>
            <th style={{ ...TH, minWidth: 200 }}>Event</th>
            {participants.map((p) => (
              <th key={p} style={{ ...TH, minWidth: 80, textAlign: 'center' }}>{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event, i) => (
            <tr
              key={event.event_id}
              onClick={() => onSelect(event.event_id)}
              style={{
                cursor: 'pointer',
                background: selectedId === event.event_id ? 'var(--accent)08' : 'transparent',
              }}
            >
              <td style={TD}>{i + 1}</td>
              <td style={TD}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{event.title}</div>
              </td>
              {participants.map((p) => {
                const present = event.participants.includes(p)
                return (
                  <td key={p} style={{ ...TD, textAlign: 'center' }}>
                    {present && (
                      <span style={{
                        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                        background: '#3b82f6',
                      }} />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const TH: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
  color: 'var(--text-muted)', padding: '6px 8px',
  borderBottom: '2px solid var(--border)', textAlign: 'left',
  position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1,
}

const TD: React.CSSProperties = {
  fontSize: 11, padding: '6px 8px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
}

// ---------------------------------------------------------------------------
// Event Detail
// ---------------------------------------------------------------------------

function EventDetail({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{event.title}</h3>
        <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>x</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <LabelText label="Description" />
        <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: '4px 0 0' }}>{event.description}</p>
      </div>

      {event.participants.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="Participants" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {event.participants.map((p) => (
              <span key={p} style={{ fontSize: 10, fontWeight: 600, color: '#3b82f6', background: '#3b82f61a', padding: '1px 6px', borderRadius: 3 }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.place && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="Location" />
          <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 4 }}>{event.place}</div>
        </div>
      )}

      {event.before_state && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="Before" />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{event.before_state}</div>
        </div>
      )}

      {event.after_state && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="After" />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{event.after_state}</div>
        </div>
      )}

      {event.change_types && event.change_types.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="State Changes" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {event.change_types.map((ct) => (
              <span key={ct} style={{
                fontSize: 10, fontWeight: 600, color: CHANGE_COLORS[ct],
                background: `${CHANGE_COLORS[ct]}1a`, padding: '1px 6px', borderRadius: 3,
                textTransform: 'uppercase',
              }}>
                {ct}
              </span>
            ))}
          </div>
        </div>
      )}

      {event.causal_dependencies && event.causal_dependencies.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <LabelText label="Depends On" />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
            {event.causal_dependencies.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

function LabelText({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
      color: 'var(--text-muted)', letterSpacing: '0.04em',
    }}>
      {label}
    </span>
  )
}
