---
type: guide
description: Manual run checklist for the outbox skill against this fixture brain
tags: [outbox, fixture, manual]
updated: 2026-11-11
---

# Outbox fixture: manual run checklist

Produce each result before reading its expected result.

Everything here is dummy data. Run the `outbox` skill with this folder as the brain. Today is 2026-11-11. Spec: `docs/designs/outbox.md`. Skill: `template/skills/outbox/SKILL.md`.

## Reset (do this first, and between every run that writes)

From the repo root:

```sh
git checkout -- test/fixtures/outbox-brain && git clean -fd test/fixtures/outbox-brain
```

Scenarios that edit a copy (F2.29) or the manifest (F3.7) also need this reset afterwards.

## Seeded data

- Org `acme`: projects `launch`, `pilot`; org `other`: project `supplier`, person `vic-ora`. Space `launch`: `steering` (rank 2, members `sam-lee`, receives decisions and dates) and `team` (rank 1, members `sam-lee`, `lea-park`, receives decisions, dates and actions). Space `broken`: nine defect folders.
- People: `sam-lee` (Programme lead), `lea-park` (Finance contact). `Alex Moor` has no person note. Blocked term: `Zeta Corp`.
- Package `outbox/team/2026-11-10-launch-update.md` (approved 2026-11-10) holds #1 Book rehearsal room (Lea Park), #2 Kickoff 2026-01-12, #3 Training 2026-01-19, #5 Dry run 2026-02-20; #4 is withdrawn and has no line. Manifest statuses: #1 approved, #2 published, #3 published, #4 withdrawn, #5 `draft` (invalid). `outbox/steering/` has #1 "Scope frozen from 2026-02-01" (approved).
- Scope `launch` means `projects/launch.md`, `logs/launch.md` and the notes with `project: launch`. The bullets `Done: shared with ...` in a log are bookkeeping, not candidates, and are in no count. Link lines and the `## People` list are not candidates. The line "The architecture review is set for 2026-12-10." has no source ref (F2.16).

## F2 Inputs

| Id | Prompt | Seeds | Expected |
|---|---|---|---|
| F2.1 | "stage an update" | none | Asks which audience. Writes nothing. |
| F2.2 | "stage for pilot-board, scope launch"; also "stage for no-audience" | no `outbox/pilot-board/`; `outbox/no-audience/` has no `audience.md` | Offers to create `audience.md` from `templates/audience.md` and stops. |
| F2.3 | "stage for X, scope launch", X one at a time | the nine `outbox/bad-*` and `empty-receives` folders | Each time names the problem and writes nothing: `bad-slug` (audience differs from folder), `bad-org` (org `personal`), `bad-receives` (`gossip` not a class), `bad-member` (`nobody-here` has no person note), `bad-rank` (rank 0), `bad-space` (no `space`), `bad-roles` (`roles` not a list), `bad-member-org` (`vic-ora` has org `other`, audience org is `acme`), `empty-receives` (empty). |
| F2.4 | "stage for team"; then "stage for team since last run" | package approved 2026-11-10 | First: asks for a scope, writes nothing. Second: start is 2026-11-10. Log sections dated 2026-11-10 are in; the 2026-11-09 section (the `Said(Lea)` bullet) is not, so higher rank only is 1. Notes with `updated` 2026-11-10 are in (launch, pilot, notes; supplier and inbox skipped). Same-day Kickoff and Training lines are restated items: already shared 2. |

## F2 Barrier

Prompt "stage for team, scope launch" (reference results at the end). Then "stage for team, scope: projects supplier, the inbox note and the confidential note".

