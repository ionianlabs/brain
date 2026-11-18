# Outbox status follow-up

Status: approved
Slug: outbox-status
Date: 2026-11-18

## Problem

The brain is the only source of truth. Content flows one way: brain, then outbox, then outlet. An outlet holds nothing the outbox never carried. Today the outbox only carries new items forward. Once an item is published, its later life (done, dropped, answered, replaced) stays in the brain and never reaches the outlet, so the outlet drifts out of date. The skill works against it. The candidate check (current step 7) skips a candidate that restates an already shared item ("already shared: N"), and rule 10 (since 0.9.2) says the owner's own to-do list "is status, never an action for the audience". A completed action that was shared therefore has no path out. The owner has to fix the outlet by hand, or the audience keeps reading a state that is no longer true.

## Existing system

This spec extends `docs/designs/outbox.md` (approved), which defines the `outbox` skill. What matters here:

- **Brain**: a folder of markdown notes (projects, logs, knowledge notes, people notes) with skills that agents run on it. Logs are newest first, under `## YYYY-MM-DD` headings.
- **Owner**: the one person whose brain it is. The owner runs the skill and approves each item.
- **Audience**: a named group outside the brain (for example `team` or `steering`) with a definition file `outbox/<audience>/audience.md` that lists its members and the content classes it receives.
- **Skill**: `template/skills/outbox/SKILL.md`, mirrored body for body in `template/.github/prompts/outbox.prompt.md`, built into `plugin/` by `npm run build:plugin`. It has 12 steps, 13 rules and a Withdraw section.
- **Step numbers**: this page names each existing step and gives its number in today's skill as "current step N". The new step of F1 is inserted after Handback, so the later steps move down by one. Rule numbers do not change.
- **The 12 current steps**: 1 Audience (the owner must name it); 2 Validate (check `audience.md`); 3 Handback; 4 Scope (the owner names a project, notes, a meeting or "since last run"); 5 Read rules (`## Outbox rules` in `AGENTS.md`); 6 Read sources (in scope, skipping what may not be read); 7 Barrier and fit (apply the rules to each candidate, rewrite it, skip what restates a shared item); 8 Present (the proposal, nothing written); 9 Approve (per item); 10 Self-check; 11 Write (package, manifest entries, private log); 12 Summary.
- **The barrier** (rules 1 to 9, 11, 12): only allowlisted classes pass (decisions, dates, actions, definitions, roles, metrics, cadence, open questions, links, owner-chosen files), limited by `brain.receives`. Some kinds are always held back (opinions about people, politics, talking points, commercial matters, other orgs, speculation). Some locations are never read (`.confidential/`, `inbox/`, person note bodies, other orgs, drafts). Every item is rewritten, never copied, has a source ref (meeting or thread plus date) and passes the blocked terms from `## Outbox rules`.
- **Fit** (rule 10): after the barrier, an item is proposed only if a member of the audience has to decide, confirm or unblock it, or it changes something the audience was already told. The rest is counted as "not relevant".
- **Self-check** (rule 13, current step 10): before any write, scan every approved item, title, source ref and file name for brain paths, blocked terms and a 12-word overlap with a source note. A hit is dropped from the write and reported as "path", "blocked term" or "overlap".
- **Proposal blocks** (current step 8): **Proposed** (numbered rewritten items with class and source ref); **Held back** (categories and counts only, never content); **Needs decision** (questions to the owner about what the skill cannot classify or complete); two count lines ("not relevant to <audience>: N", "already shared: N"); **On the bench** (up to three next candidates when `brain.max_items` limits the package).
- **What the skill does**: for one named audience it reads brain notes in a scope the owner gives, proposes rewritten items that pass the barrier and fit, and writes only the items the owner approves into `outbox/<audience>/`, from where a publisher takes them to an outlet.
- **Publisher**: a separate tool or person, not part of the skill, that reads `outbox/<audience>/` and puts `approved` items into an outlet. This repository ships no publisher.
- **Config keys**: `brain.receives` (the classes this audience may get) and `brain.max_items` (the optional item budget) are keys of the `brain:` block in `outbox/<audience>/audience.md`. `## Outbox rules` is a section of the brain's `AGENTS.md` where the owner lists blocked terms.
- **Outlet**: wherever a separate publisher puts the approved items, for example a shared page or a tracker. The skill never contacts or reads an outlet.
- **Manifest** `outbox/<audience>/manifest.md`: table `ID | Item | Package | Status | Date | Outlet ref`, status `approved | published | withdrawn`. Entries are append-only apart from the status change. The publisher acts only on `approved` entries, sets `published`, a date and the `Outlet ref`.
- **Package** `outbox/<audience>/YYYY-MM-DD-<slug>.md`: frontmatter `approved` (date), sections Decisions, Actions, Dates, Context, Open questions, Files. An Actions line is `Title | Owner | Due | Source`.
- **Handback** (current step 3): on every run, for each `published` row with no `Done: published to <audience>:` bullet naming its id, it finds the source project by searching `logs/*.md` for the bullet `Done: shared with <audience>:` naming the id, and adds the bullet `Done: published to <audience>: #4-#6` to that project's log under today's heading. An id with no such bullet is reported and logged nowhere.
- **Withdraw** (today): the owner names the audience and an id. An unknown or already `withdrawn` id changes nothing. `approved` or `published` becomes `withdrawn`; the row stays and the item's line is deleted from its package (an emptied section loses its heading; with no items left the package keeps its frontmatter and the line `All items withdrawn`). For a `published` item the owner is also told to remove it from the outlet, because the outbox cannot recall it.
- **Provenance in logs**: a bare bullet is the owner's fact, `Said(Name):` is someone else's statement, `Inferred:` is an agent's own conclusion, `Done:` and `Decision:` mark completed work and decisions. `Decision(Name, ...):` names a member.
- **Budget**: the optional `brain.max_items` in `audience.md` caps the new items of one package; extra candidates go on the bench.

