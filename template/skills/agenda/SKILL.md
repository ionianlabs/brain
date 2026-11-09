---
name: agenda
type: skill
description: Read-only view of what needs the owner now. Use when the user says "agenda", "brief", "morning brief" or "what's on today". Prints a short markdown report built as tables, a summary line first and then at most 5 items each under "Needs you", "Coming up" and "Blocked", with everything else folded into counts. Say "agenda everything" for the full report. Never edits anything.
---

# Agenda

Show what needs the owner now, inside a hard attention budget, and fold the rest into counts. This skill is read-only: never edit, create, move or delete anything.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Steps

1. Read `<brain>/AGENTS.md`. If it has an `## Agenda rules` block, read and obey it. A brain's rules may tighten the report, for example on wording or who to name. They never raise the caps of 5 items per table.
2. Take today's date from the system. Compare dates by whole days.
3. Read each `<brain>/projects/*.md` whose frontmatter `phase` is not `done`. From each file read only the frontmatter (`org`, `phase`) and the `## Open` section, nothing else. If the user gave a scope, read only the files in scope.
4. An open item is a line that starts with `- [ ] `. Its keys come from the LAST parenthesis group on the line: `prio`, `owner`, `due`, `blocked`. A `prio:` that appears elsewhere on the line is ignored, and the item counts as unranked.
5. List `<brain>/inbox/`. Count the captures, and the Aware day files (`*-aware.md`, `source: flow`) with the number of their lines still marked `- [ ] `. If you cannot list the folder, say so in the report. Do not write "none".
6. Never open `.confidential/`, even if a note mentions it. Never write "none" for data you could not get.

## Ranking

"Needs you" takes, in this order:

1. overdue items, oldest due first;
2. items due today;
3. p0 items without a date or with a later date.

Ties break by prio (p0, p1, p2, unranked), then by project file order, then by line order.

"Coming up" takes items due in the next 3 days, p0 and p1 only, that are not already shown. Scope `week` widens this to 7 days.

"Blocked" takes items with `blocked`.

An item appears once only, in the first section that admits it. Show at most 5 items in each section.

## Report

Markdown, built so the summary line is read first, then the Needs you table. Use exactly this shape and leave out any section that would be empty:

```
## Agenda, Mon 9 Nov

**4 need you** · 2 coming up · 1 blocked · inbox: 3 captures, 1 Aware file

### Needs you
| Prio | What | Project | Due | Talk to |
|---|---|---|---|---|
| **p0** | Talk to Alex on role and scope | atlas | **today** | Alex |
| **p0** | Define the setup | client-a-site | **overdue** since 6 Nov | Sam |

### Coming up
| Prio | What | Project | Due | Talk to |
|---|---|---|---|---|
| p1 | Review the pilot scope | atlas | Wed 11 Nov | Sam |

### Blocked
| What | Project | Waiting for | Talk to |
|---|---|---|---|
| Publish the pricing page | client-a-site | legal review | Alex |

**Next:** talk to Alex today, before the setup is defined.

*Not shown: 110 open items (25 p1, 50 p2, 35 unranked). Say "agenda everything" for all, or "agenda atlas" for one project.*
```

Rules for the report:

- The summary line counts what qualifies, not what is shown. Use `·` in the summary line only.
- "What" is the item text shortened to about 60 characters, with markdown links and emphasis removed.
- "Talk to" is the item's `owner`, else a person named in the item text, else empty. Never write "nobody".
- Due fields are one of `**overdue** since 6 Nov`, `**today**`, `Tue 10 Nov`, or empty.
- When more than 5 items qualify for Needs you, the table shows 5. Add one line under it: `*12 more need you. Say "agenda everything" to see them.*`
- When more than 5 items are p0, use this line instead: `**12 items are p0.** p0 means today or blocking others, so most need re-ranking.` Use the real count.
- The Next line names the single most pressing action and who to talk to. When the inbox has captures and nothing in Needs you is due today or overdue, it says "say triage".
- The last line folds everything not shown into counts by prio. The per-project breakdown comes only when asked.
- Use no dashes anywhere in the report.

## Scope

- A project slug (`agenda atlas`): only that project's items.
- An org slug: only that org's items. Never mix one org's details into another's.
- `week`: the "Coming up" horizon becomes 7 days.

## Exhaustive mode

When the user says "agenda everything", print the full report instead:

- One `## <org>` heading per org, `personal` last.
- Inside each org, one `### <project>` heading per project that has any open item.
- Under each project heading, one table with the headers `Prio | What | Due | Talk to | Blocked`. Order the items overdue first, then by due date, then by prio.
- At the end, an `### Inbox` list of the capture file names, and an "Unsorted" group for notes with `org: unknown`.
- Never mix one org's items into another org's table.

## Rules

- Read-only. Report only; do not triage or fix anything.
- Every row names its project.
- Orgs other than `personal` are isolated from each other.
- Never open `.confidential/`.
- Never print em dashes or en dashes. Use commas, colons or full stops.
