---
id: TASK-637
title: 'Assign colors to components, containers, systems, and groups'
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
  - src/group.ts
  - src/markdown-emitter.ts
  - src/viewers/web/iso/painting/style.ts
  - src/viewers/web/iso/painting/buildings.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 701000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author can choose a color for a component, container, system, or group to express project meaning. This is authored architecture styling, separate from the UI theme palette and from computed activity or risk overlays. It provides a base for later visual explanations without adding those later features now.

The architecture model and authoring flow own the assignment; the map consumes it. Store Groma-specific presentation meaning under groma. Ordinary Markdown retains the readable architecture and links. No new C4 element or containment level is introduced; groups keep their existing narrative role.

Reuse the same group presentation owner as icon assignments. Before implementation, settle one visual example for a colored group: the proposed behavior colors the group itself without inheriting that color into its members.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can assign, change, and clear a color on a component, container, system, and group through a documented Groma authoring action.
- [ ] #2 The web map displays the authored color on the corresponding element or group using one approved visual example for group and member styling.
- [ ] #3 Assignments survive reloads and scans and remain unchanged when switching UI themes.
- [ ] #4 An icon and a color can be assigned independently to the same element or group; changing one preserves the other.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
