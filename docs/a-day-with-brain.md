---
type: guide
description: One normal day with Ionian Brain, from the morning agenda to the next morning's inbox triage.
tags: [guide, workflow, example]
updated: 2026-11-02
---

# A day with Brain

This is one ordinary day, using the [sample brain](../examples/sample-brain/index.md). The projects, people and dates are made up. The habits are the ones I use.

## 08:30, the agenda

I open my agent in `~/Ionian/brain` and say "agenda". It reads the Open section of each project, lists the inbox and edits nothing. It shows at most 5 items per table. This is what comes back.

```
## Agenda, Mon 2 Nov

**2 need you** · 1 coming up · 1 blocked · inbox: 2 captures

### Needs you
| Prio | What | Project | Due | Talk to |
|---|---|---|---|---|
| **p0** | Confirm the cutoff time for next-day orders | harbor-bakery-ordering | **overdue** since 2 Nov | Mara |
| p1 | Approve the homepage layout | tidewater-library | Fri 6 Nov | Lena |

### Coming up
| Prio | What | Project | Due | Talk to |
|---|---|---|---|---|
| p1 | Send a test order confirmation through staging | harbor-bakery-ordering | Wed 4 Nov | Theo |

### Blocked
| What | Project | Waiting for | Talk to |
|---|---|---|---|
| Migrate the event calendar | tidewater-library | the old site export | Jonas |

**Next:** message Mara about the cutoff today.
```

I message Mara about the cutoff. That is the one item I cannot move myself. If I want the long version, I say "agenda everything".

## 10:00, working in a client-a repo

I open the Harbor Bakery repo and tell the agent to read the brain first. It reads `AGENTS.md`, `index.md` and `projects/harbor-bakery-ordering.md`. It does not read the other projects.

So it already knows that orders go by email, that payments wait until after launch, and that allergen labels are due on the 5th. I do not explain any of it. We build the labels.

## 12:40, a thought from the phone

On a walk I think of a "sold out" badge for the form. I do not open a project. I say "drop this: a sold out badge for the form" in whatever chat I am in, or I add a file to the inbox from my phone:

```
inbox/2026-11-02-low-stock-warning.md
```

One line of text is enough. The `org` can be `unknown`. I sort it out later.

## 16:50, the sync

Mara replied: next-day orders close at 14:00. I tell the agent "sync". It shows me the log bullets and the new open items first, and I confirm the batch. It rewrites the state file so it describes the present, then moves the history to the log.

The diff to `projects/harbor-bakery-ordering.md`:

```diff
-updated: 2026-11-01
+updated: 2026-11-02
-focus: Order form on staging, pickup rules and emails
+focus: Test emails, then payment decision
 ## Now
 - The order form is live on staging with pickup slots.
+- Allergen labels show on every menu item.
+- Next-day orders close at 14:00.
 ## Open
-- [ ] Confirm the cutoff time for next-day orders (owner: Mara, due: 2026-10-30)
-- [ ] Add allergen labels to the order form (owner: Theo, due: 2026-11-05)
```

And the new entry at the top of `logs/harbor-bakery-ordering.md`:

```markdown
## 2026-11-02

- Decision: Next-day orders close at 14:00.
- Done: Allergen labels added to the order form.
- Done: Cutoff time confirmed with Mara.
```

The agent then adds the new note's line to the index. Nothing was deleted. The old entries are still below.

## 17:20, switching to client-b

Next I open the Tidewater Library repo. The agent reads only that project's file. It sees no Harbor Bakery notes and does not copy anything across.

This matters even when nobody means harm. If a sync from one client leaks a price, a name or a plan into another client's file, you cannot take it back. So a note in `client-a` never links to a note in `client-b`, and the agent's rules forbid it. Notes in `personal`, like my writing on open items, can be linked from both.

Anything truly private goes in `.confidential/`. Agents leave it alone unless I point them at a note.

## Next morning, triaging the inbox

I say "agenda" again, and then ask the agent to triage. There are three captures. For each one it does three things:

1. Proposes where it goes, and places it with my verdict: an open item with a priority, a log bullet, a knowledge note or a new project.
2. Adds `Triaged capture: <filename>` to that project's log, with any `Said`/`Inferred` bullets of the capture.
3. Deletes the capture file.

The sold out badge goes to Harbor Bakery as an open item. The phone note about low stock is the same idea, so it joins that item. The QR code poster has `org: unknown`, so the agent asks me. I say it is for the bakery counter, and it files it there.

That is the whole day. Most of the value comes from a few phrases, "agenda", "drop", "triage" and "sync", and I say them every day.
