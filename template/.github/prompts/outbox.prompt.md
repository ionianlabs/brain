---
name: outbox
type: prompt
description: Stage brain content for a shared audience, safely. Run with /outbox.
agent: agent
tools: ['search/codebase', 'edit/editFiles']
---

# Outbox

**Works on:** Brain content, for one named audience. **Question:** What is safe to share with them?

The only path from the brain to anything shared. Content leaves the brain only as approved, rewritten items in `outbox/<audience>/`. Everything in that folder must be safe to share with that audience, the manifest included. You never contact an outlet and never publish. A separate publisher reads the folder.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Steps

1. Audience. The owner must name it. Never infer one. If none is named, ask which audience and write nothing. If `<brain>/outbox/<audience>/audience.md` does not exist, offer to create it from `templates/audience.md` and stop until it exists.
2. Validate `audience.md`. If any check fails, name the problem, write nothing and stop:
   - `audience` equals the folder name. `space` and `roles` exist, `roles` is a list. `rank` is a positive integer.
   - `brain.org` is exactly one org, not `personal`.
   - Every `brain.members` slug has `people/<slug>.md`, and that note has the same `org`.
   - `brain.receives` is present, not empty, and holds only classes from the list under Content classes. It can only limit the allowlist (rule 1), never widen it.
   - `brain.max_items`, when present, is a positive integer. It is the item budget of one package (rule 10).
   Read only the shared keys (`type`, `audience`, `space`, `rank`, `approver`, `roles`, `description`), `brain` and the body. Any other top-level key, such as `target`, belongs to the publisher. Never read, check or change it. If you edit the file, keep those keys byte for byte.
3. Handback, on every run for this audience, before scope and proposal. Find manifest entries with status `published` and no `Done: published to <audience>:` bullet naming the id in the source project's log. Find the source project by searching `logs/*.md` for a `Done: shared with <audience>:` bullet naming the id. Add the bullet `Done: published to <audience>: #4-#6` once per project, under today's `## YYYY-MM-DD` heading of that log (create it at the top if missing), like the shared bullet. An id with no such bullet is reported and logged nowhere. A status outside `approved | published | withdrawn` is reported and not logged.
4. Status follow-up, on every run for this audience, after Handback and before scope. It keeps the outlet true by proposing state changes of items already published, backed by evidence in the brain.
   - Followed entries: manifest entries with status `published` that are not status entries (Item starting with `Status: #`) and not `withdrawn`. An empty `Outlet ref` does not matter. `approved` entries are not followed, and neither are `files` items.
   - Own scope, independent of the scope the owner gives next. Find the source project of each followed row as Handback does. In each such project read `projects/<slug>.md` and the entries of `logs/<slug>.md` dated on or after the `approved` date of the item's package. Rule 3 applies unchanged.
   - Entries that cannot be followed are reported in the summary as "not followed up" with the reason, and the run continues with the others: the package file is missing or has no `approved` date, the item's line is gone from the package, the id appears twice in the manifest, no `Done: shared with <audience>:` bullet names it, or the source project file or log is missing.
   - Matching is by meaning, using the item's line in its package, not only the manifest title. Propose a status line only when the evidence names the same object as the item's line and, for an Actions item, does not name a different owner. Anything weaker goes to **Needs decision** as a question, never to **Proposed**.
   - Evidence is explicit only: a `Done:` log bullet; a checked to-do (`- [x]`); a later `Decision(Name, ...):` or a decision from this audience's meeting (judged as rule 4 judges it) that answers or replaces the item; an explicit cancellation in a log or project note. An `Inferred:` bullet is never evidence. No evidence: propose nothing. Never infer a state from a due date.
   - Date order: evidence is ordered by the date of its log entry. A reopening counts only when its entry is dated after the entry of the evidence for the current state. Two contradicting pieces of evidence for one id with the same date: propose nothing and ask under **Needs decision**.
   - The current state of an item is the state in the newest status row naming it that is not `withdrawn`. With none, the item has no state. States, by the class of the item (its section in the package):
     - `done`: completed, or date or milestone reached, with evidence. Actions, Dates.
     - `dropped`: cancelled with no replacement. Actions, Open questions, Dates, Decisions.
     - `answered`: got its answer. If the answer is itself a shareable item (it passes the barrier and fit), propose it as a normal new item and the line reads `answered by` that item. If not, the line is a plain `answered`. Open questions.
     - `superseded`: replaced by a newer one, proposed as a normal item in the same run; the line reads `superseded by` that item. Decisions, Dates, Context.
     - `reopened`: the current state is `done`, `dropped` or `answered` and it is open again, with evidence. Proposed only when such a current state exists. Evidence that nets out to the state the outlet already has proposes nothing.
   - No repeat: propose no line that repeats the current state. At most one line per referenced id per run, the latest state.
   - Overdue, Actions only: an item whose `Due` in the package is before the run date, with no evidence, goes to **Needs decision** as a question, for example "#7 was due 2026-11-20: still open?". On the due date it is not overdue. The question comes back on every run until the brain holds evidence. Nothing is stored and there is no dismissal.
   - A withdrawn status row is not proposed again by itself. Ask once per run under **Needs decision**, for example "#6 done was withdrawn earlier: propose again?". If the owner answers yes in the conversation, that line counts as approved, goes through the self-check and is written with the others. Present is not regenerated.
   - A rejected line is stored nowhere, so it is proposed again on the next run while the evidence holds.
