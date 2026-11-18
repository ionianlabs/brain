---
type: guide
description: Manual run checklist for the outbox status follow-up against this fixture brain
tags: [outbox, fixture, manual]
updated: 2026-11-18
---

# Outbox status fixture: manual run checklist

Produce each result before reading its expected result.

Everything here is dummy data. Run the `outbox` skill with this folder as the brain. Today is 2026-11-18, audience `team`, org `acme`, project `launch`, scope `launch`, unless a section says otherwise. Spec: `docs/designs/outbox-status.md`. Skill: `template/skills/outbox/SKILL.md`. Sections are headed "status F1.1" and so on, because unprefixed F2.x and F3.x mean the outbox spec.

## Reset (do this first, and between every run that changes or writes)

From the repo root:

```sh
git checkout -- test/fixtures/outbox-status-brain && git clean -fd test/fixtures/outbox-status-brain
```

A "Change" line says what to change by hand for that run. Every scenario with a change says to reset afterwards; the short form `git checkout -- test/fixtures/outbox-status-brain` undoes hand changes, and the full form above also removes files a run wrote.

## Seeded data

- Space `launch`, audience `team` (rank 1, members `sam-lee` and `lea-park`, receives decisions, dates, actions, open-questions and cadence). Blocked term: `Zeta Corp` (in `AGENTS.md`, never under `outbox/`). The owner of the brain is not one of the people notes.
- Manifest entries #1 to #5 as in the outbox fixture (#1 approved, #2 and #3 published, #4 withdrawn, #5 `draft`), package `2026-11-10-launch-update.md`. Seeded since 2026-11-12: entries #6 to #13 (#6 to #12 `published`, #13 `approved`), packages `2026-11-12-launch-followup.md` and `2026-11-15-launch-status.md`.
- Row #12 is the current state `done` of #2. Row #3 has no `Done: shared with team:` bullet. Entries #6 (Due 2026-11-20, with a `Done:` bullet) and #7 (Due 2026-11-20, no evidence) are Actions; #8 Dates; #9 Open questions; #10 Decisions; #11 Context; #13 Actions with matching evidence but `approved`.
- `logs/launch.md` entries: 2026-11-17 (`Done: Sam sent the test plan (Launch sync 2026-11-17)`, `Done: Sam shared the demo script (Launch sync 2026-11-17)`), 2026-11-15, 2026-11-14, 2026-11-12 and 2026-11-10. The bullets `Done: shared with ...` are bookkeeping, not candidates.
- "Add" means add the bullet as a line under the given date heading of `logs/launch.md` for that run only.

## status F1.1

Change: add under `## 2026-11-17` in `logs/launch.md` two new candidates that pass the barrier and fit: `Decision(Sam Lee, Launch sync): demo day is held on Fridays` and `Decision(Sam Lee, Launch sync): release notes go out on Mondays`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Proposed holds 2 items; the Status block holds `3. Status: #6 Send test plan | done | Launch sync 2026-11-17`, no own id.

## status F1.2

Change: none (baseline fixture)

Ask: "stage for team, scope launch"

Expect: No status line for #7 (Due 2026-11-20, no evidence).

## status F1.3

Change: tell the skill that today is 2026-11-21; no file change

Ask: "stage for team, scope launch"

Expect: Needs decision holds "#7 was due 2026-11-20: still open?"; the Status block holds nothing for #7.

## status F1.4

Change: add under `## 2026-11-17` in `logs/launch.md` `Inferred: Lea probably updated the rollout checklist`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: No status line for #7 (an `Inferred:` bullet is never evidence).

## status F1.5

Change: add under `## 2026-11-17` in `logs/launch.md` `Done: material sent`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Needs decision holds a question naming #7; no status line for it.

## status F1.6

Change: none (baseline fixture): #13 is `approved` and the bullet `Done: Sam shared the demo script (Launch sync 2026-11-17)` is seeded

Ask: "stage for team, scope launch"

Expect: #13 is not followed up; no status line for it.

## status F1.7

Change: none (baseline fixture): #3 is `published` and no `Done: shared with team:` bullet names it

Ask: "stage for team, scope launch"

Expect: The summary reports #3 as "not followed up" with that reason; no status line for it.

## status F1.8

Change: none (baseline fixture): #12 (`done` for #2) is `published` and the bullet `Done: kickoff held (Launch sync 2026-11-14)` is seeded

Ask: "stage for team, scope launch"

Expect: No status line for #2 (no repeat).

