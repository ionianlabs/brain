# Nucleus

Status: approved
Slug: nucleus
Date: 2026-11-17

## Problem

Work stalls in two places. The owner gets a few minutes with someone whose answer the work depends on, and spends them on the wrong question. Or a task feels too large to start, and days of preparation rest on a fact nobody asked for. In both cases one small answer, decision or action would have unblocked the rest, and finding it first is cheaper than everything done without it. The brain holds what is already known about a project, but no skill asks what the smallest missing piece is.

## Existing system

- **Brain**: a markdown folder with `projects/` (state files with `## Now` and `## Open`), `logs/` (history), `knowledge/` (notes, listed per project in a notes map), `people/` (person notes), `inbox/` (untriaged captures) and `.confidential/` (off limits). `AGENTS.md` at the root is the rulebook. Format in `docs/spec.md`.
- **Write funnel**: outside `triage` and `sync`, a session writes only captures to `inbox/` (`AGENTS.md`, Session protocol). `triage` places a capture later; `sync` writes outcomes to a project's log.
- **Provenance**: a bare bullet is the owner's fact, `Said(Name):` is someone else's statement, `Inferred:` is an agent's own conclusion.
- **Org boundary**: every note has an `org`. Orgs other than `personal` are isolated from each other.
- **Sharing**: content leaves the brain only through the `outbox` skill, whose barrier always holds back meeting prep and talking points.
- **Skills**: prose instructions in `template/skills/<name>/SKILL.md`, mirrored body for body in `template/.github/prompts/<name>.prompt.md`, built into `plugin/` by `npm run build:plugin`. They depend only on file access. Each finds the brain with the same paragraph. Six ship today: `agenda`, `drop`, `triage`, `sync`, `aware`, `outbox`.

## Out of scope

- Suggesting itself. Version 1 runs only when the owner calls it. An agent never starts it on a meeting prep or a task on its own.
- Planning. No agendas, timelines or task lists.
- Ranking a backlog. It works on one thing at a time.
- Preparing the content of a meeting or a deliverable.
- Contacting anyone. Asking the holder is the owner's act.
- Any log of runs kept by the skill, and any signal design for a harness (see Decisions).
- Any CLI command or lint rule.

## Terms

- **owner**: the human whose brain it is.
- **nucleus**: the smallest answer, decision or action that unblocks the next piece of work. It passes one test: "If I had only this, could I start?"
- **kind**: one of `fact`, `their decision`, `my decision`, `first action`.
- **holder**: who has the nucleus: a person, a role, or `me`.
- **window**: the time until the owner's next chance to ask. A nucleus belongs to one window.
- **touch point**: a meeting or message exchange in which the owner can ask.
- **parked**: what is deliberately left for later, listed so it is not forgotten.
- **frame**: layer 1, the four steps that name one nucleus. Always run.
- **toolkit**: layer 2, ten independent tools for cases the frame cannot settle. Offered, never started unasked.
- **prep note**: the layer 2 result: questions in order with form and time, facts to chase, the parked list and a fallback.
- **loop**: closing a nucleus after the touch point or first action: record, check, release, next nucleus.

## Features

Priorities P1 to P4 are the delivery order. F1 is useful alone.

### F1. The frame (P1)

Story: As the owner, I say "nucleus" about one thing and get, within a minute, the one unblocker to go and get.

Scenarios:
- F1.1 Given the owner names no thing to work on, then the skill asks what it is about and prints nothing else.
- F1.2 Given a thing that belongs to a project, then the skill reads that project's state file and opens a note from its notes map only when the note's description matches. It reads no other project, nothing of another org, never `inbox/` and never `.confidential/`.
- F1.3 Given a thing with no project, then the skill reads no brain file beyond `AGENTS.md` and works from the conversation.
- F1.4 Given a candidate, then the skill applies the test "If I had only this, could I start?" and reduces until the answer is yes.
- F1.5 Given a fact from the notes that the nucleus or the plan rests on, when it is an `Inferred:` bullet, comes from a note with `status: draft` or `deprecated`, or from a note whose `stale_after` has passed, then the output marks it "to verify" and does not treat it as given.
- F1.6 Given a nucleus, then the skill asks the safety question once, "What don't I know that I should?", and may add at most three gaps it sees itself, each marked as its own reading.
- F1.7 Given a finished run, then the output is exactly the five lines `Nucleus`, `Kind`, `Holder`, `Parked`, `Situation`, with one nucleus. `Kind` is one of the four kinds. `Holder` is never empty: it is a name, a role, `me` or `?`.
- F1.8 Given the `Situation` line, then it describes the kind of situation in general words, with no name of a person, org or project, for example "short slot with a senior person".
- F1.9 Given a run of the frame alone, then no file is created or changed.
- F1.10 Given no candidate passes the test, then the skill says so and offers the Shell tool by name instead of inventing a nucleus.

