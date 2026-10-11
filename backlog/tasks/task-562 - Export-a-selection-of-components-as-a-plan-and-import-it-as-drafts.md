---
id: TASK-562
title: Export a selection of components as a plan and import it as drafts
status: To Do
assignee: []
created_date: '2026-10-07 23:16'
updated_date: '2026-10-08 15:31'
labels:
  - senior
dependencies: []
references:
  - src-architecture-model
  - src-authoring
  - src-architecture-reader
  - src-cli
  - organisms-details
  - create
  - web-export
  - relationship-markdown
  - docs/component-markdown.md
  - docs/product-model.md
type: feature
ordinal: 2
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A plan is a fragment of architecture in Groma.md's own OKF Markdown: a few elements, the relationships between them, and the parents they need. People pick components on the map or name them on the CLI, export them as a plan, and import that plan into another repository, where the elements arrive as ghosts (status draft) at the paths they will keep, under a draft record named after the plan. This is the base for sharing plans between projects. Plans describe outcomes, not work: no layout, no code references, no implementation steps.

Build on drafts (src/draft.ts, src/accept.ts, draft records in src/architecture-model.ts), the emitter (src/markdown-emitter.ts), the multi-selection controls of the web map (src/viewers/web/organisms/writes.ts), static export (src/viewers/web/export.ts) and the Markdown contract (docs/component-markdown.md).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 groma plan export <ids...> --to <path> writes a plan bundle in the OKF profile: the selected elements with status draft and their overviews, the relationships between them as draft rows, the flows that lie entirely within the selection, and the parents they need by id only. The Markdown contract documents the bundle.
- [ ] #2 groma plan import <path> [--parent <id>] creates the elements as ghosts at the paths they will keep, the relationships as draft rows, and a draft record named after the plan that tags every imported element. Ids are kept. A colliding id or a missing parent fails the whole import with a message naming it, and nothing is written.
- [ ] #3 On the web map, a multi-selection of components offers Export as plan beside Group as and Combine into, and the bundle is written into the repository or downloaded.
- [ ] #4 After an import, a scan matches the ghosts when their code arrives and groma accept works unchanged. Existing draft behaviour and its tests stay as they are.
- [ ] #5 A round trip works: a plan exported from one fixture repository and imported into an empty one yields equal elements, relationships and overviews.
- [ ] #6 groma plan without arguments prints what a plan is and the two commands, and docs/ gets a page with an example plan.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
