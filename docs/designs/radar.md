# Radar

Status: approved
Slug: radar
Date: 2026-11-17

## Problem

The brain shows what is written down. `agenda` ranks the open items, and `nucleus` reduces one named thing to its smallest unblocker. Neither finds what is absent: the decision nobody scheduled, the length of a meeting nobody confirmed, the presenter nobody invited. These gaps surface on the day of the event, when they are most expensive. The dates that would reveal them are already in the brain, spread over project files, plan notes, logs and captures.

## Existing system

- **Brain**: `projects/` (state files with frontmatter `phase` and a `## Open` section), `logs/` (history, newest first, one `## YYYY-MM-DD` heading per day), `knowledge/` (notes; a project's notes are listed in its notes map; the plan note is `knowledge/<slug>-plan.md`; a note that matters until a date has `stale_after`), `people/`, `inbox/` (captures) and `.confidential/` (off limits). Format in `docs/spec.md`.
- **Write funnel**: outside `triage` and `sync`, a session writes only captures.
- **Provenance**: `Inferred:` marks an agent's own conclusion.
- **Org boundary**: orgs other than `personal` are isolated from each other.
- **Skills**: `template/skills/<name>/SKILL.md`, mirrored in `template/.github/prompts/<name>.prompt.md`, built into `plugin/`. Seven ship today.

## Is it redundant?

| Skill | Input | Question | Output |
|---|---|---|---|
| `agenda` | Open items that exist | What needs me now? | Ranked items |
| `nucleus` | One thing the owner names | What is the smallest unblocker? | One nucleus |
| `radar` | Dated events of the horizon | What should exist by now and does not? | Up to 10 gaps |

`nucleus` has a safety question and a pre-mortem, but both work inside the one thing the owner brought. `radar` scans all active projects for things the owner did not bring. The two chain: a gap found here is a thing to run `nucleus` on. The overlap with `agenda` is removed by rule: a gap that is already an open item with an owner and a due date before the event is dropped.

## Out of scope

- Any status report or list of what is on track.
- Suggesting itself, or running on a schedule.
- Editing anything. The only write is the optional capture.
- Events that are not written in the brain. No calendar or mail access.
- A rules block in `AGENTS.md`, a CLI command or a lint rule.

## Terms

- **horizon**: the days ahead that are scanned. Default 21.
- **event**: something with a date inside the horizon: a meeting, a deadline, a delivery, a handover or an absence.
- **gap**: a decision, information, input, invitation, prep or follow-up that an event needs and that the brain does not show.
- **check**: one of the seven questions asked of each event: Decisions, Information, Inputs, People, Prep, Rhythm, Promises.

## Features

### F1. The scan (P1)

Scenarios:
- F1.1 Given no scope, then the skill reads every project with `phase: active` and uses a horizon of 21 days. Given a project, an org or a horizon from the owner, then it uses that.
- F1.2 Given a project in scope, then the skill reads its state file, its plan note, a note from its notes map only when the description says plan or prep for something inside the horizon and `stale_after` has not passed, the log entries of the last 7 days, and the captures in `inbox/`. It opens a person note only when an event depends on that person. It never opens `.confidential/`.
- F1.3 Given the dated events, then each is asked the seven checks.
- F1.4 Given a candidate that a newer decision, booking or `Done:` entry covers, then it is dropped. The newest entry wins.
- F1.5 Given a candidate that is already an open item with an owner and a due date before the event, then it is dropped. An undated open item that an event depends on stays.
- F1.6 Given no dated event in the brain for a candidate, then it is not reported. The skill invents no events or dates.

### F2. The report (P2)

Scenarios:
- F2.1 Given gaps, then the report shows at most 10, earliest close-by date first, grouped by when they must be closed, one line each with the gap, why it bites and by when.
- F2.2 Given a line, then it names its project and draws only on notes of that project's org.
- F2.3 Given more than 10 gaps, then one line gives the count of the rest. Given none, then the report is one line.
- F2.4 Given a gap that rests on an `Inferred:` bullet or a `status: draft` note, then the line says "(inferred)".
- F2.5 Given the report, then it has no preamble, no summary, nothing that is on track, and no em or en dashes.
- F2.6 Given the report, then the skill offers once to save the gaps and to run `nucleus` on one of them.
- F2.7 Given the owner corrects a gap, then it is dropped without argument.

### F3. Saving (P3)

Scenarios:
- F3.1 Given the owner agrees, then the skill writes one capture per org that has gaps, `inbox/YYYY-MM-DD-radar-<org>.md`, with `type: capture`, `source: chat`, the tag `radar` and that `org`. Each bullet carries `Inferred:`. It never overwrites, adds no index line and edits no other file.
- F3.2 Given no agreement, then no file is created or changed.

### F4. Packaging: eight skills (P4)

Scenarios:
- F4.1 `npm test` passes with `SKILLS` holding eight names, and `plugin/skills/radar/SKILL.md` is built.
- F4.2 The prompt `template/.github/prompts/radar.prompt.md` has the same body as the skill.
- F4.3 The README, the manifests, the Layout tables and the docs that list the skills name `radar` and say eight skills where they give a count.
- F4.4 Every example is invented: project `launch`, person `Sam Lee`, dates that belong to no real plan.

Testability: unit for F4 and for text assertions on the skill; F1 to F3 by a manual run.

## Success criteria

- SC1 `npm test` passes with eight skills.
- SC2 A run without saving changes 0 files in the brain.
- SC3 A report holds at most 10 gaps and each names its project.
- SC4 No capture holds gaps of more than one org.
- SC5 The skill, its prompt and this spec pass the repository's leak gate.

## Decisions

- A separate skill, not a mode of `agenda` or a tool of `nucleus`. `agenda` reads only `## Open` and stays cheap; this scan reads plans, logs and captures. `nucleus` works on one named thing.
- One capture per org, not one capture for all. The owner's draft wrote a single file, which would put several orgs' details into one note.
- The skill writes the captures itself in the `drop` format. A Copilot prompt cannot call another skill.
- Gaps are saved as `Inferred:` bullets, so triage and the `outbox` barrier treat them as the agent's conclusions.
- Which notes to open is decided by the plan note name, the notes map descriptions and `stale_after`, which the format defines, not by a file naming habit of one brain.
- The default horizon is 21 days, the upper end of the owner's "two to three weeks".
- The exclusion of commercial, contractual and personal admin matters is a default the owner can lift per run.

## Assumptions

- Events are in the brain with dates. A brain without dated plans yields few gaps.
- Behaviour is a model following prose, verified by manual runs.

## Dependencies

None. It links to `nucleus` by name only.

## Review

- Source: a skill the owner ran in isolation outside this repository.
- Inline review (2026-11-17), no reviewer agents run. Changes against the draft:
  1. The redundancy check above, and the rule F1.5 that removes the overlap with `agenda`.
  2. Org boundary: every line names its project, and saving writes one capture per org (F2.2, F3.1).
  3. Saving no longer calls another skill by a plugin-specific name (Decisions).
  4. Which notes are opened follows the format, not one brain's file names (F1.2).
  5. The shared paragraph to find the brain, the dash rule and the "never write none" rule of `agenda`.
  6. Example dates and events were replaced by invented ones, and a contract term specific to one line of work was generalised (F4.4).
  7. A link to `nucleus` as the next step for a single gap.
- Approved (2026-11-17): "approve". The owner kept one capture per org.
  8. After approval of the design, each of the eight skills gained a line naming what it works on and the question it answers, with the same table in the README and the docs.
- Change with owner consent (2026-11-17): the skill is renamed to `radar`, so that every skill has a one-word name. "Blind spots" stays as a trigger phrase and as the title of the report. The capture file and its tag follow the new name. Version 0.9.1.
