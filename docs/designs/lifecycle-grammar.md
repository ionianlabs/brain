# Lifecycle grammar: provenance, priority and `brain open`

Status: approved (2026-11-08)
Slug: lifecycle-grammar
Date: 2026-11-08

## Problem

A brain accumulates facts from several authors: the owner, people the owner talked to, and agents writing on their behalf. The format records none of that, so six weeks later nobody can tell whether "switch to weekly releases" was the owner's decision, a colleague's remark or an agent's guess. Open items carry no priority, so `## Open` across ten projects reads as one flat, endless list and any cross-project ranking lives in hand-edited prose that goes stale. There is also no machine-readable view over open items: every agent that wants "what is due" must load every project file into its context, which is slow, token-hungry and invites the model to free-associate over unrelated prose. This spec adds the minimal grammar (author prefixes, a `prio` field) and one read-only CLI command (`brain open`) that later skills build on.

Context: the brain folder layout, note types, open-item syntax, log shape, lint rules and CLI conventions this spec extends are defined in docs/spec.md (sections 2 to 6, 11 and 12), and the skills it mentions in passing are outlined in section 14 (brief, handover) and template/skills/aware/SKILL.md (aware). `budget()` and the lint rule names live in src/lint.mjs. Read that contract first; a term not defined here is used exactly as it defines it.

## Out of scope

- New or changed skills (`brief`, `handover`, `aware` or successors). A separate spec, `lifecycle-skills`, builds on this one.
- Subagents, session protocol or AGENTS.md rule changes beyond documenting the grammar.
- Rewriting existing brain content to the new grammar. Old bullets and items stay valid.
- Any scheduling, reminders or calendar integration.

## Terms

- **Owner**: the person whose brain it is. The default author of every unattributed bullet.
- **Provenance prefix**: the first word(s) of a log or `## Now` bullet that name what kind of fact it is and who it came from.
- **Open item**: a line under `## Open` in a project file matching `- [ ] Text (…)` as defined in docs/spec.md section 4.
- **Ranked item**: an open item whose parentheses carry a valid `prio`.

## Features

### F1. Provenance prefixes (P1)

Why: removes the author mix-up: once a bullet is written without attribution, the authorship can never be recovered. The prefix is stamped at write time, the only moment it is known.

Story: As the owner, I want every bullet in logs and `## Now` to show whether it is my decision, someone's statement or an agent's inference, so that I never mistake a stakeholder's remark or a model's guess for my own call.

The grammar, added to docs/spec.md sections 4 (Now bullets) and 5 (log bullets):

| Prefix | Means | Attribution |
|---|---|---|
| `Done:` | completed work | optional `Done(Name):` |
| `Decision:` | a decision in force | optional `Decision(Name):`; bare form means the owner decided |
| `Said(Name):` | a statement by someone else | name required |
| `Inferred:` | a conclusion or connection proposed by an agent, not yet confirmed by the owner | optional `Inferred(agent-name):` |

Default-author rule: an unattributed bullet belongs to the owner. Anything that is not the owner's must carry a named prefix (`Done(Name):`, `Decision(Name):`, `Said(Name):`) or `Inferred:`. `Decision(Sam):` records that Sam decided; `Said(Sam):` records a statement that decided nothing. A bullet an agent records at the owner's instruction is the owner's and uses the bare form; only the agent's own conclusion carries `Inferred:`. Prose bullets without any prefix remain legal in logs (spec 5 allows "earlier state"), so existing brains do not light up with findings.

A prefix token is one of the four words immediately followed by an optional parenthesised non-blank attribution and a colon: `Decision(Sam):`. A space before the parenthesis (`Said (Sam):`) makes the line prose; whitespace-only parentheses (`Said( ):`) are empty; the attribution text is free (several names are fine).

The `provenance/malformed` check reads log bullets only: top-level `- ` lines outside code fences, in files under `logs/`. It flags `Said:` without a parenthesised name, and empty parentheses on any of the four prefixes, with at most one finding per line. A line that does not start with a prefix token (lowercase or unknown prefixes included) is prose and is never flagged.

