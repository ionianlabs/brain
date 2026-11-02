---
type: guide
description: Install the Brain plugin in Claude Code, GitHub Copilot CLI or Copilot in VS Code, and what it does
tags: [plugin, setup, claude-code, copilot]
updated: 2026-11-02
---

# The Brain plugin

The plugin brings the `brief` and `handover` skills to every repo you work in. It also tells each new session where your brain folder is. It is optional. The brain is the folder, and any agent that reads `AGENTS.md` can use it without the plugin.

One plugin folder serves three agents: Claude Code, GitHub Copilot CLI and Copilot in VS Code. They all read the same format.

## Before you install.

The plugin looks for the brain in `~/brain`. If there is none yet, say "brief" after you install, and the agent offers to create it. The plugin carries the CLI, so you need only Node 20 or newer. To use another folder, set the `BRAIN_DIR` environment variable, for example in your shell profile:

```sh
export BRAIN_DIR="$HOME/notes/brain"
```

## Claude Code.

In a session:

```
/plugin marketplace add ionianlabs/brain
/plugin install brain@ionianlabs
```

From a terminal, the same with `claude plugin marketplace add ionianlabs/brain` and `claude plugin install brain@ionianlabs`.

Say "brief" or run `/brain:brief`. At the end of a session, say "handover" or run `/brain:handover`.

To update, run `claude plugin update brain@ionianlabs`, or turn on auto-update for the marketplace in `/plugin`. Updates load in the next session.

## GitHub Copilot CLI.

```sh
copilot plugin marketplace add ionianlabs/brain
copilot plugin install brain@ionianlabs
```

Say "brief" or run `/brief`. Copilot CLI does not prefix plugin skills, so a personal or project skill with the same name wins over the plugin's.

To update, run `copilot plugin marketplace update ionianlabs`, then `copilot plugin update brain@ionianlabs`.

If your Copilot uses a GitHub Enterprise host, `owner/repo` resolves against that host. Use the full URL instead: `copilot plugin marketplace add https://github.com/ionianlabs/brain`.

## Copilot in VS Code.

Add the marketplace in your user settings. The setting replaces the default list, so keep the default entry:

```json
"chat.plugins.marketplaces": ["github/awesome-copilot#marketplace", "ionianlabs/brain"]
```

Then run **Chat: Plugins** from the Command Palette, find `brain` and install it. Or run **Chat: Install Plugin from Source** and enter `ionianlabs/brain`.

Say "brief" or run `/brain:brief`.

Plugins, skills and hooks are on by default. An organization can turn them off by policy. If plugins are blocked for you, see [Copilot without the plugin](copilot.md).

The session-start script runs only in a trusted workspace. It is also off when your organization turns off Copilot preview features. The skills still work then, and find the brain through `BRAIN_DIR` or `~/brain`.

## What the plugin does.

- **Skills.** `brief` reads the brain and reports what needs you today. It never edits anything. `handover` updates one project's state file and log, then rebuilds the index and runs lint.
- **CLI.** A copy of the brain CLI, in `cli/`. The skills use it to rebuild the index, run lint and create a brain.
- **Session start.** A small Node script runs when a session starts. It adds a few sentences to the session: the path of your brain folder, the command that runs the CLI, and a note to read `AGENTS.md` when the task touches your projects. If there is no brain yet, it says so and names the `init` command.

The session-start script states the path only. It never reads or sends the content of your notes, so nothing from one client reaches a session in another client's repo. It writes no files into the repo you work in. If Node is missing or the script fails, the session goes on without it.

## How the skills find the brain.

Each skill looks in this order:

1. The folder named by the session-start script.
2. The `BRAIN_DIR` environment variable.
3. `~/brain`.

If none of them holds an `AGENTS.md`, the skill stops and offers to create a brain.

## Without the plugin.

Clone the repo and run the CLI from it:

```sh
git clone https://github.com/ionianlabs/brain
node brain/bin/brain.mjs init
```

The skills in the new brain then run the CLI from that clone. Keep the clone where it is.

- **Claude Code:** `node brain/bin/brain.mjs init --link-skills` links the skills into `~/.claude/skills/`. VS Code reads that folder too, so do not combine it with the VS Code plugin.
- **Copilot:** see [Copilot without the plugin](copilot.md).
- **Any other agent:** open it in the brain folder, or say "Read skills/brief/SKILL.md and follow it."

Pick one route per agent. If the same skill is installed twice, the agent keeps one of them, and you may not get the copy you expect.
