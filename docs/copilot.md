---
type: guide
description: Use the eight Brain skills from any work repo with GitHub Copilot, with or without the plugin
tags: [copilot, skills, prompts, setup]
updated: 2026-11-17
---

# Copilot from inside a work repo

The simplest route is the plugin. It works in Copilot CLI and in VS Code, and it brings the eight skills (`agenda`, `drop`, `triage`, `sync`, `aware`, `outbox`, `nucleus` and `radar`) to every repo. See [the Brain plugin](plugin.md).

Each skill works on one thing and answers one question. In Copilot, run it with its slash command, for example `/agenda`, `/nucleus` or `/radar`:

| Skill | Works on | Question it answers |
|---|---|---|
| `agenda` | The open items that are written down | What needs me now? |
| `drop` | One thought, in any chat | How do I keep this without losing my place? |
| `triage` | The captures waiting in the inbox | Where does each one belong? |
| `sync` | One working session, for one project | What changed, and where do things stand now? |
| `aware` | What Ionian Flow's Aware proposed from meetings | Which proposals do I accept? |
| `outbox` | Brain content, for one named audience | What is safe to share with them? |
| `nucleus` | One named thing | What is the smallest unblocker? |
| `radar` | The dated events of the coming weeks | What should exist by now and does not? |

If your organization blocks plugins, use one of the two routes below. Neither puts files into your work repo.

## Personal skills.

Copilot reads personal skills from `~/.copilot/skills/`, in VS Code and in Copilot CLI. Copy the skill folders there:

```sh
mkdir -p ~/.copilot/skills
cp -R ~/Ionian/brain/skills/* ~/.copilot/skills/
```

Then run `/agenda`, `/sync` or any of the others. The skills run their steps inline. The paths inside the skills were filled in with the absolute path of your brain when you ran `init`, so the copies work from any folder. If you also install the plugin, remove these copies.

## Prompt files.

VS Code also runs prompt files. Its local agent reads them, Copilot CLI does not, and VS Code plans to replace them with skills. The brain ships one per skill in `.github/prompts/`. They only show up as `/agenda`, `/sync` and so on when the brain folder is the open workspace. To run them from inside a work repo, copy them into your VS Code user prompts:

1. In VS Code, open the Command Palette and run **Chat: New Prompt File**. Choose the **User** location and name it `agenda`. This creates `agenda.prompt.md` in your user prompts folder.
2. Paste the content of `<brain>/.github/prompts/agenda.prompt.md` into it. Repeat for the others.
3. To check the result, type `/prompts` in the chat input, or run **Chat: Configure Prompt Files**.

To keep them on other machines, turn on Settings Sync and select **Prompts and Instructions** under **Settings Sync: Configure**.