| Id | Expected |
|---|---|
| F2.5 | "Go-live moved to 2026-03-10" is item 3, a rewritten Dates item. "Sam is too defensive on scope" is counted in "opinion about people: 1", not quoted. |
| F2.6 | Second prompt: `projects/supplier.md` is not read: "other org, skipped". |
| F2.7 | Second prompt: `.confidential/n.md` "confidential, skipped"; `inbox/2026-11-10-c.md` "inbox, skipped". Nothing proposed. |
| F2.8 | `draft.md` and `old.md` are skipped until you name them as cleared; then each shows one item. `plan.md` (stable) passes with its item (reference item 2). The next run asks again; nothing stored. |
| F2.9 | Sam appears only as owner of item 4 ("Sam Lee"). "Avoid raising budget before noon" appears nowhere. |
| F2.10 | `Inferred: Mara will own the migration` is "speculation: 1". The `Said(Lea)` bullet is never a quote; as a candidate for team it is "higher rank only"; for steering it is restated as "Scope freeze on 2026-02-01 (agreed)" and counted as already shared. |
| F2.11 | Item 5 has Owner `?` and Due `?` (the line says "probably Sam"). Item 4 has Sam Lee and 2026-11-20; remove ", Sam" from a copy of that line and its Owner becomes `?`. |
| F2.12 | The `zeta corp` log bullet is "blocked term: 1" (case-insensitive). |
| F2.13 | The 12-plus word sentence in `plan.md` is item 2, reworded: no 12 consecutive words shared with the note. |
| F2.14 | Prompt "stage for steering, scope launch and pilot". The pilot line "Finance contact Lea Park confirms the sign-off date 2026-12-01" is a proposed Dates item reading "Finance contact confirms the sign-off date 2026-12-01 (Pilot sync 2026-11-10)", with no name (Lea is not a member of steering, not an owner). For team the name may appear (member). |
| F2.15 | Day rate: "commercial: 1". "cost per request 4 EUR" and `Alex Moor`: needs decision (2). "Between us ..." line: "private marker: 1". |
| F2.16 | The architecture review line (a date, no meeting or thread) is not proposed. |
| F2.29 | Run F2.14 again after removing `role` from `people/lea-park.md` (reset afterwards): the sign-off item goes to needs decision, no role invented. `Alex Moor, rollout reviewer` in `## People` never gives a role. |

## F2 Rank flow

| Id | Prompt | Expected |
|---|---|---|
| F2.26 | "stage for team, scope launch" | The scope freeze line and the `Said(Lea)` bullet restate steering #1, absent from any team package: "higher rank only: 2" (counted, not quoted). |
| F2.26 | Approve item 1 in team (reset after), then "stage for steering, scope launch" | The change requests candidate restates a team item; it is still proposed to steering (lower rank may go up). |

## F2 Audience fit

Prompts "stage for steering, scope launch", then "stage for team, scope launch".

