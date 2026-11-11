---
type: guide
description: Use the agenda and sync skills from any work repo with GitHub Copilot, with or without the plugin
tags: [copilot, skills, prompts, setup]
updated: 2026-11-02
---

# Copilot from inside a work repo

The simplest route is the plugin. It works in Copilot CLI and in VS Code, and it brings the six skills (`agenda`, `drop`, `triage`, `sync`, `aware` and `outbox`) to every repo. See [the Brain plugin](plugin.md).

If your organization blocks plugins, use one of the two routes below. Neither puts files into your work repo.

## Personal skills.

Copilot reads personal skills from `~/.copilot/skills/`, in VS Code and in Copilot CLI. Copy the skill folders there:

```sh
mkdir -p ~/.copilot/skills
cp -R ~/Ionian/brain/skills/agenda ~/Ionian/brain/skills/drop ~/Ionian/brain/skills/triage ~/Ionian/brain/skills/sync ~/.copilot/skills/
```

Then run `/agenda` or `/sync`. The skills run their steps inline. The paths inside the skills were filled in with the absolute path of your brain when you ran `init`, so the copies work from any folder. If you also install the plugin, remove these copies.

## Prompt files.

VS Code also runs prompt files. Its local agent reads them, Copilot CLI does not, and VS Code plans to replace them with skills. The brain ships one per skill in `.github/prompts/`. They only show up as `/agenda`, `/sync` and so on when the brain folder is the open workspace. To run them from inside a work repo, copy them into your VS Code user prompts:

1. In VS Code, open the Command Palette and run **Chat: New Prompt File**. Choose the **User** location and name it `agenda`. This creates `agenda.prompt.md` in your user prompts folder.
2. Paste the content of `<brain>/.github/prompts/agenda.prompt.md` into it. Repeat for the others.
3. To check the result, type `/prompts` in the chat input, or run **Chat: Configure Prompt Files**.

To keep them on other machines, turn on Settings Sync and select **Prompts and Instructions** under **Settings Sync: Configure**.
