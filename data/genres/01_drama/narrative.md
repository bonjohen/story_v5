# Drama — Narrative Graph Explanation

## Overview

The Drama depth graph models how the genre's promise of emotionally consequential storytelling translates into enforceable constraints at every level of creative decision-making. It is designed for writers, editors, and story-evaluation tools to verify that a drama delivers on its contract: characters who face meaningful choices under pressure, with outcomes grounded in recognizable human experience.

The graph flows from a single Genre Promise through four Core Constraints, four Subgenre Patterns, three Setting Rules, and three Scene Obligations, with one Tone Marker and two Anti-Patterns. Each level narrows the creative degrees of freedom, moving from "what the audience expects" down to "what must appear in the draft."

---

## Node Explanations

### Level 1 — Genre Promise

**DR_N01_PROMISE — Drama Promise**
The root commitment: the audience will witness emotionally consequential stories where characters face meaningful choices, and the outcomes matter because the stakes feel real. In a story, this manifests as the overall tonal and structural contract — the reader or viewer understands from early signals (grounded tone, serious subject matter, characters with visible interior lives) that this story will ask them to invest emotionally and will reward that investment with honest consequences. While inside this node, the writer must establish the foundational emotional register and signal that outcomes will be earned, not arbitrary.

### Level 2 — Core Constraints

**DR_N10_EMOTIONAL_STAKES — Emotional Stakes Must Be Real**
The central conflict must carry genuine emotional weight. In the story, this appears as early establishment of what the protagonist values most — a relationship, their self-respect, a sense of belonging — followed by threats directed at those valued things. While operating under this constraint, the writer must ensure that stakes are felt (not merely stated) and that the audience can identify exactly what the character stands to lose.

**DR_N11_CONSEQUENTIAL_CHOICE — Characters Must Make Consequential Choices**
The story hinges on decisions, not accidents. This appears as scenes structured around decision moments — moral dilemmas, loyalty tests, sacrifices — followed by aftermath scenes that show the irreversible impact. While this constraint is active, the writer must ensure the protagonist is an agent (someone who decides) rather than a passenger (someone things happen to).

**DR_N12_PLAUSIBLE_HUMAN — Grounded in Plausible Human Experience**
Characters must behave in ways consistent with recognizable human motivation. In the story, this means behavior tracks to established psychology: characters don't act out of plot convenience, emotional responses are proportionate to stimuli, and social context visibly shapes choices. While under this constraint, the writer must resist contrivance — every action must be traceable to character, not to authorial need.

**DR_N13_CONFLICT_INTERPERSONAL — Conflict Is Primarily Interpersonal**
The central tension arises from relationships — disagreements, betrayals, competing needs, failures of understanding. In the story, key scenes are conversations or confrontations between characters, and tension is visible in what characters say and don't say. While this constraint holds, external events must refract through relationships to generate dramatic energy.

### Level 3 — Subgenre Patterns

**DR_N20_DOMESTIC — Domestic Drama**
Drama set within family or household structures. Scenes occur in homes, at family gatherings, in private spaces. Dialogue reveals family history and unspoken tensions. While in this subgenre, the writer must ensure family conflict is consequential (not trivial) and resolution is earned (not sentimental).

**DR_N21_SOCIAL — Social Drama**
Drama where systemic forces — class, race, institutions — create the conditions for interpersonal conflict. Characters reference or struggle against institutional rules, and power dynamics are visible in who speaks and who is silenced. While in this subgenre, the system must be an active force, not a backdrop.

**DR_N22_COURTROOM — Courtroom Drama**
Drama structured around legal proceedings. Courtroom scenes function as set pieces where evidence and testimony reveal character rather than just facts. While in this subgenre, legal procedure must serve the human story, and the verdict must carry emotional and moral weight.

**DR_N23_TRAGEDY_INFLECTED — Tragedy-Inflected Drama**
Drama where the arc bends toward loss, driven by character flaws or irreconcilable circumstances. Early hints establish the flaw or impossible situation, and moments appear where a different choice could have changed the outcome. While in this subgenre, suffering must connect to character — destruction cannot be random.

### Level 4 — Setting Rules

**DR_N40_CONFINED_SETTING — Confined or Intimate Setting**
Drama concentrates in settings that intensify interpersonal pressure — small spaces, closed communities, institutions. In the story, locations repeat, characters cannot easily escape each other, and physical proximity drives confrontation. While this rule is active, the writer must not allow characters to simply walk away from conflict.

