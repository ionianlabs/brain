---
name: triage
type: prompt
description: Empty the brain inbox one decision at a time. Run with /triage.
agent: agent
tools: ['search/codebase', 'edit/editFiles', 'execute/runInTerminal']
---

# Triage

Walk the waiting captures one by one and place each where the owner decides. Triage and sync are the only skills that write to project files. `## Open` grows only through an explicit owner decision with a priority attached.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the `BRAIN_DIR` environment variable if it is set, otherwise `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, otherwise `{{BRAIN_DIR}}`. Below, `<brain>` is that folder.

Find the brain CLI the same way. Use the command named in your session context, if there is one. Otherwise use {{BRAIN_CLI}}. Below, `<cli>` is that command.

If `<brain>/AGENTS.md` does not exist, say that no brain was found there and offer to create one with `<cli> init "<brain>"`. Then stop.

## Two paths

Where the host supports subagents, reads go through the `reader` agent and writes through the `scribe` agent, so file contents stay out of the main thread. Otherwise do the same steps inline. The write orders below are the same on both paths.

## Steps

1. Read `<brain>/AGENTS.md`, then `<brain>/index.md`. List `<brain>/inbox/`. If the inbox is empty, say "inbox empty", write nothing, and stop. Skip step 7.
2. Route `source: flow` day files (`inbox/YYYY-MM-DD-aware.md`) to the `aware` skill. Handle the other captures here.
3. For each capture, read it and present a one-line summary and the proposed destination: an open item for a project, a log bullet, a knowledge note, a new project, or the bin. If you cannot tell the org, ask the owner. Never guess an org.
4. Act on the owner's verdict. Never decide for the owner.
5. Placement. A verdict issues these write orders:
   - **Open item**: an `open-add` for the project. It always carries `prio` and any `due` or `owner` the owner names. Its text comes from the verdict: `- [ ] Confirm the pilot plan (prio: p1, due: 2026-12-01)`.
   - **Log bullet**: a `log` order for the project.
   - **Knowledge note**: a `note-append` to the note that fits. Create one with `note-create` only when none fits, with `project: <slug>` and a `description` written as the question it answers.
   - **New project**: the verdict "new project `<slug>`" first creates `projects/<slug>.md` and `logs/<slug>.md` from `templates/` (same `org` in both, `project: <slug>` in the log), then places the capture there.
   - **Provenance**: when the capture carries `Said(Name):` or `Inferred:` bullets, also write those bullets to the destination project's log, whatever the destination (for a knowledge note, the log of its `project:`). A log-bullet destination writes them once, not twice.
   - **Bookkeeping**: always a `Triaged capture: <filename>` log bullet in that same log, then a `capture-discard`.
   - **Bin**: a "bin" verdict issues only the `capture-discard`. No project, log or knowledge file changes.
6. Capture-discard deletes the capture file. When the AGENTS.md Inbox rules name an archive folder for captures, it moves the file there instead. The plugin default is delete. `source: flow` files are archived by `aware`.
7. When the last capture is done, run `<cli> index "<brain>"` and `<cli> lint "<brain>"`, fix every error you caused, and give a summary: how many captures were placed, where, and how many were binned. On the subagent path `scribe` runs both and returns the findings.

## Rules

- Content goes only into the org of the project it was filed in. Never copy it into another org's notes.
- `## Open` gets an item only with a priority and only after the owner's verdict. Project files stay within budget: detail goes to a knowledge note.
- Log bullets carry provenance prefixes. Open items and bookkeeping lines such as `Triaged capture:` carry none.
- Never write secrets, passwords, tokens or keys.
- Never open `.confidential/`. Never edit or delete existing log entries.
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
Index rebuilt. Lint: 0 errors, 0 warnings.
```
