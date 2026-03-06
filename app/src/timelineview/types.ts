/**
 * Timeline View types — Aeon-style chronology view for story events.
 */

import type { ChangeType } from '../types/timeline.ts'

export interface TimelineEvent {
  event_id: string
  title: string
  description: string
  order: number
  participants: string[]
  place?: string
  before_state?: string
  after_state?: string
  causal_dependencies?: string[]   // other event_ids
  subplot?: string
  episode_id?: string
  change_types?: ChangeType[]
}
