# Works with Ionian Harness

Ionian Brain and Ionian Harness are two separate products. Each works alone. Together they split the job along one line: Brain holds the PM view, Harness holds the state of the code repo.

## What Brain owns

The PM view: a status summary, owners, dates, people and the decisions in force. It points to repo files by path and never copies code detail.

## What Harness owns

The state of the code repo, kept in the repo itself: specs in `docs/designs/`, plans, git history, and a `STATE.md` handoff file in the repo root. Its `state` skill rewrites `STATE.md` at session end.

## Session end in a repo with STATE.md

1. Run the Harness `state` skill. It rewrites `STATE.md`.
2. Run `brain:handover`. It reads `STATE.md` first and uses it as the source for the project's `## Now` and the log entries, summarising one level up.

Handover never copies `STATE.md` into the brain and never writes to the repo. Without a `STATE.md`, it behaves as usual.

## Each works alone

- Brain without Harness loses nothing. Handover works from your own notes of the session.
- Harness without Brain loses nothing. It never reads or writes a brain.

## One rule

Harness never writes into a brain. Information flows one way: repo, then handover, then brain.
