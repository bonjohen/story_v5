export { parseGraphJson, normalizeGraph, isArchetypeGraph, isGenreGraph } from './normalizer.ts'
export type { NormalizedGraph } from './normalizer.ts'

export { validateGraph, auditVocabulary } from './validator.ts'
export type { ValidationIssue, ValidationResult, VocabularyAuditResult } from './validator.ts'
export {
  ARCHETYPE_EDGE_MEANINGS,
  ARCHETYPE_NODE_ROLES,
  GENRE_EDGE_MEANINGS,
  GENRE_NODE_ROLES,
} from './validator.ts'

export { buildManifest, buildGraphMetadata, ARCHETYPE_DIRS, GENRE_DIRS } from './dataIndex.ts'

export { computeFailureModeNodes } from './helpers.ts'