**DR_N41_TIME_PRESSURE — Time Compression or Deadline**
Drama compresses time to force decisions: a weekend, a trial period, a final visit. References to time remaining appear, characters are aware they must act now, and pacing accelerates toward the deadline. While this rule holds, difficult choices cannot be infinitely deferred.

**DR_N42_SOCIAL_RULES — Social Rules Constrain Behavior**
The story's social context imposes spoken or unspoken rules that characters must navigate, resist, or break at personal cost. Characters modify behavior based on who is watching, private and public selves diverge, and rule-breaking carries punishment or ostracism. While this rule is active, social expectations must conflict with at least one character's personal needs.

### Level 5 — Scene Obligations

**DR_N60_CONFRONTATION — Confrontation Scene**
At least one scene where characters directly face the central interpersonal conflict through dialogue, accusation, confession, or silence. Long dialogue scenes carry high emotional charge, subtext carries more weight than surface words, and physical staging reflects power dynamics. The relationship must be permanently altered by the scene's end.

**DR_N61_CHOICE_SCENE — Irreversible Choice Scene**
A scene where the protagonist makes a decision that cannot be undone — choosing one relationship over another, telling or withholding a truth, staying or leaving. The character visibly weighs options, and the scene ends with a door closed (literally or figuratively). The choice must not be reversed without cost.

**DR_N62_AFTERMATH — Aftermath / New Normal Scene**
A scene showing the world after central conflict resolves. Tone shifts to reflective, daily life details show what has changed, and echoes of earlier scenes carry altered meaning. The audience must see the permanent impact of the story's events.

### Structural Nodes

**DR_N80_SERIOUS_TONE — Sustained Serious Tone (Tone Marker)**
Events are treated as consequential, emotions are not played for laughs, and the narrative voice respects the gravity of characters' experiences. Prose or cinematography favors stillness over spectacle. Humor, if present, is character-driven and situational rather than gag-based.

**DR_N90_MELODRAMA — Unearned Emotional Manipulation (Anti-Pattern)**
Emotional responses manufactured through contrivance — convenient deaths, coincidences, or suffering without narrative logic. When emotional peaks feel unconnected to prior scenes, or the audience is told to feel rather than shown why, the drama has collapsed into melodrama.

**DR_N91_PASSIVE_PROTAGONIST — Purely Passive Protagonist (Anti-Pattern)**
The central character never makes a meaningful choice. Key turning points happen without protagonist input, and other characters make all the decisions. If present, this violates the genre's core requirement of consequential choice.

---

## Edge Explanations

### Level 1 → Level 2 (Promise to Constraints)

**DR_E01 — Promise requires real stakes**: The genre promise triggers the requirement for genuine emotional weight. Without this edge, the story may claim drama but deliver nothing the audience can feel. Common failure: stakes announced but never tested.

**DR_E02 — Promise requires consequential choices**: The promise generates the requirement that outcomes depend on character decisions. Without this, plot resolves by coincidence or external force. Common failure: ensemble drama where no single character carries agency.

**DR_E03 — Promise requires plausibility**: The promise demands grounding in recognizable human psychology. Without this, characters become mouthpieces for theme. Common failure: allegorical drama that stretches plausibility beyond emotional truth.

**DR_E04 — Promise requires interpersonal conflict**: The promise centers conflict in relationships. Without this, conflict is purely external with no interpersonal dimension. Common failure: disaster or war drama where relationships are incidental.

**DR_E05 — Promise requires serious tone**: The promise establishes that events carry weight. The tone signals seriousness, and the audience calibrates expectations accordingly. Common failure: serious subject treated flippantly throughout.

### Level 2 → Level 3 (Constraints to Subgenres)

**DR_E10–E13 — Stakes branch into subgenres**: Emotional stakes take different shapes depending on context. The triggering condition is where the stakes are rooted: family bonds (→ domestic), systemic forces (→ social), legal proceedings (→ courtroom), or character flaw (→ tragedy). Each branch adds its own constraint profile while inheriting the four core constraints. Common failure: the subgenre setting is present but its specific constraints are ignored.

### Level 3 → Level 4 (Subgenres to Setting Rules)

**DR_E30 — Domestic drama concentrates in intimate spaces**: The domestic subgenre triggers the confined-setting rule. Physical proximity prevents avoidance. Common failure: domestic story where characters never share physical space.

