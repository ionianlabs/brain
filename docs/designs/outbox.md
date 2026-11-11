# Outbox and people directory

Status: approved
Slug: outbox
Date: 2026-11-11

## Problem

A brain is private: it holds the owner's knowledge, to-dos, meeting processing, readings of people and work for several orgs. The owner now needs to share parts of it with groups of people (for example a steering group and a working team of one client org) through outlets such as a team site or a wiki. Today there is no safe path: anything shared is copied by hand, or by an agent, straight out of private notes, so opinions about people, negotiation notes, employer-internal or commercial matters, or another org's content can leak. A client-specific prototype exists and is generalised here: the outbox becomes the safe outlet for sharing content from the brain. Separately, each project file keeps its own `## People` text, so who someone is and what their role is lives in many places, and an agent cannot tell an audience member from anyone else; the outbox needs one trustworthy source for names and roles. Finally, audiences must be set up scalably and customised per outlet without the brain knowing outlet details.

## Existing system

- **Brain**: a markdown folder with `projects/` (state files), `logs/` (history, newest first, one `## YYYY-MM-DD` heading per day), `knowledge/` (notes), `inbox/` (untriaged captures), `.confidential/` (off limits to agents) and `index.md` (a generated block between markers listing the notes, one line each, in the form `- [Title](/folder/slug.md): description (org, updated YYYY-MM-DD)`). `AGENTS.md` at the root is the rulebook every agent reads first: layout, frontmatter and writing rules.
- **Frontmatter**: every note has `type` (matching its folder), `description`, `tags`, `org` (an org slug or `personal`; notes of different orgs, other than `personal`, never link to or copy into each other) and `updated`; optional `status: draft|stable|deprecated`.
- **Log provenance**: a log bullet that is bare is the owner's fact; `Said(Name):` is someone else's statement; `Inferred:` is an agent's own conclusion; `Done:` and `Decision:` are prefixes for completed work and decisions.
- **`brain` CLI (optional)**: `brain init` creates a brain from `template/`; `brain index` rebuilds the generated index block and notes maps; `brain lint` checks frontmatter (every `.md` needs a non-empty `type`, rule `okf/type-missing`; required keys, rule `frontmatter/missing-key`; files in note folders need the folder's type, rule `frontmatter/bad-value`), links and the org boundary. Note folders are classified by `NOTE_FOLDERS` in `src/notes.mjs`: projects to project, logs to log, inbox to capture, knowledge to note. Tests run with `npm test` (`node --test`).
- **Skills**: prose instructions in `template/skills/<name>/SKILL.md`, mirrored body for body in `template/.github/prompts/<name>.prompt.md`, built into `plugin/` by `npm run build:plugin` (`scripts/build-plugin.mjs`). They depend only on file access, never on the CLI. A skill finds the brain as the folder named in the session context, else a folder the user shared or named that has an `AGENTS.md` at its root, else `BRAIN_DIR`, `$IONIAN_HOME/brain`, `~/Ionian/brain`; with none it says so and stops (decision 2 of `docs/designs/skills-only.md`, cited as provenance).
- **Prototype**: the owner ran a client-specific version of this barrier for one outlet. The barrier rules in this spec (allowlist, held-back classes, rewrite, approval, manifest) are the prototype's rules with everything specific to one client and one outlet removed; nothing else from it is carried over.
- **Publisher**: none ships with this repository; the owner runs their own. The format works with any publisher that honours the publisher contract (Interfaces and data).
- **Invocation**: the owner calls the skill by name (`/outbox`, or `/brain:outbox` in the plugin) or by a trigger phrase in natural language (F2.25).
- **Fixture brain**: a new folder `test/fixtures/outbox-brain/` (new) holds the seeded files of the F2 table; it is used for the manual runs of F2 and F3.

## Out of scope

- Publishing, laying out for outlets, any connector or network call. The outbox works offline; a separate downstream publisher (any tool or agent) does the rest.
- Reading back from outlets and echo protection for content imported from an outlet. Inbound is another skill; whatever imports content tags it, and a later version can skip tagged content.
- A `share:` frontmatter key on notes (see Decisions).
- Any CLI or lint rule for `outbox/` (see Decisions).
- Migrating existing project `## People` sections into person notes. New entries link; old ones stay.
- Skills that create person notes automatically. v1 is template and by hand; `triage` may route a capture to a person note later.
- Automatic cleanup or archiving of old packages.
- Weekly digests built from the outbox.
- Recalling a published item from an outlet; the owner does it there.

## Terms

- **brain**: the owner's markdown memory folder (see Existing system; format in `docs/spec.md`), a git repository committed locally by a background watcher (`docs/designs/watcher-service.md`); nothing is pushed.
- **owner**: the human whose brain it is.
- **audience**: a named group of people of exactly one org who receive shared content, for example `steering` or `team` of org `acme`. Folder `outbox/<audience>/`.
- **space**: a slug grouping the audiences of one shared initiative, for example `launch`; set in `audience.md`.
- **rank**: a positive integer on an audience, a trust level compared only between audiences of the same space; higher sees more (`steering` 2, `team` 1).
- **role**: a role name such as `Programme lead`; the person note's `role` key is the only source of a person's role.
- **outbox**: the folder `outbox/` at the brain root; the only path by which brain content may leave the brain.
- **item**: one shareable unit of content: a decision, action, date, context line, open question or file, with an id (`#<n>`, sequential per audience, never reused) and a manifest row.
- **content class**: one of `decisions`, `dates`, `actions`, `definitions`, `roles`, `metrics`, `cadence`, `open-questions`, `links`, `files`; the unit of an audience's `receives`.
- **package**: one file `outbox/<audience>/YYYY-MM-DD-<slug>.md` holding the approved items of one run.
- **manifest**: `outbox/<audience>/manifest.md`, one row per item.
- **barrier**: the rules in F2 deciding which brain content may become an item.
- **held back**: content the barrier refuses; reported by category and count only.
- **not relevant**: content that passes the barrier but is outside what the audience needs per its `receives` and `audience.md` body; reported as "not relevant to <audience>: <count>", never written.
- **needs decision**: a candidate item the skill cannot classify or complete (for example it names a person with no person note); the owner decides.
- **money**: an amount of money or a budget figure. Percentages, durations and counts are not money.
- **blocked term**: a word or phrase listed in `## Outbox rules` of `AGENTS.md`.
- **self-check**: the required scan in F2 after approval and before writing.
- **publisher**: the out-of-scope downstream tool or agent that reads `outbox/<audience>/` and sends to outlets.
- **person note**: `people/<slug>.md`, `type: person`. Its header (the frontmatter plus the title line `# Full Name`) is shareable; everything below the title line is private and never leaves the brain.
- **skills**: instruction-only workflows in `template/skills/<name>/SKILL.md` that depend only on file access (`docs/designs/skills-only.md`). Existing: `agenda`, `aware`, `drop`, `sync`, `triage`.

## Features

Priorities P1 to P4 are the delivery order: each feature ships in that order, and F1 is useful alone.

### F1. People directory (P1)
Why: removes the scattered `## People` copies and gives the barrier one place for names, roles and aliases. Alone it is already useful: one fact in one place for every project.

Story: As the owner, I want one note per person per org with a shareable header and a private body, so that roles are written once and an agent can tell who is who.

Delivers: `people/` as a note folder in the CLI, `template/templates/person.md` (new), and the `people/<slug>.md` and `person` entries in the tables of `template/AGENTS.md`.

Scenarios:
- F1.1 Given `people/sam-lee.md` with `type: person`, `org: acme`, `role: Programme lead`, `aliases: [S. Lee]`, title `# Sam Lee`, when `brain lint` runs, then it passes with no finding for that file.
- F1.2 Given `people/sam-lee.md` with `type: note`, when `brain lint` runs, then it reports `frontmatter/bad-value` for the type, exit 1.
- F1.3 Given a brain with `people/sam-lee.md` (description `Programme lead at acme`, org `acme`, updated 2026-11-11) and a `knowledge/` note, when `brain index` runs, then the generated block has a `## People` section after the `## Knowledge` section containing exactly the line `- [Sam Lee](/people/sam-lee.md): Programme lead at acme (acme, updated 2026-11-11)`; a brain without any `people/` file gets no People section.
- F1.4 Given files under `outbox/team/` (`audience.md`, a package, `manifest.md`), when `brain index` and `brain lint` run, then none is listed in the index, none is classified as a note, there is no notes map for `outbox/`, and lint applies only its generic check (non-empty `type`) to them. `type: audience` and `type: outbox` are valid there. Given a file under `outbox/` with an empty `type`, lint reports `okf/type-missing`. This is existing behaviour; the scenario is a regression test and needs no CLI change.
- F1.5 Given a person note with no `role` or an empty `role`, when `brain lint` runs, then it reports `frontmatter/missing-key` for `role`, severity error, exit 1.
- F1.6 Given the template `AGENTS.md` and `template/templates/project.md`, then the `AGENTS.md` writing rules say a project's `## People` entries link to `/people/<slug>.md` instead of repeating role text, and `project.md` contains `/people/<slug>.md`.
- F1.7 Given `brain init`, then the new brain contains `templates/person.md` with keys `type: person`, `role`, `aliases`.

Testability: unit. Tested on its own by building a temporary brain in `os.tmpdir()` in the style of `test/cli.test.mjs` (F1.1 to F1.5, F1.7) and by text assertions on the two template files in `test/init.test.mjs` (F1.6); shows the expected exit codes, index text and lint output.

### F2. Outbox: audiences, barrier and approval (P2)
Why: removes the leak risk. Without a single guarded path, sharing means copying out of private notes by hand; without a defined audience, each outlet needs its own hand-made setup.

Story: As the owner, I want to define an audience once and then name an audience and a scope and get back a proposal of only safe, rewritten items that I approve one by one, so that nothing private reaches that audience.

Delivers: the `outbox` skill `template/skills/outbox/SKILL.md` (new) and its prompt copy `template/.github/prompts/outbox.prompt.md` (new), `template/templates/audience.md` (new), and the `## Outbox` and `## Outbox rules` sections plus the `outbox/<audience>/` Layout row and the `audience` and `outbox` frontmatter entries of `template/AGENTS.md`.

Scenarios:
Inputs
- F2.1 Given no audience in the request ("stage an update"), when the `outbox` skill runs, then it asks which audience and writes nothing; it never infers one.
- F2.2 Given audience `steering` and no `outbox/steering/audience.md`, when the skill runs, then it offers to create it from `templates/audience.md` and stops until the file exists.
- F2.3 Given an `audience.md` with any of these, the skill stops, names the problem and writes nothing: `audience` differing from the folder name; `space`, `rank` (not a positive integer) or `roles` missing; `brain.org` being `personal`, missing or more than one org; a `brain.members` slug without a person note; a member whose person note has an `org` different from `brain.org`; `brain.receives` missing or empty; a `receives` entry not in the content class list or not in the global allowlist (rule 1), since an audience can only limit, never widen.
- F2.4 Given audience `team` and no scope, when the skill runs, then it asks for a scope (a project slug, specific notes, a meeting, or "since last run") and writes nothing. "Since last run" means log entries dated, and notes whose `updated` is, on or after the frontmatter `approved` date of the newest package of that audience (ties: the package holding the highest manifest id). Content dated the same day as that `approved` date is therefore included, and the resulting duplicates are removed by the skip rule: candidates that restate an item (the skill's judgement of meaning, not a text or id match) already in a package of that audience are skipped. A fully withdrawn package still counts as a run. A run that approves nothing leaves no package and does not count. With no package yet, the skill asks for an explicit scope.

Barrier
- F2.5 Given a project note in scope with a bare line "Go-live moved to 2026-03-10" and a line "Sam is too defensive on scope", when the skill proposes, then the date is a proposed Dates item, rewritten, and the second line is held back as "opinion about people" (counted, not quoted).
- F2.6 Given a source note of org `other` and audience org `acme`, when it is in scope, then it is not read and the report says "other org, skipped".
- F2.7 Given a note in `.confidential/` in scope, then it is not read and the report says "confidential, skipped". Given an `inbox/` note in scope, then it is not read and reported "inbox, skipped".
- F2.8 Given a note with `status: draft` or `status: deprecated` in scope, then it is held back unless the owner clears it explicitly; notes with `status: stable` or no status pass normally. Given a `personal` note, then only items the owner clears one by one are considered. Release is per run and per item, given in the conversation; it is never stored (not in the note, the manifest or `AGENTS.md`), so the next run asks again.
- F2.9 Given `people/sam-lee.md` whose body says "avoid raising budget before noon", when the audience includes Sam, then the proposal uses only the header (the frontmatter and the title line; here `role`, and the name only because Sam is a member); the skill reads nothing below the title line, and no text from there appears in any proposal or file.
- F2.10 Given a log bullet `Inferred: Lea will own the migration`, then it is held back as "speculation". Given a bullet `Said(Lea): we agreed to freeze scope on 2026-02-01`, then it may pass only as "Scope freeze on 2026-02-01 (agreed)", restated, never as a quote of Lea.
- F2.11 Given an action whose owner was inferred, when it is proposed, then the Owner field is empty with `?`; a missing due date is empty with `?`.
- F2.12 Given `## Outbox rules` in `AGENTS.md` blocking the term `Zeta Corp`, and candidates containing "zeta corp" in any case, then the items are held back as "blocked term". Matching is case-insensitive on whole phrases (word boundaries): "Zeta Corporation" does not match, so the owner lists the variants to catch. Titles, item text, source refs, file names and purpose lines are all scanned. Given an `## Outbox rules` entry that tries to allow a held-back class, then it is ignored and the owner is told at the start of the run, before the proposal.
- F2.13 Given a candidate with a run of 12 or more consecutive words shared with a brain note (compared after lowercasing and removing punctuation and markdown markup), then the skill rewrites it; no item in the proposal or in written files contains such a run.
- F2.14 Given a candidate naming "Lea Park", who is neither a member nor an action owner, and `people/lea-park.md` with `role: Finance contact`, then the item says "Finance contact" and not the name. The `role` of any person note may be used for anyone; the name only for audience members and action owners. Given a name with no person note, or a note with no role, see the names rule in F2.15.
- F2.15 Given a candidate containing "between us", "my take" or "worried", then it is held back. Rule for names, stated once: a name with no person note, or whose person note has no role, sends the item to needs decision; a name with a person note and a role is rewritten to that role as in F2.14. Given commercial or contractual matters (prices, rates, contract terms, budgets of a supplier or employer), then they are held back. Given any other money, also inside an allowed class such as a metric ("cost per request 4 EUR"), then the item goes to needs decision. "Delivery moves by 10%" or "3 workshops" is not money.
- F2.16 Given an item without a source ref (meeting or thread plus date), then it is not proposed.
- F2.29 Given roles: a person's role is read only from the person note's `role`, never from a project's `## People` text; a project line "Sam, programme lead" gives no role if `people/sam-lee.md` has none.

Rank flow
- F2.26 Given space `launch` with `steering` (rank 2) and `team` (rank 1), and a decision "Scope frozen from 2026-02-01" in a `steering` package and in no `team` package, when the skill proposes for `team`, then a candidate restating it (the skill's judgement of meaning, not a text or id match) is held back as "higher rank only" (counted, not quoted). Given an item in a `team` package, when the skill proposes for `steering`, then a candidate restating it may be proposed. Given audiences in different spaces, no flow rule applies. Source notes carry no rank.

Approval, self-check and writing
- F2.18 Given 5 passing items and the owner approves items 1, 2 and 4, then the skill writes `outbox/team/2026-11-11-launch-update.md` with only those 3 items under their sections (Decisions, Actions, Dates, Context, Open questions, Files, only sections that have items) and adds 3 manifest entries with status `approved`; unapproved items appear nowhere on disk. The package `<slug>` is the scope name (project slug, or the meeting topic slug); for a scope of several projects it is the project slugs joined with `-` (for example `launch-pilot`); the owner may change it at approval (here `launch` became `launch-update`); if the file exists the skill adds `-2`, `-3`; it never overwrites. First run for an audience creates `manifest.md`; ids continue from the highest existing id. Context items are grouped under the audience's `context_sections` in order; with none given there is one Context section.
- F2.17 Given a run with 5 passing items, 3 held back (2 "opinion about people", 1 "speculation"), 1 needs decision and 2 not relevant to the audience, when the skill presents, then it shows the 5 rewritten items, the held-back list as categories and counts only, the needs-decision list and the line "not relevant to <audience>: 2"; it has written nothing yet.
- F2.19 Given an approved Actions item, then it is written as `Title | Owner | Due | Source`, for example `Send test plan | Sam Lee | 2026-11-20 | Launch sync 2026-11-10`. The Owner field holds the person's display name, taken from the title line of the person note's header, not the slug.
- F2.20 Given the owner selects a binary for the audience, then it is an item (class `files`) with an id and a manifest row, copied to `outbox/<audience>/files/` and listed in the package's Files section with a one-line purpose. It may only be chosen from outside `.confidential/` and `inbox/`, from a location belonging to the audience's org; its file name and purpose line pass the blocked-term and path checks. Its content is not inspected: the skill says so when the owner selects it, and selecting it is the owner's acceptance. Unselected binaries are never copied.
- F2.27 Given the owner approved 4 items and one has the source ref `projects/launch.md`, another contains `zeta corp`, another repeats a 12-word run of a source note, when the skill runs the self-check, then it checks every approved item, title, source ref, file name and purpose line for brain file paths (`projects/`, `logs/`, `knowledge/`, `people/`, `inbox/`, `.confidential/`), blocked terms and 12-word overlap; the 3 hits are dropped from the write and reported by category ("path", "blocked term", "overlap"); the clean item is written; the owner may approve a rewritten version, which is checked again.
- F2.21 Given any completed run in the fixture, when `outbox/` is searched by grep for the seeded blocked term and for the brain file paths, then there are no matches.
- F2.28 Given an `audience.md` with a `target: {…}` block and extra top-level keys, when the skill edits the file, then the keys other than `type`, `audience`, `space`, `rank`, `approver`, `roles`, `description` and `brain` are neither read, validated nor changed, and are preserved byte for byte.

Audience fit
- F2.22 Given project `launch` (org `acme`) whose allowed content is: three decision lines about one topic ("Scope freezes 2026-02-01", "No new features after the freeze", "Change requests go to steering"), the date "Go-live 2026-03-10", and the action "Send test plan, Sam, due 2026-11-20"; and two audiences of `acme` in space `launch`: `steering` (`receives: [decisions, dates]`, body: decides scope and budget, wants milestones and decisions only, one line each) and `team` (`receives: [decisions, dates, actions]`, body: runs the work, wants actions with owners and due dates). When the skill proposes scope `launch` for `steering`, then the proposal contains only Decisions and Dates items, each one line, and the three decision lines are consolidated into 1 item ("Scope frozen from 2026-02-01; change requests go to steering"); the action is not proposed and the report says "not relevant to steering: 1". For `team`, the proposal also contains the Actions item `Send test plan | Sam Lee | 2026-11-20 | <source ref>`. The skill must consolidate lines it judges to be about the same decision, date or action within one project; "related" is its judgement, tested by the 3 seeded lines becoming 1 item. A consolidated item's source ref lists every meeting or thread it draws on, for example `Launch sync 2026-11-03; Launch sync 2026-11-10`. Every consolidated item still passes the full barrier. Content failing the barrier is held back; content passing it but outside what the audience needs (first `receives`, then the body) is counted only as "not relevant to <audience>: <count>", never written.
- F2.23 Given the template `AGENTS.md`, then its Layout table lists `outbox/<audience>/`, its frontmatter tables list `audience` (shared keys, `brain`) and `outbox` (`audience`, `approved`, `source_refs`; covers packages and `manifest.md`), and it carries a short `## Outbox` section (content leaves the brain only through `outbox/`; an agent asked to share brain content elsewhere points to the `outbox` skill) and an `## Outbox rules` block (may tighten, never loosen).
- F2.24 Given `template/templates/audience.md`, then it holds the shared keys, a `brain:` block with `org`, `members`, `receives`, optional `context_sections`, the line `target: {…}  # owned by the publisher, opaque to the brain`, and a body prompt for detail level, interests and decisions; `template/skills/outbox/SKILL.md` and `template/.github/prompts/outbox.prompt.md` exist with the same body; `brain init` copies `templates/audience.md`.
- F2.25 Given the skill, then its `description` contains the trigger phrases "outbox", "stage for <audience>", "what can I share with <audience>" and "prepare <audience> update", and it finds the brain as in decision 2 of `docs/designs/skills-only.md`.

Testability: unit for F2.23 to F2.25 (an agent following the trigger is manual); manual for all other scenarios. Tested on its own by text assertions in `test/init.test.mjs` and `test/plugin.test.mjs` (F2.23 to F2.25), and by running the skill against `test/fixtures/outbox-brain/` (all other scenarios); shows the expected proposal, report and resulting `outbox/` files per scenario, F2.21 by grep of the fixture's `outbox/`, and F2.22 by running the same scope for both audiences and comparing the proposals. Seeded files serving each group, so each can be run on its own:
- Inputs (F2.1 to F2.4): `outbox/steering/` and `outbox/team/` (valid), plus a copy of `audience.md` with each defect of F2.3 and an audience folder with no `audience.md`; a package in `outbox/team/` for "since last run".
- Barrier (F2.5 to F2.16, F2.29): `projects/launch.md`, `logs/launch.md`, `projects/supplier.md`, `.confidential/n.md`, `inbox/c.md`, the three `knowledge/` notes, and the `people/` notes.
- Rank flow (F2.26): `outbox/steering/` with its package holding the scope decision, and `outbox/team/`.
- Audience fit (F2.22): `projects/launch.md` with `outbox/steering/` and `outbox/team/`.
- Approval and writing (F2.17 to F2.21, F2.27, F2.28): `projects/launch.md` for the items, the two binaries for F2.20, and the `target:` block of `outbox/team/audience.md` for F2.28.

The fixture brain seeds:

| Seeded file / item | Serves |
|---|---|
| `projects/launch.md` (acme): date, action, 3 decision lines, "defensive" opinion line, price line, "cost per request 4 EUR", a 12-word sentence | F2.5, F2.13, F2.15, F2.22 |
| `logs/launch.md`: `Inferred:` and `Said(Lea):` bullets, a `Zeta Corp` bullet in mixed case | F2.10, F2.12 |
| `projects/supplier.md` (org `other`); `.confidential/n.md`; `inbox/c.md` | F2.6, F2.7 |
| `knowledge/draft.md` (`status: draft`), `knowledge/old.md` (`deprecated`), `knowledge/plan.md` (`stable`) | F2.8 |
| `people/sam-lee.md` (private body line), `people/lea-park.md` (role), a name with no person note | F2.9, F2.14, F2.15, F2.29 |
| `outbox/steering/` (rank 2, `receives` set, package with the scope decision) and `outbox/team/` (rank 1, `target:` block) in space `launch` | F2.3, F2.22, F2.26, F2.28 |
| a binary in `knowledge/` and one in `.confidential/` | F2.20 |

### F3. Withdraw, publish handback and trace (P3)
Why: closes the loop. The owner needs to retract a shared item and to see in the private log what went out and what the publisher did, without storing private paths in the outbox.

Story: As the owner, I want shared items logged privately and retractable, so that I can audit what left the brain without exposing private note names.

Scenarios:
- F3.1 Given approved items #4 to #6 from package `2026-11-11-launch-update.md` drawn from project `launch`, when the skill finishes writing, then `logs/launch.md` gets under the `## 2026-11-11` heading (created at the top if missing) the bullet `Done: shared with team: #4-#6 (2026-11-11-launch-update.md) from /projects/launch.md, /knowledge/launch-plan.md`, where `team` is the audience slug and the source note paths are root-relative; no file under `outbox/` contains those paths.
- F3.2 Given items from two source projects, then each project's log gets its own bullet listing only the ids and paths from that project.
- F3.3 (The publisher, or the owner by hand, edits `manifest.md`; the skill only reacts on its next run and never contacts an outlet.) Given the publisher set items #4 to #6 to `published` with a date and an `Outlet ref`, when the skill runs next for that audience, then it finds the source projects of those ids by searching `logs/*.md` for `Done: shared with team:` bullets naming those ids, and each such project's log gets the bullet `Done: published to team: #4-#6` under today's `## YYYY-MM-DD` heading (created at the top if missing), once. An id with no such bullet is reported and nothing is logged for it. A repeat is detected by an existing `Done: published to team:` bullet naming those ids in the source project's log; ids already named are skipped.
- F3.4 Given the owner says "withdraw item 5" for an `approved` item, then manifest row #5 stays with status `withdrawn` and the item's line is deleted from the package file, and if that leaves a package section with no items, its heading is removed too; if the package then has no items it keeps only its frontmatter and a line `All items withdrawn`. Given a `published` item, the same happens and the skill also tells the owner to remove it from the outlet, since the outbox cannot recall it.
- F3.5 Given an unknown id or an item already `withdrawn`, then the skill says so and changes nothing.
- F3.6 Given a manifest row with a status outside `approved | published | withdrawn`, then the skill reports it and does not log it as published.
- F3.7 Allowed status transitions are `approved -> published` (by the publisher), `approved -> withdrawn` and `published -> withdrawn` (by the owner). Given any other transition (for example `withdrawn -> approved`), then the skill reports it and changes nothing.

Testability: manual. Tested on its own by running the skill against `test/fixtures/outbox-brain/` after F2 (checking log bullets, editing `manifest.md` by hand to `published` and running again, trying each allowed and one disallowed transition); shows the log bullets, manifest and package changes above. Per scenario group, the seeded file that serves it:
- Trace (F3.1, F3.2): `projects/launch.md` plus a second seeded project, with an approved package.
- Handback (F3.3, F3.6): a manifest row set to `published` whose id has no `Done: shared with` bullet in `logs/*.md`; a manifest row with status `draft`.
- Withdraw and transitions (F3.4, F3.5, F3.7): one `approved` and one `published` row in `outbox/team/manifest.md`, plus an already `withdrawn` row.

### F4. Packaging: six skills (P4)
Why: the skill must ship the same way as the other five and the repository's counts and tests must stay true.

Story: As a plugin or template user, I want the `outbox` skill installed like the others, so that it works in every client.

Scenarios:
- F4.1 Given the change, then `npm test` passes `test/plugin.test.mjs` with `SKILLS` equal to `['agenda', 'aware', 'drop', 'outbox', 'sync', 'triage']`.
- F4.2 Given `npm run build:plugin`, then `plugin/skills/outbox/SKILL.md` exists.
- F4.3 Given the change, then each of these names `outbox` and says six skills: `README.md` (the line saying the plugin holds five skills), the `package.json` description, the skills row of the Layout table in `template/AGENTS.md`, the skills row of the Layout table in `docs/spec.md`, `docs/plugin.md`, the plugin description in `scripts/build-plugin.mjs` (and so the built `plugin/.claude-plugin/plugin.json`), and the description in `.claude-plugin/marketplace.json`.

Testability: unit. Tested on its own by `node --test` on the extended `test/plugin.test.mjs` (build into a temporary directory, assert the file and the list) and by text assertions on the files named in F4.3; shows a passing run and the text "six skills" in each file.

## Success criteria

- SC1 In the fixture run with at least 10 seeded private items (opinions, an inferred owner, a blocked term, a confidential note, another org's note, a person-note body line), the self-check runs and reports, and the written files contain 0 of the seeded private items (checked by grep in the manual run).
- SC2 In the same run, the written files contain 0 brain file paths and 0 runs of 12 or more consecutive words copied from a brain note (checked by grep in the manual run).
- SC3 100% of items in a package have an id, a manifest row and a source ref.
- SC4 No item reaches disk without an explicit per-item owner approval in the same run.
- SC5 `npm test` passes with six skills and `brain lint` exits 0 on a brain containing `people/` and `outbox/` files.
- SC6 For the same scope proposed to two audiences with different `receives` and bodies, 100% of items in each proposal fall in a content class that audience receives, and the 3 seeded related lines appear as 1 item.
- SC7 In the fixture, 100% of candidates restating an item of a higher-rank audience of the same space, and not shared with the proposing audience or a lower-rank one, are held back as "higher rank only".

## Interfaces and data

- Person note (`people/<slug>.md`, new folder): frontmatter `type: person`, `description`, `tags`, `org`, `updated`, `role` (one line, required), optional `aliases` (list). Title line `# Full Name`. The header is the frontmatter plus the title line; everything below the title line is private. One note per person per org.
- Audience (`outbox/<audience>/audience.md`), three ownership zones:
  ```yaml
  type: audience
  audience: team            # equals the folder name
  space: launch
  rank: 1                   # positive integer
  approver: Programme lead  # optional, informational for the publisher
  roles: [Programme lead, Finance contact]
  description: ...
  brain:                # owned by the brain, ignored by publishers
    org: acme
    members: [sam-lee]      # never published
    receives: [decisions, dates, actions]
    context_sections: [Background, Glossary]   # optional
  target: {…}  # owned by the publisher, opaque to the brain
  ```
  1. Shared keys (owned by the brain, readable by any publisher): `type`, `audience`, `space`, `rank`, `approver`, `roles` (informational: the list of role names used to attribute decisions and responsibilities; the skill checks it is a list and does not validate it against members' person notes), `description`, `approver` (optional, informational for the publisher; the skill does not act on it).
  2. `brain:` (owned by the brain, ignored by publishers): `org` (exactly one org, never `personal`), `members`, `receives` (required; a subset of the global allowlist; calibrates the barrier per audience), `context_sections` (optional ordered section names; with none, one Context section).
  3. Any other top-level key (for example `target:`) belongs to another tool: the brain never reads, validates or changes it and preserves it byte for byte on edit.
  The body says in prose what the audience needs (detail level, interests, what it decides); rule 10 reads it. Never holds blocked terms.
- Content classes in `receives`, mapped to allowlist rule 1: `decisions` = decisions; `dates` = dates and milestones; `actions` = actions (owner, due); `definitions` = definitions and glossary; `roles` = roles and responsibilities by role; `metrics` = metrics and their definitions; `cadence` = agreed cadence; `open-questions` = open questions about the shared work; `links` = links to already-shared materials; `files` = owner-chosen files (rule 12). Context items are items of the classes `definitions`, `roles`, `metrics`, `cadence`, `links`.
- Package (`outbox/<audience>/YYYY-MM-DD-<slug>.md`): `type: outbox`, `audience`, `approved` (date), `source_refs` (meeting or thread plus date, never paths). Sections as in F2.18; each item carries its id. The Actions line is `Title | Owner | Due | Source`; Owner is the person's display name, taken from the title line of the person note's header.
- Manifest (`outbox/<audience>/manifest.md`): `type: outbox`; table `ID | Item | Package | Status | Date | Outlet ref`; Status `approved | published | withdrawn`.
- Binaries: `outbox/<audience>/files/`.
- Invariant: every file under `outbox/<audience>/` is safe to share with that audience, manifest included. `outbox/` is tracked by the brain's git history, is not a note folder, and is not indexed.
- Publisher contract: reads only `outbox/<audience>/`; publishes only `approved` items; sets `published`, date and `Outlet ref` in the manifest; should run its own check again (defence in depth). The format does not depend on which publisher exists.
- Barrier rules (the `outbox` skill obeys these; rules 1 to 9, 11 and 12 are the barrier, 10 is fit, 13 the self-check):
  1. Allowlist: only decisions; dates and milestones; actions (owner, due); definitions and glossary; roles and responsibilities by role; metrics and their definitions; agreed cadence; open questions about the shared work; links to already-shared materials; owner-chosen files (rule 12). Everything else is held back. For one audience, `receives` limits this list.
  2. Always held back, for any audience: opinions, readings or calibrations of people; stakeholder dynamics and politics; talking points, meeting prep, negotiation or positioning notes; commercial and contractual matters (prices, rates, contract terms, budgets of a supplier or employer); anything about another org; capacity, staffing, handover, career or personal matters; speculation or inferred facts presented as fact (including inferred owners); raw transcripts and verbatim quotes of individuals.
  3. Never read: `.confidential/`; `inbox/`; anything below the title line of any person note (only its header, the frontmatter and the title line, is read); `status: draft` and `status: deprecated` notes unless cleared by the owner; notes of another org; `personal` notes unless cleared one by one. Release is per run and per item, given in the conversation, and never stored.
  4. Provenance: `Inferred:` bullets held back; `Said(Name):` only as a decision or fact restated by role; bare owner facts pass if in an allowed class. Bare lines in project and knowledge notes count as the owner's facts, like bare log bullets.
  5. Rewrite, never copy: no run of 12 or more consecutive words shared with a brain note, compared after lowercasing and removing punctuation and markdown markup. A person's name (the note's title) appears only for audience members and action owners; the `role` of any person note may be used for anyone; no person note or no role means needs decision. Roles are read only from person notes' `role`, never from project `## People` text.
  6. Unknown is `?`; never guess.
  7. Every item has a source ref.
  8. `## Outbox rules` in `AGENTS.md` may add blocked terms (matched case-insensitively as whole phrases) and held-back classes, never loosen rules 1 to 7.
  9. Scan every candidate for names with no person note or no role (needs decision), sentiment about people, money (any other amount of money goes to needs decision; commercial matters are held back), blocked terms, and markers such as "private", "internal", "between us", "my take", "I think", "worried", "politics". Titles, item text, source refs, file names and purpose lines are all scanned.
  10. Fit (after the barrier; only limits, never widens): from the content that passed the barrier, keep first what `brain.receives` allows, then what the body of `audience.md` says the audience needs (detail level, interests, what it decides). The skill must consolidate lines it judges to be about the same decision, date or action within one project into one item with one source ref. The rest is "not relevant to <audience>: <count>", separate from held back.
  11. Rank flow: when proposing for audience A of space S, compare each candidate with the packages of every audience of S with a higher rank than A; a candidate that restates an item (the skill's judgement of meaning, not a text or id match) shared there and not with A or a lower-rank audience is held back as "higher rank only". Audiences of different spaces: no rule.
  12. Binaries: an item (class `files`) selectable only from outside `.confidential/` and `inbox/`, belonging to the audience's org; content not inspected (F2.20).
  13. Self-check: after approval and before writing, scan every approved item, title, source ref, file name and purpose line for brain file paths, blocked terms and 12-word overlap with its source notes; a hit drops the item from the write and is reported by category; the owner may approve a rewritten version (F2.27).
- Log bullets: see F3.1 and F3.3.
- CLI: `NOTE_FOLDERS` in `src/notes.mjs` gains `people: 'person'`; `src/index.mjs` renders a `## People` section; `src/lint.mjs` treats `people/` like other note folders and requires `role` for `type: person`. No other CLI change: `outbox/` is not in `NOTE_FOLDERS`, so it already gets only the generic non-empty `type` check.
- New files: `template/skills/outbox/SKILL.md`, `template/.github/prompts/outbox.prompt.md`, `template/templates/person.md`, `template/templates/audience.md`.

## Decisions

- The outbox is the only path out of the brain, and everything in it is shareable. Brain source paths are therefore not stored there; the audit trail lives in the private project log. Rejected: a source column in the manifest, because it would reveal private note names to a publisher with read access to the folder.
- Release is per run plus the rank rule: the owner picks scope and approves item by item, and an item flows only to audiences of equal or higher rank in the same space. Rejected: a `share: [audience]` key on notes, because it adds grammar and the owner wants the lean version first; rank covers same-org separation.
- Audience fit is a second step after the barrier, driven first by `brain.receives` and then by the free-text body of `audience.md`; "not relevant" is counted apart from "held back" because such content is safe, only not needed. Rejected: further structured fit keys in frontmatter, because the owner writes the audience's needs in prose and the skill can read it.
- `audience.md` has three ownership zones (shared keys, `brain`, anything else owned by another tool). Rejected: one flat key set read by everyone, because the brain would need to know outlet details; rejected: the brain validating `target`, because it would couple the brain to each publisher.
- `receives` can only limit the global allowlist. Rejected: letting an audience widen it, because the barrier would then differ per file instead of being one rule.
- No lint rule for `outbox/`; the skill runs a self-check (rule 13) instead. Rejected: a lint `outbox/leak` rule, because the CLI often cannot run where the skill runs, and the owner chose the self-check only.
- Allowlist barrier, not blocklist. Rejected: a blocklist, because anything unforeseen would leak.
- Nothing unapproved is ever written, so there is no `staged` status on disk. Rejected: staging files in the outbox, because they would break the invariant.
- Blocked terms live only in `AGENTS.md` `## Outbox rules`. Rejected: putting them in `audience.md`, because the outbox must stay shareable.
- The person note's header (frontmatter and title line) is shareable and the body below it private. Rejected: sharing bodies, because they hold readings of people.
- Packages are tracked by the brain's git history, for audit. Rejected: ignoring `outbox/`.
- The skill does not format for outlets. Rejected: laying out in the skill, because the publisher handles it.
- Skills are prose; the file and CLI parts are covered by repo tests, the behaviour by a run against a fixture brain.

## Assumptions

- One person note per person per org. If wrong: people who span orgs need a `personal` person note linked from both.
- Publishers can edit `manifest.md`. If wrong: the owner tells the `outbox` skill that items are published and it updates the manifest.
- 12 words is the right verbatim threshold. If wrong: tune the number.
- Content imported from an outlet will be tagged by its importer. If wrong: a later version adds echo protection.
- A withdrawn line stays in the brain's git history (local, never pushed); accepted. If wrong: the owner rewrites the history by hand.
- Ranks within a space are set consistently by the owner. If wrong: the "higher rank only" hold-back is wrong for that space until the ranks are fixed.

## Dependencies

No external dependencies; F2 needs F1's `people/` folder and person notes.

## Review

- Round 1 (2026-11-11): paraphrase context missing, 0 divergences, 15 guesses; critic B0 M11 N4; readiness B0 M7 N3. Fixed 37, rejected 0, escalated 1, dropped 1 nit (C1-13). Not run: none.
- Round 2 (2026-11-11): paraphrase context missing, 0 divergences, 10 guesses; critic B0 M0 N0, 2 of 25 earlier findings still open plus 1 open nit; readiness B0 M0 N0, same open items. Fixed 12, rejected 0, escalated 0, dropped 1 nit (C1-13). Not run: none.
- Clarification (2026-11-11): What does `rank` mean? Answer: a trust level within a space; items flow only to audiences of equal or higher rank in the same space. Changed: Terms, F2, Interfaces, Decisions, Assumptions.
- Clarification (2026-11-11): Should anything beyond the skill check the outbox mechanically? Answer: skill self-check only, no lint rule. Changed: F2, Success criteria, Decisions.
- Clarification (2026-11-11): How should the audience definition support outlet-specific setup? Answer (owner's added requirement): three zones, shared keys (`audience`, `space`, `rank`, `approver`, `roles`), the `brain:` block, owned by the brain (`org`, `members`, `receives`, `context_sections`), that calibrates the barrier per audience, and any other key such as `target` owned by the publisher and opaque to the brain. Changed: Terms, F2, Interfaces.
- Accepted risk: R1-6: barrier behaviour (F2, F3) is verified by manual runs against the fixture brain, not by unit tests over a recorded outbox. Why: the behaviour is a model following prose; a test over a hand-recorded outbox would test the recording, not the skill, and the owner chose the skill's self-check over any mechanical check.
- Fixes after round 2 (unreviewed): P2-1 to P2-11 and R1-5.
- Approved (2026-11-11): "I approve this spec", 2026-11-11.
- Change with owner consent (2026-11-11): aligned F2.9, F2.18, F2.19, F2.28, F3.3, F3.4 and rule 3 with clarifications found in the manual run of the outbox skill. Owner: "Yes, align the spec". Changed: Terms, F2, F3, Interfaces, Decisions.
- Change with owner consent (2026-11-11): renamed the brain-owned audience key to `brain:` and reworded dummy names and some terms for the public-repo leak gate. Owner chose "Reword all, squash". Changed: Terms, F2, F3, Interfaces, Decisions, Review.
