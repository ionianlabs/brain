---
name: handover
type: skill
description: End a working session for one project. Use when the user says "handover", "end session", "wrap up" or "save to brain". Updates the project's Now and Open sections, prepends dated log entries, sets updated, rebuilds the index and runs lint. Works from inside a work repo.
---

# Handover

End a working session for one project. Update its state file, prepend log entries, then check the brain. You may be running inside a work repo, not the brain folder.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the `BRAIN_DIR` environment variable if it is set, otherwise `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, otherwise `{{BRAIN_DIR}}`. Below, `<brain>` is that folder.

Find the brain CLI the same way. Use the command named in your session context, if there is one. Otherwise use {{BRAIN_CLI}}. Below, `<cli>` is that command.

If `<brain>/AGENTS.md` does not exist, say that no brain was found there and offer to create one with `<cli> init "<brain>"`. Then stop.

## Steps

1. Find the project. Compare the current repo or folder name with the slugs in `<brain>/projects/` and with each project's `## Links` section. If the match is not clear, ask the user to pick from a short list of candidates.
2. If the current repo has a `STATE.md` at its root (for example one written by Ionian Harness), read it first. Use it as the source for the project's `## Now` and for the log entries, and summarise it one level up. Never copy it into the brain and never write to the repo. Without a `STATE.md`, skip this.
3. Read `<brain>/AGENTS.md` and the project file `<brain>/projects/<slug>.md`.
4. Update `## Now` and `## Open` so the file describes the present state. Keep the file under about 600 words.
   - Rewrite `## Now` as a few bullets about where things stand. `## Now` holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log.
   - Add new open items as `- [ ] Text (owner: Name, due: YYYY-MM-DD)`. Owner and due are optional. Add `blocked: reason` inside the parentheses if needed.
   - Remove finished items from `## Open`. Do not tick them.
   - Update `focus` in the frontmatter if what matters now has changed.
5. Open only the top of `<brain>/logs/<slug>.md`, for example the first 60 lines. New entries go at the top, so the newest dates are there and nothing older is needed. Under today's `## YYYY-MM-DD` heading, add entries at the top. Create the heading if it does not exist, directly below the `# <Title> log` line. Use the prefixes `Decision:` and `Done:`. Never edit or delete older entries.
6. Set `updated` to today's date in the project file and in the log file.
7. Run `<cli> index <brain>`, then `<cli> lint <brain>`. Fix any errors you caused. If the CLI does not run, say so and skip both.
8. Sum up the changes in a few lines: the files touched, the log entries added and the open items added or removed.

## Rules

- Stay inside the project's org. Do not read or write notes of another org. Do not copy content between orgs.
- Never open `.confidential/`.
- Read a log only at its top, for example the first 60 lines. Do not read a whole log.
- Do not write repo-internal details into the brain. No code, secrets, tokens, keys or passwords. A summary is enough, with a path or URL in `## Links` if needed.
- The project file describes the present. History goes to the log.
- Do not commit or push anything unless the user asks.

## Example

Project `client-a-site`, today is 2026-11-02.

Before, in `projects/client-a-site.md`:

```
## Now
- Pricing page is in draft.

## Open
- [ ] Draft the pricing page (owner: Sam, due: 2026-11-01)
- [ ] Review the launch checklist (owner: Sam, due: 2026-11-05)
```

After:

```
## Now
- Pricing page is drafted and waiting for legal review.

## Open
- [ ] Review the launch checklist (owner: Sam, due: 2026-11-05)
- [ ] Publish the pricing page (owner: Sam, blocked: waiting for legal review)
```

In `logs/client-a-site.md`, new entries at the top:

```
# client-a-site log

## 2026-11-02
- Done: Drafted the pricing page.
- Decision: Show three plans, not four.

## 2026-10-28
- Done: Agreed the page structure.
```

Summary to the user:

```
Updated client-a-site: Now rewritten, 1 item removed, 1 added.
Log: 1 Done and 1 Decision added under 2026-11-02.
Index rebuilt. Lint: 0 errors, 0 warnings.
```