5. Scope. The owner must give one: a project slug, specific notes, a meeting, "since last run", or "status only". If none, ask and write nothing. "Since last run" means log entries dated, and notes whose `updated` is, on or after the `approved` date of the newest package of this audience (a tie goes to the package with the highest manifest id). Same-day content is included; step 8 drops the duplicates. A fully withdrawn package still counts as a run. A run that approved nothing leaves no package and does not count. With no package yet, ask for an explicit scope. "Status only" skips only the reading of scope sources and the proposal of new items; reading `## Outbox rules`, the barrier for status lines, present, approval, self-check, write and summary all run, and the package slug defaults to `status`.
6. Read `## Outbox rules` in `<brain>/AGENTS.md` first. It may add blocked terms and held-back classes. An entry that tries to allow something rules 1 to 7 hold back is ignored. Tell the owner about each ignored entry now, before any proposal.
7. Read the sources in scope under rule 3. Never open a note you may not read. Report each skip by category, without content: "confidential, skipped", "inbox, skipped", "other org, skipped". A note in scope with `status: draft`, `status: deprecated` or `personal` is not read: report it as "draft, skipped", "deprecated, skipped" or "personal, skipped" and ask the owner whether to release it. Only after the owner clears a named note in this conversation, read that note and propose only the items the owner clears. Never store a release anywhere. The next run asks again. A person note's header is its frontmatter plus its title line (`# Full Name`). For person notes read only the header, never anything below the title line.
8. Apply rules 1 to 9, 11 and 12 once to every candidate, then rule 10. Work with candidates one at a time and rewrite each into an item with a class, a source ref and, once approved, an id. Skip a candidate that restates (your judgement of meaning, not a text or id match) an item already in a package of this audience, and count it as "already shared: N".
9. Present, and write nothing yet:
   - **Proposed**: numbered items, rewritten, each with its class and source ref.
   - **Status**: status lines from step 4, after Proposed, with one continuous numbering (Proposed 1 to 2, Status from 3). Each line reads `Status: #6 Send test plan | done | Launch sync 2026-11-17` and shows no own id. A line that depends on a new item names it by proposal number, for example `answered by proposed item 1`. Every line is approved or rejected on its own.
   - **Held back**: categories and counts only, never content. For example "opinion about people: 2, speculation: 1, higher rank only: 1".
   - **Needs decision**: each candidate you cannot classify or complete, with the question.
   - Two lines: "not relevant to <audience>: N" and "already shared: N".
   - With a budget, propose at most `max_items` items, the strongest first. List up to three of the next candidates under **On the bench**, one line each, so the owner can swap.
   - An item that replaces a shared one says which id it replaces: when the replaced item is `published`, propose a `superseded by` status line; when it is still `approved`, propose its withdrawal.
   Context items (classes `definitions`, `roles`, `metrics`, `cadence`, `links`) are grouped under `context_sections` in order; with none, there is one Context section.
