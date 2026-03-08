"""
Generate replacement premises for all rows under 75 words.
Each replacement matches the archetype structure, genre conventions, and tone.
Run: python data/cross_references/fix_short_premises.py
"""

import csv

# Key: (archetype, genre) -> (new_premise, tone)
# All premises are 75+ words.

REPLACEMENTS = {

# --- Genre 19: Military Fiction ---
("05","19"): (
    "A defensive battalion stationed near a vital transportation hub receives intelligence that enemy forces are massing for a large-scale assault designed to seize the region and sever supply lines supporting the broader allied campaign. With reinforcements delayed by weather and bureaucratic confusion, field commanders must improvise defensive positions using limited ammunition and aging equipment while simultaneously coordinating the evacuation of nearby civilian populations through contested corridors. The soldiers understand that holding the location even briefly could provide critical time for allied forces to regroup, reinforce surrounding defensive lines, and mount a counteroffensive before the strategic position is permanently lost.",
    "High tension"
),
("08","19"): (
    "A group of soldiers assigned to guard supply depots far behind the main front lines spends long weeks waiting for orders while the larger war unfolds in distant territories they can only imagine. To cope with crushing boredom and the persistent anxiety of potential deployment, the soldiers invent increasingly elaborate stories about imaginary heroic exploits, staging playful competitions that transform the smallest daily events into epic battlefield engagements worthy of medals and commendations. The humor helps maintain morale and unit cohesion, even as each soldier privately understands that orders transferring them to active combat zones could arrive without warning at any moment, ending their comfortable routine forever.",
    "Humorous"
),

# --- Genre 06: Science Fiction ---
("14","06"): (
    "A merchant known for exploiting magical artifacts to gain profit begins encountering strange dreams in which the objects speak about the lands they once protected. Gradually disturbed by the realization that many relics were taken from sacred places, the merchant travels across distant regions attempting to return them. Each journey forces the merchant to confront communities harmed by earlier greed and to understand the deeper purposes these artifacts once served. Over time the once cynical trader transforms into a reluctant caretaker of magical heritage, discovering that restoration demands more than returning stolen property.",
    "Reflective transformative"
),

# --- Genre 07: Adventure ---
("09","07"): (
    "A teenager visiting relatives in a quiet countryside village begins noticing strange rituals performed by neighbors during certain nights of the month. Adults refuse to explain the ceremonies and warn visitors to remain indoors after sunset. Curious and increasingly suspicious, the teenager secretly follows one of the gatherings into the surrounding forest. The discovery reveals a community bound by ancient traditions designed to keep something hidden beneath the earth from rising again. As the teenager pushes deeper into the mystery, the boundary between childhood curiosity and genuine danger becomes impossible to ignore.",
    "Eerie suspenseful"
),
("11","07"): (
    "Workers trapped inside an isolated research facility during a violent storm discover that one of the experiments conducted there has escaped containment. Security doors seal automatically while emergency lights flicker through empty corridors. As communication with the outside world fails, the remaining staff must navigate laboratories filled with dangerous equipment while avoiding something moving silently through the building. Every attempt to escape the facility reveals that the experiment may be learning from their actions and adapting its behavior to anticipate their movements through the darkened complex.",
    "Tense claustrophobic"
),
("13","07"): (
    "A historian examining old church records finds several references to entire families erased from official documents without explanation. Census records, tax rolls, and property deeds all show the same pattern of names appearing briefly before disappearing completely from every archive. Determined to understand the omissions, the historian begins mapping the locations associated with the missing families across several counties. The investigation reveals that every disappearance occurred near the same abandoned valley, where the ruins of a settlement suggest a community that once thrived before being deliberately removed from historical memory.",
    "Ominous investigative"
),
("14","07"): (
    "A respected scientist studying unusual biological organisms in deep caves gradually becomes fascinated by specimens that exhibit behaviors far beyond what current research can explain. Extended periods underground begin affecting the scientist's perception of time and surroundings in ways that colleagues find alarming. As the research intensifies and the organisms respond to the scientist's presence with increasing complexity, the boundary between observer and subject begins dissolving. The transformation from detached researcher into something deeply connected to the underground ecosystem challenges everything the scientific community believes about the relationship between human consciousness and the natural world.",
    "Disturbing transformative"
),

# --- Genre 08: Romance ---
("10","08"): (
    "A woman whose brother disappeared years earlier while working as a financial auditor receives a package containing fragments of encrypted spreadsheets and handwritten notes. Convinced the material may explain the disappearance, she begins reconstructing the data and consulting experts capable of interpreting the complex transactions. The search reveals a web of hidden investments and offshore accounts that may have motivated someone to silence the auditor permanently. Each discovery draws her deeper into dangerous territory where powerful individuals will do anything to prevent their financial secrets from reaching public attention.",
    "Dark determined"
),
("11","08"): (
    "An employee working in the records department of a large corporation notices several financial reports quietly removed from internal databases without explanation. When the employee attempts to retrieve backup copies, supervisors suddenly restrict access to archived files and begin monitoring daily activities more closely. Realizing the documents may contain evidence of illegal activity, the employee secretly copies what remains and begins planning a careful exit from the company before those responsible for the disappearance of the records discover that someone has been paying attention to the gaps in the system.",
    "Tense suspenseful"
),
("12","08"): (
    "A museum curator discovers that several valuable artifacts were quietly replaced with near perfect replicas during a recent renovation. Rather than reporting the switch immediately and risking a public scandal that could destroy the institution, the curator begins a private investigation to identify who orchestrated the forgeries and where the originals were taken. The search leads through auction houses, private collections, and shadowy dealers who operate beyond the reach of ordinary law enforcement. The curator must decide how much personal risk is acceptable to protect the museum's integrity and the cultural heritage entrusted to its care.",
    "Serious investigative"
),
("13","08"): (
    "A historian reviewing diplomatic correspondence from the early twentieth century notices coded language embedded within seemingly routine letters exchanged between government officials across several nations. The patterns suggest a coordinated effort to manipulate trade agreements and territorial boundaries that shaped the political landscape for decades. As the historian decodes additional messages and cross references them with official records, the true scope of the conspiracy emerges. What began as academic curiosity transforms into a revealing investigation that challenges accepted narratives about how powerful nations negotiated their influence during a pivotal era of modern history.",
    "Revealing analytical"
),
("14","08"): (
    "A skeptical insurance investigator known for dismissing conspiracy theories begins reviewing a series of claims that share unusual similarities across multiple regions and time periods. Each case involves property damage attributed to natural causes, yet the forensic evidence consistently suggests deliberate human intervention disguised to appear accidental. As the investigator follows the financial trail connecting these claims, unexpected relationships emerge between policyholders, adjusters, and development companies that profit from the destruction. The methodical pursuit of evidence gradually transforms the dismissive investigator into someone who understands that patterns others ignore can reveal carefully orchestrated schemes operating in plain sight.",
    "Thoughtful investigative"
),
("15","08"): (
    "A charismatic entrepreneur builds a reputation for solving complex corporate fraud cases through innovative forensic accounting techniques that attract wealthy clients and media attention. Early successes create an aura of invincibility that encourages increasingly aggressive tactics and public confrontations with powerful adversaries. As the entrepreneur's fame grows, ethical boundaries begin blurring between legitimate investigation and manipulation of evidence to guarantee results that satisfy demanding clients. When a high profile case collapses under scrutiny and former allies reveal compromising details, the dramatic fall from celebrated fraud fighter to discredited figure demonstrates how unchecked ambition can corrupt even noble intentions.",
    "Reflective cautionary"
),

# --- Genre 09: Romantic Comedy ---
("07","09"): (
    "Two university students form an intense romantic relationship during their final year before graduation, building plans for a shared future that feels certain and permanent. When career opportunities pull them toward different cities and incompatible schedules, neither wants to acknowledge the growing distance between daily reality and their promises to each other. Small disagreements become recurring arguments as the pressure of maintaining connection across separate lives reveals fundamental differences in priorities they previously overlooked. The relationship that once seemed destined for lasting happiness gradually unravels despite genuine love, illustrating how timing and circumstance can defeat even the deepest emotional bonds.",
    "Bittersweet tragic"
),
("10","09"): (
    "After a painful breakup with a partner who abruptly ended a long relationship, a graphic designer channels frustration into creating an anonymous comic strip satirizing modern dating culture. The strip gains unexpected popularity online, attracting followers who recognize their own romantic disasters in the sharp observations and darkly humorous scenarios. When the designer's identity is accidentally revealed and the ex-partner recognizes unflattering depictions drawn from their shared history, the confrontation forces both to reconsider what went wrong. The process of turning private grief into public comedy becomes an unexpectedly serious examination of how people process rejection and seek meaning after emotional loss.",
    "Serious introspective"
),
("12","09"): (
    "Two doctors working in a humanitarian medical mission develop a deep bond while treating patients in a remote region devastated by conflict and natural disaster. Their shared commitment to helping others creates an emotional connection that transcends the difficult conditions surrounding them. When evacuation orders arrive and resources become critically limited, one doctor chooses to remain behind with patients too fragile to transport while the other must carry critical medical data to the nearest functioning hospital. The painful separation forces both to confront whether love built during crisis can survive the ordinary world that awaits beyond the mission, and what it truly means to sacrifice personal happiness for others.",
    "Emotional noble"
),
("13","09"): (
    "A historian studying personal letters from a nineteenth century couple becomes fascinated by the emotional complexity hidden within formal Victorian prose. As the historian translates coded endearments and reads between carefully constructed sentences, a passionate and surprisingly modern love story emerges from the archives. The research gradually reveals that the couple faced opposition from families and social conventions that made their relationship dangerous to maintain publicly. Drawing unexpected parallels between the historical lovers and a complicated present day relationship, the historian begins understanding that the mysteries of human connection transcend the boundaries of any particular era or social convention.",
    "Warm reflective"
),
("14","09"): (
    "A reserved engineer accustomed to solving problems through logic and careful planning begins working alongside a spontaneous event coordinator whose chaotic approach to organization defies every principle the engineer values. Forced to collaborate on a community project with an immovable deadline, their clashing methods produce spectacular failures and unexpected breakthroughs in equal measure. As the project advances through improvisation and reluctant compromise, the engineer discovers that some of life's most important problems cannot be solved through calculation alone. The gradual transformation from rigid thinker into someone capable of embracing uncertainty reshapes both the project and the engineer's understanding of what makes partnerships genuinely work.",
    "Transformative hopeful"
),
("15","09"): (
    "A charismatic travel influencer builds a massive following by presenting an idealized life of romantic adventures and spontaneous connections with fascinating strangers across beautiful destinations. Behind the carefully curated content, the influencer manages an exhausting schedule of staged encounters and scripted moments designed to maintain the illusion of effortless romance. When a genuine connection develops with someone who refuses to participate in manufactured content, the influencer must choose between protecting a profitable brand built on fantasy and pursuing an authentic relationship that would expose the calculated machinery behind every supposedly spontaneous moment shared with millions of followers.",
    "Reflective cautionary"
),

# --- Genre 10: Horror ---
("04","10"): (
    "A merchant sailor traveling along the trade routes of the Indian Ocean during the fifteenth century agrees to transport unusual cargo for a wealthy patron who insists on absolute secrecy about the contents. Strange occurrences begin during the voyage as crew members report hearing sounds from the sealed hold and experiencing vivid nightmares that share disturbing similarities. When a violent storm forces the ship to anchor near an uncharted island, the merchant discovers connections between the mysterious cargo and ancient warnings carved into stone structures along the shore. The return journey becomes a desperate race to deliver the cargo before its true nature consumes everyone aboard the vessel.",
    "Exploratory reflective"
),
("06","10"): (
    "A former soldier returning home after years of war struggles to adjust to peaceful life in a small European village where neighbors regard the veteran with suspicion and fear. Haunted by memories of battlefield horrors that blur the boundary between past and present, the soldier withdraws into isolation while strange events begin occurring throughout the village. Livestock disappear, shadows move against the wind, and villagers whisper that something followed the soldier home from the war. The desperate search for redemption and normalcy becomes a confrontation with the possibility that the darkness witnessed during years of combat has taken a form that refuses to remain a memory.",
    "Reflective redemptive"
),
("09","10"): (
    "A teenage apprentice working in a printing shop during the Enlightenment era becomes fascinated by forbidden manuscripts that arrive secretly for reproduction. The texts describe rituals and ceremonies that educated society dismisses as superstition, yet the apprentice notices unsettling correlations between the writings and unexplained events occurring throughout the city. As curiosity overcomes caution, the apprentice begins experimenting with instructions found in the manuscripts and discovers that rational explanations cannot account for the results. The coming of age journey from innocent curiosity to dangerous knowledge forces the teenager to confront the terrifying possibility that the world contains forces that reason alone cannot comprehend or control.",
    "Thoughtful hopeful"
),
("10","10"): (
    "A merchant whose family business collapsed due to unfair trade restrictions imposed by a powerful guild discovers evidence that the restrictions were orchestrated to benefit a single rival family with connections to dark practices. Consumed by determination to reclaim what was stolen, the merchant infiltrates the rival's operations and uncovers rituals designed to curse competing businesses and ensure supernatural advantage in commercial affairs. The quest for revenge leads through underground markets, forbidden libraries, and midnight ceremonies where the boundary between justice and obsession dissolves. Each step closer to retribution demands moral compromises that threaten to transform the victim into something far worse than the original persecutor.",
    "Serious determined"
),
("11","10"): (
    "A political prisoner held within a fortified island prison during a period of revolution learns that the facility's deepest chambers contain something the government fears more than any political movement. Fellow inmates whisper about sounds rising from beneath the foundations during storms and guards who venture below returning changed in ways that are difficult to articulate but impossible to ignore. When a violent uprising creates an opportunity to escape through underground passages, the prisoner must navigate tunnels that descend far deeper than any architectural plan suggests, discovering that the prison was built not merely to keep people confined but to keep something ancient and patient from reaching the surface world above.",
    "Tense suspenseful"
),
("12","10"): (
    "A physician working in a city suffering from repeated outbreaks of infectious disease during the nineteenth century notices that certain neighborhoods remain mysteriously untouched while surrounding areas are devastated. Investigating the anomaly reveals that protected residents participate in secret gatherings where offerings are made to entities the physician's scientific training insists cannot exist. When the next outbreak threatens to destroy the entire city, the physician must choose between maintaining rational principles and participating in rituals that demand a terrible personal sacrifice. The decision to protect thousands of lives through means that violate every scientific conviction becomes a haunting examination of what people will surrender when facing annihilation.",
    "Noble determined"
),
("13","10"): (
    "A historian reviewing diplomatic archives decades after a major international conflict notices subtle inconsistencies in official accounts of a series of unexplained deaths that occurred near battlefield sites long after fighting had ended. Military records attribute the deaths to disease or accident, but witness testimonies collected in private journals describe phenomena that defy rational explanation. The investigation leads through sealed government files, interviews with elderly survivors, and visits to locations where the ground itself seems to resist examination. What emerges is evidence of something that fed upon the violence of war and continued operating long after the conflict was officially declared finished.",
    "Investigative revealing"
),
("14","10"): (
    "A merchant raised within a strict trading guild begins questioning the rigid rules that control who may sell particular goods in specific districts of a medieval city. Breaking tradition by exploring forbidden market areas after dark, the merchant encounters traders dealing in items that seem to shift and change when observed from different angles. Prolonged exposure to these impossible objects gradually alters the merchant's perception of reality, revealing hidden dimensions of the city that ordinary citizens never see. The transformation from obedient guild member into someone who perceives the world differently carries a cost that grows more severe with each new layer of understanding that replaces comfortable ignorance.",
    "Reflective transformative"
),
("15","10"): (
    "A charismatic political advisor rises rapidly within the court of a powerful monarch by demonstrating an uncanny ability to predict rivals' movements and manipulate outcomes of delicate negotiations. Courtiers whisper about the source of such extraordinary insight while the advisor accumulates influence that rivals the monarch's own authority. Behind the public success, the advisor maintains a secret practice involving communion with entities that provide information in exchange for increasingly disturbing favors. When the demands escalate beyond what any ambitious person should accept, the advisor discovers that power borrowed from darkness accrues interest that must eventually be paid in full, and the price has already grown far beyond what can be survived.",
    "Dramatic cautionary"
),

# --- Genre 11: Mystery ---
("11","11"): (
    "Workers employed in a remote mining operation discover that their employer intends to abandon the camp without providing transportation back to civilization. Stranded in an isolated region with limited supplies and deteriorating equipment, the workers begin investigating why the company would sacrifice an apparently profitable operation. Their search through administrative offices and sealed storage areas reveals evidence of mineral deposits far more valuable than anything listed in official reports. As the workers piece together the true purpose of the operation and the reason for its sudden abandonment, they realize that someone has gone to extraordinary lengths to ensure that whatever was discovered in the deepest tunnels remains permanently buried and forgotten.",
    "Tense suspenseful"
),
("13","11"): (
    "A historian researching early exploration routes begins studying several incomplete maps created by cartographers who traveled through uncharted territories and never returned to publish their findings. Comparing fragmentary sketches with modern geographical surveys reveals that multiple explorers independently documented the same hidden region using different approaches from different starting points across several decades. As the historian reconstructs the complete picture from overlapping fragments, a pattern emerges suggesting that the region contains something that repeatedly attracted explorers while simultaneously preventing any of them from successfully reporting what they found. The mystery deepens when contemporary satellite imagery of the area shows unexplained anomalies that match descriptions in the centuries old cartographic notes.",
    "Mysterious investigative"
),
("14","11"): (
    "A cautious accountant who has never traveled beyond familiar city streets suddenly inherits responsibility for settling the estate of a distant relative who lived in a remote coastal village and maintained extensive correspondence with people across dozens of countries. Sorting through financial records, personal journals, and cryptic letters reveals that the relative operated a private investigation service that specialized in cases too unusual for conventional authorities to pursue. The accountant's methodical skills prove unexpectedly valuable for understanding the interconnected mysteries left unresolved at the relative's death. The transformation from sheltered number keeper into reluctant investigator uncovers not only the truth about the relative's secret life but capabilities within the accountant that decades of routine work had successfully concealed.",
    "Reflective transformative"
),
("15","11"): (
    "A charismatic expedition leader becomes famous for organizing daring journeys into some of the world's most dangerous and unexplored regions, attracting wealthy sponsors and media attention with each successful venture. The leader's reputation for fearless discovery inspires a generation of adventurers who model their careers on the celebrated example. Behind the public image, however, mounting evidence suggests that several expeditions involved fabricated discoveries and staged encounters designed to maintain funding and public interest. When a former team member publishes detailed accusations supported by photographic evidence and journal entries, the dramatic collapse of the expedition leader's reputation reveals how easily ambition and fame can corrupt the pursuit of genuine knowledge.",
    "Dramatic cautionary"
),

# --- Genre 14: Superhero ---
("07","14"): (
    "A respected professor known for publicly dismissing supernatural beliefs as misunderstood psychology suddenly develops abilities that contradict every rational argument previously championed in academic lectures and published papers. Initial attempts to explain the powers through scientific frameworks fail as the abilities grow stronger and more difficult to conceal from colleagues and students. The professor's public identity as a voice of reason conflicts increasingly with private reality until maintaining the deception becomes impossible. The tragic arc from celebrated intellectual to isolated figure unable to reconcile personal experience with professional conviction demonstrates how rigidly held beliefs can become prisons when reality refuses to conform to expectations that once seemed unshakeable.",
    "Bleak tragic"
),
("14","14"): (
    "A wildlife photographer documenting animal behavior deep within a protected forest reserve begins experiencing physical changes after prolonged exposure to an unusual electromagnetic phenomenon concentrated in a remote valley. Heightened senses and reflexes initially seem beneficial for capturing rare footage, but the transformation accelerates beyond anything that could be considered an improvement. As the photographer's body adapts to the forest environment in increasingly alarming ways, the boundary between human observer and wild creature begins dissolving permanently. The unsettling journey from ordinary person to something fundamentally different raises questions about whether transformation that cannot be reversed should be considered a gift or a catastrophic loss of everything that once defined a recognizable human identity.",
    "Unsettling transformative"
),

# --- Genre 15: Historical ---
("04","15"): (
    "An investigative journalist boards a cargo vessel traveling along a remote shipping corridor to document working conditions among international merchant crews. The voyage becomes unexpectedly dangerous when the ship diverts from its registered route and enters restricted waters where unauthorized vessels have been reported missing for months. Cut off from communication and surrounded by crew members who refuse to explain the change in course, the journalist begins documenting evidence of a smuggling operation that connects legitimate shipping companies to illegal arms trafficking across several continents. The return to familiar shores carries not only an explosive story but the lasting awareness that ordinary commerce conceals networks of violence operating beyond the reach of international oversight.",
    "Atmospheric tense"
),
("05","15"): (
    "A federal investigator begins examining a series of coordinated cyberattacks targeting infrastructure systems across multiple European nations during a period of escalating political tension. Initial evidence points toward state sponsored hackers, but deeper analysis reveals that the attacks originate from a private technology consortium operating across borders without allegiance to any government. As the investigator traces the consortium's financial networks and identifies key operatives, the scope of the threat becomes clear. The organization possesses the capability to disable critical systems across entire regions and has been quietly demonstrating this power to coerce political leaders into accepting demands that would reshape continental governance for generations to come.",
    "High stakes suspense"
),
("06","15"): (
    "A former corporate security consultant who left the profession after exposing corruption within a defense contractor struggles to rebuild a meaningful career while living under constant surveillance from former employers seeking retribution. When evidence surfaces connecting the same contractor to ongoing illegal weapons sales that threaten regional stability, the consultant must decide whether to risk everything again by cooperating with investigators who offer no guarantees of protection. The painful journey from disillusioned whistleblower back into active confrontation with dangerous adversaries becomes a story of reluctant rebirth, as the consultant discovers that walking away from injustice provides no lasting peace when the consequences of silence continue harming innocent people.",
    "Suspenseful determined"
),
("07","15"): (
    "A celebrated financial strategist rises quickly within an influential investment firm by developing algorithms that predict market movements with extraordinary accuracy. Governments and corporations compete for access to the strategist's analysis, rewarding increasingly aggressive recommendations that generate enormous profits while destabilizing vulnerable economies. Over time the strategist becomes consumed by the intellectual challenge of manipulating markets, ignoring warnings from colleagues who recognize the human cost of each calculated disruption. When a major prediction triggers a financial crisis that devastates millions of lives and attracts criminal investigation, the dramatic fall from genius innovator to international pariah reveals how brilliance without conscience inevitably produces catastrophe.",
    "Dark dramatic"
),
("08","15"): (
    "A group of inexperienced documentary filmmakers decides to follow a retired private investigator attempting one final case involving a decades old unsolved disappearance from a small farming community. The filmmakers expect a quiet character study but instead encounter a series of increasingly absurd complications including uncooperative witnesses, malfunctioning equipment, a rival podcast team covering the same case, and the investigator's tendency to dramatically reconstruct crime scenes using reluctant local volunteers. As the production spirals into chaos and the budget evaporates, the crew discovers that the most entertaining story is not the original mystery but the spectacular incompetence of everyone involved in trying to solve it.",
    "Darkly humorous suspense"
),
("09","15"): (
    "A college student studying international relations takes a summer internship at a diplomatic archive expecting tedious clerical work cataloging old correspondence and treaty documents. Instead the student discovers that several classified files have been misfiled among routine papers, revealing secret negotiations between governments that publicly claimed to be adversaries during a critical period of modern history. Reporting the discovery triggers unexpected attention from intelligence agencies still concerned about the implications of the hidden agreements. The summer that was supposed to provide professional experience becomes a rapid education in how political power actually operates behind the public narratives taught in university classrooms and how quickly idealism confronts uncomfortable realities.",
    "Tense coming of age"
),
("10","15"): (
    "A journalist whose investigative reporting exposed a powerful criminal organization receives anonymous evidence suggesting that the prosecution built its case partly on fabricated testimony provided by informants working for a rival criminal network. Haunted by the possibility that innocent people were convicted based on the flawed investigation the journalist helped publicize, a determined effort begins to verify every piece of evidence and interview every witness who contributed to the original case. The relentless pursuit of truth leads through courtrooms, prisons, and neighborhoods controlled by people who consider the journalist both a threat and a target deserving of permanent silence.",
    "Relentless dramatic"
),
("11","15"): (
    "A group of scientists working in a high security research facility realizes that their employer has been secretly weaponizing discoveries originally funded as civilian medical research. Internal communications reveal that the company intends to destroy all evidence of the original humanitarian purpose and silence anyone who might object to the military applications being developed in hidden laboratories. When security protocols tighten and personal communications are monitored, the scientists must devise an escape plan that allows them to carry proof of the deception past armed guards, surveillance systems, and a corporate structure designed to ensure that nothing leaves the facility without explicit authorization from executives who have every reason to prevent the truth from reaching the public.",
    "Claustrophobic suspense"
),
("12","15"): (
    "A veteran rescue pilot operating humanitarian missions in remote disaster zones learns that military forces are planning to destroy a refugee corridor to prevent enemy combatants from using it as an escape route. The corridor shelters thousands of civilians who have no alternative path to safety and no knowledge of the impending attack. Knowing that official channels will delay action until the decision becomes irreversible, the pilot organizes an unauthorized evacuation using borrowed aircraft and volunteer crews willing to risk court martial. The desperate mission to save lives that military strategy has deemed expendable becomes a test of whether individual conscience can justify defiance of legitimate authority when the consequences of obedience are measured in human lives.",
    "Heroic suspense"
),
("13","15"): (
    "A data analyst reviewing historical intelligence files for a government archive discovers patterns in decades old surveillance reports that suggest a long running covert operation was conducted against domestic civilian organizations rather than the foreign targets described in official records. Cross referencing agent identifiers, operational budgets, and target descriptions reveals a systematic effort to infiltrate and disrupt political movements that posed no security threat but challenged policies favored by powerful officials. The methodical investigation through layers of classification and redaction gradually reconstructs an operation that those responsible believed would remain permanently hidden beneath the bureaucratic machinery of national security secrecy.",
    "Investigative mysterious"
),
("14","15"): (
    "A technology entrepreneur known for developing advanced artificial intelligence systems begins questioning the ethical implications of products already deployed across law enforcement, healthcare, and financial industries. Internal testing reveals that the algorithms perpetuate biases their designers never intended, producing outcomes that disproportionately harm vulnerable communities while generating enormous profits for corporate clients. The transformation from celebrated innovator to vocal critic of the industry personally created requires sacrificing professional relationships, financial security, and the comfortable certainty that technological progress inherently serves human welfare. The journey from confident builder to conflicted reformer reveals how difficult it becomes to correct systems that have already been woven into the foundations of institutional decision making.",
    "Strategic suspenseful"
),
("15","15"): (
    "A charismatic political strategist rises rapidly within national leadership circles by demonstrating exceptional skill in crafting public messages that unite fractured coalitions and win elections considered unwinnable by conventional analysts. Early victories attract powerful allies who encourage increasingly aggressive tactics involving media manipulation, opposition research, and strategic leaks designed to destroy political rivals before they can mount effective campaigns. As influence grows, the strategist becomes essential to a political machine that cannot function without the calculated dishonesty that produces its victories. The eventual exposure of the methods behind the success transforms the celebrated architect of political triumph into a cautionary figure whose fall illustrates how democratic systems can be undermined by the very people who claim to serve them.",
    "Political dramatic"
),

# --- Genre 16: War ---
("07","16"): (
    "A respected museum curator gains fame for acquiring rare military artifacts and expanding public understanding of wartime history through exhibitions that attract international attention and scholarly praise. Behind the celebrated reputation, the curator increasingly relies on questionable methods to obtain contested objects from regions still recovering from conflict, justifying ethically dubious acquisitions as necessary for historical preservation. When a collection of disputed artifacts is traced to communities that consider them sacred cultural property stolen during wartime chaos, the resulting scandal destroys decades of carefully built credibility. The tragic descent from honored cultural guardian to disgraced profiteer demonstrates how easily noble intentions become corrupted when institutional prestige matters more than the human stories behind the objects displayed.",
    "Somber dramatic"
),
("09","16"): (
    "A curious teenager helping in a family owned bookstore begins noticing unusual patterns in the reading habits of regular customers during a period of increasing political tension that eventually leads to armed conflict. Military officers purchase specific technical manuals, elderly residents quietly request books about survival and resistance movements, and strangers arrive asking for titles that seem coded rather than literary. As the teenager observes these patterns and connects them to events unfolding outside, the bookstore becomes an unexpected window into how an entire community prepares for war. The experience of watching ordinary customers transform into participants in a conflict they cannot avoid becomes a profound coming of age lesson about the fragility of peaceful life.",
    "Curious coming of age"
),
("10","16"): (
    "A private investigator is hired to locate a missing heir whose inheritance could determine control of a manufacturing empire that supplied military equipment during a recent war. The search leads through government records, military bases, and communities displaced by the conflict, revealing that the heir deliberately disappeared after witnessing atrocities committed using equipment produced by the family business. Each interview uncovers deeper layers of guilt, complicity, and the desire for justice that motivate both those seeking the heir and the heir's determination to remain hidden. The investigation becomes a tense confrontation between the demands of wealth and the moral consequences of profiting from warfare.",
    "Tense investigative"
),
("11","16"): (
    "Passengers aboard a late night ferry crossing a wide harbor during wartime discover that a valuable military intelligence document has been hidden among civilian luggage by an operative attempting to smuggle it past enemy checkpoints. When military police board the vessel and announce that no one will be permitted to leave until the document is recovered, passengers must navigate divided loyalties, personal secrets, and the terrifying possibility that cooperating with authorities could endanger family members living in occupied territory. The contained environment of the ferry transforms an ordinary crossing into a pressure chamber where every conversation carries risk and trust becomes the most dangerous commodity available.",
    "Contained suspense"
),
("12","16"): (
    "A small town mayor reviewing municipal archives during wartime notices that several long standing community traditions were originally established to honor sacrifices made by residents during previous conflicts that have since been forgotten by younger generations. Determined to preserve this heritage before another cycle of violence erases the remaining connections between past and present, the mayor organizes a public commemoration that brings together veterans, families, and historians. The effort to honor collective sacrifice reveals painful disagreements about which stories deserve remembering and whose losses have been deliberately minimized, transforming a simple memorial project into a community's difficult reckoning with the unequal ways war is remembered and mourned.",
    "Quiet thoughtful"
),
("13","16"): (
    "A university researcher analyzing historical census records discovers that an entire regiment listed as casualties during a major battle actually survived and was secretly transferred to a classified operation that official military histories never acknowledged. Tracing personnel files, transport logs, and coded communications reveals that the soldiers were reassigned to a covert mission whose objectives remain classified decades after the war ended. Interviews with elderly family members who were told their relatives died in combat produce emotional confrontations with institutional deception. The methodical investigation gradually reconstructs a hidden chapter of military history that challenges the official narrative of a conflict the nation believed it understood completely.",
    "Investigative methodical"
),
("14","16"): (
    "A forensic accountant hired to audit a regional military charity organization expects to find routine administrative inefficiencies common to wartime nonprofits operating under pressure. Instead the audit reveals a sophisticated financial structure designed to redirect donated funds through multiple intermediary organizations before reaching accounts controlled by individuals with no connection to charitable work. As the accountant traces the money through increasingly complex transactions, the investigation exposes a network that exploited public generosity during wartime to enrich private interests while genuine relief efforts struggled for resources. The analytical pursuit of financial truth transforms the cautious accountant into someone willing to confront powerful figures who assumed their scheme was too complicated for anyone to unravel.",
    "Analytical suspense"
),
("15","16"): (
    "A celebrated novelist known for writing detailed wartime narratives becomes the subject of controversy when a military historian publishes evidence that several key scenes presented as based on firsthand accounts were actually fabricated from secondhand sources and imaginative reconstruction. The accusation threatens to discredit an entire body of work that influenced public understanding of the conflict and shaped memorial policies adopted by national institutions. As the novelist struggles to defend artistic choices made decades earlier while confronting legitimate questions about the boundary between historical fiction and dishonest representation, the public debate reveals uncomfortable truths about how societies construct narratives of war that serve emotional needs rather than factual accuracy.",
    "Literary suspense"
),

# --- Genre 17: Biography ---
("10","17"): (
    "A former police officer forced out of the department after exposing corruption among senior leadership begins writing a memoir documenting the investigation that ended a promising career. The writing process requires revisiting painful memories of betrayal by trusted colleagues and institutional retaliation designed to discredit the allegations before they reached public attention. As the manuscript takes shape, former informants contact the writer with additional evidence suggesting the corruption extended far beyond what the original investigation uncovered. The biographical project transforms from personal catharsis into a comprehensive account of systemic failure that threatens powerful individuals who believed their secrets were permanently buried when the investigating officer was removed from the force.",
    "Driven suspenseful"
),
("12","17"): (
    "An undercover detective successfully infiltrates a sophisticated criminal organization over several years, building relationships with members who trust the detective completely while providing intelligence that allows law enforcement to dismantle operations responsible for widespread harm. The biographical account of the mission reveals the psychological toll of maintaining a false identity for years while watching criminal associates commit acts of violence that the detective could not prevent without compromising the larger investigation. When the operation concludes and the detective must transition back to ordinary life, the narrative confronts the devastating personal cost of sacrifice performed in secrecy, where the people protected will never know the name of the person who gave up years of authentic life to keep them safe.",
    "High tension"
),
("13","17"): (
    "A financial data analyst working for a regulatory agency discovers an unusual pattern of transactions connecting several charitable foundations to offshore accounts managed by individuals with no apparent philanthropic history. The biographical investigation traces the analyst's methodical journey from routine compliance review to full scale forensic examination of a financial network designed to launder money through organizations that genuinely serve vulnerable communities. Each layer of the scheme reveals greater sophistication and deeper connections to political figures who publicly champion the very charitable causes being exploited for personal enrichment. The analyst's determination to follow the evidence regardless of professional consequences becomes a testament to the power of patient methodical inquiry against institutionalized corruption.",
    "Investigative analytical"
),
("14","17"): (
    "A talented hacker initially drawn into cybercrime out of curiosity becomes involved in operations that cause genuine harm to ordinary people whose financial accounts and personal information are compromised by sophisticated intrusion techniques. The biographical account traces the gradual moral awakening that occurs when the hacker begins encountering the human consequences of digital crimes previously viewed as abstract technical challenges. The transformation from skilled criminal to cooperative witness requires navigating dangerous relationships with former associates who view betrayal as a capital offense. The narrative documents how someone embedded in a world that rewards technical brilliance regardless of ethical implications finds the courage to change direction when the full weight of personal responsibility becomes impossible to rationalize away.",
    "Moral suspense"
),

# --- Genre 19: Young Adult ---
("09","19"): (
    "A teenager lying about age to enlist in the military quickly discovers that battlefield reality bears no resemblance to the heroic stories that inspired the deception. Training exercises reveal the physical and emotional demands that separate romantic notions of combat from the grinding discipline required to survive. Friendships formed under pressure become the most meaningful relationships the teenager has ever experienced, while letters from home arrive describing a civilian world that feels increasingly distant and irrelevant. The coming of age journey from naive volunteer to hardened young soldier forces a reckoning with the permanent changes that violence inflicts on everyone it touches, regardless of which side they serve or how noble their original intentions seemed.",
    "Somber coming of age"
),
("10","19"): (
    "A soldier whose hometown was destroyed during the early stages of a conflict becomes driven by a consuming need to identify and confront those responsible for the attack that killed family members and destroyed everything familiar. Military leadership channels this intensity into dangerous reconnaissance missions that exploit the soldier's willingness to accept risks others refuse. As the war progresses and the soldier advances through increasingly hostile territory, intelligence gathered along the way reveals that the destruction of the hometown was not a military objective but a calculated provocation designed to generate exactly the kind of vengeful determination now being weaponized by commanders pursuing their own strategic agenda.",
    "Driven dramatic"
),
("11","19"): (
    "A group of captured soldiers held in a remote prison camp begins secretly organizing an escape plan after discovering that guards are preparing to transfer all prisoners to a facility from which no one has ever returned. Limited tools, constant surveillance, and informants among the prisoner population make planning extraordinarily dangerous. Each member of the escape group contributes specialized knowledge ranging from engineering to language skills while managing the psychological strain of trusting others with information that could result in execution if revealed. The desperate effort to break free before the transfer deadline arrives forces ordinary soldiers to demonstrate courage and creativity that peacetime life never required or revealed.",
    "High tension suspense"
),
("12","19"): (
    "A military engineer overseeing the construction of defensive structures along a contested border learns that the fortifications are designed to protect a strategic retreat rather than the civilian population living in the surrounding communities. Refusing to accept that thousands of families will be abandoned when the withdrawal begins, the engineer secretly modifies construction plans to create concealed evacuation routes that civilians can use when the military pulls back. The dangerous deception requires maintaining two sets of blueprints while convincing suspicious officers that all modifications serve legitimate military purposes. The willingness to risk court martial and execution to protect people the military has written off becomes a quiet act of sacrifice that may never be publicly acknowledged or understood.",
    "Heroic somber"
),
("13","19"): (
    "An intelligence analyst reviewing intercepted communications notices subtle inconsistencies between official military reports and the actual content of enemy transmissions being decoded in the signals facility. The discrepancies suggest that someone within the intelligence chain is deliberately altering translations to misrepresent enemy intentions, potentially influencing strategic decisions that affect thousands of soldiers in the field. As the analyst quietly compares original intercepts with sanitized versions distributed to commanding officers, the investigation reveals a conspiracy motivated by political objectives that have nothing to do with winning the war. The methodical pursuit of truth through classified channels becomes a solitary mission where exposing the deception could save lives on the battlefield while destroying the analyst's career and personal safety.",
    "Investigative suspense"
),
("14","19"): (
    "A civilian journalist embedded with a military unit to document wartime events is profoundly changed by witnessing the daily reality of soldiers navigating impossible moral choices under conditions that civilians cannot comprehend from the safety of distant cities. The experience of sharing danger, exhaustion, and grief with people who did not choose their circumstances but face them with extraordinary resilience transforms the journalist's understanding of courage, duty, and the inadequacy of language to convey what combat actually demands from human beings. Returning home carrying stories that feel simultaneously urgent and impossible to communicate, the journalist struggles to bridge the gap between those who experienced the war directly and a public that consumes wartime narratives as entertainment without grasping the permanent changes those experiences impose on everyone involved.",
    "Reflective transformative"
),
("15","19"): (
    "A celebrated war hero becomes a national symbol after leading several successful operations that turned the momentum of a prolonged conflict and saved thousands of lives through tactical brilliance and personal bravery that inspired an exhausted military. Political leaders embrace the hero's image for recruitment campaigns and morale building efforts that elevate the individual far beyond any single person's actual contribution to the war effort. When the conflict ends and public attention shifts to reconstruction and accountability, inconvenient details about the celebrated operations emerge revealing that success came at costs that were deliberately hidden from both the public and the soldiers who followed orders based on incomplete information. The fall from national icon to controversial figure illustrates how societies build heroes to serve collective needs and discard them when the truth becomes more complicated than the story requires.",
    "Epic cautionary"
),

# --- Genre 20: Literary Fiction ---
("14","20"): (
    "A quiet office worker who has spent years avoiding personal risk begins attending evening writing workshops at a community center after discovering that expressing private thoughts through fiction provides an unexpected sense of liberation from the carefully constructed routine that has defined adult life. The stories that emerge surprise both the writer and fellow workshop participants with their emotional depth and unflinching examination of fears that the author has never spoken about directly. As the writing practice deepens, the boundary between fictional characters and the author's suppressed desires begins dissolving, creating a transformation that extends beyond the page into daily decisions, relationships, and the fundamental question of whether a life built entirely around safety constitutes living at all or merely an elaborate strategy for avoiding the experiences that give existence genuine meaning.",
    "Transformative"
),

# --- Genre 21: Children's Literature ---
("06","21"): (
    "A stubborn child known for causing trouble around school is given the task of caring for the class garden after accidentally destroying several plants during a careless moment of frustration. Initially resentful of the punishment, the child begins learning about the patience required to nurture growing things and discovers an unexpected talent for understanding what different plants need to thrive. As the garden transforms from neglected patch to flourishing space that the entire school enjoys visiting, the child's reputation gradually shifts from troublemaker to someone trusted with responsibility. The gentle process of rebuilding something that was broken becomes a story about how caring for others, even small growing things, can transform the person doing the caring in ways that no amount of lecturing or punishment could ever accomplish.",
    "Gentle and redemptive"
),
("07","21"): (
    "A talented young performer becomes the most admired student in a school talent competition by mastering increasingly difficult routines and attracting attention from teachers and peers who previously ignored the quiet child. The excitement of recognition creates pressure to maintain a standard of excellence that gradually replaces genuine enjoyment with anxiety about failing to meet expectations that continue rising with each successful performance. When a younger student delivers a simple heartfelt performance that moves the audience more deeply than any technical display, the talented performer confronts the painful realization that pursuing admiration has replaced the original love of performing that made the talent meaningful. The reflective story explores how early success can become a burden when children learn to measure their worth through the approval of others rather than the satisfaction of doing something they genuinely love.",
    "Reflective and cautionary"
),
("08","21"): (
    "When a series of misunderstandings spreads through a classroom about a missing art project, each student develops a completely different theory about what happened based on the limited evidence available to them. The teacher decides to let the class investigate the mystery together rather than simply revealing the answer, turning the situation into a lesson about how people interpret the same facts differently depending on their perspectives and assumptions. As the children interview witnesses, examine clues, and debate competing theories with passionate conviction, the investigation produces more confusion than clarity until a quiet student points out that everyone has been looking at the evidence from only one direction. The playful resolution teaches that solving problems often requires listening to people who see the world differently rather than insisting that your own perspective contains the complete truth.",
    "Playful and lighthearted"
),
("09","21"): (
    "A child preparing to move away from a familiar neighborhood spends the final summer visiting every favorite place and saying goodbye to friends who have been part of daily life for as long as memory reaches. Each visit produces a mixture of happiness about shared experiences and sadness about leaving them behind, creating emotions that feel larger and more confusing than anything the child has previously encountered. A wise older neighbor suggests creating a memory book that captures not just photographs but the stories and feelings associated with each place and person. The project of preserving important memories becomes a way of understanding that growing up means learning to carry the people and places you love inside yourself even when physical distance makes daily contact impossible.",
    "Warm and reflective"
),
("10","21"): (
    "A quiet child becomes determined to solve a mystery involving a classmate who seems sad every afternoon despite appearing cheerful during morning classes. Through careful observation and gentle questions asked during recess and lunch periods, the child discovers that the classmate is struggling with a difficult situation at home that no adult at school has noticed because the classmate has learned to hide unhappiness behind practiced smiles. Rather than telling teachers immediately, the child finds ways to offer friendship and support that make the difficult afternoons more bearable. The thoughtful story explores how children can help each other through simple acts of attention and kindness that adults sometimes overlook because they are too busy measuring success through grades and behavior rather than emotional wellbeing.",
    "Thoughtful and serious"
),
("11","21"): (
    "Several children discover that the old storage shed behind their school has accidentally been locked with their science project supplies trapped inside just days before the regional competition that the entire class has been preparing for throughout the semester. With adults unavailable to help until the following day, the children must find creative ways to retrieve their materials using only the tools and resources available to them on the playground and in their backpacks. Each failed attempt teaches the group something new about problem solving and teamwork while producing moments of frustration that test friendships. The encouraging story demonstrates that working together through setbacks builds stronger bonds than easy success and that the most valuable lessons often come from the obstacles encountered along the way rather than from the final result achieved.",
    "Tense but encouraging"
),
("12","21"): (
    "A young girl notices that her elderly neighbor struggles to maintain a beautiful garden that was once the pride of the entire street but has gradually declined as age makes physical work increasingly difficult. Without being asked, the girl begins visiting after school to help with simple tasks like watering flowers and pulling weeds, asking questions about each plant's history and learning stories about the garden that span decades of careful cultivation. Other children from the neighborhood notice and begin joining the effort, transforming the solo project into a community activity that brightens the elderly neighbor's days. The compassionate story shows how small acts of generosity freely offered can restore dignity and connection while teaching young people that caring for others creates a kind of happiness that receiving gifts and prizes can never match.",
    "Kind and compassionate"
),
("13","21"): (
    "A curious child finds an old puzzle box hidden in an attic that opens only when specific patterns are followed in a precise sequence that changes each time a wrong attempt is made. Determined to discover what the box contains, the child recruits friends who each bring different skills to the challenge including one who excels at patterns, one who understands mechanical devices, and one whose patience keeps the group focused during frustrating setbacks. As the children work together across several afternoons, the process of solving the puzzle teaches them more about cooperation and persistence than any classroom lesson could provide. The mysterious story celebrates the joy of intellectual challenge and the discovery that some of the best adventures involve sitting in a dusty attic with trusted friends working toward a shared goal that nobody else considers important.",
    "Curious and mysterious"
),
("14","21"): (
    "A timid child who avoids trying new activities joins a school club focused on building and launching small model rockets after a patient teacher explains that failure is simply the first step in every successful design process. Early attempts produce spectacular crashes that the child initially finds humiliating until classmates share their own histories of failed launches and the creative solutions they developed through repeated experimentation. Gradually the child begins contributing design ideas and testing modifications with increasing confidence, discovering that the willingness to fail publicly and learn from mistakes is not weakness but the essential skill that separates people who create things from those who only watch. The inspiring story demonstrates that transformation begins when someone decides that the risk of embarrassment is smaller than the cost of never discovering what they are capable of building.",
    "Encouraging and inspiring"
),
("15","21"): (
    "A young prodigy praised for academic achievements begins believing that intelligence alone determines success and treats classmates who struggle with subjects that come easily to the prodigy with poorly concealed impatience. When a group project requires skills the prodigy lacks including artistic ability, athletic coordination, and the social awareness needed to organize a team of people with different strengths, the limitations of relying solely on intellectual talent become painfully obvious. Classmates who were previously dismissed demonstrate capabilities the prodigy never valued because they could not be measured by tests or grades. The reflective story illustrates how early recognition of one kind of talent can create a dangerous blindness to the many other forms of intelligence that make communities function and that no single person, however gifted, can succeed without the contributions of others whose abilities complement their own.",
    "Reflective and cautionary"
),

# --- Genre 22: Satire ---
("06","22"): (
    "A once notorious gossip columnist decides to reform and write responsible journalism after years of profiting from exposing private embarrassments of public figures. The transformation proves unexpectedly difficult as editors demand the sensational content that drives readership while sources refuse to believe the columnist's intentions have genuinely changed after decades of exploitative behavior. Every attempt to write substantive stories is undermined by a reputation that makes interview subjects suspicious and colleagues dismissive of the sudden ethical conversion. The bitterly ironic journey reveals that rebuilding credibility destroyed through years of deliberate harm requires far more effort than destroying it ever did, and that genuine rebirth demands accepting consequences that extend well beyond simply deciding to become a better person.",
    "Bitterly ironic"
),
("07","22"): (
    "A celebrated corporate executive publishes a bestselling memoir describing the sacrifices required to build a global business empire, presenting personal ruthlessness as visionary leadership and destroyed relationships as necessary costs of greatness. Speaking tours and media appearances amplify the narrative while employees and former partners recognize themselves in unflattering depictions that rearrange facts to serve the executive's carefully constructed legacy. When a ghostwriter reveals that significant portions of the memoir were fabricated to transform professional failures into inspiring lessons about persistence, the public reaction exposes how eagerly society celebrates success stories without questioning whether the storyteller's version of events bears any relationship to what actually happened. The sharp critique demonstrates that tragedy in the modern world often wears the disguise of motivational literature.",
    "Sharp critical"
),
("08","22"): (
    "A city launches an ambitious initiative to eliminate confusion by standardizing every form of public communication including street signs, official documents, and public announcements into a single optimized format designed by a committee of efficiency consultants. The results immediately produce the opposite effect as citizens struggle to navigate systems that replace familiar conventions with technically superior but practically incomprehensible alternatives. Bus routes become algebraic expressions, park names are replaced with geographic coordinates, and public meetings require certification in the new communication standard before participants may speak. The escalating absurdity of organizing confusion out of existence through increasingly complex organizational schemes becomes a gentle satire of institutional tendencies to solve simple problems by creating elaborate systems that nobody except their designers can understand or operate.",
    "Light bureaucratic humor"
),
("09","22"): (
    "A teenager determined to become famous studies social media trends and begins carefully constructing an online persona designed to attract maximum attention through controversial opinions expressed with calculated intensity. The strategy works faster than expected, generating followers, media interviews, and sponsorship offers that transform an ordinary student into a recognized public figure before graduating from high school. Behind the manufactured controversy the teenager maintains a completely different private personality that bears no resemblance to the provocative character performed online. When maintaining the double identity becomes exhausting and the gap between public performance and private reality begins causing genuine psychological distress, the teenager faces the unsettling discovery that the fictional character has become more real to the world than the actual person who created it ever was.",
    "Playful reflective"
),
("10","22"): (
    "An employee overlooked for promotion becomes convinced that revenge against the responsible manager requires an elaborate campaign of subtle professional sabotage executed with patience and precision over months of careful planning. The strategy involves redirecting important emails, scheduling conflicting meetings, and introducing minor errors into the manager's reports that are individually insignificant but collectively devastating to the manager's reputation. As the campaign progresses and the manager's authority gradually erodes, the vengeful employee discovers that the original promotion decision was based on a bureaucratic error that has since been corrected and the position is now being offered. The darkly comic realization that months of meticulous revenge were directed at an entirely innocent target becomes a satirical examination of how grudges sustained through careful nurturing can outlive the grievances that created them.",
    "Darkly comic"
),
("11","22"): (
    "Workers trapped inside an endlessly reorganized office building attempt to escape management's latest efficiency initiative which requires all employees to follow color coded pathways between designated activity zones according to a schedule that changes every forty five minutes. Navigation becomes increasingly surreal as departments are relocated overnight, familiar corridors are rerouted through storage areas, and elevator access requires solving productivity puzzles displayed on touchscreen panels. The workers' various escape strategies ranging from forging executive credentials to constructing alternative pathways through ventilation systems produce chaotic confrontations with enthusiastic compliance officers who genuinely believe the system improves workplace happiness. The humorous struggle against cheerfully imposed absurdity becomes a satire of corporate wellness culture that addresses employee dissatisfaction by making the workplace more complicated rather than more humane.",
    "Chaotic humorous"
),
("12","22"): (
    "A politician announces a dramatic personal sacrifice by promising to temporarily adopt the lifestyle of the city's poorest residents to understand their daily challenges and demonstrate authentic commitment to social reform. Media coverage transforms the stunt into a national event as cameras follow the politician through public housing, discount grocery stores, and overcrowded public transportation that the official has never previously used. Advisors stage encounters with photogenic families while carefully avoiding neighborhoods where genuine poverty might produce uncomfortable footage. The ironic spectacle of wealth performing poverty for political advantage while actual poor residents watch the performance from their unchanged circumstances becomes a pointed satire of how political systems convert real suffering into theatrical opportunities that benefit everyone except the people whose lives supposedly inspired the gesture.",
    "Ironic political"
),
("13","22"): (
    "A journalist investigating a supposed conspiracy within a cultural institution discovers that the alleged cover up is actually an elaborate marketing campaign designed to generate controversy that increases public interest in an otherwise unremarkable exhibition. Every suspicious detail the journalist uncovers leads to another layer of deliberate misdirection planted by a publicity firm specializing in manufacturing scandals for clients who need attention more than authenticity. As the investigation proceeds through planted documents, scripted whistleblower interviews, and carefully staged confrontations, the journalist faces the deadpan realization that the biggest conspiracy is the manufactured appearance of conspiracy itself. The humorous unraveling reveals how institutional hunger for public attention has created an environment where fabricated controversy generates more revenue than genuine cultural achievement ever could.",
    "Deadpan humorous"
),
("14","22"): (
    "A lifestyle guru famous for promoting extreme productivity methods suddenly realizes that the complex system of morning routines, evening reviews, quarterly goal assessments, and daily optimization metrics has consumed so much time that there are no remaining hours available for actually accomplishing anything productive. Attempts to streamline the productivity system itself generate additional layers of meta optimization that require their own tracking systems and review cycles. Followers who adopted the methodology report similar experiences of being too busy managing their productivity frameworks to do meaningful work. The self aware examination of someone trapped inside a system designed to eliminate wasted time that has itself become the primary source of wasted time offers a gentle critique of contemporary culture's obsession with optimizing processes that were never complicated enough to require optimization.",
    "Self aware irony"
),
("15","22"): (
    "A charismatic startup founder becomes a global celebrity after launching a company that promises to solve complex social problems through innovative technology applications backed by venture capital and relentless optimistic messaging. Media coverage treats every announcement as revolutionary while competitors and critics are dismissed as obstacles to progress by a loyal following that equates enthusiasm with evidence. When independent analysis reveals that the company's core technology performs no better than existing solutions and that most claimed innovations exist only in presentation materials, the public reckoning exposes an entire ecosystem of investors, journalists, and consumers who preferred the excitement of believing in transformative genius to the mundane reality of incremental improvement. The satirical collapse illustrates how charisma combined with sufficient funding can sustain narratives of innovation long after the underlying substance has evaporated.",
    "Satirical dramatic"
),

# --- Genre 23: Psychological ---
("04","23"): (
    "A researcher studying human memory travels to a remote retreat designed to eliminate all external distractions and allow participants to focus exclusively on recovering suppressed experiences through intensive guided meditation techniques. The isolated setting gradually blurs the boundary between recovered memories and vivid imagination as participants begin sharing recollections that overlap in disturbing ways suggesting either remarkable coincidence or collective fabrication driven by the retreat's methodology. As the researcher attempts to maintain scientific objectivity while experiencing increasingly vivid personal memories that may or may not be authentic, the investigation becomes a psychological examination of how desperately people need their memories to be true and how easily that desperation can be manipulated by environments designed to produce specific emotional outcomes rather than verifiable facts.",
    "Atmospheric introspective"
),
("05","23"): (
    "A young musician begins hearing faint melodies while practicing alone late at night in the university's oldest rehearsal building. The compositions are unfamiliar yet extraordinarily beautiful, and attempts to transcribe them produce scores that music theory professors describe as unlike anything in the established repertoire. As the musician spends more time in the building pursuing these phantom compositions, sleep becomes irregular and relationships with classmates deteriorate without apparent cause. The investigation into whether the music originates from an external source or from within the musician's own fragmenting consciousness becomes an eerie examination of creative obsession and the frightening possibility that the most compelling art sometimes emerges from psychological states that the artist cannot sustain without sacrificing the stability required to function in ordinary life.",
    "Eerie reflective"
),
("06","23"): (
    "A once arrogant professor known for humiliating students during lectures begins experiencing episodes of intense self doubt after a former student publishes a memoir describing the lasting psychological damage caused by years of academic bullying. Initially dismissing the account as exaggerated, the professor gradually recognizes patterns of behavior that extend far beyond a single student and include colleagues, family members, and friends who silently endured similar treatment for decades. The painful process of confronting a lifetime of cruelty disguised as intellectual rigor demands rebuilding relationships with people who have every reason to refuse reconciliation. The somber exploration of whether genuine transformation is possible after inflicting sustained harm examines the difficult boundary between accountability and redemption when the damage has already shaped other people's lives in permanent ways.",
    "Somber reflective"
),
("07","23"): (
    "A successful entrepreneur begins keeping a private journal intended to document brilliant ideas and strategic insights for a future memoir celebrating an extraordinary career built through talent and determination. Instead the journal gradually reveals patterns of manipulation, self deception, and rationalized cruelty that the entrepreneur has never consciously acknowledged. Each entry written to celebrate achievement inadvertently exposes the emotional wreckage left behind by decisions that prioritized success over every human relationship encountered along the way. The dark introspective tragedy of reading one's own unintended confession emerges as the journal becomes a mirror that reflects not the visionary leader the entrepreneur intended to portray but the isolated and increasingly desperate figure that honest self examination inevitably reveals.",
    "Dark introspective"
),
("08","23"): (
    "A group of coworkers attempt to reconstruct a confusing incident that occurred during an office party where someone apparently said something that offended everyone present yet nobody can agree on exactly what was said or who said it. Each participant's account contradicts the others in significant ways while maintaining absolute confidence in the accuracy of their personal recollection. As the investigation expands to include security footage that proves ambiguous and witness statements that become more elaborate with each retelling, the original incident disappears beneath layers of interpretation and emotional investment in competing versions of events. The subtly ironic examination of how groups construct shared narratives from incompatible individual memories becomes an unexpectedly funny meditation on the fragility of truth in social environments where perception consistently defeats fact.",
    "Subtle ironic"
),
("09","23"): (
    "A teenager preparing for adulthood becomes increasingly aware that childhood memories which once seemed perfectly reliable have begun shifting and rearranging themselves in ways that call into question the foundational experiences upon which the teenager's entire sense of identity has been constructed. Conversations with family members reveal that events remembered as pivotal turning points either happened differently than recalled or may not have happened at all in the way anyone currently describes them. The unsettling discovery that personal history is far less stable than it appeared during childhood creates a coming of age crisis that transcends ordinary adolescent uncertainty. The reflective journey through the unreliability of memory forces the teenager to confront the frightening possibility that becoming an adult means accepting that the person you believe yourself to be is built on a foundation that continuously revises itself without permission.",
    "Reflective coming of age"
),
("10","23"): (
    "A scientist convinced that a colleague sabotaged an important research project begins collecting evidence to support a formal accusation that could destroy the colleague's career and reputation within the academic community. The investigation proceeds methodically through laboratory records, email correspondence, and interviews with graduate students who witnessed suspicious behavior during critical phases of the research. Each piece of evidence appears to confirm the scientist's theory until an independent review suggests an alternative explanation that accounts for every observed anomaly without requiring deliberate sabotage. The suspenseful confrontation with the possibility that months of vengeful investigation were driven by professional jealousy rather than genuine evidence forces the scientist to examine whether the desire for revenge created the conspiracy it claimed to discover.",
    "Suspenseful introspective"
),
("11","23"): (
    "Employees working in a high security research facility begin noticing small behavioral changes in colleagues who have recently undergone a new wellness evaluation program mandated by corporate management. The changes are subtle enough to be dismissed individually but collectively create an atmosphere of unease as familiar coworkers begin responding to situations with emotional flatness that seems rehearsed rather than natural. Attempts to discuss the observations are met with reassurance from management that the evaluation program simply helps employees manage workplace stress more effectively. The quietly tense investigation into whether the program is genuinely therapeutic or something more disturbing becomes a psychological examination of how institutions can normalize incremental changes in human behavior until the people being changed no longer recognize or resist the transformation being imposed upon them.",
    "Quietly tense"
),
("12","23"): (
    "A decorated soldier returns home celebrated as a hero but privately struggles with the knowledge that the actions lauded by the public involved moral compromises that no ceremony or medal can resolve. Family members and friends treat the soldier with reverence that makes honest conversation about the war impossible since admitting doubt would betray the narrative that gives the community its sense of pride and meaning. The heavy burden of carrying a public identity built on selective truth while the private self disintegrates under the weight of unspoken guilt creates a psychological crisis that no amount of external validation can address. The reflective examination of sacrifice explores whether the greatest cost of military service may not be physical danger but the permanent inability to share the truth of one's experience with people who need the heroic version to remain intact.",
    "Heavy reflective"
),
("13","23"): (
    "A journalist investigating a long forgotten disappearance becomes obsessed with a case that colleagues and editors consider closed and irrelevant to contemporary readers. The obsession intensifies as each interview with aging witnesses and each visit to locations connected to the disappearance produces emotional responses disproportionate to what professional detachment should allow. The boundary between journalistic investigation and personal identification with the missing person gradually dissolves as the journalist begins making decisions that mirror the subject's final documented movements. The brooding investigation into someone else's vanishing becomes an unwitting examination of the investigator's own desire to disappear from a life that feels increasingly meaningless, raising disturbing questions about whether some mysteries attract certain people because the answers they seek are ultimately about themselves.",
    "Brooding investigative"
),
("14","23"): (
    "A timid accountant begins attending improvisational theater classes to overcome a lifelong fear of spontaneous social interaction that has prevented meaningful relationships and career advancement despite exceptional technical competence. The structured environment of theatrical improvisation provides a safe framework for experimenting with behaviors that feel impossible in ordinary life, gradually revealing a personality that decades of caution had completely suppressed. As the accountant's confidence grows on stage, the emerging persona begins influencing decisions outside the theater in ways that surprise colleagues and family members who believed they understood this person completely. The encouraging but introspective examination of transformation explores whether the personality that emerges through deliberate practice represents the discovery of an authentic self that was always present or the creation of an entirely new identity that will eventually require its own reckoning with the person it replaced.",
    "Encouraging introspective"
),
("15","23"): (
    "A celebrated artist whose early work transformed cultural conversations begins declining creatively as the originality that once defined the work gives way to repetition and self imitation that critics increasingly note with disappointment. Private awareness of the decline creates psychological torment as the artist struggles to reconcile a public identity built on innovation with the private reality that the creative wellspring has been exhausted for years. Attempts to recapture the original spark through travel, collaboration, and radical changes in medium produce increasingly desperate work that audiences receive with polite enthusiasm masking genuine indifference. The melancholic examination of creative mortality explores the particular cruelty of artistic talent that announces its own disappearance to the person who possessed it while the rest of the world continues expecting greatness from someone who knows with terrible certainty that the best work is permanently behind them.",
    "Melancholic reflective"
),

# --- Genre 24: Western ---
("06","24"): (
    "A gambler known throughout several frontier towns for cheating and manipulation arrives in a small settlement intending to exploit the locals before moving on. However witnessing the community's genuine struggle to survive harsh conditions and defend itself against predatory cattle barons stirs something the gambler believed was permanently extinguished by years of cynical self interest. Reluctantly offering skills originally developed for dishonest purposes to help the town organize its defenses and negotiate with threatening interests, the gambler discovers that competence directed toward protecting others provides a satisfaction that winning through deception never achieved. The redemptive transformation from selfish con artist into committed community member demands confronting former associates who arrive expecting the gambler to betray the town and deliver it into the hands of those who intend to take everything its residents have built.",
    "Redemptive reflective"
),
("07","24"): (
    "A charismatic cattle baron rises quickly to power by consolidating ranches and controlling water access throughout a vast territory where smaller operations depend on shared resources that the baron systematically privatizes. Early success brings political influence and social prestige that encourage increasingly ruthless tactics including intimidation of neighboring families and manipulation of territorial officials responsible for enforcing land claims. As the baron's empire expands, the human cost accumulates in abandoned homesteads, displaced families, and former allies who discover that loyalty to a powerful figure provides no protection when that figure's ambitions require their elimination. The somber decline from respected community leader to feared tyrant whose funeral is attended by no one who genuinely mourns demonstrates how frontier power built through exploitation eventually isolates the person who wields it from every relationship worth preserving.",
    "Somber cautionary"
),
("08","24"): (
    "Two neighboring ranch families accidentally ignite a feud after a misunderstanding about fence placement along their shared boundary escalates through a series of retaliatory actions that grow increasingly absurd with each exchange. Livestock are released into carefully maintained gardens, water is redirected through creative irrigation engineering, and formal complaints filed with the territorial land office become so numerous that officials refuse to process additional paperwork from either party. Children from both families who secretly remain friends attempt to mediate while adults stubbornly defend positions that no longer have any connection to the original dispute. The lighthearted frontier comedy demonstrates how pride and stubbornness can transform a trivial disagreement into an epic confrontation that provides entertainment for the entire region while costing both families far more than the fence was ever worth.",
    "Light frontier humor"
),
("09","24"): (
    "A teenager growing up on a remote cattle ranch struggles to understand expectations that seem designed for a previous generation while personal interests and talents point toward a future that has no place in the family's ranching tradition. The conflict between honoring parents who have sacrificed everything to maintain the operation and pursuing opportunities that require leaving the land creates tension that neither side knows how to discuss honestly. When a severe drought threatens the ranch's survival and the teenager's modern knowledge proves valuable for finding solutions that traditional methods cannot provide, a new understanding emerges between generations. The reflective coming of age story explores how frontier values of independence and self reliance apply differently across generations without diminishing the genuine respect that connects people who love the same land but imagine different futures for it.",
    "Reflective coming of age"
),
("10","24"): (
    "A rancher whose brother was murdered during a stagecoach robbery becomes consumed by determination to track down and confront the men responsible, abandoning the ranch and family obligations to pursue justice across increasingly lawless territory. The hunt leads through mining camps, border towns, and wilderness hideouts where the boundary between legal authority and personal vengeance dissolved long before the rancher arrived. Each confrontation with members of the gang reveals a more complex story behind the robbery than simple criminal greed, challenging the rancher's certainty about who deserves punishment and what form justice should take. The dark pursuit of revenge becomes an examination of how violence committed in the name of justice transforms the person seeking it into someone the murdered brother would no longer recognize or approve.",
    "Dark determined"
),
("11","24"): (
    "Several prisoners being transported across the frontier by a small group of deputies manage to free themselves when the escort is ambushed by bandits seeking to liberate a specific prisoner whose wealthy family has offered payment for rescue. During the chaos the remaining prisoners scatter into unfamiliar wilderness where survival depends on skills most of them do not possess and cooperation between people who have every reason to distrust each other. The desperate journey toward the nearest settlement requires navigating hostile terrain, avoiding both law enforcement and the bandits who are still searching for their target, and making impossible choices about who to trust when everyone has secrets that could endanger the group. The suspenseful frontier escape becomes a test of whether people defined by their worst decisions can demonstrate qualities that the society which imprisoned them refused to see.",
    "Suspenseful frontier"
),
("12","24"): (
    "A respected town marshal learns that protecting a wagon train traveling through territory controlled by hostile forces will require leaving the town defenseless during a period when rival cattlemen are competing for control of the surrounding range. Choosing to escort the vulnerable travelers means abandoning sworn duties to the community that depends on the marshal's presence for stability and security. The difficult journey across exposed terrain with insufficient supplies and constant threat of attack tests every skill the marshal possesses while the knowledge that the unprotected town may suffer in the marshal's absence adds psychological weight to every decision made along the trail. The heroic sacrifice of accepting certain harm in one obligation to prevent catastrophe in another becomes a solemn meditation on the impossible choices that define leadership when resources are insufficient to protect everyone who deserves protection.",
    "Heroic solemn"
),
("13","24"): (
    "A traveling newspaper editor investigating corruption among railroad contractors follows a trail of forged land surveys, bribed territorial officials, and displaced settlers whose claims were invalidated through legal maneuvers designed to transfer ownership to construction companies building the transcontinental route. Each town along the railroad's path tells a similar story of promises broken and compensation withheld from people who lack the resources to challenge corporate power in distant courtrooms. The editor's methodical documentation of the pattern through interviews, public records, and recovered correspondence produces a series of articles that powerful interests attempt to suppress through intimidation, legal threats, and offers of financial compensation for silence. The investigative journey across the frontier reveals how the infrastructure celebrated as national progress was built partly upon systematic exploitation of the communities it claimed to connect and serve.",
    "Investigative serious"
),
("14","24"): (
    "A timid shopkeeper known for avoiding conflict finds life changing when repeated encounters with desperate travelers passing through the frontier town reveal the extent of suffering that exists beyond the safe boundaries of commercial routine. Each person who enters the shop carrying stories of violence, displacement, and loss challenges the shopkeeper's belief that staying uninvolved constitutes a reasonable response to the world's difficulties. Gradually the shopkeeper begins offering more than merchandise, providing shelter, information, and eventually organized assistance to people fleeing dangerous situations that respectable citizens prefer to ignore. The resolute transformation from passive bystander into active protector of vulnerable strangers demonstrates how courage sometimes develops not from dramatic confrontation but from the steady accumulation of small decisions to help when looking away would be easier and safer.",
    "Resolute transformative"
),
("15","24"): (
    "A legendary gunslinger whose reputation once defined frontier justice becomes increasingly irrelevant as towns establish formal law enforcement and citizens demand civilized governance that has no place for individuals who settled disputes through speed and violence. Unable to adapt to a world that has moved beyond the methods that once made the gunslinger indispensable, the aging figure drifts between communities that remember the legend but have no use for the reality. Younger generations regard the gunslinger as either romantic symbol or cautionary tale while the person behind the reputation struggles with the melancholic realization that the skills which created fame have become liabilities in a society that now considers personal violence a problem rather than a solution. The reflective decline illustrates how progress inevitably transforms heroes into anachronisms when the conditions that required their particular kind of courage cease to exist.",
    "Melancholic reflective"
),

# --- Genre 25: Political ---
("03","25"): (
    "A group of independent journalists sets out to investigate the origins of a controversial trade agreement that was negotiated in secrecy and ratified before public debate could meaningfully influence the outcome. Their collective investigation spans multiple countries as each journalist pursues different aspects of the agreement including its financial beneficiaries, the lobbyists who shaped its language, and the political leaders who championed it despite constituent opposition. As the team assembles findings from scattered sources into a comprehensive narrative, the scope of coordinated influence becomes clear. The investigative quest reveals how international agreements that affect millions of ordinary citizens are often designed to serve narrow interests that depend on complexity and secrecy to avoid the democratic scrutiny that transparency would invite.",
    "Investigative and thoughtful"
),
("04","25"): (
    "A young diplomat assigned to a distant embassy expects routine administrative work processing visa applications and attending ceremonial functions that require little more than competence and good manners. Instead the diplomat arrives during a political crisis that has divided the host country's government into factions competing for control of institutions that were stable just months earlier. Navigating between competing power centers while maintaining the home government's official neutrality proves far more complex than any training prepared the diplomat to handle. The journey from naive bureaucrat to skilled political operator who understands that diplomacy requires reading situations that cannot be described in official cables becomes a measured education in how political reality consistently overwhelms the tidy frameworks that academic preparation provides.",
    "Measured and reflective"
),
("05","25"): (
    "A reform minded mayor confronts a deeply entrenched network of contractors and officials who have controlled municipal spending for decades through arrangements that benefit a small circle while infrastructure serving ordinary residents deteriorates. Initial attempts to redirect funds toward neglected neighborhoods trigger coordinated resistance including legal challenges, media campaigns, and political alliances designed to remove the mayor before meaningful changes can be implemented. Each small victory against the network reveals additional layers of institutional corruption that extend far beyond the original targets into state and federal agencies that depend on the existing arrangement for their own purposes. The tense confrontation between democratic mandate and entrenched power examines whether elected leaders can genuinely reform systems that have been deliberately constructed to resist exactly the kind of change that voters repeatedly demand.",
    "Tense and resolute"
),
("06","25"): (
    "A former political strategist known for ruthless campaign tactics begins reevaluating a career built on exploiting divisions and manufacturing controversy after witnessing the long term consequences of strategies that won elections while permanently damaging communities where manufactured hatred replaced genuine political discourse. The painful process of acknowledging personal responsibility for outcomes that harmed real people rather than abstract political opponents demands more than private guilt requires. Attempting to repair relationships with former targets of political attacks and communities divided by campaigns the strategist designed reveals how difficult reconciliation becomes when the damage was inflicted deliberately and the victims remember exactly who benefited from their suffering. The reflective rebirth from cynical operative into someone committed to rebuilding what was broken examines whether political redemption is possible when the tools of destruction were wielded with full knowledge of their consequences.",
    "Reflective and somber"
),
("07","25"): (
    "A charismatic political leader rises rapidly through national politics by promising structural reforms that resonate with citizens frustrated by decades of institutional dysfunction and broken promises from conventional candidates. Early legislative victories generate genuine enthusiasm and international attention as the leader demonstrates that political will combined with popular mandate can overcome bureaucratic resistance that defeated previous reform efforts. As power consolidates and opposition diminishes, the leader's methods gradually shift from democratic persuasion to executive coercion that bypasses the institutional checks designed to prevent exactly the concentration of authority now being assembled. The cautionary descent from celebrated reformer to authoritarian figure demonstrates how the same qualities that enable transformative leadership become dangerous when success removes the constraints that democratic systems impose on individuals who believe their vision justifies any method required to achieve it.",
    "Cautionary and dramatic"
),
("08","25"): (
    "A city council introduces a complicated set of procedural rules designed to eliminate partisan conflict by requiring every proposal to pass through seventeen subcommittees, each with veto authority and mandatory public comment periods that extend the legislative process to approximately fourteen months per resolution. The system produces exactly the gridlock it was designed to prevent as urgent matters including pothole repair and library hours become trapped in procedural labyrinths that no single council member fully understands. Citizens responding to the bureaucratic paralysis form their own informal governance structures that actually solve problems while the official government continues debating the rules for debating the rules. The light satirical examination of well intentioned procedural reform reveals how political systems designed to prevent bad decisions often achieve that goal by preventing all decisions equally.",
    "Light satirical"
),
("09","25"): (
    "A college student volunteering during a local election becomes fascinated with the machinery of democratic politics after witnessing the gap between candidates' public statements and the private negotiations that actually determine policy positions and resource allocation. What begins as idealistic participation in civic life transforms into an education about how political organizations manufacture consent through careful messaging while substantive decisions are made in rooms that volunteers are never invited to enter. The experience of working enthusiastically for outcomes that prove far less meaningful than campaign rhetoric suggested creates a coming of age moment that is specifically political. The thoughtful examination of democratic participation explores the difficult question of whether understanding how political systems actually function makes citizens more effective participants or simply more cynical observers of processes they cannot meaningfully influence.",
    "Thoughtful coming of age"
),
("10","25"): (
    "An experienced legislator passed over for a party leadership position begins quietly building an alternative coalition of lawmakers who share frustration with the current leadership's priorities and methods. The campaign for internal power requires cultivating allies through favors, exploiting rivalries between competing factions, and maintaining absolute secrecy about ultimate intentions until sufficient support guarantees success. Each tactical maneuver brings the legislator closer to the leadership position while demanding moral compromises that progressively erode the principles that originally motivated entry into public service. The dark examination of political revenge reveals how the pursuit of power within democratic institutions often requires adopting the same manipulative methods that made the existing leadership worthy of replacement, creating a cycle where reformers become indistinguishable from the figures they originally sought to unseat.",
    "Dark and calculating"
),
("11","25"): (
    "A group of whistleblowers trapped within a government agency controlled by authoritarian leadership discover that their communications are monitored, their movements are tracked, and their professional evaluations are manipulated to discredit anyone who questions policies that violate the agency's stated mission. Recognizing that internal channels for reporting misconduct have been deliberately compromised, the group begins developing covert methods for transmitting evidence to independent oversight bodies and journalists capable of publicizing findings that the agency has successfully suppressed through intimidation. Each attempt to move information past surveillance systems requires creativity and courage while the personal cost of potential discovery includes career destruction and legal prosecution under statutes designed to protect legitimate secrets but routinely applied to silence legitimate dissent within institutions that have confused institutional loyalty with public service.",
    "Suspenseful and serious"
),
("12","25"): (
    "A veteran public servant approaching retirement discovers evidence that approving a routine regulatory decision would benefit a corporation whose activities will cause significant environmental damage to communities already suffering from decades of industrial neglect. Rejecting the application means defying political superiors who have already committed to the approval and expect bureaucratic compliance from career officials who understand that resistance at this stage carries professional consequences that cannot be reversed. The decision to sacrifice a distinguished career's final chapter by refusing to authorize harm that could be prevented requires accepting that the principles which originally inspired entry into public service demand action precisely when action is most personally costly. The somber examination of principled sacrifice within bureaucratic systems explores whether individual conscience can meaningfully resist institutional momentum when the machinery of government is designed to process decisions rather than question them.",
    "Somber and principled"
),
("13","25"): (
    "A political historian researching past elections begins uncovering patterns suggesting that several critical democratic transitions were influenced by coordinated campaigns of misinformation that contemporary observers either failed to recognize or chose to ignore because the outcomes served prevailing political interests. Archival evidence including private correspondence between media owners, party officials, and intelligence operatives reveals systematic manipulation of public opinion through techniques that anticipated modern propaganda methods by decades. As the historian reconstructs the hidden machinery behind supposedly democratic processes, the investigation attracts attention from institutional figures who prefer that certain historical narratives remain undisturbed. The investigative journey through classified archives and reluctant interviews with retired officials reveals how fragile democratic legitimacy becomes when the mechanisms designed to inform citizens are secretly controlled by interests that benefit from a carefully managed version of political reality.",
    "Investigative reflective"
),
("14","25"): (
    "A quiet policy analyst known primarily for technical expertise becomes unexpectedly influential when a detailed research paper identifies fundamental flaws in legislation that powerful political figures have championed as their signature achievement. The analysis demonstrates with irrefutable evidence that the policy will produce outcomes opposite to those promised by its sponsors, threatening the credibility of leaders who staked their reputations on claims the data does not support. The transformation from invisible bureaucratic specialist into public figure whose findings cannot be ignored or dismissed creates a political crisis that forces the analyst to navigate threats, inducements, and media attention that nothing in a career of careful technical work prepared this reluctant participant to handle. The thoughtful examination of how truth disrupts political narratives explores the personal cost of producing knowledge that powerful institutions find inconvenient.",
    "Transformative and thoughtful"
),
("15","25"): (
    "A revolutionary leader who once inspired millions with promises of political renewal and social justice gradually consolidates power through methods that contradict every principle the movement originally championed. Early compromises justified as temporary necessities for maintaining stability become permanent features of a governance structure that increasingly resembles the authoritarian system the revolution was designed to replace. Former allies who raise concerns are marginalized through the same techniques of surveillance, intimidation, and propaganda that the previous regime employed against the revolutionary movement itself. The somber examination of how revolutionary idealism transforms into authoritarian pragmatism reveals the disturbing pattern in which movements built on liberation inevitably confront the temptation to preserve their achievements through the same oppressive tools they once condemned, creating a cycle that history documents but successive generations consistently fail to recognize until the transformation is complete.",
    "Somber and reflective"
),

# --- Genre 26: Musical ---
("02","26"): (
    "A street musician performing in crowded city markets struggles to earn enough to cover rent while pouring genuine artistic passion into songs that most pedestrians walk past without pausing to hear. When a music producer passing through the market district overhears a performance and offers a recording opportunity, the musician hesitantly enters a professional world governed by commercial expectations that conflict with the artistic integrity that makes the music meaningful. The journey from anonymous street performer to emerging recording artist requires navigating contracts, promotional demands, and creative compromises while maintaining the emotional authenticity that attracted attention in the first place. The hopeful ascent from poverty to recognition through musical talent examines whether artists can preserve the qualities that make their work genuine while adapting to an industry that values marketability above all other considerations.",
    "Hopeful and energetic"
),
("05","26"): (
    "A once famous performer returns to a hometown theater to confront a rival musician who has built a successful local career by appropriating songs and performance styles developed during their earlier collaborative partnership. The confrontation requires not only demonstrating superior artistry in public performances but also winning back audiences who have grown loyal to the rival's polished adaptations of material they do not realize was originally created by someone else. As the musical competition intensifies through dueling concerts, radio appearances, and community events, the returning performer must overcome both the rival's entrenched popularity and personal bitterness that threatens to undermine performances with anger rather than enriching them with genuine emotion. The dramatic struggle to reclaim stolen artistic legacy through the power of authentic performance examines how creative ownership persists in the voices and hearts of original artists even when commercial systems favor those who profit from imitation.",
    "Dramatic and intense"
),
("06","26"): (
    "A former pop singer whose career collapsed after a public scandal quietly accepts a position teaching music at a community center serving underprivileged youth who have never had access to formal musical education. The work is humbling and the pay minimal, but the experience of watching students discover their own musical abilities gradually rekindles a passion for performance that years of commercial pressure and public humiliation had nearly destroyed. When the students organize a concert to raise funds for the center's continuation, the former star must choose between remaining safely anonymous and joining the performance, risking the public attention that previously caused so much damage. The redemptive journey from disgraced celebrity to devoted teacher discovers that musical purpose finds its truest expression not in fame but in the genuine transformation that happens when someone shares a gift with people who need it most.",
    "Redemptive and hopeful"
),
("07","26"): (
    "A celebrated composer becomes increasingly obsessed with creating a masterpiece that will define an entire musical era, investing years of effort and personal fortune into a work of extraordinary ambition that demands more from performers, audiences, and production resources than any previous composition has attempted. Early supporters gradually withdraw as the project's scale exceeds practical possibility and the composer's behavior becomes erratic under the pressure of expectations that no single work of art can satisfy. Relationships dissolve, financial resources evaporate, and collaborators abandon a project they once believed would revolutionize musical expression. The somber collapse of a vision that was simultaneously brilliant and impossible demonstrates how artistic ambition unchecked by practical wisdom can transform a gifted creator into an isolated figure whose greatest work exists only in imagination, forever beyond the reach of actual performance.",
    "Somber and dramatic"
),
("08","26"): (
    "During rehearsals for a chaotic community musical, misunderstandings about casting assignments result in three performers simultaneously preparing for the same leading role while the supporting cast develops conflicting interpretations of a script that the amateur playwright keeps revising during rehearsal breaks. The volunteer orchestra learns different arrangements of each song depending on which rehearsal they attended, creating performances where singers and musicians appear to be performing in parallel but separate productions. As opening night approaches and the director attempts to reconcile incompatible versions of the show into a coherent performance, the cast discovers that the confusion has accidentally produced something more entertaining than the original script intended. The playful celebration of collaborative chaos demonstrates that community theater's greatest strength is not professional polish but the joyful determination of amateur performers who refuse to let mere catastrophe prevent them from putting on a show.",
    "Playful and lively"
),
("09","26"): (
    "A teenager uncertain about personal identity joins a school choir hoping simply to fulfill an elective requirement without attracting attention or investing emotional energy in an activity that seems irrelevant to any practical future. The experience of learning to blend individual voice into collective harmony while preparing for a challenging concert gradually reveals aspects of personality that academic classes never engaged. Relationships formed through shared musical effort introduce the teenager to peers whose different backgrounds and perspectives expand understanding of what friendship and community can mean beyond familiar social circles. The warm journey from reluctant participant to committed ensemble member demonstrates how musical collaboration creates spaces where young people discover capabilities they did not know they possessed and connections they did not know they needed, transforming an obligation into an experience that permanently reshapes their understanding of belonging.",
    "Warm and inspirational"
),
("10","26"): (
    "A talented songwriter believes a former collaborator stole credit for a hit song that was primarily composed during late night sessions where only the two of them were present to witness who contributed what. The dispute escalates from private arguments to public accusations as both musicians release competing versions of events through interviews, social media posts, and legal filings that transform a creative disagreement into a spectacle that damages both careers. The dramatic confrontation forces each musician to examine whether the desire for recognition has become more important than the music itself. As the legal process demands detailed reconstruction of the creative process, both discover that collaboration produced something neither could have created alone, making the question of individual ownership far more complicated than either originally claimed.",
    "Dramatic and emotional"
),
("11","26"): (
    "Members of a touring band become trapped in a remote theater after severe weather makes roads impassable and cancels the scheduled performance that was supposed to fund the next leg of their struggling tour. With no audience, no income, and no immediate prospect of departure, the musicians must decide whether to wait in frustrated silence or use the unexpected downtime to address creative tensions that months of constant travel have pushed to a breaking point. The improvisational sessions that emerge from boredom and mutual frustration produce the most honest and artistically significant music the band has ever created together. The reflective examination of creative breakthrough born from forced confinement reveals how the constraints that seem most limiting sometimes create the conditions necessary for artistic expression that comfortable routine never permits.",
    "Improvisational and reflective"
),
("12","26"): (
    "A veteran conductor nearing retirement learns that a youth orchestra lacks funding to perform at a prestigious competition that could provide scholarships and professional opportunities for students whose families cannot afford private musical education. Committing personal savings and calling in favors accumulated across decades of professional relationships, the conductor organizes an intensive preparation program that demands sacrifice from every participant including parents who rearrange work schedules and community members who donate rehearsal space. The moving journey toward the competition becomes less about winning and more about demonstrating that collective dedication to nurturing young talent creates value that transcends any individual performance or competitive outcome. The noble act of investing a career's remaining resources into the next generation's musical future illustrates how artistic legacy is ultimately measured not by personal achievement but by the opportunities created for those who follow.",
    "Moving and noble"
),
("13","26"): (
    "A music historian studying forgotten compositions discovers fragments of an unfinished symphony by a composer who disappeared under mysterious circumstances during a period of political upheaval that silenced many artists whose work challenged prevailing authorities. The surviving manuscript pages contain musical notations that do not correspond to any known compositional system, suggesting either radical innovation or deliberate encoding of messages that the composer could not safely communicate through ordinary language. As the historian recruits musicians to perform the recovered fragments, the sounds they produce generate unexpected emotional responses in listeners that seem disproportionate to the apparent simplicity of the melodies. The curious investigation into music that may contain hidden meaning examines the possibility that some compositions are designed not merely to be heard but to transmit experiences that conventional communication cannot express.",
    "Curious and investigative"
),
("14","26"): (
    "A quiet accountant with no musical experience unexpectedly joins a local theater production after being mistakenly added to a casting list and feeling too embarrassed to correct the error before rehearsals began. The terrifying experience of learning to sing and perform in front of others while maintaining the pretense of intentional participation forces the accountant to develop skills that decades of careful routine never required or encouraged. Fellow cast members who initially assume competence gradually discover the truth but choose to support rather than expose the accidental performer. The encouraging transformation from someone who never took a creative risk into a person capable of standing on stage and sharing something genuine with an audience demonstrates that the courage to be vulnerable in public can be more transformative than any talent, and that communities built around creative expression often welcome sincerity more warmly than expertise.",
    "Encouraging and joyful"
),
("15","26"): (
    "A legendary singer whose career defined an era returns for a final farewell tour expecting audiences eager to celebrate decades of musical achievement and cultural influence that shaped entire generations of listeners and performers. Instead the tour reveals that contemporary audiences regard the singer primarily as a nostalgic curiosity while younger artists who built careers on the foundation the singer established show little awareness of or interest in the original work that made their success possible. Each performance in increasingly smaller venues makes the gap between past significance and present irrelevance more painfully visible. The melancholic journey through the geography of a fading legacy examines how musical culture consumes its creators, extracting innovation and influence while discarding the human beings who generated them once their commercial utility has been exhausted by an industry that measures artistic value exclusively in terms of current market relevance.",
    "Melancholic and reflective"
),

# --- Genre 27: Holiday ---
("02","27"): (
    "A young baker struggling to keep a small family bakery open during the holiday season discovers that a large corporate chain plans to open a discount outlet directly across the street, threatening to destroy the business that has served the community for three generations. Determined to compete through quality and personal connection rather than price, the baker begins creating specialty holiday recipes using techniques passed down through the family while organizing community events that transform the bakery into a neighborhood gathering place. As regular customers rally around the endangered business and word spreads about the exceptional holiday creations available nowhere else, the baker's determination transforms potential defeat into a celebration of local commerce. The hopeful journey from financial desperation to community supported success demonstrates that holiday traditions thrive through personal dedication and shared appreciation rather than corporate efficiency.",
    "Hopeful and festive"
),
("03","27"): (
    "A group of cousins scattered across different cities decides to travel together to their grandmother's remote farmhouse for what everyone acknowledges may be the final holiday gathering before age and distance make future reunions impossible. The journey requires coordinating travel across multiple time zones, managing family tensions that years of separation have not resolved, and navigating winter weather that transforms every transportation connection into an uncertain adventure. Along the way each cousin confronts personal challenges that the holiday journey unexpectedly illuminates including unresolved sibling rivalries, career disappointments, and romantic complications that seem insignificant against the larger purpose of reaching the farmhouse before the holiday passes. The joyful quest to gather a family together one last time reveals that the effort required to maintain connections across distance and time is itself an expression of love that matters as much as the destination.",
    "Joyful and adventurous"
),
("04","27"): (
    "A business traveler forced to remain in a remote mountain town during a winter holiday storm after all transportation connections are cancelled discovers an unfamiliar community preparing celebrations according to traditions that bear no resemblance to the commercialized holidays familiar from city life. Initially frustrated by the involuntary detention, the traveler gradually becomes drawn into preparations that involve handmade decorations, communal cooking, and gatherings where strangers are welcomed without question or expectation of reciprocity. The experience of participating in celebrations that prioritize human connection over material exchange creates a powerful contrast with the competitive gift buying and obligation driven socializing that previously defined the traveler's holiday experience. The reflective journey from reluctant visitor to grateful participant demonstrates how stepping outside familiar routines during the holiday season can reveal what the celebrations were originally designed to nurture before commercial culture transformed them into transactions.",
    "Reflective and cozy"
),
("05","27"): (
    "Residents of a small town begin blaming a mysterious figure rumored to sabotage holiday events after decorations are damaged, community dinners disrupted, and the annual children's pageant cancelled due to equipment failures that seem too coordinated to be coincidental. The investigation reveals competing theories about who would target celebrations that bring the community together during a season when unity matters most. As suspicion divides neighbors who normally cooperate generously, a small group decides to investigate without accusation by quietly repairing damage and organizing alternative events that demonstrate resilience rather than anger. The gentle resolution reveals that the disruptions originated not from malice but from a series of unfortunate coincidences amplified by a community's tendency to seek villains when things go wrong. The compassionate story illustrates how holiday spirit is tested not by external threats but by the willingness to respond to difficulty with generosity rather than suspicion.",
    "Gentle and compassionate"
),
("06","27"): (
    "A work obsessed executive returns reluctantly to a childhood hometown for a winter holiday gathering organized by family members who have spent years attempting to restore a relationship that professional ambition systematically destroyed through missed celebrations, forgotten promises, and cancelled visits. The familiar streets, decorated houses, and community events trigger memories of holidays when connection rather than achievement defined personal worth. Encounters with childhood friends who chose different paths reveal lives rich in relationships and community bonds that the executive's financial success cannot replicate or replace. The gradual softening from defensive resistance to genuine emotional engagement during the holiday week creates a redemptive experience that challenges the executive to reconsider whether the sacrifices made for career advancement were ever truly necessary or simply the easiest way to avoid the vulnerability that genuine human connection requires.",
    "Redemptive and heartfelt"
),
("07","27"): (
    "A charismatic event planner builds a reputation organizing extravagant holiday gatherings for wealthy clients who compete to host the most impressive seasonal celebrations in their social circle. Each year the events grow more elaborate and expensive as the planner's creative ambitions and the clients' desire for exclusivity drive expectations beyond any reasonable definition of holiday celebration. When the season's most anticipated gathering collapses spectacularly due to overambitious logistics including ice sculptures that melt under theatrical lighting, imported musicians who perform the wrong repertoire, and a catering disaster involving an experimental menu that guests find inedible, the planner's carefully constructed reputation disintegrates in a single evening. The somber realization that the pursuit of spectacular perfection destroyed the simple warmth that holidays are meant to create illustrates how ambition applied to celebrations designed for togetherness produces exactly the opposite of what the season intends.",
    "Somber and reflective"
),
("08","27"): (
    "A town's holiday parade descends into comic chaos after scheduling mistakes place three competing marching bands, a livestock exhibition, and an experimental fireworks demonstration on the same narrow main street at the same time. The resulting confusion produces a spectacular collision of musical genres, startled animals, and premature pyrotechnics that transforms an orderly community tradition into an unforgettable spectacle that nobody planned and nobody can control. Parade organizers attempting to restore order succeed only in redirecting chaos from one block to the next while spectators abandon their planned viewing positions to follow the most entertaining disasters as they develop in real time. By the time the situation resolves itself through mutual exhaustion, the town discovers that the accidentally chaotic parade generated more joy, laughter, and shared community memory than any of the carefully organized celebrations that preceded it.",
    "Playful and festive"
),
("09","27"): (
    "A teenager helping organize a holiday charity drive begins noticing how neighbors who barely acknowledge each other during ordinary months suddenly demonstrate remarkable generosity and warmth when the season's expectations create permission for kindness that everyday social conventions apparently prohibit. The observation sparks questions about why compassion requires a calendar date to become acceptable and whether the holiday spirit that transforms communities for a few weeks each year could be maintained if people simply chose to treat each other with the same consideration throughout the remaining months. Conversations with elderly volunteers who have participated in the charity drive for decades reveal hard earned wisdom about the rhythms of human generosity and the realistic understanding that seasonal compassion, however imperfect, still represents something genuinely valuable. The heartwarming coming of age reflection discovers that questioning holiday traditions is itself part of growing up, and that the answer to why people are kinder during holidays may be less important than the fact that they consistently choose to be.",
    "Heartwarming and reflective"
),
("10","27"): (
    "A sibling returning home for the holidays still carries resentment over a family disagreement that caused years of estrangement and turned seasonal gatherings from celebrations into obligations endured through polite performance rather than genuine participation. The return was prompted by a parent's declining health rather than any resolution of the underlying conflict, creating an atmosphere where holiday decorations and traditional meals coexist uncomfortably with unspoken anger that every family member can feel but nobody is willing to address directly. When a small crisis during holiday preparations forces the estranged siblings to cooperate on a practical task that cannot wait for emotional readiness, the experience of working together toward a shared goal reopens communication that pride had sealed shut for years. The emotional journey from resentful obligation to tentative reconciliation demonstrates that holidays sometimes heal relationships not through dramatic confrontation but through the simple proximity that shared traditions create.",
    "Emotional and reflective"
),
("11","27"): (
    "A group of travelers stranded at a closed airport during a holiday storm must cooperate to create a meaningful celebration using only the resources available in terminal shops, vending machines, and their combined personal belongings. Initial frustration and isolation give way to improvised solutions as strangers discover shared traditions and complementary skills that transform a sterile transit space into something resembling a genuine holiday gathering. A retired teacher organizes activities for stranded children, a professional chef creates a communal meal from convenience store ingredients, and musicians among the group provide entertainment that draws increasingly enthusiastic participation from people who hours earlier wanted nothing more than to be somewhere else. The hopeful story of community formed through shared adversity demonstrates that the essential elements of holiday celebration require neither perfect settings nor familiar company but simply the willingness of strangers to recognize their common humanity and act upon it.",
    "Hopeful and communal"
),
("12","27"): (
    "An elderly volunteer who has quietly organized a holiday charity meal for decades without recognition or assistance learns that this year's event faces cancellation because the community center that has hosted the gathering since its beginning is scheduled for demolition. Rather than accept the loss of a tradition that has provided hundreds of isolated and struggling residents with their only holiday celebration each year, the volunteer begins approaching local businesses, churches, and neighborhood organizations for alternative space and resources. The campaign reveals that many community members who benefited from the meal during difficult periods of their own lives are eager to contribute now that they are able. The noble effort to preserve a tradition of generosity against institutional indifference demonstrates that the most meaningful holiday celebrations are often sustained not by organizations or budgets but by individuals whose commitment to caring for others persists regardless of the obstacles placed in their path.",
    "Noble and touching"
),
("13","27"): (
    "A journalist covering seasonal events becomes intrigued by a century old holiday tradition in a small town that no resident can fully explain despite participating enthusiastically every year. The tradition involves a candlelight procession to a specific location outside town where participants stand in silence for exactly seven minutes before returning home without discussing what occurred. Historical records provide contradictory explanations ranging from memorial for a forgotten disaster to celebration of an event that may never have happened. Interviews with elderly residents produce charming but incompatible stories that reveal more about each storyteller's personality than the tradition's actual origins. The curious investigation into a mystery that resists solution discovers that some traditions endure not because their origins are meaningful but because the act of gathering together to honor something larger than individual understanding creates its own meaning that requires no historical justification to remain genuinely valuable to those who participate.",
    "Curious and investigative"
),
("14","27"): (
    "A quiet librarian who usually spends holidays alone agrees to help coordinate a community holiday celebration after the regular organizer falls ill and no one else volunteers to manage the complicated logistics of an event that hundreds of families depend upon as the centerpiece of their seasonal traditions. The unfamiliar responsibility requires skills the librarian never knew were necessary including negotiating with vendors, managing volunteer schedules, resolving competing demands from community groups, and making creative decisions about decorations and entertainment that will be publicly judged by an entire town. The terrifying experience of moving from behind the desk into visible community leadership reveals capabilities that a lifetime of quiet routine had successfully concealed from everyone including the librarian. The gentle transformation from isolated observer to essential community participant demonstrates that sometimes the circumstances that force people beyond their comfort zones during the holiday season create permanent changes that extend far beyond any single celebration.",
    "Gentle and uplifting"
),
("15","27"): (
    "A once famous television host known for extravagant holiday specials that defined seasonal entertainment for millions of viewers returns for a final broadcast hoping to recapture the magic that made the original programs cultural landmarks celebrated across generations. The production reveals how thoroughly the entertainment landscape has changed as sponsors demand product integration, network executives require demographic targeting, and audiences accustomed to streaming content show little patience for the gentle pacing and sincere sentiment that characterized the beloved originals. Each compromise required to satisfy contemporary commercial demands strips away another element that made the original specials meaningful until the final product bears little resemblance to the warm celebrations the host intended to recreate. The melancholic attempt to revive holiday traditions within an entertainment industry that has outgrown sincerity illustrates how cultural institutions that once brought communities together through shared seasonal experiences have been transformed into commercial platforms where nostalgia itself becomes a product rather than a genuine expression of collective memory and hope.",
    "Melancholic and reflective"
),
}