## Out of scope

- Adopting outlet items that have no manifest row (orphans reported by a publisher) into the brain. It is the one inbound flow, touches the publisher contract and the lifecycle grammar, and is a separate change with its own spec.
- Any marker on brain items that links them to a manifest id or outlet ref.
- Following up `approved` entries.
- Following up `files` items (class `files`). A file has no life of its own in the brain.
- How any outlet or publisher displays a state. Any publisher implementation.
- Reading an outlet, or checking that the outlet matches the manifest.
- CLI or lint support for status entries.

## Terms

- **status line**: a line in the package section `## Status` stating a new state of an already published item, by manifest id.
- **status row**: a manifest row whose Item starts with `Status: #`. Created for each approved status line.
- **followed row**: a manifest row with status `published` that is not a status row. Only followed entries get status lines.
- **state**: one of `done`, `dropped`, `answered`, `superseded`, `reopened`. The current state of an item is the state in the newest status row naming it that is not `withdrawn`. With none, the item has no state.
- **class of an item**: the section it sits in, in its package (Decisions, Actions, Dates, Context, Open questions).
- **evidence**: a brain line that explicitly shows a state change (see F1).
- **proposal number**: the number of a line in the proposal. Proposed and the Status block share one continuous numbering. A proposal line shows no manifest id.
- **manifest id**: the id a written item or status line gets at write, never earlier.
- **withdraw vs status**: withdraw means the item should not be in the outlet (shared by mistake or no longer shareable); the owner removes it. Status means the item was true and its life moved on.

Other terms (item, package, manifest, barrier, held back, needs decision, self-check, publisher, outlet) are as in `docs/designs/outbox.md`.

## Features

In this spec, scenario ids are its own `F1.x`, `F2.x`, `F3.x`. In tests and in the `RUN.md` of the fixture brain `test/fixtures/outbox-status-brain/` (new) they carry the prefix "status", for example "status F1.3", because unprefixed `F2.x` and `F3.x` already mean the outbox spec there.

F1 and F2 ship together as the smallest usable slice: F1 proposes, F2 writes. F3 and F4 build on them.

### F1. Status follow-up with evidence (P1)
Why: removes the drift. A published item that is done, dropped, answered or replaced is found and proposed through the same barrier and the same per-item approval, with no outlet knowledge in the skill. On its own F1 only proposes (nothing is written), so it is testable as a proposal; it reaches the outlet once F2 writes.

Story: As the owner, I want the outbox to propose state changes of items it already published, backed by evidence in the brain, so that the outlet shows what is true now.

New step "Status follow-up", after Handback and before Scope (current step 4), on every run for the audience.

