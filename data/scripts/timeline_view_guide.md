# The Timeline View

*A guide to the chronological event viewer. Estimated listening time: 7 minutes.*

---

## What the Timeline View is

The Timeline View presents your story's events in chronological order on a vertical track. Each event is a card showing what happened, who was involved, where it took place, and what changed.

It draws from two sources: backbone beats from the generation pipeline, and the event log from your story instance's lore. If you've generated a backbone and saved a story instance, the timeline will have rich data. If not, it shows whatever is available.

Navigate to it via the "Timeline" link in the toolbar, or the /timeline route.

---

## The event track

Events appear as cards on a vertical timeline, connected by a thin line that represents the passage of story time. Each card shows the event title, a description, the participants, the location, and any state changes.

State changes are the key feature. The system tracks what each event does to the world: who learns something, who gains or loses a possession, who is transformed, who dies, what is revealed. These changes are shown as color-coded badges using the ChangeType vocabulary — learns is blue, gains is green, loses is red, transforms is purple, dies is dark red, reveals is amber.

This means you can scan the timeline and see, at a glance, where the major transformations happen. A timeline where all the change badges cluster in the final quarter tells you that your story back-loads its transformations. A timeline with changes distributed throughout suggests more even pacing.

---

## Swim lanes

Toggle the swim lanes view to see a table showing when each character or faction is "on screen." Each row is an entity, each column is an event, and filled cells indicate participation.

This is useful for tracking character presence across the story. If your protagonist vanishes from the timeline for a long stretch, the swim lane makes that visible immediately. It also reveals ensemble dynamics — which characters are frequently together, and which never interact.

---

## Dependency edges

Toggle the dependency overlay to see causal connections between events. If event B depends on event A (because B can only happen after A establishes something), a connecting line appears between them.

Dependency edges come from the backbone's causal structure. They make the logic of your plot visible: if you remove or reorder an event, the dependency edges show you what else would break.

---

## Manual events

You can add events manually using the "Add Event" button. Manual events get the same fields — title, description, participants, location, change types — and appear on the timeline alongside generated events.

This lets you extend the generated timeline with events the pipeline didn't create, or add backstory events that precede the main narrative.

---

## How it connects

The Timeline View populates from two sources. First, backbone beats: each beat in the StoryBackbone becomes a timeline event with its scenes, participants, and state changes. Second, the instance's event log: the StoryLore object tracks a log of events that have occurred in the story world, and these appear on the timeline as well.

The timeline is read-mostly — you can add events and view generated ones, but you don't edit the backbone data here. For structural changes, use the Scene Board or regenerate from the pipeline.