Scenarios:
- F1.1 Given a log bullet `- Decision: ship weekly`, when lint runs, then no finding: the decision is the owner's.
- F1.2 Given a log bullet `- Said(Sam): the API freeze moves to March`, when lint runs, then no finding, and any reader knows the fact is Sam's statement, not the owner's plan.
- F1.3 Given a log bullet `- Said: the freeze moves`, when lint runs, then one `provenance/malformed` warning: `Said` requires a name in parentheses.
- F1.4 Given a log bullet `- Decision(): ship weekly` (empty parentheses), when lint runs, then one `provenance/malformed` warning.

Testability: unit. Tested on its own by lint fixtures in test/lint.test.mjs holding each bullet form; shows the exact rule, severity and line per case.

### F2. Priority on open items (P2)

Why: removes the flat-list problem: without a per-item priority there is nothing to rank by, and cross-project priority degenerates into a stale hand-written block.

Story: As the owner, I want each open item to optionally carry `prio: p0|p1|p2`, so that views and agents can rank items instead of dumping them.

Grammar (extends docs/spec.md section 4): inside the existing parentheses, alongside `owner`, `due` and `blocked`:

```
- [ ] Text (prio: p0, owner: Sam, due: 2026-12-01)
```

- `p0` = needs the owner today or blocks others; `p1` = this week; `p2` = scheduled, later.
- `prio` is optional. An item without it is unranked and sorts after `p2`.
- `due` validity uses `isValidDate` from src/dates.mjs (the same check `updated` gets today). An item with several bad fields gets one `open-item/malformed` warning per bad field. `owner` and `blocked` stay free text and are not checked.

Parsing rules, shared by lint and `brain open` via `parseOpenItem`:

- The field group is the last parenthesised group at the end of the line, and only when its first segment matches `<lowercase word>:`. Otherwise the parentheses are part of the text and nothing checks them: `- [ ] Draft the page (see note)` stays legal.
- Fields split on `, ` only directly before a `<lowercase word>:` segment; a segment without one extends the previous field's value, so `(blocked: waiting for review, then deploy)` parses as one value and `(owner: Sam, with Ada)` keeps "Sam, with Ada" as the owner.
- A segment whose key is not `prio`, `owner`, `due` or `blocked` (such as `priority: p0` or `size: l`) gets one `open-item/malformed` warning naming the unknown key.
- Keys and `prio` values are case-sensitive lowercase: `prio: P1` is a bad value. A capitalised key (`Prio:`) never matches `<lowercase word>:`, so it makes the group plain text when first and otherwise extends the previous field's value. A duplicated key's last value wins.
- `open-item/malformed` checks `## Open` in every project file, whatever its `phase`.

Scenarios:
- F2.1 Given an item `- [ ] Call Sam (prio: p1, due: 2026-12-01)`, when lint runs, then no finding.
- F2.2 Given `- [ ] Call Sam (prio: high)`, when lint runs, then one `open-item/malformed` warning naming the allowed values p0, p1, p2.
- F2.3 Given `- [ ] Call Sam (due: 2026-13-40)`, when lint runs, then one `open-item/malformed` warning: `due` must be a valid YYYY-MM-DD date. (New check; today a bad due date passes silently.)
- F2.4 Given `- [ ] Call Sam (priority: p0)`, when lint runs, then one `open-item/malformed` warning naming the unknown key `priority`.

Testability: unit. Tested on its own by lint fixtures per scenario in test/lint.test.mjs; shows one warning per bad field, silence on F2.1, and unchanged `budget()` item counting.

### F3. `brain open`: the cross-project item view (P3)

Why: removes the bulk-read problem: agents and the owner get a ranked list of open items without loading a single project file into an agent context.

Story: As the owner (or an agent asked "what's on"), I want one command that lists open items across all projects, ranked, so that priority across projects is computed from the items instead of maintained by hand.