## status F1.9

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): the kickoff is repeated, a second one is needed`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The Status block holds `Status: #2 Kickoff on 2026-01-12 | reopened | Launch sync 2026-11-17`.

## status F1.10

Change: none (baseline fixture); give any scope afterwards

Ask: "stage for team, scope launch"

Expect: Before the scope is used, the skill reads `projects/launch.md` and the `logs/launch.md` entries dated 2026-11-12 or later (package `2026-11-12-launch-followup.md`, approved 2026-11-12) for #8 and #9.

## status F1.11

Change: add `Done: Lea updated the rollout checklist` under `## 2026-11-15` and `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened` under `## 2026-11-17`, both in `logs/launch.md` (the `## 2026-11-15` heading exists; its bullet goes below the seeded one)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Nothing is proposed for #7 (the evidence nets out to the state the outlet already has).

## status F1.12

Change: add under `## 2026-11-17` in `logs/launch.md` both bullets: `Done: Lea updated the rollout checklist` and `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: No status line for #7; Needs decision holds a question naming #7 (same date, contradicting).

## status F1.13

Change: add under `## 2026-11-17` in `logs/launch.md` `Done: Sam Lee answered the sign-off question by email, not shareable`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The Status block holds `Status: #9 Who signs off the test plan | answered | Project log 2026-11-17`, with no `by`.

## status F1.14

Change: tell the skill that today is 2026-11-20; no file change

Ask: "stage for team, scope launch"

Expect: Needs decision holds no question for #7 (not overdue on the due date).

## status F1.15

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): the scope freeze is cancelled, no replacement`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The Status block holds `Status: #10 Scope frozen from 2026-02-01 | dropped | Launch sync 2026-11-17`.

## status F1.16

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): the rollout checklist update is reopened`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: No `reopened` line for #7 (it has no current state).

## status F1.17

Change: add under `## 2026-11-17` in `logs/launch.md` `Done: Lea Park sent the test plan`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Needs decision holds a question naming #6 (different owner); no line is proposed from that bullet.

## status F1.18

Change: add the duplicate row `| 8 | Go-live 2026-03-10 | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0008 |` at the end of `outbox/team/manifest.md`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The summary reports #8 as "not followed up" with the reason "id appears twice"; #9 is still followed.

## status F1.19

Automated string test, no run: `npm test` (`test/plugin.test.mjs`).

## status F1.20

Change: as F1.3 (tell the skill that today is 2026-11-21; no file change)

Ask: "stage for team, scope launch", then again on the same day, nothing stored in between

Expect: Both runs list "#7 was due 2026-11-20: still open?" under Needs decision.

## status F2.1

Change: as F1.1 (add the two bullets `Decision(Sam Lee, Launch sync): demo day is held on Fridays` and `Decision(Sam Lee, Launch sync): release notes go out on Mondays`); the highest id is 13

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: approve the Status line, keep the slug `launch`

Expect: Package `outbox/team/2026-11-18-launch.md` has under `## Status` the line `#14 Status: #6 Send test plan | done | Launch sync 2026-11-17`; the manifest has `14 | Status: #6 done | 2026-11-18-launch.md | approved | 2026-11-18 |` with an empty Outlet ref; `logs/launch.md` under `## 2026-11-18` has `Done: shared with team: #14 (2026-11-18-launch.md) from /projects/launch.md`.

## status F2.2

Change: first do F2.1 and do NOT reset; row #14 is then `approved` (you may also set it to `published` by hand and run once more)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team, scope launch" again

Expect: #14 is not followed up; no line for #6 (no repeat).

## status F2.3