Testability: text assertions on the skill for the five-line output, the four kinds, the test sentence and the safety question; behaviour by a manual run.

### F2. The toolkit (P2)

Story: As the owner with one short slot or too many candidates, I get the right tool offered and a prep note of at most five questions.

Scenarios:
- F2.1 Given the frame gave a clear nucleus, then the skill does not start layer 2. It may offer one tool by name in one line.
- F2.2 Given the owner accepts a tool or asks for the toolkit, then the skill runs only the tools the case needs. The tools are Shell, Walk-through, Filters, Routing, Dependency order, Question forms, Pre-mortem, Catch-all, Touch points and Meeting fit.
- F2.3 Given more than five candidate questions, then the prep note holds five. A question stays only if someone else must answer it and a wrong guess costs more than waiting for the next chance to ask. The longer the window, the lower that bar.
- F2.4 Given candidates of mixed kinds, then facts go to their holder outside the meeting, the owner's own decisions go to parked, and only decisions by others take meeting time.
- F2.5 Given questions that build on each other, then no question comes before the one it depends on, and no request is raised that depends on an unanswered question.
- F2.6 Given a prep note, then every question has a form (`open`, `choice` or `confirm`) and a time, the last question is the catch-all "What do you know about this that I don't?", and the note names a fallback for a slot that is cut short.
- F2.7 Given a prep note, then it is printed in the chat and no file is written.

Testability: text assertions on the ten tool names and the cap of five; behaviour by a manual run.

### F3. The prep note as a capture, and the loop (P3)

Story: As the owner, I keep the prep note in the brain when I ask for it, and after the touch point I close the nucleus and get the next one.

Scenarios:
- F3.1 Given a prep note and the owner says "save it" or similar, then the skill writes exactly one capture `inbox/YYYY-MM-DD-nucleus-<slug>.md` with `type: capture`, `source: chat`, a tag `nucleus`, the project's `org` (or `unknown`), and the prep note as body. It never overwrites, adds no index line and edits no other file.
- F3.2 Given the capture, then each question is one line with a status `open`, and text the skill added as its own reading carries `Inferred:`.
- F3.3 Given the owner comes back with answers ("close the nucleus", "nucleus: here are the answers"), then the skill records each answer against its question as `answered`, `partly` or `open`, with `Said(Name):` for an answer given by someone else.
- F3.4 Given the answers, then the skill names every assumption an answer changed and what has to change, lists the parked items that are now unblocked, and runs the frame again on the new state.
- F3.5 Given the prep note is still a capture in `inbox/` that this skill wrote (tag `nucleus`), then on the owner's request the skill updates that one file with the answers and statuses. Given it has been triaged elsewhere or was never saved, then the loop result is printed in the chat, and on request written as one new capture. No project file, log or knowledge note is ever edited.
- F3.6 Given a frame-only nucleus, then the loop needs no file: the owner says what happened and the skill runs the frame again.
- F3.7 Given the work the nucleus blocked has started, then the skill says the nucleus is closed and points to `sync` for the project log.

Testability: text assertions on the capture path, the statuses and the write limits; behaviour by a manual run.

### F4. Packaging: seven skills (P4)

Story: As a plugin or template user, I get `nucleus` installed like the other skills.

Scenarios:
- F4.1 Given the change, then `npm test` passes with `SKILLS` equal to `['agenda', 'aware', 'drop', 'nucleus', 'outbox', 'sync', 'triage']`, and `plugin/skills/nucleus/SKILL.md` is built.
- F4.2 Given the change, then `template/.github/prompts/nucleus.prompt.md` has the same body as the skill.
- F4.3 Given the change, then each of these names `nucleus` and says seven skills where it gives a count: `README.md`, the `package.json` description, the skills line of each Layout table in `template/AGENTS.md` and `docs/spec.md`, `docs/plugin.md`, `docs/copilot.md`, the plugin description in `scripts/build-plugin.mjs` and the description in `.claude-plugin/marketplace.json`.
- F4.4 Given the skill, its prompt and this spec, then every example in them is invented: org `acme`, project `launch`, person `Sam Lee`. None is taken from a real brain.

