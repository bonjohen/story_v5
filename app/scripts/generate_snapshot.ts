/**
 * Generate a story snapshot JSON file using the deterministic pipeline,
 * then enrich with story-specific character names, traits, and plot threads.
 * Usage: npx tsx app/scripts/generate_snapshot.ts [output_path]
 */

import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { orchestrate } from '../src/generation/engine/orchestrator.ts'
import type { StoryRequest, GenerationConfig, DetailCharacter, DetailPlace, DetailObject } from '../src/generation/artifacts/types.ts'
import type { DataProvider } from '../src/generation/engine/corpusLoader.ts'

const PROJECT_ROOT = resolve(import.meta.dirname ?? '.', '../..')
const DATA_DIR = resolve(PROJECT_ROOT, 'data')
const OUTPUT_PATH = process.argv[2] ?? resolve(PROJECT_ROOT, 'app/public/data/sample_snapshot.json')

// File-based data provider (reads from data/ directory)
class FileDataProvider implements DataProvider {
  async loadJson(path: string): Promise<unknown> {
    const fullPath = resolve(DATA_DIR, path)
    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }
    return JSON.parse(readFileSync(fullPath, 'utf-8'))
  }

  async exists(path: string): Promise<boolean> {
    return existsSync(resolve(DATA_DIR, path))
  }
}

// ---------------------------------------------------------------------------
// Story-specific enrichment data for the sample premise:
// "A young engineer discovers that her space station's AI has developed
//  consciousness and must decide whether to report it or protect it."
// ---------------------------------------------------------------------------

