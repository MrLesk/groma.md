---
id: TASK-574
title: Show relationships first and one line per child in the plain element view
status: To Do
assignee: []
created_date: '2026-10-08 15:14'
updated_date: '2026-10-08 15:31'
labels: []
dependencies:
  - TASK-571
references:
  - src-core
  - flows
  - src-list-window
  - src/plain-world.ts
  - src/viewers/relationship-text.ts
  - docs/agent-instructions/inspect.md
type: enhancement
ordinal: 651000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`groma view <id> --plain` prints the element, then every child with its full overview, then the relationships that cross the element's boundary, all in one list paged by 50 items. On this repository the first page of `groma view cli --plain` is 14.5 KB: 50 of the container's 73 children, each with one to four sentences, ending with `Showing 1-50 of 86 items. Next: groma view cli --plain --skip 50`. Its 13 boundary relationships are on the second page. Relationships between the element's own children are never shown: `showsRelationshipText` (src/viewers/relationship-text.ts) keeps a row only when one end is outside the element, and no plain command lists them.

In a review on 2026-10-08, coding agents said this view is where they decide what to read next, and its first page answers the wrong half: they read about 3,600 tokens of overviews, take them as the whole answer, and never reach the relationships.

Reshape the plain element view as an index:
- The relationships crossing the boundary first, incoming then outgoing.
- Then the children, one line each: id, kind, title, and either the one source file or the number of files. Children in a group are listed under the group name.
- No child overviews. The element's own header keeps its overview; a child's overview is in its own `groma view <child-id> --plain` header and in the Markdown record printed without `--plain`.
- One line saying how many relationships run between the direct children, and a new form, `groma view <id> --plain --internal`, that lists them, with each stored endpoint lifted to the direct child that contains it.
The view pages through the shared list window with the byte budget of TASK-571, so a container with about 90 short child lines fits one default page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma view <id> --plain prints the relationships crossing the element's boundary, incoming then outgoing, before the children.
- [ ] #2 Each child takes one line with id, kind, title and its single source file or its file count, listed under its group name when it has one, without its overview.
- [ ] #3 The element's own header keeps its overview, and children's overviews stay available in their own views and in the Markdown record.
- [ ] #4 The view states how many relationships run between its direct children, and groma view <id> --plain --internal lists them with each endpoint lifted to its direct child.
- [ ] #5 A fixture container with 90 children with short titles fits in one default page under the byte budget of TASK-571.
- [ ] #6 The inspect guide and its examples match the new shape.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
