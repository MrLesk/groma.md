---
id: TASK-640
title: Export a map subset using includeFilter and excludeFilter
status: To Do
assignee: []
created_date: '2026-10-28T20:33:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-639
references:
  - src/cli.ts
  - src/viewers/web/export.ts
  - src/architecture-model.ts
documentation:
  - ROADMAP.md
  - docs/viewers/web/index.md
  - docs/component-markdown.md
type: feature
ordinal: 704000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A map author can export only the architecture relevant to an audience by supplying includeFilter and excludeFilter. The exported map contains the selected subset instead of the full map with dimmed elements.

Reuse the same tag matching rules as the interactive web filter. The export/projection flow owns selection of the exported view; source OKF documents, C4 identities, containment, and authored relationships remain unchanged.

Before implementation, confirm one filtered-export example covering parent context and relationships. The proposed rule retains the parents needed to understand a matching element and only relationships whose endpoints are retained. Define include/exclude overlap in that example rather than adding a general query language.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The supported map export entry point accepts includeFilter and excludeFilter, separately and together.
- [ ] #2 Exports contain the selected subset according to the same tag matching rules as the web map; excluded architecture is absent rather than merely dimmed.
- [ ] #3 One approved example documents include/exclude overlap, required parent context, and which relationships remain.
- [ ] #4 Retained architecture keeps its authored icons and colors, and exporting does not modify the source architecture.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