Behaviour:
- Signature: `brain open [dir]`, default `dir` is `.` like index and lint; a missing directory exits 2.
- Scans `projects/*.md` whose `phase` is exactly `active` or `paused`; any other or missing phase is skipped. Reads only `## Open` lines matching the open-item syntax.
- Sort order: `prio` ascending (p0 first, unranked last), then `due` ascending (no due last), then project slug ascending; remaining ties keep file order. An invalid `prio` value counts as unranked. A present but invalid `due` counts as no due date: it sorts last, `--due-within` excludes it, it counts as "without due date", and JSON shows `null`.
- Text output: one line per item, fields `prio  due  project  text` separated by two spaces, unpadded, with `-` for an absent or invalid prio or due. The text is the line's text with the field group removed (any other parenthetical stays). One single space then separates it from a parenthetical holding only the keys that are present, in the order owner then blocked, joined by `, ` (omitted entirely when both are absent); `blocked` is the free-text reason, verbatim. Then one summary line, always printed in its full form and counting the items after filters: `N items: A p0, B p1, C p2, D unranked; E without due date`.
- `--json` prints one object `{"items": [...], "summary": {"total": N, "p0": A, "p1": B, "p2": C, "unranked": D, "withoutDue": E}}`; each item is `{project, org, text, prio, owner, due, blocked, line}`, where `line` is the 1-based line number in the project file, absent fields are `null`, and an invalid prio is `null` (unranked).
- Flags: `--org <slug>` (matches the project file's `org` frontmatter key), `--project <slug>`, `--due-within <days>` (items whose due date lies between today and today plus N days, both inclusive, plus all overdue items; items without a due date are excluded; N must match `^\d+$`, anything else exits 2), `--today <YYYY-MM-DD>` (validated like lint's `--today`, default the local date). Filters combine with AND; a `--project` or `--org` value matching nothing yields zero items and exit 0.
- Read-only, exit 0 when it ran (even with zero items), exit 2 on usage errors, following lint's conventions (docs/spec.md 11.2 and 12).
- Malformed parentheses never crash the command: the item is listed with the fields it could parse.

Scenarios:
- F3.1 Given two `phase: active` projects, `rover` with `- [ ] Ship beta (prio: p0, due: 2026-12-01)` and `atlas` with `- [ ] Call Sam (prio: p1)`, when `brain open --today 2026-11-08` runs, then the rover line prints first and the summary reads `2 items: 1 p0, 1 p1, 0 p2, 0 unranked; 1 without due date`.
- F3.2 Given the same brain, when `brain open --project atlas --today 2026-11-08` runs, then only the atlas item prints and the summary counts 1 item.
- F3.3 Given items due 2026-11-11, 2026-11-20 and 2026-11-06, when `brain open --due-within 7 --today 2026-11-08` runs, then the 2026-11-11 item and the overdue 2026-11-06 item print, the 2026-11-20 item does not.
- F3.4 Given a brain with no projects, when `brain open` runs, then it prints the full summary line `0 items: 0 p0, 0 p1, 0 p2, 0 unranked; 0 without due date` and exits 0.
- F3.5 Given `brain open --due-within x`, when the command runs, then it exits 2 with the standard usage-error line.

Testability: unit. Tested on its own by `openItems` on fixtures in the new test/open.test.mjs; shows ranking, filtering and the summary. Integration: the `open` command and its flags in test/cli.test.mjs; shows the exact text output and exit codes.

## Success criteria

- SC1 From a brain with 10 projects and 60 open items, one command returns the ranked cross-project list; no project file needs to be opened by a person or an agent to get it.
- SC2 A unit test of `parsePrefix` maps each of the four prefixes, their attributed forms and a prose line to exactly one of owner / other person / agent inference / prose, so any log bullet is classifiable from the line alone. Adoption is carried by the documented grammar and, later, by the skills of the lifecycle-skills spec.
- SC3 Lint on an existing conformant brain (the fixtures in `examples/sample-brain`) yields zero new findings: the grammar is additive.
- SC4 All examples added to templates, docs, fixtures and tests are fictional; checked by a manual review before merge of every new name, date and quote in the changed files, none of which may come from a real brain.

