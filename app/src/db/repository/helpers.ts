/** Generate a UUID v4 string. */
export function uuid(): string {
  return crypto.randomUUID()
}

/** Current ISO 8601 UTC timestamp. */
export function now(): string {
  return new Date().toISOString()
}
