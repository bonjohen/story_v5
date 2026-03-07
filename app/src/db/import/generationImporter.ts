/**
 * Generation Importer — creates run and artifact rows from generation pipeline output.
 */

import type { Database } from 'sql.js'
import { createRun, updateRun } from '../repository/runRepo.ts'
import { createArtifact } from '../repository/artifactRepo.ts'
import { now } from '../repository/helpers.ts'

export interface GenerationArtifacts {
  backbone?: { beats: unknown[]; chapter_partition: unknown[] }
  plan?: { scenes: unknown[] }
  chapterManifest?: { chapters: Array<{ title: string; scene_ids: string[] }> }
  sceneDraftCount?: number
  templatePack?: unknown
  contract?: unknown
  validation?: unknown
}

export function importGenerationRun(
  db: Database,
  storyId: string,
  artifacts: GenerationArtifacts,
): { runId: string; artifactCount: number } {
  const run = createRun(db, {
    story_id: storyId,
    run_type: 'generate',
    status: 'completed',
    tool_name: 'orchestrator',
    trigger_source: 'ui',
  })
  updateRun(db, run.run_id, { finished_at: now(), status: 'completed' })

  let artifactCount = 0

  if (artifacts.contract) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'story_contract',
      name: 'Story Contract',
      status: 'generated',
      generator_name: 'orchestrator',
      json_data: JSON.stringify({ type: 'contract' }),
    })
    artifactCount++
  }

  if (artifacts.templatePack) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'template_pack',
      name: 'Template Pack',
      status: 'generated',
      generator_name: 'templateCompiler',
    })
    artifactCount++
  }

  if (artifacts.backbone) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'story_backbone',
      name: 'Story Backbone',
      status: 'generated',
      generator_name: 'backboneAssembler',
      json_data: JSON.stringify({
        beat_count: artifacts.backbone.beats.length,
        chapter_count: artifacts.backbone.chapter_partition.length,
      }),
    })
    artifactCount++
  }

  if (artifacts.plan) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'outline',
      name: 'Story Plan',
      status: 'generated',
      generator_name: 'plannerAgent',
      json_data: JSON.stringify({ scene_count: artifacts.plan.scenes.length }),
    })
    artifactCount++
  }

  if (artifacts.chapterManifest) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'chapter_plan',
      name: 'Chapter Manifest',
      status: 'generated',
      generator_name: 'chapterAssembler',
      json_data: JSON.stringify({
        chapter_count: artifacts.chapterManifest.chapters.length,
      }),
    })
    artifactCount++
  }

  if (artifacts.sceneDraftCount && artifacts.sceneDraftCount > 0) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'prose_draft',
      name: `Scene Drafts (${artifacts.sceneDraftCount})`,
      status: 'generated',
      generator_name: 'writerAgent',
      json_data: JSON.stringify({ count: artifacts.sceneDraftCount }),
    })
    artifactCount++
  }

  if (artifacts.validation) {
    createArtifact(db, {
      story_id: storyId,
      artifact_type: 'validation_report',
      name: 'Validation Results',
      status: 'generated',
      generator_name: 'validationAgent',
    })
    artifactCount++
  }

  return { runId: run.run_id, artifactCount }
}
