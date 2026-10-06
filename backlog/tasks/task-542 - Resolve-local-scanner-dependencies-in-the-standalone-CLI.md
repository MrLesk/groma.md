---
id: TASK-542
title: Resolve local scanner dependencies in the standalone CLI
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 05:48'
updated_date: '2026-10-05 06:00'
labels: []
dependencies: []
modified_files:
  - test-bun/compiled-scanner.test.ts
  - scripts/build.ts
priority: high
type: bug
ordinal: 627000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Devoxx rehearsal with released Groma 0.6.2 shows local TypeScript and native scanner adapters as blocked even though their dependencies exist. The standalone build disables package.json loading, so runtime scanner imports cannot resolve package exports or main entries. The same scanner imports pass under Bun, and a minimal compiled probe passes only with package.json loading enabled.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The standalone CLI loads a local scanner whose installed dependency is exposed through package.json exports and completes a scan.
- [x] #2 The Groma repository map opens without dependency-resolution failures from its configured local scanners.
- [x] #3 Published-scanner startup and the repository check still pass.
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
1. Enable package.json loading in the standalone build while preserving the other configuration choices. 2. Add a compiled-CLI regression covering the reproduced local dependency failure: current tests run scanner imports under Bun or use bundled published adapters, so they miss runtime exports resolution. Build through scripts/build.ts, install a tiny local fixture dependency with a non-default exports entry, and assert its scan creates the expected component. 3. Verify the regression against the previous release and rebuilt executable, run bun run check, and rehearse the supported demo flow. 4. Perform implementer specification and quality reviews; this is a bounded build fix with no new architecture model.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The new compiled-CLI regression failed before the build change: the scan produced no component for probe.local. A minimal executable isolated the cause to autoloadPackageJson=false; the same imports pass when it is enabled.

Verification: the regression failed before the fix and passes after it through the real standalone build. bun run check passed (16 Node tests, 759 Bun tests, 48 optional skips). The candidate opened the Groma source-copy map with 110 components and no blocked scanners. The published 0.2.1 scanners opened the repaired curated Keycloak map (57 components, 39 relationships, three valid flows) and a fresh Keycloak map (7400 elements, 169 relationships) in 22.884 seconds with cached packages. Official Bun executable documentation confirms package.json loading is opt-in. Other runtime configuration autoload settings remain disabled. Specification review: all criteria and Definition of Done items have evidence. Quality review: build configuration owns the fix; the test compiles the actual build, uses a private fixture and proves a scanned component appears. No architecture model or public contract change; scripts and tests are excluded from source scanning, and git status --short groma/ is clean. No blocking findings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Enable package.json loading in standalone builds so local scanner imports resolve installed dependencies through exports/main. Add a compiled-CLI regression that fails before the fix. Full repository checks and both local-scanner and published-scanner demo rehearsals pass.
<!-- SECTION:FINAL_SUMMARY:END -->
