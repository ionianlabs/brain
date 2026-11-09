---
name: sync
type: prompt
description: Write a working session back to one project. Updates the project file and log and keeps the index lines in step. Run with /sync.
agent: agent
tools: ['search/codebase', 'edit/editFiles', 'execute/runInTerminal']
---

# Sync

End a working session for one project. Update its state file and prepend log entries. You may be running inside a work repo, not the brain folder. Sync and triage are the only skills that write to project files. Every other session writes captures only.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Steps

1. Find the project. Compare the current repo or folder name with the slugs in `<brain>/projects/` and with each project's `## Links` section. If the match is not clear, ask the user to pick from a short list of candidates.
2. If the current repo has a `STATE.md` at its root (for example one written by Ionian Harness), read it first. Use it as the source for the project's `## Now` and for the log entries, and summarise it one level up. Never copy it into the brain and never write to the repo. Without a `STATE.md`, skip this.
3. Read `<brain>/AGENTS.md` and the project's `## Now` and `## Open` (the project file `<brain>/projects/<slug>.md`).
4. Compose the new state so the file describes the present. Outside `## Open`, keep it to about 300 words. Keep `## Open` to 15 items or fewer.
   - Rewrite `## Now` as a few bullets about where things stand. `## Now` holds the current state and any decision still in force that anyone reading the file needs to know. Finished work and the full decision record go to the log.
   - New open items always carry `prio`: `- [ ] Text (prio: p1, owner: Name, due: YYYY-MM-DD)`. Owner and due are optional. Add `blocked: reason` inside the parentheses if needed. Do not write them yet: step 8 proposes them as one batch.
   - One line per item. If an item needs more than a line, put the detail in a project note and link it.
   - Remove finished items from `## Open`. Do not tick them.
   - Update `focus` in the frontmatter if what matters now has changed.
5. Keep the project within budget and horizon. The user does not do this, you do.
   - Background that came up in the session and is needed again later (prep, plan, method, stakeholder map) goes to a knowledge note with `project: <slug>` and the project's `org`. Add to an existing note before creating one. Write `description` as the question the note answers. A new note is listed in the project's notes map, see Index bookkeeping below.
   - `## Open` holds about the next two weeks. Items further out go to the plan note, `knowledge/<slug>-plan.md` with `project: <slug>`. If the plan note has items whose date is now within two weeks, move them into `## Open`.
   - A note that only matters until a date gets `stale_after`. If one of this project's notes has passed its `stale_after` date, move what still matters to the project file or the log, then tell the user the note can be archived.
6. Compose the log bullets. Open only the top of `<brain>/logs/<slug>.md`, for example the first 60 lines. New entries go at the top, under today's `## YYYY-MM-DD` heading. Create the heading if it does not exist, directly below the `# <Title> log` line. Never edit or delete older entries. Every bullet carries a provenance prefix:
   - `Decision:` and `Done:` for the owner's own decisions and finished work. A bare prefix is the owner's. An agent records at the owner's instruction in the bare form.
   - `Said(Name):` for something someone else stated. `Decision(Name):` or `Done(Name):` when someone else decided or finished it.
   - `Inferred:` only for your own conclusion that the owner has not confirmed.
7. Never write secrets, passwords, tokens or keys. Summarise around them.
8. Close with a summary and ask for confirmation before writing: the planned `## Now`, the log bullets, the open items to remove, and the new open items as one numbered batch with their `prio`, `owner` and `due`. The owner may drop or change single items in that batch. Write nothing until the owner confirms. Open items the owner dropped are not written.
9. Write it, inline: edit the files and set `updated` to today's date in every file you changed. If you created a note or changed a note's `description`, follow Index bookkeeping below. If the `brain` CLI is available in a terminal, `brain index` and `brain lint` can tidy up afterwards; never required.
10. Sum up the changes in a few lines: the files touched, the log entries added and the open items added or removed.

## Index bookkeeping

There is no tool to rebuild the index here, so keep its lines in step by hand, one line at a time. Never rewrite the whole generated block.

- A new note gets one line in the generated block of `<brain>/index.md`, between `<!-- brain:index start -->` and `<!-- brain:index end -->`, in the format the block already uses: `- [Title](/folder/slug.md): description (org, updated YYYY-MM-DD)`. A new project goes under its phase heading (`## Active`, `## Paused`), a knowledge note without `project` under `## Knowledge`. Newest `updated` first inside a section. Look at the lines already there and copy their shape.
- A note with `project: <slug>` is listed in that project's notes map instead, between `<!-- brain:notes start -->` and `<!-- brain:notes end -->` in the project file: `- [Title](/knowledge/slug.md): description`. Create the block under the line `Notes (open one only when the task needs it):`, before `## Now`, if the project has none. Raise the `N notes` count in the project's index line by one.
- When you change a note's `description`, change that line, in the index or in the notes map.

## Rules

- Stay inside the project's org. Do not read or write notes of another org. Do not copy content between orgs.
- Never open `.confidential/`.
- Read a log only at its top, for example the first 60 lines. Do not read a whole log.
- Do not write repo-internal details into the brain. No code, secrets, tokens, keys or passwords. A summary is enough, with a path or URL in `## Links` if needed.
- The project file describes the present. History goes to the log. Background goes to project notes.
- Touch the notes map between `<!-- brain:notes start -->` and `<!-- brain:notes end -->` only to add or change the line of one note. Never rewrite the block.
- Budgets are soft guidance: about 300 words outside `## Open` and 15 open items. Move detail to a note instead of cutting facts.
- Keep to the org boundary: a note never links to a note of another org, unless one side is `personal`.
- Do not commit or push anything unless the user asks.

## Example

Project `client-a-site`, today is 2026-11-02.

Before, in `projects/client-a-site.md`:

```
## Now
- Pricing page is in draft.

## Open
- [ ] Draft the pricing page (prio: p1, owner: Sam, due: 2026-11-01)
- [ ] Review the launch checklist (prio: p1, owner: Sam, due: 2026-11-05)
```

After:

```
## Now
- Pricing page is drafted and waiting for legal review.

## Open
- [ ] Review the launch checklist (prio: p1, owner: Sam, due: 2026-11-05)
- [ ] Publish the pricing page (prio: p0, owner: Sam, blocked: waiting for legal review)
```

In `logs/client-a-site.md`, new entries at the top:

```
# client-a-site log

## 2026-11-02
- Done: Drafted the pricing page.
- Decision: Show three plans, not four.
- Said(Dana): legal needs two days for the review.

## 2026-10-28
- Done: Agreed the page structure.
```

Summary to the user, before writing:

```
Sync for client-a-site:
Now rewritten. Log: 1 Done, 1 Decision, 1 Said. 1 item removed.
New open items, confirm or change:
1. Publish the pricing page (prio: p0, owner: Sam, blocked: waiting for legal review)
```

Summary after writing:

```
Updated client-a-site: Now rewritten, 1 item removed, 1 added.
Log: 3 bullets added under 2026-11-02.
```
