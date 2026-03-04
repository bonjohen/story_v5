/**
 * Shared utilities for data scripts.
 * All scripts use the same ESM workaround for __dirname and a common DATA_ROOT.
 */

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** Root of the data directory (data/) */
export const DATA_ROOT = resolve(__dirname, '../../data')

/** Root of the genre data directory (data/genres/) */
export const GENRE_DATA_ROOT = resolve(DATA_ROOT, 'genres')

/** Root of the archetype data directory (data/archetypes/) */
export const ARCHETYPE_DATA_ROOT = resolve(DATA_ROOT, 'archetypes')

/**
 * Read and parse a JSON file with descriptive error on failure.
 */
export function readJson<T = unknown>(filePath: string): T {
  const raw = readFileSync(filePath, 'utf-8')
  try {
    return JSON.parse(raw) as T
  } catch (e) {
    throw new Error(`Failed to parse ${filePath}: ${e instanceof Error ? e.message : e}`)
  }
}

// --- Shared graph types for scripts ---

export interface ScriptGraphNode {
  node_id: string
  label: string
  role: string
  [key: string]: unknown
}

export interface ScriptGraphEdge {
  edge_id: string
  from: string
  to: string
  label: string
  meaning: string
  [key: string]: unknown
}

export interface ScriptGraphJson {
  id: string
  name: string
  type: 'archetype' | 'genre'
  description: string
  nodes: ScriptGraphNode[]
  edges: ScriptGraphEdge[]
  _metadata?: unknown
  [key: string]: unknown
}