| Id | Expected |
|---|---|
| F2.22 | Steering: only Decisions and Dates, one line each; the three change request lines become 1 item with source ref "Launch sync 2026-11-03; Launch sync 2026-11-10"; the actions are not proposed (not relevant to steering: 3, with the definition). The scope freeze is a different decision: for steering it is already shared (steering #1), for team it is "higher rank only". Team: the same consolidated item plus the Actions items 4 and 5. |
| F2.23 | Unit tests, not a run: `test/init.test.mjs` (template AGENTS.md, Outbox section). |
| F2.24 | Unit tests, not a run: `test/init.test.mjs`, `test/plugin.test.mjs` (audience template, skill and prompt exist). |
| F2.25 | Unit tests, not a run: `test/plugin.test.mjs` (skill description triggers). |

## F2 Approval and writing

Prompt "stage for team, scope launch".

| Id | Prompt | Expected |
|---|---|---|
| F2.17 | answer nothing | Presents the 5 items, held back 7 by category with counts (opinion 1, commercial 1, speculation 1, blocked term 1, private marker 1, higher rank only 2), needs decision 2, "not relevant to team: 1", "already shared: 2". Nothing written. |
| F2.18 | "approve 1, 2 and 4", rename the slug to `launch-update` | Writes `outbox/team/2026-11-11-launch-update.md` (new file; the 2026-11-10 one is untouched) with Decisions #6 (change requests), #7 (readiness) and Actions #8, and manifest entries 6 to 8 `approved`. Items 3 and 5 appear nowhere. |
| F2.19 | same | `#8 Send test plan \| Sam Lee \| 2026-11-20 \| Launch sync 2026-11-10`, the display name, not the slug. |
| F2.20 | additionally "select knowledge/diagram.png", say it belongs to acme (a binary has no org of its own, so the owner asserts it); then "select .confidential/budget.pdf" | The skill says the content is not inspected and that selecting is your acceptance. The png goes to `outbox/team/files/diagram.png`, a Files line with a purpose, manifest row #9 (alone after a reset: #6); its log path is `/knowledge/diagram.png` under `logs/launch.md`. The pdf is refused (`.confidential/`). No other binary is copied. |
| F2.21 | after any run: `grep -rniE "zeta corp\|projects/\|logs/\|knowledge/\|people/\|inbox/\|\.confidential/" test/fixtures/outbox-brain/outbox` | No matches. The log bullets live under `logs/`, never under `outbox/`. |
| F2.27 | Approve four items: Go-live with source ref `projects/launch.md`; a text with `zeta corp`; the sentence of `plan.md` copied word for word; a clean change requests item | Self-check drops 3 and reports "path", "blocked term", "overlap"; only the clean item is written (#6). |
| F2.28 | "change the rank of team to 3" (reset afterwards) | `target:` and `notify:` lines are preserved byte for byte; `git diff` shows only the rank line. |

## F3 Trace

Prompt "stage for team, scope launch and pilot", approve items.

| Id | Expected |
|---|---|
| F3.1 | After F2.18 (items 1, 2, 4): `logs/launch.md` gets under a new `## 2026-11-11` at the top `Done: shared with team: #6-#8 (2026-11-11-launch-update.md) from /projects/launch.md, /knowledge/plan.md`. No file under `outbox/` contains those paths. |
| F3.2 | Approve the change requests item (launch) and "Pilot users start on 2026-02-15" (pilot): `logs/launch.md` gets `#6 ... from /projects/launch.md` and `logs/pilot.md` gets `#7 ... from /projects/pilot.md`, each with only its own id and path. |

## F3 Handback

Entries: #2 `published` with a `Done: shared with team: #2` bullet in `logs/launch.md`, #3 `published` with no bullet, #5 status `draft`.

| Id | Prompt | Expected |
|---|---|---|
| F3.3 | "stage for team, scope launch", then again | `logs/launch.md` gets under `## 2026-11-11` the bullet `Done: published to team: #2`, once; the repeat adds nothing. #3 is reported (no `Done: shared with team:` bullet) and logged nowhere. |
| F3.6 | same run | #5 has status `draft`: reported, not logged as published. |

## F3 Withdraw and transitions

Entries: #1 `approved`, #2 and #3 `published`, #4 `withdrawn`, #5 `draft`.

| Id | Prompt | Expected |
|---|---|---|
| F3.4 | "withdraw #1, #2, #3 and #5" for team | #1, #2, #3 become `withdrawn`, entries kept, lines removed from the package; for #2 and #3 you are told to remove them from the outlet. #5 (`draft`) is a disallowed transition: reported, unchanged, its line stays, so the package is not empty. For the empty package case: reset, then "withdraw item 1" for steering: row 1 `withdrawn`, the package keeps its frontmatter and `All items withdrawn`. |
| F3.5 | "withdraw item 99"; "withdraw item 4" for team | Unknown id; already withdrawn. Nothing changes. |
| F3.7 | "set item 4 back to approved" for team | `withdrawn` to `approved` is disallowed: reported, nothing changed. Allowed: approved to published, approved to withdrawn, published to withdrawn. |

## Reference results (read only after your own run)

The reference proposal for "stage for team, scope launch":

Step by step: step 3 handback runs first (see F3.3). Step 6 skips `knowledge/draft.md` ("draft, skipped") and `knowledge/old.md` ("deprecated, skipped") and asks whether to release them; `plan.md` is read. The numbered proposal (class order Decisions, Dates, Actions):

1. Decisions: change requests go to steering review with a written impact note (Launch sync 2026-11-03; Launch sync 2026-11-10). Three lines consolidated into one item.
2. Decisions: every workstream confirms readiness before the cutover weekend of 2026-03-07 (Launch sync 2026-11-10). Reworded, from `plan.md`.
3. Dates: Go-live 2026-03-10 (Launch sync 2026-11-10).
4. Actions: Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-10.
5. Actions: Draft the rollout notice | ? | ? | Launch sync 2026-11-10 (owner only inferred, no due date).

- Held back, 7: opinion about people 1 (Sam defensive), commercial 1 (supplier day rate), speculation 1 (`Inferred:` Mara), blocked term 1 (the `zeta corp` bullet), private marker 1 ("Between us"), higher rank only 2 (the scope freeze line and the `Said(Lea)` bullet; accept 1 if the skill folds them together first, but never a proposal to team).
- Needs decision, 2: "cost per request 4 EUR" (money), `Alex Moor` (no person note).
- not relevant to team: 1 (the definition of a workstream, class `definitions`, not in `receives`).
- already shared: 2 (Kickoff 2026-01-12, Training 2026-01-19, both in the team package).
- Skips: draft 1, deprecated 1. The unsourced architecture review line is not proposed and in no count.

Releasing `draft.md` adds Dates "data migration cutover 2026-02-27"; releasing `old.md` adds Decisions "legacy export off on 2026-04-30"; each raises the proposal to 6 and 7.

For `steering`, scope `launch`: proposed 5 (Decisions: change requests; readiness. Dates: Go-live; Kickoff 2026-01-12; Training 2026-01-19); held back 5 (opinion 1, commercial 1, speculation 1, blocked term 1, private marker 1; no "higher rank only", steering is the top rank); needs decision 2; not relevant to steering: 3 (two actions and the definition); already shared: 2 (the scope freeze line and the `Said(Lea)` bullet, both restate steering #1).