10. The owner approves per item, and may change a title or the package slug. If the owner selects a binary, say that its content is not inspected and that selecting it is their acceptance.
11. Self-check (rule 13) on everything approved, before any write. Scan each item, title, source ref, file name and purpose line for brain file paths, blocked terms and a 12-word overlap with its source notes. Drop each hit from the write and report it as "path", "blocked term" or "overlap". The owner may approve a rewritten version, which is checked again. Write only the clean items.
12. Write, only the approved and clean items. If nothing remains after the self-check, no package, manifest row or log bullet is written.
   - Package `outbox/<audience>/YYYY-MM-DD-<slug>.md` with `type: outbox`, `audience`, `approved` (today) and `source_refs` (meetings or threads with dates, never paths). The slug is the scope name unless the owner changed it; for a scope of several projects it is their slugs joined with `-` (for example `launch-pilot`). If the file exists, use `-2`, `-3`. Never overwrite. Sections only where they hold items, in this order: Decisions, Actions, Dates, Context, Open questions, Status, Files. The Context section is split under `brain.context_sections` in order; with none, there is one Context section. Each item carries its id: `#4 Scope frozen from 2026-02-01`.
   - An Actions line is `Title | Owner | Due | Source`, for example `Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-10`. Owner is the display name from the person note's title line (`# Full Name`, part of the header), not the slug. An owner you inferred, or a missing due date, is `?`.
   - `manifest.md` (create it with `type: outbox` and the table header on the first run): one row per item, `ID | Item | Package | Status | Date | Outlet ref`, status `approved`. Ids are sequential per audience from the highest existing id, never reused, and assigned only now: new items first, then status lines. A rejected line never takes an id.
   - Status lines go under `## Status`: `#14 Status: #6 Send test plan | done | Launch sync 2026-11-17`. That is the own id, the referenced id, the title copied from the referenced manifest row, the state (`answered by #14` or `superseded by #14` with the real id of the new item), and the evidence ref. The line carries the state only, never the reason. When the evidence names no meeting or thread, the ref is `Project log YYYY-MM-DD` with the date of the log entry. Each status line also gets a manifest row with Item `Status: #<ref id> <state>` (for example `Status: #6 done`), status `approved`, empty Outlet ref. The title of a new item never starts with `Status: #`; rewrite such a title. A status line that names a new item is written only if that item is written; otherwise it is not written and the summary reports it. If the owner approves the new item and rejects the status line, the item is written and the old one keeps its state.
   - A binary is copied to `outbox/<audience>/files/` and listed under Files with a one-line purpose. It must come from outside `.confidential/` and `inbox/` and belong to the audience's org. Its file name and purpose pass the same checks. Unselected binaries are never copied.
   - Private log, in each source project's `logs/<slug>.md`, under `## YYYY-MM-DD` (create it at the top if missing): `Done: shared with <audience>: #4-#6 (2026-11-11-launch-update.md) from /projects/launch.md, /knowledge/launch-plan.md`. One bullet per source project, listing only the ids and paths from that project. Status lines get the same bullet in the log of the project the evidence came from. Contiguous ids are a range `#4-#6`, others are listed `#1, #2, #4`. A knowledge note with `project: <slug>` belongs to that project's log. A source with no project (a knowledge note without `project`, or a meeting scope) goes to the log of the project in scope. If the scope names no project, ask the owner which log. These paths live only in the log, never under `outbox/`.
13. Summary: items written, ids, package name, held back and not relevant counts, the skips by category (confidential, inbox, other org, draft, deprecated, personal) the already shared count, the entries "not followed up" with their reasons and the status lines not written because their new item was dropped. Say that the publisher does the rest: it also applies each `approved` status row to the outlet item of the referenced id, found through that row's `Outlet ref`, then sets the row to `published` with a date.

## Barrier

Rules 1 to 9, 11 and 12 are the barrier. Rule 10 is fit. Rule 13 is the self-check. Status lines pass rules 1 to 9 and 13 like any item: the evidence ref follows rule 7, the copied title is scanned again (a hit is held back as "blocked term"), and the line inherits the class of the item it updates, so it is held back when `brain.receives` no longer holds that class.

