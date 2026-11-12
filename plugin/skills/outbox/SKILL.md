---
name: outbox
description: Stage brain content for a shared audience, safely. Use when the user says "outbox", "stage for" an audience, "what can I share with" an audience or "prepare an audience update", for example "stage for steering". Reads the audience definition, applies the barrier, proposes only rewritten items that are safe and relevant, and writes only what the owner approves, item by item, to that audience's folder under outbox/. Also withdraws items and logs what was shared. Never contacts an outlet.
---

# Outbox

The only path from the brain to anything shared. Content leaves the brain only as approved, rewritten items in `outbox/<audience>/`. Everything in that folder must be safe to share with that audience, the manifest included. You never contact an outlet and never publish. A separate publisher reads the folder.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `~/Ionian/brain`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Steps

1. Audience. The owner must name it. Never infer one. If none is named, ask which audience and write nothing. If `<brain>/outbox/<audience>/audience.md` does not exist, offer to create it from `templates/audience.md` and stop until it exists.
2. Validate `audience.md`. If any check fails, name the problem, write nothing and stop:
   - `audience` equals the folder name. `space` and `roles` exist, `roles` is a list. `rank` is a positive integer.
   - `brain.org` is exactly one org, not `personal`.
   - Every `brain.members` slug has `people/<slug>.md`, and that note has the same `org`.
   - `brain.receives` is present, not empty, and holds only classes from the list under Content classes. It can only limit the allowlist (rule 1), never widen it.
   Read only the shared keys (`type`, `audience`, `space`, `rank`, `approver`, `roles`, `description`), `brain` and the body. Any other top-level key, such as `target`, belongs to the publisher. Never read, check or change it. If you edit the file, keep those keys byte for byte.
3. Handback, on every run for this audience, before scope and proposal. Find manifest entries with status `published` and no `Done: published to <audience>:` bullet naming the id in the source project's log. Find the source project by searching `logs/*.md` for a `Done: shared with <audience>:` bullet naming the id. Add the bullet `Done: published to <audience>: #4-#6` once per project, under today's `## YYYY-MM-DD` heading of that log (create it at the top if missing), like the shared bullet. An id with no such bullet is reported and logged nowhere. A status outside `approved | published | withdrawn` is reported and not logged.
4. Scope. The owner must give one: a project slug, specific notes, a meeting, or "since last run". If none, ask and write nothing. "Since last run" means log entries dated, and notes whose `updated` is, on or after the `approved` date of the newest package of this audience (a tie goes to the package with the highest manifest id). Same-day content is included; step 7 drops the duplicates. A fully withdrawn package still counts as a run. A run that approved nothing leaves no package and does not count. With no package yet, ask for an explicit scope.
5. Read `## Outbox rules` in `<brain>/AGENTS.md` first. It may add blocked terms and held-back classes. An entry that tries to allow something rules 1 to 7 hold back is ignored. Tell the owner about each ignored entry now, before any proposal.
6. Read the sources in scope under rule 3. Never open a note you may not read. Report each skip by category, without content: "confidential, skipped", "inbox, skipped", "other org, skipped". A note in scope with `status: draft`, `status: deprecated` or `personal` is not read: report it as "draft, skipped", "deprecated, skipped" or "personal, skipped" and ask the owner whether to release it. Only after the owner clears a named note in this conversation, read that note and propose only the items the owner clears. Never store a release anywhere. The next run asks again. A person note's header is its frontmatter plus its title line (`# Full Name`). For person notes read only the header, never anything below the title line.
7. Apply rules 1 to 9, 11 and 12 once to every candidate, then rule 10. Work with candidates one at a time and rewrite each into an item with a class, a source ref and, once approved, an id. Skip a candidate that restates (your judgement of meaning, not a text or id match) an item already in a package of this audience, and count it as "already shared: N".
8. Present, and write nothing yet:
   - **Proposed**: numbered items, rewritten, each with its class and source ref.
   - **Held back**: categories and counts only, never content. For example "opinion about people: 2, speculation: 1, higher rank only: 1".
   - **Needs decision**: each candidate you cannot classify or complete, with the question.
   - Two lines: "not relevant to <audience>: N" and "already shared: N".
   Context items (classes `definitions`, `roles`, `metrics`, `cadence`, `links`) are grouped under `context_sections` in order; with none, there is one Context section.
