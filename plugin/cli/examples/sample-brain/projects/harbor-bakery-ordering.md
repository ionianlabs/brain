---
type: project
description: Online ordering page for Harbor Bakery, with pickup slots
tags: [web, ordering, bakery]
org: client-a
updated: 2026-11-01
phase: active
focus: Order form on staging, pickup rules and emails
---

# Harbor Bakery online ordering

History: [log](/logs/harbor-bakery-ordering.md)

<!-- brain:notes start -->
Notes (open one only when the task needs it):

- [Harbor Bakery ordering plan](/knowledge/harbor-bakery-ordering-plan.md): What comes after launch for Harbor Bakery ordering, and when each item moves into Open
<!-- brain:notes end -->

## Now

- The order form is live on staging with pickup slots.
- Orders are sent to the bakery by email. There is no payment step yet.
- The menu comes from one JSON file that Mara edits with Theo.
- Launch target is the week of 2026-11-16.

## Open

- [ ] Confirm the cutoff time for next-day orders (owner: Mara, due: 2026-10-30)
- [ ] Send a test order confirmation through staging (owner: Theo, due: 2026-11-04)
- [ ] Add allergen labels to the order form (owner: Theo, due: 2026-11-05)
- [ ] Decide whether to take card payments at pickup
- [ ] Write a one-page guide for the counter staff (owner: Mara)

## People

- Mara, bakery owner. Decides menu, prices and pickup rules. Ask her about the cutoff.
- Theo, front-end developer. Builds the form and the emails.

## Links

- Staging: https://staging.example.com/harbor-bakery
- Repo: `harbor-bakery-site` (local repo)
- How to write items: [Writing good open items](/knowledge/writing-good-open-items.md)
