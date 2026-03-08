# Story Generation Walkthrough

*An audio-friendly guide. Estimated listening time: 8 minutes.*

---

## What this tool does

Story Structure Explorer has a generation pipeline that takes a story idea you describe in plain English and runs it through a formal modeling system. That system knows about fifteen story archetypes — things like the Hero's Journey, Tragedy, the Quest — and twenty-seven genres, from Science Fiction to Horror to Romantic Comedy. It uses all of that structural knowledge to build your story from the ground up, making sure it actually delivers on its genre promises and follows a coherent narrative arc.

The pipeline has eight stages. It loads the full corpus of graphs, picks the best archetype and genre combination for your idea, compiles a formal contract of rules your story must follow, plans out the beats and scenes, writes prose for each scene using an LLM, validates every scene against the contract, repairs anything that fails validation, and finally produces a full compliance trace so you can see exactly which story structure rules each scene satisfies.

You can run it from the command line or from the web UI. Let's start with the command line, since that's the simplest way to understand what's happening.

---

## Step 1: Write your story request

Everything starts with a JSON file that describes what you want. There are three sample requests in the outputs/samples folder you can use as starting points, but let me walk you through the fields.

The most important field is **premise**. This is your story idea in one or two sentences. For example: "A young engineer discovers that her space station's AI has developed consciousness and must decide whether to report it or protect it." Be specific enough that the system has something to work with, but don't over-prescribe — that's the system's job.

Next, pick your **medium** — novel, short story, screenplay, whatever. And your **length target** — short story, novella, or novel. These affect how many scenes the planner creates and how much prose the writer generates.

Then there's **audience**. You set an age band — adult, young adult, or children — and any content limits. Content limits are things like "no graphic violence" or "no explicit content." These become hard constraints that the validator enforces.

Now the structural choices. **Requested genre** is the primary genre — Science Fiction, Fantasy, Horror, Romance, any of the twenty-seven. **Requested archetype** is the story structure — Hero's Journey, Tragedy, the Quest, and so on. If you're not sure which archetype fits your premise, just pick the one that feels closest. The selection engine will score the combination against the compatibility matrix and tell you if there's a better fit.

**Tone preference** is a single word or short phrase — somber, dark, epic, playful, whatever mood you're going for. The system matches this against the genre's tone marker node and checks whether it reinforces or contrasts with the archetype's emotional arc.

Finally, there's a **constraints** block. **Must include** is a list of elements your story needs — things like "found family" or "ethical dilemma." **Must exclude** is the opposite — things like "time travel" or "deus ex machina." These become hard boundaries in the contract.

**Allow genre blend** lets the system pull in a secondary genre. When enabled, you can specify which genre to blend with — so your Sci-Fi story might pick up Mystery constraints. If you leave the choice blank, the selection engine auto-picks the best complement. **Allow hybrid archetype** lets the system layer two archetypes — so your Hero's Journey might also track a Tragedy arc. Again, you can specify the hybrid or let the engine choose.

Here's what a minimal request looks like. Create a file — call it my_request.json:

```json
{
  "schema_version": "1.0.0",
  "premise": "Your story idea here.",
  "medium": "novel",
  "length_target": "short_story",
  "audience": {
    "age_band": "adult",
    "content_limits": []
  },
  "requested_genre": "Science Fiction",
  "requested_archetype": "The Hero's Journey",
  "tone_preference": "somber",
  "constraints": {
    "must_include": [],
    "must_exclude": [],
    "allow_genre_blend": false,
    "allow_hybrid_archetype": false
  }
}
```

You can leave the run ID and timestamps out — those are auto-generated.

---

## Step 2: Choose your generation path

There are two paths, and they serve different purposes.

**Build Structure** is the fast, deterministic path. It loads the corpus, scores your genre-archetype combination, compiles the full story contract, assembles the backbone (beat structure with scene assignments), and extracts slot templates — all without any LLM calls. This is great for exploring what constraints a pairing imposes, and for setting up the structural scaffolding before committing to generation.

**Generate Story** is the full pipeline. It does everything Build Structure does, then uses an LLM to synthesize character/place/object details, write prose for every scene, validate each scene against the contract, repair failures, and produce the complete compliance trace. This is the path that produces a finished story.

---

## Step 3: Run the pipeline

Open a terminal in the project root. If you haven't already, install dependencies:

```
cd app
npm install
```

Then run the generator. For a quick structure-only run without an LLM:

```
npx tsx app/scripts/generate_story.ts --request outputs/samples/simple_request.json --mode backbone --no-llm
```

That'll finish in a few seconds. For a full draft with the LLM:

```
npx tsx app/scripts/generate_story.ts --request my_request.json --mode draft
```

The LLM uses the Claude Code CLI (`claude --print`) by default — no API key needed if you have Claude Code installed. You can also specify a model:

```
npx tsx app/scripts/generate_story.ts --request my_request.json --mode draft --model claude-opus-4-20250514
```

You can also set how many times the repair engine retries a failing scene:

```
--max-repairs 3
```

The default is two attempts per scene. After that, it moves on and flags the scene in the compliance report.

As the pipeline runs, you'll see timestamped progress messages in the terminal — loaded corpus, selected combination, contract ready, planned, generating scene one, validating scene one, and so on.