9. The owner approves per item, and may change a title or the package slug. If the owner selects a binary, say that its content is not inspected and that selecting it is their acceptance.
10. Self-check (rule 13) on everything approved, before any write. Scan each item, title, source ref, file name and purpose line for brain file paths, blocked terms and a 12-word overlap with its source notes. Drop each hit from the write and report it as "path", "blocked term" or "overlap". The owner may approve a rewritten version, which is checked again. Write only the clean items.
11. Write, only the approved and clean items. If nothing remains after the self-check, no package, manifest row or log bullet is written.
   - Package `outbox/<audience>/YYYY-MM-DD-<slug>.md` with `type: outbox`, `audience`, `approved` (today) and `source_refs` (meetings or threads with dates, never paths). The slug is the scope name unless the owner changed it; for a scope of several projects it is their slugs joined with `-` (for example `launch-pilot`). If the file exists, use `-2`, `-3`. Never overwrite. Sections only where they hold items, in this order: Decisions, Actions, Dates, Context, Open questions, Files. The Context section is split under `brain.context_sections` in order; with none, there is one Context section. Each item carries its id: `#4 Scope frozen from 2026-02-01`.
   - An Actions line is `Title | Owner | Due | Source`, for example `Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-10`. Owner is the display name from the person note's title line (`# Full Name`, part of the header), not the slug. An owner you inferred, or a missing due date, is `?`.
   - `manifest.md` (create it with `type: outbox` and the table header on the first run): one row per item, `ID | Item | Package | Status | Date | Outlet ref`, status `approved`. Ids are sequential per audience from the highest existing id, never reused.
   - A binary is copied to `outbox/<audience>/files/` and listed under Files with a one-line purpose. It must come from outside `.confidential/` and `inbox/` and belong to the audience's org. Its file name and purpose pass the same checks. Unselected binaries are never copied.
   - Private log, in each source project's `logs/<slug>.md`, under `## YYYY-MM-DD` (create it at the top if missing): `Done: shared with <audience>: #4-#6 (2026-11-11-launch-update.md) from /projects/launch.md, /knowledge/launch-plan.md`. One bullet per source project, listing only the ids and paths from that project. Contiguous ids are a range `#4-#6`, others are listed `#1, #2, #4`. A knowledge note with `project: <slug>` belongs to that project's log. A source with no project (a knowledge note without `project`, or a meeting scope) goes to the log of the project in scope. If the scope names no project, ask the owner which log. These paths live only in the log, never under `outbox/`.
12. Summary: items written, ids, package name, held back and not relevant counts, the skips by category (confidential, inbox, other org, draft, deprecated, personal) and the already shared count. Say that the publisher does the rest.

## Barrier

Rules 1 to 9, 11 and 12 are the barrier. Rule 10 is fit. Rule 13 is the self-check.

