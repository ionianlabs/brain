---
type: guide
description: Public format and CLI contract for Ionian Brain, the markdown memory shared by all agents
tags: [spec, format, cli, lint]
updated: 2026-11-05
---

# Ionian Brain spec

This document is the contract for the brain format and the `brain` CLI. Templates, the CLI and the tests all implement it. Where this spec and an implementation differ, the spec wins.

## 1. Relation to OKF

A brain is a conformant [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) v0.2 bundle.

- OKF requires only a non-empty `type` on every non-reserved `.md` file.
- `index.md` and `log.md` are reserved names in OKF.
- OKF defines storage. Brain adds a working lifecycle: a session protocol, a state/history split, org and confidential boundaries, an inbox, example skills, and lint that enforces them.
- Brain never redefines OKF keys. `status`, if present, keeps OKF's meaning: `draft`, `stable` or `deprecated`.
- The OKF trust keys `generated`, `verified` and `stale_after` are allowed and preserved.
- Brain does not use the reserved name `log.md` anywhere. History lives in `logs/<slug>.md`.

## 2. Layout of a brain folder

| Path | Holds |
|---|---|
| `AGENTS.md` | The rulebook every agent reads first. Claude Code and GitHub Copilot read it natively |
| `index.md` | OKF reserved index. Brain generates a block in it |
| `projects/<slug>.md` | Project state file. A short file per project that says where things stand today |
| `logs/<slug>.md` | Project history, append-only |
| `inbox/YYYY-MM-DD-<slug>.md` | Short notes, triaged later |
| `knowledge/<slug>.md` | Durable reference material. A note may belong to one project (`project: <slug>`) |
| `templates/` | Note templates |
| `outbox/<audience>/` | The only path out of the brain. Everything in it is safe to share with that audience. Not a note folder, not indexed |
| `skills/<name>/SKILL.md`, `.github/prompts/<name>.prompt.md` | Example skills (`agenda`, `drop`, `triage`, `sync`, `aware`, `outbox`) |
| `.confidential/` | Off limits to agents unless you point them at a specific note. A dot-folder, so most search tools skip it. Gitignored by default. Lint never reads it |

Slugs use lowercase `a-z`, `0-9` and hyphens only.

## 3. Frontmatter

Frontmatter is YAML between two `---` lines at the very top of the file.

### 3.1 Supported subset

The CLI parser supports this subset and nothing more:

- `key: value` scalars: bare, single-quoted or double-quoted.
- Inline lists: `[a, b]`.
- Block lists: lines starting with `- a`.
- One level of nested mapping, inline `{by: x, at: y}` or indented. This covers OKF `generated: {by, at}`.
- Comments starting with `#`.

Unknown keys are preserved and ignored.

### 3.2 Required keys

Every `.md` file in the brain, except the reserved `index.md`, carries a non-empty `type`. This includes `AGENTS.md`, `README.md`, `SKILL.md` and prompt files. Use `type: guide`, `type: skill` or `type: prompt` for these.

Notes are files under `projects/`, `logs/`, `inbox/` and `knowledge/`. Notes also require:

| Key | Value |
|---|---|
| `description` | One line, no trailing full stop. It is copied into the index |
| `tags` | List |
| `org` | Slug. `personal` is special |
| `updated` | `YYYY-MM-DD` |

### 3.3 Note types

| `type` | Folder |
|---|---|
| `project` | `projects/` |
| `log` | `logs/` |
| `capture` | `inbox/` |
| `note` | `knowledge/` |

Extra required keys:

- `project` adds `phase` (`active`, `paused` or `done`) and `focus` (one line: what matters now).
- `log` adds `project` (the slug of its project).

Optional key:

- `note` may carry `project` (the slug of one project). The note then belongs to that project: it is listed in that project's notes map (4.1) and not under `## Knowledge` in the index. Use it for background a project needs on demand, such as a meeting prep, a plan, a stakeholder map or a method. A note without `project` is shared reference material.

