---
id: TASK-612
title: Diagnose the Windows TypeScript configuration timeout
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 22:34'
updated_date: '2026-10-15 22:46'
labels: []
dependencies: []
references:
  - test-bun/nested-scanners.test.ts
  - plugins/scanners/typescript/src/source-analysis.ts
  - 'https://github.com/MrLesk/groma.md/actions/runs/38816211491'
modified_files:
  - plugins/scanners/typescript/src/source-analysis.ts
  - test-bun/nested-scanners.test.ts
  - .github/workflows/ci.yml
  - plugins/scanners/typescript/src/projects.ts
  - package.json
type: bug
ordinal: 681000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current-main scanner qualification failed on Windows in the existing no-input/missing-base/invalid-option TypeScript configuration scenario after exactly 20 seconds. Sibling platform runs pass. Determine the blocked phase and address a confirmed cause before accepting the Windows result; do not raise timeouts, weaken assertions or retry failures to obtain green.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A bounded Windows diagnostic preserves the existing scenario and deadline and records the phase reached when it stalls.
- [ ] #2 A delivered correction is tied to the reproduced failure; the unchanged configuration behavior and full Windows, Linux and macOS checks pass before release.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria have objective verification evidence.
- [ ] #2 Relevant checks pass and changes remain task-scoped.
- [ ] #3 Public contracts or documentation are updated when behavior changes.
- [ ] #4 Implementation Plan reflects the final approach; correction history and verification are recorded in Implementation Notes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
On a temporary diagnostic branch based on the failed MQL5 commit, add stage timestamps to the exact existing test and native compiler owner. Replace only that branch CI workflow with a Windows manual job that runs the whole file once and then stops on the first failing case in a bounded repetition. Keep every assertion and the 20-second limit. No diagnostic logs or workflow enter the release. Use the result to choose the smallest confirmed correction; no new fallback, retry, timeout or edge-case behavior is approved.

Both initial diagnostics pass the whole original file and 100 isolated cases, including the normal --parallel=2 file-isolation mode. Reproduce the remaining difference: the full repository suite and repeated cases in one file process. Keep all existing tests, register the same instrumented scenario 100 times with private fixtures, retain each 20-second deadline and add diagnostic-only stop-on-first-failure. Restore the exact failed CI workflow with only its Windows matrix and manual trigger. No production scheduling change is justified: the failed-job timestamps show C# tests and standalone compilation finished minutes before the timeout.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The diagnostic retains the repository runner mode too: --parallel=2 controls isolation between files and --max-concurrency 1 controls tests within each file. Repetitions stop at the first failure and preserve the 20-second limit; this is diagnostic sampling, not a retry policy or acceptance run.

The first diagnostic passed 100 cases plus the original file; maximum observed case time was 3681.79 ms. Run 38818239615 also passed in the repository file-isolation mode. Original Windows timings: repository checks 22:21:01-22:25:20 UTC; C# worker tests finished 22:21:33 and standalone compilation 22:21:04. These do not support blaming concurrent compilation for the timeout at 22:25:20.
<!-- SECTION:NOTES:END -->
