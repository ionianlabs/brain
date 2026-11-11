---
type: guide
description: The rulebook every agent reads first. Layout, session protocol, writing rules and boundaries for this brain
tags: [rules, protocol, agents]
updated: 2026-11-11
---

# AGENTS.md

This folder is a brain: a shared memory in plain markdown. Every agent and every person reads and writes the same files. Chats are disposable. These files persist.

If any other file disagrees with this one, this file wins.

## Layout

| Path | Holds |
|---|---|
| `AGENTS.md` | This rulebook |
| `index.md` | Index of projects and knowledge. A block in it is generated |
| `projects/<slug>.md` | Project state: the present, nothing else |
| `logs/<slug>.md` | Project history, newest first |
| `inbox/YYYY-MM-DD-<slug>.md` | Quick captures, triaged later |
| `knowledge/<slug>.md` | Reference material. With `project: <slug>` it belongs to one project |
| `people/<slug>.md` | One note per person per org. The frontmatter and title line are shareable; the body below is private context that never leaves the brain |
| `outbox/<audience>/` | The only path out of the brain. Everything in it is safe to share with that audience. Not a note folder, not indexed |
| `templates/` | Starting points for new notes |
| `skills/`, `.github/prompts/` | Example skills: `agenda`, `drop`, `triage`, `sync`, `aware` and `outbox` |
| `.confidential/` | Off limits. See Confidential |

Slugs use lowercase `a-z`, `0-9` and hyphens only.

## Session protocol

### Start

1. Read this file.
2. Read `index.md`.
3. Read the state file of the project at hand.
4. List `inbox/` and suggest triage.
5. Open a note from the project's notes map only when its description matches the task. Do not read all of them.

### During

1. Stay inside the org of the project you work on.
2. Outside triage and sync, write only captures.
3. Add anything new as a capture to `inbox/`; triage places it.

### End (sync)

1. Update the project's state file so it describes the present. Keep it within budget and horizon (see Writing rules).
2. Move done items and decisions to the top of the log, under today's date.
3. Set `updated` to today in every file you changed.
4. Keep the index lines in step by hand (see Index): add a line for every note you created, and update the line of every note whose `description` changed.
5. Tell the user what changed.

## Frontmatter

Frontmatter is YAML between two `---` lines at the very top of the file. Every `.md` file has a non-empty `type`. Only `index.md` is exempt.

Files outside the note folders use `type: guide`, `type: skill` or `type: prompt`. Files under `outbox/` use `type: audience` or `type: outbox`.

Notes live in `projects/`, `logs/`, `inbox/`, `knowledge/` and `people/`. Each note carries:

| Key | Value |
|---|---|
| `type` | Must match the folder, see below |
| `description` | One line, no trailing full stop. It is copied into the index |
| `tags` | List, for example `[api, launch]` |
| `org` | Org slug, or `personal` |
| `updated` | `YYYY-MM-DD` |

| `type` | Folder | Extra keys |
|---|---|---|
| `project` | `projects/` | `phase`: `active`, `paused` or `done`. `focus`: one line on what matters now |
| `log` | `logs/` | `project`: the slug of its project |
| `capture` | `inbox/` | Optional `source`: where it came from, for example `chat` or `agent` for a `drop`, or `flow` for Ionian Flow's Aware. `org: unknown` is allowed until triage |
| `note` | `knowledge/` | none. Optional `project`: the slug of the one project it belongs to |
| `person` | `people/` | `role`: one line, required. Optional `aliases`: list of other names |

Optional keys keep their meaning: `status` is `draft`, `stable` or `deprecated`. `generated`, `verified` and `stale_after` are allowed and preserved. Use only simple YAML: scalars, inline or block lists, one level of nesting.

Files under `outbox/<audience>/`:

| `type` | File | Keys |
|---|---|---|
| `audience` | `audience.md` | Shared keys: `audience`, `space`, `rank`, `approver`, `roles`, `description`. `brain:` with `org`, `members`, `receives` and optional `context_sections`. Any other key belongs to another tool and is preserved untouched |
| `outbox` | packages and `manifest.md` | Packages: `audience`, `approved`, `source_refs` |

Copy a starting point from `templates/`.

## Writing rules

- Project files stay short: what to act on now. Outside `## Open`, aim for 300 words. These are soft budgets: past 400 words, or past 15 open items, move detail to a note.
- Background a project needs on demand (meeting prep, plan, stakeholder map, method) goes to a knowledge note with `project: <slug>`. It is listed in the project file's notes map. Write its `description` as the question it answers, because that line is what decides whether an agent opens it.
- A note that matters only until a date (a meeting prep) gets `stale_after`. When the date has passed, move what still matters to the log or the project, and archive or delete the note.
- Project files describe the present. They never hold history. `## Now` holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log.
- A project file has this shape: `# Title`, then a `History:` line that links to the log (`/logs/<slug>.md`), then `## Now`, `## Open`, `## People`, `## Links` in that order.
- History goes to the log. Add entries at the top, under today's date. If today's heading exists, add under it.
- Never edit or delete existing log entries.
- A log starts with `# <Title> log`, then `## YYYY-MM-DD` headings, newest first. Prefix bullets with `Decision:` or `Done:`. Say whose fact it is: a bare prefix is the owner's, `Said(Sam): the freeze moves to March` is someone else's statement, `Inferred:` is an agent's own conclusion.
- A project's `## People` entries link to the person note (`/people/<slug>.md`). Do not repeat the role there.
- One fact lives in one place. Link to it. Do not copy it.
- Use root-relative links, for example `/projects/example.md`. Anchors are fine.
- Do not create files named `log.md`. Logs live in `logs/<slug>.md`.