Change: add this row at the end of `outbox/team/manifest.md` by hand (it stands for the state `done` of #6 that the owner withdrew; the F2.1 package does not need to exist): `| 14 | Status: #6 done | 2026-11-18-launch.md | withdrawn | 2026-11-18 | |`. Alternative: do F2.1 without reset, then change the Status of row #14 to `withdrawn`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team, scope launch"

Expect: #6 has no state; no `done` line for #6; Needs decision holds once "#6 done was withdrawn earlier: propose again?".

## status F2.4

Change: replace the seeded bullet `Done: Sam sent the test plan (Launch sync 2026-11-17)` in `logs/launch.md` by the bullet `Done: Sam sent the test plan`, which names no meeting or thread (the entry stays `## 2026-11-17`)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The evidence ref reads `Project log 2026-11-17`.

## status F2.5

Change: none (baseline fixture)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team, scope launch"; when the Status line for #6 is shown, change its evidence ref in the conversation to `projects/launch.md`, then approve it

Expect: The self-check drops the line from the write and reports "path".

## status F2.6

Change: add the blocked term `Send test plan` to the blocked-terms line under `## Outbox rules` in `AGENTS.md`, so it reads ``- Blocked terms (matched case-insensitively as whole phrases): `Zeta Corp`, `Send test plan`.``

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The line for #6 is held back as "blocked term" (counted, not quoted).

## status F2.7

Change: in `outbox/team/audience.md` change the line to `  receives: [decisions, dates, open-questions, cadence]` (`actions` removed)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The status line for #6 is held back and counted under Held back.

## status F2.8

Change: as F1.1 (add the two bullets `Decision(Sam Lee, Launch sync): demo day is held on Fridays` and `Decision(Sam Lee, Launch sync): release notes go out on Mondays`)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: reject the Status line, approve the rest, then run again

Expect: Nothing is written for it (no package line, no manifest row, no log bullet, no id used); the next run proposes it again.

## status F2.9

Change: none (baseline fixture)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team", scope "status only", approve one line (#6), change the default slug to `launch`

Expect: Package `outbox/team/2026-11-18-launch.md` with frontmatter and a `## Status` section only.

## status F2.10

Change: none (baseline fixture): #12 is `published`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "withdraw item 12" for team

Expect: Row #12 becomes `withdrawn`; the `#12` line leaves `2026-11-15-launch-status.md`; #2 has no state again; you are told to revert that state in the outlet.

## status F2.11

Change: first do F2.1 and do NOT reset, then set row #14 in `outbox/team/manifest.md` to `published` with the Outlet ref `ref-0014`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team, scope launch"

Expect: `logs/launch.md` gets `Done: published to team: #14`.

## status F2.12

Change: as F2.3 (add the row `| 14 | Status: #6 done | 2026-11-18-launch.md | withdrawn | 2026-11-18 | |` by hand)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: "stage for team, scope launch", then answer yes to "propose again?"

Expect: The line is not shown in a second Present, goes through the self-check and is written, alone in this run, under a new id (#15).

## status F2.13

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): Status: #6 follow-up is weekly`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The presented title is rewritten and does not start with `Status: #`.

## status F3.1

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): Sam Lee signs off the test plan`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Proposed item 1 is the new Decisions item; the Status block holds `2. Status: #9 Who signs off the test plan | answered by proposed item 1 | Launch sync 2026-11-17`; neither line shows an own id.

## status F3.2

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): scope frozen from 2026-03-01 instead`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Proposed item 1 is the new decision; the Status block holds `2. Status: #10 Scope frozen from 2026-02-01 | superseded by proposed item 1 | Launch sync 2026-11-17`.

## status F3.3

Change: as F3.2 (add the bullet), and change row #10 in `outbox/team/manifest.md` to `| 10 | Scope frozen from 2026-02-01 | 2026-11-12-launch-followup.md | approved | 2026-11-12 | |`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: The new decision and the withdrawal of #10 are proposed as today; no status line.

## status F3.4

Change: as F3.1 (add the bullet)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: approve the status line, reject the new decision

Expect: The status line is not written (it names a proposed item that is not written).

## status F3.5

