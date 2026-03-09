/**
 * Sample element data for random population of the Elements tab.
 * Each pool entry is a complete entity with all fields filled.
 * The randomizer picks from these pools to fill backbone slots.
 */

import type { DetailCharacter, DetailPlace, DetailObject } from '../artifacts/types.ts'

// ---------------------------------------------------------------------------
// Character pools — keyed by role
// ---------------------------------------------------------------------------

type CharacterTemplate = Omit<DetailCharacter, 'id'>

const CHARACTERS: Record<string, CharacterTemplate[]> = {
  protagonist: [
    { name: 'Kael Ashford', role: 'protagonist', traits: ['resourceful', 'stubborn', 'compassionate'], motivations: ['protect family', 'uncover the truth'], flaw: 'trusts too easily', backstory: 'Orphaned blacksmith who discovered strange markings on an old blade', arc_direction: 'from naive to wise' },
    { name: 'Mira Solenne', role: 'protagonist', traits: ['analytical', 'courageous', 'impatient'], motivations: ['solve the disappearances', 'prove herself'], flaw: 'refuses to ask for help', backstory: 'Former cartographer who mapped the borderlands alone for three years', arc_direction: 'from isolated to connected' },
    { name: 'Tomás Reyes', role: 'protagonist', traits: ['charismatic', 'haunted', 'loyal'], motivations: ['redeem past failures', 'save the village'], flaw: 'paralyzed by guilt', backstory: 'Disgraced guard captain who failed to prevent a massacre', arc_direction: 'from broken to restored' },
    { name: 'Lian Zhu', role: 'protagonist', traits: ['quiet', 'observant', 'fierce when provoked'], motivations: ['find her missing brother', 'understand her powers'], flaw: 'suppresses emotions until they explode', backstory: 'Herbalist apprentice whose brother vanished during the autumn floods', arc_direction: 'from controlled to free' },
    { name: 'Dara Okonkwo', role: 'protagonist', traits: ['inventive', 'reckless', 'warm-hearted'], motivations: ['build something lasting', 'escape poverty'], flaw: 'overestimates own cleverness', backstory: 'Street inventor who builds devices from salvaged parts', arc_direction: 'from survival to purpose' },
  ],
  antagonist: [
    { name: 'Varek Thorne', role: 'antagonist', traits: ['calculating', 'patient', 'charismatic'], motivations: ['consolidate power', 'reshape the world'], flaw: 'cannot accept being wrong', backstory: 'Scholar who concluded that order requires absolute control', arc_direction: 'from reasonable to tyrannical' },
    { name: 'Seraphine Voss', role: 'antagonist', traits: ['elegant', 'ruthless', 'perceptive'], motivations: ['avenge her destroyed homeland', 'acquire the artifact'], flaw: 'consumed by vengeance', backstory: 'Displaced noble who lost everything in the border wars', arc_direction: 'from sympathetic to monstrous' },
    { name: 'The Collector', role: 'antagonist', traits: ['obsessive', 'methodical', 'eerily calm'], motivations: ['complete the collection', 'preserve knowledge at any cost'], flaw: 'values objects over people', backstory: 'Identity unknown — appears wherever rare artifacts surface', arc_direction: 'from mysterious to exposed' },
    { name: 'Commander Ashe', role: 'antagonist', traits: ['disciplined', 'merciless', 'principled'], motivations: ['maintain order', 'crush the rebellion'], flaw: 'sees people as assets', backstory: 'Rose through military ranks by never questioning orders', arc_direction: 'from confident to desperate' },
  ],
  mentor: [
    { name: 'Old Brennan', role: 'mentor', traits: ['cryptic', 'wise', 'weary'], motivations: ['pass on knowledge before death', 'atone for old sins'], flaw: 'withholds crucial information', backstory: 'Former adventurer who settled in the mountains after losing his companions' },
    { name: 'Sister Adeline', role: 'mentor', traits: ['gentle', 'perceptive', 'iron-willed'], motivations: ['guide the next generation', 'protect sacred lore'], flaw: 'too willing to sacrifice herself', backstory: 'Keeper of the archives who trained in both healing and combat' },
    { name: 'Professor Idris Kante', role: 'mentor', traits: ['eccentric', 'brilliant', 'absent-minded'], motivations: ['advance understanding', 'protect a dangerous secret'], flaw: 'lectures when action is needed', backstory: 'Disgraced academic who was right about the theory everyone mocked' },
    { name: 'Grandmother Yuki', role: 'mentor', traits: ['sharp-tongued', 'loving', 'practical'], motivations: ['prepare the young for hardship', 'preserve old ways'], flaw: 'stuck in tradition', backstory: 'Village elder who survived the last cataclysm as a child' },
  ],
  ally: [
    { name: 'Rook Calloway', role: 'ally', traits: ['reliable', 'dry-humored', 'strong'], motivations: ['loyalty to the protagonist', 'find a place to belong'], flaw: 'follows without questioning', backstory: 'Former mercenary tired of fighting for coin' },
    { name: 'Zara Patel', role: 'ally', traits: ['optimistic', 'skilled healer', 'talkative'], motivations: ['help those in need', 'see the world'], flaw: 'naive about danger', backstory: 'Traveling medic who left a comfortable home to do good' },
    { name: 'Fenwick', role: 'ally', traits: ['sneaky', 'street-smart', 'fiercely loyal'], motivations: ['repay a life debt', 'prove worth'], flaw: 'light-fingered by habit', backstory: 'Pickpocket who was caught and shown mercy instead of punishment' },
    { name: 'Captain Reva Stokes', role: 'ally', traits: ['pragmatic', 'experienced', 'gruff'], motivations: ['complete the mission', 'keep people alive'], flaw: 'emotionally distant', backstory: 'Veteran soldier haunted by campaigns she cannot discuss' },
  ],
  herald: [
    { name: 'A breathless messenger', role: 'herald', traits: ['terrified', 'determined', 'young'], motivations: ['deliver the warning'], flaw: 'panics under pressure', backstory: 'Village runner sent with urgent news' },
    { name: 'Corvus the Wanderer', role: 'herald', traits: ['mysterious', 'soft-spoken', 'knowing'], motivations: ['set events in motion', 'fulfill a prophecy'], flaw: 'speaks in riddles', backstory: 'Appears at turning points throughout history' },
    { name: 'Inspector Laine', role: 'herald', traits: ['meticulous', 'persistent', 'troubled'], motivations: ['investigate the anomaly', 'bring the truth to light'], flaw: 'trusts data over instinct', backstory: 'Government investigator assigned to unexplained events' },
  ],
  threshold_guardian: [
    { name: 'The Warden', role: 'threshold_guardian', traits: ['imposing', 'fair', 'unyielding'], motivations: ['test the worthy', 'protect what lies beyond'], flaw: 'cannot see beyond the rules', backstory: 'Bound to guard the passage by an ancient oath' },
    { name: 'Nessa Brightwater', role: 'threshold_guardian', traits: ['skeptical', 'protective', 'fierce'], motivations: ['keep outsiders away', 'preserve her community'], flaw: 'distrusts all strangers', backstory: 'Border guard who has seen too many invaders' },
    { name: 'The Ferryman', role: 'threshold_guardian', traits: ['silent', 'patient', 'ancient'], motivations: ['exact the toll', 'maintain balance'], flaw: 'indifferent to suffering', backstory: 'Has carried travelers across the river for centuries' },
  ],
  shapeshifter: [
    { name: 'Lysander Crane', role: 'shapeshifter', traits: ['charming', 'unpredictable', 'self-serving'], motivations: ['survive by any means', 'play all sides'], flaw: 'loyal to no one, including himself', backstory: 'Spy who has worn so many masks he forgot his own face' },
    { name: 'Ivy Marchetti', role: 'shapeshifter', traits: ['alluring', 'cunning', 'conflicted'], motivations: ['protect a hidden agenda', 'genuine growing attachment to protagonist'], flaw: 'cannot commit to a side', backstory: 'Double agent planted by the antagonist who begins to question her mission' },
  ],
  trickster: [
    { name: 'Pip Gallagher', role: 'trickster', traits: ['irreverent', 'clever', 'surprisingly kind'], motivations: ['undermine authority', 'keep things interesting'], flaw: 'cannot take anything seriously', backstory: 'Court jester who was banished for telling the truth' },
    { name: 'Smoke', role: 'trickster', traits: ['elusive', 'playful', 'dangerously smart'], motivations: ['test everyone', 'expose hypocrisy'], flaw: 'pushes pranks too far', backstory: 'Nobody knows where Smoke came from or what Smoke really wants' },
  ],
  shadow: [
    { name: 'The Hollow King', role: 'shadow', traits: ['terrifying', 'ancient', 'relentless'], motivations: ['consume all light', 'return to power'], flaw: 'cannot create, only corrupt', backstory: 'Once a benevolent ruler, twisted by a forbidden ritual' },
    { name: 'Mirael', role: 'shadow', traits: ['beautiful', 'sorrowful', 'deadly'], motivations: ['end suffering by ending everything', 'punish the living'], flaw: 'seeks destruction disguised as mercy', backstory: 'An immortal who has watched civilizations rise and fall for too long' },
  ],
  love_interest: [
    { name: 'Elara Nightingale', role: 'love_interest', traits: ['independent', 'warm', 'sharp-witted'], motivations: ['build a new life', 'support loved ones'], flaw: 'walls up after past betrayal', backstory: 'Artisan who rebuilt her workshop after it was burned down' },
    { name: 'Dorian Ashby', role: 'love_interest', traits: ['gentle', 'artistic', 'quietly brave'], motivations: ['create beauty', 'stand beside someone worth standing with'], flaw: 'avoids confrontation', backstory: 'Painter who sees the world differently and captures it on canvas' },
  ],
  confidant: [
    { name: 'Father Matthias', role: 'confidant', traits: ['patient', 'nonjudgmental', 'observant'], motivations: ['hear the truth', 'offer counsel'], flaw: 'keeps too many secrets', backstory: 'Parish priest who has heard confessions for forty years' },
    { name: 'Suki', role: 'confidant', traits: ['blunt', 'trustworthy', 'protective'], motivations: ['keep the protagonist grounded', 'speak uncomfortable truths'], flaw: 'overprotective', backstory: 'Childhood friend who never left the hometown' },
  ],
}

