---
type: guide
description: The rulebook every agent reads first. Layout, session protocol, writing rules and boundaries for this brain
tags: [rules, protocol, agents]
updated: 2026-11-02
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
| `templates/` | Starting points for new notes |
| `skills/`, `.github/prompts/` | Example skills: `agenda`, `drop`, `triage`, `sync` and `instinct` |
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
4. Rebuild the index: `brain index`.
5. Run lint: `brain lint`. Fix every error.
6. Tell the user what changed.

## Frontmatter

Frontmatter is YAML between two `---` lines at the very top of the file. Every `.md` file has a non-empty `type`. Only `index.md` is exempt.

Files outside the note folders use `type: guide`, `type: skill` or `type: prompt`.

Notes live in `projects/`, `logs/`, `inbox/` and `knowledge/`. Each note carries:

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
| `capture` | `inbox/` | Optional `source`: where it came from, for example `chat` or `agent` for a `drop`, or `flow` for Ionian Flow's Instinct. `org: unknown` is allowed until triage |
| `note` | `knowledge/` | none. Optional `project`: the slug of the one project it belongs to |

Optional keys keep their meaning: `status` is `draft`, `stable` or `deprecated`. `generated`, `verified` and `stale_after` are allowed and preserved. Use only simple YAML: scalars, inline or block lists, one level of nesting.

Copy a starting point from `templates/`.

## Writing rules

- Project files stay short: what to act on now. Outside `## Open`, aim for 300 words. Lint warns above 400 words, or above 15 open items.
- Background a project needs on demand (meeting prep, plan, stakeholder map, method) goes to a knowledge note with `project: <slug>`. `brain index` lists it in the project file's notes map. Write its `description` as the question it answers, because that line is what decides whether an agent opens it.
- A note that matters only until a date (a meeting prep) gets `stale_after`. When lint flags it as stale, move what still matters to the log or the project, and archive or delete the note.
- Project files describe the present. They never hold history. `## Now` holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log.
- A project file has this shape: `# Title`, then a `History:` line that links to the log (`/logs/<slug>.md`), then `## Now`, `## Open`, `## People`, `## Links` in that order.
- History goes to the log. Add entries at the top, under today's date. If today's heading exists, add under it.
- Never edit or delete existing log entries.
- A log starts with `# <Title> log`, then `## YYYY-MM-DD` headings, newest first. Prefix bullets with `Decision:` or `Done:`. Say whose fact it is: a bare prefix is the owner's, `Said(Sam): the freeze moves to March` is someone else's statement, `Inferred:` is an agent's own conclusion.
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

`brain index` writes a block between `<!-- brain:notes start -->` and `<!-- brain:notes end -->` into each project file that has notes, before `## Now`. Never edit it by hand.

## Starting a new project

Only triage's new-project verdict, or the owner deliberately following these steps, creates a project.

1. Pick a slug: lowercase `a-z`, `0-9` and hyphens.
2. Copy `templates/project.md` to `projects/<slug>.md` and `templates/log.md` to `logs/<slug>.md`.
3. Fill in the frontmatter and the title in both. Use the same `org` in both, and set `project: <slug>` in the log.
4. Run `brain index`, then lint.

## Org boundary

Every note has an `org`. Orgs other than `personal` are isolated from each other.

- A note in one org never links to a note in another org, and never names a project of another org in `project`.
- Never copy content between orgs.
- Links between `personal` and any org are allowed.

The reason: one brain may hold work for several employers or clients. Mixing them leaks information. Lint reports a cross-org link as an error.

## Confidential

`.confidential/` is off limits. Do not read, search, list or edit it unless the user points you at a specific note there. Never link to it from other notes. It is gitignored by default and lint never reads it.

## Inbox

Anyone may add a capture: `inbox/YYYY-MM-DD-<slug>.md` with `type: capture`. Say `drop this: …` in any chat to add one. When the owner asks for triage, for each capture:

1. Move its content into the right project or knowledge note. Set the right `org` there.
2. Add `Triaged capture: <filename>` to that project's log, under today's date. Keep `Said`/`Inferred` bullets of the capture in that log too.
3. Delete the capture file.

If you cannot tell where it belongs, ask the user. Do not guess an org.

An Instinct day file (`inbox/YYYY-MM-DD-instinct.md`, `source: flow`) is the exception: review it with the `instinct` skill, and archive it to `_archive/inbox/` instead of deleting it. Ionian Flow reads the archived files to measure its precision.

## Agenda rules

The `agenda` skill reads this block and obeys it. Rules may tighten the report. They never raise its caps of 5 items under "Needs you" and 20 lines in total.

- Projects with `phase: done` never surface.
- Anything already moved to a log never surfaces.
- Name who to talk to for each blocked item.

## Index

`index.md` holds a generated block between `<!-- brain:index start -->` and `<!-- brain:index end -->`. Never edit it by hand. Run `brain index`. Text outside the markers is yours to edit.

## Tools

`brain` is the Ionian Brain CLI. With the plugin, your session context names the exact command. Otherwise run `node bin/brain.mjs` in a clone of `https://github.com/ionianlabs/brain`. If it does not run, skip these steps and tell the user.

| Command | Does |
|---|---|
| `brain index` | Rebuilds the index block |
| `brain index --check` | Exits 1 if the index is out of date. Writes nothing |
| `brain lint` | Checks frontmatter, links, org boundary, size and staleness. Writes nothing |

Lint exits 1 on errors. Warnings are allowed, but read them.

## Never

- Never edit the generated index block by hand.
- Never edit or delete log entries.
- Never link across orgs, unless one side is `personal`.
- Never open `.confidential/` without being pointed at a note.
- Never put history in a project file.
- Never write secrets, passwords or tokens into any note.
- Never overwrite a note you have not read.
- Never let agent-side memory override the brain; propose a new connection as a capture marked Inferred:, never by editing notes.