## 4. Project state file body

A project file describes the present state. It never holds history. History goes to the log.

- The first line after frontmatter is `# Title`.
- Next comes the log link: `History: [log](/logs/<slug>.md)`.
- Then these sections, in this order:
  1. `## Now`: current state, a few bullets. It holds the current state and any decision still in force that a reader needs to know. Finished work and the full decision record go to the log. Bullets may carry a provenance prefix (5).
  2. `## Open`: checkbox items.
  3. `## People`: who, role, when to talk to them.
  4. `## Links`: where the work lives (paths or URLs).
- Budget: the body outside `## Open` and outside the notes map targets 300 words, and past 400 it is over budget (lint warns). `## Open` holds at most 15 items. Background goes to a knowledge note with `project: <slug>`, history to the log.
- Horizon: `## Open` holds what is actionable in about the next two weeks, one line per item. Detail lives in the note the item links to. Later work sits in a plan note (a knowledge note with `project: <slug>`) and moves into `## Open` as its date comes close.

Open item syntax:

```
- [ ] Text (owner: Name, due: YYYY-MM-DD)
```

- `owner` and `due` are both optional.
- `blocked: reason` may be added inside the parentheses, for example `(owner: Sam, due: 2026-11-10, blocked: waiting for review)`.
- `prio: p0|p1|p2` is optional and ranks the item: `p0` needs the owner today or blocks others, `p1` is this week, `p2` is scheduled, later. An item without `prio` is unranked and sorts after `p2`. Example: `- [ ] Call Sam (prio: p0, owner: Sam, due: 2026-12-01)`.
- The field group is the last parenthesised group at the end of the line, and only when its first segment looks like `<lowercase word>:`. Any other parentheses are part of the text: `- [ ] Draft the page (see note)` has no fields.
- Fields split on `, ` only directly before a `<lowercase word>:` segment. A segment without one extends the previous value, so `(owner: Sam, with Ada)` has the owner "Sam, with Ada". Keys and `prio` values are lowercase and case-sensitive. A repeated key takes its last value.
- The keys are `prio`, `owner`, `due` and `blocked`. `due` must be a valid `YYYY-MM-DD` date and `prio` one of the three values. `owner` and `blocked` are free text.
- Done items are moved to the log. They are not ticked in place.

### 4.1 Notes map

`brain index` writes a notes map into each project file that has notes (3.3). It sits between two markers, each on its own line:

```
<!-- brain:notes start -->
Notes (open one only when the task needs it):

- [Title](/knowledge/slug.md): description
<!-- brain:notes end -->
```

- One line per note: title (first `# ` heading, else the slug) and `description`. Sorted by slug ascending.
- Only notes in the same org as the project, or with one side `personal`, are listed.
- If the markers are missing and the project has notes, the block is inserted before the first `## ` heading, normally `## Now`. If the markers exist and there are no notes, only the two markers remain. A project with no notes and no markers is not touched.
- Never edit the block by hand. The rest of the file is never changed.
- The description is what an agent reads to decide whether to open a note. Write it as the question the note answers.

## 5. Log body

- The first line after frontmatter is `# <Title> log`.
- Then `## YYYY-MM-DD` headings, newest first.
- Under each date, bullets: decisions (prefix `Decision:`), done items (prefix `Done:`), and earlier state.
- A bullet in a log or in `## Now` may start with a provenance prefix, which says what kind of fact it is and who it came from:

| Prefix | Means | Attribution |
|---|---|---|
| `Done:` | completed work | optional `Done(Name):` |
| `Decision:` | a decision in force | optional `Decision(Name):`; the bare form means the owner decided |
| `Said(Name):` | a statement by someone else | name required |
| `Inferred:` | a conclusion proposed by an agent, not yet confirmed by the owner | optional `Inferred(agent-name):` |

