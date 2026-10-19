---
id: TASK-611
title: Bundle the TypeScript worker from its pinned SDK
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 22:23'
updated_date: '2026-10-15 22:32'
labels: []
dependencies: []
references:
  - plugins/scanners/typescript/build.ts
  - test-bun/scanner-fresh-checkout.test.ts
  - 'https://github.com/MrLesk/groma.md/actions/runs/38815486977'
modified_files:
  - plugins/scanners/typescript/build.ts
  - .github/workflows/ci.yml
type: bug
ordinal: 680000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The build-only release workflow fails its existing TypeScript fresh-checkout test on Linux x64/arm64 and macOS. The builder resolves the worker from the scanner package, which finds the newer root compiler worker instead of the native dependency belonging to the pinned scanner SDK. The resulting API and worker speak different symbol protocols.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The packaged TypeScript scanner selects its native worker through the exact SDK package it bundles, including when the repository contains a different root TypeScript version.
- [x] #2 The existing relocated fresh-checkout scenario passes without project dependencies, language tools or network, preserving useful resolved calls, repeated evidence and source bytes.
- [x] #3 The full repository check passes and normal CI builds the TypeScript package and runs the existing fresh-checkout scenario without changing assertions, timeouts or project prerequisites; TASK-610 owns final platform and release-artifact qualification.
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
Resolve typescript/package.json from the scanner dependency, then createRequire from that SDK manifest to select its own @typescript/typescript-<platform> package. Reuse the same SDK directory for notices. Keep the existing bundle, worker files and protocol unchanged. The existing fresh-checkout test already detects this failure and checks resolved local calls, repeatability and immutable source; do not add a duplicate test. Record the failing before result, rebuild after the fix, run that exact scenario, full checks and the five-platform release workflow. This is package delivery ownership only: no OKF/C4 architecture or scanner inference change, no fallback or project-tool dependency.

The release failure also demonstrates a CI selection gap: regular CI packages the six new scanners but never packages TypeScript, so the installed SDK tests can pass while the artifact has a mismatched worker. Extend the existing package build and fresh-checkout regex to TypeScript, reusing the exact existing scenario and test options. This adds no duplicate test, runner option or scenario. Rename the two steps to describe their actual scanner scope.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The failing local package paired SDK 7.1.0-dev.20260924.1 with root worker 7.1.0-dev.20261011.1. The unchanged existing fresh-checkout scenario fails before correction (/tmp/groma-ts-worker-before.log). A controlled temporary package replacing only tsc and lib.d.ts with the SDK-owned versions passes all eight assertions (/tmp/groma-ts-worker-matched.log), confirming the cause without changing scanner inference. The builder now resolves the native dependency from the selected SDK manifest and reuses that SDK directory for its license files.

Final correction passes the unchanged relocated fresh-checkout scenario: one test, eight assertions, resolved calls, repeated identical observations and unchanged source bytes (/tmp/groma-ts-worker-after.log). Its before version fails at Symbol undefined / canonical project undefined. Full bun run check after the complete source and CI change passes lint/typecheck, 16 Node tests and 874 Bun tests, 62 optional skips, zero failures and 3558 assertions (/tmp/groma-release611-final-check.log). Normal CI now builds TypeScript beside the six new scanners and selects its existing packaged scenario. Bun 1.4.3 matches CI; official test-runner documentation confirms --test-name-pattern is a name regex (https://bun.sh/docs/test/discovery). No new runner option, assertion, timeout, concurrency change or retry is introduced. Own specification review confirms the compiler manifest owns both its worker dependency and notices. Own quality review traces scanner dependency -> exact SDK -> SDK-owned native package -> copied tsc/lib.d.ts -> existing bundle lookup. One existing owner handles the flow; no abstraction, protocol adaptation, fallback or project-tool dependency was added. Workflow YAML and git diff --check pass; groma/ is unchanged. Final platform CI and five-target artifact qualification are recorded by TASK-610 before release.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Resolve the packaged TypeScript worker from the pinned SDK instead of the repository root, preventing mixed compiler protocols when multiple TypeScript versions are installed. Regular platform CI now runs the existing packaged TypeScript fresh-checkout scenario. The regression fails before the fix and passes afterward; the complete repository check passes. TASK-610 owns final platform/artifact qualification and publication.
<!-- SECTION:FINAL_SUMMARY:END -->