**DR_E31 — Social drama requires visible social rules**: The social subgenre triggers the social-rules constraint. The system must actively constrain characters. Common failure: social system referenced but never enforced.

**DR_E32 — Courtroom concentrates action in single space**: The courtroom subgenre triggers the confined-setting rule (the courtroom itself as arena). Common failure: courtroom drama that never shows the courtroom.

**DR_E33 — Trial imposes deadline**: The courtroom subgenre also triggers time pressure through the trial schedule. Common failure: trial with no time urgency.

**DR_E34 — Tragic arc compresses toward inevitable end**: The tragedy-inflected subgenre triggers time pressure as the character's window for redemption narrows. Common failure: tragic arc with no sense of approaching reckoning.

### Level 4 → Level 5 (Setting Rules to Scene Obligations)

**DR_E50 — Confinement forces confrontation**: When characters cannot escape each other, the confrontation scene becomes inevitable. Common failure: characters confined together but conflict never surfaces.

**DR_E51 — Deadline forces irreversible choice**: Time pressure makes deferral impossible, triggering the choice scene. Common failure: deadline passes with no decision required.

**DR_E52 — Social rules create impossible choice**: When social expectations conflict with personal needs, the choice scene becomes necessary. Common failure: social rules present but character faces no difficult choice.

**DR_E53 — Confrontation leads to new reality**: After confrontation, the aftermath scene shows lasting consequences. Common failure: confrontation occurs but nothing changes.

**DR_E54 — Choice produces lasting consequences**: After the irreversible choice, the aftermath scene shows the new reality. Common failure: choice made but consequences never shown.

### Anti-Pattern Edges

**DR_E90 — Stakes without grounding become melodrama**: When emotional stakes are claimed but not earned through character and event, the story collapses into manufactured feeling. This edge marks the boundary between drama and melodrama.

**DR_E91 — Passivity violates genre**: When the protagonist faces situations but never decides, the core constraint of consequential choice is violated. This edge marks the boundary between drama and mere suffering.

---

## Canonical Walkthrough

**Path: Domestic Drama → Confrontation → Aftermath**

1. **DR_N01_PROMISE**: A story opens with signals of emotional consequence — grounded tone, a character with visible interior life, a situation that carries weight.

2. **DR_N10_EMOTIONAL_STAKES** (via E01): We learn what the protagonist values most. A mother's relationship with her adult daughter is established as the emotional center. The daughter's upcoming wedding creates a context where that bond will be tested.

3. **DR_N11_CONSEQUENTIAL_CHOICE** (via E02): The mother discovers information about the daughter's fiancé that, if revealed, could destroy the wedding — and the relationship. She must decide whether to speak.

4. **DR_N12_PLAUSIBLE_HUMAN** (via E03): The mother's hesitation is psychologically grounded — she has her own history of having been "protected" from truth and knows the cost of both telling and withholding.

5. **DR_N13_CONFLICT_INTERPERSONAL** (via E04): The tension is between mother and daughter, with the fiancé as catalyst rather than antagonist. Family loyalty, honesty, and control are all in play.

6. **DR_N20_DOMESTIC** (via E10): The story is set within family structures — rehearsal dinners, private conversations in kitchens, hotel rooms the night before.

7. **DR_N40_CONFINED_SETTING** (via E30): The wedding weekend concentrates the family in a single location. No one can leave without destroying the event.

8. **DR_N41_TIME_PRESSURE**: The wedding date creates an implicit deadline — the mother must decide before the ceremony.

9. **DR_N80_SERIOUS_TONE** (via E05): Throughout, the tone treats the mother's dilemma with gravity. There is humor in family interaction, but it is situational and character-driven.

10. **DR_N60_CONFRONTATION** (via E50): The mother and daughter have a devastating conversation the night before the wedding. Subtext carries the weight — what the mother says about "wanting the best" is heard as controlling; what the daughter says about "trusting me" is heard as naive.

11. **DR_N61_CHOICE_SCENE** (via E51): The mother chooses to tell the truth, knowing it may end the relationship.

12. **DR_N62_AFTERMATH** (via E53, E54): The wedding is postponed. Six months later, the daughter calls. The conversation is careful, different — the relationship has been permanently altered, not destroyed. The audience sees the new normal.

---

## Variant Walkthroughs