---

## Step 4: Read the output

All output goes into a run folder — by default, outputs/runs/ with a timestamped run ID. Inside you'll find:

**request.json** — a copy of your original request, for reproducibility.

**selection_result.json** — which archetype and genre the system chose, the compatibility classification from the matrix, whether it enabled a genre blend or hybrid archetype, and the tone integration analysis. This is worth reading even if you specified exactly what you wanted, because it tells you *why* the combination works or doesn't.

**story_contract.json** — the full enforceable contract. This has the archetype spine — every node your story must pass through in order. The genre constraints organized by level, split into hard and soft. The global boundaries — your must-include and must-exclude items plus content limits. Phase guidelines — for each node in the archetype, what the entry and exit conditions are, what failure looks like, and which genre obligations link to that phase. And the validation policy — what gets checked and what blocks generation.

**story_plan.json** — the beat sheet and scene list. Each beat maps to an archetype node and carries emotional scores — tension, hope, fear, and resolution, each scored zero to one. Each scene is assigned to a beat and carries its setting, characters, scene goal, the archetype trace showing which node and edges it covers, genre obligations it must satisfy, and a per-scene constraint checklist split into hard, soft, and must-not.

**scene_drafts/** — a folder of Markdown files, one per scene. This is your actual story prose.

**validation_results.json** — per-scene validation results. Every scene gets checked against hard constraints, anti-patterns, tone, entry and exit conditions, and signals in text. Each check is pass, warn, or fail. The global section gives you coverage percentages — what fraction of hard constraints and soft constraints were satisfied across the whole story.

**story_trace.json** — the full audit trail. For every scene, which archetype node and edges it maps to, which genre constraints it satisfies, and the tone marker. This is the provenance record — you can trace any line of prose back to the structural rules that required it.

**compliance_report.md** — a human-readable summary of everything above. Coverage percentages, any failures or warnings, anti-pattern violations.

---

## Step 5: Use the web UI (optional)

If you prefer a visual interface, start the dev server:

```
cd app
npm run dev
```

Open localhost 5173 — or visit the deployed site at the project's GitHub Pages URL. You'll see a generation panel with five tabs across the top: Pipeline, Setup, Elements, Analysis, and Generate. Navigation to other surfaces (Story Workspace, Scene Board, Timeline, etc.) is through the hamburger menu in the top-left corner.

The **Setup** tab has the same fields as the JSON request — archetype picker, genre picker, premise text area, tone, and blend/hybrid options. When you enable genre blending or hybrid archetypes, a dropdown appears letting you choose the specific secondary genre or hybrid archetype, or you can leave it on auto-select. All form values persist across tab switches. A contract summary appears inline once generation has run.

The **Elements** tab shows the backbone slot templates and an editable entity registry — characters with name, role, traits, motivations, flaw, and arc direction; places with atmosphere and features; objects with significance and properties. You can add, edit, and remove entities directly, or use the "Fill All Details" button to have the LLM populate everything from the contract and backbone context in a single call.

The **Analysis** tab expands to full width and shows the graph canvases — you can toggle between Archetype, Genre, or Compare (side-by-side) views. Below the canvas are collapsible sections for node/edge detail, pairing analysis, statistics, elements, and cross-index. If a story has been generated, additional sections appear for templates, contract, backbone beats, plan, story prose, compliance, and chapters.

The **Generate** tab has two buttons: "Build Structure" runs the deterministic pipeline (contract + backbone + templates) without any LLM calls. "Generate Story" runs the full pipeline including prose generation. The event log scrolls as the pipeline progresses, and generated scenes appear inline as they complete. You can save the result as a story instance or clear and start over.

The **Pipeline** tab manages the LLM connection (via the Claude Code CLI bridge that starts automatically with the dev server), import/export of generation snapshots, and telemetry.

On the Analysis tab, the graph canvas gets an overlay during generation: nodes covered by the story are highlighted in green, anti-pattern nodes are highlighted in red, and the currently active scene's nodes pulse.

---

## Tips and tricks

**Start with Build Structure.** It's instant, doesn't need an LLM, and tells you whether your genre-archetype combination makes structural sense before you spend tokens on generation.

**Try genre blending.** Set allow_genre_blend to true and see what the selection engine pairs with your primary genre. Science Fiction plus Mystery is a classic blend. Horror plus Romance gives you gothic. The blending model knows which combinations are stable and which create productive tension.

**Use must_include strategically.** The items you list become hard constraints that every scene is checked against. "Ethical dilemma" is good — it's broad enough that scenes can satisfy it in different ways. "The protagonist must give a speech about freedom in chapter three" is too specific and will cause validation failures.

**Read the compliance report first.** If you run a full draft, start with compliance_report.md. It gives you the quick picture — did the story hit its structural targets? Then drill into specific scenes if anything failed.

**The three sample requests cover the main patterns.** simple_request.json is a straightforward single-genre, single-archetype run. blend_request.json enables genre blending. hybrid_request.json enables hybrid archetypes. Try all three to see how the pipeline behaves differently.

---

That's it. You write a request, pick a mode, run the command, and read the output. The system handles all the structural modeling — matching your idea against forty-two graphs, compiling the rules, planning the beats, writing the prose, and proving every scene delivers on its genre and archetype promises.
