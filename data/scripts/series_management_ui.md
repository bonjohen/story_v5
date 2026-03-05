# Managing a Series: The Viewer Interface

*Browse, curate, branch, and export your ongoing story. Estimated listening time: 10 minutes.*

---

## The series browser

The entry point for Chapter Stories is the series browser page. It lists every series you've created, each displayed as a card showing the title, episode count, description, current overarching arc phase, and when the series was last updated.

From here you can navigate into any series to reach its dashboard — the command center for an ongoing story.

---

## The series dashboard

The dashboard is the first thing you see when you open a series. It gives you a bird's-eye view of the narrative's current state through several sections.

**Arc progress** sits at the top. It shows the overarching archetype — Hero's Journey, Tragedy, The Quest, whatever you chose — and how far through it the series has traveled. You see the total number of phases, how many are completed, how many remain, and what phase the series is currently in. A progress percentage gives you the quick summary, and additional metrics tell you how many canon episodes have been generated and how many episodes the current phase has consumed.

**Thread overview** lists every open and progressing plot thread. Each thread shows its title, description, urgency level, and how long it's been since the thread was last advanced. Threads are color-coded by urgency — low threads are quiet, critical threads demand attention. A "stalled" badge appears on any thread that hasn't progressed in two or more episodes.

Below the individual threads is a **health summary**. This aggregates thread status into a single diagnostic: how many threads are open, how many were recently progressed, how many are stalled, and how many are critical. The health ratio — recently progressed threads divided by total open threads — condenses this into a single number. A healthy ratio is above zero point six. Warning territory is between zero point three and zero point six. Critical means too many threads are being neglected.

**Episode timeline** shows the canon episodes in order, each with its slot number, canonization date, and which overarching arc phase it was generated under. This is the spine of the series — the sequence of story events the reader would experience.

---

## Episode curation

When you click an episode slot from the dashboard, you reach the episode curation page. This is where you decide which candidate becomes canon.

The left side shows the **candidate list** — every episode generated for that slot. Each candidate gets a label — A, B, C — and shows its synopsis, the archetype phase it was generated under, and its current canon status: draft, canon, or alternate.

The right side shows the **episode detail viewer** with three tabs.

The **Summary** tab gives you the high-level picture: title, synopsis, which characters were featured, which plot threads were advanced, and what key events occurred. This is enough to compare candidates at a glance.

The **Delta** tab is the strategic view. It shows exactly what state changes this candidate would introduce. New characters, updated relationships, possession transfers, thread progressions, arc phase changes — every way this episode would modify the world state if canonized. This is where you make informed decisions. If candidate A kills the mentor and candidate B merely injures them, you can see that difference clearly in the delta.

The **Artifacts** tab links to the generation artifacts — the contract, plan, validation results, and execution trace. This is the under-the-hood view for when you want to understand *why* the pipeline made certain choices.

Canonization controls let you promote a draft to canon or archive it as an alternate. When you canonize, the delta merges into the lore and a snapshot is created. When you archive, the candidate is preserved but has no effect on the world state.

---

## The detail panels

Three specialized panels provide deep views into the series state.

### The Lore Viewer

The Lore Viewer panel is a tabbed interface with six tabs: Characters, Places, Objects, Factions, World Rules, and Plot Threads.

The Characters tab is the most detailed. Each character appears as a collapsible row showing their name, role, status, and current location. Expand a character and you see their traits, motivations, knowledge, possessions, arc type, when they were introduced, and when they last appeared. Living characters are listed first; deceased characters are separated below. Status badges are color-coded — alive, dead, transformed, unknown — so you can scan the cast at a glance.

Places show name, type, status, description, and connections to other places. Objects show name, type, significance, and current custody. Factions show members, goals, and inter-faction relationships. Every entity displays when it was introduced and its current status.

### The Arc Visualizer

The Arc Visualizer panel displays the overarching arc as a vertical timeline of phase nodes. Completed phases show as solid green circles with their entry and exit episodes noted and a count of how many canon episodes fell within that phase. The current phase is highlighted in purple. Upcoming phases are dimmed gray.

Connector lines run between phases — green for completed transitions, gray for future ones. At the top, a summary shows the archetype name, total and completed phase counts, and total canon episodes. This gives you a structural map of where the series has been and where it's heading.

### The Thread Tracker

The Thread Tracker panel uses a kanban-style layout with three columns: Open, Progressing, and Resolved. Each column shows a count of its threads.

Thread cards display the title, a truncated description, an urgency badge, and the thread's age in episodes. The urgency badge is color-coded — blue for low, yellow for medium, orange for high, red for critical. A "stalled" badge appears on threads that haven't progressed recently. Related characters are listed at the bottom of each card.

This layout makes it easy to scan the narrative's loose ends. A healthy series has most threads in the Progressing column. A troubled series has too many piling up in Open with high urgency badges.

---

## Branching and what-if exploration

Sometimes you want to explore a different direction without committing to it. The branching system lets you fork a series from any canonized episode.

When you create a branch, the system copies the lore and arc state from the snapshot at that point. The branch gets its own isolated canon timeline and lore. You can generate episodes on the branch without affecting the main series. The original timeline continues independently.

The branch manager tracks where the fork happened and can compute a **lore diff** — a summary of how the branch has diverged from the main timeline. This includes characters added or removed, places that exist in one timeline but not the other, and threads that resolved differently. The diff gives you a structural comparison of the two narrative paths.

Branching is useful for testing narrative strategies. What happens if the protagonist accepts the villain's offer? Fork, generate a few episodes, see how the threads evolve. If you prefer the result, you can continue the branch. If not, the main timeline is untouched.

---

## Export and analytics

The series exporter can produce several output formats. A **full series export** generates a markdown document with a title page, arc progress overview, lore summary, active plot threads, and all canon episode content — essentially a readable manuscript of everything the series has produced. You can also export individual episodes, just the lore as a reference document, or a timeline summary.

The analytics engine computes metrics across the series. **Series overview** tallies total episodes, candidate counts, character demographics, thread statuses, and world complexity. **Arc progress** tracks advancement rate and average episodes per phase. **Character stats** show per-character engagement — how many episodes they've appeared in, their arc milestones, their relationship counts. **Thread stats** break down each thread's lifecycle. **Slot stats** show the generation history for each episode position.

These analytics serve two purposes. For the writer, they're a diagnostic tool — revealing which characters are underused, which threads are neglected, and whether the pacing is too fast or too slow. For the system, they feed back into the contract compiler, helping it make better obligations for future episodes.

---

## Putting it all together

The viewer interface ties together everything the Chapter Stories system does. The browser lets you manage multiple series. The dashboard gives you the state of play. The curation page lets you make editorial decisions about what's canon. The detail panels let you inspect the world in depth. Branching lets you experiment safely. Export lets you share the results. And analytics let you understand the patterns.

The key idea is curatorial control. The system generates. You curate. The lore accumulates. And the story grows, episode by episode, into something that no single run could produce.
