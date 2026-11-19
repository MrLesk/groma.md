---
id: TASK-663
title: Edit the tags, color and icon of several selected elements at once
status: Done
assignee:
  - '@claude'
created_date: '2026-11-18T18:50:00Z'
updated_date: '2026-11-18T19:34:00Z'
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
  - docs/agent-instructions/describe.md
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/viewers/web/index.md
  - groma/systems/groma-md/containers/export/components/c4-filter.md
  - groma/systems/groma-md/containers/export/components/organisms-details.md
  - src/architecture-model.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/instructions.ts
  - src/markdown-emitter.ts
  - src/tag-selection.ts
  - src/tags.ts
  - src/viewers/web/authoring.ts
  - src/viewers/web/editing/appearance-preview.ts
  - src/viewers/web/organisms/choice-field.ts
  - src/viewers/web/organisms/commands.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/selection-details.ts
  - src/viewers/web/organisms/tags-field.ts
  - src/viewers/web/organisms/write-view.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/web/page.ts
  - src/viewers/web/render.ts
  - src/viewers/web/tags/tag-focus.ts
  - src/viewers/web/tags/tag-list.ts
  - src/viewers/web/tags/tag-row.ts
  - src/viewers/web/tags/tags-field.ts
  - src/write-commands.ts
  - test-bun/editing.test.ts
  - test-bun/web-appearance-preview.test.ts
  - test-bun/web-edit-entry.test.ts
  - test-bun/web-export.test.ts
type: feature
ordinal: 710000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tagging one element at a time is too slow for what tags are used for: a team's ownership, a business slice, a compliance scope. Today the only way to tag is the Edit form of one element or `groma edit <id> --tags`, which replaces the whole list, so adding one tag means reading and retyping the others. The selection pane of several elements offers only Group and Combine. This task lets a person or an agent change the tags, the color and the icon of several elements in one write, and makes adding and removing the one way tags are written, for one element and for several.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 With two or more elements selected on the current revision of a live map, the selection pane offers Edit. Group and Combine stay offered only while every selected element is a component
- [x] #2 Edit opens the pane's write view with Tags, Color and Icon and the approval bar with Save. Picking and typing store nothing. One Save stores the change on every selected element, or on none when the write is refused
- [x] #3 Tags shows every tag a selected element carries: a tag all of them carry as a chip, a tag only some carry as a partial chip that reads how many, such as 2 of 4. Typing a tag, picking a suggestion or clicking the name of a partial chip gives the tag to all on Save. The x on a chip takes the tag from all on Save. A tag the person did not touch stays as it is on each element
- [x] #4 Color and Icon show the value all selected elements share and read mixed when they differ. A pick is stored on all of them. A field the person did not touch changes nothing
- [x] #5 While the view is open the map shows the picked color and icon on every selected element before Save, as the Edit form of one element does
- [x] #6 The Edit form of one element has the same Tags field and stores its tags the same way, as tags added and tags removed
- [x] #7 groma edit <id> [ids...] --add-tags a,b --remove-tags c changes every named element, and --color and --icon do the same. --tags no longer exists. With several ids only these four options are accepted and every id must name an actor, system, container or component. Otherwise nothing is written
- [x] #8 docs/component-markdown.md, docs/product-model.md, docs/agent-instructions/describe.md, docs/viewers/web/index.md and groma agent-instructions describe adding and removing tags and the Edit of several elements
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
1. Tags are written as tags added and tags removed, the one tag write of the core (src/markdown-emitter.ts withMeaning). --tags and the whole-list write are deleted; tag changes are not conflict-checked because adding and removing merge with other changes.
2. Core and CLI: EditArchitectureInput.alsoIds names more elements that take the same tag changes, color and icon. src/edit.ts validates every element's new document before writing any and returns a StructuralResult. src/write-commands.ts: groma edit <id> [ids...] --add-tags --remove-tags --color --icon.
3. Web, src/viewers/web/tags/tags-field.ts: the one Tags field for one record and for several. It is given what the records carry and how many they are, shows a tag only some carry as a partial chip, owns the added and removed lists and publishes them as two hidden controls.
4. Web, choice fields: a field whose records differ has no opening value and reads mixed; untouched it sends nothing.
5. Web, organisms/commands.ts editEntry describes Edit for one element and for several. organisms/selection-details.ts offers Edit, then Group and Combine while every selected element is a component. organisms/writes.ts and authoring.ts carry the hooks.
6. Web, editing/appearance-preview.ts previews the picked color and icon on every edited element; render.ts tells it which elements are selected.
7. Layout follow-up from the review of TASK-661: the four web tag files live in src/viewers/web/tags/.
8. Docs: docs/component-markdown.md (Tags), docs/product-model.md, docs/agent-instructions/describe.md, docs/viewers/web/index.md, src/instructions.ts.
9. Tests, in test-bun/editing.test.ts. Authority: the design the owner approved on 2026-11-18 (tags are added and removed; several ids in one edit) and acceptance criteria 2 and 7. (a) Adding and removing: a wrong rule would add a tag twice, drop or reorder a tag nobody touched, leave an empty tags field, or accept the same tag in both lists. The existing block tests the deleted whole-list write, so it is rewritten. (b) Several ids: a wrong loop would change only the first element; no test names several ids. (c) All or nothing: a wrong order would write the first documents and then fail on an unknown id; no test covers a refused write of several. test-bun/web-appearance-preview.test.ts follows the preview's new shape; a case is added only if no existing case fails when a second edited element loses its saved color. No DOM tests.

