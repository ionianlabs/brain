---
name: handover
type: prompt
description: End a working session for one project. Updates the project file and log, rebuilds the index and runs lint. Run with /handover.
agent: agent
tools: ['search/codebase', 'edit/editFiles', 'execute/runInTerminal']
---

# Handover

End a working session for one project. Update its state file, prepend log entries, then check the brain. You may be running inside a work repo, not the brain folder. The brain is at `{{BRAIN_DIR}}`.

## Steps

1. Find the project. Compare the current repo or folder name with the slugs in `{{BRAIN_DIR}}/projects/` and with each project's `## Links` section. If the match is not clear, ask the user to pick from a short list of candidates.
2. Read `{{BRAIN_DIR}}/AGENTS.md` and the project file `{{BRAIN_DIR}}/projects/<slug>.md`.
3. Update `## Now` and `## Open` so the file describes the present state. Keep the file under about 600 words.
   - Rewrite `## Now` as a few bullets about where things stand. `## Now` holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log.
   - Add new open items as `- [ ] Text (owner: Name, due: YYYY-MM-DD)`. Owner and due are optional. Add `blocked: reason` inside the parentheses if needed.
   - Remove finished items from `## Open`. Do not tick them.
   - Update `focus` in the frontmatter if what matters now has changed.
4. Open `{{BRAIN_DIR}}/logs/<slug>.md`. Under today's `## YYYY-MM-DD` heading, add entries at the top. Create the heading if it does not exist, directly below the `# <Title> log` line. Use the prefixes `Decision:` and `Done:`. Never edit or delete older entries.
5. Set `updated` to today's date in the project file and in the log file.
6. Run `npx @ionianlabs/brain index {{BRAIN_DIR}}`, then `npx @ionianlabs/brain lint {{BRAIN_DIR}}`. Fix any errors you caused. If Node is not available, say so and skip both.
7. Report a short summary of what changed: the files touched, the log entries added and the open items added or removed.

## Rules

- Stay inside the project's org. Do not read or write notes of another org. Do not copy content between orgs.
- Never open `.confidential/`.
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
