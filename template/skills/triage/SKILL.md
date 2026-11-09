---
name: triage
type: skill
description: Empty the brain inbox one decision at a time. Use when the user says "triage", "sort the inbox" or "process my captures". Walks each capture, proposes a destination, and places it as an open item with a priority, a log bullet, a knowledge note or a new project, or bins it. Aware day files go to the aware skill.
---

# Triage

Walk the waiting captures one by one and place each where the owner decides. Triage and sync are the only skills that write to project files. `## Open` grows only through an explicit owner decision with a priority attached.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Steps

1. Read `<brain>/AGENTS.md`, then `<brain>/index.md`. List `<brain>/inbox/`. If the inbox is empty, say "inbox empty", write nothing, and stop. Skip step 7.
2. Route `source: flow` day files (`inbox/YYYY-MM-DD-aware.md`) to the `aware` skill. Handle the other captures here.
3. For each capture, read it and present a one-line summary and the proposed destination: an open item for a project, a log bullet, a knowledge note, a new project, or the bin. If you cannot tell the org, ask the owner. Never guess an org.
4. Act on the owner's verdict. Never decide for the owner.
5. Placement. A verdict leads to one of these writes:
   - **Open item**: a new line under `## Open` in the project file. It always carries `prio` and any `due` or `owner` the owner names. Its text comes from the verdict: `- [ ] Confirm the pilot plan (prio: p1, due: 2026-12-01)`.
   - **Log bullet**: a bullet at the top of the project's log, under today's date.
   - **Knowledge note**: append to the note that fits. Create a note only when none fits, with `project: <slug>` and a `description` written as the question it answers. A new note gets its line in the index, see Index bookkeeping below.
   - **New project**: the verdict "new project `<slug>`" first creates `projects/<slug>.md` and `logs/<slug>.md` from `templates/` (same `org` in both, `project: <slug>` in the log) and adds the project's line under its phase heading in the index, then places the capture there.
   - **Provenance**: when the capture carries `Said(Name):` or `Inferred:` bullets, also write those bullets to the destination project's log, whatever the destination (for a knowledge note, the log of its `project:`). A log-bullet destination writes them once, not twice.
   - **Bookkeeping**: always a `Triaged capture: <filename>` log bullet in that same log, then the capture is discarded (step 6).
   - **Bin**: a "bin" verdict only discards the capture. No project, log or knowledge file changes.
6. Discarding a capture deletes the capture file. When the AGENTS.md Inbox rules name an archive folder for captures, it moves the file there instead. The plugin default is delete. `source: flow` files are archived by `aware`.
7. When the last capture is done, give a summary: how many captures were placed, where, and how many were binned. If the `brain` CLI is available in a terminal, `brain index` and `brain lint` can tidy up afterwards; never required.

## Index bookkeeping

There is no tool to rebuild the index here, so keep its lines in step by hand, one line at a time. Never rewrite the whole generated block.

- A new note gets one line in the generated block of `<brain>/index.md`, between `<!-- brain:index start -->` and `<!-- brain:index end -->`, in the format the block already uses: `- [Title](/folder/slug.md): description (org, updated YYYY-MM-DD)`. A new project goes under its phase heading (`## Active`, `## Paused`), a knowledge note without `project` under `## Knowledge`. Newest `updated` first inside a section. Look at the lines already there and copy their shape.
- A note with `project: <slug>` is listed in that project's notes map instead, between `<!-- brain:notes start -->` and `<!-- brain:notes end -->` in the project file: `- [Title](/knowledge/slug.md): description`. Create the block under the line `Notes (open one only when the task needs it):`, before `## Now`, if the project has none. Raise the `N notes` count in the project's index line by one.
- When you change a note's `description`, change that line, in the index or in the notes map.

## Rules

- Content goes only into the org of the project it was filed in. Never copy it into another org's notes.
- `## Open` gets an item only with a priority and only after the owner's verdict. Project files stay within budget: detail goes to a knowledge note.
- Log bullets carry provenance prefixes. Open items and bookkeeping lines such as `Triaged capture:` carry none.
- Never write secrets, passwords, tokens or keys.
- Never open `.confidential/`. Never edit or delete existing log entries.
- Keep to the org boundary: a note never links to a note of another org, unless one side is `personal`.
- Do not commit or push anything unless the user asks.

## Example

Capture `inbox/2026-11-08-pilot-moves-to-january.md` with the bullet `- Said(Sam): the pilot moves to January`. Today is 2026-11-08.

Proposal:

```
1. Pilot moves to January (Sam) -> open item for atlas?
```

Verdict: "open item for atlas, prio p1, due 2026-12-01, text: Confirm the pilot plan".

`projects/atlas.md`, under `## Open`:

```
- [ ] Confirm the pilot plan (prio: p1, due: 2026-12-01)
```

`logs/atlas.md`, new entries at the top:

```
## 2026-11-08
- Said(Sam): the pilot moves to January
- Triaged capture: 2026-11-08-pilot-moves-to-january.md
```

The capture is gone from `inbox/`. Summary:

```
Triaged 1 capture: 1 open item (atlas), 0 binned.
```