// ---------------------------------------------------------------------------
// Place pools — keyed by type
// ---------------------------------------------------------------------------

type PlaceTemplate = Omit<DetailPlace, 'id'>

const PLACES: Record<string, PlaceTemplate[]> = {
  ordinary_world: [
    { name: 'Millhaven', type: 'ordinary_world', features: ['cobblestone streets', 'market square', 'stone bridge over a slow river'], atmosphere: 'Quiet and familiar, routines that repeat like seasons' },
    { name: 'The Ashford Homestead', type: 'ordinary_world', features: ['weather-beaten farmhouse', 'forge in the barn', 'wildflower meadow'], atmosphere: 'Warm but confining, a place outgrown' },
    { name: 'Lakeshore District', type: 'ordinary_world', features: ['crowded tenements', 'fish market', 'rusted docks'], atmosphere: 'Bustling poverty, survival as daily routine' },
  ],
  special_world: [
    { name: 'The Thornwood', type: 'special_world', features: ['ancient twisted trees', 'bioluminescent fungi', 'paths that shift overnight'], atmosphere: 'Beautiful and menacing, alive with watchful presence' },
    { name: 'The Undercity', type: 'special_world', features: ['flooded tunnels', 'crystallized walls', 'echoing chambers'], atmosphere: 'Claustrophobic grandeur, every sound amplified' },
    { name: 'The Shattered Plateau', type: 'special_world', features: ['floating rock fragments', 'gravity anomalies', 'ruins of a fallen city'], atmosphere: 'Awe-inspiring desolation, physics bent sideways' },
  ],
  threshold: [
    { name: 'The Border Gate', type: 'threshold', features: ['iron portcullis', 'guard towers', 'warning inscriptions'], atmosphere: 'Tension between safety behind and danger ahead' },
    { name: 'The Last Bridge', type: 'threshold', features: ['crumbling stone arch', 'deep chasm below', 'no return path'], atmosphere: 'Point of no return, commitment made physical' },
    { name: 'The Fog Wall', type: 'threshold', features: ['impenetrable mist', 'muffled sounds', 'distorted compass readings'], atmosphere: 'Disorienting and isolating, reality fading at the edges' },
  ],
  sanctuary: [
    { name: 'The Hidden Spring', type: 'sanctuary', features: ['warm mineral pool', 'sheltering cliff overhang', 'medicinal herbs'], atmosphere: 'Healing quiet, a pocket of peace' },
    { name: 'The Rebel Camp', type: 'sanctuary', features: ['camouflaged tents', 'watch fires', 'shared meals'], atmosphere: 'Fragile safety, camaraderie forged by necessity' },
    { name: 'The Lighthouse', type: 'sanctuary', features: ['spiral staircase', 'panoramic windows', 'keeper\'s library'], atmosphere: 'Isolated elevation, seeing far but feeling alone' },
  ],
  stronghold: [
    { name: 'Blackspire Keep', type: 'stronghold', features: ['obsidian walls', 'torture chambers', 'throne of bones'], atmosphere: 'Oppressive dread, power made grotesque' },
    { name: 'The Iron Citadel', type: 'stronghold', features: ['mechanical gates', 'automated defenses', 'surveillance throughout'], atmosphere: 'Cold efficiency, humanity engineered away' },
    { name: 'The Sunken Palace', type: 'stronghold', features: ['submerged halls', 'air-locked chambers', 'bioluminescent corridors'], atmosphere: 'Alien beauty hiding deep menace' },
  ],
  underworld: [
    { name: 'The Bone Caverns', type: 'underworld', features: ['ossuary walls', 'underground river', 'phosphorescent moss'], atmosphere: 'Death made literal, confronting mortality' },
    { name: 'The Abyss Market', type: 'underworld', features: ['shadow merchants', 'impossible goods', 'no fixed geography'], atmosphere: 'Commerce without conscience, desire weaponized' },
  ],
  home: [
    { name: 'Millhaven (transformed)', type: 'home', features: ['rebuilt structures', 'new growth in gardens', 'memorial stone'], atmosphere: 'Familiar but changed, like the protagonist' },
    { name: 'The Workshop', type: 'home', features: ['protagonist\'s creations displayed', 'open door policy', 'apprentice station'], atmosphere: 'Purpose found, knowledge passed forward' },
  ],
  crossroads: [
    { name: 'The Three Forks', type: 'crossroads', features: ['ancient signpost', 'diverging paths', 'abandoned shrine'], atmosphere: 'Weight of choice, all directions uncertain' },
    { name: 'The Council Chamber', type: 'crossroads', features: ['round table', 'maps and documents', 'candlelight'], atmosphere: 'Debate and decision, alliances forming and breaking' },
  ],
  setting: [
    { name: 'Port Calloway', type: 'setting', features: ['busy harbor', 'tavern row', 'shipwrights\' quarter'], atmosphere: 'Energy and opportunity, danger in every alley' },
    { name: 'The Amber Valley', type: 'setting', features: ['terraced farms', 'windmills', 'seasonal festivals'], atmosphere: 'Pastoral beauty masking simmering tensions' },
    { name: 'Irongate City', type: 'setting', features: ['industrial smokestacks', 'class-divided districts', 'underground resistance'], atmosphere: 'Progress and oppression, side by side' },
  ],
}

