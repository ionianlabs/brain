# Watcher service

Status: reviewed
Slug: watcher-service
Date: 2026-11-09

## Problem

A brain is a git repository, but nothing in the product commits it. Agent sessions run sandboxed — in the Claude desktop app and similar clients they can write files but cannot run git — so history only advances when the owner remembers to commit by hand. In practice the brain sits for hours with ten modified files on top of the last commit, and a bad write cannot be rolled back to a known-good state. The skills-only decision ([skills-only.md](skills-only.md)) made this worse on purpose: skills depend only on file access, so no skill may be asked to commit. Versioning must therefore come from outside every session: a background service on the owner's machine, installed and owned by the `brain` CLI, so the product works end to end without asking users to write their own scripts.

## Out of scope

- MCP server mode (`brain serve`): v2, separate spec.
- Pushing to a remote, pulling, or any multi-machine sync. The watcher writes local history only.
- Linux (systemd) and Windows support. v1 is macOS launchd only; the one-shot `brain commit` (F1) already works on any OS via the user's own scheduler.
- Conflict resolution or merging. The watcher never rewrites history and never resolves anything.
- Watching folders other than a brain (no generic auto-commit tool).
- Changes to how skills read or write brain files. Sessions still never run git.
- Self-repair of a watcher whose stored paths went stale (`status` detects it and tells the user to reinstall, nothing more), rotation or pruning of the watcher log, and any notification channel beyond the log and `status`.
- Adding `.commitmsg` to the `.gitignore` of an existing brain that never runs `brain watch install` (F2.1 covers installed brains, F4.2 newly created ones). A brain that already tracks `.commitmsg` only sees the file deleted on each run; `brain commit` does not untrack it, and a manual `git add` there may commit it — accepted.

## Terms

- **brain**: a markdown memory folder for one person's work across projects: one file per project (status frontmatter, a Now section, open items, a notes map), dated session logs, knowledge notes, an inbox of captures and a generated index, with an `AGENTS.md` at the root telling agents how to use it. Projects are grouped by org, and skills must not mix content across the org boundary nor ever open `.confidential/`. (Full format: `docs/spec.md`.)
- **owner**: the human whose machine hosts the brain; the only user in this spec.
- **skills**: five instruction-only workflows (`agenda`, `aware`, `drop`, `sync`, `triage`) that agent sessions run against the brain using file reads and writes alone; a prior decision (`docs/designs/skills-only.md`) forbids skills any dependency beyond file access, because the sessions are sandboxed. The `sync` skill ends a working session by writing the results back to one project — its Now and Open sections plus a dated log entry — and produces a one-line summary of the session.
- **CLI**: `bin/brain.mjs` in this repo, an optional terminal tool the skills never call. Its commands today: `init` creates a brain from the template, `index` rewrites the generated index block and the project notes maps, `lint` checks the folder against the format, `open` lists open items ranked. Exit codes are 0 ok, 1 errors found, 2 usage error.
- **template**: the `template/` folder in this repo that `brain init` copies into a new brain; its `gitignore` file is written to the brain as `.gitignore` (npm drops dotfiles from packages). `template/skills` holds the skill copies a new brain gets; `plugin/skills` holds the same five skills as shipped in the Claude Code plugin, regenerated from `template/skills` by `npm run build:plugin`. The `sync` skill exists today in both.
- **watcher**: the background job, run by launchd on an interval, that executes `brain commit` on one brain.
- **clean / dirty**: `git status --porcelain` empty / non-empty for the brain, untracked files included.

## Features

### F1. `brain commit` (P1)
Why: the single commit step that sessions cannot perform. Everything else in this spec only schedules or installs it. On its own it already fixes the problem for anyone with any scheduler (cron, a key binding, a manual habit of one short command).

Story: As a brain owner, I want one command that commits whatever changed, with a sensible message, so that history advances without me composing commits.

