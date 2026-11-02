---
type: guide
description: Use the brief and handover skills from any work repo with GitHub Copilot, with or without the plugin
tags: [copilot, skills, prompts, setup]
updated: 2026-11-02
---

# Copilot from inside a work repo

The simplest route is the plugin. It works in Copilot CLI and in VS Code, and it brings `brief` and `handover` to every repo. See [the Brain plugin](plugin.md).

If your organization blocks plugins, use one of the two routes below. Neither puts files into your work repo.

## Personal skills

Copilot reads personal skills from `~/.copilot/skills/`, in VS Code and in Copilot CLI. Copy the two skill folders there:

```sh
mkdir -p ~/.copilot/skills
cp -R ~/brain/skills/brief ~/brain/skills/handover ~/.copilot/skills/
```

Then run `/brief` or `/handover`. The paths inside the skills were filled in with the absolute path of your brain when you ran `init`, so the copies work from any folder. If you also install the plugin, remove these copies.

## Prompt files

VS Code also runs prompt files. Its local agent reads them, Copilot CLI does not, and VS Code plans to replace them with skills. The brain ships two in `.github/prompts/`. They only show up as `/brief` and `/handover` when the brain folder is the open workspace. To run them from inside a work repo, copy them into your VS Code user prompts:

1. In VS Code, open the Command Palette and run **Chat: New Prompt File**. Choose the **User** location and name it `brief`. This creates `brief.prompt.md` in your user prompts folder.
2. Paste the content of `<brain>/.github/prompts/brief.prompt.md` into it. Repeat for `handover`.
3. To check the result, type `/prompts` in the chat input, or run **Chat: Configure Prompt Files**.

To keep them on other machines, turn on Settings Sync and select **Prompts and Instructions** under **Settings Sync: Configure**.
