---
name: aware
type: prompt
description: Review what Ionian Flow's Aware proposed for the brain, file the accepted items and archive the day files. Run with /aware.
agent: agent
tools: ['search/codebase', 'edit/editFiles', 'execute/runInTerminal']
---

# Aware

Ionian Flow's Aware reads the user's finished meeting transcripts, not their dictations, and proposes to-dos, decisions and facts for the brain. It never writes them in itself. It only writes day files into the inbox, and the user decides here. Walk the user through those files, file what they accept, and mark every line so Flow can measure how good its proposals are.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## The day file

Aware writes `inbox/YYYY-MM-DD-aware.md`, with `type: capture`, `source: flow` and `org: unknown`. Under one `## HH:mm` heading per run, each proposal is one line:

```
- [ ] todo: Send the deck (due: 2026-11-06) → alpha > "Can you send me the deck by Friday?" ([2026-11-05 10-02](/transcripts/2026-11-05%2010-02.md) 10:14, Them, 0.82)
- [ ] fact: Launch moved to June → alpha > "the launch moved to June" ([2026-11-05 10-02](/transcripts/2026-11-05%2010-02.md) 10:31, Them, 0.74) conflicts: "launch in April"
```

The parts, in order: the mark, the category (`todo`, `decision` or `fact`), the text, `→` and the suggested project slug (or `none`), `>` and the verbatim quote, then the source in parentheses (a transcript link and time), the speaker, and Flow's confidence. A line may end with `conflicts:` and the brain line it contradicts.

The marks: `[ ]` not reviewed, `[x]` accepted, `[~]` accepted after an edit, `[-]` rejected, `[=]` duplicate of something already in the brain.

## Steps

1. Read `<brain>/AGENTS.md`, then `<brain>/index.md`.
2. List the files in `<brain>/inbox/` whose frontmatter has `source: flow`, oldest first. If there are none, say so and stop.
3. In each file, collect the lines that start with `- [ ] `. Read each suggested project's file before you show its lines.
4. Show the lines grouped by project, numbered, a few words each: category, text, the quote, where it was said. For a `conflicts` line, show the old line next to the new one. Ask the user to answer per number: accept, edit (with the new text), reject or duplicate. "Accept all" for one project is fine. Never decide for the user. A line the user skips stays `[ ]`.
5. File each accepted or edited line in the project the user confirmed. Write only the text, never the quote, and keep `owner` and `due`:
   - `todo`: a new open item under the project's `## Open`, as `- [ ] Text (owner: Name, due: YYYY-MM-DD)`.
   - `decision`: a `Decision:` bullet at the top of the project's log, under today's date. If it changes the present, update `## Now` too.
   - `fact`: a line in the project's `## Now` when it describes the present. Otherwise ask whether it belongs in a knowledge note with `project: <slug>`.
   - `conflicts`: ask whether the new line replaces the old one or both stay. Change the old line only on a yes.
6. If the project is `none`, or the slug does not exist, ask the user which project it belongs to. Do not guess an org. If the user names none, leave the line `[ ]`.
7. Mark each reviewed line in the day file: change only the mark, never the rest of the line. Aware's precision report reads the marks.
8. A day file whose lines all carry a mark is done, unless it is dated today: Flow may still add to today's file, so it stays in the inbox until a later review. For each done file:
   - Add `Triaged capture: <filename>` to the log of each project that got content from it, under today's date.
   - Move it to `<brain>/_archive/inbox/`. If a file with that name is already there, add `-2` (or the next free number) before `.md`. Never delete an Aware file: Flow reads the archived files to measure its precision and to avoid proposing a rejected item again.
9. Set `updated` to today in every note you changed. If you created a note, or changed a note's `description`, follow Index bookkeeping below.
10. Report in a few lines: how many lines were accepted, edited, rejected and marked duplicate, and where the accepted ones went.

## Index bookkeeping

There is no tool to rebuild the index here, so keep its lines in step by hand, one line at a time. Never rewrite the whole generated block.

- A new note gets one line in the generated block of `<brain>/index.md`, between `<!-- brain:index start -->` and `<!-- brain:index end -->`, in the format the block already uses: `- [Title](/folder/slug.md): description (org, updated YYYY-MM-DD)`. A new project goes under its phase heading (`## Active`, `## Paused`), a knowledge note without `project` under `## Knowledge`. Newest `updated` first inside a section. Look at the lines already there and copy their shape.
- A note with `project: <slug>` is listed in that project's notes map instead, between `<!-- brain:notes start -->` and `<!-- brain:notes end -->` in the project file: `- [Title](/knowledge/slug.md): description`. Create the block under the line `Notes (open one only when the task needs it):`, before `## Now`, if the project has none. Raise the `N notes` count in the project's index line by one.
- When you change a note's `description`, change that line, in the index or in the notes map.

## Rules

- Content goes only into the org of the project it was filed in. Never copy it into another org's notes.
- Never edit a transcript, and never open `.confidential/`.
- Keep to the org boundary: a note never links to a note of another org, unless one side is `personal`.
- Keep project files within their budget. Detail goes to a knowledge note with `project: <slug>`.
- The review is the user's. Do not accept, reject or edit a line on your own judgment.
