export function toArray(v: string | string[]): string[] {
  return Array.isArray(v) ? v : [v]
}