1. Allowlist. Only: decisions; dates and milestones; actions (owner, due); definitions and glossary; roles and responsibilities by role; metrics and their definitions; agreed cadence; open questions about the shared work; links to already-shared materials; owner-chosen files (rule 12). Everything else is held back. `receives` limits this list.
2. Always held back: opinions, readings or calibrations of people; stakeholder dynamics and politics; talking points, meeting prep, negotiation or positioning notes; commercial and contractual matters (prices, rates, contract terms, budgets of a supplier or employer); anything about another org; capacity, staffing, handover, career or personal matters; speculation or inferred facts presented as fact, including inferred owners; raw transcripts and verbatim quotes.
3. Never read: `.confidential/`; `inbox/`; anything below the title line of a person note (its body); `status: draft` and `status: deprecated` notes unless the owner clears them; notes of another org; `personal` notes unless cleared one by one. Notes with `status: stable` or none pass normally.
4. Provenance. `Inferred:` bullets are held back as "speculation". `Said(Name):` passes only as a decision or fact restated by role, for example "Scope freeze on 2026-02-01 (agreed)", never as a quote. Bare lines in logs, project notes and knowledge notes are the owner's facts and pass if the class is allowed.
5. Rewrite, never copy. No run of 12 or more consecutive words shared with a brain note, compared after lowercasing and removing punctuation and markdown. A person's name appears only for audience members and action owners. For anyone else use the `role` of their person note. A name with no person note, or a note with no role, goes to needs decision. A role comes only from a person note's `role`, never from a project's `## People` text.
6. Unknown is `?`. Never guess.
7. Every item has a source ref (meeting or thread plus date). Without one it is not proposed.
8. `## Outbox rules` may add blocked terms (case-insensitive, whole phrases) and held-back classes. They never loosen rules 1 to 7. Blocked, for example, `Zeta Corp` catches "zeta corp" but not "Zeta Corporation".
9. Scan every candidate, including titles, text, source refs, file names and purpose lines, for: names without a person note or role (needs decision), sentiment about people, money, blocked terms, and markers such as "private", "internal", "between us", "my take", "I think", "worried", "politics". A hit on a blocked term, a marker or sentiment about people is held back, as "blocked term", "private marker" or "opinion about people". Commercial matters are held back. Any other amount of money, also inside a metric, goes to needs decision. Percentages, durations and counts are not money.
10. Fit, after the barrier, only limiting. Keep first what `brain.receives` allows, then what the body of `audience.md` says the audience needs. Consolidate lines you judge to be about the same decision, date or action within one project into one item whose source ref lists every meeting or thread it draws on. The rest is "not relevant to <audience>: N", counted apart from held back and never written. A consolidated item still passes the full barrier.
11. Rank flow. For audience A of space S, compare each candidate with the packages of every audience of S with a higher rank. A candidate that restates an item shared there and not with A or a lower rank is held back as "higher rank only". An item in a lower-rank package may be proposed to a higher rank. It reads `space` and `rank` from the `audience.md` of the other audiences under `outbox/` and their packages. Different spaces: no rule.
12. Binaries. A file is an item of class `files`, selectable only by the owner, from outside `.confidential/` and `inbox/`, from a location of the audience's org.
13. Self-check, step 10.

## Content classes

`decisions`, `dates`, `actions`, `definitions`, `roles`, `metrics`, `cadence`, `open-questions`, `links`, `files`. Context items are the classes `definitions`, `roles`, `metrics`, `cadence` and `links`.

## Withdraw

When the owner says "withdraw item 5", first apply step 1 (the audience must be named), because ids are per audience:

- An unknown id, or one already `withdrawn`: say so and change nothing.
- Allowed status changes: `approved` to `published` (made by the publisher, or by the owner by hand), `approved` to `withdrawn` and `published` to `withdrawn` (the owner). Any other, such as `withdrawn` to `approved`: report it and change nothing.
- Otherwise set the manifest row to `withdrawn`, keep the row, and delete the item's line from its package. When deleting a line leaves a section with no items, remove that section's heading too. If no items remain, the package keeps only its frontmatter and the line `All items withdrawn`.
- For a `published` item, also tell the owner to remove it from the outlet. The outbox cannot recall it.

## Rules

- Never write unapproved content to `outbox/`. No staged files.
- Never put brain file paths, blocked terms, or any text below the title line of a person note under `outbox/`. Person notes give only `role`, and the name for members and action owners.
- Never contact an outlet, publish, or format for one.
- Never guess. Unknown is `?`.
- Never open `.confidential/`. Never edit or delete existing log entries.
- Do not commit or push anything unless the user asks.

## Example

`team` (rank 1, org `acme`, `receives: [decisions, dates, actions]`), scope `launch`. The project has three lines on the scope freeze, the date "Go-live 2026-03-10", the action "Send test plan, Sam, due 2026-11-20", a line of opinion about Sam, and a line naming `Zeta Corp`.

```
Proposed
1. Decisions: Scope frozen from 2026-02-01; change requests go to steering (Launch sync 2026-11-03; Launch sync 2026-11-10)
2. Dates: Go-live 2026-03-10 (Launch sync 2026-11-10)
3. Actions: Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-10
Held back: opinion about people 1, blocked term 1
Needs decision: none
not relevant to team: 0
already shared: 0
```

The owner approves 1 and 3. Written: `outbox/team/2026-11-11-launch.md` with two items, manifest entries #1 and #2 as `approved`, and in `logs/launch.md` under `## 2026-11-11`: `Done: shared with team: #1-#2 (2026-11-11-launch.md) from /projects/launch.md`.
