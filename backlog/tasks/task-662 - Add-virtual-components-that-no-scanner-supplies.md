---
id: TASK-662
title: Add virtual components that no scanner supplies
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T18:42:00Z'
updated_date: '2026-11-18T23:31:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-665
type: feature
ordinal: 709000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the product owner on 2026-11-18 as a feature of the Personalization Update: "the virtual components: components that are not scanned but we can use to explain certain things better". On 2026-11-19 he asked to continue with it. Today every component on the map either comes from scan evidence or is a draft, which stands for planned software and waits for code. Nothing can add a component on purpose that has no code and never will, for example a manual step, a concept or a part of the story that the source does not show; a relationship cannot name such a component, because relationships between components address source files; and the map draws a component without code as if it had some.

Design, settled by the agent after three independent proposals (two agreed on every structural point) and a prototype on the live map; the owner has not confirmed it yet. OKF and C4: a virtual component is an ordinary C4 Component with status stable and no Code references. An ordinary Markdown reader sees a component page with a parent and a body and no source links. Nothing is stored to mark it: the contract does not invent provenance claims, and the missing Code references already say it. So a component whose source files went away is virtual too, and is shown as what it is. groma.md interprets three things: the scan rules (a virtual component is never matched), the relationship rule (it is addressed by its document, as an actor or an external system is) and the look (no code, no height).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma add component <name> --parent <container-id> --overview <prose> adds a stable C4 Component document without Code references in that container, with an optional --description and --technology. A parent that is not an internal container is refused
- [ ] #2 A scan keeps a virtual component, never gives it code, and gives a new source file of the same name a component of its own
- [ ] #3 A relationship names a virtual component by its ID on the command line and by a link to its document in the table, while an end whose component owns code keeps naming an exact source file. Flows resolve through such relationships, and groups, tags, color and icon work as for any component
- [ ] #4 groma remove relation also removes a current relationship when one of its ends is a virtual component and no flow uses it, and groma remove <id> removes a virtual component that nothing relates to
- [ ] #5 groma edit <id> --combine <ids> into a virtual component is refused while a relationship names the component by its document, with a message that lists those relationships. Without such relationships it takes the files and is an ordinary component from then on
- [ ] #6 The web map draws a virtual component as a flat plate, lower than any building that owns code, in the tone of the other buildings, and a ghost keeps its look. Panes, search results and plain output say virtual where they say observed or draft. The terminal map draws it as a stable component
- [ ] #7 On the current revision of a live map the pane of a container offers Add component with Name, Description and Overview through the write view every pane uses, and the Edit view of a current relationship with a virtual end offers Remove
- [ ] #8 docs/component-markdown.md, docs/product-model.md, docs/viewers/web/index.md, docs/agent-instructions and groma agent-instructions describe what a virtual component is, how it is added, related and removed, and how the maps show it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Core: Origin gains virtual, derived in src/core.ts for a stable component that owns no source file. Every reader of an element's origin states what it means for the new value; only a draft is a ghost.
2. Command line: groma add component <name> --parent <container-id> --overview <prose> writes a stable component without code (src/add.ts), with the parent rule drafting has.
3. Relationships: one exported function says whether an element is named by its document in a relationship (an actor, an external system, a virtual component); the writer (src/relation.ts) and the reader (src/relationship-markdown.ts) use it. groma remove relation also removes a current relationship with a virtual end. groma edit --combine into a virtual component is refused while a relationship names it by its document (src/curate.ts).
4. Look: the sheet gives a virtual component the height of a plate, one named constant (src/sheet/place.ts). The painters add ghost classes for a draft only.
5. Web writes: Add component in a container's pane and Remove for a current relationship with a virtual end, as data in organisms/commands.ts with their hooks in authoring.ts and organisms/writes.ts.
6. Plain output, search and the terminal details name the origin.
7. Docs: docs/component-markdown.md, docs/product-model.md, docs/viewers/web/index.md, docs/agent-instructions, src/instructions.ts.
8. Tests. Authority: the owner's request of 2026-11-18 and the acceptance criteria of this task. (a) Adding, criterion 1: a wrong result is a draft, a document outside the container or an accepted external parent; no test adds a component. (b) Scanning, criterion 2: a wrong result is code attached to the virtual component by name; existing tests only cover ghosts. (c) Origin: a wrong rule calls an actor or a ghost virtual; nothing tests the derivation. (d) Relationships, criteria 3 and 4: wrong results are a refused concept end, a row that does not load again, a concept end accepted between two components with code, a protected row that blocks removing the virtual component for ever. (e) Combine, criterion 5: a wrong result is an architecture that no longer loads after the combine. (f) Sheet, criterion 6: a virtual component as high as a component with one file. No DOM tests.
<!-- SECTION:PLAN:END -->
