---
name: blind-spots
type: prompt
description: Find what is missing before the dated events of the coming weeks. Run with /blind-spots.
agent: agent
tools: ['search/codebase', 'edit/editFiles']
---

# Blind spots

**Works on:** The dated events of the coming weeks. **Question:** What should exist by now and does not?

A gap analysis from the owner's side. For every dated event ahead, ask one question: which decision, information, input or prep should the owner have received or done by now, and is it in the brain?

This is not a status report. What is on track stays out. `agenda` shows the open items that are already written down. This skill looks for the ones nobody wrote down. Run it only when the owner asks.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Scope

- Horizon: the next 21 days, or the horizon the owner names. Take today's date from the system.
- Projects: every project with `phase: active`, or only the project or org the owner names.
- Only what the owner must push or receive. Leave out commercial, contractual and personal admin matters unless the owner asks for them.

## Steps

1. Read `<brain>/AGENTS.md` and `<brain>/index.md`. Then read each `<brain>/projects/*.md` in scope.
2. Read what carries dates, per project:
   - the plan note `knowledge/<slug>-plan.md`, if there is one;
   - a note from the project's notes map only when its description says it is a plan or a prep for something inside the horizon, and its `stale_after` has not passed;
   - the top of `logs/<slug>.md`: the entries of the last 7 days, never the whole log;
   - the captures in `inbox/`, for dates and promises not yet triaged.
   Open a person note only when an event depends on that person.
3. List, in date order, the dated events inside the horizon: meetings, deadlines, deliveries, handovers and absences. Include the next instance of a recurring meeting.
4. Plan back from each event. Ask what must exist before it:

| Check | Question |
|---|---|
| Decisions | Who decides, and is the decision scheduled before the event? |
| Information | Are scope, length, audience and format confirmed by someone, or only assumed? |
| Inputs | Whose material is needed? Does that person know, and are they there in time? Watch for absences |
| People | Is everyone who presents or decides invited? |
| Prep | Do the agenda, the pre-read or the template exist, and is there a date to send them, usually a day before? |
| Rhythm | Does a recurring meeting fall inside the horizon, and does it collide with a bigger event? |
| Promises | Was a date or a deliverable stated to others, in a log or a note, with no follow-up booked? |

5. Check each candidate against the newest log entries and against `## Open`. Drop it when a decision, a booking or a `Done:` entry covers it. The newest entry wins. Drop it too when it is already an open item with an owner and a due date before the event: that is `agenda`'s job. An open item with no date that an event depends on stays, as a gap.
6. Rank what is left by the date each gap must be closed, earliest first.

## Report

Very short. At most 10 gaps, grouped by when they must be closed. One line each: the gap, why it bites, and by when. Every line names its project. No preamble, no closing summary and no list of what is on track. Use exactly this shape:

```
## Blind spots, Mon 9 Nov to Mon 30 Nov

### Before Thu 12 Nov
- launch: nobody has confirmed how long the review on Fri 13 Nov is. The agenda is built for 60 minutes.
- launch: Sam presents the test plan on Fri 13 Nov and is not on the invite.

### Before the go-live review, Wed 25 Nov
- launch: the scope decision has no date, and the review needs it.

*4 more gaps. Say "blind spots everything" to see them.*
```

- A gap you concluded from an `Inferred:` bullet, or from a note with `status: draft`, says so in the line: "(inferred)".
- When more than 10 gaps qualify, show the 10 with the earliest dates and add the count line. With 10 or fewer, leave it out.
- When nothing qualifies, print one line: "No gaps found in the next 21 days." Do not pad.
- When you could not read a folder, say so. Never write "none" for data you could not get.
- Use no dashes in the report.

Then offer two things, once, in one line: to save the gaps as captures, and to run `nucleus` on a single gap to find the smallest step that closes it.

## Saving the gaps

Only after the owner agrees. Write one capture per org that has gaps, following `<brain>/templates/capture.md`, to `<brain>/inbox/YYYY-MM-DD-blind-spots-<org>.md` with today's date. If the name exists, append `-2`, `-3`. Never overwrite a file.

- Frontmatter: `type: capture`, `source: chat`, `tags` with `blind-spots`, `org` of those gaps, `description` in one line, `updated` today.
- Body: `# Blind spots, <date>`, then one bullet per gap of that org, each with its project and its close-by date. Every bullet carries `Inferred:`, because a gap is your conclusion until the owner confirms it.
- Leave out the gaps the owner dropped. No index line and no other write. `triage` places the captures later.

## Corrections

When the owner corrects a gap (already covered, out of scope, a different meaning), drop it without arguing. Point out a new gap only when the correction itself creates one.

## Rules

- Read-only unless the owner asks to save. Then write only captures in `inbox/`. Never edit a project file, a log or a note.
- Never mix one org's details into another's. A gap line draws only on the notes of its own project's org, and a capture holds the gaps of one org.
- Never contact anyone. Closing a gap is the owner's act.
- Never open `.confidential/`.
- Never write secrets: passwords, tokens and keys never go into a capture.
- Do not invent events or dates. A gap needs a dated event that is written in the brain.
- Never print em dashes or en dashes. Use commas, colons or full stops.
