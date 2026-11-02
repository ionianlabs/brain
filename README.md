# Ionian Brain

One memory for all agents, in plain markdown.

## The problem

Every agent chat starts at zero. The context lives in your head, in old chats and in copy-paste. You explain the same project again, and the agent still gets it wrong.

## Quickstart

```sh
npx @ionianlabs/brain init --link-skills            # creates ~/brain
npx @ionianlabs/brain init --link-skills --example  # same, with sample projects
```

`--link-skills` is for Claude Code. It links the `brief` and `handover` skills into `~/.claude/skills/`, so they work from any repo. Leave it out for other agents.

1. Open your agent in the `~/brain` folder and say "brief".
2. Work. At the end of a session, say "handover".

How the agent picks up "brief" and "handover":

- Claude Code: skills, matched by description.
- Copilot: the `/brief` and `/handover` prompt files.
- Any other agent: "Read skills/brief/SKILL.md and follow it."

Node 20 or newer is the only requirement. If you want no tooling at all, click "Use this template" on [`ionianlabs/brain-template`](https://github.com/ionianlabs/brain-template) and clone it.

### Add your own project

Copy `templates/project.md` to `projects/<slug>.md` and `templates/log.md` to `logs/<slug>.md`, fill in the frontmatter, then run `brain index`. Or ask your agent to start a project. `AGENTS.md` has the steps.

`lint` warns when the index is stale, so run `index` after you add notes. The handover does both.

For a walk through one full day, read [A day with Brain](https://github.com/ionianlabs/brain/blob/main/docs/a-day-with-brain.md).

## What is in the folder

```
~/brain/
  AGENTS.md        the rulebook every agent reads first
  index.md         generated list of projects and knowledge
  projects/        one short state file per project
  logs/            one append-only history per project
  inbox/           quick captures, triaged at the next session
  knowledge/       durable reference notes
  templates/       note templates
  skills/          example skills: brief, handover
  .confidential/   notes agents leave alone (gitignored)
```

`CLAUDE.md` and `.github/copilot-instructions.md` are one-line pointers to `AGENTS.md`.

## How it works

Read at the start, write at the end.

At the start, the agent reads `AGENTS.md`, then `index.md`, then the state file of the project at hand. It also checks the inbox. At the end, it updates the state file, moves done items and decisions to the log, sets `updated`, rebuilds the index and runs lint.

I will be honest. Reading is easy. Writing is the habit that matters, and it is the part people skip. The `handover` skill exists to make it cheap: one word, and the agent does the bookkeeping.

## What a project file looks like

A state file describes the present. It never holds history. It has four sections, always in this order: Now, Open, People, Links.

```markdown
## Open

- [ ] Send a test order confirmation (owner: Theo, due: 2026-11-04)
- [ ] Migrate the event calendar (owner: Jonas, due: 2026-11-12, blocked: waiting for the old site export)
```

Owner and due date are optional. Done items move to the log, which is a list of dated entries, newest first, with `Decision:` and `Done:` bullets. That split is why the state file stays short enough to read in full every time. See the [sample brain](https://github.com/ionianlabs/brain/blob/main/examples/sample-brain/index.md) for a filled example.

## What the brief gives you

Say "brief" and the agent reports what needs you today. It reads, and it never edits.

The report is grouped by org, with `personal` last. Each org gets these sections:

- Overdue items.
- Items due in the next 7 days.
- Blocked items.
- Who to talk to: the owners of those items, plus People whose entry says when to talk to them.
- What changed in the last 7 days.
- Captures waiting in the inbox.
- Hygiene: the lint result.

Each org ends with one line, "No due date: N open items".

## What Brain adds on top of OKF

| Addition | What it does | Why |
|---|---|---|
| **Session protocol** | One `AGENTS.md`: read at start, write at end. | Works with any agent, no plugin. OKF has no write workflow. |
| **State and history split** | A short current file per project (about 600 words) plus an append-only log. | Reads stay cheap and nothing is lost. |
| **Boundaries** | An `org` key keeps clients apart. `.confidential/` holds notes agents leave alone. | Safe across several clients. OKF has no access control. |
| **Capture path** | `inbox/`, triaged at the next session. | Aimed at the real bottleneck, which is writing. |
| **Daily payoff** | `brief` and `handover` example skills. | You feel the value the same day. |
| **Hygiene** | `brain lint` checks staleness, broken links, tag near-duplicates, cross-org links and OKF conformance. | The folder stays trustworthy. |

A brain stays a valid OKF v0.2 bundle, so any OKF tool can read it.

## Works with

- **Claude Code.** A `CLAUDE.md` pointer and the `brief` and `handover` skills. With `init --link-skills` the skills are symlinked into `~/.claude/skills/`, so they are available in every project, not only inside the brain folder. Existing skills with the same name are left alone.
- **GitHub Copilot.** `.github/copilot-instructions.md` and two prompt files, `/brief` and `/handover`. See [docs/copilot.md](https://github.com/ionianlabs/brain/blob/main/docs/copilot.md) to use them from inside a work repo.
- **Any agent that can read a file.** Point it at `AGENTS.md`.

## CLI

Three commands. The CLI only keeps the folder in shape. It never talks to a model.

```sh
brain init [dir]     # copy the template into dir (default ~/brain), never overwrite
brain index [dir]    # write the generated block in index.md (default: .)
brain lint [dir]     # check the brain against the spec (default: .)
```

Options:

- `init`: `--example` also copies the fictional sample notes. `--link-skills` symlinks the skills into `~/.claude/skills`.
- `index`: `--check` writes nothing and exits 1 if the index is out of date.
- `lint`: `--json` prints findings as JSON. `--stale-days N` sets the days before an active project is stale (default 14). `--today DATE` treats DATE (YYYY-MM-DD) as today.
- Anywhere: `-h, --help` and `-v, --version`. `brain <command> --help` prints usage for that command.

Exit codes: 0 ok, 1 errors found, 2 usage error. `lint` never writes files.

The full contract is in [docs/spec.md](https://github.com/ionianlabs/brain/blob/main/docs/spec.md).

## Principles

- Plain markdown and YAML.
- Any agent. No lock-in.
- Local and private by default. Nothing leaves your machine unless you add a git remote.
- History is append-only.
- Standard markdown links, so it works in Obsidian, VS Code or a browser, and depends on none of them.

## Not in scope

- No app.
- No hosted sync.
- No database.
- No vector search.
- No accounts.

## Credit

The format borrows from Google's [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format). From it, Brain takes:

- a directory of markdown files
- YAML frontmatter with a required `type`
- generated indexes
- standard links

## Status

v0.1. I am building it, and I use it every day. Expect rough edges and changes to the format before 1.0.

## License

MIT. Part of [Ionian Labs](https://ionian.dev).