// ---------------------------------------------------------------------------
// Object pools — keyed by type
// ---------------------------------------------------------------------------

type ObjectTemplate = Omit<DetailObject, 'id'>

const OBJECTS: Record<string, ObjectTemplate[]> = {
  talisman: [
    { name: 'The Compass Rose', type: 'talisman', significance: 'Points toward what the bearer needs most, not what they want', properties: ['warm to the touch', 'needle spins near danger', 'inherited from mentor'] },
    { name: 'Mother\'s Locket', type: 'talisman', significance: 'Contains a portrait that changes to show warnings', properties: ['silver chain', 'opens only for blood kin', 'hums near dark magic'] },
    { name: 'The Binding Stone', type: 'talisman', significance: 'Seals promises — broken oaths cause physical pain', properties: ['smooth river stone', 'glows when oath is active', 'cracks if oath is betrayed'] },
  ],
  weapon: [
    { name: 'Ashblade', type: 'weapon', significance: 'Forged by the protagonist, grows sharper with conviction', properties: ['folded steel', 'edge never dulls', 'bears maker\'s mark'] },
    { name: 'The Thorn Bow', type: 'weapon', significance: 'Arrows grow from living wood, never run out but each costs vitality', properties: ['living wood frame', 'self-generating arrows', 'drains stamina per shot'] },
    { name: 'Widow\'s Edge', type: 'weapon', significance: 'Belonged to the antagonist\'s murdered partner', properties: ['black blade', 'resonates with grief', 'cuts through enchantments'] },
  ],
  treasure: [
    { name: 'The Wellspring Vial', type: 'treasure', significance: 'Contains water from the source of all rivers — can heal any wound once', properties: ['crystal flask', 'water never evaporates', 'single use'] },
    { name: 'The Crown of Embers', type: 'treasure', significance: 'Grants authority over the land but slowly burns the wearer', properties: ['living fire', 'commands obedience', 'addictive warmth'] },
    { name: 'The Seed of Renewal', type: 'treasure', significance: 'Can restore a blighted land but requires a sacrifice to plant', properties: ['golden seed pod', 'pulses with life', 'demands blood to grow'] },
  ],
  document: [
    { name: 'The Burnt Codex', type: 'document', significance: 'Partially destroyed record of the old kingdom\'s fall — missing pages hold the key', properties: ['fire-damaged', 'encoded margins', 'pages stick together'] },
    { name: 'Grandfather\'s Journal', type: 'document', significance: 'Contains a map to the hidden passage and a confession', properties: ['leather-bound', 'water-stained', 'final entry unfinished'] },
    { name: 'The Treaty of Ashes', type: 'document', significance: 'Peace agreement that was never signed — proves who betrayed whom', properties: ['official seal', 'unsigned', 'hidden in the archives'] },
  ],
  key: [
    { name: 'The Skeleton Key', type: 'key', significance: 'Opens any door but locks one behind — forces forward momentum', properties: ['bone-carved', 'warm when near a lock', 'cannot be duplicated'] },
    { name: 'The Cipher Ring', type: 'key', significance: 'Decodes the language of the ancients when worn', properties: ['inscribed bands', 'rotates to different settings', 'tightens when translation is wrong'] },
  ],
  artifact: [
    { name: 'The Mirror of Echoes', type: 'artifact', significance: 'Shows the viewer their greatest fear, then their greatest strength', properties: ['obsidian frame', 'reflection delayed by seconds', 'cannot be broken'] },
    { name: 'The Hourglass of Still Moments', type: 'artifact', significance: 'Freezes time for thirty heartbeats — but the user ages those beats', properties: ['golden sand', 'cracks with each use', 'sand turns red at final use'] },
  ],
  map: [
    { name: 'The Living Map', type: 'map', significance: 'Updates in real-time but shows paths that no longer exist', properties: ['self-drawing ink', 'parchment regenerates', 'marks danger zones in red'] },
    { name: 'The Star Chart', type: 'map', significance: 'Navigation guide that only works on moonless nights', properties: ['constellation overlay', 'phosphorescent ink', 'annotations in dead language'] },
  ],
  elixir: [
    { name: 'The Elixir of Clear Sight', type: 'elixir', significance: 'Reveals hidden truths but causes temporary blindness after', properties: ['amber liquid', 'bitter taste', 'three doses remain'] },
    { name: 'Moonwater', type: 'elixir', significance: 'Restores fading magic but causes vivid hallucinations', properties: ['silver sheen', 'cold as ice', 'collected only at full moon'] },
  ],
  token: [
    { name: 'The Iron Coin', type: 'token', significance: 'Proof of membership in the underground network', properties: ['stamped with a raven', 'unnaturally heavy', 'recognized at safe houses'] },
    { name: 'The Feather', type: 'token', significance: 'Gift from a spirit — proof of passage through the threshold', properties: ['iridescent', 'weightless', 'cannot be lost'] },
  ],
  symbol: [
    { name: 'The Broken Crown', type: 'symbol', significance: 'Represents fallen authority and the cost of power', properties: ['gold bent at the peak', 'gemstones missing', 'heavy with memory'] },
    { name: 'The Unity Banner', type: 'symbol', significance: 'Rallying emblem stitched from fragments of every faction\'s flag', properties: ['patchwork fabric', 'blood-stained edge', 'inspires courage'] },
  ],
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Pick a random character template for the given role. Falls back to ally if role unknown. */
export function randomCharacter(role: string): CharacterTemplate {
  const pool = CHARACTERS[role] ?? CHARACTERS['ally']
  return { ...pickRandom(pool) }
}

/** Pick a random place template for the given type. Falls back to setting if type unknown. */
export function randomPlace(type: string): PlaceTemplate {
  const pool = PLACES[type] ?? PLACES['setting']
  return { ...pickRandom(pool) }
}

/** Pick a random object template for the given type. Falls back to token if type unknown. */
export function randomObject(type: string): ObjectTemplate {
  const pool = OBJECTS[type] ?? OBJECTS['token']
  return { ...pickRandom(pool) }
}
