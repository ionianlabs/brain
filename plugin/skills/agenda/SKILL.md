---
name: agenda
description: Budgeted, read-only view of what needs the owner now. Use when the user says "agenda", "brief", "morning brief" or "what's on today". Shows at most 5 items under "Needs you" and at most 20 lines in total, ranked across projects, with everything else folded into counts. Say "agenda everything" for the full report. Never edits anything.
---

# Agenda

Show what needs the owner now, inside a hard attention budget, and fold the rest into counts. This skill is read-only: never edit, create, move or delete anything.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the `BRAIN_DIR` environment variable if it is set, otherwise `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, otherwise `~/Ionian/brain`. Below, `<brain>` is that folder.

Find the brain CLI the same way. Use the command named in your session context, if there is one. Otherwise use `node "<skill>/../../cli/bin/brain.mjs"`, where `<skill>` is the folder that holds this SKILL.md. Below, `<cli>` is that command.

If `<brain>/AGENTS.md` does not exist, say that no brain was found there and offer to create one with `<cli> init "<brain>"`. Then stop.

## Steps

1. Read `<brain>/AGENTS.md`. If it has an `## Agenda rules` block, read and obey it. Rules may tighten the report. They never raise the 5-item or 20-line caps.
2. Take today's date from the system. Compare dates by whole days.
3. Run `<cli> open "<brain>" --json`. This is your only source for open items. Add `--project <slug>` or `--org <slug>` when the user gave a scope. Never read project files in bulk.
4. List `<brain>/inbox/`. Count the captures. Note the Instinct day files (`source: flow`) and how many lines in them are still marked `- [ ]`. If you cannot list the folder, say so in the report. Do not write "none".
5. Run `<cli> lint "<brain>"` and read the output.
6. If `<cli> open` or `<cli> lint` cannot run, say which data is missing and report the rest. Never write "none" for data you could not get.
7. Never open `.confidential/`, even if a note mentions it.
8. Where the host supports subagents and the user asks a follow-up about a specific file, ask the `reader` agent one question with the brain path. Without subagents, read only the lines you need. The agenda itself never needs it.

## Report

The report has an attention budget: at most 5 items under "Needs you" and at most 20 lines in total. A line is any non-blank output line, headings and fold lines included. Everything else appears only as counts. Print these sections, in this order:

1. **Header**: the date, then `N need you, M held back`. "Held back" counts every open item in scope that got no line of its own anywhere in the report.
2. **Needs you**: every p0 item regardless of due date, plus overdue and due-today items of any priority, ranked as `<cli> open` ranks them, at most 5. Fold the rest of the eligible items into one line, `and K more need you — say more`. Saying "more" expands the whole section.
3. **Coming up**: items due in the next 3 days (scope "week" widens this to 7 days), p0 and p1 only, same ranking. An item appears in one section only, the earliest that admits it.
4. **Blocked**: items with `blocked`, with the reason and the `owner` as who to talk to.
5. **Inbox**: the count only. Call out Instinct day files, and say "say triage".
6. **Hygiene**: one line, only when lint reports errors or over-budget or stale warnings.
7. **Honesty line**: exactly one line with the totals of held-back items and of unranked or undated items. Give the per-project breakdown only when asked.

Only sections 2 to 4 print item lines. Each item line names its project, for example `[client-a-site]`. Do not group the default report by org and do not cluster it by project: five ranked lines need no grouping. When the 20-line total would be exceeded, "Coming up" collapses to a count first, then "Blocked". "Needs you" never collapses below its 5.

## Scope

- A project slug (`agenda atlas`): only that project's items and hygiene findings.
- An org slug: only that org's items and findings. Never mix one org's details into another's.
- `week`: the "Coming up" horizon becomes 7 days.

## Exhaustive mode

When the user says "agenda everything", print the full report instead. Group by org, one heading per org (`personal` last), and cluster by project inside each org. Per org, in this order:

- **Overdue**: open items with `due` before today.
- **Due in 7 days**: open items due from today to today plus 7 days.
- **Blocked**: open items with `blocked`, with the reason.
- **Who to talk to**: the owners of overdue, due-soon and blocked items, plus People whose entry says when to talk to them.
- **Changed in the last 7 days**: notes with `updated` in the last 7 days.
- **Inbox**: the count of captures and their file names. A capture with `org: unknown` goes in a separate "Unsorted" group at the end.
- **Hygiene**: the counts of errors and warnings and the most important findings, under the org of the note they name.

Its data stays command and lookup based. Items and owners come from `<cli> open "<brain>" --json`. Recent changes come from the `updated` dates in `<brain>/index.md`. People entries come from single questions to the `reader` agent, or from reading only the `## People` lines of one project without it. Never read files in bulk. End each org with one line, `No due date: N open items`.

## Rules

- Read-only. Report only; do not triage or fix anything.
- Every item names its project.
- Stay inside one org per section. Orgs other than `personal` are isolated from each other.
- Keep each line short. Do not repeat the full item text if a few words are clear.
- End with one line that suggests the single most useful next step, inside the 20 lines in default mode.

## Example output

Today is 2026-11-08. Default report:

```
Agenda 2026-11-08: 3 need you, 18 held back
Needs you
- p0  [rover] Ship the beta (due 2026-11-05, owner: Ada)
- p1  [atlas] Confirm the pilot plan (due 2026-11-07, owner: Sam)
- p0  [rover] Pick the launch city
Coming up
- p1  [atlas] Review the budget (due 2026-11-10)
Blocked
- [rover] Publish the pricing page: waiting for legal review (talk to Ada)
Inbox: 4 captures, 1 Instinct day file, say triage
Hygiene: 0 errors, 1 warning (atlas is over its word budget)
Held back: 18 items with no line here, 6 of them undated or unranked
Next step: ask Ada about the pricing page.
```
