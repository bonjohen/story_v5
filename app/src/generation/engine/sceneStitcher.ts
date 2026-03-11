/**
 * SceneStitcher: assembles beat point prose into a cohesive scene.
 *
 * Concatenates beat point prose in sequence order with a scene heading
 * and subtle paragraph breaks. The result reads as continuous prose,
 * not segmented chunks.
 *
 * Optional scene-level LLM smoothing pass fixes beat-to-beat transitions.
 */

import type { LLMAdapter, LLMMessage } from '../agents/llmAdapter.ts'
import type {
  Scene,
  Beat,
  SceneBeatExpansion,
} from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Stitch beat point prose into a single cohesive scene.
 *
 * @param beatPointProse - Map of beat_point_id → prose content
 * @param expansion - The beat expansion describing the scene's structure
 * @param scene - The scene specification
 * @param beat - The parent structural beat
 * @returns Assembled scene prose as a single string
 */
export function stitchScene(
  beatPointProse: Map<string, string>,
  expansion: SceneBeatExpansion,
  _scene: Scene,
  beat: Beat,
): string {
  const parts: string[] = []

  // Scene heading from beat role
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]/)
  const role = roleMatch ? roleMatch[1] : beat.archetype_node_id
  parts.push(`## ${role}`)
  parts.push('')

  // Assemble beat points in sequence order
  const ordered = [...expansion.beat_points].sort((a, b) => a.sequence - b.sequence)

  for (let i = 0; i < ordered.length; i++) {
    const bp = ordered[i]
    const prose = beatPointProse.get(bp.beat_point_id)

    if (prose && prose.trim()) {
      parts.push(prose.trim())

      // Double newline between beat points (reads as paragraph break)
      if (i < ordered.length - 1) {
        parts.push('')
      }
    }
    // Skip missing beats silently — the scene still reads coherently
  }

  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Scene-level smoothing (optional LLM pass)
// ---------------------------------------------------------------------------

/**
 * Build a prompt for smoothing transitions between beat points in a stitched scene.
 * Lighter touch than the chapter editorial — only fixes beat-to-beat seams.
 */
export function buildSceneSmoothingPrompt(
  stitchedProse: string,
  beat: Beat,
  genreName: string,
): LLMMessage[] {
  const roleMatch = beat.summary.match(/^\[([^\]]+)\]/)
  const role = roleMatch ? roleMatch[1] : beat.archetype_node_id

  return [
    {
      role: 'system',
      content: [
        `You are an editorial assistant smoothing transitions within a scene of a ${genreName} story.`,
        '',
        'Your job:',
        '- Smooth any abrupt transitions between paragraphs',
        '- Ensure consistent tense and voice throughout',
        '- Add brief bridging phrases where the prose jumps between moments',
        '- Preserve ALL story content, plot events, dialogue, and character actions exactly',
        '- Do NOT add new plot events or change what happens',
        '- Do NOT add headings, labels, or meta-commentary',
        '- Output the complete smoothed scene as prose (keep the ## heading)',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `This is the "${role}" scene. Please smooth any rough transitions:`,
        '',
        stitchedProse,
      ].join('\n'),
    },
  ]
}

/**
 * Run an optional smoothing pass on a stitched scene.
 * Returns the original prose if no LLM is provided.
 */
export async function smoothScene(
  stitchedProse: string,
  beat: Beat,
  genreName: string,
  llm: LLMAdapter | null,
): Promise<string> {
  if (!llm) return stitchedProse

  const messages = buildSceneSmoothingPrompt(stitchedProse, beat, genreName)
  try {
    const response = await llm.complete(messages)
    const smoothed = response.content.trim()
    // Sanity check: smoothed version should be at least 50% of original length
    if (smoothed.length > stitchedProse.length * 0.5) {
      return smoothed
    }
    return stitchedProse
  } catch {
    return stitchedProse
  }
}
