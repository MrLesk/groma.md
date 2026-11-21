---
id: TASK-664
title: Tag groups and flows and light what their tags select
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T21:25:00Z'
updated_date: '2026-11-21T15:20:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-663
references:
  - src/tag-selection.ts
  - src/tags.ts
  - src/group-model.ts
  - src/flow-model.ts
  - src/group.ts
  - src/flow-authoring.ts
  - src/edit.ts
  - src/viewers/web/tags/tag-focus.ts
  - src/viewers/web/flow/reader.ts
modified_files:
  - docs/agent-instructions/describe.md
  - docs/agent-instructions/index.md
  - docs/agent-instructions/relationships.md
  - docs/agent-instructions/structure.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - src/cli.ts
  - src/core.ts
  - src/edit.ts
  - src/flow-authoring.ts
  - src/flow-model.ts
  - src/group-model.ts
  - src/group.ts
  - src/instructions.ts
  - src/markdown-emitter.ts
  - src/tag-selection.ts
  - src/tags.ts
  - src/types.ts
  - src/viewers/web/export.ts
  - src/viewers/web/flow/list.ts
  - src/viewers/web/flow/reader.ts
  - src/viewers/web/flow/row.ts
  - src/viewers/web/iso/painting/map.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/hierarchy.ts
  - src/viewers/web/organisms/selection-details.ts
  - src/viewers/web/render.ts
  - src/viewers/web/runtime.ts
  - src/viewers/web/tags/tag-focus.ts
  - src/viewers/web/tags/tag-list.ts
  - src/viewers/web/tags/tag-row.ts
  - src/viewers/web/tags/tags-field.ts
  - src/viewers/web/url.ts
  - src/viewers/web/work/pins.ts
  - src/write-commands.ts
  - test-bun/flows.test.ts
  - test-bun/group-records.test.ts
  - test-bun/tag-selection.test.ts
  - test-bun/tag-subset.test.ts
  - test-bun/web-export.test.ts
  - test-bun/web-page-inset.test.ts
type: feature
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tags name cross-cutting categories such as a team, a business slice or a compliance scope. Today only actors, systems, containers and components carry them. The two records authors shape most by hand cannot: a group (a named set of components of one container) and a flow (a named scenario over relationships). So a team cannot tag the group it owns, and a scenario cannot be marked as checkout or internal. This task lets a group and a flow carry the standard OKF tags list of their own document, lets groma edit add and remove those tags, and extends the one rule that the map's tag focus and the filtered export read: a group's tag reaches its members as a container's tag reaches its components, and a flow's tag lights the ends of its steps without making them carry it. Editing a group or a flow in the web map is the next task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A group document and a flow document may carry the standard OKF tags list in their front matter. groma.md reads any list of non-empty strings, and a malformed list stops the architecture from loading with an error that names the file
- [x] #2 groma edit <group-id> and groma edit <flow-id> accept --add-tags and --remove-tags with the rule elements have: carried tags keep their order, new ones follow, an emptied list removes the field. --color and --icon stay refused on groups and flows, and an edit of several ids still takes elements only
- [x] #3 An element matches a tag when it, its system, its container or its group carries the tag. any, all and not work on that set as before
- [x] #4 A flow matches a tag when it carries the tag. A matching flow lights the two ends of each of its steps, so the routes between them light by the map's existing rule. The ends do not carry the tag: an excluded tag on a flow takes out the flow and none of its ends, and an end that an excluded tag selects stays receded although a matching flow uses it
- [x] #5 In the web map the Tags list counts every element, group and flow that carries a tag. Focusing a group's tag lights its members and their zone, focusing a flow's tag lights the ends of its steps, and flows that do not match recede in the Flows list as rows do in the hierarchy. Preview, any, all, not and the URL work as before
- [x] #6 The flow pane of the web map shows the flow's tags as its Tags row, and a tag there toggles the focus
- [x] #7 A filtered export reads the same rule. Include keeps the members of a group and the ends of the steps of a flow that carry an included tag, with their parents. Exclude removes the members of a group that carries an excluded tag and leaves that group out, and leaves out a flow that carries one while its ends stay
- [x] #8 docs/component-markdown.md (Tags, Flows, Groups), docs/agent-instructions and groma agent-instructions say that groups and flows carry tags, how to write them and what a focus and a filtered export do with them
- [x] #9 The row of an actor under Actors recedes when the focus does not light the actor, as the actor does on the map
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
1. Records: ArchitectureGroup, AnnotatedGroup and ArchitectureFlow gain tags, read from the document's front matter with the reader elements use (src/group-model.ts, src/flow-model.ts, src/core.ts).
2. Writes: groma edit <group-id> and <flow-id> take --add-tags and --remove-tags. One exported function in src/markdown-emitter.ts applies tag changes to a document; withMeaning, editGroup and editFlow use it. src/edit.ts names two lists: the fields only elements take (color, icon) and the fields several elements take in one edit.
3. One home for who carries tags: src/tags.ts lists the carriers of a world (elements, groups, flows) and counts them (tagCounts, knownTags, carriedTags move here). Follow-up from the review of TASK-663.
4. One request type: TagFilter goes away; the filtered export builds a TagFocus where it reads its options and subsetByTags takes it.
5. The rule, in src/tag-selection.ts: an element matches on its own tags and those of its system, container and group; a flow matches on its own tags and lights the ends of its steps; exclusion wins and stays local. selectByTags takes the world and also returns the matching flows.
6. Web: the Tags list counts all carriers; flows that do not match recede in the Flows list; the flow pane shows the flow's Tags row. No Edit for groups or flows here.
7. Docs: docs/component-markdown.md (Tags, Focusing on tags, Exporting a subset, Flows, Groups), docs/agent-instructions/describe.md, docs/viewers/web/index.md, src/instructions.ts.
8. Tests. Authority: the owner's decision of 2026-11-18 that groups and flows carry tags and that relationships light when both ends do, and acceptance criteria 2, 3, 4 and 7. test-bun/tag-selection.test.ts: (a) a group's tag selects its members only; wrong result: the tag is ignored or lights the whole container; no test has a group. (b) a flow's tag lights the ends of its steps and all across a flow tag and an end's tag selects nothing; wrong result: nothing lights, or the ends are treated as carriers. (c) an excluded flow tag takes out no element and an excluded end stays out of a lit flow; wrong result: inheritance, which would drop public components from a filtered export. test-bun/tag-subset.test.ts: (d) an excluded flow tag leaves the flow out and keeps its ends; (e) an excluded group tag leaves out the group and its members, wrong result: the group's title is published; (f) an included flow tag keeps its ends with their parents. Editing tests: (g) tags added to and removed from a group and a flow document, color refused on a group; wrong result: the option is refused or writes nothing. No DOM tests.

