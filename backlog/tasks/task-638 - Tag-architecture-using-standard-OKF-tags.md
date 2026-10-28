---
id: TASK-638
title: Tag architecture using standard OKF tags
status: To Do
assignee: []
created_date: '2026-10-28T20:33:00Z'
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
- [ ] #1 Component, container, and system documents use the standard top-level OKF tags list, and Groma loads it as authored metadata.
- [ ] #2 An author can add, replace, and remove tags through a documented Groma authoring action.
- [ ] #3 Tags survive supported edits, reloads, and scans without being duplicated under groma or changing architecture containment.
- [ ] #4 The Markdown contract documents one tagged architecture example and identifies the standard OKF field separately from Groma's filtering behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
