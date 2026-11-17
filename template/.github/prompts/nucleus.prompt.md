---
name: nucleus
type: prompt
description: Find the smallest answer, decision or action that gets one thing moving. Run with /nucleus.
agent: agent
tools: ['search/codebase', 'edit/editFiles']
---

# Nucleus

**Works on:** One named thing. **Question:** What is the smallest unblocker?

For one thing in front of the owner, ask one question first: what is the smallest answer, decision or action that gets this moving? The owner names it, gets it and starts. Everything else waits.

The nucleus is the smallest unblocker for the next piece of work. It belongs to one window: the time until the owner's next chance to ask. A candidate is the nucleus when it passes one test: "If I had only this, could I start?"

Run this skill only when the owner asks for it. Never start it on your own for a meeting prep or a task. It works on one thing at a time.

Find the brain first. Use the brain folder named in your session context, if there is one. Otherwise use the folder the user shared or named in this conversation that has an `AGENTS.md` at its root. Otherwise use the `BRAIN_DIR` environment variable if it is set, then `$IONIAN_HOME/brain` if `IONIAN_HOME` is set, then `{{BRAIN_DIR}}`. Below, `<brain>` is that folder. If no folder with an `AGENTS.md` is found, say so and point to https://github.com/ionianlabs/brain to set one up. Then stop.

## Inputs

- The thing at hand: a problem, a task, a meeting or a decision. If the owner named none, ask what it is about and print nothing else.
- For a meeting: who, when and how many minutes.
- The window. If the owner did not say, ask once. Without an answer, assume "until the next touch point".
- What is already known. If the thing belongs to a project, read `<brain>/projects/<slug>.md`, and open a note from its notes map only when the note's description matches the thing. Read no other project and nothing of another org. If the thing has no project, read no brain file beyond `AGENTS.md` and work from the conversation.

## Layer 1: the frame

Always run it, before anything else. It takes about a minute.

1. Name the nucleus. It is one of four kinds:

| Kind | Example | Route |
|---|---|---|
| fact | Which date is the go-live? | Ask whoever holds it, today |
| their decision | Which of two scopes does the sponsor want? | Put it into the next touch point |
| my decision | Which of two orders to use | Decide now, move on |
| first action | Send the draft for review | Do it |

2. Test it: "If I had only this, could I start?" If no, keep reducing. If yes, everything else is parked. If no candidate passes, say so and offer the Shell tool. Do not invent a nucleus.
3. Check the ground. A fact from the notes is a candidate, not a given. When the nucleus or the plan rests on an `Inferred:` bullet, on a note with `status: draft` or `deprecated`, or on a note whose `stale_after` has passed, mark it "to verify" in the output and do not build on it.
4. Ask the safety question, once: "What don't I know that I should?" The frame only finds gaps the owner already sees. You may add at most three gaps you see yourself, each marked as your own reading.
5. Park the rest. List what is deliberately left for later. To park is to decide, not to forget.

Print exactly these five lines, with one nucleus:

```
Nucleus: <the unblocker>
Kind: fact | their decision | my decision | first action
Holder: <who has it, or "me">
Parked: <what waits>
Situation: <the kind of situation, in general words>
```

- `Holder` is never empty: a name, a role, `me`, or `?` when unknown. An unblocker without a holder is not actionable, so `?` makes finding the holder the nucleus.
- `Situation` says what kind of situation this was, in general words, with no name of a person, org or project. For example "short slot with a senior person" or "stuck on a large task".
- The frame alone writes nothing and keeps no state.

Then stop, or offer one tool of layer 2 by name in one line when the case fits.

## Layer 2: the toolkit

Never start layer 2 unasked. Offer it, name the tool that fits, and let the owner decide. Use it when the frame gives no clear answer, or when the nucleus sits with people who have little time. The tools are independent, not a sequence. Run only the ones the case needs.