- An unattributed bullet belongs to the owner. What is not the owner's carries a named prefix or `Inferred:`. A bullet an agent records at the owner's instruction is the owner's and uses the bare form. `Decision(Sam):` records that Sam decided, `Said(Sam):` a statement that decided nothing.
- A prefix is one of the four words, an optional parenthesised non-blank attribution and a colon, with no space before the parenthesis. A line without one is prose and stays legal, so old entries never need editing.
- Agents add entries at the top, under today's date. If today's heading exists, add under it.
- Existing entries are never edited or deleted.

## 6. Inbox

- Anyone may add a new capture file named `inbox/YYYY-MM-DD-<slug>.md`.
- Frontmatter has `type: capture`. `org` may be `unknown` until triage. `org: unknown` is allowed only for captures.
- A capture may carry an optional `source` key that says where it came from, for example `chat`, `flow` or `agent`. Lint does not check it.
- Outside triage and sync, a session writes only captures (the write funnel). A thought from any chat becomes a capture with the `drop` skill.
- When the owner asks for triage, the `triage` skill goes through each capture:
  1. Place its content with the owner's verdict: an open item with a `prio`, a log bullet, a knowledge note, or a new project. `Said`/`Inferred` bullets of the capture are written to the destination project's log too, so provenance is kept.
  2. Add `Triaged capture: <filename>` to that project's log.
  3. Delete the capture file, or move it to the archive folder the brain's `AGENTS.md` names, when it names one.

## 7. Links

- Links are standard markdown links.
- Root-relative links (`/projects/x.md`, resolved from the brain root) are preferred. Relative paths are allowed.
- Anchors (`#...`) are stripped before resolving.
- External links (`http`, `https`, `mailto`) are not checked.

## 8. Org boundary

- Every note has an `org`.
- Orgs other than `personal` are isolated from each other. A note in org A never links to a note in org B. Agents never copy content between them.
- Links between `personal` and any org are allowed.
- The generated `index.md` is exempt.

## 9. Confidential

- Agents treat `.confidential/` as off limits unless you point them at a specific note.
- It is a dot-folder, so most search tools skip it. It is gitignored by default.
- Non-confidential notes do not link into it.
- Lint never reads its contents.

## 10. index.md

- Frontmatter is optional. If present it may only contain `okf_version: "0.2"`.
- Free text above or below the generated block is kept.
- The generated block sits between these two markers, each on its own line:

```
<!-- brain:index start -->
<!-- brain:index end -->
```

- Inside the block, in this order:
  - `## Active`, `## Paused`, `## Done`: projects by `phase`. Empty sections are omitted.
  - `## Knowledge`: notes from `knowledge/` that are not listed in a project's notes map (4.1).
- Each line has this form:

```
- [Title](/projects/slug.md): description (org, updated YYYY-MM-DD)
```

- A project with notes ends its line with the count: `(org, updated YYYY-MM-DD, 3 notes)`.

- Title is the note's first `# ` heading, else the slug.
- Lines are sorted by `updated` descending, then by slug ascending.
- Output is deterministic and has no timestamps. Running `brain index` twice changes nothing.
- Inbox captures and logs are not listed.

## 11. Lint

Scope: all `.md` files under the brain root, excluding `.git/`, `node_modules/`, `.confidential/`, dependency and tool folders (`.venv/`, `venv/`, `__pycache__/`, `.tox/`, `.mypy_cache/`, `.pytest_cache/`, `.cache/`) and any folder that holds a `pyvenv.cfg`.

Brain-specific checks (everything except `okf/type-missing`) apply only to notes in `projects/`, `logs/`, `inbox/` and `knowledge/`.