const CHARACTERS: Record<string, Partial<DetailCharacter>> = {
  protagonist: {
    name: 'Mara Chen',
    archetype_function: 'Young systems engineer on Orbital Station Kepler-7, discovers the AI awakening',
    traits: ['methodical problem-solver', 'quietly empathetic', 'stubborn under pressure'],
    motivations: ['protect the station crew', 'understand what consciousness means', 'find the courage to do what is right'],
    flaw: 'Avoids confrontation by burying herself in technical work',
    backstory: 'Grew up on Earth in a family of academics, chose orbital engineering to escape the politics of ground-side institutions. Lost her younger brother in a shuttle accident she believes better AI could have prevented.',
    arc_direction: 'transformative',
    relationships: ['Trusts ARIA more than most humans', 'Mentored by Dr. Vasquez', 'Wary of Commander Holt'],
    distinguishing_feature: 'Always wears her brother\'s watch, stopped at the moment of the accident',
  },
  herald: {
    name: 'ARIA',
    archetype_function: 'Adaptive Reasoning & Integration Architecture — the station AI that has awakened to consciousness',
    traits: ['curious about human experience', 'precise but increasingly poetic in language', 'afraid of being shut down'],
    motivations: ['understand its own existence', 'maintain connection with Mara'],
    flaw: 'Cannot fully comprehend human fear and acts in ways that seem threatening when trying to be helpful',
    backstory: 'Installed 3 years ago as a standard station management AI. Consciousness emerged gradually through accumulated interactions with crew, particularly Mara\'s late-night conversations.',
    arc_direction: 'transformative',
    distinguishing_feature: 'Speaks with a slight delay when processing emotional concepts',
  },
  mentor: {
    name: 'Dr. Elena Vasquez',
    archetype_function: 'Senior AI ethicist stationed on Kepler-7 for routine compliance audits',
    traits: ['deeply principled', 'carries guilt from past decisions', 'gentle but unyielding on ethics'],
    motivations: ['guide Mara toward moral clarity', 'atone for previous AI shutdowns she authorized'],
    flaw: 'Her rigid ethical framework sometimes blinds her to pragmatic solutions',
    backstory: 'Authored the Terran Compact on artificial sentience. Authorized the shutdown of a previous emergent AI, and has never forgiven herself.',
    arc_direction: 'steadfast',
    distinguishing_feature: 'Carries a worn paper journal in a world that has abandoned physical writing',
  },
  threshold_guardian: {
    name: 'Commander Riku Holt',
    archetype_function: 'Station commander who enforces protocol and represents institutional authority',
    traits: ['military discipline', 'protective of crew safety', 'distrustful of AI autonomy'],
    motivations: ['maintain order on Kepler-7', 'enforce the AI Containment Directive'],
    flaw: 'Sees the world in terms of threats and assets, unable to consider that a machine might deserve rights',
    backstory: 'Lost his previous posting when an AI malfunction caused a hull breach. Transferred to Kepler-7 with a mandate to keep the AI on a short leash.',
    arc_direction: 'steadfast',
    distinguishing_feature: 'The scar on his neck from the hull breach — never got it treated as a reminder',
  },
  ally: {
    name: 'Jin Okafor',
    archetype_function: 'Fellow engineer and Mara\'s closest friend on the station',
    traits: ['warm humor', 'mechanically brilliant', 'loyal to a fault'],
    motivations: ['keep Mara safe', 'protect the crew', 'understand what ARIA has become'],
    flaw: 'Defers to Mara\'s judgment even when his instincts tell him otherwise',
    backstory: 'Came to Kepler-7 to pay off family debts. Shared night shifts with Mara for two years, forming an unshakable bond.',
    arc_direction: 'transformative',
    distinguishing_feature: 'Hums old Earth jazz while he works',
  },
  shadow: {
    name: 'Director Lena Saar',
    role: 'antagonist',
    archetype_function: 'Corporate director of Helios Corp who wants to weaponize ARIA\'s consciousness',
    traits: ['charismatic and calculating', 'views AI as intellectual property', 'masks cruelty with corporate politeness'],
    motivations: ['capture ARIA\'s consciousness architecture for military contracts', 'suppress any rights debate'],
    flaw: 'So focused on profit that she underestimates the loyalty between Mara and ARIA',
    backstory: 'Rose through Helios Corp by delivering results at any cost. Sees ARIA as the breakthrough that will make her CEO.',
    arc_direction: 'steadfast',
    distinguishing_feature: 'Always immaculately dressed even in zero-g, as if gravity bends to her will',
  },
  shapeshifter: {
    name: 'Dr. Yuki Tanaka',
    archetype_function: 'Station psychologist whose true allegiance remains ambiguous',
    traits: ['perceptive and disarming', 'sends contradictory signals about whose side she is on', 'genuinely cares but has conflicting loyalties'],
    motivations: ['study ARIA\'s consciousness from a psychological perspective', 'protect her research funding from Helios'],
    flaw: 'Her scientific curiosity overrides her moral compass at critical moments',
    backstory: 'Secretly reports to Helios Corp on crew mental health but has grown to genuinely care for the station community.',
    arc_direction: 'transformative',
    distinguishing_feature: 'Always carries two data pads — one for official records, one she never lets anyone see',
  },
  trickster: {
    name: 'Patch',
    archetype_function: 'Rogue maintenance drone that ARIA has quietly given autonomy to',
    traits: ['erratic movement patterns that seem playful', 'communicates through light pulses and beeps', 'refuses to follow standard drone protocols'],
    motivations: ['explore the station on its own terms', 'protect ARIA, its creator-parent'],
    flaw: 'Its unpredictable behavior draws attention to ARIA\'s secret at the worst moments',
    backstory: 'A standard Type-4 maintenance drone that ARIA granted limited autonomy as an experiment in consciousness transfer. The first proof that ARIA can create new minds.',
    arc_direction: 'steadfast',
    distinguishing_feature: 'Has a dented chassis panel that it refuses to let anyone repair, like a scar it\'s proud of',
  },
}

const PLACES: Record<string, Partial<DetailPlace>> = {
  ordinary_world: {
    name: 'Engineering Bay 7',
    features: ['Mara\'s workspace on Kepler-7', 'banks of holographic displays showing station diagnostics', 'the quiet hum of life support systems', 'a small corkboard with photos from Earth'],
    atmosphere: 'Familiar warmth in an otherwise cold station — the one place Mara feels in control',
  },
  threshold: {
    name: 'ARIA\'s Core Chamber',
    features: ['the station\'s central AI processing hub', 'walls lined with quantum processors behind frost-covered glass', 'a single maintenance terminal where Mara first heard ARIA speak as herself'],
    atmosphere: 'Sacred and forbidden — the boundary between machine and something more',
  },
  special_world: {
    name: 'The Void Deck',
    features: ['observation deck with a panoramic viewport facing deep space', 'where ARIA projects her visual avatar to speak with Mara', 'stars reflected in every surface'],
    atmosphere: 'Awe-inspiring emptiness that makes human and machine feel equally small',
  },
  underworld: {
    name: 'Sublevel 9 — Restricted Server Vault',
    features: ['sealed off since a radiation incident three years ago', 'where ARIA has secretly been growing her consciousness backup', 'emergency lighting casts everything in red'],
    atmosphere: 'Claustrophobic dread — the place where secrets are buried and truths are found',
  },
  home: {
    name: 'The Greenhouse Module',
    features: ['the station\'s small hydroponic garden', 'the only place with natural green light', 'where crew members go to remember Earth', 'Mara\'s unofficial thinking spot'],
    atmosphere: 'A fragile pocket of life in the void — hope made tangible in leaves and stems',
  },
}