def main():
    import csv

    # Read original main CSV
    with open('data/cross_references/x_ref_archetype_genere.csv', 'r', encoding='cp1252') as f:
        reader = csv.reader(f)
        header = next(reader)
        all_rows = [r for r in reader if len(r) >= 5]

    # Deduplicate keeping first
    seen = set()
    unique = []
    for r in all_rows:
        key = (r[0], r[1], r[2])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    # Apply replacements
    replaced = 0
    still_short = 0
    for r in unique:
        key = (r[0], r[1])
        wc = len(r[3].split())
        if wc < 75:
            if key in REPLACEMENTS:
                r[3], r[4] = REPLACEMENTS[key]
                replaced += 1
                new_wc = len(r[3].split())
                if new_wc < 75:
                    print(f"WARNING: Replacement for {key} is only {new_wc} words!")
                    still_short += 1
            else:
                print(f"MISSING replacement for A{r[0]}G{r[1]} ({wc} words)")
                still_short += 1

    # Write updated short_premises CSV
    with open('data/cross_references/short_premises_under_75.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        writer.writerow(['Archetype', 'Genre', 'PremiseNumber', 'Premise', 'Tone', 'WordCount'])
        for r in unique:
            key = (r[0], r[1])
            if key in REPLACEMENTS:
                writer.writerow([r[0], r[1], r[2], r[3], r[4], len(r[3].split())])

    # Write updated main CSV
    with open('data/cross_references/x_ref_archetype_genere.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_NONNUMERIC)
        writer.writerow(header)
        for r in unique:
            writer.writerow(r)

    print(f"\nReplaced: {replaced}")
    print(f"Still short: {still_short}")
    print(f"Total rows written: {len(unique)}")

    # Verify
    short_after = sum(1 for r in unique if len(r[3].split()) < 75)
    print(f"Rows under 75 words after fix: {short_after}")


if __name__ == '__main__':
    main()
