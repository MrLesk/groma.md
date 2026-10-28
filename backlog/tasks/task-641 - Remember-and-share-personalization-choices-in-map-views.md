---
id: TASK-641
title: Remember and share personalization choices in map views
status: To Do
assignee: []
created_date: '2026-10-28T20:34:00Z'
labels:
  - personalization
milestone: m-6
dependencies:
  - TASK-636
  - TASK-639
references:
  - src/viewers/web/chrome/theme-control.ts
  - src/viewers/web/chrome/map-view.ts
  - src/viewers/web/url.ts
  - src/viewers/web/render.ts
documentation:
  - ROADMAP.md
  - docs/viewers/web/index.md
type: feature
ordinal: 705000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A map reader can return to a chosen UI theme and tag filter, or share that view with another reader. Extend the existing saved and shareable map controls delivered by TASK-599, rather than creating a second view-state system.

The existing theme control and map-view/URL flow own these preferences. Configuration supplies available theme plugins; architecture documents supply tags and authored styling. Preferences add no OKF concept, C4 element, or copy of architecture metadata.

The supported example uses a live map and its static export with the chosen theme available. Preserve the established rule that explicit link choices override the recipient's saved preferences.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reloading restores the chosen configured UI theme or Auto mode and selected tag filter alongside the existing map controls.
- [ ] #2 Changing a personalization choice updates the shareable map URL.
- [ ] #3 Opening that URL in a browser with different saved preferences reproduces the explicit theme and tag-filter choices, including an explicitly cleared filter.
- [ ] #4 Live maps and static exports use the existing view-state ownership and preserve current projection, selection, and navigation behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
