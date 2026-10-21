---
id: TASK-624.3
title: Migrate the TypeScript scanner to the current native SDK beta
status: Done
assignee:
  - '@typescript-upgrade'
created_date: '2026-10-21T11:00:00Z'
updated_date: '2026-10-21T17:53:00Z'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript
  - package.json
modified_files:
  - plugins/scanners/typescript/src/http-controllers.ts
  - plugins/scanners/typescript/src/http-endpoints.ts
  - plugins/scanners/typescript/src/native-checker.ts
  - plugins/scanners/typescript/src/projects.ts
  - plugins/scanners/typescript/src/source-analysis.ts
  - plugins/scanners/typescript/src/source-imports.ts
  - plugins/scanners/typescript/src/source-operations.ts
  - plugins/scanners/typescript/src/source-symbols.ts
  - plugins/scanners/typescript/src/source-usage.ts
  - package.json
  - plugins/scanners/typescript/package.json
  - plugins/scanners/typescript/src/structure.ts
parent_task_id: TASK-624
type: chore
ordinal: 693000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The security dependency refresh moves the existing TypeScript 7.1 nightly scanner SDK onto the current official beta. Its unstable program/config/checker APIs changed and must preserve the scanners current source ownership, HTTP evidence, and code outlines.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The TypeScript scanner compiles and preserves existing supported scan and outline behavior on the current 7.1 beta SDK
- [x] #2 Focused TypeScript scanner tests and repository typecheck pass with the selected typechecker version
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria have objective verification evidence.
- [x] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->