Scenarios:
- F1.1 Given a brain that is a git repository with 3 modified files and 1 untracked file and no `.commitmsg`, when `brain commit ~/Ionian/brain` runs, then all 4 files are staged and committed in one commit with the message `brain: 4 files changed` — the count is the number of entries `git status --porcelain --untracked-files=all` reported before staging, so untracked files count one by one and a rename counts once — and the command exits 0 printing one line on stdout: `<timestamp> committed <short-hash> brain: 4 files changed` (every stdout line of `brain commit` starts with a local ISO-8601 timestamp; see the log format under Interfaces).
- F1.2 Given the same brain with a file `.commitmsg` containing the single line `sync harbor-bakery-ordering: prep notes for Mara and Theo`, when `brain commit` runs, then the commit message is exactly that line, `.commitmsg` is deleted before staging, and the commit does not contain `.commitmsg`.
- F1.3 Given a clean brain, when `brain commit` runs, then nothing is committed, one line `<timestamp> clean` is printed on stdout and the command exits 0; a leftover `.commitmsg` is deleted even then, so a stale message can never attach to later unrelated changes. `.commitmsg` is read and removed before `git status` runs, so it never enters the count and a brain whose only change is `.commitmsg` is clean.
- F1.4 Given a folder that is not a git repository, or a brain whose root is not the repository root (a brain nested inside a larger repository), when `brain commit` runs, then nothing is staged or written, the command exits 1 and prints `<timestamp> error not a brain root: run brain init or git init at <dir>` on stdout. The root test compares the realpath of the brain dir with the realpath of `git rev-parse --show-toplevel`; symlinks are resolved here, unlike in F2.1's `<id>`, which deliberately keeps the user's spelling stable.
- F1.5 Given a repository where `user.name` or `user.email` is unset at every git config level, when `brain commit` runs, then the commit is created with the one-off identity `Ionian Brain <brain@ionian.dev>`, applied per invocation for that commit only (no config is written), and the note `using one-off identity` is printed on stderr; stdout keeps its single line.
- F1.6 Given a `.commitmsg` that is empty or whitespace-only, when `brain commit` runs, then the generated message of F1.1 is used and the file is still deleted. Given one with several lines or with a first line longer than 200 characters (each condition alone suffices), then only the first line, truncated to 200 characters, becomes the message and the rest is discarded.
- F1.7 Given files ignored by `.gitignore` (including `.commitmsg` once F4 adds it there), when `brain commit` runs, then ignored files are never staged.
- F1.8 Given a git command that fails (for example an existing `index.lock` from an overlapping manual commit), when `brain commit` runs, then the command exits 1, prints `<timestamp> error <first line of git's message>` on stdout and the full error on stderr, and leaves the working tree untouched. After any run that exits 1, `.commitmsg` (if one existed) still holds its line, so the narrative survives for the next tick; only a run that exits 0 consumes it.

Testability: unit. `node --test` with temporary git repositories in `os.tmpdir()`, matching the style of `test/cli.test.mjs`; asserts on `git log` output, exit codes and the absence of `.commitmsg` after the run.

