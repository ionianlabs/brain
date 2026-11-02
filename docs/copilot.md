---
type: guide
description: Run the brief and handover prompt files from inside any work repo in VS Code with Copilot
tags: [copilot, prompts, setup]
updated: 2026-11-02
---

# Copilot prompts from inside a work repo

Prompt files in `.github/prompts/` only show up as `/brief` and `/handover` when the brain folder is the open workspace. To run them from inside a work repo, copy the two files into your VS Code user prompts. They are then available in every workspace of your profile.

1. In VS Code, open the Command Palette and run **Chat: New Prompt File**. Choose the **User** location and name it `brief`. This creates `brief.prompt.md` in your user prompts folder.
2. Paste the content of `<brain>/.github/prompts/brief.prompt.md` into it. Repeat for `handover`.
3. To check the result, type `/prompts` in the chat input, or run **Chat: Configure Prompt Files**.

The paths inside the prompts were filled in with the absolute path of your brain when you ran `init`, so the copies work from any folder.

To keep them on other machines, turn on Settings Sync and select **Prompts and Instructions** under **Settings Sync: Configure**.