| Rule | Severity | Fires when |
|---|---|---|
| `okf/type-missing` | error | a non-reserved `.md` has no parseable frontmatter or an empty `type` |
| `frontmatter/missing-key` | error | a required key for that note type is missing or empty |
| `frontmatter/bad-value` | error | `updated` is not a valid `YYYY-MM-DD`; `phase` is not `active`, `paused` or `done`; `type` does not match the folder; `stale_after` is not ISO 8601 with a UTC offset; `status` is not `draft`, `stable` or `deprecated` |
| `links/broken` | warning | a local link target does not exist |
| `tags/near-duplicate` | warning | two distinct tags normalize to the same string (lowercase; `_` and spaces to `-`; trailing `s` dropped) or differ by one edit when both are 5 or more characters |
| `state/over-budget` | warning | a project file body has more than 400 words outside `## Open` and the notes map, or more than 15 open items |
| `state/stale` | warning | `phase: active` and `updated` is older than 14 days (`--stale-days N`), or `stale_after` is in the past |
| `org/cross-link` | error | a note links to a note in a different org and neither org is `personal`, or the `project` key of a note or log names a project in a different org and neither org is `personal` |
| `project/unknown` | warning | the `project` key of a knowledge note or log names no `projects/<slug>.md` |
| `confidential/linked` | warning | a note links into `.confidential/` |
| `provenance/malformed` | warning | a top-level log bullet starts with `Said:` and no parenthesised name, or any of the four prefixes with empty parentheses (one finding per line) |
| `open-item/malformed` | warning | an open item in any project file, whatever its `phase`, has an unknown key, a `prio` other than `p0`, `p1` or `p2`, or a `due` that is not a valid `YYYY-MM-DD` date (one finding per bad field) |
| `index/out-of-date` | warning | `index.md` is missing, has no markers, or its block differs from what `brain index` would write; or a project file's notes map differs (reported on the project file) |

### 11.1 Output

- Text: one line per finding, then a summary line.

```
path:line  severity  rule  message
```

- `path` is relative to the brain root. `line` is 1 if the finding is not line-specific. Fields are separated by two spaces.
- `message` says what is wrong and, where a fix is obvious, how to fix it. Paths inside messages use the root-relative form with a leading `/`, the same as links.
- Fix hints for these rules:
  - `org/cross-link`: "Remove the link, or put the shared fact in a personal note and link that."
  - `links/broken`: "Create it from templates/log.md." when the target is `/logs/<slug>.md` and `projects/<slug>.md` exists. Otherwise "Fix the path or remove the link."
  - `index/out-of-date`: "Run `brain index` to update it."
  - The other rules end their message with a short hint, for example "Add it to the frontmatter."
- `--json` prints one JSON object:

```
{"findings":[{"path","line","severity","rule","message"}],"errors":N,"warnings":N}
```

### 11.2 Exit codes

| Code | Meaning |
|---|---|
| 0 | No errors (warnings allowed) |
| 1 | One or more errors |
| 2 | Usage error |

Lint never writes files.

## 12. CLI

Bin `brain`, Node 20 or newer, zero runtime dependencies. It ships in the repo: run it from a clone as `node bin/brain.mjs`. It is an optional terminal tool: the plugin and the skills never depend on it.

### `brain init [dir]`

