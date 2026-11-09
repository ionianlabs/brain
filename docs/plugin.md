---
type: guide
description: Install the Brain plugin in Claude Code, the Claude desktop app, GitHub Copilot CLI or Copilot in VS Code, and what it does
tags: [plugin, setup, claude-code, copilot]
updated: 2026-11-09
---

# The Brain plugin

The plugin brings the `agenda`, `drop`, `triage`, `sync` and `aware` skills to every repo and chat you work in. It holds those five skills and nothing else: no CLI, no agents and no hooks. The skills read and write the brain's markdown files directly, so they work wherever the agent can reach the brain folder, including the Claude desktop app with folder access.

The plugin is optional. The brain is the folder, and any agent that reads `AGENTS.md` can use it without the plugin.

One plugin folder serves Claude Code, the Claude desktop app, GitHub Copilot CLI and Copilot in VS Code. They all read the same format.

## Before you install.

You need a brain folder: a folder with an `AGENTS.md` at its root. Create one with the optional CLI (see below), or copy the `template/` folder of the [repository](https://github.com/ionianlabs/brain). If a skill finds no such folder, it says so and points there.

## Claude Code.

In a session:

```
/plugin marketplace add ionianlabs/brain
/plugin install brain@ionianlabs
```

From a terminal, the same with `claude plugin marketplace add ionianlabs/brain` and `claude plugin install brain@ionianlabs`.

Say "agenda" or run `/brain:agenda`. To capture a thought from any chat, say "drop this: …". Say "triage" to place what waits in the inbox. At the end of a session, say "sync" or run `/brain:sync`.

To update, run `claude plugin update brain@ionianlabs`, or turn on auto-update for the marketplace in `/plugin`. Updates load in the next session.

## Claude desktop app.

Add the plugin from the same marketplace, then connect your brain folder to the conversation. The skills use the folder you shared, if it has an `AGENTS.md` at its root. The same works in a remote session of the desktop app. No terminal, Node or CLI is needed.

## GitHub Copilot CLI.

```sh
copilot plugin marketplace add ionianlabs/brain
copilot plugin install brain@ionianlabs
```

Say "agenda" or run `/agenda`. Copilot CLI does not prefix plugin skills, so a personal or project skill with the same name wins over the plugin's.

To update, run `copilot plugin marketplace update ionianlabs`, then `copilot plugin update brain@ionianlabs`.

If your Copilot uses a GitHub Enterprise host, `owner/repo` resolves against that host. Use the full URL instead: `copilot plugin marketplace add https://github.com/ionianlabs/brain`.

## Copilot in VS Code.

Add the marketplace in your user settings. The setting replaces the default list, so keep the default entry:

```json
"chat.plugins.marketplaces": ["github/awesome-copilot#marketplace", "ionianlabs/brain"]
```

Then run **Chat: Plugins** from the Command Palette, find `brain` and install it. Or run **Chat: Install Plugin from Source** and enter `ionianlabs/brain`.

Say "agenda" or run `/brain:agenda`. An organization can turn plugins off by policy. If plugins are blocked for you, see [Copilot without the plugin](copilot.md).

## What the plugin does.

- `agenda` shows what needs you now as tables: at most 5 items each under "Needs you", "Coming up" and "Blocked", a summary line first, and never edits anything.
- `drop` captures a thought from any chat into the inbox.
- `triage` places the captures one decision at a time.
- `sync` updates one project's state file and log. Outside triage and sync, a session writes only captures.
- `aware` walks you through what Ionian Flow's Aware proposed in the inbox and files what you accept (see [works with Flow](works-with-flow.md)).

The skills keep `index.md` in step by hand: a new note gets one line in the generated block, a note with `project: <slug>` goes in that project's notes map, and a changed `description` changes its line. They never rewrite the whole block, and there is no automatic lint, so the org boundary relies on the skills' own rules. They never open `.confidential/`.

## How the skills find the brain.

Each skill looks in this order:

1. The brain folder named in the session context.
2. A folder you shared or named in this conversation that has an `AGENTS.md` at its root.
3. The `BRAIN_DIR` environment variable.
4. `$IONIAN_HOME/brain`, if `IONIAN_HOME` is set.
5. `~/Ionian/brain`.

If none of them holds an `AGENTS.md`, the skill says so, points to https://github.com/ionianlabs/brain and stops.

## Optional: the CLI.

The repository also ships a terminal tool, `brain`, which is not part of the plugin and which no skill needs:

```sh
git clone https://github.com/ionianlabs/brain
node brain/bin/brain.mjs init            # creates ~/Ionian/brain
node brain/bin/brain.mjs init --example  # same, with sample projects
```

- `brain init` creates a brain from the template. `brain index` rebuilds the index and the notes maps, which repairs any drift left by hand edits. `brain lint` checks the folder against the spec. `brain open` lists open items.
- `brain init --link-skills` links the skills into `~/.claude/skills/`. VS Code reads that folder too, so do not combine it with the VS Code plugin.

## Without the plugin.

- **Claude Code:** `node brain/bin/brain.mjs init --link-skills` links the skills into `~/.claude/skills/`.
- **Copilot:** see [Copilot without the plugin](copilot.md).
- **Any other agent:** open it in the brain folder, or say "Read skills/agenda/SKILL.md and follow it."

Pick one route per agent. If the same skill is installed twice, the agent keeps one of them, and you may not get the copy you expect.
