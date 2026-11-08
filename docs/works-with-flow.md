---
type: guide
description: How Ionian Flow's Instinct proposes to-dos, decisions and facts for the brain, and how you review them
tags: [flow, instinct, inbox]
updated: 2026-11-05
---

# Works with Ionian Flow

Ionian Flow is dictation and meeting transcription on the Mac, all on the device. Its Instinct feature reads what you dictate and your finished meeting transcripts, and proposes to-dos, decisions and facts for the brain. Brain and Flow each work alone. Together they split the job along one line: Flow proposes, you decide, Brain keeps.

## What Flow writes

Only day files in the inbox: `inbox/YYYY-MM-DD-instinct.md`, a capture with `source: flow` and `org: unknown`. A meeting is swept right after it ends, dictations every few hours, and each run adds a section to the day's file. Every line is one proposal with its category, the suggested project, the verbatim quote and where it was said. Flow never edits a project, a log or a transcript.

Flow keeps the inbox from flooding: a proposal needs a verbatim quote, decisions and facts need a known project, and each run and each day has a limit. Before it writes a line, Flow checks the brain for the same thing: project files, the last 30 days of logs, and earlier day files, rejected lines included.

## What you do

Say "instinct" or run `/brain:instinct`. The skill shows the open lines by project, and you answer per line: accept, edit, reject or duplicate. Accepted to-dos go to the project's `## Open`, decisions to its log, facts to `## Now` or a knowledge note. The skill marks every line and, once a day file is fully reviewed and the day is over, moves it to `_archive/inbox/`.

The agenda counts the lines still waiting, so you see them each morning, and `triage` hands day files like these to `instinct`.

## One rule

Instinct day files are archived, never deleted. Flow reads the marks in `_archive/inbox/` to measure how many of its proposals you accept, and to avoid proposing a rejected item again.
