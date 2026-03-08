/**
 * Shared JSON utilities for LLM response parsing.
 * Safe to import in both browser and Node.js contexts.
 */

/**
 * Strip markdown code fences and trailing text from JSON responses.
 * Handles: ```json ... ```, ``` ... ```, leading/trailing whitespace,
 * and trailing text after the closing brace/bracket.
 */
export function stripJsonFences(text: string): string {
  let cleaned = text.trim()

  // Strip opening code fence (```json or ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/, '')
  }

  // Strip closing code fence
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\n?```\s*$/, '')
  }

  // If there's trailing text after the last } or ], remove it
  const lastBrace = cleaned.lastIndexOf('}')
  const lastBracket = cleaned.lastIndexOf(']')
  const lastJson = Math.max(lastBrace, lastBracket)
  if (lastJson >= 0 && lastJson < cleaned.length - 1) {
    const trailing = cleaned.slice(lastJson + 1).trim()
    // Only strip if trailing content is non-JSON (not another valid structure)
    if (trailing && !trailing.startsWith('{') && !trailing.startsWith('[')) {
      cleaned = cleaned.slice(0, lastJson + 1)
    }
  }

  return cleaned.trim()
}