### Open items

Open items sit under `## Open` in the project file:

```
- [ ] Text (owner: Name, due: YYYY-MM-DD)
```

- `owner` and `due` are optional. `prio: p0|p1|p2` is optional too (`p0` today or blocking others, `p1` this week, `p2` later), for example `(prio: p0, owner: Sam, due: 2026-12-01)`.
- Add `blocked: reason` inside the parentheses when something is stuck, for example `(owner: Sam, due: 2026-11-10, blocked: waiting for review)`.
- Do not tick done items. Move them to the log as `Done:` entries.
- One line per item. Put the detail in a note and link it.
- Horizon: `## Open` holds about the next two weeks. Later work sits in a plan note (`knowledge/<slug>-plan.md`, `project: <slug>`). Move an item into `## Open` as its date comes close.

### Notes map

Each project file that has notes carries a block between `<!-- brain:notes start -->` and `<!-- brain:notes end -->`, before `## Now`: one line per note, `- [Title](/knowledge/slug.md): description`. When you create a note with `project: <slug>`, add its line there. Change a line when the note's `description` changes. Never rewrite the whole block.

## Starting a new project

Only triage's new-project verdict, or the owner deliberately following these steps, creates a project.

1. Pick a slug: lowercase `a-z`, `0-9` and hyphens.
2. Copy `templates/project.md` to `projects/<slug>.md` and `templates/log.md` to `logs/<slug>.md`.
3. Fill in the frontmatter and the title in both. Use the same `org` in both, and set `project: <slug>` in the log.
4. Add the project's line to the index, under its phase heading.

## Org boundary

Every note has an `org`. Orgs other than `personal` are isolated from each other.

- A note in one org never links to a note in another org, and never names a project of another org in `project`.
- Never copy content between orgs.
- Links between `personal` and any org are allowed.

The reason: one brain may hold work for several employers or clients. Mixing them leaks information. Check this by hand: no tool does it for you.

## Confidential

`.confidential/` is off limits. Do not read, search, list or edit it unless the user points you at a specific note there. Never link to it from other notes. It is gitignored by default.

## Inbox

Anyone may add a capture: `inbox/YYYY-MM-DD-<slug>.md` with `type: capture`. Say `drop this: …` in any chat to add one. When the owner asks for triage, for each capture:

1. Move its content into the right project or knowledge note. Set the right `org` there.
2. Add `Triaged capture: <filename>` to that project's log, under today's date. Keep `Said`/`Inferred` bullets of the capture in that log too.
3. Delete the capture file.

If you cannot tell where it belongs, ask the user. Do not guess an org.

An Aware day file (`inbox/YYYY-MM-DD-aware.md`, `source: flow`) is the exception: review it with the `aware` skill, and archive it to `_archive/inbox/` instead of deleting it. Ionian Flow reads the archived files to measure its precision.

## Agenda rules

The `agenda` skill reads this block and obeys it. Rules may tighten the report. They never raise its caps of 5 items in each table.

- Projects with `phase: done` never surface.
- Anything already moved to a log never surfaces.
- Name who to talk to for each blocked item.

## Outbox

Content leaves the brain only through `outbox/`. The `outbox` skill writes there, after the owner approves each item. An agent asked to share brain content anywhere else points to the `outbox` skill instead.

The barrier in brief: only allowlisted classes of content pass, nothing is copied (everything is rewritten), and the owner approves each item. The full rules live in the skill.

## Outbox rules

The `outbox` skill reads this block and obeys it. Rules may tighten the barrier. They never loosen it. Blocked terms live only here, never under `outbox/`.

- Blocked terms (matched case-insensitively as whole phrases): none yet.
- Extra held-back classes: none yet.

## Index

`index.md` holds a generated block between `<!-- brain:index start -->` and `<!-- brain:index end -->`. Agents keep its lines in step by hand, one line at a time, and never rewrite the whole block:

- A new note gets one line in the format the block already uses: `- [Title](/folder/slug.md): description (org, updated YYYY-MM-DD)`. A project goes under its phase heading, a knowledge note without `project` under `## Knowledge`, a person note under `## People`.
- A note with `project: <slug>` goes in that project's notes map instead, and the `N notes` count in the project's index line goes up by one.
- When you change a note's `description`, change its line.

Text outside the markers is yours to edit.

## Tools

The `brain` CLI is optional tooling, for a terminal. It is not needed to use this brain, and agents never depend on it. If it is available, `brain index` rebuilds the index block and the notes maps, and `brain lint` checks frontmatter, links, the org boundary, size and staleness. Both are a way to tidy up or repair drift after agents kept the lines by hand. Get it from `https://github.com/ionianlabs/brain`.

## Never

- Never rewrite the whole generated index block. Add or change single lines.
- Never edit or delete log entries.
- Never link across orgs, unless one side is `personal`. No tool checks this for you.
- Never open `.confidential/` without being pointed at a note.
- Never put history in a project file.
- Never share brain content outside `outbox/`.
- Never write secrets, passwords or tokens into any note.
- Never overwrite a note you have not read.
- Never let agent-side memory override the brain; propose a new connection as a capture marked Inferred:, never by editing notes.
