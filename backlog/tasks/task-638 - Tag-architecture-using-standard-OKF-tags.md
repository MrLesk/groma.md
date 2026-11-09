---
id: TASK-638
title: Tag architecture using standard OKF tags
status: Done
assignee:
  - '@claude'
created_date: '2026-10-28T20:33:00Z'
updated_date: '2026-11-09T22:08:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
references:
  - src/architecture-model.ts
  - src/authoring.ts
  - src/edit.ts
  - src/markdown-emitter.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - >-
    https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md#41-frontmatter
modified_files:
  - src/tags.ts
  - src/types.ts
  - src/architecture-model.ts
  - src/core.ts
  - src/markdown-emitter.ts
  - src/authoring-conflict.ts
  - src/edit.ts
  - src/curate.ts
  - src/write-commands.ts
  - src/plain-world.ts
  - src/viewers/web/organisms/details.ts
  - src/viewers/web/organisms/writes.ts
  - src/viewers/tui/panes/details.ts
  - src/history/comparison.ts
  - src/viewers/web/comparison/details.ts
  - test/architecture-model-helpers.ts
  - test/architecture-model.test.ts
  - test/architecture-model-errors.test.ts
  - test-bun/editing.test.ts
  - docs/component-markdown.md
  - docs/product-model.md
  - docs/agent-instructions/describe.md
  - src/instructions.ts
  - src/viewers/web/page.ts
  - groma/systems/groma-md/containers/cli/components/src-architecture-model.md
  - src/welcome/model.ts
type: feature
ordinal: 702000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author can label components, containers, and systems with project categories that later map filters can match. Use the existing optional top-level tags list from OKF 0.2, rather than inventing groma.tags or a separate tag catalog.

An ordinary OKF reader can read those short-string tags directly. Groma's architecture model and authoring flow expose and preserve them; map filtering supplies their Groma-specific use. Tags do not change a C4 type, parent, or relationship and do not imply a new box on the map. Category names are authored project data, independent of programming language.

The OKF field is already established by the specification; implementation should define only the application behavior needed for tagging and filtering.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Component, container, and system documents use the standard top-level OKF tags list, and Groma loads it as authored metadata.
- [x] #2 An author can add, replace, and remove tags through a documented Groma authoring action.
- [x] #3 Tags survive supported edits, reloads, and scans without being duplicated under groma or changing architecture containment.
- [x] #4 The Markdown contract documents one tagged architecture example and identifies the standard OKF field separately from Groma's filtering behavior.
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
1. Model: architecture-model.ts reads the top-level OKF `tags` list on every C4 element (actors and external systems included, so no kind is special). A value that is not a list of non-empty strings is rejected like any other invalid field. ArchitectureElement and AnnotatedElement carry `tags`, omitted when empty, as group and technology are.
2. Authoring: `groma edit <id> --tags <a,b>` replaces the list and an empty value removes the field, the same contract as --technology. One module (src/tags.ts) parses and prints the comma-separated text for the CLI, the web Edit form and the edit conflict check. The web Edit form gets a Tags field after Technology.
3. Reading: web details show tag chips under the description; terminal details and `groma view <id> --plain` print them; history comparison names a tags change.
4. Combine refuses a source that carries tags, as it does for group and technology, so tags are never dropped silently.
5. Docs: Markdown contract (field row, one tagged example, OKF field versus Groma use), product model, agent describe guide.

Tests (authority: acceptance criteria 1 to 3).
- Model: a document with `tags` loads them; a malformed value fails. Wrong result caught: malformed metadata silently dropped, or tags ignored. Gap: nothing reads top-level tags today.
- Editing: set, replace and clear through the shared edit write; a title edit and a scan keep them; nothing is written under groma. Wrong result caught: tags lost or duplicated by another supported edit. Extends the existing editing coverage.
- Parser: comma text to list and back, including blanks and duplicates. Wrong result caught: empty or repeated tags stored.
No tests for chip styling or wording.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Decisions: tags are read on every C4 element, actors and external systems included, because a kind exception would add a rule without a reader need. Authoring uses one comma-separated text for the CLI flag, the web form and the conflict check, the same contract as --technology and Backlog labels; a tag containing a comma can be read from another OKF tool but not written by Groma. The dedicated parser test in the plan was folded into the editing test, whose input carries a blank, a repeat and mixed spacing.

Verification: bun run check passed on Bun 1.4.4 (28 Node tests, 1009 Bun tests, 64 environment-dependent skips, 0 failures; the 2 lint warnings are in files this task does not touch). On a copy of test/fixtures/edit: groma edit stock --tags wrote the top-level list ahead of groma and groma view stock --plain printed it; --tags on the project was refused; an empty value removed the field. In groma web the details pane showed the chips, and saving the Tags field in the Edit form replaced them live. In groma view (tui-test, 150x36) the details pane of the tagged container showed the Tags rows.

Cold simplicity review (one round), applied: the edit conflict check now compares tags as the writer saves them, so a form that proposes already-applied tags in another spelling is accepted (reproduced before the fix, covered by the editing test); the project-refusal assertion now sends a title so only the tags guard can reject it; the Tags section of the Markdown contract moved next to Code references without a Groups heading; --draft help and the instructions say link instead of tag; writing tags keeps every other frontmatter field in place. Not applied, existing pattern outside this task: edit.ts lists each meaning field by hand in several places.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Elements carry the standard OKF tags list. Groma loads it into the model and the annotated world, groma edit --tags and the web Edit form replace or remove it, and the web details pane, the terminal details pane, plain view and history comparison show it. Other edits and scans keep it, and combine refuses a source that carries tags. The Markdown contract, product model and agent describe guide document it. Nothing filters by tag yet: that is TASK-639.
<!-- SECTION:FINAL_SUMMARY:END -->
