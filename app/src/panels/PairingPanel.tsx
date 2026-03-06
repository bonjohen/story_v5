/**
 * Pairing Panel — shows compatibility and cross-reference info for the
 * selected archetype + genre pair. Progressively reveals more information
 * as the generation pipeline advances.
 */

import { useState, useEffect, useMemo } from 'react'
import { useGraphStore } from '../store/graphStore.ts'
import { useGenerationStore } from '../generation/store/generationStore.ts'

// ---------------------------------------------------------------------------
// Types for cross-reference data
// ---------------------------------------------------------------------------

interface CompatibilityEntry {
  archetype: string
  rationale: string
}

interface GenreCompatibility {
  genre: string
  genre_id: number
  naturally_compatible: CompatibilityEntry[]
  occasionally_compatible: CompatibilityEntry[]
  rarely_compatible: CompatibilityEntry[]
}

interface CompatibilityMatrix {
  genres: GenreCompatibility[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PairingPanel() {
  const manifest = useGraphStore((s) => s.manifest)
  const selectedArchetypeDir = useGraphStore((s) => s.archetypeDir)
  const selectedGenreDir = useGraphStore((s) => s.genreDir)

  // Generation state for progressive disclosure
  const genStatus = useGenerationStore((s) => s.status)
  const genContract = useGenerationStore((s) => s.contract)
  const genBackbone = useGenerationStore((s) => s.backbone)
  const genDetailBindings = useGenerationStore((s) => s.detailBindings)
  const genPlan = useGenerationStore((s) => s.plan)
  const genSceneDrafts = useGenerationStore((s) => s.sceneDrafts)
  const genChapterManifest = useGenerationStore((s) => s.chapterManifest)

  const [matrix, setMatrix] = useState<CompatibilityMatrix | null>(null)
  const [loading, setLoading] = useState(true)

  // Load compatibility matrix
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/cross_references/genre_archetype_matrix.json`)
      .then((r) => r.ok ? r.json() as Promise<CompatibilityMatrix> : null)
      .then((data) => setMatrix(data))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  // Resolve display names from manifest
  const archetypeName = useMemo(() => {
    if (!manifest || !selectedArchetypeDir) return null
    const entry = manifest.archetypes.find((a) => a.filePath.endsWith(selectedArchetypeDir))
    return entry?.name ?? null
  }, [manifest, selectedArchetypeDir])

  const genreName = useMemo(() => {
    if (!manifest || !selectedGenreDir) return null
    const entry = manifest.genres.find((g) => g.filePath.endsWith(selectedGenreDir))
    return entry?.name ?? null
  }, [manifest, selectedGenreDir])

  const archetypeMeta = useMemo(() => {
    if (!manifest || !selectedArchetypeDir) return null
    return manifest.archetypes.find((a) => a.filePath.endsWith(selectedArchetypeDir)) ?? null
  }, [manifest, selectedArchetypeDir])

  const genreMeta = useMemo(() => {
    if (!manifest || !selectedGenreDir) return null
    return manifest.genres.find((g) => g.filePath.endsWith(selectedGenreDir)) ?? null
  }, [manifest, selectedGenreDir])

  // Find compatibility rating for this pair
  const compatibility = useMemo(() => {
    if (!matrix || !archetypeName || !genreName) return null

    const genreLower = genreName.toLowerCase()
    const genreEntry = matrix.genres.find((g) => g.genre.toLowerCase() === genreLower)
    if (!genreEntry) return null

    // Check each tier (case-insensitive exact match)
    const archLower = archetypeName.toLowerCase()
    const natural = genreEntry.naturally_compatible.find((c) =>
      c.archetype.toLowerCase() === archLower
    )
    if (natural) return { tier: 'naturally_compatible' as const, rationale: natural.rationale }

    const occasional = genreEntry.occasionally_compatible.find((c) =>
      c.archetype.toLowerCase() === archLower
    )
    if (occasional) return { tier: 'occasionally_compatible' as const, rationale: occasional.rationale }

    const rare = genreEntry.rarely_compatible.find((c) =>
      c.archetype.toLowerCase() === archLower
    )
    if (rare) return { tier: 'rarely_compatible' as const, rationale: rare.rationale }

    return null
  }, [matrix, archetypeName, genreName])

  const tierInfo = compatibility ? TIER_INFO[compatibility.tier] : null

  const hasBothSelected = !!selectedArchetypeDir && !!selectedGenreDir
  const hasGeneration = genStatus !== 'IDLE'

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* Pair header */}
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}>
        Story Pairing
      </div>

      {/* Selected pair display */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--bg-primary)',
        borderRadius: 6,
        border: '1px solid var(--border)',
        marginBottom: 12,
      }}>
        <PairSlot
          label="Archetype"
          name={archetypeName}
          meta={archetypeMeta}
          color="#f59e0b"
          placeholder="Select an archetype"
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '6px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{'\u00D7'}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <PairSlot
          label="Genre"
          name={genreName}
          meta={genreMeta}
          color="#8b5cf6"
          placeholder="Select a genre"
        />
      </div>

      {/* Compatibility rating */}
      {loading && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          Loading compatibility data...
        </div>
      )}

      {hasBothSelected && tierInfo && compatibility && (
        <div style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: `${tierInfo.color}0a`,
          borderRadius: 6,
          border: `1px solid ${tierInfo.color}30`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}>
            <span style={{
              fontSize: 14,
            }}>
              {tierInfo.icon}
            </span>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: tierInfo.color,
              }}>
                {tierInfo.label}
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-muted)',
              }}>
                {tierInfo.description}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginTop: 4,
          }}>
            {compatibility.rationale}
          </div>
        </div>
      )}

      {hasBothSelected && !compatibility && !loading && (
        <div style={{
          marginBottom: 14,
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
        }}>
          No compatibility data found for this specific pairing.
        </div>
      )}

      {!hasBothSelected && (
        <div style={{
          marginBottom: 14,
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
        }}>
          Select both an archetype and a genre from the sidebar to see compatibility analysis and begin building a story.
        </div>
      )}

      {/* Progressive generation info */}
      {hasGeneration && (
        <div style={{ marginTop: 4 }}>
          <div style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: 8,
          }}>
            Generation Progress
          </div>

          <ProgressStep
            label="Contract"
            description={genContract
              ? `${genContract.archetype.spine_nodes.length} spine nodes, ${genContract.genre.hard_constraints.length} hard constraints`
              : undefined}
            done={!!genContract}
          />
          <ProgressStep
            label="Backbone"
            description={genBackbone
              ? `${genBackbone.beats.length} beats, ${genBackbone.chapter_partition.length} chapters`
              : undefined}
            done={!!genBackbone}
          />
          <ProgressStep
            label="Detail Bindings"
            description={genDetailBindings
              ? `${Object.keys(genDetailBindings.entity_registry.characters ?? {}).length} characters, ${Object.keys(genDetailBindings.slot_bindings ?? {}).length} slots bound`
              : undefined}
            done={!!genDetailBindings}
          />
          <ProgressStep
            label="Scene Plan"
            description={genPlan
              ? `${genPlan.scenes.length} scenes planned`
              : undefined}
            done={!!genPlan}
          />
          <ProgressStep
            label="Scene Drafts"
            description={genSceneDrafts.size > 0
              ? `${genSceneDrafts.size} scenes written`
              : undefined}
            done={genSceneDrafts.size > 0}
          />
          <ProgressStep
            label="Chapters"
            description={genChapterManifest
              ? `${genChapterManifest.chapters.length} chapters assembled`
              : undefined}
            done={!!genChapterManifest}
          />
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PairSlot({ label, name, meta, color, placeholder }: {
  label: string
  name: string | null
  meta: { nodeCount: number; edgeCount: number; prefix: string } | null
  color: string
  placeholder: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color,
        marginBottom: 2,
      }}>
        {label}
      </div>
      {name ? (
        <div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}>
            {name}
          </div>
          {meta && (
            <div style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 1,
            }}>
              {meta.prefix} | {meta.nodeCount} nodes, {meta.edgeCount} edges
            </div>
          )}
        </div>
      ) : (
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontStyle: 'italic',
        }}>
          {placeholder}
        </div>
      )}
    </div>
  )
}

function ProgressStep({ label, description, done }: {
  label: string
  description?: string
  done: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6,
      opacity: done ? 1 : 0.4,
    }}>
      <span style={{
        fontSize: 11,
        color: done ? '#22c55e' : 'var(--text-muted)',
        flexShrink: 0,
        marginTop: 1,
      }}>
        {done ? '\u2713' : '\u25CB'}
      </span>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: done ? 600 : 400,
          color: done ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            marginTop: 1,
          }}>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_INFO = {
  naturally_compatible: {
    label: 'Naturally Compatible',
    description: 'This pairing is common and structurally reinforcing',
    color: '#22c55e',
    icon: '\u2605',
  },
  occasionally_compatible: {
    label: 'Occasionally Compatible',
    description: 'Works with deliberate adaptation',
    color: '#f59e0b',
    icon: '\u25C9',
  },
  rarely_compatible: {
    label: 'Rarely Compatible',
    description: 'Unusual and structurally challenging',
    color: '#ef4444',
    icon: '\u26A0',
  },
} as const
