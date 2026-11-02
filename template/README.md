---
type: guide
description: What this brain folder is and how to start using it
tags: [readme, start]
updated: 2026-11-02
---

# Brain

This folder is your memory in plain markdown. Every agent you use reads and writes the same files. The rules are in [AGENTS.md](/AGENTS.md).

## Start

1. Open this folder in your editor.
2. Start your agent here and ask for the brief.
3. At the end of a session, ask for a handover.

## Where things go

| You have | Put it in |
|---|---|
| The current state of a project | `projects/<slug>.md` |
| What happened and what you decided | `logs/<slug>.md`, newest first |
| A thought you cannot place yet | `inbox/YYYY-MM-DD-<slug>.md` |
| Reference material that lasts | `knowledge/<slug>.md` |
| Something sensitive | `.confidential/`, which agents skip |

Copy a file from `templates/` to start a note.

## Check your work

```
npx @ionianlabs/brain index
npx @ionianlabs/brain lint
```

## Format

This folder is a valid [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format) bundle. Any tool that reads OKF can read it.