### F2. `brain watch install | uninstall | status` (P2)
Why: removes the last manual step. F1 still needs someone to schedule it; this makes the product install its own schedule, which is the end-to-end promise. On its own it serves brains that are already git repositories (today's hand-made ones, or after `git init`); F3 extends the same setup to newly created brains.

Story: As a brain owner on macOS, I want the CLI to register a background job that runs `brain commit` on an interval, so that version control is inhabited by the product and I never think about it.

Scenarios:
- F2.1 Given a brain at `~/Ionian/brain` that is a git repository at its root, when `brain watch install ~/Ionian/brain` runs, then a launchd property list `~/Library/LaunchAgents/dev.ionian.brain.<id>.plist` is written — `<id>` is the first 8 hex characters of the SHA-256 of the brain's path made absolute (resolving `~` and relative segments, not symlinks) — the job is loaded via `launchctl`, it runs `brain commit <dir>` every 15 minutes, the brain's `.gitignore` gains a `.commitmsg` line if it lacks one, and the command prints the label and interval.
- F2.2 Given `--interval 5`, when install runs, then the job fires every 5 minutes; given `--interval 0`, a non-integer, or a value over 1440, the command exits 2 with usage.
- F2.3 Given a brain that is not a git repository, or one whose root is not the repository root, when install runs, then nothing is written, exit 1, and the message names F1.4's remedy.
- F2.4 Given an installed watcher, when `brain watch status ~/Ionian/brain` runs, then it prints five lines — `plist: yes|no`, `loaded: yes|no`, `interval: <N> min`, `last run: <final line of .git/watch.log>` (`last run: none` when the log is missing or empty), `paths: ok|stale` — and exits 0 when installed with `paths: ok`; given no watcher, it prints `not installed` and exits 1.
- F2.5 Given an installed watcher, when `brain watch uninstall ~/Ionian/brain` runs, then the job is unloaded, the plist deleted, and a second uninstall prints `not installed` and exits 1. A plist whose job is not loaded is still deleted (unload errors are ignored). `.git/watch.log` and `.git/watch.err` remain; they live inside `.git` and are inert.
- F2.6 Given the node binary or the brain repo clone has moved since install (the plist stores absolute paths), or `git` no longer resolving on the PATH frozen into the plist, when the job next fires it fails into the log; when `brain watch status` runs, then it prints `paths: stale`, tells the user to run install again, and exits 1.
- F2.7 Given install is run twice for the same brain (same `<id>`), when the second run completes, then the plist is replaced and the job reloaded, not duplicated; two different brains get two jobs.
- F2.8 Given any OS other than macOS, when any `brain watch` subcommand runs, then it exits 1 and prints that v1 supports launchd only and that `brain commit` can be scheduled with the system's own scheduler.

Testability: unit for plist generation, `<id>` derivation, argument validation, status parsing, and the install/uninstall/status flows, which take an injectable command runner and LaunchAgents directory so no test touches `~/Library/LaunchAgents` or the real `launchctl` (the real invocations are `launchctl bootstrap gui/<uid> <plist>` and `launchctl bootout gui/<uid>/<label>`); manual only for the real round-trip on a Mac, verified by a commit appearing within one interval of touching a file.

### F3. Git from `brain init` (P3)
Why: a brain created today is not a repository until the owner runs git by hand, so F1 and F2 have nothing to work on for new users. Init must leave a brain the watcher can serve.

Story: As a new user, I want `brain init` to leave a versioned brain with the watcher running, so that setup is one command.

Scenarios:
- F3.1 Given an empty target folder, when `brain init ~/Ionian/brain` runs, then after the template is copied the folder is a git repository with one commit `brain: init` containing every created file, the `.gitignore` written from the template's `gitignore` included, and the summary printed by init says so. F1.5's one-off identity rule applies to this commit; the first branch is whatever `git init` yields (the user's `init.defaultBranch` or git's own default), deliberately unpinned.
- F3.2 Given `brain init --watch`, when init completes on macOS, then F2.1's install runs for the new brain and the summary names the label and interval. Whenever the watch step cannot run — non-macOS (F2.8), git missing (F3.4), or an existing repository whose root is not the brain root (F2.3) — it is skipped with that reason as a warning in the summary, and init still exits 0.
- F3.3 Given a target that is already inside a git repository (an existing `.git` at or above the target), when init runs, then no `git init` is performed, no commit is made, and the summary says the existing repository is used — and, when that repository's root is not the brain root, that `brain commit` and the watcher will refuse it (F1.4).
- F3.4 Given git is not installed on the machine, when init runs, then the brain is still created exactly as today, the git step is skipped, and the summary says version control was skipped and why.

Testability: unit. Extends `test/init.test.mjs` with temp dirs; asserts on `.git` presence, `git log`, and init's printed summary.

### F4. Sessions leave the commit message (P4)
Why: watcher commits with generated messages lose the narrative that today's hand-made sync commits carry. Sessions cannot commit, but they can write one line for whoever does.

Story: As a brain owner reading `git log`, I want sync sessions to label the next auto-commit, so that history stays readable.

Scenarios:
- F4.1 Given the `sync` skill finishing a session for project `harbor-bakery-ordering`, when it has written all its other files, then it writes `.commitmsg` last, at the brain root, containing the single line `sync harbor-bakery-ordering: <its one-line summary>` capped at 200 characters, overwriting any existing `.commitmsg`. Writing it last means a tick that fires mid-session costs at most the narrative (a generated message), never a message attached to the wrong changes. This is a change to the skill's instruction text only — edited in `template/skills/sync/SKILL.md`, from which `plugin/skills` is regenerated by `npm run build:plugin` — and no code or CLI step runs in the session.
- F4.2 Given the template's `gitignore`, when a brain is created, then `.commitmsg` is ignored (one added line), so a brain whose watcher is not yet installed never tracks it.
- F4.3 Given no skill wrote `.commitmsg` since the last commit, when the watcher fires, then F1.1's generated message is used; stale messages never attach to unrelated changes because every `brain commit` run deletes the file, clean runs included (F1.3).

Testability: unit — the template fixture asserts the gitignore line, and a test asserts that both `template/skills/sync/SKILL.md` and `plugin/skills/sync/SKILL.md` contain the `.commitmsg` instruction with the `sync <slug>: <summary>` line; F1.2 and F1.6 cover consumption. Manual once: a real sync, then `git log` after the next watcher tick.

## Success criteria

- SC1 After a one-time setup of at most two commands (`brain init --watch` for a new brain; `git init` then `brain watch install` for an existing one, or `brain watch install` alone when it is already a repository), every change to a brain file is committed without any user action within 15 minutes (the default interval) of being written.
- SC2 A sync session's one-line summary (up to 200 characters) appears verbatim as the message of the commit that contains that session's changes, whenever no watcher tick fires between the session's writes; a tick that fires mid-session costs at most the narrative, never a wrong attachment.
- SC3 The background job, when the brain is clean, finishes in under 2 seconds and writes nothing to the working tree or repository (its one log line aside).
- SC4 After uninstall, zero processes, jobs or job definitions related to the brain remain on the machine; only the log files inside `.git` stay.
- SC5 No skill and no session ever invokes git; without a watcher the skills' only new artefact is one inert `.commitmsg` file, and nothing breaks.

Checks: SC1 and SC4 manually on a Mac (touch a file and wait one interval; after uninstall the job listing and the LaunchAgents folder show nothing for the brain); SC2 by reading the log after a synced session; SC3 by a unit test timing a clean run against the 2-second bound; SC5 by searching the skills' instruction files for git invocations.

## Interfaces and data

- `brain commit [dir]` (new): commands in `bin/brain.mjs`, logic in `src/commit.mjs` (new). Exit codes follow the existing convention: 0 ok (committed or clean), 1 error, 2 usage.
- `brain watch install [dir] [--interval N]`, `brain watch uninstall [dir]`, `brain watch status [dir]` (new): logic in `src/watch.mjs` (new). `N` in minutes, default 15, minimum 1, maximum 1440.
- `brain init [dir] --watch` (new flag) in `src/init.mjs`.
- `.commitmsg` (new): plain text file at the brain root; first line, at most 200 characters, is the next commit's message; consumed (deleted) by every `brain commit` run, whether or not it commits; listed in the template `gitignore`.
- `~/Library/LaunchAgents/dev.ionian.brain.<id>.plist` (new): launchd job definition; `StartInterval` = interval in seconds; `ProgramArguments` = absolute node path (`process.execPath` at install time), absolute `bin/brain.mjs` path, `commit`, absolute brain dir; `EnvironmentVariables` freezes `PATH` to its value at install time, so `git` resolves under launchd's minimal default PATH (Homebrew installs included); stdout appended to `<brain>/.git/watch.log` (new), stderr to `<brain>/.git/watch.err` (new) — both inside `.git`, so never tracked.
- `.git/watch.log` line format: `brain commit` prints exactly one stdout line per run — `<timestamp> committed <short-hash> <message>`, `<timestamp> clean`, or `<timestamp> error <summary>` — where `<timestamp>` is local ISO-8601 `YYYY-MM-DDTHH:mm:ss±HH:MM`; details and notes go to stderr (the `.err` file under launchd), keeping the log parseable line by line.
- `brain watch status` reads the plist and parses the final line of `.git/watch.log`.

## Decisions

- Versioning lives in a machine-level service owned by the CLI, never in skills or sessions. Rejected: committing from skills, because sandboxed sessions cannot run git and [skills-only.md](skills-only.md) forbids skill dependencies beyond file access. Rejected: an MCP server or packaged app owning the data, because it adds a protocol and a daemon without removing the need for a local service, and plain files are the product's core idea; a serving layer can still be added in v2 on top of the same files.
- The watcher runs on a fixed interval, not on file-system events. Rejected: FSEvents/watchman-style triggering, because an interval of minutes is enough for a memory folder, avoids committing torn mid-session states on every save, and needs no native dependencies.
- Commits use `git add -A` over the whole brain. Rejected: path filters, because `.gitignore` (org boundary, `.confidential/` policy) is already the single place exclusion rules live.
- `brain commit` and `brain watch install` refuse a brain whose root is not the repository root. Rejected: limiting the commit to the brain's paths inside a parent repository, because an unattended job must never touch a repository wider than the brain, and partial commits into a shared repository would interleave with its owner's own staging.
- One launchd job per brain, keyed by a hash of the path. Rejected: one global job scanning for brains, because it would need a registry and silently touch folders the user never opted in.
- `brain commit` never runs git push. Rejected: `--push`, because credentials and conflicts would leak into an unattended job; remote sync is a v2 concern.
- A tick may commit a file a session is still writing; the next tick commits the finished state, and history keeps both. Rejected: lock files or quiescence detection before committing, because they add a protocol between sessions and the watcher that sandboxed sessions cannot reliably honour.

## Assumptions

- The owner's machine has git ≥ 2.30 on the PATH of the shell that runs `brain init` and `brain watch install`; the plist freezes that PATH for the job. If wrong: F3.4's degradation applies everywhere.
- launchd user agents are permitted on the target Macs (no MDM restriction). If wrong: v1 falls back to documented manual scheduling of `brain commit`.
- A 15-minute default interval is acceptable history granularity. If wrong: it is a single flag (`--interval`) per install, no design change.
- npm drops dotfiles but `files` in `package.json` already ships `bin` and `src`, so no packaging change is needed beyond adding the new sources. If wrong: extend `files`.

## Dependencies

None. git and launchd are used via `child_process` over the system binaries (`git`, `launchctl`); no new packages.

## Review
- Round 1 (2026-11-09): paraphrase context missing, 0 divergences, 14 guesses; critic B0 M10 N4; readiness B0 M11 N3; 2 duplicate pairs merged. Fixed 39, rejected 2, escalated 0. Not run: none.
- Round 2 (2026-11-09): paraphrase context missing (pointer altitude only; restatement accurate), 0 divergences, 12 guesses, all on the intended reading (nits, dropped); critic B0 M0 N1; readiness B0 M0 N0; all earlier findings resolved except the empty Review section, resolved by this entry. Fixed 0, rejected 1, escalated 0. Not run: none.
- Rejected: P1-15: no git-version check in v1 only implied. Reason: Assumptions states "If wrong: F3.4's degradation applies everywhere".
- Rejected: C1-14: Review section empty while Status is draft. Reason: the section is filled by this review.
- Clarification (2026-11-09): Should context the zero-context reviewers need be inlined or pointed to by repo path? Answer: inlined — reviewers read in isolation and follow no links; paths stay as provenance only (P2-1, and the drafting rule itself was corrected in the harness). Changed: Terms.