10. Tests added by the review round. (d) test-bun/web-edit-entry.test.ts, rule: acceptance criterion 4, a Color or Icon field whose elements differ changes nothing unless the person picks in it. Wrong result: a Save that sends an empty color and clears the color of every selected element (the code before this task defaulted a missing value to empty text). Gap: no test imported organisms/commands.ts. Verified: the test fails when the skip of a missing value is replaced by that default. (e) test-bun/editing.test.ts, rule: acceptance criterion 7, several ids take only the four options. Wrong result: a title sent with several ids renames every element. Gap: the refusal was only checked by hand; one assertion added to the refused-edit test.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-18. Built by codex (model gpt-6.2-astra) from a written brief with the mock picture, checked facts and readability rules, as the owner asked after the trial on TASK-661. First pass, 17 minutes at max effort: all eight criteria, type-checked, focused tests green. My review as the junior reader found no wrong behavior and ten notes; one fix round (xhigh) applied all of them: the color and icon preview read a DOM attribute another file set for it (now it reads the form's values), tagCounts had a mode flag (now carriedTags and tagCounts), withTags had an early return nobody asked for, paintSelection had been given a callback in place of a value, three comments and four documentation passages were rewritten without need.
Review round (cold simplicity review and full-context review in parallel, one merged list, applied by me): no defect. Applied: a comment and a test on the line that keeps an untouched mixed field out of the write; editSeveralElements passes only the four shared fields to the document writer; isTagsField moved next to the WriteField union, which removes a type import cycle; the Tags field's inner names no longer collide (pending, typing, addedControl, markForAll) and its header states the hidden-control contract again; comments name elementOnlyFields in src/edit.ts as what decides the fields several elements take; the project-name guard in editSeveralElements removed; the element fields bullet of the web docs no longer says the form sends a tags value. Left as follow-up for the slice that puts tags on groups and flows: one home for knownTags, carriedTags and tagCounts, and one type for TagFilter and TagFocus.
Live checks on the final code (own architecture, 1600 by 1000, dark theme, real pointer and keyboard input): four components selected show Edit, Group, Combine; a container with a component shows Edit only. The Edit view shows scanning 2 of 4 and work 1 of 4 as partial chips, Color and Icon on none; pressing a partial chip's name makes it full, x takes a tag from all, a typed tag with Enter or a comma and a suggestion add one, Backspace in the empty text takes the last chip off, the hidden controls hold the added and removed lists. Picking blue shows blue on the four selected buildings and not on a fifth; Save wrote the four documents (tags and color) and the pane returned to reading. A pair with different colors reads Color mixed with no choice checked; Save with only a tag removal left both colors; picking No color previews none on both and Escape restores the map. A picked icon previews on the three selected buildings. The Edit form of one element shows its tags in document order and saves a removal. Command line: several ids with tag changes and a color changed four documents and printed each; an unknown id, project among the ids, a title with several ids, no option, the same tag added and removed and --tags were each refused; remove still refuses a second id. All test edits were reverted through the same command; git shows no leftover.
Checks: bun run check passed on the final code (976 Bun tests and 28 Node tests, 0 failures).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Several selected elements can be edited at once: the selection pane offers Edit with Tags, Color and Icon, and groma edit takes several ids with --add-tags, --remove-tags, --color and --icon. Tags are now written only as tags added and tags removed, for one element and for several; --tags and the whole-list write are gone. The web tag code lives in src/viewers/web/tags/.
<!-- SECTION:FINAL_SUMMARY:END -->
