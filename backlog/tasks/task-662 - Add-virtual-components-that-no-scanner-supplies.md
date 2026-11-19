---
id: TASK-662
title: Add virtual components that no scanner supplies
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T18:42:00Z'
updated_date: '2026-11-19T00:27:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-665
modified_files:
  - docs/agent-instructions/index.md
  - docs/agent-instructions/relationships.md
  - docs/agent-instructions/structure.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - src/add.ts
  - src/architecture-model.ts
  - src/core.ts
  - src/draft.ts
  - src/instructions.ts
  - src/plain-world.ts
  - src/relation.ts
  - src/relationship-markdown.ts
  - src/removable.ts
  - src/sheet/place.ts
  - src/types.ts
  - src/viewers/tui/atoms/theme.ts
  - src/viewers/tui/molecules/building.ts
  - src/viewers/tui/molecules/flow-marker.ts
  - src/viewers/tui/molecules/route.ts
  - src/viewers/tui/molecules/surface.ts
  - src/viewers/tui/panes/hierarchy.ts
  - src/viewers/tui/projection-routes.ts
  - src/viewers/tui/projection.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/iso/painting/buildings.ts
  - src/viewers/web/iso/painting/ground.ts
  - src/viewers/web/iso/painting/routes.ts
  - src/viewers/web/organisms/commands.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/organisms/relationship-details.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/render.ts
  - src/welcome/model.ts
  - src/write-commands.ts
  - test-bun/detach.test.ts
  - test-bun/editing.test.ts
  - test-bun/scan-component-naming.test.ts
  - test-bun/sheet-scene.test.ts
  - src/origin.ts
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
- [x] #1 groma add component <name> --parent <container-id> --overview <prose> adds a stable C4 Component document without Code references in that container, with an optional --description and --technology. A parent that is not an internal container is refused
- [x] #2 A scan keeps a virtual component, never gives it code, and gives a new source file of the same name a component of its own
- [x] #3 A relationship names a virtual component by its ID on the command line and by a link to its document in the table, while an end whose component owns code keeps naming an exact source file. Flows resolve through such relationships, and groups, tags, color and icon work as for any component
- [x] #4 groma remove relation also removes a current relationship when one of its ends is a virtual component and no flow uses it, and groma remove <id> removes a virtual component that nothing relates to
- [x] #5 groma edit <id> --combine <ids> into a virtual component is refused while the result would not load, that is while a relationship between components names the component by its document, and the refusal names that relationship. A relationship of an actor or an external system does not block it. Once combined, the component owns the files and is an ordinary component
- [x] #6 The web map draws a virtual component as a flat plate, lower than any building that owns code, in the tone of the other buildings, and a ghost keeps its look. Panes, search results and plain output say virtual where they say observed or draft. The terminal map draws it as a stable component
- [x] #7 On the current revision of a live map the Edit view of a container offers Add component with Name, Description and Overview through the write view every pane uses, and the Edit view of a current relationship with a virtual end offers Remove while no flow uses the relationship
- [x] #8 docs/component-markdown.md, docs/product-model.md, docs/viewers/web/index.md, docs/agent-instructions and groma agent-instructions describe what a virtual component is, how it is added, related and removed, and how the maps show it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Core: src/origin.ts owns what is virtual (isVirtualComponent), the origin of an element (elementOrigin) and of a relationship (relationshipOrigin). Origin gains virtual; a relationship stays observed or draft (RelationshipOrigin in src/types.ts). Every reader of an element origin states what it means for the new value; only a draft is a ghost.
2. Command line: groma add component <name> --parent <container-id> --overview <prose> writes a stable component without code (src/add.ts), with the parent rule drafting has (resolveParent in src/architecture-model.ts).
3. Relationships: allowsNamedElements, next to the row reader in src/relationship-markdown.ts, says whether a row may name its endpoints as elements (an actor, an external system, or virtual components only); the writer (src/relation.ts) and the reader use it. relationshipRemovalBlocker in src/removable.ts says why a row cannot be removed (a flow uses it, or it is a current row without a virtual end); the command line and the web pane use it. A combine into a virtual component needs no rule of its own: the existing check that the result loads (requireLoadableResult in src/curate.ts) refuses it while a row between components names the component by its document.
4. Look: the sheet gives a virtual component the height of a plate, one named constant (src/sheet/place.ts). The painters add ghost classes for a draft only.
5. Web writes: Add component in the Edit view of a container and Remove for a current relationship with a virtual end, as data in organisms/commands.ts with their hooks in authoring.ts and organisms/writes.ts. A removed relationship empties the selection.
6. Plain output, search and the terminal details name the origin.
7. Docs: docs/component-markdown.md, docs/product-model.md, docs/viewers/web/index.md, docs/agent-instructions, src/instructions.ts.
8. Tests. Authority: the owner request of 2026-11-18 and the acceptance criteria of this task. (a) Adding, criterion 1: a wrong result is a draft, a document outside the container or an accepted external parent; no test adds a component. (b) Scanning, criterion 2: a wrong result is code attached to the virtual component by name; existing tests only cover ghosts. (c) Origin: a wrong rule calls an actor or a ghost virtual; nothing tests the derivation. (d) Relationships, criteria 3 and 4: wrong results are a refused concept end, a row that does not load again, a concept end accepted between two components with code, a protected row that blocks removing the virtual component for ever. (e) Combine, criterion 5: a wrong result is an architecture that no longer loads after the combine, or a combine that stays refused after the rows are gone. (f) Sheet, criterion 6: a virtual component as high as a component with one file. No DOM tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built by codex (gpt-6.2-astra, effort max) from a brief with checked facts and the settled design, in one pass. Then read, restructured and verified by the agent.