9. Added by the review round, in test-bun/tag-subset.test.ts: (h) a group none of whose members are exported is not exported. Authority: a reproduced failure of the filtered export, which published the title and tags of such a group. Wrong result: the group's record in the exported payload. Gap: the only assertion on groups pinned the leak; it is replaced.

Actor rows (flow/list.ts, flow/row.ts): the flow list keeps the row of each listed actor and recedes it when the focus does not light the actor, in the same recede step as its flow rows. No test: the repository has no browser test harness; the rows were walked on the live map.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-18. Built by codex (model gpt-6.2-astra) from a brief that fixed the rule as six points and listed checked facts. One pass at max effort, 38 files, no wrong behavior in my review or live walk. I applied my own review notes instead of a second codex round, because they were small: the two field lists of src/edit.ts renamed to say what they are (tagFields, appearanceFields, fieldsOfSeveralElements), comments on each step of the rule, two instruction lines and two documentation sentences restored to their form, person-facing text that said records now says uses.
Rule decisions I made without the owner, to confirm: a group's tag reaches its members as a container's tag does; a flow's tag lights the ends of its steps and the ends do not carry it, because an element takes part in many flows and a filtered export that excludes an internal flow must not drop public components; all across a flow's tag and an end's tag lights nothing.
Review round (cold simplicity review and full-context review in parallel, one merged list, applied by me). Both reproduced one failure that predates this task and that group tags made worse: a filtered export published every group, with title, description, overview and now tags, also when none of its members was exported. Fixed: a group is exported when one of its members is, which also covers a group with an excluded tag. Other items applied: TagSelection.matched is now lit and flows is matchingFlows, because lit elements include flow ends that match nothing; the pins, the hierarchy and the flow rows each take the whole selection, so two sets of ids cannot be swapped; editSeveralElements builds the fields it writes from the list that decides them; the receded look of flow rows lives in flow/row.ts; one test line that pinned the leak removed; docs say the flows under Actors, as the screen does. Declined: reading a step's ends from the step, because a selection holds representation ids and those differ from element ids in a comparison (src/history/comparison.ts). Follow-ups recorded, not done: actor headings above the flows do not recede; a malformed tags list in a group or flow file is reported with the element error code.
Live checks on the final code (own architecture, 1600 by 1000, dark theme): with the Plugins group tagged extensions, a link with tag=extensions lights its three members and its zone only, and all six flows recede. With the flow Install a published scanner tagged onboarding, tag=onboarding lights its four step ends (an actor, two components, an external system), their three routes, their island and slab, and five of six flows recede at opacity 0.4; 222 of 238 task pins recede. not=onboarding alone lights all 129 buildings and recedes only that flow. Pointing at a row of the Tags list previews the same without changing the URL, and Escape restores the map. The flow pane shows its Tags row; a real click on the tag focuses the map and the URL gains tag=onboarding. The Tags list counts both new tags. Command line: tags added to and removed from a group and a flow; color on a group, icon on a flow, a group among several ids and tags on the project are refused. All test tags were removed again; git shows no leftover.
Checks: bun run check passed on the final code (982 Bun tests and 28 Node tests, 0 failures).

2026-11-21, the owner walking tag focus on the review map. Found by the coordinator while walking it for him: with a tag focused the two actors recede on the map and their flows recede under Actors, but the rows of the actors stay lit, because only the rows under Structure and the flow rows were told to recede. The owner: "Yes, fix it".

Fixed in the flow list, which owns the rows under Actors: recede now also dims the row of an actor the focus does not light (flow/list.ts), with the same look and motion as a receded flow row (flow/row.ts). Verified on the review map in the dark theme: with map focused both actor rows recede like the actors on the map (row opacity 0.4, building 0.3); with scanning focused, the Developer is an end of the matching flow Scan project source, is lit on the map and keeps its row lit while the Coding agent recedes; opening a branch repaints the list and keeps the rows receded; clearing the chip restores every row. bun run check on this branch: 996 pass, 67 skip, 0 fail. The pull requests above this one do not have the commit until the stack is restacked.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Groups and flows carry OKF tags, written with groma edit --add-tags and --remove-tags. The one selection rule of the map's tag focus and the filtered export now reads them: a group's tag reaches its members, a flow's tag lights the ends of its steps. The Tags list counts all carriers, flows that do not match recede, and the flow pane shows its tags. A filtered export no longer publishes a group none of whose members are exported.
<!-- SECTION:FINAL_SUMMARY:END -->