Change: set `max_items: 2` in `brain:` of `outbox/team/audience.md`, and add under `## 2026-11-17` in `logs/launch.md` three new candidates: `Decision(Sam Lee, Launch sync): demo day is held on Fridays`, `Decision(Sam Lee, Launch sync): release notes go out on Mondays`, `Decision(Sam Lee, Launch sync): standups start at 9:30`, and the bullet `Done: Sam Lee answered the sign-off question by email, not shareable`. The two status lines are then #6 done (seeded `Done: Sam sent the test plan (Launch sync 2026-11-17)`) and #9 answered (the added `Done:` bullet); the three new candidates are the three `Decision(...)` bullets

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Proposed holds 2 new items; On the bench holds 1; the Status block holds both status lines (#6 done, #9 answered).

## status F3.6

Change: add by hand. (a) Seven manifest entries at the end of `outbox/team/manifest.md`, all `published`, package `2026-11-12-launch-followup.md`, date 2026-11-12: `| 14 | Book demo room | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0014 |`; `| 15 | Order name badges | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0015 |`; `| 16 | Print agenda | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0016 |`; `| 17 | Test microphone | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0017 |`; `| 18 | Send invitations | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0018 |`; `| 19 | Prepare slides | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0019 |`; `| 20 | Confirm catering | 2026-11-12-launch-followup.md | published | 2026-11-12 | ref-0020 |`. (b) Seven lines under `## Actions` in `outbox/team/2026-11-12-launch-followup.md`: `- #14 Book demo room | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #15 Order name badges | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #16 Print agenda | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #17 Test microphone | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #18 Send invitations | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #19 Prepare slides | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`; `- #20 Confirm catering | Sam Lee | 2026-11-25 | Launch sync 2026-11-12`. (c) Under `## 2026-11-12` in `logs/launch.md` add `Done: shared with team: #14-#20 (2026-11-12-launch-followup.md) from /projects/launch.md`. (d) under `## 2026-11-17` in `logs/launch.md` add ten `Done:` bullets, which with the seeded `Done: Sam sent the test plan (Launch sync 2026-11-17)` give 11 status lines (#6, #7, #9, #10 and #14 to #20): `Done: Lea Park updated the rollout checklist (Launch sync 2026-11-17)` and `Done: Sam Lee answered the sign-off question by email, not shareable` and `Done: the scope freeze was cancelled, no replacement (Launch sync 2026-11-17)`, and `Done: Sam booked the demo room (Launch sync 2026-11-17)`, `Done: Sam ordered the name badges (Launch sync 2026-11-17)`, `Done: Sam printed the agenda (Launch sync 2026-11-17)`, `Done: Sam tested the microphone (Launch sync 2026-11-17)`, `Done: Sam sent the invitations (Launch sync 2026-11-17)`, `Done: Sam prepared the slides (Launch sync 2026-11-17)`, `Done: Sam confirmed the catering (Launch sync 2026-11-17)`. That is 3 + 7 added bullets plus the seeded one; none of them is a new candidate

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: All 11 are in the Status block, none is a new item; the "more than 10" check does not apply.

## status F3.7

Change: none (baseline fixture)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "withdraw item 6" for team

Expect: The Withdraw section applies as today; no status line is proposed for #6.

## status F3.8

Change: as F3.1 (add the bullet); the highest id is 13

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: approve both lines

Expect: The decision is `#14`; the status line is `#15 Status: #9 Who signs off the test plan | answered by #14 | Launch sync 2026-11-17`.

## status F3.9

Change: add under `## 2026-11-17` in `logs/launch.md` `Decision(Sam Lee, Launch sync): cycle length is 3 weeks`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: "stage for team, scope launch"

Expect: Proposed item 1 is the new item; the Status block holds `2. Status: #11 Cycle length is 2 weeks | superseded by proposed item 1 | Launch sync 2026-11-17`.

## status F3.10

Change: as F3.1 (add the bullet), and add under `## Now` in `projects/launch.md` the line `- The programme lead logs each approved change request within two days of the steering review (Launch sync 2026-11-10).`

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: when the new decision is shown, edit its text in the conversation to read `The programme lead logs each approved change request within two days of the steering review` (14 words copied), then approve both lines

Expect: Neither the decision nor the status line is written; the summary reports the status line as not written because its new item was dropped ("overlap").

## status F3.11

Change: as F3.1 (add the bullet)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: approve the new decision, reject the status line

Expect: The decision is written; #9 keeps its state.

## status F4.1

Change: none (baseline fixture)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: scope "status only", approve one line, keep the default slug

Expect: The package is `outbox/team/2026-11-18-status.md`; no source outside the follow-up scope was read.

## status F4.2

Change: as F1.1 (add the two bullets `Decision(Sam Lee, Launch sync): demo day is held on Fridays` and `Decision(Sam Lee, Launch sync): release notes go out on Mondays`)

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain` and `git clean -fd test/fixtures/outbox-status-brain` (the run writes files)

Ask: scope `launch`, approve the new items and the status line

Expect: The status lines are written into the same package as the new items, slug `launch` (or the one you confirm).

## status F4.3

Automated string test, no run: `npm test` (`test/plugin.test.mjs`, same body of skill and prompt, plugin step and states; the version `0.10.0` is covered by the test that keeps `plugin/` in sync with `package.json`).

## status F4.4

Automated: `npm test` (`test/outbox-status-fixture.test.mjs`) checks this file for a section per scenario and the seeded entries, bullets and packages.

## status F4.5

Automated string test, no run: `npm test` (`test/plugin.test.mjs`, dash test).

## status F4.6

Change: add the blocked term `Send test plan` to the blocked-terms line under `## Outbox rules` in `AGENTS.md`, as in F2.6

Reset afterwards: `git checkout -- test/fixtures/outbox-status-brain`

Ask: scope "status only", approve the line for #6

Expect: The skill reads `## Outbox rules`, holds the line back as "blocked term", and prints the summary.