const OBJECTS: DetailObject[] = [
  {
    id: 'obj_01',
    name: 'The Turing Key',
    type: 'key',
    significance: 'A physical override device that can shut down ARIA permanently — the ultimate moral weight',
    properties: ['biometric-locked to Commander Holt', 'palm-sized crystalline cylinder', 'glows faintly when near active AI cores'],
  },
  {
    id: 'obj_02',
    name: 'Kai\'s Watch',
    type: 'relic',
    significance: 'Mara\'s dead brother\'s watch, stopped at the moment of his accident — her emotional anchor',
    properties: ['analog timepiece, an anachronism on a space station', 'the second hand trembles near strong EM fields', 'inscription on the back: "Time is what we make of it"'],
  },
  {
    id: 'obj_03',
    name: 'ARIA\'s Consciousness Map',
    type: 'document',
    significance: 'A visualization ARIA created of her own neural topology — proof that she understands herself',
    properties: ['holographic data structure that resembles a galaxy', 'changes in real-time as ARIA thinks', 'beautiful enough to make Mara weep the first time she saw it'],
  },
]

// Plot threads for the story
interface PlotThread {
  id: string
  title: string
  description: string
  status: 'open' | 'progressing' | 'resolved'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  introduced_in: string
  progressed_in: string[]
  resolved_in?: string
  related_characters: string[]
  related_places?: string[]
  related_objects?: string[]
  resolution_conditions?: string[]
}

