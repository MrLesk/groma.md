---
id: TASK-655
title: Put groups inside groups
status: To Do
assignee: []
created_date: '2026-11-12T18:53:00Z'
labels: []
dependencies: []
references:
  - src/sheet/place.ts
  - src/group.ts
  - src/sheet/types.ts
documentation:
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 707000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex asked for this on 2026-11-12: "I want to have groups of groups."

Groups are the structure authors control: they are written by people and agents, never by a scan, and they persist. On groma's own map 111 of 124 components sit in 17 authored groups, and those groups fall into a few families (scanning, map, browser, project work) that cannot be expressed today except by repeating a tag or a color on every group of the family.

Today a group is only a name on each member (`groma.group`), its members are sibling components of one container, and `withZones` in `src/sheet/place.ts` folds each group's members into one zone. A group cannot hold another group.

This task builds on the group record planned for the Personalization Update, where a group gets its own document that lists its members. Build it after that record exists.

Open, to settle with Alex before building:
- Must an inner group sit in the same container as the group that holds it?
- How deep may groups nest?
- How do the inner zone's title and band share room with the outer zone's?
- How do the hierarchy pane and the terminal map show the levels?
- Does an outer group's tag select the groups inside it, as a tagged group selects its members?
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can make a group a member of another group through a documented Groma authoring action.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
