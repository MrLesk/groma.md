---
id: TASK-664
title: Tag groups and flows and light what their tags select
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T21:25:00Z'
updated_date: '2026-11-18T21:27:00Z'
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
type: feature
ordinal: 711000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tags name cross-cutting categories such as a team, a business slice or a compliance scope. Today only actors, systems, containers and components carry them. The two records authors shape most by hand cannot: a group (a named set of components of one container) and a flow (a named scenario over relationships). So a team cannot tag the group it owns, and a scenario cannot be marked as checkout or internal. This task lets a group and a flow carry the standard OKF tags list of their own document, lets groma edit add and remove those tags, and extends the one rule that the map's tag focus and the filtered export read: a group's tag reaches its members as a container's tag reaches its components, and a flow's tag lights the ends of its steps without making them carry it. Editing a group or a flow in the web map is the next task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A group document and a flow document may carry the standard OKF tags list in their front matter. groma.md reads any list of non-empty strings, and a malformed list stops the architecture from loading with an error that names the file
- [ ] #2 groma edit <group-id> and groma edit <flow-id> accept --add-tags and --remove-tags with the rule elements have: carried tags keep their order, new ones follow, an emptied list removes the field. --color and --icon stay refused on groups and flows, and an edit of several ids still takes elements only
- [ ] #3 An element matches a tag when it, its system, its container or its group carries the tag. any, all and not work on that set as before
- [ ] #4 A flow matches a tag when it carries the tag. A matching flow lights the two ends of each of its steps, so the routes between them light by the map's existing rule. The ends do not carry the tag: an excluded tag on a flow takes out the flow and none of its ends, and an end that an excluded tag selects stays receded although a matching flow uses it
- [ ] #5 In the web map the Tags list counts every element, group and flow that carries a tag. Focusing a group's tag lights its members and their zone, focusing a flow's tag lights the ends of its steps, and flows that do not match recede in the Flows list as rows do in the hierarchy. Preview, any, all, not and the URL work as before
- [ ] #6 The flow pane of the web map shows the flow's tags as its Tags row, and a tag there toggles the focus
- [ ] #7 A filtered export reads the same rule. Include keeps the members of a group and the ends of the steps of a flow that carry an included tag, with their parents. Exclude removes the members of a group that carries an excluded tag and leaves that group out, and leaves out a flow that carries one while its ends stay
- [ ] #8 docs/component-markdown.md (Tags, Flows, Groups), docs/agent-instructions and groma agent-instructions say that groups and flows carry tags, how to write them and what a focus and a filtered export do with them
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
1. Records: ArchitectureGroup, AnnotatedGroup and ArchitectureFlow gain tags, read from the document's front matter with the reader elements use (src/group-model.ts, src/flow-model.ts, src/core.ts).
2. Writes: groma edit <group-id> and <flow-id> take --add-tags and --remove-tags. One exported function in src/markdown-emitter.ts applies tag changes to a document; withMeaning, editGroup and editFlow use it. src/edit.ts names two lists: the fields only elements take (color, icon) and the fields several elements take in one edit.
3. One home for who carries tags: src/tags.ts lists the carriers of a world (elements, groups, flows) and counts them (tagCounts, knownTags, carriedTags move here). Follow-up from the review of TASK-663.
4. One request type: TagFilter goes away; the filtered export builds a TagFocus where it reads its options and subsetByTags takes it.
5. The rule, in src/tag-selection.ts: an element matches on its own tags and those of its system, container and group; a flow matches on its own tags and lights the ends of its steps; exclusion wins and stays local. selectByTags takes the world and also returns the matching flows.
6. Web: the Tags list counts all carriers; flows that do not match recede in the Flows list; the flow pane shows the flow's Tags row. No Edit for groups or flows here.
7. Docs: docs/component-markdown.md (Tags, Focusing on tags, Exporting a subset, Flows, Groups), docs/agent-instructions/describe.md, docs/viewers/web/index.md, src/instructions.ts.
8. Tests. Authority: the owner's decision of 2026-11-18 that groups and flows carry tags and that relationships light when both ends do, and acceptance criteria 2, 3, 4 and 7. test-bun/tag-selection.test.ts: (a) a group's tag selects its members only; wrong result: the tag is ignored or lights the whole container; no test has a group. (b) a flow's tag lights the ends of its steps and all across a flow tag and an end's tag selects nothing; wrong result: nothing lights, or the ends are treated as carriers. (c) an excluded flow tag takes out no element and an excluded end stays out of a lit flow; wrong result: inheritance, which would drop public components from a filtered export. test-bun/tag-subset.test.ts: (d) an excluded flow tag leaves the flow out and keeps its ends; (e) an excluded group tag leaves out the group and its members, wrong result: the group's title is published; (f) an included flow tag keeps its ends with their parents. Editing tests: (g) tags added to and removed from a group and a flow document, color refused on a group; wrong result: the option is refused or writes nothing. No DOM tests.
<!-- SECTION:PLAN:END -->