### Variant 1: Social Drama — Institutional Pressure

A teacher discovers systemic grade manipulation at their school. The emotional stakes are their career, their sense of moral identity, and their students' trust (N10). The social system (N21) imposes rules: whistleblowers are punished, institutional loyalty is expected (N42). Time pressure builds as the academic year ends (N41). The confrontation (N60) is with the school administration, not a personal antagonist. The choice scene (N61) is whether to go public, sacrificing career security. The aftermath (N62) shows the teacher in a different school, respected by former students but estranged from former colleagues.

### Variant 2: Courtroom Drama — Justice Under Pressure

A defense attorney takes a politically unpopular case. The emotional stakes are their professional reputation and family stability (N10). The courtroom (N22) concentrates action in a confined space (N40) with a trial deadline (N41, via E33). Evidence reveals character rather than just facts. The confrontation (N60) is a cross-examination that exposes a witness's lie — and the attorney's own complicity in a related injustice. The choice (N61) is whether to reveal evidence that would free their client but incriminate someone they care about. The aftermath (N62) shows the verdict's lasting impact on multiple lives.

### Variant 3: Tragedy-Inflected — Flaw-Driven Destruction

A successful surgeon's perfectionism, which built their career, begins destroying their family. The emotional stakes are the marriage and the children's trust (N10). The character's flaw — inability to accept imperfection — is established early (N23). Time compresses as the spouse issues an ultimatum (N41, via E34). The confrontation (N60) occurs when the surgeon's mistake at work mirrors exactly the flaw that is destroying the marriage. The choice (N61) is whether to admit the mistake or maintain the facade. The surgeon chooses the facade. The aftermath (N62) shows the divorce finalized and the surgeon alone, competent but isolated — the flaw has won.

### Variant 4: Domestic Drama — Generational Conflict

Three generations gather for a grandmother's 80th birthday. Decades of unspoken resentment surface when the grandmother's will is discovered early (N10, N20). The family home confines everyone for the weekend (N40). Social rules of family loyalty constrain honest expression (N42). The confrontation (N60) erupts at the birthday dinner when competing versions of family history collide. The middle generation must choose between maintaining the family myth or acknowledging painful truths (N61). The aftermath (N62) shows a smaller, more honest family unit — some members have stepped away, but those remaining speak to each other differently.

---

## Diagnostic Checklist

Use this checklist to evaluate whether a draft fulfills the Drama genre contract. Each item corresponds to a required node or edge in the graph.

- [ ] **Emotional stakes identified**: Can you name exactly what the protagonist stands to lose? (DR_N10)
- [ ] **Stakes are felt, not just stated**: Does the audience experience the potential loss through scenes, not just exposition? (DR_E01)
- [ ] **Protagonist makes at least one consequential choice**: Does the protagonist decide something that cannot be undone? (DR_N11)
- [ ] **Choice has visible consequences**: Are the aftermath of decisions shown, not just implied? (DR_E54)
- [ ] **Characters behave plausibly**: Can every major action be traced to established character psychology? (DR_N12)
- [ ] **Conflict is interpersonal**: Is the central tension rooted in relationships, not external events? (DR_N13)
- [ ] **Subgenre constraints are active**: If the story is domestic, does family conflict drive the plot? If social, does the system constrain characters? If courtroom, does the trial carry emotional weight? If tragedy-inflected, does the flaw drive the arc? (DR_N20–N23)
- [ ] **Setting constrains characters**: Does the physical or social setting prevent characters from avoiding conflict? (DR_N40, DR_N42)
- [ ] **Time pressure exists**: Is there a deadline or compression that prevents indefinite deferral of choices? (DR_N41)
- [ ] **Confrontation scene present**: Is there at least one scene where characters directly face the central conflict? (DR_N60)
- [ ] **Irreversible choice scene present**: Is there a scene where the protagonist makes a decision that cannot be taken back? (DR_N61)
- [ ] **Aftermath scene present**: Does the story show life after the central conflict, demonstrating lasting change? (DR_N62)
- [ ] **Serious tone sustained**: Does the narrative voice treat events as consequential throughout? (DR_N80)
- [ ] **No unearned emotional manipulation**: Are all emotional peaks traceable to established character and prior events? (DR_N90 — absence check)
- [ ] **Protagonist is not passive**: Does the protagonist make decisions that drive the plot, rather than being carried by events? (DR_N91 — absence check)
