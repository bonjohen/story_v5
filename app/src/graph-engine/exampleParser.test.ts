import { describe, it, expect } from 'vitest'
import {
  parseExamplesMd,
  getWorkNames,
  getNodeIdsForWork,
  getNodeExample,
  getEdgeExample,
} from './exampleParser.ts'

describe('parseExamplesMd', () => {
  it('parses primary work from header', () => {
    const md = '**Primary example:** Star Wars: Episode IV\n'
    const result = parseExamplesMd(md)
    expect(result.works).toHaveLength(1)
    expect(result.works[0]).toEqual({ name: 'Star Wars: Episode IV', isPrimary: true })
  })

  it('parses cross-references from header', () => {
    const md = [
      '**Primary Work:** The Odyssey',
      '**Cross-references:** Moby Dick, The Lord of the Rings',
    ].join('\n')
    const result = parseExamplesMd(md)
    expect(result.works).toHaveLength(3)
    expect(result.works[0].isPrimary).toBe(true)
    expect(result.works[1]).toEqual({ name: 'Moby Dick', isPrimary: false })
    expect(result.works[2]).toEqual({ name: 'The Lord of the Rings', isPrimary: false })
  })

  it('parses table-format node mappings', () => {
    const md = [
      '**Primary example:** Star Wars',
      '',
      '## Node Mappings',
      '| Node ID | Label | Description |',
      '|---------|-------|-------------|',
      '| HJ_N01_ORDINARY_WORLD | Ordinary World | Luke on Tatooine |',
      '| HJ_N02_CALL | Call | R2D2 message |',
      '',
      '## Edge Mappings',
      '| Edge ID | Label | Description |',
      '|---------|-------|-------------|',
      '| HJ_E01_DISRUPTS | Disrupts | Droids arrive |',
    ].join('\n')
    const result = parseExamplesMd(md)
    expect(result.nodeMappings).toHaveLength(2)
    expect(result.nodeMappings[0].nodeId).toBe('HJ_N01_ORDINARY_WORLD')
    expect(result.nodeMappings[0].description).toBe('Luke on Tatooine')
    expect(result.edgeMappings).toHaveLength(1)
    expect(result.edgeMappings[0].edgeId).toBe('HJ_E01_DISRUPTS')
  })

  it('parses header-format genre mappings', () => {
    const md = [
      '**DR_N01_PROMISE — Drama Promise**',
      '- **The Godfather**: Family loyalty tested',
      '- **A Streetcar Named Desire**: Fragile illusions',
    ].join('\n')
    const result = parseExamplesMd(md)
    expect(result.nodeMappings).toHaveLength(2)
    expect(result.nodeMappings[0].nodeId).toBe('DR_N01_PROMISE')
    expect(result.nodeMappings[0].workName).toBe('The Godfather')
    expect(result.nodeMappings[1].workName).toBe('A Streetcar Named Desire')
  })

  it('returns empty for unparseable content', () => {
    const result = parseExamplesMd('Just some random text with no structure.')
    expect(result.works).toHaveLength(0)
    expect(result.nodeMappings).toHaveLength(0)
    expect(result.edgeMappings).toHaveLength(0)
  })
})

describe('getWorkNames', () => {
  it('returns work names in order', () => {
    const examples = {
      works: [
        { name: 'Star Wars', isPrimary: true },
        { name: 'The Matrix', isPrimary: false },
      ],
      nodeMappings: [],
      edgeMappings: [],
    }
    expect(getWorkNames(examples)).toEqual(['Star Wars', 'The Matrix'])
  })
})

describe('getNodeIdsForWork', () => {
  it('returns matching node IDs', () => {
    const examples = {
      works: [{ name: 'Star Wars', isPrimary: true }],
      nodeMappings: [
        { nodeId: 'HJ_N01', workName: 'Star Wars', description: 'test' },
        { nodeId: 'HJ_N02', workName: 'Star Wars', description: 'test' },
        { nodeId: 'HJ_N03', workName: 'The Matrix', description: 'test' },
      ],
      edgeMappings: [],
    }
    const ids = getNodeIdsForWork(examples, 'Star Wars')
    expect(ids).toEqual(new Set(['HJ_N01', 'HJ_N02']))
  })
})

describe('getNodeExample', () => {
  it('finds a matching description', () => {
    const examples = {
      works: [],
      nodeMappings: [
        { nodeId: 'HJ_N01', workName: 'Star Wars', description: 'Luke on Tatooine' },
      ],
      edgeMappings: [],
    }
    expect(getNodeExample(examples, 'HJ_N01', 'Star Wars')).toBe('Luke on Tatooine')
  })

  it('returns null for no match', () => {
    const examples = { works: [], nodeMappings: [], edgeMappings: [] }
    expect(getNodeExample(examples, 'HJ_N01', 'Star Wars')).toBeNull()
  })
})

describe('getEdgeExample', () => {
  it('finds a matching description', () => {
    const examples = {
      works: [],
      nodeMappings: [],
      edgeMappings: [
        { edgeId: 'HJ_E01', workName: 'Star Wars', description: 'Droids arrive' },
      ],
    }
    expect(getEdgeExample(examples, 'HJ_E01', 'Star Wars')).toBe('Droids arrive')
  })

  it('returns null for no match', () => {
    const examples = { works: [], nodeMappings: [], edgeMappings: [] }
    expect(getEdgeExample(examples, 'HJ_E01', 'Star Wars')).toBeNull()
  })
})
