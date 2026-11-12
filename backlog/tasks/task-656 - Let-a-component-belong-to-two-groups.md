---
id: TASK-656
title: Let a component belong to two groups
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
ordinal: 708000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Alex asked for this on 2026-11-12: "I want a component to be able to be part of 2 groups. This means that the map would necessarily have to make the 2 groups intersect."

Today a component belongs to at most one group: `groma.group` holds one name, and `withZones` in `src/sheet/place.ts` puts each component into exactly one zone. The sheet is a tree of rectangles that never overlap among siblings, and a zone is one rectangle (`Zone.rect` in `src/sheet/types.ts`) that the web map and the terminal map both read. The map therefore has no way to draw two zones that share a component.

This task builds on the group record planned for the Personalization Update, where a group gets its own document that lists its members. Build it after that record exists.

Open, to settle with Alex before building:
- Which combinations must the map draw: two groups that share components, a component in three groups, a chain of overlapping groups? What happens with a combination that rectangular zones cannot show?
- Where does each zone's title go when the zones intersect?
- How do two group colors combine in the intersection?
- Which group does a press in the intersection select?
- How does the terminal map show the intersection?
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can make one component a member of two groups through a documented Groma authoring action.
- [ ] #2 The map draws the two groups' zones intersecting, with the shared component inside the intersection.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
