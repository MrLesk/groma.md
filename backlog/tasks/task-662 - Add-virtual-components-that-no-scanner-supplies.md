---
id: TASK-662
title: Add virtual components that no scanner supplies
status: To Do
assignee: []
created_date: '2026-11-18T18:42:00Z'
labels:
  - personalization
milestone: m-6
dependencies: []
type: feature
ordinal: 709000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Requested by the product owner on 2026-11-18 as a feature of the Personalization Update: "the virtual components: components that are not scanned but we can use to explain certain things better". Today every component on the map either comes from scan evidence or is a draft, which stands for planned software and waits for code to be accepted. There is no way to keep a component on purpose that has no code and never will, for example to stand for a concept, a manual step or a part of the story that the source does not show.

The design is not agreed yet. Settle these with the owner before starting: what such a component is called in the product; how it is stored and how it differs from a draft in the Markdown (OKF and C4 placement); how its relationships name it, since authored relationships between components address source files; how the maps show that it has no code; and whether it can later be given code.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A person or an agent can add a component that no scanner supplies, inside a container, with a title, a description and an overview
- [ ] #2 A scan keeps it, and does not treat it as planned software that waits for code
- [ ] #3 It appears on the maps with the other components of its container and can take part in what explains the architecture: relationships, flows, groups and tags
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