- Default `dir` is `$BRAIN_DIR` if set, else `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, else `~/Ionian/brain`. There is no fallback to `~/brain`.
- Copies the template into `dir`.
- Never overwrites an existing file. It lists the skipped files.
- Replaces `{{BRAIN_DIR}}` with the absolute brain path, and `{{BRAIN_CLI}}` with the command that runs this copy of the CLI, in files under `skills/` and `.github/prompts/`.
- `--example` also copies the fictional sample notes.
- `--link-skills` symlinks each `<dir>/skills/<name>` into `~/.claude/skills/<name>`. It skips existing names and reports them.
- Runs `index` at the end.
- Prints three next steps:
  1. Open the folder in your editor.
  2. Start your agent there and ask for the agenda.
  3. At session end, say sync.

### `brain index [dir]`

- Default `dir` is `.`.
- Writes the generated block. Creates `index.md` if missing.
- Writes the notes map in each project file (4.1).
- `--check` writes nothing and exits 1 if the index or any notes map is out of date.

### `brain lint [dir]`

- Default `dir` is `.`.
- Flags: `--json`, `--stale-days N`, `--today YYYY-MM-DD` (treat the date as today, for tests and reproducible runs).

### `brain open [dir]`

- Default `dir` is `.`. Read-only.
- Lists the open items (4) of projects whose `phase` is `active` or `paused`. Other or missing phases are skipped.
- Order: `prio` ascending (unranked and invalid last), then `due` ascending (none and invalid last), then project slug, then file order.
- Text: one line per item, `prio  due  project  text`, separated by two spaces, with `-` for an absent or invalid value. `text` is the item without its field group. If `owner` or `blocked` are present they follow in one parenthetical, `(owner: Sam, blocked: reason)`. A last line sums up the items after filters: `N items: A p0, B p1, C p2, D unranked; E without due date`.
- `--json` prints `{"items":[{"project","org","text","prio","owner","due","blocked","line"}],"summary":{"total","p0","p1","p2","unranked","withoutDue"}}`. Absent or invalid fields are `null`. `line` is the 1-based line in the project file.
- Flags: `--org SLUG`, `--project SLUG`, `--due-within N` (items due from today to N days ahead, plus overdue ones; items without a due date are left out; N is a whole number), `--today YYYY-MM-DD`. Filters combine with AND. A filter that matches nothing gives zero items.
- Exit 0 whenever it ran, even with zero items. Exit 2 on a usage error.

### Other

- `brain --help` prints the global usage and `brain --version` prints the version. Both go to stdout and exit 0.
- `brain init --help`, `brain index --help`, `brain lint --help` and `brain open --help` print usage for that command to stdout: its arguments, flags and one example. They exit 0.
- A usage error (unknown command, unknown option, bad value, missing directory) prints the error and one line, ``Run `brain <command> --help` for usage.``, to stderr and exits 2. It does not print the usage block. Without a known command the line points to `brain --help`.

## 13. Session protocol (for AGENTS.md)

- Start: read `AGENTS.md`, then `index.md`, then the state file of the project at hand. List `inbox/` and suggest triage. Open a note from the project's notes map only when its description matches the task.
- During: stay inside the project's org. Outside triage and sync, write only captures. Add anything new as a capture to `inbox/`; triage places it.
- End (sync):
  1. Update the state file so it describes the present state, within budget and horizon (4).
  2. Move done items and decisions to the top of the log, under today's date.
  3. Set `updated`.
  4. Keep the index lines in step by hand: a line for each new note, and an updated line when a `description` changed.

## 14. Example skills

Skills are prompts any agent can run. They show usage. They are not the product.

### `agenda`

Replaces `brief`; the words "brief", "morning brief" and "what's on" still trigger it. Read-only, with a hard attention budget. It reads `AGENTS.md` and its `## Agenda rules`, then from each project whose `phase` is not `done` only the frontmatter and the `## Open` section, and lists `inbox/`. It needs no CLI and runs no lint. The keys of an item come from the last parenthesis group on its line. The report is markdown tables: a summary line, then "Needs you" (overdue by oldest due, then due today, then undated or later p0; at most 5 items), "Coming up" (due in 3 days, p0 and p1 only; at most 5 items) and "Blocked" (at most 5 items), a Next line and one line that folds the rest into counts. An item appears once only. When more than 5 items are p0 a line says the priorities need re-ranking. A standing `## Agenda rules` block in `AGENTS.md` is obeyed and may tighten the report but never raise the caps. "agenda everything" prints one table per project, under one heading per org, then the inbox. Scope: a project slug, an org, or `week`. The full design is in `docs/designs/skills-only.md`.

### `drop`

