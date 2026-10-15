---
id: TASK-604
title: Build COBOL and Scala packages before scanner tests in CI
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:13'
updated_date: '2026-10-15 20:20'
labels: []
dependencies: []
references:
  - .github/workflows/ci.yml
  - test-bun/cobol-scanner.test.ts
  - test-bun/scala-scanner.test.ts
modified_files:
  - test-bun/cobol-scanner.test.ts
  - .github/workflows/ci.yml
  - test-bun/scala-scanner.test.ts
type: bug
ordinal: 654000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The cross-platform scanner PR checks reproduced COBOL timeouts on Windows and Scala timeouts on Windows and macOS. Both timed scenarios include downloading dependencies, compiling their parser workers and creating Java runtimes before testing scanner behavior. Build these required CI artifacts in separate steps and pass them to the unchanged scanner scenarios, following the existing Swift/C# package pattern.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CI builds COBOL and Scala packages before repository tests, and the existing scanner scenarios use those packages.
- [x] #2 The tests retain every scanner assertion and their current timeouts; local invocation still builds each package when none is supplied.
- [ ] #3 Both local test paths and the repository check pass; all three CI platforms must pass before release.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [x] #3 Public contracts or documentation are updated when behavior changes.
- [x] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add COBOL and Scala build steps to the existing CI matrix and pass GROMA_TEST_COBOL_PACKAGE and GROMA_TEST_SCALA_PACKAGE to repository checks. Existing test setup copies each artifact when supplied, otherwise keeps its present build path. No production scanner changes, cache framework, retries, timeout increases or new assertions. Existing language coverage already verifies parsing, selected inputs, physical positions, outlines and errors; run the packaged-artifact and local-build paths.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Additional current-head failures confirmed the same build-inside-timed-test problem for Scala in PR151 macOS and PR152 Windows. Extended this same CI responsibility to those reproduced failures. The prebuilt COBOL scenario passes locally in 5.8 seconds; its unchanged local-build path passes in 12.2 seconds with all 18 assertions.

Both existing local-build scenarios pass. Supplied-package checks pass all 18 COBOL assertions and 34 Scala assertions in 5.8 and 4.3 seconds respectively. The complete check using both prebuilt packages passes lint/typecheck, 16 Node tests and 780 Bun tests (51 optional skips, 0 failures, 2907 assertions); /tmp/groma-task604-final-check.log. Own specification and quality reviews confirm build steps remain required, tests use real bundled artifacts, all assertions/timeouts stay unchanged, and only CI/test setup is affected. Platform verification remains pending. No live groma files changed.
<!-- SECTION:NOTES:END -->
