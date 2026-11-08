<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-dark.png">
  <img src="docs/images/banner.png" alt="Ionian Brain: One memory. Every agent." width="100%">
</picture>

# Ionian Brain

One memory for all agents, in plain markdown.

## The problem.

Every agent chat starts at zero. The context lives in your head, in old chats and in copy-paste. You explain the same project again, and the agent still gets it wrong.

## Quickstart.

Add the plugin to your agent. It brings the `agenda`, `drop`, `triage`, `sync` and `aware` skills, and the `reader` and `scribe` agents, to every repo, and tells each new session where your brain is.

| Agent | Install | Run |
|---|---|---|
| Claude Code | `/plugin marketplace add ionianlabs/brain`, then `/plugin install brain@ionianlabs` | `/brain:agenda` |
| Copilot CLI | `copilot plugin marketplace add ionianlabs/brain`, then `copilot plugin install brain@ionianlabs` | `/agenda` |
| Copilot in VS Code | Add `ionianlabs/brain` to `chat.plugins.marketplaces`, then install `brain` from **Chat: Plugins** | `/brain:agenda` |

Then say "agenda". With no brain yet, the agent offers to create one in `~/Ionian/brain`. The plugin carries the CLI, so there is nothing else to install. Ask for the sample projects if you want to look around first.

Without the plugin, or for any other agent, clone the repo and run the CLI from it:

```sh
git clone https://github.com/ionianlabs/brain
node brain/bin/brain.mjs init            # creates ~/Ionian/brain
node brain/bin/brain.mjs init --example  # same, with sample projects
```

Then open your agent in `~/Ionian/brain` and say "agenda", or "Read skills/agenda/SKILL.md and follow it."

At the end of a session, say "sync". To capture a thought from any chat, say "drop this: …", and "triage" places it later.

