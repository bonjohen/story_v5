import type { StringOrArray } from '../types/graph.ts'

/**
 * Normalize a value that may be a string or string[] to always be string[].
 * Useful for display and iteration over graph node/edge fields.
 */
export function toArray(value: StringOrArray): string[] {
  if (Array.isArray(value)) return value
  return [value]
}
