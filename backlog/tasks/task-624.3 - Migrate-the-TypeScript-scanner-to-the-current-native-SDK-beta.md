---
id: TASK-624.3
title: Migrate the TypeScript scanner to the current native SDK beta
status: Done
assignee:
  - '@typescript-upgrade'
created_date: '2026-10-21T11:00:00Z'
updated_date: '2026-10-21T11:16:00Z'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the beta SDK declarations and compare changed API contracts. 2. Migrate source programs/config parsing/checker nullability without fallback behavior. 3. Align the typechecker with required Bun import attributes and run focused existing tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TypeScript 7.1 beta publishes the async/AST SDK as typescript/async and typescript/ast. Old unstable paths were resolving the root 7.0 experimental declarations, which caused the apparent missing APIs. Updating the import paths preserves the existing scanner logic. Root typechecker also uses the official 7.1 beta because Bun typed import attributes require TypeScript 7.1. Existing test coverage was sufficient; no implementation-mirroring tests added. Verified whole-repository beta tsc --noEmit, 32 focused scanner/outline tests (218 assertions), and a built TypeScript package scanning a fresh checkout without project dependencies or language tools (8 assertions). Primary release contract: https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/.

Scoped Biome invocation could not start because the optional @biomejs/cli-linux-x64 package is absent in the shared installation. Parent owns dependency relinking and full repository check; task remains In Progress until that required check proves lint and final integration. TypeScript logic and packaging checks already pass.

Final scoped lint passed after native Biome dependencies were restored: biome lint plugins/scanners/typescript/src checked 15 files with no fixes. Repository beta typecheck, 32 focused scanner/outline tests, package build, and fresh-checkout TypeScript package test all passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Migrated TypeScript scanner imports to the published TypeScript 7.1 beta SDK paths, preserving scanner behavior. Selected the 7.1 beta root typechecker for Bun typed asset imports and bumped the scanner package to 0.2.4; manifest and lock integration belongs to TASK-624. Validation passed: repository typecheck, scoped Biome lint, 32 focused scanner/outline tests (218 assertions), scanner package build, and fresh-checkout package test (8 assertions).
<!-- SECTION:FINAL_SUMMARY:END -->