1. Allowlist. Only: decisions; dates and milestones; actions (owner, due); definitions and glossary; roles and responsibilities by role; metrics and their definitions; agreed cadence; open questions about the shared work; links to already-shared materials; owner-chosen files (rule 12). Everything else is held back. `receives` limits this list.
2. Always held back: opinions, readings or calibrations of people; stakeholder dynamics and politics; talking points, meeting prep, negotiation or positioning notes; commercial and contractual matters (prices, rates, contract terms, budgets of a supplier or employer); anything about another org; capacity, staffing, handover, career or personal matters; speculation or inferred facts presented as fact, including inferred owners; raw transcripts and verbatim quotes.
3. Never read: `.confidential/`; `inbox/`; anything below the title line of a person note (its body); `status: draft` and `status: deprecated` notes unless the owner clears them; notes of another org; `personal` notes unless cleared one by one. Notes with `status: stable` or none pass normally.
4. Provenance. `Inferred:` bullets are held back as "speculation". `Said(Name):` passes only as a decision or fact restated by role, for example "Scope freeze on 2026-02-01 (agreed)", never as a quote. Bare lines in logs, project notes and knowledge notes are the owner's facts and pass if the class is allowed. A `Decision:` bullet with no name is the owner's own working decision. It becomes a `decisions` item only when this audience made or confirmed it: a `Decision(Name, ...):` naming a member other than the owner, or a decision logged from this audience's own meeting. Otherwise it counts as not relevant.
5. Rewrite, never copy. No run of 12 or more consecutive words shared with a brain note, compared after lowercasing and removing punctuation and markdown. A person's name appears only for audience members and action owners. For anyone else use the `role` of their person note. A name with no person note, or a note with no role, goes to needs decision. A role comes only from a person note's `role`, never from a project's `## People` text.
6. Unknown is `?`. Never guess.
7. Every item has a source ref (meeting or thread plus date). Without one it is not proposed.
8. `## Outbox rules` may add blocked terms (case-insensitive, whole phrases) and held-back classes. They never loosen rules 1 to 7. Blocked, for example, `Zeta Corp` catches "zeta corp" but not "Zeta Corporation".
9. Scan every candidate, including titles, text, source refs, file names and purpose lines, for: names without a person note or role (needs decision), sentiment about people, money, blocked terms, and markers such as "private", "internal", "between us", "my take", "I think", "worried", "politics". A hit on a blocked term, a marker or sentiment about people is held back, as "blocked term", "private marker" or "opinion about people". Commercial matters are held back. Any other amount of money, also inside a metric, goes to needs decision. Percentages, durations and counts are not money.
10. Fit, after the barrier, only limiting. Passing the barrier means an item may be shared, not that it should be. Keep first what `brain.receives` allows, then apply the fit test: a member of this audience has to decide, confirm or unblock it, or it changes something this audience was already told. The body of `audience.md` (detail level, interests, decides) settles doubt. Then:
    - Actions: only those agreed in this audience's meeting, owned by a member other than the owner, or needing a member to act. The owner's own to-do list is status, never an action for the audience.
    - Open questions: a question this audience must answer passes, also when the owner plans to ask it in an upcoming meeting. The run of show, talking points and arguments around it stay held back (rule 2).
    - Consolidate lines about the same decision, date, action or meeting within one project into one item, with sub-points where needed, whose source ref lists every meeting or thread it draws on. A consolidated item still passes the full barrier.
    - Budget: with `brain.max_items`, rank what is left by how much it needs the audience and propose only the top `max_items`. Without it, more than 10 proposed items means the fit test was too loose: tighten before presenting. Status lines pass fit by the clause "it changes something this audience was already told". Status lines do not count against `brain.max_items` and are not subject to the "more than 10" check.

    The rest is "not relevant to <audience>: N", counted apart from held back and never written.
11. Rank flow. For audience A of space S, compare each candidate with the packages of every audience of S with a higher rank. A candidate that restates an item shared there and not with A or a lower rank is held back as "higher rank only". An item in a lower-rank package may be proposed to a higher rank. It reads `space` and `rank` from the `audience.md` of the other audiences under `outbox/` and their packages. Different spaces: no rule.
12. Binaries. A file is an item of class `files`, selectable only by the owner, from outside `.confidential/` and `inbox/`, from a location of the audience's org.
13. Self-check, step 11.

## Content classes

`decisions`, `dates`, `actions`, `definitions`, `roles`, `metrics`, `cadence`, `open-questions`, `links`, `files`. Context items are the classes `definitions`, `roles`, `metrics`, `cadence` and `links`.

## Withdraw

When the owner says "withdraw item 5", first apply step 1 (the audience must be named), because ids are per audience:

- Withdraw means the item should not be in the outlet (shared by mistake or no longer shareable). If it was true and its life moved on (done, dropped, answered, replaced), that is a status line (step 4), not a withdrawal.
- An unknown id, or one already `withdrawn`: say so and change nothing.
- Allowed status changes: `approved` to `published` (made by the publisher, or by the owner by hand), `approved` to `withdrawn` and `published` to `withdrawn` (the owner). Any other, such as `withdrawn` to `approved`: report it and change nothing.
- Otherwise set the manifest row to `withdrawn`, keep the row, and delete the item's line from its package. When deleting a line leaves a section with no items, remove that section's heading too. If no items remain, the package keeps only its frontmatter and the line `All items withdrawn`.
- For a `published` item, also tell the owner to remove it from the outlet. The outbox cannot recall it.
- A status row can be withdrawn like any row: the row stays `withdrawn`, its line leaves the package, and the previous state stands. For a `published` status row, tell the owner to revert that state in the outlet. The same state for the same id is then asked about once per run ("propose again?", step 4).

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

Status follow-up, a later run on 2026-11-18: `#2` "Send test plan" is `published` and `logs/launch.md` holds `Done: Sam sent the test plan (Launch sync 2026-11-17)` under `## 2026-11-17`. The proposal adds:

```
Status
1. Status: #2 Send test plan | done | Launch sync 2026-11-17
```

The owner approves it. With the highest id at 2, the package `outbox/team/2026-11-18-launch.md` gets under `## Status` the line `#3 Status: #2 Send test plan | done | Launch sync 2026-11-17`, the manifest gets the row `3 | Status: #2 done | 2026-11-18-launch.md | approved | 2026-11-18 |`, and `logs/launch.md` gets `Done: shared with team: #3 (2026-11-18-launch.md) from /projects/launch.md`.