Details, updates and the routes without the plugin are in [The Brain plugin](https://github.com/ionianlabs/brain/blob/main/docs/plugin.md). The folder is `$IONIAN_HOME/brain` if you set `IONIAN_HOME`, else `~/Ionian/brain`. For a brain anywhere else, set `BRAIN_DIR`.

Node 20 or newer is the only requirement.

### Add your own project.

Copy `templates/project.md` to `projects/<slug>.md` and `templates/log.md` to `logs/<slug>.md`, fill in the frontmatter, then run `brain index`. Or ask your agent to start a project. `AGENTS.md` has the steps.

`lint` warns when the index is stale, so run `index` after you add notes. The sync does both.

For a walk through one full day, read [A day with Brain](https://github.com/ionianlabs/brain/blob/main/docs/a-day-with-brain.md).

Brain also works next to Ionian Harness. See [Works with Ionian Harness](https://github.com/ionianlabs/brain/blob/main/docs/works-with-harness.md). With Ionian Flow, its Aware feature proposes to-dos, decisions and facts from what you say, and the `aware` skill lets you review them. See [Works with Ionian Flow](https://github.com/ionianlabs/brain/blob/main/docs/works-with-flow.md).

## What is in the folder.

```
~/Ionian/brain/
  AGENTS.md        the rulebook every agent reads first
  index.md         generated list of projects and knowledge
  projects/        one short state file per project
  logs/            one append-only history per project
  inbox/           quick captures, triaged at the next session
  knowledge/       durable reference notes
  templates/       note templates
  skills/          example skills: agenda, drop, triage, sync, aware
  .confidential/   notes agents leave alone (gitignored)
```

`AGENTS.md` is the only agent instruction file. Claude Code and GitHub Copilot both read it natively, so no pointer files are needed.

## How it works.

Read at the start, write at the end.

At the start, the agent reads `AGENTS.md`, then `index.md`, then the state file of the project at hand. It also checks the inbox. At the end, it updates the state file, moves done items and decisions to the log, sets `updated`, rebuilds the index and runs lint.

I will be honest. Reading is easy. Writing is the habit that matters, and it is the part people skip. The `sync` skill exists to make it cheap: one word, and the agent does the bookkeeping.

## What a project file looks like.

A state file describes the present. It never holds history. It has four sections, always in this order: Now, Open, People, Links.

```markdown
## Open

- [ ] Send a test order confirmation (owner: Theo, due: 2026-11-04)
- [ ] Migrate the event calendar (owner: Jonas, due: 2026-11-12, blocked: waiting for the old site export)
```

Owner and due date are optional. Done items move to the log, which is a list of dated entries, newest first, with `Decision:` and `Done:` bullets. That split is why the state file stays short enough to read in full every time. See the [sample brain](https://github.com/ionianlabs/brain/blob/main/examples/sample-brain/index.md) for a filled example.

## What the agenda gives you.

Say "agenda" and the agent reports what needs you now: at most 5 items under "Needs you" and 20 lines in total, ranked across projects, with everything else folded into counts. Say "agenda everything" for the full report. It reads, and it never edits.

The default report has these parts:

- A header: `N need you, M held back`.
- Needs you: p0 items, plus overdue and due-today items. A line folds the rest: "and K more need you — say more".
- Coming up: p0 and p1 items due in the next 3 days.
- Blocked items, with who to talk to.
- Captures waiting in the inbox, as a count. Say "triage" to place them.
- One hygiene line, only when lint has something to say.
- One honesty line with the totals of what was held back.

"agenda everything" prints the exhaustive report, grouped by org with `personal` last: overdue, due in 7 days, blocked, who to talk to, what changed, inbox and hygiene, and "No due date: N open items".

## What Brain adds on top of OKF.

| Addition | What it does | Why |
|---|---|---|
| **Session protocol** | One `AGENTS.md`: read at start, write at end. | Works with any agent. The plugin is optional. OKF has no write workflow. |
| **State and history split** | A short current file per project (about 300 words plus open items), project notes read on demand, and an append-only log. | Reads stay cheap and nothing is lost. |
| **Boundaries** | An `org` key keeps clients apart. `.confidential/` holds notes agents leave alone. | Safe across several clients. OKF has no access control. |
| **Capture path** | `inbox/`, triaged at the next session. | Aimed at the real bottleneck, which is writing. |
| **Daily payoff** | `agenda`, `drop`, `triage` and `sync` example skills. | You feel the value the same day. |
| **Hygiene** | `brain lint` checks staleness, broken links, tag near-duplicates, cross-org links and OKF conformance. | The folder stays trustworthy. |

A brain stays a valid OKF v0.2 bundle, so any OKF tool can read it.

## Where it works.

- **Claude Code.** The plugin, or `AGENTS.md` (read natively) and the `agenda`, `drop`, `triage` and `sync` skills in the brain folder. Without the plugin, `init --link-skills` symlinks the skills into `~/.claude/skills/`, so they work in every project. Existing skills with the same name are left alone.
- **GitHub Copilot.** The plugin, in Copilot CLI and in VS Code. Without it, `AGENTS.md` (read natively) and prompt files such as `/agenda` and `/sync`. See [docs/copilot.md](https://github.com/ionianlabs/brain/blob/main/docs/copilot.md) to use them from inside a work repo.
- **Any agent that can read a file.** Point it at `AGENTS.md`.

## CLI.

Three commands. The CLI only keeps the folder in shape. It never talks to a model.

Run it from a clone as `node bin/brain.mjs <command>`. Below, `brain` stands for that. With the plugin, the agent gets the exact command at the start of each session.

```sh
brain init [dir]     # copy the template into dir (default ~/Ionian/brain), never overwrite
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

## Principles.

- Plain markdown and YAML.
- Any agent. No lock-in.
- Local and private by default. Nothing leaves your machine unless you add a git remote.
- History is append-only.
- Standard markdown links, so it works in Obsidian, VS Code or a browser, and depends on none of them.

## Not in scope.

- No app.
- No hosted sync.
- No database.
- No vector search.
- No accounts.

## Credit.

The format borrows from Google's [Open Knowledge Format v0.2](https://github.com/GoogleCloudPlatform/open-knowledge-format). From it, Brain takes:

- a directory of markdown files
- YAML frontmatter with a required `type`
- generated indexes
- standard links

## Status.

v0.1. I am building it, and I use it every day. Expect rough edges and changes to the format before 1.0.

## License.

MIT. Part of [Ionian Labs](https://ionian.dev).
