---
name: brief
type: prompt
description: Read-only briefing of the brain, grouped by org. Run with /brief.
agent: agent
tools: ['search/codebase', 'execute/runInTerminal']
---

# Brief

Give a short, read-only briefing of the brain. Never edit, create, move or delete anything.

## Steps

1. Read `{{BRAIN_DIR}}/AGENTS.md`, then `{{BRAIN_DIR}}/index.md`.
2. Read every project file in `{{BRAIN_DIR}}/projects/` whose `phase` is `active` or `paused`. Skip `done`.
3. List `{{BRAIN_DIR}}/inbox/` and read each capture.
4. Never open `.confidential/`, even if a note mentions it.
5. Parse the open items. Read only the lines under `## Open` that start with `- [ ]`. The format is `- [ ] Text (owner: Name, due: YYYY-MM-DD, blocked: reason)`. All three parts are optional.
6. Take today's date from the system. Compare dates by whole days.
7. Run `npx @ionianlabs/brain lint {{BRAIN_DIR}}` and read the output. If Node or npx is not available, write "Hygiene skipped: Node is not available" and move on.

## Report

Group the whole report by org, with one heading per org (`personal` last). Inside each org use these sections, in this order. Omit nothing: write "none" for an empty section.

- **Overdue**: open items with `due` before today.
- **Due in the next 7 days**: open items due from today to today plus 7 days.
- **Blocked**: open items with `blocked`, with the reason.
- **Who to talk to**: the owners of overdue, due-soon and blocked items, plus People whose entry says when to talk to them.
- **Changed in the last 7 days**: notes with `updated` in the last 7 days.
- **Inbox**: the count of captures and their file names. A capture with `org: unknown` goes in a separate "Unsorted" group at the end.
- **Hygiene**: a short summary of the lint result, with the counts of errors and warnings and the most important findings. Hygiene findings are listed under the org of the note they name.

End each org with one final line: `No due date: N open items`. N counts the open items in that org that have no `due`.

## Rules

- Every item names its project, for example `[client-a-site]`.
- Never mix one org's details into another org's section. Orgs other than `personal` are isolated from each other.
- Keep each line short. Do not repeat the full item text if a few words are clear.
- End with one line that suggests the single most useful next step.

## Example output

```
## client-a

Overdue
- [client-a-site] Send the revised quote (owner: Sam, due: 2026-10-30)

Due in the next 7 days
- [client-a-site] Review the launch checklist (owner: Sam, due: 2026-11-05)

Blocked
- [client-a-site] Publish the pricing page (blocked: waiting for legal review)

Who to talk to
- Sam, for the quote and the checklist
- Dana (legal contact, per People) about the pricing page

Changed in the last 7 days
- [client-a-site] updated 2026-11-01

Inbox
- none

Hygiene
- 0 errors, 1 warning: client-a-site is over its word budget

No due date: 3 open items

## personal

Overdue
- none

Due in the next 7 days
- [home-lab] Renew the domain (due: 2026-11-07)

Blocked
- none

Who to talk to
- none

Changed in the last 7 days
- none

Inbox
- 2 captures: 2026-11-01-reading-list.md, 2026-11-02-idea.md

Hygiene
- no findings

No due date: 1 open item

Next step: send the revised quote for client-a-site.
```