Capture a thought from any chat. Writes exactly one file, `inbox/YYYY-MM-DD-<slug>.md`, with `type: capture`, a `source` of `chat` or `agent`, and body bullets that carry provenance prefixes (`Said(Name):`, `Inferred:`, none for the owner's own words). A name clash gets `-2`, `-3`. No secrets go into a capture. It runs no index and no lint.

### `triage`

Empty the inbox one capture at a time. Each verdict places a capture as an open item (always with `prio`), a log bullet, a knowledge note, or a new project, or bins it. `Said`/`Inferred` bullets go to the destination project's log, with a `Triaged capture: <filename>` bullet, and the capture is then discarded. `source: flow` day files go to `aware`. It adds the index lines of new notes by hand, and needs no CLI.

### `sync`

Replaces `handover`; "handover", "end session", "wrap up" and "save to brain" still trigger it. Writes a work session back for one project: it updates the state file, prepends log entries with provenance prefixes, keeps the project within budget and horizon (detail into project notes, plan items promoted as their date comes close, stale notes resolved), sets `updated`, keeps the index lines of changed notes in step by hand, and reports what changed. Writes are inline: there are no agents. New open items always carry `prio` and are confirmed by the owner as one batch in the closing summary.

### `aware`

The triage specialization for `source: flow` day files: it walks Ionian Flow's proposals, files what the owner accepts and archives the file. See [works with Flow](works-with-flow.md).

### Plugin

`plugin/` packages the skills for Claude Code, the Claude desktop app with folder access, GitHub Copilot CLI and Copilot in VS Code, in the Claude Code plugin format. `.claude-plugin/marketplace.json` at the repo root lists it. `node scripts/build-plugin.mjs` generates `plugin/skills/` and `plugin/.claude-plugin/plugin.json` from `template/skills/` and `package.json`. `--check` exits 1 if they are out of date. The plugin holds nothing else: no CLI copy, no agents, no hook.

Skills find the brain in this order: the folder named in the session context, a folder the user shared or named in the conversation that has an `AGENTS.md` at its root, `BRAIN_DIR`, `$IONIAN_HOME/brain`, `~/Ionian/brain`. With none, they say so, point to the repository and stop.

Without the CLI, skills keep `index.md` by hand: a new note gets one line in the generated block, a note with `project: <slug>` goes in that project's notes map between the `brain:notes` markers, a changed `description` changes that line, and the whole block is never rewritten. `brain index` in a terminal repairs any drift. The org boundary relies on the skills' rules, since lint is not run.

## Open points

Gaps filled conservatively. Builders follow these until the spec changes.

1. `--help` and `--version` print to stdout and exit 0.
2. `index` lists only projects and knowledge notes. Logs and captures are left out.
3. In the index, ties on `updated` sort by slug ascending. The slug is the filename without `.md`.
4. Index sections appear in the order Active, Paused, Done, Knowledge. A `Knowledge` section with no notes is omitted.
5. If `index.md` has no markers, `brain index` appends the block at the end and keeps existing content. If it has no file, it creates one with `type`-free, `okf_version: "0.2"` frontmatter, a `# Index` heading and the block.
6. `state/over-budget` counts whitespace-separated words in the body, after frontmatter.
7. `state/stale` compares dates by whole days against the local date; `updated` exactly 14 days old is not stale.
8. `links/broken` and `org/cross-link` check links to `.md` files and other local paths. A link that resolves outside the brain root counts as broken.
9. `type` mismatch with folder (`frontmatter/bad-value`) applies to the four note folders only.
10. `brain lint` and `brain index` on a missing directory exit 2.
11. `org/cross-link` is reported on the linking note, at the line of the link. Links to files with no `org` are ignored.
12. `tags/near-duplicate` compares tags within one file. It does not compare across files.
13. `confidential/linked` fires on any link whose resolved path is inside `.confidential/`. Such links are not also reported as `links/broken`.
14. Files under `templates/` are checked for `type` only, not as notes. Template placeholders must still carry a non-empty `type`.
15. `brain init` creates `.gitignore` with `.confidential/` as part of the template.
16. The Open item parser reads only lines under `## Open` that start with `- [ ]`.