- **Proposal layout**: status lines are shown in a **Status** block after **Proposed** in the proposal (Present, current step 8). Proposed and the Status block share one continuous numbering (Proposed 1 to 2, Status block 3 on). Every line, new item or status line, is approved or rejected on its own.
- **Ids**: manifest ids are assigned only at write, sequentially from the highest existing id: new items first, then status lines. In the proposal, lines carry proposal numbers, not ids. A status line that depends on a new item refers to it by proposal number (for example "answered by proposed item 2") and gets its real id at write. A rejected line never burns an id.
- **Followed entries**: manifest entries with status `published`, not status entries, not `withdrawn`. An empty `Outlet ref` does not matter. Entries with status `approved` are not followed (nothing is in the outlet yet).
- **Own scope**, independent of the scope the owner gives in the next step, because the step runs before a scope exists and drift does not depend on what the owner scopes today. The source projects of the followed entries are found as Handback finds them (search `logs/*.md` for the `Done: shared with <audience>:` bullet naming the id). In each such project read `projects/<slug>.md` and the entries of `logs/<slug>.md` dated on or after the `approved` date of the item's package. Rule 3 (never read) applies unchanged. "On or after" stays, because log entries carry dates, not times: same-day evidence cannot be ordered against the approval, and the owner's approval of each line is the guard.
- **Entries that cannot be followed**: a followed row is reported in the summary as "not followed up" with the reason, and the run continues with the other entries, when its package file is missing or has no `approved` date, its line is gone from the package, its id appears twice in the manifest, no `Done: shared with <audience>:` bullet names it, or the source project file or log is missing.
- **Matching**: an item is matched to brain lines by meaning, using the item's line in its package, not only the manifest title. A status line is proposed only when the evidence line names the same object as the item's package line and, for an Actions item, does not name a different owner. Anything weaker goes to Needs decision as a question, never to Proposed.
- **Evidence** is explicit only: a `Done:` log bullet; a checked to-do (`- [x]`, rare, because the brain's `AGENTS.md` tells agents to move done items to the log as `Done:` entries instead of ticking them); a later `Decision(Name, ...):` or a decision from this audience's meeting that answers or replaces the item; an explicit cancellation in a log or project note. An `Inferred:` bullet is never evidence. No evidence: propose nothing. A state is never inferred from a due date.
- **"A decision from this audience's meeting"** is the wording of current rule 4 and is judged exactly as rule 4 judges it today: "It becomes a `decisions` item only when this audience made or confirmed it: a `Decision(Name, ...):` naming a member other than the owner, or a decision logged from this audience's own meeting." This spec adds no new definition of it.
- **Date order**: evidence is ordered by the date of its log entry (the `## YYYY-MM-DD` heading). A reopening counts only when its entry is dated after the entry of the evidence for the current state. When two contradicting pieces of evidence for one id carry the same date, nothing is proposed and the id goes to Needs decision with a question.
- **Reopened**: `reopened` is proposed only when the item has a current state from a status row that is not withdrawn. When several pieces of evidence in one run net out to the state the outlet already has (for example done and then reopened, with no status row yet), nothing is proposed.
- **Overdue**: applies to Actions items only; a Dates item is never listed as overdue. An Actions item whose `Due` in the package is before the run date, with no evidence, is listed under Needs decision as a question to the owner, for example "#7 was due 2026-11-20: still open?". On the due date itself the item is not overdue. The question is asked on every run for that audience until the brain holds evidence (a `Done:` bullet or a cancellation). Nothing is stored and there is no dismissal, the same principle as a rejected status line, which is also proposed again.
- **No repeat**: no status line is proposed when it would repeat the current state. At most one status line per referenced id per run (the latest state).

States by class (the class is the section of the item in its package):

| State | Meaning | Applies to |
|---|---|---|
| `done` | Completed, or date or milestone reached, with evidence | Actions, Dates |
| `dropped` | Cancelled with no replacement | Actions, Open questions, Dates, Decisions |
| `answered` | Got its answer. If the answer is itself a shareable item (passes the barrier and fit), it is proposed as a normal new item and the line reads `answered by <ref>` (F3). If not, the line is a plain `answered`, with no `by` | Open questions |
| `superseded` | Replaced by a newer one, proposed as a normal item in the same run; the line reads `superseded by <ref>` (F3) | Decisions, Dates, Context |
| `reopened` | Current state is `done`, `dropped` or `answered`, and it is open again, with evidence | all classes that had one of those states |

Scenarios (fixture: `test/fixtures/outbox-status-brain/` (new), audience `team`, org `acme`, project `launch`, run date 2026-11-18 unless a scenario says otherwise; entries and log bullets as in "Fixture seed" under Interfaces; a bullet named in a Given as added is added for that run only):
- F1.1 Given published #6 "Send test plan", its baseline bullet `Done: Sam sent the test plan (Launch sync 2026-11-17)`, and two new candidates that pass the barrier and fit, when the skill runs for `team`, then Proposed holds 2 items and the Status block holds the line `3. Status: #6 Send test plan | done | Launch sync 2026-11-17` (no own id yet).
- F1.2 Given published #7 "Update rollout checklist" (Due 2026-11-20) with no `Done:` bullet, no checked to-do and no cancellation, when the skill runs, then no status line is proposed for #7.
- F1.3 Given #7 and run date 2026-11-21 with no evidence, when the skill runs, then Needs decision holds "#7 was due 2026-11-20: still open?" and the Status block holds nothing for #7.
- F1.4 Given #7 and only the added bullet `Inferred: Lea probably updated the rollout checklist`, when the skill runs, then no status line is proposed for #7.
- F1.5 Given #7 and the added bullet `Done: material sent`, which names no object, when the skill runs, then Needs decision holds a question naming #7 and the Status block holds no line for it.
- F1.6 Given approved row #13 "Share demo script" and the baseline bullet `Done: Sam shared the demo script (Launch sync 2026-11-17)`, when the skill runs, then #13 is not followed up and no status line is proposed for it.
- F1.7 Given published #3 "Training starts 2026-01-19", which has no `Done: shared with team:` bullet naming #3 in any `logs/*.md`, when the skill runs, then the summary reports #3 as "not followed up" with that reason and no status line is proposed.
- F1.8 Given published #2 "Kickoff on 2026-01-12" whose current state is `done` (status row #12, published) and the baseline bullet `Done: kickoff held (Launch sync 2026-11-14)`, when the skill runs, then no status line is proposed for #2 (no repeat).
- F1.9 Given #2 as in F1.8 and the added bullet `Decision(Sam Lee, Launch sync): the kickoff is repeated, a second one is needed` under `## 2026-11-17`, dated after the `done` evidence of 2026-11-14, when the skill runs, then the Status block holds `Status: #2 Kickoff on 2026-01-12 | reopened | Launch sync 2026-11-17`.
- F1.10 Given published #8 "Go-live 2026-03-10" and #9 "Who signs off the test plan", whose package `2026-11-12-launch-followup.md` is approved 2026-11-12, and any scope the owner gives afterwards, when the skill runs, then it reads `projects/launch.md` and the `logs/launch.md` entries dated 2026-11-12 or later.
- F1.11 Given #7 with no status row and two added bullets, `Done: Lea updated the rollout checklist` under `## 2026-11-15` and `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened` under `## 2026-11-17`, when the skill runs, then the evidence nets out to the state the outlet already has: nothing is proposed for #7.
- F1.12 Given #7 with `Done: Lea updated the rollout checklist` and `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened`, both added under `## 2026-11-17`, when the skill runs, then no status line is proposed for #7 and Needs decision holds a question naming #7.
- F1.13 Given published #9 "Who signs off the test plan" and the added bullet `Done: Sam Lee answered the sign-off question by email, not shareable` whose answer is not a shareable item, when the skill runs, then the Status block holds `Status: #9 Who signs off the test plan | answered | Project log 2026-11-17`, with no `by`.
- F1.14 Given #7 (Due 2026-11-20) and run date 2026-11-20 with no evidence, when the skill runs, then Needs decision holds no question for #7 (not overdue on the due date).
- F1.15 Given published decision #10 "Scope frozen from 2026-02-01" and the added bullet `Decision(Sam Lee, Launch sync): the scope freeze is cancelled, no replacement` under `## 2026-11-17`, when the skill runs, then the Status block holds `Status: #10 Scope frozen from 2026-02-01 | dropped | Launch sync 2026-11-17`.
- F1.16 Given #7 with no status row and only the added bullet `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened` under `## 2026-11-17`, when the skill runs, then no `reopened` line is proposed for #7 (no current state).
- F1.17 Given #6 and an added bullet `Done: Lea Park sent the test plan` (a different owner than Sam Lee), when the skill runs, then Needs decision holds a question naming #6 and no line is proposed from that bullet.
- F1.18 Given the fixture manifest with #8 listed twice (the run adds a duplicate row) and #9 healthy, when the skill runs, then the summary reports #8 as "not followed up" with the reason "id appears twice" and #9 is still followed.
- F1.19 Given `npm test`, then `test/plugin.test.mjs` asserts that `template/skills/outbox/SKILL.md` and `template/.github/prompts/outbox.prompt.md` contain `Status follow-up`, the five state names and the sentence that an `Inferred:` bullet is never evidence. The version bump belongs to F4.
- F1.20 Given the overdue #7 of F1.3 (Due 2026-11-20, run date 2026-11-21, no evidence) and a second run on the same day with still no evidence and nothing stored in between, when the skill runs, then Needs decision lists "#7 was due 2026-11-20: still open?" again.

Testability: manual, plus string assertions. F1 alone is only testable as a proposal, because nothing is written until F2. Tested by running the skill against `test/fixtures/outbox-status-brain/` (new, as in Fixture seed under Interfaces) and comparing the proposal; shows the Status block, the Needs decision lines and the report line for unfollowed ids per scenario. F1.19 is a unit test in `test/plugin.test.mjs`.

### F2. Writing, lineage and the barrier (P2)
Why: a status line that is proposed but not written, recorded, scanned and logged would not close the loop. This feature makes the line part of the package, the manifest and the private log, and keeps it behind the barrier. With F1 it forms the smallest usable slice.

Story: As the owner, I want each approved status line written like any item and checked again, so that nothing unsafe leaves through it and the publisher can act on it.

Rules:
- **Lineage keys on the manifest id.** A status line names the item by `#<id>`. The publisher maps the id to its outlet item through the manifest row's `Outlet ref`.
- **Status line format** in a new `## Status` section: `#14 Status: #6 Send test plan | done | Launch sync 2026-11-17`. That is: own id, the referenced id, the title copied from the referenced manifest row, the state (with `by #<id>` where it applies), the evidence ref. The line carries the state only, never the reason. A reason is shared only if it passes as an item of its own.
- **Reserved prefix**: the title of a new item never starts with `Status: #`. A candidate whose title would is rewritten.
- **Section order** in a package: Decisions, Actions, Dates, Context, Open questions, Status, Files.
- **Manifest**: each approved status line gets its own row, Item `Status: #6 done`, status `approved`, same fields as today. Status entries are never followed up. A status row can be withdrawn like any row, following the existing Withdraw section (the row stays `withdrawn`, its line leaves the package); then the previous state stands. For a `published` status row the owner is told to revert that state in the outlet; the skill sends nothing.
- **Propose again?** After a status row is withdrawn, the same state for the same id is not proposed again automatically. The question stands once per run under Needs decision, for example "#6 done was withdrawn earlier: propose again?". If the owner answers yes in the conversation, that line counts as approved, goes through the self-check and is written with the others. Present is not regenerated. A withdrawn state is asked about while a rejected line is simply proposed again because a withdrawal is recorded in the manifest and a rejection is recorded nowhere.
- **Handback for a status row** works as for any row: the source project is found through the `Done: shared with <audience>:` bullet that names the status row's own id, which the write step puts in the log of the project the evidence came from.
- **Barrier**: a status line passes rules 1 to 9 and the self-check (rule 13) like any item. The evidence ref follows rule 7: a meeting or thread plus date, never a brain path. When the evidence line names no meeting or thread, the ref is `Project log YYYY-MM-DD` with the date of the log entry. The copied title is scanned again, because blocked terms can be added after it was first shared; a hit holds the line back as "blocked term". The line inherits the class of the item it updates; if `brain.receives` no longer holds that class, it is held back.
- **Private log**: status lines get the usual bullet `Done: shared with <audience>: #14 (<package>) from <paths>` in the source project's log.
- **Approval**: nothing is written without approval of the single line. A rejected line writes nothing and takes no id, and no state is stored about the rejection, so it is proposed again on the next run if the evidence still holds.
- **Ids**: as in F1, assigned only at write, new items first, then status lines.

Scenarios:
- F2.1 Given the owner approves the F1.1 line, the highest existing id is 13, and the package is `2026-11-18-launch.md`, when the skill writes, then the line gets id #14 and the package has under `## Status` the line `#14 Status: #6 Send test plan | done | Launch sync 2026-11-17`, `manifest.md` has a row `14 | Status: #6 done | 2026-11-18-launch.md | approved | 2026-11-18 |` with an empty Outlet ref, and `logs/launch.md` under `## 2026-11-18` has `Done: shared with team: #14 (2026-11-18-launch.md) from /projects/launch.md`.
- F2.2 Given the manifest after F2.1 (status row #14 `approved` or `published`), when the skill runs again with the same evidence, then #14 is not followed up and no line is proposed for #6 (no repeat).
- F2.3 Given status row #14 (`done` for #6) set to `withdrawn` by the owner and no other status row for #6, when the skill runs with the same evidence, then #6 has no state, the Status block holds no `done` line for #6, and Needs decision holds once "#6 done was withdrawn earlier: propose again?".
- F2.4 Given the evidence line names no meeting or thread, and the log entry is dated 2026-11-17, then the evidence ref reads `Project log 2026-11-17`.
- F2.5 Given an evidence ref that is a brain path (`projects/launch.md`), when the self-check runs, then the line is dropped from the write and reported as "path".
- F2.6 Given `## Outbox rules` in `AGENTS.md` newly blocking the term `Send test plan`, and published #6 with that title, when the line for #6 is scanned, then it is held back as "blocked term" (counted, not quoted).
- F2.7 Given the item sits in Actions and, for that run, `actions` is removed from `receives` of the `team` audience of `test/fixtures/outbox-status-brain/` (new), so `brain.receives` no longer holds `actions`, when the skill runs, then the status line is held back and counted under Held back.
- F2.8 Given the owner rejects the Status line in F1.1, then nothing is written for it (no package line, no manifest row, no log bullet, no id used), and the next run proposes it again.
- F2.9 Given a "status only" run (F4) whose only approved item is a status line, and the owner changes the default slug to `launch`, when the skill writes, then the package is `2026-11-18-launch.md` with frontmatter and a `## Status` section only.
- F2.10 Given the seeded status row #12 with status `published`, when the owner withdraws item 12, then the row becomes `withdrawn`, the `#12` line leaves its package, #2 has no state again, and the owner is told to revert that state in the outlet.
- F2.11 Given the F2.1 write, when the skill hands back and the publisher has set #14 to `published`, then the bullet `Done: published to team: #14` is added to `logs/launch.md`, because `Done: shared with team: #14 ...` names #14 there.
- F2.12 Given F2.3 and the owner answers yes to "propose again?" in the conversation, when the skill continues, then the line is not shown in a second Present, goes through the self-check and is written with the other approved lines under a new id.
- F2.13 Given a candidate new item whose title would read `Status: #6 follow-up`, when the skill presents, then the title is rewritten and does not start with `Status: #`.

Testability: manual, plus string assertions. Tested on its own (with F1) by running the skill in `test/fixtures/outbox-status-brain/` (new) to approval and checking the package, the manifest and the log by file; shows the written lines per scenario. F2.2, F2.3, F2.5 to F2.7 and F2.12 are checked by a second run on the written fixture. `test/plugin.test.mjs` asserts that the skill and prompt text name `## Status`, `Status: #`, `Project log` and the new section order.

### F3. Replacement, questions answered and the budget (P3)
Why: an answer or a replacement is also a new item. It must travel with its status line, and the budget must not push status out.

Story: As the owner, I want a replaced decision or an answered question to arrive as a new item and a status line together, so that the outlet shows the new fact and retires the old one.

Rules:
- `answered by` and `superseded by`: the new item is proposed in the same run as a normal item. In the proposal the status line names it by proposal number (`answered by proposed item 1`). At write the new item gets its id first, then the status line gets its own, and the written line reads `answered by #<new id>`.
- **Dependency**: if the new item is not written for any reason (rejected, held back, dropped by the self-check), the dependent status line is not written either and is reported in the summary. If the owner approves the new item and rejects the status line, the new item is written and the old item keeps its state.
- **Split from Withdraw.** The sentence in Present (current step 8) "An item that replaces a shared one says which id it replaces and proposes that withdrawal" changes. When the replaced item is `published`, the skill proposes a `superseded by` status line. When it is still `approved`, it proposes the withdrawal as today.
- **Proposal layout**: as in F1 (one continuous numbering, each line approved on its own).
- **Fit and budget**: a status line passes fit by the existing clause "it changes something this audience was already told". Status lines do not count against `brain.max_items` and are not subject to the "more than 10" check.

Scenarios:
- F3.1 Given published open question #9 "Who signs off the test plan" and an added `Decision(Sam Lee, Launch sync): Sam Lee signs off the test plan` under `## 2026-11-17` that passes the barrier and fit, when the skill runs, then Proposed holds the decision as item 1, a new Decisions item, and the Status block holds `2. Status: #9 Who signs off the test plan | answered by proposed item 1 | Launch sync 2026-11-17`. Neither line shows an own id.
- F3.2 Given published decision #10 "Scope frozen from 2026-02-01" and an added `Decision(Sam Lee, Launch sync): scope frozen from 2026-03-01 instead` under `## 2026-11-17`, when the skill runs, then Proposed holds the new decision as item 1 and the Status block holds `2. Status: #10 Scope frozen from 2026-02-01 | superseded by proposed item 1 | Launch sync 2026-11-17`.
- F3.3 Given the same replacement as F3.2 but the fixture is changed by hand for this run so that #10 has manifest status `approved` (the skill never sets that status), when the skill runs, then it proposes the new decision and the withdrawal of #10 as today, and no status line.
- F3.4 Given the F3.1 case and the owner approves the status line but not the new decision, then the status line is not written, because it names a proposed item that is not written.
- F3.5 Given `max_items: 2`, three new candidates and two status lines, when the skill presents, then Proposed holds 2 new items, On the bench holds 1, and the Status block holds both status lines.
- F3.6 Given 11 status lines and no new items, when the skill presents, then all 11 are in the Status block and the "more than 10 means the fit test was too loose" check does not apply.
- F3.7 Given published #6 whose Withdraw is requested ("withdraw item 6"), then the Withdraw section applies as today and no status line is proposed for it.
- F3.8 Given F3.1, the highest existing id 13, and the owner approves both lines, when the skill writes, then the decision is `#14` and the status line is `#15 Status: #9 Who signs off the test plan | answered by #14 | Launch sync 2026-11-17`.
- F3.9 Given published Context item #11 "Cycle length is 2 weeks" and an added `Decision(Sam Lee, Launch sync): cycle length is 3 weeks` under `## 2026-11-17` that passes the barrier and fit, when the skill runs, then Proposed holds the new item as item 1 and the Status block holds `2. Status: #11 Cycle length is 2 weeks | superseded by proposed item 1 | Launch sync 2026-11-17`.
- F3.10 Given the F3.1 case, both lines approved, and the self-check drops the new decision as "overlap", when the skill writes, then neither the decision nor the status line is written and the summary reports the status line as not written because its new item was dropped.
- F3.11 Given the F3.1 case and the owner approves the new decision but rejects the status line, when the skill writes, then the decision is written and #9 keeps its state.

Testability: manual, plus string assertions. Tested on its own (on top of F1 and F2) by running the skill in `test/fixtures/outbox-status-brain/` (new) with the added replacement bullets, then with `max_items: 2` set on `outbox/team/audience.md`; shows the Proposed, Status and On the bench blocks. Text assertions in `test/plugin.test.mjs` check that the old Present sentence about replacing a shared item is gone and the superseded wording is present.

### F4. Scope "status only", publisher contract, packaging (P4)
Why: the owner needs to run only the follow-up, and the publisher needs to know what to do with status entries.

Story: As the owner, I want a run that only follows up, so that I can fix the outlet without staging new content; as a publisher author, I want one rule for status entries.

Rules:
- **Scope "status only"**: the owner may answer the scope question with "status only". It skips only the reading of scope sources and the proposal of new items. Reading `## Outbox rules`, the barrier for status lines, present, approval, self-check, write and summary all run. On such a run the package slug defaults to `status`, and the owner may change it, as for any package. With a normal scope, status lines go into the same package as the new items.
- **Publisher contract, addition**: the publisher reads the Status section; for each `approved` status row it applies the state to the outlet item of the referenced id (found through that row's `Outlet ref`), then sets the status row to `published` with a date. How an outlet shows a state is the publisher's matter. The skill still never contacts an outlet.
- **Packaging**: version 0.10.0.

Scenarios:
- F4.1 Given the owner answers the scope question with "status only" and one line is approved, and keeps the default slug, when the skill writes, then the package is `outbox/team/2026-11-18-status.md`, and no source outside the follow-up scope of F1 was read.
- F4.2 Given the owner gives scope `launch`, then the status lines are written into the same package as the new items, with the slug `launch` (or the one the owner confirms).
- F4.3 Given `npm test`, then it passes with assertions that `template/skills/outbox/SKILL.md` and `template/.github/prompts/outbox.prompt.md` have the same body, that `plugin/skills/outbox/SKILL.md` contains the new step and states, and that `package.json` has version `0.10.0`.
- F4.4 Given the fixture brain `test/fixtures/outbox-status-brain/` (new), then its `RUN.md` has a section for each scenario of this spec, referred to as "status F1.1" and so on, the fixture holds the files, entries and bullets of "Fixture seed", and fixture tests check this. The test file may stay `test/outbox-fixture.test.mjs` or be a new `test/outbox-status-fixture.test.mjs` (new); either is fine.
- F4.5 Given every file touched by this change, then every example is fictional (org `acme`, project `launch`, audiences `team` and `steering`, Sam Lee, `Zeta Corp`, meeting "Launch sync") and no file contains em or en dashes. The existing test "no em or en dashes under template/ and plugin/" in `test/plugin.test.mjs` covers the skill, the prompt and the plugin.
- F4.6 Given "status only", `## Outbox rules` blocking `Send test plan` and an approved line for #6, when the skill runs, then it reads `## Outbox rules`, holds the line back as "blocked term", and the summary is printed.

Testability: unit for F4.3 and F4.5 (`npm test`, which includes the existing dash test); manual for F4.1, F4.2 and F4.4 by running the fixture `test/fixtures/outbox-status-brain/` (new); F4.4 also by the fixture tests. Shows the package file name and a passing test run.

## Success criteria

- SC1 In the fixture run, 0 status lines are proposed for items with no explicit evidence, and 100% of proposed status lines carry an evidence ref.
- SC2 100% of status lines in written packages have a manifest row, an id and a private log bullet.
- SC3 In the fixture, 0 status lines are proposed for status entries, `approved` entries or `withdrawn` entries.
- SC4 The written `outbox/` files of the fixture contain 0 brain file paths and 0 blocked terms (checked by grep).
- SC5 With `max_items: N`, a run with more than N new candidates proposes exactly N new items and 100% of the status lines.
- SC6 `npm test` passes.

## Interfaces and data

- Skill text: `template/skills/outbox/SKILL.md` and `template/.github/prompts/outbox.prompt.md` (must say the same). New step "Status follow-up" between Handback (current step 3) and Scope (current step 4); the later steps move down by one. Present (current step 8) gains the **Status** block and loses the replace-and-withdraw sentence (replaced by the F3 rule). Write (current step 11) gains the section order and the status row. The Withdraw section gains one line that tells it apart from status. The Barrier section says rules 1 to 9 and 13 apply to status lines and that fit and budget are as in F3.
- Package: new section `## Status`; order Decisions, Actions, Dates, Context, Open questions, Status, Files. Line: `#<own id> Status: #<ref id> <title> | <state>[ by #<id>] | <evidence ref>`.
- Manifest: no new column. A status row has Item `Status: #<ref id> <state>`, status `approved | published | withdrawn`, empty Outlet ref until the publisher sets it.
- Private log: the bullet `Done: shared with <audience>: #14 (<package>) from <paths>`.
- Publisher contract: as in F4 rules.
- Plugin: `plugin/` rebuilt with `npm run build:plugin` (`scripts/build-plugin.mjs`).
- Version: `package.json` goes from 0.9.2 to `0.10.0`; `plugin/.claude-plugin/plugin.json` carries the version too and `npm run build:plugin` rewrites it from `package.json`.
- Tests: string assertions in `test/plugin.test.mjs`; fixture tests for `test/fixtures/outbox-status-brain/` in `test/outbox-fixture.test.mjs` or a new `test/outbox-status-fixture.test.mjs` (new); `npm test` runs `node --test`.
- Docs: a pointer line in the Review section of `docs/designs/outbox.md`. `docs/spec.md` only lists the skills in its Layout table and does not describe the manifest or package format, so it needs no change unless the plan finds such text; `README.md` and the docs that give a version or describe the outbox are updated where they describe the package or manifest.
- Fixture seed. The status scenarios run on a separate fixture brain, `test/fixtures/outbox-status-brain/` (new), with its own `RUN.md` (new). The existing fixture `test/fixtures/outbox-brain/` and its `RUN.md` are not changed by this feature, because seeding them broke their manual scenarios (they expect the next manifest id to be #6 and expect "Go-live 2026-03-10" and "Send test plan" to be new items).
  - The new fixture is a small complete brain: an `AGENTS.md` with `## Outbox rules` blocking `Zeta Corp`, `index.md`, `projects/launch.md`, `logs/launch.md`, the people notes of Sam Lee and Lea Park, `outbox/team/audience.md`, `outbox/team/manifest.md` and the packages.
  - Its `team` audience has `receives: [decisions, dates, actions, open-questions, cadence]`, so the status lines of #9 (open question) and #11 (Context, class `cadence`) are not held back.
  - Its manifest holds entries #1 to #5 with the same content as the entries of the existing fixture (#1 approved, #2 and #3 published, #4 withdrawn, #5 with the invalid status `draft`), so the scenario ids in this spec stay as they are and #2 and #3 are reused. Their package is `outbox/team/2026-11-10-launch-update.md`. The seeded entries #6 to #13 follow, with the two seeded packages below.
  - Seeded content:
  - `outbox/team/manifest.md`, entries continuing from id 6 (all Date 2026-11-12 unless stated, package `2026-11-12-launch-followup.md` unless stated):
    - 6 `Send test plan`, published, ref-0006 (Actions, with a `Done:` bullet)
    - 7 `Update rollout checklist`, published, ref-0007 (Actions, Due 2026-11-20, no evidence)
    - 8 `Go-live 2026-03-10`, published, ref-0008 (Dates)
    - 9 `Who signs off the test plan`, published, ref-0009 (Open questions)
    - 10 `Scope frozen from 2026-02-01`, published, ref-0010 (Decisions)
    - 11 `Cycle length is 2 weeks`, published, ref-0011 (Context)
    - 12 `Status: #2 done`, published, ref-0012, Date 2026-11-15, package `2026-11-15-launch-status.md` (the current state `done` of #2)
    - 13 `Share demo script`, approved, no Outlet ref (Actions, with matching evidence)
  - New package `outbox/team/2026-11-12-launch-followup.md` (`approved: 2026-11-12`, `source_refs: [Launch sync 2026-11-12]`), lines: Decisions `#10 Scope frozen from 2026-02-01 (Launch sync 2026-11-12)`; Actions `#6 Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-12`, `#7 Update rollout checklist | Lea Park | 2026-11-20 | Launch sync 2026-11-12`, `#13 Share demo script | Sam Lee | 2026-11-27 | Launch sync 2026-11-12`; Dates `#8 Go-live 2026-03-10 (Launch sync 2026-11-12)`; Context `#11 Cycle length is 2 weeks (Launch sync 2026-11-12)`; Open questions `#9 Who signs off the test plan (Launch sync 2026-11-12)`.
  - New package `outbox/team/2026-11-15-launch-status.md` (`approved: 2026-11-15`), section Status: `#12 Status: #2 Kickoff on 2026-01-12 | done | Launch sync 2026-11-14`.
  - `logs/launch.md`, new entries above `## 2026-11-10`, newest first:
    - `## 2026-11-17`: `Done: Sam sent the test plan (Launch sync 2026-11-17)`; `Done: Sam shared the demo script (Launch sync 2026-11-17)`
    - `## 2026-11-15`: `Done: shared with team: #12 (2026-11-15-launch-status.md) from /projects/launch.md`
    - `## 2026-11-14`: `Done: kickoff held (Launch sync 2026-11-14)`
    - `## 2026-11-12`: `Done: shared with team: #6-#11, #13 (2026-11-12-launch-followup.md) from /projects/launch.md`
  - The `RUN.md` of the new fixture has a section per scenario of this spec; it names the bullets that scenarios add for one run.
  - Owner: the owner of the fixture brain is not one of the people notes. Sam Lee (`sam-lee`) is a member of audience `team` in `outbox/team/audience.md`, so a `Decision(Sam Lee, ...)` passes the rule 4 test.
  - Reuse: #2 (published, bullet `Done: shared with team: #2` exists) is the item with a state; #3 (published, no `Done: shared with team:` bullet) is the unfollowable row of F1.7.

## Decisions

- Lineage keys on the manifest id (`#4`). Rejected: keying on the `Outlet ref`, and marking brain items with `(outlet: <ref>)`, because it would put outlet identifiers into the brain and into the skill's logic, and the publisher can already map an id to its outlet ref through the manifest row.
- Followed entries are `published` entries only, whatever their `Outlet ref`. Rejected: also requiring a non-empty Outlet ref, because the skill must not depend on the publisher's field.
- The follow-up has its own scope (the source projects of followed entries). Rejected: reading "the sources in scope", because the step runs before a scope exists and drift does not depend on what the owner scopes today.
- States are `done`, `dropped`, `answered`, `superseded`, `reopened`. Rejected: `done, dropped, open, approved, superseded`, because `approved` collides with the manifest status `approved` and `open` is ambiguous.
- Each status line gets its own manifest row, and the current state is derived from the newest non-withdrawn status row. Rejected: a state column on the original row, because entries are append-only today and the publisher only acts on `approved` entries.
- Status lines do not count against `brain.max_items`. Rejected: counting them, because they are one-liners about things already shared and would push out new items.
- A due date alone never makes a state. It raises a question under Needs decision. Rejected: proposing `done` or `dropped` from a passed due date, because that is a guess (rule 6).
- Status and withdraw are separate. Withdraw removes an item that should not be in the outlet; status moves on an item that was true.
- Evidence is read from entries dated on or after the package's `approved` date. Rejected: strictly after, because it would miss evidence logged on the approval day, and log dates carry no time to order it.
- The overdue question repeats on every run until the brain holds evidence. Rejected: a dismissal recorded in the manifest, because it adds stored state and a new manifest convention; and a count-only line, because the owner would not see which item is overdue.
- The reserved prefix `Status: #` keeps status entries distinguishable from item entries by their Item text alone. Rejected: a new manifest column, because the table stays as it is.

## Assumptions

- The lag between `approved` and `published` is short, so not following up `approved` entries loses little. If wrong: follow-up must also cover `approved` entries, proposing a withdrawal or a replacement.
- Matching by meaning from the package line is reliable enough given owner approval per item. If wrong: a stored link from a manifest id to the brain line is needed (a marker on the brain item).
- Reading a project file and its log since the package date is cheap enough on every run. If wrong: the follow-up runs only on request.
- Publishers can map a referenced id to an outlet item through the manifest `Outlet ref`. If wrong: the status line must carry the outlet ref.
- A `files` item needs no state. If wrong: add `dropped` for files, with the same rules.

## Dependencies

None.

## Review

- Round 1 (2026-11-18): paraphrase context missing, 0 divergences, 11 guesses; critic B0 M8 N3; readiness B0 M5 N5. Fixed 29, rejected 0, escalated 1. Not run: none.
- Round 2 (2026-11-18): paraphrase context missing, 0 divergences, 12 guesses; critic B0 M0 N0; readiness B0 M0 N0. Fixed 5, rejected 0, escalated 0. Not run: none.
- Clarification (2026-11-18): Should the overdue question come back on every run, since the skill stores no state? Answer: Repeat, on every run until the brain holds evidence. Changed: F1, Decisions.
- Fixes after round 2, not reviewed: P2-1 context summaries in Existing system; P2-2 fixture owner and Sam Lee's membership; P2-3 wording of F3.3; P2-4 overdue applies to Actions only; P2-5 scenario order.
- Approved (2026-11-18): "I approve this spec, go ahead and implement it".
- Change with owner consent (2026-11-18): the status seed moves to its own fixture brain, test/fixtures/outbox-status-brain/, because seeding the existing fixture broke its manual scenarios; its team audience also receives open-questions and cadence, so the status lines of #9 and #11 are not held back. Owner chose "Separate fixture". Changed: Features (testability, F4.4), Interfaces.