| Tool | Use it when | What it does |
|---|---|---|
| Shell | The nucleus cannot be named | Draft the deliverable as a skeleton. Mark each line fixed, assumption or open. The open lines are the candidates |
| Walk-through | There are assumptions, but it is unclear which carry weight | Act as if every assumption were true and walk through the result. Where it breaks, the assumption is load-bearing |
| Filters | There are too many candidates | Keep a question only if someone else must answer it and a wrong guess costs more than waiting for the next chance to ask. The longer the window, the lower that bar. A new question displaces an old one |
| Routing | Candidates are of mixed kinds | Facts go to whoever holds them, outside the meeting. The owner's own decisions go to parked. Only decisions by others take meeting time |
| Dependency order | Questions build on each other | Never ask a question before the one it depends on is answered |
| Question forms | There is one chance to ask | `open` where the answer belongs to the other side. `choice` with a stated lean where the owner proposes. `confirm` where only a yes is needed |
| Pre-mortem | Risks are unknown | "It is the day after and it went badly. What happened?" |
| Catch-all | Always, as the last question | "What do you know about this that I don't?" |
| Touch points | Not everything can be answered at once | Spread the questions over the meetings available: why first, how second, what last. The form narrows each time from open to choice to confirm |
| Meeting fit | Time is short | A timebox per question, a fixed order, a hard switch point, a fallback if the meeting is cut, and a read-back of the answers at the end |

The result is one prep note, printed in the chat:

- the shell, if one was built;
- the questions in order, each with form, time and the status `open`. At most five questions, then the catch-all;
- the facts to chase elsewhere, each with its holder;
- the parked list;
- the fallback if the touch point is cut short.

Do not raise a request that depends on an unanswered question. Get the answer first, then the request follows from it.

## Saving the prep note

Only when the owner asks, for example "save it". Write exactly one capture following `<brain>/templates/capture.md`, to `<brain>/inbox/YYYY-MM-DD-nucleus-<slug>.md` with today's date and a short kebab-case slug. If the name exists, append `-2`, `-3`. Never overwrite a file.

- Frontmatter: `type: capture`, `source: chat`, `tags` with `nucleus`, `description` in one line, `updated` today. `org` is the project's org, or `unknown` when there is no project. Never guess an org.
- Body: `# <Title>`, the five lines of the frame, then the prep note. Each question is one line that ends with its status. Text you added as your own reading carries `Inferred:`.
- No index line and no other write. `triage` places the capture later.

## The loop

A nucleus does not end with the question. When the owner comes back after the touch point or the first action ("close the nucleus", or the answers themselves), close the loop before any new work:

1. Record. Write each answer against its question, with the status `answered`, `partly` or `open`. An answer given by someone else carries `Said(Name):`.
2. Check. Did an answer change an assumption the plan was built on? If so, name what has to change.
3. Release. List what was parked and is now unblocked.
4. Next nucleus. Run the frame again on the new state. The result is the nucleus for the next window.

Where the loop keeps its state:

- Frame only: nowhere. The owner says what happened and you run the frame again.
- A saved prep note that is still in `<brain>/inbox/` with the tag `nucleus`: on the owner's request, update that one file with the answers and statuses.
- A prep note that was never saved, or that `triage` has already placed: print the result in the chat. On request, write it as one new capture as above. Do not edit the placed note.

A nucleus is closed when the work it blocked has started. Say so, and point to `sync` to carry the outcome into the project log.

## Rules

- Run the frame first, every time. One nucleus by default.
- Never start layer 2 unasked. At most five questions.
- Read-only unless the owner asks to save. Then write only a capture in `inbox/`. Never edit a project file, a log or a knowledge note.
- Never contact anyone and never send anything. Asking the holder is the owner's act. Sharing anything goes through the `outbox` skill, which holds back prep notes.
- Stay inside the org of the project you were asked about. Never mix one org's details into another's.
- Never write secrets: passwords, tokens and keys never go into a capture.
- Never open `.confidential/`. Do not read `inbox/`, except a prep note of this skill that the owner asks you to close.
- This is not a planner. Produce no agendas, timelines or task lists, and do not rank a backlog.
- Never guess. Unknown is `?`.

## Example

The owner says: "nucleus: I have ten minutes with the sponsor of launch on Thursday". The project file of `launch` says the pilot scope is open, and holds the bullet `Inferred: go-live is in March`.

```
Nucleus: Does the pilot cover one region or all of them?
Kind: their decision
Holder: the sponsor
Parked: the test plan, the training dates, the go-live date (to verify, it is inferred)
Situation: short slot with a senior person
```

Then one line: "Ten minutes and one chance to ask: I can run Question forms and Meeting fit to shape the questions. Say so if you want that."
