---
name: sync
type: skill
description: Write a working session back to the brain for one project. Use when the user says "sync", "handover", "end session", "wrap up" or "save to brain". Updates the project's Now and Open sections, keeps them within budget by moving detail to project notes, prepends dated log entries with provenance prefixes, sets updated, rebuilds the index and runs lint. New open items are confirmed as one batch. Works from inside a work repo.
---

# Sync

End a working session for one project. Update its state file, prepend log entries, then check the brain. You may be running inside a work repo, not the brain folder. Sync and triage are the only skills that write to project files. Every other session writes captures only.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the `BRAIN_DIR` environment variable if it is set, otherwise `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, otherwise `{{BRAIN_DIR}}`. Below, `<brain>` is that folder.

Find the brain CLI the same way. Use the command named in your session context, if there is one. Otherwise use {{BRAIN_CLI}}. Below, `<cli>` is that command.

If `<brain>/AGENTS.md` does not exist, say that no brain was found there and offer to create one with `<cli> init "<brain>"`. Then stop.

## Two paths

Where the host supports subagents, run the steps through the `scribe` and `reader` agents. This keeps file contents out of the main thread. Otherwise do the same steps inline. Both paths must give the same files, the same log bullets by prefix and meaning, and the same open items by prio, due and owner. Prose wording may differ.

- **Subagent path.** Ask `reader` for the project's current `## Now` and `## Open` (bounded sections, returned as bullets with line numbers, not whole files). Compose the new state yourself. Then send `scribe` write orders: `now-replace`, `focus-set`, `open-add`, `open-close`, `plan-promote`, `note-append`, `note-create` and `log`. Scribe sets `updated` on every file it touches, runs `index` and `lint`, and returns a summary. Any further file question goes to `reader`.
- **Inline path.** Read and edit the files yourself, following the same steps.

## Steps

1. Find the project. Compare the current repo or folder name with the slugs in `<brain>/projects/` and with each project's `## Links` section. If the match is not clear, ask the user to pick from a short list of candidates.
2. If the current repo has a `STATE.md` at its root (for example one written by Ionian Harness), read it first. Use it as the source for the project's `## Now` and for the log entries, and summarise it one level up. Never copy it into the brain and never write to the repo. Without a `STATE.md`, skip this.
3. Read `<brain>/AGENTS.md` and the project's `## Now` and `## Open` (inline: the project file `<brain>/projects/<slug>.md`).
4. Compose the new state so the file describes the present. Outside `## Open`, keep it to about 300 words. Keep `## Open` to 15 items or fewer.
   - Rewrite `## Now` as a few bullets about where things stand. `## Now` holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log.
   - New open items always carry `prio`: `- [ ] Text (prio: p1, owner: Name, due: YYYY-MM-DD)`. Owner and due are optional. Add `blocked: reason` inside the parentheses if needed. Do not write them yet: step 8 proposes them as one batch.
   - One line per item. If an item needs more than a line, put the detail in a project note and link it.
   - Remove finished items from `## Open`. Do not tick them.
   - Update `focus` in the frontmatter if what matters now has changed.
5. Keep the project within budget and horizon. The user does not do this, you do.
   - Background that came up in the session and is needed again later (prep, plan, method, stakeholder map) goes to a knowledge note with `project: <slug>` and the project's `org`. Add to an existing note before creating one. Write `description` as the question the note answers.
   - `## Open` holds about the next two weeks. Items further out go to the plan note, `knowledge/<slug>-plan.md` with `project: <slug>`. If the plan note has items whose date is now within two weeks, move them into `## Open`.
   - A note that only matters until a date gets `stale_after`. If lint flags one of this project's notes as stale, move what still matters to the project file or the log, then tell the user the note can be archived.
6. Compose the log bullets. Open only the top of `<brain>/logs/<slug>.md`, for example the first 60 lines. New entries go at the top, under today's `## YYYY-MM-DD` heading. Create the heading if it does not exist, directly below the `# <Title> log` line. Never edit or delete older entries. Every bullet carries a provenance prefix:
   - `Decision:` and `Done:` for the owner's own decisions and finished work. A bare prefix is the owner's. An agent records at the owner's instruction in the bare form.
   - `Said(Name):` for something someone else stated. `Decision(Name):` or `Done(Name):` when someone else decided or finished it.
   - `Inferred:` only for your own conclusion that the owner has not confirmed.
7. Never write secrets, passwords, tokens or keys. Summarise around them.
8. Close with a summary and ask for confirmation before writing: the planned `## Now`, the log bullets, the open items to remove, and the new open items as one numbered batch with their `prio`, `owner` and `due`. The owner may drop or change single items in that batch. Write nothing until the owner confirms. Open items the owner dropped are not written.
9. Write it. Subagent path: send the write orders to `scribe`. Inline path: edit the files, set `updated` to today's date in every file you changed, then run `<cli> index <brain>` and `<cli> lint <brain>` and fix any errors you caused. If the CLI does not run, say so and skip both.
10. Sum up the changes in a few lines: the files touched, the log entries added and the open items added or removed.

## Rules

- Stay inside the project's org. Do not read or write notes of another org. Do not copy content between orgs.
- Never open `.confidential/`.
- Read a log only at its top, for example the first 60 lines. Do not read a whole log.
- Do not write repo-internal details into the brain. No code, secrets, tokens, keys or passwords. A summary is enough, with a path or URL in `## Links` if needed.
- The project file describes the present. History goes to the log. Background goes to project notes.
- Never edit the notes map between `<!-- brain:notes start -->` and `<!-- brain:notes end -->`. `brain index` writes it.
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
Index rebuilt. Lint: 0 errors, 0 warnings.
```