Changed after the first read of codex's code: Add component was a second entry in the container pane's header and wrapped the meta line; it moved into the container's Edit view, where a record's other writes live. Removing a relationship made the selection jump to another relationship, because a relationship's id is its position; the selection is now emptied. The endpoint rule accepted a document end between two components when only one was virtual and the other owned code named by ID; it now requires every element named between components to be virtual.

Review round (one cold simplicity review without history and one full-context review, in parallel; neither found a blocking failure). Applied:
1. src/origin.ts owns the three origin rules (isVirtualComponent, elementOrigin, relationshipOrigin). Before, the predicate sat in the file-to-owner index and the two origin functions in src/core.ts, and a relationship's origin was spelled Exclude<Origin, 'virtual'> in four places; RelationshipOrigin names it once in src/types.ts.
2. The endpoint rule (allowsNamedElements) lives next to the row reader in src/relationship-markdown.ts, not in the projection module. The reader's refusal names the row.
3. relationshipRemovalBlocker in src/removable.ts owns the whole removal rule, including the flow check that was inline in removeRelation. The web pane asked only half of it and offered Remove on a relationship a flow uses, which core then refused.
4. The combine guard written for this task is gone. The existing requireLoadableResult already refuses a combine whose result would not load, and it refuses exactly the rows that break: a row of an actor or an external system keeps naming the component by its document and no longer blocks the combine. Probe: refusal 'cannot change "alternate": .../emitter.md: emitter.ts to alternate: code relationships require source-file endpoints'; with only the actor's row left the combine succeeds and the component is observed.
5. src/add.ts: the --parent check stands beside the --technology check; the validation that ran for a component only had no reason and is removed (an actor and an external system are written the same way); draftOnlyKinds says why a component is not listed.
6. Add component is gated by a fact of the inspected element (takesComponents), as Accept and Remove are, and paneWrites keeps taking an id.
7. Relationship pane: an open Edit view now gives way to reading on another revision, as the element, group, flow and selection panes do (missed in TASK-665; fixed here because this task adds Remove for current relationships to that view). The pane shows and writes the first endpoint pair of the selected direction; before it took the first pair of either direction, so for a two-way pair the question could name one direction and the write address the other.
8. Tests: removed an assertion on the stored Markdown links that the reload check already covers, a rejection the plan gave no reason for, two assertions that restated defaults, and the pinned wording of the combine refusal. Docs: endpoint instead of end, the plate is "flat" everywhere, the combine rule is stated once in the contract.

Not changed, known:
- Add component is also offered on a ghost container, and groma add component accepts one as parent: the result is a stable virtual component inside planned software. Removing that container is refused while it contains the component.
- The web map cannot draw a relationship to a virtual component: the relate tool is hidden. That write is on the command line.
- Remove on a relationship with several rows removes the pane's first row while the question names the relationship (older behavior of draft relationships too).
- A component whose last source file went away is virtual and is drawn as a plate. The scan summary does not count such components.

Verification. bun run check passes: 988 Bun tests and 28 Node tests, 0 failures, no complexity warning; the lint notes left are in files this task does not touch. Criterion 1, 2, 3, 4, 5 and the plate height of 6 have tests (test-bun/editing.test.ts, scan-component-naming.test.ts, detach.test.ts, sheet-scene.test.ts). Run by hand on a scratch copy of test/fixtures/edit: tags, color, icon and a group on a virtual component, the plain output (review component Review virtual group:api-manual-steps), --parent refused for an actor, the draft hint for a container. On the live map of this repository, dark theme: the plate and its solid look next to a dashed ghost, Component · virtual in the pane and in the search result, Add component from the Edit view of the container up to the new plate, no Add component in the Edit view of a component, Remove in the Edit view of a current relationship with a virtual end and the emptied selection after it, no Remove while a flow uses that relationship and Remove again after the flow is gone, Edit without Remove on a relationship between two components with code. Terminal map through tui-test before the review round: Component · virtual with a solid box; the terminal files did not change after it except the name of a type.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A person can add a virtual component: a stable C4 Component without Code references that explains what no scan can see. groma add component <name> --parent <container-id> --overview <prose> adds it, and so does Add component in the Edit view of a container on the web map. Nothing stored marks it; src/origin.ts derives the origin virtual. A relationship names it by its document, the maps draw it as a flat plate (web) and a stable component (terminal), a scan never matches it, and a current relationship with a virtual end can be removed when no flow uses it. The design is the agent choice after independent proposals and a prototype; the owner asked for the feature in one sentence and has not confirmed these calls: the name virtual in the product, no stored marker (so a component whose files all went away is virtual too), the plate look, document-named endpoints, removal of current relationships with a virtual end, and Add component inside the Edit view of the container. Verified by bun run check (988 Bun and 28 Node tests pass), scratch runs of the command line and a walk of the live map; details are in the notes. Follow-ups, not built: drawing a relationship to a virtual component on the web map (the relate tool is hidden), a scan-summary count of components that lost their files, removal of the exact row when a relationship has several.
<!-- SECTION:FINAL_SUMMARY:END -->
