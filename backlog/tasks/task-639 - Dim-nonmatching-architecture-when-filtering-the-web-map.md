---
id: TASK-639
title: Dim nonmatching architecture when filtering the web map
status: To Do
assignee: []
created_date: '2026-10-28T20:33:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-638
references:
  - src/architecture-model.ts
  - src/viewers/web/chrome/c4-filter.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/render.ts
  - src/viewers/web/iso/painting/style.ts
documentation:
  - ROADMAP.md
  - docs/viewers/web/index.md
  - docs/component-markdown.md
type: feature
ordinal: 703000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A map reader selects a tag filter to focus on relevant architecture while retaining the surrounding map. Nonmatching elements are dimmed, and filtering does not remove them or rearrange the layout.

Use one documented matching rule for this view and for the later includeFilter/excludeFilter export task. The architecture model supplies standard OKF tags; the existing map controls own the selected filter, and rendering owns emphasis. This is view state, not a new OKF concept or C4 relationship.

Before implementation, agree one tagged-map example that shows matching children, their parents, groups, and connecting relationships. Keep the selected tags independent of source language and project-specific technology. Assigned-work filters and computed activity/risk views are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A reader can select and clear a tag filter in the web map, with matching and nonmatching architecture visible together.
- [ ] #2 Nonmatching elements are dimmed without changing element positions, containment, or the stored architecture.
- [ ] #3 Dimming preserves authored icon and color assignments; clearing the filter restores the ordinary appearance.
- [ ] #4 One documented example defines tag matching and the treatment of parents, groups, and relationships, using rules shared with filtered exports.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
