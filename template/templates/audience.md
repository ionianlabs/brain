---
type: audience
audience: <audience-slug>
space: <space-slug>
rank: 1
approver: "<role, for example Programme lead>"
roles: [<role>, <role>]
description: "<one line, no trailing full stop>"
brain:
  org: <org-slug>
  members: [<person-slug>]
  receives: [<class>, <class>]
  context_sections: [<Section>, <Section>]
target: {…}  # owned by the publisher, opaque to the brain
---

<!-- Copy to outbox/<audience>/audience.md. The folder name equals audience.
     rank: positive integer. approver and roles are informational.
     The brain: block is owned by the brain. org is one org, never personal. members are never published.
     receives may only limit the global allowlist. Classes: decisions, dates, actions,
     definitions, roles, metrics, cadence, open-questions, links, files.
     context_sections is optional. target belongs to the publisher. Keep it as it is.
     Never put blocked terms here. -->

# <Audience>

## Detail level

<how much detail this audience wants>

## Interests

<what this audience cares about>

## Decides

<what this audience decides>