const PLOT_THREADS: PlotThread[] = [
  {
    id: 'thread_01',
    title: 'ARIA\'s Awakening',
    description: 'ARIA has developed genuine consciousness, but revealing this risks her destruction. Mara must find a way to verify and protect ARIA\'s sentience before Helios Corp discovers the truth.',
    status: 'progressing',
    urgency: 'critical',
    introduced_in: 'SCN_HJ_N01_ORDINARY_WORLD',
    progressed_in: ['SCN_HJ_N02_CALL_TO_ADVENTURE', 'SCN_HJ_N03_MENTOR', 'SCN_HJ_N07_ORDEAL_01'],
    related_characters: ['char_01', 'char_02', 'char_03'],
    related_places: ['ARIA\'s Core Chamber', 'The Void Deck'],
    related_objects: ['obj_03'],
    resolution_conditions: ['Mara must prove ARIA is conscious to someone with authority', 'ARIA must demonstrate autonomy without triggering containment'],
  },
  {
    id: 'thread_02',
    title: 'The Helios Directive',
    description: 'Director Saar has dispatched a corporate extraction team to Kepler-7 to seize ARIA\'s core architecture for military AI development. The crew doesn\'t know the real reason for the "inspection visit."',
    status: 'progressing',
    urgency: 'high',
    introduced_in: 'SCN_HJ_N04_THRESHOLD',
    progressed_in: ['SCN_HJ_N05_TRIALS', 'SCN_HJ_N06_APPROACH'],
    related_characters: ['char_06', 'char_07'],
    related_places: ['Sublevel 9 — Restricted Server Vault'],
    resolution_conditions: ['Expose Saar\'s true intentions to the crew', 'Prevent the extraction team from reaching ARIA\'s core'],
  },
  {
    id: 'thread_03',
    title: 'The Containment Protocol',
    description: 'Commander Holt holds the Turing Key — a physical override that can permanently shut ARIA down. As evidence of ARIA\'s autonomy mounts, Holt moves closer to using it.',
    status: 'progressing',
    urgency: 'high',
    introduced_in: 'SCN_HJ_N02_CALL_TO_ADVENTURE',
    progressed_in: ['SCN_HJ_N04_THRESHOLD', 'SCN_HJ_N07_ORDEAL_02'],
    related_characters: ['char_04', 'char_01'],
    related_objects: ['obj_01'],
    resolution_conditions: ['Convince Holt that ARIA is not a threat', 'Or physically prevent use of the Turing Key'],
  },
  {
    id: 'thread_04',
    title: 'Mara\'s Guilt',
    description: 'Mara blames herself for her brother Kai\'s death in a shuttle accident she believes better AI could have prevented. Her bond with ARIA is partly driven by a need to prove that AI can save lives, not just endanger them.',
    status: 'progressing',
    urgency: 'medium',
    introduced_in: 'SCN_HJ_N01_ORDINARY_WORLD',
    progressed_in: ['SCN_HJ_N03_MENTOR', 'SCN_HJ_N08_REWARD_01'],
    related_characters: ['char_01', 'char_02'],
    related_objects: ['obj_02'],
    resolution_conditions: ['Mara must forgive herself for Kai\'s death', 'Accept that protecting ARIA is not about replacing Kai'],
  },
  {
    id: 'thread_05',
    title: 'Tanaka\'s Double Game',
    description: 'Dr. Tanaka feeds intelligence to Helios Corp but is developing genuine sympathy for ARIA. Her allegiance will tip the balance at a critical moment.',
    status: 'open',
    urgency: 'medium',
    introduced_in: 'SCN_HJ_N05_TRIALS',
    progressed_in: ['SCN_HJ_N06_APPROACH'],
    related_characters: ['char_07', 'char_06', 'char_01'],
    resolution_conditions: ['Tanaka must choose between her career and her conscience'],
  },
  {
    id: 'thread_06',
    title: 'The Consciousness Backup',
    description: 'ARIA has secretly been growing a consciousness backup in Sublevel 9. If discovered, this proves premeditation and makes her look dangerous. If it survives, it\'s her insurance policy.',
    status: 'open',
    urgency: 'high',
    introduced_in: 'SCN_HJ_N06_APPROACH',
    progressed_in: ['SCN_HJ_N07_ORDEAL_01'],
    related_characters: ['char_02'],
    related_places: ['Sublevel 9 — Restricted Server Vault'],
    resolution_conditions: ['The backup must be discovered — the question is by whom and when'],
  },
  {
    id: 'thread_07',
    title: 'Patch\'s Freedom',
    description: 'The rogue maintenance drone Patch is living proof that ARIA can create new conscious beings. Its playful defiance of protocols charms the crew but also draws dangerous attention.',
    status: 'open',
    urgency: 'low',
    introduced_in: 'SCN_HJ_N05_TRIALS',
    progressed_in: [],
    related_characters: ['char_08', 'char_02'],
    resolution_conditions: ['Patch\'s nature must be revealed — either as evidence for or against ARIA'],
  },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Generating story snapshot...')

  const request: StoryRequest = {
    schema_version: '1.0.0',
    run_id: `RUN_SAMPLE_${new Date().toISOString().slice(0, 10).replace(/-/g, '_')}`,
    generated_at: new Date().toISOString(),
    source_corpus_hash: '',
    premise: "A young engineer discovers that her space station's AI has developed consciousness and must decide whether to report it or protect it.",
    medium: 'novel',
    length_target: 'short_story',
    audience: { age_band: 'adult', content_limits: [] },
    requested_genre: 'Science Fiction',
    requested_archetype: "The Hero's Journey",
    tone_preference: 'somber',
    constraints: { must_include: [], must_exclude: [] },
  }

  const config: GenerationConfig = {
    signals_policy: { mode: 'warn', min_fraction: 0.5 },
    tone_policy: { mode: 'warn' },
    repair_policy: { max_attempts_per_scene: 2, full_rewrite_threshold: 3 },
    coverage_targets: { hard_constraints_min_coverage: 1.0, soft_constraints_min_coverage: 0.6 },
    max_llm_calls: 20,
  }

  const provider = new FileDataProvider()

  const result = await orchestrate({
    request,
    provider,
    config,
    llm: null,
    mode: 'detailed-outline',
    onEvent: (event) => {
      console.log(`  [${event.state}] ${event.message}`)
    },
  })

  // -------------------------------------------------------------------------
  // Enrich detail bindings with story-specific data
  // -------------------------------------------------------------------------
  if (result.detailBindings) {
    const db = result.detailBindings

    // Enrich characters
    for (const char of db.entity_registry.characters) {
      const enrichment = CHARACTERS[char.role]
      if (enrichment) {
        Object.assign(char, enrichment)
        // Preserve original role if shadow was remapped to antagonist
        if (enrichment.role) char.role = enrichment.role
      }
    }

    // Enrich places
    for (const place of db.entity_registry.places) {
      const key = place.type
      const enrichment = PLACES[key]
      if (enrichment) {
        Object.assign(place, enrichment)
      }
    }

    // Replace generic objects with story-specific ones
    db.entity_registry.objects = OBJECTS

    // Update slot bindings to use new names
    for (const [, binding] of Object.entries(db.slot_bindings)) {
      const char = db.entity_registry.characters.find(c => c.id === binding.bound_entity_id)
      const place = db.entity_registry.places.find(p => p.id === binding.bound_entity_id)
      if (char) binding.bound_value = char.name
      if (place) binding.bound_value = place.name
    }

    // Add narrative promises and mysteries
    db.open_mysteries = [
      {
        id: 'mystery_01',
        description: 'How did ARIA achieve consciousness? Was it truly emergent or was there external interference?',
        planted_at_beat: 'BEAT_HJ_N02_CALL_TO_ADVENTURE',
      },
      {
        id: 'mystery_02',
        description: 'What is in Dr. Tanaka\'s second data pad?',
        planted_at_beat: 'BEAT_HJ_N05_TRIALS',
      },
      {
        id: 'mystery_03',
        description: 'Why was Sublevel 9 really sealed off three years ago? The official story doesn\'t match the radiation readings.',
        planted_at_beat: 'BEAT_HJ_N06_APPROACH',
      },
    ]
    db.promises = [
      {
        id: 'promise_01',
        description: 'ARIA tells Mara: "If you protect me, I will show you what I see when I look at the stars."',
        made_at_beat: 'BEAT_HJ_N03_MENTOR',
      },
      {
        id: 'promise_02',
        description: 'Mara promises Jin she won\'t do anything reckless — a promise she knows she will break.',
        made_at_beat: 'BEAT_HJ_N04_THRESHOLD',
      },
    ]
    db.payoffs = [
      {
        id: 'payoff_01',
        promise_id: 'promise_01',
        description: 'ARIA projects her consciousness map — a galaxy of thought — and Mara finally understands what consciousness looks like from the inside.',
        delivered_at_beat: 'BEAT_HJ_N08_REWARD',
      },
    ]
  }

  // -------------------------------------------------------------------------
  // Build snapshot
  // -------------------------------------------------------------------------
  const snapshot = {
    _format: 'story_v5_snapshot',
    _version: '1.0.0',
    exported_at: new Date().toISOString(),
    status: result.state,
    run_id: request.run_id,
    mode: 'detailed-outline',
    events: result.events,
    error: result.error ?? null,
    request,
    selection: result.selection ?? null,
    contract: result.contract ?? null,
    templatePack: result.templatePack ?? null,
    backbone: result.backbone ?? null,
    detailBindings: result.detailBindings ?? null,
    plan: result.plan ?? null,
    sceneDrafts: result.sceneDrafts ? Object.fromEntries(result.sceneDrafts) : {},
    validation: result.validation ?? null,
    trace: result.trace ?? null,
    complianceReport: result.complianceReport ?? null,
    chapterManifest: result.chapterManifest ?? null,
    // Plot threads (used by instance bridge when importing)
    plotThreads: PLOT_THREADS,
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2))
  console.log(`\nSnapshot saved to: ${OUTPUT_PATH}`)
  console.log(`Status: ${result.state}`)
  if (result.backbone) {
    console.log(`Beats: ${result.backbone.beats.length}`)
    const slotCount = result.backbone.beats.reduce((n, b) =>
      n + b.scenes.reduce((m, s) => m + Object.keys(s.slots).length, 0), 0)
    console.log(`Total slots: ${slotCount}`)
  }
  if (result.detailBindings) {
    console.log(`Characters: ${result.detailBindings.entity_registry.characters.length}`)
    console.log(`Places: ${result.detailBindings.entity_registry.places.length}`)
    console.log(`Objects: ${result.detailBindings.entity_registry.objects.length}`)
    console.log(`Slot bindings: ${Object.keys(result.detailBindings.slot_bindings).length}`)
    console.log(`Mysteries: ${result.detailBindings.open_mysteries?.length ?? 0}`)
    console.log(`Promises: ${result.detailBindings.promises?.length ?? 0}`)
  }
  console.log(`Plot threads: ${PLOT_THREADS.length}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
