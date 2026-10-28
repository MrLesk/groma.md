---
id: TASK-561
title: 'Assign icons to components, containers, systems, and groups'
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-28T20:33:00Z'
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
  - src/viewers/web/iso/painting/buildings.ts
documentation:
  - ROADMAP.md
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An architecture author can give a component, container, system, or group an icon so readers can recognize it across map views. This task supplies authored visual identity; UI theme selection and authored colors are separate tasks.

The architecture model and existing authoring flow own saved assignments. Groma-specific presentation metadata belongs under groma, while ordinary Markdown readers keep the concept's title, description, body, and links. C4 element boundaries remain unchanged. A group keeps its existing narrative-overlay meaning and gains no parent role or relationships.

Define the smallest documented group metadata ownership needed for one icon assignment. Use current main as the implementation baseline; the partially failed PoC is research material. Package publishing, an icon marketplace, automatic technology inference, and a color legend are outside this task.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An author can assign, change, and clear an icon on a component, container, system, and group through a documented Groma authoring action.
- [ ] #2 The web map shows each assigned icon on its element or group, including when the containing architecture is opened at the relevant level.
- [ ] #3 Assignments survive reloads and scans and remain the same when the UI theme changes.
- [ ] #4 The documented storage uses Groma presentation metadata without changing C4 containment. A group's icon belongs to the group and does not overwrite icons on its members.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