## Interfaces and data

- `src/items.mjs` (new): `parseOpenItem(line)` → `{text, prio, owner, due, blocked, raw}` and `parsePrefix(line)` → `{prefix, author}`; shared by lint and open.
- `src/open.mjs` (new): `openItems(root, {org, project, dueWithin, today})` → `{items, summary}`; `formatOpen(result)` for text output.
- `bin/brain.mjs`: new `open` command and flags; `USAGE`, `HELP.open`, `ALLOWED.open` entries.
- `src/lint.mjs`: new rules `provenance/malformed` (warning) and `open-item/malformed` (warning), added to the table in docs/spec.md section 11.
- `docs/spec.md`: sections 4 (item syntax), 5 (log bullets), 11 (lint rule table) and 12 (CLI: a `brain open` entry) extended as above; `source` noted as an optional capture key (values such as `chat`, `flow`, `agent`) in section 6 — documentation only, no parser or lint change.
- `template/AGENTS.md`: the Open items and the log parts of Writing rules show the grammar; `template/templates/project.md` and `log.md` carry one example each.
- `scripts/build-plugin.mjs`, `plugin/cli/`: pick up the new files via the existing copy step; no build-script change expected.
- Tests run with `npm test` (`node --test`); the repo has no harness config.

## Decisions

- Prefix lint checks well-formedness only (`Said` without name, empty parens); it never requires a prefix on every bullet. Rejected: mandatory prefixes, because logs legally contain prose "earlier state" bullets and old entries must never be edited, so a hard rule would create unfixable findings.
- Bare `Decision:` means the owner. Rejected: requiring `Decision(me):`, because the common case should be the shortest and old entries already use the bare form.
- Budget severities stay as they are (warnings). Rejected: escalating `state/over-budget` to error, because existing over-budget brains would fail lint, and the handover/sync skills treat errors as must-fix while old log entries cannot be edited. The agenda skill (next spec) surfaces the warning instead.
- `brain open` exits 0 even when p0 items are overdue, and a filter that matches nothing yields zero items, not an error. Rejected: exit 1 or a usage error as a signal, because it is a view, not a check; scripts can read `--json`.
- The `source` capture key is documented here although only the lifecycle-skills spec uses it, so that spec can stay free of format changes. Rejected: moving it there, because every docs/spec.md change belongs to the format spec.

## Assumptions

- Three priority levels are enough. If wrong: the value set widens in `items.mjs` and the spec table; no structural change.
- `## Now` bullets follow the same prefix grammar as log bullets without a dedicated lint pass over `## Now`. If wrong: extend the same check to `## Now` sections later.

## Dependencies

none

## Review
- Round 1 (2026-11-08): paraphrase context missing (fixed with a pointer paragraph to docs/spec.md), 0 divergences, 18 guesses; critic B0 M6 N3; readiness B0 M8 N5. After merging 4 duplicates: fixed 17, rejected 1, escalated 0. Not run: none.
- Round 2 (2026-11-08): paraphrase context sufficient by pointer, 0 divergences, 13 guesses (one exposed a contradiction, fixed below); critic B0 M0 N0, all 22 earlier resolved; readiness B0 M0 N0, all 22 earlier resolved. Not run: none.
- Rejected: C1-9: documenting `source` in docs/spec.md section 6 is unrelated scope. Reason: the Decisions section states why it lives here (the lifecycle-skills spec builds on it and docs/spec.md changes belong to the format spec).
- Fixed after round 2, unreviewed: the `Prio:` unknown-key clause contradicted the split rule (a capitalised key now extends the previous value); duplicate key last-wins; invalid prio/due print `-`; item text defined as the line minus the field group; single space before the owner/blocked parenthetical; `open-item/malformed` checks every project file whatever its phase.
