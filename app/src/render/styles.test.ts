import { describe, it, expect } from 'vitest'
import { getNodeCategory, getEdgeCategory, getCoreStyle } from './styles.ts'

describe('getNodeCategory', () => {
  it('returns "start" for start nodes regardless of role', () => {
    expect(getNodeCategory('Origin', true, false)).toBe('start')
    expect(getNodeCategory('Trial', true, false)).toBe('start')
  })

  it('returns "terminal" for terminal nodes regardless of role', () => {
    expect(getNodeCategory('Resolution', false, true)).toBe('terminal')
  })

  it('maps archetype roles correctly', () => {
    expect(getNodeCategory('Origin', false, false)).toBe('start-role')
    expect(getNodeCategory('Disruption', false, false)).toBe('escalation')
    expect(getNodeCategory('Revelation', false, false)).toBe('revelation')
    expect(getNodeCategory('Crisis', false, false)).toBe('crisis')
    expect(getNodeCategory('Transformation', false, false)).toBe('transformation')
    expect(getNodeCategory('Resolution', false, false)).toBe('terminal-role')
    expect(getNodeCategory('Descent', false, false)).toBe('descent')
    expect(getNodeCategory('Catalyst', false, false)).toBe('catalyst')
  })

  it('maps genre roles correctly', () => {
    expect(getNodeCategory('Genre Promise', false, false)).toBe('start-role')
    expect(getNodeCategory('Core Constraint', false, false)).toBe('escalation')
    expect(getNodeCategory('Tone Marker', false, false)).toBe('tone')
    expect(getNodeCategory('Anti-Pattern', false, false)).toBe('antipattern')
  })

  it('returns "neutral" for unknown roles', () => {
    expect(getNodeCategory('SomethingNew', false, false)).toBe('neutral')
  })
})

describe('getEdgeCategory', () => {
  it('maps known edge meanings', () => {
    expect(getEdgeCategory('escalates conflict')).toBe('escalation')
    expect(getEdgeCategory('narrows options')).toBe('constraint')
    expect(getEdgeCategory('reveals truth')).toBe('revelation')
    expect(getEdgeCategory('disrupts order')).toBe('disruption')
    expect(getEdgeCategory('branches into subtype')).toBe('branching')
    expect(getEdgeCategory('prohibits element')).toBe('prohibition')
  })

  it('returns "default" for unknown meanings', () => {
    expect(getEdgeCategory('unknown meaning')).toBe('default')
  })
})

describe('getCoreStyle', () => {
  it('returns stylesheet array for archetype graphs', () => {
    const styles = getCoreStyle('archetype')
    expect(Array.isArray(styles)).toBe(true)
    expect(styles.length).toBeGreaterThan(10)
  })

  it('returns stylesheet array for genre graphs with level styles', () => {
    const styles = getCoreStyle('genre')
    expect(Array.isArray(styles)).toBe(true)
    // Genre should have more styles than archetype (includes level-specific)
    const archetypeStyles = getCoreStyle('archetype')
    expect(styles.length).toBeGreaterThan(archetypeStyles.length)
  })

  it('includes base node and edge selectors', () => {
    const styles = getCoreStyle('archetype')
    const selectors = styles.map((s) => s.selector)
    expect(selectors).toContain('node')
    expect(selectors).toContain('edge')
    expect(selectors).toContain('node.start')
    expect(selectors).toContain('node.terminal')
  })
})
