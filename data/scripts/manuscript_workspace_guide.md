# The Manuscript Workspace

*A guide to the prose editing and export surface. Estimated listening time: 8 minutes.*

---

## What the Manuscript Workspace is

The Manuscript Workspace is a Scrivener-lite environment for working with the prose that the generation pipeline produces. It organizes generated chapter text into a binder of chapters and scenes, lets you edit and revise the text, and exports the result as a single markdown file.

This is where the generation pipeline's output becomes a readable document. The pipeline produces scene drafts — individual prose segments for each scene in the plan. The Manuscript Workspace collects those drafts, organizes them by chapter, and gives you a writing environment to revise them.

Navigate to it via the "Manuscript" link, or the /manuscript route.

---

## The three columns

The workspace has a three-column layout.

The **left column** is the chapter binder. It shows every chapter as an expandable entry, with the chapter title, status badge, scene count, and word count. Click a chapter to expand it and see its scenes listed underneath. Click a scene to open it in the editor.

The **center column** is the scene editor. This is where you read and edit the prose. The editor uses a serif font for a more book-like reading experience. You write directly in the text area, and changes save immediately.

The **right column** is the metadata panel. It shows the selected scene's synopsis, status, word count, and a notes field. The synopsis comes from the generation pipeline's scene goals, giving you context for what each scene is supposed to accomplish.

---

## Status tracking

Every scene and chapter has a status: draft, revised, or final.

Draft means the text is the raw generation output, untouched. Revised means you've made edits. Final means you've reviewed it and consider it done. The status badges in the binder use color coding — amber for draft, blue for revised, green for final.

Chapter status is computed automatically from its scenes. If all scenes are final, the chapter is final. If all are at least revised, the chapter is revised. Otherwise it's draft.

You change scene status using the buttons in the editor header. This is a manual action — the system doesn't automatically detect your edits and change status. You decide when a scene graduates from draft to revised to final.

---

## The diff view

When a scene has both a generated draft and your revised text, you can toggle the diff view using the "Show Draft" button in the toolbar. This shows a side-by-side layout: the original generated draft on the left (read-only), and your revised version on the right (editable).

This is useful for comparing your edits against what the pipeline produced. You can see exactly what you changed, what you kept, and what you rewrote entirely.

---

## Export

The "Export .md" button in the toolbar exports the entire manuscript as a single markdown file. Each chapter becomes a level-one heading, and scenes are separated by horizontal rules. The export uses the revised text where available, falling back to the draft text for unedited scenes.

The exported file is a clean, portable document. You can open it in any markdown editor, convert it to other formats, or use it as input for further processing.

---

## Auto-population

The Manuscript Workspace auto-populates from the generation pipeline. When you navigate to the page, it checks whether the generation store has a chapter manifest and scene drafts. If so, and if the manuscript is currently empty, it populates automatically.

If you've already edited the manuscript, it won't overwrite your work. The "Clear" button in the toolbar lets you reset the manuscript and re-populate from a new generation run.

---

## How it connects

The Manuscript Workspace sits at the end of the pipeline: Structure (graph viewer) produces a contract, the Generation panel produces a plan and scenes, and the Manuscript Workspace organizes the scenes into a readable document.

The pipeline stages before it — contract, plan, backbone, detail synthesis, chapter assembly — all feed into the chapter manifest and scene drafts that the Manuscript Workspace consumes. This means the manuscript reflects the full structural analysis: every scene exists because the plan required it, and every plan entry exists because the contract demanded it.
