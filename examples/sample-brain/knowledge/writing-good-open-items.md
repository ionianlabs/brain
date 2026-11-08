---
type: note
description: How to write open items an agent can act on
tags: [habits, open-items]
org: personal
updated: 2026-10-25
---

# Writing good open items

An open item is one line in a project file. A fresh agent should know what to do, who owns it and by when.

## Shape

```
- [ ] Text (owner: Name, due: YYYY-MM-DD)
```

## Rules

- Start with a verb. "Send the test email", not "Email".
- One outcome per item. Split anything with an "and".
- Give a due date only when it is real. A fake date is noise.
- Say why it waits with `blocked: reason`, so the agenda can show it.
- When it is done, move it to the log. Do not tick it in place.
- An item with no owner is fine. It shows up in the agenda as unowned.