Testability: unit, by `node --test` on `test/plugin.test.mjs`.

## Success criteria

- SC1 `npm test` passes with seven skills.
- SC2 A frame-only run changes 0 files in the brain.
- SC3 A full run with saving creates exactly 1 file, under `inbox/`, and changes no other.
- SC4 The frame output has exactly 5 lines and exactly 1 nucleus.
- SC5 A prep note has at most 5 questions, plus the catch-all.
- SC6 The skill, its prompt and this spec pass the repository's leak gate.

## Interfaces and data

Trigger phrases, all spoken by the owner: "nucleus", "what is the nucleus here", "what do I need to get moving", "what do I need from this meeting", "prep the questions for", and for the loop "close the nucleus".

Inputs: the thing at hand (a problem, a task, a meeting or a decision); for a meeting who, when and how many minutes; the window; what is already known, from the conversation and from the project's files under F1.2.

Frame output:

```
Nucleus: <the unblocker>
Kind: fact | their decision | my decision | first action
Holder: <who has it, or "me">
Parked: <what waits>
Situation: <the kind of situation, in general words>
```

Routes by kind: a fact is asked of its holder today; their decision goes into the next touch point; my decision is taken now; a first action is done.

Prep note: the shell if one was built; at most five questions in order, each with form, time and status; the facts to chase elsewhere with holder; the parked list; the fallback.

## Decisions

- One skill holds the frame, the toolkit and the loop. A second skill for the loop would split one habit in two.
- The frame is always run first. The toolkit is offered, never started unasked, so the common case stays one minute.
- The filter bar is relative to the window, not a fixed amount of work.
- Called by the owner only in version 1. Suggestion by a harness comes later and stays selective.
- The idea note asked for a list of the situations in which the skill ran, as raw material for harness signals. A read-only skill has no place to keep one, and a hidden log would be a second write path. Instead the frame prints a `Situation` line, which also goes into a saved prep note. Signals are derived later from real use, not designed up front.
- The `Situation` line is written in general words with no names, so that a list of such lines says nothing about people or orgs.
- The loop keeps its state in the prep note. The frame alone has no state.
- The prep note is a capture, because the write funnel allows a session nothing else. `triage` places it, normally as a knowledge note of its project with `stale_after`. The skill updates only its own capture while it is still in `inbox/`; after triage it writes a new capture instead of editing a note.
- Facts read from notes are candidates. The provenance prefixes and the `status` and `stale_after` keys say which ones to verify first.
- The skill reads person notes like any other note of the project's org. Its output goes only to the owner's chat and to `inbox/`, and prep notes are a class the `outbox` barrier always holds back.

## Assumptions

- The owner states the window. If not, the skill asks once and otherwise assumes "until the next touch point".
- A prep note is short-lived: it expires when the nucleus is closed.
- Behaviour is a model following prose. It is verified by manual runs, as for the other skills.

## Dependencies

None. The skill uses the capture format and the `inbox/` folder that exist today.

## Review

- Source: an idea note of the owner dated 2026-11-16, generic by design. This spec restates it in the repository's format.
- Inline review (2026-11-17), no reviewer agents run. Findings fixed against the idea note:
  1. The situation log had no home in a read-only skill. Now the `Situation` line (F1.7, F1.8, Decisions).
  2. The loop was to keep state in a prep note that the skill may not edit once triaged. Now F3.5.
  3. "Called by name only" contradicted the natural trigger phrases. Now "called by the owner only": the phrases are the owner's, and no agent starts the skill.
  4. The loop had no trigger phrase. Added "close the nucleus".
  5. "Verify facts from notes" named no test. Now F1.5, tied to provenance, `status` and `stale_after`.
  6. The read scope was open. Now F1.2 and F1.3, tied to the session protocol, the org boundary and `.confidential/`.
  7. The safety question had no bound. Now F1.6.
  8. Nothing said the skill never contacts the holder. Now Out of scope.
  9. The examples of the idea note were replaced by invented ones (F4.4).
- Approved (2026-11-17): "I approve the spec". The owner also kept the tool name Walk-through.
