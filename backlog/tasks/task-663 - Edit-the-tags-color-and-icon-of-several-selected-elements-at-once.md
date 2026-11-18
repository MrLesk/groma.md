---
id: TASK-663
title: Edit the tags, color and icon of several selected elements at once
status: In Progress
assignee:
  - '@claude'
created_date: '2026-11-18T18:50:00Z'
updated_date: '2026-11-18T18:52:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-661
references:
  - src/edit.ts
  - src/write-commands.ts
  - src/markdown-emitter.ts
  - src/viewers/web/organisms/selection-details.ts
  - src/viewers/web/organisms/tags-field.ts
  - src/viewers/web/organisms/commands.ts
modified_files:
  - src/viewers/web/tags/tag-focus.ts
  - src/viewers/web/tags/tag-list.ts
  - src/viewers/web/tags/tag-row.ts
  - src/viewers/web/tags/tags-field.ts
  - src/viewers/web/page.ts
  - src/viewers/web/render.ts
  - src/viewers/web/organisms/write-view.ts
  - src/viewers/web/organisms/details.ts
  - docs/component-markdown.md
  - docs/viewers/web/index.md
type: feature
ordinal: 710000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tagging one element at a time is too slow for what tags are used for: a team's ownership, a business slice, a compliance scope. Today the only way to tag is the Edit form of one element or `groma edit <id> --tags`, which replaces the whole list, so adding one tag means reading and retyping the others. The selection pane of several elements offers only Group and Combine. This task lets a person or an agent change the tags, the color and the icon of several elements in one write, and makes adding and removing the one way tags are written, for one element and for several.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 With two or more elements selected on the current revision of a live map, the selection pane offers Edit. Group and Combine stay offered only while every selected element is a component
- [ ] #2 Edit opens the pane's write view with Tags, Color and Icon and the approval bar with Save. Picking and typing store nothing. One Save stores the change on every selected element, or on none when the write is refused
- [ ] #3 Tags shows every tag a selected element carries: a tag all of them carry as a chip, a tag only some carry as a partial chip that reads how many, such as 2 of 4. Typing a tag, picking a suggestion or clicking the name of a partial chip gives the tag to all on Save. The x on a chip takes the tag from all on Save. A tag the person did not touch stays as it is on each element
- [ ] #4 Color and Icon show the value all selected elements share and read mixed when they differ. A pick is stored on all of them. A field the person did not touch changes nothing
- [ ] #5 While the view is open the map shows the picked color and icon on every selected element before Save, as the Edit form of one element does
- [ ] #6 The Edit form of one element has the same Tags field and stores its tags the same way, as tags added and tags removed
- [ ] #7 groma edit <id> [ids...] --add-tags a,b --remove-tags c changes every named element, and --color and --icon do the same. --tags no longer exists. With several ids only these four options are accepted and every id must name an actor, system, container or component. Otherwise nothing is written
- [ ] #8 docs/component-markdown.md, docs/product-model.md, docs/agent-instructions/describe.md, docs/viewers/web/index.md and groma agent-instructions describe adding and removing tags and the Edit of several elements
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
1. Tags are written as tags added and tags removed, the one tag write of the core (src/markdown-emitter.ts withMeaning). --tags and the whole-list write are deleted; tag changes are not conflict-checked because adding and removing merge with other changes.
2. Core and CLI: EditArchitectureInput.alsoIds names more elements that take the same tag changes, color and icon. src/edit.ts validates every element's new document before writing any and returns a StructuralResult. src/write-commands.ts: groma edit <id> [ids...] --add-tags --remove-tags --color --icon.
3. Web, src/viewers/web/tags/tags-field.ts: the one Tags field for one record and for several. It is given what the records carry and how many they are, shows a tag only some carry as a partial chip, owns the added and removed lists and publishes them as two hidden controls.
4. Web, choice fields: a field whose records differ has no opening value and reads mixed; untouched it sends nothing.
5. Web, organisms/commands.ts editEntry describes Edit for one element and for several. organisms/selection-details.ts offers Edit, then Group and Combine while every selected element is a component. organisms/writes.ts and authoring.ts carry the hooks.
6. Web, editing/appearance-preview.ts previews the picked color and icon on every edited element; render.ts tells it which elements are selected.
7. Layout follow-up from the review of TASK-661: the four web tag files live in src/viewers/web/tags/.
8. Docs: docs/component-markdown.md (Tags), docs/product-model.md, docs/agent-instructions/describe.md, docs/viewers/web/index.md, src/instructions.ts.
9. Tests, in test-bun/editing.test.ts. Authority: the design the owner approved on 2026-11-18 (tags are added and removed; several ids in one edit) and acceptance criteria 2 and 7. (a) Adding and removing: a wrong rule would add a tag twice, drop or reorder a tag nobody touched, leave an empty tags field, or accept the same tag in both lists. The existing block tests the deleted whole-list write, so it is rewritten. (b) Several ids: a wrong loop would change only the first element; no test names several ids. (c) All or nothing: a wrong order would write the first documents and then fail on an unknown id; no test covers a refused write of several. test-bun/web-appearance-preview.test.ts follows the preview's new shape; a case is added only if no existing case fails when a second edited element loses its saved color. No DOM tests.
<!-- SECTION:PLAN:END -->
