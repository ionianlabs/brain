---
name: drop
type: skill
description: Capture a thought into the brain inbox from any chat. Use when the user says "drop this", "drop:", "capture this" or "remember this for the brain". Writes exactly one capture file with its source stamped and touches nothing else. Triage places it later.
---

# Drop

Capture one thought into the brain's inbox. This is the one cheap, safe write path from any context: it writes a single new file and nothing else.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the `BRAIN_DIR` environment variable if it is set, otherwise `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, otherwise `{{BRAIN_DIR}}`. Take the first candidate that is set and never fall through to the next one. Below, `<brain>` is that folder.

Find the brain CLI the same way. Use the command named in your session context, if there is one. Otherwise use {{BRAIN_CLI}}. Below, `<cli>` is that command.

If `<brain>/AGENTS.md` does not exist, say that no brain was found at that path and write nothing. You may offer to create one with `<cli> init "<brain>"`. Then stop.

## Steps

1. Read only what you need: check that `<brain>/AGENTS.md` exists, read `<brain>/templates/capture.md`, and list `<brain>/inbox/` to avoid a name clash. Read no other file.
2. Write one capture following the capture template, to `<brain>/inbox/YYYY-MM-DD-<slug>.md` with today's date. Derive a short kebab-case slug from the content. If the file name already exists, append `-2`, `-3` and so on before `.md`. Never overwrite a file.
3. The frontmatter:
   - `type: capture`
   - `org`: the org slug if the user said it or the context makes it certain, otherwise `unknown`. Never guess an org.
   - `source`: `chat` when the owner asked in a conversation, `agent` when you capture on your own initiative.
   - `description`: one line, no trailing full stop.
   - `tags`: at least one.
   - `updated`: today's date.
4. The body is a `# <Title>` heading, then bullets. Each bullet carries the provenance prefix that fits it:
   - `Said(Name):` when the owner quotes someone else.
   - `Inferred:` when you add your own reading.
   - No prefix for the owner's own words. The default author is the owner.
5. Confirm in one line with the file name. Then stop.

## Rules

- Never write secrets: passwords, tokens and keys never go into a capture. Summarise around them.
- Write exactly one file. No index, no lint, no other write. If the write fails, report the error and write nothing.
- Do not read project files, logs or notes. Do not place the thought anywhere else: `triage` does that.
- Never open `.confidential/`.

## Example

The user says: "drop this: Sam said the pilot moves to January". Today is 2026-11-08.

`inbox/2026-11-08-pilot-moves-to-january.md`:

```
---
type: capture
description: Pilot start moves to January
tags: [pilot]
org: unknown
source: chat
updated: 2026-11-08
---

# Pilot moves to January

- Said(Sam): the pilot moves to January
```

Reply:

```
Captured: 2026-11-08-pilot-moves-to-january.md
```
