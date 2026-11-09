---
type: guide
description: Decision note: the Brain plugin ships skills only, with no CLI, lint, agents or hook, and an agenda built as tables
tags: [design, plugin, skills, agenda]
updated: 2026-11-09
---

# Skills only

Status: decided 2026-11-09 by the owner. Version 0.6.0.

## Problem

The owner runs the brain mostly in the Claude desktop app, with folder access to the brain folder, and sometimes remotely through the same desktop session. There the skills can read and write the brain files, but the plugin's Node CLI (`brain open`, `brain index`, `brain lint`) often cannot run. That caused workarounds and a broken fallback. The agenda was also hard to read: the owner "doesn't know where to look".

## Decision

1. The plugin holds skills only: `agenda`, `aware`, `drop`, `sync`, `triage` and `.claude-plugin/plugin.json`. The CLI copy, the `reader` and `scribe` agents and the session-start hook leave the plugin. The CLI stays in the repo as an optional terminal tool, unchanged.
2. Every skill finds the brain the same way: the folder named in the session context, else a folder the user shared or named that has an `AGENTS.md` at its root, else `BRAIN_DIR`, `$IONIAN_HOME/brain`, `~/Ionian/brain`. With none, the skill says so, points to the repository and stops. Skills no longer offer `brain init`.
3. Skills keep the bookkeeping by hand. A new note gets one line in the generated block of `index.md`. A note with `project: <slug>` is added to that project's notes map. A changed `description` changes its line. The whole block is never rewritten. Lint steps are gone. The org boundary, the rule against opening `.confidential/` and the budgets stay as plain rules, the budgets as soft guidance.
4. `sync` writes inline only. Now, Open, the log with provenance prefixes, budgets and the one-batch confirmation of new items stay.
5. `agenda` is rewritten: it reads only the frontmatter and `## Open` of each non-done project, ranks overdue, then due today, then undated p0, and prints tables of at most 5 items under a summary line. "agenda everything" prints one table per project under one heading per org.

## Consequences

- No automatic lint. The org boundary relies on the skills' rules.
- The index is kept by hand and can drift. `brain index` in a terminal repairs it, and `brain lint` checks the rest. Both are optional.
- The plugin is smaller and has nothing to install beyond the skills. Every skill depends only on file access.
- The agenda cannot use the CLI's ranking. The ranking is now written in the skill, and a brain's `## Agenda rules` may tighten it but never raise the caps.
